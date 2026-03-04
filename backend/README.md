# 宠物店后台管理系统 - 后端

基于 Spring Boot 3 + MyBatis + MySQL 的宠物店后台管理系统后端服务，提供商品管理、客户管理、销售管理、消费记录、财务记账和会员余额管理等核心功能。

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| **Java** | 17 | 编程语言 |
| **Spring Boot** | 3.2.0 | 应用框架 |
| **MyBatis** | 3.0.3 | ORM 框架 |
| **MySQL** | 8.0 | 数据库 |
| **JWT** | 0.12.3 | 认证授权 |
| **Lombok** | - | 代码简化 |
| **HikariCP** | - | 数据库连接池 |
| **commons-pool2** | 2.11.1 | 对象池 |

### Maven 依赖

项目使用以下核心依赖：

```xml
<!-- Spring Boot Web -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>

<!-- Spring Boot Validation -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>

<!-- MyBatis Spring Boot Starter -->
<dependency>
    <groupId>org.mybatis.spring.boot</groupId>
    <artifactId>mybatis-spring-boot-starter</artifactId>
    <version>3.0.3</version>
</dependency>

<!-- MySQL Driver -->
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
</dependency>

<!-- JWT (jjwt) -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.3</version>
</dependency>

<!-- Lombok -->
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
</dependency>
```

## 项目结构

```
backend/
├── src/main/java/com/petshop/backend/
│   ├── PetShopBackendApplication.java  # 主应用类
│   ├── annotation/                     # 自定义注解
│   │   └── RequireRole.java            # 角色权限注解
│   ├── config/                         # 配置类
│   │   ├── JwtConfig.java              # JWT 配置
│   │   └── WebConfig.java              # Web 配置（跨域、拦截器、静态资源）
│   ├── controller/                     # 控制器层（8 个）
│   │   ├── AuthController.java         # 认证控制器
│   │   ├── UserController.java         # 用户控制器
│   │   ├── ProductController.java      # 商品控制器
│   │   ├── CustomerController.java     # 客户控制器
│   │   ├── SaleController.java         # 销售控制器
│   │   ├── ConsumptionRecordController.java  # 消费记录控制器
│   │   ├── TransactionController.java  # 财务记录控制器
│   │   └── UploadController.java       # 文件上传控制器
│   ├── dto/                            # 数据传输对象（10 个）
│   │   ├── Result.java                 # 统一响应结果
│   │   ├── PageResult.java             # 分页响应结果
│   │   ├── LoginResponse.java          # 登录响应
│   │   ├── SaleCreateRequest.java      # 销售创建请求
│   │   ├── SaleResponse.java           # 销售响应
│   │   ├── TransactionStatistics.java  # 财务统计
│   │   ├── MonthlyStatistics.java      # 月度统计
│   │   ├── UploadResponse.java         # 上传响应
│   │   ├── BalanceRechargeRequest.java # 充值请求
│   │   └── BalanceDeductRequest.java   # 扣减请求
│   ├── entity/                         # 实体类（8 个）
│   │   ├── BaseEntity.java             # 基础实体类
│   │   ├── User.java
│   │   ├── Product.java
│   │   ├── Customer.java
│   │   ├── Sale.java
│   │   ├── SaleItem.java
│   │   ├── ConsumptionRecord.java
│   │   ├── Transaction.java
│   │   └── BalanceTransaction.java
│   ├── enums/                          # 枚举类
│   │   └── Role.java                   # 用户角色枚举
│   ├── exception/                      # 异常处理
│   │   ├── BusinessException.java      # 业务异常
│   │   ├── InsufficientStockException.java  # 库存不足异常
│   │   └── GlobalExceptionHandler.java  # 全局异常处理器
│   ├── interceptor/                    # 拦截器
│   │   ├── JwtInterceptor.java         # JWT 认证拦截器
│   │   └── RoleInterceptor.java        # 角色权限拦截器
│   ├── mapper/                         # MyBatis Mapper 接口（8 个）
│   │   ├── UserMapper.java
│   │   ├── ProductMapper.java
│   │   ├── CustomerMapper.java
│   │   ├── BalanceTransactionMapper.java
│   │   ├── SaleMapper.java
│   │   ├── SaleItemMapper.java
│   │   ├── ConsumptionRecordMapper.java
│   │   └── TransactionMapper.java
│   ├── service/                        # 服务层
│   │   ├── impl/                       # 服务实现类
│   │   ├── AuthService.java
│   │   ├── UserService.java
│   │   ├── ProductService.java
│   │   ├── CustomerService.java
│   │   ├── SaleService.java
│   │   ├── ConsumptionRecordService.java
│   │   ├── TransactionService.java
│   │   └── FileService.java
│   └── util/                           # 工具类
│       ├── JwtUtil.java                # JWT 工具类
│       └── PaginationUtil.java         # 分页工具类
└── src/main/resources/
    ├── application.yml                  # 应用配置
    ├── db/                             # 数据库脚本
    │   ├── schema.sql                   # 数据库初始化脚本
    │   └── migration_add_role.sql       # 迁移脚本
    └── mapper/                          # MyBatis XML 映射文件（8 个）
```

## 架构设计

### 分层架构

```
┌─────────────────────────────────────────────────────────┐
│                      HTTP 请求                           │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   WebConfig (配置层)                     │
│  • CORS 跨域配置  • 拦截器注册  • 静态资源映射          │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────┬──────────────────────────────────┐
│  JwtInterceptor      │  RoleInterceptor                 │
│  (order=1)           │  (order=2)                       │
│  • Token 验证        │  • @RequireRole 注解检查         │
│  • 用户信息解析      │  • 角色权限验证                   │
└──────────────────────┴──────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   Controller 层                          │
│  • 参数校验 (@Valid)  • 权限控制  • 响应封装           │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    Service 层                            │
│  • 业务逻辑  • 事务管理 (@Transactional)               │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    Mapper 层                             │
│  • MyBatis 接口  • SQL 映射 (XML)                       │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    MySQL 数据库                          │
└─────────────────────────────────────────────────────────┘
```

### 请求处理时序

```
客户端                    拦截器链              Controller              Service             Mapper
  │                         │                      │                      │                   │
  │─ POST /api/v1/auth/login│                      │                      │                   │
  │   (用户名)              │                      │                      │                   │
  │────────────────────────>│                      │                      │                   │
  │                         │ (跳过，登录接口在白名单)                       │                   │
  │                         │─────────────────────>│                      │                   │
  │                         │                      │─ 查询用户            │                   │
  │                         │                      │─────────────────────>│                   │
  │                         │                      │                      │─ 执行 SQL         │
  │                         │                      │                      │──────────────────>│
  │                         │                      │                      │<──────────────────│
  │                         │                      │<─────────────────────│                   │
  │                         │                      │─ 生成 JWT Token      │                   │
  │                         │                      │<─────────────────────│                   │
  │                         │<─────────────────────│                      │                   │
  │<────────────────────────│                      │                      │                   │
  │   { user, token }       │                      │                      │                   │
  │                         │                      │                      │                   │
  │─ GET /api/v1/products   │                      │                      │                   │
  │   Authorization: Bearer │                      │                      │                   │
  │   xxx                   │                      │                      │                   │
  │────────────────────────>│                      │                      │                   │
  │                         │─ 验证 Token          │                      │                   │
  │                         │─ 解析 userId/role    │                      │                   │
  │                         │─────────────────────>│                      │                   │
  │                         │                      │─ 调用 Service        │                   │
  │                         │                      │─────────────────────>│                   │
  │                         │                      │                      │─ 调用 Mapper      │
  │                         │                      │                      │──────────────────>│
  │                         │                      │                      │<──────────────────│
  │                         │                      │<─────────────────────│                   │
  │                         │<─────────────────────│                      │                   │
  │<────────────────────────│                      │                      │                   │
  │   { code, data }        │                      │                      │                   │
```

### 认证授权机制

系统采用 JWT Token 认证 + 基于角色的访问控制（RBAC）：

1. **登录流程**：
   - 用户提交用户名（无需密码）
   - 后端验证用户存在性
   - 生成 JWT Token（包含 userId、username、role）
   - 返回用户信息和 Token

2. **请求拦截**：
   - `JwtInterceptor`（order=1）：验证 Token 有效性，解析用户信息
   - `RoleInterceptor`（order=2）：检查 `@RequireRole` 注解，验证角色权限

3. **角色定义**：
   - `ADMIN`：管理员，可访问所有接口
   - `STAFF`：普通员工，受限访问（如不能删除数据）

## API 接口文档

### 基础信息

- **Base URL**：`http://localhost:8080/api/v1`
- **认证方式**：Bearer Token（JWT）
- **响应格式**：JSON

### 统一响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

### 认证模块

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/auth/login` | 用户登录 | 公开 |
| GET | `/auth/me` | 获取当前用户信息 | 已登录 |
| POST | `/auth/logout` | 用户登出 | 已登录 |

**登录示例**：
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin"}'
```

### 用户管理

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/users` | 获取用户列表（分页、搜索） | ADMIN |
| GET | `/users/{id}` | 获取用户详情 | 自己或 ADMIN |
| POST | `/users` | 创建用户 | ADMIN |
| PUT | `/users/{id}` | 更新用户 | 自己或 ADMIN |
| DELETE | `/users/{id}` | 删除用户 | ADMIN |

### 商品管理

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/products` | 获取商品列表（分页、搜索） | 所有用户 |
| GET | `/products/{id}` | 获取商品详情 | 所有用户* |
| POST | `/products` | 创建商品 | ADMIN |
| PUT | `/products/{id}` | 更新商品 | ADMIN |
| PATCH | `/products/{id}/stock` | 修改库存 | 所有用户 |
| DELETE | `/products/{id}` | 删除商品 | ADMIN |

*非管理员用户查询时，`price` 字段返回 `null`

### 客户管理

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/customers` | 获取客户列表（分页、搜索、会员级别筛选） | 所有用户 |
| GET | `/customers/{id}` | 获取客户详情 | 所有用户 |
| POST | `/customers` | 创建客户 | 所有用户 |
| PUT | `/customers/{id}` | 更新客户 | 所有用户 |
| DELETE | `/customers/{id}` | 删除客户 | ADMIN |
| POST | `/customers/{id}/balance/recharge` | 会员余额充值 | 所有用户 |
| POST | `/customers/{id}/balance/deduct` | 会员余额扣减 | 所有用户 |
| GET | `/customers/{id}/balance/history` | 获取余额变动历史（分页） | 所有用户 |

### 销售管理

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/sales` | 获取销售记录列表（分页、日期范围） | 所有用户 |
| GET | `/sales/{id}` | 获取销售详情（包含明细） | 所有用户 |
| POST | `/sales` | 创建销售记录（散客 + 会员通用） | 所有用户 |

**创建销售请求示例**：
```json
{
  "customerId": 1,
  "customerName": "张三",
  "items": [
    {"productId": 1, "quantity": 2, "unitPrice": 15000},
    {"productId": 2, "quantity": 1, "unitPrice": 12000}
  ],
  "totalAmount": 42000,
  "saleDate": "2024-01-15 10:00:00",
  "recordToAccounting": true,
  "useBalance": false
}
```

### 消费记录

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/customers/{customerId}/consumption-records` | 获取客户消费记录（分页、日期范围） | 所有用户 |
| GET | `/consumption-records/{id}` | 获取消费记录详情 | 所有用户 |
| POST | `/customers/{customerId}/consumption-records` | 创建消费记录 | 所有用户 |
| PUT | `/consumption-records/{id}` | 更新消费记录 | 所有用户 |
| DELETE | `/consumption-records/{id}` | 删除消费记录 | ADMIN |

### 财务记账

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/transactions` | 获取财务记录列表（分页、类型、日期范围、搜索） | 所有用户 |
| GET | `/transactions/{id}` | 获取财务记录详情 | 所有用户 |
| POST | `/transactions` | 创建财务记录 | 所有用户 |
| PUT | `/transactions/{id}` | 更新财务记录 | 所有用户 |
| DELETE | `/transactions/{id}` | 删除财务记录 | ADMIN |
| GET | `/transactions/statistics` | 获取财务统计（总收入、总支出、净收入） | 所有用户 |
| GET | `/transactions/monthly-statistics` | 获取按月统计 | 所有用户 |

### 文件上传

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/upload/image` | 上传图片（单文件最大 5MB，请求最大 10MB） | 所有用户 |

## 数据库设计

### 表结构概览

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| `users` | 用户表 | id, username, password, nickname, avatar, role |
| `products` | 商品表 | id, name, price, stock, image_url, description |
| `customers` | 客户表 | id, pet_name, owner_name, phone, member_level, balance |
| `sales` | 销售记录表 | id, customer_id, customer_name, total_amount, sale_date |
| `sale_items` | 销售项表 | id, sale_id, product_id, product_name, quantity, unit_price, subtotal |
| `consumption_records` | 消费记录表 | id, customer_id, sale_id, date, item, problem, suggestion, amount |
| `balance_transactions` | 余额变动历史表 | id, customer_id, type, amount, balance_before, balance_after |
| `transactions` | 财务记录表 | id, type, amount, description, date |

### 表关系图

```
customers (1) ── (N) consumption_records
customers (1) ── (N) balance_transactions
customers (0..1) ── (N) sales
sales (1) ── (N) sale_items
products (1) ── (N) sale_items
sales (0..1) ── (1) transactions
consumption_records (0..1) ── (1) sales
```

### 字段说明

**金额单位**：所有金额字段统一使用"分"作为单位，前端展示时需除以 100。

**会员级别**：

| 级别值 | 名称 | 充值档位 |
|--------|------|----------|
| 0 | 非会员 | - |
| 1 | 500 元档 | 500 元 |
| 2 | 1000 元档 | 1000 元 |
| 3 | 2000 元档 | 2000 元 |
| 4 | 5000 元档 | 5000 元 |

**余额交易类型**：`RECHARGE`（充值）、`DEDUCT`（扣减）、`REFUND`（退款）

**财务记录类型**：`income`（收入）、`expense`（支出）

### Service 实现类

Service 接口由以下实现类提供：

| 接口 | 实现类 | 说明 |
|------|--------|------|
| `AuthService` | `AuthServiceImpl` | 认证服务（登录、用户信息获取） |
| `UserService` | `UserServiceImpl` | 用户管理服务 |
| `ProductService` | `ProductServiceImpl` | 商品管理服务（含库存乐观锁） |
| `CustomerService` | `CustomerServiceImpl` | 客户管理服务（含余额事务管理） |
| `SaleService` | `SaleServiceImpl` | 销售管理服务（含库存扣减、余额支付） |
| `ConsumptionRecordService` | `ConsumptionRecordServiceImpl` | 消费记录管理服务 |
| `TransactionService` | `TransactionServiceImpl` | 财务记录管理服务（含统计功能） |
| `FileService` | `LocalFileServiceImpl` | 本地文件存储服务 |

## 核心功能说明

### 会员余额管理

- 充值/扣减操作使用 `@Transactional` 保证事务一致性
- 每次变动都会记录到 `balance_transactions` 表
- 记录内容包括：变动金额、变动前余额、变动后余额、操作人 ID

### 销售流程

1. 验证商品库存（使用乐观锁扣减）
2. 如使用余额支付，验证会员余额充足性
3. 创建销售主记录和销售明细
4. 扣减商品库存
5. 如是会员，自动创建消费记录
6. 如使用余额支付，扣减会员余额
7. 如开启记账，同步创建财务记录

### 库存管理

- 使用乐观锁机制（`productMapper.deductStock` 返回影响行数）
- 并发销售时自动防止超卖
- 库存不足时抛出 `InsufficientStockException`

## 错误码

| code | 说明 | 示例场景 |
|------|------|----------|
| 200 | 成功 | 请求处理成功 |
| 1001 | 参数错误 | 请求参数校验失败 |
| 1002 | 未登录 | Token 缺失或无效 |
| 1003 | Token 过期 | 需要重新登录 |
| 1005 | 权限不足 | 无权限访问该资源 |
| 2001 | 库存不足 | 商品库存不足 |
| 2001 | 用户不存在 | 登录时用户不存在 |
| 3001 | 商品不存在 | 操作的商品不存在 |
| 3003 | 余额不足 | 会员余额不足以支付 |
| 4001 | 客户不存在 | 操作的客户不存在 |
| 4002 | 余额不足 | 会员余额不足以扣减 |
| 4003 | 充值金额错误 | 充值金额必须大于 0 |
| 4004 | 销售记录不存在 | 操作的销售记录不存在 |
| 500 | 系统错误 | 默认业务错误 |

## 配置说明

### application.yml 关键配置

```yaml
# 服务器配置
server:
  port: 8080
  servlet:
    context-path: /api/v1

# 数据源配置（HikariCP）
spring:
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://localhost:3307/pet_shop_3_0?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true
    username: root
    password: root
    hikari:
      minimum-idle: 5
      maximum-pool-size: 20
      auto-commit: true
      idle-timeout: 30000
      pool-name: PetShopHikariCP
      max-lifetime: 1800000
      connection-timeout: 30000

  # 文件上传配置
  servlet:
    multipart:
      enabled: true
      max-file-size: 5MB
      max-request-size: 10MB

  # Jackson 配置
  jackson:
    time-zone: GMT+8
    date-format: yyyy-MM-dd HH:mm:ss
    default-property-inclusion: non_null

# MyBatis 配置
mybatis:
  mapper-locations: classpath:mapper/**/*.xml
  type-aliases-package: com.petshop.backend.entity
  configuration:
    map-underscore-to-camel-case: true
    cache-enabled: false
    call-setters-on-nulls: true
    jdbc-type-for-null: 'null'
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl

# JWT 配置
jwt:
  secret: petShopSecretKey2024ForJWTTokenGenerationMustBeLongEnough
  expiration: 7200  # 2 小时，单位：秒

# 文件上传配置
file:
  upload-dir: uploads/images/
  server-domain: http://localhost:8080/api/v1

# 日志配置
logging:
  level:
    root: INFO
    com.petshop.backend: DEBUG
    com.petshop.backend.mapper: DEBUG
  pattern:
    console: '%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n'
```

## 快速开始

### 1. 环境要求

- JDK 17+
- Maven 3.6+
- MySQL 8.0+（Docker 部署推荐）

### 2. 数据库准备

#### 使用 Docker（推荐）

```bash
# 启动 MySQL 容器
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

### 3. 修改配置

编辑 `src/main/resources/application.yml`，确认数据库连接信息：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3307/pet_shop_3_0
    username: root
    password: root
```

### 4. 运行项目

```bash
# 进入项目目录
cd backend

# 编译运行
mvn spring-boot:run
```

### 5. 访问服务

- **API 地址**：`http://localhost:8080/api/v1`
- **默认用户**：用户名 `admin`（无需密码）

## 部署说明

### 打包

```bash
mvn clean package
```

### 运行

```bash
java -jar target/pet-shop-backend-1.0.0.jar
```

### Docker 部署

```dockerfile
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY target/pet-shop-backend-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```
