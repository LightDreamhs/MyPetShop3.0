#!/bin/bash

# ==========================================
# MyPetShop3.0 更新脚本
# ==========================================
# 功能：
# 1. 拉取最新代码
# 2. 检测哪些组件需要更新
# 3. 重新构建必要的镜像
# 4. 智能重启容器（保留数据）
# 5. 验证更新是否成功
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
# 配置项：选择远程仓库
# ==========================================

# 远程仓库配置（优先使用Gitee，失败则回退到GitHub）
GIT_REMOTE_ORIGIN="gitee"  # 可选值: "gitee" 或 "origin" 或 "github"

# 如果设置了环境变量GIT_REMOTE，则使用环境变量的值
if [ -n "$GIT_REMOTE" ]; then
    GIT_REMOTE_ORIGIN="$GIT_REMOTE"
fi

# 检查Gitee远程仓库是否存在，如果不存在则使用origin
if ! git remote get-url "$GIT_REMOTE_ORIGIN" >/dev/null 2>&1; then
    log_warning "Gitee远程仓库未配置，使用origin"
    GIT_REMOTE_ORIGIN="origin"
fi

# ==========================================
# 1. 检查Git更新
# ==========================================
log_info "=================================="
log_info "步骤 1/7: 检查代码更新"
log_info "=================================="

# 检查是否有.git目录
if [ ! -d "../.git" ]; then
    log_error "不是Git仓库，请先clone项目"
    exit 1
fi

cd ..
git fetch "$GIT_REMOTE_ORIGIN"

# 获取当前版本
CURRENT_COMMIT=$(git rev-parse HEAD)
# 获取远程最新版本
LATEST_COMMIT=$(git rev-parse "$GIT_REMOTE_ORIGIN/main")

if [ "$CURRENT_COMMIT" = "$LATEST_COMMIT" ]; then
    log_success "代码已是最新版本"
    NEED_UPDATE=false
else
    log_warning "检测到新版本，准备更新..."
    log_info "当前版本: $CURRENT_COMMIT"
    log_info "最新版本: $LATEST_COMMIT"

    # 查看更新内容
    log_info "更新内容："
    git log --oneline HEAD.."$GIT_REMOTE_ORIGIN/main" | head -10

    read -p "是否继续更新？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "取消更新"
        exit 0
    fi

    git pull "$GIT_REMOTE_ORIGIN" main
    NEED_UPDATE=true
fi

cd deployment

# ==========================================
# 2. 检测哪些组件发生了变化
# ==========================================
log_info ""
log_info "=================================="
log_info "步骤 2/7: 检测组件变化"
log_info "=================================="

# 检查后端代码是否变化
if git diff --name-only $CURRENT_COMMIT $LATEST_COMMIT | grep -q "^backend/"; then
    log_warning "✗ 后端代码有变化，需要重新构建"
    BACKEND_NEED_UPDATE=true
else
    log_success "✓ 后端代码无变化"
    BACKEND_NEED_UPDATE=false
fi

# 检查前端代码是否变化
if git diff --name-only $CURRENT_COMMIT $LATEST_COMMIT | grep -q "^frontend/"; then
    log_warning "✗ 前端代码有变化，需要重新构建"
    FRONTEND_NEED_UPDATE=true
else
    log_success "✓ 前端代码无变化"
    FRONTEND_NEED_UPDATE=false
fi

# 检查nginx配置是否变化
if git diff --name-only $CURRENT_COMMIT $LATEST_COMMIT | grep -E "(deployment/nginx.conf|frontend/nginx.conf)"; then
    log_warning "✗ Nginx配置有变化，需要重新构建前端"
    FRONTEND_NEED_UPDATE=true
else
    log_success "✓ Nginx配置无变化"
fi

# 检查docker-compose配置是否变化
if git diff --name-only $CURRENT_COMMIT $LATEST_COMMIT | grep -q "deployment/docker-compose.yml"; then
    log_warning "✗ Docker Compose配置有变化"
    COMPOSE_NEED_UPDATE=true
else
    log_success "✓ Docker Compose配置无变化"
    COMPOSE_NEED_UPDATE=false
fi

# 检查数据库初始化脚本是否变化
if git diff --name-only $CURRENT_COMMIT $LATEST_COMMIT | grep -q "deployment/mysql-init/"; then
    log_warning "✗ 数据库初始化脚本有变化（注意：不会影响已有数据）"
    DB_NEED_UPDATE=true
else
    log_success "✓ 数据库脚本无变化"
    DB_NEED_UPDATE=false
fi

# ==========================================
# 3. 备份当前状态
# ==========================================
log_info ""
log_info "=================================="
log_info "步骤 3/7: 备份当前状态"
log_info "=================================="

# 创建备份目录
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# 备份环境变量
if [ -f .env ]; then
    cp .env "$BACKUP_DIR/.env.backup"
    log_success "✓ 已备份 .env 文件"
fi

# 记录当前容器状态
docker-compose ps > "$BACKUP_DIR/containers_status.txt"
log_success "✓ 已记录容器状态"

# 记录当前镜像ID
docker images | grep deployment > "$BACKUP_DIR/images.txt"
log_success "✓ 已记录当前镜像"

# ==========================================
# 4. 更新容器镜像
# ==========================================
log_info ""
log_info "=================================="
log_info "步骤 4/7: 更新容器镜像"
log_info "=================================="

if [ "$BACKEND_NEED_UPDATE" = true ] || [ "$FRONTEND_NEED_UPDATE" = true ] || [ "$NEED_UPDATE" = true ]; then

    if [ "$BACKEND_NEED_UPDATE" = true ]; then
        log_info "删除旧后端镜像..."
        docker rmi deployment-backend 2>/dev/null || true
        log_info "重新构建后端镜像..."
        docker-compose build backend
        log_success "✓ 后端镜像构建完成"
    fi

    if [ "$FRONTEND_NEED_UPDATE" = true ]; then
        log_info "删除旧前端镜像..."
        docker rmi deployment-frontend 2>/dev/null || true
        log_info "重新构建前端镜像..."
        docker-compose build frontend
        log_success "✓ 前端镜像构建完成"
    fi

else
    log_success "无需重新构建镜像"
fi

# ==========================================
# 5. 重启容器
# ==========================================
log_info ""
log_info "=================================="
log_info "步骤 5/7: 重启容器"
log_info "=================================="

if [ "$BACKEND_NEED_UPDATE" = true ]; then
    log_info "重启后端容器..."
    docker-compose stop backend 2>/dev/null || true
    docker-compose rm -f backend 2>/dev/null || true
    docker-compose up -d backend
    log_success "✓ 后端容器已重启"
fi

if [ "$FRONTEND_NEED_UPDATE" = true ]; then
    log_info "重启前端容器..."
    docker-compose stop frontend 2>/dev/null || true
    docker-compose rm -f frontend 2>/dev/null || true
    docker-compose up -d frontend
    log_success "✓ 前端容器已重启"
fi

if [ "$COMPOSE_NEED_UPDATE" = true ]; then
    log_info "Docker Compose配置有变化，重启所有服务..."
    docker-compose up -d
    log_success "✓ 所有服务已重启"
fi

# ==========================================
# 6. 验证数据持久化
# ==========================================
log_info ""
log_info "=================================="
log_info "步骤 6/7: 验证数据持久化"
log_info "=================================="

# 检查MySQL数据卷（使用docker-compose自动获取正确的卷名）
MYSQL_VOLUME_NAME=$(docker-compose config --volumes | grep mysql | head -1)
if [ -z "$MYSQL_VOLUME_NAME" ]; then
    MYSQL_VOLUME_NAME="deployment_mysql-data"
fi

if docker volume ls | grep -q ${MYSQL_VOLUME_NAME}; then
    log_success "✓ MySQL数据卷存在 ($MYSQL_VOLUME_NAME)"

    # 检查数据卷是否有数据
    MYSQL_DATA_SIZE=$(docker volume inspect ${MYSQL_VOLUME_NAME} --format='{{.Usage}}' 2>/dev/null || echo "未知")
    log_info "MySQL数据大小: $MYSQL_DATA_SIZE"
else
    log_warning "✗ MySQL数据卷不存在（首次部署）"
fi

# 检查上传文件数据卷
UPLOAD_VOLUME_NAME=$(docker-compose config --volumes | grep upload | head -1)
if [ -z "$UPLOAD_VOLUME_NAME" ]; then
    UPLOAD_VOLUME_NAME="deployment_upload-data"
fi

if docker volume ls | grep -q ${UPLOAD_VOLUME_NAME}; then
    log_success "✓ 上传文件数据卷存在 ($UPLOAD_VOLUME_NAME)"

    # 检查是否有上传文件
    UPLOAD_COUNT=$(docker exec petshop-backend ls -1 /app/uploads/images/ 2>/dev/null | wc -l)
    log_info "上传文件数量: $UPLOAD_COUNT"
else
    log_warning "✗ 上传文件数据卷不存在（首次部署）"
fi

# 检查数据库数据
log_info "检查数据库数据..."
TABLE_COUNT=$(docker exec petshop-mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD:-root} -e "USE pet_shop_3_0; SHOW TABLES;" 2>/dev/null | wc -l)
if [ "$TABLE_COUNT" -gt 0 ]; then
    log_success "✓ 数据库数据完整 (共 $((TABLE_COUNT - 1)) 张表)"
else
    log_warning "✗ 数据库无数据（首次部署或数据丢失）"
fi

# ==========================================
# 7. 健康检查
# ==========================================
log_info ""
log_info "=================================="
log_info "步骤 7/7: 健康检查"
log_info "=================================="

# 等待容器启动
log_info "等待容器启动..."
sleep 15

# 检查容器状态
log_info "检查容器状态..."
HEALTHY_COUNT=$(docker-compose ps | grep -c "healthy" || true)
RUNNING_COUNT=$(docker-compose ps | grep -c "Up" || true)

if [ "$HEALTHY_COUNT" -eq 3 ]; then
    log_success "✓ 所有容器健康状态良好"
else
    log_warning "部分容器可能未就绪，请稍后检查"
fi

# 检查后端API
log_info "检查后端API..."
if curl -f -s http://localhost:8080/api/v1/actuator/health > /dev/null 2>&1; then
    log_success "✓ 后端API正常"
elif curl -f -s http://localhost:8080/api/v1/users > /dev/null 2>&1; then
    log_success "✓ 后端API正常"
else
    log_warning "✗ 后端API未响应（可能还在启动中）"
fi

# 检查前端
log_info "检查前端..."
if curl -f -s http://localhost/health > /dev/null 2>&1; then
    log_success "✓ 前端服务正常"
else
    log_warning "✗ 前端服务未响应（可能还在启动中）"
fi

# ==========================================
# 更新摘要
# ==========================================
log_info ""
log_info "=================================="
log_success "更新完成！"
log_info "=================================="

log_info "更新摘要："
[ "$BACKEND_NEED_UPDATE" = true ] && echo "  ✓ 后端已更新"
[ "$FRONTEND_NEED_UPDATE" = true ] && echo "  ✓ 前端已更新"
[ "$COMPOSE_NEED_UPDATE" = true ] && echo "  ✓ Docker配置已更新"
[ "$DB_NEED_UPDATE" = true ] && echo "  ℹ 数据库脚本已更新（不影响已有数据）"

log_info ""
log_info "备份位置: $BACKUP_DIR"
log_info "查看容器状态: docker-compose ps"
log_info "查看日志: docker-compose logs -f"
log_info ""
