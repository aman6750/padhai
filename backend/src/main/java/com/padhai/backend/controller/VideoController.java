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

@RestController
@RequestMapping("/api/videos")
public class VideoController {

    private final VideoService videoService;
    private final SubscriptionService subscriptionService;
    private final UserService userService;
    // add VdoCipherService to the constructor
    private final VdoCipherService vdoCipherService;

    // update your constructor to include it, e.g.:
    public VideoController(VideoService videoService,
                           SubscriptionService subscriptionService,
                           UserService userService,
                           VdoCipherService vdoCipherService) {
        this.videoService = videoService;
        this.subscriptionService = subscriptionService;
        this.userService = userService;
        this.vdoCipherService = vdoCipherService;
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

        if (!subscriptionService.isSubscriptionActive(user.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You need an active subscription to watch videos");
        }

        return videoService.getAllVideos();
    }

    // the new endpoint — get an OTP for a specific video, ONLY if subscribed
    @GetMapping("/{videoId}/otp")
    public Map<String, Object> getVideoOtp(@PathVariable String videoId) {
        User user = currentUser();

        // Reuse your existing subscription gate!
        if (!subscriptionService.isSubscriptionActive(user.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You need an active subscription to watch videos");
        }

        // Subscribed → get a playback token from VdoCipher
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
        return videoService.addVideo(video);
    }

}