package Prassath.example.flavorverse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors; // <-- Intha import irukka-nu paarunga

@RestController
@RequestMapping("/api/delivery")
public class DeliveryController {

    @Autowired
    private DeliveryPartnerRepository deliveryPartnerRepository;

    @Autowired 
    private OrderRepository orderRepository; 

    // --- Matha methods ellam appadiye irukatum ---
    @PutMapping("/update-location/{partnerId}")
    public ResponseEntity<?> updateLocation(@PathVariable Long partnerId, @RequestBody LocationData locationData) {
        // ... (No changes here) ...
         Optional<DeliveryPartner> optionalPartner = deliveryPartnerRepository.findById(partnerId);
        if (optionalPartner.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        DeliveryPartner partner = optionalPartner.get();
        partner.setCurrentLatitude(locationData.getLatitude());
        partner.setCurrentLongitude(locationData.getLongitude());
        partner.setAvailable(true);
        deliveryPartnerRepository.save(partner);
        return ResponseEntity.ok().build();
    }

    // --- ITHU THAAN UPDATE PANNA METHOD ---
    @GetMapping("/available")
    public ResponseEntity<List<DeliveryPartnerDto>> getAvailablePartners() {
        List<DeliveryPartner> availablePartners = deliveryPartnerRepository.findByAvailable(true);
        
        // Namma DTO-va maathi anupurom
        List<DeliveryPartnerDto> partnerDtos = availablePartners.stream().map(partner -> {
            DeliveryPartnerDto dto = new DeliveryPartnerDto();
            dto.setId(partner.getId());
            // Partner-oda user iruntha mattum name-a set pannurom
            if (partner.getUser() != null) {
                dto.setFullName(partner.getUser().getFullName());
                dto.setUsername(partner.getUser().getUsername()); // Username-um serthukalam
            } else {
                dto.setFullName("Partner #" + partner.getId()); // User illana ID kaatu
                 dto.setUsername("partner_" + partner.getId());
            }
            return dto;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(partnerDtos);
    }
    // --- UPDATE MUDINJUTHU ---

    // Removed old getMyAssignedOrders - replaced with getMyOrders below

    @PutMapping("/pickup/{orderId}")
    public ResponseEntity<Order> pickupOrder(@PathVariable Long orderId) {
        // ... (No changes here) ...
         Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setStatus("PICKED UP");
        Order updatedOrder = orderRepository.save(order);
        return ResponseEntity.ok(updatedOrder);
    }
    
    @PutMapping("/delivered/{orderId}")
    public ResponseEntity<Order> deliveredOrder(@PathVariable Long orderId) {
        // ... (No changes here) ...
         Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setStatus("DELIVERED");
        DeliveryPartner partner = order.getDeliveryPartner();
        if(partner != null) {
            partner.setAvailable(true);
            deliveryPartnerRepository.save(partner);
        }
        Order updatedOrder = orderRepository.save(order);
        return ResponseEntity.ok(updatedOrder);
    }
    
    @GetMapping("/me/{userId}")
    public ResponseEntity<DeliveryPartner> getMyPartnerProfile(@PathVariable Long userId) {
       // ... (No changes here) ...
        DeliveryPartner partner = deliveryPartnerRepository.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("Delivery Partner profile not found for user ID: " + userId));
        return ResponseEntity.ok(partner);
    }
    
    // NEW: Get available orders needing delivery assignment
    @GetMapping("/available-orders")
    public ResponseEntity<List<Order>> getAvailableOrders() {
        // Find orders that are ready but don't have a delivery partner yet
        List<Order> availableOrders = orderRepository.findByStatusAndDeliveryPartnerIsNull("PREPARING");
        if (availableOrders.isEmpty()) {
            // Also check for "CONFIRMED" orders
            availableOrders = orderRepository.findByStatusAndDeliveryPartnerIsNull("CONFIRMED");
        }
        return ResponseEntity.ok(availableOrders);
    }
    
    // NEW: Get delivery partner's assigned orders  
    @GetMapping("/my-orders/{partnerId}")
    public ResponseEntity<List<Order>> getMyOrders(@PathVariable Long partnerId) {
        List<Order> myOrders = orderRepository.findByDeliveryPartnerId(partnerId);
        return ResponseEntity.ok(myOrders);
    }
    
    // NEW: Accept an order
    @PostMapping("/accept-order/{orderId}")
    public ResponseEntity<Order> acceptOrder(@PathVariable Long orderId, @RequestBody AcceptOrderRequest request) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found"));
            
        DeliveryPartner partner = deliveryPartnerRepository.findById(request.getDeliveryPartnerId())
            .orElseThrow(() -> new RuntimeException("Delivery Partner not found"));
            
        order.setDeliveryPartner(partner);
        order.setStatus("CONFIRMED");
        partner.setAvailable(false);
        deliveryPartnerRepository.save(partner);
        Order updatedOrder = orderRepository.save(order);
        return ResponseEntity.ok(updatedOrder);
    }
    
    // NEW: Start delivery
    @PostMapping("/start-delivery/{orderId}")
    public ResponseEntity<Order> startDelivery(@PathVariable Long orderId) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setStatus("OUT_FOR_DELIVERY");
        Order updatedOrder = orderRepository.save(order);
        return ResponseEntity.ok(updatedOrder);
    }
    
    // NEW: Complete delivery
    @PostMapping("/complete-delivery/{orderId}")
    public ResponseEntity<Order> completeDelivery(@PathVariable Long orderId) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setStatus("DELIVERED");
        
        // Make partner available again
        if (order.getDeliveryPartner() != null) {
            DeliveryPartner partner = order.getDeliveryPartner();
            partner.setAvailable(true);
            deliveryPartnerRepository.save(partner);
        }
        
        Order updatedOrder = orderRepository.save(order);
        return ResponseEntity.ok(updatedOrder);
    }
}

// --- PUTHUSA INTHA DTO CLASS-A ADD PANNUNGA ---
// (LocationData kela itha add pannikonga)
class DeliveryPartnerDto {
    private Long id;
    private String fullName;
    private String username; // Optional

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
}

// Matha DTOs appadiye irukatum
class DeliveryOrderDto { /* ... */ 
    private Long orderId;
    private String orderStatus;
    private String restaurantName;
    private String restaurantAddress;
    private String customerName;
    private String customerAddress;
    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public String getOrderStatus() { return orderStatus; }
    public void setOrderStatus(String orderStatus) { this.orderStatus = orderStatus; }
    public String getRestaurantName() { return restaurantName; }
    public void setRestaurantName(String restaurantName) { this.restaurantName = restaurantName; }
    public String getRestaurantAddress() { return restaurantAddress; }
    public void setRestaurantAddress(String restaurantAddress) { this.restaurantAddress = restaurantAddress; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getCustomerAddress() { return customerAddress; }
    public void setCustomerAddress(String customerAddress) { this.customerAddress = customerAddress; }
}

class AcceptOrderRequest {
    private Long deliveryPartnerId;
    
    public Long getDeliveryPartnerId() { return deliveryPartnerId; }
    public void setDeliveryPartnerId(Long deliveryPartnerId) { this.deliveryPartnerId = deliveryPartnerId; }
}

class LocationData { /* ... */ 
    private double latitude;
    private double longitude;
    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }
    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }
}