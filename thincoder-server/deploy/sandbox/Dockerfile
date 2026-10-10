# deploy/sandbox/Dockerfile — 盒镜像（缺省 tag `thincoder-sandbox:1`——sandbox/RUNNER.md §3；KD-SV-73）
#
# 构建（runner 机——`thincoder-runner image --build --dockerfile <本目录>`）：
#   docker build -t thincoder-sandbox:1 deploy/sandbox
#
# 面（§3 参数表）：非 root（node:24-slim 内置 `node` 用户 = uid/gid 1000——runner 以 `--user 1000:1000` 落形，
# 与卷属主对齐）；工具链 = git/curl（默认单 github/gitee/registry.npmjs.org 拉取与调试刚需；ca-certificates = curl 的
# TLS 信任面——`--no-install-recommends` 下需显式装）；HOME = /workspace/home（runner 注入 env；卷内建）、
# WORKDIR = /workspace（唯一卷挂载点）。
FROM node:24-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends git curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
USER 1000:1000
CMD ["sleep", "infinity"]
