# Docker 镜像拉取超时问题解决方案

> 专门解决国内服务器无法访问 Docker Hub 官方仓库的问题

## 🚨 问题现象

### **错误信息**

```bash
# 部署时出现的错误
ERROR: for mysql  to sandbox:PullImageFromImage (...)
ERROR: for mysql  failed to register layer:
Error response from daemon:
{
  "message":"failed to register layer:
   error analyzing layer tar:x509: certificate signed by unknown authority"
}

# 或
Error response from daemon:
Get "https://registry-1.docker.io/v2/":
net/http: request canceled while waiting for connection
(Client.Timeout exceeded while awaiting headers)

# 或
ERROR: manifest for mysql:8.0 not found:
manifest unknown: manifest unknown
```

### **典型症状**
- ❌ Docker 镜像拉取速度极慢（几 KB/s）
- ❌ 镜像拉取超时（超过 10 分钟）
- ❌ 无法连接到 registry-1.docker.io
- ❌ TLS/SSL 证书验证失败

---

## ✅ 解决方案对比

| 方案 | 难度 | 效果 | 推荐度 |
|------|------|------|--------|
| **方案1：自动配置镜像加速** | ⭐ 简单 | ⭐⭐⭐⭐⭐ | ✅ 强烈推荐 |
| **方案2：手动配置加速器** | ⭐⭐ 中等 | ⭐⭐⭐⭐⭐ | ✅ 推荐 |
| **方案3：使用阿里云镜像** | ⭐⭐ 中等 | ⭐⭐⭐⭐ | ✅ 备用 |
| **方案4：离线导入镜像** | ⭐⭐⭐ 较难 | ⭐⭐⭐⭐ | ⚠️ 最后手段 |

---

## 🚀 方案1：自动配置镜像加速（已集成）

**deploy.sh 已自动配置镜像加速！**

### **工作原理**

脚本会自动配置 4 个国内镜像加速器：

```json
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",      // 道云（推荐）
    "https://dockerproxy.com",           // Docker 代理
    "https://docker.mirrors.ustc.edu.cn", // 中科大
    "https://docker.nju.edu.cn"          // 南京大学
  ]
}
```

### **自动配置流程**

```bash
[INFO] 配置 Docker 镜像加速器...
[INFO] 重启 Docker 服务...
[INFO] Docker 镜像加速器配置成功 ✅
```

**优势**：
- ✅ 完全自动化，无需手动操作
- ✅ 多个备用镜像源，提高成功率
- ✅ 自动备份原配置，安全可靠
- ✅ 自动验证配置是否生效

**何时失败**：
- 如果所有镜像源都无法访问，脚本会自动回滚到原配置

---

## 🔧 方案2：手动配置镜像加速

### **步骤1：编辑 Docker 配置文件**

```bash
# 创建或编辑 Docker 配置
sudo nano /etc/docker/daemon.json
```

### **步骤2：添加镜像加速器**

**完整的配置文件（推荐）：**

```json
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://dockerproxy.com",
    "https://docker.mirrors.ustc.edu.cn",
    "https://docker.nju.edu.cn",
    "https://mirror.ccs.tencentyun.com"
  ],
  "dns": ["8.8.8.8", "114.114.114.114"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
```

### **步骤3：重启 Docker 服务**

```bash
# 重新加载配置
sudo systemctl daemon-reload

# 重启 Docker
sudo systemctl restart docker

# 验证配置
sudo docker info | grep -A 10 "Registry Mirrors"
```

**预期输出：**
```
Registry Mirrors:
  https://docker.m.daocloud.io/
  https://dockerproxy.com/
  https://docker.mirrors.ustc.edu.cn/
  https://docker.nju.edu.cn/
```

---

## 🌐 方案3：使用阿里云容器镜像服务

### **阿里云个人版镜像加速器**

**地址获取：** https://cr.console.aliyun.com/cn-hangzhou/instances/mirrors

**配置步骤：**

1. **登录阿里云容器镜像服务**
   - 访问：https://cr.console.aliyun.com
   - 注册/登录账号（免费）

2. **获取专属镜像加速地址**
   - 进入"镜像加速器"页面
   - 选择操作系统：Ubuntu
   - 复制专属加速地址（例如：`https://xxxxxx.mirror.aliyuncs.com`）

3. **配置 Docker**
   ```bash
   sudo mkdir -p /etc/docker
   sudo tee /etc/docker/daemon.json <<-'EOF'
   {
     "registry-mirrors": ["https://xxxxxx.mirror.aliyuncs.com"]
   }
   EOF

   sudo systemctl daemon-reload
   sudo systemctl restart docker
   ```

**优点**：
- ✅ 阿里云官方支持，速度快
- ✅ 免费使用，无限制
- ✅ 稳定可靠

**缺点**：
- ⚠️ 需要注册阿里云账号
- ⚠️ 有一定配额限制

---

## 💾 方案4：离线导入镜像（最后手段）

如果网络完全无法访问，可以手动下载镜像并导入：

### **步骤1：在有网络的机器上下载镜像**

```bash
# 拉取 MySQL 8.0 镜像
docker pull mysql:8.0

# 拉取 Nginx 镜像
docker pull nginx:alpine

# 拉取 OpenJDK 17 镜像
docker pull eclipse-temurin:17-jre-alpine
```

### **步骤2：导出镜像为 tar 文件**

```bash
# 导出 MySQL
docker save mysql:8.0 -o mysql-8.0.tar

# 导出 Nginx
docker save nginx:alpine -o nginx-alpine.tar

# 导出 OpenJDK
docker save eclipse-temurin:17-jre-alpine -o openjdk-17.tar

# 或者一次性导出所有镜像
docker save mysql:8.0 nginx:alpine eclipse-temurin:17-jre-alpine -o petshop-images.tar
```

### **步骤3：传输到目标服务器**

```bash
# 使用 SCP 上传
scp mysql-8.0.tar root@your-server-ip:/opt/petshop/
scp nginx-alpine.tar root@your-server-ip:/opt/petshop/
scp openjdk-17.tar root@your-server-ip:/opt/petshop/

# 或上传打包文件
scp petshop-images.tar root@your-server-ip:/opt/petshop/
```

### **步骤4：在目标服务器上导入镜像**

```bash
# SSH 登录服务器
ssh root@your-server-ip

# 导入 MySQL
docker load -i /opt/petshop/mysql-8.0.tar

# 导入 Nginx
docker load -i /opt/petshop/nginx-alpine.tar

# 导入 OpenJDK
docker load -i /opt/petshop/openjdk-17.tar

# 或导入打包文件
docker load -i /opt/petshop/petshop-images.tar

# 验证镜像
docker images
```

**预期输出：**
```
REPOSITORY                    TAG                 IMAGE ID
mysql                         8.0                 abc123def456
nginx                         alpine              789ghi012jkl
eclipse-temurin               17-jre-alpine       mno456pqr789
```

### **步骤5：继续部署**

```bash
cd /opt/petshop/deployment
./deploy.sh
```

镜像已经存在，Docker 会跳过拉取步骤，直接使用本地镜像。

---

## 🛠️ 方案5：修改 docker-compose.yml 使用国内镜像源

如果上述方法都不行，可以修改 `docker-compose.yml` 直接指定镜像源：

```yaml
services:
  mysql:
    image: dockerproxy.com/mysql:8.0  # 使用代理镜像
    # 或
    image: docker.m.daocloud.io/mysql:8.0  # 使用道云镜像

  frontend:
    image: dockerproxy.com/nginx:alpine
    # 或
    image: docker.m.daocloud.io/nginx:alpine
```

**注意**：这种方式不够优雅，不推荐长期使用。

---

## 🔍 故障排查

### **问题1：镜像加速器配置后仍然无法拉取**

**检查方法：**

```bash
# 查看当前镜像配置
docker info | grep -A 10 "Registry Mirrors"

# 测试镜像源连接
curl -I https://docker.m.daocloud.io/v2/
curl -I https://dockerproxy.com/v2/
```

**解决方案：**

尝试不同的镜像源，或使用离线导入方式。

---

### **问题2：配置镜像加速器后 Docker 无法启动**

**检查日志：**

```bash
# 查看 Docker 状态
sudo systemctl status docker

# 查看错误日志
sudo journalctl -u docker -n 50
```

**解决方案：**

```bash
# 恢复原配置
sudo mv /etc/docker/daemon.json.bak /etc/docker/daemon.json

# 重启 Docker
sudo systemctl restart docker

# 重新配置（使用其他镜像源）
```

---

### **问题3：SSL/TLS 证书错误**

**错误信息：**
```
x509: certificate signed by unknown authority
```

**解决方案：**

```bash
# 方法1：更新 CA 证书
sudo apt update
sudo apt install -y ca-certificates

# 方法2：重启 Docker
sudo systemctl restart docker

# 方法3：使用 HTTP 镜像源（不推荐）
```

---

## 📊 镜像源速度对比

### **测试方法**

```bash
# 创建测试脚本
cat > test-mirror-speed.sh << 'EOF'
#!/bin/bash

echo "测试各镜像源速度..."

# 道云
time docker pull docker.m.daocloud.io/library/hello-world:latest
docker rmi docker.m.daocloud.io/library/hello-world:latest

# DockerProxy
time docker pull dockerproxy.com/library/hello-world:latest
docker rmi dockerproxy.com/library/hello-world:latest

# 中科大
time docker pull docker.mirrors.ustc.edu.cn/library/hello-world:latest
docker rmi docker.mirrors.ustc.edu.cn/library/hello-world:latest

echo "测试完成"
EOF

chmod +x test-mirror-speed.sh
./test-mirror-speed.sh
```

### **速度参考**

| 镜像源 | 速度 | 稳定性 | 推荐度 |
|--------|------|--------|--------|
| Docker Hub 官方 | ⚠️ 极慢/失败 | ❌ 不稳定 | ❌ 不推荐 |
| 道云 | ⭐⭐⭐⭐⭐ 很快 | ✅ 稳定 | ✅ 强烈推荐 |
| DockerProxy | ⭐⭐⭐⭐ 快 | ✅ 稳定 | ✅ 推荐 |
| 中科大 | ⭐⭐⭐ 中等 | ✅ 稳定 | ✅ 备用 |
| 南京大学 | ⭐⭐⭐ 中等 | ✅ 稳定 | ✅ 备用 |
| 阿里云 | ⭐⭐⭐⭐ 快 | ✅ 很稳定 | ✅ 推荐（需注册） |

---

## 📝 最佳实践

### **推荐配置顺序**

1. **首选：方案1（自动配置）**
   - 使用 `deploy.sh` 自动配置
   - 简单快速，无需手动操作

2. **次选：方案3（阿里云）**
   - 如果有阿里云账号
   - 配置专属加速地址

3. **备用：方案2（手动配置）**
   - 如果自动配置失败
   - 手动编辑 `/etc/docker/daemon.json`

4. **最后手段：方案4（离线导入）**
   - 如果网络完全无法访问
   - 手动下载并传输镜像

---

## 🎯 针对本项目的具体操作

### **方式1：使用自动部署（推荐）**

```bash
cd /opt/petshop/deployment
./deploy.sh

# 脚本会自动：
# 1. 安装 Docker
# 2. 配置镜像加速器 ✅
# 3. 拉取 MySQL、Nginx 等镜像
# 4. 启动服务
```

### **方式2：手动配置加速器**

```bash
# 1. 配置加速器
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://dockerproxy.com"
  ]
}
EOF

# 2. 重启 Docker
sudo systemctl daemon-reload
sudo systemctl restart docker

# 3. 验证配置
docker info | grep "Registry Mirrors"

# 4. 重新部署
cd /opt/petshop/deployment
./deploy.sh
```

### **方式3：离线部署**

```bash
# 1. 本地下载镜像
docker pull mysql:8.0
docker pull nginx:alpine

# 2. 导出镜像
docker save mysql:8.0 nginx:alpine -o petshop-images.tar

# 3. 上传到服务器
scp petshop-images.tar root@your-server-ip:/opt/petshop/

# 4. 服务器上导入
ssh root@your-server-ip
docker load -i /opt/petshop/petshop-images.tar

# 5. 继续部署
cd /opt/petshop/deployment
./deploy.sh
```

---

## ⚡ 优化建议

### **1. 提前拉取镜像**

在正式部署前，先拉取所有镜像：

```bash
# 拉取 MySQL
docker pull mysql:8.0

# 拉取 Nginx
docker pull nginx:alpine

# 拉取 OpenJDK（用于后端构建）
docker pull eclipse-temurin:17-jre-alpine

# 验证
docker images
```

### **2. 使用国内基础镜像**

如果需要自定义镜像，使用国内基础镜像：

```dockerfile
# 不推荐
FROM eclipse-temurin:17-jre-alpine

# 推荐
FROM dockerproxy.com/library/eclipse-temurin:17-jre-alpine
# 或
FROM docker.m.daocloud.io/library/eclipse-temurin:17-jre-alpine
```

### **3. 配置 Docker 代理（如有代理服务器）**

```json
{
  "proxies": {
    "http-proxy": "http://proxy.example.com:8080",
    "https-proxy": "http://proxy.example.com:8080"
  }
}
```

---

## 🆘 紧急救援命令

### **快速恢复 Docker**

```bash
# 如果 Docker 无法启动
sudo systemctl stop docker
sudo rm /etc/docker/daemon.json
sudo systemctl start docker

# 重新配置镜像加速
cd /opt/petshop/deployment
./deploy.sh
```

### **强制清理并重试**

```bash
# 停止所有容器
docker compose down

# 清理镜像缓存
docker system prune -a

# 重新部署
./deploy.sh
```

---

## 📞 需要帮助？

如果上述方法都无法解决：

1. **检查服务器网络**
   ```bash
   ping -c 4 baidu.com
   ping -c 4 docker.m.daocloud.io
   ```

2. **检查防火墙**
   ```bash
   sudo ufw status
   sudo iptables -L -n
   ```

3. **查看 Docker 日志**
   ```bash
   sudo journalctl -u docker -f
   ```

4. **尝试使用 VPN**（如果合法可用）

---

## 📚 参考资料

- [Docker 官方镜像加速器文档](https://docs.docker.com/registry/recipes/mirror/)
- [阿里云容器镜像服务](https://cr.console.aliyun.com)
- [道云镜像加速](https://www.daocloud.io/mirror#accelerator-doc)

---

**总结：使用 `deploy.sh` 自动部署时，镜像加速已自动配置！无需手动操作。** ✅
