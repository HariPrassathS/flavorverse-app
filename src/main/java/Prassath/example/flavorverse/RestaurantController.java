package Prassath.example.flavorverse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/restaurants")
public class RestaurantController {

    @Autowired
    private RestaurantRepository restaurantRepository;

    /**
     * For Super Admin: Adds a new restaurant to the platform.
     */
    @PostMapping("/add")
    public ResponseEntity<Restaurant> addRestaurant(@RequestBody Restaurant restaurant) {
        Restaurant savedRestaurant = restaurantRepository.save(restaurant);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedRestaurant);
    }

    /**
     * For Customers: Gets a list of all available restaurants for the homepage.
     */
    @GetMapping
    public ResponseEntity<List<Restaurant>> getAllRestaurants() {
        List<Restaurant> restaurants = restaurantRepository.findAll();
        return ResponseEntity.ok(restaurants);
    }

    /**
     * For the Menu Page: Gets the details of a single restaurant by its ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Restaurant> getRestaurantById(@PathVariable Long id) {
        Optional<Restaurant> restaurant = restaurantRepository.findById(id);
        if (restaurant.isPresent()) {
            return ResponseEntity.ok(restaurant.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * For Customers: Searches for restaurants by name.
     */
    @GetMapping("/search")
    public ResponseEntity<List<Restaurant>> searchRestaurants(@RequestParam String name) {
        List<Restaurant> restaurants = restaurantRepository.findByNameContainingIgnoreCase(name);
        return ResponseEntity.ok(restaurants);
    }

    /**
     * For Super Admin: Updates an existing restaurant's details.
     */
    @PutMapping("/update/{id}")
    public ResponseEntity<Restaurant> updateRestaurant(@PathVariable Long id, @RequestBody Restaurant restaurantDetails) {
        return restaurantRepository.findById(id)
            .map(restaurant -> {
                restaurant.setName(restaurantDetails.getName());
                restaurant.setAddress(restaurantDetails.getAddress());
                restaurant.setCuisineType(restaurantDetails.getCuisineType());
                restaurant.setImageUrl(restaurantDetails.getImageUrl());
                Restaurant updatedRestaurant = restaurantRepository.save(restaurant);
                return ResponseEntity.ok(updatedRestaurant);
            }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * For Super Admin: Deletes a restaurant from the platform.
     */
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteRestaurant(@PathVariable Long id) {
        return restaurantRepository.findById(id)
            .map(restaurant -> {
                restaurantRepository.delete(restaurant);
                return ResponseEntity.ok().build();
            }).orElse(ResponseEntity.notFound().build());
    }
}