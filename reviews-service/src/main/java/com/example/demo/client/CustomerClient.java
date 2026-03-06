package com.example.demo.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
@FeignClient(
	    name = "CUSTOMER-SERVICE",
	    contextId = "reviewCustomerClient"
	)
	public interface CustomerClient {

	    @GetMapping("/customers/{id}")
	    Object getCustomer(@PathVariable("id") Long id);
	}