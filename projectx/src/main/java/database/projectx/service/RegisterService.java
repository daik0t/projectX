package database.projectx.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import database.projectx.dto.RegisterRequest;
import database.projectx.dto.UserResponse;
import database.projectx.exception.DuplicateResourceException;
import database.projectx.model.PasswordCredentials;
import database.projectx.model.User;
import database.projectx.model.UserEmails;
import database.projectx.repository.PasswordCredentialsRepository;
import database.projectx.repository.UserEmailsRepository;
import database.projectx.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;

@Slf4j 
@Service
public class RegisterService {
    private final UserRepository userRepository;
    private final UserEmailsRepository userEmailsRepository;
    private final PasswordCredentialsRepository passwordCredentialsRepository;
    private final PasswordEncoder passwordEncoder;

    public RegisterService (
        UserRepository userRepository, 
        UserEmailsRepository userEmailsRepository,
        PasswordCredentialsRepository passwordCredentialsRepository,
        PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.userEmailsRepository = userEmailsRepository;
        this.passwordCredentialsRepository = passwordCredentialsRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional 
    public UserResponse register(RegisterRequest request){
        if (userRepository.existsByDisplayName(request.displayName())) {
            throw new DuplicateResourceException("dsiplayName", "displayName уже занят");
        }

        if (userEmailsRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("email", "email уже используется");
        }

        String passwordHash = passwordEncoder.encode(request.password());

        User user = new User();
        user.setDisplayName(request.displayName());
        user = userRepository.save(user);

        UserEmails userEmails = new UserEmails();
        userEmails.setEmail(request.email());
        userEmails.setUser(user);
        userEmails.setIsVerified(false);
        userEmails = userEmailsRepository.save(userEmails);

        PasswordCredentials passwordCredentials = new PasswordCredentials();
        passwordCredentials.setUser(user);
        passwordCredentials.setPasswordHash(passwordHash);
        passwordCredentials = passwordCredentialsRepository.save(passwordCredentials);

        log.info("Пользователь зарегестрирован: id={}, email={}", user.getId(), userEmails.getEmail());

        return UserResponse.from(user, userEmails);
    }
}
