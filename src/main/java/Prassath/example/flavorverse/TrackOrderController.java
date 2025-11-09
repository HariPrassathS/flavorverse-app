package Prassath.example.flavorverse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/track")
public class TrackOrderController {

    @Autowired
    private OrderRepository orderRepository;

    @GetMapping("/{orderId}")
    public ResponseEntity<TrackingResponse> trackOrder(@PathVariable Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        TrackingResponse response = new TrackingResponse();
        response.setOrderId(order.getId());
        response.setOrderStatus(order.getStatus()); 

        // --- PUTHU LOGIC INGEY ---
        // Restaurant location-a set pannu
        if (order.getRestaurant() != null) {
            response.setRestaurantLatitude(order.getRestaurant().getLatitude());
            response.setRestaurantLongitude(order.getRestaurant().getLongitude());
        }
        // --- LOGIC MUDINJUTHU ---

        // Delivery partner iruntha, avanga name-a set pannu
        if (order.getDeliveryPartner() != null) {
            DeliveryPartner partner = order.getDeliveryPartner();
            // User null-a illanu check panrathu nallathu
            if(partner.getUser() != null) {
                 response.setPartnerName(partner.getUser().getFullName());
            }
        }
        
        // "PICKED UP" status-la iruntha mattum thaan GPS location-a anupanum
        if (order.getStatus().equalsIgnoreCase("PICKED UP")) {
            if (order.getDeliveryPartner() != null) {
                DeliveryPartner partner = order.getDeliveryPartner();
                response.setLatitude(partner.getCurrentLatitude());
                response.setLongitude(partner.getCurrentLongitude());
            }
        }
        // Matha status-la location 0.0-va pogum.

        return ResponseEntity.ok(response);
    }
}

// --- Intha DTO class-a UPDATE PANNIRUKOM ---
class TrackingResponse {
    private Long orderId;
    private String orderStatus;
    private String partnerName;
    private double latitude;  // Partner location
    private double longitude; // Partner location
    
    // --- PUTHU FIELDS INGEY ---
    private double restaurantLatitude;
    private double restaurantLongitude;

    // Getters and Setters...
    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public String getOrderStatus() { return orderStatus; }
    public void setOrderStatus(String orderStatus) { this.orderStatus = orderStatus; }
    public String getPartnerName() { return partnerName; }
    public void setPartnerName(String partnerName) { this.partnerName = partnerName; }
    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }
    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }
    
    // --- PUTHU GETTERS/SETTERS INGEY ---
    public double getRestaurantLatitude() { return restaurantLatitude; }
    public void setRestaurantLatitude(double restaurantLatitude) { this.restaurantLatitude = restaurantLatitude; }
    public double getRestaurantLongitude() { return restaurantLongitude; }
    public void setRestaurantLongitude(double restaurantLongitude) { this.restaurantLongitude = restaurantLongitude; }
}