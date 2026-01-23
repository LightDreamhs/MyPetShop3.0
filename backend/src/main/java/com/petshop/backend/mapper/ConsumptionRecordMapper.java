package com.petshop.backend.mapper;

import com.petshop.backend.entity.ConsumptionRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 消费记录Mapper接口
 */
@Mapper
public interface ConsumptionRecordMapper {

    /**
     * 分页查询客户的消费记录列表
     */
    List<ConsumptionRecord> findByCustomerIdAndPage(@Param("customerId") Long customerId,
                                                     @Param("offset") Integer offset,
                                                     @Param("pageSize") Integer pageSize,
                                                     @Param("startDate") String startDate,
                                                     @Param("endDate") String endDate);

    /**
     * 查询客户的消费记录总数
     */
    Long countByCustomerIdAndCondition(@Param("customerId") Long customerId,
                                       @Param("startDate") String startDate,
                                       @Param("endDate") String endDate);

    /**
     * 根据ID查询消费记录
     */
    ConsumptionRecord findById(Long id);

    /**
     * 创建消费记录
     */
    int insert(ConsumptionRecord record);

    /**
     * 更新消费记录
     */
    int update(ConsumptionRecord record);

    /**
     * 删除消费记录
     */
    int deleteById(Long id);
}
