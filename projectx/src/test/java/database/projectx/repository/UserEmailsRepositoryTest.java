package database.projectx.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;

import database.projectx.model.User;
import database.projectx.model.UserEmails;
import jakarta.persistence.EntityManager;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
public class UserEmailsRepositoryTest {

    @Autowired
    private UserEmailsRepository userEmailsRepository;

    @Autowired
    private EntityManager entityManager;

    private User user1;
    private User user2;
    private User user3;
    private UserEmails email1;
    private UserEmails email2;

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

        email1 = new UserEmails();
        email1.setUser(user1);
        email1.setEmail("user1@example.com");
        email1.setIsVerified(true);
        entityManager.persist(email1);

        email2 = new UserEmails();
        email2.setUser(user2);
        email2.setEmail("user2@example.com");
        email2.setIsVerified(false);
        entityManager.persist(email2);

        entityManager.flush();
    }

    @Test
    void findByUserId_whenExists_shouldReturnUserEmail() {
        Optional<UserEmails> result = userEmailsRepository.findByUserId(user1.getId());

        assertThat(result).isPresent();
        assertThat(result.get().getEmail()).isEqualTo("user1@example.com");
    }

    @Test
    void findByUserId_whenNotExists_shouldReturnEmpty() {
        Optional<UserEmails> result = userEmailsRepository.findByUserId(user3.getId());

        assertThat(result).isEmpty();
    }

    @Test
    void findByEmail_whenExists_shouldReturnUserEmail() {
        Optional<UserEmails> result = userEmailsRepository.findByEmail("user1@example.com");

        assertThat(result).isPresent();
        assertThat(result.get().getUser().getId()).isEqualTo(user1.getId());
    }

    @Test
    void findByEmail_whenNotExists_shouldReturnEmpty() {
        Optional<UserEmails> result = userEmailsRepository.findByEmail("unknown@example.com");

        assertThat(result).isEmpty();
    }

    @Test
    void existsByEmail_whenExists_shouldReturnTrue() {
        boolean exists = userEmailsRepository.existsByEmail("user1@example.com");

        assertThat(exists).isTrue();
    }

    @Test
    void existsByEmail_whenNotExists_shouldReturnFalse() {
        boolean exists = userEmailsRepository.existsByEmail("unknown@example.com");

        assertThat(exists).isFalse();
    }
}