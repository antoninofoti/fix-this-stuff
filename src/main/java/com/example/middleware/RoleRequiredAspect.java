package com.example.middleware;

import jakarta.servlet.http.HttpServletResponse;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;

@Aspect
@Component
public class RoleRequiredAspect {
    @Around("@annotation(com.example.middleware.RoleRequired) || @within(com.example.middleware.RoleRequired)")
    public Object checkRole(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        RoleRequired roleRequired = method.getAnnotation(RoleRequired.class);
        if (roleRequired == null) {
            roleRequired = method.getDeclaringClass().getAnnotation(RoleRequired.class);
        }
        String requiredRole = roleRequired != null ? roleRequired.value() : null;
        if (requiredRole == null) {
            return joinPoint.proceed();
        }
        UserContext user = UserContext.getCurrentUser();
        if (user == null) {
            return forbidden();
        }
        String userRole = user.getRole();
        if (requiredRole.equals("admin")) {
            if (!"admin".equals(userRole)) {
                return forbidden();
            }
        } else if (requiredRole.equals("moderator")) {
            if (!"moderator".equals(userRole) && !"admin".equals(userRole)) {
                return forbidden();
            }
        } else if (!requiredRole.equals(userRole)) {
            return forbidden();
        }
        return joinPoint.proceed();
    }

    private Object forbidden() throws Exception {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs != null) {
            HttpServletResponse response = attrs.getResponse();
            if (response != null) {
                response.setStatus(403);
                response.setContentType("application/json");
                response.getWriter().write("{\"message\": \"Forbidden: insufficient privileges\"}");
                response.getWriter().flush();
                return null;
            }
        }
        throw new Exception("Forbidden: insufficient privileges");
    }
}
