package database.projectx.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import database.projectx.config.OpenApiExamples;
import database.projectx.dto.UserResponse;
import database.projectx.exception.ApiError;
import database.projectx.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/users")
@Tag(name = "Пользователи", description = "Профиль текущего пользователя")
public class UserController {

    private final UserService userService;

    public UserController(
            UserService userService
    ) {
        this.userService = userService;
    }

    @GetMapping("/me")
    @Operation(
            summary = "Профиль текущего пользователя",
            description = """
                    Возвращает данные пользователя, которому принадлежит JWT из заголовка
                    `Authorization`. Других пользователей через API посмотреть нельзя.""")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Данные текущего пользователя",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = UserResponse.class),
                            examples = @ExampleObject(name = "Профиль пользователя", value = """
                                    {
                                      "id": 1,
                                      "displayName": "alice",
                                      "email": "alice@example.com",
                                      "emailVerified": true,
                                      "createdAt": "2026-11-26T15:30:00"
                                    }
                                    """))),
            @ApiResponse(
                    responseCode = "401",
                    description = "JWT отсутствует, битый или просрочен",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(type = "object", description = "Короткий формат ошибки без timestamp"),
                            examples = @ExampleObject(name = "Требуется авторизация", value = OpenApiExamples.UNAUTHORIZED))),
            @ApiResponse(
                    responseCode = "500",
                    description = "Внутренняя ошибка сервера (например, пользователь из токена не найден в БД)",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiError.class),
                            examples = @ExampleObject(name = "Внутренняя ошибка", value = OpenApiExamples.INTERNAL_ERROR)))
    })
    public ResponseEntity<UserResponse> me(
            @Parameter(hidden = true) Authentication authentication) {
        UserResponse userResponse = userService.getMe(authentication);
        return ResponseEntity.ok(userResponse);
    }

}
