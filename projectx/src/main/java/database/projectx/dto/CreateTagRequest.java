package database.projectx.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Schema(description = "Данные для создания тега")
public record CreateTagRequest(

        @Schema(
                description = """
                        Имя тега: от 2 до 30 символов, только латинские буквы, цифры, `-` и `_`.
                        Если тег с таким именем уже существует у пользователя или является глобальным,
                        эндпоинт вернёт существующий тег со статусом 200 (новый не создаётся)""",
                example = "music",
                minLength = 2,
                maxLength = 30,
                pattern = "^[a-zA-Z0-9_\\-]+$",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "name обязателен")
        @Size(min = 2, max = 30, message = "name должен быть от 2 до 30 символов")
        @Pattern(regexp = "^[a-zA-Z0-9_\\-]+$",
                message = "name может содержать только буквы, цифры, - и _")
        String name
) {
}
