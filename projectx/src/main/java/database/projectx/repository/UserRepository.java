package database.projectx.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import database.projectx.model.User;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long>{
    Optional<User> findByDisplayName(String displayName);
}
