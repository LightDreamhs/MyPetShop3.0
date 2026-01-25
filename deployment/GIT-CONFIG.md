# Git 双仓库配置记录

> 配置日期：2026-01-25

## 📋 当前配置

### 远程仓库配置

```
origin  https://github.com/LightDreamhs/MyPetShop3.0.git (fetch)
origin  https://github.com/LightDreamhs/MyPetShop3.0.git (push)
origin  https://gitee.com/light-dreamz/my-pet-shop3.0.git (push)  ← 自动推送
gitee   https://gitee.com/light-dreamz/my-pet-shop3.0.git (fetch)
gitee   https://gitee.com/light-dreamz/my-pet-shop3.0.git (push)
```

### 仓库地址

- **GitHub**: https://github.com/LightDreamhs/MyPetShop3.0.git
- **Gitee**: https://gitee.com/light-dreamz/my-pet-shop3.0.git

---

## 🚀 使用方法

### 本地开发

```bash
# 修改代码后，只需一条命令推送到两个仓库
git push origin main

# 或分别推送
git push origin main   # GitHub
git push gitee main    # Gitee
```

### 云服务器

#### 方案1：添加Gitee远程仓库（推荐）

```bash
cd ~/MyPetShop3.0
git remote add gitee https://gitee.com/light-dreamz/my-pet-shop3.0.git
git pull gitee main
```

#### 方案2：永久修改origin指向Gitee

```bash
cd ~/MyPetShop3.0
git remote set-url origin https://gitee.com/light-dreamz/my-pet-shop3.0.git
git pull origin main
```

#### 方案3：使用update.sh（已配置自动优先使用Gitee）

```bash
cd ~/MyPetShop3.0/deployment
./update.sh
```

脚本会自动：
- ✅ 检测Gitee远程仓库
- ✅ 优先从Gitee拉取（速度快）
- ✅ 如果Gitee不存在则使用GitHub

---

## 📊 配置状态

- ✅ GitHub远程仓库：已配置
- ✅ Gitee远程仓库：已配置
- ✅ 自动推送到两个仓库：已配置
- ✅ update.sh脚本：已配置优先使用Gitee
- ✅ 代码已推送到Gitee：完成

---

## 🔄 日常工作流程

### 1. 本地开发并推送

```bash
# 在本地修改代码
git add .
git commit -m "描述修改内容"
git push origin main  # 自动推送到GitHub和Gitee
```

### 2. 服务器更新

```bash
# 在云服务器上
cd ~/MyPetShop3.0/deployment
./update.sh  # 自动从Gitee拉取（速度快）
```

### 3. 验证更新

```bash
./check-status.sh  # 查看系统状态
```

---

## 🛠️ 故障排查

### 问题1: Gitee推送失败

**检查配置**：
```bash
git remote -v
```

**重新配置**：
```bash
git remote remove gitee
git remote add gitee https://gitee.com/light-dreamz/my-pet-shop3.0.git
git push gitee main
```

### 问题2: 服务器无法从Gitee拉取

**在服务器上执行**：
```bash
cd ~/MyPetShop3.0
git remote add gitee https://gitee.com/light-dreamz/my-pet-shop3.0.git
git pull gitee main
```

### 问题3: 只想推送到一个仓库

**推送到GitHub**：
```bash
git push origin main
```

**只推送到Gitee**：
```bash
git push gitee main
```

---

## 📝 备注

- Gitee用户名：light-dreamz
- 仓库名称：my-pet-shop3.0
- 主分支：main
- 自动推送：已配置（origin push会同时推送到两个仓库）

---

## 🔗 相关文档

- [完整配置指南](GITEE-SETUP.md)
- [更新使用指南](UPDATE-GUIDE.md)
- [部署指南](README.md)
