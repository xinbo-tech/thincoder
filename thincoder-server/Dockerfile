# Thincoder Server — 容器镜像（ops/OPS.md §5.1）：node:24-slim ∥ 零依赖 ⇒ 无 install 步 ∥ EXPOSE 8787 ∥
# VOLUME /app/data ∥ ENTRYPOINT = node bin/thincoder-server.mjs --config /app/config.json。
# 构建（上下文 = 本目录）：docker build -t <registry>/thincoder-server:<tag> .
FROM node:24-slim

WORKDIR /app

# 零第三方运行期依赖 ⇒ 无安装步：直接拷服务树
# （.dockerignore 排除 config.json ∥ data/ ∥ docs/ ∥ .git——机本地配置与运行期数据不进镜像）
COPY . /app

EXPOSE 8787
VOLUME /app/data

# 配置档 = /app/config.json（挂卷——见 docker-compose.yml）；库 = /app/data/gateway.db（卷内，备份 = 卷内文件）
ENTRYPOINT ["node", "bin/thincoder-server.mjs", "--config", "/app/config.json"]
