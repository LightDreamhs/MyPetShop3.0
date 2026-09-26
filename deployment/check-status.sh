#!/bin/bash

# ==========================================
# MyPetShop3.0 状态检查脚本
# ==========================================
# 用于快速检查系统各组件的版本和状态
# ==========================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  MyPetShop3.0 系统状态检查${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# ==========================================
# 1. Git 版本信息
# ==========================================
echo -e "${BLUE}[1] Git 版本信息${NC}"
echo "----------------------------------------"
if [ -d "../.git" ]; then
    cd ..
    CURRENT_COMMIT=$(git rev-parse --short HEAD)
    CURRENT_BRANCH=$(git branch --show-current)
    LAST_UPDATE=$(git log -1 --format="%ci" HEAD)
    REMOTE_COMMIT=$(git rev-parse --short origin/main 2>/dev/null || echo "未知")

    echo "当前分支: ${GREEN}$CURRENT_BRANCH${NC}"
    echo "当前版本: ${GREEN}$CURRENT_COMMIT${NC}"
    echo "远程版本: $REMOTE_COMMIT"
    echo "最后更新: $LAST_UPDATE"

    if [ "$CURRENT_COMMIT" = "$REMOTE_COMMIT" ]; then
        echo -e "代码状态: ${GREEN}✓ 已是最新版本${NC}"
    else
        echo -e "代码状态: ${YELLOW}⚠ 有新版本可用${NC}"
        echo "  请运行: ./update.sh"
    fi
    cd deployment
else
    echo -e "${RED}✗ 不是Git仓库${NC}"
fi
echo ""

# ==========================================
# 2. Docker 镜像版本
# ==========================================
echo -e "${BLUE}[2] Docker 镜像信息${NC}"
echo "----------------------------------------"

# 后端镜像
if docker images | grep -q deployment-backend; then
    BACKEND_IMAGE=$(docker images | grep deployment-backend | awk '{print $3}')
    BACKEND_CREATED=$(docker inspect deployment-backend --format='{{.Created}}' 2>/dev/null || echo "未知")
    BACKEND_SIZE=$(docker images | grep deployment-backend | awk '{print $5" "$6}')
    echo -e "后端镜像: ${GREEN}$BACKEND_IMAGE${NC}"
    echo "  创建时间: $BACKEND_CREATED"
    echo "  镜像大小: $BACKEND_SIZE"
else
    echo -e "${RED}✗ 后端镜像不存在${NC}"
fi
echo ""

# 前端镜像
if docker images | grep -q deployment-frontend; then
    FRONTEND_IMAGE=$(docker images | grep deployment-frontend | awk '{print $3}')
    FRONTEND_CREATED=$(docker inspect deployment-frontend --format='{{.Created}}' 2>/dev/null || echo "未知")
    FRONTEND_SIZE=$(docker images | grep deployment-frontend | awk '{print $5" "$6}')
    echo -e "前端镜像: ${GREEN}$FRONTEND_IMAGE${NC}"
    echo "  创建时间: $FRONTEND_CREATED"
    echo "  镜像大小: $FRONTEND_SIZE"
else
    echo -e "${RED}✗ 前端镜像不存在${NC}"
fi
echo ""

# ==========================================
# 3. 容器运行状态
# ==========================================
echo -e "${BLUE}[3] 容器运行状态${NC}"
echo "----------------------------------------"

if docker-compose ps | grep -q "Up"; then
    docker-compose ps
    echo ""

    # 统计状态
    RUNNING=$(docker-compose ps | grep -c "Up" || true)
    HEALTHY=$(docker-compose ps | grep -c "healthy" || true)
    UNHEALTHY=$(docker-compose ps | grep -c "unhealthy" || true)
    EXITED=$(docker-compose ps | grep -c "Exited" || true)

    echo -e "运行中: ${GREEN}$RUNNING${NC}"
    echo -e "健康: ${GREEN}$HEALTHY${NC}"
    [ "$UNHEALTHY" -gt 0 ] && echo -e "不健康: ${RED}$UNHEALTHY${NC}"
    [ "$EXITED" -gt 0 ] && echo -e "已停止: ${YELLOW}$EXITED${NC}"
else
    echo -e "${RED}✗ 没有容器在运行${NC}"
fi
echo ""

# ==========================================
# 4. Nginx 配置验证
# ==========================================
echo -e "${BLUE}[4] Nginx 配置验证${NC}"
echo "----------------------------------------"

if docker ps | grep -q petshop-frontend; then
    NGINX_UPLOADS_CONFIG=$(docker exec petshop-frontend cat /etc/nginx/conf.d/default.conf 2>/dev/null | grep -A 5 "location /uploads" || echo "未找到配置")

    if echo "$NGINX_UPLOADS_CONFIG" | grep -q "proxy_pass.*backend:8080"; then
        echo -e "Nginx /uploads 配置: ${GREEN}✓ 正确${NC}"
        echo "$NGINX_UPLOADS_CONFIG" | head -3 | sed 's/^/  /'
    else
        echo -e "Nginx /uploads 配置: ${RED}✗ 配置缺失或错误${NC}"
    fi
else
    echo -e "${YELLOW}⚠ 前端容器未运行，无法检查Nginx配置${NC}"
fi
echo ""

# ==========================================
# 5. 后端配置验证
# ==========================================
echo -e "${BLUE}[5] 后端配置验证${NC}"
echo "----------------------------------------"

if docker ps | grep -q petshop-backend; then
    # 检查静态资源映射
    BACKEND_LOGS=$(docker logs petshop-backend 2>&1 | grep -i "resource\|mapping" | tail -5 || echo "无相关日志")

    if [ -n "$BACKEND_LOGS" ]; then
        echo -e "静态资源映射配置:"
        echo "$BACKEND_LOGS" | sed 's/^/  /'
    else
        echo -e "${YELLOW}⚠ 未找到静态资源映射日志${NC}"
        echo "  建议检查后端日志: docker logs petshop-backend"
    fi

    # 检查环境变量
    echo ""
    echo "环境变量:"
    docker exec petshop-backend env | grep -E "SERVER_DOMAIN|FILE_UPLOAD|SPRING_PROFILES" | sed 's/^/  /'
else
    echo -e "${YELLOW}⚠ 后端容器未运行${NC}"
fi
echo ""

# ==========================================
# 6. 数据持久化检查
# ==========================================
echo -e "${BLUE}[6] 数据持久化检查${NC}"
echo "----------------------------------------"

# MySQL 数据卷
if docker volume ls | grep -q petshop_mysql-data; then
    MYSQL_SIZE=$(docker volume inspect petshop_mysql-data --format='{{.Usage}}' 2>/dev/null || echo "未知")
    echo -e "MySQL数据卷: ${GREEN}✓ 存在${NC} ($MYSQL_SIZE)"
else
    echo -e "${RED}✗ MySQL数据卷不存在${NC}"
fi

# 上传文件数据卷
if docker volume ls | grep -q petshop_upload-data; then
    UPLOAD_SIZE=$(docker volume inspect petshop_upload-data --format='{{.Usage}}' 2>/dev/null || echo "未知")
    echo -e "上传文件数据卷: ${GREEN}✓ 存在${NC} ($UPLOAD_SIZE)"

    # 统计文件数量
    if docker ps | grep -q petshop-backend; then
        FILE_COUNT=$(docker exec petshop-backend ls -1 /app/uploads/images/ 2>/dev/null | wc -l)
        echo "  上传文件数量: $FILE_COUNT"
    fi
else
    echo -e "${RED}✗ 上传文件数据卷不存在${NC}"
fi
echo ""

# ==========================================
# 7. 数据库数据检查
# ==========================================
echo -e "${BLUE}[7] 数据库数据检查${NC}"
echo "----------------------------------------"

if docker ps | grep -q petshop-mysql; then
    # 读取密码
    if [ -f .env ]; then
        source .env
    fi

    # 检查数据库
    TABLES=$(docker exec petshop-mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD:-root} -e "USE pet_shop_3_0; SHOW TABLES;" 2>/dev/null | tail -n +2 || echo "")

    if [ -n "$TABLES" ]; then
        TABLE_COUNT=$(echo "$TABLES" | wc -l)
        echo -e "数据库状态: ${GREEN}✓ 正常${NC}"
        echo "  数据表数量: $TABLE_COUNT"
        echo "  数据表列表:"
        echo "$TABLES" | sed 's/^/    /'

        # 检查用户数据
        USER_COUNT=$(docker exec petshop-mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD:-root} -e "SELECT COUNT(*) FROM pet_shop_3_0.users;" -N -s 2>/dev/null || echo "0")
        echo "  用户数量: $USER_COUNT"
    else
        echo -e "${RED}✗ 数据库无数据或未初始化${NC}"
    fi
else
    echo -e "${YELLOW}⚠ MySQL容器未运行${NC}"
fi
echo ""

# ==========================================
# 8. 最近错误日志
# ==========================================
echo -e "${BLUE}[8] 最近错误日志${NC}"
echo "----------------------------------------"

echo "后端错误（最近5条）:"
BACKEND_ERRORS=$(docker logs petshop-backend 2>&1 | grep -i "error\|exception" | tail -5 || echo "无错误")
if [ "$BACKEND_ERRORS" = "无错误" ]; then
    echo -e "  ${GREEN}✓ 无错误${NC}"
else
    echo "$BACKEND_ERRORS" | sed 's/^/  /'
fi
echo ""

echo "前端错误（最近5条）:"
FRONTEND_ERRORS=$(docker logs petshop-frontend 2>&1 | grep -i "error" | tail -5 || echo "无错误")
if [ "$FRONTEND_ERRORS" = "无错误" ]; then
    echo -e "  ${GREEN}✓ 无错误${NC}"
else
    echo "$FRONTEND_ERRORS" | sed 's/^/  /'
fi
echo ""

# ==========================================
# 9. 访问地址
# ==========================================
echo -e "${BLUE}[9] 访问地址${NC}"
echo "----------------------------------------"

# 获取服务器IP
SERVER_IP=$(hostname -I | awk '{print $1}')
if [ -z "$SERVER_IP" ]; then
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "你的服务器IP")
fi

echo -e "前端地址: ${GREEN}http://$SERVER_IP${NC}"
echo -e "后端API: ${CYAN}http://$SERVER_IP/api/v1${NC}"
echo -e "健康检查: ${CYAN}http://$SERVER_IP/health${NC}"
echo ""

# ==========================================
# 10. 快速命令提示
# ==========================================
echo -e "${BLUE}[10] 常用命令${NC}"
echo "----------------------------------------"
echo "更新系统:   ${GREEN}./update.sh${NC}"
echo "查看日志:   ${GREEN}docker-compose logs -f${NC}"
echo "重启服务:   ${GREEN}docker-compose restart${NC}"
echo "停止服务:   ${GREEN}docker-compose down${NC}"
echo "查看状态:   ${GREEN}docker-compose ps${NC}"
echo ""

echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN}状态检查完成！${NC}"
echo -e "${CYAN}========================================${NC}"
