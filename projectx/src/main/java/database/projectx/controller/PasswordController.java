package database.projectx.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import database.projectx.config.OpenApiExamples;
import database.projectx.dto.ForgotPasswordRequest;
import database.projectx.dto.MessageResponse;
import database.projectx.dto.ResetPasswordRequest;
import database.projectx.exception.ApiError;
import database.projectx.service.PasswordService;
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
@Tag(name = "Восстановление пароля", description = "Запрос ссылки на сброс и установка нового пароля")
public class PasswordController {

    private final PasswordService passwordService;

    PasswordController(PasswordService passwordService) {
        this.passwordService = passwordService;
    }

    @PostMapping("/forgot-password")
    @SecurityRequirements
    @Operation(
            summary = "Запрос ссылки для сброса пароля",
            description = """
                    Создаёт одноразовый токен сброса пароля (TTL 15 минут) и отправляет ссылку
                    на email. Ответ **всегда** `200`, независимо от того, зарегистрирован ли email:
                    это защищает от перебора существующих адресов.

                    В текущей реализации письмо не уходит по SMTP — ссылка пишется в лог сервера.

                    Эндпоинт публичный, JWT не требуется.
                    Действует rate limit: 5 запросов в минуту с одного IP.""")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Запрос принят. Текст ответа не зависит от существования email",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = MessageResponse.class),
                            examples = @ExampleObject(name = "Запрос принят", value = """
                                    {
                                      "message": "Если такой email зарегестрирован то инструкции по сбросу отправлены"
                                    }
                                    """))),
            @ApiResponse(
                    responseCode = "400",
                    description = "Ошибка валидации: email пустой или некорректный",
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
                                        "email": "должно иметь формат адреса электронной почты"
                                      }
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
    public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordService.requestPasswordReset(request.email());

        return ResponseEntity.ok(MessageResponse.of(
                "Если такой email зарегестрирован то инструкции по сбросу отправлены"));
    }

    @PostMapping("/reset-password")
    @SecurityRequirements
    @Operation(
            summary = "Установка нового пароля по токену",
            description = """
                    Проверяет одноразовый токен из ссылки и заменяет пароль пользователя.
                    Токен живёт 15 минут и сгорает после первого успешного использования.
                    Если у пользователя ещё не было пароля (аккаунт только через OAuth2),
                    пароль будет создан.

                    Эндпоинт публичный, JWT не требуется.
                    Действует rate limit: 5 запросов в минуту с одного IP.""")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Пароль успешно изменён",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = MessageResponse.class),
                            examples = @ExampleObject(name = "Пароль изменён", value = """
                                    {
                                      "message": "Пароль успешно изменен"
                                    }
                                    """))),
            @ApiResponse(
                    responseCode = "400",
                    description = "Ошибка валидации или недействительный/просроченный/использованный токен",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiError.class),
                            examples = {
                                    @ExampleObject(name = "Ошибка валидации", value = """
                                            {
                                              "timestamp": "2026-11-26T15:30:00.123",
                                              "status": 400,
                                              "error": "Validation failed",
                                              "message": "Неккоректные данные запроса",
                                              "details": {
                                                "newPassword": "размер должен находиться в диапазоне от 8 до 100"
                                              }
                                            }
                                            """),
                                    @ExampleObject(name = "Токен не найден или просрочен", value = """
                                            {
                                              "timestamp": "2026-11-26T15:30:00.123",
                                              "status": 400,
                                              "error": "Bad Request",
                                              "message": "Недействительная или просроченная ссылка",
                                              "details": null
                                            }
                                            """),
                                    @ExampleObject(name = "Токен уже использован", value = """
                                            {
                                              "timestamp": "2026-11-26T15:30:00.123",
                                              "status": 400,
                                              "error": "Bad Request",
                                              "message": "Ссылка уже использована",
                                              "details": null
                                            }
                                            """),
                                    @ExampleObject(name = "Срок действия токена истёк", value = """
                                            {
                                              "timestamp": "2026-11-26T15:30:00.123",
                                              "status": 400,
                                              "error": "Bad Request",
                                              "message": "Срок действия сслыки истек",
                                              "details": null
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
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordService.resetPassword(request);

        return ResponseEntity.ok(MessageResponse.of("Пароль успешно изменен"));
    }

}
