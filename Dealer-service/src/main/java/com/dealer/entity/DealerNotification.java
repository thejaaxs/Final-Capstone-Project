package com.dealer.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "dealer_notifications")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class DealerNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long dealerId;

    @Column(nullable = false)
    private String type; // PAYMENT, BOOKING, INFO

    @Column(nullable = false, length = 500)
    private String message;

    @Column(nullable = false)
    private boolean readFlag;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}