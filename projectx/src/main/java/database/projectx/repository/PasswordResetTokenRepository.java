package database.projectx.repository;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import database.projectx.model.PasswordResetTokens;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetTokens, Long> {
    Optional<PasswordResetTokens> findByTokenHash(String tokenHash);

    @Modifying 
    @Query ("UPDATE PasswordResetTokens t SET t.usedAt = :now WHERE t.tokenHash = :hash AND t.usedAt IS NULL")
    int markUsed(@Param ("hash") String hash, @Param ("now") LocalDateTime now);
}
