package com.padhai.backend.repository;

import com.padhai.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    // true if any user is in this class (used before deleting a class)
    boolean existsByClassId(Long classId);
}