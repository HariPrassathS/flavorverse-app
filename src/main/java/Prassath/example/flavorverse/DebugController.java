package Prassath.example.flavorverse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Debug controller for development/testing purposes
 * Provides utilities to see what users exist in the database
 */
@RestController
@RequestMapping("/api/debug")
public class DebugController {

    @Autowired
    private UserRepository userRepository;

    /**
     * Get all usernames and roles (for testing purposes)
     * NOTE: This should be removed in production!
     */
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        try {
            List<User> users = userRepository.findAll();
            
            // Create safe user info without passwords
            List<UserDebugInfo> userDebugInfos = users.stream()
                .map(user -> new UserDebugInfo(
                    user.getId(),
                    user.getUsername(),
                    user.getRole(),
                    user.getFullName()
                ))
                .collect(Collectors.toList());
                
            return ResponseEntity.ok(userDebugInfos);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching users: " + e.getMessage());
        }
    }

    /**
     * Reset password for a user (for testing purposes)
     * NOTE: This should be removed in production!
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody PasswordResetRequest request) {
        try {
            User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found: " + request.getUsername()));
            
            // Set new password
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
            userRepository.save(user);
            
            return ResponseEntity.ok("Password reset successfully for user: " + request.getUsername());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error resetting password: " + e.getMessage());
        }
    }

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    /**
     * Create a quick test user with known password
     */
    @PostMapping("/create-test-user")
    public ResponseEntity<?> createTestUser(@RequestBody TestUserRequest request) {
        try {
            // Check if user already exists
            if (userRepository.findByUsername(request.getUsername()).isPresent()) {
                return ResponseEntity.badRequest().body("Username already exists: " + request.getUsername());
            }

            User user = new User();
            user.setUsername(request.getUsername());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setRole(request.getRole() != null ? request.getRole() : "ROLE_CUSTOMER");
            user.setFullName(request.getFullName() != null ? request.getFullName() : "Test User");
            user.setAddress("Test Address");
            user.setPhoneNo("1234567890");

            User savedUser = userRepository.save(user);
            
            return ResponseEntity.ok(new UserDebugInfo(
                savedUser.getId(),
                savedUser.getUsername(),
                savedUser.getRole(),
                savedUser.getFullName()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating test user: " + e.getMessage());
        }
    }
}

// DTOs for debug operations
class UserDebugInfo {
    private Long id;
    private String username;
    private String role;
    private String fullName;

    public UserDebugInfo(Long id, String username, String role, String fullName) {
        this.id = id;
        this.username = username;
        this.role = role;
        this.fullName = fullName;
    }

    // Getters
    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getRole() { return role; }
    public String getFullName() { return fullName; }
}

class PasswordResetRequest {
    private String username;
    private String newPassword;

    // Getters and Setters
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    
    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
}

class TestUserRequest {
    private String username;
    private String password;
    private String role;
    private String fullName;

    // Getters and Setters
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
}