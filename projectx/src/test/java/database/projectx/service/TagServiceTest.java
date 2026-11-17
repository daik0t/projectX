package database.projectx.service;

import database.projectx.dto.TagDto;
import database.projectx.exception.ResourceNotFoundException;
import database.projectx.model.Tags;
import database.projectx.repository.TagsRepository;
import database.projectx.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
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

    @Test
    void getAvailableTags_shouldMapEntitiesToDtos() {
        Tags first = new Tags(); first.setId(10L); first.setName("gaming");
        Tags second = new Tags(); second.setId(11L); second.setName("global");

        when(tagsRepository.findUserAndGlobalTags(1L)).thenReturn(List.of(first, second));

        List<TagDto> result = tagService.getAvailableTags(1L);

        assertThat(result).extracting(TagDto::id).containsExactly(10L, 11L);
        assertThat(result).extracting(TagDto::name).containsExactly("gaming", "global");
    }

    @Test
    void deleteTag_whenOwned_shouldDeleteTag() {
        Tags tag = new Tags(); tag.setId(10L); tag.setName("gaming");
        when(tagsRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(tag));

        tagService.deleteTag(1L, 10L);

        verify(tagsRepository).delete(tag);
    }

    @Test
    void deleteTag_whenNotFound_shouldThrowException() {
        when(tagsRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> tagService.deleteTag(1L, 10L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Тег не найден");

        verify(tagsRepository, never()).delete(any());
    }
}