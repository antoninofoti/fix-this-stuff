package com.example.config;

import com.example.middleware.AuthFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FilterConfig {

    @Bean
    public FilterRegistrationBean<AuthFilter> authFilterRegistration(AuthFilter authFilter) {
        FilterRegistrationBean<AuthFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(authFilter);
        // Apply to all API endpoints
        registration.addUrlPatterns("/api/*");
        registration.setName("authFilter");
        // Set order - should run after CORS filter
        registration.setOrder(2);
        return registration;
    }
}
