package database.projectx.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;

import database.projectx.dto.CreateVideoRequest;
import database.projectx.dto.VideoResponse;
import database.projectx.model.User;
import database.projectx.security.CustomUserDetails;
import database.projectx.service.VideoService;

@SpringBootTest 
@AutoConfigureMockMvc
public class VideoControllerTest {
    @Autowired 
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean 
    private VideoService videoService;

    private CustomUserDetails mockPrincipal(){
        return CustomUserDetails.from(
            new User(), "test@example.com", "hash", true
        );
    }

    @Test 
    void getMyVideos_shouldReturnListOfVideos() throws Exception {
        VideoResponse mockVideo = new VideoResponse(1L, "test", Set.of());
        when(videoService.getMyVideos(any())).thenReturn(List.of(mockVideo));
        
        mockMvc.perform(get("/api/videos/me").with(user(mockPrincipal())))
        .andDo(print())
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.size()").value(1))
        .andExpect(jsonPath("$[0].url").value("test"));
        
    }

    @Test
    void createVideo_shouldReturn201() throws Exception {
        CreateVideoRequest req = new CreateVideoRequest("https://youtube.com/new", Set.of(1L));
        VideoResponse res = new VideoResponse(2L, "https://youtube.com/new", Set.of());
        
        when(videoService.createVideo(any(), any())).thenReturn(res);

        mockMvc.perform(post("/api/videos")
                .with(user(mockPrincipal()))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.url").value("https://youtube.com/new"));
    }

    @Test
    void deleteVideo_shouldReturn204() throws Exception {
        mockMvc.perform(delete("/api/videos/1").with(user(mockPrincipal())))
                .andExpect(status().isNoContent());
    }
}
