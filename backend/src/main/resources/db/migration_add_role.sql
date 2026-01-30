-- ============================================
-- 用户权限系统数据库迁移脚本
-- ============================================
-- 用途：为现有数据库添加角色字段
-- 版本：1.0.0
-- ============================================

USE `pet_shop_3_0`;

-- 1. 添加角色字段
ALTER TABLE `users` ADD COLUMN `role` ENUM('ADMIN', 'STAFF') NOT NULL DEFAULT 'STAFF' COMMENT '角色' AFTER `avatar`;

-- 2. 将 admin 用户设置为管理员
UPDATE `users` SET `role` = 'ADMIN' WHERE `username` = 'admin';

-- 3. 验证迁移结果
SELECT id, username, nickname, role FROM users;
