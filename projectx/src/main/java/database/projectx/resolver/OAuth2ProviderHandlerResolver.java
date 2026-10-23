package database.projectx.resolver;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.stereotype.Component;

import database.projectx.handler.OAuth2ProviderHandler;
import lombok.extern.slf4j.Slf4j;

@Slf4j 
@Component 
public class OAuth2ProviderHandlerResolver {

    private final Map<String, OAuth2ProviderHandler> byName;

    public OAuth2ProviderHandlerResolver (List<OAuth2ProviderHandler> handlers) {
        this.byName = handlers.stream()
            .collect(Collectors.toMap(OAuth2ProviderHandler::getProviderName, Function.identity()));
    }

    public OAuth2ProviderHandler resolve(String provider){
        OAuth2ProviderHandler handler = byName.get(provider);
        if (handler == null) {
            throw new OAuth2AuthenticationException("Unsupported provider: " + provider);
        }
        return handler;
    }
}
