package com.example.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Enumeration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api")
public class ApiGatewayController {

    private static final Logger logger = LoggerFactory.getLogger(ApiGatewayController.class);

    @Value("${USER_SERVICE_URL:http://user-service:3002}")
    private String userServiceUrl;

    @Value("${TICKET_SERVICE_URL:http://ticket-service:3003}")
    private String ticketServiceUrl;

    @Value("${COMMENT_SERVICE_URL:http://comment-api:5003}")
    private String commentServiceUrl;


    private final RestTemplate restTemplate = new RestTemplate();

    public ApiGatewayController() {
        logger.info("ApiGatewayController initialized!");
    }

        /**
     * Forward requests to auth service (no authentication required)
     */
    @RequestMapping(value = "/auth/**", method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE})
    public ResponseEntity<String> forwardToAuthService(
            HttpServletRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestHeader(value = "Content-Type", required = false) String contentType,
            @RequestBody(required = false) String body) {
        
        String path = request.getRequestURI().substring("/api/auth".length());
        String url = "http://auth-service:3001/api/auth" + path;
        
        HttpHeaders headers = new HttpHeaders();
        if (authorization != null) {
            headers.set("Authorization", authorization);
        }
        if (contentType != null) {
            headers.set("Content-Type", contentType);
        }
        
        HttpEntity<String> entity = new HttpEntity<>(body, headers);
        return restTemplate.exchange(url, HttpMethod.valueOf(request.getMethod()), entity, String.class);
    }

    /**
     * Forward requests to user service (authentication required)
     */
    @RequestMapping(value = "/users/**", method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE})
    public ResponseEntity<String> forwardToUserService(
            HttpServletRequest request,
            @RequestBody(required = false) String body,
            @RequestHeader(value = "x-user", required = false) String userId,
            @RequestHeader(value = "x-role", required = false) String userRole) {

        return forwardRequest(request, body, userServiceUrl, userId, userRole);
    }

    /**
     * Forward requests to comment-service
     */
    @RequestMapping(
    value = {"/comments/**", "/tickets/{ticketId}/comments/**"},
    method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE}
    )
    public ResponseEntity<String> forwardToCommentService(
            HttpServletRequest request,
            @RequestBody(required = false) String body,
            @RequestHeader(value = "x-user", required = false) String userId,
            @RequestHeader(value = "x-role", required = false) String userRole) {

        return forwardRequestWithToken(request, body, commentServiceUrl, userId, userRole);
    }


    /**
     * Forward requests to ticket-service
     */
    @RequestMapping(value = "/tickets/**", method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE})
    public ResponseEntity<String> forwardToTicketService(
            HttpServletRequest request,
            @RequestBody(required = false) String body,
            @RequestHeader(value = "x-user", required = false) String userId,
            @RequestHeader(value = "x-role", required = false) String userRole) {

        return forwardRequest(request, body, ticketServiceUrl, userId, userRole);
    }

    
  
    /**
     * Generic method to forward requests to backend services
     */
    private ResponseEntity<String> forwardRequest(
            HttpServletRequest request, 
            String body, 
            String serviceUrl, 
            String userId, 
            String userRole) {

        try {
            // Extract the path after /api/
            String originalPath = request.getRequestURI();
            String servicePath = originalPath.substring(4); // Remove "/api"
            String targetUrl = serviceUrl + servicePath;

            // Add query parameters if present
            String queryString = request.getQueryString();
            if (queryString != null) {
                targetUrl += "?" + queryString;
            }

            // Create headers for the backend service
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            // Add trusted headers injected by AuthFilter
            if (userId != null) {
                headers.set("x-user", userId);
            }
            if (userRole != null) {
                headers.set("x-role", userRole);
            }

            // Copy other relevant headers from original request
            Enumeration<String> headerNames = request.getHeaderNames();
            while (headerNames.hasMoreElements()) {
                String headerName = headerNames.nextElement();
                // Skip authorization header and our custom headers
                if (!headerName.equalsIgnoreCase("authorization") && 
                    !headerName.equalsIgnoreCase("x-user") && 
                    !headerName.equalsIgnoreCase("x-role")) {
                    headers.set(headerName, request.getHeader(headerName));
                }
            }

            // Create request entity
            HttpEntity<String> entity = new HttpEntity<>(body, headers);

            // Determine HTTP method
            HttpMethod method = HttpMethod.valueOf(request.getMethod());

            // Forward the request
            ResponseEntity<String> response = restTemplate.exchange(targetUrl, method, entity, String.class);

            return response;

        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(e.getResponseBodyAsString());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"Gateway error: " + e.getMessage() + "\"}");
        }
    }


/**
     * Generic method to forward requests to backend services including token
     */
    private ResponseEntity<String> forwardRequestWithToken(
            HttpServletRequest request, 
            String body, 
            String serviceUrl, 
            String userId, 
            String userRole) {

        try {
            // Extract the path after /api/
            String originalPath = request.getRequestURI();
            String servicePath = originalPath.substring(4); // Remove "/api"
            String targetUrl = serviceUrl + servicePath;

            // Add query parameters if present
            String queryString = request.getQueryString();
            if (queryString != null) {
                targetUrl += "?" + queryString;
            }

            // Create headers for the backend service
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            // Add trusted headers injected by AuthFilter
            if (userId != null) {
                headers.set("x-user", userId);
            }
            if (userRole != null) {
                headers.set("x-role", userRole);
            }

            // Copy other relevant headers from original request
            Enumeration<String> headerNames = request.getHeaderNames();
            while (headerNames.hasMoreElements()) {
                String headerName = headerNames.nextElement();
                // Skip authorization header and our custom headers
                if (!headerName.equalsIgnoreCase("x-user") && 
                    !headerName.equalsIgnoreCase("x-role")) {
                    headers.set(headerName, request.getHeader(headerName));
                }
            }

            // Create request entity
            HttpEntity<String> entity = new HttpEntity<>(body, headers);

            // Determine HTTP method
            HttpMethod method = HttpMethod.valueOf(request.getMethod());

            // Forward the request
            ResponseEntity<String> response = restTemplate.exchange(targetUrl, method, entity, String.class);

            return response;

        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(e.getResponseBodyAsString());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"Gateway error: " + e.getMessage() + "\"}");
        }
    }
}
