package database.projectx.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Одноразовый токен сброса пароля и новый пароль")
public record ResetPasswordRequest(

        @Schema(
                description = """
                        Одноразовый токен из ссылки на сброс пароля (query-параметр `token`).
                        Живёт 15 минут, после успешного использования становится недействительным""",
                example = "3d8f5c1e9a7b4f2d8e6c0a1b3d5f7a9c",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank
        String token,

        @Schema(
                description = "Новый пароль от 8 до 100 символов. Сохраняется BCrypt-хэшем",
                example = "newpassword456",
                minLength = 8,
                maxLength = 100,
                format = "password",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank
        @Size(min = 8, max = 100)
        String newPassword
) {
}
