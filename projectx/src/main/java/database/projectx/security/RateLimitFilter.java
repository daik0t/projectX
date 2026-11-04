package database.projectx.security;

import java.io.IOException;
import java.time.Duration;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import database.projectx.service.RateLimitService;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component 
public class RateLimitFilter extends OncePerRequestFilter{
    private final RateLimitService rateLimitService;

    public RateLimitFilter(RateLimitService rateLimitService) {
        this.rateLimitService = rateLimitService;
    }
 
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String path = request.getRequestURI();

        if(isAuthEndpoint(path)) {
            String clientIp = getClientIp(request);

            Bucket bucket = rateLimitService.resolveBucket(clientIp, 5, Duration.ofMinutes(1));
            ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        
            if (!probe.isConsumed()) {
                long waitForRefillSeconds = probe.getNanosToWaitForRefill() / 1000000000;
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setHeader("Retry-After", String.valueOf(waitForRefillSeconds));
                response.setContentType("application/json;character=UTF-8");
                response.getWriter().write("""
                    {"status":429,"error":"Too Many Requests","message":"Too many requests. Try again later"}
                """);
                return;
            }
        }

        filterChain.doFilter(request, response);

        
    }

    private boolean isAuthEndpoint(String path){
        return path.equals("/api/auth/login") || path.equals("/api/auth/register");
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwwrded-For");
        if(xfHeader == null || xfHeader.isEmpty() || "unknown".equalsIgnoreCase(xfHeader)){
            return request.getRemoteAddr();
        }

        return xfHeader.split(",")[0].trim();
    }
}
