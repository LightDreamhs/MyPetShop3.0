package com.petshop.backend.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 客户实体类
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class Customer extends BaseEntity {

    /**
     * 客户ID
     */
    private Long id;

    /**
     * 宠物名称
     */
    private String petName;

    /**
     * 主人姓名
     */
    private String ownerName;

    /**
     * 电话号码
     */
    private String phone;

    /**
     * 是否会员（0否1是，已废弃，使用memberLevel）
     */
    private Boolean isMember;

    /**
     * 会员级别（0非会员1初级2中级3高级4至尊）
     */
    private Integer memberLevel;

    /**
     * 宠物头像URL
     */
    private String avatar;

    /**
     * 宠物类型（猫/狗等）
     */
    private String petType;

    /**
     * 品种
     */
    private String breed;

    /**
     * 年龄
     */
    private Integer age;

    /**
     * 性别
     */
    private String gender;

    /**
     * 备注信息
     */
    private String notes;
}
