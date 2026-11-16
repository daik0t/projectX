package database.projectx.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import database.projectx.model.PasswordCredentials;
import database.projectx.model.Tags;
import database.projectx.model.User;
import database.projectx.model.UserEmails;
import database.projectx.model.VideoTag;
import database.projectx.model.Videos;
import database.projectx.repository.OAuthAccountsRepository;
import database.projectx.repository.PasswordCredentialsRepository;
import database.projectx.repository.PasswordResetTokenRepository;
import database.projectx.repository.TagsRepository;
import database.projectx.repository.UserEmailsRepository;
import database.projectx.repository.UserRepository;
import database.projectx.repository.VideoTagRepository;
import database.projectx.repository.VideosRepository;
import database.projectx.security.CustomUserDetails;
import database.projectx.service.JWTService;
import database.projectx.service.PasswordResetService;

/**
 * Общая инфраструктура интеграционных тестов.
 *
 * <p>Тесты поднимают реальный Spring-контекст (все бины, security-фильтры, JPA, H2)
 * и ходят в HTTP-эндпоинты через MockMvc. В отличие от юнит-тестов здесь нет моков:
 * запрос проходит полную цепочку фильтров, контроллер, сервис и слой БД.</p>
 *
 * <p>Тесты НЕ оборачиваются в {@code @Transactional}: каждый HTTP-запрос должен
 * выполняться в своей транзакции, как в проде. Иначе легко «пропустить» баг вида
 * «изменение не сохранилось» из-за общего тестового EntityManager. Изоляция
 * обеспечивается очисткой таблиц в {@link #cleanDatabase()} перед каждым тестом.</p>
 */
@SpringBootTest
@AutoConfigureMockMvc
public abstract class IntegrationTestBase {

    protected static final String RAW_PASSWORD = "password123";
    protected static final String NEW_PASSWORD = "newpassword456";

    /** Тот же секрет, что в src/test/resources/application.properties (jwt.secret). */
    protected static final String JWT_SECRET = "dGVzdC1zZWNyZXQta2V5LWZvci10ZXN0aW5nLW9ubHktMzJieXRlcw==";

    private static final PasswordEncoder SEED_ENCODER = new BCryptPasswordEncoder(12);
    private static final String SEEDED_PASSWORD_HASH = SEED_ENCODER.encode(RAW_PASSWORD);

    private static final AtomicInteger SEQUENCE = new AtomicInteger();
    private static final AtomicInteger IP_SEQUENCE = new AtomicInteger();

    @Autowired
    protected MockMvc mockMvc;

    /**
     * В проекте нет автоконфигурированного бина ObjectMapper (в существующих тестах
     * он тоже создаётся вручную), поэтому используем собственный экземпляр.
     */
    protected final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    protected PasswordEncoder passwordEncoder;

    @Autowired
    protected JWTService jwtService;

    @Autowired
    protected PasswordResetService passwordResetService;

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    protected UserEmailsRepository userEmailsRepository;

    @Autowired
    protected PasswordCredentialsRepository passwordCredentialsRepository;

    @Autowired
    protected OAuthAccountsRepository oauthAccountsRepository;

    @Autowired
    protected PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    protected TagsRepository tagsRepository;

    @Autowired
    protected VideosRepository videosRepository;

    @Autowired
    protected VideoTagRepository videoTagRepository;

    /**
     * Очищает все таблицы в порядке, безопасном для внешних ключей.
     * Выполняется перед каждым тестом, потому что контекст (и H2) переиспользуется.
     */
    @BeforeEach
    void cleanDatabase() {
        videoTagRepository.deleteAll();
        videosRepository.deleteAll();
        tagsRepository.deleteAll();
        passwordResetTokenRepository.deleteAll();
        oauthAccountsRepository.deleteAll();
        passwordCredentialsRepository.deleteAll();
        userEmailsRepository.deleteAll();
        userRepository.deleteAll();
    }

    // ---------------------------------------------------------------------
    // Генераторы уникальных значений
    // ---------------------------------------------------------------------

    protected static int nextSequence() {
        return SEQUENCE.incrementAndGet();
    }

    protected static String uniqueName(String prefix) {
        return prefix + nextSequence();
    }

    protected static String uniqueEmail(String prefix) {
        return prefix + nextSequence() + "@test.local";
    }

    /**
     * Каждый запрос получает свой IP, чтобы тесты не упирались в RateLimitFilter
     * (лимит 5 запросов в минуту на IP для /api/auth/**).
     */
    protected static String nextIp() {
        int n = IP_SEQUENCE.incrementAndGet();
        return "198.51." + ((n / 250) % 250 + 1) + "." + (n % 250 + 1);
    }

    protected static RequestPostProcessor remoteAddr(String clientIp) {
        return request -> {
            request.setRemoteAddr(clientIp);
            return request;
        };
    }

    // ---------------------------------------------------------------------
    // Подготовка данных (в обход HTTP, чтобы не тратить лимит запросов)
    // ---------------------------------------------------------------------

    protected User seedVerifiedUser() {
        return seedUser(uniqueName("user"), uniqueEmail("user"), true);
    }

    protected User seedUser(String displayName, String email, boolean emailVerified) {
        User user = seedUserWithEmail(displayName, email, emailVerified);

        PasswordCredentials credentials = new PasswordCredentials();
        credentials.setUser(user);
        credentials.setPasswordHash(SEEDED_PASSWORD_HASH);
        passwordCredentialsRepository.save(credentials);

        return user;
    }

    /** Пользователь без пароля — например, созданный через OAuth. */
    protected User seedUserWithoutCredentials() {
        return seedUserWithEmail(uniqueName("oauth"), uniqueEmail("oauth"), true);
    }

    private User seedUserWithEmail(String displayName, String email, boolean emailVerified) {
        User user = new User();
        user.setDisplayName(displayName);
        user = userRepository.save(user);

        UserEmails userEmail = new UserEmails();
        userEmail.setUser(user);
        userEmail.setEmail(email);
        userEmail.setIsVerified(emailVerified);
        userEmailsRepository.save(userEmail);

        return user;
    }

    protected Tags seedTag(User owner, String name) {
        Tags tag = new Tags();
        tag.setUser(owner);
        tag.setName(name);
        return tagsRepository.save(tag);
    }

    protected Videos seedVideo(User owner, String url, Tags... tags) {
        Videos video = new Videos();
        video.setUser(owner);
        video.setUrl(url);
        video = videosRepository.save(video);

        for (Tags tag : tags) {
            VideoTag link = new VideoTag();
            link.setVideo(video);
            link.setTag(tag);
            videoTagRepository.save(link);
        }

        return video;
    }

    // ---------------------------------------------------------------------
    // Токены и логин
    // ---------------------------------------------------------------------

    protected String tokenFor(User user) {
        return jwtService.generateToken(CustomUserDetails.from(user, null, null, true));
    }

    protected String emailOf(User user) {
        return userEmailsRepository.findByUserId(user.getId())
                .map(UserEmails::getEmail)
                .orElseThrow(() -> new IllegalStateException("email not found for user " + user.getId()));
    }

    protected static String bearer(String token) {
        return "Bearer " + token;
    }

    protected String loginToken(String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(jsonPost("/api/auth/login", Map.of("email", email, "password", password)))
                .andExpect(status().isOk())
                .andReturn();
        return json(result).path("accessToken").asText();
    }

    // ---------------------------------------------------------------------
    // HTTP-хелперы (по умолчанию у каждого запроса свой IP)
    // ---------------------------------------------------------------------

    protected MockHttpServletRequestBuilder getJson(String path) {
        return getJson(path, nextIp());
    }

    protected MockHttpServletRequestBuilder getJson(String path, String clientIp) {
        return get(path).accept(MediaType.APPLICATION_JSON).with(remoteAddr(clientIp));
    }

    protected MockHttpServletRequestBuilder deleteJson(String path) {
        return delete(path).accept(MediaType.APPLICATION_JSON).with(remoteAddr(nextIp()));
    }

    protected MockHttpServletRequestBuilder jsonPost(String path, Object body) {
        return jsonPost(path, body, nextIp());
    }

    protected MockHttpServletRequestBuilder jsonPost(String path, Object body, String clientIp) {
        return post(path)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .content(toJson(body))
                .with(remoteAddr(clientIp));
    }

    protected MockHttpServletRequestBuilder jsonPut(String path, Object body) {
        return put(path)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .content(toJson(body))
                .with(remoteAddr(nextIp()));
    }

    // ---------------------------------------------------------------------
    // Разбор ответов
    // ---------------------------------------------------------------------

    protected String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new UncheckedIOException(ex);
        }
    }

    protected String bodyOf(MvcResult result) {
        try {
            return result.getResponse().getContentAsString(StandardCharsets.UTF_8);
        } catch (Exception ex) {
            throw new IllegalStateException("cannot read response body", ex);
        }
    }

    protected JsonNode json(MvcResult result) {
        try {
            return objectMapper.readTree(bodyOf(result));
        } catch (JsonProcessingException ex) {
            throw new UncheckedIOException(ex);
        }
    }
}
