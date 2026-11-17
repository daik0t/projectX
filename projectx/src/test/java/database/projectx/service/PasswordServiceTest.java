package database.projectx.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import database.projectx.dto.ResetPasswordRequest;
import database.projectx.exception.BadRequestException;
import database.projectx.model.PasswordCredentials;
import database.projectx.model.User;
import database.projectx.model.UserEmails;
import database.projectx.repository.PasswordCredentialsRepository;
import database.projectx.repository.UserEmailsRepository;

@ExtendWith(MockitoExtension.class)
class PasswordServiceTest {

    private static final String FRONTEND_URL = "http://localhost:5173";

    @Mock private PasswordResetService passwordResetService;
    @Mock private EmailService emailService;
    @Mock private UserEmailsRepository userEmailsRepository;
    @Mock private PasswordCredentialsRepository passwordCredentialsRepository;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks private PasswordService passwordService;

    @BeforeEach
    void setUp() {
        // frontendUrl приходит из @Value, в юнит-тесте контекста нет — подставляем вручную.
        ReflectionTestUtils.setField(passwordService, "frontendUrl", FRONTEND_URL);
    }

    @Test
    void requestPasswordReset_whenEmailExists_shouldCreateTokenAndSendEmail() {
        User user = user();
        UserEmails email = email(user);
        when(userEmailsRepository.findByEmail("alice@test.com")).thenReturn(Optional.of(email));
        when(passwordResetService.createResetToken(user)).thenReturn("raw-token");

        passwordService.requestPasswordReset("alice@test.com");

        verify(passwordResetService).createResetToken(user);
        verify(emailService).sendPasswordResetEmail(
                "alice@test.com",
                FRONTEND_URL + "/reset-password?token=raw-token");
    }

    @Test
    void requestPasswordReset_whenEmailUnknown_shouldDoNothing() {
        when(userEmailsRepository.findByEmail("unknown@test.com")).thenReturn(Optional.empty());

        passwordService.requestPasswordReset("unknown@test.com");

        verifyNoInteractions(passwordResetService, emailService);
    }

    @Test
    void resetPassword_whenCredentialsExist_shouldUpdateHash() {
        User user = user();
        PasswordCredentials credentials = new PasswordCredentials();
        credentials.setUser(user);
        credentials.setPasswordHash("old-hash");

        when(passwordResetService.validAndConsumeToken("raw-token")).thenReturn(user);
        when(passwordCredentialsRepository.findByUserId(1L)).thenReturn(Optional.of(credentials));
        when(passwordEncoder.encode("newPassword123")).thenReturn("new-hash");

        passwordService.resetPassword(new ResetPasswordRequest("raw-token", "newPassword123"));

        assertThat(credentials.getPasswordHash()).isEqualTo("new-hash");
        verify(passwordCredentialsRepository).save(credentials);
    }

    @Test
    void resetPassword_whenCredentialsMissing_shouldCreateNewCredentials() {
        User user = user();
        when(passwordResetService.validAndConsumeToken("raw-token")).thenReturn(user);
        when(passwordCredentialsRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(passwordEncoder.encode("newPassword123")).thenReturn("new-hash");

        passwordService.resetPassword(new ResetPasswordRequest("raw-token", "newPassword123"));

        verify(passwordCredentialsRepository).save(argThat(credentials ->
                credentials.getUser() == user && "new-hash".equals(credentials.getPasswordHash())));
    }

    @Test
    void resetPassword_whenTokenInvalid_shouldNotSaveAnything() {
        when(passwordResetService.validAndConsumeToken("bad-token"))
                .thenThrow(new BadRequestException("Ссылка уже использована"));

        assertThatThrownBy(() -> passwordService.resetPassword(new ResetPasswordRequest("bad-token", "newPassword123")))
                .isInstanceOf(BadRequestException.class);

        verify(passwordCredentialsRepository, never()).save(any());
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
