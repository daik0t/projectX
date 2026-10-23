package database.projectx.handler;

import database.projectx.model.User;
import database.projectx.model.UserEmails;
import database.projectx.repository.UserEmailsRepository;
import database.projectx.repository.UserRepository;
import database.projectx.security.CustomUserDetails;
import database.projectx.service.JWTService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JWTService jwtService;
    private final UserRepository userRepository;
    private final UserEmailsRepository userEmailsRepository;

    public OAuth2SuccessHandler (
        JWTService jwtService,
        UserRepository userRepository,
        UserEmailsRepository userEmailsRepository
    ) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.userEmailsRepository = userEmailsRepository;
    }

    @Value("${app.oauth.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2User oAuth2User = ((OAuth2AuthenticationToken) authentication).getPrincipal();
        Long userId = ((Number) oAuth2User.getAttributes().get("_app_user_id")).longValue();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("user not found: " + userId));
        UserEmails userEmail = userEmailsRepository.findByUserId(userId).orElse(null);

        String email = userEmail != null ? userEmail.getEmail() : null;
        boolean emailVerified = userEmail != null && Boolean.TRUE.equals(userEmail.getIsVerified());

        CustomUserDetails principal = CustomUserDetails.from(
                user, email, null, emailVerified);
        String jwt = jwtService.generateToken(principal);

        String url = frontendUrl + "/oauth/callback?token="
                + URLEncoder.encode(jwt, StandardCharsets.UTF_8);

        log.info("OAuth: user_id={} authenticated, redirecting to frontend", userId);
        getRedirectStrategy().sendRedirect(request, response, url);
    }
}