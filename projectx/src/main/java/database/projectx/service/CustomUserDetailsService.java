package database.projectx.service;

import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import database.projectx.model.PasswordCredentials;
import database.projectx.model.User;
import database.projectx.model.UserEmails;
import database.projectx.repository.PasswordCredentialsRepository;
import database.projectx.repository.UserEmailsRepository;
import database.projectx.repository.UserRepository;
import database.projectx.security.CustomUserDetails;

@Service 
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final UserEmailsRepository userEmailsRepository;
    private final PasswordCredentialsRepository passwordCredentialsRepository;

    public CustomUserDetailsService (
        UserRepository userRepository,
        UserEmailsRepository userEmailsRepository,
        PasswordCredentialsRepository passwordCredentialsRepository
    ) {
        this.userRepository = userRepository;
        this.userEmailsRepository = userEmailsRepository;
        this.passwordCredentialsRepository = passwordCredentialsRepository;
    }

    @Override
    public CustomUserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserEmails userEmails = userEmailsRepository.findByEmail(username).orElseThrow(
            () -> new UsernameNotFoundException("User not found" + username)
        );

        User user = userEmails.getUser();

        String passwordCredentials = passwordCredentialsRepository.findByUserId(user.getId())
        .map(PasswordCredentials::getPasswordHash).orElse(null);

        return CustomUserDetails.from(
            user, 
            userEmails.getEmail(), 
            passwordCredentials, 
            userEmails.getIsVerified()
        );
    }

    public CustomUserDetails loadUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + id));

        UserEmails userEmails = userEmailsRepository.findByUserId(id).orElse(null);
        return buildUserDetails(user, userEmails);
    }

    private CustomUserDetails buildUserDetails(User user, UserEmails userEmail) {
        String email = userEmail != null ? userEmail.getEmail() : null;
        boolean verified = userEmail != null && Boolean.TRUE.equals(userEmail.getIsVerified());

        String passwordHash = passwordCredentialsRepository.findByUserId(user.getId())
                .map(PasswordCredentials::getPasswordHash)
                .orElse(null);

        return CustomUserDetails.from(user, email, passwordHash, verified);
    }
}
