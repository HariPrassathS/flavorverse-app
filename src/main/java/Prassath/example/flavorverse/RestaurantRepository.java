package Prassath.example.flavorverse;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List; // Add this import

@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {
    
    // This method will find all restaurants whose name contains the search term,
    // ignoring case (e.g., "briyani" will match "Briyani").
    List<Restaurant> findByNameContainingIgnoreCase(String name);

}