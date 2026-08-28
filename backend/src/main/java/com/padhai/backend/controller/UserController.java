package com.padhai.backend.controller;
import java.util.List;
import com.padhai.backend.entity.User;
import com.padhai.backend.service.UserService;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.List;
import java.util.Map;
import com.padhai.backend.entity.Subject;
import java.util.Set;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public User register(@RequestBody User user) {
        return userService.register(user);
    }
    @PostMapping("/login")
    public Map<String, String> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");
        String token = userService.login(email, password);
        return Map.of("token", token);
    }

    @GetMapping("/me")
    public Map<String, String> me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = (String) auth.getPrincipal();
        return Map.of("email", email);
    }

    @GetMapping("/me/role")
    public Map<String, String> myRole() {
        String email = (String) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        User user = userService.getByEmail(email);
        return Map.of("role", user.getRole() != null ? user.getRole() : "USER");
    }

    // list all users — ADMIN only
    @GetMapping("/all")
    public List<User> getAllUsers() {
        String email = (String) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        User currentUser = userService.getByEmail(email);
        if (!"ADMIN".equals(currentUser.getRole())) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Admins only");
        }
        return userService.getAllUsers();
    }

    // Assign a user as teacher for given subjects — ADMIN only
    @PostMapping("/assign-teacher")
    public User assignTeacher(@RequestBody Map<String, Object> request) {
        String email = (String) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        User admin = userService.getByEmail(email);
        if (!"ADMIN".equals(admin.getRole())) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Only admin can assign teachers");
        }

        Long userId = Long.valueOf(request.get("userId").toString());

        @SuppressWarnings("unchecked")
        List<Integer> rawIds = (List<Integer>) request.get("subjectIds");
        List<Long> subjectIds = rawIds.stream().map(Long::valueOf).toList();

        return userService.assignTeacher(userId, subjectIds);
    }

    // get the logged-in user's assigned subjects
    @GetMapping("/me/subjects")
    public Set<Subject> mySubjects() {
        String email = (String) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        User user = userService.getByEmail(email);
        return user.getSubjects();
    }

}