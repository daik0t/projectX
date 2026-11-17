package database.projectx.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Map;

import javax.crypto.SecretKey;

import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MvcResult;

import com.fasterxml.jackson.databind.JsonNode;

import database.projectx.model.PasswordCredentials;
import database.projectx.model.User;
import database.projectx.model.UserEmails;
import database.projectx.security.CustomUserDetails;
import database.projectx.service.JWTService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

/**
 * Интеграционные тесты регистрации, логина и доступа по JWT.
 * Проверяют всю цепочку: HTTP -> фильтры безопасности -> контроллер -> сервис -> БД.
 */
class AuthApiIntegrationTest extends IntegrationTestBase {

    @Test
    void register_shouldCreateUserWithUnverifiedEmailAndHashedPassword() throws Exception {
        String displayName = uniqueName("alice");
        String email = uniqueEmail("alice");

        MvcResult result = mockMvc.perform(jsonPost("/api/auth/register",
                        Map.of("displayName", displayName, "email", email, "password", RAW_PASSWORD)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.displayName").value(displayName))
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.emailVerified").value(false))
                .andExpect(jsonPath("$.createdAt").exists())
                .andReturn();

        JsonNode body = json(result);
        assertThat(body.path("id").asLong()).isPositive();
        assertThat(body.has("password")).isFalse();
        assertThat(body.has("passwordHash")).isFalse();

        User user = userRepository.findByDisplayName(displayName).orElseThrow();
        UserEmails userEmail = userEmailsRepository.findByUserId(user.getId()).orElseThrow();
        assertThat(userEmail.getEmail()).isEqualTo(email);
        assertThat(userEmail.getIsVerified()).isFalse();

        PasswordCredentials credentials = passwordCredentialsRepository.findByUserId(user.getId()).orElseThrow();
        assertThat(credentials.getPasswordHash())
                .isNotEqualTo(RAW_PASSWORD)
                .startsWith("$2");
        assertThat(passwordEncoder.matches(RAW_PASSWORD, credentials.getPasswordHash())).isTrue();
    }

    @Test
    void register_whenDisplayNameAlreadyTaken_shouldReturn409() throws Exception {
        User existing = seedVerifiedUser();
        String newEmail = uniqueEmail("bob");

        mockMvc.perform(jsonPost("/api/auth/register",
                        Map.of("displayName", existing.getDisplayName(), "email", newEmail, "password", RAW_PASSWORD)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value("displayName уже занят"))
                .andExpect(jsonPath("$.details.field").exists());

        // Пользователь с новым email не создан.
        assertThat(userEmailsRepository.findByEmail(newEmail)).isEmpty();
    }

    @Test
    void register_whenEmailAlreadyTaken_shouldReturn409() throws Exception {
        User existing = seedVerifiedUser();
        String newDisplayName = uniqueName("bob");

        mockMvc.perform(jsonPost("/api/auth/register",
                        Map.of("displayName", newDisplayName, "email", emailOf(existing), "password", RAW_PASSWORD)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.details.field").value("email"));

        assertThat(userRepository.findByDisplayName(newDisplayName)).isEmpty();
    }

    @Test
    void register_withInvalidFields_shouldReturn400WithFieldDetails() throws Exception {
        mockMvc.perform(jsonPost("/api/auth/register",
                        Map.of("displayName", "", "email", "not-an-email", "password", "123")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.details.displayName").exists())
                .andExpect(jsonPath("$.details.email").exists())
                .andExpect(jsonPath("$.details.password").exists());

        assertThat(userRepository.count()).isZero();
        assertThat(userEmailsRepository.count()).isZero();
    }

    @Test
    void login_withValidCredentials_shouldReturnBearerTokenAndUser() throws Exception {
        User user = seedVerifiedUser();

        MvcResult result = mockMvc.perform(jsonPost("/api/auth/login",
                        Map.of("email", emailOf(user), "password", RAW_PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").value(86400))
                .andExpect(jsonPath("$.user.displayName").value(user.getDisplayName()))
                .andExpect(jsonPath("$.user.email").value(emailOf(user)))
                .andReturn();

        JsonNode body = json(result);
        String token = body.path("accessToken").asText();
        assertThat(token).isNotBlank();
        assertThat(body.path("user").path("id").asLong()).isEqualTo(user.getId());

        // Токен настоящий и указывает на того же пользователя.
        assertThat(jwtService.extractUserId(token)).isEqualTo(user.getId());
        assertThat(jwtService.isTokenExpired(token)).isFalse();
    }

    @Test
    void login_withWrongPassword_shouldReturn401() throws Exception {
        User user = seedVerifiedUser();

        mockMvc.perform(jsonPost("/api/auth/login",
                        Map.of("email", emailOf(user), "password", "wrong-password")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Неверный email или пароль"))
                .andExpect(jsonPath("$.accessToken").doesNotExist());
    }

    @Test
    void login_withUnknownEmail_shouldReturn401() throws Exception {
        mockMvc.perform(jsonPost("/api/auth/login",
                        Map.of("email", uniqueEmail("ghost"), "password", RAW_PASSWORD)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Неверный email или пароль"));
    }

    @Test
    void login_withInvalidEmailFormat_shouldReturn400() throws Exception {
        mockMvc.perform(jsonPost("/api/auth/login",
                        Map.of("email", "not-an-email", "password", RAW_PASSWORD)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details.email").exists());
    }

    @Test
    void requestWithValidToken_shouldResolvePrincipalForCurrentUser() throws Exception {
        User user = seedVerifiedUser();

        MvcResult result = mockMvc.perform(getJson("/api/users/me")
                        .header("Authorization", bearer(tokenFor(user))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value(user.getDisplayName()))
                .andExpect(jsonPath("$.email").value(emailOf(user)))
                .andExpect(jsonPath("$.emailVerified").value(true))
                .andReturn();

        assertThat(json(result).path("id").asLong()).isEqualTo(user.getId());
    }

    @Test
    void requestWithoutToken_shouldReturn401Json() throws Exception {
        mockMvc.perform(getJson("/api/users/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Требуется аутентификация"));
    }

    @Test
    void requestWithMalformedToken_shouldReturn401() throws Exception {
        mockMvc.perform(getJson("/api/users/me").header("Authorization", "Bearer not-a-jwt"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void requestWithExpiredToken_shouldReturn401() throws Exception {
        User user = seedVerifiedUser();
        String expiredToken = new JWTService(JWT_SECRET, -60_000L)
                .generateToken(CustomUserDetails.from(user, null, null, true));

        mockMvc.perform(getJson("/api/users/me").header("Authorization", bearer(expiredToken)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void requestWithTokenSignedByAnotherKey_shouldReturn401() throws Exception {
        User user = seedVerifiedUser();
        String anotherSecret = Base64.getEncoder().encodeToString(
                "another-test-secret-key-for-jwt-32b".getBytes(StandardCharsets.UTF_8));
        String foreignToken = new JWTService(anotherSecret, 3_600_000L)
                .generateToken(CustomUserDetails.from(user, null, null, true));

        mockMvc.perform(getJson("/api/users/me").header("Authorization", bearer(foreignToken)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void requestWithNonNumericSubject_shouldReturn401() throws Exception {
        SecretKey key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(JWT_SECRET));
        String token = Jwts.builder()
                .subject("not-a-number")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3_600_000L))
                .signWith(key)
                .compact();

        mockMvc.perform(getJson("/api/users/me").header("Authorization", bearer(token)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getAllUsers_shouldReturnAllPersistedUsers() throws Exception {
        User first = seedVerifiedUser();
        User second = seedVerifiedUser();
        String token = tokenFor(first);

        MvcResult result = mockMvc.perform(getJson("/api/users").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode users = json(result);
        assertThat(users.size()).isEqualTo(2);

        List<String> displayNames = new ArrayList<>();
        users.forEach(node -> displayNames.add(node.path("displayName").asText()));
        assertThat(displayNames).containsExactlyInAnyOrder(
                first.getDisplayName(), second.getDisplayName());
    }

    @Test
    void createUser_viaUsersEndpoint_shouldPersistUser() throws Exception {
        User actor = seedVerifiedUser();
        String displayName = uniqueName("crud");

        MvcResult result = mockMvc.perform(jsonPost("/api/users", Map.of("displayName", displayName))
                        .header("Authorization", bearer(tokenFor(actor))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value(displayName))
                .andExpect(jsonPath("$.createdAt").exists())
                .andReturn();

        long createdId = json(result).path("id").asLong();
        assertThat(userRepository.findById(createdId)).isPresent();
    }
}
