# 部署故障排查指南

> 宠物店管理系统部署过程中常见问题及解决方案

## 📋 目录

1. [MySQL 相关问题](#mysql-相关问题)
2. [后端相关问题](#后端相关问题)
3. [前端相关问题](#前端相关问题)
4. [图片上传问题](#图片上传问题)
5. [健康检查问题](#健康检查问题)
6. [网络访问问题](#网络访问问题)

---

## MySQL 相关问题

### ❌ 问题1：MySQL 容器无法启动

**错误信息：**
```
ERROR: unknown variable 'query_cache_type=1'
```

**原因：**
MySQL 8.0 已经移除了 query cache 功能，但配置文件中仍包含相关配置。

**解决方案：**
```bash
cd deployment
docker compose down
docker volume rm deployment_mysql-data
docker compose up -d
```

配置文件已经修复，重新启动即可。

---

### ❌ 问题2：数据库表不存在

**错误信息：**
```
ERROR 1146 (42S02): Table 'pet_shop_3_0.users' doesn't exist
```

**原因：**
初始化脚本没有自动执行。

**解决方案：**

**方法1：手动导入（推荐）**
```bash
cd deployment
cat mysql-init/init.sql | docker exec -i petshop-mysql mysql -upetshop -p${MYSQL_PASSWORD} pet_shop_3_0

# 验证
docker exec -it petshop-mysql mysql -upetshop -p${MYSQL_PASSWORD} pet_shop_3_0 -e "SHOW TABLES;"
```

**方法2：删除数据卷重新初始化**
```bash
cd deployment
docker compose down
docker volume rm deployment_mysql-data
docker compose up -d

# 等待 60 秒让初始化完成
sleep 60
docker exec -it petshop-mysql mysql -upetshop -p${MYSQL_PASSWORD} pet_shop_3_0 -e "SHOW TABLES;"
```

---

### ❌ 问题3：MySQL 健康检查失败

**现象：**
```bash
docker ps
# 显示：petshop-mysql   Up X minutes (unhealthy)
```

**原因：**
MySQL 配置问题或密码错误。

**解决方案：**
```bash
# 查看详细日志
docker logs petshop-mysql --tail 100

# 手动测试连接
docker exec -it petshop-mysql mysqladmin ping -h localhost -u root -p${MYSQL_ROOT_PASSWORD}

# 如果失败，检查 .env 文件中的密码配置
cat deployment/.env | grep MYSQL
```

---

## 后端相关问题

### ❌ 问题4：后端显示 unhealthy

**现象：**
```bash
docker ps
# 显示：petshop-backend   Up X minutes (unhealthy)
```

**原因：**
健康检查端点不存在或配置错误。

**解决方案：**
```bash
# 1. 查看后端日志
docker logs petshop-backend --tail 50

# 2. 检查后端是否真的在运行
curl http://localhost:8080/api/v1/auth/login

# 3. 手动测试端口
nc -z localhost 8080 && echo "后端正常运行" || echo "后端未启动"

# 4. 如果后端确实正常，重启容器
docker restart petshop-backend
```

**注意：** 即使显示 unhealthy，只要后端 API 能正常访问就不影响使用。

---

### ❌ 问题5：后端启动失败

**错误信息：**
```
Error creating bean with name 'dataSource': ...
```

**原因：**
数据库连接失败或数据库未初始化。

**解决方案：**
```bash
# 1. 检查数据库是否运行
docker ps | grep mysql

# 2. 检查数据库是否已初始化
docker exec -it petshop-mysql mysql -upetshop -p${MYSQL_PASSWORD} pet_shop_3_0 -e "SHOW TABLES;"

# 3. 如果表不存在，手动导入初始化脚本
cat deployment/mysql-init/init.sql | docker exec -i petshop-mysql mysql -upetshop -p${MYSQL_PASSWORD} pet_shop_3_0

# 4. 重启后端
docker restart petshop-backend

# 5. 查看启动日志
docker logs -f petshop-backend
```

---

## 前端相关问题

### ❌ 问题6：前端无法访问

**现象：**
浏览器访问 `http://服务器IP` 显示无法访问。

**解决方案：**

**1. 检查容器状态**
```bash
docker ps | grep frontend
docker logs petshop-frontend --tail 20
```

**2. 检查防火墙**
```bash
# Ubuntu/Debian
sudo ufw status
sudo ufw allow 80/tcp

# CentOS/RHEL
sudo firewall-cmd --list-all
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --reload
```

**3. 检查云服务商安全组**
- 登录云服务商控制台（阿里云/腾讯云等）
- 找到安全组设置
- 添加入站规则：允许端口 80，协议 TCP

**4. 本地测试**
```bash
# 在服务器上测试
curl -I http://localhost/

# 如果本地能访问，外网无法访问，说明是防火墙或安全组问题
```

---

## 图片上传问题

### ❌ 问题7：上传图片后无法显示

**错误信息：**
```
Failed to load resource: net::ERR_CONNECTION_REFUSED
```

**原因：**
后端返回的图片 URL 使用了 `localhost:8080`，浏览器无法访问。

**解决方案：**

**1. 检查 .env 配置**
```bash
cd deployment
cat .env | grep SERVER_DOMAIN

# 应该显示：SERVER_DOMAIN=http://你的服务器公网IP
```

**2. 修改配置并重启**
```bash
# 编辑 .env 文件
vi .env

# 修改 SERVER_DOMAIN 为你的服务器公网 IP
SERVER_DOMAIN=http://47.108.227.161

# 重启后端
docker compose restart backend

# 重新上传图片测试
```

**3. 验证数据库中的 URL**
```bash
docker exec -it petshop-mysql mysql -upetshop -p${MYSQL_PASSWORD} pet_shop_3_0 -e "SELECT id, name, image_url FROM products ORDER BY created_at DESC LIMIT 1\G"
```

图片 URL 应该是：
- ✅ `http://你的服务器IP/uploads/images/xxx.jpg`
- ❌ `http://localhost:8080/api/v1/uploads/images/xxx.jpg`

---

## 健康检查问题

### ❌ 问题8：所有服务都显示 unhealthy

**现象：**
```bash
docker ps
# 所有服务都显示 (unhealthy)
```

**原因：**
健康检查配置不当或服务启动慢。

**解决方案：**

**1. 等待更长时间**
```bash
# 等待 3 分钟让服务完全启动
sleep 180
docker ps
```

**2. 手动测试健康检查**
```bash
# MySQL
docker exec petshop-mysql mysqladmin ping -h localhost -u root -p${MYSQL_ROOT_PASSWORD}

# 后端
nc -z localhost 8080 && echo "后端健康" || echo "后端异常"

# 前端
curl -I http://localhost/
```

**3. 如果服务实际正常但健康检查失败**
```bash
# 不影响使用，可以忽略或调整健康检查配置
# 编辑 docker-compose.yml 中的 start_period 增加等待时间
```

---

## 网络访问问题

### ❌ 问题9：Git pull 失败

**错误信息：**
```
error: RPC failed; curl 16 Error in the HTTP2 framing layer
```

**解决方案：**
```bash
# 设置 git 使用 HTTP/1.1
git config --global http.version HTTP/1.1
git config --global http.postBuffer 524288000

# 重新拉取
git pull
```

---

### ❌ 问题10：Docker 镜像拉取失败

**错误信息：**
```
Error response from daemon: Get "https://registry-1.docker.io/v2/": ...
```

**解决方案：**

**方法1：使用镜像加速器**
```bash
# 配置镜像加速（脚本已自动配置）
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://dockerproxy.com",
    "https://docker.mirrors.ustc.edu.cn"
  ]
}
EOF

# 重启 Docker
sudo systemctl daemon-reload
sudo systemctl restart docker
```

**方法2：手动下载镜像**
```bash
# 拉取 MySQL
docker pull mysql:8.0

# 拉取 Nginx
docker pull nginx:alpine
```

**方法3：使用离线镜像**
```bash
# 在有网络的机器上
docker save mysql:8.0 nginx:alpine -o petshop-images.tar

# 传输到服务器
scp petshop-images.tar root@server:/opt/

# 在服务器上导入
docker load -i /opt/petshop-images.tar
```

---

## 🚀 快速诊断命令

### 一键诊断脚本

```bash
#!/bin/bash
echo "========================================="
echo "  宠物店系统健康检查"
echo "========================================="

echo ""
echo "1. 容器状态："
docker ps --format "table {{.Names}}\t{{.Status}}"

echo ""
echo "2. MySQL 检查："
docker exec petshop-mysql mysqladmin ping -h localhost -u root -p${MYSQL_PASSWORD} 2>&1 | grep -v "Warning"

echo ""
echo "3. 数据库表检查："
docker exec petshop-mysql mysql -upetshop -p${MYSQL_PASSWORD} pet_shop_3_0 -e "SHOW TABLES;" 2>&1 | grep -v "Warning"

echo ""
echo "4. 后端端口检查："
nc -z localhost 8080 && echo "✅ 后端端口 8080 开放" || echo "❌ 后端端口 8080 未开放"

echo ""
echo "5. 前端检查："
curl -I http://localhost/ 2>&1 | head -1

echo ""
echo "6. 环境变量检查："
cd deployment
cat .env | grep -E "SERVER_DOMAIN|MYSQL" | sed 's/MYSQL_PASSWORD=.*/MYSQL_PASSWORD=*****/'

echo ""
echo "========================================="
```

---

## 📞 获取帮助

如果上述方法都无法解决：

1. **查看详细日志**
   ```bash
   docker compose logs > full-logs.txt
   ```

2. **收集系统信息**
   ```bash
   docker version
   docker compose version
   uname -a
   cat /etc/os-release
   ```

3. **查看项目文档**
   - README.md - 部署说明
   - DOCKER-MIRROR-TROUBLESHOOTING.md - Docker 镜像问题

---

**最后更新：** 2026-01-25
**适用版本：** v1.0.0
