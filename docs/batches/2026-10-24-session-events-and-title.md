# 2026-10-24 · 会话面：槽事件结构化 · 凭证丢弃报明 · 状态栏标题单行化
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-24 · 来源 = GitHub #23 · #28 · Gitee IKLMGA：槽机制零结构化事件、设计凭证换槽静默丢弃、CLI 状态栏标题含换行导致滚屏。用户 2026-10-24 17:31 要求并行处理。
> 台账 = #1750（归批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-24
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

### 按评审轮次 1 处置（11 条）

**R2 条文更正（以本块为准）**：上表 R2 原写「三端各输出一行报明」——射程收为 **核心透出 + CLI 报明**。VSC 端 `reconcileEngDesignTokens` 的 Map「永不复位清空」（`thincoder-vscode/src/agent/agent-state.mjs:51`，`:118` 只从槽合入、只增不减）⇒ 本批 before/after 度量在该路径没有丢弃时点，补打印点会是死代码；
  桌面端 `thincoder-desktop/src/main/session-io.mjs:29` 的 `applySession` 前置态（装配出的 agent 的 `_engDesignTokens` 是否非空）本批未勘察 ⇒ 不猜落点。两端报明随 VSC / 桌面面另批接，设计档 §8 明写不做，**待主 agent 记台账**。

| # | 处置 | file:line ∥ 证据 |
|---|---|---|
| 🔴1 | R2 收为「核心 + CLI」；设计档 §1 条目表 / §3.2 落点表 / §6 验收 / §8 边界同步改写，验收按分支各一行机判 | `docs/core/design/SESSION-OBSERVABILITY.md` §1 · §3.2 · §6 · §8；VSC 无丢弃时点 = `thincoder-vscode/src/agent/agent-state.mjs:51` |
| 🟡2 | §4 三行补实读行数 80 / 140 / 268，增量列全改 `≤±N`；顺带修 `cmd-new.mjs` 38→39、`session-lifecycle.mjs` +12→+14（含 applySession 中继） | `docs/core/design/SESSION-OBSERVABILITY.md` §4；读数 = node 按 `\n` 切分（PowerShell `Get-Content` 对同档少算，不可用作行数口径） |
| 🟡3 | §3.2 增 `applySession` 中继行：返回形 `{ switched, droppedDesignTokens }`，`switched` 保留今日 `:210` / `:214` 两值；调用面 6 处实读均不读返回值 ⇒ 零回归 | `thincoder-core/session-lifecycle.mjs:89` / `:210` / `:214`；
  调用面 `cmd-session.mjs:122` · `command-interactive.mjs:143` · `acp/handlers-slots.mjs:112` / `:177` · `desktop/src/main/session-io.mjs:29` · `server/deploy/sandbox/member-shell/core-run.mjs:292` |
| 🟡4 | §3.1 写出判别式：`preserved === true ⇒ unreadable`（`.corrupted` 已保全）· `preserved === false ⇒ rotate-failed`（现场未保全）；§7 新增 C3 | `thincoder-core/session-slot-write.mjs:86-91`；设计档 §3.1 判别式段 · §7 C2/C3 |
| 🟡5 | 四个事件名改 `slot:rotate` / `slot:allocate` / `slot:new` / `slot:refuse`，与既有 `ns:event` 家族对齐；「偏离：无」保持为真 | 先例 `thincoder-core/agent/dispatch-run.mjs:61` `tool:call` · `thincoder-core/provider/core.mjs:88` `llm:start`；设计档 §2 · §5 D3 · §6 · §7 |
| 🟡6 | 单行化不变式并入标题段单源档（正则 + 三处应用点 + 可机判）；本档 §3.3 只留批内接线与指针；O3 删除 | `docs/cli/design/TUI.md` §7.4（新增两条 bullet + 可机判行） |
| 🟡7 | §9 宿主更正：`thincoder-cli/test/` = `run.mjs`（收集器，收 `test/*.test.mjs` 与 `test/integration/*.test.mjs`）+ `slow.mjs`（纯别名）；新增常驻 `thincoder-cli/test/session-observability.test.mjs`，「用后即删」删除 | `thincoder-cli/test/run.mjs:3`；目录实读两档 |
| 🟡8 | 拆两分支两句逐字文案：`/new` = 「离开本会话，继续本会话需重走设计评审」· 切槽 = 「在本槽不再生效（切回原槽可恢复）」；D8 记录理由 | 设计档 §3.2 文案表 · §5 D8 · §6 · §7 C8/C9；切回可读回 = `thincoder-core/token-ttl.mjs:133-137` |
| 🟡9 | §2 落新名三问表四行：`singleLineTitle` = existing-but-unusable（`oneLine` 档内私有 + `/\s*\r?\n\s*/g` 吞空格、
  不覆盖 `\t`/`\v`/`\f`/U+0085/U+2028/U+2029）· 四事件名 = existing `logEvent` + `ns:event` 名形 · `droppedDesignTokens` 与两句文案 = none found（本仓 `**/*.mjs` 全量 grep 零命中） | `thincoder-core/markdown.mjs:80-82`；设计档 §2 三问表 |
| 🔵10 | 删 `slot:refuse` 的 `via` 字段（单值无判别信息）；D4 记录 | 设计档 §3.1 · §5 D4 |
| 🔵11 | §9 补 C5 制造路径：临时 `sessions` 目录 + K 个 `node -e "setTimeout(()=>{},600000)"` 活进程写进 `slotSessions`（槽 1..K），再起第 K+1 个进程触发落号 | 设计档 §9 末段 · §7 C5 |

**§10 未落定项整节删除**：O1 / O2 出界进 §8「不做」并转台账；O3 已在 `docs/cli/design/TUI.md` §7.4 落定；O4 行数已补 —— 本批设计档无 `open` 项。

**门禁同轮修正（超出评审 11 条；一致性面即改并逐条报告）**：
- `docs/cli/design/TUI.md:10` 裸名 `docs/vsc/design/WEBVIEW-PROTOCOL.md` → `docs/vsc/design/WEBVIEW-PROTOCOL.md`（档在 `docs/vsc/design/`）。
- `:337` `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` → `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`。
- `:343` `docs/core/design/AGENT-LOOP-SUBAGENT.md` → `docs/core/design/AGENT-LOOP-SUBAGENT.md`。
- `:645` / `:646` `docs/vsc/design/WEBVIEW-INPUT.md` → `docs/vsc/design/WEBVIEW-INPUT.md`（两处）。
- 行宽超 300：设计档 §2 先例段 / §3.1 判别式段 / §3.2 调用面段、`docs/cli/design/TUI.md` §7.4 应用点 bullet —— 折行处理，语义未改。

### 按评审轮次 2 处置（8 条）

**R2 定死（以本块 + 设计档为准）**：`droppedDesignTokens` 数**离开集**——旧 Map 未过期 id 集 ∖ 新 Map id 集；CLI 切槽取值 `cmd-session.mjs:122`、打印在 `:137` 起（行集重建后）。

| # | 处置 | file:line ∥ 证据 |
|---|---|---|
| 🔴1 切槽计数式 | §3.2 两行度量式改离开集（`/new` = 重建前未过期条目数；切槽 = 旧未过期 id ∖ 新 id 集），新增「N 的计数口径」段；§5 新增 D12；§6 R2 拆 5 行机判（含 A(2)→B(2) / A(0)→B(2) / 过期项不计）；§7 C9 改 A(2)→B(0) + 新增 C9b / C9c；
  §9 新增 I4 | `docs/core/design/SESSION-OBSERVABILITY.md` §3.2 · §5 D12 · §6 · §7 · §9；实码 `thincoder-core/token-ttl.mjs:132` `const map = new Map()` · `:145` 覆盖 · `:135` TTL 过滤 |
| 🔴2 切槽打印落点 | §3.2 落点表切槽行补双坐标（取值 `:122` 存局部量 / 打印 `:137` 起）+ 新增「切槽打印落点不得早于 `:130`」段；§4 `cmd-session.mjs` 增量 ≤+4 → ≤+8 | `docs/core/design/SESSION-OBSERVABILITY.md` §3.2 落点表 · §4；
  实码 `thincoder-cli/src/tui/cmd-session.mjs:130` `state.lines = []` · `:132` `restoreLines` · `:137` `pushLabel` · `:109`/`:120` 已在用 `pushLine(..., C.warn)` |
| 🟡3 行数 | §4 `token-ttl.mjs` 247 → 297（`read` 读数「297 lines total」）、增量 ≤+10；同表 `session-lifecycle.mjs` ≤+18、`session-guard.mjs` ≤+6、`cmd-session.mjs` ≤+8；§4 末段上限 404 → ≤422 | `docs/core/design/SESSION-OBSERVABILITY.md` §4；读数 = `read`（297 行） |
| 🟡4 N 口味 | 一句定死两分支同判：只数「生效中且未过期」的 id；「已批准」与计数同集合，过期项不计；§6 补过期项机判行 | `docs/core/design/SESSION-OBSERVABILITY.md` §3.2「N 的计数口径」段 · §6 R2 过期行；`thincoder-core/token-ttl.mjs:135` |
| 🟡5 闭集无用例 | §7 补 C7b `read-failed` · C7c `shape-invalid` · C7d `readback-failed` · C3b guard 异常支；§3.1 guard 判别式补 `preserved` 跟踪（今日 catch 不记成败）+ §5 D13 | `thincoder-core/session-slots-manifest.mjs:198-200` / `:202` / `:204-205` / `:151-153`+`:157-165`；`thincoder-core/session-guard.mjs:73-75` |
| 🟡6 `TITLE_BREAK_RE` | §2 三问表补一行：`none found`（本仓 `**/*.mjs` grep 零命中）；住址 `status-line.mjs`、档内私有不导出 | `docs/core/design/SESSION-OBSERVABILITY.md` §2 三问表；读数 = 全仓 `**/*.mjs` grep `TITLE_BREAK_RE` 零命中 |
| 🔵7 三处计数 | `docs/cli/design/TUI.md:579` 行内点名第三处（写出口 `render-frame.mjs:265`，正文在下行 `:580`）；设计档 §3.3 由「两个应用点」改为「三处 = 入口 / 回退 / 写出口」，两档同口径 | `docs/cli/design/TUI.md` §7.4 `:579`；`docs/core/design/SESSION-OBSERVABILITY.md` §3.3 |
| 🔵8 C3 制造手法 | §7 C3 输入列补制造路径：槽文件写非法 JSON + 预建 `<槽文件>.corrupted` 为目录 ⇒ 改名失败（与 C5 同详细度） | `docs/core/design/SESSION-OBSERVABILITY.md` §7 C3；`thincoder-core/session-slot-write.mjs:86-88` |

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

### 设计评审（docs/core/design/SESSION-OBSERVABILITY.md · 槽事件结构化 ∥ 凭证丢弃报明 ∥ 标题单行化）

审阅对象：`D:\teamcode\thincoder\docs\core\design\SESSION-OBSERVABILITY.md`（全文 167 行，逐行读毕）。
  核侧坐标抽样实读：`thincoder-core/log.mjs:114`、`session-slot-write.mjs:80-93`、`session-slots-manifest.mjs:145-149/163-164`、`session-slot-claims.mjs:178-183`、`session-lifecycle.mjs:125/210/214/265-290/297-325`、`session-guard.mjs:57-78`、`token-ttl.mjs:131-147`、
  `thincoder-cli/src/tui/status-line.mjs:71-76/172`、`render-frame.mjs:24/265`、`cmd-new.mjs:16/26`、`cmd-session.mjs:122`、`thincoder-desktop/src/main/session-io.mjs:26-32`、
  `thincoder-vscode/src/agent/agent-state.mjs:51/118`、`setup.mjs:53`、`thincoder-cli/test/run.mjs:3/43`、`docs/cli/design/TUI.md:573`、`docs/core/design/LOGGING.md:52`。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements / AC | 🔴 | R2 自称「设计凭证随槽作废时三端各输出一行报明」(docs/core/design/SESSION-OBSERVABILITY.md:11)，但 VSC「度量点见 §10 O1」(:58)、桌面「渲染层输出通道未勘察」(:164) 两端未定，验收判据 R2 只断言「CLI 恰一行」(:116)。且 O1 的勘察面只到 `src/extension/`——VSC 的凭证水合实读在 `thincoder-vscode/src/agent/agent-state.mjs:118`（`reconcileEngDesignTokens`，`:51` 明示「Map 永不复位清空」），agent 构建在 `src/agent/setup.mjs:53`；即 VSC 的丢弃场景与 CLI 的 before/after 度量不同形，光补一个打印点不足以落地 | 把勘察面扩到 `src/agent/agent-state.mjs` / `setup.mjs`，定出 VSC 的度量点与行通道（或把 VSC 明写进 §8「不做」并把 R2 的「三端」改为已落两端）；按端各补一行验收判据，避免「声称三端、只验一端」 |
| 2 | 受影响文件标注 | 🟡 | §4 三行无当前行数：`session-guard.mjs`「行数待实施轮核」(:85)、`cmd-session.mjs`「行数待核」(:93)、`thincoder-vscode/src/extension/session-io.mjs`「行数待核」+ 增量「`open`」(:95)；实读分别为 80 / 140 / 268 行。增量列一律为「+6」式定值，非 `≤±N` 口径 | 三行补实读行数（80 / 140 / 268）与 `≤±N` 增量；VSC 行随 #1 一并落定。跨限面已核：最大 `session-lifecycle.mjs` 404 → 无拆分计划需求，此项结论保留 |
| 3 | Clarity（返回值链路） | 🟡 | §3.2 只把 `restoreEngTokens` 列为改动函数，但端壳「取返回值」(:57/:58) 必须经 `applySession` 中继；`applySession` 现契约是布尔（`session-lifecycle.mjs:210` `return switched` / `:214` `return false`），而 §4 的 `session-lifecycle.mjs` 行只写「`newSession` 事件 + `resetSessionState` 返回值」(:88)，未含该契约变更，+12 增量因此偏低 | 在 §3.2 增 `applySession` 一行：写出新返回形（如 `{ droppedDesignTokens }` 与既有布尔并存或替换）、`opts` 语义不变；§4 该行变更描述与增量同步补 |
| 4 | Clarity（分支判别） | 🟡 | `reason` 枚举含 `rotate-failed`(:32)，但它与 `unreadable` 共用同一个 catch（`session-slot-write.mjs:84-93`）——设计未写判别式（实读：现码靠 `preserved` 标志区分「已保全 .corrupted」与「现场未能保全」，`:86-91`），§7 用例 C1–C13 亦无 `rotate-failed` 用例 | 写明判别式（`preserved === true ⇒ unreadable`，`false ⇒ rotate-failed`）并补一条 §7 用例与场景来源 |
| 5 | Precedent 对齐 | 🟡 | 先例行声明「对齐既有事件家族」(:16)、「**偏离**：无。」(:17)，但事件名用点分隔 `slot.rotate`，既有家族全部为 `ns:event` 形（`thincoder-core/agent/dispatch-run.mjs:61` `logEvent("tool:call"`、`thincoder-core/provider/core.mjs:88` `logEvent("llm:start"`） | 二选一：改名 `slot:rotate` / `slot:allocate` / `slot:new` / `slot:refuse`，或在「偏离」行把分隔符差异写成显式偏离（点明先例 + 既有形式为何不适用） |
| 6 | Document ownership | 🟡 | R3 的不变式落本新档 §3.3 并声明「本档 §3.3 为该不变式的单源」(:18)，而标题段归 `docs/cli/design/TUI.md:573`（§7.4 会话标题段）已有；O3 把对齐推给「主 agent 排后续轮」(:165)，留下两个活描述点 | 单行化不变式直接补进 docs/cli/design/TUI.md §7.4（一处判据 + 本档只留指针），或在本档写明为何该主题本批不归 docs/cli/design/TUI.md 档；O3 不宜以「后续轮」形式挂账 |
| 7 | Methodology（测试宿主） | 🟡 | §9 称「`thincoder-cli/test/` 只有 `run.mjs`」(157) 与实况不符：该目录另有 `slow.mjs`，且 `run.mjs:3` 是收集 `test/*.test.mjs` 的启动器（`:43` 零用例即绿的守卫）。据此推出的「case 文件落 `thincoder-cli/test/` 时随批删除（单元测试用后即删）」(157) 会让 `singleLineTitle` 与事件字段组装零持久回归守卫 | 更正宿主描述：CLI 有可用 runner（当前零用例），把纯函数断言留成一个常驻 `test/*.test.mjs`；若「用后即删」是项目既定纪律，写明出处并给出替代守卫 |
| 8 | 文案语义 | 🟡 | 同一句文案覆盖两种语义：`/new` 是凭证真销毁（`resetSessionState` 重建 Map），而切槽只是换装——旧槽档内的 `engDesignTokens` 仍在，切回即被 `token-ttl.mjs:133-137` 读回；「⚠ … 个已批准设计凭证随槽作废，需重走设计评审」(:53) 用在切槽分支上属实况不符 | 切槽分支改用「本槽不再生效（切回可恢复）」类文案，或 R2 只保留 `/new` 一处输出、切槽分支另行处理；文案仍逐字机判 |
| 9 | Existing-piece check | 🟡 | 新名三问未落记录：`singleLineTitle` / 四个 `ev` 名 / `droppedDesignTokens` / 文案均无「existing: … ∥ none found: … ∥ existing but unusable: …」行。实读存在 `thincoder-core/markdown.mjs:80` `function oneLine(v)`（`\s*\r?\n\s*` → 单空格 + trim，且档内私有），与 D5「用 `split(/\s+/).join(" ")`：会并空格、改可见字符宽度」(:107) 同族但不是同一取舍 | 补三问行：点名 `markdown.mjs:80` 为「existing but unusable」，理由 = 档内私有 + markdown 主题 + 不保宽度账（`\t` / `\v` / `\f` / U+2028 未覆盖） |
| 10 | Note | 🔵 | `slot.refuse` 的 `via` 恒为 `"manifest"`(:35)，闭集单值字段不携带判别信息，与 D2「事件字段闭集」的自述张力 | 删该字段，或留一行说明为何保留（如为将来多写面预留则写明） |
| 11 | Note（可复现性） | 🔵 | AC R1 要求四类事件各至少 1 行，其中 `slot.allocate` 需「全部槽被活进程占」的场景；§7 C4 只写输入，未给制造手法 | §9 补一行制造路径（几个占槽进程 / 临时 `sessions` 目录），使该读数可复现 |

**限制声明**：评审上下文未提供项目标准档与文档地图（`docs/README.md` 未被纳入），故 Document ownership 一行按 thincoder-cli/AGENTS.md 与实读到的既有档判定；批档 §2 的原始 R1/R2/R3 条文不在审阅面内，R2 的「三端」按本档 :11 的自述为准。

计数：🔴 ×1 · 🟡 ×8 · 🔵 ×2

VERDICT: changes-required

### 轮次 2（评审子代理）

### 设计评审 第 2 轮（docs/core/design/SESSION-OBSERVABILITY.md 修正后 ∥ docs/cli/design/TUI.md §7.4 单行化不动点）

审阅对象 = 上轮 11 条的修复声明（批档 §2「按评审轮次 1 处置（11 条）」逐条对条文复核）。
  抽样实读：`thincoder-core/session-lifecycle.mjs:89/125/210/214/297-325` · `thincoder-core/token-ttl.mjs:131-147` · `thincoder-core/session-slot-write.mjs:79-93` · `thincoder-core/markdown.mjs:80-82` · `thincoder-core/log.mjs:114` · `thincoder-c
  li/src/tui/status-line.mjs:60-76/172-174` · `thincoder-cli/src/tui/render-frame.mjs:265` · `thincoder-cli/src/tui/cmd-new.mjs:16/26` · `thincoder-cli/src/tui/cmd-session.mjs:109-139`。
行数抽样实读：`session-lifecycle.mjs` 404 · `render-frame.mjs` 322 · `status-line.mjs` 198 · `cmd-new.mjs` 39 · `cmd-session.mjs` 140 · `session-slot-write.mjs` 235 · `session-guard.mjs` 80 · `session-slots-manifest.mjs` 244 · `session-slot-claims.mjs` 231 —— 全对；`token-ttl.mjs` 实测 297（档内写 247，见下表 #3）。

11 条落定情况：🔴1 已落（射程收为「核心 + CLI」，§1 `:12` · §3.2 `:56` · §6 `:133` · §8 `:160-162` 同步）；🟡2 三行已补（80 / 140 实读对上、VSC 行随射程收窄撤除、`≤±N` 口径成立）——但另有一行行数错（下表 #3）；🟡3 已落且独立复核通过（6 个调用点均为裸语句、零返回消费；`restoreEngTokens` 在 `:125`，
  早于 `:210` / `:214` 两返回点）；🟡4 已落（判别式 `:48` + C3 `:143`，`preserved` 逐字见于 `:86-91`）；🟡5 已落（`slot:*` 四名全档一致）；🟡6 已落（不变式入 docs/cli/design/TUI.md §7.4 `:578-580` / 可机判 `:585`，本档 §3.3 `:84` 只留指针、`:88` 不复制正则）；
  🟡7 已落（`docs/core/design/SESSION-OBSERVABILITY.md:180` 宿主更正 + 常驻测试档）；🟡8 已落（两句逐字文案 `:72-73` + D8）——拆分同时暴露下表 #1；🟡9 已落（`oneLine` 逐字对上 `markdown.mjs:80` 的 `/\s*\r?\n\s*/g` + 档内私有）；
  🔵10 已落（`slot:refuse` 字段集只剩 `reason`）；🔵11 已落（`docs/core/design/SESSION-OBSERVABILITY.md:179` 制造路径）。结论：11 条无一条空转，两条（🟡2 / 🟡8）收口不完整，落在下表 #3 / #1。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements / AC（R2 切槽分支计数口径） | 🔴 | 切槽分支的计数式 `N = max(0, before - after)`（`docs/core/design/SESSION-OBSERVABILITY.md:61`）以「集合大小差」度量「离开的凭证」，
但 `restoreEngTokens` 是**整体替换**：`token-ttl.mjs:132` `const map = new Map()` 重建，`:145` `if (map.size > 0) agent._engDesignTokens = map` 覆盖 ⇒ `before` = 原槽凭证数、`after` = 目标槽凭证数，两者是**不同 id 的集合**。
  切到**本身带凭证**的槽（A 槽 2 个 → B 槽 2 个）⇒ N = 0 ⇒ 命中 `docs/core/design/SESSION-OBSERVABILITY.md:75` 「`= 0` 零输出」的负向锁 ⇒ 2 个已批准凭证已不在本会话生效却零报明，正是 R2 要报的那一刻。§6 R2 验收（`:133`）与 C9（`:149`）只写「切到无凭证槽」= 该式退化为 `before` 的那一格，
  故验收抓不到 | 把 N 定为**离开集**而非大小差：`N = |{旧 Map 中 id 不在新 Map 者}|`（整体替换语义下 = 旧 id ∖ 新 id）；补两格用例并在 §6 R2 加一条机判：A(2)→B(2) ⇒ `droppedDesignTokens:2` + 恰一行切槽文案；A(0)→B(2) ⇒ 0 + 零输出 |
| 2 | Feasibility / Clarity（CLI 切槽打印落点） | 🔴 | §3.2 落点表给切槽分支的坐标只有 `thincoder-cli/src/tui/cmd-session.mjs:122`（「`applySession` 调用点」），但该行之后 `cmd-session.mjs:130` `state.lines = []` 清空行集、`:132` `restoreLines` 重灌、`:137` 才 `── Switched to slot`。在 `:122` 处推的警示行会在 `:130` 被丢弃 ⇒ 按档内坐标实现即「写了但看不见」，C9 必红。对照：
  `/new` 行给了两个坐标——取值 `:16` + 打印 `:26`「既有 New session 行之后」（`docs/core/design/SESSION-OBSERVABILITY.md:79`），切槽行缺的正是打印落点 | 切槽行按 `/new` 同形给两个坐标：取值 = `:122`，
  打印 = `restoreLines` 之后（`:132` 后，与 `:137` 的 `pushLabel` 同址或其后）——或写明「`:122` 取计数存局部量、行集重建后统一推」；`pushLine(..., C.warn)` 在该函数作用域内可用（`:109` / `:120` 已在用） |
| 3 | 受影响文件标注 | 🟡 | §4 表 `thincoder-core/token-ttl.mjs` 当前行数写 247（`docs/core/design/SESSION-OBSERVABILITY.md:103`），实读 **297**（`read` 返回「297 lines total」，反复读数一致）；该行是本次唯一被改行数却错的一行，其余 9 行抽样全对 | 改为 297（增量 `≤+8` ⇒ 305，仍远低于 500 软限，§4 末「不需拆分计划」的结论保留）；顺带核一遍 §4 全部行数的取数口径（node 按 `\n` 切分） |
| 4 | Clarity（N 的计数口味未定） | 🟡 | 两分支数的是**两种口径**且档内未声明：`/new` 取 `resetSessionState` 重建前**原始** size（`docs/core/design/SESSION-OBSERVABILITY.md:60`「N = 重建前 size」；`session-lifecycle.mjs:304` `agent._engDesignTokens = new Map()` 前读数，
  含会话内已过期但仍在 Map 的条目）；切槽侧 `after` 来自 TTL 过滤后的重建（`token-ttl.mjs:135` 只收未过期），两式分母不同。文案却统一说「N 个已批准设计凭证」（`:72-73`）——「已批准」与「未过期」是否同集未定 | 用一句定死 N 的口味（建议：只数**未过期且在本会话生效中**的凭证 id），两分支同判；若采原始 size，则文案去掉「已批准」的时效暗示或注明含过期项 |
| 5 | AC coverage（闭集枚举无用例） | 🟡 | `reason` 是闭集，但 §7 用例未覆盖其中两处写面与三个取值：`slot:rotate` 的 guard 异常分支（`docs/core/design/SESSION-OBSERVABILITY.md:43`「`session-guard.mjs:69-78`（guard 异常分支）」）无用例；
  `slot:refuse` 的 `reason` ∈ `read-failed` / `parse-failed` / `shape-invalid` / `readback-failed`（`:46`）只有 C7 覆盖 `parse-failed`（`:147`）⇒ `read-failed` / `shape-invalid` / `readback-failed` 三个闭集值随批落地而零验证 | 每个闭集值配一格用例（或至少给出可造场景），无场景的值从闭集删除；guard 异常支补一格（同 C3 手法：让 `.corrupted` 改名失败） |
| 6 | Existing-piece（新名三问遗漏） | 🟡 | 三问表（`docs/core/design/SESSION-OBSERVABILITY.md:22-29`）覆盖 `singleLineTitle` / 四事件名 / `droppedDesignTokens` / 两句文案，
  但本批在 TUI 侧新引入的常量名 `TITLE_BREAK_RE`（`docs/cli/design/TUI.md:578`）无语料行 | 三问表补一行（住址 = `status-line.mjs`，与 `singleLineTitle` 同址、不导出），或把它写成 `singleLineTitle` 的内部实现细节而在 docs/cli/design/TUI.md 侧不命名 |
| 7 | Note（计数标签） | 🔵 | docs/cli/design/TUI.md `:579` 标题写「单行化应用点（三处）」，该行只列两处（`:172` 入口 / `:71-76` 回退），第三处（`put()` 兜底）在下一行 `:580`；同集在 `docs/core/design/SESSION-OBSERVABILITY.md:89` 记作「两个应用点」⇒ 同一集合两个计数，读者需自行对齐 | `:579` 行内把第三处点名（「三处 = 入口 / 回退 / 写出口 `:265`」），两档计数口径即一致 |
| 8 | Note（可复现性） | 🔵 | C2 / C3 的输入列给的是**状态**（「半写坏档」「`.corrupted` 改名失败」），未给制造手法；同档 C5 已有逐字制造路径（`docs/core/design/SESSION-OBSERVABILITY.md:179`）——同一档内两种详细度 | C3 补一句制造手法（如预先把 `<path>.corrupted` 建成目录 / 目录只读），使该格与 C5 同详细度 |

计数：🔴 ×2 · 🟡 ×4 · 🔵 ×2

VERDICT: changes-required

### 轮次 3（评审子代理）

**第 3 轮 · 只核修复声明**：上轮 2 🔴 + 4 🟡 + 2 🔵 共 8 条，逐条对当前档面复核（`docs/core/design/SESSION-OBSERVABILITY.md` 全档 206 行 + `docs/cli/design/TUI.md` §7.4；实读抽样 `token-ttl.mjs:55/135` · `session-lifecycle.mjs:42` · `session-slots-manifest.mjs:153`）。8/8 全部落地，无残留 🔴。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | docs/core/design/SESSION-OBSERVABILITY.md | 🔴 | Fixed | 计数式改「离开集」：`N 的计数口径（两分支同判：离开集，不是集合大小差）`（:65）+ `切槽 = 旧 Map 的未过期 id 里、不在新 Map 的那些`（:66）+ `:132` 快照 / `:145-146` 求差（:62）；旧式降为理由与备选（:69 `before - after` 在两个槽都带凭证时恒为 0（A 槽 2 个 → B 槽 2 个）、:139 D12）；AC 补 A(2)→B(2)（:148 大小差式在本格得 0，本格即抓它 · :172 C9b）、A(2)→B(0)（:149）、A(0)→B(2) 负向锁（:150）、过期项不计（:151）；C9b / I4 用例已补 |
| 2 | 2 | docs/core/design/SESSION-OBSERVABILITY.md | 🔴 | Fixed | 切槽落点拆两坐标：取值 `:122`（存局部量）· 打印 `:137` 起（`restoreLines(state, desc)` 之后）（:87）+ 专段 `切槽打印落点不得早于 :130`（:89，含 `state.lines = []` / `restoreLines` 重灌的原理句）+ `取值与打印分两个坐标`（:90）；与 `/new` 行同形 |
| 3 | 3 | docs/core/design/SESSION-OBSERVABILITY.md | 🟡 | Fixed | `token-ttl.mjs` 行数 247 → 297（:115），与实读一致；:122 上限算式随之自洽（404 → ≤422，:114 增量 ≤+18）；其余 9 行行数抽样仍全对（235 / 80 / 244 / 231 / 404 / 198 / 322 / 39 / 140） |
| 4 | 4 | docs/core/design/SESSION-OBSERVABILITY.md | 🟡 | Fixed | N 的口径定死一处：`只数「本会话内生效中且未过期」的凭证 id`（:65）+ `/new` 侧 `!(typeof t === "string" && tokenExpired(t))` 口径 + `「已批准」与计数同一集合`（:68）；两分支同判。可行性复核通过：`tokenExpired` 在 `token-ttl.mjs:55` 已导出，`session-lifecycle.mjs:42` 正是 token-ttl 的 import 行 ⇒ 不新增依赖方向属实 |
| 5 | 5 | docs/core/design/SESSION-OBSERVABILITY.md | 🟡 | Fixed | 闭集补用例：C3b `guard 异常支（现场未保全）`（:162）· C7b `拒写（读失败）`（:167）· C7c `拒写（形态非法）`（:168）· C7d `拒写（读回失败）`（:169）；C3/C3b 补齐制造手法（:161 `并把 <槽文件>.corrupted 预先建成目录`）；C7d 所用 seam 实存（`session-slots-manifest.mjs:153` `_setManifestWriteHookForTest`） |
| 6 | 6 | docs/core/design/SESSION-OBSERVABILITY.md | 🟡 | Fixed | 三问表补 `TITLE_BREAK_RE` 行（:29 `none found:` + 住址 = status-line.mjs + 档内私有不导出 + 正则字面单源 = docs/cli/design/TUI.md §7.4） |
| 7 | 7 | docs/cli/design/TUI.md | 🔵 | Fixed | docs/cli/design/TUI.md:579 现于同一行列全三处（`单行化应用点（三处）：状态栏入口标题（…status-line.mjs:172）· 回退标题 sessionTitleFallback（同档 :71-76…）· status 行写出口 put()`）；SESSION-OBSERVABILITY:99 / :102 记 `三处应用点的前两处` + `三处应用点 = 入口 / 回退 / 写出口，与 … §7.4 同口径` ⇒ 两档同计数，不再出现 2 vs 3 |
| 8 | 8 | docs/core/design/SESSION-OBSERVABILITY.md | 🔵 | Fixed | C3 给出制造手法（:161），C3b / C7b / C7c / C7d 同详细度；与 C5 逐字制造路径（:204）对齐 |
| 9 | (new) | docs/core/design/SESSION-OBSERVABILITY.md | 🔵 | New | 非阻塞记录（本轮不开新面，仅记残留）：`slot:rotate` 闭集里 `reason` ∈ `newer-version` / `foreign-cwd` / `other-session` / `longer-record`（:44）中，`other-session` 与 `longer-record` 两值仍无用例覆盖（C1 = foreign-cwd、C4 = newer-version）。属上轮 #5「闭集值逐值有用例」原则的残余，可与实现批同批补两格，不影响本批设计通过 |
| 10 | (check) | docs/core/design/SESSION-OBSERVABILITY.md | — | Fixed | 交叉一致性复核（上轮 #1/#2/#4 的副作用面）：§3.2 :62/:66 与 §6 :148-:151 与 §7 C9b/C9c 三处口径同判；:69 与 D12 的旧式引用均在「理由 / 未采纳备选」位置，无一处作为生效规格残留；§4 :120 测试档行与 :205 常驻声明一致 |

计数：🔴 ×0 · 🟡 ×0 · 🔵 ×1（非阻塞，本轮记录）

VERDICT: pass

（本轮只核修复声明，未开新面；docs/cli/design/TUI.md 仅复读 §7.4 —— 上轮唯一涉及节。）

## §4 用户批准（主 agent）

**批准依据**：用户 2026-10-24 会话内授权「自动跑」，本批设计评审轮 3 通过后按该授权进入实施（记录见 §3）。

## §5 实施记录（eng-coder）

**状态行**：实施完成

### 交付摘要（三件）

| 条目 | 实现落点 | 判据覆盖 |
|---|---|---|
| R1 槽事件结构化 | `session-slot-write.mjs:82,86,97`（write 侧轮转成功 / 异常支）· `session-guard.mjs:60,64,81`（guard 侧，含 `preserved` 跟踪）· `session-slot-claims.mjs:182,186`（`slot:allocate`）· `session-lifecycle.mjs:272,295`（`slot:new`）· `session-slots-manifest.mjs:150,168`（`slot:refuse` 拒写 / 读回失败） | §7 C1–C7d 全绿；今日真实日志 `~/.thincoder/logs/agent-2026-10-24.log` 现场读数 `slot:rotate=2 · slot:allocate=1 · slot:new=2 · slot:refuse=1`（字段闭集见下行） |
| R2 凭证丢弃报明 | `session-lifecycle.mjs:128,212,215,308-315,338`（`resetSessionState` 未过期计数 + `applySession` 中继）· `token-ttl.mjs:132-138,154-156`（`restoreEngTokens` 离开集）· `cmd-new.mjs:16,27-30` · `cmd-session.mjs:122,138-141`（取值 / 打印分离） | §7 C8–C10 全绿；五格机判（2→2 / 0→0 / A(2)→B(2)=2 / A(2)→B(0)=2 / A(0)→B(2)=0 / 过期项=1） |
| R3 标题单行化 | `status-line.mjs:18-21`（`TITLE_BREAK_RE` + 具名导出 `singleLineTitle`）· `:80-83`（回退）· `:179`（入口）· `render-frame.mjs:24,265`（status 行写出口兜底） | §7 C11–C15 全绿；正则与 `docs/cli/design/TUI.md` §7.4 逐字一致，宽度口径未动 |

### 改动文件（行数按 `\n` 切分实测；与设计档 §4 的 `read` 口径同差 1，增量列可比）

| 文件 | 基线（HEAD） | 现值 | 增量 | 设计档 §4 上限 |
|---|---|---|---|---|
| `thincoder-core/session-slot-write.mjs` | 234 | 240 | +6 | ≤+6 ✅ |
| `thincoder-core/session-guard.mjs` | 79 | 85 | +6 | ≤+6 ✅ |
| `thincoder-core/session-slots-manifest.mjs` | 243 | 247 | +4 | ≤+4 ✅ |
| `thincoder-core/session-slot-claims.mjs` | 230 | 234 | +4 | ≤+5 ✅ |
| `thincoder-core/session-lifecycle.mjs` | 403 | 418 | +15 | ≤+18 ✅ |
| `thincoder-core/token-ttl.mjs` | 296 | 306 | +10 | ≤+10 ✅ |
| `thincoder-cli/src/tui/status-line.mjs` | 197 | 204 | +7 | ≤+10 ✅ |
| `thincoder-cli/src/tui/render-frame.mjs` | 321 | 321 | 0 | ≤+2 ✅ |
| `thincoder-cli/src/tui/cmd-new.mjs` | 38 | 42 | +4 | ≤+4 ✅ |
| `thincoder-cli/src/tui/cmd-session.mjs` | 139 | 143 | +4 | ≤+8 ✅ |
| `thincoder-cli/test/session-observability.test.mjs` | 新档 | 406 | 新档 | — |

无档越 500 行硬限。`log.mjs` / `generate-title.mjs` / VSC / 桌面渲染层零触碰。

### 读书记数（本会话实跑）

- `cd thincoder-cli; node test/run.mjs` ⇒ `tests 29 · pass 29 · fail 0`（本批新增档 29 用例）。
- `cd thincoder-core; node test/run.mjs` ⇒ `tests 56 · pass 56 · fail 0`。
- 注：两条 runner 用相对 glob（`test/*.test.mjs`），必须在各自包目录内跑；在仓根跑会收集 0 档（输出 `tests 0`——那是空清单，不是绿）。
- `node --check` × 11 档（10 实现 + 1 测试）全 `Syntax OK`。
- `doc_check(mode:"gate")` ⇒ `DOC-CHECK GATE: PASS（0 档）`——本会话未写 `.md` 档，空清单不得读作「已检」。
- R1 现场读数（非测试进程，写真实日志）：`slot:rotate {"slot":1,"reason":"foreign-cwd","bak":true,"via":"write"}` · `{"reason":"newer-version","bak":true,"via":"guard"}` · `slot:allocate {"slot":2,"prevSlot":1,"reason":"all-slots-live"}` · `slot:new {"slot":2,"prevSlot":1,"reason":"new-session"}` ·
  `slot:refuse {"reason":"parse-failed"}`；事件行不含标题 / 原文 / 路径（字段集只有数字与枚举）。

### 决策披露

- **计数式**：两分支同判「离开集」——`/new` = 重建前未过期条目数；切槽 = 旧 Map 未过期 id ∖ 新 Map id（`token-ttl.mjs:154-156`）。C9b（A(2)→B(2) ⇒ 2）专抓 `max(0,before-after)` 的漏报。
- **打印落点**：切槽取值在 `cmd-session.mjs:122` 存局部量 `applied`，打印在 `:138-141`（晚于 `:130` `state.lines = []` 与 `:132` `restoreLines`）；`/new` 打印在既有 New session 行之后（`cmd-new.mjs:26` 后）。
- **`applySession` 契约**：返回 `{ switched, droppedDesignTokens }`；`switched` 保留两返回点原值。6 处调用面实读全为裸语句（零返回消费）。
- **不做**：VSC / 桌面两端报明（设计档 §8；台账 `#1752`）；凭证跨槽持久化；`logEvent` 通道语义变更。

### 设计档漂移（归设计席 / 父侧，本轮未改设计档）

1. **`prevSlot` 无前值时整键缺席**：设计档 §3.1 写「无则 `null`」，代码按字面传 `null`，但 `log.mjs:125` 对 `null` 字段整键丢弃 ⇒ 项目首个 `/new` 的 `slot:new` 行无 `prevSlot` 键，与 §6「每行含必填字段」在那格张力。二选一收正：注明「无前值时该键省略」，或改发非 null 哨兵并同步闭集表 + 测试。
2. **`unreadable` / `rotate-failed` 判别式粒度过粗**：按设计档 §3.1 的 `preserved` 代理量实现；`.bak` 改名自身失败时会记成 `unreadable`（实况盘面可读）。代码与设计档一致，属设计档判别式待拆分支。
3. **`docs/core/design/SESSION.md:187-188`** 仍写「返回 switched」——旧返回形表述未随契约收正，属设计档笔。

### 审计与评审轮次（终态 = converged）

- **explore 分歧审计 1 轮**：结论 DEVIATIONS 2 条 🟡 doc-drift（① `session-lifecycle.mjs` 函数头 JSDoc 停在旧返回形 ⇒ 本轮已修；② `docs\core\design\SESSION.md` 旧表述 ⇒ 归设计席）；逐条验收 ①–⑥ 全一致（事件字段闭集 / 离开集口径 / 三处单行化 / 契约零回归 / 行数增量 / 零夹带）。
- **advisor 代码评审 1 轮（`type:"code"`）**：`VERDICT: pass`；🔴 ×0 · 🟡 ×3（均非阻塞：prevSlot 缺席 · rotate 判别式 · 批档读数缺）· 🔵 ×2。
- **自修轮次 1（已落）**：两处 JSDoc 同步（`applySession` / `resetSessionState` 返回形）；advisor 🔵2 全落——测试补 `longer-record` / `other-session` 两格（29 用例），隐私断言改按键排除（`k === "ev"` 放行，其余字符串字段一律过路径 / 换行扫描）。🟡 三项中 prevSlot / rotate 归设计席，批档读数由本段与 §6 承担。
- **未覆盖**：VSC / 桌面报明（§8 不做）；集成面 I1–I4 由父侧收口跑；首个 `slot:new` 事件的键集按现状不锁测试（等设计档口径收正后再锁，避免锁错方向）。

## §6 验证与收口（父代理）

## 验证与收口

**父侧独立复核**

| 项 | 读数 |
|---|---|
| core 全量（收口后） | **33 pass / 0 fail** |
| cli 全量（收口后） | **15 pass / 0 fail** |
| 批内单测读数（删前实跑） | **29 pass / 0 fail** |

**批内单测档处置**：`thincoder-cli/test/session-observability.test.mjs`（29 例）已**删除**。

**集成场景 = 无新增（记明理由）**：三件的可观察面都在槽位生命周期与日志行上（`slot:rotate` / `slot:allocate` / `slot:new` / `slot:refuse` 四类事件、凭证计数、标题单行化）。集成夹具若要断言，须构造多进程争槽与真实崩溃现场，当前无确定性可复现路径。**已记债**（台账承接）。

**设计档同步**：`docs\core\design\SESSION-OBSERVABILITY.md` 已按实现收正。

**未决项**：VSC / 桌面两端报明未做（台账 `#1752` 承接）；集成场景一条见上。
