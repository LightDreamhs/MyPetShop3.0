# GitHub + Gitee 双仓库同步配置指南

> 📖 解决国内服务器访问GitHub困难的问题

## 📋 目录

- [为什么需要双仓库](#为什么需要双仓库)
- [配置步骤](#配置步骤)
- [使用方法](#使用方法)
- [云服务器配置](#云服务器配置)
- [常见问题](#常见问题)

---

## 🎯 为什么需要双仓库

### 问题
- ❌ 国内服务器访问GitHub速度慢或不稳定
- ❌ `git pull` 经常失败或超时
- ❌ 大文件克隆无法完成

### 解决方案
- ✅ 同时使用GitHub（主仓库）和Gitee（镜像仓库）
- ✅ 本地开发推送到两个仓库
- ✅ 云服务器从Gitee拉取（速度快）

---

## 🚀 配置步骤

### 方式1：自动配置（推荐）

```bash
cd ~/MyPetShop3.0/deployment
chmod +x setup-gitee.sh
./setup-gitee.sh
```

按提示输入Gitee用户名即可完成配置。

### 方式2：手动配置

#### 第1步：在Gitee上创建仓库

1. 访问 https://gitee.com/
2. 登录或注册
3. 点击右上角 "+" → "新建仓库"
4. 填写信息：
   - 仓库名称：`MyPetShop3.0`
   - 仓库介绍：`宠物店管理系统`
   - 是否公开：**私有**（如果GitHub是私有的）
   - **取消勾选**：使用Readme初始化仓库
   - **取消勾选**：添加.gitignore
   - **取消勾选****：选择分支模型

5. 点击"创建"

#### 第2步：添加Gitee远程仓库

```bash
cd ~/MyPetShop3.0
git remote add gitee https://gitee.com/你的用户名/MyPetShop3.0.git
```

#### 第3步：验证配置

```bash
git remote -v
```

应该看到：
```
origin  https://github.com/LightDreamhs/MyPetShop3.0.git (fetch)
origin  https://github.com/LightDreamhs/MyPetShop3.0.git (push)
gitee   https://gitee.com/你的用户名/MyPetShop3.0.git (fetch)
gitee   https://gitee.com/你的用户名/MyPetShop3.0.git (push)
```

#### 第4步：推送代码到Gitee

```bash
git push gitee main
```

输入Gitee账号密码，等待推送完成。

---

## 📖 使用方法

### 方案A：分别推送（简单）

```bash
# 推送到GitHub
git push origin main

# 推送到Gitee
git push gitee main

# 或同时推送到两个仓库
git push origin main && git push gitee main
```

### 方案B：自动推送到两个仓库（推荐）

配置一次后，`git push` 会自动推送到两个仓库：

```bash
# 配置多个push URL
git remote set-url --add --push origin https://github.com/LightDreamhs/MyPetShop3.0.git
git remote set-url --add --push origin https://gitee.com/你的用户名/MyPetShop3.0.git

# 验证配置
git remote -v
```

应该看到：
```
origin  https://github.com/LightDreamhs/MyPetShop3.0.git (fetch)
origin  https://github.com/LightDreamhs/MyPetShop3.0.git (push)
origin  https://gitee.com/你的用户名/MyPetShop3.0.git (push)
```

现在只需执行：
```bash
git push origin main  # 自动推送到GitHub和Gitee
```

---

## 🌐 云服务器配置

### 选项1：永久修改origin指向Gitee

```bash
cd ~/MyPetShop3.0
git remote set-url origin https://gitee.com/你的用户名/MyPetShop3.0.git
git pull origin main
```

### 选项2：添加gitee远程仓库

```bash
cd ~/MyPetShop3.0
git remote add gitee https://gitee.com/你的用户名/MyPetShop3.0.git
git pull gitee main
```

### 选项3：使用update.sh脚本（已配置）

脚本会自动优先使用Gitee：

```bash
cd ~/MyPetShop3.0/deployment
./update.sh
```

如果配置了Gitee远程仓库，脚本会自动从Gitee拉取。

### 选项4：使用环境变量

```bash
export GIT_REMOTE=gitee
cd ~/MyPetShop3.0/deployment
./update.sh
```

---

## 🔍 验证配置

### 本地验证

```bash
# 1. 查看远程仓库
git remote -v

# 2. 测试连接
git ls-remote --heads origin
git ls-remote --heads gitee

# 3. 查看配置
git config --list | grep remote
```

### 服务器端验证

```bash
cd ~/MyPetShop3.0

# 查看当前使用的远程仓库
git remote -v

# 查看当前分支跟踪的远程仓库
git branch -vv
```

---

## 🛠️ 实际工作流程

### 开发流程

```bash
# 1. 本地修改代码
git add .
git commit -m "描述修改内容"

# 2. 推送到GitHub和Gitee
git push origin main

# 3. 如果没有配置自动推送
git push origin main && git push gitee main
```

### 部署流程

```bash
# 在云服务器上

# 方案A：使用update.sh（推荐）
cd ~/MyPetShop3.0/deployment
./update.sh

# 方案B：手动拉取
cd ~/MyPetShop3.0
git pull gitee main
cd deployment
docker-compose down
docker-compose up -d --build
```

---

## 📊 速度对比

| 操作 | GitHub | Gitee |
|------|--------|-------|
| 克隆仓库 | 10-60秒或失败 | 2-5秒 ✅ |
| git pull | 5-30秒或失败 | 1-3秒 ✅ |
| git push | 10-60秒 | 2-5秒 ✅ |

---

## ❓ 常见问题

### Q1: Gitee推送需要密码怎么办？

**A**: 使用SSH密钥或配置凭据：

```bash
# 方案1：使用SSH（推荐）
git remote set-url gitee git@gitee.com:你的用户名/MyPetShop3.0.git

# 方案2：保存凭据
git config --global credential.helper store
git push gitee main  # 输入一次后会记住密码
```

### Q2: 两个仓库如何保持同步？

**A**: 每次推送时同时推送到两个仓库：

```bash
git push origin main && git push gitee main
```

或者配置自动推送（见"方案B"）

### Q3: 如果只想推送到一个仓库怎么办？

**A**: 指定远程仓库名称：

```bash
# 只推送到GitHub
git push origin main

# 只推送到Gitee
git push gitee main
```

### Q4: update.sh脚本默认从哪里拉取？

**A**:
1. 优先从Gitee拉取（如果配置了gitee远程仓库）
2. 如果Gitee不存在，则从origin拉取
3. 可以通过环境变量`GIT_REMOTE`指定：
   ```bash
   export GIT_REMOTE=origin  # 使用GitHub
   export GIT_REMOTE=gitee   # 使用Gitee
   ```

### Q5: 如何删除Gitee远程仓库？

**A**:
```bash
git remote remove gitee
```

### Q6: 如何查看当前使用的远程仓库？

**A**:
```bash
# 查看所有远程仓库
git remote -v

# 查看当前分支跟踪的远程仓库
git branch -vv

# 查看fetch和push的URL
git remote show origin
git remote show gitee
```

---

## 📝 推荐配置

### 本地开发机器

```bash
# 添加Gitee远程仓库
git remote add gitee https://gitee.com/你的用户名/MyPetShop3.0.git

# 配置自动推送（可选）
git remote set-url --add --push origin https://github.com/LightDreamhs/MyPetShop3.0.git
git remote set-url --add --push origin https://gitee.com/你的用户名/MyPetShop3.0.git

# 推送时自动同步到两个仓库
git push origin main
```

### 国内云服务器

```bash
# 方案A：永久修改origin
git remote set-url origin https://gitee.com/你的用户名/MyPetShop3.0.git

# 或方案B：添加gitee并优先使用
git remote add gitee https://gitee.com/你的用户名/MyPetShop3.0.git

# 使用update.sh会自动优先使用Gitee
cd ~/MyPetShop3.0/deployment
./update.sh
```

---

## 🎯 总结

### 本地
- ✅ 推送到GitHub（备份）
- ✅ 推送到Gitee（同步）

### 服务器
- ✅ 从Gitee拉取（速度快）
- ✅ 使用update.sh自动化更新

### 优势
- 🚀 国内服务器拉取速度快
- 🔒 代码有双重备份
- ⚡ 不受网络波动影响
- 🛠️ 配置简单，一次配置永久使用

---

## 📞 需要帮助？

如果遇到问题：
1. 检查远程仓库配置：`git remote -v`
2. 测试网络连接：`ping gitee.com`
3. 查看Git日志：`git log --oneline -5`
4. 运行状态检查：`./check-status.sh`
