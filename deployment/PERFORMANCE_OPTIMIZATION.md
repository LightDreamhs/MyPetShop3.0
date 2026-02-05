# 性能优化配置说明

本文档说明针对 2GB 内存服务器的性能优化配置。

## 优化概述

**服务器配置：**
- CPU: 2 核
- 内存: 2 GB
- 存储: 40 GB ESSD

**使用场景：**
- 用户数：10 人以内
- 并发：最多 2 人
- 日接单量：50 单

---

## 1. 内存优化

### 1.1 MySQL 配置（已优化）

配置文件：`deployment/my.cnf`

```ini
innodb_buffer_pool_size = 128M  # InnoDB 缓冲池
innodb_redo_log_capacity = 64M  # Redo 日志容量
innodb_log_buffer_size = 8M      # 日志缓冲区
max_connections = 50             # 最大连接数
```

**预计占用：512MB - 1GB**

### 1.2 Spring Boot JVM 配置（已优化）

配置文件：`deployment/docker-compose.yml`

```yaml
environment:
  JAVA_OPTS: >-
    -Xms256m           # 初始堆内存
    -Xmx512m           # 最大堆内存
    -XX:+UseG1GC       # G1 垃圾回收器
    -XX:MaxGCPauseMillis=200  # 最大GC停顿时间
```

**预计占用：384MB - 768MB**

### 1.3 Nginx 配置（已优化）

Nginx 本身非常轻量，资源限制：

```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 128M
```

**预计占用：50MB - 100MB**

---

## 2. 资源限制

### 2.1 容器资源限制

所有服务都配置了 CPU 和内存限制，防止某个服务占用过多资源：

| 服务 | CPU 限制 | 内存限制 |
|------|----------|----------|
| MySQL | 1.0 核 | 1 GB |
| Backend | 1.0 核 | 768 MB |
| Frontend | 0.5 核 | 128 MB |
| **总计** | **2.5 核** | **1.9 GB** |

**注意：** CPU 限制是软限制，可以超频使用（因为你有 2 核）

### 2.2 容器日志限制

所有容器日志都配置了轮转：

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"   # 单个日志文件最大 10MB
    max-file: "3"     # 最多保留 3 个日志文件
```

**每个容器最多占用日志空间：30MB**
**总计日志空间：90MB**

---

## 3. 维护脚本

### 3.1 日志清理脚本

**文件：** `deployment/cleanup-logs.sh`

**功能：**
- 清理 7 天前的 Nginx 访问日志
- 清理 7 天前的 Nginx 错误日志
- 清空 Docker 容器当前日志

**手动执行：**
```bash
cd deployment
chmod +x cleanup-logs.sh
./cleanup-logs.sh
```

**添加定时任务（每天凌晨 3 点执行）：**
```bash
crontab -e
# 添加以下行：
0 3 * * * cd /path/to/deployment && ./cleanup-logs.sh >> /var/log/petshop-cleanup.log 2>&1
```

### 3.2 磁盘监控脚本

**文件：** `deployment/monitor-disk.sh`

**功能：**
- 显示磁盘使用情况
- 显示容器资源使用
- 显示数据库数据统计
- 显示上传文件统计
- 健康状态检查

**手动执行：**
```bash
cd deployment
chmod +x monitor-disk.sh
./monitor-disk.sh
```

**添加定时任务（每小时检查一次）：**
```bash
crontab -e
# 添加以下行：
0 * * * * cd /path/to/deployment && ./monitor-disk.sh >> /var/log/petshop-monitor.log 2>&1
```

---

## 4. 内存使用分析

### 4.1 正常运行时内存占用

```
MySQL:      512MB - 1GB
Backend:    384MB - 768MB
Frontend:   50MB - 100MB
System:     200MB - 300MB
--------------------------------
总计:       1.1GB - 2.2GB
```

**注意：** 总占用接近 2GB，需要定期监控

### 4.2 内存不足的症状

- 系统频繁 swap
- 容器被 OOM Killer 杀掉
- 应用响应变慢
- `dmesg` 显示 "Out of memory"

**解决方案：**
```bash
# 查看内存使用
docker stats

# 运行监控脚本
./monitor-disk.sh

# 清理日志
./cleanup-logs.sh
```

---

## 5. 磁盘空间管理

### 5.1 磁盘空间估算

| 项目 | 预估大小 |
|------|---------|
| 应用代码 | 500MB |
| 数据库数据（每年） | 50MB |
| 上传图片（每天10张，每张2MB） | 7GB/年 |
| 日志文件 | < 100MB |
| 系统开销 | 2-3GB |
| **总计** | **~10-12GB/年** |

**结论：** 40GB 硬盘足够使用 3-4 年

### 5.2 磁盘空间警告阈值

- **70%** - 警告，建议清理日志
- **85%** - 严重，立即清理

监控脚本会自动检查并提示。

---

## 6. 性能监控

### 6.1 实时监控

```bash
# 查看容器资源使用
docker stats

# 查看磁盘使用
df -h

# 查看具体数据卷大小
docker volume ls | grep petshop
docker volume inspect <volume_name>
```

### 6.2 日志查看

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker logs petshop-backend
docker logs petshop-mysql
docker logs petshop-frontend

# 查看 Nginx 日志
docker exec petshop-frontend tail -f /var/log/nginx/access.log
docker exec petshop-frontend tail -f /var/log/nginx/error.log
```

---

## 7. 常见问题

### Q1: 内存占用过高怎么办？

```bash
# 1. 查看哪个服务占用最多
docker stats

# 2. 查看后端日志
docker logs petshop-backend --tail 100

# 3. 如果是内存泄漏，重启后端
docker-compose restart backend

# 4. 运行监控脚本分析
./monitor-disk.sh
```

### Q2: 磁盘空间不足怎么办？

```bash
# 1. 清理日志
./cleanup-logs.sh

# 2. 清理 Docker 未使用的镜像和容器
docker system prune -a

# 3. 查看上传文件大小
./monitor-disk.sh

# 4. 删除旧的上传文件（手动）
```

### Q3: 如何验证优化效果？

```bash
# 运行监控脚本
./monitor-disk.sh

# 检查内存使用是否在合理范围
# Backend: < 768MB
# MySQL: < 1GB
# Frontend: < 128MB
```

---

## 8. 升级建议

**何时需要升级服务器配置？**

- 用户数超过 30 人
- 并发超过 5 人
- 日接单量超过 200 单
- 频繁出现内存不足
- 磁盘使用率持续 > 80%

**建议升级配置：**
- CPU: 4 核
- 内存: 4 GB
- 存储: 80 GB

---

## 9. 优化验证

部署后，运行以下命令验证优化是否生效：

```bash
cd deployment

# 1. 启动服务
docker-compose up -d

# 2. 等待服务启动完成（约1-2分钟）
sleep 120

# 3. 运行监控脚本
chmod +x monitor-disk.sh
./monitor-disk.sh

# 4. 检查资源限制是否生效
docker inspect petshop-backend | grep -A 10 "Memory"
docker inspect petshop-mysql | grep -A 10 "Memory"

# 5. 检查日志限制是否生效
docker inspect petshop-backend | grep -A 10 "LogConfig"
```

---

## 10. 文件清单

优化相关文件：

```
deployment/
├── docker-compose.yml           # 添加了资源限制和日志配置
├── my.cnf                       # MySQL 配置（已优化）
├── cleanup-logs.sh              # 日志清理脚本（新增）
├── monitor-disk.sh              # 磁盘监控脚本（新增）
└── PERFORMANCE_OPTIMIZATION.md  # 本文档（新增）
```

---

## 11. 联系与支持

如有问题，请查看：
- 项目 README: `../README.md`
- API 文档: `../API接口文档.md`
- 部署文档: `./deployment/README.md`

---

**最后更新：** 2025-02-05
**适用版本：** v1.1.0+
