package database.projectx.dto;

import java.util.Set;

public record UpdateVideoTagsRequest(Set<Long> tagIds) {
    
}
