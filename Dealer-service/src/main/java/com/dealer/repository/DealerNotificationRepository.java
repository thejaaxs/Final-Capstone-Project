package com.dealer.repository;

import com.dealer.entity.DealerNotification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DealerNotificationRepository extends JpaRepository<DealerNotification, Long> {
    List<DealerNotification> findTop10ByDealerIdOrderByCreatedAtDesc(Long dealerId);
    long countByDealerIdAndReadFlagFalse(Long dealerId);
}