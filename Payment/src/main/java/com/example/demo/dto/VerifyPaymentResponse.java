package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VerifyPaymentResponse {
    private String status;  // SUCCESS / FAILED
    private String message;
    private Long bookingId;
    private String transactionId;
}