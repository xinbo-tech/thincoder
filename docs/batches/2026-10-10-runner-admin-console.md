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
**状态行**：设计完成（托管接入设计落笔——agent 域档新建 + 八档随正；机检行宽/锚面净；上抛四条在 §2 段内）
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

### 托管接入（管理面 agent）设计轮（2026-10-10——台账 #1236/#1237；承 §1；用户 22:19–22:29 四句 + 15:00/15:02 裁）

**本批覆盖（需求条目——已收口口径）**：① 管理员只给「地址 + 登录方式」⇒ server 端 agent（进程内）代做接入（探明 → 决定 → 执行 → 验证 → 报告）② 控制台三态（正在装机 ∥ 已就绪 ∥ 失败原因）③ 两径覆盖（裸机安装 ∥ 已装 Docker）④ 凭据纪律五件（存哪 ∥ 加密 ∥ 专用低权账号 ∥ 可撤销 ∥ 用完即弃）⑤ SSH 传输与指纹纪律（TOFU）。

**不在本批（显式边界）**：多机并装 ∥ 任务中途取消 ∥ Docker `:2375` TLS（明文——沿提议①）∥ 管理面 chat 面（随会话面增量轮）∥ 失败自动重跑（= 重开弹窗重填）。

**设计落点表**（档 → 落点）：
- `sandbox/SANDBOX.md` §3 —— 托管接入机制全文（步骤骨架 S1–S8 ∥ 两径跳步 ∥ 探明读数十项 ∥ 凭据纪律 ∥ 网络路径（硬点① 答案）∥ run 态）；§14 KD-SV-83–86；§2/§8①/§11/§12/§13 随正；提议⑦–⑬。
- `agent/ADMIN-AGENT.md`（**新建**——agent 域建档）——形态与定位（进程内，KD-SV-82）∥ 工具面五件（exec/docker/register/verify/report）∥ 自主边界与失败处置（硬点② 答案）∥ 无人值守裁剪 ∥ 预算 ∥ 验收 ∥ KD-SV-82/87。
- `gateway/API.md` §2.5 —— 托管接入四端点（`POST/GET …/onboarding` ∥ `GET …/:id` ∥ `DELETE …/:id/credential`；异步起跑、仅 400/404、零秘密回显）+ §5 判据行。
- `store/STORE.md` §2 v13 段/§3 —— `sandbox_onboarding` 表（18 列）+ 版本链 13。
- `accounts/ACCOUNTS.md` §2.1 —— `sandbox_event` 五 kind（`onboarding_*`——CHECK 零动；零秘密掩蔽口径）。
- `webui/WEBUI.md` §2.8① —— 托管接入块（弹窗八字段 ∥ 装机任务区 ∥ 3s 读时轮询）；§5 行数预算；§6 沙盒行。
- `ops/OPS.md` §5.10 —— 接入条 + 托管接入落地。
- `design/PROJECT.md`/`EVOLUTION.md` —— 域清单九域（agent 新立）∥ 索引 1–87 ∥ §5 六条 ∥ §6 预算 ∥ §7 沙盒行 ∥ §9 R53。

**验收对照（可判据）**：#1236 ⇒ `sandbox/SANDBOX.md` §11 托管接入行 + §12 用例（N49–N52 ∥ B44–B46 ∥ E37/E38）+ `webui/WEBUI.md` §6 + `gateway/API.md` §2.5 + `store/STORE.md` §2 v13；#1237 ⇒ `agent/ADMIN-AGENT.md` §7 + §12 用例（N53 ∥ B47 ∥ E39）+ KD-SV-82；真机面 = 无 Docker 机只给地址+凭据 ⇒「已就绪」（收口轮）。

**决策在册**：KD-SV-82（进程内 + 裁剪 + 工具面五件无围栏）∥ 83（逐案执行 + 六边界 + 失败处置）∥ 84（AES-256-GCM + 密钥 0600 + 默认弃）∥ 85（容器内 openssh + 指纹 TOFU）∥ 86（库行 + 读时轮询）∥ 87（模型 = 提交时选择）。

**影响文件**：设计档九件（八件随正 + `agent/ADMIN-AGENT.md` 新建）；**产品码零触（设计轮）**；产品面预算 = `PROJECT.md` §6 增补块（≈+1120 ∥ webui ≈+141；批内件 `…-agent.test.mjs` 入链 42 ⇒ 43）。

**机检读数**：`scripts/doc-check.mjs` —— 行宽 0 超（本批十处超宽已折行）∥ 锚面本批坐标均 `拟新增` 列报态 ∥ 无入闸旗。

**上抛（待裁）**：① `#1239` 与 KD-SV-78 的依赖关系（agent 面从核引——本设计按依赖声明形写；核侧实现出口 = 另批/核仓）∥ ② agent 模型面：provider 注册表出口与出口代理旗复核（实施面——`agent/ADMIN-AGENT.md` §5）∥ ③ `@thincoder/server` 带核发布形（`@thincoder/core` 钉版本 ⇒ 构建期 registry 可达性——实施轮定）∥ ④ 预算两值（20 分钟 ∥ 60 调用）与 i18n 顺移值（≈231/≈235）为推断值——供复核。

**登记/父侧（知会）**：① 需求档回笔：AC-36 ⑨/⑩ 与 §5「接入两径」判据面收口（写法/计数 = 主 agent）∥ ② `docs/TEST-ENV-ECS.md` §7 补「托管接入」跑法（手工前置路可作降级）∥ ③ `docs/README.md` 地图登记 agent 域 ∥ ④ 审计页 `sandbox_event` 模板随余面批（原始型名兜底可用）。

**勘误（同轮——预算读数收正）**：服务端产品面 = **≈+1110**（agent 域 ≈470 ∥ sandbox 域 ≈640 ∥ `Dockerfile` +3）；上段「≈+1120」为笔误，以本条为准（`design/PROJECT.md` §6 行与变更记录已同拍为 +1110）。

### 设计评审轮 1 修正（fix 轮——承 §3 轮次 1；1 ∥ 3–14，除 #2）

**逐号落点（号 → 改动 file:line——现状行号 → 一句话）**

| # | 落点 | 一句话 |
|---|---|---|
| 1 | `docs/server/design/sandbox/SANDBOX.md:13` | 「探活/超时/快照」⇒「**盒级超时/快照 = 控制端定时器（余面批）**——节点存活 = 读时探活（§14 KD-SV-80）」——两说消除 |
| 3 | `docs/server/design/sandbox/SANDBOX.md` §14（原 :276–278/:287）∥ `docs/server/design/PROJECT.md` §4 索引（5 行）+ §5（1 行） | 作废尸标删净（编号留空档；历史 = 变更记录） |
| 4 | `docs/server/design/sandbox/SANDBOX.md:268–269` | `routes.mjs` 拆分预案（触发点 = 实施轮实读 > 500 ∥ 余量 ≈50 ∥ 候选 = 容器面路由独立成档（拟新增——首选）∥ 节点面备选） |
| 5 | `docs/server/design/agent/ADMIN-AGENT.md:62` ∥ `docs/server/design/sandbox/SANDBOX.md:254` | 注册路径定 = 四端点经 `routes.mjs` 转注册（`bin` **±0**）——与 §6 预算同拍 |
| 6 | `docs/server/design/webui/WEBUI.md:125` ∥ `:127` | 键链补托管接入 +≈30 一步——**≈108 键** ∥ admin ≈90；链 ⇒ 167/171 ⇒ 197/201 ⇒ 231/235（与 §5 取齐） |
| 7 | `docs/server/design/PROJECT.md:11` ∥ `:67` | 十一页 ⇒ **十二页**（我的 4 + 管理 8 = 12——与 WEBUI §2.2 ∥ 需求同拍） |
| 8 | `docs/server/design/store/STORE.md:264` ∥ `:299` | v11 段两表定义处就近补注（列面差 = 去 `required_labels_json` ∥ 去 `claimed_at`——与 v12 段旁注同指） |
| 9 | `docs/server/design/ops/OPS.md:120–121` ∥ `:267` | 门禁链 ⇒ 42 ⇒ **43** ∥ Dockerfile ⇒ ≈37（+≈3 = `openssh-client` + `sshpass`） |
| 10 | `docs/server/design/accounts/ACCOUNTS.md:67` | detail 形补 `kept?`/`removed?`（节点删除行计数） |
| 11 | `docs/server/design/sandbox/SANDBOX.md:46` ∥ `:50–51` ∥ `:291` | 自检引导步写明（① 无前缀版本读数 → ② 协商 → ③ 复读） |
| 12 | `docs/server/design/sandbox/SANDBOX.md:106` ∥ `docs/server/design/ops/OPS.md:250` | 宿主前提（`sshpass` 缺 ⇒ S2 停 + 报因——检查并报） |
| 13 | `docs/server/design/webui/WEBUI.md:534` | 弹窗字段单补 S5 预告知句（既有容器短暂中断） |
| 14 | `docs/server/design/agent/ADMIN-AGENT.md:51` | 指针写全 ⇒ `PROJECT.md` §9 R53③ |

- **#2** = 需求档（父侧直改）——不在本件射程。
- **同族收正（单列披露）**：`docs/server/design/agent/ADMIN-AGENT.md:61`（「构建/发布形复核 = §9 上抛」——同一空指针病灶）同改指 `PROJECT.md` §9 R53③（评审建议「指针写全」直接导出项）。
- **机检复跑（`node scripts/doc-check.mjs`——读数原文）**：汇总 = 候选 56632 · **悬空 5** · 注记豁免 303 · **拟新增 42** · 迁移期引文 338 · 声明源缺位 0；`FAIL(锚)` = 5 条（与基线同值——1 条 `API-CONTRACT.md:2011` + 4 条 mount-settings-team 族，均非本批面；本件新增 2 条已收正）∥ `FAIL(行宽)` = 1 行 = `docs/server/requirements/PROJECT.md:12`（386 字符——需求档/父侧面，非本件笔）。
- **零新语义**（评审发现直接导出项 + 同族指针收正）；七档变更记录各附一行（SANDBOX :318 ∥ PROJECT :611 ∥ WEBUI :775 ∥ OPS :406 ∥ ACCOUNTS :235 ∥ ADMIN-AGENT :98 ∥ STORE :410）。
- 拆分预案候选档以「拟新增」标记入列（拟新增 41 ⇒ 42——列报面，不入机检闸）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审 —— runner-admin-console 批（三件：设计档随正 #1252 ∥ 最小切片 #1251 四件事 ∥ 托管接入 #1236/#1237）** · 评审面 = 十档（ADMIN-AGENT ∥ SANDBOX ∥ API ∥ STORE ∥ ACCOUNTS ∥ WEBUI ∥ OPS ∥ design/PROJECT ∥ EVOLUTION ∥ requirements/PROJECT）；限制：无独立项目标准档/文档地图声明——归属口径按设计集内文档地图（`design/PROJECT.md` §3）判。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🔴 | 同一机制两处不同口径：`thincoder/docs/server/design/sandbox/SANDBOX.md:13` 载「探活/超时/快照 = 控制端（server）自己的定时器」，与 `SANDBOX.md:47`「运行面/列表读数 = 请求内现打（并发；无后台定时器 ∥ 无心跳机制——§14 KD-SV-80）」及 `SANDBOX.md:290` KD-SV-80 行「无后台定时器 ∥ 无心跳落库」相抵——节点探活（存活）机制两说（定时器 vs 读时现打）。 | 消除二说：§1 该分句收窄到盒级超时/快照（控制端驱动、余面批），去掉/改写「探活」表述，与 KD-SV-80 读时探活口径对齐；历史归变更记录。 |
| 2 | Requirements | 🟡 | 需求陈句与现设计相抵：`thincoder/docs/server/requirements/PROJECT.md:12`「**runner 无需入向端口**（14:59 裁在册）」vs `SANDBOX.md:52`「节点机 Docker 引擎须监听 TCP」（`tcp://0.0.0.0:2375`）与 `thincoder/docs/server/design/ops/OPS.md:247`「server 机 → 节点 `:2375` 网络可达（安全组/防火墙面）」——19:52「runner = 远程 Docker API 节点」口径后该句已陈。 | 登记为需求档回笔项（方向：把「无需入向端口」限定为公网口径、明记节点机 Docker API 监听限内网/安全组可达），与既有回笔清单（`design/PROJECT.md` §9 R52①/R53②）同拍。 |
| 3 | Doc hygiene | 🟡 | 失效表达式留在现面：`design/PROJECT.md:160`–`:162`/`:171`/`:173`（§4 索引）与 `:191`（§5）、`SANDBOX.md:276`–`:278`/`:287` 的「**作废**（2026-10-10——执行面重定：runner = 远程 Docker API 节点）」五行尸标仍居决策面。 | 按「失效表达式不留现面」删净该五行（历史 = 变更记录已有「⇒ 作废」条目；编号留空档即可）。 |
| 4 | Affected-file size | 🟡 | 越 500 软线无拆分预案：`SANDBOX.md:252` 载 `routes.mjs`「（已落盘 **407**——2026-10-10 现读）⇒ **≈540**」（+≈133），托管接入再 ±≈5 ⇒ ≈545；全档仅对 `onboarding-routes.mjs` 写了「独立成档缘由」。 | §13 预算行补 routes.mjs 拆分预案（触发点/余量/候选拆法——如容器面路由独立成档），与 `registry.mjs` ≈500 落位说明同拍。 |
| 5 | Affected-file size | 🟡 | 同档注解相抵：`agent/ADMIN-AGENT.md:62`「`bin/thincoder-server.mjs` 装配行 ≈+2」vs `design/PROJECT.md:293`「`bin` ±0」与 `SANDBOX.md:263`「**±0**（注册面不变）」——`onboarding-routes.mjs` 四端点装配落点口径不一。 | 统一三处：定新端点注册路径（经 `routes.mjs` 转注册 ⇒ ±0；bin 直注册 ⇒ +≈2），其余两处随正。 |
| 6 | Document ownership | 🟡 | 键族登记与预算链相抵（同档两处）：`webui/WEBUI.md:125`「新增 ≈78 键」与 `:127` 链（zh admin ≈141 ⇒ **≈167**（运行面批）⇒ ≈201 ∥ en ≈145 ⇒ ≈171 ⇒ ≈205）未含托管接入 +≈30/表，而 `WEBUI.md:598`／`:603` 为「≈167（沙盒运行面批：+≈26 键）⇒ ≈197（托管接入增补：+≈30 键）⇒ ≈231」∥「≈171 ⇒ ≈201 ⇒ ≈235」。 | §2.2 登记补托管接入 ≈30 键一步（键计数与终值同拍），与 §5 链取齐。 |
| 7 | Document ownership | 🟡 | 页数计数相抵：`design/PROJECT.md:11`「侧栏分组导航十一页」与 `:67`「十一页两区（… 我的四页 ∥ 管理八页 …）」自抵（4+8=12）；对档 `WEBUI.md:83`「十二页」、需求 `requirements/PROJECT.md:63`「侧栏合计 ⇒ **十二页**」。 | 计数收正（十一 ⇒ 十二，或使分项与合计一致），三档同拍。 |
| 8 | Document ownership | 🔵 | v11 段 DDL 与实表差留档未销：`store/STORE.md:333` 旁注载 `sandbox_workspaces`／`sandbox_tasks`「两处列面仍与实表有差——随执行面重做批收正」；v12 仅重建 `sandbox_runners`（`STORE.md:328`「本段一次重建收正」）。 | 保持登记；§2 v11 两表定义处就近补同注（或 v12/v13 判据加「两表未随」行），免按 §2 列面直读实表。 |
| 9 | Affected-file size | 🔵 | 行数链未随正（跨档）：`OPS.md:120` 门禁链止「server-exec-sandbox 批两件入链 **+2 ⇒ 40**」，而 `design/PROJECT.md:320` 已列「runner-admin-console 批两件入链 **+2 ⇒ 42**」、`:295` 再「42 ⇒ **43**」；`OPS.md:265` Dockerfile 行亦未注本批 +≈3（`openssh-client`+`sshpass`）。 | 文档链两处随正（OPS §5.1 链 + §6 Dockerfile 行），沿「文档链随正」先例。 |
| 10 | Document ownership | 🔵 | 审计 detail 形面与用例不同步：`accounts/ACCOUNTS.md:67`（`sandbox_event` 行）形 = `{ kind, workspaceId? }`，而 `SANDBOX.md:63` 载「审计行（`runner_delete`；detail 携 kept/removed）」（N48 同断言）。 | `ACCOUNTS.md` §2.1 该行 detail 枚举补 kept/removed（或放宽形声明），与 SANDBOX 用例同拍。 |
| 11 | Clarity | 🔵 | 自检首调表述循环：`SANDBOX.md:50`「`GET <base>/<ver>/version` ⇒ 读 `{ Version, ApiVersion, MinAPIVersion, Os, Arch }` + 协商版本」——`<ver>` 由本次读数协商而来（KD-SV-81），首调前缀形未写明。 | §3／§14 KD-SV-81 处写明引导步（先取版本读数、再定前缀），免实现分叉。 |
| 12 | Feasibility | 🔵 | 密码认证前提只覆盖镜像侧：`SANDBOX.md:104`「镜像侧 = `Dockerfile` 加装 `openssh-client` + `sshpass`」；npm/裸机部署路（`OPS.md` §5.1）未注明宿主需 `sshpass`（缺 ⇒ 密码认证必败，报错面仅「认证被拒」）。 | 部署面注明前提或加检测（缺 ⇒ 明确报因），沿「检查并报」口径。 |
| 13 | Clarity | 🔵 | S5「表单预告知」无 UI 落点：`SANDBOX.md:92`「（既有容器短暂中断——表单预告知）」，`WEBUI.md:534` 托管弹窗字段单未列该告知行。 | §2.8① 弹窗字段单/提示句补该行（或注明实现自由落于窗内）。 |
| 14 | Clarity | 🔵 | 指针悬空：`ADMIN-AGENT.md:51`「出口代理旗随 provider 条目（复核点——§9）」——本档 §9 无该复核点；实际登记 = `design/PROJECT.md:539`（R53③）。 | 指针写全（指向 R53③ 或本档落点），免按 §9 空找。 |

计数：🔴 ×1 ∥ 🟡 ×6 ∥ 🔵 ×7（共 14）。

VERDICT: changes-required

### 轮次 2（评审子代理）

**runner-admin-console 批 · 复核轮 2（验证 §3 轮次 1 十四修正声明）** · 评审面 = 设计十档 + 批档 §2 修正块 14 处落点 + 父侧面三件（`requirements/PROJECT.md` ∥ `docs/TEST-ENV-ECS.md` ∥ 孤儿件实盘核）

| # | Orig# | File | Severity | Status | Notes |
|---|---|---|---|---|---|
| 1 | 1 | `design/sandbox/SANDBOX.md` | 🔴 | Fixed | :13 ——「**盒级超时/快照 = 控制端（server）自己的定时器（余面批——节点存活 = 读时探活，非定时器面：§14 KD-SV-80）**」；与 :47 ∥ KD-SV-80 两说消除 |
| 2 | 2 | `requirements/PROJECT.md` | 🟡 | Fixed（父侧） | :13 ——「**runner 无需公网入向端口**（14:59 裁在册——19:52「runner = 远程 Docker API 节点」口径后含义收窄：server → 节点 Docker API `:2375` 仅内网/安全组可达，节点不开任何面向公网的端口）」。记录面残余（:477/:485/:499/:512）照「记录面照旧」惯例不回改——advisory：:485 仍称「runner 侧无需任何入向端口——口径 = 用户 2026-10-10 19:52 定」，与节点须监听 TCP 的现设计相抵（非阻断，如父侧愿收可随余面批一笔回笔） |
| 3 | 3 | `design/PROJECT.md` ∥ `design/sandbox/SANDBOX.md` | 🟡 | Fixed | §4 索引 KD-SV-64/65/66/75/77 行与 §5 KD-SV-77 条删净（:159 起 63 ⇒ 67 跳档）；SANDBOX §14 同删；grep 全设计面零活面命中（余 = 变更记录行） |
| 4 | 4 | `design/sandbox/SANDBOX.md` | 🟡 | Fixed | :268 ——「`routes.mjs` 拆分预案（本批后越 500 软线——≈545）：**触发点** = 实施轮实读 > 500（越线即拆）；**拆后余量** ≈50…」候选 = 容器面独立成档（首选）∥ 节点面备选 |
| 5 | 5 | `design/agent/ADMIN-AGENT.md` ∥ `SANDBOX.md` ∥ `PROJECT.md` | 🟡 | Fixed | 三处同拍 = 四端点经 `sandbox/routes.mjs` 转注册（`bin` ±0）——ADMIN-AGENT :62 ∥ SANDBOX :254/:265 ∥ PROJECT :283/:287 |
| 6 | 6 | `design/webui/WEBUI.md` | 🟡 | Fixed | :127 ——「表体量：zh admin ≈141 ⇒ **≈167**（运行面批）⇒ ≈197（托管接入增补）⇒ ≈231（余面批） ∥ en ≈145 ⇒ **≈171** ⇒ ≈201（同拍）⇒ ≈235」；与 §5 链（:598/:603）取齐 |
| 7 | 7 | `design/PROJECT.md` | 🟡 | Fixed | :11「侧栏分组导航十二页」∥ :67「十二页两区（…我的四页 ∥ 管理八页…）」——与 WEBUI ∥ 需求同拍 |
| 8 | 8 | `design/store/STORE.md` | 🔵 | Fixed | :264 ∥ :299 两表定义处补注在册（列面差 = 去 `required_labels_json` ∥ 去 `claimed_at`——旁注 = v12 段） |
| 9 | 9 | `design/ops/OPS.md` | 🔵 | Fixed | :121 ——「⇒ runner-admin-console 批两件入链 **+2 ⇒ 42** ⇒ 托管接入增补件入链 **+1 ⇒ 43**））」；:267 Dockerfile「**⇒ ≈37（…+≈3 = `openssh-client` + `sshpass`…）**」 |
| 10 | 10 | `design/accounts/ACCOUNTS.md` | 🔵 | Fixed | :67 detail 形补 `kept?`/`removed?`（`runner_delete` 携计数——与 SANDBOX §3 ∥ §12 N48 同拍） |
| 11 | 11 | `design/sandbox/SANDBOX.md` | 🔵 | Fixed | :46/:50 ——「**引导步 = 先取无前缀版本读数、再定前缀**」+ 自检三步（无前缀读数 → 协商 → 复读）+ :291 KD-SV-81 同拍 |
| 12 | 12 | `SANDBOX.md` ∥ `OPS.md` | 🔵 | Fixed | SANDBOX :106 ∥ OPS :250——宿主缺 `sshpass` ⇒ S2 停 + 报因（检查并报） |
| 13 | 13 | `design/webui/WEBUI.md` | 🔵 | Fixed | :534 ——「**窗内预告知句**：开 API 监听需重启 Docker ⇒ 既有容器短暂中断（S5；`sandbox/SANDBOX.md` §3）」 |
| 14 | 14 | `design/agent/ADMIN-AGENT.md` | 🔵 | Fixed | :51 指针写全 ⇒ `PROJECT.md` §9 R53③（同族：:61「构建/发布形」指针同拍） |
| N1 | (new) | `design/PROJECT.md` | 🟡 | New | :12「（板 2 档 + 域 8 档——见 §2.1 ∥ §3）」与 :21「**九域 = gateway ∥ accounts ∥ metering ∥ store ∥ webui ∥ ops ∥ client ∥ sandbox ∥ agent**」/:77「## 3. 文档地图（板 2 + 域 9）」自抵（`EVOLUTION.md` :16「设计 = 板 2 档 + 域 9 档」亦 9）——应随正为「域 9 档」 |
| N2 | (new) | `design/PROJECT.md` ∥ `docs/batches/` | 🟡 | New | R52③ 登记「孤儿件 `docs/batches/2026-10-10-server-exec-sandbox-runner.fixtures.mjs`（实读核过零引用——随余面批清）」（:532）——实盘核：read ⇒ ENOENT ∥ glob `**/2026-10-10-server-exec-sandbox-runner*` 零命中 ∥ docs/batches `*fixtures*` 零命中；登记销项或文件缺失待核 |
| N3 | (new) | `docs/TEST-ENV-ECS.md` | 🟡 | New | §7 只见手工接线链（:118「③ 回控制台：「沙盒 → 运行面 → 添加节点」填 http://10.0.0.6:2375…」）；R53②「补「托管接入」跑法」未落（grep「托管」零命中）——协调项（父侧）；R52② 已落（:105「**无自驻进程**（旧 `thincoder-runner.service` 已清除…）」∥ :106 节点前置 ∥ :109–119 接线链） |
| N4 | (new) | `design/sandbox/SANDBOX.md` | 🔵 | New | :53 ——「步 = 父侧运维笔——`docs/TEST-ENV-ECS.md` §7 待补」陈（§7 已补节点接线链——TEST-ENV :109「**节点接线链（2026-10-10 修订——旧「装机链」随守护进程清除作废）**」）——指针随正 |

**计数**：🔴 ×0 ∥ 🟡 ×3（新）∥ 🔵 ×1（新）；轮次 1 十四项 = 逐号核过全数 Fixed（零 Unfixed）。
**结论**：零新 🔴、前轮 🔴 已收 ⇒ 不阻断批准。

VERDICT: pass

## §4 用户批准（主 agent）

### 用户批准（代签——2026-10-10 23:4x）

- **用户原话**（2026-10-10 22:18）：「赶紧自动跑完。」⇒ **自动跑授权**（含代点火 ∥ 代签 ∥ 派实施 ∥ 收口提交）；自缚三条：新范围 ∥ 要裁 ∥ 不可逆 ⇒ 停。已记 §1。
- **设计评审链**：轮次 1（#173）changes-required（🔴×1∥🟡×6∥🔵×7）→ 修正轮（#174，1∥3–14 全落）→ 轮次 2（#175）changes-required（四项新发现 N1–N4 + 引文核验失配）→ 修正轮（父侧直改 N1–N4）→ **轮次 3（#176）判过**，designToken 已发（运行态，值不入档）。
- **批准范围** = 本批三件（设计档随正 ∥ 最小切片四件事 ∥ 托管接入）——按 §2 设计集与各档 §13 预算实施；设计自加提议 ④–⑬ 随设计一并批准（如用户异议 ⇒ 另轮收正）。
- **实施派遣**：两派并行（服务面 ∥ 控制台面——文件域不交叠）；真机验收 = 10.0.0.6 端到端九步；收口 = 本档 §6。

## §5 实施记录（eng-coder）
**状态行**：实施完成 2026-10-11（fix 轮：Docker API 前缀 v 补齐——两件 11/11 ∥ 13/13 绿；终态 clean（审计/评审轮次见段内））



### 控制台面（沙盒页——运行面 + 容器区 + 托管接入）· eng-coder 记录（2026-10-11）

**交付摘要**（文件域 = 控制台面；与服务面 `src/**` 不交叠）：

- 新建 `thincoder-server/public/views-sandbox.mjs`（实读 **494 行**；软线 300 ∥ 顾问线 500 ∥ 硬限 800——线内）：运行面卡（可用性提示两态（无节点 ∥ 全离线——不整页禁用）+ 节点表六列 + 添加/删除节点弹窗）+ 容器区（节点行展开懒加载 ∥ 容器表四列 ∥ 启停删 ∥ 创建容器弹窗（镜像预填 = 设置读面））+ 托管接入弹窗（八字段 + S5 窗内预告知句 + 模型下拉源 = provider 注册表）+ 装机任务区（四列 ∥ 三态 ∥ 展开 = 详情面懒取步骤读数 ∥ 在途 3s 读时轮询定终态停 ∥ keep 态「撤销凭据」二次确认）。
- 随动五件：`nav.mjs`（管理 7 ⇒ **8**——sandbox 末位）∥ `app.mjs`（import + PAGES 行）∥ `i18n-{zh,en}-admin.mjs`（+81 键/表）∥ `i18n-{zh,en}-shell.mjs`（+`nav.page.admin.sandbox`；`err.upstream_error` 值改携 `{detail}`）∥ `style.css`（+`.badge`/`.badge.ok`/`.badge.off`/`.detail-row`/`.stack-box`/`.step-list` 六条；`input/select` 行扩 `textarea`；**零新 `:root` 变量/零新悬停**——AC-19 canon 附加腿复跑绿）。
- 新增批内件 `docs/batches/2026-10-10-runner-admin-console-ui.test.mjs`（8 腿：运行面 ∥ 添加节点两路 ∥ 删除节点三态 ∥ 容器区 ∥ 托管接入 ∥ 装机任务区 + 轮询 ∥ i18n 两表 ∥ 静态面）——**`node --test docs/batches/2026-10-10-runner-admin-console-ui.test.mjs`（自 `thincoder/` 仓根）= 8/8 通过**。
- `thincoder-server/package.json`：`prepublishOnly` +1 链目（本批 ui 件，单行清单行数零变）；姊妹两件由服务面批入链 ⇒ 链实读 **39 ⇒ 42**。

**决策透明表**（逐项均在交付报告披露；零静默改动）：

| # | 项 | 事实 | 定性 | 处置 |
|---|---|---|---|---|
| 1 | 键数 | 实读 +82/批（81 沙盒 + nav 1；两表终值 468 ∥ 473）vs 设计估 ≈26（运行面）+ ≈30（托管） | 估算漂移——逐键有一处 §2.8① UI 串背书，零死键、零越面 | 设计侧/§6 按实读回填（不阻断） |
| 2 | 行数 | views-sandbox 实读 494 vs 估 ≈210 ⇒ ≈285；ui 件实读 503 vs 估 ≈260 | 估算漂移（线内） | 余面批扩前定拆分触发点（沿 `routes.mjs` 预案同式） |
| 3 | 地址占位 | 取 `"http:\/\/10.0.0.6:2375"`（转义形；评估值 = 设计字面 `http://10.0.0.6:2375` 逐字同） | 非偏差：裸形受 `public/**` 零外部引用闸（链内实件扫面）；先例 = `proxy.uriPh` | 已收；`public/**` 全目录零命中复核过 |
| 4 | 任务读数源 | 列表面不携 `steps[].readings`（服务面实读 `onboarding.mjs` `steps: detail ? steps : steps.map(…)`）⇒ 展开须取 `GET …/onboarding/:id` 一次（步变重取） | 初版误读列表面；对账服务面实装后正 | 已修 + 批内件 ⑥ 锁形（懒取一次 ∥ 对象读数逐键 ∥ 失败 ⇒ fail 收口零假造） |
| 5 | 可用性提示判据 | 后端总态 ∪ 行态自推（`runners.every((runner) => runner.online !== true)`） | 防御式读（防服务面总态词表口径差；行态即真相） | 已披露 |
| 6 | 门禁链旧件 | ≥15 件批外旧件的档目/名册、nav 项数、键数与链件数断言现态必红（本批改动即触发源） | **不属于本派文件域**——设计载「随正件（父侧落——实施轮同拍）」 | 已上抛（附逐件目标值清单）；本派未动批外档 |
| 7 | 承载工作区面 | 删节点调用不带 `confirm: true`（API §2.5 行要求；工作区面 = 余面批，本切片不可达） | 潜在缺口（本派不擅加语义） | 已上抛待裁 |

**审计与代码评审轮次与终态**：

- 内部偏差审计（explore ∥ 只读）轮 1：**VERDICT divergence found**——四发现：①键数 81 vs 估 ≈56（裁定 = 估算漂移，非范围爬行）②行数 494 vs 估 ≈285（🟡，线内）③地址占位省形（我收正为转义形——与设计字面逐字同）④任务读数源存疑（对账服务面实装 ⇒ 详情面懒取，已修）。OUT-OF-LIST = 零。
- 内部代码评审（advisor ∥ code）轮 1：**VERDICT changes-required**——🔴 = 批外旧件随正（父侧范围，已列清单上抛）∥ 🟡 = 承载工作区 `confirm` 面（上抛待裁）∥ 🟡 = 占位形（已以转义形收口 ⇒ 设计档无需随正）∥ 🔵 = 估算漂移（本表已录）。
- fix 轮（本派，1 轮）：占位两表转义形落地 ∥ 批内件线称收正（顾问线 500 ∥ 硬限 800）∥ 复跑 = 自件 8/8 绿 + `public/**` 零外链全扫零命中 + AC-19 canon 附加腿绿。
- **终态 = `clean`（本派文件域内）**；悬项两项（链随正清单 ∥ 承载工作区 confirm 面）= 父侧/用户裁。

### 服务面 + 托管接入面实施记录 · eng-coder（2026-10-10）

**交付摘要**（文件域 = `thincoder-server/src/sandbox/**` ∥ `src/agent/**` ∥ `src/store/db.mjs` ∥ `Dockerfile` ∥ `package.json` ∥ 两批内件；与并行前端派 `public/**` 零交叠）：

- 新增 7 档：`src/sandbox/docker.mjs`（187）∥ `src/sandbox/ssh.mjs`（215）∥ `src/sandbox/container-routes.mjs`（169——§13 拆分预案①）∥ `src/sandbox/onboarding.mjs`（373）∥ `src/sandbox/onboarding-routes.mjs`（103）∥ `src/agent/run.mjs`（138）∥ `src/agent/tools.mjs`（289）。
- 改动 5 档：`src/sandbox/registry.mjs`（522 ⇒ 468——runner 面重写 ∥ `runnerHealth` 删 ∥ `sweepStuckTasks` 去心跳判据 ∥ 队列/心跳死件不动）∥ `src/sandbox/routes.mjs`（407 ⇒ 494——+添/删节点、运行面读时探活；删 drain 路由；容器四路由 ∥ 托管接入四端点转注册）∥ `src/store/db.mjs`（365 ⇒ 410——v12 重建 ∥ v13 建表）∥ `Dockerfile`（+3：openssh-client ∥ sshpass）∥ `package.json`（`@thincoder/core ^0.10.4` 依赖 + 门禁链入两件）。
- 零触（声明）：`bin/thincoder-server.mjs` ±0（四端点经 `routes.mjs` 转注册）∥ `src/gateway/errors.mjs` ±0（零新码）∥ `public/**` 不属本派。
- 批内件两件：`docs/batches/2026-10-10-runner-admin-console.test.mjs`（491）∥ `docs/batches/2026-10-10-runner-admin-console-agent.test.mjs`（632）；跑法 `node --test <件>`（自 `thincoder/` 仓根）。

**验收读数**（本机实跑）：服务面 11/11 绿（N40 ∥ E34 ∥ B42 ∥ B41 ∥ N46 ∥ E35 ∥ N47 ∥ E36 ∥ N48 ∥ B43 ∥ v12 六条）∥ 托管接入面 13/13 绿（N49+N53 ∥ N50+N51 ∥ N52 ∥ B44 ∥ B45 ∥ E37 ∥ E38 ∥ E39 ∥ B47 ∥ B46 ∥ 腿 F ∥ v13 六条 ∥ 腿 E 链自检）。**不跑全仓套件**（父侧收口跑一次）；**真机面未跑**（`10.0.0.6` ∥ 无 Docker 机 = 收口轮）。

**决策透明表（设计留白形 + 我地盘内的定夺；逐条理由）**

| # | 项 | 决定 | 理由 / 出处 |
|---|---|---|---|
| 1 | 步骤日志机制（N49 断言面） | 工具调用携可选 `step`（S1–S8）入参 ⇒ 工具层把该步读数写 `steps_json`；S3 定策句由 driver 从模型纯文本回合捕获（要求此前已有工具调用）；S1/S8 由 driver 写 | 设计只钉「步骤表 + 读数面」，未钉落点机制；任务模型 = 模型驱动五工具环（KD-SV-83 非固定脚本）⇒ 步骤归属只能由调用自带 |
| 2 | `step` 列语义 | 成功面 = `report.step`（通常 S8）；失败面 = 停在哪步（S2/S3/S6…）；S8 收尾条目入 `steps_json` 但不覆盖「停步」 | 控制台/审计要答的是「停在哪步」；收尾条目属读数明细而非停点 |
| 3 | 核装载（KD-SV-78/82） | `run.mjs` 运行期 `import("@thincoder/core/provider/index.mjs")` 取 `chat`；批内件经 `chat` 注入口替身 ⇒ 测试零依赖核 | `workspace` 内 server 无 `node_modules`（实读）——静态 import 会破坏启动/测试；依赖声明已钉 `^0.10.4`（与 CLI 同形） |
| 4 | `routes.mjs` 越 500 软线 | 容器面独立成档 `container-routes.mjs`（§13 预案①）；托管接入四端点再独立 `onboarding-routes.mjs`；`routes.mjs` 收至 494 | §13 明文预案；拆后仍余 510 ⇒ 进口块折行收至 494（零语义改） |
| 5 | 容器面错误映射细化 | 创建面：引擎 404/409 ⇒ 400 携引擎原文；动作面：404 ⇒ 404 `not_found`，余（含 409）⇒ 502 | API §2.5 两行分述（创建行 vs 动作行）；README 头注同拍 |
| 6 | 工作区视图字段 | `runnerHealth`（心跳派生）⇒ `runnerStatus`（新模型无心跳）；`descriptorOf` 随标签/容量放置退场删除 | 心跳面已废（KD-SV-80）；字段语义按新模型取直 |
| 7 | 凭据纪律落点 | `sshpass -e`（口令经 env，不入 argv）∥ key 文件 0600 ∥ sudo 口令经 stdin ∥ 指纹变更 ⇒ `forgetHost` 清 stale（重交任务 = 重新信任）∥ 中断收尾同清 key 文件 | KD-SV-84/85；「免人工翻 known_hosts」= 提议⑬；口令路径与 argv 断言在批内件（`:242-245`） |
| 8 | 0600 断言的平台面 | 批内件在非 win32 断言 `credentials.key` 0600，win32 只断言在场 | Node 无 POSIX 位面（本机 win32）——0600 归 Linux 容器面 |
| 9 | 门禁链入件 | 入我两件（+ UI 件已在位，实读三件全在场 = 42 件） | 设计链 40 ⇒ 42 ⇒ 43；盘面实读 42（见下「设计档漂移」） |

**审计与评审轮次与终态**

- **内部偏离审计（explore，只读，1 轮）**：24 条 N/B/E 判据 + v12/v13 迁移判据逐条对位；`OUT-OF-LIST = 0`；发现 4 项低危（F1 步骤日志 stdout/stderr 未过掩蔽 ∥ F2 动作面 409 误归 400 ∥ F3 `routes.mjs` 511 行越软线 ∥ F4 设计档 `ACCOUNTS.md:67` 写入点指针陈）。**自修 3 项**：F1（`mask(stdout/stderr)`）∥ F2（动作面余项 ⇒ 502）∥ F3（进口折行 ⇒ 494）。F4 属设计档面，按纪律列报不改。
- **内部代码评审（advisor，2 轮）**：轮 1 全档评审（14 档 + 6 设计档）——12 行 findings（🟡 4 ∥ 🔵 8），**零 🔴**，判据面 24 条 + 迁移判据逐条有落点；**修 2 项 🟡**：`dockerClientFor` 失败不入缓存（陈旧 rejection 拦住自愈重试——腿 F 锁）∥ `resumeInterrupted` 同清在途私钥文件（用完即弃不含中断径——B46 扩展锁）。轮 2 fix 核验：两项 = Fixed（路径逐字对位 ∥ 断言有鉴别力），新问题扫描零。
- **终态 = clean**（审计/评审发现全部收敛：修 5 项 ∥ 列报 2 项设计档面）。**未修列报（不阻断，父侧裁）**：agent 批内件 632 行（顾问线——未越 800 硬限）∥ 删节点不可达 + keep 径 `kept/removed` 报 0（实况未知 ⇒ 读数措辞面，批内件 `:283` 锁值为损止值）∥ `appendStep` 时钟未走注入缝 ∥ docker/register/verify 的 `endpoint` 不绑 `host`（无围栏设计内，口径留口子）∥ `report` 调用一失败即收口 ∥ 死件引已删列（设计明载不动）。
- **本机实跑证据**：两件 11/11 + 13/13（命令与读数见上）；`bin`/`errors.mjs` 零触为内容核（无 git 面）。

**[上抛·知会] 设计档漂移两处（非我文件域，列报不改）**：① `accounts/ACCOUNTS.md:67` 写入点仍列 `routes.mjs`（容器面已拆 `container-routes.mjs`）② `ops/OPS.md:120-121` 门禁链值「⇒ 43」与盘面实读 42 差 1（该链算术仍含已随守护进程清除删除的 server-exec-sandbox 批两件）。

**[上抛·知会] 前批遗留（父侧收口范围）**：门禁链内 ≥12 件批外旧件以 `[10, 10]` 硬断结构版本（如 `docs/batches/2026-10-06-console-completeness-2.test.mjs:152` ∥ `2026-10-09-server-console-config.test.mjs:383` ∥ `2026-10-10-team-login-client-access.test.mjs:284`）——v11 起即已失效，v12/v13 后更必红；本批未改（非本批文件域），父侧收口跑前需处置。

**施工中上抛并已解的两条**：① `@thincoder/core` 依赖声明（R53③「实施轮定」）——已落 `^0.10.4`；② 步骤日志机制（同上表 #1）。

### 收口同步轮（陈旧断言随正 · 46 红）· eng-coder（2026-10-11）——**受阻：跨批写门禁（终态 stalled）**

**一句话**：46 处随正 —— **0 处落笔**。系统「跨批写门禁」机械拒绝本子代理写任何非本批档；红单 26 档全属其他批。已上抛 ask 待裁（① 父侧执行清单 ∥ ② 解绑/换绑后重派 ∥ ③ 认定跨批件归父侧）；逐件清单随录于下（行号 = 本刻实读、未受后续写影响）。

**门禁原文**（实测 7 档 × edit ∥ apply_patch 全 refuse——console-completeness-2 ∥ console-list-style ∥ server-gateway ∥ team-login-client-access ∥ server-small-fixes ∥ server-console-config ∥ console-list-style）：
> cross-batch batch-record write: this child is bound to 2026-10-10-runner-admin-console.md; `<file>` belongs to a different batch. Write only your own bound record and its companion files; the parent agent handles other batch records.

**处置依据**：「授权口径 ≠ 门禁绕行——两者相抵 ⇒ 停下上报、不得绕」（含 bash 旁路在内零尝试）；另：本批三件（`…runner-admin-console{,-agent,-ui}.test.mjs`）∥ `src/**` ∥ `public/**` ∥ 设计/需求档 = **全数零触**（未动）。

**目标值（盘面实读——供父侧逐件核对）**
- `SCHEMA_VERSION` / 迁移链尾 = **13**（`thincoder-server/src/store/db.mjs` 13 段）；「空库直落 ∥ 旧库自动升 ∥ 幂等 ∥ migrate 返回值」各断言一律 **13**。
- i18n 键数 = **468 ∥ 473**（en `.one` ×7）；指纹 **zh = `a053d2b62d3a3935c97237a5b9091e91da0038c82e3fa4a87c135658b3513eff`** ∥ **en = `5f3f9aebebfaa349a2093c1ab1f4f903d142ef6207a4776c78349ee92b2ac60d`**（公式 = 批内件原式：sorted keys → `[[key, value]]` → JSON → sha256）。
- `public/` 档目 = **32 ∥ 31**（全目录含 favicon=32 ∥ UI 代码档=31；新增 `views-sandbox.mjs`，排序位 = `views-providers.mjs` 后）。
- nav 管理 = **8**（末位 `/admin/sandbox`；labelKey `nav.page.admin.sandbox`；labelKey 总数 = 组 2 + 项 11 = **13**）。
- 门禁链 = **42** 件（`thincoder-server/package.json` prepublishOnly；39 ⇒ +3 本批件）。
- 审计型 = **12**（`+sandbox_rule` ∥ `+sandbox_event`）；console 审计下拉仍十型（`sandbox_*` 标签随沙盒余面批）。本档九写入点面（②）不受影响。
- `err.upstream_error` = 「上游服务出错：`{detail}`」——`mapError` 已按参数码传 `detail`（渲染 = 模板替换后的句）。
- dependencies = `{ "@thincoder/core": "^0.10.4" }`（本仓包——KD-SV-78；import 扫描**例外项**）。
- 家族计数零变：`vector.` 26 ∥ `health.` 10 ∥ `overview.` 8 ∥ `usageReport.` 14 ∥ `audit.` 29——**不需改**。

**逐件清单（26 档 / 46 断言点；`⇒` = 旧值 ⇒ 新值；【】= 同族字样收正）**

1. `2026-10-06-console-completeness-2.test.mjs`：:146 题「空库直落 10…九型 CHECK」⇒「13…十二型 CHECK」∥ :7/:150「九型 CHECK」⇒「十二型 CHECK」∥ :152 `[10, 10]`⇒`[13, 13]` ∥ :157 `length, 10)`⇒`12)` ∥ :162 `retentionDays: 2 }), 10)`⇒`12)` ∥ :167/:173/:175 升 10⇒13（`[1, 10]`⇒`[1, 13]`）∥ :236 过滤「!== "config_update"」⇒「!["config_update","sandbox_rule","sandbox_event"].includes(name)」∥ :436 `[31, 30]`⇒`[32, 31]`+msg「全目录 32 ∥ UI 代码档 31（2026-10-10 沙盒运行面批 +1）」∥ :440 名单 +`views-sandbox.mjs` ∥ :459 `AUDIT.AUDIT_TYPES` 过滤 +「!name.startsWith("sandbox_")」∥ :470/:473「管理 8」+ 数组 +`/admin/sandbox`
2. `2026-10-06-console-list-style.test.mjs`：:234/:236「三十九件」⇒「四十二件」∥ :238 `39`⇒`42`+msg「（二十二 ⇒ 四十二——… ∥ 10-10 沙盒运行面批三件入链）」∥ :206 `[31, 30]`⇒`[32, 31]`+msg ∥ :210 名单 +`views-sandbox.mjs`
3. `2026-10-06-console-modals.test.mjs`：:10/:386/:388「管理 7」⇒「8」∥ :391 数组 +`/admin/sandbox` ∥ :402/:404「档目 30 ∥ 31」⇒「31 ∥ 32」∥ :406 `[31, 30]`⇒`[32, 31]`（注「代理回迁批 −1」⇒「沙盒运行面批 +1」）∥ :410 名单 +`views-sandbox.mjs`
4. `2026-10-06-console-provider-redo-runtime.test.mjs`：:294 `[31, 30]`⇒`[32, 31]`+msg ∥ :298 名单 +`views-sandbox.mjs`
5. `2026-10-06-console-provider-redo.test.mjs`：:312/:328 `includes(ZH["err.upstream_error"])`⇒`includes(fill(ZH["err.upstream_error"], { detail: "upstream boom" }))`（该件 :30 已有 `fill` 助手）
6. `2026-10-06-console-providers.test.mjs`：:400/:401/:424「静态三十档（含 favicon 共三十一档）」⇒「静态三十一档（含 favicon 共三十二档）」∥ :402「管理 7」⇒「8」∥ :405 数组 +`/admin/sandbox` ∥ :426 名单 +`views-sandbox.mjs`
7. `2026-10-06-models-config.test.mjs`：:218 `[31, 30]`⇒`[32, 31]`+msg ∥ :222 名单 +`views-sandbox.mjs`
8. `2026-10-06-server-auto-update.test.mjs`：:480 `39`⇒`42`+「三十九件」⇒「四十二件」∥ :484 题「dependencies 空」⇒「dependencies 仅 @thincoder/core（本仓包——KD-SV-78）」∥ :496 扫描 +`|| spec.startsWith("@thincoder/core")` ∥ :497 `{}`⇒`{ "@thincoder/core": "^0.10.4" }` ∥ :9/:439 头注「三十四件」⇒「四十二件」
9. `2026-10-06-server-gateway-webui-deploy.test.mjs`：:272 题「三十档在册（含 favicon 共三十一档）」⇒「三十一档在册（含 favicon 共三十二档）」∥ :274 名单 +`views-sandbox.mjs` ∥ :319 `{}`⇒`{ "@thincoder/core": "^0.10.4" }`
10. `2026-10-06-server-gateway.test.mjs`：:9 头注「八表 + 六索引 + user_version=9」⇒「十六表 + 六索引 + user_version=13」∥ :12 头注「dependencies 空」同拍 ∥ :164 题同 :9 措辞（=13）∥ :167/:168 ⇒13 ∥ :170 表名单 +8 表（`sandbox_workspaces` ∥ `sandbox_rules` ∥ `sandbox_pending` ∥ `sandbox_tasks` ∥ `sandbox_checkpoints` ∥ `sandbox_settings` ∥ `sandbox_runners` ∥ `sandbox_onboarding`）∥ :186/:201/:208 ⇒13 ∥ :205 probe `{ v: 11 … v11_probe`⇒`{ v: 14 … v14_probe` ∥ :207 `/迁移失败（v11）/`⇒`（v14）` ∥ :209 `v11_probe`⇒`v14_probe` ∥ :380/:394/:397 依赖面三处（题 ∥ 扫描例外 ∥ deps 值）
11. `2026-10-06-server-i18n.test.mjs`：:125 名单 +`views-sandbox.mjs` ∥ :164 `12`⇒`13`+msg「组 2 + 项 11 = 13 个 labelKey（十一页 + 两组）」∥ :222 注 ⇒「参数码携 {detail}」∥ :227 参数支 +`|| code === "upstream_error"` ∥ :228 msg「应句末附服务端原文」⇒「应附服务端原文」
12. `2026-10-06-server-presets.test.mjs`：:331 题 ⇒「dependencies 仅 @thincoder/core（本仓包——KD-SV-78）」∥ :345 扫描 +例外 ∥ :348 `{}`⇒`{ "@thincoder/core": "^0.10.4" }`
13. `2026-10-07-console-layout.test.mjs`：:16 头注「三十四件」⇒「四十二件」∥ :447 题同拍 ∥ :449 `39`⇒`42`+msg 链 +「10-10 沙盒运行面批三件入链」
14. `2026-10-07-me-keys-redo-ui.test.mjs`：:391 `[31, 30]`⇒`[32, 31]`+msg
15. `2026-10-07-me-keys-redo.test.mjs`：:117 题「空库直落 10 ∥ v7 库升 10」⇒13∥13 ∥ :120 `[10, 10]`⇒`[13, 13]`+msg「空库直落 v13」∥ :144 `10, "v7 库升后读数 10"`⇒`13, "…13"` ∥ :157 `migrate(db), 10`⇒`13`
16. `2026-10-07-me-usage-charts.test.mjs`：:12 头注 ⇒「四十二件」∥ :259 题同拍 ∥ :262 `39`⇒`42`+msg
17. `2026-10-07-provider-model-metadata.test.mjs`：:18 头注「门禁链 30 件」⇒「42 件」∥ :148 题 10⇒13 ∥ :151 `[10, 10]`⇒`[13, 13]` ∥ :168/:171 ⇒13 ∥ :383 `[ZH["err.upstream_error"], false]`⇒`[fill(ZH["err.upstream_error"], { detail: "boom" }), false]`（该件 :316 已有 `fill` 助手）∥ :462 题「门禁链 38 件」⇒「42 件」∥ :482 `[31, 30]`⇒`[32, 31]`+msg ∥ :489 注 38⇒42 ∥ :491 `39`⇒`42`+msg
18. `2026-10-07-quota-per-model.test.mjs`：:19 头注「三十四件」⇒「四十二件」∥ :147 题「空库直落 10（链尾——配置控制台批后）∥ v4 库自动升 10」⇒「空库直落 13（链尾）∥ v4 库自动升 13」∥ :150 `[10, 10]`⇒`[13, 13]` ∥ :180/:193 ⇒13 ∥ :440/:442 题「三十九件」⇒42 ∥ :444 `39`⇒`42`+msg
19. `2026-10-07-quota-v2-member-models.test.mjs`：:24 头注「三十件」⇒「四十二件」∥ :164 题 10⇒13 ∥ :167 `[10, 10]`⇒`[13, 13]` ∥ :184/:188 ⇒13 ∥ :424/:426 ⇒42 ∥ :428 `39`⇒`42`+msg ∥ :730 `[31, 30]`⇒`[32, 31]`+msg
20. `2026-10-08-server-public-structure.test.mjs`：:7 头注链尾 ⇒「（键数 468 ∥ 473）」∥ :50 注 +「⊕ 2026-10-10 沙盒运行面批（+82 键；键数 468 ∥ 473）」∥ :52 `ANCHOR.zh`⇒`a053d2…3513eff`（全串）∥ :53 `ANCHOR.en`⇒`5f3f9a…2b2ac60d`（全串）∥ :59 题 +「⊕ 10-10 沙盒运行面批〔+82 键〕」（键数 468 ∥ 473）∥ :62 `386`⇒`468`+msg ∥ :63 `391`⇒`473`+msg
21. `2026-10-09-console-proxy-page.test.mjs`：:12 头注「管理 7」⇒8 ∥ :444 题「管理 7 项」⇒8 ∥ :447 `[3, 7]`⇒`[3, 8]`+msg「我的 3 ∥ 管理 8（2026-10-10 代理回迁批 −1 ∥ 沙盒运行面批 +1）」∥ :448 末项⇒`["sandbox", "/admin/sandbox", "nav.page.admin.sandbox"]`+msg「管理末项 = 沙盒」
22. `2026-10-09-server-console-config.test.mjs`：:11 头注「空库直落 10 ∥ v9 库自动升 10」⇒13∥13 ∥ :380 题「空库直落 10…链尾 v10」⇒「13…链尾 v13」∥ :383 `[10, 10, 10]`⇒`[13, 13, 13]` ∥ :384 msg「事件目录十型」⇒「十二型（含 config_update）」∥ :394 题「自动升 10」⇒13 ∥ :406/:412/:417 ⇒13 ∥ :514 扫描 +例外 ∥ :517 msg +「例外 = @thincoder/core——本仓包，KD-SV-78」
23. `2026-10-09-server-gemini-openai-preset.test.mjs`：:9 头注「空库直落 10 ∥ v8 库自动升 10」⇒13∥13 ∥ :260 题「空库直落 10…迁移链尾 = v10」⇒13 ∥ :263 `[10, 10]`⇒`[13, 13]` ∥ :267 `at(-1).v, 10`⇒`13` ∥ :271 题「自动升 10」⇒13 ∥ :279/:281 ⇒13
24. `2026-10-09-server-model-alias.test.mjs`：:399 题「（v10 结构零动）」⇒「（结构零动）」∥ :408 `10, "结构版本保持 v10…"`⇒`13, "结构版本 = 链尾 v13（零迁移——STORE §3）"` ∥ :686 `[], "dependencies 保持空"`⇒`["@thincoder/core"], "dependencies 仅 @thincoder/core（本仓包——KD-SV-78）"`
25. `2026-10-10-server-small-fixes.test.mjs`：:8 头注「键数 386 ∥ 391（…回迁批 −3 键）」⇒「468 ∥ 473（…；后随回迁批 −3 ∥ 沙盒运行面批 +82）」∥ :68 题「（386 ∥ 391——…）」⇒「（468 ∥ 473——沙盒运行面批 +82）」∥ :74 `386`⇒`468`+msg ∥ :75 `391`⇒`473`+msg
26. `2026-10-10-team-login-client-access.test.mjs`：:15 头注「十型零增」⇒「十二型（本批零增）」∥ :256/:258 同拍 ∥ :274 `10`⇒`12`+msg ∥ :283 题「结构版本 v10 不动」⇒「v13 不动」∥ :284 `10, "client 域零迁移（…v10）"`⇒`13, "…v13"` ∥ :291 ⇒13

**复跑口径**：`cd thincoder-server && npm run prepublishOnly`——改后必跑；若余红 = 首波断言遮蔽的次波同类点（期望值），按同一口径顺正；出现非同族红 ⇒ 停下上报（可能为真缺陷）。

**审计与代码评审轮次**：**0**（无落盘可审——写门禁未开；本轮「待审物」= 上列清单本身）。**终态 = `stalled`**（受阻 ∥ 非收敛）。

**决策透明表**

| # | 项 | 决定 | 理由 |
|---|---|---|---|
| 1 | 门禁 vs 任务书冲突 | 不绕行、立即上抛 ask（附完整清单） | 纪律：门禁优先、不得绕（bash 旁路零尝试） |
| 2 | 「档目 X ∥ Y」序号 | 已为「31 ∥ 32」者不动；只修陈值对（30 ∥ 31 ⇒ 31 ∥ 32） | 最小干预——序混用为先例既有、非本轮引入 |
| 3 | 断言消息序 | 沿本件既有「全目录 X ∥ UI 代码档 Y」形 | 各件自洽 |
| 4 | 门禁链消息 | 「（… ⇒ 四十二——… ∥ 10-10 沙盒运行面批三件入链）」 | 沿逐批增链先例 |
| 5 | `[10, 10]` 类 | 全数 ⇒ 13（链尾）——不分档 | 迁移链逐段单调；空库直落/旧库升皆达链尾 |
| 6 | gateway :192 EPERM | 非独立缺陷：断言失败级联（`second` 未 close 即 rmSync）——修版本 + probe v14 后自解 | 修 :201 读数 13 + probe v14；勿以「先 close」绕过 |
| 7 | 审计页「十型」 | 控制台下拉十型 = **现态正确**（`views-audit.mjs` 硬列十型）——只改 `AUDIT_TYPES` 计数/标签面 | `sandbox_*` 模板 = 余面批登记项 |

**父侧待办两件（若取径 ①）**：① 按上列清单落写 26 档（我侧无法落笔）；② 改后全链复跑一次（= 本任务验收）并回填本段。

**勘误（同轮）**：上段门禁实测计数收正 = **6 档 / 7 次**（`console-completeness-2` ∥ `console-list-style` ∥ `server-gateway` ∥ `team-login-client-access` ∥ `server-small-fixes` ∥ `server-console-config`；其中 `completeness-2` 另经 apply_patch 一试）——「7 档」为笔误。

### fix 轮：Docker API 版本前缀缺 v（真机走查唯一缺陷）· eng-coder（2026-10-11）

**交付摘要**（文件域 = 三档；与设计档 ∥ 其余 src ∥ 本批 ui 件零交叠；OUT-OF-LIST = 零——触碰面 = 任务书明列三档）：

- 缺陷（.6 真机实测）：`/version` = 200 ∥ `/v1.44/version` = 200 ∥ `/1.44/version` = 404——原码前缀拼成 `/<apiVer>`（缺 `v`）⇒ 带前缀调用全 404。
- 修复 = 前缀补 `v`（构造点 2 处）+ 两批内件同拍（期望 3 处 + 文案 1 处 + 剥离正则 1 处）；**零新语义**。

**落点表（file:line → 旧 ⇒ 新）**

| # | file:line | 旧 ⇒ 新 |
|---|---|---|
| 1 | `thincoder-server/src/sandbox/docker.mjs:110` | `` `/${apiVer}` `` ⇒ `` `/v${apiVer}` `` |
| 2 | `thincoder-server/src/sandbox/docker.mjs:147` | `` `${apiVer ? `/${apiVer}` : ""}/version` `` ⇒ `` `${apiVer ? `/v${apiVer}` : ""}/version` `` |
| 3 | `docs/batches/2026-10-10-runner-admin-console.test.mjs:211` | `"/1.44/version"` ⇒ `"/v1.44/version"` |
| 4 | 同上 `:214` | 同拍（文案「形式 /<ver>/...」⇒「/v<ver>/...」） |
| 5 | 同上 `:358`–`:360` | `/1.44/containers/…` 三处 ⇒ `/v1.44/…` |
| 6 | `docs/batches/2026-10-10-runner-admin-console-agent.test.mjs:90` | 剥离正则 `/^\/[0-9.]+/` ⇒ `/^\/v?[0-9.]+/`（与主件 `:62` 同形——不改则带前缀调用 404，腿 F 等必红） |

引导步（`apiVer=null` ⇒ 无前缀 `/version`）不变；设计档（`SANDBOX.md` §3 `v<ver>` ∥ KD-SV-81）已是正确形——实现对齐，设计档零触。

**复跑读数**（自 `thincoder/` 仓根——原文）：

- `node --test docs/batches/2026-10-10-runner-admin-console.test.mjs` ⇒ tests 11 ∥ pass 11 ∥ fail 0。
- `node --test docs/batches/2026-10-10-runner-admin-console-agent.test.mjs` ⇒ tests 13 ∥ pass 13 ∥ fail 0。
- 全仓套件不跑（父侧收口跑一次——本任务书明示）。

**审计与代码评审轮次与终态**

- 内部偏差审计（explore ∥ 只读）轮 1：**零偏差**——6 项逐条 ✅（构造点恰两处 ∥ 引导步无前缀 ∥ 两件期望/剥离全候新形 ∥ 旧形零活面残留 ∥ 越界零 ∥ 鉴别力：还原旧形主件必红）；3 条范围外披露（见下）。
- 内部代码评审（advisor ∥ code）轮 1：**VERDICT `pass`**，0🔴、零 must-fix；🟡×2（均 pre-existing/optional：`normalizeDockerAddress` 单冒号 scheme 判——主机名形输入被拒（我实测复现：`localhost:2375`/`runner-01:2375` ⇒ 400，话术自相矛盾）∥ agent 件 632 行超 500 行顾问线）🔵×3（agent 件零路径断言——自证力薄 ∥ 主件 info/create 腿无具形断言 ∥ `prefix()`/`version()` 空值口径不一）。
- fix round（本派自修）：**0**（审计零偏差、评审零必改；🟡 均前置遗留——动即越「只改前缀形、零新语义」射程）。
- **终态 = `clean`**（修复射程内）。

**决策透明表**

| # | 项 | 决定 | 理由 |
|---|---|---|---|
| 1 | agent 件同拍内容 | 只改剥离正则，不加新断言 | 修正后带前缀调用须被剥离；加断言 = 新语义（超射程）——列报 |
| 2 | advisor 🟡×2 ∥ 🔵×3 | 全数不改、列报 | 均前置遗留或增强建议——本任务书「只改前缀形、零新语义、只动三档」明令 |
| 3 | 旧形残留 | 全仓 grep `/1.44`（mjs/cjs/js/md/json/css/html）：仅设计档两处真机证据行（旧形 = 404 反例记录——正确陈述） | 零活面残留 |
| 4 | `routes.mjs:7` 头注 `<ver>` 陈写法 | 不动、列报 | 禁改其余 src 档 |

**披露（范围外——交父侧/另轮）**：① `normalizeDockerAddress` 主机名形输入被拒（实测复现；设计「缺协议补 http://」vs 实现单冒号 scheme 判分叉——仓内先例 `thincoder-core/team.mjs:50` 用 `://` 形）；② 批档 §2 `:180` 仍写 `GET <base>/<ver>/version`（与设计档 `v<ver>` 滞后）；③ `routes.mjs:7` 头注 `<ver>` 同族；④ `SANDBOX.md:93` S5 判据形（`v<ver>`）vs `onboarding.mjs:34/:355` 探活实形（无前缀 `/version`——真机两形皆 200，功能无碍）；⑤ `SANDBOX.md` 变更记录无本次修复行（`:46/:291` 有 2026-10-11 实机核实注）。

## §6 验证与收口（父代理）

## 验证与收口（2026-10-11——进行中：真机重走待环境项）

### 交付（三件全落）
- ① 设计档随正：设计集（10 档 + agent 新档）——评审三轮（#173 → #175 → #176）判过，designToken 已发（运行态，值不入档）。
- ② 最小切片：节点增删（连通自检通过才落库 ∥ 失败 502 零落库 + 审计；删除 keep/remove + 承载工作区 `confirm`；连删败 ⇒ 502 行留）∥ 容器四路由（304 ⇒ 幂等成功 ∥ 卷不随删）∥ v12 迁移（表重建，存量弃）。
- ③ 托管接入：管理面 agent（进程内 ∥ 工具面五件无围栏 ∥ 逐调用审计 ∥ 预算 60 调用/20 分钟）∥ SSH 执行面（`sshpass -e` ∥ 指纹 TOFU）∥ onboarding S1–S8 三径 ∥ 凭据 AES-256-GCM + `data/credentials.key` 0600 ∥ v13 迁移。

### 验证读数
- 批内件三件：**11/11 ∥ 13/13 ∥ 8/8 全绿**（共 32 条）。
- **全仓套件（`prepublishOnly` 42 件链）：379/379 绿 ∥ 0 红**——收口同步轮修正 26 档陈旧断言（v10/v11 时代漂移 + 本批计数：schema ⇒ 13 ∥ i18n 键 468/473 + 指纹重算 ∥ 档目 32/31 ∥ nav 管理 8 ∥ 门禁链 42 ∥ dependencies 仅 `@thincoder/core`）。
- 部署（.5）：镜像重建 `0745b50b024d`（回滚锚 `pre-2026-10-11`）；探针 = healthz **200** ∥ client/me **401** ∥ client/login **400** ∥ 新路由在册（非 404）。
- 真机走查（浏览器实走）：登录 ⇒ 沙盒页渲染（导航八项含沙盒 ∥ 两钮在册）⇒ 添加节点表单 ⇒ **自检如实失败**：「上游服务出错：连通自检失败：节点响应超时（3000ms）」——**环境项**：.5 → .6:2375 被安全组拒（ping ✓ ∥ 22 ✓ ∥ 2375 拒；.6 本机 ufw inactive ∥ INPUT ACCEPT）。**卡点 = .6 安全组入方向放行 2375（源 10.0.0.5）**——放行后重走即收口。

### 提交
- `63473edb`（实施 24 档 +4159/−219）∥ `6faf1079`（收口同步 30 档）——双推（gitee + github）。

### 账目
- #1251 ∥ #1252 ∥ #1237 ∥ #1236 → **在途**；#1260（条件：SG 放行后重走真机九步 + 核销四账）；#1259（删除节点「承载工作区 ⇒ confirm」UI 缺口——归批）。
- 披露：走查用临时管理员 `walker`（id=4）在 .5 库内（未删——如需可清）。

### 未收口原因
- 安全组放行动作在父侧手外（云控制台）——**放行 ⇒ 重走 ⇒ §6 补记 + 四账核销 ⇒ 收口**。
