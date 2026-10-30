package database.projectx.service;

import java.util.Date;
import java.util.function.Function;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import database.projectx.security.CustomUserDetails;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

@Service 
public class JWTService {

    private final SecretKey signinKey;
    private final Long expirationMs;

    public JWTService (
        @Value("${jwt.secret}") String secret,
        @Value("${jwt.expiration-ms}") Long expirationMs
    ) {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        this.signinKey = Keys.hmacShaKeyFor(keyBytes);
        this.expirationMs = expirationMs;
    }

    public String generateToken(CustomUserDetails userDetails){
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
        .subject(String.valueOf(userDetails.getId()))
        .issuedAt(now)
        .expiration(expiry)
        .signWith(signinKey)
        .compact();
    }

    public Long extractUserId(String token) {
        String sub = extractClaim(token, Claims::getSubject);
        return Long.parseLong(sub);
    }

    public boolean isTokenValid(String token, CustomUserDetails userDetails){
        try {
            Long userId = extractUserId(token);
            return userId.equals(userDetails.getId()) && !isTokenExpired(token);
        } catch (Exception ex){
            return false;
        }
    }

    public boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    private <T> T extractClaim(String token, Function<Claims, T> resolver) {
        Claims claims = Jwts.parser()
        .verifyWith(signinKey)
        .build()
        .parseSignedClaims(token)
        .getPayload();
        return resolver.apply(claims);
    } 
}
