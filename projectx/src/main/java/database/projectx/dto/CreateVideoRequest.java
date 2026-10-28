package database.projectx.dto;

import java.util.Set;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateVideoRequest(
        @NotBlank(message = "url обязателен")
        @Size(max = 2048, message = "url слишком длинный")
        String url,

        Set<Long> tagIds
) {

}
