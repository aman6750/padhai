package com.padhai.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "videos")
@Data
public class Video {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(length = 1000)
    private String description;

    // The ID/URL from your video host (VdoCipher, Cloudflare, etc.)
    private String videoUrl;

    private String thumbnailUrl;

    // For ordering lessons (1, 2, 3...)
    private Integer orderIndex;

    // Which subject this video belongs to.
    // subject → has a classId, so the video belongs to that class too.
    private Long subjectId;
}