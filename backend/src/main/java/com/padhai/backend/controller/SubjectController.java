package com.padhai.backend.controller;

import com.padhai.backend.entity.Subject;
import com.padhai.backend.entity.User;
import com.padhai.backend.repository.ClassRepository;           // NEW: check class exists
import com.padhai.backend.repository.SubjectRepository;
import com.padhai.backend.service.ClassAccessService;          // NEW: the access check from Step 2
import com.padhai.backend.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
public class SubjectController {

    private final SubjectRepository subjectRepository;
    private final UserService userService;
    private final ClassAccessService classAccessService;   // NEW
    private final ClassRepository classRepository;         // NEW

    // CHANGED: two new parameters, Spring passes them in
    public SubjectController(SubjectRepository subjectRepository, UserService userService,
                             ClassAccessService classAccessService, ClassRepository classRepository) {
        this.subjectRepository = subjectRepository;
        this.userService = userService;
        this.classAccessService = classAccessService;      // NEW
        this.classRepository = classRepository;            // NEW
    }

    // The logged-in user (email from the login token)
    private User currentUser() {
        String email = (String) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return userService.getByEmail(email);
    }

    // GET /api/subjects
    // CHANGED: before, everyone got ALL subjects (findAll).
    // Now: student → only their class's subjects; teacher/admin → all.
    // Notes, Tests, Doubts and Videos pages all load subjects from here,
    // so a student only ever sees buttons for their own class.
    @GetMapping
    public List<Subject> getAllSubjects() {
        return classAccessService.visibleSubjects(currentUser());
    }

    // POST /api/subjects/add → only ADMIN creates a subject
    @PostMapping("/add")
    public Subject addSubject(@RequestBody Subject subject) {
        User user = currentUser();
        if (!"ADMIN".equals(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admin can add subjects");
        }
        // NEW: a subject MUST belong to a class that exists.
        // Missing or fake classId → 400 Bad Request, nothing saved.
        if (subject.getClassId() == null || !classRepository.existsById(subject.getClassId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a class for this subject");
        }
        return subjectRepository.save(subject);
    }

    // NEW: PUT /api/subjects/{id}  body e.g. {"classId": 2}
    // ADMIN edits a subject: this is how you give your OLD subjects a class.
    @PutMapping("/{id}")
    public Subject updateSubject(@PathVariable Long id, @RequestBody Subject changes) {
        User user = currentUser();
        if (!"ADMIN".equals(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admin can edit subjects");
        }
        // Load the subject, or 404 if the id is wrong
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subject not found"));
        // Only change the fields that were sent
        if (changes.getName() != null && !changes.getName().isBlank()) subject.setName(changes.getName().trim());
        if (changes.getDescription() != null) subject.setDescription(changes.getDescription());
        if (changes.getClassId() != null) {
            // The new class must exist
            if (!classRepository.existsById(changes.getClassId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Class not found");
            }
            subject.setClassId(changes.getClassId());   // move subject to that class
        }
        return subjectRepository.save(subject);
    }
}