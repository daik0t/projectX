// Тут будет бизнес-логика по работе с видосами когда нибудь, а пока простые методы 
package database.projectx.service;

import database.projectx.dto.CreateVideoRequest;
import database.projectx.dto.TagDto;
import database.projectx.dto.VideoResponse;
import database.projectx.exception.ResourceNotFoundException;
import database.projectx.model.Tags;
import database.projectx.model.VideoTag;
import database.projectx.model.Videos;
import database.projectx.repository.TagsRepository;
import database.projectx.repository.UserRepository;
import database.projectx.repository.VideoTagRepository;
import database.projectx.repository.VideosRepository;
import jakarta.transaction.Transactional;
import database.projectx.exception.BadRequestException;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

@Service 
public class VideoService {
    private final UserRepository userRepository;
    private final TagsRepository tagsRepository;
    private final VideosRepository videosRepository;
    private final VideoTagRepository videoTagRepository;

    public VideoService(VideosRepository videosRepository, VideoTagRepository videoTagRepository, TagsRepository tagsRepository, UserRepository userRepository){
        this.videosRepository = videosRepository;
        this.videoTagRepository = videoTagRepository;
        this.tagsRepository = tagsRepository;
        this.userRepository = userRepository;
    }

    public List<VideoResponse> getMyVideos(Long userId) {
        List<Videos> videos = videosRepository.findAllByUserIdOrderByIdDesc(userId);
        if (videos.isEmpty()){
            return List.of();
        }

        List<Long> videoIds = videos.stream().map(Videos::getId).toList();
        List<VideoTag> links = videoTagRepository.findAllByVideoIdsWithTags(videoIds);

        Map<Long, Set<TagDto>> tagsByVideoId = links.stream()
        .collect(Collectors.groupingBy(link -> link.getVideo().getId(),
                Collectors.mapping(link -> TagDto.from(link.getTag()), Collectors.toSet()))
        );

        return videos.stream().map(v -> VideoResponse.from(v, tagsByVideoId.getOrDefault(v.getId(), Set.of()))).toList();
    }

    public VideoResponse createVideo(Long userId, CreateVideoRequest request){
        Set<Long> requestTagIds = request.tagIds() == null ? Set.of() : request.tagIds();
        List<Tags> availableTags = List.of();
        if(!requestTagIds.isEmpty()) {
            availableTags = tagsRepository.findAllByIdsForUserOrGlobal(requestTagIds, userId);

            if (availableTags.size() != requestTagIds.size()) {
                Set<Long> availableIds = availableTags.stream().map(Tags::getId).collect(Collectors.toSet());
                Set<Long> invalidIds = new HashSet<>(requestTagIds);
                invalidIds.removeAll(availableIds);
                throw new BadRequestException("Недоступные теги " + invalidIds);
            }
        }

        Videos video = new Videos();
        video.setUser(userRepository.getReferenceById(userId));
        video.setUrl(request.url());
        video = videosRepository.save(video);

        if (!availableTags.isEmpty()) {
            Videos finalVideo = video;
            List<VideoTag> links = availableTags.stream()
                    .map(tag -> {
                        VideoTag vt = new VideoTag();
                        vt.setVideo(finalVideo);
                        vt.setTag(tag);
                        return vt;
                    })
                    .toList();
            videoTagRepository.saveAll(links);
        }

        Set<TagDto> tagDtos = availableTags.stream()
                .map(TagDto::from)
                .collect(Collectors.toSet());

        return VideoResponse.from(video, tagDtos);
    }

    @Transactional
    public void deleteVideo(Long userId, Long videoId) {
        if (!videosRepository.existsByIdAndUserId(videoId, userId)) {
            throw new ResourceNotFoundException("Видео не найдено: " + videoId);
        }
        videosRepository.deleteById(videoId);
    }

    @Transactional
public VideoResponse replaceVideoTags(Long userId, Long videoId, Set<Long> tagIds) {

    Videos video = videosRepository.findByIdAndUserId(videoId, userId)
    .orElseThrow(() -> new ResourceNotFoundException("Видео не найдено: " + videoId));

    Set<Long> requestedIds = tagIds == null ? Set.of() : tagIds;

    List<Tags> availableTags = List.of();
    if (!requestedIds.isEmpty()) {
        availableTags = tagsRepository.findAllByIdsForUserOrGlobal(requestedIds, userId);

        if (availableTags.size() != requestedIds.size()) {
            Set<Long> availableIds = availableTags.stream()
                    .map(Tags::getId)
                    .collect(Collectors.toSet());
            Set<Long> invalid = new HashSet<>(requestedIds);
            invalid.removeAll(availableIds);
            throw new BadRequestException("Недоступные теги: " + invalid);
        }
    }

    videoTagRepository.deleteByVideoId(videoId);

    if (!availableTags.isEmpty()) {
        List<VideoTag> links = availableTags.stream()
                .map(tag -> {
                    VideoTag vt = new VideoTag();
                    vt.setVideo(video);
                    vt.setTag(tag);
                    return vt;
                })
                .toList();
        videoTagRepository.saveAll(links);
    }

    Set<TagDto> dtos = availableTags.stream()
            .map(TagDto::from)
            .collect(Collectors.toSet());

    return VideoResponse.from(video, dtos);
}
}
