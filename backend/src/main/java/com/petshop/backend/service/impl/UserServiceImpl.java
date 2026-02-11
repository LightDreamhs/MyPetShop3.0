package com.petshop.backend.service.impl;

import com.petshop.backend.dto.PageResult;
import com.petshop.backend.entity.User;
import com.petshop.backend.enums.Role;
import com.petshop.backend.exception.BusinessException;
import com.petshop.backend.mapper.UserMapper;
import com.petshop.backend.service.UserService;
import com.petshop.backend.util.PaginationUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 用户服务实现类
 */
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserMapper userMapper;

    /**
     * 设置默认角色，向后兼容旧数据
     */
    private void setDefaultRoleIfNeeded(User user) {
        if (user.getRole() == null) {
            user.setRole(Role.STAFF);
        }
    }

    @Override
    public PageResult<User> findByPage(Integer page, Integer pageSize, String search) {
        // 计算偏移量
        Integer offset = PaginationUtil.calculateOffset(page, pageSize);

        // 查询数据
        List<User> list = userMapper.findByPage(offset, pageSize, search);
        Long total = userMapper.countByCondition(search);

        // 清除密码字段，并设置默认角色（向后兼容）
        list.forEach(user -> {
            user.setPassword(null);
            setDefaultRoleIfNeeded(user);
        });

        return new PageResult<>(list, total, page, pageSize);
    }

    @Override
    public User findById(Long id) {
        User user = userMapper.findById(id);
        if (user == null) {
            throw new BusinessException(2001, "用户不存在");
        }
        user.setPassword(null);
        setDefaultRoleIfNeeded(user);
        return user;
    }

    @Override
    public User create(User user) {
        // 检查用户名是否已存在
        User existingUser = userMapper.findByUsername(user.getUsername());
        if (existingUser != null) {
            throw new BusinessException(2002, "用户名已存在");
        }

        // 使用默认密码：123456（BCrypt加密后的值，与admin初始密码相同）
        user.setPassword("$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi");

        // 设置默认角色为STAFF
        if (user.getRole() == null) {
            user.setRole(Role.STAFF);
        }

        userMapper.insert(user);
        user.setPassword(null);
        return user;
    }

    @Override
    public User update(Long id, User user) {
        // 检查用户是否存在
        User existingUser = userMapper.findById(id);
        if (existingUser == null) {
            throw new BusinessException(2001, "用户不存在");
        }

        // 部分更新：如果字段为 null，保持原值不变
        // 用户名：如果提供了新用户名，检查是否已被占用
        if (user.getUsername() != null && !user.getUsername().equals(existingUser.getUsername())) {
            User duplicateUser = userMapper.findByUsername(user.getUsername());
            if (duplicateUser != null) {
                throw new BusinessException(2002, "用户名已存在");
            }
        } else {
            user.setUsername(existingUser.getUsername());
        }

        // 昵称：如果为空，保持原值
        if (user.getNickname() == null || user.getNickname().trim().isEmpty()) {
            user.setNickname(existingUser.getNickname());
        }

        // 头像：如果为空，保持原值
        if (user.getAvatar() == null) {
            user.setAvatar(existingUser.getAvatar());
        }

        // 角色：如果为空，保持原值
        if (user.getRole() == null) {
            user.setRole(existingUser.getRole());
        }

        user.setId(id);
        // 密码不通过此接口修改，保持原密码不变
        user.setPassword(existingUser.getPassword());

        userMapper.update(user);
        user.setPassword(null);
        return user;
    }

    @Override
    public void deleteById(Long id) {
        // 检查用户是否存在
        User existingUser = userMapper.findById(id);
        if (existingUser == null) {
            throw new BusinessException(2001, "用户不存在");
        }

        userMapper.deleteById(id);
    }
}
