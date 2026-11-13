package database.projectx.service;

import database.projectx.exception.BadRequestException;
import database.projectx.model.PasswordResetTokens;
import database.projectx.model.User;
import database.projectx.repository.PasswordResetTokenRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock private PasswordResetTokenRepository tokenRepository;
    @InjectMocks private PasswordResetService passwordResetService;

    @Test
    void createResetToken_shouldSaveHashedToken() {
        User user = new User();
        passwordResetService.createResetToken(user);
        
        verify(tokenRepository).save(any(PasswordResetTokens.class));
    }

    @Test
    void validateAndConsumeToken_whenValid_shouldReturnUser() {
        User user = new User();
        PasswordResetTokens token = new PasswordResetTokens();
        token.setUser(user);
        token.setExpiresAt(LocalDateTime.now().plusMinutes(10)); 
        
        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(token));
        when(tokenRepository.markUsed(anyString(), any())).thenReturn(1);

        User result = passwordResetService.validAndConsumeToken("rawToken");

        assertThat(result).isEqualTo(user);
        verify(tokenRepository).markUsed(anyString(), any());
    }

    @Test
    void validateAndConsumeToken_whenExpired_shouldThrowException() {
        PasswordResetTokens token = new PasswordResetTokens();
        token.setExpiresAt(LocalDateTime.now().minusMinutes(5));
        
        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> passwordResetService.validAndConsumeToken("rawToken"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Срок действия ссылки истёк");
    }
}