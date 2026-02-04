package com.petshop.backend.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 余额交易实体类
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class BalanceTransaction extends BaseEntity {

    /**
     * 记录ID
     */
    private Long id;

    /**
     * 客户ID
     */
    private Long customerId;

    /**
     * 交易类型
     */
    private TransactionType type;

    /**
     * 变动金额（单位：分）
     */
    private Long amount;

    /**
     * 变动前余额
     */
    private Long balanceBefore;

    /**
     * 变动后余额
     */
    private Long balanceAfter;

    /**
     * 说明
     */
    private String description;

    /**
     * 操作人ID
     */
    private Long operatorId;

    /**
     * 操作人名称（关联查询，不存储）
     */
    private String operatorName;

    /**
     * 交易类型枚举
     */
    public enum TransactionType {
        RECHARGE,  // 充值
        DEDUCT,    // 扣减
        REFUND     // 退款
    }
}
