package Prassath.example.flavorverse;

/**
 * DTO for profile update requests
 * Used when user wants to update their profile information
 */
public class ProfileUpdateRequest {
    private String fullName;
    private String address;
    private String phoneNo;
    private String currentPassword; // For password verification
    private String newPassword;     // Optional: if user wants to change password

    // === Constructors ===
    public ProfileUpdateRequest() {}

    // === Getters and Setters ===
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    
    public String getPhoneNo() { return phoneNo; }
    public void setPhoneNo(String phoneNo) { this.phoneNo = phoneNo; }
    
    public String getCurrentPassword() { return currentPassword; }
    public void setCurrentPassword(String currentPassword) { this.currentPassword = currentPassword; }
    
    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
}