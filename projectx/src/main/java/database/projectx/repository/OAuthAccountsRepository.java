package database.projectx.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import database.projectx.model.OAuthAccounts;

public interface OAuthAccountsRepository extends JpaRepository<OAuthAccounts, Long>{
    Optional<OAuthAccounts> findByUserId(Long userId);
}
