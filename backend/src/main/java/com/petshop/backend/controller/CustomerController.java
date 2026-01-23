package com.petshop.backend.controller;

import com.petshop.backend.dto.PageResult;
import com.petshop.backend.dto.Result;
import com.petshop.backend.entity.Customer;
import com.petshop.backend.service.CustomerService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 客户控制器
 */
@RestController
@RequestMapping("/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    /**
     * 获取客户列表
     */
    @GetMapping
    public Result<PageResult<Customer>> findByPage(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isMember,
            @RequestParam(required = false) Integer memberLevel) {
        PageResult<Customer> result = customerService.findByPage(page, pageSize, search, isMember, memberLevel);
        return Result.success(result);
    }

    /**
     * 获取客户详情
     */
    @GetMapping("/{id}")
    public Result<Customer> findById(@PathVariable Long id) {
        Customer customer = customerService.findById(id);
        return Result.success(customer);
    }

    /**
     * 创建客户
     */
    @PostMapping
    public Result<Customer> create(@Valid @RequestBody CustomerCreateRequest request) {
        Customer customer = new Customer();
        customer.setPetName(request.petName());
        customer.setOwnerName(request.ownerName());
        customer.setPhone(request.phone());
        // 根据 memberLevel 自动设置 isMember
        customer.setIsMember(request.memberLevel() > 0);
        customer.setMemberLevel(request.memberLevel());
        customer.setAvatar(request.avatar());
        customer.setPetType(request.petType());
        customer.setBreed(request.breed());
        customer.setAge(request.age());
        customer.setGender(request.gender());
        customer.setNotes(request.notes());

        Customer created = customerService.create(customer);
        return Result.success("创建成功", created);
    }

    /**
     * 更新客户
     */
    @PutMapping("/{id}")
    public Result<Customer> update(@PathVariable Long id, @Valid @RequestBody CustomerUpdateRequest request) {
        Customer customer = new Customer();
        customer.setPetName(request.petName());
        customer.setOwnerName(request.ownerName());
        customer.setPhone(request.phone());
        // 根据 memberLevel 自动设置 isMember
        customer.setIsMember(request.memberLevel() > 0);
        customer.setMemberLevel(request.memberLevel());
        customer.setAvatar(request.avatar());
        customer.setPetType(request.petType());
        customer.setBreed(request.breed());
        customer.setAge(request.age());
        customer.setGender(request.gender());
        customer.setNotes(request.notes());

        Customer updated = customerService.update(id, customer);
        return Result.success("更新成功", updated);
    }

    /**
     * 删除客户
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteById(@PathVariable Long id) {
        customerService.deleteById(id);
        return Result.success("删除成功", null);
    }

    /**
     * 创建客户请求DTO
     */
    public record CustomerCreateRequest(
            @NotBlank(message = "宠物名称不能为空")
            String petName,
            @NotBlank(message = "主人姓名不能为空")
            String ownerName,
            @NotBlank(message = "电话号码不能为空")
            @Pattern(regexp = "^1[3-9]\\d{9}$", message = "电话号码格式不正确")
            String phone,
            Boolean isMember,
            @NotNull(message = "会员级别不能为空")
            @Min(value = 0, message = "会员级别不能小于0")
            @Max(value = 4, message = "会员级别不能大于4")
            Integer memberLevel,
            String avatar,
            String petType,
            String breed,
            Integer age,
            String gender,
            String notes
    ) {
    }

    /**
     * 更新客户请求DTO
     */
    public record CustomerUpdateRequest(
            @NotBlank(message = "宠物名称不能为空")
            String petName,
            @NotBlank(message = "主人姓名不能为空")
            String ownerName,
            @NotBlank(message = "电话号码不能为空")
            @Pattern(regexp = "^1[3-9]\\d{9}$", message = "电话号码格式不正确")
            String phone,
            Boolean isMember,
            @NotNull(message = "会员级别不能为空")
            @Min(value = 0, message = "会员级别不能小于0")
            @Max(value = 4, message = "会员级别不能大于4")
            Integer memberLevel,
            String avatar,
            String petType,
            String breed,
            Integer age,
            String gender,
            String notes
    ) {
    }
}
