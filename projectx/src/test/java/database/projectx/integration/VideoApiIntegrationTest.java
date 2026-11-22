package database.projectx.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultMatcher;

import com.fasterxml.jackson.databind.JsonNode;

import database.projectx.model.Tags;
import database.projectx.model.User;
import database.projectx.model.VideoTag;
import database.projectx.model.Videos;

/**
 * Интеграционные тесты /api/videos: создание с тегами, чтение, фильтрация,
 * обновление, замена тегов, удаление и изоляция данных между пользователями.
 */
class VideoApiIntegrationTest extends IntegrationTestBase {

    private User alice;
    private User bob;
    private String aliceToken;
    private String bobToken;
    private Tags aliceTag;
    private Tags bobTag;
    private Tags globalTag;

    @BeforeEach
    void seedData() {
        alice = seedVerifiedUser();
        bob = seedVerifiedUser();
        aliceToken = tokenFor(alice);
        bobToken = tokenFor(bob);

        aliceTag = seedTag(alice, "alpha");
        bobTag = seedTag(bob, "beta");
        globalTag = seedTag(null, "omega");
    }

    // ------------------------------------------------------------------
    // Создание
    // ------------------------------------------------------------------

    @Test
    void createVideo_shouldPersistVideoAndLinkAvailableTags() throws Exception {
        String url = "https://youtube.com/watch?v=create";

        JsonNode body = createVideo(aliceToken, url, Set.of(aliceTag.getId(), globalTag.getId()), status().isCreated());

        long videoId = body.path("id").asLong();
        assertThat(body.path("url").asText()).isEqualTo(url);
        assertThat(tagNames(body.path("tags"))).containsExactlyInAnyOrder("alpha", "omega");

        Videos saved = videosRepository.findById(videoId).orElseThrow();
        assertThat(saved.getUrl()).isEqualTo(url);
        assertThat(videosRepository.findByIdAndUserId(videoId, alice.getId())).isPresent();
        assertThat(videosRepository.findByIdAndUserId(videoId, bob.getId())).isEmpty();
        assertThat(videoTagRepository.findAllByVideoIdsWithTags(List.of(videoId))).hasSize(2);
    }

    @Test
    void createVideo_withoutTags_shouldReturnVideoWithEmptyTags() throws Exception {
        JsonNode body = createVideo(aliceToken, "https://youtube.com/plain", null, status().isCreated());

        assertThat(body.path("tags").size()).isZero();
        assertThat(videoTagRepository.count()).isZero();
    }

    @Test
    void createVideo_withForeignTag_shouldReturn400AndNotCreateVideo() throws Exception {
        mockMvc.perform(jsonPost("/api/videos", Map.of(
                        "url", "https://youtube.com/foreign-tag",
                        "tagIds", List.of(bobTag.getId())))
                        .header("Authorization", bearer(aliceToken)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value(containsString("Недоступные теги")));

        assertThat(videosRepository.count()).isZero();
    }

    @Test
    void createVideo_withUnknownTag_shouldReturn400() throws Exception {
        mockMvc.perform(jsonPost("/api/videos", Map.of(
                        "url", "https://youtube.com/unknown-tag",
                        "tagIds", List.of(999_999L)))
                        .header("Authorization", bearer(aliceToken)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Недоступные теги")));

        assertThat(videosRepository.count()).isZero();
    }

    @Test
    void createVideo_withBlankUrl_shouldReturn400() throws Exception {
        mockMvc.perform(jsonPost("/api/videos", Map.of("url", " "))
                        .header("Authorization", bearer(aliceToken)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details.url").exists());

        assertThat(videosRepository.count()).isZero();
    }

    @Test
    void createVideo_withoutToken_shouldReturn401() throws Exception {
        mockMvc.perform(jsonPost("/api/videos", Map.of("url", "https://youtube.com/anon")))
                .andExpect(status().isUnauthorized());

        assertThat(videosRepository.count()).isZero();
    }

    // ------------------------------------------------------------------
    // Чтение
    // ------------------------------------------------------------------

    @Test
    void getVideo_shouldReturnOwnVideoWithTags() throws Exception {
        Videos video = seedVideo(alice, "https://youtube.com/get", aliceTag, globalTag);

        MvcResult result = mockMvc.perform(getJson("/api/videos/" + video.getId())
                        .header("Authorization", bearer(aliceToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").value("https://youtube.com/get"))
                .andReturn();

        assertThat(json(result).path("id").asLong()).isEqualTo(video.getId());
        assertThat(tagNames(json(result).path("tags"))).containsExactlyInAnyOrder("alpha", "omega");
    }

    @Test
    void getVideo_whenNotOwned_shouldReturn404() throws Exception {
        Videos bobVideo = seedVideo(bob, "https://youtube.com/bob");

        mockMvc.perform(getJson("/api/videos/" + bobVideo.getId())
                        .header("Authorization", bearer(aliceToken)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value(
                        containsString("Видео не найдено")));
    }

    @Test
    void getVideo_whenMissing_shouldReturn404() throws Exception {
        mockMvc.perform(getJson("/api/videos/999999")
                        .header("Authorization", bearer(aliceToken)))
                .andExpect(status().isNotFound());
    }

    @Test
    void getMyVideos_shouldReturnOnlyOwnVideosNewestFirst() throws Exception {
        Videos older = seedVideo(alice, "https://youtube.com/older");
        Videos newer = seedVideo(alice, "https://youtube.com/newer");
        seedVideo(bob, "https://youtube.com/bob");

        MvcResult result = mockMvc.perform(getJson("/api/videos/me")
                        .header("Authorization", bearer(aliceToken)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode videos = json(result);
        assertThat(videos.size()).isEqualTo(2);
        assertThat(videos.get(0).path("id").asLong()).isEqualTo(newer.getId());
        assertThat(videos.get(1).path("id").asLong()).isEqualTo(older.getId());

        List<String> urls = new ArrayList<>();
        videos.forEach(video -> urls.add(video.path("url").asText()));
        assertThat(urls).doesNotContain("https://youtube.com/bob");
    }

    @Test
    void getMyVideos_whenFilteredByTag_shouldReturnOnlyMatchingVideos() throws Exception {
        Videos withAliceTag = seedVideo(alice, "https://youtube.com/alpha", aliceTag);
        seedVideo(alice, "https://youtube.com/omega", globalTag);

        MvcResult result = mockMvc.perform(getJson("/api/videos/me")
                        .param("tagIds", String.valueOf(aliceTag.getId()))
                        .header("Authorization", bearer(aliceToken)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode videos = json(result);
        assertThat(videos.size()).isEqualTo(1);
        assertThat(videos.get(0).path("id").asLong()).isEqualTo(withAliceTag.getId());
    }

    @Test
    void getMyVideos_whenFilteredBySeveralTags_shouldReturnUnion() throws Exception {
        Videos withAliceTag = seedVideo(alice, "https://youtube.com/alpha", aliceTag);
        Videos withGlobalTag = seedVideo(alice, "https://youtube.com/omega", globalTag);
        seedVideo(alice, "https://youtube.com/no-tags");

        MvcResult result = mockMvc.perform(getJson("/api/videos/me")
                        .param("tagIds", aliceTag.getId() + "," + globalTag.getId())
                        .header("Authorization", bearer(aliceToken)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode videos = json(result);
        assertThat(videos.size()).isEqualTo(2);
        List<Long> ids = new ArrayList<>();
        videos.forEach(video -> ids.add(video.path("id").asLong()));
        assertThat(ids).containsExactlyInAnyOrder(withAliceTag.getId(), withGlobalTag.getId());
    }

    @Test
    void getMyVideos_whenNoVideos_shouldReturnEmptyArray() throws Exception {
        MvcResult result = mockMvc.perform(getJson("/api/videos/me")
                        .header("Authorization", bearer(aliceToken)))
                .andExpect(status().isOk())
                .andReturn();

        assertThat(json(result).size()).isZero();
    }

    // ------------------------------------------------------------------
    // Обновление
    // ------------------------------------------------------------------

    @Test
    void updateVideo_shouldReturnUpdatedUrlInResponse() throws Exception {
        Videos video = seedVideo(alice, "https://youtube.com/old");

        MvcResult result = mockMvc.perform(jsonPut("/api/videos/" + video.getId(),
                        Map.of("url", "https://youtube.com/new"))
                        .header("Authorization", bearer(aliceToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").value("https://youtube.com/new"))
                .andReturn();

        assertThat(json(result).path("id").asLong()).isEqualTo(video.getId());
    }

    /**
     * Фиксирует текущее (ошибочное) поведение: {@code VideoService.updateVideo}
     * меняет url у отсоединённой сущности и не вызывает save, поэтому изменение
     * теряется после завершения запроса.
     *
     * <p>BUG: после PUT повторный GET отдаёт старый url. Когда баг исправят,
     * этот тест должен упасть и его нужно будет заменить на проверку сохранения.</p>
     * TODO: Исправить тест после исправления обновления видео
     */
    @Test
    void updateVideo_currentImplementationDoesNotPersistNewUrl() throws Exception {
        Videos video = seedVideo(alice, "https://youtube.com/old");

        mockMvc.perform(jsonPut("/api/videos/" + video.getId(), Map.of("url", "https://youtube.com/new"))
                        .header("Authorization", bearer(aliceToken)))
                .andExpect(status().isOk());

        mockMvc.perform(getJson("/api/videos/" + video.getId())
                        .header("Authorization", bearer(aliceToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").value("https://youtube.com/old"));

        assertThat(videosRepository.findById(video.getId()).orElseThrow().getUrl())
                .isEqualTo("https://youtube.com/old");
    }

    @Test
    void updateVideo_whenNotOwned_shouldReturn404() throws Exception {
        Videos bobVideo = seedVideo(bob, "https://youtube.com/bob-old");

        mockMvc.perform(jsonPut("/api/videos/" + bobVideo.getId(), Map.of("url", "https://youtube.com/hacked"))
                        .header("Authorization", bearer(aliceToken)))
                .andExpect(status().isNotFound());

        assertThat(videosRepository.findById(bobVideo.getId()).orElseThrow().getUrl())
                .isEqualTo("https://youtube.com/bob-old");
    }

    @Test
    void updateVideo_withBlankUrl_shouldReturn400() throws Exception {
        Videos video = seedVideo(alice, "https://youtube.com/valid");

        mockMvc.perform(jsonPut("/api/videos/" + video.getId(), Map.of("url", ""))
                        .header("Authorization", bearer(aliceToken)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details.url").exists());
    }

    // ------------------------------------------------------------------
    // Замена тегов
    // ------------------------------------------------------------------

    @Test
    void replaceVideoTags_shouldReplaceExistingLinks() throws Exception {
        Videos video = seedVideo(alice, "https://youtube.com/retag", aliceTag);

        MvcResult result = mockMvc.perform(jsonPut("/api/videos/" + video.getId() + "/tags",
                        Map.of("tagIds", List.of(globalTag.getId())))
                        .header("Authorization", bearer(aliceToken)))
                .andExpect(status().isOk())
                .andReturn();

        assertThat(tagNames(json(result).path("tags"))).containsExactly("omega");

        List<VideoTag> links =
                videoTagRepository.findAllByVideoIdsWithTags(List.of(video.getId()));
        assertThat(links).hasSize(1);
        assertThat(links.get(0).getTag().getId()).isEqualTo(globalTag.getId());
    }

    @Test
    void replaceVideoTags_withEmptySet_shouldRemoveAllLinks() throws Exception {
        Videos video = seedVideo(alice, "https://youtube.com/clear", aliceTag, globalTag);

        mockMvc.perform(jsonPut("/api/videos/" + video.getId() + "/tags",
                        Map.of("tagIds", List.of()))
                        .header("Authorization", bearer(aliceToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tags").isEmpty());

        assertThat(videoTagRepository.findAllByVideoIdsWithTags(List.of(video.getId()))).isEmpty();
    }

    @Test
    void replaceVideoTags_withForeignTag_shouldReturn400AndKeepExistingLinks() throws Exception {
        Videos video = seedVideo(alice, "https://youtube.com/keep-links", aliceTag);

        mockMvc.perform(jsonPut("/api/videos/" + video.getId() + "/tags",
                        Map.of("tagIds", List.of(bobTag.getId())))
                        .header("Authorization", bearer(aliceToken)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(
                        containsString("Недоступные теги")));

        List<VideoTag> links =
                videoTagRepository.findAllByVideoIdsWithTags(List.of(video.getId()));
        assertThat(links).hasSize(1);
        assertThat(links.get(0).getTag().getId()).isEqualTo(aliceTag.getId());
    }

    @Test
    void replaceVideoTags_whenNotOwned_shouldReturn404() throws Exception {
        Videos bobVideo = seedVideo(bob, "https://youtube.com/bob-retag", bobTag);

        mockMvc.perform(jsonPut("/api/videos/" + bobVideo.getId() + "/tags",
                        Map.of("tagIds", List.of()))
                        .header("Authorization", bearer(aliceToken)))
                .andExpect(status().isNotFound());

        assertThat(videoTagRepository.findAllByVideoIdsWithTags(List.of(bobVideo.getId()))).hasSize(1);
    }

    // ------------------------------------------------------------------
    // Удаление
    // ------------------------------------------------------------------

    @Test
    void deleteVideo_withoutTags_shouldReturn204AndRemoveIt() throws Exception {
        Videos video = seedVideo(alice, "https://youtube.com/delete");

        mockMvc.perform(deleteJson("/api/videos/" + video.getId())
                        .header("Authorization", bearer(aliceToken)))
                .andExpect(status().isNoContent());

        assertThat(videosRepository.findById(video.getId())).isEmpty();

        mockMvc.perform(getJson("/api/videos/" + video.getId())
                        .header("Authorization", bearer(aliceToken)))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteVideo_whenNotOwned_shouldReturn404AndKeepIt() throws Exception {
        Videos bobVideo = seedVideo(bob, "https://youtube.com/bob-delete");

        mockMvc.perform(deleteJson("/api/videos/" + bobVideo.getId())
                        .header("Authorization", bearer(aliceToken)))
                .andExpect(status().isNotFound());

        assertThat(videosRepository.findById(bobVideo.getId())).isPresent();
    }

    /**
     * Фиксирует текущее (ошибочное) поведение: при удалении видео со связанными
     * тегами строки video_tags не удаляются каскадом, поэтому H2/Hibernate
     * возвращает нарушение внешнего ключа и клиент получает 500.
     *
     * <p>BUG: удаление видео с тегами должно работать (204), сейчас — 500.</p>
     * TODO: понять в чем ошибка почему H2 не удаляет каскадом теги
     */
    @Test
    void deleteVideo_withTags_currentImplementationReturnsServerError() throws Exception {
        Videos video = seedVideo(alice, "https://youtube.com/delete-tagged", aliceTag);

        mockMvc.perform(deleteJson("/api/videos/" + video.getId())
                        .header("Authorization", bearer(aliceToken)))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.status").value(500));

        // Транзакция удаления откатилась: видео и связь на месте.
        assertThat(videosRepository.findById(video.getId())).isPresent();
        assertThat(videoTagRepository.findAllByVideoIdsWithTags(List.of(video.getId()))).hasSize(1);
    }

    // ------------------------------------------------------------------
    // Сквозной сценарий
    // ------------------------------------------------------------------

    @Test
    void userJourney_registerLoginCreateTagCreateVideoFilterAndDelete() throws Exception {
        String displayName = uniqueName("journey");
        String email = uniqueEmail("journey");

        mockMvc.perform(jsonPost("/api/auth/register",
                        Map.of("displayName", displayName, "email", email, "password", RAW_PASSWORD)))
                .andExpect(status().isCreated());

        String token = loginToken(email, RAW_PASSWORD);

        MvcResult tagResult = mockMvc.perform(jsonPost("/api/tags", Map.of("name", "journey"))
                        .header("Authorization", bearer(token)))
                .andExpect(status().isCreated())
                .andReturn();
        long tagId = json(tagResult).path("id").asLong();

        JsonNode video = createVideo(token, "https://youtube.com/journey", Set.of(tagId), status().isCreated());
        long videoId = video.path("id").asLong();

        mockMvc.perform(getJson("/api/videos/me")
                        .param("tagIds", String.valueOf(tagId))
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(1));

        // Снимаем тег, иначе удаление видео упрётся в известный баг с video_tags.
        //TODO: посмотреть что будет когда баг с удалением испрвится
        mockMvc.perform(jsonPut("/api/videos/" + videoId + "/tags", Map.of("tagIds", List.of()))
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk());

        mockMvc.perform(deleteJson("/api/videos/" + videoId).header("Authorization", bearer(token)))
                .andExpect(status().isNoContent());

        mockMvc.perform(getJson("/api/videos/me").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(0));
    }

    // ------------------------------------------------------------------
    // Вспомогательные методы
    // ------------------------------------------------------------------

    private JsonNode createVideo(String token, String url, Set<Long> tagIds, ResultMatcher expectedStatus)
            throws Exception {
        Map<String, Object> payload = tagIds == null
                ? Map.of("url", url)
                : Map.of("url", url, "tagIds", tagIds);

        MvcResult result = mockMvc.perform(jsonPost("/api/videos", payload)
                        .header("Authorization", bearer(token)))
                .andExpect(expectedStatus)
                .andReturn();
        return json(result);
    }

    private static List<String> tagNames(JsonNode tags) {
        List<String> names = new ArrayList<>();
        tags.forEach(tag -> names.add(tag.path("name").asText()));
        return names;
    }
}
