# Deployment 文件夹完整说明

## 📂 文件分类

### 🐳 Docker 容器化部署（完整方案）
**需要上传到服务器**：✅ 是

| 文件 | 用途 | 极简部署需要？ |
|------|------|--------------|
| `docker-compose.yml` | Docker 编排配置，定义3个容器（前端Nginx + 后端 + MySQL） | ❌ 不需要 |
| `deploy.sh` | Docker 容器化部署的主脚本 | ❌ 不需要（用 simple-deploy.sh） |
| `Dockerfile.backend` | 后端容器的构建文件 | ❌ 不需要 |
| `Dockerfile.frontend` | 前端容器的构建文件 | ❌ 不需要 |
| `nginx.conf` | Docker 容器内部的 Nginx 配置 | ❌ 不需要 |
| `.dockerignore` | Docker 构建时的忽略文件 | ❌ 不需要 |
| `.env.example` | Docker Compose 的环境变量模板 | ❌ 不需要 |

### 🖥️ 原生部署（有 Nginx）
**需要上传到服务器**：✅ 是

| 文件 | 用途 | 极简部署需要？ |
|------|------|--------------|
| `native-deploy.sh` | 原生部署脚本（前端+后端直接运行+MySQL Docker） | ❌ 不需要（用 simple-deploy.sh） |
| `nginx-native.conf` | 主机 Nginx 配置文件 | ❌ 不需要（极简方案不用 Nginx） |
| `NATIVE-DEPLOYMENT.md` | 原生部署的使用文档 | ⚠️ 参考（可保留） |

### ⚡ 极简部署（无 Nginx）⭐ 推荐
**需要上传到服务器**：✅ 是

| 文件 | 用途 | 必须性 |
|------|------|--------|
| `simple-deploy.sh` | ⭐ 极简部署主脚本 | ✅ **必须** |
| `SIMPLE-DEPLOYMENT.md` | ⭐ 极简部署使用文档 | ✅ **必须**（参考用） |

### 🗄️ MySQL 相关（所有方案都需要）
**需要上传到服务器**：✅ 是

| 文件/目录 | 用途 | 极简部署需要？ |
|----------|------|--------------|
| `mysql-init/init.sql` | 数据库初始化脚本（创建表结构） | ✅ **必须** |
| `mysql-init/README.md` | 说明文档 | ⚠️ 可选 |
| `my.cnf` | MySQL 配置文件（字符集等） | ⚠️ 可选（有默认配置） |

### 📚 文档和辅助工具
**需要上传到服务器**：❌ 否（本地参考用）

| 文件 | 用途 | 上传到服务器？ |
|------|------|--------------|
| `README.md` | Docker 容器化部署的说明 | ❌ 不需要 |
| `QUICKREF.md` | 快速参考指南 | ❌ 不需要 |
| `UPDATE-GUIDE.md` | 更新指南 | ❌ 不需要 |
| `DEPLOYMENT-TROUBLESHOOTING.md` | 故障排查文档 | ❌ 不需要 |
| `GIT-CONFIG.md` | Git 配置说明 | ❌ 不需要 |
| `GITEE-SETUP.md` | Gitee 设置说明 | ❌ 不需要 |
| `check-status.sh` | 检查服务状态的脚本 | ❌ 不需要（Docker专用） |
| `update.sh` | 更新脚本 | ❌ 不需要（Docker专用） |
| `test-native-deployment.sh` | 测试脚本 | ❌ 不需要 |
| `test-native-deployment.ps1` | PowerShell 测试脚本 | ❌ 不需要 |
| `.gitignore` | Git 忽略文件配置 | ❌ 不需要 |

---

## 🎯 极简部署需要上传到服务器的文件

### 方法1：上传整个项目（推荐）
```bash
# 在服务器上
git clone <your-repo> /opt/MyPetShop3.0
cd /opt/MyPetShop3.0/deployment
sudo ./simple-deploy.sh
```

### 方法2：只上传必要文件
如果不想上传整个项目，只需上传这些：

```
/opt/MyPetShop3.0/
├── backend/                    # 后端源码
│   ├── src/
│   ├── pom.xml
│   └── ...
├── frontend/                   # 前端源码
│   ├── src/
│   ├── package.json
│   └── ...
└── deployment/
    ├── simple-deploy.sh       ⭐ 必须的部署脚本
    ├── mysql-init/            ⭐ 必须的数据库初始化脚本
    │   └── init.sql
    ├── SIMPLE-DEPLOYMENT.md   ⭐ 使用文档
    └── my.cnf                 可选（MySQL配置）
```

---

## 📋 各部署方案文件清单对比

| 文件 | Docker部署 | 原生部署 | 极简部署 |
|------|-----------|---------|---------|
| `simple-deploy.sh` | ❌ | ❌ | ✅ 必须 |
| `SIMPLE-DEPLOYMENT.md` | ❌ | ❌ | ✅ 必须 |
| `native-deploy.sh` | ❌ | ✅ 必须 | ❌ |
| `NATIVE-DEPLOYMENT.md` | ❌ | ✅ 必须 | ❌ |
| `nginx-native.conf` | ❌ | ✅ 必须 | ❌ |
| `deploy.sh` | ✅ 必须 | ❌ | ❌ |
| `docker-compose.yml` | ✅ 必须 | ❌ | ❌ |
| `Dockerfile.backend` | ✅ 必须 | ❌ | ❌ |
| `Dockerfile.frontend` | ✅ 必须 | ❌ | ❌ |
| `nginx.conf` | ✅ 必须 | ❌ | ❌ |
| `mysql-init/init.sql` | ✅ 必须 | ✅ 必须 | ✅ 必须 |
| `my.cnf` | ✅ 可选 | ✅ 可选 | ✅ 可选 |

---

## 🗑️ 可以删除的文件（如果只需要极简部署）

如果你确定只用极简部署，可以删除以下文件来减少项目体积：

### Docker 容器化相关
```bash
rm deployment/docker-compose.yml
rm deployment/deploy.sh
rm deployment/Dockerfile.backend
rm deployment/Dockerfile.frontend
rm deployment/nginx.conf
rm deployment/.dockerignore
rm deployment/.env.example
```

### 原生部署相关
```bash
rm deployment/native-deploy.sh
rm deployment/nginx-native.conf
rm deployment/NATIVE-DEPLOYMENT.md
rm deployment/test-native-deployment.sh
rm deployment/test-native-deployment.ps1
```

### Docker 辅助工具
```bash
rm deployment/check-status.sh
rm deployment/update.sh
```

### 文档（可选删除，但建议保留在本地）
```bash
rm deployment/README.md
rm deployment/QUICKREF.md
rm deployment/UPDATE-GUIDE.md
rm deployment/DEPLOYMENT-TROUBLESHOOTING.md
rm deployment/GIT-CONFIG.md
rm deployment/GITEE-SETUP.md
```

---

## 💡 建议

### 方案1：保留所有文件（推荐）
**原因**：
- 文件不大，不影响部署速度
- 后期可能需要切换部署方式
- 文档可以离线查看

**操作**：
- 上传整个项目到服务器
- 只使用 `simple-deploy.sh` 部署
- 其他文件当作备份

### 方案2：创建独立的部署分支
```bash
# 创建一个只包含必要文件的分支
git checkout -b simple-deployment
git checkout main -- backend frontend deployment/simple-deploy.sh deployment/mysql-init deployment/my.cnf
git commit -m "Minimal deployment package"
```

### 方案3：使用 .gitignore 控制
保留所有文件在本地，但上传到服务器时只复制需要的：
```bash
# 在服务器上
rsync -av --exclude='*.md' --exclude='docker-*' --exclude='native-*' \
  /local/path/ /opt/MyPetShop3.0/
```

---

## 📊 文件大小参考

```
deployment/
├── *.sh 脚本              ~50KB
├── *.md 文档              ~100KB
├── docker-compose.yml     ~5KB
├── Dockerfile.*           ~5KB
├── nginx-*.conf           ~10KB
└── mysql-init/init.sql    ~20KB

总计：~200KB（很小，建议保留所有）
```

---

## ✅ 最终建议

**上传整个项目到服务器**，然后：
```bash
cd /opt/MyPetShop3.0/deployment
sudo ./simple-deploy.sh
```

这样做的好处：
1. ✅ 简单直接，不用担心漏文件
2. ✅ 文件很小，不影响性能
3. ✅ 后期想换部署方式也方便
4. ✅ 有完整的文档可以离线查看

**不想上传文档？** 可以在服务器上删除：
```bash
cd /opt/MyPetShop3.0/deployment
rm *.md
rm test-*.sh test-*.ps1
rm docker-compose.yml deploy.sh
rm Dockerfile.* nginx.conf
rm native-deploy.sh nginx-native.conf
```

**保留的核心文件**：
```
deployment/
├── simple-deploy.sh      ⭐
├── mysql-init/init.sql   ⭐
└── my.cnf                ⚠️
```
