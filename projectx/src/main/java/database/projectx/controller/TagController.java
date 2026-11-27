package database.projectx.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import database.projectx.config.OpenApiExamples;
import database.projectx.dto.CreateTagRequest;
import database.projectx.dto.TagDto;
import database.projectx.exception.ApiError;
import database.projectx.security.CustomUserDetails;
import database.projectx.service.TagService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/tags")
@Tag(name = "Теги", description = "Список, создание и удаление тегов")
public class TagController {

    private final TagService tagService;

    public TagController(TagService tagService) {
        this.tagService = tagService;
    }

    @GetMapping
    @Operation(
            summary = "Список доступных тегов",
            description = """
                    Возвращает теги, доступные текущему пользователю: его собственные и глобальные
                    (у глобальных `user_id = NULL`). Сортировка — по имени по возрастанию.
                    Пагинации нет.""")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Список доступных тегов (может быть пустым)",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            array = @ArraySchema(schema = @Schema(implementation = TagDto.class)),
                            examples = @ExampleObject(name = "Список тегов", value = """
                                    [
                                      { "id": 1, "name": "music" },
                                      { "id": 2, "name": "tutorials" },
                                      { "id": 7, "name": "workout" }
                                    ]
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
                    description = "Внутренняя ошибка сервера",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiError.class),
                            examples = @ExampleObject(name = "Внутренняя ошибка", value = OpenApiExamples.INTERNAL_ERROR)))
    })
    public ResponseEntity<List<TagDto>> getTags(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(tagService.getAvailableTags(principal.getId()));
    }

    @PostMapping
    @Operation(
            summary = "Создать тег или получить существующий",
            description = """
                    Ищет тег с таким именем среди собственных и глобальных тегов пользователя
                    (имя предварительно обрезается от пробелов). Если тег найден — возвращает его
                    со статусом `200` и ничего не создаёт. Если не найден — создаёт новый
                    собственный тег и возвращает `201`.

                    Повторный вызов с тем же именем не создаёт дубликат.""")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "201",
                    description = "Тег создан",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = TagDto.class),
                            examples = @ExampleObject(name = "Новый тег", value = """
                                    {
                                      "id": 8,
                                      "name": "music"
                                    }
                                    """))),
            @ApiResponse(
                    responseCode = "200",
                    description = "Такой тег уже существует — возвращён существующий (без создания дубликата)",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = TagDto.class),
                            examples = @ExampleObject(name = "Существующий тег", value = """
                                    {
                                      "id": 1,
                                      "name": "music"
                                    }
                                    """))),
            @ApiResponse(
                    responseCode = "400",
                    description = "Ошибка валидации имени тега",
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
                                        "name": "name может содержать только буквы, цифры, - и _"
                                      }
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
                    description = "Внутренняя ошибка сервера",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiError.class),
                            examples = @ExampleObject(name = "Внутренняя ошибка", value = OpenApiExamples.INTERNAL_ERROR)))
    })
    public ResponseEntity<TagDto> createTag(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody CreateTagRequest request) {
        TagService.TagResult result = tagService.createOrGetTag(principal.getId(), request.name());

        HttpStatus status = result.created() ? HttpStatus.CREATED : HttpStatus.OK;
        return ResponseEntity.status(status).body(result.tag());
    }

    @DeleteMapping("/{id}")
    @Operation(
            summary = "Удалить тег",
            description = """
                    Удаляет собственный тег пользователя. Связи «видео — тег» удаляются каскадом
                    на уровне БД. Чужой или глобальный тег удалить нельзя — вернётся `404`.""")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Тег удалён (тело ответа пустое)"),
            @ApiResponse(
                    responseCode = "401",
                    description = "JWT отсутствует, битый или просрочен",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(type = "object", description = "Короткий формат ошибки без timestamp"),
                            examples = @ExampleObject(name = "Требуется авторизация", value = OpenApiExamples.UNAUTHORIZED))),
            @ApiResponse(
                    responseCode = "404",
                    description = "Тег не найден среди собственных тегов пользователя",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiError.class),
                            examples = @ExampleObject(name = "Тег не найден", value = """
                                    {
                                      "timestamp": "2026-11-26T15:30:00.123",
                                      "status": 404,
                                      "error": "Not Found",
                                      "message": "Тег не найден 8",
                                      "details": null
                                    }
                                    """))),
            @ApiResponse(
                    responseCode = "500",
                    description = "Внутренняя ошибка сервера",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiError.class),
                            examples = @ExampleObject(name = "Внутренняя ошибка", value = OpenApiExamples.INTERNAL_ERROR)))
    })
    public ResponseEntity<Void> deleteTag(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails principal,
            @Parameter(description = "ID удаляемого тега", example = "8", required = true) @PathVariable Long id
    ) {
        tagService.deleteTag(principal.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
