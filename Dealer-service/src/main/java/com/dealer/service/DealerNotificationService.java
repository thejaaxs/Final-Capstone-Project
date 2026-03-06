package com.dealer.service;

import com.dealer.entity.DealerNotification;

import java.util.List;

public interface DealerNotificationService {
    DealerNotification create(Long dealerId, String type, String message);
    List<DealerNotification> latest(Long dealerId);
    long unreadCount(Long dealerId);
    void markRead(Long dealerId, Long notificationId);
}