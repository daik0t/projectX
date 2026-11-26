package database.projectx.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import database.projectx.config.OpenApiExamples;
import database.projectx.dto.RegisterRequest;
import database.projectx.dto.UserResponse;
import database.projectx.exception.ApiError;
import database.projectx.service.RegisterService;
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
public class RegisterController {

    private final RegisterService registerService;

    public RegisterController(RegisterService registerService) {
        this.registerService = registerService;
    }

    @PostMapping("/register")
    @SecurityRequirements
    @Operation(
            summary = "Регистрация пользователя",
            description = """
                    Создаёт пользователя с уникальными `displayName` и `email`, сохраняет
                    BCrypt-хэш пароля и возвращает публичные данные пользователя.
                    `emailVerified` у нового аккаунта всегда `false`.

                    Эндпоинт публичный, JWT не требуется.
                    Действует rate limit: 5 запросов в минуту с одного IP.""")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "201",
                    description = "Пользователь успешно зарегистрирован",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = UserResponse.class),
                            examples = @ExampleObject(name = "Успешная регистрация", value = """
                                    {
                                      "id": 1,
                                      "displayName": "alice",
                                      "email": "alice@example.com",
                                      "emailVerified": false,
                                      "createdAt": "2026-11-26T15:30:00"
                                    }
                                    """))),
            @ApiResponse(
                    responseCode = "400",
                    description = "Ошибка валидации тела запроса",
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
                                        "displayName": "displayName должен быть от 3 до 30 символов",
                                        "email": "некорректный email",
                                        "password": "пароль должен быть от 8 до 100 символов"
                                      }
                                    }
                                    """))),
            @ApiResponse(
                    responseCode = "409",
                    description = "Конфликт: displayName или email уже заняты",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiError.class),
                            examples = {
                                    @ExampleObject(name = "Email уже используется", value = """
                                            {
                                              "timestamp": "2026-11-26T15:30:00.123",
                                              "status": 409,
                                              "error": "Conflict",
                                              "message": "email уже используется",
                                              "details": {
                                                "field": "email"
                                              }
                                            }
                                            """),
                                    @ExampleObject(name = "displayName уже занят", value = """
                                            {
                                              "timestamp": "2026-11-26T15:30:00.123",
                                              "status": 409,
                                              "error": "Conflict",
                                              "message": "displayName уже занят",
                                              "details": {
                                                "field": "dsiplayName"
                                              }
                                            }
                                            """)
                            })),
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
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        UserResponse response = registerService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

}
