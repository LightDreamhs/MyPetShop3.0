# 宠物店后台管理系统 API 接口文档

## 📋 文档信息

| 项目 | 内容 |
|------|------|
| 项目名称 | 宠物店后台管理系统 (Pet Shop Admin System) |
| 版本 | v1.3.0 |
| 基础路径 | `/api/v1` |
| 协议 | HTTPS |
| 数据格式 | JSON |

---

## 🔐 通用说明

### 1. 认证方式

采用 **JWT Token** 认证机制：

- 登录成功后返回 `access_token`
- 后续请求需要在请求头中携带：
  ```
  Authorization: Bearer <access_token>
  ```

### 2. 统一响应格式

#### 成功响应
```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

#### 失败响应
```json
{
  "code": 400,
  "message": "错误描述",
  "data": null
}
```

### 3. HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（token无效或过期） |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

### 4. 业务状态码

| code | message | 说明 |
|------|---------|------|
| 0 | success | 成功 |
| 1001 | 参数错误 | 请求参数校验失败 |
| 1002 | 未登录 | token缺失或无效 |
| 1003 | token过期 | 需要重新登录 |
| 1005 | 权限不足 | 无权限访问该资源 |
| 2001 | 用户不存在 | 登录时用户不存在 |
| 2002 | 密码错误 | 登录密码错误 |
| 3001 | 商品不存在 | 操作的商品不存在 |
| 3002 | 库存不足 | 商品库存不足 |
| 4001 | 客户不存在 | 操作的客户不存在 |
| 5001 | 记录不存在 | 操作的记录不存在 |

### 5. 分页参数

```
page: 页码（从1开始）
pageSize: 每页数量（默认10，最大100）
```

### 6. 分页响应格式
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}
```

---

## 📊 数据模型

### User（用户）
```typescript
interface User {
  id: number;              // 用户ID
  username: string;        // 用户名
  nickname: string;        // 显示名称
  avatar?: string;         // 头像URL
  role: 'ADMIN' | 'STAFF'; // 角色（管理员/普通员工）
  createdAt: string;       // 创建时间 ISO 8601
  updatedAt?: string;      // 更新时间 ISO 8601
}
```

### Product（商品）
```typescript
interface Product {
  id: number;              // 商品ID
  name: string;            // 商品名称
  price: number | null;    // 价格（单位：分），非管理员返回 null
  stock: number;           // 库存数量
  imageUrl: string;        // 商品图片URL
  description?: string;    // 商品描述
  createdAt: string;       // 创建时间
  updatedAt: string;       // 更新时间
}
```

### Customer（客户）
```typescript
interface Customer {
  id: number;              // 客户ID
  petName: string;         // 宠物名称
  ownerName: string;       // 主人姓名
  phone: string;           // 电话号码
  isMember: boolean;       // 是否会员（已废弃，使用memberLevel）
  memberLevel: number;     // 会员级别（0非会员 1:500元 2:1000元 3:2000元 4:5000元）
  balance: number;         // 会员余额（单位：分）
  avatar?: string;         // 宠物头像URL
  petType?: string;        // 宠物类型（猫/狗等）
  breed?: string;          // 品种
  age?: number;            // 年龄
  gender?: string;         // 性别
  notes?: string;          // 备注信息
  createdAt: string;       // 创建时间
  updatedAt: string;       // 更新时间
}
```

### BalanceTransaction（余额交易记录）
```typescript
interface BalanceTransaction {
  id: number;              // 记录ID
  customerId: number;      // 客户ID
  type: 'RECHARGE' | 'DEDUCT' | 'REFUND';  // 交易类型：充值/扣减/退款
  amount: number;          // 变动金额（单位：分）
  balanceBefore: number;   // 变动前余额
  balanceAfter: number;    // 变动后余额
  description?: string;    // 说明
  operatorId: number;      // 操作人ID
  operatorName?: string;   // 操作人名称
  createdAt: string;       // 创建时间
  updatedAt: string;       // 更新时间
}
```

### ConsumptionRecord（消费记录）
```typescript
interface ConsumptionRecord {
  id: number;              // 记录ID
  customerId: number;      // 客户ID
  date: string;            // 消费日期 ISO 8601
  item: string;            // 消费项目
  problem?: string;        // 发现问题
  suggestion?: string;     // 建议
  amount?: number;         // 消费金额（单位：分）
  createdAt: string;       // 创建时间
  updatedAt: string;       // 更新时间
}
```

### Transaction（财务记录）
```typescript
interface Transaction {
  id: number;              // 记录ID
  type: 'income' | 'expense';  // 类型：收入/支出
  amount: number;          // 金额（单位：分）
  description: string;     // 描述
  date: string;            // 日期 ISO 8601
  createdAt: string;       // 创建时间
  updatedAt: string;       // 更新时间
}
```

---

## 🔌 接口列表

## 1. 认证模块

### 1.1 用户登录

**接口地址：** `POST /auth/login`

**请求参数：**
```json
{
  "username": "string"     // 用户名
}
```

**响应示例：**
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "nickname": "管理员",
      "avatar": "https://example.com/avatar.jpg",
      "role": "ADMIN",
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 7200
  }
}
```

### 1.2 获取当前用户信息

**接口地址：** `GET /auth/me`

**请求头：**
```
Authorization: Bearer <access_token>
```

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "username": "admin",
    "nickname": "管理员",
    "avatar": "https://example.com/avatar.jpg",
    "role": "ADMIN",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 1.3 用户登出

**接口地址：** `POST /auth/logout`

**请求头：**
```
Authorization: Bearer <access_token>
```

**响应示例：**
```json
{
  "code": 200,
  "message": "登出成功",
  "data": null
}
```

---

## 2. 用户管理模块

### 2.1 获取用户列表

**接口地址：** `GET /users`

**请求头：**
```
Authorization: Bearer <access_token>
```

**权限说明：** 仅管理员可访问

**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Integer | 否 | 页码（默认1） |
| pageSize | Integer | 否 | 每页数量（默认10） |
| search | String | 否 | 搜索关键词（用户名/显示名称） |

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "username": "admin",
        "nickname": "管理员",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
        "role": "ADMIN",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 10
  }
}
```

### 2.2 获取用户详情

**接口地址：** `GET /users/{id}`

**请求头：**
```
Authorization: Bearer <access_token>
```

**权限说明：** 普通员工只能查看自己的信息

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | Long | 用户ID |

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "username": "admin",
    "nickname": "管理员",
    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
    "role": "ADMIN",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 2.3 创建用户

**接口地址：** `POST /users`

**请求头：**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**权限说明：** 仅管理员可访问

**请求参数：**
```json
{
  "username": "string",      // 用户名（必填）
  "nickname": "string",      // 显示名称（必填）
  "avatar": "string",        // 头像URL（可选）
  "role": "ADMIN" | "STAFF"  // 角色（可选，默认 STAFF）
}
```

**说明：**
- 新用户默认密码为：`123456`
- 用户名必须唯一

**响应示例：**
```json
{
  "code": 200,
  "message": "创建成功",
  "data": {
    "id": 2,
    "username": "newuser",
    "nickname": "新用户",
    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=newuser",
    "role": "STAFF",
    "createdAt": "2024-01-24T00:00:00Z",
    "updatedAt": "2024-01-24T00:00:00Z"
  }
}
```

### 2.4 更新用户

**接口地址：** `PUT /users/{id}`

**请求头：**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**权限说明：**
- 普通员工只能修改自己的信息
- 普通员工不能修改角色
- 普通员工修改时 username 可选（为空则保持原值）

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | Long | 用户ID |

**请求参数：**
```json
{
  "username": "string",      // 用户名（可选，仅管理员可修改）
  "nickname": "string",      // 显示名称（必填）
  "avatar": "string",        // 头像URL（可选）
  "role": "ADMIN" | "STAFF"  // 角色（可选，仅管理员可修改）
}
```

**说明：**
- 用户名必须唯一
- 密码不通过此接口修改
- 支持部分更新：null 字段保持原值不变

**响应示例：**
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": 2,
    "username": "newuser",
    "nickname": "更新后的名称",
    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=newuser",
    "role": "STAFF",
    "createdAt": "2024-01-24T00:00:00Z",
    "updatedAt": "2024-01-24T01:00:00Z"
  }
}
```

### 2.5 删除用户

**接口地址：** `DELETE /users/{id}`

**请求头：**
```
Authorization: Bearer <access_token>
```

**权限说明：** 仅管理员可访问

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | Long | 用户ID |

**响应示例：**
```json
{
  "code": 200,
  "message": "删除成功",
  "data": null
}
```

---

## 3. 库存管理模块

### 3.1 获取商品列表

**接口地址：** `GET /products`

**请求头：**
```
Authorization: Bearer <access_token>
```

**权限说明：** 所有用户可访问，非管理员返回时 price 字段为 null

**Query参数：**
```
page: number          // 页码（默认1）
pageSize: number      // 每页数量（默认10）
search: string        // 搜索关键词（商品名称，可选）
```

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "name": "皇家狗粮成犬粮",
        "price": 15000,
        "stock": 50,
        "imageUrl": "https://images.unsplash.com/photo-xxx",
        "description": "适合1-7岁成犬",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}
```

### 3.2 获取商品详情

**接口地址：** `GET /products/:id`

**请求头：**
```
Authorization: Bearer <access_token>
```

**权限说明：** 所有用户可访问，非管理员返回时 price 字段为 null

**路径参数：**
```
id: number    // 商品ID
```

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "name": "皇家狗粮成犬粮",
    "price": 15000,
    "stock": 50,
    "imageUrl": "https://images.unsplash.com/photo-xxx",
    "description": "适合1-7岁成犬",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 3.3 创建商品

**接口地址：** `POST /products`

**请求头：**
```
Authorization: Bearer <access_token>
```

**权限说明：** 仅管理员可访问

**请求参数：**
```json
{
  "name": "string",           // 商品名称（必填）
  "price": number,            // 价格，单位：分（必填，>0）
  "stock": number,            // 库存数量（必填，>=0）
  "imageUrl": "string",       // 商品图片URL（必填）
  "description": "string"     // 商品描述（可选）
}
```

**响应示例：**
```json
{
  "code": 201,
  "message": "创建成功",
  "data": {
    "id": 1,
    "name": "皇家狗粮成犬粮",
    "price": 15000,
    "stock": 50,
    "imageUrl": "https://images.unsplash.com/photo-xxx",
    "description": "适合1-7岁成犬",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 3.4 更新商品

**接口地址：** `PUT /products/:id`

**请求头：**
```
Authorization: Bearer <access_token>
```

**权限说明：** 仅管理员可访问

**路径参数：**
```
id: number    // 商品ID
```

**请求参数：**
```json
{
  "name": "string",           // 商品名称
  "price": number,            // 价格，单位：分（>0）
  "stock": number,            // 库存数量（>=0）
  "imageUrl": "string",       // 商品图片URL
  "description": "string"     // 商品描述
}
```

**响应示例：**
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": 1,
    "name": "皇家狗粮成犬粮",
    "price": 15000,
    "stock": 45,
    "imageUrl": "https://images.unsplash.com/photo-xxx",
    "description": "适合1-7岁成犬",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-02T00:00:00Z"
  }
}
```

### 3.5 修改商品库存

**接口地址：** `PATCH /products/:id/stock`

**请求头：**
```
Authorization: Bearer <access_token>
```

**权限说明：** 所有用户可访问

**路径参数：**
```
id: number    // 商品ID
```

**请求参数：**
```json
{
  "stock": number            // 库存数量（必填，>=0）
}
```

**响应示例：**
```json
{
  "code": 200,
  "message": "库存更新成功",
  "data": {
    "id": 1,
    "stock": 45
  }
}
```

### 3.6 删除商品

**接口地址：** `DELETE /products/:id`

**请求头：**
```
Authorization: Bearer <access_token>
```

**权限说明：** 仅管理员可访问

**路径参数：**
```
id: number    // 商品ID
```

**响应示例：**
```json
{
  "code": 200,
  "message": "删除成功",
  "data": null
}
```

---

## 4. 客户管理模块

### 4.1 获取客户列表

**接口地址：** `GET /customers`

**请求头：**
```
Authorization: Bearer <access_token>
```

**Query参数：**
```
page: number          // 页码（默认1）
pageSize: number      // 每页数量（默认10）
search: string        // 搜索关键词（姓名或电话，可选）
isMember: boolean     // 是否会员（可选，true/false，已废弃，使用memberLevel）
memberLevel: number   // 会员级别（可选，0-4）
```

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "petName": "旺财",
        "ownerName": "张三",
        "phone": "13800138000",
        "isMember": true,
        "memberLevel": 2,
        "avatar": "https://images.unsplash.com/photo-xxx",
        "petType": "狗",
        "breed": "金毛",
        "age": 3,
        "gender": "公",
        "notes": "性格温顺，喜欢玩球",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 10
  }
}
```

### 4.2 获取客户详情

**接口地址：** `GET /customers/:id`

**请求头：**
```
Authorization: Bearer <access_token>
```

**路径参数：**
```
id: number    // 客户ID
```

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "petName": "旺财",
    "ownerName": "张三",
    "phone": "13800138000",
    "isMember": true,
    "memberLevel": 2,
    "avatar": "https://images.unsplash.com/photo-xxx",
    "petType": "狗",
    "breed": "金毛",
    "age": 3,
    "gender": "公",
    "notes": "性格温顺，喜欢玩球",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 4.3 创建客户

**接口地址：** `POST /customers`

**请求头：**
```
Authorization: Bearer <access_token>
```

**请求参数：**
```json
{
  "petName": "string",        // 宠物名称（必填）
  "ownerName": "string",      // 主人姓名（必填）
  "phone": "string",          // 电话号码（必填，11位手机号）
  "isMember": boolean,        // 是否会员（必填，默认false，已废弃）
  "memberLevel": number,      // 会员级别（必填，0非会员 1:500元 2:1000元 3:2000元 4:5000元，默认0）
  "avatar": "string",         // 宠物头像URL（可选）
  "petType": "string",        // 宠物类型（可选）
  "breed": "string",          // 品种（可选）
  "age": number,              // 年龄（可选）
  "gender": "string",         // 性别（可选）
  "notes": "string"           // 备注信息（可选）
}
```

**响应示例：**
```json
{
  "code": 201,
  "message": "创建成功",
  "data": {
    "id": 1,
    "petName": "旺财",
    "ownerName": "张三",
    "phone": "13800138000",
    "isMember": true,
    "memberLevel": 2,
    "avatar": "https://images.unsplash.com/photo-xxx",
    "petType": "狗",
    "breed": "金毛",
    "age": 3,
    "gender": "公",
    "notes": "性格温顺，喜欢玩球",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 4.4 更新客户信息

**接口地址：** `PUT /customers/:id`

**请求头：**
```
Authorization: Bearer <access_token>
```

**路径参数：**
```
id: number    // 客户ID
```

**请求参数：**
```json
{
  "petName": "string",        // 宠物名称
  "ownerName": "string",      // 主人姓名
  "phone": "string",          // 电话号码（11位手机号）
  "isMember": boolean,        // 是否会员（已废弃）
  "memberLevel": number,      // 会员级别（0非会员 1:500元 2:1000元 3:2000元 4:5000元）
  "avatar": "string",         // 宠物头像URL
  "petType": "string",        // 宠物类型
  "breed": "string",          // 品种
  "age": number,              // 年龄
  "gender": "string",         // 性别
  "notes": "string"           // 备注信息
}
```

**响应示例：**
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": 1,
    "petName": "旺财",
    "ownerName": "张三",
    "phone": "13800138000",
    "isMember": true,
    "memberLevel": 2,
    "avatar": "https://images.unsplash.com/photo-xxx",
    "petType": "狗",
    "breed": "金毛",
    "age": 3,
    "gender": "公",
    "notes": "性格温顺，喜欢玩球",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-02T00:00:00Z"
  }
}
```

### 4.5 删除客户

**接口地址：** `DELETE /customers/:id`

**请求头：**
```
Authorization: Bearer <access_token>
```

**路径参数：**
```
id: number    // 客户ID
```

**响应示例：**
```json
{
  "code": 200,
  "message": "删除成功",
  "data": null
}
```

### 4.6 会员充值

**接口地址：** `POST /customers/:id/balance/recharge`

**请求头：**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**路径参数：**
```
id: number    // 客户ID
```

**请求参数：**
```json
{
  "amount": number,           // 充值金额（单位：分，必填，>0）
  "description": string       // 说明（可选）
}
```

**响应示例：**
```json
{
  "code": 200,
  "message": "充值成功",
  "data": {
    "id": 1,
    "petName": "旺财",
    "ownerName": "张三",
    "phone": "13800138000",
    "isMember": true,
    "memberLevel": 2,
    "balance": 50000,
    "avatar": "https://images.unsplash.com/photo-xxx",
    "petType": "狗",
    "breed": "金毛",
    "age": 3,
    "gender": "公",
    "notes": "性格温顺，喜欢玩球",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-02T00:00:00Z"
  }
}
```

### 4.7 会员余额扣减

**接口地址：** `POST /customers/:id/balance/deduct`

**请求头：**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**路径参数：**
```
id: number    // 客户ID
```

**请求参数：**
```json
{
  "amount": number,           // 扣减金额（单位：分，必填，>0）
  "description": string       // 说明（可选）
}
```

**响应示例：**
```json
{
  "code": 200,
  "message": "扣减成功",
  "data": {
    "id": 1,
    "petName": "旺财",
    "ownerName": "张三",
    "phone": "13800138000",
    "isMember": true,
    "memberLevel": 2,
    "balance": 45000,
    "avatar": "https://images.unsplash.com/photo-xxx",
    "petType": "狗",
    "breed": "金毛",
    "age": 3,
    "gender": "公",
    "notes": "性格温顺，喜欢玩球",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-02T01:00:00Z"
  }
}
```

### 4.8 获取余额变动历史

**接口地址：** `GET /customers/:id/balance/history`

**请求头：**
```
Authorization: Bearer <access_token>
```

**路径参数：**
```
id: number    // 客户ID
```

**Query参数：**
```
page: number          // 页码（默认1）
pageSize: number      // 每页数量（默认10）
```

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "customerId": 1,
        "type": "RECHARGE",
        "amount": 50000,
        "balanceBefore": 0,
        "balanceAfter": 50000,
        "description": "会员充值",
        "operatorId": 1,
        "operatorName": "管理员",
        "createdAt": "2024-01-15T00:00:00Z",
        "updatedAt": "2024-01-15T00:00:00Z"
      },
      {
        "id": 2,
        "customerId": 1,
        "type": "DEDUCT",
        "amount": 5000,
        "balanceBefore": 50000,
        "balanceAfter": 45000,
        "description": "消费扣款",
        "operatorId": 1,
        "operatorName": "管理员",
        "createdAt": "2024-01-16T00:00:00Z",
        "updatedAt": "2024-01-16T00:00:00Z"
      }
    ],
    "total": 2,
    "page": 1,
    "pageSize": 10
  }
}
```

---

## 5. 消费记录模块

### 5.1 获取客户消费记录列表

**接口地址：** `GET /customers/:customerId/consumption-records`

**请求头：**
```
Authorization: Bearer <access_token>
```

**路径参数：**
```
customerId: number  // 客户ID
```

**Query参数：**
```
page: number          // 页码（默认1）
pageSize: number      // 每页数量（默认10）
startDate: string     // 开始日期（可选，ISO 8601）
endDate: string       // 结束日期（可选，ISO 8601）
```

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "customerId": 1,
        "date": "2024-01-15T00:00:00Z",
        "item": "洗澡美容",
        "problem": "皮肤轻微红疹",
        "suggestion": "建议使用低敏洗毛精，注意保持干燥",
        "amount": 8000,
        "createdAt": "2024-01-15T00:00:00Z",
        "updatedAt": "2024-01-15T00:00:00Z"
      },
      {
        "id": 2,
        "customerId": 1,
        "date": "2024-01-10T00:00:00Z",
        "item": "疫苗接种",
        "problem": null,
        "suggestion": "下次接种时间：2024-07-10",
        "amount": 15000,
        "createdAt": "2024-01-10T00:00:00Z",
        "updatedAt": "2024-01-10T00:00:00Z"
      }
    ],
    "total": 20,
    "page": 1,
    "pageSize": 10
  }
}
```

### 5.2 获取消费记录详情

**接口地址：** `GET /consumption-records/:id`

**请求头：**
```
Authorization: Bearer <access_token>
```

**路径参数：**
```
id: number    // 记录ID
```

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "customerId": 1,
    "date": "2024-01-15T00:00:00Z",
    "item": "洗澡美容",
    "problem": "皮肤轻微红疹",
    "suggestion": "建议使用低敏洗毛精，注意保持干燥",
    "amount": 8000,
    "createdAt": "2024-01-15T00:00:00Z",
    "updatedAt": "2024-01-15T00:00:00Z"
  }
}
```

### 5.3 创建消费记录

**接口地址：** `POST /customers/:customerId/consumption-records`

**请求头：**
```
Authorization: Bearer <access_token>
```

**路径参数：**
```
customerId: number  // 客户ID
```

**请求参数：**
```json
{
  "date": "string",           // 消费日期（必填，ISO 8601）
  "item": "string",           // 消费项目（必填）
  "problem": "string",        // 发现问题（可选）
  "suggestion": "string",     // 建议（可选）
  "amount": number            // 消费金额，单位：分（可选，>=0）
}
```

**响应示例：**
```json
{
  "code": 201,
  "message": "创建成功",
  "data": {
    "id": 1,
    "customerId": 1,
    "date": "2024-01-15T00:00:00Z",
    "item": "洗澡美容",
    "problem": "皮肤轻微红疹",
    "suggestion": "建议使用低敏洗毛精，注意保持干燥",
    "amount": 8000,
    "createdAt": "2024-01-15T00:00:00Z",
    "updatedAt": "2024-01-15T00:00:00Z"
  }
}
```

### 5.4 更新消费记录

**接口地址：** `PUT /consumption-records/:id`

**请求头：**
```
Authorization: Bearer <access_token>
```

**路径参数：**
```
id: number    // 记录ID
```

**请求参数：**
```json
{
  "date": "string",           // 消费日期（ISO 8601）
  "item": "string",           // 消费项目
  "problem": "string",        // 发现问题
  "suggestion": "string",     // 建议
  "amount": number            // 消费金额，单位：分（>=0）
}
```

**响应示例：**
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": 1,
    "customerId": 1,
    "date": "2024-01-15T00:00:00Z",
    "item": "洗澡美容",
    "problem": "皮肤轻微红疹",
    "suggestion": "建议使用低敏洗毛精，注意保持干燥",
    "amount": 8000,
    "createdAt": "2024-01-15T00:00:00Z",
    "updatedAt": "2024-01-16T00:00:00Z"
  }
}
```

### 5.5 删除消费记录

**接口地址：** `DELETE /consumption-records/:id`

**请求头：**
```
Authorization: Bearer <access_token>
```

**路径参数：**
```
id: number    // 记录ID
```

**响应示例：**
```json
{
  "code": 200,
  "message": "删除成功",
  "data": null
}
```

---

## 6. 财务记账模块

### 6.1 获取财务记录列表

**接口地址：** `GET /transactions`

**请求头：**
```
Authorization: Bearer <access_token>
```

**Query参数：**
```
page: number          // 页码（默认1）
pageSize: number      // 每页数量（默认10）
type: string          // 类型（income/expense，可选）
startDate: string     // 开始日期（可选，ISO 8601）
endDate: string       // 结束日期（可选，ISO 8601）
search: string        // 搜索关键词（描述，可选）
```

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "type": "income",
        "amount": 8000,
        "description": "狗粮销售",
        "date": "2024-01-15T00:00:00Z",
        "createdAt": "2024-01-15T00:00:00Z",
        "updatedAt": "2024-01-15T00:00:00Z"
      },
      {
        "id": 2,
        "type": "expense",
        "amount": 50000,
        "description": "采购狗粮10袋",
        "date": "2024-01-14T00:00:00Z",
        "createdAt": "2024-01-14T00:00:00Z",
        "updatedAt": "2024-01-14T00:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}
```

### 6.2 获取财务记录详情

**接口地址：** `GET /transactions/:id`

**请求头：**
```
Authorization: Bearer <access_token>
```

**路径参数：**
```
id: number    // 记录ID
```

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "type": "income",
    "amount": 8000,
    "description": "狗粮销售",
    "date": "2024-01-15T00:00:00Z",
    "createdAt": "2024-01-15T00:00:00Z",
    "updatedAt": "2024-01-15T00:00:00Z"
  }
}
```

### 6.3 创建财务记录

**接口地址：** `POST /transactions`

**请求头：**
```
Authorization: Bearer <access_token>
```

**请求参数：**
```json
{
  "type": "string",           // 类型：income/expense（必填）
  "amount": number,           // 金额，单位：分（必填，>0）
  "description": "string",    // 描述（必填）
  "date": "string"            // 日期（必填，ISO 8601）
}
```

**响应示例：**
```json
{
  "code": 201,
  "message": "创建成功",
  "data": {
    "id": 1,
    "type": "income",
    "amount": 8000,
    "description": "狗粮销售",
    "date": "2024-01-15T00:00:00Z",
    "createdAt": "2024-01-15T00:00:00Z",
    "updatedAt": "2024-01-15T00:00:00Z"
  }
}
```

### 6.4 更新财务记录

**接口地址：** `PUT /transactions/:id`

**请求头：**
```
Authorization: Bearer <access_token>
```

**路径参数：**
```
id: number    // 记录ID
```

**请求参数：**
```json
{
  "type": "string",           // 类型：income/expense
  "amount": number,           // 金额，单位：分（>0）
  "description": "string",    // 描述
  "date": "string"            // 日期（ISO 8601）
}
```

**响应示例：**
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": 1,
    "type": "income",
    "amount": 8000,
    "description": "狗粮销售",
    "date": "2024-01-15T00:00:00Z",
    "createdAt": "2024-01-15T00:00:00Z",
    "updatedAt": "2024-01-16T00:00:00Z"
  }
}
```

### 6.5 删除财务记录

**接口地址：** `DELETE /transactions/:id`

**请求头：**
```
Authorization: Bearer <access_token>
```

**路径参数：**
```
id: number    // 记录ID
```

**响应示例：**
```json
{
  "code": 200,
  "message": "删除成功",
  "data": null
}
```

### 6.6 获取财务统计

**接口地址：** `GET /transactions/statistics`

**请求头：**
```
Authorization: Bearer <access_token>
```

**Query参数：**
```
startDate: string     // 开始日期（可选，ISO 8601，默认本月第一天）
endDate: string       // 结束日期（可选，ISO 8601，默认本月最后一天）
```

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "totalIncome": 500000,      // 总收入（单位：分）
    "totalExpense": 300000,     // 总支出（单位：分）
    "netIncome": 200000,        // 净收入（单位：分）
    "incomeCount": 50,          // 收入笔数
    "expenseCount": 30          // 支出笔数
  }
}
```

---

## 📁 文件上传模块（可选）

### 上传图片

**接口地址：** `POST /upload/image`

**请求头：**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**请求参数：**
```
file: File        // 图片文件（支持jpg、jpeg、png，最大5MB）
```

**响应示例：**
```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "url": "https://cdn.example.com/images/xxx.jpg",
    "filename": "xxx.jpg",
    "size": 102400
  }
}
```

---

## 🔒 安全规范

### 1. 密码规则
- 密码长度：6-20位
- 建议包含字母、数字、特殊字符

### 2. Token 过期时间
- Access Token 有效期：2小时
- 建议实现 Token 刷新机制（可选）

### 3. 接口限流
- 同一用户每分钟最多请求 100 次
- 超过限制返回 429 状态码

### 4. 数据验证
- 所有输入参数必须进行校验
- 防止 SQL 注入、XSS 攻击
- 电话号码格式验证（11位手机号）

---

## 📝 附录

### 1. 金额单位说明

系统中所有金额字段统一使用**分**作为单位，避免浮点数精度问题。

前端展示时需要转换：
- 15000 分 = 150.00 元
- 转换公式：`元 = 分 / 100`

### 2. 日期格式说明

所有日期字段使用 **ISO 8601** 格式：
```
2024-01-15T00:00:00Z
```

### 3. 推荐的宠物类型
- 猫
- 狗
- 鸟
- 兔子
- 仓鼠
- 其他

### 4. 会员级别说明
| 级别值 | 名称 | 说明 |
|--------|------|------|
| 0 | 非会员 | 普通客户，无会员权益 |
| 1 | 500元档 | 充值500元会员档位 |
| 2 | 1000元档 | 充值1000元会员档位 |
| 3 | 2000元档 | 充值2000元会员档位 |
| 4 | 5000元档 | 充值5000元会员档位 |

---

## 📞 联系方式

如有接口相关问题，请联系后端开发团队。

---

**文档版本：** v1.3.0
**最后更新：** 2025-02-05

## 📋 更新日志

### v1.3.0 (2025-02-05)
- ✨ **会员余额管理**：新增完整的会员余额管理功能
  - 支持会员余额充值和扣减
  - 支持查询余额变动历史记录
  - 新增 BalanceTransaction 数据模型
  - 客户模型新增 `balance` 字段
- 🔧 **财务记账优化**：新增 `search` 参数，支持按描述关键词搜索
- 📝 更新数据模型和接口文档
- 🐛 修复部分接口参数说明不清晰的问题

### v1.2.0 (2025-01-31)
- 🔒 **权限系统升级**：引入基于角色的访问控制（RBAC）
  - 新增用户角色：ADMIN（管理员）、STAFF（普通员工）
  - 管理员可管理所有用户，普通员工只能查看/修改自己的信息
  - 库存管理：非管理员无法看到进价（price 返回 null）
  - 商品管理：仅管理员可新增/编辑/删除商品
- ✨ **个人资料编辑**：所有用户可编辑自己的头像和昵称
- 🐛 **Bug 修复**：修复更新个人资料时的验证错误
- 📝 更新数据模型和接口权限说明

### v1.1.0 (2025-01-24)
- ✨ 新增用户管理模块（用户列表、创建、更新、删除）
- ✨ 新增文件上传模块（支持图片上传）
- ✨ 客户会员级别功能优化（支持0-4级）
- ✨ Docker 容器化部署方案
- 📝 更新部署文档和 API 文档

### v1.0.0 (2024-01-15)
- 🎉 初始版本发布
- ✨ 完成基础 CRUD 功能
- ✨ JWT 认证机制
- ✨ 财务统计功能
