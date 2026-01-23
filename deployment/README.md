# 宠物店管理系统 - Docker 部署指南

> 一键部署宠物店管理系统到云服务器

## 📋 目录

- [系统要求](#系统要求)
- [快速开始](#快速开始)
- [详细部署步骤](#详细部署步骤)
- [配置说明](#配置说明)
- [常用命令](#常用命令)
- [故障排查](#故障排查)
- [安全建议](#安全建议)
- [备份与恢复](#备份与恢复)

---

## 系统要求

### 服务器配置

| 配置项 | 最低要求 | 推荐配置 |
|--------|---------|---------|
| CPU | 2核 | 2核 |
| 内存 | 2GB | 4GB |
| 磁盘 | 40GB | 60GB |
| 操作系统 | Ubuntu 20.04+ / CentOS 7+ | Ubuntu 22.04 LTS |

### 软件要求

- Docker 20.10+
- Docker Compose 2.0+
- Git (可选，用于代码更新)

---

## 快速开始

### 1. 安装 Docker 和 Docker Compose

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com | bash -s docker
sudo apt install docker-compose -y

# CentOS
sudo yum install -y docker docker-compose
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
docker-compose --version
```

### 2. 下载部署文件

```bash
# 如果已有代码，进入 deployment 目录
cd /path/to/MyPetShop3.0/deployment

# 或者从 Git 仓库克隆
git clone <your-repo-url> petshop
cd petshop/deployment
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量（重要：请修改所有密码！）
nano .env
```

**必须修改的配置项：**

```bash
MYSQL_ROOT_PASSWORD=your_new_root_password
MYSQL_PASSWORD=your_new_password
JWT_SECRET=your_new_jwt_secret_at_least_32_characters
SERVER_DOMAIN=http://your-server-ip
```

### 4. 一键启动

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 5. 访问系统

打开浏览器访问：`http://your-server-ip`

默认登录账号：
- 用户名：`admin`
- 密码：`admin123`

⚠️ **重要提示**：首次登录后请立即修改密码！

---

## 详细部署步骤

### 步骤 1: 准备服务器

#### 1.1 购买云服务器

推荐配置（按性价比排序）：

**阿里云轻量应用服务器（推荐）**
- 配置：2核4G
- 价格：约100-150元/年
- 优势：不限流量，200M峰值带宽
- 购买链接：https://www.aliyun.com/product/swas

**腾讯云轻量应用服务器**
- 配置：2核4G 或 2核8G
- 价格：约120-200元/年
- 注意：限制300G月流量
- 购买链接：https://cloud.tencent.com/product/lighthouse

#### 1.2 初始化服务器

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 设置时区
sudo timedatectl set-timezone Asia/Shanghai

# 安装必要工具
sudo apt install -y git curl wget vim
```

#### 1.3 配置防火墙

```bash
# 安装并启用 UFW 防火墙
sudo apt install -y ufw
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# 查看状态
sudo ufw status
```

#### 1.4 配置云服务商安全组

在云服务器控制台配置安全组规则：

| 协议 | 端口 | 来源 | 说明 |
|------|------|------|------|
| TCP | 22 | 0.0.0.0/0 | SSH |
| TCP | 80 | 0.0.0.0/0 | HTTP |
| TCP | 443 | 0.0.0.0/0 | HTTPS |

⚠️ **不要开放 3306 端口到公网！**

### 步骤 2: 上传代码

#### 方式 A: 使用 Git（推荐）

```bash
# 1. 在本地初始化 Git 仓库并推送
cd D:\MyProject\MyPetShop3.0
git init
git add .
git commit -m "Initial commit for deployment"
git remote add origin <你的仓库地址>
git push -u origin main

# 2. 在服务器上克隆
cd /opt
sudo git clone <你的仓库地址> petshop
cd petshop/deployment
```

#### 方式 B: 使用 SCP

```bash
# 在本地 Windows PowerShell 中执行
scp -r D:\MyProject\MyPetShop3.0 root@your-server-ip:/opt/petshop
```

#### 方式 C: 使用 SFTP 工具

使用 FileZilla、WinSCP 等工具上传整个项目文件夹到服务器的 `/opt/petshop` 目录。

### 步骤 3: 构建后端 JAR 包

```bash
# 进入后端目录
cd /opt/petshop/backend

# 安装 Maven（如果尚未安装）
sudo apt install maven -y

# 构建 JAR 包
mvn clean package -DskipTests

# 验证构建成功
ls -lh target/*.jar
```

### 步骤 4: 配置环境变量

```bash
cd /opt/petshop/deployment

# 生成安全的 JWT 密钥
JWT_SECRET=$(openssl rand -base64 32)
echo "Generated JWT Secret: $JWT_SECRET"

# 复制环境变量模板
cp .env.example .env

# 编辑配置
nano .env
```

**环境变量配置示例：**

```bash
# MySQL 数据库配置
MYSQL_ROOT_PASSWORD=MyStr0ngRootP@ssw0rd2024
MYSQL_PASSWORD=MyStr0ngP@ssw0rd2024

# JWT 配置
JWT_SECRET=<上面生成的 JWT 密钥>
JWT_EXPIRATION=7200

# 服务器配置
SERVER_DOMAIN=http://123.45.67.89
```

保存并退出（`Ctrl+X`，然后 `Y`，最后 `Enter`）

### 步骤 5: 启动服务

```bash
cd /opt/petshop/deployment

# 构建并启动所有容器
sudo docker-compose up -d

# 查看容器状态
sudo docker-compose ps

# 查看实时日志
sudo docker-compose logs -f

# 等待约1-2分钟，直到所有服务状态为 "healthy"
```

**预期输出示例：**

```
NAME                  STATUS                     PORTS
petshop-mysql         Up (healthy)               0.0.0.0:3306->3306/tcp
petshop-backend       Up (healthy)               0.0.0.0:8080->8080/tcp
petshop-frontend      Up (healthy)               0.0.0.0:80->80/tcp
```

### 步骤 6: 验证部署

```bash
# 1. 检查前端
curl http://localhost/

# 2. 检查后端健康状态
curl http://localhost:8080/api/v1/actuator/health

# 3. 检查数据库连接
docker exec petshop-mysql mysql -u petshop -p${MYSQL_PASSWORD} -e "SHOW DATABASES;"
```

打开浏览器访问 `http://your-server-ip`，应该能看到登录页面。

---

## 配置说明

### docker-compose.yml 详解

| 服务 | 端口映射 | 说明 |
|------|---------|------|
| mysql | 3306:3306 | MySQL 数据库 |
| backend | 8080:8080 | Spring Boot 后端 |
| frontend | 80:80 | React 前端（Nginx） |

### 数据持久化

以下数据会持久化到 Docker 卷：

| 卷名 | 用途 |
|------|------|
| mysql-data | MySQL 数据库文件 |
| upload-data | 上传的图片文件 |
| nginx-logs | Nginx 访问和错误日志 |

### 环境变量说明

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| MYSQL_ROOT_PASSWORD | MySQL root 密码 | - |
| MYSQL_PASSWORD | 应用数据库用户密码 | - |
| JWT_SECRET | JWT 签名密钥 | - |
| JWT_EXPIRATION | JWT 过期时间（秒） | 7200 |
| SERVER_DOMAIN | 服务器域名/IP | - |

---

## 常用命令

### 服务管理

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 重启所有服务
docker-compose restart

# 重启单个服务
docker-compose restart backend

# 查看服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f [service_name]

# 查看资源使用情况
docker stats
```

### 更新部署

```bash
# 1. 拉取最新代码
cd /opt/petshop
git pull

# 2. 重新构建并启动
cd deployment
docker-compose down
docker-compose up -d --build

# 3. 清理未使用的镜像
docker image prune -f
```

### 数据库管理

```bash
# 进入 MySQL 容器
docker exec -it petshop-mysql bash

# 连接到 MySQL
mysql -u petshop -p

# 备份数据库
docker exec petshop-mysql mysqldump -u petshop -p pet_shop_3_0 > backup.sql

# 恢复数据库
docker exec -i petshop-mysql mysql -u petshop -p pet_shop_3_0 < backup.sql
```

### 查看日志

```bash
# 前端日志
docker logs petshop-frontend

# 后端日志
docker logs petshop-backend

# 数据库日志
docker logs petshop-mysql

# 实时跟踪日志
docker logs -f petshop-backend
```

---

## 故障排查

### 问题 1: 容器无法启动

**症状**：`docker-compose ps` 显示容器状态为 `Exited`

**解决方法**：

```bash
# 查看容器日志
docker-compose logs [service_name]

# 检查配置文件
docker-compose config

# 重新构建
docker-compose up -d --build
```

### 问题 2: 前端页面 404

**症状**：浏览器显示 404 Not Found

**解决方法**：

```bash
# 检查前端容器状态
docker ps | grep petshop-frontend

# 查看前端日志
docker logs petshop-frontend

# 检查 Nginx 配置
docker exec petshop-frontend cat /etc/nginx/conf.d/default.conf
```

### 问题 3: 后端 API 502

**症状**：前端页面能打开，但 API 请求失败

**解决方法**：

```bash
# 检查后端容器状态
docker ps | grep petshop-backend

# 查看后端日志
docker logs petshop-backend

# 检查数据库连接
docker exec petshop-backend ping mysql

# 进入后端容器排查
docker exec -it petshop-backend bash
```

### 问题 4: 数据库连接失败

**症状**：后端日志显示 `Cannot create PoolableConnectionFactory`

**解决方法**：

```bash
# 等待数据库完全启动（约30秒）
docker-compose ps

# 检查数据库日志
docker logs petshop-mysql

# 手动测试数据库连接
docker exec -it petshop-mysql mysql -u petshop -p
```

### 问题 5: 端口被占用

**症状**：`Error starting userland proxy`

**解决方法**：

```bash
# 查看端口占用
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :8080

# 停止占用端口的服务
sudo systemctl stop nginx  # 如果系统已安装 Nginx

# 或修改 docker-compose.yml 中的端口映射
```

### 问题 6: 磁盘空间不足

**症状**：`No space left on device`

**解决方法**：

```bash
# 清理 Docker 未使用的资源
docker system prune -a --volumes

# 查看磁盘使用情况
df -h

# 查看 Docker 占用
docker system df
```

---

## 安全建议

### 1. 修改默认密码

首次登录后立即修改管理员密码：
- 用户名：`admin`
- 默认密码：`admin123`
- 新密码：使用强密码（至少12位，包含大小写字母、数字、特殊字符）

### 2. 保护 .env 文件

```bash
# 设置文件权限
chmod 600 .env

# 确保 .env 不会被提交到 Git
echo ".env" >> .gitignore
```

### 3. 启用 HTTPS（可选但推荐）

如果有域名，可以使用 Let's Encrypt 免费证书：

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取证书
sudo certbot --nginx -d yourdomain.com

# 自动续期
sudo certbot renew --dry-run
```

### 4. 定期备份数据

创建定时备份任务（见下一节）。

### 5. 监控服务状态

使用云服务商提供的监控工具设置告警：
- CPU 使用率 > 80%
- 内存使用率 > 85%
- 磁盘空间 < 20%
- 容器退出

---

## 备份与恢复

### 自动备份脚本

创建备份脚本 `/opt/petshop/backup.sh`：

```bash
#!/bin/bash

# 备份目录
BACKUP_DIR="/opt/petshop/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
echo "Backing up database..."
docker exec petshop-mysql mysqldump \
  -u petshop \
  -p${MYSQL_PASSWORD} \
  pet_shop_3_0 > $BACKUP_DIR/database_$DATE.sql

# 备份上传文件
echo "Backing up uploaded files..."
docker run --rm \
  -v petshop_upload-data:/data \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/uploads_$DATE.tar.gz -C /data .

# 删除30天前的备份
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: $DATE"
```

设置权限：

```bash
chmod +x /opt/petshop/backup.sh
```

### 设置定时任务

```bash
# 编辑 crontab
crontab -e

# 添加以下行（每天凌晨2点备份）
0 2 * * * /opt/petshop/backup.sh >> /opt/petshop/backup.log 2>&1
```

### 恢复数据

```bash
# 恢复数据库
docker exec -i petshop-mysql mysql \
  -u petshop \
  -p${MYSQL_PASSWORD} \
  pet_shop_3_0 < /path/to/backup/database_20240115_020000.sql

# 恢复上传文件
docker run --rm \
  -v petshop_upload-data:/data \
  -v /opt/petshop/backups:/backup \
  alpine tar xzf /backup/uploads_20240115_020000.tar.gz -C /data
```

---

## 性能优化

### MySQL 优化

已在 `my.cnf` 中配置优化参数，可根据实际使用情况调整：

```bash
# 编辑配置
nano deployment/my.cnf

# 重启数据库服务
docker-compose restart mysql
```

### Nginx 优化

已在 `nginx.conf` 中启用 Gzip 压缩和缓存，可根据需要调整缓存时间。

### Docker 资源限制

在 `docker-compose.yml` 中可以添加资源限制：

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

---

## 升级配置

### 添加域名

1. 购买域名并配置 DNS 解析
2. 修改 `.env` 文件：
   ```bash
   SERVER_DOMAIN=http://yourdomain.com
   ```
3. 重新部署：
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

### 启用 HTTPS

参考上文"安全建议"部分。

### 扩容服务

如果用户量增加，可以：
1. 升级云服务器配置（4核8G）
2. 使用负载均衡（Nginx + 多个后端实例）
3. 使用外部数据库服务（阿里云 RDS）
4. 使用对象存储服务（阿里云 OSS）存储上传文件

---

## 监控与日志

### 查看实时日志

```bash
# 所有服务日志
docker-compose logs -f

# 单个服务日志
docker-compose logs -f backend
```

### 日志文件位置

| 服务 | 日志位置 |
|------|---------|
| 前端 | Docker volume: nginx-logs |
| 后端 | 容器内：/app/logs/ |
| 数据库 | 容器内：/var/log/mysql/ |

### 导出日志

```bash
# 导出所有日志
docker-compose logs > deployment.log

# 导出最近100行日志
docker-compose logs --tail=100 > recent.log
```

---

## 卸载

### 完全卸载

```bash
cd /opt/petshop/deployment

# 停止并删除所有容器、网络、卷
docker-compose down -v

# 删除项目文件
cd ../..
sudo rm -rf /opt/petshop

# 删除 Docker 镜像
docker rmi $(docker images 'petshop*' -q)
```

---

## 常见问题 FAQ

### Q: 如何修改登录密码？
A: 登录系统后，进入"用户管理"页面，找到 admin 用户并修改密码。

### Q: 忘记管理员密码怎么办？
A: 使用以下命令重置密码为 `admin123`：
```bash
docker exec -it petshop-mysql mysql -u petshop -p
use pet_shop_3_0;
UPDATE users SET password='$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi' WHERE username='admin';
exit;
```

### Q: 如何查看数据库数据？
A: 使用 MySQL 客户端工具或命令：
```bash
docker exec -it petshop-mysql mysql -u petshop -p
use pet_shop_3_0;
SHOW TABLES;
SELECT * FROM users;
```

### Q: 上传的文件存在哪里？
A: 文件存储在 Docker volume `upload-data` 中，挂载到容器的 `/app/uploads/images` 目录。

### Q: 可以修改端口吗？
A: 可以，修改 `docker-compose.yml` 中的端口映射，例如：
```yaml
services:
  frontend:
    ports:
      - "8080:80"  # 将外部端口改为 8080
```

---

## 技术支持

如遇到问题，请按以下顺序排查：

1. 查看本文档的"故障排查"部分
2. 查看容器日志：`docker-compose logs -f`
3. 搜索错误信息
4. 提交 Issue 到项目仓库

---

## 许可证

本项目仅供学习和个人使用。

---

**祝你部署顺利！🎉**
