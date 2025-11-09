package Prassath.example.flavorverse;

// === UNGA SCREENSHOT LA MISS AANA ELLA IMPORTS UM INGA IRUKKU ===
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
// ================================================================

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewRepository reviewRepository; // Ippo idhu work aagum

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RestaurantRepository restaurantRepository;

    // AI Service ah inject panrom
    @Autowired
    private AiSummaryService aiSummaryService;

    // Menu items ah yum theva padum
    @Autowired
    private MenuItemRepository menuItemRepository;

    // API to post a new review
    @PostMapping("/add")
    public ResponseEntity<Review> addReview(@RequestBody ReviewRequest reviewRequest) {
        User user = userRepository.findById(reviewRequest.getUserId()).orElse(null);
        Restaurant restaurant = restaurantRepository.findById(reviewRequest.getRestaurantId()).orElse(null);

        if (user == null || restaurant == null) {
            return ResponseEntity.badRequest().build();
        }

        Review review = new Review();
        review.setUser(user);
        review.setRestaurant(restaurant);
        review.setRating(reviewRequest.getRating());
        review.setComment(reviewRequest.getComment());
        review.setDatePosted(LocalDateTime.now());
        
        Review savedReview = reviewRepository.save(review);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedReview);
    }

    // API to get all reviews for a restaurant
    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<List<Review>> getReviewsForRestaurant(@PathVariable Long restaurantId) {
        List<Review> reviews = reviewRepository.findByRestaurantId(restaurantId);
        return ResponseEntity.ok(reviews);
    }

    // API for Admin to get all reviews
    @GetMapping("/all")
    public ResponseEntity<List<Review>> getAllReviews() {
        List<Review> allReviews = reviewRepository.findAll(
            org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "datePosted")
        );
        return ResponseEntity.ok(allReviews);
    }
    
    // AI Summary Endpoint (Async)
    @GetMapping("/restaurant/{restaurantId}/summary")
    public Mono<String> getReviewSummary(@PathVariable Long restaurantId) {
        List<Review> reviews = reviewRepository.findByRestaurantId(restaurantId);
        return aiSummaryService.getReviewSummary(reviews);
    }

    // === PUTHU AI MENU TAGS ENDPOINT ===
    @GetMapping("/restaurant/{restaurantId}/tags")
    public Mono<Map<Long, String>> getMenuTags(@PathVariable Long restaurantId) {
        // Indha restaurant oda reviews...
        List<Review> reviews = reviewRepository.findByRestaurantId(restaurantId);
        // ...and indha restaurant oda menu items...
        List<MenuItem> menuItems = menuItemRepository.findByRestaurantId(restaurantId);
        
        // ...rendayum AI service kitta anuppurom
        return aiSummaryService.getMenuTags(reviews, menuItems);
    }
}
// DTO class for the request
class ReviewRequest {
    private Long userId;
    private Long restaurantId;
    private int rating;
    private String comment;

    // Getters and Setters
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getRestaurantId() { return restaurantId; }
    public void setRestaurantId(Long restaurantId) { this.restaurantId = restaurantId; }
    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
}