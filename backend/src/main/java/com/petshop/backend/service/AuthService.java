package com.petshop.backend.service;

import com.petshop.backend.dto.LoginResponse;
import com.petshop.backend.entity.User;

/**
 * 认证服务接口
 */
public interface AuthService {

    /**
     * 用户登录
     */
    LoginResponse login(String username);

    /**
     * 获取当前用户信息
     */
    User getCurrentUser(Long userId);

    /**
     * 用户登出
     */
    void logout(Long userId);
}
