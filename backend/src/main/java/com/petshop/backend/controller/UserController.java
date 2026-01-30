package com.petshop.backend.controller;

import com.petshop.backend.annotation.RequireRole;
import com.petshop.backend.dto.PageResult;
import com.petshop.backend.dto.Result;
import com.petshop.backend.entity.User;
import com.petshop.backend.enums.Role;
import com.petshop.backend.exception.BusinessException;
import com.petshop.backend.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 用户控制器
 */
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * 获取用户列表（仅管理员可访问）
     */
    @GetMapping
    @RequireRole(Role.ADMIN)
    public Result<PageResult<User>> findByPage(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String search) {
        PageResult<User> result = userService.findByPage(page, pageSize, search);
        return Result.success(result);
    }

    /**
     * 获取用户详情
     * 普通员工只能查看自己的信息
     */
    @GetMapping("/{id}")
    public Result<User> findById(@PathVariable Long id, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        String userRole = (String) request.getAttribute("userRole");
        Role role = Role.valueOf(userRole);

        // 普通员工只能查看自己
        if (role == Role.STAFF && !userId.equals(id)) {
            throw new BusinessException(1005, "权限不足，只能查看自己的信息");
        }

        User user = userService.findById(id);
        return Result.success(user);
    }

    /**
     * 创建用户（仅管理员可访问）
     */
    @PostMapping
    @RequireRole(Role.ADMIN)
    public Result<User> create(@Valid @RequestBody UserCreateRequest request) {
        User user = new User();
        user.setUsername(request.username());
        user.setNickname(request.nickname());
        user.setAvatar(request.avatar());
        user.setRole(request.role() != null ? request.role() : Role.STAFF);

        User created = userService.create(user);
        return Result.success("创建成功", created);
    }

    /**
     * 更新用户
     * 普通员工只能修改自己的信息，且不能修改角色
     */
    @PutMapping("/{id}")
    public Result<User> update(@PathVariable Long id, @Valid @RequestBody UserUpdateRequest request, HttpServletRequest httpRequest) {
        Long userId = (Long) httpRequest.getAttribute("userId");
        String userRole = (String) httpRequest.getAttribute("userRole");
        Role role = Role.valueOf(userRole);

        // 普通员工只能修改自己，且不能修改角色
        if (role == Role.STAFF) {
            if (!userId.equals(id)) {
                throw new BusinessException(1005, "权限不足，只能修改自己的信息");
            }
            // 普通员工修改时，忽略角色字段
            if (request.role() != null) {
                throw new BusinessException(1005, "权限不足，不能修改角色");
            }
        }

        User user = new User();
        user.setUsername(request.username());
        user.setNickname(request.nickname());
        user.setAvatar(request.avatar());
        user.setRole(request.role());

        User updated = userService.update(id, user);
        return Result.success("更新成功", updated);
    }

    /**
     * 删除用户（仅管理员可访问）
     */
    @DeleteMapping("/{id}")
    @RequireRole(Role.ADMIN)
    public Result<Void> deleteById(@PathVariable Long id) {
        userService.deleteById(id);
        return Result.success("删除成功", null);
    }

    /**
     * 创建用户请求DTO
     */
    public record UserCreateRequest(
            @NotBlank(message = "用户名不能为空")
            String username,
            @NotBlank(message = "显示名称不能为空")
            String nickname,
            String avatar,
            Role role
    ) {
    }

    /**
     * 更新用户请求DTO
     * username 可选：个人资料编辑时不需要修改用户名
     */
    public record UserUpdateRequest(
            String username,
            @NotBlank(message = "显示名称不能为空")
            String nickname,
            String avatar,
            Role role
    ) {
    }
}
