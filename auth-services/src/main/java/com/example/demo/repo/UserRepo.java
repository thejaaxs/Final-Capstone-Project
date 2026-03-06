package com.example.demo.repo;

import com.example.demo.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepo extends JpaRepository<AppUser, Long> {
  Optional<AppUser> findByEmailId(String emailId);
  boolean existsByEmailId(String emailId);
}