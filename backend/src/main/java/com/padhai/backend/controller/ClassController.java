package com.padhai.backend.controller;
import com.padhai.backend.repository.SubjectRepository;
import com.padhai.backend.repository.UserRepository;
import java.util.Map;
import com.padhai.backend.entity.ClassEntity;
import com.padhai.backend.entity.User;
import com.padhai.backend.repository.ClassRepository;
import com.padhai.backend.repository.SchoolRepository;   // check the school exists
import com.padhai.backend.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

// @RestController = every method returns JSON
// @RequestMapping = all URLs here start with /api/classes
@RestController
@RequestMapping("/api/classes")
public class ClassController {

    private final ClassRepository classRepository;
    private final UserService userService;
    private final SchoolRepository schoolRepository;
    private final SubjectRepository subjectRepository;   // NEW: check subjects before delete
    private final UserRepository userRepository;         // NEW: check students before delete

    public ClassController(ClassRepository classRepository, UserService userService,
                           SchoolRepository schoolRepository,
                           SubjectRepository subjectRepository,      // NEW
                           UserRepository userRepository) {          // NEW
        this.classRepository = classRepository;
        this.userService = userService;
        this.schoolRepository = schoolRepository;
        this.subjectRepository = subjectRepository;                // NEW
        this.userRepository = userRepository;                      // NEW
    }

    // GET /api/classes            → all classes (admin pages)
    // GET /api/classes?schoolId=1 → only that school's classes (Register page)
    // required = false → the ?schoolId= part is optional
    @GetMapping
    public List<ClassEntity> getClasses(@RequestParam(required = false) Long schoolId) {
        if (schoolId != null) {
            return classRepository.findBySchoolIdOrderByOrderIndexAsc(schoolId);
        }
        return classRepository.findAllByOrderByOrderIndexAsc();
    }

    // POST /api/classes → ADMIN creates a class
    // Body example: {"name":"Class 10","orderIndex":10}
    @PostMapping
    public ClassEntity addClass(@RequestBody ClassEntity newClass) {
        requireAdmin();                                    // stop if not admin
        if (newClass.getName() == null || newClass.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Class name is required");
        }
        // NEW: every class must belong to a school that exists
        if (newClass.getSchoolId() == null || !schoolRepository.existsById(newClass.getSchoolId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a school for this class");
        }
        newClass.setId(null);                              // always CREATE, never overwrite an existing class
        newClass.setName(newClass.getName().trim());       // remove extra spaces
        return classRepository.save(newClass);             // insert, returns it with its new id
    }

    // PUT /api/classes/{id} → ADMIN renames or reorders a class
    @PutMapping("/{id}")
    public ClassEntity updateClass(@PathVariable Long id, @RequestBody ClassEntity changes) {
        requireAdmin();
        ClassEntity existing = classRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Class not found"));
        // Only change the fields that were sent
        if (changes.getName() != null && !changes.getName().isBlank()) existing.setName(changes.getName().trim());
        if (changes.getOrderIndex() != null) existing.setOrderIndex(changes.getOrderIndex());
        if (changes.getDescription() != null) existing.setDescription(changes.getDescription());
        // NEW: move a class to another school (used for your existing classes)
        if (changes.getSchoolId() != null) {
            if (!schoolRepository.existsById(changes.getSchoolId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "School not found");
            }
            existing.setSchoolId(changes.getSchoolId());
        }
        return classRepository.save(existing);
    }

    // DELETE /api/classes/{id} → ADMIN deletes an EMPTY class (e.g. a duplicate)
    @DeleteMapping("/{id}")
    public Map<String, Boolean> deleteClass(@PathVariable Long id) {
        requireAdmin();
        if (!classRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Class not found");
        }
        // Safety: never delete a class that still has subjects or students
        if (!subjectRepository.findByClassId(id).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "This class has subjects. Move or delete them first.");
        }
        if (userRepository.existsByClassId(id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Students are in this class. Move them to another class first.");
        }
        classRepository.deleteById(id);
        return Map.of("deleted", true);
    }

    // Helper: throws 403 unless the logged-in user is ADMIN
    private void requireAdmin() {
        // The email inside the login token (your JwtFilter puts it here)
        String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userService.getByEmail(email);
        if (!"ADMIN".equals(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admins only");
        }
    }
}