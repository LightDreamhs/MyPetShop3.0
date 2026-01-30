-- 宠物店后台管理系统数据库表结构
-- 数据库: pet_shop_3_0
-- 版本: 1.0.0
-- Docker 部署专用初始化脚本

USE `pet_shop_3_0`;

-- ============================================
-- 1. 用户表 (users)
-- ============================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `password` VARCHAR(255) NOT NULL COMMENT '密码（加密）',
  `nickname` VARCHAR(100) NOT NULL COMMENT '显示名称',
  `avatar` VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
  `role` ENUM('ADMIN', 'STAFF') NOT NULL DEFAULT 'STAFF' COMMENT '角色（ADMIN管理员/STAFF普通员工）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================
-- 2. 商品表 (products)
-- ============================================
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '商品ID',
  `name` VARCHAR(200) NOT NULL COMMENT '商品名称',
  `price` BIGINT NOT NULL COMMENT '价格（单位：分）',
  `stock` INT NOT NULL DEFAULT 0 COMMENT '库存数量',
  `image_url` VARCHAR(500) NOT NULL COMMENT '商品图片URL',
  `description` TEXT DEFAULT NULL COMMENT '商品描述',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品表';

-- ============================================
-- 3. 客户表 (customers)
-- ============================================
DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '客户ID',
  `pet_name` VARCHAR(100) NOT NULL COMMENT '宠物名称',
  `owner_name` VARCHAR(100) NOT NULL COMMENT '主人姓名',
  `phone` VARCHAR(20) NOT NULL COMMENT '电话号码',
  `is_member` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否会员（0否1是，已废弃，使用member_level替代）',
  `member_level` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '会员级别（0非会员1初级2中级3高级4至尊）',
  `avatar` VARCHAR(500) DEFAULT NULL COMMENT '宠物头像URL',
  `pet_type` VARCHAR(50) DEFAULT NULL COMMENT '宠物类型（猫/狗等）',
  `breed` VARCHAR(100) DEFAULT NULL COMMENT '品种',
  `age` INT DEFAULT NULL COMMENT '年龄',
  `gender` VARCHAR(20) DEFAULT NULL COMMENT '性别',
  `notes` TEXT DEFAULT NULL COMMENT '备注信息',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_owner_name` (`owner_name`),
  KEY `idx_phone` (`phone`),
  KEY `idx_member_level` (`member_level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客户表';

-- ============================================
-- 4. 消费记录表 (consumption_records)
-- ============================================
DROP TABLE IF EXISTS `consumption_records`;
CREATE TABLE `consumption_records` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `customer_id` BIGINT UNSIGNED NOT NULL COMMENT '客户ID',
  `date` DATETIME NOT NULL COMMENT '消费日期',
  `item` VARCHAR(200) NOT NULL COMMENT '消费项目',
  `problem` TEXT DEFAULT NULL COMMENT '发现问题',
  `suggestion` TEXT DEFAULT NULL COMMENT '建议',
  `amount` BIGINT DEFAULT NULL COMMENT '消费金额（单位：分）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消费记录表';

-- ============================================
-- 5. 财务记录表 (transactions)
-- ============================================
DROP TABLE IF EXISTS `transactions`;
CREATE TABLE `transactions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `type` ENUM('income', 'expense') NOT NULL COMMENT '类型（income收入/expense支出）',
  `amount` BIGINT NOT NULL COMMENT '金额（单位：分）',
  `description` VARCHAR(500) NOT NULL COMMENT '描述',
  `date` DATETIME NOT NULL COMMENT '日期',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='财务记录表';

-- ============================================
-- 初始化数据
-- ============================================

-- 插入默认管理员用户
INSERT INTO `users` (`username`, `password`, `nickname`, `avatar`, `role`) VALUES
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '管理员', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', 'ADMIN');
-- 密码是: admin123

-- 插入示例商品数据
INSERT INTO `products` (`name`, `price`, `stock`, `image_url`, `description`) VALUES
('皇家狗粮成犬粮', 15000, 50, 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400', '适合1-7岁成犬，营养均衡'),
('猫粮成猫粮', 12000, 35, 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400', '适合1岁以上成年猫'),
('宠物沐浴露', 4500, 100, 'https://images.unsplash.com/photo-1586717038702-7a1ea07f5c9d?w=400', '温和不刺激，适合所有宠物');

-- 插入示例客户数据
INSERT INTO `customers` (`pet_name`, `owner_name`, `phone`, `is_member`, `member_level`, `avatar`, `pet_type`, `breed`, `age`, `gender`, `notes`) VALUES
('旺财', '张三', '13800138000', 1, 2, 'https://images.unsplash.com/photo-1557495235-340eb888a9fb?w=400', '狗', '金毛', 3, '公', '性格温顺，喜欢玩球'),
('咪咪', '李四', '13800138001', 0, 0, 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=400', '猫', '英短', 2, '母', '性格安静，容易害羞');

-- 插入示例消费记录
INSERT INTO `consumption_records` (`customer_id`, `date`, `item`, `problem`, `suggestion`, `amount`) VALUES
(1, '2024-01-15 10:00:00', '洗澡美容', '皮肤轻微红疹', '建议使用低敏洗毛精，注意保持干燥', 8000),
(1, '2024-01-10 14:30:00', '疫苗接种', NULL, '下次接种时间：2024-07-10', 15000),
(2, '2024-01-12 16:00:00', '驱虫', '体表有跳蚤', '已进行体外驱虫，建议一个月后复查', 5000);

-- 插入示例财务记录
INSERT INTO `transactions` (`type`, `amount`, `description`, `date`) VALUES
('income', 8000, '狗粮销售', '2024-01-15 10:00:00'),
('income', 5000, '宠物洗澡服务', '2024-01-15 11:00:00'),
('expense', 50000, '采购狗粮10袋', '2024-01-14 09:00:00'),
('expense', 3000, '店用品采购', '2024-01-13 15:00:00');
