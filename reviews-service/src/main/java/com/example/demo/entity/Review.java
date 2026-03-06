package com.example.demo.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.*;
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "reviews",
  uniqueConstraints = @UniqueConstraint(
      name = "uk_review_customer_product",
      columnNames = {"customer_id", "product_name"}))
public class Review extends AuditableEntity {   // ✅ EXTEND THIS

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name="customer_id", nullable = false)
    private Long customerId;

    @Column(name="product_name", nullable = false, length = 120)
    private String productName;

    @Column(nullable = false)
    private Integer rating;

    @Column(length = 200)
    private String title;

    @Column(length = 2000)
    private String comment;
}