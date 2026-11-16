package database.projectx.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import database.projectx.dto.AuthResponse;
import database.projectx.dto.LoginRequest;
import database.projectx.exception.InvalidCredentialsException;
import database.projectx.model.User;
import database.projectx.model.UserEmails;
import database.projectx.repository.UserEmailsRepository;
import database.projectx.repository.UserRepository;
import database.projectx.security.CustomUserDetails;

@ExtendWith(MockitoExtension.class)
class LoginServiceTest {

    @Mock private UserEmailsRepository userEmailsRepository;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private UserRepository userRepository;
    @Mock private JWTService jwtService;

    @InjectMocks private LoginService loginService;

    @Test
    void login_whenCredentialsValid_shouldReturnTokenAndUser() {
        User user = user();
        UserEmails email = email(user);
        CustomUserDetails principal = CustomUserDetails.from(user, "alice@test.com", "hash", true);

        Authentication authentication = mock(Authentication.class);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(principal);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userEmailsRepository.findByEmail("alice@test.com")).thenReturn(Optional.of(email));
        when(jwtService.generateToken(principal)).thenReturn("jwt-token");

        AuthResponse response = loginService.login(new LoginRequest("alice@test.com", "password123"));

        assertThat(response.accessToken()).isEqualTo("jwt-token");
        assertThat(response.tokenType()).isEqualTo("Bearer");
        assertThat(response.expiresIn()).isEqualTo(86400L);
        assertThat(response.user().id()).isEqualTo(1L);
        assertThat(response.user().displayName()).isEqualTo("alice");
        assertThat(response.user().email()).isEqualTo("alice@test.com");
        assertThat(response.user().emailVerified()).isTrue();
    }

    @Test
    void login_whenCredentialsInvalid_shouldThrowException() {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("bad credentials"));

        assertThatThrownBy(() -> loginService.login(new LoginRequest("alice@test.com", "wrong-password")))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessage("Неверный email или пароль");

        verify(jwtService, never()).generateToken(any());
    }

    @Test
    void login_whenUserMissingAfterAuthentication_shouldThrowException() {
        User user = user();
        CustomUserDetails principal = CustomUserDetails.from(user, "alice@test.com", "hash", true);

        Authentication authentication = mock(Authentication.class);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(principal);
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> loginService.login(new LoginRequest("alice@test.com", "password123")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Пользователь не найден");

        verify(jwtService, never()).generateToken(any());
    }

    @Test
    void login_whenEmailMissingAfterAuthentication_shouldThrowException() {
        User user = user();
        CustomUserDetails principal = CustomUserDetails.from(user, "alice@test.com", "hash", true);

        Authentication authentication = mock(Authentication.class);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(principal);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userEmailsRepository.findByEmail("alice@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> loginService.login(new LoginRequest("alice@test.com", "password123")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Email не найден");

        verify(jwtService, never()).generateToken(any());
    }

    private static User user() {
        User user = new User();
        user.setId(1L);
        user.setDisplayName("alice");
        return user;
    }

    private static UserEmails email(User user) {
        UserEmails email = new UserEmails();
        email.setEmail("alice@test.com");
        email.setUser(user);
        email.setIsVerified(true);
        return email;
    }
}
