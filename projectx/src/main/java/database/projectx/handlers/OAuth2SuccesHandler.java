package database.projectx.handlers;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import database.projectx.model.User;
import database.projectx.model.UserEmails;
import database.projectx.repository.UserEmailsRepository;
import database.projectx.security.CustomUserDetails;
import database.projectx.service.JWTService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component 
public class OAuth2SuccesHandler extends SimpleUrlAuthenticationSuccessHandler{
    private final JWTService jwtService;
    private final UserEmailsRepository userEmailsRepository;

    @Value ("${app.oauth.redirect-uri}")
    private String redirectUri;

    public OAuth2SuccesHandler (
        JWTService jwtService,
        UserEmailsRepository userEmailsRepository
    ) {
        this.jwtService = jwtService;
        this.userEmailsRepository = userEmailsRepository;
    }


    @Override 
    public void onAuthenticationSuccess(
        HttpServletRequest request, 
        HttpServletResponse response, 
        Authentication authentication) throws IOException {
            OAuth2AuthenticationToken token = (OAuth2AuthenticationToken) authentication;
            OAuth2User oAuth2User = token.getPrincipal();

            String email = (String) oAuth2User.getAttributes().get("email");
            UserEmails userEmails = userEmailsRepository.findByEmail(email).orElseThrow(
                () -> new OAuth2AuthenticationException("User Email not found")
            );
            User user = userEmails.getUser();

            CustomUserDetails principal = CustomUserDetails.from(user, userEmails.getEmail(), null, userEmails.getIsVerified());
            String jwt = jwtService.generateToken(principal);

            String targetUrl = redirectUri + "?token=" + jwt;
            getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
