package com.petshop.backend.util;

import lombok.experimental.UtilityClass;

/**
 * 分页工具类
 */
@UtilityClass
public class PaginationUtil {
    /**
     * 计算分页偏移量
     * @param page 页码（从1开始）
     * @param pageSize 每页大小
     * @return 偏移量
     */
    public static Integer calculateOffset(Integer page, Integer pageSize) {
        return (page - 1) * pageSize;
    }
}
