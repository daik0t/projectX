package database.projectx.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import database.projectx.model.Tags;
import database.projectx.model.User;

public interface TagsRepository extends JpaRepository<Tags, Long>{
    Optional<Tags> findByUserId(User user);
}
