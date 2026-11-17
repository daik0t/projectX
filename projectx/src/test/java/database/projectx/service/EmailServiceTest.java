package database.projectx.service;

import static org.assertj.core.api.Assertions.assertThatCode;

import org.junit.jupiter.api.Test;

class EmailServiceTest {

    private final EmailService emailService = new EmailService();

    @Test
    void sendPasswordResetEmail_shouldNotThrow() {
        // Пока письма не отправляются по-настоящему (TODO в сервисе),
        // контракт метода — просто не падать на корректных входных данных.
        assertThatCode(() -> emailService.sendPasswordResetEmail(
                "alice@test.com",
                "http://localhost:5173/reset-password?token=raw-token"))
                .doesNotThrowAnyException();
    }

    @Test
    void sendPasswordResetEmail_whenArgumentsAreNull_shouldNotThrow() {
        assertThatCode(() -> emailService.sendPasswordResetEmail(null, null))
                .doesNotThrowAnyException();
    }
}
