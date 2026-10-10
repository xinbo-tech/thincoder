# ECS 测试环境运维手册（server 机 ha-proxy · 10.0.0.5 ∥ runner 机 sh-mgr · 10.0.0.6）

> **一句话**：我们自己的**测试箱**（server 测试环境 + 桌面 Linux 构建机 + 沙盒 runner）——怎么上、怎么更新、怎么回滚、哪里有坑。
> 建档 2026-10-10（用户令：「每次这么盲人摸象摸一遍不是个办法」）；内容来源 = 实跑（2026-10-09 首部署轮 + 2026-10-10 登录面更新轮 + 沙盒 runner 装机轮——本文命令逐条实跑过，读数在案）。
> 与产品文档的分工：产品侧部署设计 = `server/design/ops/OPS.md` §5 ∥ `thincoder-server/README.md` §3（**客户**怎么部署）；本文 = **我们自己的测试箱**（内部机器 + 机器特定事实）。
> 凭据纪律：本档**不载任何口令 / 密钥值**；访问 = 专用密钥文件（下节）。

## 1. 访问面

| 项 | 值 |
|---|---|
| 主机 | `10.0.0.5`（内网；主机名 `ha-proxy`；阿里云 ECS · Ubuntu） |
| 账号 | `thincoder`（用户单开给 agent 的账号——部署专用；**无免密 sudo**） |
| 密钥 | 本机 `$env:USERPROFILE\.ssh\thincoder_ecs`——**必须 `ssh -i` 显式带上**（默认钥匙链里没有它；漏掉 `-i` ⇒ `publickey,password` 被拒） |
| 端口 | 8787（server 测试口；阿里云安全组已开 TCP 8787，来源 = 内网） |
| 控制台 | `http://10.0.0.5:8787/`（账号由用户管理——**本档不载账号名与口令**） |
| 连接 | `ssh -i $env:USERPROFILE\.ssh\thincoder_ecs thincoder@10.0.0.5` |

## 2. 机器上的布局（实读 2026-10-10）

| 路径 | 内容 | 属主 |
|---|---|---|
| `~/thincoder` | 仓克隆（remote = `origin` = gitee） | thincoder |
| `~/thincoder-server-deploy/` | 部署目录：`docker-compose.yml` ∥ `.env` ∥ `config/config.json` ∥ `data/gateway.db` | 目录 = thincoder；`config/` ∥ `data/` = ecs-user |
| 镜像 | `thincoder-server:0.1.0`（**箱上本机构建、无 registry**——compose 只引用，不构建） | — |
| 容器 | `thincoder-server-deploy-server-1`（`restart: unless-stopped`；`8787:8787`；挂载 config ∥ data） | — |
| 旁路进程 | 内网嵌入引擎（ollama，`10.0.0.5:11434`，模型 `bge-m3`）——**已停**（2026-10-10 用户令）；server 配置里的 `embedding.baseURL` 仍指向它 | — |
| 副用 | **桌面 Linux 构建机也在这台**（代号 ha-proxy）——别在大构建并行时做重装 | — |
| **箱上运维 CLI**（直开库，不经 HTTP） | 镜内路径实读（2026-10-10）：`docker exec thincoder-server-deploy-server-1 node /home/node/.npm-global/lib/node_modules/@thincoder/server/src/ops/cli.mjs --config /app/config/config.json <命令>`——命令 = `member list` ∥ `member add` ∥ `member quota` ∥ `member passwd` ∥ `key list` ∥ `key issue`（全表见 `thincoder-server/README.md` §7） | — |

## 3. 更新部署（一条链——逐条实跑过）

顺序 = **先推、后拉、再重建**。本机（Windows PowerShell）：

```
cd d:\teamcode\thincoder
git push origin main ; git push github main     # 箱子的 remote = gitee（origin）
```

上箱（**分步跑**——每条一行；远端命令**平铺单层**，见 §6 坑 2）：

```
$k = "$env:USERPROFILE\.ssh\thincoder_ecs"          # 本机 PowerShell：密钥路径（一次设定）
ssh -i $k thincoder@10.0.0.5 "cd ~/thincoder && git pull --ff-only"
ssh -i $k thincoder@10.0.0.5 "docker tag thincoder-server:0.1.0 thincoder-server:pre-<日期>"
ssh -i $k thincoder@10.0.0.5 "docker build -t thincoder-server:0.1.0 ~/thincoder/thincoder-server"
ssh -i $k thincoder@10.0.0.5 "cd ~/thincoder-server-deploy && docker compose up -d --force-recreate && sleep 6 && docker ps"
```

要点：

1. **推在前**——箱子从 gitee 拉；本地没推 = 箱上没有。
2. **旧镜像先打标**（`thincoder-server:pre-<日期>`）= 回滚锚（见 §5）。
3. `docker build` 上下文 = `~/thincoder/thincoder-server`（compose **无 build 段**——镜像得手动重建）。
4. `--force-recreate` 必有：tag 同名，靠它确保容器用新镜像重起（停机约数秒）。
5. 数据库迁移 = **容器启动时自动跑**（无独立迁移步）。
6. 配置 / 数据 = 卷挂载（`./config` ∥ `./data`），重建容器不动它们。

## 4. 更新后自检（四条探针——期望读数口径）

```
$k = "$env:USERPROFILE\.ssh\thincoder_ecs"
ssh -i $k thincoder@10.0.0.5 "curl -s -m 5 -o /dev/null -w 'healthz=%{http_code}\n' http://127.0.0.1:8787/healthz"
ssh -i $k thincoder@10.0.0.5 "curl -s -m 5 -o /dev/null -w 'client/me=%{http_code}\n' http://127.0.0.1:8787/api/client/me"
ssh -i $k thincoder@10.0.0.5 "curl -s -m 5 -X POST -H 'Content-Type: application/json' -d '{}' -o /dev/null -w 'client/login=%{http_code}\n' http://127.0.0.1:8787/api/client/login"
```

| 探针 | 期望 | 含义 |
|---|---|---|
| `GET /healthz` | **200** | 服务活着（体 = `{"status":"ok","db":"ok"}`） |
| `GET /api/client/me`（无 token） | **401** | 客户面在册（缺凭据被拒） |
| `POST /api/client/login`（空体） | **400** | 客户登录端点在册（空体被拒） |
| 任一 **404** | ✗ | 该路由没进镜像（代码没推 ∥ 没重建） |

另从**本机**再打一遍（把 `127.0.0.1` 换成 `10.0.0.5`）= 网络面自检（安全组 ∥ 内网可达）。

## 5. 回滚

```
ssh -i $env:USERPROFILE\.ssh\thincoder_ecs thincoder@10.0.0.5 "cd ~/thincoder-server-deploy; docker tag thincoder-server:pre-<日期> thincoder-server:0.1.0; docker compose up -d --force-recreate"
```

回滚把**镜像**退回去；数据库如需回退 = 走 §6 坑 3 的备份面（尚无成型径——按需补）。

## 6. 坑（都踩过——读数在案）

1. **`-i` 必须显式**：漏了 ⇒ `publickey,password` 被拒（本机默认钥匙里没有专用钥匙）。
2. **PowerShell 里别用 `\$(...)` 嵌套命令替换**：会被 PS 抢先解析 ⇒ 远端命令碎裂（2026-10-10 实测：两处 `docker exec $(...)` 失败）。远端命令一律平铺、单层；需要内侧引号时 = **PS 用单引号包整条 ssh 命令**（内侧引号原样透传——2026-10-10 实测可行姿势）。
3. **`deploy/backup.mjs` 以 `thincoder` 跑会失败**（`EACCES: mkdir '.../config/backups'`——`config/` 属 `ecs-user`、本箱无免密 sudo）⇒ 更新前的兜底 = **旧镜像打标**；真备份 = 待补（用 `ecs-user` 侧能力或容器内路径）。
   - 同族：箱上直接跑仓内运维 CLI 会挂（配置里 `db` = 容器内绝对路径 `/app/data`——宿主机跑必 `EACCES`）⇒ 运维命令一律**在容器内跑**（§2 表的镜内路径）。
4. **容器名固定** = `thincoder-server-deploy-server-1`（compose 项目名 + 服务名派生）。
5. **`config/` 与 `data/` 属 `ecs-user`**（部署目录本身属 `thincoder`）——直接 `cp` 这两处的文件可能被拒。
6. **别在大负载时硬上**：这台同时是桌面 Linux 构建机；历史上出现过旁路进程撑满 + sshd 饿死（须重启恢复）——重活并行时先 `uptime` ∥ `free -m` 看一眼。
7. **盒镜像构建源慢**（runner 机）：容器内打 `deb.debian.org` = **19 kB/s**（9.4MB 用 8min13s）⇒ 直建 20min+。绕行 = **构建期换源副本**（仅改副本、产品 Dockerfile 不动）——台账 #1250。
8. **Docker Hub 不可达**（runner 机实测 `registry-1.docker.io:443` i/o timeout）⇒ `runner image` 的 pull 路径必败、build 路径需本地有底镜像；跨机取像 = `docker save │ gzip` ⇒ scp ⇒ `docker load`（本次 111MB tgz 走 .5⇒本机⇒.6）。

## 7. runner 机（sh-mgr · 10.0.0.6——沙盒执行面）

| 项 | 值 |
|---|---|
| 连接 | `ssh -i $env:USERPROFILE\.ssh\thincoder_ecs thincoder@10.0.0.6`（与 .5 同一把钥匙） |
| 机器 | Ubuntu 22.04.5 ∥ cgroup v2 ✓ ∥ 无 IPv6 缺省路由 ✓ ∥ 盘 40G（余 ~17G）；`thincoder` 在 `sudo` 组（**需密码**）与 `docker` 组 |
| 已装（2026-10-10） | Docker 29.1.3（apt `docker.io`）∥ quota 4.06 ∥ Node v24.21.0（nodesource）∥ nft 1.0.2（自带） |
| 角色 | 沙盒 **runner #1**（server = `http://10.0.0.5:8787`）；用户明言事后更换此机密码 ⇒ 访问按**公钥**面 |
| 服务 | `thincoder-runner.service`（unit 源 = repo `deploy/thincoder-runner.service`；`User=root`）；配置 `/opt/thincoder-runner/runner.json`（0600） |
| 盒镜像 | `thincoder-sandbox:1`——**本机拉不动 Docker Hub**（实测 i/o timeout）⇒ 在 .5 构建后搬运（坑 7/8） |
| 探针 | `sudo thincoder-runner probe --workspace <id> --config /opt/thincoder-runner/runner.json`（**以 root**）——P1–P14 |

**装机链（逐条实跑过）**——辅助命令里 `sudo` 需先 `echo <口令> | sudo -S -v` 刷票：

```
git clone --depth 1 https://gitee.com/shanghai-xinbo/thincoder ~/thincoder-clone
cd ~/thincoder-clone/thincoder-server && npm pack --silent
sudo mkdir -p /opt/thincoder-runner/.npm-global
sudo env NPM_CONFIG_PREFIX=/opt/thincoder-runner/.npm-global npm i -g ./thincoder-server-0.1.0.tgz
sudo /opt/thincoder-runner/.npm-global/bin/thincoder-runner join --server http://10.0.0.5:8787 --join-token <t> --config /opt/thincoder-runner/runner.json
sudo cp /home/thincoder/thincoder-clone/thincoder-server/deploy/thincoder-runner.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now thincoder-runner
```

- **join-token 从哪来**：控制台管理员会话铸——`POST /api/admin/sandbox/runners/join-token`（页面面未部署时走 API 直调）。
- **doctor 以 root 跑**：非 root ⇒ #3 FAIL（nft 需 CAP_NET_ADMIN）——「拒跑」是正确语义，不是装坏。
- **收工口径（2026-10-10 用户逐字）**：「能联通就行以后有的是时间发现问题解决问题」——联通 = runner #1 healthy ∥ 工作区 `acc-1010` 放置成功 ∥ 盒 `tc-ws-1` 起 ✓。

## 8. 相关档

- 测试环境首部署批（来源 ∥ 授权 ∥ 安全组开放过程）= `batches/2026-10-09-server-test-env-ecs.md` §1。
- 产品侧部署设计 = `server/design/ops/OPS.md` §5 ∥ `thincoder-server/README.md` §3。
- 三端发布流程 = `RELEASE.md`。
