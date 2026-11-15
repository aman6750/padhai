package com.padhai.backend.entity;
// Lets us hide the password in API responses
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Data
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true)
    private String email;

    // WRITE_ONLY = password can come IN (register), but is never sent OUT in responses
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    // The student's class (id from the "classes" table).
    // Hibernate creates a "class_id" column in "users" automatically.
    // Teachers/admins leave this empty because they can see every class.
    private Long classId;

    @Column(nullable = false)
    private String role = "USER";   // "USER", "TEACHER", or "ADMIN"

    // Subjects this teacher is assigned to (only relevant for TEACHER role)
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "teacher_subjects",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "subject_id")
    )
    private Set<Subject> subjects = new HashSet<>();
}