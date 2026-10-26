# 2026-10-25 · 设计凭证丢弃报明
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-25 · 来源 = 台账 #1752 + 用户 2026-10-25 23:46「做吧」。
> 台账 = #1752（SESSION · 归批）。前情 = 2026-10-25-test-instinct-prompt.md（已收口 2026-10-25）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-25
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**本批目标（台账 #1752 · 用户 2026-10-25 23:46「做吧」）**

**问题**：设计凭证挂在会话槽上，切槽 ∥ 新开会话时会清掉一部分已批准的凭证。核心已经把「丢了几个」数出来并交出来，但**只有 CLI 接了这个数并提示用户**；VSC 与桌面拿到返回值就扔了——用户在两端切槽时，凭证失效是**无声**的，下一次想派工才发现，会以为自己没批过或系统坏了。

**父侧实读（2026-10-25 23:45，比台账 10-24 记录更准）**：

| 面 | 现状 | 坐标 |
|---|---|---|
| 核心 | 三处都返回计数 | `thincoder-core/session-lifecycle.mjs:213` / `:217`（`applySession` 返回 `{ switched, droppedDesignTokens }`）· `:339`（重置会话）· `thincoder-core/token-ttl.mjs:156`（`reconcileEngDesignTokens`） |
| CLI | **已接**，两处提示 | `thincoder-cli/src/tui/cmd-new.mjs:16` / `:28`–`:29`（`/new`）· `cmd-session.mjs:139`–`:140`（切槽） |
| **VSC** | **接了但丢弃** | `thincoder-vscode/src/agent/agent-state.mjs:118` 调 `reconcileEngDesignTokens`，`:119` 只取 `rt.map`——`rt.droppedDesignTokens` 未用 |
| **桌面** | **未接** | `thincoder-desktop/src/main/session-io.mjs:29` 调 `applySession(agent, data, { slot })`，返回值整个未接 |

**台账旧判断已作废**：原记「VSC 无丢弃时点（Map 永不复位清空）⇒ 需先勘察它到底在哪个时点丢凭证」——实读证明时点就在 `reconcileEngDesignTokens` 那次调用里（`token-ttl.mjs:154`–`:156` 在重建 Map 前数了一遍），**不是没有时点，是拿到了没传下去**。勘察项消解。

**要求**：两端各接住这个数，> 0 时给用户一句提示。文案可对齐 CLI 既有两句的语义（`/new` = 离开本会话、切槽 = 本槽不生效可切回），但**两端的呈现形态由设计定**（VSC 走什么面、桌面走什么面）。

**不做的**：不改核心的计数逻辑 ∥ 不改 CLI 既有两句 ∥ 不改凭证的 TTL 与清理规则。

**设计落点候选**（由设计席核实定稿）：`docs/core/design/SESSION.md` ∥ `docs/core/design/SESSION-OBSERVABILITY.md` ∥ `docs/vsc/design/` ∥ `docs/desktop/design/SESSIONS.md`。

**流程**：设计 → 用户触发评审 → 批准 → eng-coder 落两档。

> 不适用：§3 —— 本批无设计稿可评。性质 = 勘察判定批：实施席实读后发现台账前提不成立（两端均无「凭证被丢弃」事件），结论为「无场景、零代码」，不存在需要评审的设计落点。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（勘察判定：两端无场景，不建提示分支；台账 #1752 建议废弃）

**结论**：本批**不落任何代码**。两端都不存在「已批准设计凭证离开本会话」的时点；按 §1 字面落两档 = 两个没有场景的死分支。主 agent 2026-10-25 裁定 **A（收批，无场景不建）**；本段即本批唯一产出——「勘察后判定无场景」的结论记录。

### 1. 两端无场景的实读证据（逐行读过）

| 面 | 逐字证据 | 坐标 | 判定 |
|---|---|---|---|
| VSC · 函数定义 | `export function reconcileEngDesignTokens(existing, slotTokens, legacyToken) {` | `thincoder-vscode/src/agent/agent-state.mjs:57` | 端侧**本地实现**，不是核的同名件 |
| VSC · 返回形 | `@returns {{ map: Map, droppedExpired: boolean }}` | 同上 `:55` | 返回形里没有凭证计数字段 |
| VSC · 返回值 | `return { map, droppedExpired }` | 同上 `:74` | `droppedExpired` = 布尔「有过期项」，≠「跨会话离开的凭证数」 |
| VSC · 合入语义 | `Map 永不复位清空` · `if (typeof tok !== "string" || map.has(id)) continue` | 同上 `:51` · `:65` | 只增不减、内存项永不清空 ⇒ 无丢弃时点（既有裁定，非漏接） |
| VSC · 调用点 | `agent._engDesignTokens = rt.map` | 同上 `:119` | 取 `map`；`rt.droppedDesignTokens` 在 VSC 从不存在 |
| 桌面 · 调用面 | `applySession(agent, data, { slot })`（返回值未接） | `thincoder-desktop/src/main/session-io.mjs:29` | 值确实没接——但接了也永不触发（见下行） |
| 桌面 · 装配面 | `const agent = await coreAssemble({` | `thincoder-desktop/src/main/agent-assemble.mjs:116` | 每次装配出**全新** agent ⇒ `before` 集为空 |
| 核 · 计数口径 | `if (agent._engDesignTokens instanceof Map) {` · `for (const id of before) if (!map.has(id)) droppedDesignTokens++` | `thincoder-core/token-ttl.mjs:134` · `:155` | 离开集 = 旧 Map 未过期 id ∖ 新 Map；全新 agent ⇒ 恒 0 |
| 桌面 · 第二调用面 | `loadAgentSlot(agent, agent.cwd, agent._slot)` · `else loadAgentSlot(agent, cwd, slot)` | `thincoder-desktop/src/main/session-io.mjs:61` · `agent-host.mjs:264` | 同一槽重载 ⇒ 前后 id 集相同 ⇒ 0 |
| 桌面 · 会话隔离 | `if (agents.has(key)) return agents.get(key)` | `thincoder-desktop/src/main/agent-host.mjs:200` | 每会话键各持一份 agent（键 = `String(slot)`）⇒ 切回原会话凭证原样恢复 |
| 核 · 真实丢弃面 | `agent._engDesignTokens = new Map()` | `thincoder-core/session-lifecycle.mjs:318` | 只在 `resetSessionState`（CLI `/new`）；桌面 / VSC 全量 grep `resetSessionState` 零命中 |

**推论**：两端要出现「> 0」，先得存在一个清空 ∥ 换装内存 Map 的动作——两端都没有（VSC 有意保留，桌面每会话键各持一份 agent）。故无实现面可落。

### 2. 本批射程：零代码

- 不建任何提示分支；两端入口与核心零改动。
- 设计档只落一条事实：`docs/core/design/SESSION-OBSERVABILITY.md` §8 桌面边界行由「本批未勘察」改为已勘察结论；同节「两端报明随 VSC / 桌面面另批统一接」一句随本裁定删除（被裁定取消的计划不留在现行面）。
- 本批可持续的产出 = 本段记录 + 台账处置。

### 3. 台账 #1752 处置建议：**废弃**（不是关闭为已做）

- 建议状态 = 已废弃（撤回）。理由 = 原记录「VSC 无丢弃时点（Map 永不复位清空）」本身是对的；本批勘察进一步确认**桌面也没有该时点**（装配面每次出全新 agent）。要求的前提不存在。
- 登记为「已完成」会让台账显示一项从未存在的报明能力已被交付。

### 4. 前提为何被写错：同名不同物

- 出错路径：grep `droppedDesignTokens` 命中 `thincoder-core/token-ttl.mjs:156`，据此认定 VSC 调的是同一个函数。
- 事实：VSC 的 `reconcileEngDesignTokens`（`thincoder-vscode/src/agent/agent-state.mjs:57`）是本地同名实现，返回 `{ map, droppedExpired }`；`droppedExpired` 是布尔、语义「有过期项」，与「跨会话离开的凭证数」是两件事。
- 约定：跨端找同名函数，必须读到该端的 `export function` 定义行，不能只按调用名判定。同一晚第三次同类误判（前两次：`unique`、`梯④`）。

### 5. 另案待用户裁（不在本批射程）

- **候选 B**：VSC 的内存 Map 经 `run-helpers.mjs:80` 并回**当前槽**（`engDesignTokens: Object.fromEntries(agent._engDesignTokens)`）⇒ A 槽批准的凭证随槽切换写进 B 槽、切回 A 仍有效。方向与本批描述相反：不是「凭证无声失效」，而是「凭证跨槽携带、授权范围变大」。
- 状态：另案，待用户裁。本批不处置、不设计、不登记为缺陷。

**不做**（沿 §1，不变）：不改核心计数逻辑（`thincoder-core/token-ttl.mjs` / `thincoder-core/session-lifecycle.mjs`）· 不改 CLI 既有两句 · 不改凭证 TTL 与清理规则。

## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）

**状态行**：已批准 2026-10-25（用户原话：「**做吧**」）

**批准内容**：开批处理台账 #1752（设计凭证丢弃报明的 VSC ∥ 桌面两端消费）。

**批准后的实际结果**：本批不产出代码。开工后设计席实读发现台账前提不成立——VSC 端 `reconcileEngDesignTokens` 返回的是 `{ map, droppedExpired }`（布尔·过期语义，Map 永不清空），桌面端每次装配全新 agent 使离开集恒 0。父侧核实后裁定 **A：收批，无场景不建**（建了是死分支）。

**该批准覆盖的范围**：开批勘察 + 结论记录。**不覆盖**：任何代码改动（本批零改动）；候选 B（凭证跨槽携带，越权方向）需另裁。

## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）

## 收口（2026-10-25 23:50 · 父侧）

**状态行**：已收口 2026-10-25

### 一、本批结论：**勘察判定无场景，零代码**

台账 #1752 描述的「切槽 / 新会话时设计凭证被丢弃、两端不提示」，**在两端都不存在**：

| 端 | 实读证据 | 结论 |
|---|---|---|
| **VSC** | `thincoder-vscode/src/agent/agent-state.mjs:57` 自己的 `reconcileEngDesignTokens(existing, slotTokens, legacyToken)` → `:74` 返回 `{ map, droppedExpired }`；`:58` 用 existing、`:61` 只删**过期**项 ⇒ Map 永不清空、只增不减 | 不存在「凭证离开本会话」这个事件 |
| **桌面** | `thincoder-desktop/src/main/agent-assemble.mjs:116` 每次装配**全新 agent** ⇒ `token-ttl.mjs:134` 的 `before` 集恒空 ⇒ `:155` 离开集恒 0；另一面 `agent-host.mjs:264` 是同槽重载（id 集相同） | 计数器恒 0，接了也是死分支 |

### 二、父侧的错判（记明，防复发）

23:45 我 grep `droppedDesignTokens`，在 `thincoder-core/token-ttl.mjs:156` 命中，就断言「VSC 接了但丢弃」。实际 VSC 调的是**端侧同名不同物**——`droppedExpired` 是布尔、语义为**过期**，与「跨会话离开的凭证数」无关。

**这是当晚第三次栽在「同名不同物」上**（前两次：`unique` 在仓梯与项目梯各一、`梯④` 在两条发现梯各一）。教训归一条：**grep 命中一个词，不等于命中的是我以为的那个函数；签名要读，名字不够。**

### 三、设计档随正

`docs/core/design/SESSION-OBSERVABILITY.md` §8 桌面边界行：由「本批未勘察 ⇒ 不猜打印点」改为已勘察结论；原「两端报明随 VSC / 桌面面另批统一接」一句**删除**（该计划随本裁定取消，不留现行面）。另按句界拆段 16 处（纯格式，零措辞改动）。

### 四、另案（用户裁）

**候选 B**：VSC 内存 Map 经 `run-helpers.mjs:80` 并回当前槽 ⇒ **凭证跨槽携带**（越权方向，与本条描述相反）。只登记为另案，未建行、未设计。

### 五、一条待用户定的观察（本批射程外）

`docs/core/design/SESSION-OBSERVABILITY.md:220` 仍写「该文件随 `npm test` 常驻，**不作「用后即删」**」——与 2026-10-25 当晚刚落定的「单元测试用毕即删、零留存」（需求 `TESTING.md` §1.1 · 提示词四档同源）直接冲突。属他批内容，本批未动。
