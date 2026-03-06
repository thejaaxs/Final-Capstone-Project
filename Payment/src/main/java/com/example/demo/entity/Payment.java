//package com.example.demo.entity;
//
//import jakarta.persistence.*;
//import lombok.*;
//
//import java.time.LocalDateTime;
//
//@Entity
//@Table(name = "payments")
//@Getter
//@Setter
//@NoArgsConstructor
//@AllArgsConstructor
//@Builder
//public class Payment {
//
//    @Id
//    @GeneratedValue(strategy = GenerationType.IDENTITY)
//    private Long id;
//
//    private Long bookingId;
//    private Long customerId;
//
//    private Double amount;
//
//    private String paymentMethod;  // CARD / UPI
//    private String paymentStatus;  // SUCCESS / FAILED
//
//    private String transactionId;
//
//    private LocalDateTime paymentDate;
//}



package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long bookingId;
    private Long customerId;

    // amount in rupees (as Double) for DB readability
    private Double amount;

    // Razorpay details
    @Column(name = "razorpay_order_id", unique = true)
    private String razorpayOrderId;

    @Column(name = "razorpay_payment_id")
    private String razorpayPaymentId;

    @Column(name = "razorpay_signature", length = 512)
    private String razorpaySignature;

    private String paymentStatus;   // CREATED / SUCCESS / FAILED
    private String transactionId;   // use razorpayPaymentId or your txn id

    private LocalDateTime paymentDate;
    private LocalDateTime createdAt;
}