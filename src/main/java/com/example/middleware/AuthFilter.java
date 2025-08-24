package com.example.middleware;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * AuthFilter extracts x-user and x-role headers from the request and stores them in a UserContext.
 * If headers are missing, responds with 401 Unauthorized.
 */
@Component
public class AuthFilter implements Filter {
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        String username = httpRequest.getHeader("x-user");
        String role = httpRequest.getHeader("x-role");

        if (username == null || role == null) {
            response.setContentType("application/json");
            response.getWriter().write("{\"message\": \"Unauthorized request\"}");
            response.getWriter().flush();
            ((jakarta.servlet.http.HttpServletResponse) response).setStatus(401);
            return;
        }

        // Store user info in a thread-local context for later use
        UserContext.setCurrentUser(new UserContext(username, role));
        try {
            chain.doFilter(request, response);
        } finally {
            UserContext.clear();
        }
    }
}
