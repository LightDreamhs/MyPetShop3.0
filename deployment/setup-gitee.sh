#!/bin/bash

# ==========================================
# MyPetShop3.0 Gitee 仓库配置脚本
# ==========================================
# 用于配置GitHub + Gitee双仓库同步
# ==========================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  配置 GitHub + Gitee 双仓库同步${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../"

# 检查是否已是Git仓库
if [ ! -d .git ]; then
    echo -e "${RED}错误：不是Git仓库${NC}"
    exit 1
fi

echo -e "${BLUE}[1] 当前远程仓库配置${NC}"
echo "----------------------------------------"
git remote -v
echo ""

# 检查是否已配置gitee
if git remote get-url gitee >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Gitee远程仓库已存在${NC}"
    read -p "是否重新配置？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}保持现有配置${NC}"
        exit 0
    fi
    git remote remove gitee
fi

echo -e "${BLUE}[2] 请输入Gitee仓库信息${NC}"
echo "----------------------------------------"

# 提示用户创建Gitee仓库
echo -e "${YELLOW}请先在Gitee上创建仓库：${NC}"
echo "  1. 访问: https://gitee.com/"
echo "  2. 登录或注册账号"
echo "  3. 创建新仓库"
echo "     - 仓库名: MyPetShop3.0"
echo "     - 可见性: 私有仓库"
echo "     - ✓ 不要初始化 README、.gitignore 等"
echo ""

# 输入Gitee用户名
read -p "请输入Gitee用户名: " GITEE_USERNAME

if [ -z "$GITEE_USERNAME" ]; then
    echo -e "${RED}错误：用户名不能为空${NC}"
    exit 1
fi

# 构建Gitee仓库URL
GITEE_REPO_URL="https://gitee.com/${GITEE_USERNAME}/MyPetShop3.0.git"

echo ""
echo -e "${BLUE}[3] 添加Gitee远程仓库${NC}"
echo "----------------------------------------"
git remote add gitee "$GITEE_REPO_URL"
echo -e "${GREEN}✓ 已添加Gitee远程仓库${NC}"
echo "  仓库名称: gitee"
echo "  仓库地址: $GITEE_REPO_URL"
echo ""

echo -e "${BLUE}[4] 配置后的远程仓库${NC}"
echo "----------------------------------------"
git remote -v
echo ""

echo -e "${BLUE}[5] 推送代码到Gitee${NC}"
echo "----------------------------------------"
echo "准备推送代码到Gitee（首次推送可能需要输入账号密码）..."
echo ""

# 推送所有分支到Gitee
git push gitee main

echo ""
echo -e "${GREEN}✓ 代码已成功推送到Gitee！${NC}"
echo ""

# 配置同时推送到两个仓库
echo -e "${BLUE}[6] 配置自动同步推送（可选）${NC}"
echo "----------------------------------------"
echo ""
echo "如果想在执行 'git push' 时自动推送到GitHub和Gitee，"
read -p "是否配置自动同步推送？(y/n) " -n 1 -r
echo
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # 方案1：设置多个pushurl（推荐）
    echo -e "${GREEN}配置方式：同时推送到两个仓库${NC}"
    git remote set-url --add --push origin https://github.com/LightDreamhs/MyPetShop3.0.git
    git remote set-url --add --push origin https://gitee.com/${GITEE_USERNAME}/MyPetShop3.0.git

    echo ""
    echo -e "${GREEN}✓ 配置完成！${NC}"
    echo ""
    echo -e "${BLUE}现在的推送配置：${NC}"
    git remote -v
    echo ""
    echo -e "${YELLOW}使用方法：${NC}"
    echo "  git push                    # 自动推送到GitHub和Gitee"
    echo "  git push origin main        # 自动推送到GitHub和Gitee"
    echo "  git push gitee main         # 只推送到Gitee"
    echo ""
else
    echo -e "${YELLOW}已跳过自动同步配置${NC}"
    echo ""
    echo -e "${BLUE}手动推送方式：${NC}"
    echo "  git push origin main        # 推送到GitHub"
    echo "  git push gitee main         # 推送到Gitee"
    echo "  git push origin main && git push gitee main  # 同时推送到两个仓库"
    echo ""
fi

echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN}配置完成！${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "${BLUE}在云服务器上的使用：${NC}"
echo ""
echo -e "${GREEN}方案1：从Gitee拉取（推荐国内服务器）${NC}"
echo "  cd ~/MyPetShop3.0"
echo "  git remote add gitee https://gitee.com/${GITEE_USERNAME}/MyPetShop3.0.git"
echo "  git pull gitee main"
echo ""
echo -e "${GREEN}方案2：永久修改origin指向Gitee${NC}"
echo "  cd ~/MyPetShop3.0"
echo "  git remote set-url origin https://gitee.com/${GITEE_USERNAME}/MyPetShop3.0.git"
echo "  git pull origin main"
echo ""
echo -e "${GREEN}方案3：使用update.sh脚本自动拉取${NC}"
echo "  修改 deployment/update.sh，将 git pull 改为 git pull gitee main"
echo ""
