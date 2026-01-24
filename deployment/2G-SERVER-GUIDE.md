# 2核2G服务器部署指南

> 针对小内存服务器的优化配置和注意事项

## 📋 适用场景

- ✅ 每天订单量 < 100单
- ✅ 同时在线用户 < 10人
- ✅ 数据记录 < 10万条
- ✅ 预算有限，追求性价比

---

## ⚙️ 内存优化配置

### **使用 2G 专用 MySQL 配置**

**默认配置（my.cnf）**：适合 2核4G
- innodb_buffer_pool_size: 256M
- query_cache_size: 32M
- max_connections: 200

**2G优化配置（my-2g.cnf）**：适合 2核2G
- innodb_buffer_pool_size: 128M ⬇️ 减少50%
- query_cache_size: 16M ⬇️ 减少50%
- max_connections: 50 ⬇️ 减少75%
- 额外优化：tmp_table_size、key_buffer_size

### **部署方法1：使用 2G 配置部署**

```bash
cd /opt/petshop/deployment

# 备份原配置
cp my.cnf my.cnf.bak

# 使用 2G 配置
cp my-2g.cnf my.cnf

# 部署
./deploy.sh
```

### **部署方法2：修改 docker-compose.yml**

编辑 `docker-compose.yml` 中的 MySQL 配置卷：

```yaml
mysql:
  # ... 其他配置
  volumes:
    - mysql-data:/var/lib/mysql
    - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    - ./my-2g.cnf:/etc/mysql/conf.d/custom.cnf:ro  # 使用2G配置
  # ... 其他配置
```

然后重新部署：
```bash
docker compose down
docker compose up -d
```

---

## 📊 资源占用对比

### **使用默认配置（4G优化）**
```
总内存: 2048MB
MySQL: ~500MB (偏高)
Spring Boot: ~500MB
Nginx: ~30MB
Docker: ~80MB
系统: ~300MB
────────────────
总计: ~1410MB
剩余: ~638MB ⚠️ 偏低
```

### **使用2G优化配置**
```
总内存: 2048MB
MySQL: ~300MB ✅ 优化后
Spring Boot: ~400MB
Nginx: ~30MB
Docker: ~80MB
系统: ~300MB
────────────────
总计: ~1110MB
剩余: ~938MB ✅ 充足
```

---

## ✅ 性能预估

### **CPU使用率**

| 场景 | CPU占用 | 说明 |
|------|---------|------|
| **空闲时** | <5% | 系统待机 |
| **1-2人使用** | 5-10% | 正常业务 |
| **5人同时使用** | 10-20% | 峰值期 |
| **10人同时使用** | 20-40% | 极端情况 |

**结论**：2核完全够用，CPU占用率很低

### **内存使用率**

| 场景 | 内存占用 | 剩余 | 状态 |
|------|---------|------|------|
| **启动后** | ~1.1GB | ~900MB | ✅ 良好 |
| **5人使用** | ~1.3GB | ~700MB | ✅ 正常 |
| **峰值期** | ~1.5GB | ~500MB | ⚠️ 可用 |

**结论**：优化配置后内存充足

### **数据库性能**

| 操作 | 预计耗时 | 说明 |
|------|---------|------|
| 查询单条记录 | <10ms | 主键查询 |
| 分页查询(10条) | 10-30ms | 带条件筛选 |
| 新增记录 | <20ms | 简单插入 |
| 统计查询 | 50-100ms | GROUP BY等 |

**结论**：数据量小，性能不是问题

---

## ⚠️ 注意事项

### **1. 监控内存使用**

**定期检查（每周）：**
```bash
# 查看内存使用
free -h

# 查看容器资源占用
docker stats

# 查看MySQL内存
docker exec petshop-mysql mysql -u petshop -p -e "SHOW VARIABLES LIKE 'innodb_buffer_pool%';"
```

**内存警戒线：**
- 剩余 < 200MB：⚠️ 警告，考虑优化
- 剩余 < 100MB：🚨 危险，立即升级

### **2. 控制上传文件大小**

**默认配置：**
- 单文件限制：5MB
- 请求限制：10MB

**建议：**
```bash
# 编辑 .env
MAX_FILE_SIZE=2  # 改为2MB
```

### **3. 定期清理日志**

**创建清理脚本：**
```bash
# 清理Docker日志（每周）
cat > /opt/petshop/cleanup-logs.sh << 'EOF'
#!/bin/bash
# 清理Nginx日志
docker exec petshop-frontend sh -c "echo > /var/log/nginx/access.log"
docker exec petshop-frontend sh -c "echo > /var/log/nginx/error.log"

# 清理MySQL慢查询日志
docker exec petshop-mysql sh -c "echo > /var/log/mysql/slow.log"

echo "日志清理完成: $(date)"
EOF

chmod +x /opt/petshop/cleanup-logs.sh

# 添加定时任务（每周日凌晨3点）
crontab -e
# 添加：0 3 * * 0 /opt/petshop/cleanup-logs.sh
```

### **4. 限制并发连接**

**MySQL配置已优化：**
```ini
max_connections=50  # 降低到50
```

**Nginx配置：**
```nginx
# 在 nginx.conf 中添加
worker_processes 1;  # 2核设为1或2
worker_connections 512;  # 降低连接数
```

### **5. 禁用不必要的服务**

**关闭二进制日志（节省空间）：**
```ini
# 在 my-2g.cnf 中注释掉
# log_bin=/var/log/mysql/mysql-bin.log
```

---

## 📈 扩容建议

### **何时需要升级到 2核4G？**

| 指标 | 2G配置 | 4G配置 | 升级建议 |
|------|--------|--------|---------|
| **日订单量** | <100单 | 100-500单 | 超过100单/天 |
| **同时在线** | <10人 | 10-50人 | 超过10人 |
| **数据记录** | <10万条 | 10万-100万 | 超过10万条 |
| **内存剩余** | >300MB | >1GB | 低于300MB |
| **响应时间** | <1秒 | <1秒 | 超过2秒 |

### **何时需要升级到更高配置？**

- **多店连锁**：需要4核8G或更高
- **数据分析**：复杂统计查询
- **图片存储**：大量上传文件（建议使用OSS）

---

## 💰 成本对比

### **阿里云轻量应用服务器**

| 配置 | 年付 | 月付 | 适用场景 |
|------|------|------|---------|
| **2核2G** | 未知 | 约30元 | 开发测试、小规模使用 |
| **2核4G** | 100-150元 | - | **推荐，性价比高** |
| **4核8G** | 300-400元 | - | 多店连锁 |

### **性价比分析**

```
2核2G：月付约30元 → 年付360元
2核4G：年付100-150元

差价：约210-260元/年 = 每天0.6-0.7元

结论：2核4G只贵不到1元/天，但内存翻倍，更稳定！
```

---

## 🎯 最终建议

### **如果你的预算充足（推荐）**

**✅ 选择 2核4G**
- 内存充足，不担心OOM
- 不需要优化配置
- 未来扩展空间大
- 性价比最高

### **如果预算紧张**

**⚠️ 选择 2核2G + 优化配置**
- 使用 `my-2g.cnf` 配置
- 定期监控内存使用
- 控制上传文件大小
- 及时清理日志
- 性能完全够用

### **部署命令**

**2核4G（推荐）：**
```bash
cd /opt/petshop/deployment
./deploy.sh
```

**2核2G（需优化）：**
```bash
cd /opt/petshop/deployment
cp my-2g.cnf my.cnf  # 使用2G优化配置
./deploy.sh
```

---

## 📞 需要帮助？

- **监控教程**：查看 `README.md` 的"监控与日志"章节
- **性能优化**：查看 `README.md` 的"性能优化"章节
- **故障排查**：查看 `deploymentmethod.md` 的"故障排查"章节

---

**结论：2核2G够用，但建议2核4G更稳妥！** 🚀
