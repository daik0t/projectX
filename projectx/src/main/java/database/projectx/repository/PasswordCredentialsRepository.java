package database.projectx.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import database.projectx.model.PasswordCredentials;
import database.projectx.model.User;

public interface PasswordCredentialsRepository extends JpaRepository<PasswordCredentials, Long>{
    Optional<PasswordCredentials> findByUserId(User user);
}
