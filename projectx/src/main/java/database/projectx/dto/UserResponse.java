package database.projectx.dto;

import database.projectx.model.User;
import database.projectx.model.UserEmails;

import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String displayName,
        String email,
        boolean emailVerified,
        LocalDateTime createdAt
) {

    // Удобная фабрика — собирает DTO из сущностей
    public static UserResponse from(User user, UserEmails primaryEmail) {
        return new UserResponse(
                user.getId(),
                user.getDisplayName(),
                primaryEmail.getEmail(),
                primaryEmail.getIsVerified(),
                user.getCreatedAt()
        );
    }
}
