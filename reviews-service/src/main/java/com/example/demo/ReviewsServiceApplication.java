package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
@EnableJpaAuditing
@EnableFeignClients
@SpringBootApplication
@EnableDiscoveryClient
public class ReviewsServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ReviewsServiceApplication.class, args);
        System.out.println("Two Wheeler Dealer Management !");
    }
}
