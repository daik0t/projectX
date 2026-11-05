package database.projectx.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;

import database.projectx.model.PasswordCredentials;
import database.projectx.model.User;
import jakarta.persistence.EntityManager;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
public class PasswordCredentialsRepositoryTest {

    @Autowired
    private PasswordCredentialsRepository passwordCredentialsRepository;

    @Autowired
    private EntityManager entityManager;

    private User user1;
    private User user2;
    private User user3;
    private PasswordCredentials cred1;
    private PasswordCredentials cred2;

    @BeforeEach
    void setUp() {
        user1 = new User();
        user1.setDisplayName("user1");
        user1.setCreatedAt(LocalDateTime.now());
        entityManager.persist(user1);

        user2 = new User();
        user2.setDisplayName("user2");
        user2.setCreatedAt(LocalDateTime.now());
        entityManager.persist(user2);

        user3 = new User();
        user3.setDisplayName("user3");
        user3.setCreatedAt(LocalDateTime.now());
        entityManager.persist(user3);

        cred1 = new PasswordCredentials();
        cred1.setUser(user1);
        cred1.setPasswordHash("hash1");
        entityManager.persist(cred1);

        cred2 = new PasswordCredentials();
        cred2.setUser(user2);
        cred2.setPasswordHash("hash2");
        entityManager.persist(cred2);

        entityManager.flush();
    }

    @Test
    void findByUserId_whenExists_shouldReturnPasswordCredentials() {
        Optional<PasswordCredentials> result = passwordCredentialsRepository.findByUserId(user1.getId());

        assertThat(result).isPresent();
        assertThat(result.get().getPasswordHash()).isEqualTo("hash1");
    }

    @Test
    void findByUserId_whenNotExists_shouldReturnEmpty() {
        Optional<PasswordCredentials> result = passwordCredentialsRepository.findByUserId(user3.getId());

        assertThat(result).isEmpty();
    }
}