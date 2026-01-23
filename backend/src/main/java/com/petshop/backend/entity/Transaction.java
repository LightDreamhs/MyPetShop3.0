package com.petshop.backend.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 财务记录实体类
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class Transaction extends BaseEntity {

    /**
     * 记录ID
     */
    private Long id;

    /**
     * 类型（income收入/expense支出）
     */
    private String type;

    /**
     * 金额（单位：分）
     */
    private Long amount;

    /**
     * 描述
     */
    private String description;

    /**
     * 日期
     */
    private String date;
}
