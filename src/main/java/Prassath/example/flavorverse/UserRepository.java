package Prassath.example.flavorverse;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // This is a custom method we are adding.
    // It allows us to find a user by their unique username for the login system.
    Optional<User> findByUsername(String username);

}