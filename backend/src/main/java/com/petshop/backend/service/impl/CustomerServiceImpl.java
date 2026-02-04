package com.petshop.backend.service.impl;

import com.petshop.backend.dto.BalanceDeductRequest;
import com.petshop.backend.dto.BalanceRechargeRequest;
import com.petshop.backend.dto.PageResult;
import com.petshop.backend.entity.BalanceTransaction;
import com.petshop.backend.entity.Customer;
import com.petshop.backend.exception.BusinessException;
import com.petshop.backend.mapper.BalanceTransactionMapper;
import com.petshop.backend.mapper.CustomerMapper;
import com.petshop.backend.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 客户服务实现类
 */
@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    private final CustomerMapper customerMapper;
    private final BalanceTransactionMapper balanceTransactionMapper;

    @Override
    public PageResult<Customer> findByPage(Integer page, Integer pageSize, String search, Boolean isMember, Integer memberLevel) {
        // 计算偏移量
        Integer offset = (page - 1) * pageSize;

        // 查询数据
        List<Customer> list = customerMapper.findByPage(offset, pageSize, search, isMember, memberLevel);
        Long total = customerMapper.countByCondition(search, isMember, memberLevel);

        return new PageResult<>(list, total, page, pageSize);
    }

    @Override
    public Customer findById(Long id) {
        Customer customer = customerMapper.findById(id);
        if (customer == null) {
            throw new BusinessException(4001, "客户不存在");
        }
        return customer;
    }

    @Override
    public Customer create(Customer customer) {
        customerMapper.insert(customer);
        return customer;
    }

    @Override
    public Customer update(Long id, Customer customer) {
        // 检查客户是否存在
        Customer existingCustomer = customerMapper.findById(id);
        if (existingCustomer == null) {
            throw new BusinessException(4001, "客户不存在");
        }

        customer.setId(id);
        customerMapper.update(customer);
        return customer;
    }

    @Override
    public void deleteById(Long id) {
        // 检查客户是否存在
        Customer existingCustomer = customerMapper.findById(id);
        if (existingCustomer == null) {
            throw new BusinessException(4001, "客户不存在");
        }

        customerMapper.deleteById(id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Customer recharge(Long id, BalanceRechargeRequest request, Long operatorId) {
        // 检查客户是否存在
        Customer customer = customerMapper.findById(id);
        if (customer == null) {
            throw new BusinessException(4001, "客户不存在");
        }

        // 验证充值金额
        if (request.getAmount() == null || request.getAmount() <= 0) {
            throw new BusinessException(4003, "充值金额必须大于0");
        }

        // 获取当前余额
        Long balanceBefore = customer.getBalance() != null ? customer.getBalance() : 0L;
        Long balanceAfter = balanceBefore + request.getAmount();

        // 更新余额
        customer.setBalance(balanceAfter);
        customerMapper.updateBalance(id, balanceAfter);

        // 记录余额变动历史
        BalanceTransaction transaction = new BalanceTransaction();
        transaction.setCustomerId(id);
        transaction.setType(BalanceTransaction.TransactionType.RECHARGE);
        transaction.setAmount(request.getAmount());
        transaction.setBalanceBefore(balanceBefore);
        transaction.setBalanceAfter(balanceAfter);
        transaction.setDescription(request.getDescription());
        transaction.setOperatorId(operatorId);
        balanceTransactionMapper.insert(transaction);

        return customer;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Customer deduct(Long id, BalanceDeductRequest request, Long operatorId) {
        // 检查客户是否存在
        Customer customer = customerMapper.findById(id);
        if (customer == null) {
            throw new BusinessException(4001, "客户不存在");
        }

        // 验证扣减金额
        if (request.getAmount() == null || request.getAmount() <= 0) {
            throw new BusinessException(4003, "扣减金额必须大于0");
        }

        // 获取当前余额
        Long balanceBefore = customer.getBalance() != null ? customer.getBalance() : 0L;

        // 检查余额是否充足
        if (balanceBefore < request.getAmount()) {
            throw new BusinessException(4002, "余额不足");
        }

        Long balanceAfter = balanceBefore - request.getAmount();

        // 更新余额
        customer.setBalance(balanceAfter);
        customerMapper.updateBalance(id, balanceAfter);

        // 记录余额变动历史
        BalanceTransaction transaction = new BalanceTransaction();
        transaction.setCustomerId(id);
        transaction.setType(BalanceTransaction.TransactionType.DEDUCT);
        transaction.setAmount(request.getAmount());
        transaction.setBalanceBefore(balanceBefore);
        transaction.setBalanceAfter(balanceAfter);
        transaction.setDescription(request.getDescription());
        transaction.setOperatorId(operatorId);
        balanceTransactionMapper.insert(transaction);

        return customer;
    }

    @Override
    public PageResult<BalanceTransaction> getBalanceHistory(Long id, Integer page, Integer pageSize) {
        // 检查客户是否存在
        Customer customer = customerMapper.findById(id);
        if (customer == null) {
            throw new BusinessException(4001, "客户不存在");
        }

        // 计算偏移量
        Integer offset = (page - 1) * pageSize;

        // 查询数据
        List<BalanceTransaction> list = balanceTransactionMapper.findByCustomerId(id, offset, pageSize);
        Long total = balanceTransactionMapper.countByCustomerId(id);

        return new PageResult<>(list, total, page, pageSize);
    }
}
