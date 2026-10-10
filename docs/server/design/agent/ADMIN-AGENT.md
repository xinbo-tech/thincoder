# Thincoder Server · 管理面 agent（agent/ADMIN-AGENT）

> 板块 = server ∥ 本域 = agent（server 端 agent——管理面唯一 agent）；本档 = 域档。
> 口径单源 = `docs/server/requirements/PROJECT.md` §5 沙盒块「接入两径」行 + AC-36 ⑨⑩：执行者 = server 端 agent——探明主机实况 → 决定并执行必要操作 → 验证 → 报告（用户 15:00 裁）；能力面由设计轮从实际装机场景反推（15:02 裁——「先知道要干什么，再谈能力」）。
> 用户 2026-10-10 22:19–22:29 口径（逐字在批档 `docs/batches/2026-10-10-runner-admin-console.md` §1 口径补记 5/6）：工具面要有通用执行能力（bash/ssh 级——「不给bash/ssh会很麻烦」）∥ Docker 操作工具要给（「一些docker的操作工具不给他吗？」）∥ **唯一一个 agent**（「就是同一个agent，就是管里面的那个agent」——能力面 = 整个 server 管理面，逐步长）。
> 首个活 = 托管加机（机制全文 = `sandbox/SANDBOX.md` §3 托管接入块）；控制台归属 = `webui/WEBUI.md` §2.8①；核复用口径 = `PROJECT.md` §5 KD-SV-78。
> 建档：2026-10-10（批 `docs/batches/2026-10-10-runner-admin-console.md` §2 · 台账 #1237 + #1236）。

## 1. 形态与定位

- **一句话**：管理面 agent = **server 进程内的 LLM agent**——以「任务」为单位接收管理动作（首批 = 托管接入），经工具面（主机执行 ∥ Docker API ∥ 控制面动作）探明目标、决定并执行、验证、报告。
- **唯一一个**（用户 22:29）：不为管理面另立第二个 agent；其余管理面能力（成员 ∥ provider ∥ 模型选择 ∥ 用量/配额 ∥ 审计 ∥ 沙盒各面）陆续入其工具面——「通过 agent 完成 thincoder server 的完整管理」（需求 §5 后续议题行 · 台账 #1254）。
- **载体**：server 进程内模块 `thincoder-server/src/agent/`（不做独立进程/通道）；执行面（runner）机器上零驻留——延续用户 19:52 口径。
- **核 = `@thincoder/core`**（KD-SV-78：依赖声明形照 CLI——钉版本；**无人值守档面裁剪 = 本档 §5**——该 KD 明文归 #1237 设计轮）。
- **驱动器 = 两形（本批起）**：① **任务式**——管理动作创建任务（run），agent 在任务内跑工具（§2）；② **聊天式**——管理面 chat 会话（§11——本批落；需求 §5「两个 chat 界面」④）。两形**同 agent 同源**：同一工具面框架（任务五件 §3 + 管理面七件 §12）、同一审计面、同一模型出口。
- **与成员面 agent 的关系**：成员面 chat = 开发壳（#1215 起步块；16:04 裁「成员资源管理 = 同一个 chat 界面 + 开放工具」）——其 server 域工具与本体同源、面不同；归属/裁剪随 **#1215（成员面 chat 轮）** 定，**本档不改其口径**。

## 2. 任务模型（run）

- **任务（run）** = 管理动作的执行单元：目标（自然语言简报 + 参数）∥ 目标主机/对象 ∥ 验收（成功判据——从场景反推）∥ 预算 ∥ 审计窗。
- **状态与读时面**：run 落在库行（首表 = `sandbox_onboarding`——sandbox 域 v13，`store/STORE.md` §2 v13 段）；进度 = **读时轮询**（无后台常驻定时器——KD-SV-86）；server 重启 ⇒ 在途任务 `interrupted`（如实收尾——KD-SV-86）。
- **并发**：同一主机在途任务 ≤ 1（重复提交 ⇒ 400 拒——人话）。
- **无人值守**：不弹审批 ∥ 不依赖 TTY ∥ 工具不自锁 stdin；不可逆/越界情形 ⇒ **停下报告**（不是问询——§4）。
- **预算**（父侧提议——防跑飞）：单任务时长上限（缺省 20 分钟）∥ 工具调用步数上限（缺省 60 次）；超限 ⇒ 停 + 报告。不做中途中止按钮（预算封顶兜底；重试 = 重交任务——§4）。
- **审计**：每工具调用一条（命令/调用 ∥ 退出码/结果码 ∥ 摘要——秘密掩蔽后）＋任务级起/终两行；型面 = `sandbox_event`（`accounts/ACCOUNTS.md` §2.1——零 CHECK 改）。

## 3. 工具面（首版五件——用户 22:19–22:25 口径落细）

| 工具 | 形 | 实现面 | 审计行 |
|---|---|---|---|
| `exec(host, command, timeoutS?)` | 目标机执行**一条**命令（非交互 ∥ 逐条 ∥ 退出码 + stdout/stderr 截断回读） | `thincoder-server/src/sandbox/ssh.mjs`（拟新增——系统 openssh，KD-SV-85） | 命令 ∥ 退出码 ∥ 摘要 |
| `docker(host, op, args?)` | Docker API 动词（version ∥ info ∥ ps ∥ images ∥ pull ∥ create ∥ start ∥ stop ∥ rm ∥ logs ⋯） | `thincoder-server/src/sandbox/docker.mjs`（拟新增——**与控制台同一客户端**：「控制台与 agent 走同一套 Docker 调用」） | op ∥ 结果码 ∥ 摘要 |
| `register(host, endpoint)` | 登记进控制面（连通自检 + 落行——与控制台「添加节点」同函数） | `sandbox/registry.mjs` | 自检读数 ∥ 行 id |
| `verify(host)` | 自检（Docker API 连通 + 版本协商 + 读数复述） | 同上 | 读数逐值 |
| `report(summary)` | 终态报告（成功/失败 + 停在哪步 + 读数） | 任务记录 + 审计 | 终态行 |

- **无白名单围栏**（用户 15:02「你先别还没干活先开始受控，他妈的我还不知道需要什么能力呢」——撤能力围栏在案）；护栏 = 任务简报（目标/边界句——随任务给）∥ 每动作审计 ∥ §4 停下报告边界。**不发明新围栏**（能力面从实际场景反推——15:02 口径；本批工具入参按主机寻址——凭据 = 该主机任务所授）。
- **本版不含** server 本机 shell/文件工具（server 自身管理 = 域工具面逐步长——§10 边界）。

## 4. 自主边界与失败处置（硬点② 的答案）

- **可自主决定**（目标不变前提下）：技术路线选择——包管理器（apt ∥ dnf ∥ yum ∥ zypper ∥ apk）∥ 安装方式（发行版包优先；convenience script 仅在发行版包不可用时）∥ 服务管理形态（systemd drop-in 等）∥ 监听配置形 ∥ 瞬态网络失败重试（≤1 次）∥ 步骤次序与探明深度。
- **必须停下报告**（不得自行处置）：① OS/内核前提不满足（非 Linux ∥ 无 cgroup v2 ∥ 磁盘不足 ∥ 无 systemd）；② 登录/sudo 权不足；③ 同一动作有界重试后仍败；④ 需破坏性/越界动作（升级系统 ∥ 卸载包 ∥ 动他人服务/防火墙 ∥ 重启宿主机 ∥ 动数据盘）；⑤ 目标机既有形态冲突（Docker 形态异常 ∥ 监听被占）；⑥ 预算超限。
- **失败处置**（「失败回滚还是停下报告」）：**仅撤 agent 自身写入的可逆配置**（例：daemon drop-in ⇒ 撤文件 + 复位尝试）；**装包不回滚**（卸载比留下更危险——以机器现状为准报告）；**登记失败 = 零宿主回滚**（重交重试——幂等）；回滚也失败 ⇒ 报警级报告（逐条现状）。
- **重试** = 重新提交（新任务行——对已装/已监听幂等）；**不做**任务中途取消（预算封顶——父侧提议）。

## 5. 无人值守档面裁剪（KD-SV-78 落实——「server agent 的无人值守档面裁剪随 #1237 设计轮」）

- **保留**：核 agent 环（多轮工具循环 ∥ 上下文压缩）∥ 工具调用协议 ∥ provider 客户端（模型出口）∥ 审计挂钩。
- **裁剪**：交互审批/问询面（无人值守——工具不弹问、不自锁）∥ TTY 假面 ∥ 与运维任务无关族（记忆 ∥ 台账 ∥ 子代理 ∥ 浏览器——按任务需要再逐族接）。
- **模型出口** = provider 注册表现有渠道（server 自持 key——与网关同信任域）；**记账不进成员用量**（服务器运维成本——如实披露）；出口代理旗随 provider 条目（复核点——`PROJECT.md` §9 R53③）。
- **模型选择** = 任务提交时选择（下拉源 = 注册表现有模型；缺省 = 最近一次成功所用——机械读法 = `GET /api/admin/agent/chats` 倒序首行 `model`；该模型不在下拉源 ⇒ 空选；「成功」位 = 数据面无（题设近似——如实登记，不引入新位））；无可用模型 ⇒ 提交面明示不可提交（KD-SV-87——父侧提议）。

## 6. 本域文件与行数预算（本域族行）

| 档 | 行数（设计估） | 职责 |
|---|---|---|
| `thincoder-server/src/agent/run.mjs`（已落盘） | 实读 **137** | 任务执行的 agent 环装配：核装载（`@thincoder/core`——KD-SV-78）∥ provider 注入 ∥ 工具注册 ∥ 预算 ∥ 审计 sink ∥ 无人值守裁剪（§5） |
| `thincoder-server/src/agent/tools.mjs`（已落盘） | 实读 **288 ⇒ ≈200**（docker 十动词执行器迁出 ⇒ `docker-ops.mjs`——两驱动单源） | 任务面五工具（§3）——参数校验 ∥ 结果结构化 ∥ 审计包装（exec/docker 经 sandbox 域件；register/verify 经 registry） |
| `thincoder-server/src/agent/chat.mjs`（拟新增——admin-agent-chat 批） | ≈300 | 聊天式驱动（§11）：会话装配（系统简报 + 历史重放）∥ 回合环（预算 ∥ 工具循环）∥ 帧流编解码（`delta`/`call`/`result`/`end`）∥ 逐条落库 ∥ 终态收尾 |
| `thincoder-server/src/agent/chat-routes.mjs`（拟新增——admin-agent-chat 批） | ≈120 | 会话面四端点（§11——契约 = `gateway/API.md` §2.8）∥ 判权 ∥ 在途门 ∥ 重启恢复钩（running ⇒ idle + notice） |
| `thincoder-server/src/agent/chat-tools.mjs`（拟新增——admin-agent-chat 批） | ≈400 | 管理面七件（§12）：members ∥ providers ∥ models ∥ usage ∥ audit ∥ runners ∥ docker——参数校验 ∥ 结果结构化 ∥ 审计包装（进程内直取域件） |
| `thincoder-server/src/agent/docker-ops.mjs`（拟新增——admin-agent-chat 批） | ≈140 | Docker 十动词执行器（自 `tools.mjs` 提取——任务面/聊天面两驱动单源；客户端 = `sandbox/docker.mjs`） |

- 小计 **≈+872**（本批：新增四档 ≈960 ∥ `tools.mjs` −≈88）；`bin/thincoder-server.mjs` 实读 **187 ⇒ ≈189**（import + 注册两行——本域首经 bin 注册点）。
- `thincoder-server/package.json`（`@thincoder/core` 钉版本依赖 ∥ `prepublishOnly` 件数）与**构建/发布形**（带核）复核 = `PROJECT.md` §9 R53③。
- sandbox 域件（`ssh.mjs` ∥ `onboarding.mjs` ∥ `onboarding-routes.mjs`）= `sandbox/SANDBOX.md` §13（本档不重复）；`bin/thincoder-server.mjs` **±0**（四端点经 `thincoder-server/src/sandbox/routes.mjs` 转注册——装配行计入 sandbox 域预算）。

## 7. 验收判据（机检面）

| 判据 | 载体 |
|---|---|
| 五工具装配在场（工具名/参数形断言）；每工具调用落一条审计行（逐调用断言——含 exec 命令 ∥ 退出码 ∥ 摘要）；秘密零入审计（掩蔽断言） | 批内件（`…-runner-admin-console-agent.test.mjs`） |
| 无人值守档面：无交互/审批件挂载 ∥ 工具在无 TTY 环境可跑（假件下） | 批内件 |
| 预算：步数/时长告警 ⇒ 停 + 终态 `failed`（原因含「预算超限」） | 批内件 |
| 聊天式驱动（本批）：四端点判权三态（`user` ⇒ 403 ∥ 无会话 ⇒ 401 ∥ admin 200）∥ 流帧逐帧序（`delta`/`call`/`result`/`end`——假模型出口 ∥ 假工具）∥ 会话落库与重放（逐行在场 ∥ notice 回放滤除 ∥ 工具结果截断口径一致）∥ 在途门（`running` ⇒ 400 人话）∥ 重启收尾（`running` ⇒ `idle` + notice + `chat_stop` 行）∥ 管理面七件逐件（§12——假件下断言动词面与参数校验）∥ 每工具调用一条 `agent_event` 行（逐调用 ∥ 掩蔽）∥ chat 重置 ⇒ 既有域型零增（`password_reset` 零行——只 `chat_call` 行；§12 重置链助手边界）∥ 异常终态落库（模型错误 ∥ 预算超限）：已生成文本 ⇒ `assistant` 行如实落库（部分文本——回放逐字一致）；notice 行独立落行（回放滤除）；零文本 ⇒ 零 `assistant` 行 | 批内件（`…-admin-agent-chat.test.mjs` ∥ `…-admin-agent-chat-tools.test.mjs`） |
| 托管接入全链判据 = `sandbox/SANDBOX.md` §11 托管接入行（本档机制被其覆盖——用例 = 其 §12 N49–N52） | 批内件 + 收口轮（真机） |

## 8. 用例（本域）

| # | 类 | 输入 | 预期输出 |
|---|---|---|---|
| N53 | 正常 | 假模型 + 假 ssh + 假 Docker：任务环跑到 `report` | run 终态 succeeded；审计行 = 起 ∥ 每调用 ∥ 终（数目逐值）；工具面五件在场 |
| B47 | 边界 | 步数上限触发（假模型恒调工具） | 停 + `failed`（「预算超限」）+ 审计终行 |
| E39 | 错误 | 无可用模型（注册表空） | 提交面拒（400 人话）；零落库 |
| N54 | 正常 | 假模型（一轮文本 + 一轮工具调用）+ 假工具：建会话 ⇒ 发消息（读 NDJSON 流） | 帧序 = `delta`… ∥ `call` ∥ `result` ∥ `end(succeeded)`；`agent_chat_messages` 逐行在场（`user` ∥ `assistant`（含 `toolCalls`）∥ `tool`）；审计 = `chat_start` + 每调用一条 `chat_call` |
| N55 | 正常 | 同一会话连发两轮（轮间重读详情） | 历史重放逐行（角色/序在场——notice 滤除）；模型上下文 = 前轮全量；会话 `status` 终态回 `idle` |
| B48 | 边界 | 流断/客户端断开（回合在途） | 回合照跑到终态（落库不依赖连接）；重读详情 = 全量在场；审计零缺行 |
| B49 | 边界 | 预算超限（假模型恒调工具）∥ 空回合（模型无文本无调用） | `end` 帧 `failed` + notice 行（「预算超限」人话）+ `chat_stop` 行 ∥ 同左（空回合人话） |
| E40 | 错误 | 无会话 ∥ `user` 角色 ∥ 会话不存在 ∥ 在途再发 ∥ 模型不可用（建会话） | 401 ∥ 403 ∥ 404 ∥ 400（「本会话正在执行」）∥ 400（「模型不可用」人话）——各自零副作用（在途门除外） |
| E41 | 错误 | 模型出口抛错（假模型）∥ 工具入参非法（如 `members.create` 缺 `username`） | `end` 帧 `failed` + notice（原因人话）+ `chat_stop` 行 ∥ 工具级错误回灌（`result` 帧 `ok:false`——回合不停，模型可自纠）；会话落库如实 |

## 9. 关键决策（本域）

| # | 决策 | 理由 | 被否候选与何故否 |
|---|---|---|---|
| KD-SV-82 | **管理面 agent = server 进程内（核 `@thincoder/core` + 最小壳）+ 无人值守裁剪（§5）+ 工具面五件（无白名单围栏）** | 用户 22:19–22:29 口径 + KD-SV-78（从核引）；进程内 = 直取 server 域件（库/registry/docker 客户端）零 HTTP 回环；执行面机器零驻留延续 19:52 口径 | 独立进程/守护（另一套生命周期 + 通道——否）；自写第四份 agent（KD-SV-78 已否）；白名单围栏（15:02 用户已撤——否） |
| KD-SV-87 | **模型选择 = 任务提交时选择**（下拉源 = provider 注册表；缺省 = 最近一次成功所用——机械读法 = `GET /api/admin/agent/chats` 倒序首行 `model`；该模型不在下拉源 ⇒ 空选；「成功」位 = 数据面无（题设近似——如实登记，不引入新位）；无模型 ⇒ 不可提交） | 显式可见（零隐藏缺省）∥ 零新配置项（免「每配置项有 UI 写入口」新面）∥ 每次运行留痕 | 配置项 `agent.model`（新配置面 + UI 落点无自然位——否）；固定取首家 provider 首模型（静默任意——否） |
| KD-SV-88 | **聊天式驱动 = 管理面 chat 会话（§11——本批）**：① 会话（chat）= 模型选定（建会话时——KD-SV-87 同口径）× 消息序（库两表——KD-SV-89）；② 回合（turn）= 用户发一条 ⇒ agent 环跑到自然结束/预算封顶——**执行不依赖浏览器连接**（流 = 视图；断连照跑）；③ 流式通路 = `POST …/messages` 单请求 + `application/x-ndjson` 帧流（`delta` ∥ `call` ∥ `result` ∥ `end`——浏览器 fetch + `ReadableStream` 逐行读）；④ 预算 = 每回合独立（20 分钟 ∥ 60 调用——与任务式同常量）；⑤ 判权 = `requireAdmin` 全族 | 需求 §5「两个 chat 界面」④（形态落点 = 本设计轮）+ 用户「浏览器流式会话通路」点名；单请求 POST = 写入与执行同跳（零孤儿流 ∥ 判权一次）；NDJSON = 每行一帧零壳（较 SSE `data:` + 空行双层无增益）；执行不依赖连接 = 与「读时单源」先例同拍（刷新/换设备不丢回合）；预算常量复用 = 同一环保险丝（KD-SV-83 同源） | `EventSource`（GET-only——不能 POST 报文体 ∥ 自动重连语义无用途）；SSE-over-fetch（可用——`data:` 帧 + 空行分隔 = 无增益壳）；WebSocket（双向机制超需求 ∥ 服务端需自持升级/hub——面外）；轮询（部分 token 不可达——违「流式」点名）；双请求（POST 起跑 + GET 挂流——孤儿流/二次判权面）；任务式复用（run 语义 = 单目标 + `report` 终态——chat 无 report，回合自然结束）；会话内存态（刷新即失——否） |
| KD-SV-89 | **会话持久化 = v14 两表 + OpenAI 消息形 + notice 行 + `status` 在途标记（重启如实收尾）**：`agent_chats`（`status` = `idle`/`running`——在途标记） + `agent_chat_messages`（`role` = `user`/`assistant`/`tool`/`notice` ∥ `content`（工具结果 = 模型可见形——按任务面口径截断 ≤4000 字：回放逐字一致）∥ `data_json`（`toolCalls` ∥ `toolCallId`/名/摘要）∥ 序）；消息**逐条增量落库**；回放 = 库行装配为模型消息数组（notice 滤除）；**重启** ⇒ `running` ⇒ `idle` + notice 行 + `chat_stop` 审计（KD-SV-86 口径） | 聊天上下文 = 长消息序（单列 JSON 每回合全量重写——写放大）；行式 = 逐条增量 + 读面直取；`role` 枚举落 CHECK（形单源）；在途标记落库 = 刷新/多标签页一致（进程内存态不作判据——KD-SV-80/86） | 单档 JSON 列（写放大 ∥ 并发回合难对齐）；纯内存会话（刷新即失/重启悬挂——否）；复用核会话档（KD-SV-78 引核面 = provider/环——server 专有存储自持；核 = 本地文件面）；复用 `sandbox_onboarding`（域错——沙盒任务 ≠ 管理面 chat）；消息删除/重命名/归档面（未裁——不做） |
| KD-SV-90 | **工具面扩展（管理面七件——§12）**：`members`（六动词）∥ `providers`（五）∥ `models`（五）∥ `usage`（`summary` ∥ `rows`）∥ `audit`（`query`）∥ `runners`（`list` ∥ `add` ∥ `remove`）∥ `docker`（十动词——**绑定 = 注册节点**：名∥地址经 `sandbox_runners` 查行；未在册 ⇒ 工具级错误回灌）；逐面回指控制台功能点（§12 表）；**进程内直取域件**（KD-SV-82 口径延续——零 HTTP 回环）；写链与路由**同函数**（provider/成员路由内联体提取共享助手——两调用点单源）；`exec`（SSH）**不入 chat**（凭据 = 任务表单专有——KD-SV-84 面不破）；节点排空/禁用随控制台同批长（未落——不发明） | 需求 §5「工具面 = 覆盖控制台既有全部管理面……能力逐步长」+ 用户 22:28「server 的管理能力也应该托管给 agent，比如成员管理，provider 管理，模型选择，用量等等」；「控制台与 agent 走同一套调用」口径镜像（docker 面）；进程内直取 = 判权/校验/审计单源（HTTP 回环 = 双判权 + 凭据面重造） | 任务五件直接复用（凭据/单主机绑定语义不合——否）；经 HTTP 打自家 admin 端点（双判权/回环——否，KD-SV-82 先例）；每动作一工具（工具数爆炸——面内动词沿 docker 先例）；docker 不接（机队/排障面缺口——否）；docker 任意地址（机队语义 + 误打面——否）；chat 内收 SSH 凭据（凭据纪律面——另裁才可） |
| KD-SV-91 | **审计型面 = 新 `agent_event`（v14 CHECK 扩型——十三型）**：kind = `chat_start`（会话创建）∥ `chat_call`（每工具调用——逐调用：工具名 ∥ 调用摘要 ∥ 结果码 ∥ 摘要；**读动作同落行**）∥ `chat_stop`（异常收尾：预算超限 ∥ 模型错误 ∥ 重启中断）；正常回合终 = 无附加行（调用行 + 会话档已足）；**不双记**既有域型（agent 建成员 ⇒ 只 `chat_call` 行）；detail 掩蔽口径 = 沿任务面（秘密掩蔽 + 摘要截断） | 跨域动作面（members/providers/models/usage/audit/runners 六域）——单一型 + kind 区分（既有型面逐域枚举扩不动）；「每次动作落审计行」= 用户口径（含读动作——沿任务面沙盒先例）；不双记 = 一动作一行（审计页可读性 + 计数诚实） | 复用 `sandbox_event`（名不符实——非沙盒动作）；逐域既有型（读动作/模型设置等无型可落——枚举爆炸）；不落审计（违用户口径——否）；turn 级行（每回合一行 = 噪声——调用行已足） |

## 10. 本域边界（不做的面）

- **server 本机 shell/文件工具**（agent 不操 server 自身文件系统——server 管理动作 = 域工具面逐步长；#1254 在册）。
- **成员面 agent 的 server 域工具面**（归属随 **#1215（成员面 chat 轮）**——本档不改 16:04 口径）。
- **chat 面不做（本批——§11/§12）**：SSH 凭据经 chat 文本输入（装机凭据 = 任务表单专有——KD-SV-84）∥ 会话删除/重命名/归档 ∥ 会话自动清理（保留口径未裁——不设清零）∥ 回合中途中止钮（预算封顶）∥ 会话内换模型（换 = 新建）∥ 工具面机制确认门（破坏性动作先说明 = 提示词级纪律——如要机制门另裁）∥ 沙盒工作区/规则/待批/设置各面工具（随沙盒余面批同批长）∥ 节点排空/禁用工具（控制台侧未落——不发明）。
- **多任务编排/队列**（并发上限 = 1 个/主机在途；跨主机并行未定形）∥ **任务中途取消** ∥ **定时/事件触发任务**（触发源现 = 管理动作）。

## 11. 聊天式驱动（管理面 chat——本批）

- **形态**：管理面 chat = 管理面 agent 的第二驱动形态（任务式之外的常设对话面）——浏览器侧 = 控制台页 `#/admin/chat`（`webui/WEBUI.md` §2.10）；用途 = 运维/管理（托管接入 ∥ 机队 ∥ 成员与 provider ∥ 审查排障——**非开发用途**；需求 §5「两个 chat 界面」②）。与任务式同 agent 同源：同一工具面框架（§3 + §12）、同一审计面、同一模型出口（§5）。
- **会话（chat）**：`model`（建会话时选定——KD-SV-87 同口径；会话内不换，换 = 新建）+ 消息序（库两表——KD-SV-89）；列表/详情 = 读时读（无后台常驻）。
- **回合（turn）**：用户发一条 ⇒ 装配 = 系统简报（管理面用途句 + 行动纪律句）+ 历史重放 + 本轮消息 ⇒ agent 环（多轮工具循环——与任务式同一环）跑到自然结束。终止四形：① 模型无工具调用（自然结束——`succeeded`）；② 预算超限（20 分钟 ∥ 60 调用——**每回合独立计**）；③ 模型出口抛错；④ 空回合（无文本无调用）。
  ②③④ ⇒ notice 行（人话；`data.reason` 各点名：② "budget" ∥ ③ "model_error" ∥ ④ "empty_turn"；人话文本 = `content` 面）+ `chat_stop` 审计 + `end` 帧 `failed`；②③ 下已生成文本 ⇒ `assistant` 行如实落库（部分文本——回放逐字一致；与 notice 行各自一行），零文本 ⇒ 零 `assistant` 行。
- **流式通路**（KD-SV-88）：`POST /api/admin/agent/chats/:id/messages` 单请求；响应 = `application/x-ndjson` 帧流（每行一帧）：`{"type":"delta","text"}`（模型文本增量——核 `onToken`）∥
  `{"type":"call","id","name","args"}`（工具调用开始——`args` = **字符串**（参数摘要——JSON 序列化 ⇒ 掩蔽后截断 ≤500 字；恒为字符串，非对象））∥ `{"type":"result","id","ok","summary"}`（结果摘要 ≤300 字）∥ `{"type":"end","status","reason"?}`（回合终态）。
  **执行不依赖连接**（断连照跑——落库单源；页刷新/重开重读会话详情形即全量）。流前错误（判权/形/在途/不存在）= 统一信封；流中失败 = `end` 帧（headers 已发——不再走信封）。
- **在途门**：同会话 `status = running` 期间再发 ⇒ 400 人话（「本会话正在执行——等它结束」）；跨会话并发不设限（未裁——不发明）。
- **重启恢复**（沿 KD-SV-86 如实收尾）：启动装配期 `running` ⇒ `idle` + notice 行（「server 重启——本轮中断」；`data.reason` = "restart"）+ `chat_stop` 审计行；已落库消息零动。
- **判权与审计**：四端点全 `requireAdmin`（界面显隐非判据）；审计 = `agent_event`（KD-SV-91——`chat_start` ∥ `chat_call` 逐调用 ∥ `chat_stop` 异常收尾）。
- **行动纪律句（系统简报内——提示词级，非机制门）**：先查后动（读数先于动作）∥ 结果用逐句人话 ∥ 破坏性动作（删节点 ∥ 吊销凭据 ∥ 重置密码 ∥ 删 provider ∥ 停模型）先说明将做什么、再执行 ∥ 不确定 ⇒ 问用户。如需机制级确认门 ⇒ 另裁（本批不做——§10）。
- **测试注入缝**（§7 批内件判据依托）：模型出口 ∥ 工具面 = 模块级注入（setter ∥ 参数覆盖——默认 `null` ⇒ `??` 回落真件，生产行为不变；沿 `sandbox/SANDBOX.md` §13 `fetchImpl`/`execImpl` 注入面先例）；控制台面假流桩 = `webui/WEBUI.md` §6 本批行。

## 12. 工具面扩展（管理面七件——本批）

**口径**（KD-SV-90）：逐面回指控制台功能点 ∥ 进程内直取域件（零 HTTP 回环——KD-SV-82 延续）∥ 写链与路由同函数（单源）∥ 每次动作落审计行（读动作同落）∥ 无白名单围栏（KD-SV-82 口径不破）。

| 工具 | 形（动词） | 实现面（域件） | 回指（控制台面） |
|---|---|---|---|
| `members(op, …)` | `list` ∥ `create` ⟮username/name/role⟯ ∥ `reset_password` ⟮member⟯ ∥ `revoke_key` ⟮member/keyId⟯ ∥ `set_quota` ⟮member/quotas 键级合并⟯ ∥ `set_disables` ⟮member/disables 键级合并⟯ | `accounts/members.mjs`（`createMember` ∥ `setMemberPassword` ∥ `mergeMemberModelQuotas` ∥ `mergeMemberModelDisables`）∥ `accounts/keys.mjs`（`revokeKey`）∥ 重置链 = 改密 + 清计（`guard.clearUsername`——装配面注入 ∥ 与路由同效：共享助手边界 = **改密 + 清计**两件；审计写不随迁——`recordAudit` 各留调用侧既有面（路由侧 = `password_reset`（`accounts/ACCOUNTS.md` §2.1）∥ chat 侧 = 只 `chat_call` 行——KD-SV-91）） | 成员页/弹窗（功能点 15④ ∥ 23②）；端点 = `gateway/API.md` §3 |
| `providers(op, …)` | `list` ∥ `add` ⟮全字段⟯ ∥ `update` ⟮字段级（`settings` 键级合并）⟯ ∥ `remove` ⟮id⟯ ∥ `discover` ⟮baseURL/apiKey/providerId/proxy⟯ | `thincoder-server/src/gateway/provider-admin.mjs`（校验单源 `validateProviderEntry` ∥ 候选注册表 ∥ `runtime` 换表）——路由内联写链提取共享写函数（两调用点单源）；发现 = 同探针件 | Provider 页（功能点 18/AC-11；端点 = §2.2） |
| `models(op, …)` | `list` ∥ `enable` ⟮provider/model——加开放⟯ ∥ `disable` ⟮减项（退役可停）⟯ ∥ `settings` ⟮rpm/tpm/costIn/costOut/note/quotaTokens 键级合并⟯ ∥ `alias` ⟮设置/清除（含唯一性校验）⟯ | 同上写链 + `settings` 合并件（`mergeProviderSettings`） | 服务模型页（功能点 17/29——A/C/D/E/F/G 面） |
| `usage(op, …)` | `summary` ⟮member/model/endpoint/from/to⟯ ∥ `rows` ⟮同上 + limit ≤100⟯ | `thincoder-server/src/metering/report.mjs`（`usageSummary`）∥ `metering/usage.mjs`（`queryUsage`——与端点同过滤构建器） | 管理·用量页（功能点 15②；端点 = §3） |
| `audit(op, …)` | `query` ⟮type/member/from/to/limit⟯ | `accounts/audit.mjs`（`queryAudit`——与审计页同过滤件） | 审计页（功能点 15④——`accounts/ACCOUNTS.md` §2.1） |
| `runners(op, …)` | `list` ∥ `add` ⟮name/address——连通自检 + 落行⟯ ∥ `remove` ⟮id/containers（keep∥remove）/confirm⟯ | `sandbox/registry.mjs`（`insertRunner` ∥ 读行）+ 删除链（容器处置 ∥ 承载确认 ∥ 工作区解绑 + 续放置——与控制台同函数同效） | 沙盒页·运行面（§2.8①——最小切片；端点 = §2.5） |
| `docker(host, op, args?)` | 同任务面十动词（version ∥ info ∥ ps ∥ images ∥ pull ∥ create ∥ start ∥ stop ∥ rm ∥ logs）——**绑定 = 注册节点**（名 ∥ 地址经 `sandbox_runners` 查行；未在册 ⇒ 工具级错误回灌） | `sandbox/docker.mjs`（`createDockerClient`——与控制台容器面同一客户端）+ `thincoder-server/src/agent/docker-ops.mjs`（拟新增——admin-agent-chat 批；十动词执行器——两驱动单源） | 沙盒页·容器区（§2.8①） |

- **不入 chat 面**：`exec`（SSH——凭据 = 任务表单专有，KD-SV-84 面不破）；装机（新主机）= 任务式（沙盒页托管接入弹窗）——chat 侧可读机队/装机成果（`runners.list` ∥ `docker` 读数），不收凭据。
- **随控制台同批长**（控制台侧未落——不发明）：节点排空/禁用 ∥ 沙盒工作区/规则/待批/设置各面工具（随沙盒余面批）。
- 工具结果形 = `{ ok, … }`（结构化；错误 ⇒ `ok:false` + 人话 message——回灌模型自纠，回合不停）。

## 变更记录

- 2026-10-10（**runner-admin-console 批 · 托管接入（管理面 agent）设计 · eng-designer**——承批档 §2 · 台账 #1237/#1236；用户 22:19–22:29 四句 + 15:00/15:02 裁）：建档——形态（进程内 ∥ 核复用 KD-SV-78 ∥ 唯一一个）∥ 任务模型（run ∥ 预算 ∥ 读时轮询）∥ 工具面五件（exec/docker/register/verify/report——无围栏）∥ 自主边界与失败处置（硬点②）∥ 无人值守裁剪 ∥ KD-SV-82/87 ∥ 用例 N53/B47/E39。**产品码零触（设计轮）**。
- 2026-10-10（**runner-admin-console 批 · 设计评审轮 1 修正（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-10-runner-admin-console.md` §3 轮次 1 之 5/14）：#5 注册路径定——四端点经 `thincoder-server/src/sandbox/routes.mjs` 转注册（`bin` ±0——与 `sandbox/SANDBOX.md` §13 ∥ `PROJECT.md` §6 同拍）∥ #14 出口代理旗复核点指针写全（⇒ `PROJECT.md` §9 R53③）；同族：§6「构建/发布形」复核指针同拍。**零新语义**（评审发现直接导出项 + 同族指针收正）。
- 2026-10-11（**admin-agent-chat 批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-11-admin-agent-chat.md` §1 · 台账 #1254；需求 §5「两个 chat 界面」②④ + §1 后续议题；用户 2026-10-10 22:28 口径）：§1 驱动器行重写（两形——任务式 + 聊天式；本批落）∥ §1 成员面指针改指 **#1215** ∥ §6 预算表（`run.mjs`/`tools.mjs` 拟新增标记翻正实读 **137 ∥ 288**；+ 本批四新档 ≈960 ∥ `tools.mjs` −≈88）∥ §7 增聊天式判据行 ∥ §8 增用例 N54/N55 ∥ B48/B49 ∥ E40/E41 ∥ §9 增 **KD-SV-88/89/90/91**（聊天式驱动形 ∥ 会话持久化形 ∥ 工具面七件 ∥ 审计型 `agent_event`）∥ §10 边界随正（聊天式会话面条目删——成员面指针改指 #1215；+ chat 面不做条）∥ **增 §11（聊天式驱动——形态/回合/流式通路/在途门/重启恢复/判权审计/行动纪律句）与 §12（工具面扩展七件表——逐面回指）**。同源随动 = `store/STORE.md` §2 v14 段 ∥ `gateway/API.md` §2.8 ∥ `webui/WEBUI.md` §2.10 ∥ `accounts/ACCOUNTS.md` §2.1。**产品码零触（设计轮）**。
- 2026-10-11（**admin-agent-chat 批 · 设计评审轮 1 修正（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-11-admin-agent-chat.md` §3 轮次 1 之 1/2/9/10/11）：#1 §11 帧形钉死 `call` 帧 `args` = 字符串（参数摘要——JSON 序列化 ⇒ 掩蔽后截断 ≤500 字；非对象；与 `gateway/API.md` §2.8 逐字同拍）∥ #2 §12 成员行明写重置链共享助手边界（= 改密 + 清计；审计写不随迁——`recordAudit` 各留调用侧既有面）+ §7 补「chat 重置 ⇒ 既有域型零增」断言 ∥ #9 §1 指针收正（需求 §1 ⇒ §5 后续议题行）∥ #10 §11 回合行 + §7 补异常终态落库口径（部分文本 ⇒ `assistant` 行如实落库；notice 行独立；零文本 ⇒ 零 `assistant` 行——模型错误 ∥ 预算超限两径）∥ #11 增测试注入缝（§11——模型出口 ∥ 工具面模块级注入；默认 `null` ⇒ 回落真件）。**零新语义**（评审发现直接导出项）。
- 2026-10-11：闸面收净（doc-check 行宽/锚读数——本批面）——§11 回合/流式通路两行折行 ∥ §6 档表四行标记收正（「本批新增」⇒「拟新增——admin-agent-chat 批」）∥ §12 三处坐标收正（`thincoder-server/src/…` 全形——`:130`/`:132` 解析面 ∥ `:135` 补拟新增标记）。**零语义**。
- 2026-10-11（**admin-agent-chat 批 · 实施轮上抛回笔（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-11-admin-agent-chat.md` §6（实施轮上抛处置 + notice 补裁——④ 空回合单列 · 四值枚举））：§5/§9 KD-SV-87 行补机械读法（四处同词）∥ §11 回合行补 notice `data.reason` 各点名（② "budget" ∥ ③ "model_error" ∥ ④ "empty_turn"）+ 重启行点名 "restart"。**零新语义**（上抛裁决直接导出项）。
