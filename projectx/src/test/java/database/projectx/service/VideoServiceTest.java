package database.projectx.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import database.projectx.dto.CreateVideoRequest;
import database.projectx.dto.VideoResponse;
import database.projectx.exception.BadRequestException;
import database.projectx.exception.ResourceNotFoundException;
import database.projectx.model.Tags;
import database.projectx.model.User;
import database.projectx.model.Videos;
import database.projectx.repository.TagsRepository;
import database.projectx.repository.UserRepository;
import database.projectx.repository.VideoTagRepository;
import database.projectx.repository.VideosRepository;

@ExtendWith(MockitoExtension.class)
public class VideoServiceTest {
    @Mock private VideosRepository videosRepository;
    @Mock private VideoTagRepository videoTagRepository;
    @Mock private TagsRepository tagsRepository;
    @Mock private UserRepository userRepository;
    
    @InjectMocks private VideoService videoService;

    @Test
    void createVideo_whenTagsAreValid_shouldSaveVideoAndTags() {
        Long userId = 1L;
        CreateVideoRequest request = new CreateVideoRequest("https://youtube.com/1", Set.of(10L, 11L));
        
        Tags tag1 = new Tags(); tag1.setId(10L);
        Tags tag2 = new Tags(); tag2.setId(11L);
        
        Videos savedVideo = new Videos(); savedVideo.setId(100L);
        savedVideo.setUser(new User());

        when(tagsRepository.findAllByIdsForUserOrGlobal(request.tagIds(), userId))
                .thenReturn(List.of(tag1, tag2)); 
        when(userRepository.getReferenceById(userId)).thenReturn(new User());
        when(videosRepository.save(any(Videos.class))).thenReturn(savedVideo);

        VideoResponse response = videoService.createVideo(userId, request);

        assertThat(response.id()).isEqualTo(100L);
        verify(videosRepository).save(any(Videos.class)); 
        verify(videoTagRepository).saveAll(any());       
    }

    @Test
    void createVideo_whenTagsAreInvalid_shouldThrowException() {
        Long userId = 1L;
        CreateVideoRequest request = new CreateVideoRequest("url", Set.of(10L, 99L)); 
        
        Tags tag1 = new Tags(); tag1.setId(10L);
        
        when(tagsRepository.findAllByIdsForUserOrGlobal(request.tagIds(), userId))
                .thenReturn(List.of(tag1));

        assertThatThrownBy(() -> videoService.createVideo(userId, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Недоступные теги");

        verify(videosRepository, never()).save(any());
    }

    @Test
    void deleteVideo_whenNotOwner_shouldThrowException() {
        Long userId = 1L;
        Long videoId = 100L;

        when(videosRepository.existsByIdAndUserId(videoId, userId)).thenReturn(false);

        assertThatThrownBy(() -> videoService.deleteVideo(userId, videoId))
                .isInstanceOf(ResourceNotFoundException.class);
                
        verify(videosRepository, never()).deleteById(anyLong());
    } 
}
