package com.example.demo.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ReviewCreateRequest {

	
    @NotNull
    private Long customerId;

    @NotBlank
    @Size(max = 120)
    private String productName;

    @NotNull
    @Min(1) @Max(5)
    private Integer rating;

    @Size(max = 200)
    private String title;

    @Size(max = 2000)
    private String comment;
}