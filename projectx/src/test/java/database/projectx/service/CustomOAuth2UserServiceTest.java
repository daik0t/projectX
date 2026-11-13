package database.projectx.service;

import database.projectx.dto.OAuthUserInfo;
import database.projectx.handler.OAuth2ProviderHandler;
import database.projectx.model.OAuthAccounts;
import database.projectx.model.User;
import database.projectx.repository.OAuthAccountsRepository;
import database.projectx.repository.UserEmailsRepository;
import database.projectx.repository.UserRepository;
import database.projectx.resolver.OAuth2ProviderHandlerResolver;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomOAuth2UserServiceTest {

    @Mock private OAuth2ProviderHandlerResolver resolver;
    @Mock private UserRepository userRepository;
    @Mock private UserEmailsRepository userEmailsRepository;
    @Mock private OAuthAccountsRepository oauthAccountsRepository;
    
    @Mock private DefaultOAuth2UserService delegate; 

    @InjectMocks private CustomOAuth2UserService oauthService;

    @Test
    void loadUser_whenExistingLink_shouldReturnExistingUser() {
        OAuth2UserRequest request = mock(OAuth2UserRequest.class);
        OAuth2User oauthUser = new DefaultOAuth2User(Collections.emptyList(), Map.of("id", "123"), "id");
        OAuthUserInfo info = new OAuthUserInfo("github", "123", "test@test.com", true, "alice");
        
        User existingUser = new User(); existingUser.setId(1L);
        OAuthAccounts link = new OAuthAccounts(); link.setUser(existingUser);

        when(request.getClientRegistration()).thenReturn(mock(org.springframework.security.oauth2.client.registration.ClientRegistration.class));
        when(delegate.loadUser(request)).thenReturn(oauthUser);
        
        when(resolver.resolve(any())).thenReturn(mock(OAuth2ProviderHandler.class));
        when(resolver.resolve(any()).extract(oauthUser)).thenReturn(info);
        
        when(oauthAccountsRepository.findByProviderAndProviderUserId("github", "123"))
                .thenReturn(Optional.of(link));

        OAuth2User result = oauthService.loadUser(request);

        assertThat(result.getAttributes().get("_app_user_id")).isEqualTo(1L);
        verify(userRepository, never()).save(any());
    }
}