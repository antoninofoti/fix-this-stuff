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
    @RequestMapping(value = "/auth/**", method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
    public ResponseEntity<String> forwardToAuthService(
            HttpServletRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestHeader(value = "Content-Type", required = false) String contentType,
            @RequestBody(required = false) String body) {
        
        // Handle OPTIONS requests for CORS preflight
        if ("OPTIONS".equals(request.getMethod())) {
            return ResponseEntity.ok().build();
        }
        
        String path = request.getRequestURI().substring("/api/auth".length());
        String url = "http://auth-service:3001/auth" + path;
        
        HttpHeaders headers = new HttpHeaders();
        if (authorization != null) {
            headers.set("Authorization", authorization);
        }
        if (contentType != null) {
            headers.set("Content-Type", contentType);
        }
        
        HttpEntity<String> entity = new HttpEntity<>(body, headers);
        
        try {
            return restTemplate.exchange(url, HttpMethod.valueOf(request.getMethod()), entity, String.class);
        } catch (HttpClientErrorException e) {
            // Forward 4xx errors as-is (like 401, 409, etc.) with proper content type
            HttpHeaders responseHeaders = new HttpHeaders();
            responseHeaders.setContentType(MediaType.APPLICATION_JSON);
            return ResponseEntity.status(e.getStatusCode())
                .headers(responseHeaders)
                .body(e.getResponseBodyAsString());
        } catch (Exception e) {
            // Handle other errors
            logger.error("Error forwarding to auth service: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"message\":\"Gateway error: " + e.getMessage() + "\"}");
        }
    }

    /**
     * Forward requests to user service (authentication required)
     */
    @RequestMapping(value = "/users/**", method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
    public ResponseEntity<String> forwardToUserService(
            HttpServletRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestHeader(value = "Content-Type", required = false) String contentType,
            @RequestBody(required = false) String body) {
        
        // Handle OPTIONS requests for CORS preflight
        if ("OPTIONS".equals(request.getMethod())) {
            return ResponseEntity.ok().build();
        }
        
        return forwardRequestSimple(request, "http://user-service:3002/api", authorization, contentType, body);
    }

    /**
     * Forward ticket comments to comment-service (must be before /tickets/**)
     */
    @RequestMapping(value = "/tickets/*/comments/**", method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
    public ResponseEntity<String> forwardTicketCommentsToCommentService(
            HttpServletRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestHeader(value = "Content-Type", required = false) String contentType,
            @RequestBody(required = false) String body) {
        
        // Handle OPTIONS requests for CORS preflight
        if ("OPTIONS".equals(request.getMethod())) {
            return ResponseEntity.ok().build();
        }
        
        return forwardRequestSimple(request, "http://comment-api:5003/api", authorization, contentType, body);
    }

    /**
     * Forward requests to comment-service
     */
    @RequestMapping(value = "/comments/**", method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
    public ResponseEntity<String> forwardToCommentService(
            HttpServletRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestHeader(value = "Content-Type", required = false) String contentType,
            @RequestBody(required = false) String body) {
        
        // Handle OPTIONS requests for CORS preflight
        if ("OPTIONS".equals(request.getMethod())) {
            return ResponseEntity.ok().build();
        }
        
        return forwardRequestSimple(request, "http://comment-api:5003/api", authorization, contentType, body);
    }
    /**
     * Forward requests to ticket-service
     */
    @RequestMapping(value = "/tickets/**", method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
    public ResponseEntity<String> forwardToTicketService(
            HttpServletRequest request,
            @RequestBody(required = false) String body,
            @RequestHeader(value = "x-user", required = false) String userId,
            @RequestHeader(value = "x-role", required = false) String userRole) {

        // Handle OPTIONS requests for CORS preflight
        if ("OPTIONS".equals(request.getMethod())) {
            return ResponseEntity.ok().build();
        }

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
            
            // Add trusted headers injected by AuthFilter (NOT from frontend!)
            // AuthFilter validates JWT and extracts these from the token
            if (userId != null) {
                headers.set("x-user", userId);
            }
            if (userRole != null) {
                headers.set("x-role", userRole);
            }
            
            // Copy X-Internal-Auth if present (added by AuthFilter)
            String internalAuth = request.getHeader("X-Internal-Auth");
            if (internalAuth != null) {
                headers.set("X-Internal-Auth", internalAuth);
            }

            // Copy other relevant headers from original request
            Enumeration<String> headerNames = request.getHeaderNames();
            while (headerNames.hasMoreElements()) {
                String headerName = headerNames.nextElement();
                // Skip sensitive/internal headers - they're handled separately above
                if (!headerName.equalsIgnoreCase("authorization") && 
                    !headerName.equalsIgnoreCase("x-user") && 
                    !headerName.equalsIgnoreCase("x-role") &&
                    !headerName.equalsIgnoreCase("X-Internal-Auth")) {
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

    /**
     * Simple method to forward requests without authentication (for public endpoints)
     */
    private ResponseEntity<String> forwardRequestSimple(
            HttpServletRequest request,
            String serviceUrl,
            String authorization,
            String contentType,
            String body) {
        
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
            
            // Create headers
            HttpHeaders headers = new HttpHeaders();
            
            // If authorization parameter is null, try to get it from the request header
            if (authorization == null) {
                authorization = request.getHeader("Authorization");
            }
            
            if (authorization != null) {
                headers.set("Authorization", authorization);
            }
            if (contentType != null) {
                headers.set("Content-Type", contentType);
            }
            
            // Copy X-Internal-Auth and x-user headers if present (added by AuthFilter)
            String internalAuth = request.getHeader("X-Internal-Auth");
            if (internalAuth != null) {
                headers.set("X-Internal-Auth", internalAuth);
            }
            
            String userId = request.getHeader("x-user");
            if (userId != null) {
                headers.set("x-user", userId);
            }
            
            String userRole = request.getHeader("x-role");
            if (userRole != null) {
                headers.set("x-role", userRole);
            }
            
            String username = request.getHeader("x-username");
            if (username != null) {
                headers.set("x-username", username);
            }
            
            HttpEntity<String> entity = new HttpEntity<>(body, headers);
            HttpMethod method = HttpMethod.valueOf(request.getMethod());
            
            return restTemplate.exchange(targetUrl, method, entity, String.class);
            
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
