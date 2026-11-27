package database.projectx.dto;

import java.time.LocalDateTime;

import database.projectx.model.User;
import database.projectx.model.UserEmails;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Данные пользователя, которые API возвращает клиенту")
public record UserResponse(

        @Schema(
                description = "Уникальный идентификатор пользователя",
                example = "1",
                requiredMode = Schema.RequiredMode.REQUIRED)
        Long id,

        @Schema(
                description = "Отображаемое имя пользователя",
                example = "alice",
                requiredMode = Schema.RequiredMode.REQUIRED)
        String displayName,

        @Schema(
                description = "Email пользователя",
                example = "alice@example.com",
                format = "email",
                requiredMode = Schema.RequiredMode.REQUIRED)
        String email,

        @Schema(
                description = """
                        Подтверждён ли email. При регистрации по email/паролю всегда `false`:
                        подтверждение email в API пока не реализовано. Для OAuth2-аккаунтов
                        значение зависит от провайдера""",
                example = "false",
                requiredMode = Schema.RequiredMode.REQUIRED)
        boolean emailVerified,

        @Schema(
                description = "Дата и время регистрации (ISO-8601, без часового пояса)",
                example = "2026-11-26T15:30:00",
                requiredMode = Schema.RequiredMode.REQUIRED)
        LocalDateTime createdAt
) {

    public static UserResponse from(User user, UserEmails primaryEmail) {
        return new UserResponse(
                user.getId(),
                user.getDisplayName(),
                primaryEmail.getEmail(),
                primaryEmail.getIsVerified(),
                user.getCreatedAt()
        );
    }
}
