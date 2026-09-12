# AGENT-LOOP — 需求（VSC 仓）

> 板块：Agent 循环（主循环 / 子代理生命周期 / 异步化）——本端自持需求档（**接收面**）。
> 本档为**本仓自持需求档**：需求住本仓；与对端仓（CLI）需求档**语义同源、本端原文自持**（不做逐字一致——在案多实现面纪律）。
> 设计见本仓设计层（`AGENT-LOOP（本仓·设计）` / `WEBVIEW（本仓·设计）`）；批次档见本仓 `docs/batches/`。
> 状态：**现行**（本批首建——接收对端托管内容）。

## 迁移注记（台账自持批 LEDGER-SELF-CONTAINED——2026-09-12）

- **来源**：`AGENT-LOOP（CLI 仓·需求）`（源档 blob SHA = `ccd6bd14b97674dce4a33c7781d75374e23ddab`）——
  其 §9 / §10 / §11 / §12 / §14 / §16 / §17 共 **7 节** = 历史「需求落本档」托管族（本端无需求树时期寄于对端需求档）。
- **本档节号 = 源档节号**（保留原编号；本档只承载该托管族，故编号不连续）。
  **非托管族各节仍住源档**：§1–§8（对端 CLI 面 / 共用机制面）、§13（VSC 上下文注入面——未列入本批 C 桶射程）、§15（CLI 单端面）。
- **内容形态 = 逐字迁移**（不改写、不摘要）；仅**跨端引用形态**按落地仓收敛：
  `（VSC 仓）` → `（本仓·设计）` / `（本仓·需求）`；对端档引用 → `名称（CLI 仓·层别）§N`；对端源码路径 → `` `src/…`（CLI 仓） ``。
- **源档移出清单**（切掉的行 + 源档 blob SHA）= 见源档档首「移出清单」块（D11「带清单的搬迁」——可审计、非静默）。

## 本档承载范围（对位索引——需求 → 设计 → 批次）

| 本档节 | 机制 | 设计（本仓） | 源批次（本仓批档） |
|---|---|---|---|
| §9 | async 子代理保真（丢弃可见 / 无孤儿 / 终态可辨） | `AGENT-LOOP（本仓·设计）§12` | `2026-09-11-VSC-ASYNC-PARITY（本仓）§1` |
| §10 | webview Markdown 行内代码字面量契约与转义回归 | `WEBVIEW（本仓·设计）§10` | `2026-09-11-VSC-WEBVIEW-ESCAPE（本仓）§1` |
| §11 | 评审链 / 异步残留收口（advisor 池中止 + digest 注入预算） | `AGENT-LOOP（本仓·设计）§15`（B1）· `§16`（B5） | `2026-09-11-VSC-REVIEW-ASYNC-SWEEP（本仓）§1` |
| §12 | 固定活动区回归（live 固定可见 · 区内原地保留） | `WEBVIEW（本仓·设计）§12` | `2026-09-11-VSC-ACTIVITY-REGION-RESTORE（本仓）§1` |
| §14 | live 块 UX（流式跟滚 + 内容区高度） | `WEBVIEW（本仓·设计）§13` | `2026-09-11-VSC-LIVE-UX（本仓）§1` |
| §16 | 活动区收口（终态清退落流 · digest 可读性 · 字段对齐） | `WEBVIEW（本仓·设计）§14` | `2026-09-12-VSC-ACTIVITY-CLOSURE（本仓）§1` |
| §17 | 子代理审批面对齐（child permission gate） | `AGENT-LOOP（本仓·设计）§18` | `2026-09-12-VSC-CHILD-PERMISSION（本仓）§1` |

> **板块边界注**：§10 / §12 / §14 / §16 的实现面在 webview——本端设计对位 = `WEBVIEW（本仓·设计）`（异名对位：CLI `TUI` ↔ 本端 `WEBVIEW`）。
> **引用形态规范**：引用他仓文档写「名称（仓别·层别）§N」（去 `.md` 后缀、去路径前缀）；同名 basename 跨层 / 跨仓多义时**层别词不可省**——
> 本仓 `AGENT-LOOP` 现有需求 + 设计两档，`WEBVIEW` / `ENGINEERING-MODE` / `TOOLS` 同（需求档 ↔ 设计档）。

## 9. VSC async 子代理保真：丢弃可见 / 无孤儿 / 终态可辨（VSC——GitHub #6——第 35 批，2026-09-11）

> 来源：批次 `2026-09-11-VSC-ASYNC-PARITY（本仓）§1`（GitHub #6 · GCZ-jpg 2026-09-06：
> 「新消息把还在跑的子代理杀了——修复只落在了 CLI，扩展端没同步到」+ 2026-09-06 真实事故：
> eng-coder 写一半被杀无报告 / explore 零产出 / 主会话误读「已消费」）。
> 设计+测试见 `AGENT-LOOP（本仓·设计）§12`。

**现场复核前置（2026-09-11 设计勘验——issue 断言不得直接当任务派）**：issue 四根因中两条的**机制面在现行树已不成立**——
① 「async spawn 返回 raw object」：spawn ack 早已是 JSON 字符串（`src/agent-tools/subagent-async.mjs:326/342`（本仓），
与 CLI `src/agent-tools/subagent-run.mjs:193/201`（CLI 仓）对位），且被工具契约测试锁定（`test/batch-doc-gate.test.mjs:79`）；
④ 「空池恒返 `{done:true}`」：`check` 动作已随 §19.8（2026-09-06）删除（结果仅自动通道）。
而**症状面仍真实**：中止（Stop）导致的丢弃静默、孤儿（存活子代理脱离池）报告静默丢失、终态误读——
落点即下列 F-G1~F-G7（逐条机制证据见设计档 §12.1 复核表）。

### 9.1 总体需求

用户（VSC 面板使用者）的后台异步子代理在主会话被中止（Stop）或会话收尾时，必须**有据可查、有终可判**：
被杀（丢弃）的子代理不得静默消失——模型与用户都能知道「谁被杀、报告不会到达」；**不得留下仍在运行却已脱离池的孤儿**
（其报告静默丢失）；事后按 id 查询必须能区分「已丢弃 / 已取消 / 已送达 / 从未存在」，不得把丢弃读成「结果已消费」。
同时锁死工具结果契约：异步 spawn 返回的字符串可解析出 id（模型拿得到 id），工具返回**非字符串**必须响亮失败——
不得静默变 `[object Object]`。

### 9.2 功能性需求（判定句逐条——设计 AC 逐条回指）

| # | 需求 | 判定句（验收语义） | 范围边界（不做） |
|---|---|---|---|
| F-G1 | spawn ack 契约锁定 | async spawn（running / queued 两形态）工具结果为**字符串**且 `JSON.parse` 得 `{id, role, status}`——id 与池条目一致 | 不改 ack 字段集/命名；不做 id 类型归一（两端差异登记） |
| F-G2 | 非字符串工具结果响亮失败 | 工具返回非字符串（对象/null/undefined/数字）时：工具结果 = 可见 `Error:` 串并点明「must return a string value」；池/调度/落盘零副作用 | 不改正常字符串路径；不把对象静默 JSON 化当兜底 |
| F-G3 | 丢弃必留痕（模型可见） | 中止导致条目出池（丢弃）时：整批**恰一条** user-role 提醒，列每个被丢弃条目的 `role#id` 与当时状态，并明说报告不会到达；零丢弃 → 零提醒 | 不改 ⟦ev⟧ 事件族与 webview 文案；不改既有 cancel 提醒文案 |
| F-G4 | 无孤儿（清池只清已死） | 中止分支只清「已死」条目（子信号或条目 controller 已中止）；**存活条目留池**且 `history._asyncSubagents` 仍持该 Map；**已完成未取回（done-in-pool）条目不被清** | 不中止存活条目（F-6 裁定：Stop 不停后台池）；不改 ContinueError / interrupt 分支语义 |
| F-G5 | 会话不因中止轮搁置后台池 | 会话内 digest 轮被 Stop 中止（AbortError）→ 会话继续驱动（池 live 即继续等待/消化），不退出不搁置；非用户中止异常照旧上抛 | 不改会话退出条件（池空/无 pending 自然退出）；不吞非 AbortError |
| F-G6 | 终态可辨（status 面） | `subagent status <id>` 对已丢弃 / 已取消 / 已送达 / 失败条目回显对应终态 + 注记（不再回 unknown）；**从未存在**的 id 仍回 unknown | 不改无 id 概览形态与 running/queued 字段；不改 cancel / observe / send 判定 |
| F-G7 | dependsOn 面停靠对齐 | 丢弃条目落终态记录后，依赖它的后续 spawn 走 `cancelled` 分支（依赖者驻留标 depc 等父决定）——不得静默放行、不得冒 unknown 硬错 | 不给调度器新增 state 值；不改 depc 文案与 AUTO 放行规则 |

### 9.3 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| N-G1 | 零回归 | 既有异步族测试全绿（async-visibility / subagent-observe-send / subagent-id-counter / chat-panel / webview-turnstate / digest-visibility / advisor-guard-completion）；webview 面零改动 | `npm test`（快层）全绿；`webview/` 文件零 diff |
| N-G2 | 可机判 | 每条功能需求由新增档 `test/async-parity.test.mjs` 机判（真模块直驱：discard helper / finalizeAgentTurn / status 动作 / 桩面板 suspensionSession / executeToolBatches） | 新档全绿 + 反例（修前红）可复现；登记 `test/files.mjs` |
| N-G3 | 对位与登记 | CLI 面代码/测试零改动；两端差异逐条登记（Stop 语义：CLI 全停清池 vs VSC F-6 只停轮留存活的；CLI 无丢弃提醒与丢弃终态记录） | 设计档 §12.8 差异表；CLI 仓 `git status` 零改动自证 |
| N-G4 | 文档与行数 | 本批触碰档 `check-doc-width` 新增违规 0；实现档行数守 500 硬限（撞线停下报告，不带代偿） | `node scripts/check-doc-width.mjs` 两仓 + 行数实测表（设计档 §12.4） |

### 9.4 明确不做

- 不改 CLI 仓代码与测试（只读对位）；不修 **advisor 池**同构问题（同一中止分支的 `_asyncAdvisors` 面——登记设计档 §12.8，父侧排程）——**（收口 2026-09-11：群 B 批承接——本档 §11 F-I1。）**；
- 不重开 F-6 语义（不恢复 Stop 全停）、不动 INPUT-LOCK / 忙态 / 挂起会话既有裁定；
- 不改 webview 呈现（块/行/⟦ev⟧ 事件族——他批面）、不新增块状态、不新增工具动作（`status` 只扩终态回显）；
- 不做跨会话（扩展重载 / 会话切换）后的丢弃追溯——终态记录沿 history 会话级存活；
- 不新建文档档。

## 10. VSC webview Markdown 行内代码：字面量契约与转义回归（VSC——GitHub #7——第 34 批，2026-09-11）

> 来源：批次 `2026-09-11-VSC-WEBVIEW-ESCAPE（本仓）§1`（GitHub #7 · zacharyyyang 2026-09-08：
> 「行内代码中的 HTML 标签未转义，导致后续回复隐藏，看起来像任务中途停止」——复现 = 合成 markdown，不依赖模型 / 网关）。
> 设计 + 测试见 `WEBVIEW（本仓·设计）§10`。

**现场复核前置（2026-09-11 设计勘验——issue 的 file:line 与根因不得直接当任务派）**：issue 定位的
「`md()` / `mdInline()` 未转义插入」对发布版 0.8.10 成立、对现行树**不成立**——`webview/md.js` 已于
2026-09-05（本仓提交 `a3aea39`）重写为 esc-first 架构（先整体转义、再内联构建），issue 的最小复现在
现行树输出 `&lt;script …&gt;`（无字面 `<script`；旧版逐字节复现与对拍证据见设计档 §10.1）。
**而 issue 修法方向 1 的实质目标——行内代码内容不被后续 Markdown 替换二次处理——在现行树仍未满足**
（证据：设计档 §10.1 复核表 R-2）——落点即下列 F-H1~F-H4。

### 10.1 总体需求

VSC 面板回复里的**行内代码**必须按字面量呈现，且渲染管线**不得吞掉任何内容**：代码里的 HTML 标签 /
尖括号 / `&` 以文本显示（不是元素）、代码里的 `**`/`*`/`~~`/链接/图片标记不被解释、代码之后的内容
完整可见（issue 的「像中途停止」= 渲染截断，实际会话记录完整）；代码范围之外的原始 HTML 一律按
文本转义（无 passthrough）。

### 10.2 功能性需求（判定句逐条——设计 AC 逐条回指）

| # | 需求 | 判定句（验收语义） | 范围边界（不做） |
|---|---|---|---|
| F-H1 | 行内代码字面量 | 行内代码内容不参与 Markdown 解释：`` `**x**` `` 输出 `<code>**x**</code>`；`` `*x*` `` / `` `~~x~~` `` 同规；代码内的链接 / 图片标记保持字面（`<code>` 内零 `<a>` / `<img>` / `<strong>` / `<em>` / `<s>`） | 不改 fenced 代码块 / 表格结构 / 链接 / 列表语义；不发散为 CommonMark 全集（多反引号围栏、代码内反斜杠折叠、多行段 `<br>` 形态——现状保持并登记） |
| F-H2 | HTML 转义（代码内与代码外） | 行内代码含 `<script …>` / `<style>` / `<textarea>` / `<img onerror=…>` 时输出 `/<(script\|style\|textarea)/i` 零命中；`&` / `<` / `>` 以 `&amp;` / `&lt;` / `&gt;` 文本呈现 | 不改 esc-first 架构与转义字符集（`&<>"`）；不新增 raw HTML passthrough |
| F-H3 | 后续内容完整可见 | issue 最小复现（行内代码含 `<script type="application/ld+json">` + 后段）输出含后段文本且无字面 `<script`；裸 `<script>` / `<img onerror=…>` 亦为文本 | 不做历史消息重渲染；不改流式 rAF 渲染时机与滚动 |
| F-H4 | 单实现点覆盖全调用面 | `md()` / `mdInline()` / 表格单元格 / 引用块 / 列表（含嵌套·任务项）/ 标题各行内代码路径同契约（同一 `inline()` 实现点——mdInline 零额外改动） | 不新增第二套内联渲染器；不改块级解析次序 |

### 10.3 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| N-H1 | 零回归 | 既有快层全绿（基线 as-of 2026-09-11：tests 447 · pass 441 · fail 0 · skip 6）；**语料对拍范围内**，代码范围之外的渲染输出与修前逐字节一致（差异全部落在 `<code>` 内）；**跨界配对族例外**（代码段内标记与段外标记配对型——保护契约的预期后果，差异可外溢到 `<code>` 之外；按设计 §10.6 T-H15 字面量白名单机判 · §10.8 登记） | 快层运行 + 设计档 §10.1 行为差异表 + T-H15 白名单断言 |
| N-H2 | 可机判 | 每条功能需求由新增档 `test/md-render-escape.test.mjs` 机判（纯函数直驱 `webview/md.js`——渲染器无 DOM 依赖）；登记 `test/files.mjs` | 新档全绿 + 档内登记自断言 |
| N-H3 | 双端纪律 | 纯 VSC（CLI TUI 无 webview 渲染器）——CLI 仓代码 / 测试本批零改动；无镜像义务 | CLI 仓代码 / 测试路径（`src/` · `test/`）本批新增 0（交付时 `git status --porcelain -- src test` 与开档快照差集为空——批次档 §2 修正块） |
| N-H4 | 文档与行数 | 本批触碰档 `check-doc-width` 新增违规 0；`webview/md.js` 守 ≤500 硬限（现 261 行） | 两仓 `node scripts/check-doc-width.mjs` |

### 10.4 明确不做

- 不改 fenced 代码块 / 表格结构 / 链接 / 列表 / 标题既有语义（各自已成形的面）；
- 不引入 raw HTML passthrough（保持「全转义」策略——待裁 2 裁定 = 保持）；
- 不做 CommonMark 全语义对齐（多反引号围栏、代码内反引号、实体与制表符细节不在本批）；
- 不重渲染历史消息；不改流式节流与滚动；
- 不做发布面（版本号 / CHANGELOG / Marketplace 发布——0.8.10 用户可见的旧行为依赖下次发布，父侧排期）；
- 不新建文档档。

## 11. VSC 评审链 / 异步残留收口（群 B——条目 B1 / B5，2026-09-11）

> 来源：批次 `2026-09-11-VSC-REVIEW-ASYNC-SWEEP（本仓）§1`（用户 2026-09-11 16:45「都一起做了」
> + VSC 未做项普查——条目 B1 = 本仓 `AGENT-LOOP（本仓·设计）§12.8` #1 登记复议；B5 = 本仓 `docs/TODO.md` 需求池
> 「digest 注入预算扩面」）。设计+测试见 `AGENT-LOOP（本仓·设计）§15`（B1）与 `§16` + 设计档 `AGENT-LOOP（CLI 仓·设计）§22`
> （B5——双端语义源）。同批 B2/B3/B4 条目
> （VSC 评审链面）需求落 `ADVISOR-CONVERGENCE（CLI 仓·需求）§13`（同批分面——两份载体）。

**现场复核前置（设计勘验——登记行不得直接当任务派）**：B1 原判「登记不改」为第 35 批的**排程理由**
（advisor 池面属他批——§12.8 #1 自注「修法同 C-1~C-4（同一分支复用判定）」）——复议指令下经
现场复核：缺陷实存（中止分支 `run-stages.mjs:271-277` 仍 `advMap.clear()`；advisor 条目 controller 链会话
signal——`advisor-async.mjs:259-268`，与子代理同款孤儿前提）且修法面全现成（谓词/池 accessor/墓碑/status
回显零新增）⇒ 本批**修**（完整论证见设计档 §15.1）。

### 11.1 总体需求

VSC 面板会话中，后台 advisor 评审池与子代理池享有**同一条中止不变量**：用户 Stop（非 interrupt）时，
**清池 ⟺ 该条目已死且其报告不可达**。存活评审（持会话 signal——F-6 裁定：Stop 只停当前轮）不得被静默
清出池（其报告仍应沿自动通道到达）；已完成未取回（done-in-pool）的评审报告不得被丢弃；被丢弃的评审必须
**有据可查**——模型与用户都能知道「谁被丢弃、报告不会到达、未签发 token」，事后按 id 查询能区分「已丢弃 /
已取消 / 已送达 / 从未存在」。同时，后台结果注入（digest）的**单轮累计预算**必须覆盖全部结果族与全部注入
路径——多族合并轮不得把请求体撑爆（BATCH-3 F-2 事故面），且预算记账**单源**（常量 / 判超 / 落盘一处定义）。

### 11.2 功能性需求（判定句逐条——设计 AC 逐条回指）

| # | 需求 | 判定句（验收语义） | 范围边界（不做） |
|---|---|---|---|
| F-I1 | advisor 池中止收口（VSC） | 中止分支只清已死 advisor 条目：被丢弃条目出池 + `discarded` 终态记录 + **恰一条** user-role 提醒（列 `advisor#id (design\|code)` 与「报告不会到达」「未签发 token」语义）；存活条目留池（报告仍到达）；done-in-pool 留池；**零丢弃 → 零提醒零日志**；`subagent status <id>` 对丢弃 id 回 `discarded`（不再 unknown） | 不重开 §9 已交付子代理面契约（C-1~C-9 语义零改——只扩 advisor 同构面）；不中止存活评审；不做自动重发；不改会话收尾站清池（§12.8 #6 登记维持） |
| F-I2 | digest 注入预算统一（双端） | 单轮（相邻注入间 history 无其他落史）合计 ≤64K 覆盖四族（subagent / advisor / escalate / consult）与全部注入路径（派发 + 直采）；超限条目改行内清单行 + 全文落盘（落盘失败回退 inline——结果零丢失）；首条豁免（单条大报告不回归）；记账单源（共享模块一处定义常量 / 判超 / 落盘） | 不改 offloadToolResult 单条路径与阈值；不改轮界定语义（相邻注入 = 同轮）；不改各族标签文案与墓碑语义；不做跨轮累计 |

### 11.3 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| N-I1 | 零回归 | 两仓快层全绿；§9 已交付契约（提醒文案 / 终态回显 / 依赖停靠）逐字零回归；BATCH-3 既有预算用例零回归 | 两仓 `npm test`（VSC 快层含 `test/files.mjs` 全册）+ 指名用例 |
| N-I2 | 可机判 | 每条功能需求由指名档机判（扩既有档、不新立：VSC `async-parity.test.mjs` / `eng-settlement.test.mjs`；CLI `async-settle.test.mjs`） | 新用例全绿 + 修前红可复现 |
| N-I3 | 双端与文档 | B1 = VSC 单端（CLI 对位零改——差异登记）；B5 双端同语义、各端独立实现、零跨仓依赖（无 import / 无同步脚本）；两仓 `check-doc-width` 新增违规 0；实现档守 500 硬限（贴线停下报告） | CLI 仓 B1 面 `git status` 零改动；行数实测表（设计档 §15.4 / §16.4）；宽度脚本两仓 |

### 11.4 明确不做

- 不重开 F-6 裁定（Stop 不停后台池）与 §9 已交付契约（只扩 advisor 面）；不改会话收尾站清池（§12.8 #6）；
- 不改 CLI advisor 池同款面（CLI Stop = 全停——清池即诚实；§12.8 #2 登记维持）；
- 不改 pending 单容器 / park / settle 记账语义；不改 UI / webview（零 UI 面）；
- 不做跨会话（面板销毁 / 扩展重载）丢弃追溯；不建跨仓依赖、不写同步脚本；
- 本 §11 不含 B2/B3/B4 条目（→ `ADVISOR-CONVERGENCE（CLI 仓·需求）§13`）；不新建文档档。

## 12. VSC 固定活动区回归：live 固定可见 · 区内原地保留（webview——活动区回归批，2026-09-11）

> 来源：批次 `2026-09-11-VSC-ACTIVITY-REGION-RESTORE（本仓）§1`（用户 2026-09-11 17:20 质询
> 「块为什么在会话流里」+ 17:23 裁定「加回固定活动区」）——目标 = 09-09 前段裁定 D-1 原话
> （**live 固定可见 + 一个面板**），并保留 09-11 批 10 全部可靠性机制（投递队列 / 就绪握手 /
> 终态防御）与 queued 可见性（F-2）——「干净地基上的活动区」，非补丁形态。本条目 = 批次 R1–R8
> 逐条对位（判定句回指 AC-R1..AC-R10）。
>
> **2026-09-12 修订（活动区收口批——A 方案反转）**：冻结块去向由「区内原地保留」反转为
> **终态清退 + 消化后落流**（awaitingDigest 驻留带提示 → 回收归档 `#messages`）；settled 由
> 「视同 done 即时折叠」改为 **awaitingDigest 驻留**。本 §12 的 F-J1 / F-J3 / F-J6 已随修订；
> Q1/D-A1/D-A2、§12.3#4（区上限 20）、§12.4 落流行、§12.7 T-R8、§12.8 AC-R3、§12.10 以 §16 为准
> （用户 2026-09-12 01:09「1走A」；设计 = `WEBVIEW（本仓·设计）§14`）。
> 设计+测试见 `WEBVIEW（本仓·设计）§12`（§12.1–§12.10）+ §2/§3/§5/§5.1 修订；机制面
> （挂起 UI 与中止语义）见 `AGENT-LOOP（本仓·设计）§7/§10`。

### 12.1 总体需求

用户（VSC 面板使用者）的后台活动（子代理 / consult / escalate / advisor-async 活动块）必须
**live 固定可见**：块出生在会话流与输入之间的固定活动区（`#subagent-activity`），**全程不随会话流
滚动丢失**、**一个面板**（单活动区——非行面板复活）；块生命周期维持 live → frozen 两态、终态
**原地折叠**（容器与 DOM 序号不变；**2026-09-12 修订**：终态折叠后**消化回收即归档落流**——
见 §16 F-R1）；同时 09-11 批 10 的全部可靠性机制（出生必达 / 终态必现 /
块身份唯一 / 控制面不降级 / 清屏可恢复）与 queued 可见性（⏳ 头 + 取消 ⏹）语义零回归。

### 12.2 功能性需求（判定句逐条——设计 AC 逐条回指；对位批次 R1–R8）

| # | 需求（批次对位） | 判定句（验收语义） | 范围边界（不做） |
|---|---|---|---|
| F-J1 | 活动区回归——live 固定可见 + 单面板（R1） | 一切出生块 parentNode === `#subagent-activity`（区尾出生）；区驻留期（live + awaitingDigest）不移动；**终态（含消化回收）归档落流**（§16 F-R1——2026-09-12 反转；原「全程不移动 / `#messages` 零 `.sub-block`」限缩为区驻留期）；区位于 messages 与面板/输入之间（index.html 结构断言）——AC-CL1 | 不做行面板复活；不做 CLI 端（原「不改扩展端协议」＝活动区回归批边界；本批消息面增补登记见 §16 N-CL1） |
| F-J2 | 可靠性零回归（R2） | 折叠原地（容器与 DOM 序号不变）；终态闭合 / 幂等守卫 / queued / 补桩 / 接管断言全绿；批 10 实现面零改（投递队列/握手/终态防御）——AC-R2 · AC-R7 | 不改批 10 实现（extension 端零改）；不重做池快照（REMOVE-POOL-SNAPSHOT） |
| F-J3 | 冻结块去向 = 消化后落流（R3——**2026-09-12 反转**） | settled → awaitingDigest 驻留（带提示——§16 F-R3）；消化回收（reclaim done）→ 出区 + 归档进 `#messages`（内容可读可展开；落点 = 消化轮边界元素之前，兄弟序保序）；无待消化终态 → 即时归档尾追；全完成后区 `:empty` 零高——AC-CL1 · AC-CL3 | 旧 DOM-move 锚链仍禁（新机制见 §16 F-R1 与 `WEBVIEW（本仓·设计）§14.4`）；不做折后即移除（归档取代移除） |
| F-J4 | 区显隐 = 有内容才现（R4） | 空区 children == 0 且 `:empty` 规则在位（零显隐 JS）；块入区即现——AC-R4 | 不做常驻空面板；不做「有 live 才现」 |
| F-J5 | 区高度/自滚（R5） | 32vh 封顶 + 区内自滚 + pin 跟随（静态样式断言 + 近底 24px 解/重 pin）——AC-R5 | 不改 `#messages` 滚动语义；不固定高 / 不封顶 / 不 pin |
| F-J6 | 与 digest / 挂起态交互（R6——**2026-09-12 修订**） | settled → awaitingDigest 驻留（带提示）；消化回收 → 归档落流（落点随消化轮边界）；挂起期 live 固定可见；suspension 退出兜底 = 区全体（live + awaitingDigest）折叠归档落流——AC-CL1 · AC-CL3 | 不复活旧锚插链（新机制见 §16）；不改 digest 注入语义 |
| F-J7 | ⏹ 委托与 reset 语义（R7） | ⏹ 委托目标迁区后 postMessage 载荷与 preventDefault/stopPropagation 逐字不变；resetActivity 全区清（含折叠）+ 清 map——AC-R8/AC-R9 | 不改 ⏹ 可见性判据；不跨清屏保留折叠块 |
| F-J8 | 测试族更新 + 文档面（R8） | activity-flow 族改写为区语义（含 T-R13 ⏹ 委托真 chat.js 图驱动）；async-visibility 位置断言改区；webview-env fixture 区 id 回归；设计修订在位 + `check-doc-width` 新增 0——AC-R10 | 不拆测试族（就地改写）；不动群 A §11 节域 |

### 12.3 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| NFR-J1 | 零回归 | VSC 快层全绿；extension 端 `git diff` 空（协议零改）；trace/接管/补桩调用点在位 | 既有族运行 + 机检（AC-R7） |
| NFR-J2 | 可机判 | 每条功能需求由 happy-dom 驱动真 webview 模块机判（区出生/折叠原序/上限/显隐/自滚/委托） | 用例表 T-R1..T-R16 全绿（VSC 测试族） |
| NFR-J3 | 双端不对称 OK | CLI 单面板形态照旧（零改）；各端独立实现、语义同源（不做逐字镜像） | CLI 仓本面零代码改动（`git status` 断言） |
| NFR-J4 | 文档与行数 | 本批触碰档 `check-doc-width` 新增违规 0；源档守 500 硬限（activity.js ~313 越 300 软线——登记不拆） | 两仓宽度脚本 + 行数实测表（设计 §12.6） |

### 12.4 明确不做

- 不做 CLI 端（单面板照旧）；不动扩展端协议与实现（投递队列 / 握手 / 终态防御零动）；
- 不做行面板复活；不做跨 reload 恢复；不加新交互元素 / 新 locale 键；不动块内渲染改造；
- 不动 advisor 流内块（`S._advisorBlock` ∈ `#messages`）；群 A §11 节域零碰（A10/A13 各自批）；
- 不新建文档档。

## 14. VSC live 块 UX：流式跟滚 + 内容区高度（webview——VSC-LIVE-UX 批，2026-09-11）

> 来源：批次 `2026-09-11-VSC-LIVE-UX（本仓）§1`（用户 2026-09-11 23:29 实测两条：live 块
> 默认显示内容头部、不跟流式输出滚动、得手动滚；live 块高度 100 → 60）。
> 设计+测试见 `WEBVIEW（本仓·设计）§13`（§13.1–§13.9——现场核实/选型/契约/决策/用例/AC/边界）+
> §12.3 第 6 条高度句改指；机制面零动（本批只动 VSC webview 呈现——CLI 仓零改）。
> 本条目 = 用户实测两条逐条对位（判定句回指设计 AC-LU1..AC-LU7）。

### 14.1 总体需求

VSC 面板使用者在子代理 live 块流式输出期间**持续看到最新输出**：块内容区默认钉底跟随；用户手动
上滚即让位（不被拽回）；滚回近底后自动复钉。块内容区高度由 100px 调降为 **60px**（单块占高更小、
多块不挤会话）。跟滚语义与既有钉底族（`#messages` / 活动区 pin）同源，不新造第三种滚动模式。

### 14.2 功能性需求（判定句逐条——设计 AC 逐条回指）

| # | 需求（批次对位） | 判定句（验收语义） | 范围边界（不做） |
|---|---|---|---|
| F-LU1 | live 块流式跟滚（U1） | 内容区追加后默认钉底（追加帧后 scrollTop = 超值——AC-LU1）；手动上滚（wheel/touchmove——近底判据 24px）后追加不回弹（AC-LU2）；滚回近底复钉（AC-LU3）；折叠（details 关闭）/已移除态零滚动副作用（AC-LU4） | 不动流内 advisor 块的既有裸钉底；不改区级 pin（`maybeScrollActivity`）；无新交互元素 / 新 locale 键 |
| F-LU2 | live 块内容区高度 100→60（U2） | `.advisor-block.sub-block .advisor-content` max-height == 60px（静态断言——AC-LU5）；基础 `.advisor-content`（advisor 流内评审块）维持 100px；chat.css 注释同步改述 | 不改 advisor 评审块高度；不改区高度（32vh）；冻结块同 60px（同族卡面统一——live/frozen 不二分） |

### 14.3 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| N-LU1 | 零回归 | VSC 快层全绿；流内 advisor 块 `_advisorScrollDirty` 路径零改；CLI 仓代码零改动 | 既有测试族运行 + `git status` 机检（AC-LU6） |
| N-LU2 | 可机判 | 每条功能需求 ≥1 用例机判（happy-dom 直驱真 webview 模块——追加钉底/让位不回弹/复钉/折叠零副作用/CSS 断言） | 新档 `test/activity-live-ux.test.mjs`（入 `test/files.mjs` 登记）全绿（AC-LU1..AC-LU5） |
| N-LU3 | 文档与行数 | 触碰档 `check-doc-width` 新增违规 0；源档守 500 硬限（activity.js ~354——越 300 软线登记）；测试面独立新档（activity-flow 486 近满不追加） | 两仓宽度脚本 + 行数实测表（设计 §13.5） |

### 14.4 明确不做

- 不做 CLI 端（CLI 无 live 块 UI——代码零改动）；不动扩展端协议与实现；
- 不动流内 advisor 块（`S._advisorBlock`）的跟滚与高度（用户原话指 live 块；如要同口径，用户一句话）；
- 不改区级 pin / 块头 / tail-3 摘要 / ⏹ 语义；不加新交互元素 / 新 locale 键；不新建文档档。

## 16. VSC 活动区收口：终态清退落流 · digest 可读性 · 块头/状态行字段对齐（webview——活动区收口批，2026-09-12）

> 来源：批次 `2026-09-12-VSC-ACTIVITY-CLOSURE（本仓）§1`（用户 2026-09-12 走查：
> 01:03「live 块执行完没有从子agent面板清除，digest 过程远不如 CLI 清晰」· 01:09「1走A」
> （A 方案 = 终态块出活动区、内容进会话流 = CLI 语义——对 §12 F-J3 的反转）· 01:10「live 块的
> 标题信息我也希望对齐」· 01:13 Send 可见性与拒发矛盾 · 01:17「状态行那条，我也希望对齐 CLI」）。
> 设计+测试见 `WEBVIEW（本仓·设计）§14`（§14.1–§14.10）+ §2/§3/§5/§5.1/§6/§7.4/§12 修订；
> 机制面（挂起 UI 与中止语义）见 `AGENT-LOOP（本仓·设计）§7/§10` 修订。本条目 = 批次 R1–R6 逐条对位（判定句回指 AC-CL1..AC-CL6）。

### 16.1 总体需求

VSC 面板使用者的子代理活动块**终态即清退**：live 阶段固定驻留活动区（既有语义保留）；awaitingDigest
阶段驻留并带明确提示；消化回收后**归档进会话流**（内容可读、可展开，落点与消化轮同序）；全部完成后
活动区不再常驻（`:empty` 零高）。消化轮（digest）在会话流中**可见可辨**（专属回合标签 + 每轮独立
状态元素 + turn-cap 可见行）；块头与状态行**字段级对齐 CLI**；主会话活动期 Send 按钮不再出现
「可点但必被拒」的假 affordance。

### 16.2 功能性需求（判定句逐条——设计 AC 逐条回指；对位批次 R1–R6）

| # | 需求（批次对位） | 判定句（验收语义） | 范围边界（不做） |
|---|---|---|---|
| F-R1 | 终态块清退 + 落流（A 方案——R1） | settled → awaitingDigest 驻留（带提示——F-R3）；消化回收（reclaim done）→ 出活动区 + 归档进 `#messages`（内容可读可展开；落点 = 消化轮边界元素之前、保序）；无待消化终态 → 即时归档（尾追）；全完成后区 children == 0（`:empty` 零高）；会话退出兜底 = 区全体归档；reset 仅清区——AC-CL1 | 不复活 §12.4 点名的旧 DOM-move 锚链（替代机制见设计 §14.4）；不做折后即移除；不跨 reload 恢复 |
| F-R2 | digest 可读性（R2） | 每轮消化轮 = ① 专属回合标签行（i18n 落档）② 每轮独立状态元素（轮内原地更新、跨轮随流新增——跨轮漂移消除）③ 本轮 assistant 输出带回合标签（`assistantLabeled` 复位）；turn-cap 停止/自动续跑补可见行（CLI `agent-turn.mjs:188/:192` 对位——i18n 落档）——AC-CL2 | 不改 digest 注入语义与预算；不新增消息类型（cap 用既有 `digest` 族新 status 值） |
| F-R3 | awaitingDigest 块级提示（R3） | settled 未回收期间块头含对位态词（en = `done · awaiting digestion`；两 locale 落档）——AC-CL3 | 不改 ⏹/折叠语义之外的生命周期；单标志位（不建第二状态机） |
| F-R4 | live 块标题信息字段级对齐（R4） | 逐字段对位表（设计 §14.3 表 C-13）逐项落位：queued 位置/等待原因 · 当前工具 + 参数摘要 · turn 进展（`turn N/M`）· elapsed 定时刷新 · 模式词/模型（既有等价）；审批态 = 无数据源端差登记（VSC 子代理不经权限门——`execute-tools.mjs:258` depth===0）——AC-CL4 | 不新造 CLI 无的字段；不改 ⏹ 门控；不逐轮重建块（增量刷新） |
| F-R5 | 活动期 Send 可见性（R5） | `_turnState === "running"` ⇒ Send 不渲染（`display:none`——与 Stop 同派生点）；非 running ⇒ 恢复可见；Enter 出口守卫保留（拒发提示不变）——AC-CL5 | 不开「禁用态」第二形态；不改键位/toast/readOnly 语义 |
| F-R6 | 状态行字段级对齐（R6） | 逐字段对位表（设计 §14.3 表 C-15）逐项落位：状态文本段（TPM 限流等待 / 限流 429 / 服务过载重试 / 配额耗尽 / 索引进度——结构化 `statusText` 消息 + i18n + 注入缝）· ✦reasoning 段（usage 增 `reasoning_tokens`）· `turn N/M` 段（turnFrame 消息）；`scrolled N` = 端差保持（VSC 悬浮回底钮替代——设计 §14.2 M5）——AC-CL6 | VSC 独有段（goal 徽标/悬浮钮/键位提示缺失）保持；既等价段不重造（审批 attention 段等端差登记） |

### 16.3 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| N-CL1 | 零回归 + 协议登记 | VSC 快层全绿；extension 端消息面增补逐条登记（`statusText`/`turnFrame` 新消息 · `toolPanel` 增 tool 字段 · `subagent` 增 `status:"turn"` · `digest` 增 `status:"cap"`——只增不改）；CLI 仓代码零改 | 既有族运行 + `git status` 断言 + 登记表（设计 §14.3） |
| N-CL2 | 可机判 | 每功能需求 ≥1 happy-dom 机判用例（归档落点/序 · 每轮元素 · cap 行 · 块头字段 · Send 可见性 · 状态文本映射）——限流等外部态用消息注入缝 | 用例表 T-CL1..T-CL24 全绿（VSC 测试族） |
| N-CL3 | 文档与行数 | 触碰档 `check-doc-width` 新增违规 0；源档守 500 硬限（`panel-chat.mjs` 499 零余量——增行须先抽 helper，见设计 §14.6） | 两仓宽度脚本 + 行数实测表（设计 §14.6） |
| N-CL4 | 端差登记 | 各端独立实现、语义同源；端差（审批态无源 · `scrolled N` 钮替代 · ctx 绝对数 · 无人值守续跑文案 · attention 段）逐条登记不静默 | 设计 §14.3/§14.9 差异表 |

### 16.4 明确不做

- 不做 CLI 端（CLI 单面板照旧）；不做行面板复活；不做跨 reload 恢复；不改 digest 注入/预算；
- 不复活 §12.4 点名的旧加戏链（DOM move 锚链 / settle 驻留双态旧形态 / 逐行簿记 / preview·ticker）；
- 不重开 §12 其余条目（区位置/区高度/pin/⏹ 语义/批 10 机制——除 §16 明列的反转项）；
- 不新建文档档；不在本批做流内归档块的独立分页锚（页锚仍由 `.message` 承担——登记设计 §14.9）。

## 17. VSC 子代理审批面对齐：child permission gate（VSC——2026-09-12）

> 来源：批次 `2026-09-12-VSC-CHILD-PERMISSION（本仓）§1`（用户 2026-09-12 01:16/01:17 裁定 A =
> child（depth>0）写操作走审批门——现状为「偶然的洞」：VSC 权限门要求 `depth === 0`、child callbacks 无
> permission 通道、child `runAgent` 的 autoApprove 恒 `true`）。设计+测试见 `AGENT-LOOP（本仓·设计）§18`；
> 协议登记 `WEBVIEW（本仓·设计）§7.2`；门禁增量 `TOOLS（本仓·设计）§8`；R2 文档修正 = `ESCALATE（本仓·设计）` /
> `ENGINEERING-MODE（本仓·设计）`（随设计落档，措辞锚见设计 §18.4 C-13）。本条目 = 批次 R1–R2 逐条对位（判定句回指 AC-CP1..AC-CP9——设计 §18.8）。
> **交界注**：§16 F-R4/N-CL4 的「审批态 = 无数据源」理由句随本批落地失实（本批即该数据源）——
> 两批核销时由父侧同步（本批不改他批档节——登记不静默）。

### 17.1 总体需求

VSC 面板使用者在 ask（手动）模式下，**子代理（depth>0）的写操作与主 agent 一样经过审批门**：权限卡带归属
（`<child key> · <tool>`）并复用既有权限卡/队列/响应机制；AUTO（autoApprove / approve-all，含轮中翻转）整树
**静默直通**（模式继承——不新造模式）；等待期间子代理活动块显示 `⏸` + `等待审批: <tool>`（CLI 面板行对位）；
覆盖 spawn 子代理与 escalate（`ESCALATE（本仓·设计）` 声称的权限门转发成真）；取消（⏹ / 模型 cancel / 会话中止 / Stop）释放
pending ask（deny + 卡移除）——child 不悬挂（Stop 不停后台池：child 存活、收 deny 后继续——修正轮 #2）。explore/plan（只读工具集）、
eng-coder（spawn 设计令牌预授权）、consult（只读）**审批面**零行为（手动档 child AUTO 提醒句停注 = KD-7 连带——已登记接受——修正轮 #5）。

### 17.2 功能性需求（判定句逐条——设计 AC 逐条回指；对位批次 R1–R2）

| # | 需求（批次对位） | 判定句（验收语义） | 范围边界（不做） |
|---|---|---|---|
| F-CP1 | child 审批门对齐 CLI（R1） | ask 模式：coder/eng-designer 子代理写工具 ⇒ 弹卡（卡含归属 `<child key> · <tool>`）→ approve ⇒ 工具执行、child 继续；deny ⇒ child 工具结果 = 拒绝语义（对位 CLI）；auto / approve-all（含轮中翻转）⇒ 该 child 零卡直通；等待期间块头 `⏸` + `等待审批: <tool>`，resolve 后清除；escalate（sync/async）同覆盖（归属 `escalate <tag> #<id>`）；取消（⏹/模型 cancel/会话中止/Stop）⇒ pending ask 释放（deny + 卡移除）、child 不悬挂（Stop 下 child 存活——不停后台池——修正轮 #2）——AC-CP1..AC-CP6 | 不改权限模式集合；不动 depth-0 顶层审批语义；children 不启用批合并（CLI 对位：`wrapChildCallbacks` 不携批通道——候选扩展登记）；consult/explore/plan/eng-coder 审批面零行为（KD-7 连带除外——见 §17.1——修正轮 #5）；question 面 child 卡释放不做（登记） |
| F-CP2 | 文档矛盾修正（R2） | `ESCALATE（本仓·设计）:33/:79/:125/:143` · `ENGINEERING-MODE（本仓·设计）:128-130` · `TOOLS（本仓·设计）:178-180` · `AGENT-LOOP（本仓·设计）§8`（同族句）改写后与实现语义一致（机检逐字锚——设计 §18.4 C-13 清单；四处——修正轮 #1）——AC-CP7 | 不改 escalate 机制本体；不改 eng-coder token 门 |

### 17.3 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| N-CP1 | 零回归 + 协议登记 | VSC 快层全绿；协议增量（`permissionRequest` 增 owner/promptId · `permissionResponse` 增 promptId · 新 `permissionWithdrawn`/`subagentApproval`）只增不改、逐条登记；CLI 仓代码零改 | 既有族运行 + `git status`（CLI 仓）+ `WEBVIEW（本仓·设计）§7.2` 登记表 |
| N-CP2 | 结构 | `execute-tools.mjs` 拆 gate 层后 ≤500（as-of 506 已越硬限）；源新档 ≤300（测试档按测试档登记口径 = 不拆分——设计 §18.6 注④）（修正轮 #4）；两仓 `check-doc-width` 新增违规 0 | 行数实测表（设计 §18.6） |
| N-CP3 | 可机判 | 每功能需求 ≥1 机判用例（卡归属 / 模式继承 / 块头态 / 取消释放 / 角色域 / 文档锚）——host 直驱 + happy-dom 双面 | 用例表 T-CP1..T-CP19 全绿（含 T-CP19 Stop 释放——修正轮 #2） |
| N-CP4 | i18n | 新文案键两 locale 同步（`sub.awaitingApproval`） | 键在位 + 插值断言 |

### 17.4 明确不做

- 不做 CLI 端（CLI = 目标语义参照）；不新造权限模式 / 新对话框类型；children 批合并不做（候选扩展登记）；
- 不动 VSC 顶层（depth 0）审批现有语义（批卡协议 / approve-all / 中止释放面仅按设计 C-5/C-6 增量）；
- 不做 question 面 child 卡释放（既有缺口——登记）；不改 prompts/提示词文件；不改其他在途批的档节。

## 变更记录

- 2026-09-12：本档建档（台账自持批 LEDGER-SELF-CONTAINED——接收 `AGENT-LOOP（CLI 仓·需求）` 的 7 节托管族：§9 / §10 / §11 / §12 / §14 / §16 / §17；逐字迁移 + 跨端引用形态收敛；源档移出清单见源档档首）。
