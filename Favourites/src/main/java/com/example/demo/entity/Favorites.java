package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class Favorites extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ✅ Customer who added favorite
    @Column(nullable = false)
    private Long customerId;

    // Dealer info
    @Column(nullable = false)
    private Long dealerId;

    @Column(nullable = false)
    private String dealerName;

    @Column(nullable = false)
    private String address;

    private String productName;
    private String reason;
}