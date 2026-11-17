package database.projectx.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import database.projectx.dto.UserResponse;
import database.projectx.model.User;
import database.projectx.model.UserEmails;
import database.projectx.repository.UserEmailsRepository;
import database.projectx.repository.UserRepository;
import database.projectx.security.CustomUserDetails;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private UserEmailsRepository userEmailsRepository;

    @InjectMocks private UserService userService;

    @Test
    void getAllUsers_shouldReturnAllUsers() {
        User alice = user();
        User bob = new User(); bob.setId(2L); bob.setDisplayName("bob");
        when(userRepository.findAll()).thenReturn(List.of(alice, bob));

        List<User> result = userService.getAllUsers();

        assertThat(result).extracting(User::getDisplayName).containsExactly("alice", "bob");
    }

    @Test
    void createUser_shouldSaveAndReturnUser() {
        User user = user();
        when(userRepository.save(user)).thenReturn(user);

        User result = userService.createUser(user);

        assertThat(result).isSameAs(user);
    }

    @Test
    void getMe_whenAuthenticated_shouldReturnProfile() {
        User user = user();
        UserEmails email = email(user);
        CustomUserDetails principal = CustomUserDetails.from(user, "alice@test.com", "hash", true);

        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(principal);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userEmailsRepository.findByEmail("alice@test.com")).thenReturn(Optional.of(email));

        UserResponse response = userService.getMe(authentication);

        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.displayName()).isEqualTo("alice");
        assertThat(response.email()).isEqualTo("alice@test.com");
        assertThat(response.emailVerified()).isTrue();
    }

    @Test
    void getMe_whenUserMissing_shouldThrowException() {
        User user = user();
        CustomUserDetails principal = CustomUserDetails.from(user, "alice@test.com", "hash", true);

        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(principal);
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getMe(authentication))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("user not found");
    }

    @Test
    void getMe_whenEmailMissing_shouldThrowException() {
        User user = user();
        CustomUserDetails principal = CustomUserDetails.from(user, "alice@test.com", "hash", true);

        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(principal);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userEmailsRepository.findByEmail("alice@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getMe(authentication))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("email not found");
    }

    private static User user() {
        User user = new User();
        user.setId(1L);
        user.setDisplayName("alice");
        return user;
    }

    private static UserEmails email(User user) {
        UserEmails email = new UserEmails();
        email.setEmail("alice@test.com");
        email.setUser(user);
        email.setIsVerified(true);
        return email;
    }
}
