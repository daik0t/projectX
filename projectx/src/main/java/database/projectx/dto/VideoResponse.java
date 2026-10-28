package database.projectx.dto;

import java.util.Set;

import database.projectx.model.Videos;

public record VideoResponse(Long id, String url, Set<TagDto> tags) {
    public static VideoResponse from(Videos video, Set<TagDto> tags) {
        return new VideoResponse(video.getId(), video.getUrl(), tags);
    }
}
