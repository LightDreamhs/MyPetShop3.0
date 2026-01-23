package com.petshop.backend.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 商品实体类
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class Product extends BaseEntity {

    /**
     * 商品ID
     */
    private Long id;

    /**
     * 商品名称
     */
    private String name;

    /**
     * 价格（单位：分）
     */
    private Long price;

    /**
     * 库存数量
     */
    private Integer stock;

    /**
     * 商品图片URL
     */
    private String imageUrl;

    /**
     * 商品描述
     */
    private String description;
}
