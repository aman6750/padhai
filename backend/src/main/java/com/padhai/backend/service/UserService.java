package com.padhai.backend.service;
import java.util.List;
import com.padhai.backend.entity.User;
import com.padhai.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.padhai.backend.util.JwtUtil;
import com.padhai.backend.entity.Subject;
import com.padhai.backend.repository.SubjectRepository;
// To check that the class a student picks really exists
import com.padhai.backend.repository.ClassRepository;
import java.util.Set;
import java.util.HashSet;
import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    // add SubjectRepository to the constructor
    private final SubjectRepository subjectRepository;
    // NEW: to look up classes
    private final ClassRepository classRepository;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       SubjectRepository subjectRepository,
                       ClassRepository classRepository) {      // NEW parameter, Spring fills it
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.subjectRepository = subjectRepository;
        this.classRepository = classRepository;                 // NEW: store it
    }

    public User register(User user) {
        // Check if email is already used
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        // Everyone who registers is a STUDENT.
        // Before this, someone could send "role":"ADMIN" and become admin!
        // Your existing admin/teacher accounts are not affected.
        user.setRole("USER");
        // Clear any teacher subjects someone might try to send
        user.setSubjects(new HashSet<>());

        // A student must choose a class that really exists.
        // existsById = free method from JpaRepository: true if that id is in the table.
        if (user.getClassId() == null || !classRepository.existsById(user.getClassId())) {
            throw new RuntimeException("Please choose your class");
        }

        // Hash the password before saving
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    // the login method
    public String login(String email, String rawPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        return jwtUtil.generateToken(user.getEmail());
    }

    // add this method inside UserService
    public User getByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // Change one user's class (null = remove the class).
    // Used by: student picking their class, and admin changing it.
    public User setClassId(Long userId, Long classId) {
        // Load the user, or stop with an error
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        // If a class was given, it must exist
        if (classId != null && !classRepository.existsById(classId)) {
            throw new RuntimeException("Class not found");
        }
        user.setClassId(classId);           // set the new class
        return userRepository.save(user);   // save to database
    }

    // Promote a user to teacher and assign subjects
    public User assignTeacher(Long userId, List<Long> subjectIds) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setRole("TEACHER");

        Set<Subject> subjects = new HashSet<>();
        for (Long subjectId : subjectIds) {
            Subject subject = subjectRepository.findById(subjectId)
                    .orElseThrow(() -> new RuntimeException("Subject not found"));
            subjects.add(subject);
        }
        user.setSubjects(subjects);

        return userRepository.save(user);
    }

}
