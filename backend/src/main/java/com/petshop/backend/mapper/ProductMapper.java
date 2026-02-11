package com.petshop.backend.mapper;

import com.petshop.backend.entity.Product;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 商品Mapper接口
 */
@Mapper
public interface ProductMapper {

    /**
     * 分页查询商品列表
     */
    List<Product> findByPage(@Param("offset") Integer offset,
                             @Param("pageSize") Integer pageSize,
                             @Param("search") String search);

    /**
     * 查询商品总数
     */
    Long countBySearch(@Param("search") String search);

    /**
     * 根据ID查询商品
     */
    Product findById(Long id);

    /**
     * 创建商品
     */
    int insert(Product product);

    /**
     * 更新商品
     */
    int update(Product product);

    /**
     * 更新商品库存
     */
    int updateStock(@Param("id") Long id, @Param("stock") Integer stock);

    /**
     * 扣减库存（带乐观锁，防止并发超卖）
     *
     * @return 更新的行数，如果为0说明库存不足
     */
    int deductStock(@Param("id") Long id, @Param("quantity") Integer quantity);

    /**
     * 删除商品
     */
    int deleteById(Long id);

    /**
     * 检查商品是否被销售项引用
     *
     * @return 引用数量
     */
    Long countSaleItemReferences(@Param("productId") Long productId);
}
