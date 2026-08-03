package com.padhai.backend.repository;

import com.padhai.backend.entity.Video;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VideoRepository extends JpaRepository<Video, Long> {
    // Return videos sorted by their order
    List<Video> findAllByOrderByOrderIndexAsc();
}