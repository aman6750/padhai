package com.padhai.backend.entity;
import jakarta.persistence.*;
import lombok.Data;


@Data
@Entity
@Table(name="classes")
public class ClassEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;


    private Integer orderIndex;

    private String description;


}
