package com.padhai.backend.controller;

import com.padhai.backend.entity.ClassEntity;
import com.padhai.backend.entity.User;
import com.padhai.backend.repository.ClassRepository;
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

    private final ClassRepository classRepository;   // read/save classes
    private final UserService userService;           // find who is logged in

    // Spring passes both in automatically
    public ClassController(ClassRepository classRepository, UserService userService) {
        this.classRepository = classRepository;
        this.userService = userService;
    }

    // GET /api/classes → all classes sorted by orderIndex
    // e.g. [{"id":1,"name":"Class 9","orderIndex":9}, {"id":2,"name":"Class 10","orderIndex":10}]
    // Uses the method you already have in ClassRepository.
    // Works WITHOUT login (Step 3b), because the Register page needs it.
    @GetMapping
    public List<ClassEntity> getClasses() {
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
        return classRepository.save(existing);
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