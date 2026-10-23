package database.projectx.handler;

import database.projectx.dto.OAuthUserInfo;
import org.springframework.security.oauth2.core.user.OAuth2User;

public interface OAuth2ProviderHandler {

    String getProviderName();

    String getNameAttributeKey();

    OAuthUserInfo extract(OAuth2User user);
}
