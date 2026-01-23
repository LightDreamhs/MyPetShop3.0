package com.petshop.backend.mapper;

import com.petshop.backend.entity.Customer;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 客户Mapper接口
 */
@Mapper
public interface CustomerMapper {

    /**
     * 分页查询客户列表
     */
    List<Customer> findByPage(@Param("offset") Integer offset,
                              @Param("pageSize") Integer pageSize,
                              @Param("search") String search,
                              @Param("isMember") Boolean isMember,
                              @Param("memberLevel") Integer memberLevel);

    /**
     * 查询客户总数
     */
    Long countByCondition(@Param("search") String search,
                         @Param("isMember") Boolean isMember,
                         @Param("memberLevel") Integer memberLevel);

    /**
     * 根据ID查询客户
     */
    Customer findById(Long id);

    /**
     * 创建客户
     */
    int insert(Customer customer);

    /**
     * 更新客户
     */
    int update(Customer customer);

    /**
     * 删除客户
     */
    int deleteById(Long id);
}
