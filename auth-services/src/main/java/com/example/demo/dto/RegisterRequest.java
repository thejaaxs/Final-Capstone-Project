package com.example.demo.dto;

import com.example.demo.entity.UserType;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RegisterRequest {

  @NotBlank
  private String fullName;

  @Email @NotBlank
  private String emailId;

  @NotBlank
  private String mobileNo;

  @NotBlank
  private String address;

  @NotNull
  private UserType userType; // CUSTOMER / DEALER / ADMIN

  @NotBlank @Size(min = 6)
  private String password;
}