package database.projectx.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import database.projectx.config.OpenApiExamples;
import database.projectx.dto.AuthResponse;
import database.projectx.dto.LoginRequest;
import database.projectx.exception.ApiError;
import database.projectx.service.LoginService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.headers.Header;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Аутентификация", description = "Регистрация и вход по email и паролю")
public class LoginController {

    private final LoginService loginService;

    public LoginController(LoginService loginService) {
        this.loginService = loginService;
    }

    @PostMapping("/login")
    @SecurityRequirements
    @Operation(
            summary = "Вход по email и паролю",
            description = """
                    Проверяет email и пароль, возвращает JWT access-токен и данные пользователя.
                    Токен передаётся в заголовке `Authorization: Bearer <accessToken>` ко всем
                    защищённым эндпоинтам. Время жизни токена 24 часа.

                    Эндпоинт публичный, JWT не требуется.
                    Действует rate limit: 5 запросов в минуту с одного IP.""")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Успешный вход: выпущен JWT и возвращены данные пользователя",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = AuthResponse.class),
                            examples = @ExampleObject(name = "Успешный вход", value = """
                                    {
                                      "accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwiaWF0IjoxNzY0MTU4MDAwLCJleHAiOjE3NjQyNDQ0MDB9.c2lnbmF0dXJl",
                                      "tokenType": "Bearer",
                                      "expiresIn": 86400,
                                      "user": {
                                        "id": 1,
                                        "displayName": "alice",
                                        "email": "alice@example.com",
                                        "emailVerified": true,
                                        "createdAt": "2026-11-26T15:30:00"
                                      }
                                    }
                                    """))),
            @ApiResponse(
                    responseCode = "400",
                    description = "Ошибка валидации тела запроса: email пустой/некорректный или пароль пустой",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiError.class),
                            examples = @ExampleObject(name = "Ошибка валидации", value = """
                                    {
                                      "timestamp": "2026-11-26T15:30:00.123",
                                      "status": 400,
                                      "error": "Validation failed",
                                      "message": "Неккоректные данные запроса",
                                      "details": {
                                        "email": "некорректный email",
                                        "password": "password обязателен"
                                      }
                                    }
                                    """))),
            @ApiResponse(
                    responseCode = "401",
                    description = "Неверный email или пароль",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiError.class),
                            examples = @ExampleObject(name = "Неверные учётные данные", value = """
                                    {
                                      "timestamp": "2026-11-26T15:30:00.123",
                                      "status": 401,
                                      "error": "Unauthorized",
                                      "message": "Неверный email или пароль",
                                      "details": null
                                    }
                                    """))),
            @ApiResponse(
                    responseCode = "429",
                    description = "Превышен лимит запросов: 5 в минуту с одного IP",
                    headers = @Header(
                            name = "Retry-After",
                            description = "Секунды до восстановления лимита",
                            schema = @Schema(type = "integer", example = "42")),
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(type = "object", description = "Короткий формат ошибки без timestamp"),
                            examples = @ExampleObject(name = "Лимит превышен", value = OpenApiExamples.TOO_MANY_REQUESTS))),
            @ApiResponse(
                    responseCode = "500",
                    description = "Внутренняя ошибка сервера",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiError.class),
                            examples = @ExampleObject(name = "Внутренняя ошибка", value = OpenApiExamples.INTERNAL_ERROR)))
    })
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = loginService.login(request);

        return ResponseEntity.ok(response);
    }

}
