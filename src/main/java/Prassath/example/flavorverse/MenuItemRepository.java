package Prassath.example.flavorverse;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {

    /**
     * This is a custom query method.
     * Spring Data JPA will automatically create the logic to find all
     * MenuItem entities that belong to a specific restaurantId.
     */
    List<MenuItem> findByRestaurantId(Long restaurantId);

}