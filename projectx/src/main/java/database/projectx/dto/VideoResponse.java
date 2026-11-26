package database.projectx.dto;

import java.util.Set;

import database.projectx.model.Videos;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Видео в ответах API.
 */
@Schema(description = "Видео пользователя с привязанными тегами")
public record VideoResponse(

        @Schema(
                description = "Уникальный идентификатор видео",
                example = "10",
                requiredMode = Schema.RequiredMode.REQUIRED)
        Long id,

        @Schema(
                description = "Ссылка на видео в том виде, в котором её сохранил пользователь",
                example = "https://youtube.com/watch?v=dQw4w9WgXcQ",
                format = "uri",
                requiredMode = Schema.RequiredMode.REQUIRED)
        String url,

        @ArraySchema(
                arraySchema = @Schema(description = "Теги, привязанные к видео (может быть пустым)"),
                schema = @Schema(implementation = TagDto.class),
                uniqueItems = true)
        Set<TagDto> tags
) {

    public static VideoResponse from(Videos video, Set<TagDto> tags) {
        return new VideoResponse(video.getId(), video.getUrl(), tags);
    }
}
