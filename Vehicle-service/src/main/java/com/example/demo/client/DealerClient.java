package com.example.demo.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "DEALER-SERVICE")
public interface DealerClient {

    @GetMapping("/dealers/{id}")
    Object getDealer(@PathVariable("id") Long id);
}