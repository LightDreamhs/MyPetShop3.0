package com.petshop.backend.service;

import com.petshop.backend.dto.PageResult;
import com.petshop.backend.entity.User;

/**
 * 用户服务接口
 */
public interface UserService {

    /**
     * 分页查询用户列表
     */
    PageResult<User> findByPage(Integer page, Integer pageSize, String search);

    /**
     * 根据ID查询用户
     */
    User findById(Long id);

    /**
     * 创建用户
     */
    User create(User user);

    /**
     * 更新用户
     */
    User update(Long id, User user);

    /**
     * 删除用户
     */
    void deleteById(Long id);
}
