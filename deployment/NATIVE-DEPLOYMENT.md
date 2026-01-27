# 宠物店管理系统 - 原生部署指南

## 📋 部署方案说明

本部署方案采用**原生部署**方式，与 Docker 容器化部署相比有以下优势：

### ✅ 优势

- **配置更简单**：不需要复杂的 Docker 网络配置
- **调试更容易**：直接访问文件系统和日志
- **性能更好**：减少一层容器抽象
- **资源占用少**：不需要为前后端创建容器
- **更可靠**：避免了 Docker 环境变量映射问题

### 🏗️ 架构说明

```
┌─────────────────────────────────────────────────┐
│              云服务器（Ubuntu/CentOS）           │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────┐      ┌──────────────┐        │
│  │  Nginx (80)  │─────▶│ Frontend     │        │
│  │              │      │ (静态文件)    │        │
│  └──────────────┘      └──────────────┘        │
│         │                                       │
│         │ /api/v1                               │
│         ▼                                       │
│  ┌──────────────────┐                           │
│  │ Backend (8080)   │◀──── Systemd 服务        │
│  │ Spring Boot JAR  │                           │
│  └──────────────────┘                           │
│         │                                       │
│         │ localhost:3306                        │
│         ▼                                       │
│  ┌──────────────────┐                           │
│  │ MySQL (3306)     │◀──── Docker 容器          │
│  └──────────────────┘                           │
│                                                  │
└─────────────────────────────────────────────────┘
```

## 🚀 快速开始

### 前置要求

- 云服务器（Ubuntu 20.04+ 或 CentOS 7+）
- 至少 2GB RAM
- 至少 20GB 磁盘空间
- Root 或 sudo 权限

### 一键部署

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd MyPetShop3.0/deployment

# 2. 赋予执行权限
chmod +x native-deploy.sh

# 3. 运行部署脚本
sudo ./native-deploy.sh
```

### 部署流程

脚本会自动完成以下步骤：

1. ✅ 检查系统环境
2. ✅ 安装依赖软件（Docker, JDK 17, Node.js, Maven, Nginx）
3. ✅ 生成安全密钥
4. ✅ 创建应用目录
5. ✅ 启动 MySQL 容器
6. ✅ 构建后端 JAR 包
7. ✅ 配置后端 Systemd 服务
8. ✅ 构建前端静态文件
9. ✅ 配置 Nginx 反向代理
10. ✅ 启动所有服务

## 📁 文件结构

部署后的文件结构：

```
/var/www/petshop/
├── backend/
│   └── pet-shop-backend.jar          # 后端 JAR 包
├── frontend/
│   ├── index.html
│   ├── assets/
│   └── ...                            # 前端静态文件
├── uploads/
│   └── images/                        # 上传的图片文件
└── logs/
    ├── backend.log                    # 后端日志
    ├── backend-error.log              # 后端错误日志
    └── backend-spring.log             # Spring Boot 日志

/etc/systemd/system/
└── petshop-backend.service            # 后端服务配置

/etc/nginx/sites-available/
└── petshop                            # Nginx 配置

```

## 🔧 配置说明

### 环境变量

部署脚本会生成 `.env` 文件，包含以下配置：

```bash
# MySQL 密码
MYSQL_ROOT_PASSWORD=<随机生成的密码>
MYSQL_PASSWORD=<随机生成的密码>

# JWT 密钥
JWT_SECRET=<随机生成的密钥>

# 服务器地址
SERVER_DOMAIN=http://your-server-ip
SERVER_IP=your-server-ip

# 文件上传目录
FILE_UPLOAD_DIR=/var/www/petshop/uploads
```

**重要**：请妥善保存 `.env.backup` 文件！

### Nginx 配置

Nginx 提供以下功能：

1. **前端静态文件**：直接从 `/var/www/petshop/frontend` 提供静态文件
2. **API 反向代理**：将 `/api/v1/*` 请求转发到 `http://127.0.0.1:8080`
3. **图片文件服务**：直接从 `/var/www/petshop/uploads` 提供上传的图片

### Systemd 服务

后端通过 Systemd 管理，具有以下特性：

- **自动重启**：服务崩溃后自动重启
- **开机自启**：系统重启后自动启动
- **日志管理**：标准输出和错误输出分别记录到文件

## 🔍 验证部署

### 检查服务状态

```bash
# 检查后端服务
systemctl status petshop-backend

# 检查 Nginx
systemctl status nginx

# 检查 MySQL 容器
docker ps | grep petshop-mysql
```

### 检查日志

```bash
# 实时查看后端日志
journalctl -u petshop-backend -f

# 查看后端文件日志
tail -f /var/www/petshop/logs/backend.log

# 查看 Nginx 日志
tail -f /var/log/nginx/petshop-access.log
```

### 访问测试

1. **前端访问**：`http://your-server-ip`
2. **后端健康检查**：`http://your-server-ip/api/v1/health`
3. **登录测试**：
   - 用户名：`admin`
   - 密码：`admin123`

## 🛠️ 常用命令

### 服务管理

```bash
# 重启后端
sudo systemctl restart petshop-backend

# 重启 Nginx
sudo systemctl restart nginx

# 重启 MySQL
docker restart petshop-mysql

# 重启所有服务
sudo systemctl restart petshop-backend nginx
docker restart petshop-mysql
```

### 日志查看

```bash
# 查看后端日志（最近 100 行）
sudo journalctl -u petshop-backend -n 100

# 查看后端错误日志
sudo tail -f /var/www/petshop/logs/backend-error.log

# 查看 Nginx 访问日志
sudo tail -f /var/log/nginx/petshop-access.log

# 查看 MySQL 日志
docker logs petshop-mysql -f
```

### 数据库操作

```bash
# 进入 MySQL 命令行
docker exec -it petshop-mysql mysql -u petshop -p pet_shop_3_0

# 备份数据库
docker exec petshop-mysql mysqldump -u petshop -p pet_shop_3_0 > backup.sql

# 恢复数据库
docker exec -i petshop-mysql mysql -u petshop -p pet_shop_3_0 < backup.sql
```

### 更新应用

```bash
# 1. 拉取最新代码
cd /path/to/MyPetShop3.0
git pull

# 2. 重新构建后端
cd backend
mvn clean package -DskipTests
cp target/pet-shop-backend-*.jar /var/www/petshop/backend/pet-shop-backend.jar

# 3. 重新构建前端
cd ../frontend
npm install
npm run build
cp -r dist/* /var/www/petshop/frontend/

# 4. 重启服务
sudo systemctl restart petshop-backend
sudo systemctl reload nginx
```

## 🔐 安全建议

### 1. 修改默认密码

首次登录后立即修改管理员密码！

### 2. 配置防火墙

```bash
# 只允许必要的端口
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### 3. 配置 HTTPS（推荐）

使用 Let's Encrypt 免费证书：

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

### 4. 数据库安全

- MySQL 容器使用随机生成的强密码
- 只监听本地 127.0.0.1，不对外暴露
- 定期备份数据

### 5. 定期更新

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 更新 Docker
sudo apt install docker-ce docker-ce-cli containerd.io
```

## 📊 性能优化

### JVM 参数优化

编辑 `/etc/systemd/system/petshop-backend.service`，修改 `ExecStart`：

```bash
ExecStart=/usr/bin/java \
  -Xms512m \
  -Xmx1024m \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=200 \
  -jar /var/www/petshop/backend/pet-shop-backend.jar
```

### Nginx 缓存优化

已在 `nginx-native.conf` 中配置：
- 前端静态文件缓存 7 天
- 图片文件缓存 30 天

### MySQL 优化

编辑 MySQL 配置（如需要）：

```bash
docker exec -it petshop-mysql bash
vi /etc/mysql/conf.d/custom.cnf
```

## 🐛 故障排查

### 问题 1：后端无法启动

```bash
# 查看详细日志
sudo journalctl -u petshop-backend -n 50 --no-pager

# 检查端口占用
sudo netstat -tlnp | grep 8080

# 检查 Java 版本
java -version
```

### 问题 2：图片无法显示

```bash
# 检查上传目录权限
ls -la /var/www/petshop/uploads/

# 修复权限
sudo chmod -R 755 /var/www/petshop/uploads/

# 检查 Nginx 配置
sudo nginx -t
```

### 问题 3：数据库连接失败

```bash
# 检查 MySQL 容器状态
docker ps -a | grep petshop-mysql

# 查看 MySQL 日志
docker logs petshop-mysql

# 测试连接
docker exec petshop-mysql mysql -u petshop -p
```

### 问题 4：前端 404

```bash
# 检查 Nginx 配置
sudo nginx -t

# 检查前端文件
ls -la /var/www/petshop/frontend/

# 重新构建前端
cd /path/to/frontend
npm run build
sudo cp -r dist/* /var/www/petshop/frontend/
```

## 📞 支持

如有问题，请查看：

1. **日志文件**：`/var/www/petshop/logs/`
2. **系统日志**：`journalctl -u petshop-backend`
3. **项目 Issues**：[GitHub Issues](https://github.com/your-repo/issues)

## 📝 更新日志

### v1.0.0 (2025-01-27)

- ✅ 初始版本
- ✅ 支持原生部署
- ✅ 修复图片上传问题
- ✅ 添加 systemd 服务管理
- ✅ 添加 Nginx 反向代理
- ✅ 添加 MySQL Docker 容器
