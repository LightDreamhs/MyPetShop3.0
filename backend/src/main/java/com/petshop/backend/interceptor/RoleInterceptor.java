package com.petshop.backend.interceptor;

import com.petshop.backend.annotation.RequireRole;
import com.petshop.backend.enums.Role;
import com.petshop.backend.exception.BusinessException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.lang.reflect.Method;

/**
 * 角色权限拦截器
 * 检查方法上的 @RequireRole 注解，验证用户角色
 */
@Slf4j
@Component
public class RoleInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // 处理跨域预检请求
        if ("OPTIONS".equals(request.getMethod())) {
            return true;
        }

        // 只处理方法处理器
        if (!(handler instanceof HandlerMethod)) {
            return true;
        }

        HandlerMethod handlerMethod = (HandlerMethod) handler;
        Method method = handlerMethod.getMethod();

        // 检查方法上是否有 @RequireRole 注解
        RequireRole requireRole = method.getAnnotation(RequireRole.class);
        if (requireRole == null) {
            // 没有注解，不需要权限检查
            return true;
        }

        // 获取注解要求的角色
        Role requiredRole = requireRole.value();

        // 从请求属性中获取用户角色（由 JwtInterceptor 设置）
        String userRole = (String) request.getAttribute("userRole");

        if (userRole == null) {
            throw new BusinessException(1002, "未登录或token格式错误");
        }

        // 检查角色是否匹配
        if (!Role.valueOf(userRole).equals(requiredRole)) {
            throw new BusinessException(1005, "权限不足，需要管理员权限");
        }

        return true;
    }
}
