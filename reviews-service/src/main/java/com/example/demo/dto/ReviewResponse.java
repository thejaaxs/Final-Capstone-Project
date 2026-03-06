package com.example.demo.dto;

import java.time.Instant;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReviewResponse {
    private Long id;
    private Long customerId;
    private String productName;
    private Integer rating;
    private String title;
    private String comment;

    private Instant createdAt;
    private Instant updatedAt;
}