#!/bin/bash

# ==========================================
# 宠物店管理系统 - 一键部署脚本
# ==========================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# 检查是否为 root 用户
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "请使用 root 用户或 sudo 运行此脚本"
        exit 1
    fi
}

# 检查系统兼容性
check_system() {
    print_info "检查系统兼容性..."

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

# 安装 Docker
install_docker() {
    print_info "检查 Docker 安装状态..."

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

# 安装 Docker Compose
install_docker_compose() {
    print_info "检查 Docker Compose 安装状态..."

    if docker compose version &> /dev/null; then
        COMPOSE_VERSION=$(docker compose version --short)
        print_info "Docker Compose 已安装: $COMPOSE_VERSION"
    else
        print_info "正在安装 Docker Compose..."
        if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
            apt update
            apt install -y docker-compose
        elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
            yum install -y docker-compose
        else
            print_error "不支持的操作系统: $OS"
            exit 1
        fi
        print_info "Docker Compose 安装完成"
    fi

    print_info "Docker Compose 版本: $(docker compose version --short)"
}

# 配置 Docker 镜像加速器
configure_docker_mirror() {
    print_info "配置 Docker 镜像加速器..."

    # 创建 Docker 配置目录
    mkdir -p /etc/docker

    # 备份原有配置（如果存在）
    if [ -f /etc/docker/daemon.json ]; then
        cp /etc/docker/daemon.json /etc/docker/daemon.json.bak
        print_warn "已备份原 Docker 配置文件"
    fi

    # 配置国内镜像加速器
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

    # 重启 Docker 服务
    print_info "重启 Docker 服务..."
    systemctl daemon-reload
    systemctl restart docker

    # 等待 Docker 启动
    sleep 3

    # 验证配置
    if systemctl is-active --quiet docker; then
        print_info "Docker 镜像加速器配置成功 ✅"
        docker info | grep -A 5 "Registry Mirrors" || print_info "镜像加速器已生效"
    else
        print_error "Docker 启动失败，正在恢复备份..."
        if [ -f /etc/docker/daemon.json.bak ]; then
            mv /etc/docker/daemon.json.bak /etc/docker/daemon.json
            systemctl restart docker
        fi
    fi
}

# 安装 JDK 17
install_jdk() {
    print_info "检查 JDK 17 安装状态..."

    if command -v java &> /dev/null; then
        JAVA_VERSION=$(java -version 2>&1 | head -n 1 | awk -F '"' '{print $2}')
        print_info "已安装 Java 版本: $JAVA_VERSION"

        # 检查是否为 JDK 17
        if [[ $JAVA_VERSION == *"17"* ]]; then
            print_info "JDK 17 已安装"
            return 0
        else
            print_warn "当前 Java 版本不是 JDK 17，需要升级"
        fi
    fi

    print_info "正在安装 JDK 17..."
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        apt update
        # 安装 OpenJDK 17
        apt install -y openjdk-17-jdk

        # 设置 Java 17 为默认版本
        update-alternatives --set java /usr/lib/jvm/java-17-openjdk-amd64/bin/java
        update-alternatives --set javac /usr/lib/jvm/java-17-openjdk-amd64/bin/javac

    elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
        yum install -y java-17-openjdk-devel
    else
        print_error "不支持的操作系统: $OS"
        exit 1
    fi

    # 验证安装
    JAVA_VERSION=$(java -version 2>&1 | head -n 1 | awk -F '"' '{print $2}')
    print_info "JDK 17 安装完成: $JAVA_VERSION"

    # 设置 JAVA_HOME 环境变量
    export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
    echo "export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64" >> ~/.bashrc
    echo "export PATH=\$JAVA_HOME/bin:\$PATH" >> ~/.bashrc
}

# 安装 Maven
install_maven() {
    print_info "检查 Maven 安装状态..."

    if command -v mvn &> /dev/null; then
        MAVEN_VERSION=$(mvn -version | head -n 1 | awk '{print $3}')
        print_info "Maven 已安装: $MAVEN_VERSION"
    else
        print_info "正在安装 Maven..."
        if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
            apt update
            apt install -y maven
        elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
            yum install -y maven
        fi
        print_info "Maven 安装完成"
    fi
}

# 配置防火墙
configure_firewall() {
    print_info "配置防火墙..."

    if command -v ufw &> /dev/null; then
        print_info "配置 UFW 防火墙..."
        ufw allow 22/tcp &> /dev/null || true
        ufw allow 80/tcp &> /dev/null || true
        ufw allow 443/tcp &> /dev/null || true
        print_info "防火墙规则已添加"
    else
        print_warn "未检测到 UFW，请手动配置防火墙规则"
    fi
}

# 生成安全密钥
generate_secrets() {
    print_info "生成安全密钥..."

    if [ ! -f .env ]; then
        print_info "创建 .env 文件..."

        # 生成随机密码
        MYSQL_ROOT_PASSWORD=$(openssl rand -base64 16 | tr -d '/+=')
        MYSQL_PASSWORD=$(openssl rand -base64 16 | tr -d '/+=')
        JWT_SECRET=$(openssl rand -base64 32 | tr -d '/+=')

        # 智能获取服务器地址（多种方法）
        print_info "正在获取服务器地址..."

        # 方法1: 检查主机名（可能是域名）
        HOSTNAME=$(hostname -f 2>/dev/null)

        # 方法2: 检查网卡绑定的公网IP
        LOCAL_IP=$(hostname -I | awk '{print $1}')

        # 方法3: 从外部服务获取公网IP
        PUBLIC_IP=$(curl -s --max-time 5 ifconfig.me 2>/dev/null || \
                    curl -s --max-time 5 icanhazip.com 2>/dev/null || \
                    curl -s --max-time 5 ipinfo.io/ip 2>/dev/null || \
                    echo "")

        # 方法4: 从网络接口获取主要IP
        INTERFACE_IP=$(ip route get 1.1.1.1 2>/dev/null | grep -oP 'src \K\S+' || echo "")

        # 选择最佳的 IP 地址
        if [ -n "$PUBLIC_IP" ] && [[ ! "$PUBLIC_IP" =~ ^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.) ]]; then
            # 优先使用公网 IP（排除内网IP）
            SERVER_IP=$PUBLIC_IP
            print_info "使用公网 IP: $SERVER_IP"
        elif [ -n "$INTERFACE_IP" ]; then
            # 使用网络接口 IP
            SERVER_IP=$INTERFACE_IP
            print_info "使用网络接口 IP: $SERVER_IP"
        elif [ -n "$LOCAL_IP" ]; then
            # 使用本地 IP
            SERVER_IP=$LOCAL_IP
            print_warn "使用本地 IP: $SERVER_IP"
        else
            # 兜底使用占位符
            SERVER_IP="your-server-ip"
            print_warn "无法自动获取 IP，使用占位符: $SERVER_IP"
        fi

        # 询问用户是否有域名
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

# 文件上传配置
FILE_UPLOAD_DIR=/app/uploads/images
MAX_FILE_SIZE=5

# 应用配置
SPRING_PROFILES_ACTIVE=production
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
}

# 构建后端 JAR 包
build_backend() {
    print_info "构建后端 JAR 包..."

    cd ../backend

    print_info "正在下载依赖并编译..."
    mvn clean package -DskipTests -q

    if [ -f target/pet-shop-backend-*.jar ]; then
        print_info "后端构建成功"
        ls -lh target/*.jar
    else
        print_error "后端构建失败"
        exit 1
    fi

    cd ../deployment
}

# 启动服务
start_services() {
    print_info "启动 Docker 服务..."

    # 停止旧容器
    docker compose down &> /dev/null || true

    # 构建并启动
    print_info "正在构建镜像并启动容器..."
    docker compose up -d --build

    print_info "等待服务启动..."
    sleep 10

    # 检查服务状态
    print_info "检查服务状态..."
    docker compose ps
}

# 验证部署
verify_deployment() {
    print_info "验证部署..."

    # 等待服务健康检查通过
    print_info "等待服务健康检查（最多等待180秒）..."

    for i in {1..18}; do
        sleep 10

        HEALTHY=true

        # 检查 MySQL
        if ! docker exec petshop-mysql mysqladmin ping -h localhost -u root -p${MYSQL_ROOT_PASSWORD} &> /dev/null; then
            print_warn "MySQL 未就绪"
            HEALTHY=false
        else
            # 检查数据库是否已初始化
            if ! docker exec petshop-mysql mysql -u petshop -p${MYSQL_PASSWORD} pet_shop_3_0 -e "SHOW TABLES;" &> /dev/null; then
                print_warn "数据库未初始化，尝试手动导入..."
                # 手动导入初始化脚本
                if [ -f "mysql-init/init.sql" ]; then
                    cat mysql-init/init.sql | docker exec -i petshop-mysql mysql -u petshop -p${MYSQL_PASSWORD} pet_shop_3_0
                    sleep 5
                fi
            fi
        fi

        # 检查后端（检查端口是否开放）
        if ! nc -z localhost 8080 &> /dev/null; then
            print_warn "后端未就绪"
            HEALTHY=false
        fi

        # 检查前端
        if ! curl -s http://localhost/ &> /dev/null; then
            print_warn "前端未就绪"
            HEALTHY=false
        fi

        if [ "$HEALTHY" = true ]; then
            print_info "所有服务已就绪！"
            break
        fi
    done

    if [ "$HEALTHY" = false ]; then
        print_warn "某些服务可能未完全启动，请稍后检查"
    fi

    # 显示容器状态
    print_info "容器状态："
    docker compose ps
}

# 显示部署信息
show_info() {
    print_info "================================"
    print_info "部署完成！"
    print_info "================================"
    echo ""
    print_info "访问地址:"
    if [ -f .env ]; then
        grep "SERVER_DOMAIN" .env
    fi
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
    echo "  查看服务状态: docker compose ps"
    echo "  查看日志: docker compose logs -f"
    echo "  重启服务: docker compose restart"
    echo "  停止服务: docker compose down"
    echo ""
    print_info "详细文档请查看: README.md"
    print_info "================================"
}

# 主函数
main() {
    print_info "================================"
    print_info "宠物店管理系统 - 一键部署脚本"
    print_info "================================"
    echo ""

    check_root
    check_system
    install_docker
    install_docker_compose
    configure_docker_mirror
    install_jdk
    install_maven
    configure_firewall
    generate_secrets
    build_backend
    start_services
    verify_deployment
    show_info

    print_info "部署脚本执行完成！"
}

# 执行主函数
main
