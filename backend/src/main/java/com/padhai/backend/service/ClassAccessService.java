package com.padhai.backend.service;

import com.padhai.backend.entity.Subject;
import com.padhai.backend.entity.User;
import com.padhai.backend.repository.SubjectRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

// @Service = Spring creates ONE copy of this class at startup and
// hands it to any controller that asks for it in its constructor.
@Service
public class ClassAccessService {

    // Used to look up subjects in the database
    private final SubjectRepository subjectRepository;

    // Spring calls this constructor and passes the repository in automatically
    public ClassAccessService(SubjectRepository subjectRepository) {
        this.subjectRepository = subjectRepository;
    }

    // true for ADMIN or TEACHER → they can see every class.
    // "ADMIN".equals(...) instead of role.equals("ADMIN") avoids a crash if role is null.
    public boolean isPrivileged(User user) {
        return "ADMIN".equals(user.getRole()) || "TEACHER".equals(user.getRole());
    }

    // Which subjects can this user see?
    public List<Subject> visibleSubjects(User user) {
        // Admin/teacher → every subject of every class
        if (isPrivileged(user)) {
            return subjectRepository.findAll();
        }
        // Student who hasn't picked a class yet → nothing
        if (user.getClassId() == null) {
            return List.of();
        }
        // Student → only subjects of their own class
        // (findByClassId already exists in your SubjectRepository)
        return subjectRepository.findByClassId(user.getClassId());
    }

    // Can this user see ONE particular subject? Returns true / false.
    public boolean canViewSubject(User user, Long subjectId) {
        // Admin/teacher → always yes
        if (isPrivileged(user)) return true;

        // Content with no subject, or student with no class → no
        if (subjectId == null || user.getClassId() == null) return false;

        return subjectRepository.findById(subjectId)       // find the subject (may not exist)
                .map(s -> user.getClassId().equals(s.getClassId()))  // same class? → true/false
                .orElse(false);                            // subject not found → false
        // Note: .equals() not == because Long is an object; == can give wrong answers
    }

    // Controllers call THIS one. If the student isn't allowed,
    // it stops the request and sends HTTP 403 "Forbidden".
    // Nothing after this line in the controller runs, so no data leaks.
    public void requireSubjectAccess(User user, Long subjectId) {
        if (!canViewSubject(user, subjectId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "This content is not for your class");
        }
    }
}