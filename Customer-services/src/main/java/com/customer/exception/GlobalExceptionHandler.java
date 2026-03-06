package com.customer.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(CustomerNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, Object> handleNotFound(CustomerNotFoundException ex) {
        return Map.of(
                "timestamp", LocalDateTime.now(),
                "error", "Not Found",
                "message", ex.getMessage()
        );
    }

    @ExceptionHandler(DuplicateCustomerException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleDuplicate(DuplicateCustomerException ex) {
        return Map.of(
                "timestamp", LocalDateTime.now(),
                "error", "Duplicate Entry",
                "message", ex.getMessage()
        );
    }
}