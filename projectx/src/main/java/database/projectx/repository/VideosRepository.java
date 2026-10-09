package database.projectx.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import database.projectx.model.Videos;
import database.projectx.model.User;


public interface VideosRepository extends JpaRepository<Videos, Long>{
    Optional<Videos> findByUserId(User user);
}
