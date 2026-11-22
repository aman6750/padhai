package com.padhai.backend.repository;

import com.padhai.backend.entity.ClassEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ClassRepository extends JpaRepository<ClassEntity, Long> {
    List<ClassEntity> findAllByOrderByOrderIndexAsc();
    // Classes of ONE school, in order.
    // Spring builds: SELECT * FROM classes WHERE school_id = ? ORDER BY order_index
    List<ClassEntity> findBySchoolIdOrderByOrderIndexAsc(Long schoolId);
}