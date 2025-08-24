package com.example.middleware;

/**
 * Holds user information for the current request using ThreadLocal.
 */
public class UserContext {
    private static final ThreadLocal<UserContext> currentUser = new ThreadLocal<>();

    private final String username;
    private final String role;

    public UserContext(String username, String role) {
        this.username = username;
        this.role = role;
    }

    public String getUsername() {
        return username;
    }

    public String getRole() {
        return role;
    }

    public static void setCurrentUser(UserContext user) {
        currentUser.set(user);
    }

    public static UserContext getCurrentUser() {
        return currentUser.get();
    }

    public static void clear() {
        currentUser.remove();
    }
}
