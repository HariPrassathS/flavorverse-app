package Prassath.example.flavorverse;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface DeliveryPartnerRepository extends JpaRepository<DeliveryPartner, Long> {

    // Namma delivery partner-a avanga user ID vachi theda ithu use aagum
    Optional<DeliveryPartner> findByUserId(Long userId);
    
    // Duty-la irukura ellarayum list panna
    List<DeliveryPartner> findByAvailable(boolean available);
}