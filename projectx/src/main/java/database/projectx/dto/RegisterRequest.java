package database.projectx.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Schema(description = "Данные для регистрации нового пользователя")
public record RegisterRequest(

        @Schema(
                description = """
                        Отображаемое имя пользователя. Уникально, от 3 до 30 символов,
                        только латинские буквы, цифры и `_`""",
                example = "alice",
                minLength = 3,
                maxLength = 30,
                pattern = "^[a-zA-Z0-9_]+$",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "displayName обязателен")
        @Size(min = 3, max = 30, message = "displayName должен быть от 3 до 30 символов")
        @Pattern(
                regexp = "^[a-zA-Z0-9_]+$",
                message = "displayName может содержать только буквы, цифры и _"
        )
        String displayName,

        @Schema(
                description = "Email. Уникален в системе, не более 255 символов, должен быть валидным адресом",
                example = "alice@example.com",
                maxLength = 255,
                format = "email",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "email обязателен")
        @Email(message = "некорректный email")
        @Size(max = 255, message = "email слишком длинный")
        String email,

        @Schema(
                description = """
                        Пароль от 8 до 100 символов. Хранится в виде BCrypt-хэша (cost 12),
                        в открытом виде не сохраняется и в ответах не возвращается""",
                example = "secret123",
                minLength = 8,
                maxLength = 100,
                format = "password",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "password обязателен")
        @Size(min = 8, max = 100, message = "пароль должен быть от 8 до 100 символов")
        String password
) {
}
