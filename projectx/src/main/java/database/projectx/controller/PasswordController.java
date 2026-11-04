package database.projectx.controller;

import database.projectx.service.PasswordService;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import database.projectx.dto.ForgotPasswordRequest;
import database.projectx.dto.ResetPasswordRequest;
import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@Controller 
@RequestMapping("/api/auth")
public class PasswordController {

    private final PasswordService passwordService;

    PasswordController(PasswordService passwordService) {
        this.passwordService = passwordService;
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordService.requestPasswordReset(request.email());
        
        return ResponseEntity.ok(Map.of("message", "Если такой email зарегестрирован то инструкции по сбросу отправлены"));
    }
    
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordService.resetPassword(request);
        
        return ResponseEntity.ok(Map.of("message", "Пароль успешно изменен"));
    }
    
}
