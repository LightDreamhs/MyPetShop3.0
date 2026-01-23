# 宠物店后台管理系统 - 后端

基于 Spring Boot 3 + MyBatis + MySQL 的宠物店后台管理系统后端服务。

## 技术栈

- **Java 17**
- **Spring Boot 3.2.0**
- **MyBatis 3.0.3**
- **MySQL 8.0**
- **JWT** (io.jsonwebtoken:jjwt:0.12.3)
- **Lombok**

## 项目结构

```
backend/
├── src/main/java/com/petshop/backend/
│   ├── PetShopBackendApplication.java    # 主应用类
│   ├── config/                           # 配置类
│   │   ├── JwtConfig.java                # JWT配置
│   │   └── WebConfig.java                # Web配置（跨域、拦截器）
│   ├── controller/                       # 控制器层
│   │   ├── AuthController.java           # 认证控制器
│   │   ├── ProductController.java        # 商品控制器
│   │   ├── CustomerController.java       # 客户控制器
│   │   ├── ConsumptionRecordController.java  # 消费记录控制器
│   │   └── TransactionController.java    # 财务记录控制器
│   ├── service/                          # 服务层
│   │   ├── AuthService.java              # 认证服务接口
│   │   ├── ProductService.java           # 商品服务接口
│   │   ├── CustomerService.java          # 客户服务接口
│   │   ├── ConsumptionRecordService.java # 消费记录服务接口
│   │   ├── TransactionService.java       # 财务记录服务接口
│   │   └── impl/                         # 服务实现类
│   ├── mapper/                           # MyBatis Mapper接口
│   │   ├── UserMapper.java
│   │   ├── ProductMapper.java
│   │   ├── CustomerMapper.java
│   │   ├── ConsumptionRecordMapper.java
│   │   └── TransactionMapper.java
│   ├── entity/                           # 实体类
│   │   ├── BaseEntity.java               # 基础实体类
│   │   ├── User.java                     # 用户实体
│   │   ├── Product.java                  # 商品实体
│   │   ├── Customer.java                 # 客户实体
│   │   ├── ConsumptionRecord.java        # 消费记录实体
│   │   └── Transaction.java              # 财务记录实体
│   ├── dto/                              # 数据传输对象
│   │   ├── Result.java                   # 统一响应结果
│   │   ├── PageResult.java               # 分页响应结果
│   │   ├── LoginResponse.java            # 登录响应
│   │   └── TransactionStatistics.java    # 财务统计
│   ├── exception/                        # 异常处理
│   │   ├── BusinessException.java        # 业务异常
│   │   └── GlobalExceptionHandler.java   # 全局异常处理器
│   ├── interceptor/                      # 拦截器
│   │   └── JwtInterceptor.java           # JWT认证拦截器
│   └── util/                             # 工具类
│       └── JwtUtil.java                  # JWT工具类
└── src/main/resources/
    ├── application.yml                   # 应用配置
    ├── db/
    │   └── schema.sql                    # 数据库表结构及初始化数据
    └── mapper/                           # MyBatis XML映射文件
        ├── UserMapper.xml
        ├── ProductMapper.xml
        ├── CustomerMapper.xml
        ├── ConsumptionRecordMapper.xml
        └── TransactionMapper.xml
```

## 快速开始

### 1. 环境要求

- JDK 17+
- Maven 3.6+
- MySQL 8.0+

### 2. 数据库初始化

```bash
# 登录MySQL
mysql -u root -p

# 执行初始化脚本
source backend/src/main/resources/db/schema.sql
```

或使用MySQL客户端直接执行 `backend/src/main/resources/db/schema.sql` 文件。

### 3. 修改配置

编辑 `src/main/resources/application.yml`，修改数据库连接信息：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/pet_shop?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai
    username: root
    password: your_password
```

### 4. 运行项目

```bash
# 进入项目目录
cd backend

# 编译运行
mvn spring-boot:run

# 或先打包再运行
mvn clean package
java -jar target/pet-shop-backend-1.0.0.jar
```

### 5. 访问服务

- **API地址**: `http://localhost:8080/api/v1`
- **默认用户**:
  - 用户名: `admin`
  - 密码: `admin123`

## API文档

详细的API接口文档请参考项目根目录下的 [API接口文档.md](../API接口文档.md)

### 主要接口

#### 认证模块
- `POST /auth/login` - 用户登录
- `GET /auth/me` - 获取当前用户信息
- `POST /auth/logout` - 用户登出

#### 库存管理模块
- `GET /products` - 获取商品列表
- `GET /products/{id}` - 获取商品详情
- `POST /products` - 创建商品
- `PUT /products/{id}` - 更新商品
- `PATCH /products/{id}/stock` - 修改商品库存
- `DELETE /products/{id}` - 删除商品

#### 客户管理模块
- `GET /customers` - 获取客户列表（支持按会员级别筛选）
- `GET /customers/{id}` - 获取客户详情
- `POST /customers` - 创建客户（需指定会员级别0-4）
- `PUT /customers/{id}` - 更新客户（可修改会员级别）
- `DELETE /customers/{id}` - 删除客户

#### 消费记录模块
- `GET /customers/{customerId}/consumption-records` - 获取客户消费记录
- `GET /consumption-records/{id}` - 获取消费记录详情
- `POST /customers/{customerId}/consumption-records` - 创建消费记录
- `PUT /consumption-records/{id}` - 更新消费记录
- `DELETE /consumption-records/{id}` - 删除消费记录

#### 财务记账模块
- `GET /transactions` - 获取财务记录列表
- `GET /transactions/{id}` - 获取财务记录详情
- `POST /transactions` - 创建财务记录
- `PUT /transactions/{id}` - 更新财务记录
- `DELETE /transactions/{id}` - 删除财务记录
- `GET /transactions/statistics` - 获取财务统计

## 核心功能说明

### JWT认证

系统采用JWT Token认证机制：

1. 用户登录成功后返回 `accessToken`
2. 后续请求需要在请求头中携带：`Authorization: Bearer <token>`
3. Token默认有效期为2小时

### 统一响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

### 业务状态码

| code  | message      | 说明               |
|-------|--------------|--------------------|
| 0     | success      | 成功               |
| 1001  | 参数错误     | 请求参数校验失败    |
| 1002  | 未登录       | token缺失或无效     |
| 1003  | token过期    | 需要重新登录        |
| 2001  | 用户不存在   | 登录时用户不存在    |
| 3001  | 商品不存在   | 操作的商品不存在    |
| 4001  | 客户不存在   | 操作的客户不存在    |
| 5001  | 记录不存在   | 操作的记录不存在    |

### 数据验证

- 所有输入参数都进行了校验
- 电话号码格式验证（11位手机号）
- 金额、库存等数值字段范围验证
- 会员级别验证（0-4）
- 防止SQL注入、XSS攻击

## 开发注意事项

1. **金额单位**: 所有金额字段统一使用"分"作为单位，前端展示时需除以100
2. **日期格式**: 使用ISO 8601格式，如：`2024-01-15T00:00:00`
3. **分页参数**: page从1开始，pageSize默认10，最大100
4. **密码加密**: 用户密码使用BCrypt加密存储
5. **跨域配置**: 已配置允许跨域，支持前后端分离开发
6. **会员级别**: 客户会员级别使用0-4表示，详见下表

### 会员级别说明

| 级别值 | 名称 | 说明 |
|--------|------|------|
| 0 | 非会员 | 普通客户，无会员权益 |
| 1 | 初级会员 | 入门会员等级 |
| 2 | 中级会员 | 中等会员等级 |
| 3 | 高级会员 | 高等级会员 |
| 4 | 至尊会员 | 最高等级会员 |

**注意**: `isMember` 字段已废弃，请使用 `memberLevel` 字段（0表示非会员，1-4表示会员等级）

## 测试

### 登录测试

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin"}'
```

### 获取商品列表测试

```bash
curl -X GET http://localhost:8080/api/v1/products?page=1&pageSize=10 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 常见问题

### 1. 数据库连接失败

检查MySQL服务是否启动，用户名密码是否正确。

### 2. Token过期

Token有效期为2小时，过期后需要重新登录获取新Token。

### 3. 跨域问题

前端请求时需要携带凭证：`withCredentials: true`

## 部署说明

### 打包

```bash
mvn clean package
```

### 运行

```bash
java -jar target/pet-shop-backend-1.0.0.jar
```

### Docker部署（可选）

```dockerfile
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY target/pet-shop-backend-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

