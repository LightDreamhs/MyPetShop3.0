# 宠物店后台管理系统

基于 Spring Boot 3 + React 19 + TypeScript 的宠物店后台管理系统，提供库存管理、客户管理、销售管理、消费记录、财务记账和会员余额管理等核心功能。

## 项目概述

本系统采用前后端分离架构，为宠物店提供数字化管理解决方案。

### 核心功能

| 模块 | 功能 |
|------|------|
| **库存管理** | 商品信息增删改查、库存管理、散客开单 |
| **客户管理** | 客户信息管理、会员等级管理（5 个级别） |
| **会员余额管理** | 会员充值、扣减、余额变动历史查询 |
| **消费记录** | 客户消费记录跟踪、问题诊断、服务建议 |
| **财务记账** | 收支记录管理、财务统计分析、月度统计 |
| **用户管理** | 店员管理、角色权限控制（ADMIN/STAFF） |
| **销售管理** | 散客/会员统一销售流程、库存自动扣减 |

## 技术栈

### 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| **React** | 19.2.0 | 前端框架 |
| **TypeScript** | 5.9.3 | 类型系统 |
| **Vite** | 7.2.4 | 构建工具 |
| **React Router DOM** | 7.12.0 | 路由管理 |
| **Zustand** | 5.0.10 | 状态管理 |
| **Axios** | 1.13.2 | HTTP 客户端 |
| **Tailwind CSS** | 4.1.18 | UI 样式 |
| **Lucide React** | 0.562.0 | 图标库 |

### 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| **Java** | 17 | 编程语言 |
| **Spring Boot** | 3.2.0 | 应用框架 |
| **MyBatis** | 3.0.3 | ORM 框架 |
| **MySQL** | 8.0 | 数据库 |
| **JWT** | 0.12.3 | 认证授权 |
| **Lombok** | - | 代码简化 |
| **HikariCP** | - | 数据库连接池 |

## 项目结构

```
MyPetShop3.0/
├── frontend/              # 前端项目（React + TypeScript + Vite）
│   ├── src/
│   │   ├── components/    # 组件目录
│   │   │   ├── ui/        # UI 基础组件（Button, Dialog, Card 等）
│   │   │   └── ...
│   │   ├── pages/         # 页面组件
│   │   ├── stores/        # Zustand 状态管理
│   │   ├── services/      # API 服务
│   │   ├── utils/         # 工具函数
│   │   └── types/         # TypeScript 类型定义
│   └── package.json
├── backend/               # 后端项目（Spring Boot 3.2）
│   ├── src/main/java/com/petshop/backend/
│   │   ├── controller/    # 控制器层（8 个）
│   │   ├── service/       # 服务层
│   │   ├── mapper/        # MyBatis Mapper（8 个）
│   │   ├── entity/        # 实体类（8 个）
│   │   ├── dto/           # 数据传输对象（10 个）
│   │   ├── config/        # 配置类
│   │   ├── interceptor/   # 拦截器（JWT、角色）
│   │   └── exception/     # 异常处理
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   ├── db/schema.sql  # 数据库初始化脚本
│   │   └── mapper/        # MyBatis XML 映射
│   └── pom.xml
├── deployment/            # Docker 部署配置
│   ├── docker-compose.yml
│   └── mysql-init/
├── docs/                  # 项目文档
│   └── frontend-architecture.md
└── README.md
```

## 快速开始

### 环境要求

- Node.js 18+
- JDK 17+
- Maven 3.6+
- MySQL 8.0+
- Docker（推荐）

### 1. 数据库准备

#### 使用 Docker（推荐）

```bash
cd deployment
docker compose up -d mysql

# 等待容器启动后，执行初始化脚本
docker exec -i petshop-mysql mysql -uroot -proot pet_shop_3_0 < backend/src/main/resources/db/schema.sql
```

#### 使用本地 MySQL

```bash
# 登录 MySQL（端口 3307）
mysql -h 127.0.0.1 -P 3307 -u root -p

# 创建数据库
CREATE DATABASE IF NOT EXISTS pet_shop_3_0 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 执行初始化脚本
source backend/src/main/resources/db/schema.sql
```

### 2. 启动后端服务

```bash
cd backend

# 确认数据库配置（src/main/resources/application.yml）
# mvn spring-boot:run
```

后端服务将在 `http://localhost:8080/api/v1` 启动

### 3. 启动前端服务

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端服务将在 `http://localhost:5173` 启动

### 4. 访问系统

- **前端地址**: http://localhost:5173
- **后端 API**: http://localhost:8080/api/v1
- **默认账号**: 用户名 `admin`（无需密码）

## 文档

| 文档 | 说明 |
|------|------|
| [backend/README.md](./backend/README.md) | 后端项目详细说明（架构、API、配置） |
| [frontend/README.md](./frontend/README.md) | 前端项目详细说明 |
| [docs/frontend-architecture.md](./docs/frontend-architecture.md) | 前端技术文档（架构、组件、状态管理） |
| [API接口文档.md](./API接口文档.md) | API 接口文档 |
| [deployment/PERFORMANCE_OPTIMIZATION.md](./deployment/PERFORMANCE_OPTIMIZATION.md) | 性能优化指南 |

## 会员级别说明

系统支持 5 个客户会员级别（按充值金额档位）：

| 级别值 | 名称 | 充值档位 | 颜色 |
|--------|------|----------|------|
| 0 | 非会员 | - | 灰色 |
| 1 | 500 元档 | 500 元 | 绿色 |
| 2 | 1000 元档 | 1000 元 | 蓝色 |
| 3 | 2000 元档 | 2000 元 | 紫色 |
| 4 | 5000 元档 | 5000 元 | 红色 |

## API 端点

### 认证模块 (`/auth`)
- `POST /auth/login` - 用户登录
- `GET /auth/me` - 获取当前用户信息
- `POST /auth/logout` - 用户登出

### 用户管理 (`/users`) - ADMIN
- `GET /users` - 获取用户列表（分页、搜索）
- `GET /users/{id}` - 获取用户详情
- `POST /users` - 创建用户
- `PUT /users/{id}` - 更新用户
- `DELETE /users/{id}` - 删除用户

### 商品管理 (`/products`)
- `GET /products` - 获取商品列表（分页、搜索）
- `POST /products` - 创建商品 - ADMIN
- `PUT /products/{id}` - 更新商品 - ADMIN
- `PATCH /products/{id}/stock` - 修改商品库存
- `DELETE /products/{id}` - 删除商品 - ADMIN

### 客户管理 (`/customers`)
- `GET /customers` - 获取客户列表（分页、搜索、会员级别筛选）
- `POST /customers` - 创建客户
- `PUT /customers/{id}` - 更新客户
- `DELETE /customers/{id}` - 删除客户 - ADMIN
- `POST /customers/{id}/balance/recharge` - 会员余额充值
- `POST /customers/{id}/balance/deduct` - 会员余额扣减
- `GET /customers/{id}/balance/history` - 获取余额变动历史

### 销售管理 (`/sales`)
- `GET /sales` - 获取销售记录列表（分页、日期范围）
- `POST /sales` - 创建销售记录（散客 + 会员通用）

### 消费记录 (`/consumption-records`)
- `GET /customers/{customerId}/consumption-records` - 获取客户消费记录
- `POST /customers/{customerId}/consumption-records` - 创建消费记录
- `PUT /consumption-records/{id}` - 更新消费记录
- `DELETE /consumption-records/{id}` - 删除消费记录 - ADMIN

### 财务记账 (`/transactions`)
- `GET /transactions` - 获取财务记录列表（分页、类型、日期范围、搜索）
- `POST /transactions` - 创建财务记录
- `PUT /transactions/{id}` - 更新财务记录
- `DELETE /transactions/{id}` - 删除财务记录 - ADMIN
- `GET /transactions/statistics` - 获取财务统计
- `GET /transactions/monthly-statistics` - 获取按月统计

### 文件上传 (`/upload`)
- `POST /upload/image` - 上传图片（单文件最大 5MB）

## 开发指南

### 后端开发

```bash
cd backend

# 编译
mvn clean compile

# 运行测试
mvn test

# 打包
mvn clean package
```

### 前端开发

```bash
cd frontend

# 开发模式
npm run dev

# 类型检查
npm run type-check

# 代码检查
npm run lint

# 构建生产版本
npm run build
```

## 部署

### Docker 部署（推荐）

```bash
cd deployment

# 启动所有服务
docker compose up -d

# 查看日志
docker compose logs -f

# 停止服务
docker compose down
```

### 手动部署

详见各子项目的 README 文档：
- [backend/README.md](./backend/README.md) - 后端部署说明
- [frontend/README.md](./frontend/README.md) - 前端部署说明

## 注意事项

1. **Token 过期**: Token 有效期为 2 小时，过期后需要重新登录
2. **金额单位**: 后端使用"分"作为金额单位，前端显示时转换为"元"
3. **角色权限**: ADMIN 可访问所有功能，STAFF 不能删除数据
4. **库存管理**: 使用乐观锁防止超卖
5. **图片上传**: 当前使用 placehold.co 占位图服务

## 常见问题

### 1. 数据库连接失败

检查 MySQL 服务是否启动，确认 `application.yml` 中的连接信息正确。

### 2. 前端无法访问后端 API

确认后端服务已启动，检查 Vite 代理配置。

### 3. Token 过期

Token 有效期为 2 小时，过期后自动跳转登录页。

## 更新日志

### v1.3.0 (2025-02-05)
- 新增会员余额管理功能（充值、扣减、历史记录）
- 客户模型新增 `balance` 字段
- 财务记账新增搜索功能
- 前端升级到 React 19、Tailwind CSS 4

### v1.1.0 (2025-01-24)
- 新增用户管理模块
- 新增文件上传模块
- 客户会员级别功能优化（支持 0-4 级）
- Docker 容器化部署方案

### v1.0.0 (2024-01-15)
- 初始版本发布
- 完成基础 CRUD 功能
- JWT 认证机制
- 财务统计功能

## 许可证

本项目采用 MIT 许可证。

---

*最后更新：2026-03-04*
