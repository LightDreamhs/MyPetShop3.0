package com.petshop.backend.mapper;

import com.petshop.backend.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 用户Mapper接口
 */
@Mapper
public interface UserMapper {

    /**
     * 根据用户名查询用户
     */
    User findByUsername(String username);

    /**
     * 根据ID查询用户
     */
    User findById(Long id);

    /**
     * 分页查询用户列表
     */
    List<User> findByPage(@Param("offset") Integer offset,
                          @Param("pageSize") Integer pageSize,
                          @Param("search") String search);

    /**
     * 查询用户总数
     */
    Long countByCondition(@Param("search") String search);

    /**
     * 创建用户
     */
    int insert(User user);

    /**
     * 更新用户
     */
    int update(User user);

    /**
     * 删除用户
     */
    int deleteById(Long id);
}
