# agent.md — 运维与开发结论备忘

1. **部署**：生产服务器永远不跑构建——本地打包镜像传上去（save/load），约 2 分钟发布，服务器零压力。
2. **依赖源**：npm 和 Maven 用阿里源（Maven 已在用）；Docker 基础镜像的阿里加速器已失效，用 DaoCloud 源（`docker.m.daocloud.io`），配一次即可。
3. **发布纪律**：bug 修复最小 diff 先上线止血，重构优化拆开另发，不捆在一次发布里。
