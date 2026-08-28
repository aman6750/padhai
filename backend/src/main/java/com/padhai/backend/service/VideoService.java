package com.padhai.backend.service;

import com.padhai.backend.entity.Video;
import com.padhai.backend.repository.VideoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VideoService {

    private final VideoRepository videoRepository;

    public VideoService(VideoRepository videoRepository) {
        this.videoRepository = videoRepository;
    }

    public Video addVideo(Video video) {
        return videoRepository.save(video);
    }

    public List<Video> getAllVideos() {
        return videoRepository.findAllByOrderByOrderIndexAsc();
    }

    public void deleteVideo(Long id) {
        videoRepository.deleteById(id);
    }

}