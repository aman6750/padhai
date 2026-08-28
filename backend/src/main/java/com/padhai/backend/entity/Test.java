package com.padhai.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "tests")
@Data
public class Test {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private String description;

    private Long subjectId;

    private Integer durationMinutes;  // time limit

    private Boolean isFree = false;   // true = free, false = subscribers only
}