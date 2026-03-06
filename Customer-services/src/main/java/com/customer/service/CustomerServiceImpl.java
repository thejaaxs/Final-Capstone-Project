package com.customer.service;

import com.customer.entity.Customer;
import com.customer.exception.CustomerNotFoundException;
import com.customer.exception.DuplicateCustomerException;
import com.customer.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository repository;

    @Override
    public Customer createCustomer(Customer customer) {

        if (repository.existsByEmail(customer.getEmail())) {
            throw new DuplicateCustomerException("Customer with this email already exists.");
        }

        return repository.save(customer);
    }

    @Override
    public Customer updateCustomer(Long customerId, Customer customer) {

        Customer existing = repository.findById(customerId)
                .orElseThrow(() -> new CustomerNotFoundException("Customer not found with ID: " + customerId));

        existing.setCustomerName(customer.getCustomerName());
        existing.setAddress(customer.getAddress());
        existing.setContactNumber(customer.getContactNumber());

        // ✅ email usually should not change; if you want to allow it, tell me
        // existing.setEmail(customer.getEmail());

        return repository.save(existing);
    }

    @Override
    public void deleteCustomer(Long customerId) {

        Customer existing = repository.findById(customerId)
                .orElseThrow(() -> new CustomerNotFoundException("Customer not found with ID: " + customerId));

        repository.delete(existing);
    }

    @Override
    public Customer getCustomerById(Long customerId) {
        return repository.findById(customerId)
                .orElseThrow(() -> new CustomerNotFoundException("Customer not found with ID: " + customerId));
    }

    @Override
    public List<Customer> getAllCustomers() {
        return repository.findAll();
    }
}