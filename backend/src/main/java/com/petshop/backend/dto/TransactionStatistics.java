package com.petshop.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 财务统计DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionStatistics implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 总收入（单位：分）
     */
    private Long totalIncome;

    /**
     * 总支出（单位：分）
     */
    private Long totalExpense;

    /**
     * 净收入（单位：分）
     */
    private Long netIncome;

    /**
     * 收入笔数
     */
    private Integer incomeCount;

    /**
     * 支出笔数
     */
    private Integer expenseCount;
}
