package database.projectx.config;

/**
 * Готовые примеры JSON-тел ответов для OpenAPI-документации.
 *
 * <p>Примеры вынесены в константы, чтобы одинаковые ответы (401, 429, 500)
 * описывались в Swagger одинаково у всех эндпоинтов и не расходились со временем.
 * Аннотации {@code @ExampleObject} принимают только константные выражения,
 * поэтому каждый пример — {@code static final String}, инициализированный text block'ом.</p>
 */
public final class OpenApiExamples {

    private OpenApiExamples() {
    }

    /**
     * 401 от security-фильтра: JWT не передан, битый или просрочен.
     * Тело формируется entry point'ом в {@code SecurityConfig} и не содержит полей
     * {@code timestamp}/{@code details}, в отличие от ошибок, обработанных
     * {@code GlobalExceptionHandler}.
     */
    public static final String UNAUTHORIZED = """
            {"status":401,"error":"Unauthorized","message":"Требуется аутентификация"}""";

    /**
     * 429 от {@code RateLimitFilter}: превышен лимит 5 запросов в минуту на IP
     * для auth-эндпоинтов. Заголовок {@code Retry-After} содержит секунды до сброса лимита.
     */
    public static final String TOO_MANY_REQUESTS = """
            {"status":429,"error":"Too Many Requests","message":"Too many requests. Try again later"}""";

    /**
     * 500 от catch-all обработчика {@code GlobalExceptionHandler}.
     * Текст сообщения сохранён дословно, включая опечатку в текущей реализации.
     */
    public static final String INTERNAL_ERROR = """
            {
              "timestamp": "2026-11-26T15:30:00.123",
              "status": 500,
              "error": "Internal Server Error",
              "message": "Внтуреняя ошибка сервера",
              "details": null
            }""";
}
