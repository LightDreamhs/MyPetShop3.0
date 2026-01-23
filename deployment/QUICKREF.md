# 快速参考指南

> 宠物店管理系统常用命令快速查询

## 🚀 快速启动

```bash
# 进入部署目录
cd /opt/petshop/deployment

# 启动所有服务
docker compose up -d

# 查看状态
docker compose ps
```

## 📊 服务管理

```bash
# 停止服务
docker compose stop

# 启动服务
docker compose start

# 重启服务
docker compose restart

# 停止并删除容器
docker compose down

# 停止并删除容器、网络、卷
docker compose down -v
```

## 📝 日志查看

```bash
# 查看所有服务日志
docker compose logs

# 实时跟踪日志
docker compose logs -f

# 查看特定服务日志
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mysql

# 查看最近100行日志
docker compose logs --tail=100
```

## 🔧 服务维护

```bash
# 重新构建并启动
docker compose up -d --build

# 重新构建单个服务
docker compose up -d --build backend

# 查看资源使用情况
docker stats

# 清理未使用的资源
docker system prune -a

# 进入容器
docker exec -it petshop-backend bash
docker exec -it petshop-mysql bash
```

## 💾 数据备份

```bash
# 备份数据库
docker exec petshop-mysql mysqldump -u petshop -p pet_shop_3_0 > backup.sql

# 恢复数据库
docker exec -i petshop-mysql mysql -u petshop -p pet_shop_3_0 < backup.sql

# 备份上传文件
docker run --rm -v petshop_upload-data:/data -v $(pwd):/backup alpine tar czf /backup/uploads.tar.gz -C /data .
```

## 🔄 更新部署

```bash
# 拉取最新代码
cd /opt/petshop
git pull

# 重新构建后端
cd backend
mvn clean package -DskipTests

# 重新部署
cd ../deployment
docker compose down
docker compose up -d --build
```

## 🔍 故障排查

```bash
# 查看容器状态
docker compose ps

# 查看服务日志
docker compose logs -f

# 检查网络连接
docker exec petshop-backend ping mysql

# 检查磁盘空间
df -h

# 检查端口占用
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :8080
```

## 🛡️ 安全操作

```bash
# 修改管理员密码（登录后在界面操作）
# 或使用数据库直接修改：
docker exec -it petshop-mysql mysql -u petshop -p
USE pet_shop_3_0;
UPDATE users SET password='$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi' WHERE username='admin';

# 查看 .env 配置
cat .env

# 重新生成安全密钥
openssl rand -base64 32
```

## 📞 默认信息

```
系统访问地址: http://your-server-ip

默认登录账号:
  用户名: admin
  密码: admin123

MySQL root 密码: 见 .env 文件
MySQL 应用密码: 见 .env 文件
JWT 密钥: 见 .env 文件
```

## 🔗 有用的链接

- 详细文档: `README.md`
- 接口文档: `../API接口文档.md`
- 前端设计: `../reference/frontend-description.md`
- 原型设计: `../reference/`

## ⚡ 常见问题速查

| 问题 | 解决方案 |
|------|---------|
| 容器无法启动 | 查看日志: `docker compose logs [service]` |
| 502 错误 | 检查后端: `docker compose restart backend` |
| 数据库连接失败 | 检查 MySQL: `docker compose logs mysql` |
| 端口被占用 | `sudo netstat -tulpn \| grep :端口` |
| 忘记密码 | 查看"安全操作"章节 |
| 磁盘满 | `docker system prune -a --volumes` |

---

**提示**: 将此文件加入书签，方便快速查找！
