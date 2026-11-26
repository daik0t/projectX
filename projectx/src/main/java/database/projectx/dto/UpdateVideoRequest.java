package database.projectx.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Данные для изменения видео. Меняется только URL, теги не затрагиваются")
public record UpdateVideoRequest(

        @Schema(
                description = "Новая ссылка на видео. Сохраняется как есть, максимум 2048 символов",
                example = "https://youtube.com/watch?v=dQw4w9WgXcQ",
                maxLength = 2048,
                format = "uri",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "url обязателен")
        @Size(max = 2048, message = "url слишком длинный")
        String url
) {
}
