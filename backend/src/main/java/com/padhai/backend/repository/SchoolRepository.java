package com.padhai.backend.repository;

import com.padhai.backend.entity.School;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

// JpaRepository gives findAll, findById, save, existsById … for free
public interface SchoolRepository extends JpaRepository<School, Long> {
    // Spring builds: SELECT * FROM schools ORDER BY name ASC
    List<School> findAllByOrderByNameAsc();
}