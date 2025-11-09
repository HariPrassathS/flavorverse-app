package Prassath.example.flavorverse;

/**
 * DTO for user profile information
 * Used for returning user data to frontend without sensitive info like password
 */
public class UserProfileDto {
    private Long id;
    private String username;
    private String role;
    private String fullName;
    private String address;
    private String phoneNo;

    // === Constructors ===
    public UserProfileDto() {}

    public UserProfileDto(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.role = user.getRole();
        this.fullName = user.getFullName();
        this.address = user.getAddress();
        this.phoneNo = user.getPhoneNo();
    }

    // === Getters and Setters ===
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    
    public String getPhoneNo() { return phoneNo; }
    public void setPhoneNo(String phoneNo) { this.phoneNo = phoneNo; }
}