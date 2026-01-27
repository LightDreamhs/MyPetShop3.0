# 本地开发环境快速启动指南

## 前置条件

✅ **已完成**：
- MySQL 已安装并运行在 3307 端口
- 数据库 `pet_shop_3_0` 已创建
- 数据表已初始化

## 🚀 一键启动

### 方法1：使用 IDE（推荐）

**后端**：
1. 用 IDEA 打开 `backend` 目录
2. 等待 Maven 依赖下载完成
3. 运行 `PetShopBackendApplication` 主类

**前端**：
1. 用 VSCode 打开 `frontend` 目录
2. 打开终端，运行：
   ```bash
   npm install  # 首次需要
   npm run dev
   ```

### 方法2：使用命令行

**启动后端**（Terminal 1）：
```bash
cd backend
mvn spring-boot:run
```

**启动前端**（Terminal 2）：
```bash
cd frontend
npm run dev
```

## 📍 访问地址

启动成功后：
- **前端**：http://localhost:5173
- **后端API**：http://localhost:8080/api/v1
- **默认账号**：admin / admin123

## 🔍 关键配置说明

### 后端配置 (application.yml)
```yaml
server:
  port: 8080
  servlet:
    context-path: /api/v1

spring:
  datasource:
    url: jdbc:mysql://localhost:3307/pet_shop_3_0  # ✅ 你的MySQL端口
    username: root
    password: root

file:
  upload-dir: uploads/images/  # 上传目录（相对于项目根目录）
  server-domain: http://localhost:8080  # ✅ 图片访问域名（不含context-path）
```

### 前端配置 (vite.config.ts)
```typescript
server: {
  proxy: {
    '/api/v1': {
      target: 'http://localhost:8080',  // ✅ 自动代理到后端
      changeOrigin: true,
    },
  },
}
```

## 🖼️ 图片上传说明

### 工作流程：
1. 前端上传图片 → `POST /api/v1/upload/image`
2. 后端保存到 `backend/uploads/images/`
3. 返回URL：`http://localhost:8080/api/v1/uploads/images/xxx.jpg`
4. 前端显示图片（通过API访问）

### 本地访问路径：
- **文件路径**：`D:\MyProject\MyPetShop3.0\backend\uploads\images\xxx.jpg`
- **访问URL**：`http://localhost:8080/api/v1/uploads/images/xxx.jpg`

## ⚠️ 常见问题

### Q1: 后端启动失败，连接MySQL错误
**解决**：
```bash
# 检查MySQL是否运行
netstat -ano | findstr :3307

# 检查数据库是否存在
mysql -h localhost -P 3307 -u root -p
> SHOW DATABASES;
```

### Q2: 图片上传后显示404
**解决**：
1. 检查文件是否真的保存成功
2. 确认 `file.server-domain` 配置正确（不含 /api/v1）
3. 清除浏览器缓存重试

### Q3: 前端无法访问后端API
**解决**：
1. 确认后端已启动（访问 http://localhost:8080/api/v1/health）
2. 检查前端终端是否有代理错误
3. 清除浏览器缓存

### Q4: CORS 错误
**解决**：
后端已配置 CORS 允许所有来源，如果还有问题：
```bash
# 重启后端
# 在 IDEA 中点击停止，然后重新运行
```

## 📝 开发提示

### 后端热重载
- IDEA 默认支持 Spring Boot DevTools
- 修改 Java 代码后自动编译并重启

### 前端热重载
- Vite 默认支持 HMR（热模块替换）
- 修改代码后自动刷新浏览器

### 查看后端日志
- IDEA 控制台会实时显示日志
- 日志级别：DEBUG（显示 SQL 语句）

### 数据库操作
```bash
# 连接数据库
mysql -h localhost -P 3307 -u root -p

# 切换数据库
USE pet_shop_3_0;

# 查看表
SHOW TABLES;

# 重置数据（如需要）
SOURCE /path/to/mysql-init/init.sql;
```

## 🎯 下一步

1. ✅ 启动后端（等待看到 "Started PetShopBackendApplication"）
2. ✅ 启动前端（等待看到 "Local: http://localhost:5173"）
3. ✅ 打开浏览器访问 http://localhost:5173
4. ✅ 使用 admin / admin123 登录
5. ✅ 测试图片上传功能

## 💡 提示

- **首次启动**：Maven 下载依赖需要几分钟
- **数据库**：确保 MySQL 服务正在运行
- **端口冲突**：如果 8080 被占用，修改 `application.yml` 中的 `server.port`
- **文件权限**：Windows 下不用担心文件权限问题

---

**祝你开发顺利！** 🎉
