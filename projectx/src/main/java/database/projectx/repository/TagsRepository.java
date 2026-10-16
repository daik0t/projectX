package database.projectx.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import database.projectx.model.Tags;

public interface TagsRepository extends JpaRepository<Tags, Long>{
    Optional<Tags> findByUserId(Long userId);
}
