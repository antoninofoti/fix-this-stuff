package com.example.middleware;

import java.lang.annotation.*;

/**
 * Annotation to specify required role for a controller method or class.
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RoleRequired {
    String value();
}

/**
 * Shortcut annotation for admin-only access.
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@RoleRequired("admin")
@interface AdminOnly {}

/**
 * Shortcut annotation for moderator-or-admin access.
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@RoleRequired("moderator")
@interface ModeratorOnly {}
