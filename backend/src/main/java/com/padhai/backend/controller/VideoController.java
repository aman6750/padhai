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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import java.util.List;
import com.padhai.backend.service.ClassAccessService;   // the class check
import com.padhai.backend.repository.VideoRepository;   // new queries from Step 1
import com.padhai.backend.entity.Subject;               // to get subject ids

@RestController
@RequestMapping("/api/videos")
public class VideoController {

    private final VideoService videoService;
    private final SubscriptionService subscriptionService;
    private final UserService userService;
    private final VdoCipherService vdoCipherService;
    private final ClassAccessService classAccessService;   // NEW
    private final VideoRepository videoRepository;         // NEW

    public VideoController(VideoService videoService,
                           SubscriptionService subscriptionService,
                           UserService userService,
                           VdoCipherService vdoCipherService,
                           ClassAccessService classAccessService,   // NEW
                           VideoRepository videoRepository) {       // NEW
        this.videoService = videoService;
        this.subscriptionService = subscriptionService;
        this.userService = userService;
        this.vdoCipherService = vdoCipherService;
        this.classAccessService = classAccessService;              // NEW
        this.videoRepository = videoRepository;                    // NEW
    }

    private User currentUser() {
        String email = (String) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return userService.getByEmail(email);
    }

    // Student: get videos — ONLY if subscription is active
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
        // Student → only videos of their class's subjects:
        // 1. get the student's class subjects  2. take their ids, e.g. [3, 4, 7]
        List<Long> subjectIds = classAccessService.visibleSubjects(user).stream()
                .map(Subject::getId).toList();
        // No class or no subjects → no videos (also avoids an empty IN () query)
        if (subjectIds.isEmpty()) return List.of();
        // Videos WHERE subject_id IN (3, 4, 7), in lesson order
        return videoRepository.findBySubjectIdInOrderByOrderIndexAsc(subjectIds);
    }

    // get an OTP for a specific video — subscribers, OR admins/teachers
    @GetMapping("/{videoId}/otp")
    public Map<String, Object> getVideoOtp(@PathVariable String videoId) {
        User user = currentUser();

        // Admins and teachers bypass the subscription check
        boolean privileged = "ADMIN".equals(user.getRole()) || "TEACHER".equals(user.getRole());
        if (!privileged && !subscriptionService.isSubscriptionActive(user.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You need an active subscription to watch videos");
        }

        // NEW: students can only PLAY videos of their own class.
        // The OTP is the key that unlocks playback, so this check is important.
        if (!privileged) {
            // The URL has the VdoCipher id → find our video record by it
            Video video = videoRepository.findFirstByVideoUrl(videoId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Video not found"));
            // Is that video's subject in the student's class?
            classAccessService.requireSubjectAccess(user, video.getSubjectId());
        }

        // Subscribed or privileged → get a playback token from VdoCipher
        return vdoCipherService.getOtp(videoId);
    }

    // the add-video endpoint — now ADMIN only
    @PostMapping("/add")
    public Video addVideo(@RequestBody Video video) {
        User user = currentUser();
        if (!"ADMIN".equals(user.getRole())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only admins can add videos");
        }

        // NEW: every new video must have a subject, otherwise no student could ever see it
        if (video.getSubjectId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Choose a subject (and class) for this video");
        }
        return videoService.addVideo(video);
    }

    // PUT /api/videos/{id}/subject  body: {"subjectId": 3}
    // ADMIN moves a video to a subject. This is how you fix your OLD videos.
    @PutMapping("/{id}/subject")
    public Video setVideoSubject(@PathVariable Long id, @RequestBody Map<String, Long> body) {
        User user = currentUser();
        if (!"ADMIN".equals(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can edit videos");
        }
        // Load the video, or 404
        Video video = videoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Video not found"));
        video.setSubjectId(body.get("subjectId"));   // move to the chosen subject
        return videoRepository.save(video);          // save
    }

    // delete a video — ADMIN only
    @DeleteMapping("/{id}")
    public Map<String, Boolean> deleteVideo(@PathVariable Long id) {
        User user = currentUser();
        if (!"ADMIN".equals(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can delete videos");
        }
        videoService.deleteVideo(id);
        return Map.of("deleted", true);
    }

}