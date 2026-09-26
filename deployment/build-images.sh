#!/bin/bash
# ==========================================
# 本地构建生产镜像并传输到服务器（Git Bash / Windows 下运行）
# 生产服务器永远不跑构建：镜像在本地 Docker 构建后 save/load 上传
# ==========================================
# 用法:
#   ./build-images.sh                     # 构建前后端镜像并上传
#   ./build-images.sh frontend            # 只构建前端（最小发布）
#   ./build-images.sh backend             # 只构建后端（最小发布）
#   ./build-images.sh all --no-upload     # 只构建+导出，不 scp
#   ./build-images.sh all --branch        # 同时打出分店 tag（petshop-*:branch）一并导出
#   ./build-images.sh frontend --branch --no-upload
# ==========================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# 与服务器 docker-compose.yml 的默认镜像命名保持一致（项目目录名 deployment）
SERVER="root@47.108.181.158"
REMOTE_DIR="/root/images"
BACKEND_IMAGE="deployment-backend:latest"
FRONTEND_IMAGE="deployment-frontend:latest"
# 分店镜像与主店同源同内容（同一份代码、同一 Dockerfile），仅 tag 不同；
# 分店 nginx 反代配置由运行时 volume（nginx-branch.conf）覆盖，无需独立构建
BRANCH_BACKEND_IMAGE="petshop-backend:branch"
BRANCH_FRONTEND_IMAGE="petshop-frontend:branch"
STAMP="$(date +%Y%m%d_%H%M%S)"

info() { echo "[INFO] $1"; }
die()  { echo "[ERROR] $1" >&2; exit 1; }

# ---------- 参数解析 ----------
SCOPE="all"
NO_UPLOAD=0
BRANCH_TAG=0
for arg in "$@"; do
    case "$arg" in
        all|frontend|backend) SCOPE="$arg" ;;
        --no-upload) NO_UPLOAD=1 ;;
        --branch) BRANCH_TAG=1 ;;
        *) die "未知参数: $arg（用法见文件头注释）" ;;
    esac
done

# ---------- 前置检查 ----------
docker info &> /dev/null || die "Docker 未运行，请先启动 Docker Desktop"
command -v npm &> /dev/null || die "npm 不可用"
command -v gzip &> /dev/null || die "gzip 不可用"

# ---------- 1. 前端本地构建（产出 dist/） ----------
if [ "$SCOPE" = "all" ] || [ "$SCOPE" = "frontend" ]; then
    info "构建前端 dist/ ..."
    if [ ! -d "$PROJECT_ROOT/frontend/node_modules" ]; then
        info "node_modules 不存在，先 npm ci ..."
        (cd "$PROJECT_ROOT/frontend" && npm ci)
    fi
    (cd "$PROJECT_ROOT/frontend" && npm run build)
    [ -f "$PROJECT_ROOT/frontend/dist/index.html" ] || die "前端构建产物缺失: frontend/dist/index.html"
fi

# ---------- 2. 构建镜像（Docker Desktop 内部是 Linux，产物即 linux/amd64） ----------
IMAGES=()
if [ "$SCOPE" = "all" ] || [ "$SCOPE" = "frontend" ]; then
    info "构建前端镜像 $FRONTEND_IMAGE ..."
    (cd "$PROJECT_ROOT" && docker build -t "$FRONTEND_IMAGE" \
        -f deployment/Dockerfile.frontend-prebuilt frontend/)
    IMAGES+=("$FRONTEND_IMAGE")
fi
if [ "$SCOPE" = "all" ] || [ "$SCOPE" = "backend" ]; then
    # 本地 Docker Hub 直连不通：基础镜像需先经 DaoCloud 镜像源拉取（一次即可）
    for base in maven:3.9-eclipse-temurin-17 eclipse-temurin:17-jre; do
        if ! docker image inspect "$base" &> /dev/null; then
            die "本地缺少基础镜像 $base，先执行:
  docker pull docker.m.daocloud.io/library/$base
  docker tag docker.m.daocloud.io/library/$base $base"
        fi
    done
    info "构建后端镜像 $BACKEND_IMAGE（容器内 Maven 编译，首次较慢）..."
    (cd "$PROJECT_ROOT" && docker build -t "$BACKEND_IMAGE" \
        -f deployment/Dockerfile.backend backend/)
    IMAGES+=("$BACKEND_IMAGE")
fi

# ---------- 3. 分店 tag（同一镜像多 tag，save 自动去重，tarball 体积不变） ----------
if [ "$BRANCH_TAG" = "1" ] && [ ${#IMAGES[@]} -gt 0 ]; then
    info "打分店 tag..."
    for img in "${IMAGES[@]}"; do
        case "$img" in
            "$FRONTEND_IMAGE")
                docker tag "$FRONTEND_IMAGE" "$BRANCH_FRONTEND_IMAGE"
                IMAGES+=("$BRANCH_FRONTEND_IMAGE")
                ;;
            "$BACKEND_IMAGE")
                docker tag "$BACKEND_IMAGE" "$BRANCH_BACKEND_IMAGE"
                IMAGES+=("$BRANCH_BACKEND_IMAGE")
                ;;
        esac
    done
fi

# ---------- 4. 导出 tarball ----------
IMAGE_DIR="$SCRIPT_DIR/images"
mkdir -p "$IMAGE_DIR"
NAME_PREFIX="petshop-images"
[ "$SCOPE" != "all" ] && NAME_PREFIX="petshop-$SCOPE-image"
TARBALL="$IMAGE_DIR/$NAME_PREFIX-$STAMP.tar.gz"

info "导出镜像: ${IMAGES[*]}"
docker save "${IMAGES[@]}" | gzip > "$TARBALL"
SIZE_MB=$(( $(stat -c%s "$TARBALL") / 1024 / 1024 ))
info "已导出: $TARBALL (${SIZE_MB} MB)"

[ "$NO_UPLOAD" = "1" ] && {
    info "--no-upload 模式结束，手动上传命令:"
    echo "  scp \"$TARBALL\" $SERVER:$REMOTE_DIR/"
    exit 0
}

# ---------- 5. 上传到服务器 ----------
info "上传到 $SERVER:$REMOTE_DIR/ （受本机上行带宽影响，请耐心等待）..."
ssh "$SERVER" "mkdir -p $REMOTE_DIR"
scp "$TARBALL" "$SERVER:$REMOTE_DIR/"

echo ""
info "==========================================="
info "构建与上传完成！接下来在服务器上发布:"
info "==========================================="
echo "  ssh $SERVER"
echo "  cd /root/MyPetShop3.0 && git pull --ff-only"
if [ "$BRANCH_TAG" = "1" ]; then
    echo "  cd deployment && ./release.sh $REMOTE_DIR/$(basename "$TARBALL") --branch"
else
    echo "  cd deployment && ./release.sh $REMOTE_DIR/$(basename "$TARBALL")"
fi
