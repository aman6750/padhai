package com.padhai.backend.controller;
import java.util.List;
import com.padhai.backend.entity.User;
import com.padhai.backend.service.UserService;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.padhai.backend.entity.Subject;
import java.util.Set;
import com.padhai.backend.repository.SubjectRepository;
import com.padhai.backend.repository.NoteRepository;
import com.padhai.backend.repository.TestRepository;
import com.padhai.backend.repository.VideoRepository;
import com.padhai.backend.repository.SubscriptionRepository;
import java.util.Map;
import java.util.HashMap;
import com.padhai.backend.repository.ClassRepository;          // look up class name
import org.springframework.http.HttpStatus;                    // error codes like 403, 400
import org.springframework.web.server.ResponseStatusException; // send those errors

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final SubjectRepository subjectRepository;
    private final NoteRepository noteRepository;
    private final TestRepository testRepository;
    private final VideoRepository videoRepository;

    // NEW field
    private final ClassRepository classRepository;

    public UserController(UserService userService,SubjectRepository subjectRepository,NoteRepository noteRepository,TestRepository testRepository,VideoRepository videoRepository,
                          ClassRepository classRepository) {   // NEW parameter
        this.classRepository = classRepository;               // NEW: store it
        this.userService = userService;
        this.subjectRepository = subjectRepository;
        this.noteRepository = noteRepository;
        this.testRepository = testRepository;
        this.videoRepository = videoRepository;
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

    // GET /api/users/me → details of the logged-in user, now including class
    @GetMapping("/me")
    public Map<String, Object> me() {
        User user = loggedInUser();
        // HashMap (not Map.of) because Map.of crashes on null values,
        // and classId is null for teachers/admins/new students
        Map<String, Object> me = new HashMap<>();
        me.put("email", user.getEmail());
        me.put("name", user.getName());
        me.put("role", user.getRole());
        me.put("classId", user.getClassId());
        // Class with its school, e.g. "LPS · Class 10" (null if no class yet).
        // c.getSchoolName() comes from the @Formula in ClassEntity.
        me.put("className", user.getClassId() == null ? null
                : classRepository.findById(user.getClassId())
                .map(c -> c.getSchoolName() != null ? c.getSchoolName() + " · " + c.getName() : c.getName())
                .orElse(null));
        return me;
    }

    // PUT /api/users/me/class  body: {"classId": 2}
    // A student picks their class ONCE (for students who registered before classes existed).
    @PutMapping("/me/class")
    public User setMyClass(@RequestBody Map<String, Long> body) {
        User user = loggedInUser();
        // Already has a class → refuse, so a Class 9 student can't switch to Class 10 themselves
        if (user.getClassId() != null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Class already set. Contact admin to change it.");
        }
        Long classId = body.get("classId");
        // Missing or fake class id → 400 Bad Request
        if (classId == null || !classRepository.existsById(classId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a valid class");
        }
        return userService.setClassId(user.getId(), classId);
    }

    // PUT /api/users/{userId}/class  body: {"classId": 2}  (or null to clear)
    // ADMIN changes any user's class.
    @PutMapping("/{userId}/class")
    public User setUserClass(@PathVariable Long userId, @RequestBody Map<String, Long> body) {
        if (!"ADMIN".equals(loggedInUser().getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admins only");
        }
        return userService.setClassId(userId, body.get("classId"));
    }

    // Helper: the user who sent this request (email comes from the login token)
    private User loggedInUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userService.getByEmail((String) auth.getPrincipal());
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

    // platform-wide stats — ADMIN only
    @GetMapping("/admin/stats")
    public Map<String, Object> adminStats() {
        String email = (String) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        User admin = userService.getByEmail(email);
        if (!"ADMIN".equals(admin.getRole())) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Admins only");
        }

        List<User> allUsers = userService.getAllUsers();
        long students = allUsers.stream().filter(u -> "USER".equals(u.getRole())).count();
        long teachers = allUsers.stream().filter(u -> "TEACHER".equals(u.getRole())).count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", allUsers.size());
        stats.put("students", students);
        stats.put("teachers", teachers);
        stats.put("subjects", subjectRepository.count());
        stats.put("notes", noteRepository.count());
        stats.put("tests", testRepository.count());
        stats.put("videos", videoRepository.count());
        return stats;
    }

}