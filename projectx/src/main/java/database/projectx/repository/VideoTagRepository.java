package database.projectx.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import database.projectx.model.VideoTag;
import database.projectx.model.VideoTagId;

public interface VideoTagRepository extends JpaRepository<VideoTag, VideoTagId>{
    //TODO: придумать запросы
}
