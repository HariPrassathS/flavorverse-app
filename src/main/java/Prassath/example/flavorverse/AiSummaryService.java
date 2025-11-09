package Prassath.example.flavorverse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus; 
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException; 
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry; 

import java.time.Duration; 
import java.util.Arrays; 
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AiSummaryService {

    private final WebClient webClient;
    private final String geminiApiKey;

    private static final String GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";
    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/" + GEMINI_MODEL + ":generateContent";

    private static final int MIN_REVIEWS_FOR_SUMMARY = 2;

    public AiSummaryService(WebClient.Builder webClientBuilder,
                            @Value("${gemini.api.key}") String geminiApiKey) {
        this.webClient = webClientBuilder.baseUrl(GEMINI_API_URL).build();
        this.geminiApiKey = geminiApiKey;
    }

    // === 1. AI SUMMARY (FIXED & FAST) ===
    public Mono<String> getReviewSummary(List<Review> reviews) {
        
        if (reviews == null || reviews.size() < MIN_REVIEWS_FOR_SUMMARY) {
            return Mono.error(new Exception("Not enough reviews (" + reviews.size() + ")"));
        }

        String allComments = reviews.stream()
                                    .map(Review::getComment)
                                    .collect(Collectors.joining(". "));

        String prompt = "You are a helpful food critic. Read all the following customer comments for a restaurant: ["
                        + allComments 
                        + "]. Based *only* on these comments, provide a one-paragraph, easy-to-read summary for new customers. Do not make up information. Be neutral.";

        String requestBody = "{\"contents\":[{\"parts\":[{\"text\": \"" + escapeForJson(prompt) + "\"}]}]}"; // ESCAPE FIX

        return this.webClient.post()
            .uri(uriBuilder -> uriBuilder.queryParam("key", this.geminiApiKey).build())
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(requestBody)
            .retrieve()
            .onStatus(status -> status.value() == 429, clientResponse -> 
                Mono.error(new WebClientResponseException(
                    clientResponse.statusCode().value(), 
                    "Rate Limit Exceeded (429)", 
                    clientResponse.headers().asHttpHeaders(), 
                    null, null
                ))
            )
            .bodyToMono(GeminiResponse.class) // JSON ah DTO ku maathurom
            
            // === RETRY LOGIC ===
            .retryWhen(Retry.fixedDelay(3, Duration.ofSeconds(5))
                .filter(throwable -> throwable instanceof WebClientResponseException && 
                                      ((WebClientResponseException) throwable).getStatusCode() == HttpStatus.TOO_MANY_REQUESTS)
            )
            // ===================
            
            .map(this::extractTextFromResponse) // Clean-ana text ah edukkurom
            
            .onErrorResume(e -> {
                System.err.println("Gemini Summary Error: " + e.getMessage());
                return Mono.just("AI summary could not be generated at this time.");
            });
    }

    // === 2. PUTHU AI MENU TAGGER ===
    public Mono<Map<Long, String>> getMenuTags(List<Review> reviews, List<MenuItem> menuItems) {
        
        if (reviews.isEmpty() || menuItems.isEmpty()) {
            return Mono.just(Map.of()); // Empty map anuppidalam
        }

        String allComments = reviews.stream()
                                    .map(Review::getComment)
                                    .collect(Collectors.joining(". "));
        
        String menuList = menuItems.stream()
                                   .map(item -> "ID " + item.getId() + ": " + item.getName())
                                   .collect(Collectors.joining(", "));

        String prompt = String.format(
            "Read the following MENU ITEMS and customer COMMENTS." +
            "MENU ITEMS (with ID): [%s]. " +
            "COMMENTS: [%s]. ".replace("\"", "'") +
            "Your task is to analyze which menu items are mentioned positively or negatively in the comments. " +
            "Respond *only* with a JSON object. " +
            "The JSON key must be the item ID as a string, and the value must be a short tag (2 words max) like 'Must Try!', 'Very Spicy', 'Delicious', 'Avoid', or 'Popular'. " +
            "Only include items that are clearly mentioned. Example response: {\"101\": \"Must Try!\", \"105\": \"Too Spicy\"}",
            menuList, allComments
        );
        
        // ESCAPE FIX (prompt ku)
        String escapedPrompt = escapeForJson(prompt); 

        String requestBody = String.format(
            "{\"contents\":[{\"parts\":[{\"text\": \"%s\"}]}], \"generationConfig\": {\"responseMimeType\": \"application/json\"}}",
            escapedPrompt 
        );

        return this.webClient.post()
            .uri(uriBuilder -> uriBuilder.queryParam("key", this.geminiApiKey).build())
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(requestBody)
            .retrieve()
            .onStatus(status -> status.value() == 429, clientResponse -> 
                Mono.error(new WebClientResponseException(
                    clientResponse.statusCode().value(), 
                    "Rate Limit Exceeded (429)", 
                    clientResponse.headers().asHttpHeaders(), 
                    null, null
                ))
            )
            .bodyToMono(GeminiResponse.class) // Response ah namma DTO class ah veche parse pannurom
            
            // === RETRY LOGIC ===
            .retryWhen(Retry.fixedDelay(3, Duration.ofSeconds(5))
                .filter(throwable -> throwable instanceof WebClientResponseException && 
                                      ((WebClientResponseException) throwable).getStatusCode() == HttpStatus.TOO_MANY_REQUESTS)
            )
            // ===================
            
            .map(geminiResponse -> {
                try {
                    // Andha DTO la irundhu, namma "text" part ah (ulla irukura JSON string) ah edukkurom
                    String innerJsonString = geminiResponse.getCandidates().get(0)
                                                           .getContent().getParts().get(0)
                                                           .getText();
                    
                    // Ippo, andha "ulla" irukura JSON string ah namma pazhaya function kitta anuppurom
                    return parseSimpleJsonToMap(innerJsonString);
                } catch (Exception e) {
                    System.err.println("Error parsing AI Tag JSON (Inner): " + e.getMessage());
                    return Map.<Long, String>of();
                }
            })
            .onErrorResume(e -> {
                System.err.println("Gemini Tag Error: " + e.getMessage());
                return Mono.just(Map.of()); // Error aana empty map
            });
    }

    // === PUTHU HELPER FUNCTION (IDHU ROMBA MUKKIYAM) ===
    private String escapeForJson(String input) {
        if (input == null) return "";
        return input.replace("\\", "\\\\") // Backslash-a escape pannu
                    .replace("\"", "\\\"") // Double quote-a escape pannu
                    .replace("\n", "\\n")  // Newline-a escape pannu
                    .replace("\r", "\\r");  // Carriage return-a escape pannu
    }

    // AI anuppura simple JSON ah parse panna oru helper function
    private Map<Long, String> parseSimpleJsonToMap(String json) {
        String cleanedJson = json.trim().replace("{", "").replace("}", "").replace("\"", "");
        
        if (cleanedJson.isEmpty()) {
            return Map.of();
        }

        // 'split' pannadhum varra array (String[]) ah, 'Arrays.stream()' kulla pottu stream panrom
        return Arrays.stream(cleanedJson.split(","))
            .map(entry -> entry.split(":"))
            .filter(parts -> parts.length == 2)
            .collect(Collectors.toMap(
                parts -> Long.parseLong(parts[0].trim()), // "101" -> 101L
                parts -> parts[1].trim() // "Must Try!" -> "Must Try!"
            ));
    }
    
    // Idhu "stuck" aagura problem ah 100% fix pannum
    private String extractTextFromResponse(GeminiResponse response) {
        try {
            return response.getCandidates().get(0)
                           .getContent().getParts().get(0)
                           .getText()
                           .replace("\\n", " ")
                           .replace("\\\"", "\"");
        } catch (Exception e) {
            throw new RuntimeException("Could not parse text from Gemini response: " + e.getMessage(), e);
        }
    }
}
// DTO Classes appadiye irukkum, indha file-la illana
// unga AiChatService.java file-la irukura DTO-s ah use pannikkum.