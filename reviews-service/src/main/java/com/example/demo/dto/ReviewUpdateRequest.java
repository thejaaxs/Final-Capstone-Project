package com.example.demo.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ReviewUpdateRequest {

    private String productName;   // ← THIS IS WHAT YOU ARE MISSING

    @Min(1)
    @Max(5)
    private Integer rating;

    @Size(max = 200)
    private String title;

    @Size(max = 2000)
    private String comment;
}