package com.petshop.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * 创建销售记录请求DTO
 */
@Data
public class SaleCreateRequest {

    /**
     * 会员ID，null表示散客
     */
    private Long customerId;

    /**
     * 消费者姓名
     */
    @NotBlank(message = "消费者姓名不能为空")
    private String customerName;

    /**
     * 销售项列表
     */
    @NotEmpty(message = "商品列表不能为空")
    @Valid
    private List<SaleItemRequest> items;

    /**
     * 销售总价（单位：分），手动输入
     */
    @NotNull(message = "总价不能为空")
    @Min(value = 0, message = "总价不能为负数")
    private Long totalAmount;

    /**
     * 销售时间
     */
    @NotBlank(message = "销售时间不能为空")
    private String saleDate;

    /**
     * 是否记录到财务记账
     */
    private boolean recordToAccounting;

    /**
     * 是否使用余额支付（仅会员）
     */
    private boolean useBalance;

    /**
     * 销售项请求DTO
     */
    @Data
    public static class SaleItemRequest {

        /**
         * 商品ID
         */
        @NotNull(message = "商品不能为空")
        private Long productId;

        /**
         * 数量
         */
        @NotNull(message = "数量不能为空")
        @Min(value = 1, message = "数量必须大于0")
        private Integer quantity;

        /**
         * 单价（单位：分）
         */
        @NotNull(message = "单价不能为空")
        @Min(value = 0, message = "单价不能为负数")
        private Long unitPrice;
    }
}
