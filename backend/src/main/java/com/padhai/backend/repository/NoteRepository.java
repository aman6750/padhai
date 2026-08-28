package com.padhai.backend.repository;

import com.padhai.backend.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NoteRepository extends JpaRepository<Note, Long> {
    List<Note> findBySubjectId(Long subjectId);
}