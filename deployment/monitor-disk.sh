#!/bin/bash

# ==========================================
# MyPetShop3.0 磁盘监控脚本
# ==========================================
# 用途：监控系统磁盘和容器资源使用情况
# 使用：手动执行或添加到 crontab 定时监控
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
DISK_WARNING_THRESHOLD=${DISK_WARNING_THRESHOLD:-70}  # 磁盘使用率警告阈值（%）
DISK_CRITICAL_THRESHOLD=${DISK_CRITICAL_THRESHOLD:-85}  # 磁盘使用率严重阈值（%）
MEMORY_WARNING_THRESHOLD=${MEMORY_WARNING_THRESHOLD:-80}  # 内存使用率警告阈值（%）

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  MyPetShop3.0 资源监控${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "检查时间: ${CYAN}$(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""

# ==========================================
# 1. 磁盘使用情况
# ==========================================
echo -e "${BLUE}[1] 磁盘使用情况${NC}"
echo "----------------------------------------"

# 检查根分区
ROOT_DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
ROOT_DISK_AVAIL=$(df -h / | tail -1 | awk '{print $4}')

echo "根分区 (/):"
echo "  已使用: ${CYAN}$ROOT_DISK_USAGE%${NC} (可用: $ROOT_DISK_AVAIL)"

if [ "$ROOT_DISK_USAGE" -ge "$DISK_CRITICAL_THRESHOLD" ]; then
    echo -e "  状态: ${RED}✗ 严重警告！磁盘空间不足${NC}"
    echo -e "  建议: ${YELLOW}请立即清理日志或上传文件${NC}"
elif [ "$ROOT_DISK_USAGE" -ge "$DISK_WARNING_THRESHOLD" ]; then
    echo -e "  状态: ${YELLOW}⚠ 警告！磁盘使用率较高${NC}"
    echo -e "  建议: ${YELLOW}建议清理日志或上传文件${NC}"
else
    echo -e "  状态: ${GREEN}✓ 正常${NC}"
fi
echo ""

# Docker 数据目录
DOCKER_DISK_USAGE=$(df /var/lib/docker 2>/dev/null | tail -1 | awk '{print $5}' | sed 's/%//') || echo "0"
DOCKER_DISK_AVAIL=$(df -h /var/lib/docker 2>/dev/null | tail -1 | awk '{print $4}') || echo "N/A"

if [ "$DOCKER_DISK_USAGE" != "0" ]; then
    echo "Docker 数据目录:"
    echo "  已使用: ${CYAN}$DOCKER_DISK_USAGE%${NC} (可用: $DOCKER_DISK_AVAIL)"

    if [ "$DOCKER_DISK_USAGE" -ge "$DISK_CRITICAL_THRESHOLD" ]; then
        echo -e "  状态: ${RED}✗ Docker 占用过多空间${NC}"
    elif [ "$DOCKER_DISK_USAGE" -ge "$DISK_WARNING_THRESHOLD" ]; then
        echo -e "  状态: ${YELLOW}⚠ Docker 占用较高${NC}"
    else
        echo -e "  状态: ${GREEN}✓ 正常${NC}"
    fi
    echo ""
fi

# ==========================================
# 2. Docker 卷使用情况
# ==========================================
echo -e "${BLUE}[2] Docker 卷使用情况${NC}"
echo "----------------------------------------"

if docker volume ls | grep -q petshop; then
    echo "数据卷详情："
    docker volume ls | grep petshop | while read -r line; do
        VOLUME_NAME=$(echo "$line" | awk '{print $2}')
        MOUNTPOINT=$(docker volume inspect $VOLUME_NAME --format='{{.Mountpoint}}' 2>/dev/null)

        if [ -n "$MOUNTPOINT" ]; then
            VOLUME_SIZE=$(du -sh "$MOUNTPOINT" 2>/dev/null | awk '{print $1}')
            echo -e "  $VOLUME_NAME: ${CYAN}$VOLUME_SIZE${NC}"
        fi
    done
else
    echo -e "${YELLOW}⚠ 没有找到项目相关的数据卷${NC}"
fi
echo ""

# ==========================================
# 3. 容器资源使用情况
# ==========================================
echo -e "${BLUE}[3] 容器资源使用情况${NC}"
echo "----------------------------------------"

if docker-compose ps | grep -q "Up"; then
    echo "容器实时资源使用："
    echo ""
    printf "${CYAN}%-20s %-10s %-10s %-10s %-10s${NC}\n" "容器" "CPU%" "内存使用" "内存%" "网络I/O"
    echo "--------------------------------------------------------------------------------"

    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}" | grep -E "NAME|petshop" | while read -r line; do
        if echo "$line" | grep -q "petshop"; then
            # 提取内存使用百分比
            MEM_PERCENT=$(echo "$line" | awk '{print $4}' | sed 's/%//')

            # 颜色标记
            if [ -n "$MEM_PERCENT" ] && [ "$MEM_PERCENT" -ge "$MEMORY_WARNING_THRESHOLD" ]; then
                echo -e "${RED}$line${NC}"
            elif [ -n "$MEM_PERCENT" ] && [ "$MEM_PERCENT" -ge 60 ]; then
                echo -e "${YELLOW}$line${NC}"
            else
                echo -e "${GREEN}$line${NC}"
            fi
        elif echo "$line" | grep -q "NAME"; then
            echo "$line"
        fi
    done
else
    echo -e "${RED}✗ 没有容器在运行${NC}"
fi
echo ""

# ==========================================
# 4. 数据库数据大小
# ==========================================
echo -e "${BLUE}[4] 数据库数据统计${NC}"
echo "----------------------------------------"

if docker ps | grep -q petshop-mysql; then
    # 读取密码
    if [ -f .env ]; then
        source .env
    fi

    # 获取数据库大小
    DB_SIZE=$(docker exec petshop-mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD:-root} -e "
        SELECT
            ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'DB Size (MB)'
        FROM information_schema.tables
        WHERE table_schema = 'pet_shop_3_0';
    " -N -s 2>/dev/null || echo "0")

    echo -e "数据库总大小: ${CYAN}$DB_SIZE MB${NC}"

    # 各表统计
    echo ""
    echo "数据表记录数："
    docker exec petshop-mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD:-root} -e "
        SELECT
            table_name AS 'Table',
            table_rows AS 'Rows',
            ROUND((data_length + index_length) / 1024, 2) AS 'Size (KB)'
        FROM information_schema.tables
        WHERE table_schema = 'pet_shop_3_0'
        ORDER BY (data_length + index_length) DESC;
    " 2>/dev/null | column -t | sed 's/^/  /'
else
    echo -e "${YELLOW}⚠ MySQL 容器未运行${NC}"
fi
echo ""

# ==========================================
# 5. 上传文件统计
# ==========================================
echo -e "${BLUE}[5] 上传文件统计${NC}"
echo "----------------------------------------"

if docker ps | grep -q petshop-backend; then
    UPLOAD_DIR="/app/uploads/images"

    # 文件数量
    FILE_COUNT=$(docker exec petshop-backend find $UPLOAD_DIR -type f 2>/dev/null | wc -l)

    # 总大小
    FILE_SIZE=$(docker exec petshop-backend du -sh $UPLOAD_DIR 2>/dev/null | awk '{print $1}' || echo "0")

    echo -e "上传文件数量: ${CYAN}$FILE_COUNT${NC}"
    echo -e "上传文件总大小: ${CYAN}$FILE_SIZE${NC}"

    # 最近上传的文件
    echo ""
    echo "最近上传的文件（最多5个）："
    docker exec petshop-backend find $UPLOAD_DIR -type f -printf '%T+ %p\n' 2>/dev/null | sort -r | head -5 | sed 's/^/  /' || echo "  无文件"
else
    echo -e "${YELLOW}⚠ 后端容器未运行${NC}"
fi
echo ""

# ==========================================
# 6. 健康状态总结
# ==========================================
echo -e "${BLUE}[6] 健康状态总结${NC}"
echo "----------------------------------------"

ISSUES_FOUND=0

# 检查磁盘
if [ "$ROOT_DISK_USAGE" -ge "$DISK_CRITICAL_THRESHOLD" ]; then
    echo -e "${RED}✗ 磁盘空间严重不足 ($ROOT_DISK_USAGE%)${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
elif [ "$ROOT_DISK_USAGE" -ge "$DISK_WARNING_THRESHOLD" ]; then
    echo -e "${YELLOW}⚠ 磁盘空间紧张 ($ROOT_DISK_USAGE%)${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# 检查容器状态
UNHEALTHY=$(docker-compose ps | grep -c "unhealthy" || true)
if [ "$UNHEALTHY" -gt 0 ]; then
    echo -e "${RED}✗ 有 $UNHEALTHY 个容器不健康${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# 检查容器是否运行
RUNNING=$(docker-compose ps | grep -c "Up" || true)
if [ "$RUNNING" -eq 0 ]; then
    echo -e "${RED}✗ 没有容器在运行${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

if [ "$ISSUES_FOUND" -eq 0 ]; then
    echo -e "${GREEN}✓ 系统运行正常，未发现问题${NC}"
else
    echo -e "${RED}发现 $ISSUES_FOUND 个问题需要处理${NC}"
fi
echo ""

# ==========================================
# 7. 建议操作
# ==========================================
if [ "$ISSUES_FOUND" -gt 0 ]; then
    echo -e "${BLUE}[7] 建议操作${NC}"
    echo "----------------------------------------"
    echo -e "清理日志: ${GREEN}./cleanup-logs.sh${NC}"
    echo -e "查看详情: ${GREEN}docker-compose ps${NC}"
    echo -e "重启服务: ${GREEN}docker-compose restart${NC}"
    echo ""
fi

echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN}监控完成！${NC}"
echo -e "${CYAN}========================================${NC}"
