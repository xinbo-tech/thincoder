# 2026-10-10 · runner 管理面（控制台——增/删/排空 + 加入令牌）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-10 · 来源 = 用户 2026-10-10 19:33「我们需要先把runner的管理加上，至少要能添加删除runner对吧」+ 19:35「可以，A先落」。
> 台账 = #1251（server · 归批）。前情 = docs/batches/2026-10-10-server-exec-sandbox.md（已收口 2026-10-10）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 来源与授权（用户逐字）

- 19:33「我觉得有些事儿得放在这一步前面，否则这一步没载体。我们需要先把runner的管理加上，至少要能添加删除runner对吧。添加runner感觉需要先把管理面的会话界面给实现了。」
- 19:35「可以，A先落。」⇒ **点火 = 本批（A = 控制台 runner 管理页）**；B（会话界面 + server 端 agent = #1215 起步）另批、紧随其后；「项目与权限」排其后。

### 本批范围（A）

- 控制台 **runner 管理面**：① 列表（名 ∥ 健康态 ∥ 心跳 ∥ 承载工作区数）② **生成加入令牌 + 一键复制整条 join 命令**（含 server 地址 + 有效期可见）③ **排空**（drain）④ **退役/删除**（有承载工作区 ⇒ 二次确认）。
- 承载 API = 控制面既有（本批**不改协议**——页面消费）：`POST /api/admin/sandbox/runners/join-token` ∥ `POST …/runners/:id/drain` ∥ `DELETE …/runners/:id`（2026-10-10 晚实机接入 runner #1 即经此前二）。
- **边界（不做）**：托管加机（server 端 agent 自动装机 = B/#1215）∥ 沙盒其余五面页面（工作区 ∥ 出站规则 ∥ 待批 ∥ 资源与 TTL ∥ 审计——沙盒 webui 后续批）∥ 项目与权限（本件之后的序列）。

### 依据

- 需求 = `docs/server/requirements/PROJECT.md` AC-36 ⑥（控制台六面）⑨（接入两径）；台账 **#1251**。
- 承批 §5 明载「webui 静态十四档（§2.8/§2.9——前端面另批）」= 本批补的即该块的 runner 面。
- 设计单源 = `docs/server/design/webui/WEBUI.md` §2.8/§2.9（沙盒页）∥ `docs/server/design/sandbox/SANDBOX.md` §8（运行面）∥ `docs/server/design/ops/OPS.md` §5.10（runner 运维）。

### 合并扫描（点火前）

- **并**：无（本面独立）。
- **不并**：**#1215**（服务端开发——B 块：server 端 agent + 会话界面；不同面且为先决后续）∥ **#1236/#1237**（托管接入能力/凭据面——属 B）∥ **#1224**（已收口——沙盒控制/执行面本体）∥ **项目与权限**（#1216——本件之后按序）。

### 授权口径

- 设计 → 评审（用户点火）→ 批准 → 实施（eng-coder）。文档面 = 需求档（主 agent）∥ 设计档（eng-designer）∥ 本档 §1/§4/§6（主 agent）。

### 口径补记（用户 2026-10-10 19:42–19:45 · 逐字）

- 「我们认为的runner应该是一个docker服务器，而不是一个什么linux主机，linux主机只是为了装上docker。」
- 「我们应该用管理docker的方式去管理它」
- 「那不就完了！我说的runner就是一个远程的docker服务器。你他妈的别自说自话自己瞎发挥。」

⇒ **模型定稿（以此为准）**：**runner = 一台远程的 Docker 服务器**（Linux 主机 = Docker 的底座）；管理面按**管理 Docker 的方式**说话与操作（容器/镜像/资源）。本批设计须据此收正叙事与文案；`RUNNER.md` §1「定位」句（现文「一台机器上的守护进程 + 本机容器运行时」= 主次颠倒）随本批设计轮一并收正。

### 口径补记 2（用户 2026-10-10 19:52–19:54 · 逐字）

- 「实际上也不存在什么守护进程，守护进程就是docker服务，调用docker api就好了。」
- 「对的，将来如果runner要集群化，就用docker自己的集群就好了嘛。」

⇒ **方向定稿**：① runner 机 = 纯 Docker 服务器——**机器上不驻留我们的进程**；建/起/停/拆盒 = 直接调 **Docker API**；主机侧两件（出站闸 nft ∥ 卷的磁盘限额）= SSH 进主机执行；心跳/超时/快照 = 控制端（server）自己的定时器。② **集群化 = 用 Docker 自己的集群**（不自建机队/放置/通道）。

**影响面（如实摊开）**：③ 今晚已收口的 `2026-10-10-server-exec-sandbox` 批之「守护进程 ∥ 通道 ∥ 放置」部分与新口径相抵——代码可跑（含今晚真机验证），但按新口径属**将被替换的形态**（约 2300 行）；④ 本批（A）之底子待「runner 重做」设计定稿后再接；⑤ 本批设计**仍未发**（用户闸门——设计/代码/文档一字未动）。

### 口径补记 3（用户 2026-10-10 19:55–19:56 · 逐字）

- 「对吧，这个就简单了嘛，runner就是docker的api节点。」
- （19:55 问 Swarm：「是叫docker swarm吗？api应该跟docker是一样的吧。」⇒ 已答：**Swarm mode** ✓ ∥ 同一套 API + `services`/`tasks`/`nodes` 端点 ∥ 2026 仍在维护（Docker 重心在 K8s）；将来多机 = 把盒升成 service，交 Docker 自己调度。）

⇒ **定稿一句**：runner = **Docker 的 API 节点**（控制面直调其 Docker API；主机侧两件 = SSH；机器上无自驻进程）。

**重做范围（据实）**：执行面（守护进程 ∥ 通道 ∥ 放置）⇒ 换成 Docker API 调用；**保留** = 控制面数据（工作区/出站规则/待批/任务）∥ 控制台面 ∥ 盒镜像 ∥ 今晚的机器事实（`TEST-ENV-ECS.md` §7）。重做批**未点火**（用户闸门）。

### 范围重定（用户 2026-10-10 19:59 · 逐字 —— **以此为准，取代上文「本批范围（A）」**）

> 「你先别搞得那么复杂，咱先简化，不要一上来就当成最终状态，我现在不需要你一下子干完，我现在只要你把runner添加进去，能创建容器，能启动能停止，能把runner节点删掉，实现最基本的功能，你现在想得哪些乱七八糟的先都别搞，等到那个时候再上不迟。」

**本批范围（最小切片）**：① **添加 runner**（登记一台 Docker API 节点）② **创建容器** ③ **启动 ∥ 停止**容器 ④ **删除 runner 节点**。**其余全部不做**——出站闸 ∥ 磁盘限额 ∥ 探针 ∥ 心跳/放置 ∥ 托管装机 ∥ Swarm ∥ 快照 ∥ 待批：等以后按需再上。

**连带**：新口径下控制面**直调 Docker API**（不经今晚那套 `thincoder-runner` 守护进程）——守护进程代码**暂搁置**（去留另议，不删）；沙盒其余五面页面 ∥ 项目与权限（#1216）∥ 托管装机（B）均在后续队列。

### 口径补记 4（用户 2026-10-10 20:01 · 逐字）

> 「守护进程废了，不要留着，扰乱视听。」

⇒ **守护进程 = 废（清除，不留）**。父侧拟定清除清单（**待用户点头后动手**，未动）：

- **代码（删）**：`thincoder-server/src/sandbox/runner/` 九档（daemon ∥ client ∥ runtime ∥ boxes ∥ egress ∥ netfilter ∥ quota ∥ checkpoint ∥ probe）＋ `bin/thincoder-runner.mjs` ＋ `deploy/thincoder-runner.service` ＋ 服务端通道 `src/sandbox/runner-api.mjs`（及其路由注册）＋ 依附的批内件测试（runner 侧；控制面侧测试保留——逐档核过再删）。git 历史留底（将来要用照新设计重写）。
- **文档（随正）**：`sandbox/RUNNER.md`（执行面档——作废；删档 ∥ 标废由设计轮定，设计档归 eng-designer）∥ 需求档 §5 沙盒块的执行面条目 ∥ `OPS.md` §5.10 ∥ `API.md` §2.6 ∥ `STORE.md` v11 段 ∥ `ACCOUNTS.md` 十二型（逐处核）。**冻结批档不回改**（历史记录）。
- **保留**：盒镜像 `deploy/sandbox/Dockerfile`（新切片要用）∥ 控制面（registry ∥ routes ∥ rules——工作区/规则/待批的数据面与接口，后续用）∥ `TEST-ENV-ECS.md` §7 机器事实。
- **机器（待点头）**：10.0.0.6 上 `systemctl disable --now thincoder-runner` ＋ 令牌文件处置（清 ∥ 留——一句话定）。

### 清除执行记录（2026-10-10 20:02–20:10 · 用户「清」后开工）

**代码（删，14 档）**：`thincoder-server/src/sandbox/runner/` 九档（boxes ∥ checkpoint ∥ client ∥ daemon ∥ egress ∥ netfilter ∥ probe ∥ quota ∥ runtime）＋ `bin/thincoder-runner.mjs` ＋ `deploy/thincoder-runner.service` ＋ `src/sandbox/runner-api.mjs`（服务端通道）＋ 批内件测试三档（`2026-10-10-server-exec-sandbox-runner.test.mjs` ∥ `…-runner-io.test.mjs` ∥ `…-server-exec-sandbox.test.mjs`——**逐档核过**：主测试 22 例每例都经 join/心跳引导（通道不可分），无独立控制面例可留 ⇒ 随通道同删）。

**接线随正**：`bin/thincoder-server.mjs`（import + 注册行）∥ `src/sandbox/routes.mjs`（runner-api import + join-token 路由 + 6 处 signal* 唤醒调用 + 头注）∥ `src/accounts/session.mjs`（`requireRunner` 第三门）∥ `src/gateway/server.mjs`（KD-SV-77 快照上载豁免：常量 ×2 + isCheckpointUpload + bodyLimitFor + 型门分支）∥ `package.json`（bin 第二入口 + prepublishOnly 清单）∥ `README.md`（快照路由反代块）∥ `deploy/sandbox/Dockerfile`（注释）∥ `registry.mjs`/`rules.mjs`（通道端点注释）。

**保留（按批）**：盒镜像 Dockerfile ∥ 控制面三档（registry ∥ routes ∥ rules——数据面与接口）∥ `TEST-ENV-ECS.md` §7 机器事实。

**需求档随正**（main agent 直接执行 · 可 revert）：§5 沙盒块四处（执行面 ∥ 两者约定 ∥ 接入两径 ∥ 控制台①运行面 ∥ 控制链路）＋ AC-36 ⑨——**历史变更记录行不回改**（记录面照旧）。

### 授权（自动跑 · 2026-10-10 22:18）

用户原话：「赶紧自动跑完。」（承 22:17 问「你没自动跑吗？」）⇒ 本批**设计评审点火权** ∥ **§4 批准权（代签）** ∥ **修正/实施轮派发** ∥ **收口核销与提交**——均委托父侧自动执行，直至本批收口。

**父侧自缚三条（本仓惯例·先例同形）**：① 代签仅当三条件齐备（评审 pass 0🔴 ∧ 修正轮已落地并逐条核验 ∧ token 已签发）；② **新范围 ∥ 用户口径裁决 ⇒ 停下、只摆那一条**；③ **破坏性/不可逆 ⇒ 先停**。

**本批射程（两件）**：① #1252 设计档随正（守护进程清除后设计档收正到「runner = 远程 Docker API 节点」）——**已派** eng-designer #170；② A 批最小切片设计（添加节点/建容器/启停/删节点）——**已派** eng-designer #171（队列中——域冲突，#170 清后自动起）。

### 口径补记 5（用户 2026-10-10 22:19–22:22——管理面 agent 的工具面）

- 「你应该把管理面的agent也开工吧。」（⇒ 托管接入（#1237）开工——设计 = eng-designer #172）
- 「我个人觉得管理面能力还是要强一点，不给bash/ssh会很麻烦。」

⇒ **工具面口径（用户已裁，设计照此）**：管理面 agent **要有通用执行能力（bash/ssh 级）**——不给固定动词集/白名单。
拟形（供设计落细）：`exec(host, command)`（目标机真跑命令；SSH = 传输，非交互、逐条）+ `register(host, endpoint)`（登记进控制面）+ `verify(host)`（自检）+ `report`（读数复述）；核 = 复用 `@thincoder/core` + 最小壳（与盒内 agent 同路子）。
**保留的两条**（不碍「强」，与用户 15:00「过程留痕可查 ∥ 结果可复述」同位）：① 每次 exec 落审计行（命令 ∥ 退出码 ∥ 摘要）；② 每步读数可复述、失败停在哪步说清。

### 口径补记 6（用户 2026-10-10 22:25——Docker 工具面）

- 「一些docker的操作工具不给他吗？」

⇒ **给**（与「runner = Docker API 节点」同一口径）——管理面 agent 工具面补一条：**`docker(host, op)` = 按 Docker API 的动词（ps ∥ inspect ∥ images ∥ pull ∥ create ∥ start ∥ stop ∥ rm ∥ logs …）走 HTTP 直控目标机 Docker**；控制台（A 批）与 agent 走**同一套 Docker 调用**。`exec` 仍保留（装 Docker 本身 ∥ 系统级检查 ∥ 将来主机侧强制项——Docker 工具覆盖不了）。

**管理面 agent 工具面（合口径 5 + 6）**：`exec`（主机命令）∥ `docker`（容器面动词）∥ `register`（登记进控制面）∥ `verify`（自检）∥ `report`（读数复述）；核 = `@thincoder/core` + 最小壳；每次动作落审计行（命令/调用 ∥ 结果码 ∥ 摘要）。

### 新范围登记（用户 2026-10-10 22:28——**立批/并批待裁，未开设计**）

- 用户原话：「我其实还希望server的管理能力也应该托管给agent，比如成员管理，provider管理，模型选择，用量等等这些，我希望能够通过agent完成thincoder server的完整管理。」
- 已登记：需求档 `docs/server/requirements/PROJECT.md` §1 后续议题（新行）+ 台账 **#1254**（待讨论）。
- **路由待裁**：单独一批（父侧倾向）∥ 并进本批（与 #172 同 agent 同源）。**未裁前不动设计**——本批三个设计（#170/#171/#172）照原射程跑。

### 口径收正（用户 2026-10-10 22:29 · 逐字）

- 「不不不，就是同一个agent，就是管里面的那个agent」

⇒ **管理面 agent = 唯一一个**（不另立第二个；父侧上一条「独立面」的读法作废）。它的**能力面 = 整个 server 管理面**（成员 ∥ provider ∥ 模型选择 ∥ 用量/配额 ∥ 审计 ∥ 沙盒各面 ⋯），**逐步长**——#172（托管加机）设计的就是**这一个 agent** 及其第一个活；其余管理面此后陆续入它的工具面（同 agent、同源、同口径）。需求档 §1 后续议题同刻收正。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（#1252 随正（#170）+ A 批最小切片（#171）两件落定）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### #1252 设计档随正（runner = 远程 Docker API 节点）——落点表与验收

**口径**（用户 2026-10-10 19:52–20:01 逐字 + §1）：runner = **远程 Docker API 节点**（控制面直调 Docker API ∥ 主机侧两件（出站闸 ∥ 磁盘限额）= SSH ∥ 集群化 = Docker 自家集群 ∥ 机器上不驻留我们的进程）；守护进程面「废了，不要留着」⇒ 设计档面全部相抵表述清除（D8 作废即删）。**本件射程 = 设计档面随正**；需求档回笔（主 agent 笔）∥ 实施侧收正（重做批）∥ A 批最小切片设计（#171——本 §2 的另一件）均不在本件。

**落点表（逐档处置——11 改 + 1 删）**

| # | 档 | 处置 | 要点 |
|---|---|---|---|
| 1 | `sandbox/RUNNER.md` | **整档删**（git 留底） | 执行面设计随重定退场；新执行面设计归重做批 |
| 2 | `sandbox/SANDBOX.md` | 随正 | §1 口径重写（执行面 = Docker API 节点）∥ §3 ⇒ 节点登记（添加/删除 + 连通自检）∥ §12 探针套件删、旧 §13–§16 顺移 ⇒ §12–§15 ∥ §14 决策面：KD-SV-64/65/66/75/77 **作废**、63/67/68/69/70/71/72 收正、73/74/76 迁入 ∥ §2 列面/审计随正 |
| 3 | `gateway/API.md` | 随正 | 路由族去 runner 面 ∥ **§2.6 整节删** ∥ §2.5 运行面读数行 + 节点增删行 ∥ §3 去 413 例外与 runner 面族 ∥ §4/§5/§7/§8 随正 |
| 4 | `ops/OPS.md` | 随正 | §5.10 重写（接入与运维）∥ §5.1 `bin` 去第二入口 ∥ §5.6 反代去快照例外 ∥ §6 去 runner unit 行 ∥ §7 沙盒判据行 ∥ §8 + KD-SV-25 |
| 5 | `store/STORE.md` | 随正 | v11 列面：runners 去 token_hash/labels_json/心跳、增 address、status 收窄（active/disabled）∥ workspaces 去 required_labels_json ∥ tasks 去 claimed |
| 6 | `PROJECT.md` | 随正 | 域档 9 ⇒ **8** ∥ §2.1 sandbox 行 ∥ §3 地图去 RUNNER 行 ∥ §4 索引 15 行 ∥ §5 KD-SV-77 ⇒ 作废 ∥ §6/§7/§9 随正 |
| 7 | `webui/WEBUI.md` | 随正 | §2.8① 运行面重写（节点接入）∥ §2.8⑤ 读数句 ∥ §6 沙盒页行 |
| 8 | `accounts/ACCOUNTS.md` | 随正 | `sandbox_event` 行（节点添加/删除 + 连通自检失败行）∥ §3 前言去例外 ∥ 标记收正 |
| 9 | `client/CLIENT.md` | 随正 | §2 前言去端点例外括注（三档逐字同拍） |
| 10 | `metering/METERING.md` | 随正 | §3 前言同拍 |
| 11 | `EVOLUTION.md` | 随正 | §1-G4/G6 句（sandbox 域单档；域档 9 ⇒ 8） |

各档变更记录均已追加当轮一行（含「迁移期引文」标记——历史引用与现面分离）。

**验收对照**
- 机检（`node scripts/doc-check.mjs`）：本件设计档面**新增悬空 0**——历史引用 7 处（EVOLUTION :38/:39 ∥ PROJECT :580/:583 ∥ API :327 ∥ OPS :396 ∥ SANDBOX :216）补「（迁移期引文——已删」+ 史实谓词，转为列报·不入闸；`ACCOUNTS.md:67` 相对路径补全为全路径后落解。机检仍 exit 1 = **既有悬空**（`requirements/PROJECT.md:247` ∥ :486/:498 等——非本件面，列报）。
- grep 终检（禁词集：`thincoder-runner|守护进程|长轮询|join 令牌|requireRunner|第二入口|装机三步|探针 P1|心跳|排空|drained|runner 注册|claimed`）：设计档面**规范面 0 命中**；余项全部落**变更记录行**（记录面——历史留档，逐条可查，不构成活工单）。

**上抛项（父侧/主 agent/另轮）**
- ① 需求档残留（主 agent 笔）：`requirements/PROJECT.md:247`（AC-36 ⑦ 探针 + `RUNNER.md` 指针）+ §1 部署行（「runner farm」∥「runner 无需入向端口」）。
- ② `db.mjs` v11 列面实现残留（代码禁改；设计档已随正）——实施侧收正归重做批（`STORE.md` 变更记录已注此差）。
- ③ 计数/账目陈值未收（`PROJECT.md` §6 批内件行 ∥ `OPS.md` §5.1 件数链 ∥ `SANDBOX.md` §13「拟新增」标记）——不在本件射程（§1 明示不自选活），另轮。

**§2 状态行**：留待 #171（A 批最小切片设计）落定后一并设——本 §2 含两件（#1252 随正 + A 设计），本件只落其一。

### A 批最小切片设计（#171——用户 19:59 四件）——落点、机制与验收

**口径**（承 §1「范围重定」19:59 逐字）：射程 = ① 添加 runner（登记一台 Docker API 节点）② 创建容器 ③ 启动 ∥ 停止容器 ④ 删除 runner 节点。**其余全部不做**（出站闸 ∥ 磁盘限额 ∥ 探针 ∥ 心跳/放置 ∥ 托管装机 ∥ Swarm ∥ 快照 ∥ 待批 ∥ 镜像管理 ∥ 工作区↔容器映射 ∥ 卷删除 ∥ 限额/端口/网络 ∥ TLS——`SANDBOX.md` §15 + §3 表）。设计自加项三条（独立删容器 ∥ API 版本协商 ∥ 容器动作落审计）逐条带来源与理由，不冒充用户口径（`SANDBOX.md` §3 提议表）。

**落点表（5 档——本件已落）**

| # | 档 | 处置 | 要点 |
|---|---|---|---|
| 1 | `sandbox/SANDBOX.md` | 改（**§3 重写** + §2/§8①/§9/§11/§12/§13/§14/§15/变更记录） | 四件逐条 + 运行面读数 + 提议表六条 + KD-SV-79/80/81 + 用例 N40/N46–N48/B41–B43/E34–E36 |
| 2 | `gateway/API.md` | 改（§2.5 前区 + §4/§5/变更记录） | 端点表 = 单源：overview 重写 + 添/删节点收正 + **容器四行新增** |
| 3 | `store/STORE.md` | 改（**增 v12 增段** + §1/§2 标题/§3/§4/变更记录） | 结构版本 11 ⇒ **12**（`sandbox_runners` 表重建——列面 = v11 段所列为准） |
| 4 | `webui/WEBUI.md` | 改（§2.8① 定形 + §1/§2.2/§5/§6/变更记录） | 运行面批 vs 沙盒余面批（两轮分落——计数链/AC 行全部二段化） |
| 5 | `ops/OPS.md` §5.10 ∥ `accounts/ACCOUNTS.md` §2.1 ∥ `design/PROJECT.md`（§2.1/§3/§4/§5/§6/§7/§9/变更记录） | 随正 | 节点前置（dockerd TCP 监听）+ `sandbox_event` 补 `container_*` + KD-SV-79/80/81 索引/全形 + R52 |

**机制要点（逐件）**

- **① 添加节点**（`POST /api/admin/sandbox/runners`）：入参 `{ name, address }`（名 ≤ 40；地址归一 `http://<host>:<port>`——缺协议/端口补全，`https:` 拒）；连通自检 = `GET <base>/<ver>/version`（读 Version/ApiVersion/MinAPIVersion/Os/Arch + 协商版本 = `max(1.44, MinAPIVersion)`，须 ≤ `ApiVersion`）⇒ 通过落行（`status='active'`；`runtime_json` = 自检读数）+ 审计 `runner_add`；失败 ⇒ 502 `upstream_error` + 逐句人话 + **零落库** + 审计 `runner_selfcheck_failed`；重名/形非法 ⇒ 400。
- **② 建容器**（`POST …/runners/:id/containers`）：三件 `{ name, image, volume? }`（镜像预填设置 `image` 值；卷可空）⇒ 引擎 `POST containers/create?name=<名>`（体 `{ Image, HostConfig: { Binds: ["<卷>:/workspace"] } }`——卷缺则省略 HostConfig）⇒ `{ container: { id, name, image, state: "created" } }` + 审计 `container_create`；引擎 404/409 ⇒ 400（含引擎原文）；不可达 ⇒ 502。
- **③ 启动 ∥ 停止**（`POST …/containers/:cid/start` ∥ `…/stop`）：204 ⇒ 200；**304（已启/已停）⇒ 幂等成功**；404 ⇒ 404 `not_found`；余 ⇒ 502；审计 `container_start`/`container_stop`。**容器删除**（设计自加——`DELETE …/containers/:cid?force=1`；卷不随删；审计 `container_delete`）。
- **④ 删除节点**（`DELETE …/runners/:id`）：先读承载容器 ⇒ 有容器未给处置 ⇒ 400（二选一「保留 ∥ 连删」）∥ `keep` ⇒ 只删登记 ∥ `remove` ⇒ 逐个强删 ⇒ 全成 ⇒ 删行，**任一失败 ⇒ 502 + 登记行保留**（消息携失败清单）；**节点不可达 ⇒ 仅 keep**；**有承载工作区 ⇒ `confirm: true`（现行为保留——实现实读核过 `routes.mjs:161`）**；审计 `runner_delete`（detail 携 kept/removed）。
- **运行面读数**（`overview`）：读时探活（每节点现打 `/info`——3s ∥ 并发；无后台定时器/心跳——KD-SV-80）⇒ `online`/`version`/`containers{total,running}`；`status = available ⇔ 至少一节点在线`；**节点面恒可用**（不整页禁用）；写门 `requireSandboxAvailable` = 静态判据（存在 `active` 节点；本批零改——实时门随重做批）。
- **数据面**：**v12 = `sandbox_runners` 表重建**（列面 = v11 段所列；旧通道形态 token_hash/labels_json/last_heartbeat_at 随重建exit；**存量旧行弃**——无地址可取、令牌/心跳语义整废；测试库仅一行 daemon 期残留）；容器**不落库**（Docker 引擎即真源——KD-SV-79）。
- **关键决策**：KD-SV-79（容器不落库）∥ KD-SV-80（读时探活非心跳）∥ KD-SV-81（版本协商 + 恒带前缀）——见 `SANDBOX.md` §14 / `PROJECT.md` §4/§5。

**受影响文件与测试面（实施侧——本件不落码）**

| 档 | 现读 | 本批 |
|---|---|---|
| `thincoder-server/src/sandbox/routes.mjs` | 407 | ⇒ ≈540（+≈133：添/删节点 ∥ 容器四路由；drain 路由删；头注） |
| `thincoder-server/src/sandbox/registry.mjs` | 522 | ⇒ ≈500（runner 面重写 ∥ `runnerHealth` 删 ∥ `sweepStuckTasks` 去心跳判据；死件不动） |
| `thincoder-server/src/sandbox/docker.mjs` | 无 | 新 ≈170（Docker API 客户端：协商 ∥ version/info/create/start/stop/DELETE ∥ 错误映射 ∥ 超时 ∥ `fetchImpl` 注入——沿 `proxy-admin.mjs:52` 先例） |
| `thincoder-server/src/store/db.mjs` | 365 | ⇒ ≈400（v12 段 +≈35） |
| `thincoder-server/public/views-sandbox.mjs` | 无 | 新 ≈210（运行面卡 + 容器区——两表 + 三弹窗） |
| `nav.mjs` 88 ⇒ ≈89 ∥ `app.mjs` 192 ⇒ ≈195 ∥ `i18n-{zh,en}-admin.mjs` ≈141/≈145 ⇒ ≈167/≈171（+≈26/表）∥ `i18n-{zh,en}-shell.mjs` 73/71 ⇒ ≈74/≈72（+`nav.page.admin.sandbox`；`err.upstream_error` 值改携 `{detail}`——±0）∥ `style.css` 233 ⇒ ≈240 | | 运行面批（余面批另计：见 `WEBUI.md` §5） |
| 批内件两件（入 server 链） | 无 | `docs/batches/2026-10-10-runner-admin-console.test.mjs`（估 ≈420）∥ `…-ui.test.mjs`（估 ≈260） |
| 零触 | | `errors.mjs` ∥ `bin/thincoder-server.mjs` ∥ `rules.mjs` ∥ `credentials.mjs` ±0 |

**验收对照（三链同源：本表 = 设计档判据条目 = 需求侧可检验物）**

- ① 添加节点：`SANDBOX.md` §11 最小切片行 + §12 N40/E34/B41/B42 + `API.md` §2.5 添节点行（自检读数落库逐值 ∥ 失败零落库 + 审计行）。
- ② 建容器：§12 N46/E35 + `API.md` 创建行（引擎请求体逐值 ∥ 列表可见）。
- ③ 启/停/删：§12 N47/E36 + `API.md` 启/停/删行（304 ⇒ 幂等成功 ∥ 卷不随删）。
- ④ 删节点：§12 N48/B43 + `API.md` 删节点行（二选一 ∥ 连删失败行保留 ∥ 不可达仅 keep）。
- 数据面：`STORE.md` §2 v12 段 + §3 v12 行（空库读数 12 ∥ v11 库升 12 ∥ 幂等 ∥ 列面五行在场 ∥ 旧三列名不在 ∥ 存量行弃）。
- 控制台：`WEBUI.md` §6 沙盒页行（运行面批段——档目 **31 ∥ 32** ∥ nav 管理 8 ∥ i18n `admin.sandbox.*` 两表同步；UI 定形 = §2.8①）。
- **真机判据（收口轮——`10.0.0.6`，Docker 29.1.3 ∥ 盒镜像在机）**：添节点 ⇒ 在列（online + 版本）；建容器 ⇒ `docker ps -a` 见 `Created` ⇒ 启动 ⇒ `docker ps` 见 `Up` ⇒ 停止 ⇒ `Exited` ⇒ 删 ⇒ 无；删节点「保留」⇒ 容器留机 ∥「连删」⇒ 容器净 + 节点消。

**上抛项 / 登记项**

- ① 需求档（主 agent 笔）：需求 §5/AC-36 的阶段口径（六面分两轮）宜回笔——**写法/计数 = 主 agent 决定**（同源 = `PROJECT.md` §9 R52①）。
- ② 父侧补笔：`docs/TEST-ENV-ECS.md` §7——现为 `thincoder-runner.service` 残留口径（服务已不存在）+ 需补节点前置步（dockerd 监听 TCP——`OPS.md` §5.10 节点前置条）。
- ③ 登记（不阻塞）：审计页 `sandbox_event` 模板随沙盒余面批（原始型名兜底可用）∥ 孤儿件 `docs/batches/2026-10-10-server-exec-sandbox-runner.fixtures.mjs`（实读核过零引用——随余面批清）。
- ④ 披露：v12 存量旧行弃（一次性过渡行为——测试库仅一行 daemon 期残留）∥ `err.upstream_error` 值改（携 `{detail}`——连带既有使用点文案细化，语义零变）∥ 沙盒页其余五面卡 + 成员面 = 沙盒余面批（计数链已在设计档二段化，余批不返工）。

### 机检读数（本件交付时 · `node scripts/doc-check.mjs` 现读）

- **行宽：OK**（源域 .md 无 >300 字符单行；本件初次现读 10 行超宽 = 本件新增正文——**已逐行折行收正**，复跑 OK）。
- **锚：5 条悬空（闸态）——均非本批面**（`mount-settings-team.mjs` 桌面族：`API-CONTRACT.md:2011` ∥ `TEAM.md:130` ∥ `SETTINGS.md:493/506` ∥ `UI.md:602`——既有悬空，列报）；本件引入的两条（`SANDBOX.md` docker.mjs 行 ∥ `WEBUI.md` views-sandbox 行）已随**拟新增标记**补齐（拟新增 31 ⇒ 33——列报 · 不入闸）。
- **汇总**：候选 56448 · 悬空 5 · 注记豁免 303 · 拟新增 33 · 迁移期引文 338 · 声明源缺位 0（exit 1 = 上述既有 5 条）。
- 机制面：`err.upstream_error` 值改（携 `{detail}`）为**共享键值改**——既有使用点（provider 发现等）文案随细、语义零变（`WEBUI.md` §2.2/§5 在册）。

## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
