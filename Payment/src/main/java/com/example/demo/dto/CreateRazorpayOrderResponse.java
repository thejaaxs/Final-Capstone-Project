package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CreateRazorpayOrderResponse {
    private String keyId;
    private String currency;
    private long amountInPaise;
    private String razorpayOrderId;
    private boolean mockMode;
    private String message;

    private Long bookingId;
    private Long customerId;
}
