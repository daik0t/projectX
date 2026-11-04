package database.projectx.service;

import database.projectx.dto.ResetPasswordRequest;
import database.projectx.model.PasswordCredentials;
import database.projectx.model.User;
import database.projectx.repository.PasswordCredentialsRepository;
import database.projectx.repository.UserEmailsRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.extern.slf4j.Slf4j;

@Slf4j 
@Service 
public class PasswordService {
    private final PasswordEncoder passwordEncoder;
    private final PasswordCredentialsRepository passwordCredentialsRepository;
    private final UserEmailsRepository userEmailsRepository;
    private final PasswordResetService passwordResetService;
    private final EmailService emailService;
    
    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public PasswordService (PasswordResetService passwordResetService, EmailService emailService, UserEmailsRepository userEmailsRepository, PasswordCredentialsRepository passwordCredentialsRepository, PasswordEncoder passwordEncoder) {
        this.passwordResetService = passwordResetService;
        this.emailService = emailService;
        this.userEmailsRepository = userEmailsRepository;
        this.passwordCredentialsRepository = passwordCredentialsRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional (readOnly = false)
    public void requestPasswordReset(String email) {
        userEmailsRepository.findByEmail(email).ifPresent(userEmail -> {
            User user = userEmail.getUser();
            String rawToken = passwordResetService.createResetToken(user);

            String resetLink = frontendUrl + "/reset-password?token=" + rawToken;
            emailService.sendPasswordResetEmail(email, resetLink);
        }); 
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request){
        User user = passwordResetService.validAndConsumeToken(request.token());

        PasswordCredentials credentials = passwordCredentialsRepository.findByUserId(user.getId())
        .orElseGet(() -> {
            PasswordCredentials pc = new PasswordCredentials();
            pc.setUser(user);
            return pc;
        });

        credentials.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        passwordCredentialsRepository.save(credentials);

        log.info("Пароль успешно сброшен для user_id =", user.getId());
    }

}
