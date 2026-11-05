package database.projectx.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import database.projectx.dto.*;
import database.projectx.service.RegisterService;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc 
public class RegisterControllerTest {
    @Autowired 
    private MockMvc mockMvc;
    
    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean 
    private RegisterService registerService;

    @Test
    void register_shouldReturn201() throws Exception {
        RegisterRequest req = new RegisterRequest("alice", "alice@test.com", "password123");
        UserResponse res = new UserResponse(1L, "alice", "alice@test.com", false, LocalDateTime.now());
        when(registerService.register(any())).thenReturn(res);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.email").value("alice@test.com"));
    }

    @Test
    void register_withInvalidData_shouldReturn400() throws Exception {
        RegisterRequest req = new RegisterRequest("", "not-an-email", "123");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details.displayName").exists())
                .andExpect(jsonPath("$.details.email").exists())
                .andExpect(jsonPath("$.details.password").exists());
    }
}
