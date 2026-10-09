# 2026-10-09 · server-test-env-ecs
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-09 · 来源 = 用户 2026-10-09 10:46「我希望给thincoder-server准备一个测试环境，我可以提供一台ubuntu ecs」+ 10:56「ip地址：10.0.0.5 …… 你上去自己查探，我给你单独建了一个用户：thincoder …… 你自己上去做必要的配置，弄好以后告诉我」——上机实机部署轮。
> 台账 = #1112（server · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-09
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**§1 讨论（主 agent · 2026-10-09）**

**来源与授权（用户逐字）**：10:46「我希望给thincoder-server准备一个测试环境，我可以提供一台ubuntu ecs，应该怎么做？」；10:56「ip地址：10.0.0.5 我可以给你创建用户，配置连接，你上去自己查探，我给你单独建了一个用户：thincoder，密码是:ThinCoder，你自己上去做必要的配置，弄好以后告诉我，我把密码改了。」⇒ 授权 = 上机侦察 + 做必要的配置（口令值不入档——本档不载凭据）。

**范围**：① ECS 实机部署 thincoder-server 测试环境（Docker compose 路——设计 = `docs/server/design/ops/OPS.md` §5）；② 途中暴露的产品缺陷修复（轻通道 · 缺陷类——见「笔」条）。

**路线裁定（父侧 · 授权内）**：**Docker compose 路**——理由：部署资产最成熟（Dockerfile ∥ compose ∥ converge ∥ healthcheck 全在）· 自更新/回滚链路可测（`TC_SERVER_VERSION`）· 与机上既有服务隔离（haproxy 占 :25 ∥ :8080，零冲突面）；npm 裸机路后置（机上 Node 22 < 24 且包未发布）。

**上机侦察读数（2026-10-09 11:0x 实读）**：`ha-proxy` · Ubuntu 22.04.5 LTS · x86_64 · 2C · 1.6Gi 内存（可用 1.0Gi）· / 余 32G；既有服务 = haproxy（:25 ∥ :8080——避让）+ sshd(:22)；ufw 关；gitee 可达 ∥ github 与 Docker Hub 不通（镜像走 mirror 解）；apt 走阿里云镜像（docker.io 29.1.3 + docker-compose-v2 2.40.3 在源）。

**已落步骤（读数）**：SSH 密钥登录建成（专用密钥 · 口令通路仅用于首连）→ docker + compose 装就（29.1.3 / 2.40.3）→ daemon.json 配三镜像源（1panel.live ∥ daocloud ∥ 1ms.run）→ `node:24-slim` 拉取成功 → 仓克隆（gitee · `~/thincoder` · HEAD = 0233be7）→ 镜像 `thincoder-server:0.1.0` 构建成功 → 部署目录 `~/thincoder-server-deploy/`（config.json ∥ data ∥ .env[口令现生成·不入档] ∥ docker-compose.yml）→ `docker compose up -d`。

**暴露（实读实证）**：容器起即 `Restarting (0)`——日志仅 converge 行、服务零输出。根因实证：`bin/thincoder-server.mjs:176` 入口判据 `import.meta.url === pathToFileURL(process.argv[1]).href` 未解析符号链接；npm 全局装 = bin 符号链接形 ⇒ 判据恒假 ⇒ 静默零动作退出 0（readlink 实证 + realpath 直跑对照 = 程序真跑并报出真实错误「配置缺 embedding 段（baseURL ∥ model——必填）」⇐ 部署 config 已随修补段）。

**§1 进展（主 agent · 2026-10-09 · 部署轮实测）**

- **部署落定**：镜像 `thincoder-server:0.1.0`（机上克隆构建）；部署目录 `~/thincoder-server-deploy/`（config.json〔补 embedding 段后过校验——fail-closed 报错实证在先〕∥ data ∥ .env〔admin 口令远端现生成·不入档〕∥ compose）；容器 **`Up (healthy)`**（healthcheck 过）；日志 = `converge ✓` → `bootstrap_admin_created` → `providers_imported(1)` → **ready**（`routes:33 · version 0.1.0`）；`/healthz` 机上私网自查 = `{"status":"ok","version":"0.1.0","db":"ok"}`（200）。
- **缺陷处置（轻通道受门阻——转记）**：bin 入口 guard 缺陷的**仓内直改被产品码写门机械拒**（判据 ≠ 门旁路，门优先——`thincoder-server/bin/thincoder-server.mjs` 判产品面）⇒ **仓零触**（复读在证：:12/:176 原样）；机上绕行 = compose 层 entrypoint 覆盖（不动镜像 ∥ 不动仓；含注释 + 移除路径）；仓内正式修复 **待用户裁**（正式链：设计 → 评审 → 批 → eng-coder）。
- **访问面**：本机（10.0.16.9/26）→ 10.0.0.5 实测 = 22 ∥ 25 ∥ 8080 通 ∥ **8787 拒**（另 8 口探针 80/443/3000/8000/8081/8443/9090/8888 全拒）；机上全量读 = iptables/nft 零过滤（INPUT ACCEPT）· DNAT 正常 · 自查 200 ⇒ 封点 = **阿里云安全组**（用户当日确认「是阿里云有安全组配置」并提供改口）⇒ 待开 **TCP 8787**（内网来源）；探针监听与临档已回收（机上复读仅 8787 在听）。
- **凭据面（不入档）**：SSH 专用密钥通道建成（`authorized_keys` 注释 `thincoder-ecs-setup`——可撤）；admin 初始口令 = 远端随机生成并与用户对口（登录后改）。

**§1 收验（主 agent · 2026-10-09 · 安全组开后端到端）**

用户配好阿里云安全组（TCP 8787）⇒ 本机（10.0.16.9）复核：**`tcp 8787 ✓`** · `/healthz` = `{"status":"ok","version":"0.1.0","uptime":455,"db":"ok"}` · 根页 200；**真浏览器走查**（登录面 + 控制台）：登录页 =「Thincoder Server 控制台 · 登录」（用户名/密码/登录 + 中文 ∥ English）→ admin 登录成功 → `#/admin/overview`：导航全在（我的 = key 与签发 ∥ 我的用量 ∥ 账户设置；管理 = 总览 ∥ 成员 ∥ Provider ∥ 服务模型 ∥ 全队用量 ∥ 审计 ∥ 系统）· 总览读数 = 今日请求 0 ∥ 今日 token 0 ∥ 成员数 1 ∥ **服务健康 = 服务正常** ∥ 更新状态 = 未发现新版本（包未发布——预期静默）· 页脚 = 服务正常 · v0.1.0 · 退出登录。截图存证（浏览器走查两帧 · 2026-10-09）。

**交付态**：ECS 测试环境 = 可用（`http://10.0.0.5:8787`）；余项 = ① bin 入口 guard 缺陷的仓内正式修复（待用户裁——正式链）；② 镜像 entrypoint 覆盖件随 ① 落地后移除；③ provider 真 key ∥ embedding 真地址 = 用户供给面；④ HTTPS 前置（80/443 安全组口 + nginx）= 按需另报。

**§1 数据安全面收验（主 agent · 2026-10-09 · 用户问「更新代码会丢已配置数据吗」）**

- **结构（实读）**：数据 = 宿主三件（`~/thincoder-server-deploy/data/gateway.db`〔WAL 三档〕∥ `config.json` ∥ `.env`——全部 bind mount）；代码侧 = 镜像 ∥ 容器可写层。更新 = 只换代码侧。
- **活证 A/B（真机）**：`docker compose up -d --force-recreate`（= 换镜像后的同款动作）→ 重建后 admin `POST /api/login` = **200**（`{"ok":true,"member":{"id":1,"role":"admin"}}`）；新起日志 = `providers_config_ignored count:1`（**库已有 provider——config.json 段被忽略，库为准**）· 无重复 `bootstrap_admin_created` · ready ✓ ⇒ 库内配置（provider ∥ 成员 ∥ 密钥 ∥ 额度 ∥ 用量 ∥ 审计）随容器置换全存活。
- **迁移面（实读 `src/store/db.mjs`）**：结构版本 = `PRAGMA user_version`，迁移链 v1–v8 逐段升（每段单事务；失败整段回滚 + 拒启——fail-closed）⇒ 前向升级安全；回滚（旧码配已迁库）有 schema 差异面 ⇒ **回滚前先备份**。
- **备份链真机验证**：`docker compose exec -T server node /app/deploy/backup.mjs --config /app/config.json --out /app/data/backups` ⇒ 产出 `data/backups/gateway-20261009-031546.db` ✓（恢复口径 = README §12：停容器 → 换库档 → 清 `-wal`/`-shm` → 起）。
- 注记：`data/` 宿主属主 = uid 1000（容器内 node 账号）；宿主 `thincoder` 直写 `data/` 需 sudo（走 docker 命令无碍）。

**§1 备份定时器（主 agent · 2026-10-09 · 机上落地并验证）**：按 README §9 样例形适配容器路——`/etc/systemd/system/thincoder-server-backup.{service,timer}`（`User=thincoder` · `docker compose exec -T` 容器内跑 `deploy/backup.mjs` + `find -mtime +30` 轮转；`OnCalendar=daily` · `Persistent=true` 补跑）。装后手动触发验证 = **exit 0/SUCCESS** · 产物 `data/backups/gateway-20261009-032021.db` · `list-timers` NEXT = 2026-10-10 00:00 CST ✓；`data/backups` chmod 700（快照含密钥/口令散列——非属主 `ls` 已拒，容器写入不受影响）。保留默认 30 天（service 内 `-mtime +30` 一处可调）。

## §2 批次任务与设计（eng-designer）
**状态行**：（eng-designer 写入时更新）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>
## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）

### 环境交付终态 + 部署三形式真机读数（主 agent · 2026-10-09 17:5x）

- **三形式（同一箱实跑）**：① `docker build -t thincoder-server:0.1.0` ✓（本日随 console-config 批重建）；② `docker compose` 起停 ✓（`stop` → `start` ∥ `up -d` 重建 ⇒ `healthz=200`）；③ **裸机 npm 路 ✓**（`npm pack` → 临时前缀 `npm i -g` → 垫片 `~/.npm-global/bin/thincoder-server --config … --port 8788` ⇒ **healthz=200**（**符号链接垫片形实跑——bin guard 修复面真机重现 ✓**）→ PID 击杀后端口零留）。**systemd 面**：单元 `systemd-analyze verify` 语法通过（唯一抱怨 = `/opt/...` 目标未装——npm 路安装后即消）；`enable --now`/`is-active` = 本箱 `thincoder` 无免密 sudo ⇒ **未跑**（留根窗 ∥ 另机补——#959 在册）。
- **与 console-config 批同拍终态**：HEAD `d0d4d9a2` ∥ 镜像重建 ∥ `./config` 目录挂载迁移（`db=/app/data/gateway.db`）∥ 容器 healthy；浏览器实走（admin 会话）全通（以 `2026-10-09-server-console-config.md` §6 读数为准）。
- **箱上遗留物（无 rm——后续处置窗口在册）**：`~/tc-npm-sd/`（tgz ∥ 临时前缀 ∥ run 日志）∥ `~/thincoder-server-deploy/{config.json.bak-20261009, .env.bak-20261009}` ∥ `~/thincoder-server-deploy/data/backups/`（备份链产物）。
- **账目**：`#1112` 随本收口；AC-8 三件读数回填 `#959`（systemd `enable --now` = 环境窗待补）。
