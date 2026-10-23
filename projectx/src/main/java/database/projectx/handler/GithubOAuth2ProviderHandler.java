package database.projectx.handler;

import java.util.Map;

import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;

import database.projectx.dto.OAuthUserInfo;

@Component 
public class GithubOAuth2ProviderHandler implements OAuth2ProviderHandler{

    @Override
    public String getProviderName(){
        return "github";
    } 

    @Override 
    public String getNameAttributeKey(){
        return "id";
    }

    @Override 
    public OAuthUserInfo extract(OAuth2User user){
        Map<String, Object> a = user.getAttributes();

        Object id = a.get("id");
        if (id == null) {
            throw new OAuth2AuthenticationException("Github: id not found");
        }

        String email = (String) a.get("email");
        boolean verified = email != null;
        String name = (String) a.get("login");

        return new OAuthUserInfo(
            "github",
            String.valueOf(id),
            email,
            verified,
            name
        );
    } 
}
