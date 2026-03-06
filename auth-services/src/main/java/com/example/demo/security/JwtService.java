package com.example.demo.security;

import com.example.demo.entity.Role;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {

  // ✅ must be at least 32 chars for HS256
  private static final String SECRET = "mysecretkeymysecretkeymysecretkey123456";

  private Key signKey() {
    return Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
  }

  public String generateToken(String emailId, Role role) {
    return Jwts.builder()
        .setSubject(emailId)
        .addClaims(Map.of("role", role.name()))
        .setIssuedAt(new Date())
        .setExpiration(new Date(System.currentTimeMillis() + 1000L * 60 * 60)) // 1 hour
        .signWith(signKey(), SignatureAlgorithm.HS256)
        .compact();
  }

  public String extractEmail(String token) {
    return parseClaims(token).getSubject();
  }

  public String extractRole(String token) {
    Object role = parseClaims(token).get("role");
    return role == null ? null : role.toString();
  }

  public boolean isValid(String token) {
    try {
      parseClaims(token);
      return true;
    } catch (JwtException | IllegalArgumentException e) {
      return false;
    }
  }

  private Claims parseClaims(String token) {
    return Jwts.parserBuilder()
        .setSigningKey(signKey())
        .build()
        .parseClaimsJws(token)
        .getBody();
  }
}