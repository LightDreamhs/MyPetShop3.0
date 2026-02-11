package com.petshop.backend.exception;

import lombok.Getter;

/**
 * 库存不足异常
 */
@Getter
public class InsufficientStockException extends RuntimeException {

    private final String productName;
    private final Integer availableStock;
    private final Integer requiredQuantity;

    public InsufficientStockException(String productName, Integer availableStock, Integer requiredQuantity) {
        super(String.format("商品 [%s] 库存不足，当前库存: %d，需要: %d", productName, availableStock, requiredQuantity));
        this.productName = productName;
        this.availableStock = availableStock;
        this.requiredQuantity = requiredQuantity;
    }
}
