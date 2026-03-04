# 宠物店管理系统 - 前端技术文档

## 概述

本文档描述宠物店管理系统前端的架构、页面、调用链和功能实现。

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.2.0 | 前端框架 |
| TypeScript | 5.9.3 | 类型系统 |
| Vite | 7.2.4 | 构建工具 |
| React Router DOM | 7.12.0 | 路由管理 |
| Zustand | 5.0.10 | 状态管理 |
| Axios | 1.13.2 | HTTP 客户端 |
| Tailwind CSS | 4.1.18 | UI 样式 |
| Lucide React | 0.562.0 | 图标库 |

---

## 项目结构

```
frontend/src/
├── components/          # 组件目录
│   ├── ui/             # UI 基础组件
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── TextArea.tsx
│   │   ├── Select.tsx
│   │   ├── Card.tsx
│   │   ├── Dialog.tsx
│   │   ├── Badge.tsx
│   │   ├── Table.tsx
│   │   ├── ImageUpload.tsx
│   │   ├── Pagination.tsx
│   │   └── index.ts
│   ├── Layout.tsx      # 主布局组件
│   ├── ProfileEditDialog.tsx
│   ├── ConsumptionRecordForm.tsx
│   └── index.ts
├── pages/              # 页面组件
│   ├── LoginPage.tsx
│   ├── InventoryPage.tsx
│   ├── CustomersPage.tsx
│   ├── ConsumptionRecordsPage.tsx
│   ├── AccountingPage.tsx
│   ├── UsersPage.tsx
│   └── index.ts
├── stores/             # Zustand 状态管理
│   ├── authStore.ts
│   ├── productStore.ts
│   ├── customerStore.ts
│   ├── consumptionStore.ts
│   ├── transactionStore.ts
│   ├── userStore.ts
│   └── index.ts
├── services/           # API 服务
│   └── api.ts
├── lib/                # 工具库
│   └── axios.ts
├── hooks/              # 自定义 Hooks
│   └── useWheelPrevention.ts
├── utils/              # 工具函数
│   ├── memberLevel.ts
│   ├── validation.ts
│   ├── dateFormat.ts
│   ├── errorHandler.ts
│   └── inputHandlers.ts
├── types/              # 类型定义
│   └── index.ts
├── constants/          # 常量
│   └── index.ts
├── App.tsx             # 应用根组件
├── main.tsx            # 应用入口
└── index.css           # 全局样式
```

---

## 核心架构

### 1. 路由架构

路由配置位于 `App.tsx`，使用 React Router v7 的懒加载和路由守卫机制。

#### 路由表

| 路径 | 组件 | 访问权限 | 说明 |
|------|------|----------|------|
| `/login` | LoginPage | 公开 | 登录页面 |
| `/` | InventoryPage | 需登录 | 库存管理（首页） |
| `/customers` | CustomersPage | 需登录 | 客户管理 |
| `/customers/:customerId/records` | ConsumptionRecordsPage | 需登录 | 消费记录 |
| `/accounting` | AccountingPage | 需登录 | 财务记账 |
| `/users` | UsersPage | 需 ADMIN | 用户管理 |
| `*` | - | - | 重定向到 `/` |

#### 路由守卫

- **PrivateRoute**: 验证用户登录状态，未登录重定向到登录页
- **PublicRoute**: 已登录用户访问登录页时重定向到首页

### 2. 状态管理架构

使用 Zustand 进行状态管理，每个业务模块对应一个 Store。

#### Store 列表

| Store | 文件 | 状态 | 操作 |
|-------|------|------|------|
| useAuthStore | authStore.ts | user, token, isAuthenticated, isLoading, error | login, logout, getCurrentUser, isAdmin, hasRole |
| useProductStore | productStore.ts | products, currentProduct, total, page, pageSize, isLoading, error | fetchProducts, fetchProduct, createProduct, updateProduct, updateStock, deleteProduct |
| useCustomerStore | customerStore.ts | customers, currentCustomer, total, page, pageSize, isLoading, error | fetchCustomers, fetchCustomer, createCustomer, updateCustomer, deleteCustomer |
| useConsumptionStore | consumptionStore.ts | records, currentRecord, total, page, pageSize, isLoading, error | fetchRecords, fetchRecord, createRecord, updateRecord, deleteRecord |
| useTransactionStore | transactionStore.ts | transactions, statistics, currentTransaction, total, page, pageSize, isLoading, error | fetchTransactions, fetchStatistics, fetchTransaction, createTransaction, updateTransaction, deleteTransaction |
| useUserStore | userStore.ts | users, total, page, pageSize, isLoading, error | fetchUsers, createUser, updateUser, deleteUser |

#### 认证状态持久化

`authStore` 使用 Zustand 的 `persist` 中间件将认证状态持久化到 localStorage：

```typescript
// authStore.ts
persist(
  (set, get) => ({ /* ... */ }),
  {
    name: 'auth-storage',
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({
      user: state.user,
      token: state.token,
      isAuthenticated: state.isAuthenticated,
    }),
  }
)
```

### 3. API 服务层

所有 API 调用封装在 `services/api.ts` 中，按业务模块划分。

#### API 模块

| 模块 | 接口前缀 | 主要方法 |
|------|----------|----------|
| authApi | `/auth` | login, getCurrentUser, logout |
| userApi | `/users` | getUsers, getUser, createUser, updateUser, deleteUser |
| productApi | `/products` | getProducts, getProduct, createProduct, updateProduct, updateStock, deleteProduct |
| customerApi | `/customers` | getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer, rechargeBalance, deductBalance, getBalanceHistory |
| consumptionRecordApi | `/consumption-records` | getCustomerRecords, getRecord, createRecord, updateRecord, deleteRecord |
| transactionApi | `/transactions` | getTransactions, getTransaction, createTransaction, updateTransaction, deleteTransaction, getStatistics, getMonthlyStatistics |
| uploadApi | `/upload` | uploadImage |
| saleApi | `/sales` | createSale, getSales, getSale |

#### Axios 配置

- **Base URL**: `import.meta.env.VITE_API_BASE_URL || '/api/v1'`
- **Timeout**: 10000ms
- **请求拦截器**: 自动添加 `Authorization: Bearer {token}` 头
- **响应拦截器**: 处理 401 跳转登录、403/404/500 错误提示

---

## 页面组件详解

### 1. LoginPage（登录页）

**路径**: `/login`
**文件**: `pages/LoginPage.tsx`

**功能**:
- 用户名登录（无密码）
- 登录成功后跳转首页
- 错误提示显示

**调用链**:
```
LoginPage → authStore.login() → authApi.login() → POST /auth/login
```

### 2. InventoryPage（库存管理）

**路径**: `/`
**文件**: `pages/InventoryPage.tsx`

**功能**:
- 商品列表展示（分页、搜索）
- 商品添加/编辑/删除（仅管理员）
- 库存快速修改
- 散客销售（开单）
- 商品网格视图（9 列布局）

**状态**:
- 搜索关键词
- 添加/编辑/库存/销售对话框开关
- 当前选中商品
- 销售表单状态（商品选择、数量、金额）

**调用链**:
```
InventoryPage → productStore.fetchProducts() → productApi.getProducts() → GET /products
InventoryPage → productStore.createProduct() → productApi.createProduct() → POST /products
InventoryPage → productStore.updateStock() → productApi.updateStock() → PATCH /products/:id/stock
InventoryPage → saleApi.createSale() → POST /sales
```

### 3. CustomersPage（客户管理）

**路径**: `/customers`
**文件**: `pages/CustomersPage.tsx`

**功能**:
- 客户列表展示（网格布局）
- 会员/非会员筛选
- 客户添加/编辑/删除
- 点击客户卡片查看详情
- 详情页包含：余额充值、余额扣减、余额历史、新增消费记录

**状态**:
- 搜索关键词
- 会员筛选（all/member/non-member）
- 添加/编辑/详情对话框开关
- 当前选中客户
- 余额相关对话框开关

**调用链**:
```
CustomersPage → customerStore.fetchCustomers() → customerApi.getCustomers() → GET /customers
CustomersPage → customerStore.createCustomer() → customerApi.createCustomer() → POST /customers
CustomersPage → customerApi.rechargeBalance() → POST /customers/:id/balance/recharge
CustomersPage → customerApi.deductBalance() → POST /customers/:id/balance/deduct
CustomersPage → customerApi.getBalanceHistory() → GET /customers/:id/balance/history
```

### 4. ConsumptionRecordsPage（消费记录）

**路径**: `/customers/:customerId/records`
**文件**: `pages/ConsumptionRecordsPage.tsx`

**功能**:
- 展示客户基本信息
- 显示当前余额
- 消费记录列表（分页）
- 新增/删除消费记录

**调用链**:
```
ConsumptionRecordsPage → customerStore.fetchCustomer() → customerApi.getCustomer() → GET /customers/:id
ConsumptionRecordsPage → consumptionStore.fetchRecords() → consumptionRecordApi.getCustomerRecords() → GET /customers/:id/consumption-records
```

### 5. AccountingPage（财务记账）

**路径**: `/accounting`
**文件**: `pages/AccountingPage.tsx`

**功能**:
- 统计卡片（总收入、总支出、净收入）
- 收支记录列表（分页）
- 类型筛选（全部/收入/支出）
- 描述搜索
- 日期范围筛选
- 记一笔（新增记录）
- 计算近 N 天净收入
- 查看月度收支情况

**状态**:
- 类型筛选
- 搜索关键词
- 日期范围
- 新增记录/日期筛选/净收入/月度统计对话框开关
- 净收入计算天数和结果
- 月度统计数据年份

**调用链**:
```
AccountingPage → transactionStore.fetchTransactions() → transactionApi.getTransactions() → GET /transactions
AccountingPage → transactionStore.fetchStatistics() → transactionApi.getStatistics() → GET /transactions/statistics
AccountingPage → transactionApi.getMonthlyStatistics() → GET /transactions/monthly-statistics
```

### 6. UsersPage（用户管理）

**路径**: `/users`
**文件**: `pages/UsersPage.tsx`
**权限**: 仅 ADMIN

**功能**:
- 店员列表展示
- 搜索用户名/姓名
- 新增/编辑/删除店员
- 角色管理（ADMIN/STAFF）
- admin 账号保护：不可删除、不可修改角色

**调用链**:
```
UsersPage → userStore.fetchUsers() → userApi.getUsers() → GET /users
UsersPage → userStore.createUser() → userApi.createUser() → POST /users
UsersPage → userStore.updateUser() → userApi.updateUser() → PUT /users/:id
UsersPage → userStore.deleteUser() → userApi.deleteUser() → DELETE /users/:id
```

---

## UI 组件库

### 基础组件

| 组件 | 文件 | 功能 |
|------|------|------|
| Button | Button.tsx | 按钮（primary/secondary/danger/ghost 变体） |
| Input | Input.tsx | 输入框（含 label、error、禁用滚轮） |
| TextArea | TextArea.tsx | 多行文本输入 |
| Select | Select.tsx | 下拉选择 |
| Card | Card.tsx | 卡片容器（含 CardHeader、CardContent、CardTitle） |
| Dialog | Dialog.tsx | 对话框（含遮罩、点击外部关闭、多层堆叠） |
| Badge | Badge.tsx | 徽章标签 |
| Table | Table.tsx | 表格（含 TableRow、TableCell） |
| ImageUpload | ImageUpload.tsx | 图片上传（支持预览、删除） |
| Pagination | Pagination.tsx | 分页器（页码、每页数量、跳转） |

### 复合组件

| 组件 | 文件 | 功能 |
|------|------|------|
| Layout | Layout.tsx | 主布局（侧边栏导航、顶部栏、响应式） |
| ProfileEditDialog | ProfileEditDialog.tsx | 个人资料编辑（昵称、头像） |
| ConsumptionRecordForm | ConsumptionRecordForm.tsx | 消费记录表单（服务/商品模式、余额支付、记账选项） |

---

## 工具函数

### memberLevel.ts

会员级别相关工具：

| 函数 | 功能 |
|------|------|
| MEMBER_LEVELS | 会员级别配置数组（0-4 级） |
| getMemberLevelInfo() | 根据级别值获取级别信息 |
| isMember() | 判断是否为会员 |
| getMemberStatusLabel() | 获取会员状态标签（二元） |
| getMemberLevelLabel() | 获取会员级别标签（五级） |
| getMemberLevelColor() | 获取会员级别颜色 |
| getMemberLevelBgColor() | 获取会员级别背景色 |
| getMemberLevelBorderColor() | 获取会员级别边框色 |

### validation.ts

表单验证工具：

| 函数 | 功能 |
|------|------|
| validatePrice() | 验证价格输入 |
| validateQuantity() | 验证数量输入 |

### dateFormat.ts

日期格式化工具：

| 函数 | 功能 |
|------|------|
| getCurrentLocalDateTime() | 获取当前本地时间（datetime-local 格式） |
| getLocalDateTimeString() | 格式化日期时间为 `yyyy-MM-dd HH:mm:ss` |
| getLocalDateString() | 格式化日期为 `yyyy-MM-dd` |

### errorHandler.ts

错误处理工具：

| 函数 | 功能 |
|------|------|
| getErrorMessage() | 提取友好的错误消息 |
| showErrorAlert() | 显示错误提示 |

### inputHandlers.ts

输入框事件处理：

| 函数 | 功能 |
|------|------|
| createPreventWheelRef() | 为原生 input 元素创建 ref 回调，禁用滚轮 |
| preventWheelChange() | 阻止输入框的滚轮事件（已弃用） |
| withWheelPrevention() | 为原生 input 元素创建 props 对象（已弃用） |

---

## 类型定义

### 核心类型

| 类型 | 文件 | 说明 |
|------|------|------|
| ApiResponse | types/index.ts | API 统一响应格式 `{ code, message, data }` |
| PaginatedResponse | types/index.ts | 分页响应格式 `{ list, total, page, pageSize }` |
| User | types/index.ts | 用户实体 |
| UserFormData | types/index.ts | 用户表单数据 |
| LoginResponse | types/index.ts | 登录响应 `{ user, accessToken, expiresIn }` |
| Product | types/index.ts | 商品实体 |
| ProductFormData | types/index.ts | 商品表单数据 |
| Customer | types/index.ts | 客户实体 |
| CustomerFormData | types/index.ts | 客户表单数据 |
| ConsumptionRecord | types/index.ts | 消费记录实体 |
| ConsumptionRecordFormData | types/index.ts | 消费记录表单数据 |
| Transaction | types/index.ts | 财务记录实体 |
| TransactionFormData | types/index.ts | 财务记录表单数据 |
| TransactionStatistics | types/index.ts | 财务统计 `{ totalIncome, totalExpense, netIncome, incomeCount, expenseCount }` |
| MonthlyStatistics | types/index.ts | 月度统计 |
| BalanceTransaction | types/index.ts | 余额变动记录 |
| SaleItem | types/index.ts | 销售项 |
| SaleFormData | types/index.ts | 销售请求 |
| SaleResponse | types/index.ts | 销售响应 |
| Sale | types/index.ts | 销售实体 |

---

## 数据流向

### 登录流程

```
用户输入用户名
    ↓
LoginPage 调用 authStore.login()
    ↓
authStore 调用 authApi.login()
    ↓
POST /auth/login
    ↓
存储 token 到 localStorage 和 zustand
    ↓
跳转到首页 (/)
```

### 库存管理数据流

```
InventoryPage 挂载
    ↓
调用 productStore.fetchProducts()
    ↓
productStore 调用 productApi.getProducts()
    ↓
GET /products?page=1&pageSize=10
    ↓
更新 productStore 状态
    ↓
InventoryPage 重新渲染显示商品列表
```

### 客户消费流程（服务模式）

```
ConsumptionRecordForm 提交表单
    ↓
调用 consumptionStore.createRecord() 创建消费记录
    ↓
POST /customers/:customerId/consumption-records
    ↓
如果勾选"记录到财务记账"：
    ↓
调用 transactionApi.createTransaction() 创建记账记录
    ↓
POST /transactions
    ↓
如果勾选"使用余额支付"：
    ↓
调用 customerApi.deductBalance() 扣减余额
    ↓
POST /customers/:customerId/balance/deduct
    ↓
关闭对话框，回调刷新列表
```

### 客户消费流程（商品模式）

```
ConsumptionRecordForm 选择商品模式
    ↓
添加商品到购物车 (cartItems)
    ↓
输入实际交易金额
    ↓
提交表单
    ↓
调用 saleApi.createSale() 创建销售记录
    ↓
POST /sales
    ↓
后端自动创建消费记录、扣减库存、扣减余额、记账
    ↓
关闭对话框，回调刷新列表
```

---

## 常量配置

### 常量

| 常量 | 值 | 用途 |
|------|-----|------|
| DEFAULT_PRODUCT_IMAGE | `https://placehold.co/400x400/...` | 默认商品图片 |
| DEFAULT_AVATAR | `https://placehold.co/100x100/...` | 默认头像 |

### 会员级别配置

| 级别值 | 名称 | 充值档位 | 颜色 |
|--------|------|----------|------|
| 0 | 非会员 | - | 灰色 |
| 1 | 500 | 500 元 | 绿色 |
| 2 | 1000 | 1000 元 | 蓝色 |
| 3 | 2000 | 2000 元 | 紫色 |
| 4 | 5000 | 5000 元 | 红色 |

---

## 构建和开发

### 开发命令

| 命令 | 功能 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览生产构建 |
| `npm run lint` | 代码检查 |

### Vite 配置

- **开发服务器代理**: `/api/v1` → `http://localhost:8080`
- **插件**: `@vitejs/plugin-react`

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| VITE_API_BASE_URL | /api/v1 | API 基础路径 |

---

## 注意事项

1. **Token 过期处理**: Token 有效期 2 小时，过期后自动跳转登录页
2. **金额单位**: 后端使用"分"作为金额单位，前端显示时转换为"元"
3. **滚轮禁用**: 所有 number 类型输入框已禁用滚轮功能
4. **分页默认值**: 商品 10 条/页，客户 9 条/页，其他模块 10 条/页
5. **图片上传**: 使用 placehold.co 作为占位图服务
6. **日期格式**: 统一使用 `yyyy-MM-dd` 或 `yyyy-MM-dd HH:mm:ss` 格式

---

*文档生成时间: 2026-03-04*
