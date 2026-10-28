package database.projectx.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateTagRequest(

    @NotBlank(message = "name обязателен")
    @Size(min = 2, max = 30, message = "name должен быть от 2 до 30 символов")
    @Pattern(regexp = "^[a-zA-Z0-9_\\-]+$",
             message = "name может содержать только буквы, цифры, - и _")
    String name
) {
    
}
