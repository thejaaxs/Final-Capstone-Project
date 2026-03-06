package com.dealer.controller;

import com.dealer.entity.DealerNotification;
import com.dealer.service.DealerNotificationService;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/dealers")
@RequiredArgsConstructor
public class DealerNotificationController {

    private final DealerNotificationService service;

    @PostMapping("/{dealerId}/notifications")
    public DealerNotification create(@PathVariable Long dealerId, @RequestBody CreateNotificationRequest req) {
        return service.create(dealerId, req.getType(), req.getMessage());
    }

    @GetMapping("/{dealerId}/notifications")
    public List<DealerNotification> latest(@PathVariable Long dealerId) {
        return service.latest(dealerId);
    }

    @GetMapping("/{dealerId}/notifications/unread-count")
    public long unreadCount(@PathVariable Long dealerId) {
        return service.unreadCount(dealerId);
    }

    @PutMapping("/{dealerId}/notifications/{id}/read")
    public String markRead(@PathVariable Long dealerId, @PathVariable Long id) {
        service.markRead(dealerId, id);
        return "OK";
    }

    @Data
    public static class CreateNotificationRequest {
        @NotBlank private String type;
        @NotBlank private String message;
    }
}