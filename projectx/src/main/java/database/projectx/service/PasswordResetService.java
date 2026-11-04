package database.projectx.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import database.projectx.exception.BadRequestException;
import database.projectx.model.PasswordResetTokens;
import database.projectx.model.User;
import database.projectx.repository.PasswordResetTokenRepository;

@Service 
public class PasswordResetService {
    private static final long TTL_MINUTES = 15;
    private static  final SecureRandom RANDOM = new SecureRandom();

    private final PasswordResetTokenRepository tokenRepository;

    public PasswordResetService(PasswordResetTokenRepository tokenRepository) {
        this.tokenRepository = tokenRepository;
    }

    @Transactional 
    public String createResetToken(User user) {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        PasswordResetTokens token = new PasswordResetTokens();
        token.setUser(user);
        token.setTokenHash(sha256Hex(rawToken));
        token.setExpiresAt(LocalDateTime.now().plusMinutes(TTL_MINUTES));
        tokenRepository.save(token);

        return rawToken;
    }
    
    @Transactional 
    public User validAndConsumeToken (String rawToken){
        String hash = sha256Hex(rawToken);

        PasswordResetTokens token = tokenRepository.findByTokenHash(hash)
            .orElseThrow(() -> new BadRequestException("Недействительная или просроченная ссылка"));

        if(token.getUsedAt() != null) {
            throw new BadRequestException("Ссылка уже использована");
        }
        if(token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Срок действия сслыки истек");
        }

        int affected = tokenRepository.markUsed(hash, LocalDateTime.now());
        if(affected == 0) {
            throw new BadRequestException("Ссылка уже была использована");
        }

        return token.getUser();
    }

    private static String sha256Hex(String input){
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
