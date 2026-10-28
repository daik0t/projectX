package database.projectx.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity 
@Table (name = "video_tags")
@Data 
public class VideoTag {
    @EmbeddedId 
    private VideoTagId id;

    @ManyToOne (fetch = FetchType.LAZY)
    @MapsId ("videoId")
    @JoinColumn (name = "video_id", nullable = false)
    private Videos video;

    @ManyToOne (fetch = FetchType.LAZY)
    @MapsId ("tagId")
    @JoinColumn (name = "tag_id", nullable = false)
    private Tags tag;
    
}
