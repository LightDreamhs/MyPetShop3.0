package com.petshop.backend.mapper;

import com.petshop.backend.entity.SaleItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 销售项Mapper接口
 */
@Mapper
public interface SaleItemMapper {

    /**
     * 根据销售记录ID查询销售项列表
     */
    List<SaleItem> findBySaleId(Long saleId);

    /**
     * 创建销售项
     */
    int insert(SaleItem saleItem);

    /**
     * 批量创建销售项
     */
    int insertBatch(@Param("items") List<SaleItem> items);

    /**
     * 删除销售记录的所有销售项
     */
    int deleteBySaleId(Long saleId);
}
