# 2026-10-04 · ACP 协议面补全（结构化子代理事件 ∥ 提示通道）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-04 · 来源 = 用户 2026-10-04 11:48「那ACP剩下两个都开批处理吧」⇒ #862（结构化子代理事件 · 拆批 scope 草案在档）+ #843（协议面提示通道 · 未决定形）合并立批。
> 台账 = #862 ∥ #843（cli · 归批）。前情 = docs/batches/2026-10-04-issue-fix-round2.md §2（已收口 2026-10-04——#862 拆批裁定之源）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-04
**开批登记（2026-10-04 11:4x · 主 agent）**：**来源** = 用户 11:48「那ACP剩下两个都开批处理吧」。**条目** = ① **#862 结构化子代理事件**（能力扩展——round2 批设计轮裁定「拆批」+ scope 草案在档：`docs/cli/design/ACP-PROTOCOL-COMPLIANCE.md` §6——候选形 `_meta.subagent = { role, id, state?, progress? }`；前置件 = 事件文法机读单源 + `_meta` 契约文档）；② **#843 协议面提示通道**（未决项——`PROVIDER.md:442-443`「如需，另立设计」；承 #841 批 ACP 门判据「拒⇒放行」改判后的协议面空白）。**授权口径** = 全链（设计 → 用户点火评审 → 批准 → 实施；每步停走）。**设计轮已派**（eng-designer——首轮）。**边界** = 协议版本 / `initialize` / 方法面零动；ACP 客户端侧（Zed 面板）实现不在射程；需求档零触（主 agent 域）。
## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（评审修正轮已落（2026-10-04——评审 #17 七号逐号落位；doc-check 复跑 exit 0；详见 §2 修正块；待父侧复核））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**§2 批次任务与设计（eng-designer · 2026-10-04 · initial 轮）**

**开工复验（逐条实读 · as-of 2026-10-04——派发书坐标为参考，本表坐标 = 本席实读）**

- **#862 现状存活**：`thincoder-cli/src/acp/bridge.mjs`（**408 行**——派发书记 397 为旧 as-of）：`:189-203` = relay 前缀剥（`parseRelayPath`）+ `[model]` 剥 + `⟦ev⟧` 形态剥（**剥即弃**——零结构化映射）；`:198-199` 注「结构化 ACP 映射（tool_call_update）另行跟踪」；`:349+` replayHistory 零事件。
- **事件族 8 名发射面实核**（全部经 `callbacks.onToken`、全部带 relay 前缀——wrapper 自动补 ∥ 手工前置）：`turn`（`turn-loop.mjs:77`，depth>0 门）∥ `approval`（`dispatch.mjs:199`，depth>0 门）∥ `queued`（`subagent-scheduler.mjs:356` ∥ `advisor-async.mjs:318`）∥ `async`（`subagent-run.mjs:163` ∥ `escalate-async.mjs:193` ∥ `advisor-async.mjs:421`）∥ `cancelled`（`subagent-async.mjs:288` ∥ `advisor-async.mjs:263`）∥ `stopped`（`async-settle.mjs:241` ∥ `subagent.mjs:356`）∥ `settled`（`async-settle.mjs:279` ∥ `consult.mjs:219`）∥ `done`（`spawn-child.mjs:177`（嵌套补发）∥ `subagent-panel.mjs:194`）。⇒「结构化发射面判据（带前缀）」成立。
- **显示面三消费点**（本批零触）：TUI `subagent-blocks.mjs`（`SUB_EVENT_RE` 枚举 + async/cancelled 双分支）∥ VSC `panel-subagent-relay.mjs` ∥ 桌面 `agent-bridge.mjs`（后两者 = rc `relayEventToSubPatch` 单源消费；`ACTIVITY_EVENTS` 八名闭集）。
- **#843 现状在档**：`PROVIDER.md:442-443` 未决句 + `ACP-CLIENT.md:167/:572/:600` 三处「提示通道未决」残留。
- **schema 复核（本设计轮复取）**：247168 字节 · SHA256 `3c17bd6385d90cf672d8a661fddc359d73422cf8b8ce6865213d25cfd4c0eca7` · 170 `$defs`（与 issue-fix-round2 实施轮记值逐字同）。**新增实读三件**：① `SessionUpdate` **11 变体**逐一核对——**唯一零必填字段变体 = `session_info_update`**（逐字「All fields are optional to support partial updates…custom metadata」）；② 117 `$defs` 带 `_meta`（含 `SessionNotification` 与全部 11 变体；逐字「reserved by ACP…MUST NOT make assumptions」+ `x-deserialize-default-on-error`）；③ 上游 Extensibility 文档：`_meta` 自定义面 + 自定义 `_` 方法面 + 命名空间示例 `zed.dev/debugMode`。
- **写域核**：`docs/cli/design/ACP-CLIENT.md` = 自由（末写入者 read-data-interface 批已收口）；`thincoder-cli/src/**` = 自由（#51 写域让渡史核讫——已收口）。**在飞避让**：`PROVIDER.md` = #883 批未提交改动在位（见上抛 1）；E 批 = `AGENT-LOOP.md`/`EDIT.md`/`MANIFEST.md` + 核码；T/G 批 = desktop 档。

**件 1 · #862 结构化子代理事件（定形）**

- **问题定形**：子代理 / 会诊 / 飞刀族的生命周期事件（8 名）今日只走显示面（三处各自解析），ACP 面**剥即弃**——外部客户端无法构建活动面板（需求本义 = 客户端侧面板前置件；跨仓消费者 = ACP 客户端实现方）。
- **方案（二择论证）**：
  - **通道二择**：**A `_meta` 扩展载波（选定）** = `session/update` → `session_info_update` + `update._meta["thincoder.dev/subagent"]` ∥ **B 自定义 `_` 前缀通知**（规范许可、SHOULD-ignore 安全——**被否**：属方法面新增（越「方法面零动」边界）；对编辑器面板消费者无优势——同需客户端实现，且脱离既有 update 消费管线）。
  - **承载体四候选**（各由）：`session_info_update` **选定**（唯一零必填变体——零契约字段虚构）；非标 `sessionUpdate` 枚举（否——严格客户端 oneOf 反序列化失败）；`agent_message_chunk` 空文本（否——假造会话消息 + 空消息块污染）；`tool_call_update` 挂父卡（否——需跨轮 `role#id → toolCallId` 注册表 + 卡生命周期相抵 + consult 一卡多子）。
  - **形状修订两点**（拆批草案 = 起点，逐点给由）：① 键名 `_meta.subagent` ⇒ **`thincoder.dev/subagent`**（命名空间——对外契约防保留键碰撞；承上游示例形）；② `progress` 增 `{position}`（queued 位次）+ `detail` 增（queued 原因文 ∥ approval 工具名——事件唯一载荷）。
- **落点**：设计档 = `docs/cli/design/ACP-CLIENT.md` **§12**（本设计轮已落——读回在档 :642-718）；产品码落点 = 核新叶模块 + `bridge.mjs`（实施轮）。
- **前置件（核文法单源）**：`thincoder-core/agent/subagent-event.mjs`（拟新增——零依赖叶；导出 `EVENT_SENTINEL` + `parseSubagentEvent`）；哨兵定义位自 `spawn-child.mjs` 迁入（再导出——既有 import 面零改，先例 = 同档 child-marks 再导出手法）。消费方本批 = bridge 一处；显示面三处零触。
- **剥离面处置**：**语义零改**（文本面剥离判据/集合逐字不变；结构化 = **增量**第二支）——沿被否候选②纪律；负向边界（无终止符 `⟦ev⟧` 正文仍转发）保持。
- **边界与登记**（七条 → 设计档 §12.6）：内容面归属 ∥ `[model]` 结构化 ∥ 嵌套父链 ∥ `queued.kind` ∥ 能力通告零动 ∥ 显示面收敛登记 ∥ 生成侧构造器化登记。

**件 2 · #843 协议面提示通道（定形）**

- **定形 = 不立**（判由四条 = 设计档 §13：可见通道唯对话文本且语义相抵 ∥ 信息已在 `configOptions` 面 ∥ #841 已认账非缺陷 ∥ 边际可逆——`_meta` 载体随件 1 在位）。
- **二择材料均在档**：① 立支备选形态 = `session/new` 响应 `_meta["thincoder.dev/notice"]`（量级 ≈ +8 行 + 一节契约 + 2 用例）；② 不立 = 本批定形（登记去向 = §13 + `PROVIDER.md:443` 收正（实施轮落））。
- **消费者可见性论证（关键）**：全客户端可见的唯一通道 = 对话文本——语义相抵（假造模型发言 + 与 load 重放不对称）⇒ 否；`_meta` / 自定义通知 = 契约性不可见（忽略即合规）⇒ 立支只能交付「今天无人显示」的信号。

**受影响文件与量级对账（as-of + Δ）**

| # | 文件 | as-of | Δ | 变动点 |
|---|---|---|---|---|
| 1 | `thincoder-core/agent/subagent-event.mjs`（拟新增） | — | **~85** | 文法单源：哨兵 ∥ 形态判据 ∥ 逐事件投影 |
| 2 | `thincoder-core/agent/spawn-child.mjs` | 258 | +2/−1 | 哨兵定义位迁入 + import/再导出（既有 import 面零改） |
| 3 | `thincoder-cli/src/acp/bridge.mjs` | 408 | +~28 | import ∥ 投影助手 ∥ `onToken` 两支 ∥ 注 |
| 4 | `docs/cli/design/ACP-CLIENT.md` | 661 | **+105（已落 = 766 实读）** | §12/§13 新增 ∥ §2.2/§4/§5/§9/§11.5/§11.7 收正 ∥ 变更记录 |
| 5 | `docs/batches/2026-10-04-acp-face-completion.test.mjs`（拟新增） | — | ~180 | 批内件 T-862-1…12（先红后绿） |
| 6 | `docs/core/design/PROVIDER.md` | 588 | ±1 | `:443` 未决句收正（定形句）+ 变更记录一行——**实施轮落**（#883 未提交改动在位——本设计轮零触） |
| 7 | `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 1008 | +~4 | 文法单源指针（实施轮落——档创建后落，避悬空锚） |
| 8 | `docs/cli/requirements/ACP-CLIENT.md` | 151 | — | 需求面（主 agent 域——零触；判定句候裁，见上抛 3） |

- **净增量清单**：#862 ≈ 代码 +115 ∥ 文档 +105（已落）∥ 批内件 +180；#843 = **代码 0**（不立之实）∥ 文档 = §13（含于上行 +105）。
- **核面拆分评估**：新档 ~85（≤300 ✓）；`bridge.mjs` 408 → ~436（>300 咨询档——沿既有登记口径：随 callback 族扩展一并评估）；其余核档零触。

**用例设计（批内件：`docs/batches/2026-10-04-acp-face-completion.test.mjs`——先红后绿；直驱 `buildAcpCallbacks` stub；跑法 = 自仓根 `node --test`）**

| # | 类 | 输入（relay 前缀 + 事件 token） | 期望 |
|---|---|---|---|
| T-862-1 | 正常 | `eng-coder#2/⟦ev⟧queued\x1eslot\x1e2\x1equeued\x1e` | 恰一条 `session_info_update`；`{role:"eng-coder",id:2,state:"queued",progress:{position:2}}`；零 chunk |
| T-862-2 | 正常 | queued 带原因文（`wait\x1e3\x1equeued\x1ewaiting for: plan#7`） | `detail` = 原因文 |
| T-862-3 | 正常 | `⟦ev⟧turn\x1e3\x1e100\x1ellm\x1e` | `progress:{turn:3,maxTurns:100}` |
| T-862-4 | 正常 | `⟦ev⟧approval\x1e3\x1e100\x1eapproval\x1ebash` | `progress` 轮号对 + `detail:"bash"` |
| T-862-5 | 边界 | `async` / `cancelled`（零字段） | 仅 `{role,id,state}`——progress/detail 键**缺席** |
| T-862-6 | 边界 | `stopped` / `settled` / `done`（0/0/名） | 同上（state 逐字） |
| T-862-7 | 边界 | 嵌套 `explore#1/eng-coder#2/⟦ev⟧done…` | `role`/`id` = 最内段（`eng-coder`/2） |
| T-862-8 | 负向 | `eng-coder#2/⟦ev⟧async`（无终止符） | 零结构化；照常转发（现行为零改——防过剥负向边界） |
| T-862-9 | 负向 | `eng-coder#2/text ⟦ev⟧ x`（中段字面） | 照常转发；零结构化 |
| T-862-10 | 负向 | 无前缀形态事件 `⟦ev⟧turn\x1e1\x1e2\x1ellm\x1e` | 剥离零发射（防御面） |
| T-862-11 | 回归 | `[model]` token（`eng-coder#2/[model]m1`） | 零发射零 chunk（现行为零改） |
| T-862-12 | 回归 | 内容 chunk（`eng-coder#2/hello`） | 前缀剥 + 照常转发（零回归） |

**验收对照（回指两件）**

| 判据 | 机检项 | 用例 |
|---|---|---|
| AC-862-1（件 1） | 8 名语料 ⇒ 恰一条 `session_info_update` + 期望 `_meta` 对象；零 chunk | T-862-1…7 |
| AC-862-2 | 字段投影逐态（含键缺席语义） | T-862-1…6 |
| AC-862-3 | 负向三条 | T-862-8…10 |
| AC-862-4 | 既有面零回归 | T-862-11…12 |
| AC-862-5（面） | 批内件全绿（先红后绿）+ `node scripts/doc-check.mjs` exit 0 + 语法检查 | 命令面 |
| AC-843-1（件 2） | 定形不立在档（§13）+ 备选支材料齐（形态 ∥ 量级） | 文档面 |
| AC-843-2 | 零产品码变动（不立之实） | 记录面 |

**关键决策（KD）**：设计档 §9 D20–D23 + §12/§13 内详——D20 通道/承载体（四候选否决在档）∥ D21 键名命名空间 ∥ D22 `state` = 事件名（形态域开集；枚举化 = D13 同源否）∥ D23 提示通道不立。定形修订两点（键名 / 字段增）各自给由（§12.1）。

**边界（本批不做）**：协议版本 / `initialize` 形状 / 方法面零动 ∥ 需求档零触（主 agent 域）∥ 客户端侧实现（Zed 面板）不在射程 ∥ 显示面三消费点与生成侧构造器化零触（登记）∥ `PROVIDER.md` 本设计轮零触（在飞避让）。

**上抛 / 披露**

1. **PROVIDER.md 落点时机**（披露）：`:442-443`「未决」句收正 = 本批定形必须落——该档 **#883 批未提交改动在位**（在飞评审对象；D5 冻结窗）⇒ 本设计轮零触，目标文本已备（§13 登记去向）；**建议落点 = 本批实施轮**（或父侧路由）。
2. **doc-check 基线瞬态**（观察，已消）：本席基线复跑 = **exit 1**——唯一失败 = `WEBVIEW.md:223`（331 字符，#883 批未提交行面）；设计落笔后复跑 = **exit 0**（该行已被他方重排——当前 79 字符）。本批面零宽违规（新写区仅变更记录区两行超宽 = 声明豁免带内）。
3. **需求面**（主 agent 笔 · 候裁）：#862 = `docs/cli/requirements/ACP-CLIENT.md` 无对应判定句（F8/R-A5 未覆盖 `_meta` 扩展契约——设计侧契约全文在 §12）；#843 = 如需「协议面零提示行为设计行为」判定句（R-A5.6 邻位）。**本批零触需求档**。
4. **#862 需求本义闭环说明**：服务端契约 + 面向客户端的接口说明（§12）= 本批交付；客户端侧（Zed）实现 = 跨仓，不在射程。
5. **状态行**：设计完成（本节 + 设计档 §12/§13 落笔 · doc-check 复跑 exit 0 · 待父侧复核）。

**§2 附注（定形目标文本 · 供落点执行——实施轮）**

- **`docs/core/design/PROVIDER.md:443` 收正**（#883 冻结窗后落）：现文「协议面是否补提示通道 = **未决——如需，另立设计**（不在本批）。」⇒ 目标文「协议面提示通道 = **不立**（2026-10-04 批定形：可见通道唯对话文本且语义相抵 ∥ 信息已在 `configOptions` 面 ∥ 已认账非缺陷 ∥ 边际可逆——备选支在 `docs/cli/design/ACP-CLIENT.md` §13）。」；同档变更记录补一行（措辞可实施轮微调——语义 = 定形不立 + 指向备选支）。
- **`docs/core/design/AGENT-LOOP-SUBAGENT.md` 文法单源指针**（实施轮落——档创建后落避悬空）：建议插 §6.7.2 邻域 2–4 行——「事件 token 文法机读单源 = `thincoder-core/agent/subagent-event.mjs`（零依赖叶——哨兵 / 形态判据 / 逐事件投影；消费方 = ACP 桥，见 `docs/cli/design/ACP-CLIENT.md` §12；显示面三消费点收敛 = 登记）」；同档变更记录补一行。

**§2 修正块（2026-10-04 · 评审修正轮（fix——承评审 #17：pass · 🔴0/🟡4/🔵4）· eng-designer）**

> 轮次性质 = 点修（只按父侧裁定七号逐号落位；不做全量重探）。需求档零笔（主 agent 域）。

**一、发现 2 收正（需求面状态）**

- **行 8（`:52`）收正**：需求面栏读法 ⇒ **R-A5.11/A5.12 已落**（2026-10-04，需求档 F8 `:91-92`——承设计档 §12 ∥ §13；父侧落笔）；「零触 / 判定句候裁」读法撤回。as-of 计数 151 = **开批时点快照**（设计轮备料读数）；现态实读 161 行（评审读数 159——2026-10-04 收窄 + 折行后）。
- **上抛 3（`:94`）销项**：候裁已落——R-A5.11 = #862 判定句 ∥ R-A5.12 = #843 判定句（父侧直接执行，2026-10-04）；「本批零触需求档」句读法收正为「本批设计/实施轮需求档零笔（主 agent 域）」。
- **边界句（`:88`）收正**：「需求档零触（主 agent 域）」⇒「需求档 = 主 agent 域（设计侧零笔）；判定句 R-A5.11/A5.12 已由父侧落（2026-10-04）」。
- **设计 §13 末句**（设计档 `:737`）同收正——改后逐字见「三」表 #2 行。

**二、发现 5 收正（核面拆分——`:55`）**

- 补：**拆分缝候补** = 投影助手（事件 token → `session_info_update` 构造——纯函数、零状态）为第一切出面（候补名 `subagent-events.mjs` 挂 `acp/`；单测直驱）；事件族扩展（新增事件名 ∥ 新载荷）住核模块，不增桥行数。**延后判由（可复核）**：现 Δ ≈ +28 行未触 500 硬线；触发线 = 桥 >~450 行 ∥ callback 族下一次扩展。

**三、设计档落位（逐处 · 改后逐字摘录——行位 = 修正轮 as-of；设计档 = `docs/cli/design/ACP-CLIENT.md`）**

| 评审 # | 落点 | 改后逐字（摘） |
|---|---|---|
| #1 | `:338` | T9 注「零通知」⇒「**零可见面文本**（零 `agent_message_chunk`）；结构化增量见 §12」 |
| #3 | `:323` ∥ `:326` | 「**旧状缺陷（历史陈述——2026-09-16 批 CORE-DEFECT-FIXES 已修；修法与依据见下）**」∥「⇒ 二者**曾**随…泄漏」 |
| #4 | `:653` ∥ `:697` ∥ `:327`（三处同步） | 剥判据**单源** = 核模块 `subagent-event.mjs`：`parseSubagentEvent` 非空 ⇒ 剥（桥内联式退役——2026-10-04 批统一，语义零改） |
| #6 | `:692`（§12.3 新增行） | 「逐态字段序 = 发射侧单源；投影以样本锁定」（样本 = 批内件 T-862-1…6） |
| #7 | `:707` | AC-862-4 括注 ⇒「回归两例 = 批内件 T-862-11/12；既有宿主档不在盘（§11.8）」 |
| #2 | `:737` | §13 末句 ⇒「F8 判定句 R-A5.12（#843）已落（2026-10-04；同批 R-A5.11 = §12 对位）」 |

- **#4 取舍**：「单源」支落定（未取「两式同域义务」支）——单源消双表达式漂移面；桥本须调 `parseSubagentEvent` 取投影载荷，剥判即同一调用（自然单点）。设计档变更记录 = 同档 `:768`（修正轮行）。
- **#7 锚形说明**：AC-862-4 括注实际所在 = 设计档 `:707`（评审点名的 `:338` 为该宿主档的提及行）；改指批内件两例——既有宿主档（`thincoder-cli/test/acp-channel.test.mjs`）随 2026-09-28 测试树重置不在盘。

**四、读数（D6 读回——2026-10-04）**

- 设计档十处改点逐处读回在位（`:338 ∥ :323/:326/:327 ∥ :653 ∥ :692 ∥ :697 ∥ :707 ∥ :737 ∥ :768`；档行数读具计 767 ⇒ 769）。
- `node scripts/doc-check.mjs` 复跑 = **exit 0**：锚悬空 0（本批面唯一列报 = 设计档 `:696` 拟新增一条——既有标记，不入闸）∥ 行宽 0 违规（区带豁免在效）∥ 行数面 8 条报告态（均为 desktop 面既有——非本批面）。
- 越表核查：本修正轮写域 = 本批档 ∥ 设计档——零越表（需求档 ∥ 产品码 ∥ 其他档零笔）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审报告（ACP 协议面补全批——对象 = 批档 §2 ∥ 设计档 ACP-CLIENT.md §12/§13 + 七处随动 ∥ 需求卷 R-A5.11/A5.12）**

核面实读：设计档七处随动逐处在位（§2.2:54 ∥ §5:184 ∥ §4:167 ∥ §11.5:580 ∥ §11.7-4:608 ∥ §9 D20–D23:377-380 + 登记项 5–7:390-392 ∥ 变更记录:766）；需求卷 R-A5.11/A5.12（:91-92）内容与 §12/§13 一致。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 需求面/文档一致 | 🟡 | R-A3.4（`thincoder/docs/cli/requirements/ACP-CLIENT.md:65`）的「零通知」与 §7.2 测试面注（`thincoder/docs/cli/design/ACP-CLIENT.md:338`）的 T9「零通知」，相对同一输入的批内定形（批档 `:61`「恰一条 `session_info_update`」、`:65`）∥ R-A5.11「增量发射」（`requirements:91`）为未收窄的旧口径——两处在档读法相抵（零通知 vs 恰一条结构化通知）；设计层已裁（剥离照旧 + 增量），属口径收窄性质 | 将两处「零通知」收窄为可见面口径（零可见面文本 / 零 `agent_message_chunk`——面 = R-A2.1 所列），与 R-A5.11「文本面剥离语义零改（零 `agent_message_chunk`）」对齐 |
| 2 | 文档状态（cross-file lag） | 🟡 | 批档 §2 行 8（`:52`）∥ 上抛 3（`:94`）∥ 边界句（`:88`）∥ 设计 §13 登记去向（`ACP-CLIENT.md:736`）仍声明需求面「零触 / 无对应判定句 / 本批零触需求档」；而需求卷已落 R-A5.11/A5.12（`requirements:91-92`，变更记录 `:150` 明记承设计档 §12 ∥ §13）。行 8 的 as-of 计数 151 与实读 159 行不符（Δ 记「—」） | 收正为「R-A5.11/A5.12 已落（2026-10-04）」并同步行 8 的 as-of/Δ（或标注该行为开批时点快照）；§13 末句同收正 |
| 3 | 文档卫生（stale 现时态） | 🟡 | 设计 §7.2（`ACP-CLIENT.md:323`）以现时态记「现状缺陷」＝桥 `:184` 行「枚举白名单」，而本批 §2 开工复验（as-of 2026-10-04）实读桥为「⟦ev⟧ 形态剥」（`batch:16`）——同一机制的当前状态两处读法不同（该枚举修法系 2026-09-16 批内容，§7.2 同段标题已署「本批收正」） | 收正为历史缺陷陈述（旧状 → 已修，标注批次/日期），消「现状」被读成活缺陷 |
| 4 | 清晰性（单源地位） | 🟡 | 事件 token 形态判据的单源未落定：§12.4「形态判据 = 与桥剥离式逐字同域」（`ACP-CLIENT.md:696`）+ §12.1「与文本剥离判据**同域**」（`:653`）的措辞容许桥内联正则与 `subagent-event.mjs` 判据两条表达式并存；与 §7.2 自设纪律「不再各自内联正则，防第二套平行文法漂移」（`:303`）相抵 | 明写桥剥离判据统一取自核模块（一条表达式，如以 `parseSubagentEvent` 非空即剥），或显式记录两式同域义务 + 由 T-862-8/9 锁定的说明 |
| 5 | 受影响文件量级 | 🔵 | `bridge.mjs` 408 → ~436 位于 >300 咨询档，拆分评估仅「>300 咨询档——沿既有登记口径：随 callback 族扩展一并评估」（`batch:55`）——本批恰改其回调面；无 tier 跨越（未及 500 硬线），制度上不要求拆分计划 | 补一句拆分缝候补（事件族/投影助手切出方向）或明记延后判由，使咨询档评估可复核 |
| 6 | 清晰性（契约冻结面） | 🔵 | §12.2/§12.3 冻结对外载荷与逐态语义，未给「token 字段序 → 输出键」映射（逐态输入串仅见于批档 T-862-1/2 等样例）——内部投影实施需自发射侧反推 | 在 §12.3/§12.4 补一行（逐态字段序 = 发射侧单源；投影以样本锁定），或加逐态索引列 |
| 7 | 验收（锚） | 🔵 | AC-862-4 括注「§7.2 既有用例不退红」所指宿主档 `thincoder-cli/test/acp-channel.test.mjs`（`ACP-CLIENT.md:338`）已记「不在盘」（`:617`）——括注成悬空锚（机检仅映射 T-862-11/12） | 括注改指批内件回归两例（T-862-11/12）或写活宿主档名 |
| 8 | 评审限制 | 🔵 | 按范围约束仅实读三份在档文件：核源档行数（`bridge.mjs` 408 ∥ `spawn-child.mjs` 258 ∥ 拟新增档）与 schema 断言（247168 字节 / SHA256 / 170 `$defs` /「唯一零必填变体」）未与工作区实物抽查（unverified）；无项目标准档 ∥ 无文档地图声明 ⇒ 方法论按 AGENTS.md 与在档自设规范判、归属对照项目指南判 | 补一次 as-of 读数抽查（两份核档行数 + schema SHA256 复取比对）并把结果随档留痕 |

范围外记录（不判）：`docs/core/design/PROVIDER.md:442-443` 仍为「未决——如需，另立设计」，与 R-A5.12 定形「不立」跨档相抵——批档已披露（`:92`/`:100`：目标文本备好、落点 = 实施轮、#883 冻结窗）；`docs/cli/design/ACP-PROTOCOL-COMPLIANCE.md` §6 起点草案（裸名 `_meta.subagent`）未随本批收正/指向。

计数：🔴 0 ∥ 🟡 4 ∥ 🔵 4。

VERDICT: pass

## §4 用户批准（主 agent）

**2026-10-04 12:47 父侧代签批准**（用户 12:18「都自动跑吧」授权——全链自动）。

**三条件核验**：① 评审 pass（#17 · 🔴 0 · 🟡1–4 + 🔵5–7 全数 Fixed（修正轮 #20 落定并经父侧核读——修正块 `:103-136` 逐处实读 ∥ 设计档 `:697` 单源句 ∥ `:692` 字段序行 ∥ `:707` 括注 —— 实读 ✓）；🔵8 = Accepted（as-of 抽查归实施核读——并入实施舱验收⑥））；② 修正落地核验 ✓（上列逐处实读）；③ token 已签发（运行态，不入档）。

**批准范围** = 本批全量（#862 结构化子代理事件：核文法单源叶 + 桥发射 + 批内件 T-862-1..12；#843 = 零代码（定形不立——§13 在档））。派发 = 实施舱（eng-coder · initial）。**实施随带（在册 `:100-101`）**：`docs/core/design/PROVIDER.md:443` 收正 + `docs/core/design/AGENT-LOOP-SUBAGENT.md` 文法单源指针——设计档笔，落实施收口轮。

## §5 实施记录（eng-coder）

**状态行**：实施完成 · 2026-10-04（initial 轮——#862 结构化子代理事件；#843 = 零代码（不立之实）——批内件 T-862-1…12 先红后绿 12/12 · `node --check` ×3 exit 0 · doc-check exit 0 · 审计 clean ∥ 代码评审 pass（0🔴；1🟡+3🔵——均登记/收口轮待办））

**§5 实施记录（eng-coder · 2026-10-04 · initial 轮）**

**一、件 → 改动（file:line）∥ 读数**

| # | 件 | 实测（Δ） | 落点 |
|---|---|---|---|
| 1 | `thincoder-core/agent/subagent-event.mjs`（新） | 71 行（设计估 ~85——估算非约束；哨兵∥判据∥逐态投影满载，非简化） | `EVENT_SENTINEL` 定义位 `:19` ∥ 形态判据唯一表达式 `EVENT_FORM_RE` `:25` ∥ `parseSubagentEvent` `:42-70`（turn/approval `:52-62` ∥ queued `:63-69` ∥ 零字段态 ∥ 未知名 `:70`） |
| 2 | `thincoder-core/agent/spawn-child.mjs` | 259（258 +2/−1，净 +1） | `:28` import + `:29` 再导出（哨兵定义位迁入——既有 import 面零改；原注释逐字保留） |
| 3 | `thincoder-cli/src/acp/bridge.mjs` | 435（408 +27；≤440） | 头注 wire shape `:8-10` ∥ 单源 import `:34-36` ∥ `SUBAGENT_META_KEY` + `subagentMetaPayload` `:64-78` ∥ `onToken` 两支 `:216-228`（内联式退役为 `parseSubagentEvent` 单源调用；命中 + 前缀 ⇒ 恰一条 `session_info_update`） |
| 4 | `docs/batches/2026-10-04-acp-face-completion.test.mjs`（新） | 192 行 | T-862-1…12（直驱 `buildAcpCallbacks` stub） |
| 5 | 本档 §5（本段） | — | — |

**二、批内件红绿对数（先红后绿）**

- 红（实现前实跑）= **T-862-1…7 fail**（现盘零发射——`0 !== 1`）∥ **T-862-8…12 pass**（既有面基线：负向三条 + 回归两例）⇒ 5 pass / 7 fail。
- 绿（实现后实跑，两跑）= **12/12 pass**（初版 ∥ 审计后收紧版）。
- 收紧 = fix round 1（承内审列报④）：T-862-2/3/4/7 补全量计数断言 `assert.equal(notes.length, 1)` ⇒「恰一条」逐名锁死。
- 跑法 = `node --test docs/batches/2026-10-04-acp-face-completion.test.mjs`（自仓根）。

**三、机检读数**

- `node --check`（新叶 ∥ spawn-child ∥ bridge）——三档 exit 0（`Syntax OK`）。
- `node scripts/doc-check.mjs --root d:\teamcode\thincoder` = **exit 0**：锚 0 悬空（列报项均「迁移期引文 / 拟新增」不入闸）∥ 行宽 0 违规 ∥ 行数面 9 条报告态均为 desktop 面既有（非本批面）。
- **as-of 抽查（评审 #8 项）**：行数复读 = `bridge.mjs` 435 ∥ `spawn-child.mjs` 259（内容行数口径，文末换行不计）。schema 复取（gh-proxy 镜像——按其 2026-09-18 批档 §2.8 自述方式）= **HTTP 200 · 247168 字节 · SHA256 `3c17bd6385d90cf672d8a661fddc359d73422cf8b8ce6865213d25cfd4c0eca7` · 170 `$defs`**——三项与设计记值逐字相符。
- **零越表自证**：本舱写操作 = 上表 4 件 + 本档 §5——`git status` 复核：`spawn-child.mjs` ∥ `bridge.mjs` 于本舱开工基线后新入 M 面且 diff 即上表落点（+2/−1 ∥ +27）；两新档为 untracked 新增项；其余在飞 M/untracked 面为他批工作（本舱零涉）。

**四、审计与代码评审轮次与终态**

- **内审（divergence audit · explore · 1 轮）**：**clean**——四类（PARTIAL ∥ SILENT-SIMPLIFICATION ∥ DOC-DRIFT ∥ OUT-OF-LIST）均无；列报 4 项：① §5 未写入（时序——本段即销）；② 两项设计档笔未落（披露面，见六）；③ `API-CONTRACT.md` 生成区滞后（父侧项）；④ 用例计数严格性小注（已自修）。
- **代码评审（advisor · code · 1 轮）**：**pass**——🔴0 ∥ 🟡1 = `bridge.mjs` 435 行咨询档（optional——拆分缝与延后判由已在批档 `:116` 登记，未触 500 硬线）∥ 🔵3 = §5/§6 待补（收口轮）∥ 批档 `:17` 坐标微漂（`turn-loop.mjs:77`→`:80`；`spawn-child.mjs:177`→`:178`——收口轮随动）∥ 良构伪造继承暴露面登记建议（§12.6 设计档笔，见六）。
- **fix round = 1 轮**（评审前内审自修：T-862-2/3/4/7 计数断言补齐 + spawn-child diff 精确对齐 +2/−1）；评审零 must-fix ⇒ 无第 2 轮。
- **终态 = clean**。

**五、决策透明表（实现侧取值与判由）**

| 决策点 | 取值 | 判由 |
|---|---|---|
| 逐态字段序映射 | turn/approval ⇒ `fields[0]/[1]`（+ approval `fields[3]`）；queued ⇒ `fields[1]/[3]`；零字段态（async/cancelled/stopped/settled/done ∥ 未知名）⇒ 零载荷（0/0/名 填充不承载） | §12.3「逐态字段序 = 发射侧单源」——15 处发射点逐点实核对拍（dispatch `:199` ∥ turn-loop `:80` ∥ scheduler `:356` ∥ advisor-async `:263/:318/:421` ∥ subagent-run `:163` ∥ escalate-async `:193` ∥ subagent-async `:288` ∥ async-settle `:241/:279` ∥ subagent.mjs `:356` ∥ consult `:219` ∥ spawn-child `:178` ∥ subagent-panel `:194`） |
| 数值字段空串处理 | 空串视同无值 ⇒ 键省略（非 `Number("")=0`） | §12.2 两条并读：「字段无值 ⇒ 键缺席」+「Number 转换；非有限值 ⇒ 该键省略」 |
| role/id 段取 | relay 前缀**最内段**（`inner` 末节；单层取 `head`） | §12.2 表 + T-862-7 |
| 未知名事件 | 形态命中 ⇒ 非 null ⇒ 剥离 + `state`=原名（零字段）发射 | §12.4 单源（非空即剥——剥离语义零改的充分条件）+ §12.2 state 开集容忍 |
| 桥内联式退役 | 删旧注释两段（`tool_call_update` 另行跟踪——本批交付后失效；「有意为之」句） | D8 失效表达式删除；剥离判据改单源调用 |
| spawn-child 注释 | 原注释逐字保留 + import 行尾注迁位说明 | 批档 §2 受影响表量级（diff = +2/−1 精确对齐） |

**六、披露与上抛（不改、待父侧路由）**

1. **两项设计档笔未落（本舱零触）**：① `docs/core/design/PROVIDER.md` 未决句收正——现坐标 `:451`（设计引位 `:443` 因 #883 在飞改动漂移）+ 变更记录；② `docs/core/design/AGENT-LOOP-SUBAGENT.md` 文法单源指针（现态未落——全 docs grep `subagent-event.mjs` 该档零命中）。判由 = 派发书写域「批内 5 档」∥ D1（设计档笔 = eng-designer 域）∥ PROVIDER.md #883 冻结窗；§4 记「落实施收口轮」⇒ 请父侧路由。
2. **API-CONTRACT.md 生成区滞后**：`spawn-child` 行位表偏 1、新叶未登记——生成器（`scripts/api-contract.mjs`）唯一笔，不在本舱写域；建议父侧收口轮以生成器刷新。
3. **评审 🔵 登记建议**：结构化发射判据 = 形态 + 前缀（不区分子代理 LLM 伪造的良构 token——显示面同款暴露既有且已接受）——如需，§12.6 补一句登记（设计档笔）。
4. **批档 `:17` 坐标微漂**（见四）——收口轮随动。

## §6 验证与收口（父代理）

**收口判词：已收口 2026-10-04**（ACP 协议面补全批——#862 结构化子代理事件 + #843 定形不立；批链：设计（AC12 收窄 + §12/§13 定形）→ 评审 #8（🔴0/🟡4/🔵3 → 修正轮 6/6）→ §4 代签（12:44）→ 实施 #27（审计 clean ∥ 代码评审 pass）→ 本节核销）

- **判据链**：批内件 T-862-1..12 **先红 7✖/5✔ → 后绿 12✔/0✖**（父侧收口复跑：仓根 `node --test docs/batches/2026-10-04-acp-face-completion.test.mjs` = **exit 0 · tests 12**）∥ `node --check` 三档 exit 0 ∥ as-built：新叶 `thincoder-core/agent/subagent-event.mjs` 71 行（估 ~85——功能面满载，非简化）∥ `spawn-child.mjs` 259（+2/−1）∥ `bridge.mjs` 435（≤440 咨询线）∥ schema 复取三项逐字对（247168 字节 ∥ SHA256 `3c17bd6385d90cf672d8a661fddc359d73422cf8b8ce6865213d25cfd4c0eca7` ∥ 170 `$defs`）。
- **收口测试行**：本批单元件 = `docs/batches/2026-10-04-acp-face-completion.test.mjs`（192 行 · 12 例 · 随批留存）；集成面 = 无新增 ∥ 无修订；仓套件 = 未跑（仓 `test/` 树空清单——批内件复跑为本批唯一运行）。
- **doc-check**：**exit 0**（父侧收口直跑：悬空 0）；行数面报告态全部归因他批面（机检过滤：本批文件名 0 命中）。
- **收口笔（父侧 · 逐处可 revert）**：① `docs/core/design/PROVIDER.md:451` 提示通道句收正为定形「不立」（+ 变更记录行）；② `docs/core/design/AGENT-LOOP-SUBAGENT.md:77` 文法单源指针（+ 变更记录行）；③ `docs/cli/design/ACP-CLIENT.md` §12.6 补发射判据登记（评审 #8 🔵）；④ `docs/core/design/API-CONTRACT.md` 生成区刷新（2881 条——`api-contract --write` + `--check` **exit 0**）；⑤ 批档 §2 坐标微漂（`turn-loop.mjs:77 ⇒ 实 :80`；`spawn-child.mjs:177 ⇒ 实 :178`）随动在案。
- **在册（非阻断）**：① `bridge.mjs` 435 行（500 硬线内 · 拆分缝已登记）；② #843 定形 = **不立**（§13 在档——零代码；协议面零提示行 = 设计行为，非缺口）；③ 显示面三消费点收敛 ∥ 生成侧构造器化 = 登记（另批）。
- **前批遗留交叉核**：无（独立批）。
- **结算**：台账 #862 核销 ∥ #843 结案（追认核销——设计定形结案）∥ 签入（双远端）。
