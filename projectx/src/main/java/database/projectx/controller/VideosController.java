package database.projectx.controller;

import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import database.projectx.config.OpenApiExamples;
import database.projectx.dto.CreateVideoRequest;
import database.projectx.dto.UpdateVideoRequest;
import database.projectx.dto.UpdateVideoTagsRequest;
import database.projectx.dto.VideoResponse;
import database.projectx.exception.ApiError;
import database.projectx.security.CustomUserDetails;
import database.projectx.service.VideoService;
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
@RequestMapping("/api/videos")
@Tag(name = "Видео", description = "CRUD видео и управление тегами видео")
public class VideosController {

    private final VideoService videoService;

    public VideosController(VideoService videoService) {
        this.videoService = videoService;
    }

    @GetMapping("/me")
    @Operation(
            summary = "Мои видео",
            description = """
                    Возвращает все видео текущего пользователя, отсортированные по `id` по убыванию
                    (сначала новые). Опциональный параметр `tagIds` фильтрует видео по тегам:
                    возвращаются видео, у которых есть **хотя бы один** из переданных тегов (OR).

                    Пагинации нет — возвращается весь список. Если видео нет, вернётся пустой массив.""")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Список видео пользователя (может быть пустым)",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            array = @ArraySchema(schema = @Schema(implementation = VideoResponse.class)),
                            examples = @ExampleObject(name = "Список видео", value = """
                                    [
                                      {
                                        "id": 12,
                                        "url": "https://youtube.com/watch?v=dQw4w9WgXcQ",
                                        "tags": [
                                          { "id": 1, "name": "music" },
                                          { "id": 5, "name": "tutorials" }
                                        ]
                                      },
                                      {
                                        "id": 10,
                                        "url": "https://youtu.be/abc123",
                                        "tags": []
                                      }
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
                    description = """
                            Внутренняя ошибка сервера. В том числе возвращается на неверный тип
                            параметра, например `?tagIds=abc` (ожидаются числа)""",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiError.class),
                            examples = @ExampleObject(name = "Внутренняя ошибка", value = OpenApiExamples.INTERNAL_ERROR)))
    })
    public ResponseEntity<List<VideoResponse>> getMyVideos(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails principal,
            @Parameter(
                    description = """
                            ID тегов для фильтрации (OR-семантика). Передаётся повторяющимся
                            параметром: `?tagIds=1&tagIds=5`. Без параметра вернутся все видео""")
            @RequestParam(required = false) Set<Long> tagIds
    ) {
        List<VideoResponse> videos = videoService.getMyVideos(principal.getId(), tagIds);
        return ResponseEntity.ok(videos);
    }

    @PostMapping
    @Operation(
            summary = "Добавить видео",
            description = """
                    Создаёт видео для текущего пользователя и при необходимости привязывает теги.
                    URL не нормализуется и не проверяется на существование; дубликаты URL разрешены
                    (дедупликации пока нет).

                    Теги можно привязывать только собственные или глобальные — на чужие или
                    несуществующие ID вернётся `400` со списком недоступных ID.""")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "201",
                    description = "Видео создано",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = VideoResponse.class),
                            examples = @ExampleObject(name = "Видео с тегами", value = """
                                    {
                                      "id": 12,
                                      "url": "https://youtube.com/watch?v=dQw4w9WgXcQ",
                                      "tags": [
                                        { "id": 1, "name": "music" },
                                        { "id": 5, "name": "tutorials" }
                                      ]
                                    }
                                    """))),
            @ApiResponse(
                    responseCode = "400",
                    description = "Ошибка валидации URL или недоступные теги",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiError.class),
                            examples = {
                                    @ExampleObject(name = "Некорректный URL", value = """
                                            {
                                              "timestamp": "2026-11-26T15:30:00.123",
                                              "status": 400,
                                              "error": "Validation failed",
                                              "message": "Неккоректные данные запроса",
                                              "details": {
                                                "url": "url слишком длинный"
                                              }
                                            }
                                            """),
                                    @ExampleObject(name = "Недоступные теги", value = """
                                            {
                                              "timestamp": "2026-11-26T15:30:00.123",
                                              "status": 400,
                                              "error": "Bad Request",
                                              "message": "Недоступные теги [99]",
                                              "details": null
                                            }
                                            """)
                            })),
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
    public ResponseEntity<VideoResponse> createVideo(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody CreateVideoRequest request) {

        VideoResponse response = videoService.createVideo(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{id}")
    @Operation(
            summary = "Удалить видео",
            description = """
                    Удаляет видео текущего пользователя. Связи «видео — тег» удаляются каскадом
                    на уровне БД. Чужое или несуществующее видео удалить нельзя — вернётся `404`.""")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Видео удалено (тело ответа пустое)"),
            @ApiResponse(
                    responseCode = "401",
                    description = "JWT отсутствует, битый или просрочен",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(type = "object", description = "Короткий формат ошибки без timestamp"),
                            examples = @ExampleObject(name = "Требуется авторизация", value = OpenApiExamples.UNAUTHORIZED))),
            @ApiResponse(
                    responseCode = "404",
                    description = "Видео не найдено среди видео текущего пользователя",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiError.class),
                            examples = @ExampleObject(name = "Видео не найдено", value = """
                                    {
                                      "timestamp": "2026-11-26T15:30:00.123",
                                      "status": 404,
                                      "error": "Not Found",
                                      "message": "Видео не найдено: 12",
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
    public ResponseEntity<Void> deleteVideo(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails principal,
            @Parameter(description = "ID видео", example = "12", required = true) @PathVariable Long id) {

        videoService.deleteVideo(principal.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    @Operation(
            summary = "Получить видео",
            description = """
                    Возвращает видео текущего пользователя вместе с привязанными тегами.
                    Чужое или несуществующее видео недоступно — вернётся `404`.""")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Видео найдено",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = VideoResponse.class),
                            examples = @ExampleObject(name = "Видео", value = """
                                    {
                                      "id": 12,
                                      "url": "https://youtube.com/watch?v=dQw4w9WgXcQ",
                                      "tags": [
                                        { "id": 1, "name": "music" }
                                      ]
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
                    responseCode = "404",
                    description = "Видео не найдено",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiError.class),
                            examples = @ExampleObject(name = "Видео не найдено", value = """
                                    {
                                      "timestamp": "2026-11-26T15:30:00.123",
                                      "status": 404,
                                      "error": "Not Found",
                                      "message": "Видео не найдено 12",
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
    public ResponseEntity<VideoResponse> getVideo(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails principal,
            @Parameter(description = "ID видео", example = "12", required = true) @PathVariable Long id
    ) {
        return ResponseEntity.ok(videoService.getVideo(principal.getId(), id));
    }

    @PutMapping("/{id}")
    @Operation(
            summary = "Изменить URL видео",
            description = """
                    Заменяет URL видео. Теги не затрагиваются — для них есть отдельный эндпоинт
                    `PUT /api/videos/{id}/tags`. Чужое или несуществующее видео недоступно — `404`.""")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "URL обновлён",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = VideoResponse.class),
                            examples = @ExampleObject(name = "Обновлённое видео", value = """
                                    {
                                      "id": 12,
                                      "url": "https://youtube.com/watch?v=newUrl123",
                                      "tags": [
                                        { "id": 1, "name": "music" }
                                      ]
                                    }
                                    """))),
            @ApiResponse(
                    responseCode = "400",
                    description = "Ошибка валидации URL",
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
                                        "url": "url обязателен"
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
                    responseCode = "404",
                    description = "Видео не найдено",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiError.class),
                            examples = @ExampleObject(name = "Видео не найдено", value = """
                                    {
                                      "timestamp": "2026-11-26T15:30:00.123",
                                      "status": 404,
                                      "error": "Not Found",
                                      "message": "Видео не найдено 12",
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
    public ResponseEntity<VideoResponse> updateVideo(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails principal,
            @Parameter(description = "ID видео", example = "12", required = true) @PathVariable Long id,
            @Valid @RequestBody UpdateVideoRequest request) {

        return ResponseEntity.ok(videoService.updateVideo(principal.getId(), id, request));
    }

    @PutMapping("/{id}/tags")
    @Operation(
            summary = "Заменить теги видео",
            description = """
                    Полностью заменяет набор тегов видео: старые связи удаляются, устанавливаются
                    переданные. Пустой массив или `null` удаляет все теги. Привязывать можно только
                    собственные и глобальные теги; на чужие или несуществующие ID вернётся `400`
                    со списком недоступных ID.""")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Теги заменены",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = VideoResponse.class),
                            examples = @ExampleObject(name = "Обновлённые теги", value = """
                                    {
                                      "id": 12,
                                      "url": "https://youtube.com/watch?v=dQw4w9WgXcQ",
                                      "tags": [
                                        { "id": 2, "name": "tutorials" }
                                      ]
                                    }
                                    """))),
            @ApiResponse(
                    responseCode = "400",
                    description = "Недоступные теги (чужие или несуществующие)",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiError.class),
                            examples = @ExampleObject(name = "Недоступные теги", value = """
                                    {
                                      "timestamp": "2026-11-26T15:30:00.123",
                                      "status": 400,
                                      "error": "Bad Request",
                                      "message": "Недоступные теги: [99]",
                                      "details": null
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
                    responseCode = "404",
                    description = "Видео не найдено",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ApiError.class),
                            examples = @ExampleObject(name = "Видео не найдено", value = """
                                    {
                                      "timestamp": "2026-11-26T15:30:00.123",
                                      "status": 404,
                                      "error": "Not Found",
                                      "message": "Видео не найдено: 12",
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
    public ResponseEntity<VideoResponse> replaceVideoTags(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomUserDetails principal,
            @Parameter(description = "ID видео", example = "12", required = true) @PathVariable Long id,
            @Valid @RequestBody UpdateVideoTagsRequest request) {

        VideoResponse response = videoService.replaceVideoTags(principal.getId(), id, request.tagIds());
        return ResponseEntity.ok(response);
    }
}
