package database.projectx.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MvcResult;

import com.fasterxml.jackson.databind.JsonNode;

/**
 * Интеграционные тесты RateLimitFilter: 5 запросов в минуту на IP
 * для /api/auth/login, /api/auth/register, /api/auth/forgot-password,
 * /api/auth/reset-password. Лимит общий для IP, но не для остальных эндпоинтов.
 */
class RateLimitIntegrationTest extends IntegrationTestBase {

    private static final String UNKNOWN_EMAIL = "nobody@test.local";

    @Test
    void sixthLoginAttemptFromOneIp_shouldReturn429WithRetryAfter() throws Exception {
        String clientIp = nextIp();
        Map<String, Object> credentials = Map.of("email", UNKNOWN_EMAIL, "password", "wrong-password");

        for (int attempt = 1; attempt <= 5; attempt++) {
            mockMvc.perform(jsonPost("/api/auth/login", credentials, clientIp))
                    .andExpect(status().isUnauthorized());
        }

        MvcResult result = mockMvc.perform(jsonPost("/api/auth/login", credentials, clientIp))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.status").value(429))
                .andExpect(jsonPath("$.error").value("Too Many Requests"))
                .andExpect(jsonPath("$.message").value("Too many requests. Try again later"))
                .andReturn();

        String retryAfter = result.getResponse().getHeader("Retry-After");
        assertThat(Long.parseLong(retryAfter)).isPositive();
    }

    @Test
    void sixthRegisterAttemptFromOneIp_shouldReturn429() throws Exception {
        String clientIp = nextIp();
        Map<String, Object> invalidBody = Map.of(
                "displayName", "", "email", "not-an-email", "password", "1");

        for (int attempt = 1; attempt <= 5; attempt++) {
            mockMvc.perform(jsonPost("/api/auth/register", invalidBody, clientIp))
                    .andExpect(status().isBadRequest());
        }

        mockMvc.perform(jsonPost("/api/auth/register", invalidBody, clientIp))
                .andExpect(status().isTooManyRequests());

        // Лимит сработал до контроллера: пользователей не появилось.
        assertThat(userRepository.count()).isZero();
    }

    @Test
    void sixthForgotPasswordAttemptFromOneIp_shouldReturn429() throws Exception {
        String clientIp = nextIp();
        Map<String, Object> invalidBody = Map.of("email", "not-an-email");

        for (int attempt = 1; attempt <= 5; attempt++) {
            mockMvc.perform(jsonPost("/api/auth/forgot-password", invalidBody, clientIp))
                    .andExpect(status().isBadRequest());
        }

        mockMvc.perform(jsonPost("/api/auth/forgot-password", invalidBody, clientIp))
                .andExpect(status().isTooManyRequests());

        assertThat(passwordResetTokenRepository.count()).isZero();
    }

    @Test
    void differentIpsHaveIndependentBuckets() throws Exception {
        String limitedIp = nextIp();
        String freshIp = nextIp();
        Map<String, Object> credentials = Map.of("email", UNKNOWN_EMAIL, "password", "wrong-password");

        for (int attempt = 1; attempt <= 5; attempt++) {
            mockMvc.perform(jsonPost("/api/auth/login", credentials, limitedIp))
                    .andExpect(status().isUnauthorized());
        }
        mockMvc.perform(jsonPost("/api/auth/login", credentials, limitedIp))
                .andExpect(status().isTooManyRequests());

        // Другой IP не должен поймать 429.
        mockMvc.perform(jsonPost("/api/auth/login", credentials, freshIp))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void nonAuthEndpointsAreNotRateLimited() throws Exception {
        String clientIp = nextIp();

        for (int attempt = 1; attempt <= 8; attempt++) {
            mockMvc.perform(getJson("/api/users/me", clientIp))
                    .andExpect(status().isUnauthorized());
        }
    }

    /**
     * Фиксирует текущее поведение: в RateLimitFilter заголовок клиента читается как
     * "X-Forwwrded-For" (опечатка), поэтому стандартный X-Forwarded-For игнорируется
     * и лимит всегда считается по remoteAddr. За прокси это значит, что все клиенты
     * делят один бакет.
     *
     * <p>BUG: при исправлении заголовка тест должен упасть — тогда его нужно
     * переписать на проверку X-Forwarded-For.</p>
     */
    @Test
    void forwardedForHeaderIsIgnoredBecauseOfTypo_currentBehavior() throws Exception {
        String clientIp = nextIp();
        Map<String, Object> credentials = Map.of("email", UNKNOWN_EMAIL, "password", "wrong-password");

        for (int attempt = 1; attempt <= 5; attempt++) {
            mockMvc.perform(jsonPost("/api/auth/login", credentials, clientIp)
                            .header("X-Forwarded-For", "203.0.113." + attempt))
                    .andExpect(status().isUnauthorized());
        }

        // Несмотря на новый X-Forwarded-For, бакет тот же — remoteAddr не менялся.
        mockMvc.perform(jsonPost("/api/auth/login", credentials, clientIp)
                        .header("X-Forwarded-For", "203.0.113.99"))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void rateLimitResponseBodyIsJson() throws Exception {
        String clientIp = nextIp();
        Map<String, Object> credentials = Map.of("email", UNKNOWN_EMAIL, "password", "wrong-password");

        for (int attempt = 1; attempt <= 5; attempt++) {
            mockMvc.perform(jsonPost("/api/auth/login", credentials, clientIp));
        }

        MvcResult result = mockMvc.perform(jsonPost("/api/auth/login", credentials, clientIp))
                .andExpect(status().isTooManyRequests())
                .andReturn();

        JsonNode body = json(result);
        assertThat(body.path("status").asInt()).isEqualTo(429);
        assertThat(body.path("error").asText()).isEqualTo("Too Many Requests");
    }
}
