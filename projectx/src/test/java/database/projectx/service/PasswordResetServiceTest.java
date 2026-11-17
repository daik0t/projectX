package database.projectx.service;

import database.projectx.exception.BadRequestException;
import database.projectx.model.PasswordResetTokens;
import database.projectx.model.User;
import database.projectx.repository.PasswordResetTokenRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
        String rawToken = passwordResetService.createResetToken(user);

        ArgumentCaptor<PasswordResetTokens> captor = ArgumentCaptor.forClass(PasswordResetTokens.class);
        verify(tokenRepository).save(captor.capture());
        PasswordResetTokens saved = captor.getValue();

        assertThat(rawToken).isNotBlank();
        assertThat(saved.getUser()).isEqualTo(user);
        // В БД хранится SHA-256 (64 hex-символа), а не сам токен
        assertThat(saved.getTokenHash()).hasSize(64).isNotEqualTo(rawToken);
        assertThat(saved.getExpiresAt()).isAfter(LocalDateTime.now().plusMinutes(14));
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

        // Полный текст сообщения в основном коде содержит опечатку
        // ("Срок действия сслыки истек"), поэтому проверяем смысловую часть.
        assertThatThrownBy(() -> passwordResetService.validAndConsumeToken("rawToken"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Срок действия");
    }

    @Test
    void validateAndConsumeToken_whenTokenNotFound_shouldThrowException() {
        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> passwordResetService.validAndConsumeToken("rawToken"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Недействительная или просроченная ссылка");

        verify(tokenRepository, never()).markUsed(anyString(), any());
    }

    @Test
    void validateAndConsumeToken_whenAlreadyUsed_shouldThrowException() {
        PasswordResetTokens token = new PasswordResetTokens();
        token.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        token.setUsedAt(LocalDateTime.now().minusMinutes(1));

        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> passwordResetService.validAndConsumeToken("rawToken"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Ссылка уже использована");

        verify(tokenRepository, never()).markUsed(anyString(), any());
    }

    @Test
    void validateAndConsumeToken_whenConcurrentUseWonTheRace_shouldThrowException() {
        PasswordResetTokens token = new PasswordResetTokens();
        token.setExpiresAt(LocalDateTime.now().plusMinutes(10));

        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(token));
        when(tokenRepository.markUsed(anyString(), any())).thenReturn(0);

        assertThatThrownBy(() -> passwordResetService.validAndConsumeToken("rawToken"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Ссылка уже была использована");
    }
}