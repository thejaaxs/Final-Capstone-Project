package com.example.demo.service;

import java.util.List;
import com.example.demo.dto.ReviewCreateRequest;
import com.example.demo.dto.ReviewResponse;
import com.example.demo.dto.ReviewUpdateRequest;

public interface ReviewService {
    ReviewResponse add(ReviewCreateRequest request);
    ReviewResponse update(Long id, ReviewUpdateRequest request);
    void delete(Long id);

    List<ReviewResponse> listByCustomer(Long customerId);
    List<ReviewResponse> listByCustomerAndProduct(Long customerId, String productName);
    List<ReviewResponse> listByProductName(String productName);
    List<ReviewResponse> listAll(); // admin
}