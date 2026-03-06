package com.example.demo.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateRazorpayOrderRequest {
    @NotNull
    private Long bookingId;

    @NotNull
    private Long customerId;
}