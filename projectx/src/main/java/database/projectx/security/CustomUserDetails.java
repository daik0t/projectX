package database.projectx.security;

import java.util.Collection;
import java.util.List;

import org.jspecify.annotations.Nullable;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import database.projectx.model.User;

public class CustomUserDetails implements UserDetails{
    private final Long id;
    private final String email;
    private final String passwordHash;
    private final String displayName;
    private final boolean emailVerified;  
    
    public CustomUserDetails ( 
        Long id,
        String email,
        String passwordHash,
        String displayName,
        Boolean emailVerified) {
            this.id = id;
            this.email = email;
            this.passwordHash = passwordHash;
            this.displayName = displayName;
            this.emailVerified = emailVerified;
    }

    public static CustomUserDetails from(User user, String email, String passwordHash, boolean verified){
        return new CustomUserDetails(user.getId(), email, passwordHash, passwordHash, verified);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }

    @Override
    public @Nullable String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    public Long getId() {
         return id;
    }

    public String getEmail() {
        return email;
    }

    public String getDisplayName() {
        return displayName;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

}
