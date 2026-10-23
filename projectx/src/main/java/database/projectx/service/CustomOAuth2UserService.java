package database.projectx.service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import database.projectx.dto.OAuthUserInfo;
import database.projectx.handler.OAuth2ProviderHandler;
import database.projectx.model.OAuthAccounts;
import database.projectx.model.User;
import database.projectx.model.UserEmails;
import database.projectx.repository.OAuthAccountsRepository;
import database.projectx.repository.UserEmailsRepository;
import database.projectx.repository.UserRepository;
import database.projectx.resolver.OAuth2ProviderHandlerResolver;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;

@Service 
@Slf4j 
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final DefaultOAuth2UserService delegate = new DefaultOAuth2UserService();

    private final OAuth2ProviderHandlerResolver resolver;
    private final UserRepository userRepository;
    private final UserEmailsRepository userEmailsRepository;
    private final OAuthAccountsRepository oAuthAccountsRepository;

    public CustomOAuth2UserService (
        OAuth2ProviderHandlerResolver resolver,
        UserRepository userRepository,
        UserEmailsRepository userEmailsRepository,
        OAuthAccountsRepository oAuthAccountsRepository
    ) {
        this.resolver = resolver;
        this.userRepository = userRepository;
        this.userEmailsRepository = userEmailsRepository;
        this.oAuthAccountsRepository = oAuthAccountsRepository;
    }

    @Override 
    @Transactional 
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        
        OAuth2User oAuth2User = delegate.loadUser(userRequest);

        String provider = userRequest.getClientRegistration().getRegistrationId();

        OAuth2ProviderHandler handler = resolver.resolve(provider);

        OAuthUserInfo userInfo = handler.extract(oAuth2User);

        String email = userInfo.email();
        boolean isEmailVerified = userInfo.isEmailVerified();

        if (email == null || email.isBlank()) {
            log.warn("OAuth: provider={} didn't return email", provider);
        }

        Optional<OAuthAccounts> existingOAuth = oAuthAccountsRepository.findByProviderAndProviderUserId(provider, userInfo.providerUserId());

        if (existingOAuth.isPresent()){
            User user = existingOAuth.get().getUser();
            log.info("OAuth: existing link, provider={}, user_id={}", provider, user.getId());
            return buildOAuth2User(oAuth2User, user, handler.getNameAttributeKey());
        }

        Optional<UserEmails> existingEmail = userEmailsRepository.findByEmail(email);
        if (existingEmail.isPresent()){
            User user = existingEmail.get().getUser();

            OAuthAccounts link = new OAuthAccounts();
            link.setUser(user);
            link.setProvider(provider);
            link.setProviderUserId(userInfo.providerUserId());
            oAuthAccountsRepository.save(link);
            log.info("OAuth: linked by email to user_id={}, provider={}", user.getId(), provider);

            return buildOAuth2User(oAuth2User, user, handler.getNameAttributeKey());
        }

        String displayName = userInfo.name();

        User user = new User();
        user.setDisplayName(displayName);
        user = userRepository.save(user);

        UserEmails userEmails = new UserEmails();
        userEmails.setEmail(email);
        userEmails.setUser(user);
        userEmails.setIsVerified(isEmailVerified);
        userEmailsRepository.save(userEmails);

        OAuthAccounts link = new OAuthAccounts();
        link.setUser(user);
        link.setProvider(provider);
        link.setProviderUserId(userInfo.providerUserId());
        oAuthAccountsRepository.save(link);

        log.info("OAuth: created new user, user_id={}, provider={}, displayName={}",
                user.getId(), provider, displayName);

        return buildOAuth2User(oAuth2User, user, handler.getNameAttributeKey());
    }

    private OAuth2User buildOAuth2User(OAuth2User original, User user, String nameKey){
        Map<String, Object> attrs = new HashMap<>(original.getAttributes());
        attrs.put("_app_user_id", user.getId());
        return new DefaultOAuth2User(original.getAuthorities(), attrs, nameKey);
    }
}
