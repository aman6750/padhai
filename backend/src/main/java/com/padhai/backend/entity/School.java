package com.padhai.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

// A school, e.g. "LPS" or "CMS".
// Hibernate creates a "schools" table automatically at startup.
@Data
@Entity
@Table(name = "schools")
public class School {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;              // 1, 2, 3 … (database picks it)

    private String name;          // e.g. "LPS"

    private String description;   // e.g. "Lucknow Public School" (optional)
}