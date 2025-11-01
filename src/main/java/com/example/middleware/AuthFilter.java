package com.example.middleware;

import com.example.service.JwtService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * AuthFilter extracts and validates JWT tokens from Authorization header
 * and sets x-user and x-role headers for downstream services.
 */
@Component
public class AuthFilter implements Filter {
    
    @Autowired
    private JwtService jwtService;
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        String requestURI = httpRequest.getRequestURI();
        String method = httpRequest.getMethod();
        
        // Skip authentication for OPTIONS requests (CORS preflight)
        if ("OPTIONS".equals(method)) {
            chain.doFilter(request, response);
            return;
        }
        
        // Skip authentication for auth service endpoints
        if (requestURI.startsWith("/api/auth/")) {
            chain.doFilter(request, response);
            return;
        }
        
        String internalAuthHeader = httpRequest.getHeader("X-Internal-Auth");
        if (internalAuthHeader != null) {
            sendUnauthorizedResponse(httpResponse, "X-Internal-Auth header is not allowed from external requests");
            return;
        }
        
        // Get Authorization header
        String authHeader = httpRequest.getHeader("Authorization");
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            sendUnauthorizedResponse(httpResponse, "Missing or invalid Authorization header");
            return;
        }
        
        // Extract JWT token
        String token = authHeader.substring(7); // Remove "Bearer " prefix
        
        // Validate token
        Claims claims = jwtService.validateToken(token);
        if (claims == null) {
            sendUnauthorizedResponse(httpResponse, "Invalid or expired token");
            return;
        }
        
        // Extract user information from token
        String userId = jwtService.getUserId(claims);
        String username = jwtService.getUsername(claims);
        String role = jwtService.getRole(claims);
        
        if (userId == null || username == null || role == null) {
            sendUnauthorizedResponse(httpResponse, "Invalid token claims");
            return;
        }
        
        // Store user info in thread-local context for later use
        UserContext.setCurrentUser(new UserContext(username, role));
        
        // Create a wrapper to add the headers to the downstream request
        HeaderAddingRequestWrapper wrappedRequest = new HeaderAddingRequestWrapper(httpRequest);
        wrappedRequest.addHeader("x-user", userId);
        wrappedRequest.addHeader("x-role", role);
        wrappedRequest.addHeader("x-username", username);
        wrappedRequest.addHeader("X-Internal-Auth", "true");
        
        try {
            chain.doFilter(wrappedRequest, response);
        } finally {
            UserContext.clear();
        }
    }
    
    private void sendUnauthorizedResponse(HttpServletResponse response, String message) throws IOException {
        response.setContentType("application/json");
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.getWriter().write("{\"message\": \"" + message + "\"}");
        response.getWriter().flush();
    }
}
