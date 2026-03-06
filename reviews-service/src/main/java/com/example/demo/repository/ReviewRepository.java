package com.example.demo.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.example.demo.entity.Review;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    boolean existsByCustomerIdAndProductNameIgnoreCase(Long customerId, String productName);

    List<Review> findByCustomerId(Long customerId);

    List<Review> findByCustomerIdAndProductNameIgnoreCase(Long customerId, String productName);
    
    List<Review> findByProductNameIgnoreCase(String productName);
}