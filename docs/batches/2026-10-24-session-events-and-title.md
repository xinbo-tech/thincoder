# 2026-10-24 · 会话面：槽事件结构化 · 凭证丢弃报明 · 状态栏标题单行化
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-24 · 来源 = GitHub #23 · #28 · Gitee IKLMGA：槽机制零结构化事件、设计凭证换槽静默丢弃、CLI 状态栏标题含换行导致滚屏。用户 2026-10-24 17:31 要求并行处理。
> 台账 = #1750（归批）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**讨论（主 agent）**

**来源**：GitHub #23 · #28 · Gitee IKLMGA。三件事共同的病：**出事了现场没有痕迹**。

**① `#23` 槽机制零结构化事件**
`grep logEvent` 于全部 `session-*.mjs` = 0 命中。槽被轮转、写盘被拒、读回失败——现场只有 `console.error` 一行，日志系统（`log.mjs:114` `logEvent`）明明现成却没接。事后只能靠 stderr 猜发生了什么。

**② `#28` 设计凭证换槽静默丢弃**
`session-lifecycle.mjs:304` `/new` 时直接 `= new Map()`；切槽时 `token-ttl.mjs:145-146` 目标槽没凭证就 `delete`。**一个字都不说**。用户下次 spawn 才撞上「no approved design review holds this id」，完全不知道凭证是怎么没的。

**本批只做报明，不做跨槽持久化**——凭证跨槽留活等于授权范围悄悄放大，那要单独裁定。

**③ IKLMGA CLI 状态栏标题含换行**
`status-line.mjs:172-173` 只 `trim()` + 按宽截断，不过滤换行；`render-loop.mjs:111` 把行原样写出，内嵌 LF 即真实换行 ⇒ 滚屏 + `prevRows` 差分错位、旧行残留。上一批（第 28 批）修的是输入面 Enter，这次是显示面——同一个「没单行化」的根。

**范围裁定（回答设计席 O1）**：本批交付 = **核心返回值 + CLI 报明 + 核心事件**。VSC / 桌面的报明落点未勘察清楚（VSC 走自持装载，`applySession(` 零命中），**不在本批硬塞**；作为一条台账行，随下一批 VSC 面统一接。理由：为了「三端都有」而去猜一个落点，比晚一轮更贵。

## §2 批次任务与设计（eng-designer）
**状态行**：（eng-designer 写入时更新）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

**状态行**：设计完成

### 本批条目（覆盖）

| 编号 | 条目 | 来源 | 状态 |
|---|---|---|---|
| R1 | 槽机制四类时点各落一条结构化事件（轮转 / 落号 / 新建 / 拒写） | GitHub #23 | 本批 |
| R2 | 设计凭证随槽作废时三端各输出一行报明（只报明，不做跨槽持久化） | GitHub #28 | 本批 |
| R3 | 状态栏标题与回退标题统一单行化 + 状态行写出口兜底 | Gitee IKLMGA | 本批 |

**明确不在本批**：设计凭证跨槽持久化（改授权边界，须用户单独裁定）；标题生成面与 VSC / 桌面顶栏显示值变更；事件可视化面板与告警。

### 设计档落点

`docs/core/design/SESSION-OBSERVABILITY.md`（本批单源设计档，9 项齐备：方案与理由 §2 · 接口契约 §3 · 受影响文件 §4 · 关键决策 §5 · 验收 §6 · 用例表 §7 · 边界 §8 · 集成测试 §9 · 未落定项 §10）。

### 机制设计（逐条）

- **R1**：事件名与必填字段是闭集——`slot.rotate`（字段 `slot` `reason` `bak` `via`）· `slot.allocate`（`slot` `prevSlot` `reason`）· `slot.new`（`slot` `prevSlot` `reason`）· `slot.refuse`（`reason` `via`）；通道复用 `thincoder-core/log.mjs:114` `logEvent(kind, fields)`，读路径零事件；字段不含用户输入原文、标题、路径。触发点坐标见设计档 §3.1。
- **R2**：核心只度量并透出 `{droppedDesignTokens: N}`（`resetSessionState` / `restoreEngTokens` 两处），打印归端壳；文案逐字 `⚠ ${N} 个已批准设计凭证随槽作废，需重走设计评审`，仅 `N > 0` 输出恰一行、不进模态不阻塞（设计档 §3.2）。
- **R3**：正则与位置写死——`[\r\n\t\v\f\u0085\u2028\u2029]` → 空格，单源 `status-line.mjs` 的 `singleLineTitle`；应用点 = 状态栏入口（`agent.title`）＋ 回退链 ＋ `render-frame.mjs:265` status 行 `put()` 兜底；宽度口径（`stringWidth` / `sliceByWidth`）逐字不动（设计档 §3.3）。

### 受影响文件与测试覆盖

文件表见设计档 §4（核心 6 档 + CLI 4 档；VSC / 桌面两个报明落点为 `open`，见设计档 §10）。无跨 500 行上限风险，不需拆分计划。
测试覆盖：纯函数直跑（`singleLineTitle` 控制字符集与宽度守恒 / 事件字段组装 / 两个函数的返回值）；宿主现状 = `thincoder-cli/test/` 只有 `run.mjs`，CLI 侧无回归宿主，单元文件随批删除，集成面按设计档 §9 三行登记。

### 验收对照

| 条目 | 判据 |
|---|---|
| R1 | 今日 `~/.thincoder/logs/agent-<date>.log` 中四类 `ev` 各 ≥1 行且含必填字段；事件行不含标题 / 消息原文 / 路径（设计档 §6） |
| R2 | 2 个凭证 + `/new` ⇒ 返回 `{droppedDesignTokens:2}` 且 CLI 恰一行逐字文案；0 个 ⇒ 返回 0 且零输出（设计档 §6） |
| R3 | `title="a\nb"` ⇒ 状态栏 `a b` 且行高不变；41 列纯 ASCII 截断与改动前逐字节相同（设计档 §6） |
| 通用 | `node --test` 纯函数直跑全绿；`doc_check` gate PASS |

### 关键决策

见设计档 §5：D1 事件复用 `logEvent` · D2 字段闭集不带原文 / 路径 · D3 只在写时点发事件 · D4 凭证只报明不持久化 · D5 一字符换一空格（宽度守恒）· D6 兜底放唯一写出口 · D7 上游 `generate-title.mjs:119` 不动。

### 上抛项

- `[上抛·知会]` §1 仍为模板占位（无讨论正文）。本批方向由 spawn 任务书给出（编号、坐标、判据、硬约束齐备），设计按该任务书推进；§1 正文由主 agent 补。
- `[上抛·待裁]` 设计档 §10 O1 / O2：VSC 与桌面端的报明落点未勘察到具体坐标。核心返回值与逐字文案已定，两端落点需实施轮勘察后落；若不接受 `open` 交付，请裁「本批只交付 CLI 端报明 + 另起批次补两端」。

**§2 更正（设计收尾核回填）**：上抛项 O1 / O2 的粒度已收窄，以 `docs/core/design/SESSION-OBSERVABILITY.md` §10 为准——桌面端度量点已定（`thincoder-desktop/src/main/session-io.mjs:29`），仅渲染层行通道 `open`；VSC 端 `thincoder-vscode/src/extension/` 内 `applySession(` 零命中（实读）⇒ 度量点仍未定。CLI 切槽落点已钉 `thincoder-cli/src/tui/cmd-session.mjs:122`。
**doc_check gate 读数**：`DOC-CHECK GATE: ERROR（引擎已更新（doc-check/version.mjs mtime 2026-10-24T09:14:45.769Z > 进程启动 2026-10-23T15:44:56.364Z），请重启会话后复跑）`——本会话进程加载的检查引擎早于盘上引擎，门禁 fail-closed，非文档命中。替代读数：`doc_check` 报告态对设计档 + 本批记录 `命中 0 条（锚 0 · 行宽 0）`（同一旧引擎产出，标注不可作交付判据）。需重启会话复跑门禁后方可交评审。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

### 设计评审（SESSION-OBSERVABILITY.md · 槽事件结构化 ∥ 凭证丢弃报明 ∥ 标题单行化）

审阅对象：`D:\teamcode\thincoder\docs\core\design\SESSION-OBSERVABILITY.md`（全文 167 行，逐行读毕）。核侧坐标抽样实读：`thincoder-core/log.mjs:114`、`session-slot-write.mjs:80-93`、`session-slots-manifest.mjs:145-149/163-164`、`session-slot-claims.mjs:178-183`、`session-lifecycle.mjs:125/210/214/265-290/297-325`、`session-guard.mjs:57-78`、`token-ttl.mjs:131-147`、`thincoder-cli/src/tui/status-line.mjs:71-76/172`、`render-frame.mjs:24/265`、`cmd-new.mjs:16/26`、`cmd-session.mjs:122`、`thincoder-desktop/src/main/session-io.mjs:26-32`、`thincoder-vscode/src/agent/agent-state.mjs:51/118`、`setup.mjs:53`、`thincoder-cli/test/run.mjs:3/43`、`docs/cli/design/TUI.md:573`、`docs/core/design/LOGGING.md:52`。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements / AC | 🔴 | R2 自称「设计凭证随槽作废时三端各输出一行报明」(SESSION-OBSERVABILITY.md:11)，但 VSC「度量点见 §10 O1」(:58)、桌面「渲染层输出通道未勘察」(:164) 两端未定，验收判据 R2 只断言「CLI 恰一行」(:116)。且 O1 的勘察面只到 `src/extension/`——VSC 的凭证水合实读在 `thincoder-vscode/src/agent/agent-state.mjs:118`（`reconcileEngDesignTokens`，`:51` 明示「Map 永不复位清空」），agent 构建在 `src/agent/setup.mjs:53`；即 VSC 的丢弃场景与 CLI 的 before/after 度量不同形，光补一个打印点不足以落地 | 把勘察面扩到 `src/agent/agent-state.mjs` / `setup.mjs`，定出 VSC 的度量点与行通道（或把 VSC 明写进 §8「不做」并把 R2 的「三端」改为已落两端）；按端各补一行验收判据，避免「声称三端、只验一端」 |
| 2 | 受影响文件标注 | 🟡 | §4 三行无当前行数：`session-guard.mjs`「行数待实施轮核」(:85)、`cmd-session.mjs`「行数待核」(:93)、`thincoder-vscode/src/extension/session-io.mjs`「行数待核」+ 增量「`open`」(:95)；实读分别为 80 / 140 / 268 行。增量列一律为「+6」式定值，非 `≤±N` 口径 | 三行补实读行数（80 / 140 / 268）与 `≤±N` 增量；VSC 行随 #1 一并落定。跨限面已核：最大 `session-lifecycle.mjs` 404 → 无拆分计划需求，此项结论保留 |
| 3 | Clarity（返回值链路） | 🟡 | §3.2 只把 `restoreEngTokens` 列为改动函数，但端壳「取返回值」(:57/:58) 必须经 `applySession` 中继；`applySession` 现契约是布尔（`session-lifecycle.mjs:210` `return switched` / `:214` `return false`），而 §4 的 `session-lifecycle.mjs` 行只写「`newSession` 事件 + `resetSessionState` 返回值」(:88)，未含该契约变更，+12 增量因此偏低 | 在 §3.2 增 `applySession` 一行：写出新返回形（如 `{ droppedDesignTokens }` 与既有布尔并存或替换）、`opts` 语义不变；§4 该行变更描述与增量同步补 |
| 4 | Clarity（分支判别） | 🟡 | `reason` 枚举含 `rotate-failed`(:32)，但它与 `unreadable` 共用同一个 catch（`session-slot-write.mjs:84-93`）——设计未写判别式（实读：现码靠 `preserved` 标志区分「已保全 .corrupted」与「现场未能保全」，`:86-91`），§7 用例 C1–C13 亦无 `rotate-failed` 用例 | 写明判别式（`preserved === true ⇒ unreadable`，`false ⇒ rotate-failed`）并补一条 §7 用例与场景来源 |
| 5 | Precedent 对齐 | 🟡 | 先例行声明「对齐既有事件家族」(:16)、「**偏离**：无。」(:17)，但事件名用点分隔 `slot.rotate`，既有家族全部为 `ns:event` 形（`thincoder-core/agent/dispatch-run.mjs:61` `logEvent("tool:call"`、`thincoder-core/provider/core.mjs:88` `logEvent("llm:start"`） | 二选一：改名 `slot:rotate` / `slot:allocate` / `slot:new` / `slot:refuse`，或在「偏离」行把分隔符差异写成显式偏离（点明先例 + 既有形式为何不适用） |
| 6 | Document ownership | 🟡 | R3 的不变式落本新档 §3.3 并声明「本档 §3.3 为该不变式的单源」(:18)，而标题段归 `docs/cli/design/TUI.md:573`（§7.4 会话标题段）已有；O3 把对齐推给「主 agent 排后续轮」(:165)，留下两个活描述点 | 单行化不变式直接补进 TUI.md §7.4（一处判据 + 本档只留指针），或在本档写明为何该主题本批不归 TUI.md 档；O3 不宜以「后续轮」形式挂账 |
| 7 | Methodology（测试宿主） | 🟡 | §9 称「`thincoder-cli/test/` 只有 `run.mjs`」(157) 与实况不符：该目录另有 `slow.mjs`，且 `run.mjs:3` 是收集 `test/*.test.mjs` 的启动器（`:43` 零用例即绿的守卫）。据此推出的「case 文件落 `thincoder-cli/test/` 时随批删除（单元测试用后即删）」(157) 会让 `singleLineTitle` 与事件字段组装零持久回归守卫 | 更正宿主描述：CLI 有可用 runner（当前零用例），把纯函数断言留成一个常驻 `test/*.test.mjs`；若「用后即删」是项目既定纪律，写明出处并给出替代守卫 |
| 8 | 文案语义 | 🟡 | 同一句文案覆盖两种语义：`/new` 是凭证真销毁（`resetSessionState` 重建 Map），而切槽只是换装——旧槽档内的 `engDesignTokens` 仍在，切回即被 `token-ttl.mjs:133-137` 读回；「⚠ … 个已批准设计凭证随槽作废，需重走设计评审」(:53) 用在切槽分支上属实况不符 | 切槽分支改用「本槽不再生效（切回可恢复）」类文案，或 R2 只保留 `/new` 一处输出、切槽分支另行处理；文案仍逐字机判 |
| 9 | Existing-piece check | 🟡 | 新名三问未落记录：`singleLineTitle` / 四个 `ev` 名 / `droppedDesignTokens` / 文案均无「existing: … ∥ none found: … ∥ existing but unusable: …」行。实读存在 `thincoder-core/markdown.mjs:80` `function oneLine(v)`（`\s*\r?\n\s*` → 单空格 + trim，且档内私有），与 D5「用 `split(/\s+/).join(" ")`：会并空格、改可见字符宽度」(:107) 同族但不是同一取舍 | 补三问行：点名 `markdown.mjs:80` 为「existing but unusable」，理由 = 档内私有 + markdown 主题 + 不保宽度账（`\t` / `\v` / `\f` / U+2028 未覆盖） |
| 10 | Note | 🔵 | `slot.refuse` 的 `via` 恒为 `"manifest"`(:35)，闭集单值字段不携带判别信息，与 D2「事件字段闭集」的自述张力 | 删该字段，或留一行说明为何保留（如为将来多写面预留则写明） |
| 11 | Note（可复现性） | 🔵 | AC R1 要求四类事件各至少 1 行，其中 `slot.allocate` 需「全部槽被活进程占」的场景；§7 C4 只写输入，未给制造手法 | §9 补一行制造路径（几个占槽进程 / 临时 `sessions` 目录），使该读数可复现 |

**限制声明**：评审上下文未提供项目标准档与文档地图（`thincoder/docs/README.md` 未被纳入），故 Document ownership 一行按 AGENTS.md 与实读到的既有档判定；批档 §2 的原始 R1/R2/R3 条文不在审阅面内，R2 的「三端」按本档 :11 的自述为准。

计数：🔴 ×1 · 🟡 ×8 · 🔵 ×2

VERDICT: changes-required

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
