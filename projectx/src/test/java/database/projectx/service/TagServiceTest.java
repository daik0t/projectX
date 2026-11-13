package database.projectx.service;

import database.projectx.model.Tags;
import database.projectx.repository.TagsRepository;
import database.projectx.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TagServiceTest {

    @Mock private TagsRepository tagsRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private TagService tagService;

    @Test
    void createOrGetTag_whenTagExists_shouldReturnExisting() {
        Long userId = 1L;
        String tagName = "gaming";
        
        Tags existingTag = new Tags();
        existingTag.setId(10L);
        existingTag.setName(tagName);

        when(tagsRepository.findByNameForUserOrGlobal(tagName, userId)).thenReturn(List.of(existingTag));

        TagService.TagResult result = tagService.createOrGetTag(userId, tagName);

        assertThat(result.created()).isFalse();
        assertThat(result.tag().id()).isEqualTo(10L);
        verify(tagsRepository, never()).save(any());
    }

    @Test
    void createOrGetTag_whenNew_shouldCreateAndReturn() {
        Long userId = 1L;
        String tagName = "new-tag";
        
        Tags newTag = new Tags();
        newTag.setId(11L);
        newTag.setName(tagName);

        when(tagsRepository.findByNameForUserOrGlobal(tagName, userId)).thenReturn(List.of());
        when(userRepository.getReferenceById(userId)).thenReturn(null);
        when(tagsRepository.save(any(Tags.class))).thenReturn(newTag);

        TagService.TagResult result = tagService.createOrGetTag(userId, tagName);

        assertThat(result.created()).isTrue(); 
        assertThat(result.tag().id()).isEqualTo(11L);
        verify(tagsRepository).save(any());
    }
}