package database.projectx.repository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

import database.projectx.model.Tags;
import database.projectx.model.User;
import jakarta.persistence.EntityManager;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

@DataJpaTest 
public class TagsRepositoryTest {
    @Autowired 
    private TagsRepository tagsRepository;

    @Autowired 
    private EntityManager entityManager;

    private Tags globalTag1;
    private Tags globalTag2;
    private Tags globalTag3;
    private Tags user1Tag1;
    private User user1;
    private User user2;

    @BeforeEach 
    void setUp(){
        user1 = new User();
        user1.setDisplayName("user1");
        user1.setCreatedAt(LocalDateTime.now());
        entityManager.persist(user1);

        user2 = new User();
        user2.setDisplayName("user2");
        user2.setCreatedAt(LocalDateTime.now());
        entityManager.persist(user2);

        globalTag1 = new Tags();
        globalTag1.setName("global1");
        globalTag1.setUser(null);
        entityManager.persist(globalTag1);

        globalTag2 = new Tags();
        globalTag2.setName("global2");
        globalTag2.setUser(null);
        entityManager.persist(globalTag2);
        
        globalTag3 = new Tags();
        globalTag3.setName("global3");
        globalTag3.setUser(null);
        entityManager.persist(globalTag3);

        user1Tag1 = new Tags();
        user1Tag1.setName("rickroll");
        user1Tag1.setUser(user1);
        entityManager.persist(user1Tag1);

        entityManager.flush();
    }

    @Test 
    void findByUserId_withoutOwner_shouldReturnListOf3(){
        List<Tags> result = tagsRepository.findByUserId(null);

        assertThat(result).hasSize(3);
    }

    @Test 
    void findByUserId_withOwner_shouldReturnListOf3(){
        List<Tags> result = tagsRepository.findByUserId(user1.getId());
        
        assertThat(result).hasSize(1);
    }

    @Test
    void findUserAndGlobalTags_shouldReturnListOf4(){
        List<Tags> result = tagsRepository.findUserAndGlobalTags(user1.getId());

        assertThat(result).hasSize(4);
    }

    @Test 
    void findAllByIdsForUserOrGlobal_forGlobalTag_shouldReturnListOfGlobalTags(){
        List<Tags> result = tagsRepository.findAllByIdsForUserOrGlobal(Set.of(globalTag2.getId()), user2.getId());

        assertThat(result).hasSize(1);
        assertThat(result.get(0)).isEqualTo(globalTag2);
    }

    @Test 
    void findAllByIdsForUserOrGlobal_forUserTag_shouldReturnEmptyList(){
        List<Tags> result = tagsRepository.findAllByIdsForUserOrGlobal(Set.of(user1Tag1.getId()), user2.getId());

        assertThat(result).hasSize(0);
    }

    @Test 
    void findByNameForUserOrGlobal_forUser_shouldReturnUser1Tag1(){
        Optional<Tags> result = tagsRepository.findByNameForUserOrGlobal("rickroll", user1.getId()).stream().findFirst();

        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("rickroll");
    }

    @Test 
    void findByIdAndUserId_whenNotOwner_shouldReturnEmpty (){
        Optional<Tags> result = tagsRepository.findByIdAndUserId(user1Tag1.getId(), user2.getId());

        assertThat(result).isEmpty();
    }

    @Test 
    void findByIdAndUserId_whenNotOwner_shouldReturnTag(){
        Optional<Tags> result = tagsRepository.findByIdAndUserId(user1Tag1.getId(), user1.getId());

        assertThat(result).isPresent();
        assertThat(result.get()).isEqualTo(user1Tag1);
    }
}
