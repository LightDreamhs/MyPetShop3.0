-- 会员余额功能迁移脚本
-- 版本: 1.1
-- 日期: 2026-02-05

-- 为 customers 表添加 balance 字段
ALTER TABLE `customers`
ADD COLUMN `balance` BIGINT NOT NULL DEFAULT 0 COMMENT '会员余额（单位：分）'
AFTER `member_level`;

-- 创建余额变动历史表
CREATE TABLE IF NOT EXISTS `balance_transactions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `customer_id` BIGINT UNSIGNED NOT NULL COMMENT '客户ID',
  `type` ENUM('RECHARGE', 'DEDUCT', 'REFUND') NOT NULL COMMENT '类型',
  `amount` BIGINT NOT NULL COMMENT '变动金额（单位：分）',
  `balance_before` BIGINT NOT NULL COMMENT '变动前余额',
  `balance_after` BIGINT NOT NULL COMMENT '变动后余额',
  `description` VARCHAR(500) DEFAULT NULL COMMENT '说明',
  `operator_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '操作人ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会员余额变动历史表';
