package database.projectx.dto;

import database.projectx.model.Tags;

public record TagDto(Long id, String name) {
    public static TagDto from(Tags tag) {
        return new TagDto(tag.getId(), tag.getName());
    }
}
