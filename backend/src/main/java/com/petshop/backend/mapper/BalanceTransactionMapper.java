package com.petshop.backend.mapper;

import com.petshop.backend.entity.BalanceTransaction;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 余额交易Mapper接口
 */
@Mapper
public interface BalanceTransactionMapper {

    /**
     * 根据客户ID查询余额交易历史
     */
    List<BalanceTransaction> findByCustomerId(@Param("customerId") Long customerId,
                                              @Param("offset") Integer offset,
                                              @Param("pageSize") Integer pageSize);

    /**
     * 查询客户的余额交易记录总数
     */
    Long countByCustomerId(@Param("customerId") Long customerId);

    /**
     * 创建余额交易记录
     */
    int insert(BalanceTransaction transaction);
}
