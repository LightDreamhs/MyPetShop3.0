package com.petshop.backend.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 消费记录实体类
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class ConsumptionRecord extends BaseEntity {

    /**
     * 记录ID
     */
    private Long id;

    /**
     * 客户ID
     */
    private Long customerId;

    /**
     * 消费日期
     */
    private String date;

    /**
     * 消费项目
     */
    private String item;

    /**
     * 发现问题
     */
    private String problem;

    /**
     * 建议
     */
    private String suggestion;

    /**
     * 消费金额（单位：分）
     */
    private Long amount;
}
