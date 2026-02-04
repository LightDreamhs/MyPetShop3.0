#!/bin/bash

# ==========================================
# MyPetShop3.0 数据库升级脚本
# ==========================================
# 功能：执行数据库迁移 SQL 脚本
# 使用场景：已有服务器需要升级数据库结构
# ==========================================

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ==========================================
# 加载环境变量
# ==========================================
if [ ! -f .env ]; then
    log_error ".env 文件不存在，请先创建 .env 文件"
    exit 1
fi

# 读取数据库密码（从 docker-compose 或 .env）
source .env

# 默认值
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-root}
MYSQL_CONTAINER=${MYSQL_CONTAINER:-petshop-mysql}

# ==========================================
# 检查容器状态
# ==========================================
log_info "=================================="
log_info "检查 MySQL 容器状态"
log_info "=================================="

if ! docker ps | grep -q $MYSQL_CONTAINER; then
    log_error "MySQL 容器未运行，请先启动服务"
    log_info "运行: docker-compose up -d"
    exit 1
fi

log_success "MySQL 容器正在运行"

# ==========================================
# 执行迁移脚本
# ==========================================
log_info ""
log_info "=================================="
log_info "执行数据库迁移"
log_info "=================================="

# 查找迁移脚本
MIGRATION_DIR="../backend/src/main/resources/db/migration"

if [ ! -d "$MIGRATION_DIR" ]; then
    log_error "迁移目录不存在: $MIGRATION_DIR"
    log_info "请确保已拉取最新代码"
    exit 1
fi

# 查找所有迁移脚本
MIGRATION_FILES=$(find "$MIGRATION_DIR" -name "*.sql" -type f | sort)

if [ -z "$MIGRATION_FILES" ]; then
    log_warning "没有找到迁移脚本"
    exit 0
fi

log_info "找到以下迁移脚本："
echo "$MIGRATION_FILES" | while read file; do
    echo "  - $(basename $file)"
done

# 询问是否继续
log_warning ""
read -p "是否继续执行数据库迁移？(y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "取消迁移"
    exit 0
fi

# ==========================================
# 执行迁移
# ==========================================
log_info ""
log_info "开始执行迁移..."

echo "$MIGRATION_FILES" | while read file; do
    log_info "执行: $(basename $file)"

    # 执行 SQL 脚本
    docker exec -i $MYSQL_CONTAINER mysql \
        -uroot \
        -p${MYSQL_ROOT_PASSWORD} \
        pet_shop_3_0 < "$file"

    if [ $? -eq 0 ]; then
        log_success "✓ $(basename $file) 执行成功"
    else
        log_error "✗ $(basename $file) 执行失败"
        exit 1
    fi
done

# ==========================================
# 验证迁移结果
# ==========================================
log_info ""
log_info "=================================="
log_info "验证迁移结果"
log_info "=================================="

# 检查 balance_transactions 表是否存在
TABLE_EXISTS=$(docker exec $MYSQL_CONTAINER mysql \
    -uroot \
    -p${MYSQL_ROOT_PASSWORD} \
    -e "SHOW TABLES LIKE 'balance_transactions'" \
    pet_shop_3_0 \
    --silent \
    --skip-column-names)

if [ -n "$TABLE_EXISTS" ]; then
    log_success "✓ balance_transactions 表已创建"
else
    log_warning "✗ balance_transactions 表不存在"
fi

# 检查 customers 表是否有 balance 字段
BALANCE_COLUMN=$(docker exec $MYSQL_CONTAINER mysql \
    -uroot \
    -p${MYSQL_ROOT_PASSWORD} \
    -e "SHOW COLUMNS FROM customers LIKE 'balance'" \
    pet_shop_3_0 \
    --silent \
    --skip-column-names)

if [ -n "$BALANCE_COLUMN" ]; then
    log_success "✓ customers.balance 字段已添加"
else
    log_warning "✗ customers.balance 字段不存在"
fi

# ==========================================
# 完成
# ==========================================
log_info ""
log_info "=================================="
log_success "数据库迁移完成！"
log_info "=================================="
log_info ""
log_info "提示：请重启后端容器以确保应用正常"
log_info "运行: docker-compose restart backend"
log_info ""
