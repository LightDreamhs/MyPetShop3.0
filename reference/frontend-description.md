我要做一个宠物店后台管理系统，该文件夹中的图片是我用figma做出的原型。以下是figma总结的该系统：
  “这是一个基于 React + Tailwind CSS + Vite 的宠物店后台管理系统 (Pet Shop Admin Dashboard)。系统主要包含登录页和三个核心功能模块，使用 App.tsx
  中的本地 State 和模拟数据进行状态管理。”

  页面结构与功能：

  布局 (Layout): 左侧固定侧边栏导航，右侧为主内容区域。包含顶部状态栏显示当前登录用户和退出按钮。
  登录页 (Login Page): 一个简单的全屏登录界面，输入用户名即可进入系统。
  库存管理 (Inventory):
  以表格或卡片形式展示商品（图片、名称、分类、价格、库存）。
  功能：支持“修改库存”和“新增商品”。
  客户信息 (Customers):
  列表视图: 使用响应式网格布局 (Grid)
  展示客户卡片。每个卡片包含宠物照片（左侧大图）、主人姓名、电话以及会员状态徽章（会员为金色背景，非会员为灰色）。支持通过姓名或电话搜索。
  详情弹窗: 点击卡片弹出的 Dialog，展示完整信息。
  消费记录页 (Sub-page):
  从详情页点击进入的独立次级页面。包含头部返回按钮、客户基本信息摘要卡片、以及详细的历史消费记录表格（字段：日期、项目、发现问题、建议）。
  记账 (Accounting):
  展示收支记录列表。
  视觉区分：收入金额显示为绿色，支出金额显示为红色。
  功能：支持“记一笔”新增收支记录。
  2. 使用的组件与图标资源 (Assets & Components)
  图标库 (Icons) 项目统一使用了 lucide-react 库：

  📦 Package (用于侧边栏-库存管理)
  👥 Users (用于侧边栏-客户信息)
  💰 Coins (用于侧边栏-记账)
  🚪 LogOut (用于顶部-退出登录)
  🔍 Search (用于客户页-搜索框)
  ⬅️ ArrowLeft (用于消费记录页-返回按钮)
  UI 组件库 代码中使用了封装好的 UI 组件（类似 shadcn/ui 风格），位于 @/app/components/ui/ 目录：

  Button, Input, Card, Dialog, Table, Badge
  图片资源 (Images) 目前使用的是 Unsplash 的在线图片 URL 作为占位符，没有本地图片文件：

  狗粮/商品: https://images.unsplash.com/photo-1589924691995-400dc9ecc119
  猫/宠物: https://images.unsplash.com/photo-1592194996308-7b43878e84a6
  狗/宠物: https://images.unsplash.com/photo-1557495235-340eb888a9fb