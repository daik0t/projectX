// api по работе с пользователеями
package database.projectx.controller;

import database.projectx.dto.UserResponse;
import database.projectx.model.User;
import database.projectx.service.UserService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;



@RestController 
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    public UserController(
        UserService userService
    ) {
        this.userService = userService;
        
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(Authentication authentication) {
        UserResponse userResponse = userService.getMe(authentication);
        return ResponseEntity.ok(userResponse);
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
