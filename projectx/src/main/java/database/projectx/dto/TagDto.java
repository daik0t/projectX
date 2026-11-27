package database.projectx.dto;

import database.projectx.model.Tags;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Тег видео")
public record TagDto(

        @Schema(
                description = "Уникальный идентификатор тега",
                example = "1",
                requiredMode = Schema.RequiredMode.REQUIRED)
        Long id,

        @Schema(
                description = "Имя тега",
                example = "music",
                requiredMode = Schema.RequiredMode.REQUIRED)
        String name
) {

    public static TagDto from(Tags tag) {
        return new TagDto(tag.getId(), tag.getName());
    }
}
