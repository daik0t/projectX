package database.projectx.service;

import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;

@Slf4j 
@Service 
public class EmailService {

    public void sendPasswordResetEmail(String toEmail, String resetLink){
        // TODO: после реализации отправки нормального письма заменить тут тоже
        log.info("=== EMAIL SENT TO: {} ===", toEmail);
        log.info("Ссылка для сброса пароля: {}", resetLink);
        log.info("=================================");
    }
}
