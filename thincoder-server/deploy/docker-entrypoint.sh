#!/bin/sh
# docker-entrypoint.sh — 容器入口（壳——ops/OPS.md §5.1）：① 收敛（按 TC_SERVER_VERSION × 已装——converge.mjs；
# 拒启 ⇒ 非零退出 ⇒ restart 循环使其可见）⇒ ② exec 服务（PATH = 前缀 bin——Dockerfile ENV；配置 = 挂载的
# /app/config.json）。重起重跑本档（compose restart 策略——§5.2）。
set -eu
node /app/deploy/converge.mjs || exit 1
exec thincoder-server --config /app/config.json
