package database.projectx.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table (name = "videos")
@Data  
public class Videos {
    
    @Id 
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Long id;

    @JoinColumn (name = "user_id", nullable = false)
    @OneToOne 
    private User user;

    @Column(name = "url", nullable = false)
    private String url;
}
