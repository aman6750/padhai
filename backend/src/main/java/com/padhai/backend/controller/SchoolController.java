package com.padhai.backend.controller;

import com.padhai.backend.entity.School;
import com.padhai.backend.entity.User;
import com.padhai.backend.repository.SchoolRepository;
import com.padhai.backend.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

// All URLs here start with /api/schools
@RestController
@RequestMapping("/api/schools")
public class SchoolController {

    private final SchoolRepository schoolRepository;
    private final UserService userService;

    public SchoolController(SchoolRepository schoolRepository, UserService userService) {
        this.schoolRepository = schoolRepository;
        this.userService = userService;
    }

    // GET /api/schools → all schools A–Z. Public (Register page needs it).
    @GetMapping
    public List<School> getSchools() {
        return schoolRepository.findAllByOrderByNameAsc();
    }

    // POST /api/schools → ADMIN creates a school. Body: {"name":"LPS"}
    @PostMapping
    public School addSchool(@RequestBody School school) {
        requireAdmin();
        if (school.getName() == null || school.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "School name is required");
        }
        school.setId(null);                          // always create new
        school.setName(school.getName().trim());     // remove extra spaces
        return schoolRepository.save(school);
    }

    // PUT /api/schools/{id} → ADMIN renames a school
    @PutMapping("/{id}")
    public School updateSchool(@PathVariable Long id, @RequestBody School changes) {
        requireAdmin();
        School existing = schoolRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));
        if (changes.getName() != null && !changes.getName().isBlank()) existing.setName(changes.getName().trim());
        if (changes.getDescription() != null) existing.setDescription(changes.getDescription());
        return schoolRepository.save(existing);
    }

    // 403 unless the logged-in user is ADMIN
    private void requireAdmin() {
        String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userService.getByEmail(email);
        if (!"ADMIN".equals(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admins only");
        }
    }
}