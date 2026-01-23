package com.petshop.backend.service;

import com.petshop.backend.dto.TransactionStatistics;
import com.petshop.backend.entity.Transaction;

/**
 * 财务记录服务接口
 */
public interface TransactionService {

    /**
     * 分页查询财务记录列表
     */
    com.petshop.backend.dto.PageResult<Transaction> findByPage(Integer page, Integer pageSize, String type, String startDate, String endDate, String search);

    /**
     * 根据ID查询财务记录
     */
    Transaction findById(Long id);

    /**
     * 创建财务记录
     */
    Transaction create(Transaction transaction);

    /**
     * 更新财务记录
     */
    Transaction update(Long id, Transaction transaction);

    /**
     * 删除财务记录
     */
    void deleteById(Long id);

    /**
     * 获取财务统计
     */
    TransactionStatistics getStatistics(String startDate, String endDate);
}
