package database.projectx.config;

import java.util.Comparator;
import java.util.List;

import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.tags.Tag;

@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "bearerAuth";

    private static final List<String> TAG_ORDER = List.of(
            "Аутентификация",
            "Восстановление пароля",
            "Пользователи",
            "Видео",
            "Теги");

    @Bean
    public OpenApiCustomizer tagOrderCustomizer() {
        return openApi -> {
            if (openApi.getTags() != null) {
                openApi.getTags().sort(Comparator.comparingInt(tag -> {
                    int index = TAG_ORDER.indexOf(tag.getName());
                    return index < 0 ? Integer.MAX_VALUE : index;
                }));
            }
        };
    }

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Short Video Finder API")
                        .version("0.1")
                        .description("""
                                REST API сервиса **Short Video Finder** — личная библиотека коротких
                                видео с пользовательскими тегами.

                                ## Авторизация
                                Защищённые эндпоинты требуют JWT в заголовке:
                                `Authorization: Bearer <accessToken>`.
                                Токен выдаёт `POST /api/auth/login` (или OAuth2-вход через Google/GitHub),
                                срок жизни токена — 24 часа.
                                Для тестирования нажмите **Authorize** и вставьте только сам токен, без `Bearer`.

                                ## Ошибки
                                Ошибки, обработанные приложением, возвращаются в едином формате `ApiError`:
                                `timestamp`, `status`, `error`, `message`, `details`.
                                Исключения: `401` от security-фильтра и `429` от rate limiter возвращают
                                короткий JSON без `timestamp`. Общий обработчик также отдаёт `500` на
                                неподдерживаемый Content-Type, битый JSON и неверный тип параметра.

                                ## Ограничения
                                - Не более **5 запросов в минуту с одного IP** на `/api/auth/login`,
                                  `/api/auth/register`, `/api/auth/forgot-password`, `/api/auth/reset-password`
                                  (иначе `429` и заголовок `Retry-After`).
                                - Видео и теги изолированы по текущему пользователю; глобальные теги
                                  (`user_id = NULL`) доступны всем.
                                """)
                        .contact(new Contact().name("Команда разработки ProjectX")))
                .tags(List.of(
                        new Tag().name("Аутентификация")
                                .description("Регистрация и вход по email и паролю"),
                        new Tag().name("Восстановление пароля")
                                .description("Запрос ссылки на сброс и установка нового пароля"),
                        new Tag().name("Пользователи")
                                .description("Профиль текущего пользователя"),
                        new Tag().name("Видео")
                                .description("CRUD видео и управление тегами видео"),
                        new Tag().name("Теги")
                                .description("Список, создание и удаление тегов")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:8080")
                                .description("Локальная разработка")))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME, new SecurityScheme()
                                .name(SECURITY_SCHEME_NAME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("""
                                        JWT, полученный в `POST /api/auth/login`.
                                        Передаётся в заголовке `Authorization: Bearer <token>`.
                                        Пример: `eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signature`"""))
                );
    }
}
