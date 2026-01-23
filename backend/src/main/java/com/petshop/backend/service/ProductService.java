package com.petshop.backend.service;

import com.petshop.backend.entity.Product;

/**
 * 商品服务接口
 */
public interface ProductService {

    /**
     * 分页查询商品列表
     */
    com.petshop.backend.dto.PageResult<Product> findByPage(Integer page, Integer pageSize, String search);

    /**
     * 根据ID查询商品
     */
    Product findById(Long id);

    /**
     * 创建商品
     */
    Product create(Product product);

    /**
     * 更新商品
     */
    Product update(Long id, Product product);

    /**
     * 修改商品库存
     */
    void updateStock(Long id, Integer stock);

    /**
     * 删除商品
     */
    void deleteById(Long id);
}
