package com.padhai.backend.controller;

import com.padhai.backend.entity.Subject;
import com.padhai.backend.entity.User;
import com.padhai.backend.repository.SubjectRepository;
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

    public SubjectController(SubjectRepository subjectRepository, UserService userService) {
        this.subjectRepository = subjectRepository;
        this.userService = userService;
    }

    private User currentUser() {
        String email = (String) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return userService.getByEmail(email);
    }

    // Anyone logged in can see the list of subjects
    @GetMapping
    public List<Subject> getAllSubjects() {
        return subjectRepository.findAll();
    }

    // Only ADMIN can create a subject
    @PostMapping("/add")
    public Subject addSubject(@RequestBody Subject subject) {
        User user = currentUser();
        if (!"ADMIN".equals(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admin can add subjects");
        }
        return subjectRepository.save(subject);
    }
}