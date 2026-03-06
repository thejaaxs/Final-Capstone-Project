package com.example.demo.service;

import java.util.List;

import com.example.demo.client.CustomerClient;
import com.example.demo.dto.*;
import com.example.demo.entity.Review;
import com.example.demo.exception.DuplicateReviewException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.ReviewRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository repo;
    private final CustomerClient customerClient;   // ✅ Feign validation


    // ============================
    // ADD REVIEW
    // ============================
    @Override
    public ReviewResponse add(ReviewCreateRequest req) {

        // 🔥 Validate customer exists via Feign
        customerClient.getCustomer(req.getCustomerId());

        // Duplicate check
        if (repo.existsByCustomerIdAndProductNameIgnoreCase(
                req.getCustomerId(), req.getProductName())) {

            throw new DuplicateReviewException(
                    "Review already exists for this customer and product. Please update instead.");
        }

        Review review = Review.builder()
                .customerId(req.getCustomerId())
                .productName(req.getProductName().trim())
                .rating(req.getRating())
                .title(req.getTitle())
                .comment(req.getComment())
                .build();

        Review saved = repo.save(review);
        return toResponse(saved);
    }


    // ============================
    // UPDATE REVIEW
    // ============================
    @Override
    public ReviewResponse update(Long id, ReviewUpdateRequest req) {

        Review review = repo.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Review not found with id: " + id));

        // 🔥 If product name is being updated
        if (req.getProductName() != null) {

            String newProduct = req.getProductName().trim();

            // Duplicate check (only if product changed)
            if (!newProduct.equalsIgnoreCase(review.getProductName()) &&
                repo.existsByCustomerIdAndProductNameIgnoreCase(
                        review.getCustomerId(), newProduct)) {

                throw new DuplicateReviewException(
                        "Another review already exists for this customer and product.");
            }

            review.setProductName(newProduct);
        }

        if (req.getRating() != null)
            review.setRating(req.getRating());

        if (req.getTitle() != null)
            review.setTitle(req.getTitle());

        if (req.getComment() != null)
            review.setComment(req.getComment());

        Review saved = repo.save(review);
        return toResponse(saved);
    }


    // ============================
    // DELETE REVIEW
    // ============================
    @Override
    public void delete(Long id) {
        Review review = repo.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Review not found with id: " + id));

        repo.delete(review);
    }


    // ============================
    // LIST BY CUSTOMER
    // ============================
    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> listByCustomer(Long customerId) {
        return repo.findByCustomerId(customerId)
                .stream()
                .map(this::toResponse)
                .toList();
    }


    // ============================
    // LIST BY CUSTOMER + PRODUCT
    // ============================
    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> listByCustomerAndProduct(Long customerId, String productName) {
        return repo.findByCustomerIdAndProductNameIgnoreCase(customerId, productName)
                .stream()
                .map(this::toResponse)
                .toList();
    }


    // ============================
    // LIST BY PRODUCT NAME
    // ============================
    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> listByProductName(String productName) {
        return repo.findByProductNameIgnoreCase(productName)
                .stream()
                .map(this::toResponse)
                .toList();
    }


    // ============================
    // LIST ALL
    // ============================
    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> listAll() {
        return repo.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }


    // ============================
    // MAPPER
    // ============================
    private ReviewResponse toResponse(Review r) {
        return ReviewResponse.builder()
                .id(r.getId())
                .customerId(r.getCustomerId())
                .productName(r.getProductName())
                .rating(r.getRating())
                .title(r.getTitle())
                .comment(r.getComment())
                // ✅ auditing fields (from AuditableEntity)
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}