package Prassath.example.flavorverse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;

// DTO classes (Idha ingaye vechikkalam, illana thani file la podalam)
class GeminiResponse {
    private List<Candidate> candidates;
    public List<Candidate> getCandidates() { return candidates; }
    public void setCandidates(List<Candidate> candidates) { this.candidates = candidates; }
}
class Candidate {
    private Content content;
    public Content getContent() { return content; }
    public void setContent(Content content) { this.content = content; }
}
class Content {
    private List<Part> parts;
    public List<Part> getParts() { return parts; }
    public void setParts(List<Part> parts) { this.parts = parts; }
}
class Part {
    private String text;
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
}


@Service
public class AiChatService {

    private final WebClient webClient;
    private final String geminiApiKey;

    // === PUTHUSA MENU REPO-VA INJECT PANROM ===
    @Autowired
    private MenuItemRepository menuItemRepository;

    private static final String GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";
    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/" + GEMINI_MODEL + ":generateContent";

    private static final String BASE_SYSTEM_INSTRUCTION = 
        "You are 'FlavorBot', a friendly and helpful AI assistant for an app called 'FlavorVerse'. " +
        "Your primary role is to help users with food, menu items, and restaurant orders. " +
        "You are also a general-purpose assistant and can answer other questions on topics like history, science, etc. " +
        "Be polite, concise, and helpful. Always provide a friendly response.";

    public AiChatService(WebClient.Builder webClientBuilder,
                         @Value("${gemini.api.key}") String geminiApiKey) {
        this.webClient = webClientBuilder.baseUrl(GEMINI_API_URL).build();
        this.geminiApiKey = geminiApiKey;
    }

    // === METHOD AH UPDATE PANROM (restaurantId ah vaanga) ===
    public Mono<String> getChatResponse(String userPrompt, Long restaurantId) {

        // 1. Dynamic-ah instruction ah build panrom
        String dynamicInstruction = BASE_SYSTEM_INSTRUCTION;

        if (restaurantId != null) {
            // Database la irundhu live menu va eduthu, AI instruction la serkkarom
            try {
                List<MenuItem> menuItems = menuItemRepository.findByRestaurantId(restaurantId);
                if (menuItems != null && !menuItems.isEmpty()) {
                    String menuContext = menuItems.stream()
                        .map(item -> String.format("%s (Price: %.2f, Description: %s)", 
                                    item.getName(), item.getPrice(), item.getDescription()))
                        .collect(Collectors.joining(", "));
                    
                    dynamicInstruction += " SPECIAL CONTEXT: The user is currently viewing a specific restaurant. " + 
                                          "Here is their menu: [" + menuContext + "]. " +
                                          "Use this menu data to answer questions about price or ingredients for *this* restaurant accurately. " +
                                          "If asked about a food item *not* on this list, you can give a general description.";
                }
            } catch (Exception e) {
                // DB error aanaalum, normal ah continue pannu
                System.err.println("Error fetching menu context for chatbot: " + e.getMessage());
            }
        }

        // 2. Namma instruction + user kelvi, rendayum serthu request ah ready panrom
        String requestBody = String.format(
            "{" +
            "  \"contents\": [" +
            "    {\"parts\":[{\"text\": \"%s\"}]}" + // User prompt
            "  ]," +
            "  \"systemInstruction\": {" +
            "    \"parts\": [{\"text\": \"%s\"}]" + // Namma puthu DYNAMIC instruction
            "  }" +
            "}",
            // === IDHU THAAN PUTHU ESCAPE FIX ===
            escapeForJson(userPrompt), 
            escapeForJson(dynamicInstruction)
            // ===================================
        );

        // 3. API Call panrom
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
            .bodyToMono(GeminiResponse.class) 
            .map(this::extractTextFromResponse)
            
            // === RETRY LOGIC ===
            .retryWhen(Retry.fixedDelay(3, Duration.ofSeconds(5))
                .filter(throwable -> throwable instanceof WebClientResponseException && 
                                      ((WebClientResponseException) throwable).getStatusCode() == HttpStatus.TOO_MANY_REQUESTS)
                .onRetryExhaustedThrow((retryBackoffSpec, retrySignal) -> {
                    System.err.println("Gemini Chat Retry exhausted. Final error: " + retrySignal.failure().getMessage());
                    throw new RuntimeException("Final API call failed after retries.");
                })
            )
            // ===================
            
            .onErrorResume(e -> {
                System.err.println("Gemini Chat Error: " + e.getMessage());
                return Mono.just("Sorry, I'm having a little trouble connecting. Please try again in a moment.");
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