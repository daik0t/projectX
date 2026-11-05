package database.projectx.controller;

import database.projectx.dto.UserResponse;
import database.projectx.model.User;
import database.projectx.security.CustomUserDetails;
import database.projectx.service.UserService;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc 
class UserControllerTest {

    @Autowired 
    private MockMvc mockMvc;

    @MockitoBean 
    private UserService userService;

    @Test
    void getMe_shouldReturnUserProfile() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setDisplayName("alice");
        
        CustomUserDetails principal = CustomUserDetails.from(user, "alice@test.com", "hash", true);

        UserResponse mockResponse = new UserResponse(
                1L, "alice", "alice@test.com", true, LocalDateTime.now()
        );
        
        when(userService.getMe(any())).thenReturn(mockResponse);

        mockMvc.perform(get("/api/users/me").with(user(principal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.displayName").value("alice"));
    }
}