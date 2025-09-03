package com.example.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

/**
 * Service for handling JWT token validation
 */
@Service
public class JwtService {
    
    private final SecretKey secretKey;
    
    public JwtService(@Value("${JWT_SECRET:your-secret-key}") String jwtSecret) {
        System.out.println("JWT Secret from environment: " + jwtSecret);
        
        // Use the exact same key as Node.js without any modification
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
        
        System.out.println("Using JWT key: " + jwtSecret.substring(0, Math.min(10, jwtSecret.length())) + "...");
        System.out.println("Key bytes length: " + keyBytes.length);
    }
    
    /**
     * Validates a JWT token and returns the claims if valid
     * @param token JWT token to validate
     * @return Claims if valid, null if invalid
     */
    public Claims validateToken(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(secretKey)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (JwtException | IllegalArgumentException e) {
            System.err.println("Invalid JWT token: " + e.getMessage());
            return null;
        }
    }
    
    /**
     * Extracts user ID from token claims
     */
    public String getUserId(Claims claims) {
        Object idClaim = claims.get("id");
        if (idClaim instanceof Integer) {
            return String.valueOf(idClaim);
        }
        return claims.get("id", String.class);
    }
    
    /**
     * Extracts username from token claims
     */
    public String getUsername(Claims claims) {
        String username = claims.get("username", String.class);
        if (username == null) {
            username = claims.get("email", String.class);
        }
        return username;
    }
    
    /**
     * Extracts role from token claims
     */
    public String getRole(Claims claims) {
        return claims.get("role", String.class);
    }
}
