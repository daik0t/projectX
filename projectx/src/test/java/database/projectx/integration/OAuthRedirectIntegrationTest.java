package database.projectx.integration;

import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;

/**
 * Интеграционные тесты OAuth2-входа: проверяем, что security-конфигурация
 * собрана корректно и редирект уходит на реальные провайдеры с нашим client_id.
 * Сам обмен кодами с провайдером не выполняется (нужна внешняя сеть).
 */
class OAuthRedirectIntegrationTest extends IntegrationTestBase {

    @Test
    void googleAuthorization_shouldRedirectToGoogleWithConfiguredClient() throws Exception {
        mockMvc.perform(getJson("/oauth2/authorization/google"))
                .andExpect(status().is3xxRedirection())
                .andExpect(header().string(HttpHeaders.LOCATION, allOf(
                        startsWith("https://accounts.google.com/"),
                        containsString("client_id=test-google-id"),
                        containsString("response_type=code"),
                        containsString("redirect_uri="))));
    }

    @Test
    void githubAuthorization_shouldRedirectToGithubWithConfiguredClient() throws Exception {
        mockMvc.perform(getJson("/oauth2/authorization/github"))
                .andExpect(status().is3xxRedirection())
                .andExpect(header().string(HttpHeaders.LOCATION, allOf(
                        startsWith("https://github.com/login/oauth/authorize"),
                        containsString("client_id=test-github-id"),
                        containsString("redirect_uri="))));
    }

    @Test
    void oauthCallbackWithoutState_shouldNotAuthenticate() throws Exception {
        // Прямой вызов callback без state/кода не должен выдавать токен или 200.
        mockMvc.perform(getJson("/login/oauth2/code/google")
                        .param("code", "fake-code")
                        .param("state", "forged-state"))
                .andExpect(status().is3xxRedirection());
    }
}
