package database.projectx.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MvcResult;


import database.projectx.model.PasswordCredentials;
import database.projectx.model.PasswordResetTokens;
import database.projectx.model.User;

/**
 * Интеграционные тесты сброса пароля: /api/auth/forgot-password и
 * /api/auth/reset-password, включая TTL, одноразовость токена и вход новым паролем.
 */
class PasswordResetApiIntegrationTest extends IntegrationTestBase {

    private User user;
    private String email;

    @BeforeEach
    void seedUser() {
        user = seedVerifiedUser();
        email = emailOf(user);
    }

    // ------------------------------------------------------------------
    // Запрос на сброс
    // ------------------------------------------------------------------

    @Test
    void forgotPassword_whenEmailExists_shouldCreateHashedTokenWithTtl() throws Exception {
        MvcResult result = mockMvc.perform(jsonPost("/api/auth/forgot-password", Map.of("email", email)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists())
                .andReturn();

        assertThat(json(result).path("message").asText()).isNotBlank();

        List<PasswordResetTokens> tokens = passwordResetTokenRepository.findAll();
        assertThat(tokens).hasSize(1);

        PasswordResetTokens token = tokens.get(0);
        assertThat(token.getTokenHash()).hasSize(64).matches("[0-9a-f]+");
        assertThat(token.getUsedAt()).isNull();
        assertThat(token.getExpiresAt())
                .isAfter(LocalDateTime.now().plusMinutes(10))
                .isBefore(LocalDateTime.now().plusMinutes(20));
    }

    @Test
    void forgotPassword_whenEmailExists_shouldNotLeakRawTokenInResponse() throws Exception {
        MvcResult result = mockMvc.perform(jsonPost("/api/auth/forgot-password", Map.of("email", email)))
                .andExpect(status().isOk())
                .andReturn();

        String body = bodyOf(result);
        PasswordResetTokens token = passwordResetTokenRepository.findAll().get(0);
        assertThat(body).doesNotContain(token.getTokenHash());
        assertThat(body).doesNotContain("token=");
    }

    @Test
    void forgotPassword_whenEmailUnknown_shouldReturnSameAnswerAsForKnownEmail() throws Exception {
        MvcResult unknown = mockMvc.perform(jsonPost("/api/auth/forgot-password",
                        Map.of("email", uniqueEmail("ghost"))))
                .andExpect(status().isOk())
                .andReturn();

        MvcResult known = mockMvc.perform(jsonPost("/api/auth/forgot-password", Map.of("email", email)))
                .andExpect(status().isOk())
                .andReturn();

        // Ответы неотличимы — защиты от перебора email нет.
        assertThat(json(unknown).path("message").asText())
                .isEqualTo(json(known).path("message").asText());
        assertThat(passwordResetTokenRepository.count()).isEqualTo(1);
    }

    @Test
    void forgotPassword_withInvalidEmail_shouldReturn400() throws Exception {
        mockMvc.perform(jsonPost("/api/auth/forgot-password", Map.of("email", "not-an-email")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details.email").exists());

        assertThat(passwordResetTokenRepository.count()).isZero();
    }

    // ------------------------------------------------------------------
    // Сброс пароля
    // ------------------------------------------------------------------

    @Test
    void resetPassword_withValidToken_shouldChangePasswordAndAllowLogin() throws Exception {
        String rawToken = passwordResetService.createResetToken(user);

        mockMvc.perform(jsonPost("/api/auth/reset-password",
                        Map.of("token", rawToken, "newPassword", NEW_PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Пароль успешно изменен"));

        PasswordCredentials credentials =
                passwordCredentialsRepository.findByUserId(user.getId()).orElseThrow();
        assertThat(passwordEncoder.matches(NEW_PASSWORD, credentials.getPasswordHash())).isTrue();
        assertThat(passwordEncoder.matches(RAW_PASSWORD, credentials.getPasswordHash())).isFalse();

        PasswordResetTokens token = passwordResetTokenRepository
                .findByTokenHash(sha256Hex(rawToken)).orElseThrow();
        assertThat(token.getUsedAt()).isNotNull();

        // Старый пароль больше не работает.
        mockMvc.perform(jsonPost("/api/auth/login", Map.of("email", email, "password", RAW_PASSWORD)))
                .andExpect(status().isUnauthorized());

        // Новый пароль работает, и выданный токен даёт доступ.
        String accessToken = loginToken(email, NEW_PASSWORD);
        mockMvc.perform(getJson("/api/users/me").header("Authorization", bearer(accessToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email));
    }

    @Test
    void resetPassword_withUnknownToken_shouldReturn400AndKeepPassword() throws Exception {
        mockMvc.perform(jsonPost("/api/auth/reset-password",
                        Map.of("token", "unknown-token", "newPassword", NEW_PASSWORD)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Недействительная или просроченная ссылка"));

        PasswordCredentials credentials =
                passwordCredentialsRepository.findByUserId(user.getId()).orElseThrow();
        assertThat(passwordEncoder.matches(RAW_PASSWORD, credentials.getPasswordHash())).isTrue();
    }

    @Test
    void resetPassword_withAlreadyUsedToken_shouldReturn400() throws Exception {
        String rawToken = passwordResetService.createResetToken(user);

        mockMvc.perform(jsonPost("/api/auth/reset-password",
                        Map.of("token", rawToken, "newPassword", NEW_PASSWORD)))
                .andExpect(status().isOk());

        mockMvc.perform(jsonPost("/api/auth/reset-password",
                        Map.of("token", rawToken, "newPassword", "anotherpassword789")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("использована")));

        // Пароль остался тем, что был установлен первым сбросом.
        PasswordCredentials credentials =
                passwordCredentialsRepository.findByUserId(user.getId()).orElseThrow();
        assertThat(passwordEncoder.matches(NEW_PASSWORD, credentials.getPasswordHash())).isTrue();
    }

    @Test
    void resetPassword_withExpiredToken_shouldReturn400AndKeepPassword() throws Exception {
        String rawToken = "expired-" + uniqueName("token");
        PasswordResetTokens expired = new PasswordResetTokens();
        expired.setUser(user);
        expired.setTokenHash(sha256Hex(rawToken));
        expired.setExpiresAt(LocalDateTime.now().minusMinutes(1));
        passwordResetTokenRepository.save(expired);

        mockMvc.perform(jsonPost("/api/auth/reset-password",
                        Map.of("token", rawToken, "newPassword", NEW_PASSWORD)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("истек")));

        PasswordCredentials credentials =
                passwordCredentialsRepository.findByUserId(user.getId()).orElseThrow();
        assertThat(passwordEncoder.matches(RAW_PASSWORD, credentials.getPasswordHash())).isTrue();
    }

    @Test
    void resetPassword_withTooShortPassword_shouldReturn400AndNotConsumeToken() throws Exception {
        String rawToken = passwordResetService.createResetToken(user);

        mockMvc.perform(jsonPost("/api/auth/reset-password",
                        Map.of("token", rawToken, "newPassword", "short")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details.newPassword").exists());

        PasswordResetTokens token = passwordResetTokenRepository
                .findByTokenHash(sha256Hex(rawToken)).orElseThrow();
        assertThat(token.getUsedAt()).isNull();
        assertThat(passwordEncoder.matches(RAW_PASSWORD,
                passwordCredentialsRepository.findByUserId(user.getId()).orElseThrow().getPasswordHash()))
                .isTrue();
    }

    @Test
    void resetPassword_withBlankToken_shouldReturn400() throws Exception {
        mockMvc.perform(jsonPost("/api/auth/reset-password",
                        Map.of("token", "", "newPassword", NEW_PASSWORD)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details.token").exists());
    }

    @Test
    void resetPassword_forUserWithoutCredentials_shouldCreatePassword() throws Exception {
        // Пользователь, созданный через OAuth, может не иметь пароля.
        User oauthUser = seedUserWithoutCredentials();
        String rawToken = passwordResetService.createResetToken(oauthUser);

        mockMvc.perform(jsonPost("/api/auth/reset-password",
                        Map.of("token", rawToken, "newPassword", NEW_PASSWORD)))
                .andExpect(status().isOk());

        PasswordCredentials credentials =
                passwordCredentialsRepository.findByUserId(oauthUser.getId()).orElseThrow();
        assertThat(passwordEncoder.matches(NEW_PASSWORD, credentials.getPasswordHash())).isTrue();

        // После установки пароля вход по нему работает.
        loginToken(emailOf(oauthUser), NEW_PASSWORD);
    }

    @Test
    void resetPassword_withoutValidToken_shouldBePubliclyReachable() throws Exception {
        // Эндпоинт не требует аутентификации: запрос без токена доходит до контроллера
        // и получает 400 от сервиса, а не 401 от security.
        mockMvc.perform(jsonPost("/api/auth/reset-password",
                        Map.of("token", "no-such-token", "newPassword", NEW_PASSWORD)))
                .andExpect(status().isBadRequest());
    }

    // ------------------------------------------------------------------

    private static String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(input.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
    }
}
