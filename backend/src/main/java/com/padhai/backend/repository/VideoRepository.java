package com.padhai.backend.repository;

import com.padhai.backend.entity.Video;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
// Optional = a box that holds a result or is empty (avoids null errors)
import java.util.Optional;

public interface VideoRepository extends JpaRepository<Video, Long> {
    // Return videos sorted by their order
    List<Video> findAllByOrderByOrderIndexAsc();

    // Spring builds this query from the method name:
    // SELECT * FROM videos WHERE subject_id IN (...) ORDER BY order_index
    // We pass the student's class subjects → only their class's videos come back.
    List<Video> findBySubjectIdInOrderByOrderIndexAsc(List<Long> subjectIds);

    // Finds a video by its VdoCipher id, so we can check its class
    // before allowing playback.
    Optional<Video> findFirstByVideoUrl(String videoUrl);
}