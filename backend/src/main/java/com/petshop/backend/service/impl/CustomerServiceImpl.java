package com.petshop.backend.service.impl;

import com.petshop.backend.dto.PageResult;
import com.petshop.backend.entity.Customer;
import com.petshop.backend.exception.BusinessException;
import com.petshop.backend.mapper.CustomerMapper;
import com.petshop.backend.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 客户服务实现类
 */
@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    private final CustomerMapper customerMapper;

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
}
