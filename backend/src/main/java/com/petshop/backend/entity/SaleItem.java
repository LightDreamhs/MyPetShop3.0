package com.petshop.backend.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 商品销售项实体类
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class SaleItem extends BaseEntity {

    /**
     * 销售项ID
     */
    private Long id;

    /**
     * 销售记录ID
     */
    private Long saleId;

    /**
     * 商品ID
     */
    private Long productId;

    /**
     * 商品名称（冗余，防止商品删除后无法显示）
     */
    private String productName;

    /**
     * 销售数量
     */
    private Integer quantity;

    /**
     * 商品单价（单位：分）
     */
    private Long unitPrice;

    /**
     * 小计（单位：分）
     */
    private Long subtotal;
}
