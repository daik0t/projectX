package database.projectx.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

import database.projectx.model.Videos;


public interface VideosRepository extends JpaRepository<Videos, Long>{
    List<Videos> findByUserId(Long userId);

    @Query("""
        SELECT v FROM Videos v
        WHERE v.user.id = :userId
        ORDER BY v.id DESC
    """)
    List<Videos> findAllByUserIdOrderByIdDesc(@Param("userId") Long userId);

    boolean existsByIdAndUserId(Long videoId, Long userId);

    Optional<Videos> findByIdAndUserId(Long videoId, Long userId);
}
