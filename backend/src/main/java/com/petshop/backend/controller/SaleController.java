package com.petshop.backend.controller;

import com.petshop.backend.dto.PageResult;
import com.petshop.backend.dto.Result;
import com.petshop.backend.dto.SaleCreateRequest;
import com.petshop.backend.dto.SaleResponse;
import com.petshop.backend.entity.Sale;
import com.petshop.backend.service.SaleService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 商品销售控制器
 */
@RestController
@RequestMapping("/sales")
@RequiredArgsConstructor
public class SaleController {

    private final SaleService saleService;

    /**
     * 创建销售记录（散客和会员通用）
     */
    @PostMapping
    public Result<SaleResponse> createSale(
            @Valid @RequestBody SaleCreateRequest request,
            HttpServletRequest httpRequest) {
        Long operatorId = (Long) httpRequest.getAttribute("userId");
        SaleResponse response = saleService.createSale(request, operatorId);
        return Result.success("开单成功", response);
    }

    /**
     * 获取销售记录列表
     */
    @GetMapping
    public Result<PageResult<Sale>> findByPage(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        PageResult<Sale> result = saleService.findByPage(page, pageSize, startDate, endDate);
        return Result.success(result);
    }

    /**
     * 根据ID获取销售记录详情
     */
    @GetMapping("/{id}")
    public Result<Sale> findById(@PathVariable Long id) {
        Sale sale = saleService.findById(id);
        return Result.success(sale);
    }
}
