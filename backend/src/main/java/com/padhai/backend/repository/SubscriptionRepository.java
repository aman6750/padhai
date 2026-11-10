package com.padhai.backend.repository;

import com.padhai.backend.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    // the user's latest subscription — used by SubscriptionService.isSubscriptionActive
    Optional<Subscription> findTopByUserIdOrderByEndDateDesc(Long userId);

    // all of a user's subscriptions
    List<Subscription> findByUserId(Long userId);
}