package com.petshop.backend.service.impl;

import com.petshop.backend.dto.PageResult;
import com.petshop.backend.entity.ConsumptionRecord;
import com.petshop.backend.entity.Customer;
import com.petshop.backend.exception.BusinessException;
import com.petshop.backend.mapper.ConsumptionRecordMapper;
import com.petshop.backend.mapper.CustomerMapper;
import com.petshop.backend.service.ConsumptionRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 消费记录服务实现类
 */
@Service
@RequiredArgsConstructor
public class ConsumptionRecordServiceImpl implements ConsumptionRecordService {

    private final ConsumptionRecordMapper consumptionRecordMapper;
    private final CustomerMapper customerMapper;

    @Override
    public PageResult<ConsumptionRecord> findByCustomerIdAndPage(Long customerId, Integer page, Integer pageSize, String startDate, String endDate) {
        // 检查客户是否存在
        if (customerMapper.findById(customerId) == null) {
            throw new BusinessException(4001, "客户不存在");
        }

        // 计算偏移量
        Integer offset = (page - 1) * pageSize;

        // 查询数据
        List<ConsumptionRecord> list = consumptionRecordMapper.findByCustomerIdAndPage(customerId, offset, pageSize, startDate, endDate);
        Long total = consumptionRecordMapper.countByCustomerIdAndCondition(customerId, startDate, endDate);

        return new PageResult<>(list, total, page, pageSize);
    }

    @Override
    public ConsumptionRecord findById(Long id) {
        ConsumptionRecord record = consumptionRecordMapper.findById(id);
        if (record == null) {
            throw new BusinessException(5001, "记录不存在");
        }
        return record;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ConsumptionRecord create(Long customerId, ConsumptionRecord record) {
        // 检查客户是否存在
        Customer customer = customerMapper.findById(customerId);
        if (customer == null) {
            throw new BusinessException(4001, "客户不存在");
        }

        record.setCustomerId(customerId);
        consumptionRecordMapper.insert(record);

        // 注意：不再自动创建财务记录，由前端通过"是否记账"选项控制
        // 这样可以避免重复记账，并给用户更多灵活性

        return record;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ConsumptionRecord update(Long id, ConsumptionRecord record) {
        // 检查记录是否存在
        ConsumptionRecord existingRecord = consumptionRecordMapper.findById(id);
        if (existingRecord == null) {
            throw new BusinessException(5001, "记录不存在");
        }

        record.setId(id);
        consumptionRecordMapper.update(record);
        return record;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteById(Long id) {
        // 检查记录是否存在
        ConsumptionRecord existingRecord = consumptionRecordMapper.findById(id);
        if (existingRecord == null) {
            throw new BusinessException(5001, "记录不存在");
        }

        consumptionRecordMapper.deleteById(id);
    }
}
