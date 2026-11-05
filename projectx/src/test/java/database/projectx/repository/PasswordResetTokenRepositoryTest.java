package database.projectx.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;

import database.projectx.model.PasswordResetTokens;
import database.projectx.model.User;
import jakarta.persistence.EntityManager;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
public class PasswordResetTokenRepositoryTest {

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private EntityManager entityManager;

    private User user1;
    private PasswordResetTokens token1;
    private PasswordResetTokens token2;
    private PasswordResetTokens token3;

    @BeforeEach
    void setUp() {
        user1 = new User();
        user1.setDisplayName("user1");
        user1.setCreatedAt(LocalDateTime.now());
        entityManager.persist(user1);

        LocalDateTime now = LocalDateTime.now();

        token1 = new PasswordResetTokens();
        token1.setUser(user1);
        token1.setTokenHash("hash1");
        token1.setUsedAt(null);
        token1.setExpiresAt(now.plusHours(1));
        entityManager.persist(token1);

        token2 = new PasswordResetTokens();
        token2.setUser(user1);
        token2.setTokenHash("hash2");
        token2.setUsedAt(null);
        token2.setExpiresAt(now.plusHours(1));
        entityManager.persist(token2);

        token3 = new PasswordResetTokens();
        token3.setUser(user1);
        token3.setTokenHash("hash3");
        token3.setUsedAt(now.minusHours(1));
        token3.setExpiresAt(now.plusHours(1));
        entityManager.persist(token3);

        entityManager.flush();
    }

    @Test
    void findByTokenHash_whenExists_shouldReturnToken() {
        Optional<PasswordResetTokens> result = passwordResetTokenRepository.findByTokenHash("hash1");

        assertThat(result).isPresent();
        assertThat(result.get().getTokenHash()).isEqualTo("hash1");
        assertThat(result.get().getUsedAt()).isNull();
    }

    @Test
    void findByTokenHash_whenNotExists_shouldReturnEmpty() {
        Optional<PasswordResetTokens> result = passwordResetTokenRepository.findByTokenHash("unknown");

        assertThat(result).isEmpty();
    }

    @Test
    void markUsed_whenTokenUnused_shouldUpdateUsedAtAndReturn1() {
        LocalDateTime now = LocalDateTime.now();
        int updated = passwordResetTokenRepository.markUsed("hash1", now);

        assertThat(updated).isEqualTo(1);

        entityManager.flush();
        entityManager.clear();

        Optional<PasswordResetTokens> result = passwordResetTokenRepository.findByTokenHash("hash1");
        assertThat(result).isPresent();
    }

    @Test
    void markUsed_whenTokenAlreadyUsed_shouldReturn0() {
        LocalDateTime now = LocalDateTime.now();
        int updated = passwordResetTokenRepository.markUsed("hash3", now);

        assertThat(updated).isEqualTo(0);
    }

    @Test
    void markUsed_whenTokenNotFound_shouldReturn0() {
        LocalDateTime now = LocalDateTime.now();
        int updated = passwordResetTokenRepository.markUsed("unknown", now);

        assertThat(updated).isEqualTo(0);
    }
}