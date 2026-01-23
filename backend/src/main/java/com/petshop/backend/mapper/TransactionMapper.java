package com.petshop.backend.mapper;

import com.petshop.backend.entity.Transaction;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

/**
 * 财务记录Mapper接口
 */
@Mapper
public interface TransactionMapper {

    /**
     * 分页查询财务记录列表
     */
    List<Transaction> findByPage(@Param("offset") Integer offset,
                                 @Param("pageSize") Integer pageSize,
                                 @Param("type") String type,
                                 @Param("startDate") String startDate,
                                 @Param("endDate") String endDate,
                                 @Param("search") String search);

    /**
     * 查询财务记录总数
     */
    Long countByCondition(@Param("type") String type,
                         @Param("startDate") String startDate,
                         @Param("endDate") String endDate,
                         @Param("search") String search);

    /**
     * 根据ID查询财务记录
     */
    Transaction findById(Long id);

    /**
     * 创建财务记录
     */
    int insert(Transaction transaction);

    /**
     * 更新财务记录
     */
    int update(Transaction transaction);

    /**
     * 删除财务记录
     */
    int deleteById(Long id);

    /**
     * 查询财务统计数据
     */
    Map<String, Object> getStatistics(@Param("startDate") String startDate,
                                     @Param("endDate") String endDate);
}
