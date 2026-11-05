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
import jakarta.persistence.EntityManager;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
public class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EntityManager entityManager;

    private User user1;
    private User user2;

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

        entityManager.flush();
    }

    @Test
    void findByDisplayName_whenExists_shouldReturnUser() {
        Optional<User> result = userRepository.findByDisplayName("user1");

        assertThat(result).isPresent();
        assertThat(result.get().getDisplayName()).isEqualTo("user1");
    }

    @Test
    void findByDisplayName_whenNotExists_shouldReturnEmpty() {
        Optional<User> result = userRepository.findByDisplayName("unknown");

        assertThat(result).isEmpty();
    }

    @Test
    void existsByDisplayName_whenExists_shouldReturnTrue() {
        boolean exists = userRepository.existsByDisplayName("user1");

        assertThat(exists).isTrue();
    }

    @Test
    void existsByDisplayName_whenNotExists_shouldReturnFalse() {
        boolean exists = userRepository.existsByDisplayName("unknown");

        assertThat(exists).isFalse();
    }
}