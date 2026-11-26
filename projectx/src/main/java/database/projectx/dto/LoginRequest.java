package database.projectx.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Данные для входа по email и паролю")
public record LoginRequest(

        @Schema(
                description = "Email, указанный при регистрации",
                example = "alice@example.com",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "email обязателен")
        @Email(message = "некорректный email")
        String email,

        @Schema(
                description = "Пароль пользователя",
                example = "secret123",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "password обязателен")
        String password
) {
}
