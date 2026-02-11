package com.petshop.backend.service;

import com.petshop.backend.dto.PageResult;
import com.petshop.backend.dto.SaleCreateRequest;
import com.petshop.backend.dto.SaleResponse;
import com.petshop.backend.entity.Sale;

/**
 * 商品销售服务接口
 */
public interface SaleService {

    /**
     * 创建销售记录（散客和会员通用）
     */
    SaleResponse createSale(SaleCreateRequest request, Long operatorId);

    /**
     * 分页查询销售记录
     */
    PageResult<Sale> findByPage(Integer page, Integer pageSize, String startDate, String endDate);

    /**
     * 根据ID查询销售记录
     */
    Sale findById(Long id);
}
