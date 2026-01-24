# MySQL 初始化脚本目录

此目录包含 MySQL 容器启动时自动执行的初始化脚本。

## 使用说明

- 所有 `.sql` 文件会按照字母顺序自动执行
- 只在**首次创建数据库**时执行
- 如果数据卷已存在，这些脚本不会再次执行

## 文件说明

- `init.sql` - 数据库表结构和初始数据

## 注意事项

如果需要重新执行初始化脚本：

```bash
# 停止容器并删除数据卷
docker compose down
docker volume rm deployment_mysql-data

# 重新启动（会自动执行初始化脚本）
docker compose up -d
```
