package database.projectx.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import database.projectx.model.UserEmails;
import java.util.Optional;


public interface UserEmailsRepository extends JpaRepository<UserEmails, Long>{
    Optional<UserEmails> findByUserId(Long userId);

    Optional<UserEmails> findByEmail(String email);

    boolean existsByEmail(String email);
}
