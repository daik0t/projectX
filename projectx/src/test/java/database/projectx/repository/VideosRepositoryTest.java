package database.projectx.repository;


import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;

import database.projectx.model.User;
import database.projectx.model.Videos;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest 
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
public class VideosRepositoryTest {

    @Autowired 
    private VideosRepository videosRepository;

    @Autowired 
    private TestEntityManager entityManager;

    private User user1;
    private User user2;
    private Videos video1;
    private Videos video2;
    
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

        video1 = new Videos();
        video1.setUrl("https://rickroll");
        video1.setUser(user1);
        entityManager.persist(video1);

        video2 = new Videos();
        video2.setUrl("https://not-rickroll");
        video2.setUser(user2);
        entityManager.persist(video2);

        entityManager.flush();
    }

    @Test 
    void findAllByUserIdOrderByIdDesc_shouldReturnOnlyUsersVideos(){
        List<Videos> result = videosRepository.findAllByUserIdOrderByIdDesc(user1.getId());

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getUrl()).isEqualTo("https://rickroll");
    }

    @Test 
    void findByIdAndUserId_whenOwner_shouldReturnVideo(){
        Optional<Videos> result = videosRepository.findByIdAndUserId(video1.getId(), user1.getId());

        assertThat(result).isPresent();
        assertThat(result.get().getUrl()).isEqualTo("https://rickroll");
    }

    @Test 
    void findByIdAndUserId_whenNotOwner_shouldReturnEmpty(){
        Optional<Videos> result = videosRepository.findByIdAndUserId(video1.getId(), user2.getId());

        assertThat(result).isEmpty();
    }


}
