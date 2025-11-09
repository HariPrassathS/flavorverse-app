package Prassath.example.flavorverse;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List; // This import is already here

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    // This will automatically find all orders for a specific user ID
    // and sort them with the newest ones first.
    List<Order> findByUserIdOrderByOrderDateDesc(Long userId);

    // --- ITHU THAAN PUTHU METHOD (for Delivery Partner) ---
    // Oru specific partner-ku assign aagi, innum deliver aagatha orders-a edukka
    List<Order> findByDeliveryPartnerIdAndStatusNot(Long deliveryPartnerId, String status);
    
    // NEW: Find orders without delivery partner (available for assignment)
    List<Order> findByStatusAndDeliveryPartnerIsNull(String status);
    
    // NEW: Find all orders for a specific delivery partner
    List<Order> findByDeliveryPartnerId(Long deliveryPartnerId);
}