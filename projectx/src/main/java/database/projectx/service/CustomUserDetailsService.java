package database.projectx.service;

import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import database.projectx.model.PasswordCredentials;
import database.projectx.model.User;
import database.projectx.model.UserEmails;
import database.projectx.repository.PasswordCredentialsRepository;
import database.projectx.repository.UserEmailsRepository;
import database.projectx.security.CustomUserDetails;

@Service 
public class CustomUserDetailsService implements UserDetailsService {

    private final UserEmailsRepository userEmailsRepository;
    private final PasswordCredentialsRepository passwordCredentialsRepository;

    public CustomUserDetailsService (
        UserEmailsRepository userEmailsRepository,
        PasswordCredentialsRepository passwordCredentialsRepository
    ) {
        this.userEmailsRepository = userEmailsRepository;
        this.passwordCredentialsRepository = passwordCredentialsRepository;
    }

    @Override
    public CustomUserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserEmails userEmails = userEmailsRepository.findByEmail(username).orElseThrow(
            () -> new UsernameNotFoundException("User not found" + username)
        );

        User user = userEmails.getUser();

        final PasswordCredentials passwordCredentials = passwordCredentialsRepository.findByUserId(user.getId()).orElseThrow(
            () -> new UsernameNotFoundException("Password wrong" + username)
        ); 

        return CustomUserDetails.from(
            user, 
            userEmails.getEmail(), 
            passwordCredentials.getPasswordHash(), 
            userEmails.getIsVerified()
        );
    }
}
