package database.projectx.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import database.projectx.dto.CreateTagRequest;
import database.projectx.dto.TagDto;
import database.projectx.model.User;
import database.projectx.security.CustomUserDetails;
import database.projectx.service.TagService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest 
@AutoConfigureMockMvc 
public class TagControllerTest {
    @Autowired 
    private MockMvc mockMvc;
    
    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean 
    private TagService tagService;

    private CustomUserDetails mockPrincipal() {
        return CustomUserDetails.from(new User(), "test@test.com", "hash", true);
    }

    @Test
    void getAvailableTags_shouldReturnList() throws Exception {
        when(tagService.getAvailableTags(any())).thenReturn(List.of(new TagDto(1L, "gaming")));

        mockMvc.perform(get("/api/tags").with(user(mockPrincipal())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(1))
                .andExpect(jsonPath("$[0].name").value("gaming"));
    }

    @Test
    void createTag_whenNew_shouldReturn201() throws Exception {
        CreateTagRequest req = new CreateTagRequest("gaming");
        TagService.TagResult result = new TagService.TagResult(new TagDto(1L, "gaming"), true);
        
        when(tagService.createOrGetTag(any(), any())).thenReturn(result);

        mockMvc.perform(post("/api/tags")
                .with(user(mockPrincipal()))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated()); 
    }

    @Test
    void deleteTag_shouldReturn204() throws Exception {
        mockMvc.perform(delete("/api/tags/1").with(user(mockPrincipal())))
                .andExpect(status().isNoContent());
    }
}
