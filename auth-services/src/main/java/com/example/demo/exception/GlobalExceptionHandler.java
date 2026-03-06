package com.example.demo.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
    String msg = ex.getBindingResult().getFieldErrors().stream()
        .findFirst()
        .map(e -> e.getField() + " " + e.getDefaultMessage())
        .orElse("Validation error");

    return ResponseEntity.badRequest().body(ApiError.builder().message(msg).path(req.getRequestURI()).build());
  }

  @ExceptionHandler(BadCredentialsException.class)
  public ResponseEntity<ApiError> handleBadCredentials(BadCredentialsException ex, HttpServletRequest req) {
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
        .body(ApiError.builder().message("Bad credentials").path(req.getRequestURI()).build());
  }

  @ExceptionHandler(UsernameNotFoundException.class)
  public ResponseEntity<ApiError> handleUserNotFound(UsernameNotFoundException ex, HttpServletRequest req) {
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
        .body(ApiError.builder().message(ex.getMessage()).path(req.getRequestURI()).build());
  }

  @ExceptionHandler(DisabledException.class)
  public ResponseEntity<ApiError> handleDisabled(DisabledException ex, HttpServletRequest req) {
    return ResponseEntity.status(HttpStatus.FORBIDDEN)
        .body(ApiError.builder().message(ex.getMessage()).path(req.getRequestURI()).build());
  }

  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<ApiError> handleAccessDenied(AccessDeniedException ex, HttpServletRequest req) {
    return ResponseEntity.status(HttpStatus.FORBIDDEN)
        .body(ApiError.builder().message("Access denied").path(req.getRequestURI()).build());
  }

  @ExceptionHandler(RuntimeException.class)
  public ResponseEntity<ApiError> handleRuntime(RuntimeException ex, HttpServletRequest req) {
    final String message = ex.getMessage() == null ? "Request failed" : ex.getMessage();
    final String lower = message.toLowerCase();
    final HttpStatus status = (lower.contains("already exists") || lower.contains("duplicate"))
        ? HttpStatus.CONFLICT
        : HttpStatus.BAD_REQUEST;

    return ResponseEntity.status(status)
        .body(ApiError.builder().message(message).path(req.getRequestURI()).build());
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiError> handleAny(Exception ex, HttpServletRequest req) {
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(ApiError.builder()
            .message(ex.getMessage())
            .path(req.getRequestURI())
            .build());
  }
  @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
  public ResponseEntity<ApiError> handleDataIntegrity(org.springframework.dao.DataIntegrityViolationException ex,
                                                      HttpServletRequest req) {
    return ResponseEntity.status(HttpStatus.CONFLICT)
        .body(ApiError.builder()
            .message("Email already registered. Please login.")
            .path(req.getRequestURI())
            .build());
  }
}
