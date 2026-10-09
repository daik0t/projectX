package database.projectx.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity 
@Table (name="password_credentials")
@Data 
public class PasswordCredentials {
    
    @Id 
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Long id;

    @JoinColumn(name = "user_id", nullable = false)
    @OneToOne 
    private User user;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;
}
