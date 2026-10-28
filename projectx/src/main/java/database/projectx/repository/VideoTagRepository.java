package database.projectx.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import database.projectx.model.VideoTag;
import database.projectx.model.VideoTagId;

public interface VideoTagRepository extends JpaRepository<VideoTag, VideoTagId>{
        @Query("""
        SELECT vt FROM VideoTag vt
        JOIN FETCH vt.tag
        WHERE vt.video.id IN :videoIds
    """)
    List<VideoTag> findAllByVideoIdsWithTags(@Param("videoIds") Collection<Long> videoIds);

    @Modifying
    @Query("DELETE FROM VideoTag vt WHERE vt.video.id = :videoId")
    void deleteByVideoId(@Param("videoId") Long videoId);
}
