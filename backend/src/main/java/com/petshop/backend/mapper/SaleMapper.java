package com.petshop.backend.mapper;

import com.petshop.backend.entity.Sale;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 商品销售Mapper接口
 */
@Mapper
public interface SaleMapper {

    /**
     * 分页查询销售记录
     */
    List<Sale> findByPage(@Param("offset") Integer offset,
                          @Param("pageSize") Integer pageSize,
                          @Param("startDate") String startDate,
                          @Param("endDate") String endDate);

    /**
     * 查询销售记录总数
     */
    Long countByDateRange(@Param("startDate") String startDate, @Param("endDate") String endDate);

    /**
     * 根据ID查询销售记录
     */
    Sale findById(Long id);

    /**
     * 创建销售记录
     */
    int insert(Sale sale);

    /**
     * 更新关联的财务记录ID
     */
    int updateTransactionId(@Param("id") Long id, @Param("transactionId") Long transactionId);

    /**
     * 删除销售记录
     */
    int deleteById(Long id);
}
