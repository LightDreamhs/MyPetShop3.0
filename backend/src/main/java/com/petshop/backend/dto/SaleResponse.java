package com.petshop.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * 销售响应DTO
 */
@Data
@AllArgsConstructor
public class SaleResponse {
    /**
     * 销售记录ID
     */
    private Long id;

    /**
     * 销售总价（单位：分）
     */
    private Long totalAmount;

    /**
     * 销售时间
     */
    private String saleDate;
}
