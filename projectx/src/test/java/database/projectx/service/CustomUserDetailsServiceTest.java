package database.projectx.service;

import database.projectx.model.PasswordCredentials;
import database.projectx.model.User;
import database.projectx.model.UserEmails;
import database.projectx.repository.PasswordCredentialsRepository;
import database.projectx.repository.UserEmailsRepository;
import database.projectx.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private UserEmailsRepository userEmailsRepository;
    @Mock private PasswordCredentialsRepository passwordCredentialsRepository;

    @InjectMocks private CustomUserDetailsService userDetailsService;

    @Test
    void loadUserByUsername_whenUserExists_shouldReturnDetails() {
        User user = new User(); user.setId(1L);
        UserEmails email = new UserEmails(); email.setEmail("test@test.com"); email.setUser(user);
        PasswordCredentials pwd = new PasswordCredentials(); pwd.setPasswordHash("hash");

        when(userEmailsRepository.findByEmail("test@test.com")).thenReturn(Optional.of(email));
        when(passwordCredentialsRepository.findByUserId(1L)).thenReturn(Optional.of(pwd));

        var result = userDetailsService.loadUserByUsername("test@test.com");

        assertThat(result.getUsername()).isEqualTo("test@test.com");
        assertThat(result.getPassword()).isEqualTo("hash");
    }

    @Test
    void loadUserByUsername_whenOAuthUserWithoutPassword_shouldReturnDetailsWithNullPassword() {
        User user = new User(); user.setId(1L);
        UserEmails email = new UserEmails(); email.setEmail("oauth@test.com"); email.setUser(user);

        when(userEmailsRepository.findByEmail("oauth@test.com")).thenReturn(Optional.of(email));
        when(passwordCredentialsRepository.findByUserId(1L)).thenReturn(Optional.empty());

        var result = userDetailsService.loadUserByUsername("oauth@test.com");

        assertThat(result.getPassword()).isNull();
    }

    @Test
    void loadUserById_whenNotFound_shouldThrowException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userDetailsService.loadUserById(99L))
                .isInstanceOf(UsernameNotFoundException.class);
    }
}