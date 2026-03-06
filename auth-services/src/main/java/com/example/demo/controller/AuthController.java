package com.example.demo.controller;

import com.example.demo.dto.*;
import com.example.demo.entity.*;
import com.example.demo.repo.UserRepo;
import com.example.demo.security.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

  private final UserRepo userRepo;
  private final PasswordEncoder passwordEncoder;
  private final AuthenticationManager authenticationManager;
  private final JwtService jwtService;

  @PostMapping("/register")
  @ResponseStatus(HttpStatus.CREATED)
  public AuthResponse register(@Valid @RequestBody RegisterRequest req) {

    if (userRepo.existsByEmailId(req.getEmailId())) {
      throw new RuntimeException("Email already registered: " + req.getEmailId());
    }

    Role role = switch (req.getUserType()) {
      case CUSTOMER -> Role.ROLE_CUSTOMER;
      case DEALER -> Role.ROLE_DEALER;
      case ADMIN -> Role.ROLE_ADMIN;
    };

    AppUser user = AppUser.builder()
        .fullName(req.getFullName())
        .emailId(req.getEmailId())
        .mobileNo(req.getMobileNo())
        .address(req.getAddress())
        .userType(req.getUserType())
        .role(role)
        .password(passwordEncoder.encode(req.getPassword()))
        .active(true)
        .build();

    userRepo.save(user);

    String token = jwtService.generateToken(user.getEmailId(), user.getRole());

    return AuthResponse.builder()
        .token(token)
        .emailId(user.getEmailId())
        .role(user.getRole().name())
        .message("Registered successfully")
        .build();
  }

  @PostMapping("/login")
  public AuthResponse login(@Valid @RequestBody LoginRequest req) {

    Authentication auth = authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(req.getEmailId(), req.getPassword())
    );

    AppUser user = userRepo.findByEmailId(req.getEmailId())
        .orElseThrow(() -> new RuntimeException("User not found"));

    if (!user.isActive()) throw new RuntimeException("User is inactive");

    String token = jwtService.generateToken(user.getEmailId(), user.getRole());

    return AuthResponse.builder()
        .token(token)
        .emailId(user.getEmailId())
        .role(user.getRole().name())
        .message("Login successful")
        .build();
  }

  @GetMapping("/me")
  public InternalUserResponse me(Authentication authentication) {
    String email = authentication.getName();
    AppUser u = userRepo.findByEmailId(email).orElseThrow();

    return InternalUserResponse.builder()
        .emailId(u.getEmailId())
        .password("PROTECTED")
        .role(u.getRole().name())
        .active(u.isActive())
        .build();
  }

  @GetMapping("/internal/user")
  public InternalUserResponse internalUser(@RequestParam String email) {
    AppUser u = userRepo.findByEmailId(email)
        .orElseThrow(() -> new RuntimeException("User not found: " + email));

    return InternalUserResponse.builder()
        .emailId(u.getEmailId())
        .password(u.getPassword())
        .role(u.getRole().name())
        .active(u.isActive())
        .build();
  }
}