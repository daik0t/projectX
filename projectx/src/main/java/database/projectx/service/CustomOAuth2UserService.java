package database.projectx.service;

import java.util.Optional;

import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import database.projectx.model.OAuthAccounts;
import database.projectx.model.User;
import database.projectx.model.UserEmails;
import database.projectx.repository.OAuthAccountsRepository;
import database.projectx.repository.UserEmailsRepository;
import database.projectx.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;

@Service 
@Slf4j 
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final DefaultOAuth2UserService delegate = new DefaultOAuth2UserService();
    private final UserRepository userRepository;
    private final UserEmailsRepository userEmailsRepository;
    private final OAuthAccountsRepository oAuthAccountsRepository;

    public CustomOAuth2UserService (
        UserRepository userRepository,
        UserEmailsRepository userEmailsRepository,
        OAuthAccountsRepository oAuthAccountsRepository
    ) {
        this.userRepository = userRepository;
        this.userEmailsRepository = userEmailsRepository;
        this.oAuthAccountsRepository = oAuthAccountsRepository;
    }

    @Override 
    @Transactional 
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = delegate.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        String nameKey = getNameKey(registrationId);

        String porviderUserId = String.valueOf(oAuth2User.getAttributes().get(nameKey));

        String email = (String) oAuth2User.getAttributes().get("email");
        String name = (String) oAuth2User.getAttributes().get("name");

        if (email == null || email.isBlank()) {
            throw new OAuth2AuthenticationException("Email not found");
        }

        Optional<OAuthAccounts> existingOAuth = oAuthAccountsRepository.findByProviderAndProviderUserId(registrationId, porviderUserId);
        User user;

        if(existingOAuth.isPresent()) {
            user = existingOAuth.get().getUser();
            log.info("OAuth login: existing link provider provider={}, user_id={}", registrationId, user.getId());
        } else{
            //Тут можно сделать проверку что только верефицированные почты но пока это не надо
            Optional<UserEmails> existingEmail = userEmailsRepository.findByEmail(email);
            if (existingEmail.isPresent()) {
                user = existingEmail.get().getUser();
            }  else {
                user = new User();

                user.setDisplayName(name != null ? name : email.split("@")[0]);
                user = userRepository.save(user);

                if (email != null) {
                    UserEmails userEmails = new UserEmails();
                    userEmails.setUser(user);
                    userEmails.setEmail(email);
                    userEmails.setIsVerified(true);
                    userEmailsRepository.save(userEmails);
                    log.info("OAuth login: created new user, user_id={}", user.getId());
                }
            }

            OAuthAccounts accounts = new OAuthAccounts();
            accounts.setUser(user);
            accounts.setProvider(registrationId);
            accounts.setProviderUserId(porviderUserId);
            oAuthAccountsRepository.save(accounts);
        }
        return new DefaultOAuth2User(oAuth2User.getAuthorities(), oAuth2User.getAttributes(), nameKey);
    }

    private String getNameKey(String provider) {
        return switch (provider) {
            case "google" -> "sub";
            case "github" -> "id";
            default -> "sub";
        };
    }
}
