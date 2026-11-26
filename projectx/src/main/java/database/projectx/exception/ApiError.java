package database.projectx.exception;

import java.time.LocalDateTime;
import java.util.Map;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Единый формат ошибки API")
public record ApiError(

        @Schema(
                description = "Дата и время возникновения ошибки (ISO-8601, без часового пояса)",
                example = "2026-11-26T15:30:00.123",
                requiredMode = Schema.RequiredMode.REQUIRED)
        LocalDateTime timestamp,

        @Schema(
                description = "HTTP-код ответа",
                example = "400",
                requiredMode = Schema.RequiredMode.REQUIRED)
        int status,

        @Schema(
                description = """
                        Короткое машиночитаемое название ошибки: `Validation failed`, `Bad Request`,
                        `Unauthorized`, `Not Found`, `Conflict` или `Internal Server Error`""",
                example = "Validation failed",
                requiredMode = Schema.RequiredMode.REQUIRED)
        String error,

        @Schema(
                description = "Человекочитаемое описание ошибки на русском языке",
                example = "Неккоректные данные запроса",
                requiredMode = Schema.RequiredMode.REQUIRED)
        String message,

        @Schema(
                description = """
                        Детали ошибки: для ошибок валидации — пары «поле → сообщение»,
                        для конфликтов — имя занятого поля. `null`, если деталей нет""",
                example = "{\"email\": \"некорректный email\"}",
                nullable = true,
                requiredMode = Schema.RequiredMode.NOT_REQUIRED)
        Map<String, String> details
) {
}
