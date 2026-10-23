package database.projectx.dto;

public record OAuthUserInfo (
    String provider,
    String providerUserId,
    String email,
    boolean isEmailVerified,
    String name
) {}
