package com.petshop.backend.controller;

import com.petshop.backend.dto.MonthlyStatistics;
import com.petshop.backend.dto.PageResult;
import com.petshop.backend.dto.Result;
import com.petshop.backend.dto.TransactionStatistics;
import com.petshop.backend.entity.Transaction;
import com.petshop.backend.service.TransactionService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 财务记录控制器
 */
@RestController
@RequestMapping("/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    /**
     * 获取财务记录列表
     */
    @GetMapping
    public Result<PageResult<Transaction>> findByPage(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String search) {
        PageResult<Transaction> result = transactionService.findByPage(page, pageSize, type, startDate, endDate, search);
        return Result.success(result);
    }

    /**
     * 获取财务记录详情
     */
    @GetMapping("/{id}")
    public Result<Transaction> findById(@PathVariable Long id) {
        Transaction transaction = transactionService.findById(id);
        return Result.success(transaction);
    }

    /**
     * 创建财务记录
     */
    @PostMapping
    public Result<Transaction> create(@Valid @RequestBody TransactionRequest request) {
        Transaction transaction = new Transaction();
        transaction.setType(request.type());
        transaction.setAmount(request.amount());
        transaction.setDescription(request.description());
        transaction.setDate(request.date());

        Transaction created = transactionService.create(transaction);
        return Result.success("创建成功", created);
    }

    /**
     * 更新财务记录
     */
    @PutMapping("/{id}")
    public Result<Transaction> update(
            @PathVariable Long id,
            @Valid @RequestBody TransactionRequest request) {
        Transaction transaction = new Transaction();
        transaction.setType(request.type());
        transaction.setAmount(request.amount());
        transaction.setDescription(request.description());
        transaction.setDate(request.date());

        Transaction updated = transactionService.update(id, transaction);
        return Result.success("更新成功", updated);
    }

    /**
     * 删除财务记录
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteById(@PathVariable Long id) {
        transactionService.deleteById(id);
        return Result.success("删除成功", null);
    }

    /**
     * 获取财务统计
     */
    @GetMapping("/statistics")
    public Result<TransactionStatistics> getStatistics(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        TransactionStatistics stats = transactionService.getStatistics(startDate, endDate);
        return Result.success(stats);
    }

    /**
     * 获取按月统计的收支情况
     */
    @GetMapping("/monthly-statistics")
    public Result<java.util.List<MonthlyStatistics>> getMonthlyStatistics(
            @RequestParam(required = false) Integer year) {
        java.util.List<MonthlyStatistics> statistics = transactionService.getMonthlyStatistics(year);
        return Result.success("查询成功", statistics);
    }

    /**
     * 财务记录请求DTO
     */
    public record TransactionRequest(
            @NotBlank(message = "类型不能为空")
            @Pattern(regexp = "^(income|expense)$", message = "类型必须是income或expense")
            String type,
            @NotNull(message = "金额不能为空")
            @Min(value = 1, message = "金额必须大于0")
            Long amount,
            @NotBlank(message = "描述不能为空")
            String description,
            @NotBlank(message = "日期不能为空")
            String date
    ) {
    }
}
