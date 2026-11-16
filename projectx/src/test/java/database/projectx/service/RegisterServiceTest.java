package database.projectx.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import database.projectx.dto.RegisterRequest;
import database.projectx.dto.UserResponse;
import database.projectx.exception.DuplicateResourceException;
import database.projectx.model.PasswordCredentials;
import database.projectx.model.User;
import database.projectx.model.UserEmails;
import database.projectx.repository.PasswordCredentialsRepository;
import database.projectx.repository.UserEmailsRepository;
import database.projectx.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class RegisterServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private UserEmailsRepository userEmailsRepository;
    @Mock private PasswordCredentialsRepository passwordCredentialsRepository;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks private RegisterService registerService;

    @Test
    void register_whenDisplayNameTaken_shouldThrowException() {
        when(userRepository.existsByDisplayName("alice")).thenReturn(true);

        assertThatThrownBy(() -> registerService.register(new RegisterRequest("alice", "alice@test.com", "password123")))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("displayName");

        verify(userRepository, never()).save(any());
        verify(userEmailsRepository, never()).save(any());
        verify(passwordCredentialsRepository, never()).save(any());
    }

    @Test
    void register_whenEmailTaken_shouldThrowException() {
        when(userRepository.existsByDisplayName("alice")).thenReturn(false);
        when(userEmailsRepository.existsByEmail("alice@test.com")).thenReturn(true);

        assertThatThrownBy(() -> registerService.register(new RegisterRequest("alice", "alice@test.com", "password123")))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("email");

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_whenNew_shouldCreateUserEmailAndPassword() {
        when(userRepository.existsByDisplayName("alice")).thenReturn(false);
        when(userEmailsRepository.existsByEmail("alice@test.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded-hash");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });
        when(userEmailsRepository.save(any(UserEmails.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(passwordCredentialsRepository.save(any(PasswordCredentials.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = registerService.register(new RegisterRequest("alice", "alice@test.com", "password123"));

        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.displayName()).isEqualTo("alice");
        assertThat(response.email()).isEqualTo("alice@test.com");
        assertThat(response.emailVerified()).isFalse();

        verify(passwordEncoder).encode("password123");
        verify(userEmailsRepository).save(argThat(userEmail ->
                "alice@test.com".equals(userEmail.getEmail())
                        && Boolean.FALSE.equals(userEmail.getIsVerified())
                        && userEmail.getUser() != null));
        verify(passwordCredentialsRepository).save(argThat(credentials ->
                "encoded-hash".equals(credentials.getPasswordHash()) && credentials.getUser() != null));
    }
}
