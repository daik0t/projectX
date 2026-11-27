package database.projectx.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Email, на который нужно отправить ссылку сброса пароля")
public record ForgotPasswordRequest(

        @Schema(
                description = """
                        Email зарегистрированного пользователя. Ответ всегда 200 и не зависит от того,
                        существует ли такой email, чтобы нельзя было перебрать зарегистрированные адреса""",
                example = "alice@example.com",
                format = "email",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank
        @Email
        String email
) {
}
