package Prassath.example.flavorverse;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // This defines HOW passwords are encoded
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // This tells Spring Security WHERE to find users
    @Bean
    public UserDetailsService userDetailsService() {
        // Namma CustomUserDetailsService-a use pannuthu
        return new CustomUserDetailsService(); 
    }

    // This sets up the main security rules for API endpoints
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                // Public APIs (Yaar vena access pannalam)
                .requestMatchers("/api/users/register", "/api/users/login").permitAll()
                
                // Public delivery partner registration
                .requestMatchers("/api/users/delivery/register").permitAll()

                // --- ITHU THAAN PUTHU ADMIN RULE ---
                // Admin mattum access panna koodiya API
                // (hasRole("SUPER_ADMIN")-nu podum pothu, database-la "ROLE_SUPER_ADMIN" irukanum)
                .requestMatchers("/api/users/admin/**").hasRole("SUPER_ADMIN")

                // Allow all frontend files (HTML, CSS, JS) to be accessed publicly
                // **NOTE:** Ithu thaan namma last-a fix panna vendiya chinna security issue
                .requestMatchers("/**").permitAll()

                // Matha ella request-kum authentication venum
                .anyRequest().authenticated()
            );
        return http.build();
    }

    // This connects the user finding service (UserDetailsService) and the password encoder
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService());
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    // CORS configuration for cross-origin requests
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.addAllowedOrigin("*");
        configuration.addAllowedMethod("*");
        configuration.addAllowedHeader("*");
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
