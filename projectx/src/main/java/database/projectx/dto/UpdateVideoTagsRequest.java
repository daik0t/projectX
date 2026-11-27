package database.projectx.dto;

import java.util.Set;

import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Полный новый набор тегов видео")
public record UpdateVideoTagsRequest(

        @ArraySchema(
                arraySchema = @Schema(
                        description = """
                                Полный список ID тегов, который заменит текущий набор тегов видео.
                                Разрешены только собственные теги пользователя и глобальные теги;
                                на чужие или несуществующие ID вернётся 400. Пустой массив или `null`
                                удаляет все теги у видео"""),
                schema = @Schema(implementation = Long.class, description = "ID тега", example = "1"),
                uniqueItems = true,
                maxItems = 100)
        Set<Long> tagIds
) {
}
