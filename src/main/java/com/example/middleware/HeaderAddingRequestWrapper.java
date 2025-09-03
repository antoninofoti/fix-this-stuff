package com.example.middleware;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;

import java.util.*;

/**
 * HttpServletRequestWrapper that allows adding custom headers
 */
public class HeaderAddingRequestWrapper extends HttpServletRequestWrapper {
    
    private final Map<String, String> customHeaders = new HashMap<>();
    
    public HeaderAddingRequestWrapper(HttpServletRequest request) {
        super(request);
    }
    
    public void addHeader(String name, String value) {
        customHeaders.put(name, value);
    }
    
    @Override
    public String getHeader(String name) {
        // Check custom headers first
        String customValue = customHeaders.get(name);
        if (customValue != null) {
            return customValue;
        }
        // Fall back to original request
        return super.getHeader(name);
    }
    
    @Override
    public Enumeration<String> getHeaders(String name) {
        List<String> values = new ArrayList<>();
        
        // Add custom header if exists
        String customValue = customHeaders.get(name);
        if (customValue != null) {
            values.add(customValue);
        }
        
        // Add original headers
        Enumeration<String> originalHeaders = super.getHeaders(name);
        while (originalHeaders.hasMoreElements()) {
            values.add(originalHeaders.nextElement());
        }
        
        return Collections.enumeration(values);
    }
    
    @Override
    public Enumeration<String> getHeaderNames() {
        Set<String> names = new HashSet<>(customHeaders.keySet());
        
        Enumeration<String> originalNames = super.getHeaderNames();
        while (originalNames.hasMoreElements()) {
            names.add(originalNames.nextElement());
        }
        
        return Collections.enumeration(names);
    }
}
