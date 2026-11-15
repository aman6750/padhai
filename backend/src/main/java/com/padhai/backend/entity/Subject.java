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

    // Not a real column: every time a subject loads, Hibernate runs this SQL
    // and puts the class's name here, e.g. "Class 10".
    // Used only to SHOW the class name on the website.
    @Formula("(select c.name from classes c where c.id = class_id)")
    private String className;
}