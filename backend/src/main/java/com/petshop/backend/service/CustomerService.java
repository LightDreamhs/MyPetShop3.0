package com.petshop.backend.service;

import com.petshop.backend.dto.BalanceDeductRequest;
import com.petshop.backend.dto.BalanceRechargeRequest;
import com.petshop.backend.entity.BalanceTransaction;
import com.petshop.backend.entity.Customer;

/**
 * 客户服务接口
 */
public interface CustomerService {

    /**
     * 分页查询客户列表
     */
    com.petshop.backend.dto.PageResult<Customer> findByPage(Integer page, Integer pageSize, String search, Boolean isMember, Integer memberLevel);

    /**
     * 根据ID查询客户
     */
    Customer findById(Long id);

    /**
     * 创建客户
     */
    Customer create(Customer customer);

    /**
     * 更新客户
     */
    Customer update(Long id, Customer customer);

    /**
     * 删除客户
     */
    void deleteById(Long id);

    /**
     * 会员充值
     */
    Customer recharge(Long id, BalanceRechargeRequest request, Long operatorId);

    /**
     * 会员余额扣减
     */
    Customer deduct(Long id, BalanceDeductRequest request, Long operatorId);

    /**
     * 获取余额变动历史
     */
    com.petshop.backend.dto.PageResult<BalanceTransaction> getBalanceHistory(Long id, Integer page, Integer pageSize);
}
