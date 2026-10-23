package database.projectx.handler;

import java.util.Map;

import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;

import database.projectx.dto.OAuthUserInfo;

@Component 
public class GoogleOAuth2ProviderHandler implements OAuth2ProviderHandler{

    @Override 
    public String getProviderName(){
        return "google";
    }

    @Override 
    public String getNameAttributeKey(){
        return "sub";
    }

    @Override 
    public OAuthUserInfo extract(OAuth2User user){
        Map<String, Object> a = user.getAttributes();

        Object sub = a.get("sub");
        if (sub == null) {
            throw new OAuth2AuthenticationException("Google: missing sub");
        }

        String email = (String) a.get("email");
        boolean verified = true;
        String name = (String) a.get("name");

        return new OAuthUserInfo(
            "google",
            String.valueOf(sub),
            email,
            verified,
            name
        );
    }
}
