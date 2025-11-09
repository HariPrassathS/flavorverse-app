package Prassath.example.flavorverse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/menu")
public class MenuController {

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    /**
     * This endpoint gets all menu items for a specific restaurant.
     */
    @GetMapping("/{restaurantId}")
    public ResponseEntity<List<MenuItem>> getMenuForRestaurant(@PathVariable Long restaurantId) {
        List<MenuItem> menuItems = menuItemRepository.findByRestaurantId(restaurantId);
        return ResponseEntity.ok(menuItems);
    }

    /**
     * This endpoint adds a new menu item to a specific restaurant.
     */
    @PostMapping("/add/{restaurantId}")
    public ResponseEntity<MenuItem> addMenuItemToRestaurant(@PathVariable Long restaurantId, @RequestBody MenuItem menuItem) {
        Optional<Restaurant> optionalRestaurant = restaurantRepository.findById(restaurantId);

        if (optionalRestaurant.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Restaurant restaurant = optionalRestaurant.get();
        menuItem.setRestaurant(restaurant);
        MenuItem savedItem = menuItemRepository.save(menuItem);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(savedItem);
    }

    /**
     * Update an existing menu item.
     */
    @PutMapping("/update/{itemId}")
    public ResponseEntity<MenuItem> updateMenuItem(@PathVariable Long itemId, @RequestBody MenuItem itemDetails) {
        return menuItemRepository.findById(itemId)
            .map(item -> {
                item.setName(itemDetails.getName());
                item.setPrice(itemDetails.getPrice());
                item.setDescription(itemDetails.getDescription());
                item.setImageUrl(itemDetails.getImageUrl()); // Image URL update
                MenuItem updatedItem = menuItemRepository.save(item);
                return ResponseEntity.ok(updatedItem);
            }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Delete a menu item.
     */
    @DeleteMapping("/delete/{itemId}")
    public ResponseEntity<?> deleteMenuItem(@PathVariable Long itemId) {
        return menuItemRepository.findById(itemId)
            .map(item -> {
                menuItemRepository.delete(item);
                return ResponseEntity.ok().build();
            }).orElse(ResponseEntity.notFound().build());
    }
}