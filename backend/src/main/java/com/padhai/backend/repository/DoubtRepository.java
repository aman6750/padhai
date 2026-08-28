package com.padhai.backend.repository;

import com.padhai.backend.entity.Doubt;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DoubtRepository extends JpaRepository<Doubt, Long> {
    // Get all messages for a subject, oldest first
    List<Doubt> findBySubjectIdOrderByCreatedAtAsc(Long subjectId);
}