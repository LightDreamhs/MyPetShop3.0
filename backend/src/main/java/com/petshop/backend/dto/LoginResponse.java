package com.petshop.backend.dto;

import com.petshop.backend.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 登录响应DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 用户信息
     */
    private User user;

    /**
     * 访问令牌
     */
    private String accessToken;

    /**
     * 过期时间（秒）
     */
    private Integer expiresIn;
}
