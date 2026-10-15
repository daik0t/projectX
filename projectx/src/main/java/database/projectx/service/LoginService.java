package database.projectx.service;

import database.projectx.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;

import database.projectx.dto.LoginRequest;
import database.projectx.dto.UserResponse;
import database.projectx.exception.InvalidCredentialsException;
import database.projectx.model.User;
import database.projectx.model.UserEmails;
import database.projectx.repository.UserEmailsRepository;
import database.projectx.security.CustomUserDetails;
import lombok.extern.slf4j.Slf4j;

@Slf4j 
@Service 
public class LoginService {
    private final UserRepository userRepository;
    private final UserEmailsRepository userEmailsRepository;
    private final AuthenticationManager authenticationManager;

    public LoginService(
        UserEmailsRepository userEmailsRepository,
        AuthenticationManager authenticationManager, 
        UserRepository userRepository
    ) {
        this.userEmailsRepository = userEmailsRepository;
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
    }

    public UserResponse login(LoginRequest request){
        Authentication authentication;

        try {
            authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );
        }
        catch (AuthenticationException ex) {
            log.warn("Неудачная попытка входа email={}", request.email());
            log.debug("Full exception", ex);   // ← полный стек, только в DEBUG
            throw new InvalidCredentialsException("Неверный email или пароль");
        }

        CustomUserDetails principal = (CustomUserDetails) authentication.getPrincipal();

        User user = userRepository.findById(principal.getId()).orElseThrow(
            () -> new IllegalStateException("Пользователь не найден id=" + principal.getId()));

        UserEmails userEmails = userEmailsRepository.findByEmail(principal.getEmail()).orElseThrow(
            () -> new IllegalStateException("Email не найден email=" + principal.getEmail()));
        
        log.info("Успешный вход: id={}, email={}", user.getId(), userEmails.getEmail());
        return UserResponse.from(user, userEmails);
    }
}
