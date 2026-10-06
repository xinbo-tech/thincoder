# Thincoder Server — 容器镜像（壳——ops/OPS.md §5.1）：node:24-slim 基座 + 引导层（deploy/*）。
# 版本身份 = npm 包（`@thincoder/server`——镜像 tag 不承担版本语义）；构建期以上下文包体预装（npm pack ⇒ 前缀——
# 零 registry 依赖，发布前亦可构建验证）；运行期由壳引导按 TC_SERVER_VERSION 收敛（§5.4(d)）。
# 构建（上下文 = 本目录）：docker build -t <registry>/thincoder-server:<tag> .
# 升级/回滚 = 改 TC_SERVER_VERSION + docker compose up -d（重跑壳收敛——§5.4(e)）；重建镜像 = 换 Node 基座/壳时。
FROM node:24-slim

WORKDIR /app

# 前缀 = node 账号自有（运行期收敛/自升可写——§5.1）；PATH 含前缀 bin（入口 exec thincoder-server 依赖）
ENV NPM_CONFIG_PREFIX=/home/node/.npm-global \
    NPM_CONFIG_CACHE=/home/node/.npm-cache \
    PATH=/home/node/.npm-global/bin:$PATH

# 构建期预装：上下文包体（npm pack——files 白名单）⇒ 前缀（本地 tgz——构建零 registry 依赖；离线可构建）
COPY . /tmp/build/
RUN mkdir -p /app/data && chown -R node:node /app /tmp/build /home/node
USER node
RUN cd /tmp/build && npm pack --silent && npm i -g ./thincoder-server-*.tgz --no-audit --no-fund && rm -rf /tmp/build

# 引导层（壳——converge.mjs ∥ docker-entrypoint.sh）
COPY --chown=node:node deploy/ /app/deploy/
RUN chmod +x /app/deploy/docker-entrypoint.sh

EXPOSE 8787
VOLUME /app/data

ENTRYPOINT ["/app/deploy/docker-entrypoint.sh"]
