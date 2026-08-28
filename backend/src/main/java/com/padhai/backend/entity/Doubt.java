package com.padhai.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "doubts")
@Data
public class Doubt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long subjectId;    // which subject this doubt is in

    private Long userId;       // who posted it
    private String userName;   // display name (cached for easy showing)
    private String userRole;   // "USER" or "TEACHER" — to style differently

    @Column(length = 2000)
    private String message;

    private LocalDateTime createdAt;
}