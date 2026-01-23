package com.petshop.backend.service.impl;

import com.petshop.backend.config.JwtConfig;
import com.petshop.backend.dto.LoginResponse;
import com.petshop.backend.entity.User;
import com.petshop.backend.exception.BusinessException;
import com.petshop.backend.mapper.UserMapper;
import com.petshop.backend.service.AuthService;
import com.petshop.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 认证服务实现类
 */
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserMapper userMapper;
    private final JwtUtil jwtUtil;
    private final JwtConfig jwtConfig;

    @Override
    public LoginResponse login(String username) {
        // 查询用户
        User user = userMapper.findByUsername(username);
        if (user == null) {
            throw new BusinessException(2001, "用户不存在");
        }

        // 移除密码后返回
        user.setPassword(null);

        // 生成token
        String token = jwtUtil.generateToken(user.getId(), user.getUsername());

        return new LoginResponse(user, token, Math.toIntExact(jwtConfig.getExpiration()));
    }

    @Override
    public User getCurrentUser(Long userId) {
        User user = userMapper.findById(userId);
        if (user == null) {
            throw new BusinessException(2001, "用户不存在");
        }
        user.setPassword(null);
        return user;
    }

    @Override
    public void logout(Long userId) {
        // JWT无状态登出，前端清除token即可
        // 如需实现token黑名单，可在此添加Redis缓存逻辑
    }
}
