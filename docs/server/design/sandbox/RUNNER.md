# Thincoder Server · 沙盒执行面（sandbox/RUNNER）

> 板块 = server ∥ 本域 = sandbox；本档 = 域档·**执行面**（runner——跑盒的机器与其守护进程）；控制面 = 同域 `SANDBOX.md`。
> 需求单源 = `docs/server/requirements/PROJECT.md` §5 沙盒块；控制面协议/规则单源/放置/牲口语义 = `SANDBOX.md`（本档不复制）；盒参数与本地强制的**机制全文在本档**。
> 端点表（runner 通道）= `gateway/API.md` §2.6（单源）；表结构 = `store/STORE.md` §2 v11 段。
> 建档：2026-10-10（批 `docs/batches/2026-10-10-server-exec-sandbox.md` 设计轮 · eng-designer · 台账 #1224）。

## 1. 定位

- runner = 一台机器上的守护进程 + 本机容器运行时：join 注册 ∥ 长轮询领指令 ∥ 跑盒 ∥ **本地强制**（网络闸 ∥ 出站闸代理 ∥ 资源 ∥ TTL）∥ 执行命令 ∥ WIP 快照上送。
- **同包第二入口**：`thincoder-runner`（bin——与 `thincoder-server` 同 npm 包 `@thincoder/server`；版本锁步——KD-SV-64）。
- **牲口语义**（控制面 §5）：本机可失（重装/替换）——持久状态 = ① 令牌（config 0600）② 卷（缓存——可从 git + WIP 快照重建）。
- runner **不触控制面其余面**（令牌只对 `/api/runner/*` 有效——最小权限）。

## 2. 守护进程与通道客户端

- **命令面**（`bin/thincoder-runner.mjs`（拟新增））：`join`（换取 runner 令牌——写 config）∥ `run`（守护）∥ `doctor`（§7 自检）∥ `probe`（探针——§10）∥ `image`（盒镜像构建/检查）。
- **主循环**：register/heartbeat（15s）→ poll（长轮询 ≤25s，携 rulesRev）→ 执行指令 → report；断连退避 1s→30s（指数 + 抖动）。
- **本地状态**（`<stateDir>`）：
  - 盒登记 = 容器 label 快照（`tc.sandbox=1` ∥ `tc.ws=<id>` ∥ `tc.runner=<id>`）——启动时按 label **采纳**现有容器（盒不重启——服务器重启/runner 重启均不断盒；server 启动与运行零依赖沙盒/runner——`SANDBOX.md` §1）；
  - 规则缓存 = 最近一次全量规则 + rulesRev；
  - 待批表 = 挂起中的连接（worker 请求 + 计时器）。
- **指令执行表**：按 `kind` 分派——`sandbox.create/start/stop/destroy/exec/checkpoint/restore`；**未知 kind ⇒ 报 unsupported**（向前兼容——CI 批加 kind 不破旧 runner）。
- **离线行为**：server 不可达 ⇒ 盒照跑（沿最后规则）；待批一律超时拒（不静默放行）；指令与上报缓冲（有界——超界丢最旧 + 日志）；server 复通 ⇒ 重连重放。

## 3. 容器运行面（盒——机制全文）

**创建参数集**（KD-SV-73——逐项对应需求块「每工作区一盒 + `--read-only` + 唯一可写挂载」）：

| 面 | 取值 | 备注 |
|---|---|---|
| 镜像 | 设置项（缺省 `thincoder-sandbox:1`） | `deploy/sandbox/Dockerfile`（拟新增）；缺 ⇒ 指令期构建/pull |
| 根文件系统 | `--read-only` | 写 `/` 拒（探针 P6） |
| 持久可写 | `--mount type=bind,src=<workspaceRoot>/<ws-id>,dst=/workspace` | **唯一卷**（卷 = 工作区仓 + `.home`） |
| 临时可写 | `--tmpfs /tmp:rw,size=<设置项>` | **唯一例外**（工具链刚需——披露 D1）；内存背书、非持久、封顶 |
| 用户 | 镜像内非 root 用户（uid 对齐卷属主） | 无 root 面 |
| 权限 | `--cap-drop=ALL` ∥ `--security-opt no-new-privileges` | 无提权面 |
| 资源 | `--cpus` ∥ `--memory` + `--memory-swap` 同值 ∥ `--pids-limit` | 探针 P5（fork 炸弹） |
| 网络 | **每工作区一个专用 bridge 网络**（`tc-ws-<id>`——独立网段） | 跨工作区不可达（探针 P9）；无 docker socket；不特权 |
| env | `HOME=/workspace/home` ∥ `OPENAI_BASE_URL=http://<server>:<port>/v1` ∥ `OPENAI_API_KEY=<工作区 key>` ∥ `HTTP(S)_PROXY=http://<runner 桥地址>:<proxyPort>` | 工作区 key = 控制面下发（`SANDBOX.md` §7——轮换 = 拆容器重建注入新值）；**零服务器密钥**（探针 P8） |
| label | `tc.sandbox=1` ∥ `tc.ws=<id>` ∥ `tc.runner=<id>` | 采纳/排空/自检判据 |

- **取值来源**：资源/TTL 相关旗值 = create 指令 payload（控制面已解析：全局默认 ⇒ 逐键叠加工作区覆写——`SANDBOX.md` §2）；runner 侧零回落逻辑。
- **生命周期**：create（幂等——已存在则采纳）⇒ start ⇒ stop（容器停；**卷留**）⇒ destroy（删容器 + 删网络；**卷删 = 仅控制面显式销毁指令**——三层保护第一层）。
- **TTL 双计时**（sweeper 30s 周期——需求块「资源上限 + 墙钟 TTL；空闲超时即拆」）：
  - **空闲超时**（缺省 30 分钟）：无 exec 任务且无代理流量的持续时长 ⇒ 停盒（拆前 WIP 快照——§6）；
  - **墙钟 TTL**（缺省 24h——自盒创建）：到点停盒（下次使用重建）。
- **exec**（指令面）：容器内非 root 执行；超时上限（缺省 10 分钟）；输出截断上限（缺省 1 MiB/流）；退出码 + 截断标记上报。

## 4. 出站强制（网络层 + 代理层——两闸次序的落点）

### 4.1 网络层（CIDR 规则）

- **每工作区桥链**（`netfilter.mjs`（拟新增）——nft 优先 ∥ iptables 备；探测序 + 全量重算幂等——KD-SV-76）：
  - FORWARD（盒桥 → 外）：默认 drop；放行 = ① 回包 established/related ② dst = **出站闸代理**（runner 桥地址:proxyPort）③ dst ∈ **CIDR allow 集**（含内置项 = server 网关 ip:port——模型调用生命线）。
  - INPUT（盒 → runner 宿主面）：**仅放行 → proxyPort**；其余拒（宿主服务面不可达——探针 P2）。
- **恒拒项**（已裁 U2——规则单源 = `SANDBOX.md` §10）：`127.0.0.0/8` ∥ `169.254.0.0/16` 恒拒（内置——非行）；RFC1918 ∥ 服务器/runner 网段 = 种子 deny 行（显式 allow 可开——内网后端诉求）；**显式 deny 恒先于 allow（种子 deny ≺ 显式 allow——相对序；`SANDBOX.md` §4）**。
- **规则来源**：全量来自控制面（`sandbox_rules` + 内置项）；rulesRev 变化 ⇒ 重算链（**不重建盒**——需求块「增删即生效」）。
- **自检**：`nft list ruleset` 可达 ∥ 链计数在场；探针 P2/P3/P11 验证。

### 4.2 代理层（域名规则——「出站闸代理」）

- **形** = node std（`node:http` + `node:net`）自持代理：CONNECT 隧道（HTTPS）+ 绝对 URI 转发（HTTP）；监听 proxyPort（runner 配置）。
- **准入**：**源 IP 白名单**——只接受本机登记的盒网段（IP → workspace 映射）；其余拒（不做开放代理）。
- **求值（盒请求 → 裁定）**：
  1. 取目标域名（CONNECT host ∥ HTTP Host）——**精确 + 单层左通配**匹配（显式 deny 恒先；通配仅应用层）；
  2. 命中 allow ⇒ **解析**（`node:dns` 全地址）⇒ **每个解析 IP 过 CIDR 闸**（禁单/deny 命中 ⇒ 拒——「白名单域名 + 内网解析」防绕过）⇒ 全过 ⇒ **以已校验 IP 建连（PIN——不再按域名重解析；防校验-连接间解析差）**，TLS 面 = SNI 携原域名 ∥ HTTP 面 = Host 携原域名（**不 MITM**——TLS 端到端；无证书面）；
  3. 未命中 ⇒ **待批挂起**（登记 + 上报 server；缺省 60s；裁定放行/拒——`SANDBOX.md` §6）。
- 直连 IP 目标不经代理（网络层管——4.1 ③）；域名路径的探针 = P4/P12。
- **与「上游出口代理」区分**（KD-SV-55——`thincoder-server/src/gateway/proxy.mjs`（已落盘 267 行））：那是 server 向上游的**出站客户端**；本档是 runner 上面向盒的**入站闸代理**——命名不复用。

## 5. 资源与磁盘配额

- 内存/CPU/pids = 容器旗（§3）；`memory-swap` 同值（禁 swap 溢出）。
- **磁盘配额**（KD-SV-74——探测定序）：
  - ① **文件系统项目配额**（xfs pquota ∥ ext4 prjquota——`workspaceRoot` 所在卷）：每工作区 project id + 限额（设置项 `diskMb`）；
  - ② **loopback 镜像**（备选）：`losetup` + ext4 文件卷（尺寸 = 限额；消耗 loop 设备——机队需余量）；
  - **无一可用 ⇒ runner 拒跑**（doctor 核心项失败——沿「无退路」）；
- **超限** = 写入 ENOSPC（应用可见；宿主盘由配额兜底——探针 P7）；destroy 释放（配额删除 ∥ loop 卸载删文件）；stop 不动。

## 6. WIP 检查点（未提交保护——控制面 §5 三层之第二层）

- **打包**：工作区为 git 仓且 `git status --porcelain` 非空 ⇒ `git stash create`（**不动工作区**）+ 未跟踪清单（`git ls-files --others --exclude-standard` 口径）打包 ⇒ `POST /api/runner/checkpoint`（大小上限缺省 200 MiB——超 ⇒ 跳过 + 上报）；非 git 工作区 ⇒ 跳过 + 上报「无保护」。
  - **上送口径**（与 `gateway/API.md` §2.6 同拍）= `application/octet-stream` 流式体 ∥ 路由级上限 200 MiB（与本地跳过阈值同值）∥ 服务端流式落盘。
- **触发**：周期（缺省 15 分钟——dirty 才发）∥ 拆盒前 ∥ 排空前。
- **恢复**：restore 指令 ⇒ `GET /api/runner/checkpoint/:id` ⇒ 套用到新盒（stash apply + 未跟踪还原）。

## 7. 宿主前置与自检（doctor）

`thincoder-runner doctor` 逐项 PASS/FAIL；**核心项任一 FAIL ⇒ 拒跑**（进程退出 + 原因——控制台明示）；读数随心跳上报（`runtime_json`——控制台可见）：

| # | 检查项 | 判据 | 级别 |
|---|---|---|---|
| 1 | OS | Linux + cgroup v2 在场 | 核心 |
| 2 | 容器运行时 | docker ≥ 20 ∥ podman ≥ 4（探测序按已裁 U1）；`version` 可执行 | 核心 |
| 3 | 网络工具 | nft（优先）∥ iptables 备；FORWARD/INPUT 可写 | 核心 |
| 4 | 磁盘配额机制 | §5 ① 或 ② 可用 | 核心 |
| 5 | IPv6 | 盒网络无 IPv6 路由（防旁路——v1 只 IPv4） | 核心 |
| 6 | 磁盘余量 | `workspaceRoot` 余量 ≥ 建议值 | 非核心（警示） |
| 7 | 时间同步 | 心跳/超时面 | 非核心（警示） |
| 8 | 盒镜像 | `thincoder-sandbox:1` 在场（缺 ⇒ 指令期构建/pull） | 非核心 |

## 8. 部署形态（runner 机）

- 安装 = npm 全局（同包）⇒ `thincoder-runner join --server <url> --join-token <t>` ⇒ `deploy/thincoder-runner.service`（拟新增——systemd unit）⇒ 起服。
- 网络面：runner → server = 出向 HTTP(S)（通道全为 runner 拨出——server 无需入向）；盒流量 = runner 本机桥内 + 出站经闸。
- 机队运维：**加机**（join）∥ **排空**（控制台一键——控制面 §5）∥ **退役**（删机——要求工作区已重建或确认丢弃）。

## 9. 文件与行数预算（执行面）

| 档 | 行数（设计估） | 职责 |
|---|---|---|
| `thincoder-server/src/sandbox/runner/daemon.mjs`（拟新增） | ≈260 | 主循环/指令分派/心跳（§2） |
| `thincoder-server/src/sandbox/runner/client.mjs`（拟新增） | ≈160 | 通道客户端（register/poll/report/退避）（§2） |
| `thincoder-server/src/sandbox/runner/runtime.mjs`（拟新增） | ≈200 | 容器运行时适配 + 探测（§7） |
| `thincoder-server/src/sandbox/runner/boxes.mjs`（拟新增） | ≈290 | 盒生命周期/参数/采纳/TTL/exec（§3） |
| `thincoder-server/src/sandbox/runner/egress.mjs`（拟新增） | ≈330 | 出站闸代理 + 域名求值 + 待批挂起（§4.2） |
| `thincoder-server/src/sandbox/runner/netfilter.mjs`（拟新增） | ≈230 | 网络层链生成/应用/自检（§4.1） |
| `thincoder-server/src/sandbox/runner/quota.mjs`（拟新增） | ≈150 | 磁盘配额两机制（§5） |
| `thincoder-server/src/sandbox/runner/checkpoint.mjs`（拟新增） | ≈140 | WIP 打包/恢复（§6） |
| `thincoder-server/src/sandbox/runner/probe.mjs`（拟新增） | ≈150 | 探针套件执行器（§10） |
| `thincoder-server/bin/thincoder-runner.mjs`（拟新增） | ≈120 | CLI：join/run/doctor/probe/image（§2/§7） |
| `thincoder-server/deploy/sandbox/Dockerfile`（拟新增） | ≈35 | 盒镜像（node 基座 + git/curl + 非 root） |
| `thincoder-server/deploy/thincoder-runner.service`（拟新增） | ≈30 | systemd unit（§8） |
| `thincoder-server/package.json`（已落盘 26） | ≈+1 | `bin` 增第二入口 `thincoder-runner`（KD-SV-64） |
| **小计** | **≈+2096** | —— |

## 10. 探针跑法（执行面侧）

- `thincoder-runner probe --workspace <id> [--probe Pn]`——盒内执行 + 本机检查，逐条 PASS/FAIL 输出（收口轮留档）。
- **期望读数表 = `SANDBOX.md` §12**（单源——本档不复制）；用例（两平面）= `SANDBOX.md` §13（N40–N44 ∥ B35–B40 ∥ E29–E33）。

## 11. 关键决策（执行面）

| # | 决策 | 理由 | 被否候选与何故否 |
|---|---|---|---|
| KD-SV-73 | **盒参数集** = read-only 根 + 唯一卷 + tmpfs 例外 + cap-drop + 非 root + 每工作区网络 | 需求块「每工作区一盒 + `--read-only` + 唯一可写挂载」的逐项落地；每工作区网络 = 跨工作区隔离（威胁模型面） | 共享网络（跨工作区可达——否）；特权盒（提权面——否） |
| KD-SV-74 | **磁盘配额 = 项目配额优先 ∥ loopback 备选；无机制 ⇒ 拒跑** | 项目配额零额外设备（xfs/ext4 原生）；loopback 全平台可落但耗 loop 设备 | 无配额（需求块明列——否）；容内自填盘监控（用户态不可靠——否） |
| KD-SV-75 | **出站闸代理 = node std + 源 IP 白名单 + 不 MITM + 校验后 PIN 建连** | 零第三方依赖纪律；CONNECT 隧道保 TLS 端到端（无证书面）；源 IP 白名单免代理认证头（工具兼容面）；PIN = 以已校验 IP 建连（防「校验-连接」间重解析差——DNS rebinding） | MITM（证书机制重——否）；用户态 TUN（重——否）；无准入开放代理（LAN 面裸奔——否） |
| KD-SV-76 | **网络层 = nft 优先 ∥ iptables 备 + 全量重算幂等** | 宿主异构（机队）；全量重算避免增量残渣与漂移 | 纯 iptables（旧栈机器兼容但表达弱——备选）；增量改链（残渣风险——否） |

## 12. 本域边界（执行面——不做）

- 不做入站/端口转发 ∥ 不做盒间互通 ∥ 不做 IPv6（v1）∥ 不做 GPU/设备直通 ∥ 不做镜像仓库治理（镜像 = 部署面）。
- 不做 runner 自动更新（升级 = 重装重启）∥ 不做盒内进程级审计/行为监控（隔离为准——非目标）。
- 不做多宿主调度优化（放置 = 控制面 §5 单源）。

## 变更记录

- 2026-10-10（**server-exec-sandbox 批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-10-server-exec-sandbox.md` §1 · 台账 #1224）：建档——守护进程/通道 ∥ 盒参数集 ∥ TTL ∥ 出站强制两实现（网络层 + 出站闸代理）∥ 磁盘配额 ∥ WIP 检查点 ∥ doctor 前置 ∥ 部署形态 ∥ 决策 KD-SV-73…76。**产品码零触（设计轮）**。
- 2026-10-10（**server-exec-sandbox 批 · 裁定收正 · eng-designer**——用户 14:23「都按建议」+ 14:24「server启动应该是不依赖沙盒的」）：§4.1/§7 两处 U1/U2 标签收正为已裁 ∥ §2「均不断盒」句补 server 零依赖互引（`SANDBOX.md` §1）。机制句零改。**产品码零触**。
- 2026-10-10（**server-exec-sandbox 批 · 设计评审轮 1 修正（fix 轮）· eng-designer**——承批档 §3 轮次 1 之 3/4/6/9）：§3 env 行补轮换重建注 + 增「取值来源」（create 载荷——含工作区覆写）∥ §4.1 恒拒/种子分列 + 显式 deny 恒先（种子 deny ≺ 显式 allow）∥ §4.2 求值 1 措辞随正 + 步骤 2 补 PIN 建连（SNI/Host 携原域名）∥ §9 预算增 `package.json` 行（bin 第二入口）+ 小计 ⇒ ≈+2096 ∥ §11 KD-SV-75 补 PIN。**零新语义**（评审发现直接导出项）。
- 2026-10-10（**server-exec-sandbox 批 · checkpoint 通路口径 fix 轮 · eng-designer**——2026-10-10 裁定落档）：§6 上送口径与 `gateway/API.md` §2.6 同拍（`application/octet-stream` 流式体 ∥ 路由级上限 200 MiB——与本地跳过阈值同值）。**产品码零触**。
