package database.projectx.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import database.projectx.model.UserEmails;
import database.projectx.model.User;
import java.util.Optional;

public interface UserEmailsRepository extends JpaRepository<UserEmails, Long>{
    Optional<UserEmails> findByUserId(User user);
}
