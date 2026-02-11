package com.petshop.backend.dto;

import lombok.Data;

/**
 * 月度收支统计DTO
 */
@Data
public class MonthlyStatistics {
    /**
     * 年月，格式: "2026年2月"
     */
    private String yearMonth;

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
}
