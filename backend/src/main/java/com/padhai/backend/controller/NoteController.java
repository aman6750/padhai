package com.padhai.backend.controller;
import com.padhai.backend.service.CloudinaryService;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.RequestParam;
import com.padhai.backend.entity.Note;
import com.padhai.backend.entity.Subject;
import com.padhai.backend.entity.User;
import com.padhai.backend.repository.NoteRepository;
import com.padhai.backend.service.SubscriptionService;
import com.padhai.backend.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import com.padhai.backend.entity.Note;
import com.padhai.backend.service.PdfWatermarkService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
public class NoteController {

    private final NoteRepository noteRepository;
    private final UserService userService;
    private final SubscriptionService subscriptionService;
    private final CloudinaryService cloudinaryService;
    private final PdfWatermarkService pdfWatermarkService;

    public NoteController(NoteRepository noteRepository,
                          UserService userService,
                          SubscriptionService subscriptionService,
                          CloudinaryService cloudinaryService,
                          PdfWatermarkService pdfWatermarkService) {
        this.noteRepository = noteRepository;
        this.userService = userService;
        this.subscriptionService = subscriptionService;
        this.cloudinaryService = cloudinaryService;
        this.pdfWatermarkService = pdfWatermarkService;
    }

    private User currentUser() {
        String email = (String) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return userService.getByEmail(email);
    }

    // Helper: can this user manage content for this subject?
    private boolean canManageSubject(User user, Long subjectId) {
        if ("ADMIN".equals(user.getRole())) {
            return true; // admin manages everything
        }
        if ("TEACHER".equals(user.getRole())) {
            // teacher can manage only their assigned subjects
            return user.getSubjects().stream()
                    .anyMatch(s -> s.getId().equals(subjectId));
        }
        return false;
    }

    // TEACHER (own subject) or ADMIN can add a note
    @PostMapping("/add")
    public Note addNote(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("subjectId") Long subjectId,
            @RequestParam("file") MultipartFile file) throws Exception {

        User user = currentUser();
        if (!canManageSubject(user, subjectId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You can only add notes to your own subjects");
        }

        // Upload the PDF to Cloudinary
        String fileUrl = cloudinaryService.uploadPdf(file);

        Note note = new Note();
        note.setTitle(title);
        note.setDescription(description);
        note.setSubjectId(subjectId);
        note.setFileUrl(fileUrl);
        return noteRepository.save(note);
    }

    // STUDENTS: view notes for a subject — must be subscribed
    @GetMapping("/subject/{subjectId}")
    public List<Note> getNotesForSubject(@PathVariable Long subjectId) {
        User user = currentUser();

        // teachers/admins can always view; students need a subscription
        boolean privileged = "ADMIN".equals(user.getRole()) || "TEACHER".equals(user.getRole());
        if (!privileged && !subscriptionService.isSubscriptionActive(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You need an active subscription to view notes");
        }

        return noteRepository.findBySubjectId(subjectId);
    }

    // Delete a note — teacher (own subject) or admin
    @DeleteMapping("/{id}")
    public void deleteNote(@PathVariable Long id) {
        User user = currentUser();
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Note not found"));
        if (!canManageSubject(user, note.getSubjectId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
        }
        noteRepository.deleteById(id);
    }

    // secure, watermarked PDF viewing — subscription required
    @GetMapping("/{id}/view")
    public ResponseEntity<byte[]> viewNote(@PathVariable Long id) throws Exception {
        User user = currentUser();

        boolean privileged = "ADMIN".equals(user.getRole()) || "TEACHER".equals(user.getRole());
        if (!privileged && !subscriptionService.isSubscriptionActive(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You need an active subscription to view notes");
        }

        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Note not found"));

        // Watermark with the student's email
        byte[] watermarked = pdfWatermarkService.watermarkPdf(note.getFileUrl(), user.getEmail());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        // "inline" tells the browser to display, not download
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=note.pdf");

        return new ResponseEntity<>(watermarked, headers, org.springframework.http.HttpStatus.OK);
    }
}