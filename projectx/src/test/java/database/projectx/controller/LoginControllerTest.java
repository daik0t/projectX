package database.projectx.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;

import database.projectx.dto.AuthResponse;
import database.projectx.dto.LoginRequest;
import database.projectx.dto.UserResponse;
import database.projectx.service.LoginService;

@SpringBootTest 
@AutoConfigureMockMvc 
public class LoginControllerTest {
    @Autowired 
    private MockMvc mockMvc;
    
    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean 
    private LoginService loginService;
    
    @Test
    void login_shouldReturnToken() throws Exception {
        LoginRequest req = new LoginRequest("alice@test.com", "password123");
        UserResponse user = new UserResponse(1L, "alice", "alice@test.com", true, LocalDateTime.now());
        AuthResponse res = AuthResponse.of("jwt-token", 86400L, user);
        
        when(loginService.login(any())).thenReturn(res);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("jwt-token"));
    }
}
