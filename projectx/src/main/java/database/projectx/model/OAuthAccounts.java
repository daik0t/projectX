package database.projectx.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity 
@Table (
    name = "oauth_accounts",
    uniqueConstraints = @UniqueConstraint (
        name = "oauth_accounts_provider_provider_user_id_ke",
        columnNames = {"provider", "provider_user_id"}
    )
)
@Data 
public class OAuthAccounts {

    @Id
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Long id;
    
    @JoinColumn (name = "user_id", nullable = false)
    @OneToOne 
    private User user;

    @Column (name = "provider", nullable = false, length = 255)
    private String provider;

    @Column (name = "provider_user_id", nullable = false, length = 255)
    private String providerUserId;
}
