package database.projectx.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Entity 
@Table (name = "password_reset_tokens")
@Data 
public class PasswordResetTokens {
    @Id 
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Long id;

    @JoinColumn(name = "user_id", nullable = false)
    @ManyToOne(fetch = FetchType.LAZY) 
    private User user;

    @Column (name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column (name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column (name = "used_at") 
    private LocalDateTime usedAt;
}   
