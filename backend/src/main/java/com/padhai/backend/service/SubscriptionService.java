package com.padhai.backend.service;
import com.padhai.backend.entity.Subscription;
import com.padhai.backend.repository.SubscriptionRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.Optional;
import com.razorpay.Utils;
import com.razorpay.RazorpayClient;
import com.razorpay.Order;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;

@Service
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;

    // add these fields inside the class
    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

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

    // create a Razorpay order for ₹500
    public String createOrder() throws Exception {
        RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);

        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", 500 * 100); // amount in paise: ₹500 = 50000 paise
        orderRequest.put("currency", "INR");
        orderRequest.put("receipt", "receipt_" + System.currentTimeMillis());

        Order order = client.orders.create(orderRequest);
        return order.toString(); // contains the order id
    }

    // verify the payment signature, then activate subscription
    public boolean verifyAndActivate(Long userId, String orderId,
                                     String paymentId, String signature) {
        try {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", orderId);
            options.put("razorpay_payment_id", paymentId);
            options.put("razorpay_signature", signature);

            // This checks the signature using your secret key
            boolean isValid = Utils.verifyPaymentSignature(options, razorpayKeySecret);

            if (isValid) {
                activateSubscription(userId); // your existing method
                return true;
            }
            return false;
        } catch (Exception e) {
            return false;
        }

    }
}