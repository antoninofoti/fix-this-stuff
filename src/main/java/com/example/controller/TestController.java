package com.example.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class TestController {
    
    @GetMapping("/api/test/auth")
    public Map<String, Object> testAuth(
            @RequestHeader(value = "x-user", required = false) String user,
            @RequestHeader(value = "x-role", required = false) String role) {
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Authentication successful");
        response.put("user", user);
        response.put("role", role);
        response.put("timestamp", System.currentTimeMillis());
        
        return response;
    }
}
