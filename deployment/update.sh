#!/bin/bash

# ==========================================
# MyPetShop3.0 更新脚本 v2.0
# ==========================================
# 用法:
#   bash update.sh                 # 自动检测并更新变更的组件
#   bash update.sh -f              # 只更新前端
#   bash update.sh -b              # 只更新后端
#   bash update.sh -s              # 跳过Git拉取,直接构建
#   bash update.sh --no-cache      # 无缓存重建
#   bash update.sh --help          # 显示帮助
# ==========================================

set -e  # 遇到错误立即退出

# ==========================================
# 参数解析
# ==========================================
FRONTEND_ONLY=false
BACKEND_ONLY=false
SKIP_GIT=false
NO_CACHE=false
SHOW_HELP=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--frontend-only)
            FRONTEND_ONLY=true
            shift
            ;;
        -b|--backend-only)
            BACKEND_ONLY=true
            shift
            ;;
        -s|--skip-git)
            SKIP_GIT=true
            shift
            ;;
        --no-cache)
            NO_CACHE=true
            shift
            ;;
        -h|--help)
            SHOW_HELP=true
            shift
            ;;
        *)
            echo "未知参数: $1"
            SHOW_HELP=true
            shift
            ;;
    esac
done

if [ "$SHOW_HELP" = true ]; then
    cat << EOF
用法: bash update.sh [选项]

选项:
    -f, --frontend-only    只更新前端
    -b, --backend-only     只更新后端
    -s, --skip-git         跳过Git拉取,直接构建
    --no-cache             无缓存重建镜像
    -h, --help             显示此帮助信息

示例:
    bash update.sh                  # 自动检测变更并更新
    bash update.sh -f -s            # 只更新前端,跳过Git拉取
    bash update.sh --no-cache       # 无缓存重建所有变更

注意: 需要在服务器上执行此脚本
EOF
    exit 0
fi

# ==========================================
# 颜色和日志函数
# ==========================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# ==========================================
# 初始化
# ==========================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# 检查Docker是否运行
if ! docker ps >/dev/null 2>&1; then
    log_error "Docker未运行,请先启动Docker"
    exit 1
fi

# ==========================================
# 步骤1: 检测变更
# ==========================================
log_info "=================================="
log_info "步骤 1/5: 检测变更"
log_info "=================================="

NEED_UPDATE=false
BACKEND_NEED_UPDATE=false
FRONTEND_NEED_UPDATE=false

if [ "$SKIP_GIT" = false ] && [ "$FRONTEND_ONLY" = false ] && [ "$BACKEND_ONLY" = false ]; then
    # 检查是否是Git仓库
    if [ ! -d ".git" ]; then
        log_warning "不是Git仓库,跳过代码检测"
        SKIP_GIT=true
    else
        # 尝试拉取更新
        CURRENT_COMMIT=$(git rev-parse HEAD)

        if git fetch origin 2>/dev/null; then
            LATEST_COMMIT=$(git rev-parse origin/main)

            if [ "$CURRENT_COMMIT" != "$LATEST_COMMIT" ]; then
                log_warning "检测到新版本"
                git log --oneline HEAD..origin/main | head -5

                read -p "是否更新代码? (y/n) " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    git pull origin main
                    NEED_UPDATE=true
                fi
            else
                log_success "代码已是最新版本"
            fi
        else
            log_warning "Git拉取失败,跳过代码更新"
        fi
    fi
fi

# ==========================================
# 步骤2: 确定更新范围
# ==========================================
log_info ""
log_info "=================================="
log_info "步骤 2/5: 确定更新范围"
log_info "=================================="

if [ "$FRONTEND_ONLY" = true ]; then
    FRONTEND_NEED_UPDATE=true
    log_info "模式: 仅更新前端"
elif [ "$BACKEND_ONLY" = true ]; then
    BACKEND_NEED_UPDATE=true
    log_info "模式: 仅更新后端"
elif [ "$SKIP_GIT" = true ] || [ "$NEED_UPDATE" = true ]; then
    # 根据参数或默认行为决定
    if [ "$FRONTEND_ONLY" = false ] && [ "$BACKEND_ONLY" = false ]; then
        # 默认更新两者
        BACKEND_NEED_UPDATE=true
        FRONTEND_NEED_UPDATE=true
        log_info "模式: 更新前后端"
    fi
fi

if [ "$BACKEND_NEED_UPDATE" = true ]; then
    log_warning "✓ 后端将被更新"
fi
if [ "$FRONTEND_NEED_UPDATE" = true ]; then
    log_warning "✓ 前端将被更新"
fi

# ==========================================
# 步骤3: 备份
# ==========================================
log_info ""
log_info "=================================="
log_info "步骤 3/5: 备份当前状态"
log_info "=================================="

BACKUP_DIR="deployment/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

if [ -f "deployment/.env" ]; then
    cp deployment/.env "$BACKUP_DIR/.env.backup"
    log_success "✓ 已备份 .env"
fi

docker compose ps > "$BACKUP_DIR/containers.txt" 2>/dev/null || true
docker images | grep deployment > "$BACKUP_DIR/images.txt" 2>/dev/null || true
log_success "✓ 已记录容器和镜像状态"

# ==========================================
# 步骤4: 构建镜像
# ==========================================
log_info ""
log_info "=================================="
log_info "步骤 4/5: 构建镜像"
log_info "=================================="

BUILD_CACHE=""
if [ "$NO_CACHE" = true ]; then
    BUILD_CACHE="--no-cache"
    log_warning "使用无缓存构建"
fi

# 更新后端
if [ "$BACKEND_NEED_UPDATE" = true ]; then
    log_info "停止后端容器..."
    docker compose stop backend 2>/dev/null || true
    docker compose rm -f backend 2>/dev/null || true

    log_info "删除旧后端镜像..."
    docker rmi deployment-backend:latest 2>/dev/null || true

    log_info "构建后端镜像 (可能需要几分钟)..."
    cd deployment
    docker build $BUILD_CACHE -t deployment-backend:latest \
        -f ../backend/Dockerfile.backend ../backend/
    cd ..

    log_success "✓ 后端镜像构建完成"
fi

# 更新前端
if [ "$FRONTEND_NEED_UPDATE" = true ]; then
    log_info "停止前端容器..."
    docker compose stop frontend 2>/dev/null || true
    docker compose rm -f frontend 2>/dev/null || true

    log_info "删除旧前端镜像..."
    docker rmi deployment-frontend:latest 2>/dev/null || true

    log_info "构建前端镜像 (可能需要几分钟)..."
    cd deployment
    docker build $BUILD_CACHE -t deployment-frontend:latest \
        -f ../frontend/Dockerfile ../frontend/
    cd ..

    log_success "✓ 前端镜像构建完成"
fi

# ==========================================
# 步骤5: 启动服务
# ==========================================
log_info ""
log_info "=================================="
log_info "步骤 5/5: 启动服务"
log_info "=================================="

cd deployment

if [ "$BACKEND_NEED_UPDATE" = true ]; then
    log_info "启动后端容器..."
    docker compose up -d backend
    log_success "✓ 后端容器已启动"
fi

if [ "$FRONTEND_NEED_UPDATE" = true ]; then
    log_info "启动前端容器..."
    docker compose up -d frontend
    log_success "✓ 前端容器已启动"
fi

# 等待健康检查
log_info ""
log_info "等待服务启动 (30秒)..."
sleep 30

# 最终状态检查
log_info ""
log_info "=================================="
log_info "最终状态"
log_info "=================================="

docker compose ps

# 显示容器日志
log_info ""
log_info "查看完整日志: docker compose logs -f"
log_info "备份位置: $BACKUP_DIR"
log_info ""

# 检查健康状态
HEALTHY=$(docker compose ps | grep -c "healthy" || true)
log_info "健康容器数: $HEALTHY/3"

if [ "$HEALTHY" -eq 3 ]; then
    log_success "所有服务运行正常!"
else
    log_warning "部分服务可能未完全启动,请检查日志"
fi

log_info ""
log_success "更新完成!"
