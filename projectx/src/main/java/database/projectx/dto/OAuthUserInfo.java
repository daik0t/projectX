package database.projectx.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Данные пользователя от OAuth2-провайдера (внутренняя модель)")
public record OAuthUserInfo(

        @Schema(
                description = "Идентификатор провайдера: `google` или `github`",
                example = "google",
                allowableValues = {"google", "github"},
                requiredMode = Schema.RequiredMode.REQUIRED)
        String provider,

        @Schema(
                description = "Идентификатор пользователя у провайдера (Google sub / GitHub id)",
                example = "103456789012345678901",
                requiredMode = Schema.RequiredMode.REQUIRED)
        String providerUserId,

        @Schema(
                description = "Email пользователя у провайдера",
                example = "alice@gmail.com",
                format = "email",
                requiredMode = Schema.RequiredMode.REQUIRED)
        String email,

        @Schema(
                description = "Подтвердил ли провайдер, что email принадлежит пользователю",
                example = "true",
                requiredMode = Schema.RequiredMode.REQUIRED)
        boolean isEmailVerified,

        @Schema(
                description = "Отображаемое имя пользователя у провайдера",
                example = "Alice Ivanova",
                requiredMode = Schema.RequiredMode.NOT_REQUIRED)
        String name
) {
}
