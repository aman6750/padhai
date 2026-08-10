package com.padhai.backend.controller;
import java.util.Map;
import com.padhai.backend.entity.Subscription;
import com.padhai.backend.entity.User;
import com.padhai.backend.service.SubscriptionService;
import com.padhai.backend.service.UserService;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final UserService userService;

    public SubscriptionController(SubscriptionService subscriptionService,
                                  UserService userService) {
        this.subscriptionService = subscriptionService;
        this.userService = userService;
    }

    @PostMapping("/create-order")
    public String createOrder() throws Exception {
        return subscriptionService.createOrder();
    }

    // Step 2: frontend calls this after payment to verify + activate
    @PostMapping("/verify-payment")
    public Map<String, Object> verifyPayment(@RequestBody Map<String, String> data) {
        User user = currentUser();
        boolean success = subscriptionService.verifyAndActivate(
                user.getId(),
                data.get("razorpay_order_id"),
                data.get("razorpay_payment_id"),
                data.get("razorpay_signature")
        );
        return Map.of("success", success);
    }

    // Helper: get the logged-in user from the JWT
    private User currentUser() {
        String email = (String) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return userService.getByEmail(email);
    }

    // FAKE payment confirmation (Path A) — activates 1 month
    @PostMapping("/confirm-payment")
    public Subscription confirmPayment() {
        User user = currentUser();
        return subscriptionService.activateSubscription(user.getId());
    }

    // Check my current subscription status
    @GetMapping("/status")
    public Map<String, Object> status() {
        User user = currentUser();
        boolean active = subscriptionService.isSubscriptionActive(user.getId());
        return Map.of("active", active);
    }
}