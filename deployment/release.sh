#!/bin/bash
# ==========================================
# 服务器端发布脚本（在服务器上运行），支持主店/分店
# 只做：备份当前镜像 -> load 新镜像 -> 滚动替换容器 -> 健康检查
# 服务器永远不构建（--no-build），MySQL 容器不受影响
# ==========================================
# 用法:
#   ./release.sh <镜像tarball> [服务...]        # 主店，服务默认 backend frontend
#   ./release.sh <镜像tarball> --branch         # 分店（petshop-*:branch，backend-branch/frontend-branch）
#   ./release.sh /root/images/xxx.tar.gz frontend
#   ./release.sh /root/images/xxx.tar.gz --branch
#   ./release.sh /root/images/xxx.tar.gz --yes  # 跳过确认
# 回滚（发布失败时按脚本输出的命令执行）:
#   docker tag <镜像名>:backup-<时间戳> <原镜像:tag>
#   docker compose up -d --no-build <服务>
# ==========================================
set -euo pipefail

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STAMP="$(date +%Y%m%d_%H%M%S)"

info() { echo "[INFO] $1"; }
warn() { echo "[WARN] $1"; }
die()  { echo "[ERROR] $1" >&2; exit 1; }
trap 'die "发布脚本在第 $LINENO 行失败，容器状态见: docker compose ps"' ERR

# ---------- 参数解析 ----------
TARBALL=""
SERVICES=()
ASSUME_YES=0
BRANCH=0
for arg in "$@"; do
    case "$arg" in
        --yes) ASSUME_YES=1 ;;
        --branch) BRANCH=1 ;;
        -*) die "未知参数: $arg" ;;
        *) TARBALL="$arg" ;;
    esac
done
[ -n "$TARBALL" ] || die "缺少镜像 tarball 参数（用法见文件头注释）"

# ---------- 按目标模式确定镜像、compose 文件与服务 ----------
if [ "$BRANCH" = "1" ]; then
    BACKEND_IMAGE="petshop-backend:branch"
    FRONTEND_IMAGE="petshop-frontend:branch"
    COMPOSE_ARGS=(-f branch/docker-compose.branch.yml --env-file branch/.env.branch)
    ALL_SERVICES=(backend-branch frontend-branch)
else
    BACKEND_IMAGE="deployment-backend:latest"
    FRONTEND_IMAGE="deployment-frontend:latest"
    COMPOSE_ARGS=()
    ALL_SERVICES=(backend frontend)
fi
[ ${#SERVICES[@]} -gt 0 ] || SERVICES=("${ALL_SERVICES[@]}")
for s in "${SERVICES[@]}"; do
    ok=0; for a in "${ALL_SERVICES[@]}"; do [ "$s" = "$a" ] && ok=1; done
    [ "$ok" = "1" ] || die "当前模式下服务只能是: ${ALL_SERVICES[*]}，收到: $s"
done

# ---------- 前置检查（只读） ----------
[ -f "$TARBALL" ] || die "tarball 不存在: $TARBALL"
docker info &> /dev/null || die "Docker 未运行"
[ -f "$DEPLOY_DIR/.env" ] || die "缺少 $DEPLOY_DIR/.env（compose 需要环境变量）"
if [ "$BRANCH" = "1" ]; then
    [ -f "$DEPLOY_DIR/branch/.env.branch" ] || die "缺少 branch/.env.branch（分店环境变量，仅服务器存在）"
fi
command -v docker &> /dev/null || die "docker 命令不可用"

# 备份点：load 会覆盖目标 tag，必须先把当前镜像另存 backup tag
BACKUP_TAGS=()
for img in "$BACKEND_IMAGE" "$FRONTEND_IMAGE"; do
    docker image inspect "$img" &> /dev/null && BACKUP_TAGS+=("$img")
done
[ ${#BACKUP_TAGS[@]} -gt 0 ] || die "服务器上找不到现有镜像（${BACKEND_IMAGE} / ${FRONTEND_IMAGE}），请确认部署目录正确"

info "发布内容:"
info "  目标    : $([ "$BRANCH" = "1" ] && echo 分店 || echo 主店)"
info "  tarball : $TARBALL ($(du -m "$TARBALL" | cut -f1) MB)"
info "  服务    : ${SERVICES[*]}"
info "  回滚点  : ${BACKUP_TAGS[*]} -> tag backup-$STAMP"
if [ "$ASSUME_YES" != "1" ]; then
    read -r -p "确认发布？(y/N): " confirm
    [ "$confirm" = "y" ] || die "已取消"
fi

# ---------- 1. 备份当前镜像（回滚点） ----------
for img in "${BACKUP_TAGS[@]}"; do
    docker tag "$img" "${img%:*}:backup-$STAMP"
done
info "已创建回滚点: backup-$STAMP"

# ---------- 2. 加载新镜像 ----------
info "加载镜像..."
docker load -i "$TARBALL"

# ---------- 3. 滚动替换容器（绝不构建） ----------
cd "$DEPLOY_DIR"
info "滚动更新容器: ${SERVICES[*]} (--no-build)"
docker compose "${COMPOSE_ARGS[@]}" up -d --no-build "${SERVICES[@]}"

# ---------- 4. 健康检查（最多 6 分钟，后端 start_period 90s） ----------
info "等待容器健康..."
ALL_OK=0
CONTAINERS=()
for s in "${SERVICES[@]}"; do CONTAINERS+=("petshop-$s"); done
for _ in $(seq 1 36); do
    sleep 10
    PENDING=()
    for c in "${CONTAINERS[@]}"; do
        ST="$(docker inspect --format '{{.State.Health.Status}}' "$c" 2>/dev/null || echo missing)"
        [ "$ST" = "healthy" ] || PENDING+=("$c=$ST")
    done
    if [ ${#PENDING[@]} -eq 0 ]; then ALL_OK=1; break; fi
    info "  等待中: ${PENDING[*]}"
done

if [ "$ALL_OK" = "1" ]; then
    info "==========================================="
    info "发布成功！当前状态:"
    info "==========================================="
    docker compose "${COMPOSE_ARGS[@]}" ps
    info "回滚点保留在: $(printf '%s:backup-%s ' "${BACKUP_TAGS[@]%:*}" "$STAMP")"
    info "确认稳定后可清理: docker image prune 和 rm $TARBALL"
else
    warn "==========================================="
    warn "健康检查超时，请人工确认！"
    warn "==========================================="
    docker compose "${COMPOSE_ARGS[@]}" ps
    warn "查看日志: docker compose ${COMPOSE_ARGS[*]} logs --tail=50 ${SERVICES[*]}"
    warn "确认异常需要回滚时执行:"
    for img in "${BACKUP_TAGS[@]}"; do
        warn "  docker tag ${img%:*}:backup-$STAMP $img"
    done
    warn "  cd $DEPLOY_DIR && docker compose ${COMPOSE_ARGS[*]} up -d --no-build ${SERVICES[*]}"
    exit 1
fi
