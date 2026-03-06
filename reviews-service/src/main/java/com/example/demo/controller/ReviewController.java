package com.example.demo.controller;

import java.util.List;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.example.demo.dto.*;
import com.example.demo.service.ReviewService;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService service;

    @GetMapping("/")
    public String home() {
        return "Review service is running ✅";
    }

    // Add review
    @PostMapping("/add")
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewResponse add(@Valid @RequestBody ReviewCreateRequest request) {
        return service.add(request);
    }

    // Update review
    @PutMapping("/{id}")
    public ReviewResponse update(@PathVariable Long id,
                                 @Valid @RequestBody ReviewUpdateRequest request) {
        return service.update(id, request);
    }

    // Delete review
    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        service.delete(id);
        return "Review deleted successfully";
    
    }
    

    // List reviews
    @GetMapping("/list")
    public List<ReviewResponse> list(@RequestParam(required = false) Long customerId) {
        if (customerId == null) return service.listAll();
        return service.listByCustomer(customerId);
    }

    // List by product name
    @GetMapping("/byProductName/{productName}")
    public List<ReviewResponse> byProduct(@PathVariable String productName) {
        return service.listByProductName(productName);
    }

    // Admin style endpoint (no role check here — Gateway handles security)
    @GetMapping("/admin/all")
    public List<ReviewResponse> listAll() {
        return service.listAll();
    }
}