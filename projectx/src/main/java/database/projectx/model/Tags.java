package database.projectx.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity 
@Table (name = "tags")
@Data 
public class Tags {

    @Id 
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Long id;

    @JoinColumn (name = "user_id", nullable = true)
    @OneToOne 
    private User user;

    @Column (name = "name", nullable = false, length = 30)
    private String name;
}
