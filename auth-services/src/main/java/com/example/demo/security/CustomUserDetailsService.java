package com.example.demo.security;

import com.example.demo.repo.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

  private final UserRepo userRepo;

  @Override
  public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
    var u = userRepo.findByEmailId(username)
        .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

    if (!u.isActive()) throw new UsernameNotFoundException("User inactive: " + username);

    return new org.springframework.security.core.userdetails.User(
        u.getEmailId(),
        u.getPassword(),
        List.of(new SimpleGrantedAuthority(u.getRole().name()))
    );
  }
}