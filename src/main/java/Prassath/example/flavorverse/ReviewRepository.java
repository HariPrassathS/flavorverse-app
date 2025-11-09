package Prassath.example.flavorverse;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    // Find all reviews for a specific restaurant
    List<Review> findByRestaurantId(Long restaurantId);
}