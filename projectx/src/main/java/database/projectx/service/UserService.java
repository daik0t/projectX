// Тут будет бизнес-логика по работе с пользователем когда нибудь, а пока простые методы 
package database.projectx.service;

import database.projectx.dto.UserResponse;
import database.projectx.model.User;
import database.projectx.model.UserEmails;
import database.projectx.repository.UserEmailsRepository;
import database.projectx.repository.UserRepository;
import database.projectx.security.CustomUserDetails;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import java.util.List;

@Service 
public class UserService {
    private final UserRepository userRepository;
    private final UserEmailsRepository userEmailsRepository;

    public UserService(
        UserRepository userRepository,
        UserEmailsRepository userEmailsRepository
    ){
        this.userRepository = userRepository;
        this.userEmailsRepository = userEmailsRepository;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User createUser(User user){
        return userRepository.save(user);
    }

    public UserResponse getMe(Authentication authentication) {
    CustomUserDetails principal = (CustomUserDetails) authentication.getPrincipal();

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalStateException("user not found"));

        UserEmails email = userEmailsRepository.findByEmail(principal.getEmail())
                .orElseThrow(() -> new IllegalStateException("email not found"));
        
        return UserResponse.from(user, email);   
    }
}
