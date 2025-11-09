package Prassath.example.flavorverse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

// Chat kaga DTO (Request)
class ChatRequest {
    private String prompt;
    private Long restaurantId; // <-- IDHU PUTHU FIELD

    // Getters and Setters
    public String getPrompt() { return prompt; }
    public void setPrompt(String prompt) { this.prompt = prompt; }
    public Long getRestaurantId() { return restaurantId; }
    public void setRestaurantId(Long restaurantId) { this.restaurantId = restaurantId; }
}

@RestController
@RequestMapping("/api/ai")
public class AiChatController {

    @Autowired
    private AiChatService aiChatService;

    @PostMapping("/chat")
    public Mono<String> handleChat(@RequestBody ChatRequest chatRequest) {
        // Ippo namma prompt koodave restaurantId ah yum anuppurom
        return aiChatService.getChatResponse(
            chatRequest.getPrompt(), 
            chatRequest.getRestaurantId()
        );
    }
}

