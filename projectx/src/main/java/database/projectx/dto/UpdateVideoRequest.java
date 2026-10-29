package database.projectx.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateVideoRequest(
    @NotBlank(message = "url обязателен")
    @Size (max = 2048, message = "url слишком длинный")
    String url
) {

}
