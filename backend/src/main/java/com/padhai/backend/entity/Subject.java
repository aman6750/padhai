package com.padhai.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
// Lets a field be calculated by SQL instead of stored as a column
import org.hibernate.annotations.Formula;

@Entity
@Table(name = "subjects")
@Data
public class Subject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    private String name;   // e.g. "Mathematics", "Science"

    private String description;

    private Long classId;

    // Shows "LPS · Class 10". If the class has no school yet, just "Class 10".
    // || joins text in PostgreSQL; coalesce(x, '') uses '' when x is null.
    @Formula("(select coalesce(s.name || ' · ', '') || c.name from classes c left join schools s on s.id = c.school_id where c.id = class_id)")
    private String className;
}