# 客户会员级别功能 - 前端修改需求

## 📋 文档信息

| 项目 | 内容 |
|------|------|
| 功能名称 | 客户会员级别管理 |
| 修改日期 | 2025-01-23 |
| 影响范围 | 客户管理模块 |
| 后端版本 | v1.1.0 |

---

## 🔙 后端修改概述

### 1. 数据模型变更

#### Customer 实体新增字段

```java
// 旧版本
private Boolean isMember;  // 是否会员（0否1是）

// 新版本
private Boolean isMember;  // 是否会员（已废弃，保留兼容）
private Integer memberLevel;  // 会员级别（0非会员1初级2中级3高级4至尊）
```

#### 会员级别映射表

| 级别值 | 名称 | isMember | 说明 |
|--------|------|----------|------|
| 0 | 非会员 | false | 普通客户，无会员权益 |
| 1 | 初级会员 | true | 入门会员等级 |
| 2 | 中级会员 | true | 中等会员等级 |
| 3 | 高级会员 | true | 高等级会员 |
| 4 | 至尊会员 | true | 最高等级会员 |

**注意**: `isMember` 字段已废弃，但后端仍保留以兼容旧数据。新代码应使用 `memberLevel` 字段。

### 2. API 接口变更

#### 客户列表接口

**请求参数新增**:
```typescript
interface CustomerListParams {
  page: number;
  pageSize: number;
  search?: string;
  isMember?: boolean;  // 已废弃，但保留兼容
  memberLevel?: number;  // 新增：按会员级别筛选（0-4）
}
```

**响应数据新增**:
```typescript
interface Customer {
  // ... 其他字段
  isMember: boolean;    // 已废弃，保留兼容
  memberLevel: number;  // 新增：会员级别（0-4）
}
```

#### 创建客户接口

**请求参数新增**:
```json
{
  "petName": "string",
  "ownerName": "string",
  "phone": "string",
  "isMember": boolean,    // 已废弃
  "memberLevel": number,  // 新增：必填，0-4
  // ... 其他字段
}
```

**验证规则**:
- `memberLevel` 为必填字段
- 取值范围：0-4
- 后端会进行参数校验

#### 更新客户接口

**请求参数新增**:
```json
{
  "petName": "string",
  "ownerName": "string",
  "phone": "string",
  "isMember": boolean,    // 已废弃
  "memberLevel": number,  // 新增：必填，0-4
  // ... 其他字段
}
```

---

## 🎨 前端功能需求

### 需求 1: 客户列表页（首页面）

#### 显示逻辑

**会员状态显示（二元）**:
- ✅ 仅显示"会员"或"非会员"
- ✅ 不显示具体等级（初级/中级/高级/至尊）

**实现方式**:
```typescript
// 从 memberLevel 推导会员状态
const getMemberStatus = (memberLevel: number): string => {
  return memberLevel > 0 ? '会员' : '非会员';
};

// 示例
getMemberStatus(0);  // "非会员"
getMemberStatus(1);  // "会员"
getMemberStatus(2);  // "会员"
getMemberStatus(3);  // "会员"
getMemberStatus(4);  // "会员"
```

**UI 示例**:
```
┌─────────────────────────────────────┐
│ 客户卡片                            │
│ ──────────────────────────────────  │
│ 宠物: 旺财                          │
│ 主人: 张三                          │
│ 会员状态: 会员                     │  ← 只显示会员/非会员
│ 电话: 138****8000                   │
└─────────────────────────────────────┘
```

#### 筛选功能

**保留现有筛选器**:
- 可选择"全部"、"会员"、"非会员"
- 底层实现：`memberLevel > 0` 为会员，`memberLevel === 0` 为非会员

```typescript
// 筛选逻辑
const filterByMemberStatus = (status: string) => {
  if (status === 'all') return {};
  if (status === 'member') return { memberLevel: { $gt: 0 } };  // 或后端筛选
  if (status === 'non-member') return { memberLevel: 0 };
};
```

---

### 需求 2: 客户详情/编辑页

#### 显示逻辑

**会员等级显示（五级）**:
- ✅ 显示具体会员等级
- ✅ 支持查看和修改

**UI 示例**:
```
┌─────────────────────────────────────┐
│ 客户详情                            │
│ ──────────────────────────────────  │
│ 宠物名称: [旺财          ]          │
│ 主人姓名: [张三          ]          │
│ 电话号码: [13800138000   ]          │
│                                     │
│ 会员级别:                           │  ← 显示具体等级
│   ○ 非会员 (0)                      │
│   ○ 初级会员 (1)                    │
│   ● 中级会员 (2)  ← 当前选中        │
│   ○ 高级会员 (3)                    │
│   ○ 至尊会员 (4)                    │
│                                     │
│ 宠物类型: [狗           ]           │
│ 品种:     [金毛         ]           │
│ 年龄:     [3            ]           │
│ 性别:     [公           ]           │
│ 备注:     [性格温顺...  ]           │
│                                     │
│ [ 保存 ]  [ 取消 ]                  │
└─────────────────────────────────────┘
```

**实现方式**:
```typescript
// 会员级别配置
const MEMBER_LEVELS = [
  { value: 0, label: '非会员', color: '#999' },
  { value: 1, label: '初级会员', color: '#52c41a' },
  { value: 2, label: '中级会员', color: '#1890ff' },
  { value: 3, label: '高级会员', color: '#722ed1' },
  { value: 4, label: '至尊会员', color: '#f5222d' },
];

// 表单控件
<Select
  value={memberLevel}
  onChange={setMemberLevel}
  options={MEMBER_LEVELS.map(level => ({
    label: level.label,
    value: level.value,
  }))}
/>

// 或使用 Radio.Group
<Radio.Group
  value={memberLevel}
  onChange={e => setMemberLevel(e.target.value)}
>
  {MEMBER_LEVELS.map(level => (
    <Radio key={level.value} value={level.value}>
      {level.label}
    </Radio>
  ))}
</Radio.Group>
```

---

### 需求 3: 表单验证

#### 创建客户表单

```typescript
const customerFormRules = {
  petName: [
    { required: true, message: '请输入宠物名称' }
  ],
  ownerName: [
    { required: true, message: '请输入主人姓名' }
  ],
  phone: [
    { required: true, message: '请输入电话号码' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
  ],
  memberLevel: [
    { required: true, message: '请选择会员级别' },
    {
      validator: (_, value) => {
        if (value < 0 || value > 4) {
          return Promise.reject('会员级别必须在0-4之间');
        }
        return Promise.resolve();
      }
    }
  ],
  // ... 其他字段
};
```

#### 更新客户表单

- 验证规则与创建表单相同
- `memberLevel` 为必填字段

---

## 🔄 数据转换工具

### 会员状态工具函数

```typescript
// utils/memberLevel.ts

/**
 * 会员级别配置
 */
export const MEMBER_LEVELS = [
  { value: 0, label: '非会员', color: '#999', badge: 'default' },
  { value: 1, label: '初级会员', color: '#52c41a', badge: 'success' },
  { value: 2, label: '中级会员', color: '#1890ff', badge: 'processing' },
  { value: 3, label: '高级会员', color: '#722ed1', badge: 'warning' },
  { value: 4, label: '至尊会员', color: '#f5222d', badge: 'error' },
] as const;

/**
 * 根据级别值获取级别信息
 */
export const getMemberLevelInfo = (level: number) => {
  return MEMBER_LEVELS.find(l => l.value === level) || MEMBER_LEVELS[0];
};

/**
 * 判断是否为会员
 */
export const isMember = (memberLevel: number): boolean => {
  return memberLevel > 0;
};

/**
 * 获取会员状态标签（二元）
 */
export const getMemberStatusLabel = (memberLevel: number): string => {
  return isMember(memberLevel) ? '会员' : '非会员';
};

/**
 * 获取会员级别标签（五级）
 */
export const getMemberLevelLabel = (memberLevel: number): string => {
  return getMemberLevelInfo(memberLevel).label;
};

/**
 * 获取会员级别颜色
 */
export const getMemberLevelColor = (memberLevel: number): string => {
  return getMemberLevelInfo(memberLevel).color;
};
```

---

## 📝 API 调用示例

### 获取客户列表

```typescript
// 请求
const response = await axios.get('/api/v1/customers', {
  params: {
    page: 1,
    pageSize: 10,
    memberLevel: undefined,  // 可选：按级别筛选
  },
});

// 响应数据处理
const customers = response.data.data.list.map(customer => ({
  ...customer,
  memberStatusLabel: getMemberStatusLabel(customer.memberLevel),
}));
```

### 创建客户

```typescript
// 请求
const newCustomer = {
  petName: '旺财',
  ownerName: '张三',
  phone: '13800138000',
  memberLevel: 2,  // 中级会员
  // ... 其他字段
};

const response = await axios.post('/api/v1/customers', newCustomer);
```

### 更新客户

```typescript
// 请求
const updatedCustomer = {
  petName: '旺财',
  ownerName: '张三',
  phone: '13800138000',
  memberLevel: 3,  // 升级为高级会员
  // ... 其他字段
};

const response = await axios.put(`/api/v1/customers/${id}`, updatedCustomer);
```

---

## 🎯 UI 组件建议

### 客户列表页卡片

```tsx
// components/CustomerCard.tsx
import { getMemberStatusLabel, getMemberLevelColor } from '@/utils/memberLevel';

interface CustomerCardProps {
  customer: Customer;
  onClick: () => void;
}

const CustomerCard: React.FC<CustomerCardProps> = ({ customer, onClick }) => {
  const memberStatus = getMemberStatusLabel(customer.memberLevel);

  return (
    <Card onClick={onClick} hoverable>
      <Meta
        title={customer.petName}
        description={
          <>
            <p>主人: {customer.ownerName}</p>
            <Tag color={customer.memberLevel > 0 ? 'blue' : 'default'}>
              {memberStatus}
            </Tag>
            <p>电话: {formatPhone(customer.phone)}</p>
          </>
        }
      />
    </Card>
  );
};
```

### 客户详情/编辑表单

```tsx
// forms/CustomerForm.tsx
import { MEMBER_LEVELS } from '@/utils/memberLevel';

const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onSubmit }) => {
  const [form] = Form.useForm();

  return (
    <Form
      form={form}
      initialValues={customer}
      onFinish={onSubmit}
      layout="vertical"
    >
      {/* 基本信息 */}
      <Form.Item label="宠物名称" name="petName" rules={[{ required: true }]}>
        <Input />
      </Form.Item>

      <Form.Item label="主人姓名" name="ownerName" rules={[{ required: true }]}>
        <Input />
      </Form.Item>

      <Form.Item label="电话号码" name="phone" rules={[{ required: true }]}>
        <Input />
      </Form.Item>

      {/* 会员级别选择 */}
      <Form.Item
        label="会员级别"
        name="memberLevel"
        rules={[{ required: true, message: '请选择会员级别' }]}
      >
        <Select>
          {MEMBER_LEVELS.map(level => (
            <Select.Option
              key={level.value}
              value={level.value}
            >
              <Badge color={level.color} text={level.label} />
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      {/* 或使用 Radio.Group */}
      <Form.Item
        label="会员级别"
        name="memberLevel"
        rules={[{ required: true, message: '请选择会员级别' }]}
      >
        <Radio.Group>
          {MEMBER_LEVELS.map(level => (
            <Radio key={level.value} value={level.value}>
              {level.label}
            </Radio>
          ))}
        </Radio.Group>
      </Form.Item>

      {/* 其他字段... */}

      <Form.Item>
        <Button type="primary" htmlType="submit">
          保存
        </Button>
      </Form.Item>
    </Form>
  );
};
```

---

## ⚠️ 注意事项

### 1. 字段兼容性

- `isMember` 字段后端已废弃，但响应中仍会返回
- 前端应使用 `memberLevel` 字段进行判断
- 建议删除前端代码中对 `isMember` 的依赖

### 2. 数据验证

- `memberLevel` 为必填字段，取值范围 0-4
- 后端会进行参数校验，不合法会返回错误

### 3. 向后兼容

- 现有客户数据的 `memberLevel` 默认值：
  - `isMember = false` → `memberLevel = 0`
  - `isMember = true` → `memberLevel = 1-4`（需要手动指定）

### 4. 日期格式

- 后端日期格式已修复为 ISO 8601（不带 Z 后缀）
- 示例：`2024-01-15T00:00:00`

---

## 📅 开发检查清单

### 前端开发任务

- [ ] 1. 安装/更新类型定义（Customer 接口添加 memberLevel）
- [ ] 2. 创建会员级别工具函数（utils/memberLevel.ts）
- [ ] 3. 修改客户列表页：
  - [ ] 会员状态显示改为二元（会员/非会员）
  - [ ] 移除对 isMember 字段的依赖
  - [ ] 使用 memberLevel 进行判断
- [ ] 4. 修改客户详情页：
  - [ ] 显示具体会员级别
  - [ ] 添加会员级别选择控件
  - [ ] 更新表单验证规则
- [ ] 5. 修改客户创建表单：
  - [ ] 添加会员级别选择（必填）
  - [ ] 设置默认值为 0（非会员）
- [ ] 6. 修改客户编辑表单：
  - [ ] 添加会员级别选择（必填）
  - [ ] 支持修改会员级别
- [ ] 7. 更新 API 调用：
  - [ ] 创建客户时传递 memberLevel
  - [ ] 更新客户时传递 memberLevel
- [ ] 8. 测试：
  - [ ] 测试列表页显示
  - [ ] 测试详情页显示
  - [ ] 测试创建客户
  - [ ] 测试编辑客户
  - [ ] 测试会员级别筛选（如实现）

---

## 🔗 相关文档

- [API接口文档.md](../../API接口文档.md) - 完整的 API 接口文档
- [backend/README.md](../../backend/README.md) - 后端项目说明

---

**文档版本**: v1.0
**最后更新**: 2025-01-23
**维护者**: 后端开发团队
