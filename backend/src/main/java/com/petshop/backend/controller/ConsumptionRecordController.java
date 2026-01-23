package com.petshop.backend.controller;

import com.petshop.backend.dto.PageResult;
import com.petshop.backend.dto.Result;
import com.petshop.backend.entity.ConsumptionRecord;
import com.petshop.backend.service.ConsumptionRecordService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 消费记录控制器
 */
@RestController
@RequiredArgsConstructor
public class ConsumptionRecordController {

    private final ConsumptionRecordService consumptionRecordService;

    /**
     * 获取客户消费记录列表
     */
    @GetMapping("/customers/{customerId}/consumption-records")
    public Result<PageResult<ConsumptionRecord>> findByCustomerIdAndPage(
            @PathVariable Long customerId,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        PageResult<ConsumptionRecord> result = consumptionRecordService.findByCustomerIdAndPage(
                customerId, page, pageSize, startDate, endDate);
        return Result.success(result);
    }

    /**
     * 获取消费记录详情
     */
    @GetMapping("/consumption-records/{id}")
    public Result<ConsumptionRecord> findById(@PathVariable Long id) {
        ConsumptionRecord record = consumptionRecordService.findById(id);
        return Result.success(record);
    }

    /**
     * 创建消费记录
     */
    @PostMapping("/customers/{customerId}/consumption-records")
    public Result<ConsumptionRecord> create(
            @PathVariable Long customerId,
            @Valid @RequestBody ConsumptionRecordCreateRequest request) {
        ConsumptionRecord record = new ConsumptionRecord();
        record.setDate(request.date());
        record.setItem(request.item());
        record.setProblem(request.problem());
        record.setSuggestion(request.suggestion());
        record.setAmount(request.amount());

        ConsumptionRecord created = consumptionRecordService.create(customerId, record);
        return Result.success("创建成功", created);
    }

    /**
     * 更新消费记录
     */
    @PutMapping("/consumption-records/{id}")
    public Result<ConsumptionRecord> update(
            @PathVariable Long id,
            @Valid @RequestBody ConsumptionRecordUpdateRequest request) {
        ConsumptionRecord record = new ConsumptionRecord();
        record.setDate(request.date());
        record.setItem(request.item());
        record.setProblem(request.problem());
        record.setSuggestion(request.suggestion());
        record.setAmount(request.amount());

        ConsumptionRecord updated = consumptionRecordService.update(id, record);
        return Result.success("更新成功", updated);
    }

    /**
     * 删除消费记录
     */
    @DeleteMapping("/consumption-records/{id}")
    public Result<Void> deleteById(@PathVariable Long id) {
        consumptionRecordService.deleteById(id);
        return Result.success("删除成功", null);
    }

    /**
     * 创建消费记录请求DTO
     */
    public record ConsumptionRecordCreateRequest(
            @NotBlank(message = "消费日期不能为空")
            String date,
            @NotBlank(message = "消费项目不能为空")
            String item,
            String problem,
            String suggestion,
            @Min(value = 0, message = "消费金额不能为负数")
            Long amount
    ) {
    }

    /**
     * 更新消费记录请求DTO
     */
    public record ConsumptionRecordUpdateRequest(
            @NotBlank(message = "消费日期不能为空")
            String date,
            @NotBlank(message = "消费项目不能为空")
            String item,
            String problem,
            String suggestion,
            @Min(value = 0, message = "消费金额不能为负数")
            Long amount
    ) {
    }
}
