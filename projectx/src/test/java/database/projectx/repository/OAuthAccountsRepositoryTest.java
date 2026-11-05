package database.projectx.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;

import database.projectx.model.OAuthAccounts;
import database.projectx.model.User;
import jakarta.persistence.EntityManager;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
public class OAuthAccountsRepositoryTest {

    @Autowired
    private OAuthAccountsRepository oauthAccountsRepository;

    @Autowired
    private EntityManager entityManager;

    private User user1;
    private User user2;
    private User user3;
    private OAuthAccounts oauth1;
    private OAuthAccounts oauth2;

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

        oauth1 = new OAuthAccounts();
        oauth1.setUser(user1);
        oauth1.setProvider("google");
        oauth1.setProviderUserId("123");
        entityManager.persist(oauth1);

        oauth2 = new OAuthAccounts();
        oauth2.setUser(user2);
        oauth2.setProvider("github");
        oauth2.setProviderUserId("456");
        entityManager.persist(oauth2);

        entityManager.flush();
    }

    @Test
    void findByUserId_whenExists_shouldReturnOAuthAccount() {
        Optional<OAuthAccounts> result = oauthAccountsRepository.findByUserId(user1.getId());

        assertThat(result).isPresent();
        assertThat(result.get().getProvider()).isEqualTo("google");
        assertThat(result.get().getProviderUserId()).isEqualTo("123");
    }

    @Test
    void findByUserId_whenNotExists_shouldReturnEmpty() {
        Optional<OAuthAccounts> result = oauthAccountsRepository.findByUserId(user3.getId());

        assertThat(result).isEmpty();
    }

    @Test
    void findByProviderAndProviderUserId_whenExists_shouldReturnOAuthAccount() {
        Optional<OAuthAccounts> result = oauthAccountsRepository
                .findByProviderAndProviderUserId("google", "123");

        assertThat(result).isPresent();
        assertThat(result.get().getUser().getId()).isEqualTo(user1.getId());
    }

    @Test
    void findByProviderAndProviderUserId_whenNotExists_shouldReturnEmpty() {
        Optional<OAuthAccounts> result = oauthAccountsRepository
                .findByProviderAndProviderUserId("google", "999");

        assertThat(result).isEmpty();
    }
}