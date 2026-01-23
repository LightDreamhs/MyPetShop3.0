# 宠物店后台管理系统

一个功能完整的宠物店后台管理系统，支持库存管理、客户管理、消费记录、财务记账等核心功能。

## 项目概述

本系统采用前后端分离架构，为宠物店提供数字化管理解决方案。

### 核心功能

- **库存管理**: 商品信息的增删改查、库存管理
- **客户管理**: 客户信息管理、会员等级管理（5个级别）
- **消费记录**: 客户消费记录跟踪，支持问题诊断和建议
- **财务记账**: 收支记录管理、财务统计分析
- **用户认证**: JWT Token 认证机制

## 技术栈

### 前端
- React 18
- TypeScript
- Vite
- Ant Design
- Axios

### 后端
- Java 17
- Spring Boot 3.2.0
- MyBatis 3.0.3
- MySQL 8.0
- JWT (io.jsonwebtoken:jjwt:0.12.3)

## 项目结构

```
MyPetShop3.0/
├── frontend/              # 前端项目（React + TypeScript）
├── backend/               # 后端项目（Spring Boot）
├── reference/             # 参考文档和设计资料
├── API接口文档.md         # API接口文档
└── README.md             # 项目说明文档
```

## 快速开始

### 环境要求

- Node.js 18+
- JDK 17+
- Maven 3.6+
- MySQL 8.0+
- Git

### 1. 克隆项目

```bash
git clone <repository-url>
cd MyPetShop3.0
```

### 2. 数据库初始化

```bash
# 登录MySQL
mysql -u root -p

# 执行初始化脚本
source backend/src/main/resources/db/schema.sql
```

### 3. 启动后端服务

```bash
cd backend

# 修改数据库配置
# 编辑 src/main/resources/application.yml

# 安装依赖并启动
mvn spring-boot:run
```

后端服务将在 `http://localhost:8080` 启动

### 4. 启动前端服务

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端服务将在 `http://localhost:5173` 启动

### 5. 访问系统

- **前端地址**: http://localhost:5173
- **后端API**: http://localhost:8080/api/v1
- **默认账号**:
  - 用户名: `admin`
  - 密码: `admin123`

## 文档

### 核心文档

- [API接口文档.md](./API接口文档.md) - 完整的API接口文档
- [backend/README.md](./backend/README.md) - 后端项目详细说明
- [frontend/README.md](./frontend/README.md) - 前端项目详细说明

### 参考资料目录 `reference/`

- `prototype/` - 系统原型设计
- `frontend-description.md` - 前端设计说明文档

## 会员级别说明

系统支持5个客户会员级别：

| 级别值 | 名称 | 说明 |
|--------|------|------|
| 0 | 非会员 | 普通客户，无会员权益 |
| 1 | 初级会员 | 入门会员等级 |
| 2 | 中级会员 | 中等会员等级 |
| 3 | 高级会员 | 高等级会员 |
| 4 | 至尊会员 | 最高等级会员 |

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

## API 端点

### 认证模块
- `POST /auth/login` - 用户登录
- `GET /auth/me` - 获取当前用户信息
- `POST /auth/logout` - 用户登出

### 库存管理
- `GET /products` - 获取商品列表
- `GET /products/:id` - 获取商品详情
- `POST /products` - 创建商品
- `PUT /products/:id` - 更新商品
- `PATCH /products/:id/stock` - 修改商品库存
- `DELETE /products/:id` - 删除商品

### 客户管理
- `GET /customers` - 获取客户列表（支持按会员级别筛选）
- `GET /customers/:id` - 获取客户详情
- `POST /customers` - 创建客户
- `PUT /customers/:id` - 更新客户
- `DELETE /customers/:id` - 删除客户

### 消费记录
- `GET /customers/:customerId/consumption-records` - 获取客户消费记录
- `GET /consumption-records/:id` - 获取消费记录详情
- `POST /customers/:customerId/consumption-records` - 创建消费记录
- `PUT /consumption-records/:id` - 更新消费记录
- `DELETE /consumption-records/:id` - 删除消费记录

### 财务记账
- `GET /transactions` - 获取财务记录列表
- `GET /transactions/:id` - 获取财务记录详情
- `POST /transactions` - 创建财务记录
- `PUT /transactions/:id` - 更新财务记录
- `DELETE /transactions/:id` - 删除财务记录
- `GET /transactions/statistics` - 获取财务统计

## 数据模型

### 核心实体

- **User**: 用户
- **Product**: 商品
- **Customer**: 客户（包含会员级别）
- **ConsumptionRecord**: 消费记录
- **Transaction**: 财务记录

详细数据结构请参考 [API接口文档.md](./API接口文档.md)

## 部署

### Docker 部署

```bash
# 使用 Docker Compose 启动所有服务
docker-compose up -d
```

### 手动部署

详见各子项目的 README 文档：
- [backend/README.md](./backend/README.md) - 后端部署说明
- [frontend/README.md](./frontend/README.md) - 前端部署说明

## 常见问题

### 1. 数据库连接失败

检查 MySQL 服务是否启动，配置文件中的用户名密码是否正确。

### 2. 前端无法访问后端API

确认后端服务已启动，检查跨域配置和API地址。

### 3. Token 过期

Token 有效期为 2 小时，过期后需要重新登录。

## 更新日志

### v1.1.0 (2025-01-23)
- ✨ 新增客户会员级别功能（0-4级）
- ✨ 客户管理支持按会员级别筛选
- 🐛 修复日期序列化格式问题
- 📝 更新 API 文档和 README

### v1.0.0 (2024-01-15)
- 🎉 初始版本发布
- ✨ 完成基础 CRUD 功能
- ✨ JWT 认证机制
- ✨ 财务统计功能

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发送邮件至项目维护者

---

**注意**: 本项目仅供学习参考使用。
