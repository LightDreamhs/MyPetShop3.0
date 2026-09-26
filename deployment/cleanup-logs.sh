#!/bin/bash

# ==========================================
# MyPetShop3.0 日志清理脚本
# ==========================================
# 用途：定期清理容器日志，防止占用过多磁盘空间
# 使用：手动执行或添加到 crontab 定时执行
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

# 配置
LOG_RETENTION_DAYS=${LOG_RETENTION_DAYS:-7}  # 日志保留天数
DOCKER_LOG_MAX_SIZE=${DOCKER_LOG_MAX_SIZE:-100m}  # Docker 容器日志最大大小

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  MyPetShop3.0 日志清理${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "清理策略："
echo -e "  - Nginx 访问日志保留 ${YELLOW}$LOG_RETENTION_DAYS${NC} 天"
echo -e "  - Nginx 错误日志保留 ${YELLOW}$LOG_RETENTION_DAYS${NC} 天"
echo -e "  - Docker 容器日志限制为 ${YELLOW}$DOCKER_LOG_MAX_SIZE${NC}"
echo ""

# ==========================================
# 1. 清理 Nginx 日志
# ==========================================
echo -e "${BLUE}[1] 清理 Nginx 日志${NC}"
echo "----------------------------------------"

if docker ps | grep -q petshop-frontend; then
    # 清理访问日志
    ACCESS_LOGS_CLEANED=$(docker exec petshop-frontend sh -c "find /var/log/nginx -name 'access.log*' -mtime +$LOG_RETENTION_DAYS -delete 2>/dev/null && echo 'done'" || echo "failed")

    if [ "$ACCESS_LOGS_CLEANED" = "done" ]; then
        echo -e "Nginx 访问日志: ${GREEN}✓ 已清理 $LOG_RETENTION_DAYS 天前的日志${NC}"
    else
        echo -e "Nginx 访问日志: ${YELLOW}⚠ 没有需要清理的日志${NC}"
    fi

    # 清理错误日志
    ERROR_LOGS_CLEANED=$(docker exec petshop-frontend sh -c "find /var/log/nginx -name 'error.log*' -mtime +$LOG_RETENTION_DAYS -delete 2>/dev/null && echo 'done'" || echo "failed")

    if [ "$ERROR_LOGS_CLEANED" = "done" ]; then
        echo -e "Nginx 错误日志: ${GREEN}✓ 已清理 $LOG_RETENTION_DAYS 天前的日志${NC}"
    else
        echo -e "Nginx 错误日志: ${YELLOW}⚠ 没有需要清理的日志${NC}"
    fi

    # 清空当前日志（可选，根据需要启用）
    # docker exec petshop-frontend sh -c "echo '> /var/log/nginx/access.log' | sh"
    # docker exec petshop-frontend sh -c "echo '> /var/log/nginx/error.log' | sh"
else
    echo -e "${RED}✗ 前端容器未运行${NC}"
fi
echo ""

# ==========================================
# 2. 清理 Docker 容器日志
# ==========================================
echo -e "${BLUE}[2] 清理 Docker 容器日志${NC}"
echo "----------------------------------------"

# 检查是否配置了日志大小限制
if docker-compose ps | grep -q "Up"; then
    # 清空当前容器的日志
    for container in petshop-backend petshop-frontend petshop-mysql; do
        if docker ps | grep -q "$container"; then
            # 获取当前日志大小
            LOG_SIZE=$(docker inspect $container --format='{{.LogPath}}' 2>/dev/null | xargs du -sh 2>/dev/null | awk '{print $1}' || echo "0")

            if [ "$LOG_SIZE" != "0" ]; then
                # 清空日志
                docker inspect $container --format='{{.LogPath}}' 2>/dev/null | xargs truncate -s 0 2>/dev/null
                echo -e "$container: ${GREEN}✓ 已清理（原大小: $LOG_SIZE）${NC}"
            else
                echo -e "$container: ${YELLOW}⚠ 日志文件为空${NC}"
            fi
        fi
    done
else
    echo -e "${RED}✗ 没有容器在运行${NC}"
fi
echo ""

# ==========================================
# 3. 显示清理后的磁盘使用情况
# ==========================================
echo -e "${BLUE}[3] 清理后磁盘使用情况${NC}"
echo "----------------------------------------"

# 系统磁盘使用
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5 " 已使用（剩余 " $4 "）"}')
echo -e "系统根目录: ${CYAN}$DISK_USAGE${NC}"

# Docker 卷使用
echo ""
echo "Docker 卷使用情况："
docker volume ls | grep petshop | while read -r line; do
    VOLUME_NAME=$(echo "$line" | awk '{print $2}')
    VOLUME_SIZE=$(docker volume inspect $VOLUME_NAME --format='{{.Usage}}' 2>/dev/null || echo "未知")
    echo -e "  $VOLUME_NAME: ${CYAN}$VOLUME_SIZE${NC}"
done
echo ""

# ==========================================
# 4. 提示添加定时任务
# ==========================================
echo -e "${BLUE}[4] 定时任务配置提示${NC}"
echo "----------------------------------------"
echo -e "${YELLOW}如需定期自动清理，请添加以下内容到 crontab：${NC}"
echo ""
echo -e "${GREEN}# 每天凌晨 3 点清理日志${NC}"
echo -e "${GREEN}0 3 * * * cd $SCRIPT_DIR && ./cleanup-logs.sh >> /var/log/petshop-cleanup.log 2>&1${NC}"
echo ""
echo -e "编辑 crontab 命令: ${CYAN}crontab -e${NC}"
echo ""

echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN}日志清理完成！${NC}"
echo -e "${CYAN}========================================${NC}"
