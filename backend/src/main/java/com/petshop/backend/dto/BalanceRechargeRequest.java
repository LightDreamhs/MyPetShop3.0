package com.petshop.backend.dto;

import lombok.Data;

/**
 * 余额充值请求
 */
@Data
public class BalanceRechargeRequest {
    /**
     * 充值金额（单位：分）
     */
    private Long amount;

    /**
     * 说明
     */
    private String description;
}
