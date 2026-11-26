package database.projectx.dto;

import java.util.Set;

import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Данные для создания видео")
public record CreateVideoRequest(

        @Schema(
                description = """
                        Ссылка на видео. Сохраняется как есть, без нормализации и проверки доступности.
                        Максимум 2048 символов, дубликаты URL не запрещены""",
                example = "https://youtube.com/watch?v=dQw4w9WgXcQ",
                maxLength = 2048,
                format = "uri",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "url обязателен")
        @Size(max = 2048, message = "url слишком длинный")
        String url,

        @ArraySchema(
                arraySchema = @Schema(
                        description = """
                                ID тегов, которые нужно привязать к видео. Разрешены только собственные
                                теги пользователя и глобальные теги; на чужие или несуществующие ID
                                вернётся 400. Необязательное поле: без него видео создаётся без тегов"""),
                schema = @Schema(implementation = Long.class, description = "ID тега", example = "1"),
                uniqueItems = true,
                maxItems = 100)
        Set<Long> tagIds
) {
}
