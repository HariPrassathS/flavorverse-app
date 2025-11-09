package Prassath.example.flavorverse;

/**
 * Request DTO for secure delivery partner registration
 */
public class DeliveryRegistrationRequest {
    private String username;
    private String password;
    private String fullName;
    private String phoneNo;
    private String address;
    private String licenseNumber;
    private String vehicleType; // bike, car, etc.
    private String emergencyContact;

    // === Constructors ===
    public DeliveryRegistrationRequest() {}

    // === Getters and Setters ===
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    
    public String getPhoneNo() { return phoneNo; }
    public void setPhoneNo(String phoneNo) { this.phoneNo = phoneNo; }
    
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    
    public String getLicenseNumber() { return licenseNumber; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }
    
    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }
    
    public String getEmergencyContact() { return emergencyContact; }
    public void setEmergencyContact(String emergencyContact) { this.emergencyContact = emergencyContact; }
}