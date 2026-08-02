package com.padhai.backend.service;

import com.padhai.backend.entity.Subscription;
import com.padhai.backend.repository.SubscriptionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Optional;

@Service
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;

    public SubscriptionService(SubscriptionRepository subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    // Called when a payment succeeds — activates 1 month
    public Subscription activateSubscription(Long userId) {
        Subscription sub = new Subscription();
        sub.setUserId(userId);
        sub.setStartDate(LocalDate.now());
        sub.setEndDate(LocalDate.now().plusMonths(1)); // 1 month from today
        sub.setStatus("ACTIVE");
        return subscriptionRepository.save(sub);
    }

    // Is this user currently subscribed?
    public boolean isSubscriptionActive(Long userId) {
        Optional<Subscription> latest =
                subscriptionRepository.findTopByUserIdOrderByEndDateDesc(userId);

        if (latest.isEmpty()) {
            return false; // never subscribed
        }

        Subscription sub = latest.get();
        // Active if the end date is today or in the future
        return !sub.getEndDate().isBefore(LocalDate.now());
    }
}