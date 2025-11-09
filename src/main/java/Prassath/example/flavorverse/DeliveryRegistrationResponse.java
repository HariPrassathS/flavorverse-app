package Prassath.example.flavorverse;

/**
 * Response DTO for delivery partner registration
 */
public class DeliveryRegistrationResponse {
    private Long id;
    private String username;
    private String fullName;
    private String message;
    private String status;

    // === Constructors ===
    public DeliveryRegistrationResponse() {}

    public DeliveryRegistrationResponse(Long id, String username, String fullName, String message) {
        this.id = id;
        this.username = username;
        this.fullName = fullName;
        this.message = message;
        this.status = "success";
    }

    // === Getters and Setters ===
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}