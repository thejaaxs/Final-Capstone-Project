package com.dealer.service;

import com.dealer.entity.DealerNotification;
import com.dealer.repository.DealerNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class DealerNotificationServiceImpl implements DealerNotificationService {

    private final DealerNotificationRepository repo;

    @Override
    public DealerNotification create(Long dealerId, String type, String message) {
        DealerNotification n = DealerNotification.builder()
                .dealerId(dealerId)
                .type(type)
                .message(message)
                .readFlag(false)
                .createdAt(LocalDateTime.now())
                .build();
        return repo.save(n);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DealerNotification> latest(Long dealerId) {
        return repo.findTop10ByDealerIdOrderByCreatedAtDesc(dealerId);
    }

    @Override
    @Transactional(readOnly = true)
    public long unreadCount(Long dealerId) {
        return repo.countByDealerIdAndReadFlagFalse(dealerId);
    }

    @Override
    public void markRead(Long dealerId, Long notificationId) {
        DealerNotification n = repo.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        if (!n.getDealerId().equals(dealerId)) throw new RuntimeException("Not allowed");
        n.setReadFlag(true);
        repo.save(n);
    }
}