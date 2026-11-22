package com.padhai.backend.controller;
import com.padhai.backend.service.VdoCipherService;
import java.util.Map;
import com.padhai.backend.entity.User;
import com.padhai.backend.entity.Video;
import com.padhai.backend.service.SubscriptionService;
import com.padhai.backend.service.UserService;
import com.padhai.backend.service.VideoService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import com.padhai.backend.service.ClassAccessService;
import com.padhai.backend.repository.VideoRepository;
import com.padhai.backend.entity.Subject;

@RestController
@RequestMapping("/api/videos")
public class VideoController {

    private final VideoService videoService;
    private final SubscriptionService subscriptionService;
    private final UserService userService;
    private final VdoCipherService vdoCipherService;
    private final ClassAccessService classAccessService;
    private final VideoRepository videoRepository;

    public VideoController(VideoService videoService,
                           SubscriptionService subscriptionService,
                           UserService userService,
                           VdoCipherService vdoCipherService,
                           ClassAccessService classAccessService,
                           VideoRepository videoRepository) {
        this.videoService = videoService;
        this.subscriptionService = subscriptionService;
        this.userService = userService;
        this.vdoCipherService = vdoCipherService;
        this.classAccessService = classAccessService;
        this.videoRepository = videoRepository;
    }

    private User currentUser() {
        String email = (String) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return userService.getByEmail(email);
    }

    // GET /api/videos → student: only their class (needs subscription); admin/teacher: all
    @GetMapping
    public List<Video> getVideos() {
        User user = currentUser();

        // Admins and teachers bypass the subscription check
        boolean privileged = "ADMIN".equals(user.getRole()) || "TEACHER".equals(user.getRole());
        if (!privileged && !subscriptionService.isSubscriptionActive(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You need an active subscription to watch videos");
        }

        // Admin/teacher → every video
        if (privileged) {
            return videoService.getAllVideos();
        }
        // Student → only videos of their class's subjects
        List<Long> subjectIds = classAccessService.visibleSubjects(user).stream()
                .map(Subject::getId).toList();
        if (subjectIds.isEmpty()) return List.of();
        return videoRepository.findBySubjectIdInOrderByOrderIndexAsc(subjectIds);
    }

    // GET /api/videos/{videoId}/otp → playback key (subscribers of that class, or admin/teacher)
    @GetMapping("/{videoId}/otp")
    public Map<String, Object> getVideoOtp(@PathVariable String videoId) {
        User user = currentUser();

        boolean privileged = "ADMIN".equals(user.getRole()) || "TEACHER".equals(user.getRole());
        if (!privileged && !subscriptionService.isSubscriptionActive(user.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You need an active subscription to watch videos");
        }

        // Students can only PLAY videos of their own class.
        if (!privileged) {
            // The same VdoCipher video may be added to several classes,
            // so look at EVERY entry with this id
            List<Video> entries = videoRepository.findByVideoUrl(videoId);
            if (entries.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Video not found");
            }
            // Allowed if ANY of those entries belongs to the student's class
            boolean allowed = entries.stream()
                    .anyMatch(v -> classAccessService.canViewSubject(user, v.getSubjectId()));
            if (!allowed) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This video is not for your class");
            }
        }

        return vdoCipherService.getOtp(videoId);
    }

    // NEW: can this user add/delete videos in this subject?
    // Admin → any subject. Teacher → only subjects assigned to them. Student → never.
    private boolean canManageSubject(User user, Long subjectId) {
        if ("ADMIN".equals(user.getRole())) return true;
        if ("TEACHER".equals(user.getRole()) && subjectId != null) {
            return user.getSubjects().stream().anyMatch(s -> s.getId().equals(subjectId));
        }
        return false;
    }

    // NEW: POST /api/videos/upload-credentials   body: {"title": "...", "subjectId": 3}
    // Step 1 of an upload: get one-time VdoCipher upload permission.
    // Only for the admin, or a teacher uploading into THEIR OWN subject.
    @PostMapping("/upload-credentials")
    public Map<String, Object> uploadCredentials(@RequestBody Map<String, Object> body) {
        User user = currentUser();
        String title = (String) body.get("title");
        Long subjectId = body.get("subjectId") == null ? null
                : Long.valueOf(body.get("subjectId").toString());
        if (title == null || title.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title is required");
        }
        if (subjectId == null || !canManageSubject(user, subjectId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You can only upload videos to your own subjects");
        }
        return vdoCipherService.createUpload(title.trim());
    }

    // POST /api/videos/add → save the video in a subject.
    // CHANGED: admin OR the teacher of that subject (was admin only).
    @PostMapping("/add")
    public Video addVideo(@RequestBody Video video) {
        User user = currentUser();
        if (video.getSubjectId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Choose a subject (and class) for this video");
        }
        if (!canManageSubject(user, video.getSubjectId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You can only add videos to your own subjects");
        }
        video.setId(null);   // always create a new video, never overwrite one
        return videoService.addVideo(video);
    }

    // PUT /api/videos/{id}/subject → ADMIN moves a video to another subject
    @PutMapping("/{id}/subject")
    public Video setVideoSubject(@PathVariable Long id, @RequestBody Map<String, Long> body) {
        User user = currentUser();
        if (!"ADMIN".equals(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can edit videos");
        }
        Video video = videoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Video not found"));
        video.setSubjectId(body.get("subjectId"));
        return videoRepository.save(video);
    }

    // DELETE /api/videos/{id}
    // CHANGED: admin OR the teacher of that video's subject (was admin only)
    @DeleteMapping("/{id}")
    public Map<String, Boolean> deleteVideo(@PathVariable Long id) {
        User user = currentUser();
        Video video = videoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Video not found"));
        if (!canManageSubject(user, video.getSubjectId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete videos in your own subjects");
        }
        videoService.deleteVideo(id);
        return Map.of("deleted", true);
    }
}