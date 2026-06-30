#!/bin/bash

# ==========================================
# MyPetShop3.0 更新脚本 v3.0
# ==========================================
# 用法:
#   bash update.sh              # git pull + 构建前后端 + 重启（默认全更新）
#   bash update.sh -f           # 只更新前端
#   bash update.sh -b           # 只更新后端
#   bash update.sh -f -b        # 显式前后端都更新
#   bash update.sh -s           # 跳过 git pull，直接构建
#   bash update.sh --no-cache   # 无缓存重建镜像
#   bash update.sh --backup     # 额外备份 .env 和容器状态
#   bash update.sh --help       # 显示帮助
#
# 设计要点:
#   - -f 和 -b 可组合（修复旧版互斥 bug）：单独用只更新对应端，同传或都不传则都更新
#   - 后端构建路径已修正（旧版写错的 ../backend/Dockerfile.backend → Dockerfile.backend）
#   - git pull 非交互、容错：失败不阻断（适合 .git 未归入或离线），可用 -s 明确跳过
#   - mysql 容器始终不动，数据库安全
#   - 去掉旧版的固定 sleep 30（依赖 compose 的 depends_on:healthy 自动等待）
# ==========================================

set -euo pipefail

# ==========================================
# 参数解析
# ==========================================
FRONTEND_ONLY=false
BACKEND_ONLY=false
SKIP_GIT=false
NO_CACHE=false
DO_BACKUP=false
SHOW_HELP=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--frontend-only) FRONTEND_ONLY=true; shift ;;
        -b|--backend-only)  BACKEND_ONLY=true;  shift ;;
        -s|--skip-git)      SKIP_GIT=true;      shift ;;
        --no-cache)         NO_CACHE=true;      shift ;;
        --backup)           DO_BACKUP=true;     shift ;;
        -h|--help)          SHOW_HELP=true;     shift ;;
        *)
            echo "未知参数: $1"
            SHOW_HELP=true
            shift
            ;;
    esac
done

if [ "$SHOW_HELP" = true ]; then
    cat << 'EOF'
用法: bash update.sh [选项]

选项:
    -f, --frontend-only    只更新前端
    -b, --backend-only     只更新后端
    -s, --skip-git         跳过 git pull，直接构建
        --no-cache         无缓存重建镜像
        --backup           额外备份 .env 和容器状态到 backups/
    -h, --help             显示此帮助信息

更新范围:
    不传 -f/-b 或同传 -f -b   更新前后端（默认）
    只传 -f                   只更新前端
    只传 -b                   只更新后端

示例:
    bash update.sh               # git pull + 更新前后端
    bash update.sh -f -s         # 跳过 git，只更新前端
    bash update.sh -b --no-cache # 只更新后端，无缓存重建

注意:
    - 需在服务器执行（脚本位于 deployment/）
    - mysql 容器不受影响
    - git pull 失败不阻断构建（可用 -s 跳过）
EOF
    exit 0
fi

# ==========================================
# 颜色和日志
# ==========================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

# ==========================================
# 初始化
# ==========================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_DIR"

if ! docker ps >/dev/null 2>&1; then
    log_error "Docker 未运行，请先启动 Docker"
    exit 1
fi

# ==========================================
# 步骤 1/4: 确定更新范围
# ==========================================
log_info "=================================="
log_info "步骤 1/4: 确定更新范围"
log_info "=================================="

# -f 和 -b 可组合：默认前后端都更新；仅 -f 则跳过后端；仅 -b 则跳过前端
UPDATE_BACKEND=true
UPDATE_FRONTEND=true
if [ "$FRONTEND_ONLY" = true ] && [ "$BACKEND_ONLY" = false ]; then
    UPDATE_BACKEND=false
elif [ "$BACKEND_ONLY" = true ] && [ "$FRONTEND_ONLY" = false ]; then
    UPDATE_FRONTEND=false
fi

[ "$UPDATE_BACKEND" = true ]  && log_warning "✓ 后端将被更新"
[ "$UPDATE_FRONTEND" = true ] && log_warning "✓ 前端将被更新"

# ==========================================
# 步骤 2/4: 同步代码（git pull）
# ==========================================
log_info ""
log_info "=================================="
log_info "步骤 2/4: 同步代码（git pull）"
log_info "=================================="

if [ "$SKIP_GIT" = true ]; then
    log_info "跳过 git pull（-s）"
elif [ -d "$REPO_DIR/.git" ] && git rev-parse HEAD >/dev/null 2>&1; then
    log_info "执行 git pull --ff-only ..."
    if git pull --ff-only; then
        log_success "✓ 代码已是最新或已快进合并"
    else
        log_warning "git pull 失败（可能 .git 未归入或有未提交改动），使用当前工作区代码继续。可用 -s 跳过本步"
    fi
else
    log_warning "未检测到可用 git 仓库（.git 缺失或无 commit），跳过 git pull。建议归入 git 或使用 -s"
fi

# ==========================================
# （可选）备份
# ==========================================
if [ "$DO_BACKUP" = true ]; then
    log_info ""
    log_info "=================================="
    log_info "备份当前状态（--backup）"
    log_info "=================================="
    BACKUP_DIR="deployment/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    [ -f "deployment/.env" ] && cp "deployment/.env" "$BACKUP_DIR/.env.backup" && log_success "✓ 已备份 .env"
    (cd deployment && docker compose ps) > "$BACKUP_DIR/containers.txt" 2>/dev/null || true
    log_success "✓ 备份完成: $BACKUP_DIR"
fi

# ==========================================
# 步骤 3/4: 构建镜像
# ==========================================
log_info ""
log_info "=================================="
log_info "步骤 3/4: 构建镜像"
log_info "=================================="

BUILD_CACHE=""
if [ "$NO_CACHE" = true ]; then
    BUILD_CACHE="--no-cache"
    log_warning "使用无缓存构建"
fi

cd deployment

if [ "$UPDATE_BACKEND" = true ]; then
    log_info "构建后端镜像（可能需要几分钟）..."
    docker build $BUILD_CACHE -t deployment-backend:latest -f Dockerfile.backend ../backend/
    log_success "✓ 后端镜像构建完成"
fi

if [ "$UPDATE_FRONTEND" = true ]; then
    log_info "构建前端镜像（可能需要几分钟）..."
    docker build $BUILD_CACHE -t deployment-frontend:latest -f ../frontend/Dockerfile ../frontend/
    log_success "✓ 前端镜像构建完成"
fi

# ==========================================
# 步骤 4/4: 重启服务
# ==========================================
log_info ""
log_info "=================================="
log_info "步骤 4/4: 重启服务"
log_info "=================================="

if [ "$UPDATE_BACKEND" = true ]; then
    log_info "重启后端容器..."
    docker compose up -d backend
    log_success "✓ 后端容器已启动"
fi

if [ "$UPDATE_FRONTEND" = true ]; then
    log_info "重启前端容器..."
    docker compose up -d frontend
    log_success "✓ 前端容器已启动"
fi

# ==========================================
# 最终状态
# ==========================================
log_info ""
log_info "=================================="
log_info "最终状态"
log_info "=================================="

docker compose ps

HEALTHY=$(docker compose ps 2>/dev/null | grep -c "healthy" || true)
TOTAL=$(docker compose ps 2>/dev/null | grep -c "petshop-" || true)
log_info "健康容器数: ${HEALTHY}/${TOTAL}"

if [ -n "$TOTAL" ] && [ "$HEALTHY" = "$TOTAL" ]; then
    log_success "所有服务运行正常!"
else
    log_warning "部分服务可能未完全启动，请检查日志: docker compose logs -f"
fi

log_info ""
log_success "更新完成!"
