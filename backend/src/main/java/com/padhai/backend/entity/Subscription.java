package com.padhai.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "subscriptions")
@Data
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Which user this subscription belongs to
    private Long userId;

    private LocalDate startDate;

    private LocalDate endDate;

    // "ACTIVE" or "EXPIRED"
    private String status;
}