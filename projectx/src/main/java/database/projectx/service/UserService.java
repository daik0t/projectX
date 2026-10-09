// Тут будет бизнес-логика по работе с пользователем когда нибудь, а пока простые методы 
package database.projectx.service;

import database.projectx.model.User;
import database.projectx.repository.UserRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service 
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository){
        this.userRepository = userRepository;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User createUser(User user){
        return userRepository.save(user);
    }
}
