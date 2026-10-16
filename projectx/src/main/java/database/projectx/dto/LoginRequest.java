package database.projectx.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(

        @NotBlank(message = "email обязателен")
        @Email(message = "некорректный email")
        String email,

        @NotBlank(message = "password обязателен")
        String password
) {
}
