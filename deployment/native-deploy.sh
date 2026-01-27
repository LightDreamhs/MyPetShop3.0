#!/bin/bash

# ==========================================
# 宠物店管理系统 - 原生部署脚本
# 前端+后端直接运行，MySQL使用Docker
# ==========================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印函数
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}===>${NC} $1"
}

# 检查是否为 root 用户
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "请使用 root 用户或 sudo 运行此脚本"
        exit 1
    fi
}

# 检查系统兼容性
check_system() {
    print_step "检查系统兼容性..."

    # 检查操作系统
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        print_info "检测到操作系统: $OS"
    else
        print_error "无法检测操作系统"
        exit 1
    fi

    # 检查系统架构
    ARCH=$(uname -m)
    if [ "$ARCH" != "x86_64" ]; then
        print_warn "系统架构 $ARCH 可能不完全兼容"
    fi
}

# 安装必要的软件
install_dependencies() {
    print_step "安装必要的软件..."

    # 更新软件包列表
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        apt update
        apt install -y curl wget git nginx ufw
    elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
        yum install -y curl wget git nginx
    fi

    print_info "基础软件安装完成"
}

# 安装 Docker
install_docker() {
    print_step "检查 Docker 安装状态..."

    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
        print_info "Docker 已安装: $DOCKER_VERSION"
    else
        print_info "正在安装 Docker..."
        curl -fsSL https://get.docker.com | bash -s docker
        print_info "Docker 安装完成"
    fi

    # 启动 Docker 服务
    systemctl start docker
    systemctl enable docker

    print_info "Docker 版本: $(docker --version)"
}

# 配置 Docker 镜像加速器
configure_docker_mirror() {
    print_step "配置 Docker 镜像加速器..."

    mkdir -p /etc/docker

    cat > /etc/docker/daemon.json << 'EOF'
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://dockerproxy.com",
    "https://docker.mirrors.ustc.edu.cn",
    "https://docker.nju.edu.cn"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

    systemctl daemon-reload
    systemctl restart docker
    sleep 3

    print_info "Docker 镜像加速器配置成功"
}

# 安装 JDK 17
install_jdk() {
    print_step "检查 JDK 17 安装状态..."

    if command -v java &> /dev/null; then
        JAVA_VERSION=$(java -version 2>&1 | head -n 1 | awk -F '"' '{print $2}')
        print_info "已安装 Java 版本: $JAVA_VERSION"

        if [[ $JAVA_VERSION == *"17"* ]]; then
            print_info "JDK 17 已安装"
            return 0
        fi
    fi

    print_info "正在安装 JDK 17..."
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        apt update
        apt install -y openjdk-17-jdk
        update-alternatives --set java /usr/lib/jvm/java-17-openjdk-amd64/bin/java
        update-alternatives --set javac /usr/lib/jvm/java-17-openjdk-amd64/bin/javac
    elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
        yum install -y java-17-openjdk-devel
    fi

    export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
    echo "export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64" >> ~/.bashrc
    echo "export PATH=\$JAVA_HOME/bin:\$PATH" >> ~/.bashrc

    print_info "JDK 17 安装完成: $(java -version 2>&1 | head -n 1)"
}

# 安装 Node.js 和 npm
install_nodejs() {
    print_step "检查 Node.js 安装状态..."

    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_info "Node.js 已安装: $NODE_VERSION"
    else
        print_info "正在安装 Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt install -y nodejs
        print_info "Node.js 安装完成: $(node --version)"
    fi

    # 安装 pnpm（推荐）或使用 npm
    if ! command -v pnpm &> /dev/null; then
        npm install -g pnpm
        print_info "pnpm 安装完成"
    fi
}

# 安装 Maven
install_maven() {
    print_step "检查 Maven 安装状态..."

    if command -v mvn &> /dev/null; then
        MAVEN_VERSION=$(mvn -version | head -n 1 | awk '{print $3}')
        print_info "Maven 已安装: $MAVEN_VERSION"
    else
        print_info "正在安装 Maven..."
        if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
            apt install -y maven
        elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
            yum install -y maven
        fi
        print_info "Maven 安装完成"
    fi
}

# 生成安全密钥
generate_secrets() {
    print_step "生成安全密钥..."

    if [ ! -f .env ]; then
        print_info "创建 .env 文件..."

        MYSQL_ROOT_PASSWORD=$(openssl rand -base64 16 | tr -d '/+=')
        MYSQL_PASSWORD=$(openssl rand -base64 16 | tr -d '/+=')
        JWT_SECRET=$(openssl rand -base64 32 | tr -d '/+=')

        # 智能获取服务器地址
        print_info "正在获取服务器地址..."

        HOSTNAME=$(hostname -f 2>/dev/null)
        LOCAL_IP=$(hostname -I | awk '{print $1}')
        PUBLIC_IP=$(curl -s --max-time 5 ifconfig.me 2>/dev/null || echo "")

        if [ -n "$PUBLIC_IP" ] && [[ ! "$PUBLIC_IP" =~ ^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.) ]]; then
            SERVER_IP=$PUBLIC_IP
            print_info "使用公网 IP: $SERVER_IP"
        else
            SERVER_IP=$LOCAL_IP
            print_info "使用本地 IP: $SERVER_IP"
        fi

        echo ""
        print_warn "检测到服务器地址: $SERVER_IP"
        echo ""
        read -p "你有域名吗？(y/N): " has_domain
        echo ""

        if [[ $has_domain =~ ^[Yy]$ ]]; then
            read -p "请输入域名 (例如: petshop.example.com): " user_domain
            if [ -n "$user_domain" ]; then
                SERVER_DOMAIN="http://$user_domain"
                print_info "将使用域名: $SERVER_DOMAIN"
            else
                SERVER_DOMAIN="http://$SERVER_IP"
                print_warn "域名未输入，将使用 IP: $SERVER_DOMAIN"
            fi
        else
            SERVER_DOMAIN="http://$SERVER_IP"
            print_info "将使用 IP 地址: $SERVER_DOMAIN"
        fi
        echo ""

        # 创建 .env 文件
        cat > .env << EOF
# ==========================================
# 宠物店管理系统 - 环境变量配置
# ==========================================
# 生成时间: $(date)

# MySQL 数据库配置
MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD
MYSQL_PASSWORD=$MYSQL_PASSWORD

# JWT 配置
JWT_SECRET=$JWT_SECRET
JWT_EXPIRATION=7200

# 服务器配置
SERVER_DOMAIN=$SERVER_DOMAIN
SERVER_IP=$SERVER_IP

# 文件上传配置
FILE_UPLOAD_DIR=/var/www/petshop/uploads
MAX_FILE_SIZE=5

# 应用配置
SPRING_PROFILES_ACTIVE=prod
TZ=Asia/Shanghai
EOF

        print_info "环境变量文件已创建: .env"

        # 保存密码信息
        cat > .env.backup << EOF
# ==========================================
# 重要信息 - 请妥善保存！
# ==========================================

# 生成时间: $(date)
# 服务器IP: $SERVER_IP
# 服务器域名: $SERVER_DOMAIN

# MySQL root 密码
MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD

# MySQL 应用密码
MYSQL_PASSWORD=$MYSQL_PASSWORD

# JWT 密钥
JWT_SECRET=$JWT_SECRET

# 管理员登录账号
用户名: admin
密码: admin123

# 系统访问地址
$SERVER_DOMAIN

# 请将此文件保存在安全的地方！
EOF

        chmod 600 .env.backup

        print_warn "================================"
        print_warn "重要信息已保存到 .env.backup 文件"
        print_warn "请下载并妥善保管此文件！"
        print_warn "================================"

    else
        print_info ".env 文件已存在，跳过生成"
    fi

    # 读取环境变量
    source .env
}

# 配置防火墙
configure_firewall() {
    print_step "配置防火墙..."

    if command -v ufw &> /dev/null; then
        print_info "配置 UFW 防火墙..."
        ufw allow 22/tcp &> /dev/null || true
        ufw allow 80/tcp &> /dev/null || true
        ufw allow 443/tcp &> /dev/null || true
        ufw allow 8080/tcp &> /dev/null || true
        print_info "防火墙规则已添加"
    else
        print_warn "未检测到 UFW，请手动配置防火墙规则"
    fi
}

# 创建应用目录
create_directories() {
    print_step "创建应用目录..."

    mkdir -p /var/www/petshop
    mkdir -p /var/www/petshop/backend
    mkdir -p /var/www/petshop/frontend
    mkdir -p /var/www/petshop/uploads
    mkdir -p /var/www/petshop/logs

    print_info "应用目录创建完成"
}

# 启动 MySQL 容器
start_mysql() {
    print_step "启动 MySQL 容器..."

    # 停止并删除旧容器
    docker stop petshop-mysql &> /dev/null || true
    docker rm petshop-mysql &> /dev/null || true

    # 启动 MySQL 容器
    docker run -d \
        --name petshop-mysql \
        --restart unless-stopped \
        -e MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD} \
        -e MYSQL_DATABASE=pet_shop_3_0 \
        -e MYSQL_USER=petshop \
        -e MYSQL_PASSWORD=${MYSQL_PASSWORD} \
        -e TZ=Asia/Shanghai \
        -p 3306:3306 \
        -v mysql-data:/var/lib/mysql \
        -v $(pwd)/mysql-init:/docker-entrypoint-initdb.d:ro \
        mysql:8.0 \
        --character-set-server=utf8mb4 \
        --collation-server=utf8mb4_unicode_ci \
        --default-authentication-plugin=mysql_native_password

    print_info "MySQL 容器已启动"

    # 等待 MySQL 就绪
    print_info "等待 MySQL 就绪..."
    sleep 15

    # 检查 MySQL 连接
    for i in {1..30}; do
        if docker exec petshop-mysql mysqladmin ping -h localhost -u root -p${MYSQL_ROOT_PASSWORD} &> /dev/null; then
            print_info "MySQL 已就绪"
            break
        fi
        sleep 2
    done
}

# 构建后端
build_backend() {
    print_step "构建后端应用..."

    cd ../backend

    print_info "正在下载依赖并编译..."
    mvn clean package -DskipTests -q

    if [ -f target/pet-shop-backend-*.jar ]; then
        # 复制 JAR 包到部署目录
        JAR_FILE=$(ls target/pet-shop-backend-*.jar | head -n 1)
        cp $JAR_FILE /var/www/petshop/backend/pet-shop-backend.jar

        print_info "后端构建成功"
        ls -lh /var/www/petshop/backend/pet-shop-backend.jar
    else
        print_error "后端构建失败"
        exit 1
    fi

    cd ../deployment
}

# 配置后端服务
setup_backend_service() {
    print_step "配置后端服务..."

    # 创建 systemd 服务文件
    cat > /etc/systemd/system/petshop-backend.service << EOF
[Unit]
Description=Pet Shop Backend Service
After=network.target mysql.service
Requires=petshop-mysql.container

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/petshop/backend
Environment="SPRING_PROFILES_ACTIVE=prod"
Environment="SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/pet_shop_3_0?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true"
Environment="SPRING_DATASOURCE_USERNAME=petshop"
Environment="SPRING_DATASOURCE_PASSWORD=${MYSQL_PASSWORD}"
Environment="JWT_SECRET=${JWT_SECRET}"
Environment="JWT_EXPIRATION=7200"
Environment="FILE_UPLOAD_DIR=/var/www/petshop/uploads"
Environment="FILE_SERVERDOMAIN=${SERVER_DOMAIN}"
Environment="TZ=Asia/Shanghai"
ExecStart=/usr/bin/java -jar /var/www/petshop/backend/pet-shop-backend.jar
Restart=always
RestartSec=10
StandardOutput=append:/var/www/petshop/logs/backend.log
StandardError=append:/var/www/petshop/logs/backend-error.log

[Install]
WantedBy=multi-user.target
EOF

    # 重载 systemd
    systemctl daemon-reload

    print_info "后端服务配置完成"
}

# 构建前端
build_frontend() {
    print_step "构建前端应用..."

    cd ../frontend

    # 安装依赖
    print_info "安装前端依赖..."
    if command -v pnpm &> /dev/null; then
        pnpm install
    else
        npm install
    fi

    # 构建生产版本
    print_info "构建前端生产版本..."
    if command -v pnpm &> /dev/null; then
        VITE_API_BASE_URL=/api/v1 pnpm build
    else
        VITE_API_BASE_URL=/api/v1 npm run build
    fi

    if [ -d dist ]; then
        # 复制构建产物到部署目录
        cp -r dist/* /var/www/petshop/frontend/

        print_info "前端构建成功"
    else
        print_error "前端构建失败"
        exit 1
    fi

    cd ../deployment
}

# 配置 Nginx
setup_nginx() {
    print_step "配置 Nginx..."

    # 复制 Nginx 配置
    cp nginx-native.conf /etc/nginx/sites-available/petshop

    # 创建符号链接
    ln -sf /etc/nginx/sites-available/petshop /etc/nginx/sites-enabled/

    # 删除默认站点
    rm -f /etc/nginx/sites-enabled/default

    # 测试配置
    nginx -t

    # 重启 Nginx
    systemctl restart nginx
    systemctl enable nginx

    print_info "Nginx 配置完成"
}

# 启动服务
start_services() {
    print_step "启动服务..."

    # 启动后端服务
    systemctl start petshop-backend
    systemctl enable petshop-backend

    print_info "等待后端服务启动..."
    sleep 10

    # 检查服务状态
    print_info "检查服务状态..."
    systemctl status petshop-backend --no-pager -l
}

# 验证部署
verify_deployment() {
    print_step "验证部署..."

    # 检查 MySQL
    if docker exec petshop-mysql mysql -u petshop -p${MYSQL_PASSWORD} pet_shop_3_0 -e "SELECT 1;" &> /dev/null; then
        print_info "MySQL 连接成功"
    else
        print_warn "MySQL 连接失败"
    fi

    # 检查后端
    if curl -s http://localhost:8080/api/v1/health &> /dev/null || curl -s http://localhost:8080/api/v1/auth/login &> /dev/null; then
        print_info "后端服务运行正常"
    else
        print_warn "后端服务可能未启动，请检查日志"
    fi

    # 检查前端
    if curl -s http://localhost/ &> /dev/null; then
        print_info "前端服务运行正常"
    else
        print_warn "前端服务可能未启动"
    fi

    # 显示容器状态
    print_info "MySQL 容器状态："
    docker ps | grep petshop-mysql
}

# 显示部署信息
show_info() {
    print_info "================================"
    print_info "原生部署完成！"
    print_info "================================"
    echo ""
    print_info "访问地址:"
    echo "  $SERVER_DOMAIN"
    echo ""
    print_info "默认登录账号:"
    echo "  用户名: admin"
    echo "  密码: admin123"
    echo ""
    print_warn "重要提示:"
    print_warn "1. 请立即下载 .env.backup 文件并妥善保管"
    print_warn "2. 首次登录后请立即修改管理员密码"
    print_warn "3. 请配置云服务商安全组规则"
    print_warn "4. 建议定期备份数据"
    echo ""
    print_info "常用命令:"
    echo "  查看后端日志: journalctl -u petshop-backend -f"
    echo "  查看后端文件日志: tail -f /var/www/petshop/logs/backend.log"
    echo "  重启后端: systemctl restart petshop-backend"
    echo "  查看前端日志: tail -f /var/log/nginx/access.log"
    echo "  重启 Nginx: systemctl restart nginx"
    echo "  查看 MySQL: docker exec -it petshop-mysql mysql -u petshop -p${MYSQL_PASSWORD} pet_shop_3_0"
    echo ""
    print_info "文件位置:"
    echo "  后端 JAR: /var/www/petshop/backend/pet-shop-backend.jar"
    echo "  前端文件: /var/www/petshop/frontend/"
    echo "  上传文件: /var/www/petshop/uploads/"
    echo "  日志目录: /var/www/petshop/logs/"
    echo ""
    print_info "================================"
}

# 主函数
main() {
    print_info "================================"
    print_info "宠物店管理系统 - 原生部署脚本"
    print_info "================================"
    echo ""

    check_root
    check_system
    install_dependencies
    install_docker
    configure_docker_mirror
    install_jdk
    install_nodejs
    install_maven
    configure_firewall
    generate_secrets
    create_directories
    start_mysql
    build_backend
    setup_backend_service
    build_frontend
    setup_nginx
    start_services
    verify_deployment
    show_info

    print_info "部署脚本执行完成！"
}

# 执行主函数
main
