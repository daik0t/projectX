// api по работе с пользователеями
package database.projectx.controller;

import database.projectx.model.User;
import database.projectx.service.UserService;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;


@RestController 
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<User> getAllUsers(){
        return userService.getAllUsers();
    }
    
    @PostMapping 
    public User createUser(@RequestBody User user){
        return userService.createUser(user);
    }
}
