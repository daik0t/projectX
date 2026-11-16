package database.projectx.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultMatcher;

import com.fasterxml.jackson.databind.JsonNode;

import database.projectx.model.Tags;
import database.projectx.model.User;

/**
 * Интеграционные тесты /api/tags: создание, идемпотентность, видимость
 * собственных и глобальных тегов, права владельца.
 */
class TagApiIntegrationTest extends IntegrationTestBase {

    private User alice;
    private User bob;
    private String aliceToken;
    private String bobToken;

    @BeforeEach
    void seedUsers() {
        alice = seedVerifiedUser();
        bob = seedVerifiedUser();
        aliceToken = tokenFor(alice);
        bobToken = tokenFor(bob);
    }

    @Test
    void createTag_shouldReturn201AndPersistOwnTag() throws Exception {
        String name = "gaming";

        MvcResult result = mockMvc.perform(jsonPost("/api/tags", Map.of("name", name))
                        .header("Authorization", bearer(aliceToken)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value(name))
                .andReturn();

        long tagId = json(result).path("id").asLong();
        Tags saved = tagsRepository.findById(tagId).orElseThrow();
        assertThat(saved.getName()).isEqualTo(name);
        assertThat(tagsRepository.findByIdAndUserId(tagId, alice.getId())).isPresent();
        assertThat(tagsRepository.findByIdAndUserId(tagId, bob.getId())).isEmpty();
    }

    @Test
    void createTag_whenSameNameExists_shouldReturn200WithExistingId() throws Exception {
        String name = "music";

        long firstId = createTag(aliceToken, name, status().isCreated());
        long secondId = createTag(aliceToken, name, status().isOk());

        assertThat(secondId).isEqualTo(firstId);
        assertThat(tagsRepository.findByUserId(alice.getId())).hasSize(1);
    }

    @Test
    void createTag_whenGlobalTagWithSameNameExists_shouldNotDuplicateIt() throws Exception {
        Tags global = seedTag(null, "globaltag");

        long tagId = createTag(aliceToken, "globaltag", status().isOk());

        assertThat(tagId).isEqualTo(global.getId());
        assertThat(tagsRepository.findByUserId(alice.getId())).isEmpty();
    }

    @Test
    void createTag_withInvalidName_shouldReturn400() throws Exception {
        mockMvc.perform(jsonPost("/api/tags", Map.of("name", "a!"))
                        .header("Authorization", bearer(aliceToken)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.details.name").exists());

        assertThat(tagsRepository.count()).isZero();
    }

    @Test
    void createTag_withoutToken_shouldReturn401() throws Exception {
        mockMvc.perform(jsonPost("/api/tags", Map.of("name", "gaming")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getTags_shouldReturnOnlyOwnAndGlobalTagsSortedByName() throws Exception {
        seedTag(alice, "alpha");
        seedTag(bob, "beta");
        seedTag(null, "omega");

        MvcResult result = mockMvc.perform(getJson("/api/tags")
                        .header("Authorization", bearer(aliceToken)))
                .andExpect(status().isOk())
                .andReturn();

        assertThat(tagNames(json(result))).containsExactly("alpha", "omega");
    }

    @Test
    void getTags_whenUserHasNoOwnTags_shouldReturnOnlyGlobalTags() throws Exception {
        seedTag(null, "global-one");
        seedTag(alice, "private-one");

        MvcResult result = mockMvc.perform(getJson("/api/tags")
                        .header("Authorization", bearer(bobToken)))
                .andExpect(status().isOk())
                .andReturn();

        assertThat(tagNames(json(result))).containsExactly("global-one");
    }

    @Test
    void getTags_withoutToken_shouldReturn401() throws Exception {
        mockMvc.perform(getJson("/api/tags"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deleteOwnTag_shouldReturn204AndRemoveIt() throws Exception {
        Tags tag = seedTag(alice, "deleteme");

        mockMvc.perform(deleteJson("/api/tags/" + tag.getId())
                        .header("Authorization", bearer(aliceToken)))
                .andExpect(status().isNoContent());

        assertThat(tagsRepository.findById(tag.getId())).isEmpty();
    }

    @Test
    void deleteForeignTag_shouldReturn404AndKeepIt() throws Exception {
        Tags bobTag = seedTag(bob, "bobs-tag");

        mockMvc.perform(deleteJson("/api/tags/" + bobTag.getId())
                        .header("Authorization", bearer(aliceToken)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Тег не найден " + bobTag.getId()));

        assertThat(tagsRepository.findById(bobTag.getId())).isPresent();
    }

    @Test
    void deleteMissingTag_shouldReturn404() throws Exception {
        mockMvc.perform(deleteJson("/api/tags/999999")
                        .header("Authorization", bearer(aliceToken)))
                .andExpect(status().isNotFound());
    }

    private long createTag(String token, String name, ResultMatcher expectedStatus) throws Exception {
        MvcResult result = mockMvc.perform(jsonPost("/api/tags", Map.of("name", name))
                        .header("Authorization", bearer(token)))
                .andExpect(expectedStatus)
                .andReturn();
        return json(result).path("id").asLong();
    }

    private static List<String> tagNames(JsonNode tags) {
        List<String> names = new ArrayList<>();
        tags.forEach(tag -> names.add(tag.path("name").asText()));
        return names;
    }
}
