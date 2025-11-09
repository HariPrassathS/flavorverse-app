package Prassath.example.flavorverse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired private OrderRepository orderRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private MenuItemRepository menuItemRepository;
    @Autowired private RestaurantRepository restaurantRepository;
    @Autowired private DeliveryPartnerRepository deliveryPartnerRepository;

    @PostMapping("/place")
    public ResponseEntity<Order> placeOrder(@RequestBody OrderRequest orderRequest) {
        User user = userRepository.findById(orderRequest.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Restaurant restaurant = restaurantRepository.findById(orderRequest.getRestaurantId())
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));

        Order newOrder = new Order();
        newOrder.setUser(user);
        newOrder.setRestaurant(restaurant);
        newOrder.setOrderDate(LocalDateTime.now());
        newOrder.setStatus("PLACED"); 

        double totalPrice = 0;
        List<OrderItem> orderItems = new ArrayList<>();

        for (CartItemDto itemDto : orderRequest.getItems()) {
            MenuItem menuItem = menuItemRepository.findById(itemDto.getMenuItemId())
                    .orElseThrow(() -> new RuntimeException("Menu item not found"));

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(newOrder);
            orderItem.setMenuItem(menuItem);
            orderItem.setQuantity(itemDto.getQuantity());
            orderItem.setPrice(menuItem.getPrice()); 

            orderItems.add(orderItem);
            totalPrice += menuItem.getPrice() * itemDto.getQuantity();
        }

        newOrder.setTotalPrice(totalPrice);
        newOrder.setOrderItems(orderItems);
        Order savedOrder = orderRepository.save(newOrder);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedOrder);
    }

    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders() {
        List<Order> orders = orderRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "orderDate"));
        return ResponseEntity.ok(orders);
    }
    
    @PutMapping("/update-status/{orderId}")
    public ResponseEntity<Order> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestParam String status) {
        
        if (status.equalsIgnoreCase("OUT FOR DELIVERY")) {
             return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(null); 
        }
        
        return orderRepository.findById(orderId)
            .map(order -> {
                order.setStatus(status); 
                Order updatedOrder = orderRepository.save(order);
                return ResponseEntity.ok(updatedOrder);
            }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Order>> getOrdersByUserId(@PathVariable Long userId) {
        List<Order> userOrders = orderRepository.findByUserIdOrderByOrderDateDesc(userId);
        return ResponseEntity.ok(userOrders);
    }
    
    
    @PutMapping("/assign-delivery/{orderId}/{partnerId}")
    public ResponseEntity<?> assignDeliveryPartner(
            @PathVariable Long orderId,
            @PathVariable Long partnerId) {
        
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
            
        DeliveryPartner partner = deliveryPartnerRepository.findById(partnerId)
                .orElseThrow(() -> new RuntimeException("Delivery Partner not found"));

        if (!order.getStatus().equalsIgnoreCase("PREPARING")) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("Order must be in PREPARING status to be assigned.");
        }

        // Assign partner and update status
        order.setDeliveryPartner(partner);
        order.setStatus("OUT FOR DELIVERY"); 
        
        // Partner-a ippa "busy" aakidalam
        partner.setAvailable(false); 
        deliveryPartnerRepository.save(partner);
        
        Order updatedOrder = orderRepository.save(order);
        return ResponseEntity.ok(updatedOrder);
    }

    // === IDHU THAAN PUTHU "USER CANCEL" ENDPOINT ===
    @PutMapping("/cancel/{orderId}")
    public ResponseEntity<?> cancelOrder(@PathVariable Long orderId) {
        
        // Note: Real app la, namma Spring Security vechu correct-ana user thaan
        // cancel panrangala nu check pannanum. Ippo namma simple ah pannuvom.
        
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // Indha logic thaan romba mukkiyam
        String currentStatus = order.getStatus();
        if (currentStatus.equalsIgnoreCase("PLACED") || currentStatus.equalsIgnoreCase("PREPARING")) {
            
            // Order ah cancel pannidalam
            order.setStatus("CANCELLED");
            Order updatedOrder = orderRepository.save(order);
            
            // E-dhvadhu delivery partner assign aagirundha, avangala free pannidalam
            if (order.getDeliveryPartner() != null) {
                DeliveryPartner partner = order.getDeliveryPartner();
                partner.setAvailable(true);
                deliveryPartnerRepository.save(partner);
            }
            
            return ResponseEntity.ok(updatedOrder);
        } else {
            // "OUT FOR DELIVERY" or "DELIVERED" aana, cancel panna mudiyadhu
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("Order cannot be cancelled. It is already " + currentStatus + ".");
        }
    }
    
    // NEW: Get single order by ID (for admin)
    @GetMapping("/{orderId}")
    public ResponseEntity<Order> getOrderById(@PathVariable Long orderId) {
        return orderRepository.findById(orderId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    // NEW: Update order status (for admin)
    @PutMapping("/{orderId}/status")
    public ResponseEntity<Order> updateStatus(@PathVariable Long orderId, @RequestBody StatusUpdateRequest request) {
        return orderRepository.findById(orderId)
            .map(order -> {
                order.setStatus(request.getStatus());
                Order updatedOrder = orderRepository.save(order);
                return ResponseEntity.ok(updatedOrder);
            }).orElse(ResponseEntity.notFound().build());
    }
    
    // NEW: Delete order (for admin)
    @DeleteMapping("/{orderId}")
    public ResponseEntity<?> deleteOrder(@PathVariable Long orderId) {
        return orderRepository.findById(orderId)
            .map(order -> {
                orderRepository.delete(order);
                return ResponseEntity.ok().build();
            }).orElse(ResponseEntity.notFound().build());
    }
}

// DTO for status update
class StatusUpdateRequest {
    private String status;
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}

