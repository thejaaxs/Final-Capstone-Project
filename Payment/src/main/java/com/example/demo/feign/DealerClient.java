package com.example.demo.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

@FeignClient(name = "DEALER-SERVICE")
public interface DealerClient {

    @PostMapping("/dealers/{dealerId}/notifications")
    void createNotification(
            @PathVariable("dealerId") Long dealerId,
            @RequestBody CreateNotificationRequest req
    );

    class CreateNotificationRequest {
        public String type;
        public String message;

        public CreateNotificationRequest() {}

        public CreateNotificationRequest(String type, String message) {
            this.type = type;
            this.message = message;
        }
    }
}