package database.projectx.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/**
 * Интеграционные тесты контракта безопасности: какие эндпоинты закрыты,
 * какие публичные и как выглядит отказ 401.
 */
class SecurityIntegrationTest extends IntegrationTestBase {

    static Stream<Arguments> protectedEndpoints() {
        return Stream.of(
                Arguments.of("GET /api/users/me", get("/api/users/me")),
                Arguments.of("GET /api/users", get("/api/users")),
                Arguments.of("POST /api/users", post("/api/users")),
                Arguments.of("GET /api/tags", get("/api/tags")),
                Arguments.of("POST /api/tags", post("/api/tags")),
                Arguments.of("DELETE /api/tags/1", delete("/api/tags/1")),
                Arguments.of("GET /api/videos/me", get("/api/videos/me")),
                Arguments.of("POST /api/videos", post("/api/videos")),
                Arguments.of("GET /api/videos/1", get("/api/videos/1")),
                Arguments.of("PUT /api/videos/1", put("/api/videos/1")),
                Arguments.of("PUT /api/videos/1/tags", put("/api/videos/1/tags")),
                Arguments.of("DELETE /api/videos/1", delete("/api/videos/1"))
        );
    }

    @ParameterizedTest(name = "{0} without token -> 401")
    @MethodSource("protectedEndpoints")
    void protectedEndpoint_withoutToken_shouldReturnJson401(String description,
                                                            MockHttpServletRequestBuilder request)
            throws Exception {
        mockMvc.perform(request.with(remoteAddr(nextIp())))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Требуется аутентификация"));
    }

    @Test
    void loginEndpoint_shouldBePubliclyReachable() throws Exception {
        mockMvc.perform(jsonPost("/api/auth/login", Map.of("email", "not-an-email", "password", "")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void registerEndpoint_shouldBePubliclyReachable() throws Exception {
        mockMvc.perform(jsonPost("/api/auth/register", Map.of(
                        "displayName", "", "email", "not-an-email", "password", "")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void forgotPasswordEndpoint_shouldBePubliclyReachable() throws Exception {
        mockMvc.perform(jsonPost("/api/auth/forgot-password", Map.of("email", "not-an-email")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void resetPasswordEndpoint_shouldBePubliclyReachable() throws Exception {
        mockMvc.perform(jsonPost("/api/auth/reset-password", Map.of("token", "", "newPassword", "")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void authorizationHeaderWithWrongScheme_shouldBeIgnored() throws Exception {
        mockMvc.perform(getJson("/api/users/me").header("Authorization", "Basic dXNlcjpwYXNz"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void postWithoutCsrfToken_shouldStillWorkForStatelessApi() throws Exception {
        // CSRF отключён: POST без csrf-токена доходит до валидации, а не блокируется 403.
        mockMvc.perform(jsonPost("/api/auth/register", Map.of(
                        "displayName", "csrf", "email", "csrf", "password", "short")))
                .andExpect(status().isBadRequest());
    }
}
