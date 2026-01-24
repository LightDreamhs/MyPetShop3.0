# 方式1：自动化部署完整指南

> 使用 `deploy.sh` 脚本一键部署宠物店管理系统到云服务器

## 📋 目录

- [部署特点](#部署特点)
- [自动化脚本做什么](#自动化脚本做什么)
- [部署前准备](#部署前准备)
- [详细部署步骤](#详细部署步骤)
- [重要注意事项](#重要注意事项)
- [部署后验证](#部署后验证)
- [故障排查](#故障排查)
- [常见问题](#常见问题)

---

## 部署特点

### ✅ 优点

| 特性 | 说明 |
|------|------|
| **完全自动化** | 一条命令完成所有操作 |
| **零配置修改** | 不需要手动编辑任何配置文件 |
| **自动生成密码** | 使用强随机密码，安全性高 |
| **自动环境检测** | 检查系统、安装依赖、配置防火墙 |
| **密码备份文件** | 自动生成 `.env.backup` 保存所有凭据 |
| **智能验证** | 自动验证服务启动状态 |

### ⚠️ 适用场景

- ✅ 首次部署的新手用户
- ✅ 快速测试和演示
- ✅ 标准的 Ubuntu/CentOS 服务器
- ✅ 需要快速上线的生产环境

### ❌ 不适用场景

- ❌ 已有自定义配置的环境
- ❌ 需要特殊网络配置的情况
- ❌ Windows 服务器（使用 deploy.bat）
- ❌ 需要多环境部署（开发/测试/生产）

---

## 自动化脚本做什么

### 📝 执行流程

```
1. 检查系统兼容性
   ├─ 检测操作系统类型
   ├─ 检查系统架构（x86_64）
   └─ 验证是否为 root 用户

2. 安装必要软件
   ├─ 安装 Docker
   ├─ 安装 Docker Compose
   ├─ 安装 Maven（用于构建后端）
   └─ 启动并启用 Docker 服务

3. 配置防火墙
   ├─ 开放 SSH 端口 (22)
   ├─ 开放 HTTP 端口 (80)
   ├─ 开放 HTTPS 端口 (443)
   └─ 启用 UFW 防火墙

4. 生成安全配置
   ├─ 生成 16 位 MySQL root 密码
   ├─ 生成 16 位 MySQL 应用密码
   ├─ 生成 32 位 JWT 密钥
   ├─ 自动获取服务器 IP 地址
   ├─ 创建 .env 配置文件
   └─ 创建 .env.backup 密码备份文件

5. 构建应用
   ├─ 进入后端目录
   ├─ 下载 Maven 依赖
   ├─ 编译并打包 JAR 文件
   └─ 验证构建成功

6. 启动服务
   ├─ 停止旧容器（如果存在）
   ├─ 构建新镜像
   ├─ 启动所有容器
   ├─ 等待健康检查通过
   └─ 验证服务状态

7. 显示部署信息
   ├─ 显示访问地址
   ├─ 显示默认登录账号
   ├─ 提示保存密码文件
   └─ 显示常用管理命令
```

### 🔐 自动生成的配置

**.env 文件示例：**
```bash
# MySQL 数据库配置
MYSQL_ROOT_PASSWORD=aB3xK9mP2fL8qW4t
MYSQL_PASSWORD=cX7jN5vP3mK9hR2s

# JWT 配置
JWT_SECRET=yE8tR6wQ4sA2fD7gB9nC3vM5xL8zK1pQ4sW6rY9uT2
JWT_EXPIRATION=7200

# 服务器配置
SERVER_DOMAIN=http://123.45.67.89

# 文件上传配置
FILE_UPLOAD_DIR=/app/uploads/images
MAX_FILE_SIZE=5

# 应用配置
SPRING_PROFILES_ACTIVE=production
TZ=Asia/Shanghai
```

---

## 部署前准备

### 1. 购买云服务器

**推荐配置：**

| 配置项 | 推荐值 | 说明 |
|--------|--------|------|
| **CPU** | 2核 | 5人以内完全够用 |
| **内存** | 2GB | 系统已优化，2G足够 |
| **存储** | 40-60GB SSD | 系统、数据库、上传文件 |
| **带宽** | 3-5Mbps | 10人以内完全够用 |
| **操作系统** | Ubuntu 22.04 LTS | 推荐，兼容性最好 |

**💡 性能参考：**
- 2核2G可支持：每天100单、5-10人同时在线
- 查看详细性能分析：`2G-SERVER-GUIDE.md`

**云服务商推荐（按性价比排序）：**

1. **阿里云轻量应用服务器** ⭐ 推荐
   - 配置：2核2G 或 2核4G
   - 价格：2核2G约60-100元/年，2核4G约100-150元/年
   - 优势：不限流量、200M 峰值带宽
   - 链接：https://www.aliyun.com/product/swas

2. **腾讯云轻量应用服务器**
   - 配置：2核2G、2核4G 或 2核8G
   - 价格：2核2G约50-100元/年，2核4G约120-200元/年
   - 注意：限制 300GB 月流量
   - 链接：https://cloud.tencent.com/product/lighthouse

### 2. 配置安全组规则

**在云服务器控制台配置以下入站规则：**

| 协议 | 端口 | 来源 | 说明 |
|------|------|------|------|
| TCP | 22 | 0.0.0.0/0 | SSH 远程连接 |
| TCP | 80 | 0.0.0.0/0 | HTTP 访问网站 |
| TCP | 443 | 0.0.0.0/0 | HTTPS（可选） |

⚠️ **重要：不要开放 3306 端口（MySQL）到公网！**

### 3. 准备本地工具

| 工具 | 用途 | 下载链接 |
|------|------|---------|
| **SSH 客户端** | 远程连接服务器 | Windows: PowerShell / PuTTY |
| **SCP 工具** | 上传文件到服务器 | WinSCP / FileZilla / PowerShell |
| **文本编辑器** | 查看密码文件 | VS Code / Notepad++ |

### 4. 获取服务器信息

部署前准备好以下信息：

- ✅ 服务器公网 IP 地址
- ✅ SSH 用户名（通常是 `root`）
- ✅ SSH 密码或 SSH 密钥文件
- ✅ 服务器登录命令：`ssh root@your-server-ip`

---

## 详细部署步骤

### 步骤 1：上传代码到服务器

**方式 A：使用 SCP（推荐，适合小项目）**

```bash
# 在本地 Windows PowerShell 中执行
scp -r D:\MyProject\MyPetShop3.0 root@your-server-ip:/opt/petshop
```

**方式 B：使用 Git（推荐，适合大项目）**

```bash
# 1. 在本地初始化 Git 仓库并推送
cd D:\MyProject\MyPetShop3.0
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/MyPetShop3.0.git
git push -u origin main

# 2. 在服务器上克隆（稍后执行）
ssh root@your-server-ip
cd /opt
git clone https://github.com/yourusername/MyPetShop3.0.git petshop
```

**方式 C：使用 SFTP 工具（图形化界面）**

1. 打开 WinSCP 或 FileZilla
2. 连接到服务器（SFTP 协议）
3. 拖拽 `MyPetShop3.0` 文件夹到 `/opt/petshop` 目录

---

### 步骤 2：SSH 登录服务器

```bash
# Windows PowerShell 或 CMD
ssh root@your-server-ip

# 输入密码（购买时设置的密码）
```

**登录成功后的提示：**
```
Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-76-generic x86_64)

root@your-server:~#
```

---

### 步骤 3：进入部署目录

```bash
cd /opt/petshop/deployment

# 确认文件存在
ls -la
```

**预期输出：**
```
-rw-r--r-- 1 root root   3680 Jan 24 04:26 deploy.sh
-rw-r--r-- 1 root root    248 Jan 24 04:26 .env.example
-rw-r--r-- 1 root root   1183 Jan 24 04:26 docker-compose.yml
...（其他文件）
```

---

### 步骤 4：赋予执行权限并运行脚本

```bash
# 赋予执行权限
chmod +x deploy.sh

# 执行部署脚本
./deploy.sh
```

---

### 步骤 5：等待脚本自动执行

脚本会显示详细的执行过程：

```
=========================================
Pet Shop Management System - One-Click Deployment
=========================================

[INFO] Checking system compatibility...
[INFO] Detected OS: ubuntu
[INFO] Checking Docker installation...
[INFO] Docker is already installed: 24.0.7
[INFO] Docker Compose is already installed: v2.23.0
[INFO] Checking Maven installation...
[INFO] Maven is already installed: 3.8.6
[INFO] Configuring firewall...
[INFO] Firewall rules added
[INFO] Generating security keys...
[INFO] Created .env file
[WARN] ========================================
[WARN] IMPORTANT: Save .env.backup file!
[WARN] ========================================
[INFO] Building backend JAR package...
[INFO] Backend build successful
[INFO] Starting Docker services...
[INFO] Waiting for services to start...
[INFO] Checking service status...

NAME                  STATUS                   PORTS
petshop-mysql         Up (healthy)             0.0.0.0:3306->3306/tcp
petshop-backend       Up (healthy)             0.0.0.0:8080->8080/tcp
petshop-frontend      Up (healthy)             0.0.0.0:80->80/tcp

[INFO] All services are ready!
[INFO] ========================================
[INFO] Deployment completed!
[INFO] ========================================
```

⏱️ **预计耗时**：5-10 分钟（取决于服务器性能）

---

### 步骤 6：保存密码信息（非常重要！）

**部署完成后，立即查看并保存密码：**

```bash
# 方式1：查看密码文件内容
cat .env.backup

# 方式2：下载到本地（推荐）
# 在本地 PowerShell 新开一个窗口执行
scp root@your-server-ip:/opt/petshop/deployment/.env.backup D:\Downloads\
```

**密码文件内容示例：**

```
# ==========================================
# IMPORTANT INFORMATION - KEEP SAFE!
# ==========================================

# Generated: 2026-01-24 12:34:56
# Server IP: 123.45.67.89

# MySQL root password
MYSQL_ROOT_PASSWORD=aB3xK9mP2fL8qW4t

# MySQL application password
MYSQL_PASSWORD=cX7jN5vP3mK9hR2s

# JWT secret
JWT_SECRET=yE8tR6wQ4sA2fD7gB9nC3vM5xL8zK1pQ4sW6rY9uT2

# Admin login
Username: admin
Password: admin123

# System URL
http://123.45.67.89

# Please save this file in a secure location!
```

⚠️ **重要提示：**
1. 截图保存或复制到安全的地方
2. 不要分享给任何人
3. 丢失后无法恢复（但可以重置）

---

### 步骤 7：验证部署成功

**1. 检查容器状态**

```bash
docker compose ps
```

**预期输出（所有服务都应该是 "Up (healthy)"）：**

```
NAME                  STATUS                   PORTS
petshop-mysql         Up (healthy)             0.0.0.0:3306->3306/tcp
petshop-backend       Up (healthy)             0.0.0.0:8080->8080/tcp
petshop-frontend      Up (healthy)             0.0.0.0:80->80/tcp
```

**2. 测试前端访问**

```bash
curl -I http://localhost
```

**预期输出：**
```
HTTP/1.1 200 OK
Server: nginx
Content-Type: text/html
```

**3. 测试后端 API**

```bash
curl http://localhost:8080/api/v1/actuator/health
```

**预期输出：**
```
{"status":"UP"}
```

**4. 浏览器访问**

打开浏览器，访问：`http://your-server-ip`

应该能看到登录页面。

---

### 步骤 8：首次登录并修改密码

1. **使用默认账号登录**
   - 用户名：`admin`
   - 密码：`admin123`

2. **立即修改密码**
   - 登录后进入"用户管理"页面
   - 找到 admin 用户
   - 点击"编辑"修改密码

3. **建议设置强密码**
   - 至少 12 位
   - 包含大小写字母、数字、特殊字符
   - 例如：`MyP@ssw0rd2024!`

---

## 重要注意事项

### ⚠️ 部署前必读

1. **确保服务器有足够空间**
   ```bash
   df -h
   # 至少要有 10GB 可用空间
   ```

2. **确保网络通畅**
   ```bash
   ping -c 4 google.com
   ```

3. **确保没有端口冲突**
   ```bash
   # 检查 80、8080、3306 端口是否被占用
   sudo netstat -tulpn | grep -E ':(80|8080|3306) '
   ```

4. **确保已配置云服务商安全组**
   - 开放 22、80、443 端口
   - 不要开放 3306 端口

### ⚠️ 部署中必读

1. **不要中断脚本执行**
   - 脚本运行时不要关闭终端
   - 等待看到 "Deployment completed!" 消息

2. **留意错误信息**
   - 如果出现红色 ERROR，记下错误信息
   - 查看"故障排查"章节

3. **确保下载依赖成功**
   - Maven 下载依赖可能需要几分钟
   - 如果网络慢，可能需要重试

### ⚠️ 部署后必读

1. **立即保存密码文件**
   - 这是唯一能找回密码的机会
   - 建议截图保存在手机相册

2. **立即修改管理员密码**
   - 默认密码 admin123 是公开的
   - 不修改会被攻击者利用

3. **配置数据备份**
   - 查看 README.md 的"备份与恢复"章节
   - 设置定时自动备份

4. **配置监控告警**
   - 在云服务商控制台设置告警规则
   - CPU > 80%、内存 > 85%、磁盘 < 20%

### ⚠️ 安全建议

1. **定期更新系统**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **定期检查日志**
   ```bash
   docker compose logs -f
   ```

3. **限制 SSH 访问**
   - 修改 SSH 端口（默认 22）
   - 禁用密码登录，只允许密钥登录
   - 限制可登录用户

4. **启用 HTTPS（如果有域名）**
   - 使用 Let's Encrypt 免费证书
   - 参考 README.md 的"启用 HTTPS"章节

---

## 部署后验证

### ✅ 完整验证清单

部署完成后，逐项检查：

- [ ] **容器状态**：所有服务都是 "Up (healthy)"
  ```bash
  docker compose ps
  ```

- [ ] **前端访问**：浏览器能打开登录页面
  ```
  http://your-server-ip
  ```

- [ ] **后端 API**：健康检查接口返回正常
  ```bash
  curl http://localhost:8080/api/v1/actuator/health
  ```

- [ ] **数据库连接**：能连接到 MySQL
  ```bash
  docker exec -it petshop-mysql mysql -u petshop -p
  # 输入密码（见 .env.backup）
  ```

- [ ] **文件上传**：能成功上传图片
  - 登录系统后，尝试添加商品并上传图片

- [ ] **密码已保存**：.env.backup 文件已下载到本地

- [ ] **管理员密码已修改**：不再是 admin123

- [ ] **防火墙已启用**：UFW 状态为 active
  ```bash
  sudo ufw status
  ```

### 🔍 详细健康检查

```bash
# 执行完整健康检查脚本
cat > health-check.sh << 'EOF'
#!/bin/bash

echo "=== 宠物店管理系统健康检查 ==="

# 1. 检查容器状态
echo -e "\n1. 容器状态："
docker compose ps

# 2. 检查磁盘空间
echo -e "\n2. 磁盘空间："
df -h | grep -E 'Filesystem|/dev/sda'

# 3. 检查内存使用
echo -e "\n3. 内存使用："
free -h

# 4. 检查前端
echo -e "\n4. 前端访问测试："
curl -s -o /dev/null -w "HTTP状态码: %{http_code}\n" http://localhost

# 5. 检查后端
echo -e "\n5. 后端API测试："
curl -s http://localhost:8080/api/v1/actuator/health

# 6. 检查数据库
echo -e "\n6. 数据库连接测试："
docker exec petshop-mysql mysqladmin ping -h localhost -u petshop -p${MYSQL_PASSWORD} 2>&1 | grep -q "mysqld is alive" && echo "✅ 数据库正常" || echo "❌ 数据库异常"

# 7. 检查防火墙
echo -e "\n7. 防火墙状态："
sudo ufw status | grep -q "Status: active" && echo "✅ 防火墙已启用" || echo "⚠️ 防火墙未启用"

echo -e "\n=== 检查完成 ==="
EOF

chmod +x health-check.sh
./health-check.sh
```

---

## 故障排查

### 问题 1：脚本执行失败 - Permission denied

**症状：**
```
bash: ./deploy.sh: Permission denied
```

**解决方案：**
```bash
# 赋予执行权限
chmod +x deploy.sh

# 重新执行
./deploy.sh
```

---

### 问题 2：Docker 安装失败

**症状：**
```
[ERROR] Docker installation failed
```

**解决方案：**

**手动安装 Docker：**
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com | bash -s docker

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
```

---

### 问题 3：容器启动失败 - Port already allocated

**症状：**
```
Error: failed to start service "frontend": listen tcp 0.0.0.0:80: bind: address already in use
```

**解决方案：**

```bash
# 1. 检查端口占用
sudo netstat -tulpn | grep :80

# 2. 停止占用端口的服务
sudo systemctl stop nginx  # 如果系统已安装 Nginx

# 3. 重新启动服务
cd /opt/petshop/deployment
docker compose up -d
```

---

### 问题 4：数据库连接失败

**症状：**
```
Backend logs: Cannot create PoolableConnectionFactory
```

**解决方案：**

```bash
# 1. 检查 MySQL 容器状态
docker compose logs mysql

# 2. 等待 MySQL 完全启动
docker compose ps
# 等待 STATUS 变为 "Up (healthy)"，可能需要 30-60 秒

# 3. 手动测试连接
docker exec -it petshop-mysql mysql -u petshop -p
# 输入密码（见 .env.backup）

# 4. 如果还是失败，重启后端
docker compose restart backend
```

---

### 问题 5：前端页面 404 或 502

**症状：**
- 浏览器显示 "404 Not Found"
- 或 "502 Bad Gateway"

**解决方案：**

```bash
# 1. 检查所有容器状态
docker compose ps

# 2. 查看前端日志
docker compose logs frontend

# 3. 查看后端日志
docker compose logs backend

# 4. 检查 Nginx 配置
docker exec petshop-frontend cat /etc/nginx/conf.d/default.conf

# 5. 重启服务
docker compose restart frontend backend
```

---

### 问题 6：忘记保存密码文件

**症状：**
- 删除了 .env.backup 文件
- 不记得 MySQL 密码

**解决方案：**

**方式 1：查看 .env 文件**
```bash
cat .env
```

**方式 2：重置管理员密码**
```bash
# 进入 MySQL 容器
docker exec -it petshop-mysql mysql -u petshop -p
# 输入密码（见 .env）

# 重置密码
USE pet_shop_3_0;
UPDATE users SET password='$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi' WHERE username='admin';
exit;
```

现在密码重置为 `admin123`，登录后立即修改。

---

### 问题 7：磁盘空间不足

**症状：**
```
Error: No space left on device
```

**解决方案：**

```bash
# 1. 检查磁盘使用
df -h

# 2. 清理 Docker 未使用的资源
docker system prune -a --volumes

# 3. 清理系统日志
sudo journalctl --vacuum-time=3d

# 4. 清理 Apt 缓存
sudo apt clean
sudo apt autoclean
```

---

## 常见问题

### Q1: 部署脚本需要多长时间？

**A:** 通常 5-10 分钟，取决于：
- 服务器性能（2核2G 约 8 分钟，2核4G 约 5 分钟）
- 网络速度（下载 Maven 依赖）
- 是否已安装 Docker、Maven

如果超过 15 分钟，可能有问题，检查脚本输出。

---

### Q2: 可以重复执行部署脚本吗？

**A:** 可以，但要注意：

1. **如果 .env 已存在**
   - 脚本会跳过密码生成
   - 重新构建并启动服务

2. **如果想重新生成密码**
   ```bash
   # 删除旧配置
   rm .env .env.backup

   # 重新部署
   ./deploy.sh
   ```

3. **如果只想重启服务**
   ```bash
   docker compose restart
   ```

---

### Q3: 如何更新代码？

**A:** 分两种情况：

**如果使用 Git 部署：**
```bash
cd /opt/petshop
git pull

cd deployment
docker compose down
docker compose up -d --build
```

**如果使用 SCP 上传：**
```bash
# 1. 本地修改代码后重新上传
scp -r D:\MyProject\MyPetShop3.0 root@your-server-ip:/opt/petshop

# 2. SSH 登录服务器
ssh root@your-server-ip
cd /opt/petshop/deployment

# 3. 重新部署
docker compose down
docker compose up -d --build
```

---

### Q4: 如何备份数据？

**A:** 创建定时备份任务：

```bash
# 创建备份脚本
cat > /opt/petshop/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/petshop/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# 备份数据库
docker exec petshop-mysql mysqldump -u petshop -p${MYSQL_PASSWORD} pet_shop_3_0 > $BACKUP_DIR/database_$DATE.sql

# 备份上传文件
docker run --rm -v petshop_upload-data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/uploads_$DATE.tar.gz -C /data .

# 删除30天前的备份
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /opt/petshop/backup.sh

# 设置每天凌晨2点自动备份
crontab -e
# 添加：0 2 * * * /opt/petshop/backup.sh >> /opt/petshop/backup.log 2>&1
```

---

### Q5: 如何查看服务日志？

**A:**

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

---

### Q6: 如何停止和删除所有服务？

**A:**

```bash
cd /opt/petshop/deployment

# 停止服务（保留数据）
docker compose stop

# 停止并删除容器（保留数据）
docker compose down

# 停止并删除容器、网络、卷（⚠️ 会删除所有数据）
docker compose down -v
```

---

### Q7: 可以修改端口吗？

**A:** 可以，但不推荐新手操作。

如果必须修改，编辑 `docker-compose.yml`：

```yaml
services:
  frontend:
    ports:
      - "8080:80"  # 将外部端口改为 8080

  backend:
    ports:
      - "9000:8080"  # 将外部端口改为 9000
```

然后重新部署：
```bash
docker compose down
docker compose up -d
```

访问地址变为：`http://your-server-ip:8080`

---

### Q8: 如何配置域名？

**A:**

1. **购买域名并配置 DNS**
   - 在域名注册商处添加 A 记录
   - 指向服务器 IP：`123.45.67.89`

2. **修改 .env 文件**
   ```bash
   nano .env
   # 修改：SERVER_DOMAIN=http://yourdomain.com
   ```

3. **重新部署**
   ```bash
   docker compose down
   docker compose up -d
   ```

4. **访问**
   ```
   http://yourdomain.com
   ```

---

### Q9: 如何启用 HTTPS？

**A:** 参考 `README.md` 的"启用 HTTPS"章节，简要步骤：

```bash
# 1. 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 2. 获取证书
sudo certbot --nginx -d yourdomain.com

# 3. 自动续期
sudo certbot renew --dry-run
```

---

### Q10: 部署失败怎么办？

**A:** 按以下顺序排查：

1. **查看错误信息**
   - 脚本输出的红色 ERROR
   - 使用手机拍照保存

2. **查看容器日志**
   ```bash
   docker compose logs -f
   ```

3. **检查系统状态**
   ```bash
   # 磁盘空间
   df -h

   # 内存使用
   free -h

   # Docker 状态
   docker ps -a
   ```

4. **重新部署**
   ```bash
   # 清理并重新开始
   docker compose down -v
   ./deploy.sh
   ```

5. **寻求帮助**
   - 查看 `README.md` 的"故障排查"章节
   - 提交 Issue 到 GitHub 仓库

---

## 📞 获取帮助

### 文档资源

- **完整部署文档**: `README.md`
- **快速参考指南**: `QUICKREF.md`
- **API 接口文档**: `../API接口文档.md`

### 常用命令速查

| 操作 | 命令 |
|------|------|
| 查看服务状态 | `docker compose ps` |
| 查看日志 | `docker compose logs -f` |
| 重启服务 | `docker compose restart` |
| 停止服务 | `docker compose stop` |
| 删除服务 | `docker compose down` |
| 进入容器 | `docker exec -it petshop-backend bash` |

---

## 🎉 部署成功！

恭喜你完成了宠物店管理系统的部署！

**下一步建议：**

1. ✅ 修改管理员密码
2. ✅ 配置数据自动备份
3. ✅ 设置监控告警
4. ✅ 添加测试数据
5. ✅ 配置域名（可选）
6. ✅ 启用 HTTPS（可选）

---

**祝你使用愉快！** 🚀

如有任何问题，请参考 `README.md` 或提交 Issue。
