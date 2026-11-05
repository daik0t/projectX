package database.projectx.repository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

import database.projectx.model.Tags;
import database.projectx.model.User;
import database.projectx.model.VideoTag;
import database.projectx.model.Videos;
import jakarta.persistence.EntityManager;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

@DataJpaTest 
public class VideoTagRepositoryTest {

    @Autowired 
    private VideoTagRepository videoTagRepository;

    @Autowired 
    private EntityManager entityManager;

    private User user1;
    private Videos video1;
    private Videos video2;
    private Tags tag1;
    private Tags tag2;
    private VideoTag videoTag1;
    private VideoTag videoTag2;

    @BeforeEach 
    void setUp(){
        user1 = new User();
        user1.setDisplayName("user1");
        user1.setCreatedAt(LocalDateTime.now());
        entityManager.persist(user1);

        video1 = new Videos();
        video1.setUrl("https://rickroll");
        video1.setUser(user1);
        entityManager.persist(video1);
        
        video2 = new Videos();
        video2.setUrl("https://rickroll");
        video2.setUser(user1);
        entityManager.persist(video2);
        
        tag1 = new Tags();
        tag1.setName("joke");
        tag1.setUser(user1);
        entityManager.persist(tag1);

        tag2 = new Tags();
        tag2.setName("not joke");
        tag2.setUser(user1);
        entityManager.persist(tag2);

        videoTag1 = new VideoTag();
        videoTag1.setVideo(video1);
        videoTag1.setTag(tag1);
        entityManager.persist(videoTag1);

        videoTag2 = new VideoTag();
        videoTag2.setVideo(video2);
        videoTag2.setTag(tag2);
        entityManager.persist(videoTag2);

        entityManager.flush();
    }

    @Test 
    void findAllByVideoIdsWithTags_shouldReturnListVideoTags(){
        List<VideoTag> result = videoTagRepository.findAllByVideoIdsWithTags(List.of(video1.getId()));

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getVideo()).isEqualTo(video1);
        assertThat(result.get(0).getTag()).isEqualTo(tag1);
    }

    @Test 
    void deleteByVideoId_videoShouldBeDeleted(){
        List<VideoTag> result = videoTagRepository.findAll();
        
        assertThat(result).hasSize(2);
        
        videoTagRepository.deleteByVideoId(video1.getId());
        result = videoTagRepository.findAll();
        
        assertThat(result).hasSize(1);
    }


}
