package Prassath.example.flavorverse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;
    
    // --- PUTHUSA ITHA ADD PANNUNGA ---
    @Autowired
    private DeliveryPartnerRepository deliveryPartnerRepository;

    /**
     * Customer registration-kaga
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Username is already taken!");
        }
        
        // Customer account create pannurom
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole("ROLE_CUSTOMER"); // Default role
        User savedUser = userRepository.save(user);
        
        savedUser.setPassword(null); // Response-la password anupa vendam
        return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
    }

    /**
     * Customer and Admin login-kaga
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        Optional<User> userOptional = userRepository.findByUsername(loginRequest.getUsername());

        if (userOptional.isPresent()) {
            User user = userOptional.get();
            
            // Validate password for ALL users (no special cases for security)
            if (passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
                user.setPassword(null); // Ensure password is not sent to frontend
                return ResponseEntity.ok(user);
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid username or password");
            }
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid username or password");
        }
    }
    
    // --- ITHU THAAN PUTHU METHOD ---
    
    /**
     * Admin-nala oru puthu delivery partner account-a create panna
     */
    @PostMapping("/admin/create-partner")
    public ResponseEntity<?> createDeliveryPartner(@RequestBody User user) {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Username is already taken!");
        }

        // 1. User account-a create pannurom
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole("ROLE_DELIVERY_PARTNER"); // Puthu role
        User savedUser = userRepository.save(user);

        // 2. Athu koodave, delivery_partners table-layum oru entry podurom
        DeliveryPartner partner = new DeliveryPartner();
        partner.setUser(savedUser);
        partner.setAvailable(false); // Initial-a avanga offline-la irupanga
        partner.setCurrentLatitude(0);
        partner.setCurrentLongitude(0);
        deliveryPartnerRepository.save(partner);

        savedUser.setPassword(null); // Password-a response-la anupa vendam
        return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
    }

    /**
     * Secure delivery partner registration with validation
     */
    @PostMapping("/delivery/register")
    public ResponseEntity<?> registerDeliveryPartner(@RequestBody DeliveryRegistrationRequest request) {
        // Validate input
        if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Username is required");
        }
        
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Password must be at least 6 characters long");
        }
        
        if (request.getFullName() == null || request.getFullName().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Full name is required");
        }
        
        if (request.getPhoneNo() == null || request.getPhoneNo().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Phone number is required");
        }
        
        if (request.getLicenseNumber() == null || request.getLicenseNumber().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Driving license number is required");
        }

        // Check if username already exists
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Username is already taken!");
        }

        // Create user account
        User user = new User();
        user.setUsername(request.getUsername().trim());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("ROLE_DELIVERY_PARTNER");
        user.setFullName(request.getFullName().trim());
        user.setAddress(request.getAddress() != null ? request.getAddress().trim() : "Not provided");
        user.setPhoneNo(request.getPhoneNo().trim());
        
        User savedUser = userRepository.save(user);

        // Create delivery partner profile
        DeliveryPartner partner = new DeliveryPartner();
        partner.setUser(savedUser);
        partner.setAvailable(false); // Initially offline
        partner.setCurrentLatitude(0);
        partner.setCurrentLongitude(0);
        // Store additional delivery partner info (you may want to extend DeliveryPartner entity)
        deliveryPartnerRepository.save(partner);

        savedUser.setPassword(null); // Don't send password in response
        return ResponseEntity.status(HttpStatus.CREATED).body(new DeliveryRegistrationResponse(
            savedUser.getId(),
            savedUser.getUsername(),
            savedUser.getFullName(),
            "Delivery partner registration successful! You can now login with your credentials."
        ));
    }

    /**
     * Get user profile by ID
     * Available for all authenticated users to view their own profile
     */
    @GetMapping("/profile/{userId}")
    public ResponseEntity<?> getUserProfile(@PathVariable Long userId) {
        Optional<User> userOptional = userRepository.findById(userId);
        
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            UserProfileDto profileDto = new UserProfileDto(user);
            return ResponseEntity.ok(profileDto);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }
    }

    /**
     * Update user profile
     * Users can update their own profile information
     */
    @PutMapping("/profile/{userId}")
    public ResponseEntity<?> updateUserProfile(@PathVariable Long userId, @RequestBody ProfileUpdateRequest updateRequest) {
        Optional<User> userOptional = userRepository.findById(userId);
        
        if (!userOptional.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }

        User user = userOptional.get();

        // Update basic profile information
        if (updateRequest.getFullName() != null && !updateRequest.getFullName().trim().isEmpty()) {
            user.setFullName(updateRequest.getFullName().trim());
        }
        
        if (updateRequest.getAddress() != null && !updateRequest.getAddress().trim().isEmpty()) {
            user.setAddress(updateRequest.getAddress().trim());
        }
        
        if (updateRequest.getPhoneNo() != null && !updateRequest.getPhoneNo().trim().isEmpty()) {
            user.setPhoneNo(updateRequest.getPhoneNo().trim());
        }

        // Handle password change if requested
        if (updateRequest.getNewPassword() != null && !updateRequest.getNewPassword().trim().isEmpty()) {
            // Verify current password first (except for delivery partners)
            if (!user.getRole().equals("ROLE_DELIVERY_PARTNER")) {
                if (updateRequest.getCurrentPassword() == null) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Current password is required to change password");
                }
                
                if (!passwordEncoder.matches(updateRequest.getCurrentPassword(), user.getPassword())) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Current password is incorrect");
                }
            }
            
            // Set new password
            user.setPassword(passwordEncoder.encode(updateRequest.getNewPassword()));
        }

        // Save updated user
        User updatedUser = userRepository.save(user);
        UserProfileDto profileDto = new UserProfileDto(updatedUser);
        
        return ResponseEntity.ok(profileDto);
    }
}