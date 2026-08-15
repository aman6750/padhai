package com.padhai.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class VdoCipherService {

    @Value("${vdocipher.secret}")
    private String vdocipherSecret;

    public Map<String, Object> getOtp(String videoId) {
        String url = "https://dev.vdocipher.com/api/videos/" + videoId + "/otp";

        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Apisecret " + vdocipherSecret);
        headers.set("Content-Type", "application/json");
        headers.set("Accept", "application/json");

        // Request body: ttl = how long the OTP is valid (300 seconds = 5 min)
        Map<String, Object> body = Map.of("ttl", 300);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
        return response.getBody(); // contains "otp" and "playbackInfo"
    }
}