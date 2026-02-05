# 宠物店后台管理系统 - 前端

基于 React + TypeScript + Vite + Tailwind CSS 的宠物店后台管理系统前端应用。

## 技术栈

- **框架**: React 19 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS 4
- **状态管理**: Zustand
- **路由**: React Router DOM
- **HTTP 客户端**: Axios
- **图标**: Lucide React

## 项目结构

```
frontend/
├── src/
│   ├── components/         # UI 组件
│   │   ├── ui/            # 基础 UI 组件 (Button, Input, Card, Dialog 等)
│   │   └── Layout.tsx     # 主布局组件
│   ├── pages/             # 页面组件
│   │   ├── LoginPage.tsx          # 登录页
│   │   ├── InventoryPage.tsx      # 库存管理
│   │   ├── CustomersPage.tsx      # 客户信息
│   │   ├── ConsumptionRecordsPage.tsx  # 消费记录
│   │   └── AccountingPage.tsx     # 财务记账
│   ├── stores/            # Zustand 状态管理
│   │   ├── authStore.ts
│   │   ├── productStore.ts
│   │   ├── customerStore.ts
│   │   ├── consumptionStore.ts
│   │   ├── transactionStore.ts
│   │   └── balanceStore.ts
│   ├── services/          # API 服务
│   │   └── api.ts        # API 接口定义
│   ├── types/             # TypeScript 类型定义
│   │   └── index.ts
│   ├── lib/               # 工具库
│   │   └── axios.ts      # Axios 实例配置
│   ├── App.tsx            # 主应用组件
│   └── main.tsx           # 入口文件
├── .env                   # 环境变量
├── index.html
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## 功能模块

### 1. 认证模块
- 用户登录
- Token 管理
- 路由权限控制
- **角色权限**：管理员（ADMIN）和普通员工（STAFF）

### 2. 用户管理
- 用户列表展示（仅管理员）
- 新增用户（仅管理员）
- 编辑用户信息
- 删除用户（仅管理员）
- **个人资料编辑**：所有用户可编辑自己的头像和昵称

### 3. 库存管理
- 商品列表展示
- 新增商品（仅管理员）
- 编辑商品信息（仅管理员）
- 修改库存（所有用户）
- 删除商品（仅管理员）
- 商品搜索
- **进价隐藏**：普通员工无法看到商品进价

### 4. 客户管理
- 客户卡片列表
- 新增客户
- 客户详情查看
- 客户搜索（按姓名/电话）
- 会员筛选
- **会员余额管理**：
  - 会员余额充值
  - 会员余额扣减
  - 余额变动历史查询

### 5. 消费记录
- 消费记录列表
- 新增消费记录
- 日期/问题/建议/金额记录

### 6. 财务记账
- 收支记录列表
- 财务统计（总收入、总支出、净收入）
- 新增记账
- 类型筛选（收入/支出）
- 删除记录

## 环境变量

创建 `.env` 文件并配置：

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

## 安装依赖

```bash
npm install
```

## 运行项目

```bash
npm run dev
```

项目将在 `http://localhost:5173` 启动。

## 构建生产版本

```bash
npm run build
```

## 预览生产构建

```bash
npm run preview
```

## API 接口

前端严格遵循后端 API 接口文档进行开发。所有接口请求都会自动添加 JWT Token 到请求头。

### 接口基础路径
```
/api/v1
```

### 认证方式
```
Authorization: Bearer <access_token>
```

## 默认账号

- **用户名**: `admin`
- **密码**: `admin123`
- **角色**: 管理员（ADMIN）

> **提示**：首次部署后，请及时修改管理员密码

## 浏览器支持

- Chrome (推荐)
- Firefox
- Edge
- Safari

## 开发说明

1. 所有金额单位为"分"，前端显示时需要转换为"元"
2. 日期格式使用 ISO 8601
3. 所有图片使用 Unsplash 占位图
4. 使用 Zustand persist 中间件持久化认证状态
5. **权限控制**：
   - 使用 `authStore.isAdmin()` 判断是否为管理员
   - 使用 `authStore.hasRole('ADMIN' | 'STAFF')` 判断角色
   - 前端仅做 UI 层面的隐藏，后端拦截器是真正的权限控制

## 注意事项

- 确保后端服务已启动
- 检查 `.env` 文件中的 API 地址是否正确
- Token 存储在 localStorage 中
- 401 响应会自动跳转到登录页
