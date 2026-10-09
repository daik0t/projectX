package database.projectx.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity 
@Table (name = "user_emails")
@Data 
public class UserEmails {

    @Id 
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Long id;

    @JoinColumn (name = "user_id", nullable = false)
    @OneToOne 
    private User user;

    @Column (name = "email", unique = true, nullable = false, length = 255)
    private String email;

    @Column (name = "is_verified", nullable = false)
    private Boolean isVerified;

}
