package database.projectx.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Результат успешной аутентификации: JWT access-токен и данные пользователя")
public record AuthResponse(

        @Schema(
                description = "JWT access-токен (HS256). Передаётся в заголовке `Authorization: Bearer <token>`",
                example = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwiaWF0IjoxNzY0MTU4MDAwLCJleHAiOjE3NjQyNDQ0MDB9.c2lnbmF0dXJl",
                requiredMode = Schema.RequiredMode.REQUIRED)
        String accessToken,

        @Schema(
                description = "Тип токена. Всегда `Bearer`",
                example = "Bearer",
                allowableValues = {"Bearer"},
                requiredMode = Schema.RequiredMode.REQUIRED)
        String tokenType,

        @Schema(
                description = "Время жизни токена в секундах (сейчас всегда 86400 — 24 часа)",
                example = "86400",
                requiredMode = Schema.RequiredMode.REQUIRED)
        long expiresIn,

        @Schema(
                description = "Данные аутентифицированного пользователя",
                requiredMode = Schema.RequiredMode.REQUIRED)
        UserResponse user
) {

    public static AuthResponse of(String accessToken, long expiresIn, UserResponse user) {
        return new AuthResponse(accessToken, "Bearer", expiresIn, user);
    }
}
