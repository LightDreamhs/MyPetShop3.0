package com.petshop.backend.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 商品销售记录实体类
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class Sale extends BaseEntity {

    /**
     * 销售记录ID
     */
    private Long id;

    /**
     * 客户ID（NULL表示散客）
     */
    private Long customerId;

    /**
     * 消费者姓名（冗余）
     */
    private String customerName;

    /**
     * 销售总价（单位：分）
     */
    private Long totalAmount;

    /**
     * 销售时间
     */
    private String saleDate;

    /**
     * 是否已记账（0否1是）
     */
    private Boolean recordedToAccounting;

    /**
     * 关联的财务记录ID
     */
    private Long transactionId;

    /**
     * 是否使用余额支付（0否1是）
     */
    private Boolean paidWithBalance;
}
