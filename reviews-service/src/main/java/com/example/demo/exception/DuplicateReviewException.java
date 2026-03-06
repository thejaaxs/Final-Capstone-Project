package com.example.demo.exception;

public class DuplicateReviewException extends RuntimeException {
    public DuplicateReviewException(String message) { super(message); }
}