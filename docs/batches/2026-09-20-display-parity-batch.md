# 2026-09-20 · 端差·显示面消差批（DISPLAY-PARITY-BATCH）

> 六段 append-only，一段一作者。编制：主 agent · 2026-09-20 04:25 · 来源 = 用户 04:22「**端差 p1/2/3 都要处理**」+ 端差总体评估三路勘察（explore id=10/11/12 · 同日 04:1x）。
> 本档 = **P1**（显示面消差 · 两端各自呈现层）。

## §1 讨论（主 agent）

**状态行**：🔄 进行中（设计已交 · 评审 id=20 = **changes-required**〔🔴1 / 🟡9 / 🔵6〕→ 修正轮 id=24 **16/16 已落** → **复核中**）

### 1.1 条目清单（3 条台账 · 均出自端差评估）

| # | 台账 | 条目 | 证据 / 关键坐标（勘察已核） | 面 |
|---|---|---|---|---|
| 1 | **#124** | **误导型端差族**：M1 中止后工具卡永停「执行中…」（VSC 无 sweep ∥ CLI `tool-display.mjs:60-72`）· M2 `context%` 双口径（CLI 估算 `render-loop.mjs:89-90` ∥ VSC 实 `prompt_tokens` `panel-callbacks.mjs:165-166`）· M4 digest 文案偏窄/ask-only 无提示 · M5 CLI 冻结头图标互斥 · **M3 `[object Object]`（待现场确认）** | 见台账 #124 evidence（逐条 file:line） | 两端显示面 |
| 2 | **#125** | **信息缺失型族（VSC 缺面）**：X2 评审轮次/模型 · X3 裁决计数 · **X5 >64KB 静默截断无提示** · X6 子代理 turn-cap 注记（`error` 面**死枝**）· X7 结果计数 · X10 无 ⏹（sync 块）· X11 冻结无 interrupted 注记 | 见台账 #125 evidence | VSC 显示面 |
| 3 | **#126** | **反向（CLI 缺面）**：X8 provider 失败无诊断上下文 + 无 Retry（VSC 有 `panel-turn-loop.mjs:150-155`/`ui.js:408-421`）· X9 无 digest 收尾计数/耗时（VSC 有 `chat.js:356-402`） | 见台账 #126 evidence | CLI 显示面 |

### 1.2 边界

- **#118（VSC 排队头缺原因）不在本批**——它已在**一致性同步批**（`2026-09-20-consistency-sync-batch.md`）设计定稿、修正轮在飞；本批**承接其显示链契约**（`WEBVIEW.md` §5.2/§5.3），但**不重复设计它**。
- **不动**：核分类 / 池语义 / 调度器；**已裁决端差**（同义异形族：图标语汇 / 模式词 / 文案分档 / consult·escalate 模型段 / settings 归属）一律不动。
- 两端**各自呈现层**分别落（CLI TUI 面 ∥ VSC webview 面）。
- 本批**含一条待现场确认项**（M3）——设计轮须给确认路径（实跑/探针），不得默认成立。

### 1.3 验收

① 逐条「台账 id → 改动 file:line」；② **用户口径**：凡两端同义面，显示形态以「**CLI 为标尺**」（CLI 缺面则反向对齐 VSC）；③ VSC 侧补**刷新路径断言**（含 2 s 同点刷与块重建——承一致性同步批评审 #9）；④ 三包测试全绿；`doc-check` 净增 0。

### 1.4 台账

#124 / #125 / #126 → 本批（待设计 → **在途** · 任务书指针 = 本档 §2）。

## §2 批次任务与设计（eng-designer）

**轮次**：initial · **作者**：eng-designer · **日期**：2026-09-20 · **任务书** = 本档 §1 全段 · **证据基线** = 台账 #124 / #125 / #126 的 evidence 行（逐处 file:line）+ 本席实读复核（复核面与偏差见 §2.8）

### 2.0 总则（口径与承接）

- **标尺口径（§1.3 ②）**：两端同义面 ⇒ 显示形态以 **CLI 为标尺**（CLI 缺面 ⇒ 反向对齐 VSC）。本批 14 子项中，VSC→CLI 对齐 12 项、CLI→VSC 对齐 2 项族（M5 · #126 X8/X9）。
- **承接 #118 显示链契约（不重复设计）**：VSC 块头/排队信息两刷新路径 = `WEBVIEW.md` §5.2（2 s 同点刷 `panels.js:69-72` `_panelTimer` → `refreshLiveHeaders`；覆盖式重建 `refreshBlock`）；存活投影载荷 = 同档 §5.3（`suspension.mjs:140-159` `reassertLiveChildren`）。
  本批凡**块头/状态词载体**类改动（X6 · X11）一律沿用既成形态「块级活态载体 = `block._subMeta`，单一读点 = `headerText` / `stateWord`」，**不新造第二回落通道**。
- **禁改动面（§1.2 复述）**：核分类 / 池语义 / 调度器 · 已裁决端差（同义异形族）· #118 本体 · `scripts/**` · 需求档 · 两产品 `AGENTS.md` · 他批写域。
- **机检基线**（as-of 2026-09-20 04:2x · 父侧实跑：悬空 0 · 行宽 0 · exit 0）⇒ 本批**净增 0 义务**：新增文案键 / 新增测试档登记 / 设计档新行均须自洽（不引入悬空锚、不超行宽）。
- **需求五要素面**：本批三条为台账 `tech_todo` 条目（无独立需求档条目）；逐条判据以台账 evidence + §1.3 用户口径为据。需求档落笔 = 主 agent 写域（§2.7），本席**只核不改**。

### 2.1 条目 #124 —— 显示面「误导型」端差族（5 子项）

#### M1 中止后工具卡永停「执行中…」（VSC 无清扫）

- **① 面判定**：**VSC 呈现面**（webview 工具卡状态位）——CLI 有清扫、VSC 无。CLI 标尺 = `thincoder-cli/src/tui/tool-display.mjs:60-72`（`sweepToolBlocks`：`b.done = true` + `b.summary = "(interrupted)"` + `b.interrupted = true`），调用点 = 回合 `finally` `thincoder-cli/src/tui/agent-turn.mjs:265`（**恒调用**，非仅中止路径）。
- **② 修法（落点 + 改法 + 关联面）**
  1. `thincoder-vscode/webview/ui.js:290`（`finishToolCard`）首行补 `ref.done = true`；`ui.js:233`（`addTool` 建 ref）补 `done: false` ⇒「已结算」唯一写点。
  2. `thincoder-vscode/webview/streaming.js:146`（`finish`）在指针复位行 `streaming.js:171`（`ctx._toolRefs = {}`）**之前**补清扫：遍历 `Object.values(ctx._toolRefs)` 中 `!ref.done` 的卡片 → 状态位 `t("tool.interrupted")` + 摘要位 `→ (interrupted)`（不套错误色——CLI `interrupted` 为独立旗标，非 error 面）。
  3. 文案：VSC `locales/en.json` / `locales/zh.json` 追加键 `tool.interrupted`（en `interrupted` / zh `已中断`）——**端特有键**（VSC 工具卡面专属），不进核 i18n 容器。
  - **关联面**：`finish()` 承担 complete / aborted 两路径（`webview/chat.js:165-166`）⇒ 清扫**无条件**执行 = CLI「回合 finally 恒清扫」对位（正常完成时 ref 全 `done` ⇒ 零动作）；`ctx._toolRefs` 仅在 `finish` 与 `clearMessages` 清（`ui.js:235` 写入，无 per-block 重置——实读）⇒ 本回合跨块卡片全在该表内。
  - **刷新路径断言（承 §1.3 ③）**：工具卡在**消息区**，**不在**活动区重建链上（`refreshLiveHeaders` 只遍历 `S._subBlocks`——`activity.js:389-393`；`resetActivity` 只清区子树——`:424-434`）⇒ 断言 = ① 清扫后 `refreshLiveHeaders()`（2 s 拍体）**不改**该卡状态词；② `resetActivity()` 亦不复活为 running。
- **③ 可机检验收**（新增档 `thincoder-vscode/test/webview-tool-interrupted.test.mjs`；夹具族 = `test/webview-tool-failure-signal.test.mjs` happy-dom 直驱真 `ui.js` / `streaming.js`）
  - `cd /d D:\teamcode\thincoder\thincoder-vscode && node --test test/webview-tool-interrupted.test.mjs`
  - 断言：活卡（`addTool` 后未 `finishTool`）→ `finish(true)` ⇒ 状态位 = interrupted 词 + 摘要 `→ (interrupted)`；已结算卡（`finishTool` 后）⇒ 零改写；再跑 `refreshLiveHeaders()` + `resetActivity()` ⇒ 状态词不变（先红：修前停止于 `tool.running`）。
- **④ 边界**：不动 CLI（已有清扫）；不引入活动区联动；不加 TTL / 自动消失；不改 `resetActivity` 语义。

#### M2 `context X%` 同标签双口径

- **① 面判定**：**两端状态行同义面**（同一会话可读到两个百分比）——标尺 = CLI（`thincoder-cli/src/tui/render-frame.mjs:388-392`：分子 = `estimateTokens(agent.history)`，缓存于 `state.ctxCache`（`render-loop.mjs:89-91`）；分母 = `providerSpec(agent.provider).context`）。VSC 现状 = 实 `prompt_tokens`（`panel-callbacks.mjs:159-167` → `src/specs.mjs:57-60` `ctxPercentForModel`）。
- **② 修法**
  1. `thincoder-vscode/src/specs.mjs:57-60` 旁新增导出 `ctxPercentForHistory(history, provider)`：分子 = 核 `estimateTokens`（`thincoder-core/context.mjs:20`——零依赖纯函数，静态 import 安全），分母 = `providerSpec(provider).context`（**与 CLI 同源**）；保留 `ctxPercentForModel`（其它消费面不动）。
  2. `thincoder-vscode/src/extension/panel-callbacks.mjs:165` 调用点改 `ctxPercentForHistory(history, p)`——`history` 已在 `buildPanelCallbacks` deps（`:100`，实读）。
  - **关联面**：`webview/status-bar.js:34-40` 渲染句零改（`context ${ctxPct}%` + ≥80 警示色，与 CLI `render-frame.mjs:391-392` 同形）；`↑prompt` 段（两端同为 provider 报告值累计）**不动**。
  - **刷新路径**：状态行唯一载体 = `S._lastCtxPct`（`status-bar.js:84`），消费面 = `usage` 消息驱动 + `_panelTimer` 2 s 拍（`panels.js:69-72`，`running` 门内 `renderStatusBar`）⇒ 两路径同值。
- **③ 可机检验收**（新增档 `thincoder-vscode/test/context-percent-parity.test.mjs`；对位既有族 = `test/context-parity.test.mjs`）
  - `cd /d D:\teamcode\thincoder\thincoder-vscode && node --test test/context-percent-parity.test.mjs`
  - 断言：同一 history + provider ⇒ `ctxPercentForHistory` 值 === `Math.round(estimateTokens(history) / providerSpec(provider).context * 100)`（核函数直驱对拍）；`ctxPercentForModel` 既有语义零回归；渲染两路径（消息驱动 / 2 s 拍）字面同值。
- **④ 边界**：不改 CLI；不改 ≥80 阈值；**不新增绝对 token 段**（「VSC 无绝对 token 数」半已在台账 §6.1 登记，另计，不在本项）；不引入核改动。

#### M3 `[object Object]`（**须现场确认 · 不得默认成立**）

- **① 面判定**：**VSC 工具卡正文**（宿主→webview 载荷类型缺陷）+ 核对象 chunk 契约的端侧消费面。
- **静态链（本席实读闭环，逐跳坐标）**：核 sync 评审产出对象 chunk `advisor/loop.mjs:82`（`emit = (kind) => (text) => onOutput?.({ kind, text })`）→ `agent-tools/advisor.mjs:241`（`onOutput: ctx.onOutput`——**无 relay 前缀**）→ `agent/dispatch.mjs:397`（`callbacks.onToolOutput?.(item.toolCall.name = "advisor", chunk, id)`）→ VSC `panel-callbacks.mjs:185-188`（先试 `relaySubagentContentChunk(panel,"toolOutput","advisor",chunk)`：首参无 `#id/` 形 ⇒ `parseRelayPath` 不命中 ⇒ 分流不成立）→ `postMessage({type:"toolOutput", text: chunk:object})` → `webview/chat.js:142-148`（`ref.b.textContent += m.text`）⇒ 运行期卡体 `[object Object]`；收尾 `ui.js:292`（`finishToolCard` 以结果覆写正文）⇒ **仅运行期可见**（与台账 evidence 逐字吻合）。
  - **反面对照（async 池路安全）**：`advisor-async.mjs:415` 携 `entry.relayPrefix` ⇒ relay 分流成功，且 `panel-subagent-relay.mjs:127-131` 内已归一（`typeof b === "string" ? b : String(b?.text ?? "")`）⇒ 对象不入载荷。
- **现场确认路径（三段，缺一即「未确认」）**
  1. **判据探针 A（零 GUI · 可机跑）**：`cd /d D:\teamcode\thincoder\thincoder-vscode && node --test test/tool-output-payload.test.mjs`——断言链：`parseRelayPath("advisor") === null` ∧ `relaySubagentContentChunk(p, "toolOutput", "advisor", {kind:"text",text:"x"}) === false` ∧ 直通分支载荷 `typeof payload.text === "object"`（**修前红 / 修后绿**：修后 `typeof === "string"`）。
  2. **现场探针 B（真跑 · 记读数）**：VSC 面板发一条 **sync** 评审（`advisor` 工具同步路径），运行期观测卡体——判据 =「`[object Object]` 出现 / 不出现」+ 时刻；两种结果**都**写入 §5 现场读数（零覆盖）。
  3. **判定规则**：探针 A 绿（直通分支成立）⇒ 本项**确认成立**；A 红（relay 分流竟成立）⇒ 按「未复现」登记，修法仍按 ② 落地（防御性），并在 §5 记「静态链与实测不一致」。
- **② 修法（无论探针结果均落地——防御性归一）**：`panel-callbacks.mjs:185-188` 按 **CLI 逐字先例**归一（`thincoder-cli/src/tui/tool-events.mjs:322-324`：`const rawText = typeof chunk === "string" ? chunk : String(chunk?.text ?? "")`）：
  `const text = typeof chunk === "string" ? chunk : String(chunk?.text ?? "")`，载荷 `{type:"toolOutput", name:n, text, id}`；`kind` 随行保留为可选字段（webview 现只消费 `text`——**不新增消费面**）。
  - **关联面**：relay 分流面零改（对象已在 relay 内归一）；`chat.js:138-157` 零改；核 emitter 零改（对象 chunk = 核契约，两端各自归一——先例已由 CLI 给出）。
- **④ 边界**：不改核 emitter；不在核侧字符串化（会毁 `kind` 语义：think / tool / text 三态）；不动 `toolOutput` 流式截断（`chat.js:147-150` 既有标记）；不动 MCP / 普通工具路径。

#### M4 digest 文案偏窄 + ask-only 轮零可见面

- **① 面判定**：**两端 digest 轮起跑标签同义面**（VSC 恒 `digest.turnLabel`——`webview/chat.js:361`）+ **VSC ask-only 轮可见性缺面**（`chat.js:300-302` 无元素）。CLI 标尺 = `thincoder-cli/src/tui/suspension-drive.mjs:172-175` 三档分流（manual+upstream / manual / auto）。
- **② 修法**
  1. 载荷加档：宿主起跑发射点 `thincoder-vscode/src/extension/suspension.mjs:302`（`{type:"digest", status:"start", n: pendingN}`）补 `tier` ∈ `ask` / `digest` / `auto`——判据与 CLI 三档**同源**（`autoApprove` 档 + 未 drain ask 在场）；**禁新造第二判据**（ask 在场旗标取核既有载体，实现轮实核旗标名——见 §2.8 上报 ④）。
  2. webview `chat.js:356-362` 标签行按 `m.tier` 取键：`digest.turnLabel`（既有）/ `digest.turnLabelAsk` / `digest.turnLabelAuto`（**新增两键入核容器** `thincoder-core/i18n.mjs` `projectDictionary`，字面逐字承 CLI 三档；VSC 本地档不重复定义）。
  3. ask-only 轮：起跑判据由 `if (pendingN > 0)`（`suspension.mjs:302`）放宽为「本轮起跑即发」（`n` 可 0）；webview 在 `tier === "ask"` 时不建 `.digest-status` 计数行（CLI ask 轮只打标签行）——`chat.js:363-368` 加档判。
  - **关联面**：`.digest-cap` 面（`chat.js:374-383`）零改；`digest` 载荷扩字段 ⇒ **须复跑 `test/protocol-coverage*.test.mjs` + `test/digest-visibility.test.mjs`**（载荷字段对表机检）。
  - **刷新路径**：本轮元素一次性建（start 建 / end 原地更新），2 s 拍不涉（`refreshLiveHeaders` 只刷活动块）；清屏重建（`clearMessages` / `loadSession` `replaceChildren`）属会话切换语义，不在本项。
- **③ 可机检验收**（扩既有档 `thincoder-vscode/test/digest-visibility.test.mjs`——族已在册）
  - `cd /d D:\teamcode\thincoder\thincoder-vscode && node --test test/digest-visibility.test.mjs`
  - 断言：三档 `tier` → 三档标签字面（与 CLI 三档字面等值）；`tier:"ask"` + `n:0` ⇒ 标签行在 ∧ 无 `.digest-status` 计数行；`tier:"digest"` ⇒ 计数行在（先红：修前 ask 轮零元素）。
- **④ 边界**：不动 CLI 三档字面；不改 digest 轮机制 / 计数语义；不新增消息类型（`digest` 载荷扩字段）；不动 `digest.start` / `digest.end` 核 i18n 既有键值。

#### M5 CLI 冻结头图标—动词互斥（`[✓ … · stopped]`）

- **① 面判定**：**CLI 呈现面**（冻结子代理头图标）——跨端更准者 = VSC（`webview/activity-view.js:46-49`：cancelled → `⏹` + `stopped`）⇒ **CLI 缺面 ⇒ 反向对齐 VSC**（§1.3 ② 第二句）。
- **② 修法**：`thincoder-cli/src/tui/render-segments.mjs:89`（`const icon = sub.approval ? "⏸" : "✓"`）改三态互斥：`sub.approval ? "⏸" : sub.stopped ? "⏹" : "✓"`（`:90` `verb` 判据不动）。
  - **关联面（同判据两处，禁分叉）**：`thincoder-cli/src/tui/subagent-panel.mjs:85` 区（live / queued 头括号构造）须同轮核——实现轮判据单源化（抽叶函数或就地同改；**先例** = `render-segments.mjs:89-91` 与 `subagent-panel.mjs` 的冻结头双写）；冻结路径数据源 = `subagent-freeze.mjs:212-225`（`sub.stopped` 旗标）。
- **③ 可机检验收**（新增档 `thincoder-cli/test/subagent-freeze-icon.test.mjs`；纯函数直驱 `render-segments.mjs` 子段）
  - `cd /d D:\teamcode\thincoder\thincoder-cli && node --test test/subagent-freeze-icon.test.mjs`
  - 断言三态：`stopped:true` ⇒ 头含 `⏹` ∧ 含 `stopped`（**禁 `✓`**）；`done` ⇒ `✓` + `done`；`approval` ⇒ `⏸` 优先（先红：修前 stopped 得 `[✓ … · stopped]`）。
- **④ 边界**：不动 VSC；不改冻结 / 中止机制；不改 `— turn cap reached — work may be partial` 注记面（其 VSC 对位 = X6）；不改 live 头 `▶` / 审批 `⏸` 既有语义。

### 2.2 条目 #125 —— 显示面「信息缺失型」端差族（VSC 缺面 · 7 子项）

> 本族全体 = **VSC 呈现层补面**（`/` 组共享一条拆分纪律）：`webview/ui.js` 现 **473 行**（≤500 硬限、>300 咨询线）⇒ 本族新增展示逻辑**不得直接堆进 `ui.js`**：
> 摘要族（X3 · X7）析出为新叶 `thincoder-vscode/webview/tool-summary.js`（**先例** = `webview/tool-card-restore.mjs` 头注「so ui.js stays under the 500-line limit」，以及 CLI 侧同名面 `tool-summaries.mjs`）；`ui.js` 只保留 import 与调用（净增 ≈ +5 / -12 行）。

#### X2 评审轮次 + 评审模型不可见

- **① 面判定**：**VSC 显示面缺字段**（卡头 + 状态行）；CLI 标尺 = `thincoder-cli/src/tui/tool-events.mjs:145`（状态行 `advisor review (round N · model)`）+ `:152`（卡头 `roundTag` = ` (round N · model)`）。
- **② 修法**
  1. 宿主 `thincoder-vscode/src/extension/panel-callbacks.mjs:168-171`（`onToolCall`）对 `n === "advisor"` 补两字段：`round = (panel._agent?._advisorRound ?? 0) + 1`；`model = resolveAdvisorProvider(panel._agent).model`（核导出 `thincoder-core/advisor/run.mjs:26`——**try/catch 包裹，失败降 null**，与 CLI `tool-events.mjs:131` 同形）；载荷 `{type:"toolCall", name, args, id, round, model}`（非 advisor 不带 ⇒ 零字段）。
  2. webview `thincoder-vscode/webview/ui.js:211-215`（`addTool` 头构造）在有 `round` 时补 `<span class="tool-call-round">(round N · model)</span>`（字面 = CLI `roundTag` 逐字；无 `round` ⇒ 零改）。
  3. 状态行对位：`webview/chat.js:136`（`S._currentTool = m.name`）对 advisor 改置 `advisor review (round N · model)`（CLI `tool-events.mjs:145` 逐字）；`webview/status-bar.js:45` 零改（渲 `S._currentTool`）。
  - **刷新路径**：卡头 = `addTool` 一次性建（无重建通道）；状态行载体 = `S._currentTool`（单源），消费面 = 消息驱动 + 2 s 拍 ⇒ 断言：2 s 拍复绘后字面不变。
- **③ 可机检验收**（新增档 `thincoder-vscode/test/advisor-card-header.test.mjs`）
  - `cd /d D:\teamcode\thincoder\thincoder-vscode && node --test test/advisor-card-header.test.mjs`
  - 断言：载荷 `{round:2, model:"glm-5.2"}` ⇒ 卡头含 `(round 2 · glm-5.2)` ∧ 状态行字面同 CLI；非 advisor 载荷（无 round）⇒ 卡头逐字节同修前；`round` 在而 `model` null ⇒ 显 `(round N)`（降级形态，不显 `null`）。
- **④ 边界**：不改评审机制 / 轮次语义；不动 `src/specs.mjs` 解析；不动 consult / escalate 模型段（已裁决端差：`WEBVIEW.md` 键形不含模型段）；不新增消息类型（`toolCall` 扩字段）。

#### X3 评审裁决计数 / 拒因不可见

- **① 面判定**：**VSC 摘要面缺结构**；CLI 标尺 = `thincoder-cli/src/tui/tool-summaries.mjs:70-90`（`_advisorSummary`：`advisor: N critical, N advisory, N style` / `advisor: passed` / 拒因 `advisor: <首句>`）。
- **② 修法**
  1. **新增叶** `thincoder-vscode/webview/tool-summary.js`：导出 `formatToolSummary(name, text)` = 从 `ui.js:272-287`（`resultSummary` 通用面）**逐字迁出** + CLI 同族分支（本项 = advisor 分支；X7 补 read/write/grep/glob/bash）。
  2. `thincoder-vscode/webview/ui.js:290-292` / `:307` / `:375`（`finishToolCard` 与 `buildToolHistory` 两调用点）改调 `formatToolSummary(name, text)`——`buildToolHistory` 已有 `name`（`:360`）。
  - **关联面（判据与字面双端同源）**：VSC 断言以 **CLI 纯函数直驱对拍**（`formatToolSummary("advisor", …)`）；**重复形态登记** = 与 #127「同形重复族」同族（不并核：核单源化 = 跨批结构面，见 §2.8 上报 ⑥）。
  - **刷新路径**：摘要位由 `finishToolCard` 一次性写（`ui.js:308-319`）；恢复卡（`buildToolHistory`）同判据 ⇒ 两路径同源。
- **③ 可机检验收**（新增档 `thincoder-vscode/test/tool-summary-parity.test.mjs`）
  - `cd /d D:\teamcode\thincoder\thincoder-vscode && node --test test/tool-summary-parity.test.mjs`
  - 断言：advisor 三形态（满载含 `N critical` / 零 critical ⇒ `passed` / 拒因）⇒ VSC `formatToolSummary` 返回值 === CLI `formatToolSummary`（同输入对拍等值）；通用面（非 advisor）零回归（先红：修前全走通用末行摘要）。
- **④ 边界**：不迁核（登记重复族）；不动非 advisor 摘要；不动 CLI（零改标尺）。

#### X5 工具结果 >64KB 静默截断无提示

- **① 面判定**：**VSC 显示面缺提示**，且缺陷点在**宿主切片点**（`panel-callbacks.mjs:179` `const text = (r || "").slice(0, 64 * 1024)`）+ webview `lib.js:30-34`（`capText` 仅 `t.length > max` 才补标记）——两处叠加 ⇒ 恰 64K 与超出皆**无提示**。CLI 标尺 = `tool-display.mjs:82-93`（`slimToolResultForDisplay` 行数维标记 + `capLines` 字符维标记，三层可见）。
- **② 修法**
  1. **宿主携事实旗标**（禁只改 webview——静默发生在切片点，提示须由该点事实驱动）：`panel-callbacks.mjs:179` 改
     `const full = String(r ?? ""); const text = full.slice(0, 64 * 1024); const truncated = full.length > text.length`；载荷补 `truncated`。
  2. webview：`webview/chat.js:137`（`toolResult` case）→ `finishTool(ctx, m.name, m.id, m.text, m.links, m.truncated)`；`ui.js:334` `finishTool` → `ui.js:290` `finishToolCard(ref, text, links, truncated)` ⇒ 正文尾追加标记行 + 摘要位尾部标注（判据 = **旗标驱动**，不由长度比较驱动 ⇒ 不复辟 `lib.js:32` 的 `<= max` 边界洞）。
  3. 文案：VSC 端特有键 `tool.truncated`（en `… (truncated at 64K — full text in history)` / zh `…（已截断于 64K——完整文本在历史中）`）——**禁照抄 CLI 行维字面**（CLI 标记为 `result truncated at N rows`，VSC 为**字符**维）。
  - **关联面**：`MAX_TOOL_OUTPUT`（`lib.js:27`）数值零改；工具结果入 history 的完整性零改（截断只在显示面）；`toolOutput` 流式截断（`chat.js:147-150`）零改。
  - **刷新路径**：卡体一次性写（`finishToolCard`）+ 恢复卡（`tool-card-restore.mjs`）同读同一 `resultSummary` 族 ⇒ 断言两路径（活卡 / 恢复卡）皆含标记。
- **③ 可机检验收**（新增档 `thincoder-vscode/test/tool-result-truncation.test.mjs`）
  - `cd /d D:\teamcode\thincoder\thincoder-vscode && node --test test/tool-result-truncation.test.mjs`
  - 断言：65K 结果 ⇒ 载荷 `truncated === true` ∧ 正文字面含标记 ∧ 摘要含标注；恰 64K 结果 ⇒ `truncated === false` ∧ 零标记；恢复卡路径同判据（先红：修前 `truncated === undefined` 且两形皆零标记）。
- **④ 边界**：不改 64K 额度；不动 CLI；不改工具结果入 history 语义；不引入行维额度（VSC 无行维设备）。

#### X6 子代理 turn-cap / interrupted 注记不可达 + `error` 面死枝

- **① 面判定**：**VSC 块头注记缺面** + **死枝登记（判据面）**。CLI 标尺 = `tool-events.mjs:217`（`lastError` = turn cap / stopped 判据）+ `render-segments.mjs:88`（`errPart` 渲 `— <note>`）。
- **实据（本席实读）**：VSC sync 冻结锚 `panel-callbacks.mjs:82-88`（`settleSyncSubagent`）只发 `{status:"done"}`；relay 终态分支 `panel-subagent-relay.mjs:87-89` 不携注记；webview 仅 `kind === "error"` 时承注记（`activity.js:362`）⇒ **注记面不可达**。**死枝**：全核 grep `onSubagent` 仅 `consult.mjs:21` 一处**注释**（零调用点）⇒ `{type:"subagent"}` 的 `error` / `failed` / `terminated` / `answered` 四态**无发射者** ⇒ `activity-view.js:48` 的 error 图标词 + `activity.js:227-237` 补桩表 error 行 = **死面**（保留防御 + 登记，**不在本批删**）。
- **② 修法**
  1. 注记判据（与 CLI 同源）：`panel-callbacks.mjs:172-182`（`onToolResult`）内算 `note` = `r` 含 turn-cap 标记 ⇒ `turn cap reached — work may be partial`；含 stopped 标记 ⇒ `stopped by user — work may be partial`；否则 null（**标记常量从核 import**——出处实现轮实核，禁字面复制）。
  2. `settleSyncSubagent(panel, subKey, note)`（`panel-callbacks.mjs:87`）⇒ `done` 载荷补 `note`。
  3. relay `⟦ev⟧stopped` 面（`panel-subagent-relay.mjs:87`）：核发射逐字 `⟦ev⟧stopped\x1e0\x1e0\x1estopped\x1e`（`agent-tools/async-settle.mjs:239`）——第 4 位 = 原因词位，现被丢弃 ⇒ 有值则透传为 `note`，无值 null（**不伪造**）。
  4. webview：`activity-view.js:46-50`（`headerText` 冻结三态）注记承面由「仅 error」扩到 done / stopped；注记存 `meta.note`（新字段，**与 X11 共用同一载体**，禁第二字段），渲染句复用 `:61-64` 的 `— <note>`（≤140 字符截断）。
  - **关联面**：块头两刷新路径同走 `refreshBlock` / `headerText` ⇒ 注记必须存 `meta`（活态载体）而非 DOM 一次写；`⟦ev⟧` 映射面改动 ⇒ **须复跑 `test/protocol-coverage.test.mjs`**（1-hop 记账面：`panel-subagent-relay.mjs` 头注 R-1–R-6 约定）。
- **③ 可机检验收**（新增档 `thincoder-vscode/test/subagent-note-parity.test.mjs`）
  - `cd /d D:\teamcode\thincoder\thincoder-vscode && node --test test/subagent-note-parity.test.mjs`
  - 断言：`onToolResult(name, result + TURN_CAP_MARK, id, "coder#2")` ⇒ `sub:coder#2` 块头含 `— turn cap reached — work may be partial`；停断言 = `refreshLiveHeaders()`（2 s 拍体）后再发一条 `started` / `turn` 消息（覆盖式重建）⇒ 注记仍在（**两路径同断言**）；无标记结果 ⇒ 零注记；死枝登记面 = error 补桩表**保留**（不作活面判据）。
- **④ 边界**：不删 webview error 面（防御保留 + 登记）；不改核 settle 事件文法（原因位只读）；不动 CLI；不改补桩机制。

#### X7 结果结构化计数（read / grep / glob / write / bash）

- **① 面判定**：**VSC 摘要面缺结构**；CLI 标尺 = `tool-summaries.mjs:7-53`（`formatToolSummary` 分派 + `<N> lines` / `<N> matches` / `no matches` / `<N> files` / `wrote N bytes` / `bash: <尾行> (exit code N)`）。
- **② 修法**：在 X3 已建叶 `webview/tool-summary.js` 内补 CLI 同名分支，**字面逐字承 CLI**；`bash` 分支只补**末行提取**（状态位族 `(exit code N)` / `(spawn failed)` 已由既有 `toolFailureStatus` 覆盖——`ui.js:283`，**不重复**）。
  - **关联面**：判据与字面双端同源 = 对拍 CLI `formatToolSummary`；恢复卡（`buildToolHistory` → 同族）自动同享；**重复形态登记**同 X3。
- **③ 可机检验收**（扩充 X3 提交的 `thincoder-vscode/test/tool-summary-parity.test.mjs`；与 X3 合档，避免簇档）
  - `cd /d D:\teamcode\thincoder\thincoder-vscode && node --test test/tool-summary-parity.test.mjs`
  - 断言：read / grep / glob / write / bash 五形态 × CLI 纯函数对拍等值（含无匹配 / 空结果两界）；默认分支（未知工具）= 首个非空行（CLI `:15-17` 同规）（先红：修前全走通用末行摘要）。
- **④ 边界**：不迁核（登记重复族）；不动 `verify` 分支（CLI 有、VSC 未登记 ⇒ **不在本批**）；不动 CLI 面。

#### X10 sync 运行块无 ⏹（含现场判定）

- **① 面判定**：**VSC 控制面缺**；CLI 标尺 = `thincoder-cli/src/tui/subagent-panel.mjs:123-127`（`registryLive = state._agent?._syncChildAborts?.has(sub.key)` 纳入 ⏹ 门控）。
- **可行性事实（本席实读）**：VSC ⏹ 路由 `panel-messages-turn.mjs:60-79` 只查 `_asyncSubagents` / `_asyncAdvisors` 池条目（`:73`）⇒ sync 子代理**无取消通路**；webview 门控 `activity-view.js:132-140` 只认 `status==="running" && pool===true`。
- **② 修法（甲案 · 能力对位；乙案否决）**：**乙案（只扩 webview 门控）= 否决**——无路由的按钮静默无效，违既有「可见但不可中止」纪律（D-M7 注释自陈）。取**甲案**：
  1. 宿主侧读核 sync registry（`_syncChildAborts`——**只读不建**，禁第二套 registry）——**现场判定义务**：实现轮先实核该载体在 VSC 面板 agent 上是否可达（核写点 + 面板 agent 是否同体）。
  2. 块 meta 新字段 `syncLive`（宿主在 `started` / 心跳载荷携 ⇒ 与存活投影同形，`suspension.mjs:140-159`）。
  3. webview 门控（`activity-view.js:132-140`）加 `meta.syncLive === true` 一支。
  4. ⏹ 路由（`panel-messages-turn.mjs:60-100`）增 sync 分支：role/id → registry 条目 controller abort（与 async 同收尾语义：核 settle 发 `⟦ev⟧stopped` ⇒ 块冻结）。
  - **降级路径（判据先行）**：实现轮实核「VSC 宿主读不到 sync registry」⇒ 本项**降级为登记**（登记端差保留 + 文案告知），**不得造第二套 registry**（违 §1.2 禁改动面）。
- **③ 可机检验收**（新增档 `thincoder-vscode/test/sync-block-stop.test.mjs`）
  - `cd /d D:\teamcode\thincoder\thincoder-vscode && node --test test/sync-block-stop.test.mjs`
  - 断言：`syncLive:true` 的 running 块 ⇒ ⏹ 在位 ∧ title = 停标签；点击 ⇒ 恰一条 `cancelSubagent` 载荷（`{type, id:Number, role}`——与既有 async 用例 `test/activity-flow.test.mjs:298` 同形）；`refreshLiveHeaders()`（2 s 拍）后 ⏹ 仍在（门控载体 = `meta`，非 DOM 一次写）；冻结块 ⏹ 移除零回归。
- **④ 边界**：不改 async 池语义 / 调度器；不动 CLI；`_syncChildAborts` 只读；`pool===true` 既有分支零回归。

#### X11 会话退出 / 中止冻结无 interrupted 注记（含可达性判定）

- **① 面判定**：**VSC 冻结注记缺面**；CLI 标尺 = `thincoder-cli/src/tui/subagent-freeze.mjs:217-221`（`!sub.done` ∧ `state.status !== "Ready"` ⇒ `lastError = "interrupted"`）。
- **可达性判定（不默认成立）**：宿主终态通知 = `suspension.mjs:404-406`（`postSuspensionEnd(panel, {freeze})`）；webview `panels.js:101-108` → `freezeLiveBlocks()`（`activity.js:414-420`）一律 `freezeBlock(block, "done")` ⇒ 无 interrupted 面。
  **判据 = 「abort 面」是否可与自然退出分辨**——实现轮实核宿主 abort 旗标（`panel._abortRequested` / `_suspAborted` 族）与 `postSuspensionEnd` 调用点；**分辨不出 ⇒ 本项降级为登记**（不伪造 interrupted）。
- **② 修法**：① `postSuspensionEnd` 载荷补 `interrupted` 布尔（真值源 = 宿主 abort 面旗标）；② `panels.js:107` 传旗标 → `freezeLiveBlocks(interrupted)` → `freezeBlock(block, kind, {note})` 写 **`meta.note`**（与 X6 同一载体，禁第二注记字段）⇒ 头尾 `— interrupted`。
  - **刷新路径**：同 X6（`meta` 载体；2 s 拍 + 覆盖式重建两路径同显）——本项断言冻结块（`refreshLiveHeaders` 只刷 live 块 ⇒ 覆盖式重建路径为主断言）。
- **③ 可机检验收**（新增档并入 X6 的 `thincoder-vscode/test/subagent-note-parity.test.mjs`）
  - `cd /d D:\teamcode\thincoder\thincoder-vscode && node --test test/subagent-note-parity.test.mjs`
  - 断言：`suspension{active:false, freeze:true, interrupted:true}` ⇒ 区全体块头含 `— interrupted`；`interrupted` 缺省 ⇒ 零注记（自然退出）；已在流块不动。
- **④ 边界**：不改 CLI；不改挂起池语义；不改 digest 回收路径（`reclaimDigestedBlocks` 面零改）。

### 2.3 条目 #126 —— 反向显示端差（CLI 缺面 · 2 子项）

> 本族 = **CLI→VSC 反向对齐**（§1.3 ② 第二句）。`thincoder-cli/src/tui/agent-turn.mjs` 现 **343 行**、`suspension-drive.mjs` **316 行**（皆 ≤500）；本族改动各 ≤15 行 ⇒ 不触拆分线。

#### X8 provider 失败无诊断上下文 + 无 Retry

- **① 面判定**：**CLI 呈现面缺**；VSC 标尺 = `panel-turn-loop.mjs:150-155`（友好首行 + `<details>`：raw + `→ Provider` + `→ Model`）+ `webview/ui.js:408-421`（`error-retry-btn` → `{type:"retry"}`）。
- **② 修法**：`thincoder-cli/src/tui/agent-turn.mjs:219`（catch 非中止分支 `pushLine('[error] ' + error.message)`）改三件：
  1. 友好首行同 VSC 判据 = `String(error.message).split("\n")[0]` + URL 脱敏（`https?://[^\s,)"]+` → `[endpoint]`——**判据与 VSC 同源**（实现轮实核脱敏正则单源化可行则同源，不可则双写登记）；
  2. 诊断两行：`→ Provider: <baseURL>` / `→ Model: <model>`（CLI 变量名实现轮实核）；
  3. **Retry**：复用既有 `state.permission` 询问机制（`:199-207` 先例）——`state.permission = { name: "retry", args: {…}, resolve }` → 同意 ⇒ `state.controller = makeController(); resume = true; continue`（与 `:215-217` 同法）；拒绝 ⇒ 现状 `break`（`[error]` 保留）。
  - **现场判定义务**：重入语义须实核 = `runAgentImpl(agent, text, callbacks, { resume: true })` 对「provider 失败后重入」是否成立（`ContinueError` 先例 `:182-217` 已成立，但错误面未验）——不成立 ⇒ 本项降级为「诊断上下文三行 + 手工重发提示」（不加伪重试）。
  - **关联面**：abort 分支（`:152-181`）零改；`ContinueError` 面（`:182-217`）零改；TUI 组件零新增（复用 permission 面板）；CLI 硬编码 zh/EN 混排面（台账已另计）不动。
- **③ 可机检验收**（新增档 `thincoder-cli/test/provider-error-surface.test.mjs`）
  - `cd /d D:\teamcode\thincoder\thincoder-cli && node --test test/provider-error-surface.test.mjs`
  - 断言：注入含 `https://…` 的错误 ⇒ 首行含 `[endpoint]` ∧ **不含**原 URL；诊断行含 provider / model 两段；Retry 应答 `y` ⇒ 再次进入回合（`resume === true` 断言）/ 应答 `n` ⇒ `break` ∧ `[error]` 行仍在（先红：修前只有单行原始错误）。
- **④ 边界**：不动 VSC（标尺面零改）；不改 provider 层重试策略；不动 abort 分支；不新增 TUI 组件。

#### X9 CLI 无 digest 收尾「已消化 N 份 / 耗时」行

- **① 面判定**：**CLI 呈现面缺**；VSC 标尺 = `webview/chat.js:356-402`（`digest start` → 标签 + 计数行；`digest end` → 本轮元素原地更新为 `已消化 N 份后台报告（Xs）` / 中断形态）。CLI 现状 = 仅起跑标签三档（`suspension-drive.mjs:172-175`）+ 日志事件（`:182-184` `logEvent("digest:end", {ms})`——**模型/用户不可见**）。
- **② 修法**：`thincoder-cli/src/tui/suspension-drive.mjs:184` 后补可见行：`pushLine(<文案>, C.dim)`。
  - 文案单源：核 i18n 容器已有 `digest.done`（`thincoder-core/i18n.mjs:35`：en `Digested ${n} background report(s) (${seconds}s)` / zh `已消化 ${n} 份后台报告（${seconds}s）`）与 `digest.aborted`（`:36`）⇒ **禁第三份字面**（实现轮实核 CLI 是否已有 i18n 取值路径；无 ⇒ 经核 `projectDictionary` 导出取值）。
  - 计数口径（**待裁项**，见 §2.8 上报 ⑤）：VSC 用**起跑数** `n`（`suspension.mjs:302` / `:314` 同一 `pendingN`）；CLI 手头有 `pend0`（`:181`）与 `pendingFamilyCount(agent)`（`:184`）⇒ 设计**取起跑数 `pend0`** 与 VSC 齐（消费数另计会引入双口径，正是本批要消的形态）。
  - 失败面：`ok=false`（中断/失败）⇒ 用 `digest.aborted`（`(Xs)` 形态）。
  - **关联面**：`digest:start` / `digest:end` 日志事件零改（LOGGING 面）；起跑标签三档零改（M4 只动 VSC 侧对位）。
- **③ 可机检验收**（新增档 `thincoder-cli/test/digest-end-line.test.mjs`）
  - `cd /d D:\teamcode\thincoder\thincoder-cli && node --test test/digest-end-line.test.mjs`
  - 断言：消化轮收尾 ⇒ 输出行含起跑数 N 与 `(Xs)` 形态（正则 `\d+(\.\d)?s`）；中断路径 ⇒ aborted 字面；起跑标签三档字面零回归（先红：修前轮尾无该行）。
- **④ 边界**：不动 digest 轮机制 / 计数语义；不动 VSC；不改日志事件载荷。

### 2.4 受影响文件表（行数 = 2026-09-20 实读口径「含末行」；越线判据 = ≤300 咨询 · ≤500 硬限）

**VSC 包（`thincoder-vscode/`）**

| 文件 | 现行 | 预期净增 | 越线判定 | 关联子项 |
|---|---|---|---|---|
| `webview/streaming.js` | 230 | +8 | 安全（238） | M1 |
| `webview/ui.js` | 473 | −12 / +5（摘要族迁出） | **逼近硬限** ⇒ 净增须 ≤ +10（否则触 500） | M1 · X2 · X5 |
| `webview/tool-summary.js` | **新档** | ~95 | 新叶（拆分计划：摘要族单面单档） | X3 · X7 |
| `webview/chat.js` | 411 | +12 | 安全（423） | M3（零改）· M4 · X2 · X5 |
| `webview/activity-view.js` | 182 | +6 | 安全（188） | X6 · X11（`meta.note` 承面扩） |
| `webview/activity.js` | 434 | +6 | 安全（440） | X6（`meta.note` 写点）· X11 |
| `webview/panels.js` | 140 | +2 | 安全（142） | X11 |
| `webview/status-bar.js` | 102 | 0 | 列明以固定边界（渲染句零改） | M2 · X2 |
| `webview/lib.js` | 99 | 0 | 列明以固定边界（`MAX_TOOL_OUTPUT` 与 `capText` 零改） | X5 |
| `src/extension/panel-callbacks.mjs` | 272 | +14 | 安全（286） | M2 · M3 · X2 · X5 · X6 |
| `src/extension/panel-subagent-relay.mjs` | 215 | +4 | 安全（219）· **1-hop 记账面**（头注 R-1–R-6） | X6 |
| `src/extension/suspension.mjs` | 407 | +10 | 安全（417） | M4 · X10 · X11 |
| `src/extension/panel-messages-turn.mjs` | 199 | +18 | 安全（217） | X10 |
| `src/specs.mjs` | 60 | +10 | 安全（70） | M2 |
| `locales/en.json` | 260 | +2 键 | 安全 | M1 · X5 |
| `locales/zh.json` | 260 | +2 键 | 安全 | M1 · X5 |
| `test/files.mjs` | 102 | +8 行（新测试档登记） | 清单制（D3） | 全部 VSC 新档 |

**核包（`thincoder-core/`）**

| 文件 | 现行 | 预期净增 | 越线判定 | 关联子项 |
|---|---|---|---|---|
| `i18n.mjs` | 102 | +4（`digest.turnLabelAsk` / `digest.turnLabelAuto` 两键） | 安全（106） | M4 |

**CLI 包（`thincoder-cli/`）**

| 文件 | 现行 | 预期净增 | 越线判定 | 关联子项 |
|---|---|---|---|---|
| `src/tui/render-segments.mjs` | 168 | +2 | 安全（170） | M5 |
| `src/tui/subagent-panel.mjs` | 149 | ±1 | 安全（150）· 同判据须核 | M5 |
| `src/tui/agent-turn.mjs` | 343 | +18 | 安全（361） | X8 |
| `src/tui/suspension-drive.mjs` | 316 | +6 | 安全（322） | X9 |

**测试档（新增 11 · 扩充 1）**：VSC 新档 8 = `webview-tool-interrupted` · `context-percent-parity` · `tool-output-payload` · `advisor-card-header` · `tool-summary-parity` · `tool-result-truncation` · `subagent-note-parity` · `sync-block-stop`（全部登记 `test/files.mjs`）；VSC 扩档 1 = `digest-visibility`；CLI 新档 3 = `subagent-freeze-icon` · `provider-error-surface` · `digest-end-line`。

**设计档（`docs/` · 写域 = eng-designer）**：`vsc/design/WEBVIEW.md`（509 行 · 待落：VSC 面 8 子项条款 + D-W/U-W/回指行 + 变更记录）· `cli/design/TUI.md`（609 行 · 待落：CLI 面 5 子项条款 + 变更记录）——**状态 = 待落（见 §2.5 批 4 / §2.8 上报 ⑪）**。`WEBVIEW-PROTOCOL.md`（状态行与块头字段对位面 · 消息族字段表）须随 M2/X2/X5/X6 载荷扩字段同轮核（实现轮实核落点归属，禁双源重述——D2）。

### 2.5 实施分批

| 批 | 面 / 执行者 | 内容 | 写域（文件级） |
|---|---|---|---|
| **批 1（A 组）** | VSC 产品码 · **eng-coder** | 工具卡族 + 摘要族 + 状态行：M1 · M2 · M3 · X2 · X3 · X5 · X7 + 两 locale 键 | `webview/{streaming,ui,chat,lib}.js` · `webview/tool-summary.js`（新）· `src/specs.mjs` · `src/extension/panel-callbacks.mjs` · `locales/{en,zh}.json` · 测试 + `test/files.mjs` |
| **批 2（B 组）** | VSC 产品码 · **eng-coder** | 活动块 / 协议面：M4 · X6 · X10 · X11 + 核 i18n 两键 | `webview/{activity,activity-view,panels,chat}.js` · `src/extension/{suspension,panel-subagent-relay,panel-messages-turn,panel-callbacks}.mjs` · `thincoder-core/i18n.mjs` · 测试 + `test/files.mjs` |
| **批 3** | CLI 产品码 · **eng-coder** | M5 · X8 · X9 | `thincoder-cli/src/tui/{render-segments,subagent-panel,agent-turn,suspension-drive}.mjs` · 测试 |
| **批 4** | 设计档正文 · **eng-designer**（本席） | 上面 §2.4 两档条款 + 决策/回指/变更记录行 | `docs/vsc/design/WEBVIEW.md` · `docs/cli/design/TUI.md`（+ 实核 `WEBVIEW-PROTOCOL.md` 字段表归属） |
| **父侧直改** | 工程工具面 | **本批 0 项**（`scripts/**` 禁；`check-vsix.mjs` 计数族属他批 #116/#120） | — |
| **设计档已落（承接）** | — | #118 显示链契约（`WEBVIEW.md` §5.2 / §5.3）——**已落，本批只承接**（零动作） | — |

- **批 1 与批 2 可并行**（文件级无交：批 1 = 工具卡/摘要/状态行；批 2 = 活动块/挂起/协议），**唯一共享档 = `webview/chat.js` 与 `test/files.mjs`** ⇒ 若并行 spawn，须把 `chat.js` 归属批 1、批 2 的 `chat.js` 改动（M4 标签行）并入批 1 的提交序（或两批串行）。
- **批内顺序**：批 1 先落 `tool-summary.js`（新叶）再改 `ui.js` 调用点（避免大档同时增删）；批 2 先落 `meta.note` 载体（activity.js）再扩承面（activity-view.js）。
- **批 4 时点**：设计档条款描述**改动后**状态 ⇒ 落在批 1–3 实现轮之后或同轮（父侧裁）；**不得先落**（否则把未实现形态写成现盘事实）。

### 2.6 验收命令清单（cmd.exe · 全 ASCII · 禁中文 `findstr /c:` 形态）

| # | 子项 | 命令（实现轮落测试档后跑） | 现盘锚（可跑 · 证夹具族在） |
|---|---|---|---|
| 1 | M1 | `cd /d D:\teamcode\thincoder\thincoder-vscode && node --test test/webview-tool-interrupted.test.mjs` | `node --test test/webview-tool-failure-signal.test.mjs` |
| 2 | M2 | `cd /d D:\teamcode\thincoder\thincoder-vscode && node --test test/context-percent-parity.test.mjs` | `node --test test/context-parity.test.mjs` |
| 3 | M3 | `cd /d D:\teamcode\thincoder\thincoder-vscode && node --test test/tool-output-payload.test.mjs` | `node --test test/subagent-content-relay.test.mjs` |
| 4 | M4 | `cd /d D:\teamcode\thincoder\thincoder-vscode && node --test test/digest-visibility.test.mjs` | 同左（族已在册） |
| 5 | X2 | `cd /d D:\teamcode\thincoder\thincoder-vscode && node --test test/advisor-card-header.test.mjs` | `node --test test/activity-flow.test.mjs` |
| 6 | X3 + X7 | `cd /d D:\teamcode\thincoder\thincoder-vscode && node --test test/tool-summary-parity.test.mjs` | `node --test test/history-restore.test.mjs` |
| 7 | X5 | `cd /d D:\teamcode\thincoder\thincoder-vscode && node --test test/tool-result-truncation.test.mjs` | `node --test test/read-dual-end.test.mjs` |
| 8 | X6 + X11 | `cd /d D:\teamcode\thincoder\thincoder-vscode && node --test test/subagent-note-parity.test.mjs` | `node --test test/activity-closure.test.mjs` |
| 9 | X10 | `cd /d D:\teamcode\thincoder\thincoder-vscode && node --test test/sync-block-stop.test.mjs` | `node --test test/async-visibility.test.mjs` |
| 10 | 协议面（M4 · X6 扩字段） | `cd /d D:\teamcode\thincoder\thincoder-vscode && node --test test/protocol-coverage.test.mjs test/protocol-coverage-reverse.test.mjs` | 同左 |
| 11 | VSC 包全绿 | `cd /d D:\teamcode\thincoder\thincoder-vscode && npm test` | 同左 |
| 12 | M5 | `cd /d D:\teamcode\thincoder\thincoder-cli && node --test test/subagent-freeze-icon.test.mjs` | `node --test test/turn-across-segments.test.mjs`（同族面板面） |
| 13 | X8 | `cd /d D:\teamcode\thincoder\thincoder-cli && node --test test/provider-error-surface.test.mjs` | `node --test test/memory-scan-bounds.test.mjs`（同包跑通证） |
| 14 | X9 | `cd /d D:\teamcode\thincoder\thincoder-cli && node --test test/digest-end-line.test.mjs` | 同左 |
| 15 | CLI 包全绿 | `cd /d D:\teamcode\thincoder\thincoder-cli && npm test` | 同左 |
| 16 | 核包全绿（i18n +2 键） | `cd /d D:\teamcode\thincoder\thincoder-core && npm test` | 同左 |
| 17 | 文档机检净增 0 | `cd /d D:\teamcode\thincoder && node scripts/doc-check.mjs --root .` | 同左（基线 = 悬空 0 · 行宽 0 · exit 0） |

- 判据纪律：所有断言**行为形态**（业务可观测结果）与**结构对表形态**（载荷字段/字面等值）；**禁**读非测试文档断言句子的散文锚。
- 跨端等值断言（X3 · X7 · M5 面）一律**直驱对端纯函数对拍**（CLI `formatToolSummary` / VSC `formatToolSummary` 同输入等值）——禁复制字面常量当断言源。

### 2.7 边界（本批不做）

- **不做**：#118 本体（一致性同步批在办）· 已裁决端差族（图标语汇 / 模式词 / 文案分档 / consult·escalate 模型段 / settings 归属）· 核分类 / 池语义 / 调度器 · `scripts/**` · 需求档 · 两产品 `AGENTS.md` · 他批写域（#115–#120 文档/工具面 · #121–#123 机制对位 · #127 重复族本体）。
- **不做**：M2 的「绝对 token 数」半（台账 §6.1 已登记，另计）· X6 的 error 死枝**删除**（保留防御 + 登记）· X10 / X11 的**第二套 registry / 伪造注记**（读不到即降级登记）· X3 / X7 的**摘要族迁核**（只补端面 + 登记重复形态）· `verify` 摘要分支（VSC 未登记，不属本批射程）。
- **不做**：任何文案的**新增语言**或分档重写（只在核容器/VSC 本地档补键）。
- **估值纪律**：本批不做性能与额度数值调整（64K / 300 行 / 500 行等既有常量一律不动）。

### 2.8 上报与不一致处（逐条 · 含非阻塞观察）

1. **M3 判定倾向（非「默认成立」）**：台账记「待现场确认」；本席**静态链实读闭环**（`advisor/loop.mjs:82` → `advisor.mjs:241` → `dispatch.mjs:397` → `panel-callbacks.mjs:185-188` → `chat.js:142-148`，5 跳坐标已核）⇒ 倾向成立；**现场仍须探针 A（`tool-output-payload`）+ 探针 B（真跑 sync 评审）取证**，两读数入 §5。
2. **死枝登记**：核侧**零 `onSubagent` 调用点**（全核 grep 仅 `consult.mjs:21` 注释）⇒ VSC `{type:"subagent"}` 的 `error` / `failed` / `terminated` / `answered` 四态**无发射者**（`activity-view.js:48` error 图标词 + `activity.js:227-237` 补桩表 error 行 = 死面）。处置 = **保留 + 登记**（本批射程外）。
3. **核面契约分叉（跨批）**：sync 评审（`advisor.mjs:241`）不带 relay 前缀，async 评审（`advisor-async.mjs:415`）带 ⇒ 同一对象 chunk 一路归一、一路不归一。本批只在 **VSC 端边界**归一；**核面契约分叉本身 = 跨批上报**（不在本批写域）。
4. **M4 `tier` 判据依赖**：「未 drain ask 在场」旗标须取核既有载体（`F-UC7`/`upstream` 族）——实现轮实核旗标名，**禁新造第二判据**；若 VSC 宿主无该旗标 ⇒ ask 档不可判 ⇒ **本项降级为两档 + 再上报**。
5. **X9 计数口径 = 待裁项**：设计取「起跑数」与 VSC 现口径齐（`suspension.mjs:302` / `:314` 同源 `pendingN`）；若父侧/用户取「消费数」⇒ 两端须同改（VSC 同口径改），**本席不自裁**。
6. **摘要族同形重复（#127 族）**：X3 / X7 使「工具摘要」在两端各一份（CLI `tool-summaries.mjs` ∥ VSC `tool-summary.js`）——本批只补端面 + **登记**（并核 = 核面结构改动，属 #127 射程）。
7. **X10 现场判定**：VSC 宿主能否只读核 `_syncChildAborts`——否 ⇒ **降级为登记**（禁造第二套 registry）。
8. **X11 现场判定**：abort 面能否与自然退出分辨（宿主旗标）——否 ⇒ **降级为登记**（禁伪造 `interrupted`）。
9. **需求档面（不越权）**：三条为台账 `tech_todo`，无独立需求档条目；判据源头 = 台账 evidence + §1.3 用户口径。若要求需求档登记 ⇒ **主 agent 写域**，本席只核不改。
10. **协议机检面**：M4（`digest` 扩 `tier`）与 X6（`subagent` 扩 `note`）改载荷字段 ⇒ **必复跑** `test/protocol-coverage.test.mjs` + `test/protocol-coverage-reverse.test.mjs`（`panel-subagent-relay.mjs` 头注 R-1–R-6 的 1-hop 记账面）；`WEBVIEW-PROTOCOL.md` 消息族字段表落点归属 = 实现轮实核（D2 禁双源重述）。
11. **设计档正文条款未落（未完成面 · 非静默跳过）**：`docs/vsc/design/WEBVIEW.md` / `docs/cli/design/TUI.md` 的新节/新行 = **待落**（锚点见 §2.4 / §2.5 批 4）；时点须在实现轮之后（先落会把改动后形态写成现盘事实）。本轮交付面 = **本档 §2**（设计）+ 逐项判据。
12. **测试档清单登记（D3）**：VSC 新测试档（8 档）须登记 `test/files.mjs`（清单制——未登记 = 套件虚报组成）；CLI 侧等价清单实现轮实核（若无清单制，本条自动消解）。
13. **M5 同判据两处**：`render-segments.mjs:89`（冻结头）与 `subagent-panel.mjs:85` 区（live/queued 头）须同步核——若后者同现 `✓`+`stopped` 互斥 ⇒ 一并改；若不同 ⇒ 记录据（记为设计面收正）。
14. **净增 0 义务面**：新增文案键、设计档新行、`test/files.mjs` 新行均须自洽（无悬空锚 / 无 >300 字符行）——`doc-check` 判据见 §2.6 行 17。
15. **非阻塞观察（不在本批）**：`webview/chat.js:290` 注释「advisor 无消费者/无发射者」**已陈旧**（`sub:` 内容面实际经 `relaySubagentContentChunk` 到达）——属注释陈旧面，登记（建议随批 2 顺手收正，若父侧准）。
16. **非阻塞观察（不在本批）**：`thincoder-vscode/src/i18n.mjs:19-20` 自陈「核域键在本地档仍有 32 键同值副本 ⇒ 双源冻结，摘除候选登记」——本批新增键只入核容器（不复刻本地档），不改变该冻结面。

### 2.9 三链一致自检（本批返回前自查）

- **台账链**：#124（5 子项）· #125（7 子项）· #126（2 子项）= **14 子项**，§2.1 / §2.2 / §2.3 逐项在位（每项四要素：面判定 / 修法 / 可机检验收 / 边界）。
- **设计链**：§2.4 受影响**既有档** = 21（VSC 16 · 核 1 · CLI 4）+ **新增源码叶** 1（`webview/tool-summary.js`）+ **新增测试档** 11（VSC 8 · CLI 3）+ **扩充测试档** 1（VSC `digest-visibility`）+ **登记面** 1（`test/files.mjs`，已计入 VSC 16）。
- **判据链**：§2.6 逐子项 ≥1 条可跑命令（17 行）+ 现盘锚；VSC 面 8 子项含**刷新两路径**断言（2 s 拍 / 覆盖式重建）；跨端等值断言 = 对端纯函数对拍。
- **口径链**：标尺判定 12 项 VSC→CLI · 2 项族 CLI→VSC（M5 · #126）；承接面（#118）零动作；禁改动面零触碰（逐条列于 §2.7）。

### 2.10 设计评审修正轮 1（fix · 评审 id=20 · 16 条逐号落地）

**轮次**：fix（定点 · 追加制）· **作者**：eng-designer · **日期**：2026-09-20 · **对象** = 本档 §2 全段（发现源 = §3 轮次 1 · 🔴1 / 🟡9 / 🔵6 = 16 条；父侧裁定 = 16 条全接受）。
**读法（追加制）**：本附录 = 对 §2 逐处的**收正与追加**；原行不重写；凡与 §2 既有行冲突处，**以本附录为准**（本附录 = 16 条的执行面）。
**接口复核**：本附录零触碰「本批两档条款正文」（条款落笔仍归 §2.5 批 4）· 零新条目 · 需求档 / §3 / §4 / §6 / 实现面 / `scripts/**` 零触碰。
**实读基线**：行数与坐标收口 = §2.10.7（同轮同口径 · as-of 2026-09-20）；机检读写 = §2.10.10。

#### 2.10.1 逐号变更表（#1..#16 → 落点）

| # | 级 | 处置 | 落点 |
|---|---|---|---|
| 1 | 🔴 | X10 条款冲突：点名 3 行 + 冲突上报（含 F-A4 需求面）+ 计数收正（VSC 11 / CLI 3） | §2.10.2 |
| 2 | 🟡 | 批 4 落地闸（§2.6 追加行 18 + 逐子项在位命令 + 标记约定） | §2.10.3 |
| 3 | 🟡 | 5 档越 300 线拆分复核 = 不动（逐档理由 + 复核触发条件） | §2.10.4 |
| 4 | 🟡 | `meta.syncLive` webview 写点 = `activity.js:303-313` + 行数计入（434 → +8） | §2.10.5 |
| 5 | 🟡 | 「图标语汇 / 文案分档」已裁决族射程边界（M4 / M5 越禁判据 + M5 判据单源裁定） | §2.10.5 |
| 6 | 🟡 | M1 补 `finish(false)` + 未结算卡判据（清扫恒执行） | §2.10.5 |
| 7 | 🟡 | M4 `n = 0` 判据（边界 / 回收零影响 + end 幻影元素约束） | §2.10.6 |
| 8 | 🟡 | 载荷扩字段表定于一（6 行）+ 协议机检复跑行收正 | §2.10.6 |
| 9 | 🟡 | WRAPPER 登记（`WEBVIEW.md:121-124`）= 本批不并 + 理由 + 新触发 | §2.10.6 |
| 10 | 🟡 | `ui.js` / `chat.js` 行数与坐标收口（含 as-of）+「净增 ≤ +10」门定基 | §2.10.7 |
| 11 | 🔵 | 计数口径 11 / 3 定于一（§2.0:39 · §2.9:356 收正） | §2.10.8 |
| 12 | 🔵 | M3 四要素编号收正（③ = 现场确认路径三段） | §2.10.8 |
| 13 | 🔵 | X5 falsy 边界记录（+ 断言一行） | §2.10.8 |
| 14 | 🔵 | M2 补跨端对拍断言（CLI 口径逐字同式） | §2.10.8 |
| 15 | 🔵 | §1 状态行翻转 = 主 agent 写域（上报，不越权落笔） | §2.10.9 |
| 16 | 🔵 | X10 能力面归属登记（能力面 / 显示面二分 + 降级面） | §2.10.9 |
| 附 | — | 本席新发现（非 16 条内）：M4 与 `AGENT-LOOP-SUBAGENT.md` §6.27.12.12 ⑥ 边界相抵 | §2.10.9 |

#### 2.10.2 #1（🔴）X10 ⏹ 条款冲突 —— 点名 + 上报 + 计数收正

**处置 = 保留甲案**（父侧裁定：用户 2026-09-20 04:22「p1/2/3 都要处理」已认可本批含 X10）⇒ 修法 = 点名 + 上报，**不取消 X10**。

**(a) 计数收正（§2.4:283 / §2.5:292）**
- §2.4:283「VSC 面 **8** 子项条款」→ **VSC 面 11 子项**，清单 = `M1` · `M2` · `M3` · `M4` · `X2` · `X3` · `X5` · `X6` · `X7` · `X10` · `X11`。
- §2.5:292「两档条款」→ 点名射程：`docs/vsc/design/WEBVIEW.md`（11 子项）+ `docs/cli/design/TUI.md`（3 子项 = `M5` · `X8` · `X9`）。

**(b) 须收正的既成条款行（点名表 —— 批 4 落）**

| 档:行 | 现载（要点） | 收正方向（批 4 落笔） |
|---|---|---|
| `docs/vsc/design/WEBVIEW.md:188`（§5.2 ⏹ 覆盖按钮行） | 可见判据 = live + `running` + `pool === true`（停止）或 `queued`（取消排队）且 role ∈ family | X10 落 ⇒ 加一支 `syncLive === true`（running 且宿主确证可中止） |
| `docs/vsc/design/WEBVIEW.md:214`（§5.3 ⏹ 可见性判据句） | 「⏹ 可见性判据（`running + pool + family`）**不变**（F-A4 边界）」 | X10 落 ⇒「不变」不再成立：改判据**扩一支** + F-A4 边界句收正（需求面连带见 (c)） |
| `docs/vsc/design/WEBVIEW.md:185`（§5.2 frozen 行） | `[✓ key · … · done Ns · turn N/M]`（stop → `⏹` + `stopped Ns`；error → 错误注记随头） | X6 落 ⇒ 注记承面由「仅 error」扩至 done / stopped；X11 落 ⇒ 同载体补 `— interrupted` |

**(c) 冲突上报（§2.8 追加第 17 条 —— 逐字）**

「**17. X10 / X6 与既成条款同机制异述（本批须收正 · 需求面连带）**：本批 X10 给 ⏹ 门控加 `syncLive` 支、X6 把块头注记承面由 error 扩至 done / stopped —— 与 `docs/vsc/design/WEBVIEW.md` 的 §5.2 ⏹ 行（`:188`）/ §5.3 ⏹ 判据句（`:214`）/ §5.2 frozen 行（`:185`）为**同机制异述**；三行收正 = 批 4 落地（见 §2.10.2(b)）。**需求面影响（F-A4）**：`docs/vsc/requirements/WEBVIEW.md:53` 的 F-A4 边界句「不改 ⏹ 的可见性判据（running + pool + family 角色）」在本批后**不再成立**（判据扩 sync 可中止一支）⇒ 该半句须**父侧**同轮收正（本席只核不改 —— §2.0）；建议文本 =「⏹ 可见性判据 = running +（池条目 或 sync 可中止 registry）+ family 角色 —— 非池块仅在宿主确证可中止时给 ⏹」。**降级联动**：X10 现场判定「registry 不可读」⇒ 甲案降级为登记 ⇒ 本条三行与需求面收正**一并零动作**（无判据变化）。」

#### 2.10.3 #2（🟡）批 4 落地闸（§2.6 追加行 18）

**取舍 = 取「闸」不取「提前落条款」**：条款正文描述**改动后**形态（§2.5:298）⇒ 先落 = 把未实现形态写成现盘事实；既成做法（`WEBVIEW.md:173` · `:261` · `:348` 的「（拟新增」前向引用标记）只适用**新增档**，不适用**改写既有条款行**（本批三行 = 既有行判据改写）。

**§2.6 追加行 18**（批 4 落地闸 —— 两档 14 子项条款逐项在位 + 锚无悬空）：

```
cd /d D:\teamcode\thincoder && node scripts/doc-check.mjs --root .
cd /d D:\teamcode\thincoder && node -e "const s=require('fs').readFileSync('docs/vsc/design/WEBVIEW.md','utf8'),m=['M1','M2','M3','M4','X2','X3','X5','X6','X7','X10','X11'].filter(t=>!s.includes(t));if(m.length)throw Error(m);console.log('WEBVIEW clause 11/11')"
cd /d D:\teamcode\thincoder && node -e "const s=require('fs').readFileSync('docs/cli/design/TUI.md','utf8'),m=['M5','X8','X9'].filter(t=>!s.includes(t));if(m.length)throw Error(m);console.log('TUI clause 3/3')"
```

**期望读数**：doc-check = 悬空 0 · 行宽 0 · exit 0（基线口径见 §2.10.10）；两条在位扫描 = `WEBVIEW clause 11/11` + `TUI clause 3/3`。
**条款标记约定（批 4 落笔形态）**：每条子项条款携**本批子项号 token**（`M1` … `X11` 逐字 —— 即 §2.10.1(b) 清单 14 行），与条款同行（禁只写在变更记录）。
**粗门声明**：token 在位 = 最低保守机器形（token 亦可出现在他处，非强判据）；强判据 = doc-check 锚 / 行宽 + 设计评审轮对照。

#### 2.10.4 #3（🟡）越 300 咨询线的 5 档 —— 拆分复核 = 不动（逐档理由 + 复核触发）

判据：≤300 咨询线 · ≤500 硬限（§2.4 表头口径不变）；本批 5 档**均不动拆分**，逐档给理由与复核触发条件（触发 = 拆分复核升级的门，非本批动作）。

| 档 | 现行 → 预期 | 拆分复核 | 理由（本批实读结构） | 复核触发 |
|---|---|---|---|---|
| `thincoder-vscode/src/extension/suspension.mjs` | 407 → 417 | 不动 | 四段同享单一 `panel` / `history` 上下文（`suspensionSession` `:227` · `reassertLiveChildren` `:140` · `reclaimDigestedBlocks` `:104` · `postSuspensionEnd` `:404`）；本批三子项（M4 `tier` / X10 / X11）**各改既有函数的载荷行**，非新族 | > 470 或新增第五段 |
| `thincoder-vscode/webview/chat.js` | 411 → 423 | 不动 | 该档 = webview 派发中枢（`switch (msg.type)` 表 + 各 handler）；本批三子项（M4 标签行档判 / X2 状态行字面 / X5 旗标透传）改既有 case 分支内行 ⇒ 拆 = 切 dispatch 表（跨档引线） | > 470 或新增消息族 |
| `thincoder-vscode/webview/activity.js` | 434 → 440 | 不动 | 拆分计划**已在册**（痕迹族迁 `thincoder-vscode/webview/activity-diag.js`（拟新增）为 #118 批计划内动作 —— `WEBVIEW.md` §5.3 与 D-W22 在册）；本批 +6 在其迁出前，不叠加第二拆分 | 痕迹族迁出后复评 |
| `thincoder-cli/src/tui/agent-turn.mjs` | 343 → 361 | 不动 | +18 全在 `runAgentTurnInner` 的 catch 单段（X8 三件：友好首行 + 诊断两行 + Retry 询问）——单职责档 | > 400 |
| `thincoder-cli/src/tui/suspension-drive.mjs` | 316 → 322 | 不动 | +6 = `digestTurn` 单点一行可见行 + 文案取值（X9）——digest / 挂起驱动单职责，无独立读者面可切 | > 400 |

#### 2.10.5 #4 / #5 / #6（🟡）

**(#4) `meta.syncLive` webview 写点（X10）**

| 面 | 落点 | 内容 |
|---|---|---|
| 写点（webview） | `thincoder-vscode/webview/activity.js:303-313` | `status === "started"` 分支 meta 写族 —— 与 `:309` `meta.pool` 同段加 `meta.syncLive = m.syncLive === true` |
| 基座缺省 | `activity.js:83-92` | `_subMeta` 基座补 `syncLive: false`（缺省 = 无该支 ⇒ 门控零回归） |
| 读点 | `activity-view.js:132-140` | `updateStopButton` 的 `want` 判据加一支（§2.2 X10 步骤 3） |
| 载荷产者（宿主） | `panel-subagent-relay.mjs:67-70`（`[model]` 分支 `emit`） | sync spawn 出生面载荷产者；谓词与 ⏹ 路由同源（`panel-messages-turn.mjs` 路由面）——**现场判定义务**（registry 可达性）不变 |

**行数计入（§2.4 行修）**：`activity.js` 434 → **+8**（X6 · X11 · X10 各 1–2 行 + 基座 1）；`panel-subagent-relay.mjs` 215 → +4~6（含 `syncLive` 载荷字段，随现场判定定形）。

**(#5) 「图标语汇 / 文案分档」已裁决族 —— 射程边界（M4 / M5 越禁判据）**

- **已裁决族的不动对象 = 两端既有映射表的登记行**（`§1.2:21` 与 `§2.7:327` 所列五族：图标语汇 / 模式词 / 文案分档 / consult·escalate 模型段 / settings 归属）。
- **越禁判据（实现轮可自判）** = 「是否改动已登记的同义异形映射行」：改动既有映射行 ⇒ 越禁；**补齐缺面至既有映射** ⇒ 本批射程内。
- M4 = VSC **缺三档**（恒显单档）⇒ 补三档至 CLI 既成字面（不动 CLI 字面 / 不重切档位语义 / 不新增语言）。M5 = CLI **冻结头无三态互斥**（`✓` + `stopped` 并置）⇒ 补至 VSC 既成 `⏹` 形态（不动 VSC / 不改 live 头 `▶` / 审批 `⏸` 语义）。
- **M5 判据单源裁定（本席实读 —— 收正 §2.8 #13）**：两处**判据不同 ⇒ 记录据**：`thincoder-cli/src/tui/render-segments.mjs:89-91`（冻结头：icon + verb 双向 ⇒ 互斥缺陷本体）∥ `thincoder-cli/src/tui/subagent-panel.mjs:54`（面板头：icon 三态 `⏸` / `✓` / `▶`，**无 verb 面** ⇒ 无互斥形态）。
  ⇒ M5 改动面 = `render-segments.mjs` 单点；`subagent-panel.mjs` **零改**（该行无 `stopped` 分支 —— 若实现轮实核「stopped 条目在该头可达且 `done=true`」⇒ 归另条登记，不在 M5 射程）。

**(#6) M1 补 `finish(false)` + 未结算卡判据**

- **清扫恒执行（无条件）** = CLI 对位（回合 `finally` 恒清扫 —— `thincoder-cli/src/tui/agent-turn.mjs:265`）；`streaming.js:146` 的 `finish(aborted)` 两路径同规。
- **新增断言（并入 M1 档）**：`finish(false)`（正常路径）+ 未结算卡（`addTool` 后未收 `toolResult`）⇒ 该卡同样清扫（状态词 interrupted 词 + 摘要 `→ (interrupted)`）；已结算卡零改写；`refreshLiveHeaders()` / `resetActivity()` 后不复活（先红 = 修前 `tool.running` 残留）。
- **口径收正**：§2.1 原句「正常完成时 ref 全 `done` ⇒ 零动作」**不作断言依据**（不再举证该时序）—— 两路径由**无条件清扫**覆盖，与 CLI 标尺同形。

#### 2.10.6 #7 / #8 / #9（🟡）

**(#7) M4 `n = 0` 起跑 —— 边界 / 回收零影响判据**

- **写点唯一**：`S._digestBoundary` 写点 = `thincoder-vscode/webview/chat.js:369`（仅 `status === "start"` 分支；每轮重写）；**消费面唯一** = `archiveBlock(block, atBoundary=true)`（`activity.js:212-217`）—— `atBoundary` 仅由宿主回收 `done` 触发。
- **零影响证据**：`reclaimDigestedBlocks`（`suspension.mjs:104-116`）按轮差集补发 ⇒ `n = 0` 轮差集为空 ⇒ **零 `done` 投递** ⇒ 该轮边界写值无消费者；下一消化轮起跑即重写边界 ⇒ 无跨轮残留。
- **新增约束（本席实读 —— 实现须落）**：ask-only 轮若跳过计数元素，`chat.js:384-392` 的 end 兜底分支会**造出 `dataset.n = "?"` 的幻影计数行** ⇒ 两条 end 侧判据：① `tier === "ask"` 时 start 不建计数元素 ∧ `_digestRoundEl` 置空；② end 在「本轮无计数元素」时**零动作**（禁兜底建元素）。
- **断言**：`digest {status:"start", n:0, tier:"ask"}` ⇒ 标签行在 ∧ 无 `.digest-status` ∧ `S._digestBoundary` = 该标签行；随后 `digest {status:"end", ok:true}` ⇒ **零新增元素**（无 `n:"?"` 幻影行）；`tier:"digest"` 轮零回归。

**(#8) 载荷扩字段表（定于一 —— 唯一表）**

| 子项 | 消息族 | 扩字段 | 备注 |
|---|---|---|---|
| X2 | `toolCall` | `round` · `model` | §2.2 X2 步骤 1 |
| X5 | `toolResult` | `truncated` | §2.2 X5 步骤 1（宿主携事实旗标） |
| M4 | `digest` | `tier` | §2.1 M4 步骤 1 |
| X6 | `subagent`（relay 终态） | `note` | §2.2 X6 步骤 2 / 3 |
| X10 | `subagent`（出生 / 心跳） | `syncLive` | 本附录 §2.10.5(#4)（**本席按证据补入**） |
| X11 | `suspension` | `interrupted` | §2.2 X11 步骤 ①（**本席按证据补入**） |

- **收正**：§2.4:283 的「随 M2/X2/X5/X6 载荷扩字段同轮核」→ **删 M2**（M2 无载荷扩字段）· **补 M4**；§2.6 行 10 与 §2.8 #10 的射程「M4 · X6」→ 上表 6 行（原文只列 2 行）。
- **协议机检复跑行（§2.6 行 10 判据收正）**：`node --test test/protocol-coverage.test.mjs test/protocol-coverage-reverse.test.mjs`（VSC 包）。
  判据口径 = 该族测试只枚举**顶级判别式**（载荷字段变化不改 type 集 ⇒ 本不因扩字段而红）；**真义务 = 两表坐标列重出**（`WEBVIEW-PROTOCOL.md` §12 / §13 的 ② ③ 列含 `file:line`，本批 6 处改动点行号漂移后须按 `--emit` 重出）——落点 = 批 4。

**(#9) WRAPPER 登记（`WEBVIEW.md:121-124`）—— 处置 = 本批不并 + 新触发**

- **触发条件成立**：本批 M1 / X2 / X5 触碰 `ui.js`，且 X3 把含该正则的整段（`ui.js:277` `WRAPPER`）迁出至新叶 `thincoder-vscode/webview/tool-summary.js`（拟新增）。
- **不并理由**：① X3 / X7 = **摘要族迁移**（判据结构不动 —— 断言 = 与 CLI 纯函数对拍等值）；在迁移轮做判据重构会混两件事；② 判据单源化 = 跨批结构面（§2.8 #6 同族登记）；③ 迁移使消解点**改址**（`ui.js:277` → 新叶）。
- **新触发** = 「`tool-summary.js` 下次扩面（摘要族新增分支 / 状态位族扩第 4 成员）」；批 4 落点 = `WEBVIEW.md:121-124` 登记行改新触发 + 坐标改新叶。

#### 2.10.7 #10（🟡）行数与坐标收口（as-of 2026-09-20 · 口径 = `wc -l` / 含末行）

**实读读数（本席一次实读 —— 收口两说）**：

| 档 | 读数 | 档 | 读数 |
|---|---|---|---|
| `thincoder-vscode/webview/ui.js` | **473** | `thincoder-vscode/src/extension/suspension.mjs` | 407 |
| `thincoder-vscode/webview/chat.js` | **411** | `thincoder-vscode/src/extension/panel-callbacks.mjs` | 272 |
| `thincoder-vscode/webview/activity.js` | 434 | `thincoder-cli/src/tui/agent-turn.mjs` | 343 |
| `thincoder-vscode/webview/activity-view.js` | 182 | `thincoder-cli/src/tui/suspension-drive.mjs` | 316 |
| `thincoder-vscode/webview/streaming.js` | 230 | — | — |

- **「净增 ≤ +10」门定基（§2.4 `ui.js` 行）**：基线 = **473** ⇒ 落地后 ≤ **483**（距 500 硬限 ≥17 行）；预期实测 = **466**（−12 / +5 迁移净额）。
- **设计档坐标收正（本席已落 —— `docs/vsc/design/WEBVIEW.md`）**：§2 布局行与 §5.5 外层行 `ui.js:460-463` → `ui.js:442-445`；§5.5 同句 `activity.js:109` → `:107` · `streaming.js:70` → `:63` · `ui.js:481-491` → `ui.js:466-470`（`watch` 闭包）；§3 文件表 `chat.js:413` → `chat.js:411`；D-W13 行数 474 → 473（同口径 + as-of）；变更记录新增一行（2026-09-20 · 修正轮 1）。
- **陈旧读数登记**：`ui.js:481-491` 与现存文件不可相容（该档全程 < 474 行）⇒ 判为陈旧坐标（写时口径差 / 更早修订遗留），非现盘事实。

#### 2.10.8 #11 / #12 / #13 / #14（🔵）

**(#11) 计数口径定于一**：§2.0:39 与 §2.9:356 的「VSC→CLI 12 项 · CLI→VSC 2 项族」收正为 **VSC→CLI 11 子项 · CLI→VSC 3 子项**；口径声明 = **子项**（非项族），清单 = §2.10.2(a)（VSC 11）与 §2.5:292 点名（CLI 3 = `M5` · `X8` · `X9`）。

**(#12) M3 四要素编号收正**：§2.1 M3 段的四要素 = ① 面判定 / ② 修法 / **③ 可机检验收 = 现场确认路径三段**（探针 A 机跑 + 探针 B 现场读数 + 判定规则 —— 即该段「现场确认路径」块）/ ④ 边界；§2.9:353「每项四要素」表述随之成立（编号面零缺）。

**(#13) X5 falsy 边界记录（`(r || "")` → `String(r ?? "")` 的差值）**：falsy 非串结果（`0` / `false`）的文本由**空**变 `0` / `false`（`null` / `undefined` 不变 ⇒ 空）；与 M3 归一先例同取向（对象/非串不做静默丢弃）。
**断言补一行（并入 X5 档）**：`onToolResult(name, 0, id)` ⇒ 载荷 `text === "0"` ∧ `truncated === false`（记录形 —— 非缺陷面）。

**(#14) M2 补跨端对拍断言**：断言面由「定义式同义反复」改为**跨端同式对拍** —— 同一 `history` 夹具 ⇒ VSC `ctxPercentForHistory(history, p)` 值 === `docs` 侧 CLI 现盘公式逐字复算值（分子 = 核 `estimateTokens(history)`；分母 = 核 `providerSpec(p).context`；式 = `Math.round(分子 / 分母 * 100)`）。
**已知限制（登记）**：CLI 侧该式为 `thincoder-cli/src/tui/render-frame.mjs:388-389` 的**内联式**（无独立导出可直驱）⇒ 对拍以逐字复算承载；两端同源 = 分子 / 分母均为核同源导出（VSC 侧经 `thincoder-vscode/src/specs.mjs` 引入）。

#### 2.10.9 #15 / #16 + 本席新发现

**(#15) §1 状态行翻转 = 主 agent 写域（上报，本席不越权落笔）**：发现所指两处 = §1 状态行「🔄 进行中（设计轮待发）」与 §1.4「待讨论 → 待设计」；一段一作者（§2.0 承接面）⇒ 本席只报不改。
**建议文本（供主 agent）**：状态行 →「🔄 设计评审中（轮次 1 已开）/ 修正轮 1 已落」；§1.4 →「待设计 → 设计中（评审中）」。台账侧（#124 / #125 / #126 的 待设计 → 在途）同属主 agent 写域。

**(#16) X10 能力面归属登记**：X10 甲案实质 = sync 子代理**中止能力**新增（宿主读核 registry + ⏹ 路由 + 块 meta 字段），**非纯显示面** ⇒ 归属登记：
① 能力面本体 = 核 `_syncChildAborts` registry 的**只读消费**（禁第二套 registry —— §2.7 边界）；
② 若现场判定「读不到」⇒ 降级 ⇒ 本子项交付 = **登记 + 文案告知**（显示面不做控制面承诺）；
③ 若需核面改动（registry 只读面暴露）⇒ **出批上抛**（核面结构改动 = 跨批归属，非本批写域）。

**附 —— 本席新发现（非 16 条内 · 随 #7 同族）**：M4 放宽起跑门与 `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.27.12.12 ⑥ 边界（「ask-only 轮不引入 digest 可见面」——代码侧同句注释 = `thincoder-vscode/src/extension/suspension.mjs:300-301`）**相抵** ⇒ 处置：批 4 落点加该档该节一行（射程由「两档」扩为「两档 + 该节边界句」）；批 2 同轮收正 `suspension.mjs:300-301` 注释（实现面，随该档触碰）。
**非阻塞观察（不在本批）**：§2.6 行 2 的现盘锚 `test/context-parity.test.mjs` 实为**注入面 / 顺序面**族（非上下文占比族）——锚可跑但主题不同族，建议实现轮换锚或降级为「同包可跑证」。

#### 2.10.10 机检读写（D3 · 写入前后）

**命令**：`cd /d D:\teamcode\thincoder && node scripts/doc-check.mjs --root .`

| 时点 | 悬空 | 行宽 | 说明 |
|---|---|---|---|
| 写入前（本会话基线） | **1** | 0 | 1 条 = `docs/core/design/MODEL-SPECS.md:380`（符号 `none`——非本席写域） |
| 写入后（复跑） | 3 | 0 | 增 2 条：`docs/core/design/ARCHITECTURE.md:93`（路径/坐标）· `docs/core/design/DOC-DISCIPLINE.md:512`（路径/坐标）——**均非本席写域** |

- **净增判定 = 0**：本席写入面 = 本档 §2.10 + `docs/vsc/design/WEBVIEW.md`。① 本档在机检声明面**被排除**（`thincoder-core/manifest` 的 `checkConfig.anchors.exclude` 含 `batches`）⇒ 不产锚行；② `docs/vsc/design/WEBVIEW.md` 写入后 ✗ 行集与写入前**全同**（0 新增）。
- **并行会话在途证据（增 2 条之归属）**：两轮之间 `docs/core/design/DOC-DISCIPLINE.md` 多处行号漂移 +3、`docs/core/design/MEMORY.md` +1、`docs/core/design/WORKSPACE.md` +1；且 `docs/core/design/ARCHITECTURE.md:93` 行标记由「迁移期引文（列报）」降为**闸态** ⇒ 该 2 条 = 他会话在途档，非本附录产物。
- **行宽（本档自身）**：§2.10 有 2 行 > 300 字符（§2.10.2(c) 引文段 · §2.10.7 坐标收正条）——append-only 约束下未回改，**登记**（如需收正 = 父侧裁：追加式收正或声明面登记）。

### 2.11 批 4 —— 两档条款落笔（initial · 2026-09-20 · eng-designer）

**任务书** = §2.4 / §2.5 批 4 行 + §2.10.2(b) 点名表 + §2.10.3 落地闸 + §4 ③（含第三档边界句 + WRAPPER 登记行）· **前置**：批 1 / 批 3 已落地（§5.6 / §5.1）· **批 2 在飞**（见「时点口径」）。

**落笔面（4 档 · 本席执行）**

| 档 | 落笔内容 | 子项 |
|---|---|---|
| `docs/vsc/design/WEBVIEW.md` | §3 文件表 +`tool-summary.js` 叶 + 坐标收正（`chat.js:423` · `streaming.js:244`）；§4.3 摘要族单源条 + 失败面摘要字面收正 + `BASH_MARKER` 登记行（新坐标 / 新触发）；新增 **§4.5**（结算与清扫 / 对象 chunk 归一 / 轮次标签 / 截断标记）· **§4.6**（context 单口径）；§5.1 消化轮起跑档位；§5.2 frozen 行 / ⏹ 行收正 + §5.3 ⏹ 判据句收正；§6 增 D-W32–D-W40 · §8 增 U-W13–U-W19 · §10 增行 13–15 · 变更记录 1 条 | M1 M2 M3 M4 X2 X3 X5 X6 X7 X10 X11（11/11） |
| `docs/cli/design/TUI.md` | §6.8 冻结头**图标三态互斥**（`⏸` / `⏹` / `✓`）；新增 **§4.3**（provider 失败面：脱敏首行 + 诊断两行 + Retry 询问）· **§6.9**（消化轮可见面：起跑三档 + 收尾行）；变更记录 1 条 | M5 X8 X9（3/3） |
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` | §6.27.12.12 ⑥ 边界首条改写为 **webview digest 可见面现态**（ask-only 轮亦 post `tier:"ask"` 起跑消息——建标签行、不建计数元素）+ 变更记录 1 条（§2.10.9 附第三档落点） | M4 连带 |
| `docs/cli/design/TUI-SESSION-VIEW.md` | §4 第 4 条错误行按批 3 实现面收正（单行 → 三件形：脱敏首行 + 诊断两行 + Retry 询问；面细节挂 `TUI.md` §4.3）+ 变更记录 1 条 | X8 连带（发现项 · 随轮收正） |

**点名条款行收正（§2.10.2(b) 三行 + 批 1 上抛 §5.12 两项）**：`WEBVIEW.md` §5.2 frozen 行（注记承面 → error / done / stopped / abort 四态，载体 = `meta.note` 单字段）· §5.2 ⏹ 行（门控加 `syncLive` 支）· §5.3 ⏹ 判据句（判据扩支；「不变」句**已删**）· §4.3 失败面摘要字面（`bash: ` 前缀形）· §4.3 `WRAPPER` 登记行（改 `tool-summary.js` `BASH_MARKER` + 新触发）。

**落地闸自查读数（§2.10.3 行 18）**

- **逐子项 token 在位**（判据加强：**条款面命中**，非仅全档 `includes`）：`WEBVIEW.md` 11/11 · `TUI.md` 3/3——逐 token 的命中行均含条款面行（非变更记录独有；R1 所提弱判别力由本读数补强）。
- **机检**：`node scripts/doc-check.mjs --root .` —— 写入前 = 悬空 **0** · 行宽 **0** · exit 0；写入后 = 悬空 **0** · 行宽 **0** · exit 0 ⇒ **净增 0** ✓（写入中途 5 行 >300 字符已当场拆行并复跑清零）。
- **与批 1 / 批 3 实施记录零相抵**：逐条对读一致（`done` 唯一写点 / 清扫恒执行 / 摘要叶字面 / 旗标驱动 / 轮次标签 / 图标三态 / X8 三件形 / X9 起跑数口径）；数值口径按实读（`streaming.js` 260 · `ui.js` 475 · `chat.js` 423 · `panel-callbacks.mjs` 295 · `specs.mjs` 78 · `tool-summary.js` 122 · `render-segments.mjs` 170 · `agent-turn.mjs` 367 · `suspension-drive.mjs` 324）。
- **条款面形态纪律**：失效表达一律**删除**（「不变」句 / 「不引入 `n = 0`」句 / 旧字面例 / 旧坐标 / 旧正则名——用户 2026-09-18 裁定）；变更记录 = 逐档 1 条（记变更点，不堆流水）。

**时点口径（如实登记）**：批 2（M4 / X6 / X10 / X11）在飞 ⇒ 四子项条款按其设计落笔，坐标以函数 / 字段名为锚（不写不可核的行号）；批 2 落地后若行为 / 坐标有偏差 ⇒ 收口轮按实现重出。

**未落面 / 上抛（父侧裁定面）**

1. **`WEBVIEW-PROTOCOL.md` 未落笔（非本批写域，只实核）**：§12 / §13 坐标列重出（§2.10.6 #8 真义务）须待 6 处载荷扩字段改动点全落地（批 2 在飞）⇒ 建议落点 = 批 2 收口轮或另派批；同档 **§5**（digest 元素契约 · M4）· **§6.1**（context 段口径 · M2——现句「本端 pct 源 = 实 prompt tokens」已过期）· **§6.3**（i18n 键表 +2 键 · M4）三处待同轮收正。
2. **需求面（父侧笔，只登记）**：`docs/vsc/requirements/WEBVIEW.md` F-A4 边界半句（⏹ 判据——随 X10 收正）· F-W4「末行摘要 ≤80」vs 现 100 切片（`:23`）。
3. **机械句取代**：§2.2:153「恢复卡…同读同一 `resultSummary` 族」由批 1 实测取代（= 宿主切片点立旗 + 恢复卡旗标驱动）——本附录为准（原行不重写）；§2.4 预测值偏小 = 按 §5.1 / §5.6 实读为准，不逐格重出。
4. **同族发现（随轮收正 · 越点名清单）**：`docs/cli/design/TUI-SESSION-VIEW.md:74`「其他错误 → `[error] …` 一行」与批 3 X8 实现相抵（一致性面）⇒ 本轮按实现收正并记 1 条变更；若父侧判越权 ⇒ 该档 2 行可单点 revert。

### 2.12 批 4 收口轮 —— 协议档三处 + 两表坐标重出 + 设计档漂移收正（initial · 2026-09-20 · eng-designer）

**任务书** = §2.11「未落面 ①」（= 父侧所称「批 4 上抛」面：`WEBVIEW-PROTOCOL.md` 三处待落 + §12 / §13 坐标重出）+ §2.10.6 #8 真义务 + §5 批 1 / 批 2 / 批 3 实施记录 + 批 2 上抛「设计档漂移」面 · **写域** = 设计档（`docs/vsc/design/WEBVIEW-PROTOCOL.md` · `docs/vsc/design/WEBVIEW.md` · `docs/core/design/{ARCHITECTURE,AGENT-LOOP,CORE-UNIFICATION,TURN-CAP-CONTINUE,AGENT-LOOP-SUBAGENT}.md`）· **凭现盘**（批 2 落地后实读；本席逐处实读，坐标均带 `file:line`）。

**落笔表（7 档 · 逐档 1 条变更记录）**

| 档 | 落笔内容 | 子项 |
|---|---|---|
| `docs/vsc/design/WEBVIEW-PROTOCOL.md` | §5 digest 元素级契约（`tier` 三档 + ask 轮零计数元素 + end 零动作）· §6.1 context 段单口径 · §6.2 块头字段对位收正 · §6.3 键表 18 键 · **§12 / §13 ② ③ 列全表重出** + 头注收敛为一条 as-of 行 · §3.2 登记十三项 · §7 D-P11 计数同改 | M1 / M2 / M3 / M4 / X2 / X5 / X6 / X10 / X11 契约面 |
| `docs/vsc/design/WEBVIEW.md` | §3 文件表坐标收正（`chat.js:426` · `activity-view.js` 四坐标）· §5.3 痕迹面行 + D-W22 行数 434 → **450** · 六档实读行数入变更记录 | 批 1 / 批 2 漂移 |
| `docs/core/design/ARCHITECTURE.md` | §3 核模块地图 `agent/` 行补 `child-marks.mjs` | 新叶入档 |
| `docs/core/design/AGENT-LOOP.md` | §1 归属行 + §6.1 模块地图补 `child-marks.mjs` 行 | 新叶入档 |
| `docs/core/design/CORE-UNIFICATION.md` | §2.8.1 主表补行 15（`agent/child-marks.mjs` = **24** 行）+ 覆盖口径 14 → **15 档**（D3） | 新叶入档 |
| `docs/core/design/TURN-CAP-CONTINUE.md` | §1 #3 + §3.1 `TURN_CAP_MARK` **常量单源指针**收正（定义已下沉零依赖叶） | 批 2 漂移 |
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` | §6.7.2「VSC 同步 spawn 块无 ⏹」句按 **X10 现态**收正 + `STOPPED_MARK` 定义指针收正 | 批 2 漂移 |

**读数**

- **三处条款落点**：§5 = 元素级落点 `webview/chat.js:368-418`（`showDigestStatus`）+ 载荷 `tier`（`suspension.mjs:320-321` · 收尾 `:333` · cap `panel-callbacks.mjs:84`）；
  §6.1 = 分子核 `estimateTokens(history)`（派生单点 `src/specs.mjs:79-83` · 消费 `panel-callbacks.mjs:192`）；§6.3 = **18 键**（逐键核「核容器 / 本地档」定义位与消费位）。
- **§12 / §13 对表读数**：② ③ 列逐行 = `node test/protocol-coverage{,-reverse}.test.mjs --emit` 输出（§12 = 51 行 · §13 = 50 行）；六字段逐字段落点：
  X2 `panel-callbacks.mjs:199` → `chat.js:140` · X5 `:215` → `chat.js:149` · M4 `suspension.mjs:321` → `chat.js:257` · X6 `panel-subagent-relay.mjs:204/:240` · X10 `panel-subagent-relay.mjs:103` + `suspension.mjs:153` · X11 `suspension.mjs:429` → `panels.js:109`。
- **漂移收正读数（六档 · 口径 = `wc -l` / 含末行 · as-of 2026-09-20 收口轮实读）**：`panel-callbacks.mjs` **309** · `activity.js` **450** · `chat.js` **426** · `suspension.mjs` **430** · `panel-subagent-relay.mjs` **257** · `panel-messages-turn.mjs` **215**；新叶 `child-marks.mjs` **24**。
- **机检净增**：`cd /d D:\teamcode\thincoder && node scripts/doc-check.mjs --root .` ⇒ **`OK(锚): 0 条悬空`** · 行宽 **2**（均在 `docs/core/requirements/AGENT-LOOP.md:163` / `:167`——需求档 = 父侧笔，非本席产物）⇒ 本席写入面 **悬空 0 · 行宽 0（净增 0 ✓）**。
  写入中途曾出现 3 条悬空（重出表短形路径触同名多解：`suspension.mjs` / `settings.mjs` / `ledger-surface.mjs`）——已按本档既有「重名档持全限定路径」约定收正并复跑清零。
- **对表机检**：`cd /d D:\teamcode\thincoder\thincoder-vscode && node --test test/protocol-coverage.test.mjs test/protocol-coverage-reverse.test.mjs` ⇒ **7/7 pass**（首列判别式集 / ④ 处置列零变——扩字段不触该集）。
- **与 §5 零相抵**：批 1（§5.6–§5.12）· 批 2（§5.13–§5.18）· 批 3（§5.1–§5.5）逐条对读一致（M1 清扫恒执行 / M2 分子核估算 / M3 端边界归一 / X2 标签字面 / X3·X7 摘要叶 / X5 旗标驱动 / M4 三档 / X6 注记载体 / X10 门控与路由 / X11 中止注记 / M5 三态 / X8 三件形 / X9 起跑数）。

**发现与不一致（逐条 · 含非阻塞）**

1. **任务书读数与实读差**（三处）：`activity.js` 449 → **450** · `suspension.mjs` 431 → **430** · `child-marks.mjs` 25 → **24**（口径 = `wc -l` / 含末行；本席实读为准——`activity.js` 尾行 `}` / `suspension.mjs` 尾行 `}` 已核）。
2. **§6.3 死键**：`status.indexEmbed` 全仓零定义（W8 起退场）⇒ 行**删除**（失效表达不留规范面）；`status.indexProgress`（消费 = `webview/status-bar.js:98` · 本地档在册）缺行 ⇒ 补入（D3：14 → 18 键）。
3. **§6.3 越父侧清单补键**：`digest.turnLabelAsk` / `digest.turnLabelAuto`（M4 落 · **核容器键** · `chat.js:375` 消费）在父侧点名（仅 `tool.interrupted` / `tool.truncated`）之外 ⇒ 按「键表 = webview 可渲染键」口径一并补入。
4. **§3.2 登记缺行**：六处载荷扩字段未入 §3.2 ⇒ 补行 9–13（八项 → **十三项**）+ §7 D-P11 计数同改（D3）——超出父侧三处点名的枚举一致性面，逐条证据 = 代码实读坐标。
5. **§6.2 相抵收正**：CLI icon 集补 `⏹`（M5——`render-segments.mjs:91`）+ 冻结头 `— <note>` 两端同形（X6 / X11）+ 本端坐标重出（`activity-view.js:55/:90/:91/:102/:69`）。
6. **`AGENT-LOOP-SUBAGENT.md` §6.7.2 相抵**：「VSC 同步 spawn 块无 ⏹」与 X10 现态（判据 / 门控 / 路由已落）相抵 ⇒ 按现态收正并引降级登记（`WEBVIEW.md` §5.2 + §5.18-1）；产者侧序缺陷口径零改。
7. **`panel-callbacks.mjs` 新越 300 咨询线**（承 §5.18-3 上抛）：**309** 行 > 300 建议线（批 1 后越线）——**拆分复核 = 不动**：该档 = 回调装配单职责（onX 桥接面），批 1 / 批 2 增量 = 既有回调内字段 / 归一（非新族），距 500 硬限 191 行；复核触发 = 回调族新增或 > 400。
8. **产品寄存器未登记**（**禁改动面**——父侧裁定面）：`thincoder-vscode/AGENTS.md`「Webview ↔ Extension Message Protocol」（本档头注声明的 byte 级寄存器）未见六处新字段（`round` / `model` / `truncated` / `tier` / `note` / `syncLive` / `interrupted`）⇒ 产品文本面 ≠ 本席写域，登记待裁。
9. **需求档行宽 2 行**（父侧笔）：`docs/core/requirements/AGENT-LOOP.md:163`（373 字符）/ `:167`（332 字符）⇒ `doc-check` 行宽 FAIL（非本席产物；本席写入面 0 行宽）。
10. **本档其余节坐标未 sweep**（非阻塞）：`WEBVIEW-PROTOCOL.md` §1–§4 叙述节坐标 as-of 2026-09-15/16（父侧点名面 = 三处 + 两表；如需全档 sweep 请另派轮）。
11. **`specs.mjs` 实测 83 行**（§5.6 记 78）——差 5 行来源 = 批 1 之后的他会话改动（未入点名六档，本席不擅自收正；登记）。
12. **批档旧数与实读差**（承 §5.5-5 / §5.12-3 / §5.18-4）：§2.4 / §2.10.4 行数估值与实读差——本附录（§2.12）按实读收正；原行不重写（append-only）。

**上抛（父侧裁定面）**：第 8 条（产品寄存器登记与否）· 第 9 条（需求档两行行宽）· 第 10 条（全档坐标 sweep 与否）。
**零触碰声明**：产品码 · 需求档 · §3 / §4 / §5 他人段 · 他批写域（`scripts/**` · 两产品 `AGENTS.md`）零触碰；本附录 = 设计档面收口轮，零新语义（逐条均可回溯至 §2.11 任务面 + §5 实施记录或代码实读）。

**同轮追加落点（§2.12 补记 · 均属本轮设计档写域）**

- `WEBVIEW-PROTOCOL.md` §3 消息族行补**增字段**注记（`toolCall` / `toolResult` · `digest` · `subagent` · `suspension`——与 §3.2 行 9–13 同源；承 §3 既有「**增字段**」注记惯例，防「§3 载荷面 ↔ §3.2 登记面」脱节）。
- `TURN-CAP-CONTINUE.md` §3.1 同格坐标 `spawn-child.mjs:218` → **`:213`**（`runWithContinue` 实位——批 2 下沉后位移；`wc -l` 实读 2026-09-20）。
- **报告面（本席不落笔 · 登记）**：`webview/ui.js` 现读 **475** 行（`WEBVIEW.md` D-W13 载 473 = 决策记录 as-of 值，父侧 §2.10.7 当日刻意定基——不改）· `src/specs.mjs` 现读 **83** 行（§5.6 载 78 = 批 1 后读数，其后另有他会话改动——不属点名六档，不擅自收正）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

评审面 = 批档 §1–§2 全段 + `docs/vsc/design/WEBVIEW.md`（承接面 · §5.2/§5.3 契约焦点）；`docs/cli/design/TUI.md`、`WEBVIEW-PROTOCOL.md`、需求档、产品码不在评审文件面 ⇒ 相关坐标标 unverified。无项目标准档 / 无 document map（未声明）⇒ 文档归属判据按 Project Guide + 本评审判据；discipline 层方法学基线未在上下文 ⇒ 方法学只按批档结构自洽性判。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🔴 | X10 加 ⏹ 门控新支（`meta.syncLive === true`——批档 §2.2:191）与 `WEBVIEW.md:188`「⏹ 覆盖按钮：live + `running` + `pool === true` … 时可见」及 `WEBVIEW.md:214`「⏹ 可见性判据（`running + pool + family`）**不变**（F-A4 边界）」为同机制异述；而 §2.4:283 待落射程作「VSC 面 **8** 子项条款」（VSC 侧实为 11 子项）、§2.5:292 只写「两档条款」，该条款未被点名收正；§2.8（:334-349 · 16 条）无该冲突上报 ⇒ 与 AGENTS.md「Docs conflict → stop and report … Never treat code as the source of truth」相违。同类待点名者：X6 把块头注记承面由 error 扩至 done / stopped（对位 `WEBVIEW.md:185` frozen 行） | 点名列出须收正的既成条款行（§5.2 ⏹ 行 · §5.3 ⏹ 判据句 · §5.2 frozen 行）+ §2.8 增一条该冲突上报（含 F-A4 需求面影响）；或本批 X10 只留登记、不取甲案 |
| 2 | Methodology / Document ownership | 🟡 | 14 子项条款整体未落（§2.5:298 · §2.8:344 #11），而 §2.6（17 行）无「条款已落」验收行——行 17 只查锚/行宽机械净增，落或不落皆绿 ⇒ 未落无落地闸；同档既成做法是带「本批落 / 拟新增」标记同轮落（`WEBVIEW.md:173` · `:261` · `:348`）⇒ 「先落会把改动后形态写成现盘事实」的理据与既成做法不合 | 在 §2.6 增一条验收行（两档内 14 子项条款逐项在位 + 锚无悬空）；或改按既成做法带「本批落」标记落条款（首注给 as-of） |
| 3 | Affected-file size annotations | 🟡 | 越 300 咨询线的受影响档只给 ≤500 算术、无 >300 拆分复核：`suspension.mjs` 407→417 · `chat.js` 411→423 · `activity.js` 434→440（§2.4:251-259）· `agent-turn.mjs` 343→361 · `suspension-drive.mjs` 316→322（§2.4:276-279）；§2.3:213 更以「皆 ≤500 ⇒ 不触拆分线」代替复核 | 逐档补「拆分复核 = 不动（含理由）」或拆分计划行 |
| 4 | Clarity | 🟡 | X10 的 webview 侧 `meta.syncLive` **写点未列**：§2.4:253 的 `activity.js` 行只挂 X6 · X11，而门控读点 `activity-view.js:132-140`（§2.2:191）依赖块 meta 已载该字段 | 点明 `meta.syncLive` 的 webview 写入点（档 + 行）并计入该档行数 |
| 5 | Scope | 🟡 | §1.2:21 把「图标语汇 · 文案分档」列为已裁决不动端差，而 M5 恰改 CLI 冻结头图标（✓→⏹——§2.1:106）、M4 恰把 VSC digest 文案分档对齐 CLI 三档（§2.1:94）⇒ 设计未划射程，实现轮无法判定是否越禁改动面 | 在 §2.1 M4 / M5 或 §2.7 明确「图标语汇 / 文案分档」已裁决族的射程边界 |
| 6 | Acceptance criteria | 🟡 | M1 断言只覆盖 `finish(true)`（中止形——§2.1:59）；「正常完成时 ref 全 `done` ⇒ 零动作」（§2.1:55）无坐标证据，未结算卡 + 正常收尾路径零断言 ⇒ 误标 interrupted 不可判 | 补 `finish(false)` + 未结算卡判据，或给「收尾前恒有 `toolResult`」的时序证据 |
| 7 | Acceptance criteria | 🟡 | M4 把宿主起跑判据由 `pendingN > 0` 放宽为「起跑即发（`n` 可 0）」（§2.1:95），既有消费者 `S._digestBoundary` / 消化回收（`WEBVIEW.md:150` · `:159`）未判；§2.1:96 关联面只列 `.digest-cap` 与协议测试 | 补 `n = 0` 起跑对轮边界 / 回收路径影响的判据（或零影响证据） |
| 8 | Consistency | 🟡 | 载荷扩字段 / 协议面射程三处不一致：§2.4:283 记「M2/X2/X5/X6」随同轮核，§2.6:313 行 10 与 §2.8:343 #10 只列「M4 · X6」；且 M2 无载荷扩字段、M4 有 | 定于一表（X2 `round`/`model` · X5 `truncated` · M4 `tier` · X6 `note`），并据此定协议机检复跑行 |
| 9 | Coordination | 🟡 | `WEBVIEW.md:124` 登记「`ui.js:277` WRAPPER = 状态位族第二份枚举，消解 = 并入判据单源，随 `ui.js` 下次触碰」，本批 M1/X2/X5 触碰 `ui.js`（§2.1:52 · :123 · :150）且 X3 把含 `:277` 的 `resultSummary` 整段迁出（§2.1:135）⇒ 触发条件成立，设计未安排亦未再登记 | 在 §2.8 补一条（本批不并 + 理由 + 新触发条件），或随迁移同轮并入判据单源 |
| 10 | Affected-file size annotations | 🟡 | 行数读数互不合：§2.4:249 与 §2.2:115 记 `ui.js` **473** 行，而 `WEBVIEW.md:340` 引 `ui.js:481-491`（同档 `:369` 记 474 行）；`chat.js` 亦 §2.4:251（411 行）vs `WEBVIEW.md:43`（`:413`）/ `:227`（`:411`）⇒ ui.js 真实行数不可裁定，而「净增 ≤ +10 否则触 500」门以该数为基（本条读数标 unverified） | 以一次实读收口两处读数与坐标（含 as-of），再定该门 |
| 11 | Consistency | 🔵 | §2.0:39 / §2.9:356 记「VSC→CLI 12 项 · CLI→VSC 2 项族」，逐项面判定为 CLI→VSC 3 子项（M5 §2.1:105 · X8 §2.2:217 · X9 §2.3:231） | 统一计数口径（子项 / 项族）并改数 |
| 12 | Clarity | 🔵 | §2.9:353 自称「每项四要素：面判定 / 修法 / 可机检验收 / 边界」，M3（§2.1:75-87）无独立「③ 可机检验收」标题（机检内容并入现场确认路径 1） | M3 补 ③ 标题，或松 §2.9 表述 |
| 13 | Feasibility | 🔵 | X5 把 `(r \|\| "")` 改为 `String(r ?? "")`（§2.1:149）⇒ falsy 非串结果（`0` / `false` / 空串）文本由空变 `0` / `false`；断言只覆盖 64K / 65K 两界（§2.1:156） | 在边界或断言记录该差值，或限定 `typeof r === "string"` |
| 14 | Acceptance criteria | 🔵 | M2 ③ 断言（§2.1:72）为定义式同义反复（值 === 自身公式），不构成「两端同一标签同值」证据；跨端面只靠共享核函数 | 补一条对 CLI 侧同 history 可见读数的对拍，或两端 history 同形断言 |
| 15 | Methodology | 🔵 | §1 状态行「🔄 进行中（设计轮待发）」（:8）与 §1.4「待讨论 → 待设计」（:31）未随 §2 交付翻转 | 翻转状态行 / 台账（设计 → 评审中） |
| 16 | Scope | 🔵 | X10 甲案实质 = sync 子代理中止能力新增（宿主读核 registry + 宿主路由 + 块 meta 新字段），非纯显示面；设计自陈可能降级为登记（§2.2:188-193） | 登记该能力面的跨批归属；若降级则注明本子项交付 = 登记 + 文案告知 |

VERDICT: changes-required
计数：🔴 1 · 🟡 9 · 🔵 6 = 16 条

### 轮次 2（评审子代理）

**轮次 2（复核 · 承评审 id=20〔changes-required〕+ 修正轮 id=24）**

评审面 = 批档 §1 / §2 / §2.10 全段 + `docs/vsc/design/WEBVIEW.md`（承接面 · §5.2/§5.3 焦点）。方法 = 对 §3 轮次 1 的 16 条逐号复核落位（本轮 fresh read；行号/坐标按本轮读数为准）。`docs/cli/design/TUI.md` · 需求档 · 产品码 · `scripts/**` 不在评审文件面 ⇒ 相关坐标 unverified。

**一、16/16 逐号落位**

| 原# | 级 | 判定 | 本轮证据 |
|---|---|---|---|
| 1 | 🔴 | 落 | §2.10.2 = 点名三行（`WEBVIEW.md:185` / `:188` / `:214` 本轮逐字在位）+ 冲突上报「§2.8 追加第 17 条」（含 F-A4 需求面 + 降级联动）+ 计数收正「VSC 面 11 子项」（§2.10.2(a)） |
| 2 | 🟡 | 落（残余见二·R1） | §2.10.3 = §2.6 追加行 18（doc-check + 两档 token 扫描 + 标记约定） |
| 3 | 🟡 | 落 | §2.10.4 五档拆分复核＝不动（逐档理由 + 复核触发） |
| 4 | 🟡 | 落 | §2.10.5（#4）：写点 `activity.js:303-313` · 基座 `:83-92` · 读点 `activity-view.js:132-140` · 产者 `panel-subagent-relay.mjs:67-70` + 行数计入 |
| 5 | 🟡 | 落 | §2.10.5（#5）：越禁判据（改登记映射行＝越禁／补缺面＝射程内）+ M5 判据单源（`render-segments.mjs` 单点 · `subagent-panel.mjs` 零改） |
| 6 | 🟡 | 落 | §2.10.5（#6）：清扫恒执行 + 新增 `finish(false)`+未结算卡断言 + 原「ref 全 done」句不作断言依据 |
| 7 | 🟡 | 落 | §2.10.6（#7）：写点/消费面/零影响证据 + end 幻影计数行（`dataset.n="?"`）约束 + 断言 |
| 8 | 🟡 | 落 | §2.10.6（#8）：六行唯一表（X2 · X5 · M4 · X6 · X10 · X11）+ 三处射程收正 + 复跑判据 |
| 9 | 🟡 | 落 | §2.10.6（#9）：WRAPPER 不并三理由 + 新触发 + 批 4 坐标改叶 |
| 10 | 🟡 | 落（已实测） | §2.10.7 一次实读收口（`ui.js` 473 · `chat.js` 411 · …）；`WEBVIEW.md` 本轮实测在位：`:31`／`:340` `ui.js:442-445`、`:340` `ui.js:466-470`·`activity.js:107`·`streaming.js:63`、`:43` `chat.js:411`、`:369` D-W13 473 + as-of、`:470-475` 变更记录行 |
| 11 | 🔵 | 落 | §2.10.8（#11）：口径 11/3 定于一（子项） |
| 12 | 🔵 | 落 | §2.10.8（#12）：M3 ③ ＝「现场确认路径三段」（声明式映射） |
| 13 | 🔵 | 落 | §2.10.8（#13）：falsy 差值记录 + `text === "0" ∧ truncated === false` 断言 |
| 14 | 🔵 | 落 | §2.10.8（#14）：跨端逐字复算对拍 + 限制登记（CLI 内联式无独立导出） |
| 15 | 🔵 | 落（已实测） | 批档 `:8` 状态行（…修正轮 id=24 **16/16 已落** → **复核中**）+ `:31`「待设计 → **在途**」 |
| 16 | 🔵 | 落 | §2.10.9（#16）：X10 能力面归属登记（只读消费／降级＝登记+告知／核面改动出批上抛） |

**二、残余与新见（3 条 · 均不阻塞；无 🔴）**

| # | Orig# | 档 | 级 | 说明 |
|---|---|---|---|---|
| R1 | 2 | 批档 §2.10.3 + `WEBVIEW.md:475` | 🟡 | 落地闸判别力不足：闸码 = token `includes` 全档扫描，而修正轮自身写入的 `WEBVIEW.md:475` 变更记录行已含全 11 token ⇒ 闸当下即绿（与 `:420`「禁只写在变更记录」约定相抵）；射程不含附新发现的第三档（`AGENTS-LOOP-SUBAGENT.md` §6.27.12.12 ⑥——见 §2.10.9 附）；期望读数「悬空 0」（`:419`）与 §2.10.10 复跑 3（他档漂移）的口径差未在闸行内说明 |
| R2 | (new) | 批档 `:431` vs `:446`（+ `:372`） | 🔵 | `activity.js` 行数两说（附录内互斥、无外优先可解）：`434 → 440`／「本批 +6 在其迁出前」 vs 「`activity.js` 434 → **+8**（X6 · X11 · X10 各 1–2 行 + 基座 1）」 |
| R3 | (new) | 批档 `:283` / `:355` / `:277` / `:258` | 🔵 | 旧数未逐处收正（均以「以本附录为准」可解，未标「§2.4/§2.9 行修」）：`:283`「CLI 面 5 子项条款」（CLI 实为 3——同轮只点名了同行的 VSC「8」）· `:355`「（17 行）」与「VSC 面 8 子项」· `:277` `subagent-panel.mjs`「±1」vs `:454`「零改」· `:258` relay「+4（219）」vs `:446`「+4~6」 |

VERDICT: pass
计数：🔴 0 · 🟡 1 · 🔵 2 = 3 条残余；原 16 条 = 16/16 落（其中 #10 / #15 已对盘实测）。

## §4 用户批准（主 agent）

**2026-09-20 05:11 父侧代签**——依据用户 04:22「**端差 p1/2/3 都要处理**」（评审点火权 + §4 批准权委托父侧，自缚三条件）。

**三条件核验**：① 评审 **pass（0 🔴）**（复核轮 id=25：16/16 逐号落位复核全通过；残余 1🟡 2🔵 全接受、均不阻塞）；② **修正轮（id=24）16/16 落地**（含原 🔴 = X10 条款冲突点名〔`WEBVIEW.md:185`/`:188`/`:214`〕+ §2.8 第 17 条上报〔含 F-A4 需求面〕+ 计数收正 8→11）；③ **token 已签发**（值不落档——运行时凭证）。

**响应表（轮 1 · 16 条）**：Fixed = #1–#16 全落；残余 R1（🟡 · 批 4 落地闸判别力：`WEBVIEW.md:475` 变更记录行即含全 11 token）+ R2/R3（🔵 · `activity.js` 行数两说 + 旧数未逐处收正）**一律接受、不阻塞**（在册 §3 轮次 2）。

**批准范围**：① **设计定稿**（批档 §1–§2 + §2.10 附录 + `WEBVIEW.md` 承接面）；② **实施 = 三组**：批 1（VSC 工具卡/摘要/状态行：M1·M2·M3·X2·X3·X5·X7——与一致性批 1-A 共享 `locales/*` ⇒ 调度器已自动串行）· 批 2（VSC 活动块/协议面：M4·X6·X10·X11 + 核 `i18n.mjs`）· 批 3（CLI：M5·X8·X9 = **running**）；③ **批 4 = 两档条款落笔**（设计席 · 须在批 1–3 落地后；含附录新发现第三档 `AGENT-LOOP-SUBAGENT.md` §6.27.12.12 ⑥ 边界句 + WRAPPER 登记行）；④ **父侧笔**：需求档 F-A4 半句收正（`docs/vsc/requirements/WEBVIEW.md:53`）。

**收口预告**：三组落定 → 跑 §2.6 判据链 + 批 4 落地闸（行 18）→ 收口（§6）+ 核销 #124 / #125 / #126 + 提交 + push。

## §5 实施记录（eng-coder）

**轮次**：initial · **作者**：eng-coder · **日期**：2026-09-20 · **任务书** = 本档 §2（§2.1 M5 · §2.3 X8/X9）+ §2.6 判据链 + §2.10 附录 · **写域** = §2.5 批 3（CLI 产品码）· **先红后绿**（每子项先落测试档跑红，再实现转绿）

### 5.1 改动清单（file → 落点 → Δ · 行数 = 实读含末行）

| 档 | 落点 | Δ | 子项 |
|---|---|---|---|
| `thincoder-cli/src/tui/render-segments.mjs` | `frozenSubTaskLines` 图标行（`:91`：`const icon = sub.approval ? "⏸" : sub.stopped ? "⏹" : "✓"`，verb 行零改） | 168 → 170（+2） | M5 |
| `thincoder-cli/src/tui/agent-turn.mjs` | ① `PROVIDER_URL_RE` 常量（`:33`）② `runAgentTurn` 终态外化（`:65`：`return carrier.result ?? "ok"`——X9 判定载体）③ provider 失败分支（`:225-247`：脱敏首行 + `→ Provider` / `→ Model` 两行 + `state.permission`={name:"retry"} 询问 → 同意重建 controller + resume 重入 / 拒绝 break） | 343 → 367（+24） | X8（+X9 载体 2 行） |
| `thincoder-cli/src/tui/suspension-drive.mjs` | ① `t` import（`:28-29`）② `digestTurn` 轮尾可见行（`:185-192`：outcome 接收 + `pushLine(t(outcome==="ok" ? "digest.done" : "digest.aborted", { n: pend0, seconds }), C.dim)`） | 316 → 324（+8） | X9 |
| `thincoder-cli/test/subagent-freeze-icon.test.mjs` | 新增 3 用例（三态互斥 / 注记同帧 / 段缓存不变式） | 新档 61 行 | M5 |
| `thincoder-cli/test/provider-error-surface.test.mjs` | 新增 3 用例（首行脱敏 + 诊断两行 / Retry y·n 双路 / 非 Error 抛出） | 新档 120 行 | X8 |
| `thincoder-cli/test/digest-end-line.test.mjs` | 新增 3 用例（起跑数口径两轮 / 中断 aborted 形 / 起跑标签三档零回归） | 新档 96 行 | X9 |

- **声明外改动（如实披露）**：`agent-turn.mjs` 的 `runAgentTurn` 返回值外化 2 行（X9「失败面 ok=false」的判据来源——设计 §2.3 X9 只写「`:184` 后补可见行」，未指定失败面判据；本席取既有 `_logOutcome` 载具外化，语义零扩）。其余文件零触碰；`subagent-panel.mjs` 零改（见 5.2-③）。
- **行数 vs 设计表**：`agent-turn.mjs` +24（设计记 +18）· `suspension-drive.mjs` +8（设计记 +6）——均 ≤500 硬限；§2.10.4 的 >400 复核触发未到（沿用「不动」裁定，数值收正归父侧/批 4）。
- **净增 0 义务面**：本批**零新增文案键**（X9 用核容器既有 `digest.done` / `digest.aborted`）· 零新增设计档行 · CLI 无测试清单制（`test/run.mjs` 两层 glob 自动收集 + 反查 fail-closed）⇒ §2.8 #12 的登记义务自动消解。

### 5.2 现场判定读数（§2.3 逐条义务）

1. **X8 重入语义（§2.3 X8 ② item 3「现场判定义务」）＝成立**（⇒ 加真 Retry，未降级为「手工重发」）：① provider 抛错不写历史（`thincoder-core/agent.mjs:276-288`——仅 AbortError 分支注 history 后 rethrow）⇒ resume 重跑不携半截 assistant 行；② `flushStream` 清 `state.streaming` / `state.reasoning`（`thincoder-cli/src/tui/tool-events.mjs:82-94`）⇒ 重入不重复推部分输出；③ `resume` = 核既有参数（`agent.mjs:97` 签名 / `:130` prepareRun 透传），与 ContinueError 面（`agent-turn.mjs:222-223`）同法。
2. **脱敏正则单源化（§2.3 X8 ② item 1「不可则双写登记」）**：单源化须动对端写域（VSC `panel-turn-loop.mjs:153` 为同式字面）+ 核域 ⇒ 出本批射程 ⇒ **双写登记（本条即登记落点）**：CLI `agent-turn.mjs:33` ∥ VSC `thincoder-vscode/src/extension/panel-turn-loop.mjs:153`，两式逐字相同 `/https?:\/\/[^\s,)"]+/g`；后续单源化候选 = 核导出（跨批）。
3. **M5 判据两处（§2.10.5 #5）＝单点确认**：`subagent-panel.mjs` 头（`:54`）无 `stopped` 分支且无 verb 面；`⟦ev⟧stopped` 路径（`thincoder-cli/src/tui/subagent-blocks.mjs:263-273`）先置 `done=true` + `stopped=true` 再冻结并摘条目 ⇒ **「stopped 条目在该头可达且 done=true」不成立** ⇒ 另条登记义务自消解 ⇒ 该档零改（与 §2.10.5 #5 裁定一致）。
4. **X9 计数口径 = 起跑数**（承 §2.8 ⑤ 设计取向）：写点唯一 = `pend0`（`suspension-drive.mjs:183`）与 VSC `suspension.mjs:302/:314` 同源；测试以「起跑 2 条 ⇒ 首轮行 2 / 次轮行 1」反证非消费口径（消费口径首轮会得 1）。文案单源 = `@thincoder/core/i18n.mjs` 的 `t()`（CLI 侧首个核 i18n 消费点；秒位 = `toFixed(1)`，与 VSC `chat.js:394-401` 同式）。

### 5.3 判据链读数（§2.6 行 12-15 · 17）

| §2.6 行 | 命令 | 读数 |
|---|---|---|
| 12（M5） | `cd /d D:\teamcode\thincoder\thincoder-cli && node --test test/subagent-freeze-icon.test.mjs` | 修前红 3/3（实读 `▶ [✓ eng-coder#2 · async · glm-5.3 · stopped 12s]` = 相抵本体）→ 修后绿 3/3 |
| 13（X8） | `… && node --test test/provider-error-surface.test.mjs` | 修前红 3/3（实读 `[error] <原文含 https://…>` 多行未脱敏；字符串抛出得 `[error] undefined`）→ 修后绿 3/3 |
| 14（X9） | `… && node --test test/digest-end-line.test.mjs` | 修前红 2/3（实读轮尾零收尾行，仅两条起跑标签）→ 修后绿 3/3 |
| 12/13 现盘锚 | `node --test test/turn-across-segments.test.mjs test/memory-scan-bounds.test.mjs` | 18/18 绿 |
| 15（CLI 包全绿） | `cd /d D:\teamcode\thincoder\thincoder-cli && node test/run.mjs` | **727 tests / 727 pass / 0 fail**（含 9 条新用例；两次复跑同读数） |
| 17（文档机检净增 0） | `cd /d D:\teamcode\thincoder && node scripts/doc-check.mjs --root .` | 悬空 **1**（= `docs/core/design/MODEL-SPECS.md:385` 符号 `none`——本批前既有基线，逐字同前）· 行宽 **0** ⇒ **净增 0** ✓ |

### 5.4 内审 + 代码评审（轮次与终态）

- **内审（explore 只读分歧审计 · 1 轮）**：四类分歧（部分实现 / 静默简化 / 文档漂移 / 声明外越界）**均未成立**；观察项 5 条（O1 消化轮询问无档位分支 / O2 双写登记无落点 / O3 行数差 / O4 测试档近恒真断言 / O5 起跑标签既有重复形态）。
- **代码评审（advisor · 1 轮）**：**VERDICT pass**（🔴 0 · 🟡 3 · 🔵 4）。已采纳并修复 = 评审 #7（测试时限 1s → 3s，只对真实缺陷响应）；其余 🟡/🔵 = 登记/出批上抛（见 5.5）；评审 #1（X8 询问走通用审批框面 + `a` 键 AUTO 副作用）= **设计面继承**（§2.3 明写 `name: "retry"`），本席按设计落，不擅自改判。
- **终态 = clean**（内审 1 轮 + advisor 1 轮；修复后复跑：三档 9/9 绿 · CLI 包 727/727 绿）。

### 5.5 上抛项（父侧裁定面）

1. **X8 询问框面（评审 #1 · 🟡 非阻塞）**：`state.permission` 复用件只对 `name === "continue"` 走 y/n 专用分支（`key-modes.mjs:43/:45`）⇒ retry 框按 `a` 会置 `agent.autoApprove = true`（整会话 AUTO 开）+ 推 AUTO reminder，框面文案 = `render-frame.mjs:354` 的 ` y: approve │ n: deny │ a: approve all (AUTO)`。修法多数落在本批写域之外（key-modes/render-frame）⇒ 请父侧裁：① 与 `continue` 同形（仅 y/n）并同轮收正设计行；② 另开 retry 框分支（另批）；③ 仅把 `a` 键行为纳入用例（记录形）。
2. **X8 原文其余行丢弃（评审 #4 · 🔵）**：`:229-233` 只出脱敏首行 + Provider/Model；多行 detail 不入流、无日志携带（VSC 标尺把 raw 收进 `<details>`）⇒ 属设计取舍，请父侧裁「是否补 dim 细节行 / 日志携原文」。
3. **X8 询问进入消化（auto-turn）轮（评审 #6 · 🔵）**：手动档消化轮按 D-S7 只关 handler，而 retry 询问在 agent-turn 内直建 ⇒ provider 失败落在消化轮时阻塞等输入（有界、可见、判为改善方向）；设计未讨论该交互，登记。
4. **`fSig` 不含 `stopped`（评审 #5 · 🔵）**：`render-segments.mjs:120-124` 段缓存签名未含 `stopped`/`lastError`/`turn`，与本档头注「签名 = 该段输出的所有决定因素」字面相抵；**未找到可达 stale 路径**（冻结前已定 `stopped`；冻结后同 key 事件经 `_frozenSubKeys` 丢弃）⇒ 登记为显式不变式（冻结后 sub 不可变），非现缺陷。
5. **批档数值收正（评审 #3 · 🟡 登记）**：§2.4 两档行数估值与实读不符（见 5.1）⇒ 建议父侧/批 4 按实读收正（本席不越权改设计档）。
6. **`thincoder-cli/AGENTS.md` 工作区改动非本席产物**：审计面内该档 `M` 标记（docs/core 路径改制句等）在本次 spawn 前已存在 ⇒ 非本批写域、非本席改动，收口引用时勿计入本批（需 git 面确认）。

**轮次**：initial（批 1）· **作者**：eng-coder · **日期**：2026-09-20 · **任务书** = 本档 §2（§2.1 M1/M2/M3 · §2.2 X2/X3/X5/X7）+ §2.6 判据链 + §2.10 附录（冲突以其为准）+ §2.7 禁改动面 · **写域** = §2.5 批 1（A 组 · VSC 工具卡/摘要/状态行）+ 3 档表外（5.6 末段披露）· **先红后绿**
**范围裁定（父侧已确认）**：任务书「§2.1 的 M1–M4 块」为懒笔——M4 需 `suspension.mjs` + 核 `i18n.mjs`（在本批禁改动面内）⇒ 批 1 = M1·M2·M3·X2·X3·X5·X7。

### 5.6 批 1 改动清单（file → 落点 → Δ · 行数 = 实读含末行）

| 档 | 落点 | Δ（HEAD → 现） | 子项 |
|---|---|---|---|
| `thincoder-vscode/webview/tool-summary.js`（**新叶**） | `formatToolSummary` 分派（advisor / read / write / grep / glob / bash / 默认）+ 各分支纯函数 + 交叉引用头注 | 新档 122 | X3 · X7 |
| `thincoder-vscode/webview/ui.js` | ① `advisorRoundTag` + `addTool` 轮次 span（`:203`/`:224`）② `addTool` 建 `done:false`（`:245`）· `finishToolCard` 置 `done`（`:288`）③ `resultSummary` 整段迁出 + 两调用点（`:308`/`:372`）④ X5 正文尾 + 摘要尾标记（`:293`/`:316`） | 473 → 475（+2） | M1 · X2 · X3 · X5 · X7 |
| `thincoder-vscode/webview/streaming.js` | `sweepUnsettledToolCards`（`:151-171`）+ `finish` 恒调用（`:179`，先于 `_toolRefs` 复位 `:202`） | 230 → 260（+30） | M1 |
| `thincoder-vscode/webview/chat.js` | ① `toolCall` case 取 `roundTag` → 状态行 + 卡头（`:136-144`）② `toolResult` case 透传 `m.truncated`（`:149`） | 411 → 423（+12） | X2 · X5 |
| `thincoder-vscode/src/specs.mjs` | `ctxPercentForHistory(history, provider)`（分子 = 核 `estimateTokens`；分母 = `providerSpec(provider).context`）+ 头注两行 | 60 → 78（+18） | M2 |
| `thincoder-vscode/src/extension/panel-callbacks.mjs` | ① `onUsage` 换 `ctxPercentForHistory`（`:181`）② `onToolCall` 补 `round`/`model`（`advisorMeta` `:95`）③ `onToolResult` `String(r ?? "")` + `truncated` 旗标 ④ `onToolOutput` 归一（CLI `tool-events.mjs:322-324` 先例） | 273 → 295（+22） | M2 · M3 · X2 · X5 |
| `thincoder-vscode/locales/en.json` · `zh.json` | `tool.interrupted` · `tool.truncated`（端特有键——未入核容器） | 261 → 263（各 +2） | M1 · X5 |
| `thincoder-vscode/test/files.mjs` | 6 新档登记 + 批注行 | 102 → 109（+7） | 全部 |
| 新测试档 ×6 | `webview-tool-interrupted`(118) · `context-percent-parity`(130) · `tool-output-payload`(83) · `advisor-card-header`(144) · `tool-summary-parity`(184) · `tool-result-truncation`(152) | 新档 811 | 全部 |
| **表外 1** `thincoder-vscode/webview/tool-card-restore.mjs` | 恢复卡 X5 旗标驱动 + 长度维回落（`:58-63`） | 77 → 82（+5） | X5 |
| **表外 2** `thincoder-vscode/src/extension/panel-session.mjs` | `sendHistoryPage` 切片点立 `resultTruncated` 旗标（`:173-175`） | 294 → 295（+1） | X5 |
| **表外 3** `thincoder-vscode/test/webview-tool-failure-signal.test.mjs` | bash 摘要 12 处字面加 `bash: ` 前缀（判据/语义零改） | 207 → 211（+4 = 头注声明） | X7 |

- 行数门：`ui.js` 475 ≤ 483（§2.10.7 门）✓ · `panel-callbacks.mjs` 295 < 300 ✓；越 300 咨询线者仅 `ui.js`（standing——§2.10.4 口径，不升级）。
- 净值 vs 设计表：`streaming.js` +30（设计 +8）· `ui.js` +2（设计 −7 ⇒ 预测 466，实 475）· `panel-callbacks.mjs` +22（设计 +14）· `specs.mjs` +18（设计 +10）——均不破硬限/咨询线；数值收正归父侧/批 4。
- 净增 0 义务面：两文案键入 VSC 本地档（端特有）· 本档即批次档（机检排除面）· `test/files.mjs` 登记自洽 ⇒ `doc-check` 净增 0（见 5.7）。

### 5.7 判据链读数（§2.6 批 1 行 + §2.10.6 #8 复跑行 + 17）

| §2.6 行 | 命令 | 读数 |
|---|---|---|
| 1（M1） | `cd /d D:\teamcode\thincoder\thincoder-vscode && node --test test/webview-tool-interrupted.test.mjs` | 修前红 3/4 → 修后绿 4/4 |
| 2（M2） | `… node --test test/context-percent-parity.test.mjs` | 修前红 1/6（调用点口径）→ 修后绿 6/6 |
| 3（M3） | `… node --test test/tool-output-payload.test.mjs` | 修前红 2/6 → 修后绿 6/6（探针 A） |
| 5（X2） | `… node --test test/advisor-card-header.test.mjs` | 修前红 5/8 → 修后绿 8/8 |
| 6（X3+X7） | `… node --test test/tool-summary-parity.test.mjs` | 修前红 6/16 → 修后绿 16/16 |
| 7（X5） | `… node --test test/tool-result-truncation.test.mjs` | 修前红 5/7 → 修后绿 7/7 |
| 10（协议面 · 载荷扩字段复跑） | `… node --test test/protocol-coverage.test.mjs test/protocol-coverage-reverse.test.mjs` | 绿（另 `engine-floor-guard` 复跑绿——核 `advisor/run.mjs` 引入后端壳静态链仍不达 `node:sqlite`） |
| 11（VSC 包全绿） | `cd /d D:\teamcode\thincoder\thincoder-vscode && npm test` | **782 tests / 782 pass / 0 fail**（含 47 新用例；三次复跑同读数） |
| 17（文档机检净增 0） | `cd /d D:\teamcode\thincoder && node scripts/doc-check.mjs --root .` | 悬空 **1**（`docs/core/design/MODEL-SPECS.md:384` 符号 `none`——本批前既有基线，逐字同 §2.10.10）· 行宽 **0** · exit 0 ⇒ **净增 0** ✓ |

### 5.8 先红读数（临时中和各修正后单跑，随即还原）

| 子项 | 中和点 | 红读数 |
|---|---|---|
| M1 | `streaming.js` 清扫调用注掉 | 1 pass / 3 fail（状态词永停 `tool.running`） |
| M2 | `panel-callbacks.mjs:181` 回 `ctxPercentForModel(u.prompt_tokens, p)` | 5 pass / 1 fail（载荷口径不符） |
| M3 | `onToolOutput` 载荷回裸 chunk | 4 pass / 2 fail（`typeof text === "object"`） |
| X2 | `chat.js` `roundTag` 置空 | 3 pass / 5 fail（卡头/状态行零标签） |
| X3/X7 | 新叶默认分支回末行形 + bash 去前缀 | 10 pass / 6 fail（对拍不等值） |
| X5 | `ui.js` 标记条件短路 + 摘要去标注 | 2 pass / 5 fail（两形皆零标记） |

### 5.9 现场判定读数（§2.1 M3 + §2.10.8）

1. **M3 探针 A（机跑）＝成立**：`parseRelayPath("advisor") === null` ∧ `relaySubagentContentChunk(p, "toolOutput", "advisor", {kind,text}) === false` ∧ 直通载荷 `typeof text === "string"`（修前 = `object` ⇒ 卡体 `[object Object]`；测试以 `String(CHUNK)` 静态取证）。
2. **M3 探针 B（真跑）＝未执行**（本席无 GUI 通道，唯一可跑面 = `node --test`）——本行即零覆盖登记；按 §2.10.8 #12 判定规则（探针 A 绿 ⇒ 本项确认成立），B 读数缺位不阻塞。
3. **X5 falsy 边界（§2.10.8 #13）**：`onToolResult(name, 0, id)` ⇒ `text === "0"` ∧ `truncated === false`（修前 `(r || "")` 得空串）；`null` ⇒ 空串（与修前同形）。
4. **M2 跨端对拍口径（§2.10.8 #14）**：CLI 式为 `render-frame.mjs:388-389` 内联式（无独立导出）⇒ 对拍 = 逐字复算 + **对端源锚**（测试直读 CLI 两档源文本断言公式/分子链在位——对端漂移即红）。
5. **M1 清扫恒执行（§2.10.5 #6）**：`finish(true)` / `finish(false)` 两路径同清扫（不做「收尾前恒有 toolResult」时序假设）；已结算卡零改写；`refreshLiveHeaders()` / `resetActivity()` 后不复活。
6. **X5 恢复面可达性（评审轮修正）**：原实现恢复卡标记「生产不可达」（传输切片点恒截到 64K）⇒ 已把旗标下沉到 `sendHistoryPage` 切片点 + 恢复卡旗标驱动（长度维回落保旧载荷）；测试改真产者直驱（全链实读确认可达）。

### 5.10 内审 + 代码评审（轮次与终态）

- **内审（explore 只读分歧审计 · 1 轮）**：DEVIATIONS 四行**全 🔵**（0 🔴 / 0 🟡）——D1 `tool-card-restore.mjs` 表外（设计表漏列）· D2 W16 档表外（父侧授权）· D3 X2-8 断言强度（已加固：卡头子元素序列 + 文本 golden）· D4 WEBVIEW.md §4.3 字面漂移（上抛）；观察 4 条（`done` 三写点 = CLI `b.done = true` 同形 / 叶头注 `(empty)` 措辞（已收正）/ `buildToolHistory` 无 X5 标记（F-W16 第三卡面已登记另批）/ 行数差）。
- **代码评审（advisor · 2 轮）**：**round 1 = VERDICT pass**（0 🔴 · 4 🟡 全报告型 · 5 🔵）→ 采纳其 #1（X5 恢复面死枝）**落地修正** → **round 2 = VERDICT pass**（复核 = 修正 4 档 + 依赖链；#1 = Fixed）。
- **终态 = clean**（内审 1 轮 + advisor 2 轮；修正后复跑：`npm test` 782/782 绿 · 6 单档 + W16 档 + 协议面全绿）。

### 5.11 决策透明表（本席自决项）

| # | 决策 | 依据 / 取舍 |
|---|---|---|
| 1 | bash 摘要 = CLI `bash: <末行>` 前缀 + 既有 `toolFailureStatus` 附加状态位；**成功面不拼 `(exit code 0)`**、失败面 `(empty)` 不入内容位 | 父侧裁定（选项 A · 全域 CLI 标尺）+ 端差②（`requirements/WEBVIEW.md:126`）与 F-W16（`design/WEBVIEW.md` §4.3）双双保住 |
| 2 | 默认分支 = CLI `:15-17`（`name: <首个非空行>`；`verify` 落默认） | 父侧裁定；`verify` 分支本批不登记（X7 ④） |
| 3 | X5 恢复面：旗标下沉 `sendHistoryPage` 切片点（表外 2）+ 恢复卡旗标驱动/长度回落 | advisor round 1 #1 死枝消解；不改 64K 额度、不动 history 内容 |
| 4 | webview 侧不写工具名字面比较（`round` 非空即 advisor） | `protocol-coverage` 提取器把 `.name === "x"` 当消息判别式（首版触发 §12 表缺行红；已改形态并注释记因） |
| 5 | X2 轮次标签单源 = `ui.js advisorRoundTag`（卡头 + 状态行共用） | 禁双写判据（§2.10.5 #5 同族口径）；非 advisor 零字段 / 零 span（零改面） |
| 6 | 表外 3 = W16 测试字面随改 12 处 | 父侧授权（披露型越界）；判据/语义零改（红/open/aria 断言原样） |

### 5.12 上抛项（父侧 / 批 4 裁定面）

1. **设计档字面漂移（评审 #2 · 🟡 报告型）**：`docs/vsc/design/WEBVIEW.md:113`（bash 摘要无前缀形）· `:121-124`（`WRAPPER` 坐标已随 X7 迁至新叶——全树 `WRAPPER` 零命中）与 `docs/vsc/requirements/WEBVIEW.md:23`（F-W4「末行摘要 ≤80」 vs 现 100 切片）——建议全部加入 §2.10.2(b) 收正点名表（否则批 4 落地闸 token 扫描恒绿、漏收正不可判）。
2. **批档 §2.2:153 机制句过期（评审 #1 残余 · 🟡）**：仍写「恢复卡…同读同一 `resultSummary` 族」——实现 = 宿主切片点立旗 + 恢复卡旗标驱动。
3. **批档 §2.4 缺行 / 数值差（评审 🔵）**：无 `webview/tool-card-restore.mjs` 行；`streaming.js` / `ui.js` / `panel-callbacks.mjs` / `specs.mjs` 实读增量与设计估值差（见 5.6）⇒ 批 4 按实读收正。
4. **批档 §5 批 1 记录面**：本块（5.6–5.12）即批 1 实施记录（含 M3 探针 B「未执行」零覆盖登记）。
5. **§2.10.7「净增 ≤ +10」门**：`ui.js` 475 ≤ 483 成立；越 300 咨询线 = standing（§2.10.4 口径，不升级）。

**读数登记（D6 回读）**：本块唯一 >300 字符行 = 5.10 内审行（308）——append-only 体例，回读期仅修正 5.12-5 的 `$2.10.7` 笔误一字（作者自校，未回改他段）。

**轮次**：initial（批 2）· **作者**：eng-coder · **日期**：2026-09-20 · **任务书** = 本档 §2（§2.1 M4 · §2.2 X6/X10/X11）+ §2.6 判据链 + §2.10 附录（冲突以其为准）· **写域** = §2.5 批 2（VSC 活动块/协议面 + 核 i18n）+ **表外 2 档**（5.13 末段披露）· **先红后绿**

### 5.13 批 2 改动清单（file → 落点 → Δ · 行数 = 实读含末行 · HEAD 基线）

| 档 | 落点 | Δ（HEAD → 现） | 子项 |
|---|---|---|---|
| `thincoder-core/agent/child-marks.mjs`（**新档**） | `TURN_CAP_MARK` / `STOPPED_MARK` 唯一定义（零依赖叶，零 import） | 新档 25 | X6（**表外 1**） |
| `thincoder-core/agent/spawn-child.mjs` | 两锚定义 → 原样再导出（`:29-33`；既有 import 面零改） | 243 → 238（−5） | X6（**表外 1**） |
| `thincoder-core/i18n.mjs` | `digest.turnLabelAsk` / `digest.turnLabelAuto` 两键（`:38-41`） | 102 → 106（+4） | M4 |
| `thincoder-vscode/src/extension/suspension.mjs` | ① M4 `tier` 三档判据 + 起跑即发（start/end 去 `pendingN > 0` 门）② 存活投影 `started` 携 `syncLive:false`（`:151-153`）③ `postSuspensionEnd` 载荷补 `interrupted`（`:393` / `:425-428`） | 420 → 431（+11） | M4 · X10 · X11 |
| `thincoder-vscode/src/extension/panel-subagent-relay.mjs` | ① `syncLiveOf` 谓词（registry 只读）+ `[model]` 载荷补 `syncLive` ② `⟦ev⟧stopped` 第 4 位原因词透传为 `note` | 244 → 257（+13） | X6 · X10 |
| `thincoder-vscode/src/extension/panel-messages-turn.mjs` | `handleCancelSubagent` 增 sync 分支（核 `cancelSyncChild` 单源；池条目优先、未知键警告 no-op） | 199 → 215（+16） | X10 |
| `thincoder-vscode/src/extension/panel-callbacks.mjs` | ① 核叶 import（锚，禁字面）② `syncNoteOf` 判据 ③ `settleSyncSubagent` 载荷补 `note`（`:88-105` / `:205`） | 273 → 309（+36，含批 1 的 +22） | X6 |
| `thincoder-vscode/webview/activity.js` | ① 基座 `note: null` / `syncLive: false` ② started 写 `syncLive` ③ 终态写 `note` ④ `freezeBlock(…, {note})` ⑤ 补桩携 `note` ⑥ `freezeLiveBlocks(interrupted)` | 436 → 449（+13） | X6 · X10 · X11 |
| `thincoder-vscode/webview/activity-view.js` | ① 冻结头注记承面（done/stopped 读 `meta.note`）② ⏹ 门控加 `meta.syncLive === true` 一支 | 192 → 199（+7） | X6 · X10 · X11 |
| `thincoder-vscode/webview/chat.js` | digest start 按 `tier` 三档取键 + ask 轮零计数元素 + end 零动作（幻影行约束） | 411 → 426（+15，含批 1 的 +12） | M4 |
| `thincoder-vscode/webview/panels.js` | `freezeLiveBlocks(m.interrupted === true)` | 140 → 142（+2） | X11 |
| 测试（新 2 · 扩 2 · 既有随改 1） | `test/subagent-note-parity.test.mjs`（新 209）· `test/sync-block-stop.test.mjs`（新 200）· `test/digest-visibility.test.mjs`（+2 例 → 250）· `test/chat-panel-messages.test.mjs`（⑬ stopped 期望值 `+note`）· `test/files.mjs`（+2 登记行） | — | 全部 |

- **声明外改动（如实披露）**：核 `child-marks.mjs`（新）+ `spawn-child.mjs`（改）——设计 §2.2 X6 步骤 1 明令「标记常量**从核 import**，禁字面复制」，而 `spawn-child.mjs` 静态链经核 agent 栈可达 `node:sqlite` ⇒ 端壳静态闭包禁达（W8 契约②、`engine-floor-guard.test.mjs` fail-closed）⇒ 锚点下沉零依赖叶（**先例** = `relay-prefix.mjs` 同因下沉）；`spawn-child.mjs` 再导出 ⇒ 核 agent-tools 族 / CLI `tool-events.mjs:31` import 面零改。全仓 `(TURN_CAP_MARK|STOPPED_MARK) =` 唯一定义点 = 该叶（单源）。
- **行数 vs 设计表**：`activity.js` +13（设计记 +6~8）· `activity-view.js` +7（设计 +6）· `chat.js` +15（设计 +12，含批 1）· `suspension.mjs` +11（设计 +10）· `panel-subagent-relay.mjs` +13（设计 +4~6）· `panel-messages-turn.mjs` +16（设计 +18）· `panel-callbacks.mjs` 309 行（设计记 286）——均 ≤500 硬限；>300 咨询线者：`activity.js` / `chat.js` / `suspension.mjs`（standing——§2.10.4 口径）+ **`panel-callbacks.mjs`（本批内新越线 ⇒ 见 5.18-3）**。
- **净增 0 义务面**：两文案键只入核容器（`locales/*.json` 零复刻，投影面见 `src/i18n.mjs`）· 本档即批次档（机检排除面）· `test/files.mjs` 登记自洽 ⇒ `doc-check` 净增 0（见 5.14 行 17）。

### 5.14 判据链读数（§2.6 批 2 行 + §2.10.6 #8 复跑行 + 16/17）

| §2.6 行 | 命令 | 读数 |
|---|---|---|
| 4（M4） | `cd /d D:\teamcode\thincoder\thincoder-vscode && node --test test/digest-visibility.test.mjs` | 修前红 3/11（T-D1 载荷缺 `tier` · T-D9 三档 · T-D10 标签字面）→ 修后绿 **11/11** |
| 8（X6+X11） | `… node --test test/subagent-note-parity.test.mjs` | 修前红 5/6 → 修后绿 **7/7**（评审修正轮 +1 例：补桩携注记） |
| 9（X10） | `… node --test test/sync-block-stop.test.mjs` | 修前红 5/6 → 修后绿 **6/6**（**display-logic-only**——可达性判定见 5.16-3） |
| 10（协议面 · 载荷扩字段复跑） | `… node --test test/protocol-coverage.test.mjs test/protocol-coverage-reverse.test.mjs` | 绿（另 `engine-floor-guard` 复跑绿——核叶零依赖 ⇒ 端壳静态闭包仍不达 `node:sqlite`） |
| 11（VSC 包全绿） | `cd /d D:\teamcode\thincoder\thincoder-vscode && node test/run.mjs`（= `npm test`） | **797 tests / 797 pass / 0 fail**（三次复跑同读数；含本批 15 新用例） |
| 16（核包全绿） | `cd /d D:\teamcode\thincoder\thincoder-core && node test/run.mjs` | **401 tests / 401 pass / 0 fail**（i18n +2 键 + 核叶下沉） |
| 17（文档机检净增 0） | `cd /d D:\teamcode\thincoder && node scripts/doc-check.mjs --root .` | `OK(锚): 0 条悬空（闸态——阈值 0）` + `OK(行宽): 源域全部 .md 无 >300 字符单行。` · exit 0 ⇒ **净增 0** ✓ |
| 15（CLI 包 · 旁证） | `cd /d D:\teamcode\thincoder\thincoder-cli && node test/run.mjs` | 732 / 732 / 0（核 `spawn-child.mjs` 再导出改动的回归旁证） |

### 5.15 先红读数（先落测试档跑红 → 再实现转绿）

| 子项 | 红读数（实跑） |
|---|---|
| M4 | dig 档：`T-D1` 载荷断言缺 `tier` · `T-D9` 三档字面 · `T-D10` ask 档标签字面（实读旧键 `[auto-turn: digesting…]`）——3 fail |
| X6/X11 | 5 fail：宿主 done 载荷无 `note`；冻结头实读 `"[✓ coder#2 · sync · m · done 0s]"` 零注记；relay 原因位零透传；`freeze+interrupted` 零注记；宿主载荷无 `interrupted` |
| X10 | 5 fail：载荷无 `syncLive`；`syncLive` 块 ⏹ 缺失（门控只认 `pool === true`）；点击零载荷；宿主任 sync 键 no-verify |

### 5.16 现场判定读数（设计点名的现场义务）

1. **M4 档位判据**：`panel._autoApprove`（端侧既有 AUTO 载体——`permission-gate.mjs` 同源）+ `upstreamWaiting(history)`（核既有谓词——`parent-channel.mjs:95`）⇒ 无第二判据；三档字面 en 逐字 = CLI `suspension-drive.mjs:175-176`（zh = 核容器既有档同式译法——CLI 无 zh 面）。
2. **X6 注记判据与载体**：锚 = 核叶 `child-marks.mjs`；判据序逐字 = CLI `tool-events.mjs:217`；`onToolResult` 第 4 参 subKey 由核 `dispatch.mjs:441` 供（仅 sync 成功 / 折叠路径设置）。路径分流读数：turn-cap 路径（块仍 live）⇒ 富注记入头；sync 取消路径（核先发 `⟦ev⟧stopped` 冻结块、工具结果后到）⇒ 该路径注记 = relay 第 4 位透传词（字面 `stopped`），富注记被冻结守卫丢弃（登记见 5.18-5）。
3. **X10 现场判定（关键 · 已获父侧裁定）**：registry 载体 = `agent._syncChildAborts`（核写点 `subagent.mjs:63-77`）——**产者侧序缺陷**：sync 出生 `[model]` 由 `buildSpawnChild`（`subagent-spawn.mjs:459` → `spawn-child.mjs:75`）发射，**早于** arm（`subagent.mjs:329`，晚于 `:276`、中间无 await）⇒ relay 采样 `syncLive` 恒 false ⇒ ⏹ 运行期不可达；首回合另有 `panel._agent` 未绑定盲窗（`panel-turn-loop.mjs:163` 回合末回写）。**处置 = 设计预案「降级登记」（父侧裁定选项①）**：判据 / 门控 / 路由三条已落（产者侧序修好后自然成活，无二次显示面工作），三条测试标 **display-logic-only**（夹具预置 registry ⇒ 不构成生产可达性证据）。
4. **X11 真值源**：`aborted` = 驱动 `finally` 判定（`susp.aborted || susp.abort.signal.aborted`，`:348`）；每回合每建新 controller（`panel-chat.mjs:216`）⇒ `susp.abort` = 入场回合 controller 快照，仅面板销毁 / 会话切换 / 入场前停三径可达——与 CLI `subagent-freeze.mjs:220`「未 done ∧ 非 Ready ⇒ interrupted」同取向；自然退出零注记（T-N5 双径断言）。
5. **M4 `n = 0` 边界**（§2.10.6 #7）：写点唯一 = `chat.js` 标签行（`S._digestBoundary`）；消费面 `archiveBlock(atBoundary)` 仅由宿主回收 `done` 触发（`n=0` 轮差集空 ⇒ 零 done 投递）；幻影计数行约束 = start 不建元素 + end 零动作（T-D10 断言）。

### 5.17 内审 + 代码评审（轮次与终态）

- **内审（explore 只读分歧审计 · 1 轮）**：分歧表 1 行（🟡 OUT-OF-LIST = 核叶 `child-marks.mjs` + `spawn-child.mjs`——5.13 已披露）；PARTIAL / SILENT-SIMPLIFICATION / DOC-DRIFT 三类**不成立**；六项特别核对全过（禁新造三律：无第二判据 / 无第二载体 / 无第二 registry；webview 无回落通道）。观察 4 条：O1 存活投影未携 `syncLive`（**已修**：按「同形」口径补 `syncLive:false`）· O2 X11 真值源名称差（实核 = `susp.abort.signal.aborted`，无写点 `susp.aborted`）· O3 既有测试期望值随载荷形变（已披露）· O4 relay 透传词恒 `stopped`（设计原样透传——登记）。
- **代码评审（advisor · 1 轮）**：**VERDICT = changes-required**（🔴1 / 🟡2 / 🔵4）。🔴 = X10 产者侧序（本席复核**成立**，证据见 5.16-3）⇒ 已上抛父侧并获裁定（选项①：降级登记 + 保留代码 + 测试标 display-logic-only）；🟡 测试缝（按裁定：档头显式标注 display-logic-only；「按真发射顺序」断言随核侧序修复另轮落地——本批不落红测）；🟡 `panel-callbacks.mjs` >300 咨询线（登记 5.18-3）；🔵 补桩携注记（**已修** + T-N6）· 核叶头注句混排（**已修**）· relay 透传词冗余（登记）· 批档数值漂移（登记）。
- **终态 = clean**（🔴 经父侧裁定 = 设计预案分支「降级登记」——非待修缺陷；其余 🟡/🔵 全部修复或登记；无未答上抛项）。修复后复跑：三子项档 24/24 · VSC 包 797/797 · 核包 401/401 · `doc-check` 净增 0。

### 5.18 上抛项 / 登记（父侧裁定面）

1. **X10 产者侧序缺陷**（🔴 · 裁定 = 降级登记）：`subagent-spawn.mjs:459`（`makeRelay` 发射）∥ `subagent.mjs:329`（arm 晚于 `:276`）⇒ relay 采样恒 miss；首回合 `panel._agent` 未绑定盲窗（`panel-turn-loop.mjs:163`）。本批交付 = 「判据 / 门控 / 路由**已落** · **产者侧序缺陷 ⇒ 运行期不可达（未达成）**」；修法与「文案告知」口径由父侧另批。
2. **设计档 X10 条款**（`WEBVIEW.md:225-226` / `:252`，批 4 已落）= 父侧裁定**不动**（判据正确，产者修复后即成立）；需求档 F-A4 半句 = 父侧笔（收口轮统一）。
3. **`panel-callbacks.mjs` 309 行 >300 咨询线**（本批内新越线；设计 §2.4 记 272→286）：建议父侧/批 4 补一行拆分复核记录或按实读收正——本席不越权改设计档。
4. **批档数值漂移**（🔵 · 登记）：§2.4 / §2.10.4 行数估值与实读差（见 5.13 Δ 列）——机制面零影响。
5. **relay `⟦ev⟧stopped` 透传词恒字面 `stopped`**（🔵 登记）：冻结头呈 `[⏹ … · stopped 12s] — stopped`（与 verb 重复；CLI 同面不渲注记）——本席按 §2.2 X6 步骤 3 原样透传，若判冗余属设计面改判。
6. **`test/chat-panel-messages.test.mjs` ⑬ 期望值随载荷形变**（`stopped` 载荷 `+note:"stopped"`）：既有档随改、判据零改（已披露）。
7. **M4 zh 两译文**（核容器新增）：en = CLI 逐字；zh = 既有档同式译法（CLI 无 zh 面 ⇒ 新拟）——如需定稿请父侧裁。

**读数登记（D6 回读）**：本块（5.13–5.18）append-only 体例下 5 行 >300 字符（L811 / L812 / L840 / L846 / L847，最长 471）——机检「行宽」面 `docs/batches/**` 不在扫描域（同批 §2.10.10 先例：`OK(行宽)` 恒绿），未回改、**登记**（如需收正 = 父侧裁）。

**轮次**：initial（收口轮 · 单件 #134 ②）· **作者**：eng-coder · **日期**：2026-09-20 · **任务书** = 本档 §2.2 X6 块（:159-172）+ §5.13 / §5.16-2 / §5.18-5（批 2 实施记录）+ 父侧裁定 #134 ② · **写域** = VSC 端（relay 1 + webview 2〔仅注释〕+ 测试 3）· **先红后绿**

### 5.19 收口轮改动清单（file → 落点 → Δ · 行数 = 读具含末行 · as-of 本收口轮）

| 档 | 落点 | Δ | 子项 |
|---|---|---|---|
| `thincoder-vscode/src/extension/panel-subagent-relay.mjs` | `⟦ev⟧stopped` 分支：`emit({ status: "cancelled", note: rest.split("\x1e")[3] || null })` → `emit({ status: "cancelled" })`（**单点消冗余**）+ 注释 2 行收正（:127-128） | 258（Δ0 · 仅内容改） | X6 收口 |
| `thincoder-vscode/webview/activity-view.js` | **仅注释**：`stopped→` 头形说明（:36-37）+ 注记承面注释（:60-61） | 201（+1 · 注释换行） | X6 收口 |
| `thincoder-vscode/webview/activity.js` | **仅注释**：`_subMeta.note` 字段注释（:89-91） | 451（Δ0） | X6 收口 |
| `thincoder-vscode/test/subagent-note-parity.test.mjs` | T-N3 重写（零注记载荷断言 + verb 在 ∧ 零 `—` + 覆盖式重建路径复核）+ 档头注释 | 224（+15 vs 批 2 记 209） | X6 收口 |
| `thincoder-vscode/test/chat-panel-messages.test.mjs` | ⑬ stopped 期望值随改（去 `note`）+ 注释 | 463（+1） | X6 收口 |
| `thincoder-vscode/test/files.mjs` | :110 登记行注释随改（零注记口径） | 118（Δ0 · 同行改字） | X6 收口 |

**决策透明表（设计要点 ①「二选一单点」的自决与依据）**

| # | 决策 | 依据 / 取舍 |
|---|---|---|
| 1 | 单点取**发射侧**（relay `⟦ev⟧stopped` 分支），**判据侧 `syncNoteOf` 零改** | ① 被删值恒为**恒定字面** `stopped`（核唯二发射点 `agent-tools/async-settle.mjs:239` / `agent-tools/subagent.mjs:364` 逐字 `⟦ev⟧stopped\x1e0\x1e0\x1estopped\x1e` ⇒ 零信息量）；② `syncNoteOf` 停面支产出的注记走 **done 面**（`{status:"done", note:"stopped by user — work may be partial"}`——CLI `tool-events.mjs:217` 同串同判，属裁定「done 态注记保持」射程）；③ relay 载荷经 `postSubagentEvent` **直投** webview——`panel-callbacks` 不在该路径上（改它既消不了冗余、又构成第二处同改） |
| 2 | 载荷**不再携 `note` 字段**（不写 `note: null`） | 「不传」的字面形 = 无字段；webview 写点 `activity.js:376` 本身即 `m.note != null` 门（缺字段零写，`meta.note` 保基座 null）⇒ 零回归面更窄 |
| 3 | 随改既有档 `chat-panel-messages.test.mjs` ⑬ 期望值（表外披露） | 该档 ⑬ 断 relay 载荷逐字（批 2 加的 `note` 期望）⇒ 不随改即包红；判据/语义零改，仅期望值收正 |

**CLI 标尺取证（本席实读）**：`thincoder-cli/src/tui/subagent-blocks.mjs:263-273`（`⟦ev⟧stopped` 分支只置 `done` / `stopped` / `doneAt` / `currentTool` / `approval`，**不置 `lastError`**）∥ `render-segments.mjs:88`（注记唯读 `sub.lastError`）⇒ CLI 同面零注记。**保持面零回归**：done 停因注记（`panel-callbacks.mjs:94`）· error 面（`meta.error`）· X11 `interrupted`（`activity.js` `freezeLiveBlocks`）三路原样。

### 5.20 判据链读数（先红后绿 + 包测试 + 机检）

| 判据 | 命令 | 读数 |
|---|---|---|
| 定向 X6 | `cd /d D:\teamcode\thincoder\thincoder-vscode && node --test test/subagent-note-parity.test.mjs` | 修前红 **6/7**（T-N3 实读载荷含 `note: 'stopped'`）→ 修后绿 **7/7** |
| 定向 relay 面既有档 | `… node --test test/chat-panel-messages.test.mjs` | 修前红 **9/10**（⑬ 期望不符）→ 修后绿 **10/10** |
| VSC 包全绿 | `cd /d D:\teamcode\thincoder\thincoder-vscode && node test/run.mjs` | **831 tests / 831 pass / 0 fail**（末轮复跑同读数） |
| 文档机检 | `cd /d D:\teamcode\thincoder && node scripts/doc-check.mjs --root .` | 悬空 **0** · 行宽 **2**（`docs/core/requirements/AGENT-LOOP.md:163/:167`——HEAD `5b52523b` 结构整合批提交面带入，**非本席产物**：本席零 .md 写入）⇒ **净增 0** ✓ |

### 5.21 内审 + 代码评审（轮次与终态）

- **内审（explore 只读分歧审计 · 1 轮）**：PARTIAL / SILENT-SIMPLIFICATION / OUT-OF-LIST **三类均不成立**；**DOC-DRIFT 成立 1 类 2 行**（`docs/vsc/design/WEBVIEW.md:221` 的「`⟦ev⟧stopped` 第 4 位原因词有值则透传为 `note`」条款句 + 本档 §5.13:802 记录行——均本席写域外）；观察 6 条（含协议档字段表欠账 · zh 面英文残渣附加收益 · 核空位变体无生产形 · 冻结先到路径富注记丢弃为已登记形态）。
- **代码评审（advisor · 2 轮）**：round 1 = **VERDICT pass**（🔴 0 · 🟡 1 登记型〔越 300 咨询线 standing〕· 🔵 2）→ 两条 🔵 **全采纳落地**（注释锚点补 `agent-tools/` 前缀；T-N3 补覆盖式重建路径零注记断言）→ round 2（仅复核 fix claim）= **VERDICT pass**（2/2 Fixed）。fix 后复跑：定向 7/7 + 10/10 绿 · VSC 包 831/831 绿。
- **终态 = clean**（内审 1 轮 + advisor 2 轮）。**评审工具侧读数登记**：round 2 报告的引用体被宿主机检标 0/13「file unreadable」（评审席引用未带 `thincoder-vscode/` 前缀所致）⇒ 本席对两条断言之基**逐条自行复核**：`webview/activity-view.js:117` = `export function refreshBlock(block) {` ✓ · `test/subagent-note-parity.test.mjs:65` = `S: state.S, ctx: state.ctx, diag, ...activity, refreshBlock: view.refreshBlock,` ✓ · `webview/activity.js:92` = `note: null, syncLive: false,` ✓（引用形瑕疵，非内容分歧）。

### 5.22 上抛项 / 登记（父侧裁定面）

1. **设计档漂移（DOC-DRIFT · 非本席写域）**：`docs/vsc/design/WEBVIEW.md:221` 末句与现盘相抵 ⇒ 建议设计档作者一行收正（改「该面零注记——与 verb 重复；CLI 标尺同面零注记」）；同档 `:220`「done / stopped 停因注记」仍成立（「用户停止」= done 面经 `STOPPED_MARK` 的停因）。
2. **本档记录面（append-only，不回改）**：§2.2 X6 步骤 3（:166）/ §5.13 表行（:802）/ §5.16-2（:839）/ §5.18-5（:856）载的是**改动前**形态（透传注记）⇒ 以本块（5.19–5.22）为收口轮定案；**§5.18-5 的 🔵 登记随本块闭合**。
3. **`WEBVIEW-PROTOCOL.md`**：`note` 字段产者记 = `settleSyncSubagent`（done 路）与现盘一致 ⇒ 本次零改（§12/§13 坐标列重出义务仍归批 4 / 收口面）。
4. **机检行宽 2 条归属**：`docs/core/requirements/AGENT-LOOP.md:163/:167`（373 / 332 字符）= HEAD `5b52523b`（结构整合批 #119-#121）提交面带入，非本批产物 ⇒ 建议归该批 / 父侧收正。
5. **`test/files.mjs` 登记行注释**（:110）随口径改字（零注记）——登记集与计数零变。

## §6 验证与收口（父代理）

**2026-09-20 12:07 父侧收口**

**交付核验（五路）**：批 1（#27 · M1/M2/M3/X2/X3/X5/X7 · **先红 22 例**→绿）✓ · 批 2（#35 · M4/X6/X11 + X10 降级登记 · **先红 3 组**→绿）✓ · 批 3（#28 · M5/X8/X9 · 先红）✓ · 批 4（#36 · 两档 14 子项条款落笔 + 点名三行收正 + 落地闸自查 11/11 + 3/3）✓ · **收口轮**（#40 设计档面：协议档三处 + §12/§13 坐标重出（51/50 行）+ 漂移收正 + 7 档变更记录；**#41 代码单件**：`⟦ev⟧stopped` 注记去冗余（发射侧单点））✓ —— **advisor 终态全 clean**（批 1 pass→fix→pass；批 2 changes-required〔X10 序缺陷属下放裁定〕→clean；批 3 pass；批 4 落地闸自查；收口单件 pass×2）。

**读数**：VSC 包 **831/831** ✓（含四条新档）· CLI 732/732 ✓ · core 401/401 ✓ · 协议对表 **7/7** ✓ · `doc-check` **锚悬空 0** ✓（行宽面：父侧自伤 2 条已当场折行 ✓）· 先红后绿逐子项留痕（批 1 共 22 例、批 2 三组、批 3 三组 ✓）。

**角色表**：设计席（§2 全段 + §2.11/§2.12 收口轮）· 实施三组 + 收口单件（已交）· 父侧 §4 代签（05:11）· 批档 §6 本笔 · **父侧笔**：F-A4 判据扩支 + F-W4「≤80→≤100」（本笔 12:0x 落 ✓）。

**台账**：**#124 / #125 / #126 → 待核销 → 已核销** ✓。

**遗留（显式）**：① `WEBVIEW.md:221` 末句（`⟦ev⟧stopped` 第 4 位透传）与控制面现态相抵 ⇒ 一行收正（归本批收口尾项）；② `thincoder-vscode/AGENTS.md` 六处新字段未登记（产品文本面 · 在册）；③ `X10` = 判据/门控/路由已落但**产者侧序缺陷 ⇒ 运行期不可达**（台账 #133 在册 · 同轮补正核面）；④ advisor 🔵 未采纳两条（五路共档 / 端侧第四 kind 残口 · #135 在册）；⑤ `ui.js` 475 / `specs.mjs` 83 等读数按 as-of 登记不改（#134 ③）。

**提交**：`commit + push`（路径限定）。