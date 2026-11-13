package database.projectx.service;

import database.projectx.security.CustomUserDetails;
import database.projectx.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JWTServiceTest {

    private JWTService jwtService;
    private CustomUserDetails userDetails;
    
    private final String secret = "dGVzdC1zZWNyZXQta2V5LWZvci10ZXN0aW5nLW9ubHktMzJieXRlcw==";

    @BeforeEach
    void setUp() {
        jwtService = new JWTService(secret, 3600000L);
        
        User user = new User();
        user.setId(1L);
        user.setDisplayName("alice");
        userDetails = CustomUserDetails.from(user, "test@test.com", "hash", true);
    }

    @Test
    void generateAndExtract_shouldWorkCorrectly() {
        String token = jwtService.generateToken(userDetails);
        
        assertThat(token).isNotBlank();
        Long extractedId = jwtService.extractUserId(token);
        assertThat(extractedId).isEqualTo(1L);
    }

    @Test
    void isTokenValid_whenTokenValid_shouldReturnTrue() {
        String token = jwtService.generateToken(userDetails);
        boolean isValid = jwtService.isTokenValid(token, userDetails);
        assertThat(isValid).isTrue();
    }

    @Test
    void isTokenValid_whenDifferentUser_shouldReturnFalse() {
        String token = jwtService.generateToken(userDetails);
        
        User otherUser = new User();
        otherUser.setId(2L); 
        CustomUserDetails otherDetails = CustomUserDetails.from(otherUser, "other@test.com", "hash", true);
        
        boolean isValid = jwtService.isTokenValid(token, otherDetails);
        assertThat(isValid).isFalse();
    }

    @Test
    void isTokenValid_whenExpired_shouldReturnFalse() {
        JWTService expiredService = new JWTService(secret, -1000L);
        String expiredToken = expiredService.generateToken(userDetails);

        boolean isValid = jwtService.isTokenValid(expiredToken, userDetails);
        assertThat(isValid).isFalse();
    }
}