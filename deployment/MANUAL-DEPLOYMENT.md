# 极简部署 - 手动操作指南

> 适合想完全理解部署过程的用户
>
> 适配国内网络环境和 Ubuntu 系统（腾讯云）

## 📋 部署前准备

### 服务器要求
- **Ubuntu 20.04+**（本文档基于 Ubuntu 24.04 编写）
- 至少 2GB RAM
- 至少 20GB 磁盘空间
- Root 或 sudo 权限

### 检查系统信息
```bash
# 查看操作系统
cat /etc/os-release

# 查看内存
free -h

# 查看磁盘空间
df -h
```

### 配置国内镜像源（可选，但推荐）

```bash
# 备份原有源
sudo cp /etc/apt/sources.list.d/ubuntu.sources /etc/apt/sources.list.d/ubuntu.sources.bak

# 使用阿里云镜像（Ubuntu 24.04 示例）
sudo tee /etc/apt/sources.list.d/ubuntu.sources > /dev/null << EOF
Types: deb
URIs: https://mirrors.aliyun.com/ubuntu/
Suites: noble noble-updates noble-security
Components: main restricted universe multiverse
Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg
EOF

# 更新软件包列表
sudo apt update
```

---

## 🚀 部署步骤

### 第1步：安装 Docker

```bash
# 方法1：使用 apt 安装（推荐）
sudo apt update
sudo apt install -y docker.io docker-compose

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 配置 Docker 国内镜像加速
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json > /dev/null << EOF
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://dockerproxy.com",
    "https://docker.mirrors.ustc.edu.cn"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

# 重启 Docker 使配置生效
sudo systemctl daemon-reload
sudo systemctl restart docker

# 验证 Docker
docker --version
docker info | grep -A 5 "Registry Mirrors"

# 将当前用户添加到 docker 组（可选，避免每次 sudo）
sudo usermod -aG docker $USER
newgrp docker
```

### 第2步：安装 Java 17

```bash
# 使用 apt 安装 OpenJDK 17
sudo apt update
sudo apt install -y openjdk-17-jdk

# 验证安装
java -version

# 设置环境变量
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' >> ~/.bashrc
source ~/.bashrc

# 验证环境变量
echo $JAVA_HOME
```

### 第3步：安装 Maven

```bash
# 使用 apt 安装 Maven
sudo apt install -y maven

# 配置 Maven 使用阿里云镜像
mkdir -p ~/.m2
tee ~/.m2/settings.xml > /dev/null << EOF
<?xml version="1.0" encoding="UTF-8"?>
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0
          http://maven.apache.org/xsd/settings-1.0.0.xsd">
  <mirrors>
    <mirror>
      <id>aliyun</id>
      <mirrorOf>*</mirrorOf>
      <name>Aliyun Maven</name>
      <url>https://maven.aliyun.com/repository/public</url>
    </mirror>
  </mirrors>
</settings>
EOF

# 验证安装
mvn -version
```

### 第4步：安装 Node.js

```bash
# 使用 apt 安装 Node.js（Ubuntu 24.04 自带较新版本）
sudo apt update
sudo apt install -y nodejs npm

# 验证安装
node --version
npm --version

# 如果版本低于 18.x，使用 NodeSource 仓库
# curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
# sudo apt install -y nodejs

# 配置 npm 使用国内镜像
npm config set registry https://registry.npmmirror.com

# 安装 pnpm（推荐，更快）
npm install -g pnpm

# 配置 pnpm 使用国内镜像
pnpm config set registry https://registry.npmmirror.com

# 验证 pnpm
pnpm --version
```

### 第5步：克隆项目代码

```bash
# 安装 git
sudo apt install -y git

# 克隆项目
cd /opt

# 使用 Gitee（国内推荐，速度快）
sudo git clone https://gitee.com/light-dreamz/my-pet-shop3.0.git MyPetShop3.0

# 或者使用 GitHub（如果网络允许）
# sudo git clone https://github.com/LightDreamhs/MyPetShop3.0.git MyPetShop3.0

cd MyPetShop3.0

# 查看项目结构
ls -la
```

### 第6步：配置安全信息

```bash
cd deployment

# 生成随机密码
MYSQL_ROOT_PASSWORD=$(openssl rand -base64 16 | tr -d '/+=')
MYSQL_PASSWORD=$(openssl rand -base64 16 | tr -d '/+=')
JWT_SECRET=$(openssl rand -base64 32 | tr -d '/+=')

# 获取服务器IP
SERVER_IP=$(curl -s ifconfig.me)

# 显示生成的密码
echo "================================"
echo "MySQL Root 密码: $MYSQL_ROOT_PASSWORD"
echo "MySQL 应用密码: $MYSQL_PASSWORD"
echo "JWT 密钥: $JWT_SECRET"
echo "================================"
echo "请保存这些密码！"
echo "================================"

# 保存到文件
cat > .env.manual << EOF
MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD
MYSQL_PASSWORD=$MYSQL_PASSWORD
JWT_SECRET=$JWT_SECRET
SERVER_DOMAIN=http://$SERVER_IP
SERVER_IP=$SERVER_IP
EOF

chmod 600 .env.manual
echo "密码已保存到 .env.manual"
```

### 第7步：启动 MySQL 容器

```bash
cd /opt/MyPetShop3.0/deployment

# 停止旧容器（如果存在）
sudo docker stop petshop-mysql 2>/dev/null || true
sudo docker rm petshop-mysql 2>/dev/null || true

# 读取密码
source .env.manual

# 启动 MySQL 容器
sudo docker run -d \
  --name petshop-mysql \
  --restart unless-stopped \
  -e MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD \
  -e MYSQL_DATABASE=pet_shop_3_0 \
  -e MYSQL_USER=petshop \
  -e MYSQL_PASSWORD=$MYSQL_PASSWORD \
  -e TZ=Asia/Shanghai \
  -p 3306:3306 \
  -v petshop-mysql-data:/var/lib/mysql \
  -v $(pwd)/mysql-init:/docker-entrypoint-initdb.d:ro \
  mysql:8.0 \
  --character-set-server=utf8mb4 \
  --collation-server=utf8mb4_unicode_ci \
  --default-authentication-plugin=mysql_native_password

# 查看容器状态
sudo docker ps | grep petshop-mysql

# 等待 MySQL 初始化（大约20-30秒）
echo "等待 MySQL 初始化..."
sleep 20

# 验证 MySQL 连接
sudo docker exec petshop-mysql mysql -u petshop -p$MYSQL_PASSWORD pet_shop_3_0 -e "SHOW TABLES;"
```

### 第8步：构建后端

```bash
cd /opt/MyPetShop3.0/backend

# 清理并构建（Maven 会使用配置好的阿里云镜像）
sudo mvn clean package -DskipTests

# 查看生成的 JAR 包
ls -lh target/*.jar

# 复制 JAR 包到部署目录
sudo mkdir -p /opt/petshop
sudo cp target/pet-shop-backend-*.jar /opt/petshop/pet-shop-backend.jar
```

### 第9步：构建前端并打包到后端

```bash
cd /opt/MyPetShop3.0/frontend

# 安装依赖（使用国内镜像）
pnpm install
# 或者使用 npm
# npm install

# 检查镜像配置
pnpm config get registry
# 应该输出: https://registry.npmmirror.com

# 构建前端（生产环境）
VITE_API_BASE_URL=/api/v1 pnpm build
# 或者用 npm：
# VITE_API_BASE_URL=/api/v1 npm run build

# 检查构建结果
ls -la dist/

# 将前端文件复制到后端静态资源目录
cd /opt/MyPetShop3.0/backend
sudo mkdir -p src/main/resources/static
sudo rm -rf src/main/resources/static/*
sudo cp -r ../frontend/dist/* src/main/resources/static/

# 重新打包（包含前端文件）
sudo mvn clean package -DskipTests

# 复制新的 JAR 包
sudo cp target/pet-shop-backend-*.jar /opt/petshop/pet-shop-backend.jar
```

### 第10步：创建应用目录

```bash
# 创建必要目录
sudo mkdir -p /opt/petshop/uploads
sudo mkdir -p /opt/petshop/logs

# 设置权限
sudo chmod -R 755 /opt/petshop

# 验证目录
ls -la /opt/petshop/
```

### 第11步：创建启动脚本

```bash
# 读取配置
cd /opt/MyPetShop3.0/deployment
source .env.manual

# 创建启动脚本
sudo tee /opt/petshop/start.sh > /dev/null << 'EOF'
#!/bin/bash
cd /opt/petshop

# Java 参数
JAVA_OPTS="-Xms256m -Xmx512m"

# 启动应用
nohup java $JAVA_OPTS \
  -Dserver.port=80 \
  -Dspring.profiles.active=simple \
  -Dspring.datasource.url=jdbc:mysql://localhost:3306/pet_shop_3_0?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai \
  -Dspring.datasource.username=petshop \
  -Dspring.datasource.password=PASSWORD_PLACEHOLDER \
  -Djwt.secret=JWT_PLACEHOLDER \
  -Dfile.upload-dir=/opt/petshop/uploads \
  -Dfile.server-domain=DOMAIN_PLACEHOLDER \
  -jar pet-shop-backend.jar \
  > logs/app.log 2>&1 &

echo $! > /opt/petshop/app.pid
echo "应用已启动，PID: $(cat /opt/petshop/app.pid)"
EOF

# 替换占位符
sudo sed -i "s/PASSWORD_PLACEHOLDER/$MYSQL_PASSWORD/g" /opt/petshop/start.sh
sudo sed -i "s/JWT_PLACEHOLDER/$JWT_SECRET/g" /opt/petshop/start.sh
sudo sed -i "s|DOMAIN_PLACEHOLDER|$SERVER_DOMAIN|g" /opt/petshop/start.sh

# 设置执行权限
sudo chmod +x /opt/petshop/start.sh
```

### 第12步：创建停止脚本

```bash
sudo tee /opt/petshop/stop.sh > /dev/null << 'EOF'
#!/bin/bash
if [ -f /opt/petshop/app.pid ]; then
    pid=$(cat /opt/petshop/app.pid)
    echo "停止应用，PID: $pid"
    kill $pid 2>/dev/null || true
    rm /opt/petshop/app.pid
fi
pkill -f pet-shop-backend.jar || true
echo "应用已停止"
EOF

sudo chmod +x /opt/petshop/stop.sh
```

### 第13步：配置防火墙

```bash
# 安装 ufw（如果没有）
sudo apt install -y ufw

# 配置防火墙规则
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS（如果需要）

# 启用防火墙
sudo ufw --force enable

# 查看状态
sudo ufw status
```

### 第14步：启动应用

```bash
# 启动应用
cd /opt/petshop
sudo ./start.sh

# 等待启动
sleep 10

# 查看日志
tail -f logs/app.log

# 按 Ctrl+C 退出日志查看（应用不会停止）
```

### 第15步：验证部署

```bash
# 检查进程
ps aux | grep pet-shop-backend

# 检查端口
sudo ss -tlnp | grep :80

# 测试前端
curl -I http://localhost/

# 测试后端
curl http://localhost/api/v1/auth/login

# 查看应用日志（最近 50 行）
tail -50 /opt/petshop/logs/app.log
```

### 第16步：配置开机自启

```bash
# 创建 systemd 服务
sudo tee /etc/systemd/system/petshop.service > /dev/null << EOF
[Unit]
Description=Pet Shop Management System
After=network.target docker.service
Requires=docker.service

[Service]
Type=forking
User=root
WorkingDirectory=/opt/petshop
ExecStart=/opt/petshop/start.sh
ExecStop=/opt/petshop/stop.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 重载 systemd
sudo systemctl daemon-reload

# 启用服务
sudo systemctl enable petshop

# 检查状态
sudo systemctl status petshop
```

---

## ✅ 完成！

### 访问你的应用

```bash
# 获取服务器IP
echo "访问地址: http://$SERVER_IP"
```

在浏览器打开：`http://your-server-ip`

**默认账号**：
- 用户名：`admin`
- 密码：`admin123`

### 常用管理命令

```bash
# 查看应用日志
tail -f /opt/petshop/logs/app.log

# 重启应用
cd /opt/petshop
sudo ./stop.sh
sudo ./start.sh

# 如果配置了 systemd
sudo systemctl restart petshop
sudo systemctl status petshop

# 查看 MySQL 日志
sudo docker logs petshop-mysql -f

# 进入 MySQL
sudo docker exec -it petshop-mysql mysql -u petshop -p
```

---

## 🛠️ 故障排查

### 问题1：应用无法启动

```bash
# 查看详细日志
tail -100 /opt/petshop/logs/app.log

# 检查端口占用
sudo ss -tlnp | grep :80

# 检查 Java 版本
java -version

# 检查文件权限
ls -la /opt/petshop/
```

### 问题2：无法连接数据库

```bash
# 检查 MySQL 容器
sudo docker ps | grep petshop-mysql

# 查看 MySQL 日志
sudo docker logs petshop-mysql

# 测试连接
sudo docker exec petshop-mysql mysql -u petshop -p
```

### 问题3：前端无法访问

```bash
# 检查应用是否运行
ps aux | grep pet-shop-backend

# 测试静态文件
curl -I http://localhost/

# 检查防火墙
sudo ufw status

# 检查端口监听
sudo ss -tlnp | grep :80
```

### 问题4：图片上传后无法显示

```bash
# 检查上传目录
ls -la /opt/petshop/uploads/

# 检查文件权限
sudo chmod -R 755 /opt/petshop/uploads

# 查看应用日志中的文件路径
grep "uploads/images" /opt/petshop/logs/app.log
```

### 问题5：Maven 下载依赖很慢

```bash
# 检查 Maven 配置
cat ~/.m2/settings.xml

# 重新配置阿里云镜像
mkdir -p ~/.m2
tee ~/.m2/settings.xml > /dev/null << EOF
<?xml version="1.0" encoding="UTF-8"?>
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0
          http://maven.apache.org/xsd/settings-1.0.0.xsd">
  <mirrors>
    <mirror>
      <id>aliyun</id>
      <mirrorOf>*</mirrorOf>
      <name>Aliyun Maven</name>
      <url>https://maven.aliyun.com/repository/public</url>
    </mirror>
  </mirrors>
</settings>
EOF
```

### 问题6：npm/pnpm 安装依赖失败

```bash
# 检查 npm 镜像配置
npm config get registry

# 重新配置淘宝镜像
npm config set registry https://registry.npmmirror.com

# 检查 pnpm 镜像配置
pnpm config get registry

# 重新配置
pnpm config set registry https://registry.npmmirror.com

# 清除缓存重试
pnpm store prune
pnpm install
```

---

## 📝 重要信息保存

```bash
# 查看保存的密码
cat /opt/MyPetShop3.0/deployment/.env.manual

# 或者手动记录
echo "================================"
echo "请保存以下信息："
echo "================================"
cat /opt/MyPetShop3.0/deployment/.env.manual
echo "================================"
echo "管理员账号: admin"
echo "管理员密码: admin123"
echo "================================"
```

---

## 🔄 更新应用

当需要更新代码时：

```bash
cd /opt/MyPetShop3.0

# 拉取最新代码
sudo git pull

# 重新构建后端
cd backend
sudo mvn clean package -DskipTests
sudo cp target/pet-shop-backend-*.jar /opt/petshop/pet-shop-backend.jar

# 重新构建前端
cd ../frontend
pnpm install
VITE_API_BASE_URL=/api/v1 pnpm build

# 打包到后端
cd ../backend
sudo mkdir -p src/main/resources/static
sudo rm -rf src/main/resources/static/*
sudo cp -r ../frontend/dist/* src/main/resources/static/
sudo mvn package -DskipTests
sudo cp target/pet-shop-backend-*.jar /opt/petshop/pet-shop-backend.jar

# 重启应用
cd /opt/petshop
sudo ./stop.sh
sudo ./start.sh
```

---

## 💾 备份数据

### 备份数据库

```bash
cd /opt/MyPetShop3.0/deployment
source .env.manual

sudo docker exec petshop-mysql mysqldump \
  -u petshop -p$MYSQL_PASSWORD \
  pet_shop_3_0 > backup_$(date +%Y%m%d).sql
```

### 恢复数据库

```bash
cd /opt/MyPetShop3.0/deployment
source .env.manual

sudo docker exec -i petshop-mysql mysql \
  -u petshop -p$MYSQL_PASSWORD \
  pet_shop_3_0 < backup_20250127.sql
```

### 备份上传的文件

```bash
sudo tar -czf uploads_backup_$(date +%Y%m%d).tar.gz /opt/petshop/uploads/
```

---

## 🎉 恭喜！

你已经完成了手动部署。如果遇到问题，请查看：
1. 应用日志：`/opt/petshop/logs/app.log`
2. MySQL 日志：`sudo docker logs petshop-mysql`
3. 系统日志：`sudo journalctl -xe`

---

## 📚 附录：常用软件包管理

### Ubuntu 软件包管理

```bash
# 搜索软件包
apt search docker

# 查看软件包信息
apt show docker.io

# 安装软件包
sudo apt install docker.io

# 卸载软件包
sudo apt remove docker.io

# 更新软件包列表
sudo apt update

# 升级已安装的软件包
sudo apt upgrade
```

### Snap 软件包管理

```bash
# 搜索软件包
snap find docker

# 查看软件包信息
snap info docker

# 安装软件包
sudo snap install docker

# 列出已安装的 snap
snap list

# 卸载软件包
sudo snap remove docker
```

### Docker 常用命令

```bash
# 查看运行中的容器
docker ps

# 查看所有容器（包括停止的）
docker ps -a

# 查看容器日志
docker logs petshop-mysql

# 进入容器
docker exec -it petshop-mysql bash

# 停止容器
docker stop petshop-mysql

# 启动容器
docker start petshop-mysql

# 重启容器
docker restart petshop-mysql

# 删除容器
docker rm petshop-mysql

# 查看镜像
docker images

# 删除镜像
docker rmi mysql:8.0

# 查看 Docker 系统信息
docker system info

# 清理未使用的资源
docker system prune -a
```

---

## 💡 提示

- **首次部署**：建议按照文档一步步操作，不要跳过步骤
- **密码保存**：务必保存好生成的密码，丢失后无法恢复
- **日志查看**：遇到问题先查看日志，90%的问题都能从日志中找到答案
- **定期备份**：建议定期备份数据库和上传的文件
- **更新系统**：定期运行 `sudo apt update && sudo apt upgrade` 保持系统更新

---

**祝你部署顺利！** 🎉
