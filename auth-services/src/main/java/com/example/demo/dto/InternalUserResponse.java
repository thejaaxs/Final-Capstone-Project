package com.example.demo.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InternalUserResponse {
  private String emailId;
  private String password; // bcrypt hash from DB
  private String role;     // ROLE_CUSTOMER / ROLE_DEALER / ROLE_ADMIN
  private boolean active;
}