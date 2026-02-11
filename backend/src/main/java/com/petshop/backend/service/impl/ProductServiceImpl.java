package com.petshop.backend.service.impl;

import com.petshop.backend.dto.PageResult;
import com.petshop.backend.entity.Product;
import com.petshop.backend.exception.BusinessException;
import com.petshop.backend.mapper.ProductMapper;
import com.petshop.backend.service.ProductService;
import com.petshop.backend.util.PaginationUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 商品服务实现类
 */
@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductMapper productMapper;

    @Override
    public PageResult<Product> findByPage(Integer page, Integer pageSize, String search) {
        // 计算偏移量
        Integer offset = PaginationUtil.calculateOffset(page, pageSize);

        // 查询数据
        List<Product> list = productMapper.findByPage(offset, pageSize, search);
        Long total = productMapper.countBySearch(search);

        return new PageResult<>(list, total, page, pageSize);
    }

    @Override
    public Product findById(Long id) {
        Product product = productMapper.findById(id);
        if (product == null) {
            throw new BusinessException(3001, "商品不存在");
        }
        return product;
    }

    @Override
    public Product create(Product product) {
        productMapper.insert(product);
        return product;
    }

    @Override
    public Product update(Long id, Product product) {
        // 检查商品是否存在
        Product existingProduct = productMapper.findById(id);
        if (existingProduct == null) {
            throw new BusinessException(3001, "商品不存在");
        }

        product.setId(id);
        productMapper.update(product);
        return product;
    }

    @Override
    public void updateStock(Long id, Integer stock) {
        // 检查商品是否存在
        Product existingProduct = productMapper.findById(id);
        if (existingProduct == null) {
            throw new BusinessException(3001, "商品不存在");
        }

        productMapper.updateStock(id, stock);
    }

    @Override
    public void deleteById(Long id) {
        // 检查商品是否存在
        Product existingProduct = productMapper.findById(id);
        if (existingProduct == null) {
            throw new BusinessException(3001, "商品不存在");
        }

        // 检查是否被销售项引用
        Long referenceCount = productMapper.countSaleItemReferences(id);
        if (referenceCount > 0) {
            throw new BusinessException(3005, "该商品已被销售记录引用，无法删除。请先删除相关的销售记录。");
        }

        productMapper.deleteById(id);
    }
}
