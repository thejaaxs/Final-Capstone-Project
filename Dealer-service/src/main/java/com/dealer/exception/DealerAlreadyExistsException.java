package com.dealer.exception;

public class DealerAlreadyExistsException extends RuntimeException {
    public DealerAlreadyExistsException(String message) {
        super(message);
    }
}
