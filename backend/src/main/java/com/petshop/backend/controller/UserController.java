package com.petshop.backend.controller;

import com.petshop.backend.dto.PageResult;
import com.petshop.backend.dto.Result;
import com.petshop.backend.entity.User;
import com.petshop.backend.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
     * 获取用户列表
     */
    @GetMapping
    public Result<PageResult<User>> findByPage(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String search) {
        PageResult<User> result = userService.findByPage(page, pageSize, search);
        return Result.success(result);
    }

    /**
     * 获取用户详情
     */
    @GetMapping("/{id}")
    public Result<User> findById(@PathVariable Long id) {
        User user = userService.findById(id);
        return Result.success(user);
    }

    /**
     * 创建用户
     */
    @PostMapping
    public Result<User> create(@Valid @RequestBody UserCreateRequest request) {
        User user = new User();
        user.setUsername(request.username());
        user.setNickname(request.nickname());
        user.setAvatar(request.avatar());

        User created = userService.create(user);
        return Result.success("创建成功", created);
    }

    /**
     * 更新用户
     */
    @PutMapping("/{id}")
    public Result<User> update(@PathVariable Long id, @Valid @RequestBody UserUpdateRequest request) {
        User user = new User();
        user.setUsername(request.username());
        user.setNickname(request.nickname());
        user.setAvatar(request.avatar());

        User updated = userService.update(id, user);
        return Result.success("更新成功", updated);
    }

    /**
     * 删除用户
     */
    @DeleteMapping("/{id}")
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
            String avatar
    ) {
    }

    /**
     * 更新用户请求DTO
     */
    public record UserUpdateRequest(
            @NotBlank(message = "用户名不能为空")
            String username,
            @NotBlank(message = "显示名称不能为空")
            String nickname,
            String avatar
    ) {
    }
}
