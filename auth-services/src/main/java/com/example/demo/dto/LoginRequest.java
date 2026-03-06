package com.example.demo.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LoginRequest {
  @Email @NotBlank private String emailId;
  @NotBlank private String password;
}