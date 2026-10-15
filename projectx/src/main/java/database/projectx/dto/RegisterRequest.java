package database.projectx.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(

        @NotBlank(message = "displayName обязателен")
        @Size(min = 3, max = 30, message = "displayName должен быть от 3 до 30 символов")
        @Pattern(
                regexp = "^[a-zA-Z0-9_]+$",
                message = "displayName может содержать только буквы, цифры и _"
        )
        String displayName,

        @NotBlank(message = "email обязателен")
        @Email(message = "некорректный email")
        @Size(max = 255, message = "email слишком длинный")
        String email,

        @NotBlank(message = "password обязателен")
        @Size(min = 8, max = 100, message = "пароль должен быть от 8 до 100 символов")
        String password
) {
}
