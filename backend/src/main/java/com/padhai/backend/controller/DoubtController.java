package com.padhai.backend.controller;

import com.padhai.backend.entity.Doubt;
import com.padhai.backend.entity.User;
import com.padhai.backend.repository.DoubtRepository;
import com.padhai.backend.service.SubscriptionService;
import com.padhai.backend.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/doubts")
public class DoubtController {

    private final DoubtRepository doubtRepository;
    private final UserService userService;
    private final SubscriptionService subscriptionService;

    public DoubtController(DoubtRepository doubtRepository,
                           UserService userService,
                           SubscriptionService subscriptionService) {
        this.doubtRepository = doubtRepository;
        this.userService = userService;
        this.subscriptionService = subscriptionService;
    }

    private User currentUser() {
        String email = (String) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return userService.getByEmail(email);
    }

    // Post a message in a subject
    @PostMapping("/subject/{subjectId}")
    public Doubt postDoubt(@PathVariable Long subjectId, @RequestBody Map<String, String> body) {
        User user = currentUser();

        // Students must be subscribed to post; teachers/admins always can
        boolean privileged = "ADMIN".equals(user.getRole()) || "TEACHER".equals(user.getRole());
        if (!privileged && !subscriptionService.isSubscriptionActive(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Subscribe to ask doubts");
        }

        // If teacher, they can only post in their assigned subjects
        if ("TEACHER".equals(user.getRole())) {
            boolean owns = user.getSubjects().stream().anyMatch(s -> s.getId().equals(subjectId));
            if (!owns) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your subject");
            }
        }

        Doubt doubt = new Doubt();
        doubt.setSubjectId(subjectId);
        doubt.setUserId(user.getId());
        doubt.setUserName(user.getName());
        doubt.setUserRole(user.getRole());
        doubt.setMessage(body.get("message"));
        doubt.setCreatedAt(LocalDateTime.now());
        return doubtRepository.save(doubt);
    }

    // Get all messages for a subject
    @GetMapping("/subject/{subjectId}")
    public List<Doubt> getDoubts(@PathVariable Long subjectId) {
        User user = currentUser();
        boolean privileged = "ADMIN".equals(user.getRole()) || "TEACHER".equals(user.getRole());
        if (!privileged && !subscriptionService.isSubscriptionActive(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Subscribe to view doubts");
        }
        return doubtRepository.findBySubjectIdOrderByCreatedAtAsc(subjectId);
    }
}