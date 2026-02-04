package com.petshop.backend.dto;

import lombok.Data;

/**
 * 余额扣减请求
 */
@Data
public class BalanceDeductRequest {
    /**
     * 扣减金额（单位：分）
     */
    private Long amount;

    /**
     * 说明
     */
    private String description;
}
