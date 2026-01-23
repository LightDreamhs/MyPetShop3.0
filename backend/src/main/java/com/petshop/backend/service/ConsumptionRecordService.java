package com.petshop.backend.service;

import com.petshop.backend.entity.ConsumptionRecord;

/**
 * 消费记录服务接口
 */
public interface ConsumptionRecordService {

    /**
     * 分页查询客户的消费记录列表
     */
    com.petshop.backend.dto.PageResult<ConsumptionRecord> findByCustomerIdAndPage(Long customerId, Integer page, Integer pageSize, String startDate, String endDate);

    /**
     * 根据ID查询消费记录
     */
    ConsumptionRecord findById(Long id);

    /**
     * 创建消费记录
     */
    ConsumptionRecord create(Long customerId, ConsumptionRecord record);

    /**
     * 更新消费记录
     */
    ConsumptionRecord update(Long id, ConsumptionRecord record);

    /**
     * 删除消费记录
     */
    void deleteById(Long id);
}
