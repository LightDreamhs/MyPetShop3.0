# agent.md — AI 协作与运维备忘

> 面向 AI 助手与后续维护者：记录踩坑教训与由此定下的硬性规范。改动重大流程时必须同步更新本文件。

## 2026-09-21 生产事故：服务器构建导致两店中断约 50 分钟

### 历程

1. 修复"开一单单价 5.68 变 568"bug 并全站优化金额输入，需重建两店前端镜像。
2. 按旧流程在 2 GB 生产服务器上执行 `docker compose build frontend`（容器内 `npm ci` + Vite 构建），构建前可用内存仅 321 MB。
3. 构建触发内存耗尽，系统陷入 swap 翻页假死：SSH、主店 :80、分店 :81 全部无响应，仅 ping 可通。
4. 处置：阿里云控制台强制重启。5 个容器（`restart: unless-stopped`）自动拉起，两店以旧版代码恢复营业；构建开始前刚完成两库 mysqldump 备份，数据零损失。
5. 改用"本地构建镜像 → `docker save | gzip | ssh docker load` → retag → compose up"完成发布，全程约 2 分钟。

### 根因

- **直接根因**：在 2 GB 服务器（常驻容器已占 1.3 GB）上跑内存密集型构建（`npm ci` + Vite 峰值需 500 MB 以上）。
- **放大根因**：swap（2 GB）兜底使系统"假死不崩溃"——内核宁可持续翻页也不触发 OOM killer，表现为全服务无响应而非进程被杀，故障持续时间被拉长。
- **流程根因**：一行根因修复与约 40 处展示重构捆绑成一次发布；部署方式单一，只有"服务器构建"一条路，无本地构建预案。

## 硬性规范（以后怎么做）

1. **生产服务器永远不跑构建**。前端更新一律走本地构建路径：

   ```bash
   # 开发机
   cd frontend && npm run build
   docker build -t petshop-frontend:fix-<日期> -f deployment/Dockerfile.frontend-prebuilt frontend/
   docker save petshop-frontend:fix-<日期> | gzip | ssh root@47.108.181.158 'gunzip | docker load'
   # 服务器
   docker tag petshop-frontend:fix-<日期> deployment-frontend:latest        # 主店
   docker tag petshop-frontend:fix-<日期> petshop-frontend:branch           # 分店
   cd ~/MyPetShop3.0/deployment && docker compose up -d frontend
   docker compose -f deployment/branch/docker-compose.branch.yml \
     --env-file deployment/branch/.env.branch up -d frontend-branch
   ```

   两店共用同一镜像（内容无差异），保证代码一致。后端更新同理禁止在服务器构建（本地构建后 save/load，或走维护窗口）。

2. **bug 修复先修先发，与重构分开**。最小 diff 最早上线、最好回滚；本次 5.68 根因实际只差一行（`unitPrice: product.price ?? 0`），本可独立先行，重构随后按自身节奏发布。一次发布只带一个主题。

3. **依赖源统一走国内**：

   | 依赖 | 结论 |
   |------|------|
   | npm | 能用阿里源：`registry.npmmirror.com`（阿里维护），开发机在 `.npmrc` 配置即可 |
   | Maven | 已接阿里云仓库（提交 2d8b4b3），无需改动 |
   | Docker 基础镜像 | 阿里云官方加速器对 Docker Hub 已基本失效；实测可用 DaoCloud：`docker pull docker.m.daocloud.io/library/<镜像>:<tag>` 后 `docker tag` 改回标准名（nginx:alpine、node:18-alpine 已验证）。建议在 Docker Desktop 的 `registry-mirrors` 中配置，一劳永逸 |

4. **发布前检查单**（两店通用）：mysqldump 备份两店库 → 旧镜像打 `backup-<日期>` tag → 发布 → `curl` 两店首页 + 确认容器 healthy + 核对 JS chunk 哈希为新版 → 异常立即 retag 回 backup 并 `up -d`（秒级回滚，不动数据）。

5. **金额/数量输入必须走 `frontend/src/utils/money.ts`**。接口返回的价格已是"分"，严禁再 `× 100`；新增输入框直接复用 `MONEY_INPUT_RE` / `settleMoneyInput` / `formatYuan`，不要手写换算（5.68 → 568 即此类手写错误）。

## 遗留事项

- 新增/编辑商品弹窗的进价占位符仍为 `0.00`（纯提示文字，不影响行为），下次改动顺手改为 `0`。
- `docs/分店部署方案.md` 8.2 节"分店更新"仍写服务器构建，需补充本文第 1 条的本地构建路径。
- 服务器保留 `deployment-frontend:backup-20260921_224409`、`petshop-frontend:branch-backup-20260921_224409` 两个回滚 tag，确认新版稳定一周后可清理。
