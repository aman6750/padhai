package com.padhai.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "test_attempts")
@Data
public class TestAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private Long testId;

    private Integer score;          // number correct
    private Integer totalQuestions;

    private LocalDateTime attemptedAt;
}