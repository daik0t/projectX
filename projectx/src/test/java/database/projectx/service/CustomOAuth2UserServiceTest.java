package database.projectx.service;

import database.projectx.dto.OAuthUserInfo;
import database.projectx.handler.OAuth2ProviderHandler;
import database.projectx.model.OAuthAccounts;
import database.projectx.model.User;
import database.projectx.model.UserEmails;
import database.projectx.repository.OAuthAccountsRepository;
import database.projectx.repository.UserEmailsRepository;
import database.projectx.repository.UserRepository;
import database.projectx.resolver.OAuth2ProviderHandlerResolver;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomOAuth2UserServiceTest {

    @Mock private OAuth2ProviderHandlerResolver resolver;
    @Mock private UserRepository userRepository;
    @Mock private UserEmailsRepository userEmailsRepository;
    @Mock private OAuthAccountsRepository oauthAccountsRepository;
    
    @Mock private DefaultOAuth2UserService delegate; 

    @InjectMocks private CustomOAuth2UserService oauthService;

    @BeforeEach
    void injectDelegate() {
        // delegate — private final поле, инициализируемое прямо в сервисе,
        // поэтому @InjectMocks его не подставляет: внедряем мок вручную.
        ReflectionTestUtils.setField(oauthService, "delegate", delegate);
    }

    @Test
    void loadUser_whenExistingLink_shouldReturnExistingUser() {
        OAuth2UserRequest request = mock(OAuth2UserRequest.class);
        OAuth2User oauthUser = oauthUser();
        OAuthUserInfo info = new OAuthUserInfo("github", "123", "test@test.com", true, "alice");
        stubOAuthProvider(request, oauthUser, info);

        User existingUser = new User(); existingUser.setId(1L);
        OAuthAccounts link = new OAuthAccounts(); link.setUser(existingUser);

        when(oauthAccountsRepository.findByProviderAndProviderUserId("github", "123"))
                .thenReturn(Optional.of(link));

        OAuth2User result = oauthService.loadUser(request);

        assertThat(result.getAttributes().get("_app_user_id")).isEqualTo(1L);
        verify(userRepository, never()).save(any());
        verify(oauthAccountsRepository, never()).save(any());
    }

    @Test
    void loadUser_whenEmailAlreadyKnown_shouldLinkAccountToExistingUser() {
        OAuth2UserRequest request = mock(OAuth2UserRequest.class);
        OAuth2User oauthUser = oauthUser();
        OAuthUserInfo info = new OAuthUserInfo("github", "123", "known@test.com", true, "alice");
        stubOAuthProvider(request, oauthUser, info);

        User existingUser = new User(); existingUser.setId(5L);
        UserEmails knownEmail = new UserEmails();
        knownEmail.setEmail("known@test.com");
        knownEmail.setUser(existingUser);
        knownEmail.setIsVerified(true);

        when(oauthAccountsRepository.findByProviderAndProviderUserId("github", "123"))
                .thenReturn(Optional.empty());
        when(userEmailsRepository.findByEmail("known@test.com")).thenReturn(Optional.of(knownEmail));

        OAuth2User result = oauthService.loadUser(request);

        assertThat(result.getAttributes().get("_app_user_id")).isEqualTo(5L);
        verify(oauthAccountsRepository).save(argThat(link ->
                "github".equals(link.getProvider())
                        && "123".equals(link.getProviderUserId())
                        && link.getUser() == existingUser));
        verify(userRepository, never()).save(any());
    }

    @Test
    void loadUser_whenNothingKnown_shouldCreateUserEmailAndLink() {
        OAuth2UserRequest request = mock(OAuth2UserRequest.class);
        OAuth2User oauthUser = oauthUser();
        OAuthUserInfo info = new OAuthUserInfo("github", "123", "new@test.com", true, "bob");
        stubOAuthProvider(request, oauthUser, info);

        User savedUser = new User(); savedUser.setId(7L);

        when(oauthAccountsRepository.findByProviderAndProviderUserId("github", "123"))
                .thenReturn(Optional.empty());
        when(userEmailsRepository.findByEmail("new@test.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        OAuth2User result = oauthService.loadUser(request);

        assertThat(result.getAttributes().get("_app_user_id")).isEqualTo(7L);
        verify(userRepository).save(argThat(user -> "bob".equals(user.getDisplayName())));
        verify(userEmailsRepository).save(argThat(userEmail ->
                "new@test.com".equals(userEmail.getEmail())
                        && Boolean.TRUE.equals(userEmail.getIsVerified())
                        && userEmail.getUser() == savedUser));
        verify(oauthAccountsRepository).save(argThat(link ->
                "github".equals(link.getProvider())
                        && "123".equals(link.getProviderUserId())
                        && link.getUser() == savedUser));
    }

    private static OAuth2User oauthUser() {
        return new DefaultOAuth2User(Collections.emptyList(), Map.of("id", "123"), "id");
    }

    private void stubOAuthProvider(OAuth2UserRequest request, OAuth2User oauthUser, OAuthUserInfo info) {
        ClientRegistration registration = mock(ClientRegistration.class);
        when(registration.getRegistrationId()).thenReturn("github");
        when(request.getClientRegistration()).thenReturn(registration);

        OAuth2ProviderHandler handler = mock(OAuth2ProviderHandler.class);
        when(handler.extract(oauthUser)).thenReturn(info);
        when(handler.getNameAttributeKey()).thenReturn("id");
        when(resolver.resolve("github")).thenReturn(handler);

        when(delegate.loadUser(request)).thenReturn(oauthUser);
    }
}