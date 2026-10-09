package database.projectx.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import database.projectx.model.OAuthAccounts;
import database.projectx.model.User;

public interface OAuthAccountsRepository extends JpaRepository<OAuthAccounts, Long>{
    Optional<OAuthAccounts> findByUserId(User user);
}
