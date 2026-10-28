package database.projectx.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import database.projectx.model.Tags;

public interface TagsRepository extends JpaRepository<Tags, Long>{
    Optional<Tags> findByUserId(Long userId);

    @Query("""
        SELECT t FROM Tags t
        WHERE t.user.id = :userId OR t.user IS NULL
        ORDER BY t.name ASC
    """)
    List<Tags> findUserAndGlobalTags(@Param("userId") Long userId);

    @Query("""
        SELECT t FROM Tags t
        WHERE t.id IN :tagIds
        AND (t.user.id = :userId OR t.user IS NULL)
    """)
    List<Tags> findAllByIdsForUserOrGlobal(@Param("tagIds") Collection<Long> tagIds,
                                        @Param("userId") Long userId);

    @Query("""
        SELECT t FROM Tags t
        WHERE t.name = :name
        AND (t.user.id = :userId OR t.user IS NULL)
        ORDER BY t.user.id DESC NULLS LAST
    """)
    List<Tags> findByNameForUserOrGlobal(@Param("name") String name,
                                        @Param("userId") Long userId);
}
