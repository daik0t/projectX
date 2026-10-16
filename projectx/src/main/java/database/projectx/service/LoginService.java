package database.projectx.service;

import database.projectx.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;

import database.projectx.dto.AuthResponse;
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
    private final JWTService jwtService;

    public LoginService(
        UserEmailsRepository userEmailsRepository,
        AuthenticationManager authenticationManager, 
        UserRepository userRepository,
        JWTService jwtService
    ) {
        this.userEmailsRepository = userEmailsRepository;
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    public AuthResponse login(LoginRequest request){
        Authentication authentication;

        try {
            authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );
        }
        catch (AuthenticationException ex) {
            log.warn("Неудачная попытка входа email={}", request.email());
            log.debug("Full exception", ex);
            throw new InvalidCredentialsException("Неверный email или пароль");
        }

        CustomUserDetails principal = (CustomUserDetails) authentication.getPrincipal();

        User user = userRepository.findById(principal.getId()).orElseThrow(
            () -> new IllegalStateException("Пользователь не найден id=" + principal.getId()));

        UserEmails userEmails = userEmailsRepository.findByEmail(principal.getEmail()).orElseThrow(
            () -> new IllegalStateException("Email не найден email=" + principal.getEmail()));

        String token = jwtService.generateToken(principal);        
        
        log.info("Успешный вход: id={}, email={}", user.getId(), userEmails.getEmail());
        UserResponse userResponse = UserResponse.from(user, userEmails);
        return AuthResponse.of(token, 86400L, userResponse);
    }
}
