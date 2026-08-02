package com.padhai.backend.repository;

import com.padhai.backend.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    // Find the most recent subscription for a user
    Optional<Subscription> findTopByUserIdOrderByEndDateDesc(Long userId);
}