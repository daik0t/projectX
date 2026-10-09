package database.projectx.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

@Entity 
@Table (name="users")
@Data
public class User {

    @Id
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "display_name", nullable = false, unique = true, length = 30)
    private String displayName;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp 
    private LocalDateTime createdAt;

} 
