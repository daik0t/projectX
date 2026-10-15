package database.projectx.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import database.projectx.model.PasswordCredentials;

public interface PasswordCredentialsRepository extends JpaRepository<PasswordCredentials, Long>{
    Optional<PasswordCredentials> findByUserId(Long userId);
}
