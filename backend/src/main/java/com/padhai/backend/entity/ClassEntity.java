package com.padhai.backend.entity;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.Formula;   // NEW: field calculated by SQL

@Data
@Entity
@Table(name="classes")
public class ClassEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;          // e.g. "Class 10"

    private Integer orderIndex;

    private String description;

    // NEW: which school this class belongs to (id from "schools").
    // Hibernate adds a "school_id" column to "classes" automatically.
    private Long schoolId;

    // NEW: read-only, the school's name looked up by SQL, e.g. "LPS".
    // Only for showing on the website; to move a class, change schoolId.
    @Formula("(select s.name from schools s where s.id = school_id)")
    private String schoolName;
}