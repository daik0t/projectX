package database.projectx.model;

import java.io.Serializable;

import jakarta.persistence.*;
import lombok.Data;

@Embeddable
@Data 
public class VideoTagId implements Serializable{
    @Column (name = "video_id")
    private Long videoId;

    @Column (name = "tag_id")
    private Long tagId;
}
