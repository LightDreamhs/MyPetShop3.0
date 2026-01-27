#!/bin/bash

# ==========================================
# 宠物店管理系统 - 极简部署脚本（无Nginx）
# 适用场景：单人使用，轻量负载
# 架构：Spring Boot(80) + MySQL(Docker)
# ==========================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
print_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_step() { echo -e "${BLUE}===>${NC} $1"; }

# ==========================================
# 步骤1：检查权限和系统
# ==========================================
check_root() {
    print_step "检查权限..."
    if [ "$EUID" -ne 0 ]; then
        print_error "请使用 root 用户或 sudo 运行"
        exit 1
    fi
}

check_system() {
    print_step "检查系统..."
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        print_info "操作系统: $OS"
    else
        print_error "无法检测操作系统"
        exit 1
    fi
}

# ==========================================
# 步骤2：安装依赖
# ==========================================
install_dependencies() {
    print_step "安装基础软件..."

    # 更新软件包
    apt update || yum update -y

    # 安装必要软件
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        apt install -y curl wget git docker.io
    elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
        yum install -y curl wget git docker
    fi

    # 启动 Docker
    systemctl start docker
    systemctl enable docker

    # 配置 Docker 镜像加速
    mkdir -p /etc/docker
    cat > /etc/docker/daemon.json << 'EOF'
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://dockerproxy.com"
  ]
}
EOF
    systemctl daemon-reload
    systemctl restart docker

    print_info "基础软件安装完成"
}

# ==========================================
# 步骤3：安装 JDK 和 Maven
# ==========================================
install_java() {
    print_step "安装 Java 17..."

    if command -v java &> /dev/null; then
        print_info "Java 已安装: $(java -version 2>&1 | head -n 1)"
    else
        apt install -y openjdk-17-jdk || yum install -y java-17-openjdk-devel
        print_info "Java 17 安装完成"
    fi

    export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
}

install_maven() {
    print_step "安装 Maven..."

    if command -v mvn &> /dev/null; then
        print_info "Maven 已安装"
    else
        apt install -y maven || yum install -y maven
        print_info "Maven 安装完成"
    fi
}

# ==========================================
# 步骤4：生成配置
# ==========================================
generate_config() {
    print_step "生成安全配置..."

    # 生成随机密码
    MYSQL_ROOT_PASSWORD=$(openssl rand -base64 16 | tr -d '/+=')
    MYSQL_PASSWORD=$(openssl rand -base64 16 | tr -d '/+=')
    JWT_SECRET=$(openssl rand -base64 32 | tr -d '/+=')

    # 获取服务器IP
    SERVER_IP=$(curl -s --max-time 5 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

    echo ""
    print_warn "检测到服务器IP: $SERVER_IP"
    read -p "你有域名吗？(y/N): " has_domain
    echo ""

    if [[ $has_domain =~ ^[Yy]$ ]]; then
        read -p "请输入域名: " user_domain
        if [ -n "$user_domain" ]; then
            SERVER_DOMAIN="http://$user_domain"
        else
            SERVER_DOMAIN="http://$SERVER_IP"
        fi
    else
        SERVER_DOMAIN="http://$SERVER_IP"
    fi

    print_info "服务器地址: $SERVER_DOMAIN"

    # 保存配置
    cat > .env.simple << EOF
# 生成时间: $(date)
MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD
MYSQL_PASSWORD=$MYSQL_PASSWORD
JWT_SECRET=$JWT_SECRET
SERVER_DOMAIN=$SERVER_DOMAIN
SERVER_IP=$SERVER_IP
EOF

    chmod 600 .env.simple

    # 保存账号信息
    cat > .env.simple.backup << EOF
====================================
重要信息 - 请妥善保存！
====================================

服务器地址: $SERVER_DOMAIN

管理员登录：
用户名: admin
密码: admin123

MySQL root密码: $MYSQL_ROOT_PASSWORD
MySQL应用密码: $MYSQL_PASSWORD

请修改此文件的权限：chmod 600 .env.simple.backup
====================================
EOF

    chmod 600 .env.simple.backup

    print_warn "配置已保存到 .env.simple 和 .env.simple.backup"
}

# ==========================================
# 步骤5：启动 MySQL
# ==========================================
start_mysql() {
    print_step "启动 MySQL 容器..."

    # 停止旧容器
    docker stop petshop-mysql 2>/dev/null || true
    docker rm petshop-mysql 2>/dev/null || true

    # 启动 MySQL
    docker run -d \
        --name petshop-mysql \
        --restart unless-stopped \
        -e MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD \
        -e MYSQL_DATABASE=pet_shop_3_0 \
        -e MYSQL_USER=petshop \
        -e MYSQL_PASSWORD=$MYSQL_PASSWORD \
        -p 3306:3306 \
        -v petshop-mysql-data:/var/lib/mysql \
        -v $(pwd)/mysql-init:/docker-entrypoint-initdb.d:ro \
        mysql:8.0 \
        --character-set-server=utf8mb4 \
        --collation-server=utf8mb4_unicode_ci

    print_info "MySQL 容器已启动，等待初始化..."
    sleep 20

    # 等待 MySQL 就绪
    for i in {1..30}; do
        if docker exec petshop-mysql mysqladmin ping -h localhost -u root -p$MYSQL_ROOT_PASSWORD &> /dev/null; then
            print_info "MySQL 已就绪"
            break
        fi
        sleep 2
    done
}

# ==========================================
# 步骤6：构建应用
# ==========================================
build_app() {
    print_step "构建应用..."

    cd backend

    # 构建后端
    print_info "正在构建后端..."
    mvn clean package -DskipTests -q

    if [ ! -f target/pet-shop-backend-*.jar ]; then
        print_error "后端构建失败"
        exit 1
    fi

    JAR_FILE=$(ls target/pet-shop-backend-*.jar | head -n 1)
    print_info "后端构建成功: $(basename $JAR_FILE)"

    # 复制前端到后端静态资源目录
    print_info "正在构建前端..."
    cd ../frontend

    # 安装依赖
    if command -v pnpm &> /dev/null; then
        pnpm install
    else
        npm install
    fi

    # 构建
    VITE_API_BASE_URL=/api/v1 npm run build

    if [ ! -d dist ]; then
        print_error "前端构建失败"
        exit 1
    fi

    # 复制前端文件到后端 resources/static
    print_info "打包前端到后端..."
    cd ../backend
    mkdir -p src/main/resources/static
    cp -r ../frontend/dist/* src/main/resources/static/

    # 重新打包（包含前端静态文件）
    print_info "重新打包应用（包含前端）..."
    mvn package -DskipTests -q

    cd ../deployment

    print_info "应用构建完成"
}

# ==========================================
# 步骤7：部署应用
# ==========================================
deploy_app() {
    print_step "部署应用..."

    # 创建应用目录
    mkdir -p /opt/petshop
    mkdir -p /opt/petshop/uploads
    mkdir -p /opt/petshop/logs

    # 复制 JAR 包
    JAR_FILE=$(ls ../backend/target/pet-shop-backend-*.jar | head -n 1)
    cp $JAR_FILE /opt/petshop/pet-shop-backend.jar

    # 创建启动脚本
    cat > /opt/petshop/start.sh << 'STARTSCRIPT'
#!/bin/bash
cd /opt/petshop
export JAVA_OPTS="-Xms256m -Xmx512m"
nohup java $JAVA_OPTS \
  -Dserver.port=80 \
  -Dspring.profiles.active=simple \
  -Dspring.datasource.url=jdbc:mysql://localhost:3306/pet_shop_3_0?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai \
  -Dspring.datasource.username=petshop \
  -Dspring.datasource.password=MYSQL_PASSWORD_PLACEHOLDER \
  -Djwt.secret=JWT_SECRET_PLACEHOLDER \
  -Dfile.upload-dir=/opt/petshop/uploads \
  -Dfile.server-domain=SERVER_DOMAIN_PLACEHOLDER \
  -jar pet-shop-backend.jar \
  > logs/app.log 2>&1 &
echo $! > /opt/petshop/app.pid
STARTSCRIPT

    # 替换占位符
    sed -i "s/MYSQL_PASSWORD_PLACEHOLDER/$MYSQL_PASSWORD/g" /opt/petshop/start.sh
    sed -i "s/JWT_SECRET_PLACEHOLDER/$JWT_SECRET/g" /opt/petshop/start.sh
    sed -i "s|SERVER_DOMAIN_PLACEHOLDER|$SERVER_DOMAIN|g" /opt/petshop/start.sh

    chmod +x /opt/petshop/start.sh

    # 创建停止脚本
    cat > /opt/petshop/stop.sh << 'STOPSCRIPT'
#!/bin/bash
if [ -f /opt/petshop/app.pid ]; then
    pid=$(cat /opt/petshop/app.pid)
    kill $pid 2>/dev/null || true
    rm /opt/petshop/app.pid
fi
pkill -f pet-shop-backend.jar || true
STOPSCRIPT

    chmod +x /opt/petshop/stop.sh

    # 创建 systemd 服务
    cat > /etc/systemd/system/petshop.service << EOF
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

    systemctl daemon-reload
    print_info "应用部署完成"
}

# ==========================================
# 步骤8：启动应用
# ==========================================
start_app() {
    print_step "启动应用..."

    # 停止旧服务
    systemctl stop petshop 2>/dev/null || true
    /opt/petshop/stop.sh 2>/dev/null || true

    # 启动服务
    systemctl start petshop
    systemctl enable petshop

    print_info "等待应用启动..."
    sleep 15

    # 检查状态
    if systemctl is-active --quiet petshop; then
        print_info "应用服务运行正常"
    else
        print_warn "应用可能未启动，请检查日志"
    fi
}

# ==========================================
# 步骤9：验证部署
# ==========================================
verify() {
    print_step "验证部署..."

    # 检查 MySQL
    if docker exec petshop-mysql mysql -u petshop -p$MYSQL_PASSWORD pet_shop_3_0 -e "SELECT 1;" &> /dev/null; then
        print_info "✓ MySQL 连接成功"
    else
        print_warn "✗ MySQL 连接失败"
    fi

    # 检查应用
    if curl -s http://localhost/ &> /dev/null; then
        print_info "✓ 前端访问成功"
    else
        print_warn "✗ 前端访问失败"
    fi

    if curl -s http://localhost/api/v1/health &> /dev/null || curl -s http://localhost/api/v1/auth/login &> /dev/null; then
        print_info "✓ 后端 API 访问成功"
    else
        print_warn "✗ 后端 API 访问失败"
    fi

    # 检查80端口
    if netstat -tlnp 2>/dev/null | grep -q ":80 " || ss -tlnp 2>/dev/null | grep -q ":80 "; then
        print_info "✓ 80端口监听正常"
    else
        print_warn "✗ 80端口未监听"
    fi
}

# ==========================================
# 显示信息
# ==========================================
show_info() {
    print_info "================================"
    print_info "部署完成！"
    print_info "================================"
    echo ""
    print_info "访问地址: $SERVER_DOMAIN"
    echo ""
    print_info "默认登录："
    echo "  用户名: admin"
    echo "  密码: admin123"
    echo ""
    print_warn "请下载并保存 .env.simple.backup 文件！"
    echo ""
    print_info "常用命令："
    echo "  查看日志: tail -f /opt/petshop/logs/app.log"
    echo "  重启服务: systemctl restart petshop"
    echo "  停止服务: systemctl stop petshop"
    echo "  查看状态: systemctl status petshop"
    echo "  进入MySQL: docker exec -it petshop-mysql mysql -u petshop -p$MYSQL_PASSWORD pet_shop_3_0"
    echo ""
    print_info "================================"
}

# ==========================================
# 主流程
# ==========================================
main() {
    print_info "================================"
    print_info "宠物店管理系统 - 极简部署"
    print_info "架构: Spring Boot(80) + MySQL(Docker)"
    print_info "================================"
    echo ""

    check_root
    check_system
    install_dependencies
    install_java
    install_maven
    generate_config
    start_mysql
    build_app
    deploy_app
    start_app
    verify
    show_info

    print_info "部署完成！"
}

main
