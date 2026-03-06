package com.example.demo.exception;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ApiError {
  private String message;
  private String path;
}