package com.petshop.backend.service.impl;

import com.petshop.backend.dto.MonthlyStatistics;
import com.petshop.backend.dto.PageResult;
import com.petshop.backend.dto.TransactionStatistics;
import com.petshop.backend.entity.Transaction;
import com.petshop.backend.exception.BusinessException;
import com.petshop.backend.mapper.TransactionMapper;
import com.petshop.backend.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Year;
import java.util.List;
import java.util.Map;

/**
 * 财务记录服务实现类
 */
@Service
@RequiredArgsConstructor
public class TransactionServiceImpl implements TransactionService {

    private final TransactionMapper transactionMapper;

    @Override
    public PageResult<Transaction> findByPage(Integer page, Integer pageSize, String type, String startDate, String endDate, String search) {
        // 计算偏移量
        Integer offset = (page - 1) * pageSize;

        // 查询数据
        List<Transaction> list = transactionMapper.findByPage(offset, pageSize, type, startDate, endDate, search);
        Long total = transactionMapper.countByCondition(type, startDate, endDate, search);

        return new PageResult<>(list, total, page, pageSize);
    }

    @Override
    public Transaction findById(Long id) {
        Transaction transaction = transactionMapper.findById(id);
        if (transaction == null) {
            throw new BusinessException(5001, "记录不存在");
        }
        return transaction;
    }

    @Override
    public Transaction create(Transaction transaction) {
        transactionMapper.insert(transaction);
        return transaction;
    }

    @Override
    public Transaction update(Long id, Transaction transaction) {
        // 检查记录是否存在
        Transaction existingTransaction = transactionMapper.findById(id);
        if (existingTransaction == null) {
            throw new BusinessException(5001, "记录不存在");
        }

        transaction.setId(id);
        transactionMapper.update(transaction);
        return transaction;
    }

    @Override
    public void deleteById(Long id) {
        // 检查记录是否存在
        Transaction existingTransaction = transactionMapper.findById(id);
        if (existingTransaction == null) {
            throw new BusinessException(5001, "记录不存在");
        }

        transactionMapper.deleteById(id);
    }

    @Override
    public TransactionStatistics getStatistics(String startDate, String endDate) {
        Map<String, Object> stats = transactionMapper.getStatistics(startDate, endDate);

        Long totalIncome = ((Number) stats.getOrDefault("totalIncome", 0L)).longValue();
        Long totalExpense = ((Number) stats.getOrDefault("totalExpense", 0L)).longValue();
        Long netIncome = ((Number) stats.getOrDefault("netIncome", 0L)).longValue();
        Integer incomeCount = ((Number) stats.getOrDefault("incomeCount", 0)).intValue();
        Integer expenseCount = ((Number) stats.getOrDefault("expenseCount", 0)).intValue();

        return new TransactionStatistics(totalIncome, totalExpense, netIncome, incomeCount, expenseCount);
    }

    @Override
    public List<MonthlyStatistics> getMonthlyStatistics(Integer year) {
        // 如果未指定年份，使用当前年份
        int targetYear = (year != null) ? year : Year.now().getValue();

        return transactionMapper.findMonthlyStatistics(targetYear);
    }
}
