package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long customerId;

    @Column(nullable = false)
    private Long dealerId;

    @Column(nullable = false)
    private Long vehicleId;

    private LocalDateTime bookingDate;

    private LocalDateTime deliveryDate;

    private String bookingStatus;

    private String paymentStatus;

    private Double amount;

    private LocalDateTime createdAt;
}