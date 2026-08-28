package com.padhai.backend.dto;

import lombok.Data;

@Data
public class QuestionForStudent {
    private Long id;
    private String questionText;
    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;
    // NOTE: no correctOption — students must never see it
}