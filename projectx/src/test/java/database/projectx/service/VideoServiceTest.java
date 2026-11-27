package database.projectx.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import database.projectx.dto.CreateVideoRequest;
import database.projectx.dto.TagDto;
import database.projectx.dto.UpdateVideoRequest;
import database.projectx.dto.VideoResponse;
import database.projectx.exception.BadRequestException;
import database.projectx.exception.ResourceNotFoundException;
import database.projectx.model.Tags;
import database.projectx.model.User;
import database.projectx.model.VideoTag;
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

    @Test
    void deleteVideo_whenOwner_shouldDeleteVideo() {
        when(videosRepository.existsByIdAndUserId(100L, 1L)).thenReturn(true);

        videoService.deleteVideo(1L, 100L);

        verify(videosRepository).deleteById(100L);
    }

    @Test
    void getVideo_whenOwned_shouldReturnVideoWithTags() {
        Videos video = video(1L, 100L, "https://youtube.com/1");
        when(videosRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(video));
        when(videoTagRepository.findAllByVideoIdsWithTags(List.of(100L)))
                .thenReturn(List.of(link(video, tag(10L, "gaming"))));

        VideoResponse response = videoService.getVideo(1L, 100L);

        assertThat(response.id()).isEqualTo(100L);
        assertThat(response.url()).isEqualTo("https://youtube.com/1");
        assertThat(response.tags()).extracting(TagDto::name).containsExactly("gaming");
    }

    @Test
    void getVideo_whenNotFound_shouldThrowException() {
        when(videosRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> videoService.getVideo(1L, 100L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Видео не найдено");
    }

    @Test
    void updateVideo_whenOwned_shouldReturnUpdatedUrl() {
        Videos video = video(1L, 100L, "https://youtube.com/old");
        when(videosRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(video));
        when(videoTagRepository.findAllByVideoIdsWithTags(List.of(100L))).thenReturn(List.of());

        VideoResponse response = videoService.updateVideo(1L, 100L, new UpdateVideoRequest("https://youtube.com/new"));

        assertThat(response.id()).isEqualTo(100L);
        assertThat(response.url()).isEqualTo("https://youtube.com/new");
    }

    @Test
    void updateVideo_whenNotFound_shouldThrowException() {
        when(videosRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> videoService.updateVideo(1L, 100L, new UpdateVideoRequest("https://youtube.com/new")))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getMyVideos_whenNoTagFilter_shouldReturnVideosWithTags() {
        Videos video = video(1L, 100L, "url-100");
        when(videosRepository.findAllByUserIdOrderByIdDesc(1L)).thenReturn(List.of(video));
        when(videoTagRepository.findAllByVideoIdsWithTags(List.of(100L)))
                .thenReturn(List.of(link(video, tag(10L, "gaming"))));

        List<VideoResponse> result = videoService.getMyVideos(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(100L);
        assertThat(result.get(0).tags()).extracting(TagDto::id).containsExactly(10L);
    }

    @Test
    void getMyVideos_whenNoVideos_shouldReturnEmptyListWithoutTagQuery() {
        when(videosRepository.findAllByUserIdOrderByIdDesc(1L)).thenReturn(List.of());

        List<VideoResponse> result = videoService.getMyVideos(1L);

        assertThat(result).isEmpty();
        verify(videoTagRepository, never()).findAllByVideoIdsWithTags(any());
    }

    @Test
    void getMyVideos_whenTagFilterProvided_shouldUseFilteredQuery() {
        Videos video = video(1L, 100L, "url-100");
        when(videosRepository.findAllByUserIdAndTagIds(1L, Set.of(10L))).thenReturn(List.of(video));
        when(videoTagRepository.findAllByVideoIdsWithTags(List.of(100L))).thenReturn(List.of());

        List<VideoResponse> result = videoService.getMyVideos(1L, Set.of(10L));

        assertThat(result).hasSize(1);
        assertThat(result.get(0).tags()).isEmpty();
        verify(videosRepository, never()).findAllByUserIdOrderByIdDesc(anyLong());
    }

    @Test
    void getMyVideos_whenEmptyTagFilter_shouldUseUnfilteredQuery() {
        when(videosRepository.findAllByUserIdOrderByIdDesc(1L)).thenReturn(List.of());

        List<VideoResponse> result = videoService.getMyVideos(1L, Set.of());

        assertThat(result).isEmpty();
        verify(videosRepository, never()).findAllByUserIdAndTagIds(anyLong(), any());
    }

    @Test
    void loadTagsForVideo_shouldReturnTagDtos() {
        Videos video = video(1L, 100L, "url-100");
        when(videoTagRepository.findAllByVideoIdsWithTags(List.of(100L)))
                .thenReturn(List.of(link(video, tag(10L, "gaming")), link(video, tag(11L, "music"))));

        Set<TagDto> tags = videoService.loadTagsForVideo(100L);

        assertThat(tags).extracting(TagDto::name).containsExactlyInAnyOrder("gaming", "music");
    }

    @Test
    void replaceVideoTags_whenTagsValid_shouldReplaceLinks() {
        Videos video = video(1L, 100L, "url-100");
        when(videosRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(video));
        when(tagsRepository.findAllByIdsForUserOrGlobal(Set.of(10L, 11L), 1L))
                .thenReturn(List.of(tag(10L, "gaming"), tag(11L, "music")));

        VideoResponse response = videoService.replaceVideoTags(1L, 100L, Set.of(10L, 11L));

        assertThat(response.tags()).hasSize(2);
        verify(videoTagRepository).deleteByVideoId(100L);
        verify(videoTagRepository).saveAll(any());
    }

    @Test
    void replaceVideoTags_whenTagsInvalid_shouldThrowAndKeepLinks() {
        Videos video = video(1L, 100L, "url-100");
        when(videosRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(video));
        when(tagsRepository.findAllByIdsForUserOrGlobal(Set.of(10L, 99L), 1L))
                .thenReturn(List.of(tag(10L, "gaming")));

        assertThatThrownBy(() -> videoService.replaceVideoTags(1L, 100L, Set.of(10L, 99L)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Недоступные теги");

        verify(videoTagRepository, never()).deleteByVideoId(anyLong());
        verify(videoTagRepository, never()).saveAll(any());
    }

    @Test
    void replaceVideoTags_whenTagsNull_shouldOnlyDeleteLinks() {
        Videos video = video(1L, 100L, "url-100");
        when(videosRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(video));

        VideoResponse response = videoService.replaceVideoTags(1L, 100L, null);

        assertThat(response.tags()).isEmpty();
        verify(videoTagRepository).deleteByVideoId(100L);
        verify(videoTagRepository, never()).saveAll(any());
    }

    private static Videos video(Long userId, Long videoId, String url) {
        User user = new User();
        user.setId(userId);

        Videos video = new Videos();
        video.setId(videoId);
        video.setUser(user);
        video.setUrl(url);
        return video;
    }

    private static Tags tag(Long id, String name) {
        Tags tag = new Tags();
        tag.setId(id);
        tag.setName(name);
        return tag;
    }

    private static VideoTag link(Videos video, Tags tag) {
        VideoTag link = new VideoTag();
        link.setVideo(video);
        link.setTag(tag);
        return link;
    }
}
