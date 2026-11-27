package database.projectx.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Короткий текстовый ответ о результате операции")
public record MessageResponse(

        @Schema(
                description = "Сообщение о результате операции на русском языке",
                example = "Пароль успешно изменен",
                requiredMode = Schema.RequiredMode.REQUIRED)
        String message
) {

    public static MessageResponse of(String message) {
        return new MessageResponse(message);
    }
}
