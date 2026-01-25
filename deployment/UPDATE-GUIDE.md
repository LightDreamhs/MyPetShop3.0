# MyPetShop3.0 更新指南

> 📖 完整的系统更新、验证和故障排查指南

## 📋 目录

- [快速开始](#快速开始)
- [更新流程](#更新流程)
- [验证更新](#验证更新)
- [数据持久化](#数据持久化)
- [故障排查](#故障排查)

---

## 🚀 快速开始

### 一键更新（推荐）

```bash
cd ~/MyPetShop3.0/deployment
./update.sh
```

该脚本会自动：
1. ✅ 拉取最新代码
2. ✅ 检测哪些组件发生了变化
3. ✅ 重新构建必要的Docker镜像
4. ✅ 智能重启受影响的容器
5. ✅ 验证数据持久化
6. ✅ 健康检查

### 快速状态检查

```bash
cd ~/MyPetShop3.0/deployment
./check-status.sh
```

该脚本会显示：
- Git版本信息
- Docker镜像版本
- 容器运行状态
- 配置文件验证
- 数据持久化状态
- 最近的错误日志

---

## 📖 更新流程

### 标准更新流程

```bash
# 1. 进入部署目录
cd ~/MyPetShop3.0/deployment

# 2. 执行更新脚本
./update.sh

# 3. 等待更新完成（3-5分钟）
# 脚本会自动检测变化并更新

# 4. 验证更新是否成功
./check-status.sh
```

### 更新脚本工作原理

```
┌─────────────────────────────────────────┐
│  1. 检查Git更新                          │
│     git fetch + git pull               │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  2. 分析代码变化                         │
│     ├─ backend/ → 重构后端镜像?         │
│     ├─ frontend/ → 重构前端镜像?        │
│     ├─ *.conf → 重构相关镜像?           │
│     └─ docker-compose.yml → 重启所有?   │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  3. 备份当前状态                         │
│     ├─ .env 文件                        │
│     ├─ 容器状态                         │
│     └─ 镜像ID                           │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  4. 重建镜像（仅变化的部分）              │
│     docker-compose build --no-cache    │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  5. 重启容器（保留数据卷）                │
│     docker-compose up -d               │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  6. 验证数据持久化                       │
│     ├─ MySQL数据卷                     │
│     ├─ 上传文件数据卷                   │
│     └─ 数据库表                         │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  7. 健康检查                             │
│     ├─ 容器状态                         │
│     ├─ API响应                          │
│     └─ 前端访问                         │
└─────────────────────────────────────────┘
```

---

## 🔍 验证更新

### 1. 检查Git版本

```bash
cd ~/MyPetShop3.0
git log -1 --oneline
```

应该显示最新的提交信息。

### 2. 检查镜像版本

```bash
docker images | grep deployment
```

查看 `CREATED` 时间，应该是刚刚创建的。

### 3. 检查容器状态

```bash
docker-compose ps
```

所有容器应该是 `Up` 状态，健康检查显示 `healthy`。

### 4. 使用状态检查脚本

```bash
cd ~/MyPetShop3.0/deployment
./check-status.sh
```

这会显示详细的系统状态信息。

### 5. 功能测试

访问以下URL验证功能：

- 前端: `http://你的服务器IP`
- API: `http://你的服务器IP/api/v1/users`
- 健康检查: `http://你的服务器IP/health`

---

## 💾 数据持久化

### 数据卷说明

系统使用Docker卷来持久化数据：

| 数据卷 | 用途 | 位置 | 更新时是否保留 |
|--------|------|------|--------------|
| `petshop_mysql-data` | MySQL数据库 | `/var/lib/mysql` | ✅ 保留 |
| `petshop_upload-data` | 上传文件 | `/app/uploads/images` | ✅ 保留 |
| `nginx-logs` | Nginx日志 | `/var/log/nginx` | ✅ 保留 |

### 验证数据持久化

```bash
# 1. 查看所有数据卷
docker volume ls | grep petshop

# 2. 查看数据卷详情
docker volume inspect petshop_mysql-data
docker volume inspect petshop_upload-data

# 3. 检查MySQL数据
docker exec petshop-mysql mysql -uroot -p你的密码 -e "USE pet_shop_3_0; SELECT COUNT(*) FROM users;"

# 4. 检查上传文件
docker exec petshop-backend ls -lh /app/uploads/images/
```

### 备份数据（重要！）

在更新前，建议手动备份重要数据：

```bash
# 备份MySQL数据库
docker exec petshop-mysql mysqldump -uroot -p你的密码 pet_shop_3_0 > backup_$(date +%Y%m%d).sql

# 备份上传文件
docker run --rm -v petshop_upload-data:/data -v $(pwd):/backup alpine tar czf /backup/uploads_$(date +%Y%m%d).tar.gz -C /data .
```

---

## 🔧 故障排查

### 问题1: 更新后无法访问网站

**检查步骤**：

```bash
# 1. 检查容器状态
docker-compose ps

# 2. 查看前端日志
docker logs petshop-frontend --tail 50

# 3. 检查nginx配置
docker exec petshop-frontend cat /etc/nginx/conf.d/default.conf | grep -A 5 "location /uploads"

# 4. 重启前端
docker-compose restart frontend
```

### 问题2: 图片显示404

**检查步骤**：

```bash
# 1. 检查文件是否存在
docker exec petshop-backend ls -la /app/uploads/images/

# 2. 检查后端日志
docker logs petshop-backend --tail 50 | grep -i "resource\|upload"

# 3. 测试后端直接访问
docker exec petshop-frontend curl -I http://backend:8080/uploads/images/你的文件名.jpg

# 4. 如果文件不存在但数据库有记录，需要重新上传或恢复备份
```

### 问题3: API返回500错误

**检查步骤**：

```bash
# 1. 查看后端完整日志
docker logs petshop-backend --tail 100

# 2. 检查数据库连接
docker exec petshop-backend env | grep MYSQL

# 3. 测试数据库连接
docker exec petshop-mysql mysql -uroot -p你的密码 -e "SELECT 1;"

# 4. 重启后端
docker-compose restart backend
```

### 问题4: 更新后数据库数据丢失

**恢复步骤**：

```bash
# 1. 停止所有服务
docker-compose down

# 2. 恢复数据库备份
docker run --rm -v petshop_mysql-data:/var/lib/mysql -v $(pwd):/backup \
  alpine sh -c "rm -rf /var/lib/mysql/* && tar xzf /backup/mysql_backup.tar.gz -C /"

# 3. 重新启动
docker-compose up -d
```

### 问题5: 容器一直是 unhealthy 状态

**检查步骤**：

```bash
# 1. 查看健康检查配置
docker inspect petshop-backend | grep -A 10 Health

# 2. 手动执行健康检查命令
docker exec petshop-backend wget --no-verbose --tries=1 --spider http://localhost:8080/api/v1/actuator/health

# 3. 检查后端是否真正启动
docker logs petshop-backend --tail 50

# 4. 给容器更多时间启动（最多90秒）
sleep 90
docker-compose ps
```

---

## 📊 更新前后对比

### 更新前应该做的事

- [ ] 备份数据库
- [ ] 备份上传文件
- [ ] 记录当前版本号
- [ ] 检查当前系统状态

### 更新后应该验证的事

- [ ] Git版本已更新
- [ ] Docker镜像已重建
- [ ] 容器状态正常
- [ ] 数据库数据完整
- [ ] 上传文件存在
- [ ] 前端可访问
- [ ] API可访问
- [ ] 图片正常显示

---

## 🎯 最佳实践

### 1. 定期更新

```bash
# 每天或每周执行一次
cd ~/MyPetShop3.0/deployment
./update.sh
```

### 2. 定期备份

```bash
# 每周备份一次数据库
docker exec petshop-mysql mysqldump -uroot -p你的密码 pet_shop_3_0 > backup_$(date +%Y%m%d).sql

# 保留最近30天的备份
find . -name "backup_*.sql" -mtime +30 -delete
```

### 3. 定期检查

```bash
# 每天检查一次系统状态
cd ~/MyPetShop3.0/deployment
./check-status.sh
```

### 4. 监控日志

```bash
# 实时监控所有日志
docker-compose logs -f

# 只监控错误
docker-compose logs -f | grep -i error
```

---

## 📞 获取帮助

如果遇到问题：

1. 查看状态检查脚本输出: `./check-status.sh`
2. 查看容器日志: `docker-compose logs`
3. 参考故障排查章节
4. 查看部署故障排查文档: `DEPLOYMENT-TROUBLESHOOTING.md`

---

## 📝 更新日志

- **2026-01-25**: 创建更新脚本和状态检查脚本
- **2026-01-25**: 添加数据持久化验证
- **2026-01-25**: 完善故障排查指南
