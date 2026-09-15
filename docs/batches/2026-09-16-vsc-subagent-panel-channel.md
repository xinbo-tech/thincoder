# VSC 子代理面板通道恢复（VSC-SUBAGENT-PANEL-CHANNEL）· 批次记录（2026-09-16）

> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务（eng-designer）· §3 设计评审（评审子代理）·
> §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-16 · 来源 = 用户实测报告（2026-09-16 00:31：「vsc端spawn成功了，但是子agent的呈现形式大变，显示被塞进了主会话流。我希望还是能原来的方式呈现」）
> + 台账技术待办「子代理内容面 chunk 通道无 host 侧生产者」**同物合并**（该条 2026-09-15 由 VSC 壳接线批评审登记、触发=条件）。
> **状态：设计轮待发 · 执行宿主 = CLI**（修复面全在仓库文件内，CLI 宿主可直接施工与复跑）。
>
> **导航（父侧维护）**：§1（裁定与讨论）= 本档 §1；§2 当前任务书 = 本档 §2（designer 追加面）。
> **条目指针（三方一致）**：本批 = 台账 `docs/TODO.md` 技术待办「子代理内容面 chunk 通道无 host 侧生产者」——§2 条目 ↔ 设计档验收回指 ↔ 需求档条目须逐条对齐。
> **同链缺陷（VSC 侧前序，均已修并收口）** = ① `agent.tools` 未装配（`docs/batches/2026-09-15-vsc-agent-tools-spawn-fix.md`）· ② 子代工具表重名 400（`docs/batches/2026-09-15-vsc-tool-table-dup.md`）· ③ 压缩后推理链回传 400（`docs/batches/2026-09-16-subagent-reasoning-echo.md`——**并行批**）。
> 上游：台账 `docs/TODO.md` · 迁移批 `docs/batches/2026-09-15-vsc-core-wiring.md`（W13/W15——旧 VSC 生成侧的核向迁移；迁移前实现已随旧树退役、不在本仓）。

---

## §1 讨论（主 agent 记）

### 1.1 现象（用户实测，2026-09-16 00:31）

reload 后 spawn 成功（前序两缺陷已修），但**子代理的呈现形态大变**：子代理的活体输出（模型文本 / 推理 / 工具调用行）
**不再进子代理面板块**，而是**被塞进主会话流**。期望 = 恢复原呈现（子代理内容归 `sub:<role>#<id>` 块）。

### 1.2 根因（三证实核——旧实现有生产者、核内零生产者、端侧接收面成死面）

| # | 事实 | 证据（file:line） |
|---|---|---|
| ① | **迁移前旧 VSC 生成侧自持面板通道**：子代回调经 `panel(chunk)` → `onToolPanel("sub:" + role + "#" + subId, chunk)`；四路全接（text / think / tool-call / tool-result）+ 嵌套转发（该实现已随旧树退役、**不在本仓**——迁移记录见 `docs/batches/2026-09-15-vsc-core-wiring.md`） | 迁移前实现（旧 VSC 树）——本仓内重写面见下行 ② |
| ② | **核侧迁移版无该生产者**：`wrapChildCallbacks` 头注逐字 = 「onToken/onReasoning/onToolCall/onToolOutput 前缀包装」——**无 onToolPanel**；全核 grep `onToolPanel` = 零生产者（唯一命中 = `thincoder-core/agent-tools/consult.mjs:21` 一句注释） | `thincoder-core/agent/spawn-child.mjs`（收编清单头注）· 全核 grep |
| ③ | **端侧接收面仍在但成死面**：`onToolPanel` 处理器已实现（webview `toolPanel` → `sub:*` 频道）但无人调用 | `thincoder-vscode/src/extension/panel-callbacks.mjs:245`（`onToolPanel` 处理器）· webview 侧 `thincoder-vscode/webview/chat.js:295`（`m.name?.startsWith("sub:")` → 子代理块） |

**当前实际走向**：子代文本以 **relay 前缀 token**（`<role>#<id>/…`）经 `onToken` 到达端侧——端侧 `onToken` 只消化 `⟦ev⟧` 事件
（`relaySubagentEventToken`），其余原样 `{type:"token"}` ⇒ **落主会话流**（与用户观感逐字吻合）。

### 1.3 为何现在才现

前序两缺陷（`agent.tools` 未装配 / 工具表重名 400）使 VSC 内 spawn **根本跑不到成功路径**——面板通道缺口被掩盖；
2026-09-15 晚两缺陷修复后，spawn 通了 ⇒ 本缺口（迁移期丢面）随之暴露。**非当日改动引入**。

### 1.4 同族面（同一生产者缺失——共批核查，勿漏）

| 面 | 迁移前实现（旧 VSC 生成侧——有发点，已退役） | 核内现状 |
|---|---|---|
| escalate 流 `sub:escalate <label> #N` | 有发点（旧 VSC 生成侧） | 无生产者 |
| consult 流 `sub:consult <label> #<id>` | 有发点（旧 VSC 生成侧） | 无生产者 |
| advisor 流 `sub:advisor#<id>` | 有发点（旧 VSC 生成侧） | 无生产者（`relayAdvisorOutput` 走 relay 前缀口径） |

### 1.5 修法候选（供设计轮裁决——父侧不代裁）

| # | 方向 | 要点 | 代价 / 风险 |
|---|---|---|---|
| A | **端修（核零改）**：`panel-callbacks.mjs` 按**既有 relay 文法**（`@thincoder/core/agent/relay-prefix.mjs`——该档已 import `parseRelayPath`）判别带前缀的子代回调（onToken/onReasoning/onToolCall/onToolResult——**父侧注记 2026-09-16**：讨论期原写 `onToolResult`，实码 = `onToolOutput`；权威见 §2（一）#6 与（十）#1）⇒ 路由回 `onToolPanel("sub:" + key, {kind:"text"|"think"|"tool", …})` | 单点、守「核内零端名」缝约（契约：壳→核可 · 核→壳禁）；CLI/TUI 不受影响 | 前缀判别需防误伤（父级正文恰含 `xxx#1/` 形态——复用既有文法模块 + 反向用例） |
| B | **核→端中性回调名**：核生成侧新增中性回调（如 `onChildStream(key, chunk)`），端侧映射到 `sub:` 频道 | 生成侧单点、语义最清晰 | 触核回调契约（面更宽）；需核/端双侧同批落地 |
| C | **协议面收正**（webview 侧把前缀 token 自行分流） | 端渲染层就近处理 | 端渲染层要在意协议前缀——与「宿主侧分流」现状分层相反；须证流式分片边界安全 |

### 1.6 期望（可机判）

1. 子代理 text / think / tool 行**实时回 `sub:<role>#<id>` 块**（与原呈现逐面等价：块内文本追加 + 工具行）；
2. **反向用例**：带 relay 前缀的子代 token **不得**出现在主会话流（机判：注入一段前缀 token ⇒ 断言主流消息零命中且块内命中）；
3. 同族三面（escalate / consult / advisor）清点结论（修 / 另登记各有判据）；
4. 端侧现有测试链（快层 / 全量 / 集成 + `doc:check`）+ 双侧契约断言（块频道名 = `sub:<role>#<id>`）。

### 1.7 边界（明确不做）

1. 不重开前序批（spawn-fix / tool-table-dup / reasoning-echo）；
2. 不改台账 / 不动他批批次档；勘察若发现同链第五处 ⇒ **停下上报**（父侧另批）；
3. 机制缝约不变：核内**不得**出现 `sub:` 等端概念（若选 B 方向，回调名须端中立）。

---

## §2 批次任务（eng-designer）

### 批次任务书（VSC 子代理面板通道恢复 · 设计轮 · eng-designer · 2026-09-16）

**依据** = 本档 §1（逐字读——三证实核 / 同族面 / 候选 A–C / 期望 / 边界）＋ 本设计轮独立复核（含与 §1 转述不符处的实码修正——见（一）#6）。
**上游条目（三方一致）** = 台账 `docs/TODO.md` 技术待办「子代理内容面 chunk 通道无 host 侧生产者」（2026-09-16 归批）——§2 条目 E1–E4 ↔ 设计档验收回指 ↔ 需求档条目逐条对齐（映射见（八））。

#### （〇）本批条目（E1–E4——验收回指源）

| # | 条目 | 回指 |
|---|---|---|
| E1 | 子代内容面（text / think / tool 行）恢复回 `sub:<role>#<id>` 块：端侧按 relay 前缀文法分流四路内容回调（含嵌套子标 D-M8）；**核零改** | 台账条目消解路径 · `docs/vsc/requirements/WEBVIEW.md` F-W1 |
| E2 | 反证面机判：带前缀子代回调 ⇒ 主流零命中 + 块内命中（**修前必红** + 原样记录）；`⟦ev⟧` 生命周期面零回归；端侧测试链全绿 | §1.6-2 · N-W5 |
| E3 | 同族三面清点结论（escalate / consult / advisor——修 / 登记各有判据） | §1.6-3 |
| E4 | 文档收正（VSC 面档 + 核侧接线行——随实施轮） | §1.6-4 |

#### （一）勘察实核读数（本设计轮自核 · 2026-09-16 · file:line 实核）

| # | 读数 | 证据 |
|---|---|---|
| 1 | 子代回调装配 = 四路前缀包装（onToken / onReasoning / onToolCall / onToolOutput）——**无 onToolPanel、无 onToolResult**；装配式 `childOpts = { onPermissionRequest, ...wrapChildCallbacks(...) }` | `thincoder-core/agent/spawn-child.mjs:131-148` · `thincoder-core/agent-tools/subagent-spawn.mjs:453-456` |
| 2 | 端侧 onToken 只消化事件面（`⟦ev⟧` / `[model]`——`relaySubagentEventToken`），其余前缀 token 原样 `{type:"token"}` 落主流；onReasoning / onToolCall / onToolOutput **零前缀判别** | `thincoder-vscode/src/extension/panel-callbacks.mjs:187-192` · `:193` · `:236` · `:244` |
| 3 | 端侧接收面（webview）活着：`toolPanel` `sub:*` → 活动区块；`parseRelayPath` 已在 panel-callbacks import 在位 | `thincoder-vscode/webview/chat.js:291-296` · `webview/streaming.js:245-256` · `webview/activity.js:144-155` · `panel-callbacks.mjs:17` |
| 4 | CLI 同文法先例（四路 routeSub* 按前缀分流；**无角色白名单**）；文法单源 = 核模块 | `thincoder-cli/src/tui/tool-events.mjs:99/:107/:115` · `tui/subagent-blocks.mjs:135-137/:294-297/:311-313/:339-341` · `thincoder-core/agent/relay-prefix.mjs:10-32` |
| 5 | 块出生时序：async 池条目 `[model]` 先于内容（`⟦ev⟧async` → started `pool:true` → 建块）；**sync spawn 无 started 建块**（started 门要求 `pool` 真值）——首内容 chunk 出生 | `webview/activity.js:281-290`（门 `:284`）· 注释 `:282-283` |
| 6 | **§1.5 候选 A 措辞与实码不符**：第四路 = `onToolOutput`（非 `onToolResult`——后者端侧旧映射在现核无生产者） | 本条 #1 + `_retired-thincoder-vscode/src/agent-tools/subagent-run.mjs:97-108` |
| 7 | 同族前缀实核：escalate `escalate#N/`（async `escalate-async.mjs:158`；sync `subagent-actions.mjs:386`）· consult `consult#N/`（`consult.mjs:292`）· advisor `advisor#N/`（`advisor-async.mjs:230-241`；⟦ev⟧async+[model] `:299-300`） | 见左 |
| 8 | 旧三面发点（参照历史）：escalate `sub:escalate <tag> #N`（`_retired…/subagent-escalate-async.mjs:74`）· consult `sub:consult <label> #<id>`（`_retired…/consult.mjs:261`）· advisor `sub:advisor#N`（`_retired…/advisor-async.mjs:277`） | 见左 |
| 9 | webview 频道语法：family 枚举含 advisor；consult/escalate 判定为旧形态 `sub:consult <label> #N`；`sub:escalate#N` 形态 role=null | `webview/activity.js:41-48` · `webview/activity-view.js:14`（FAMILY_ROLES） |

#### （二）方案选型（A / B / C 逐项判据——判据来自 §1.5 + 本批边界）

判据：① 缝约（核内零端名）② CLI/TUI 零影响 ③ 前缀误伤面（父级正文恰含 `xxx#1/`）④ 分片边界安全 ⑤ 结构/行数纪律。

| # | 候选 | ① | ② | ③ | ④ | ⑤ | 结论 |
|---|---|---|---|---|---|---|---|
| 1 | **A 端修**：`panel-callbacks.mjs` 按既有 relay 文法分流四路内容回调 → `sub:` 面板通道 | ✓ 核零改（缝约保持） | ✓ 核零改——CLI 路径不载本档 | 接受：与 CLI 同文法同暴露（无白名单先例——读数 #4）；缓解三案评估见下 | ✓ 前缀由核逐 chunk 重加（wrapper 链 `spawn-child.mjs:135/:138/:141/:144`）——端侧无跨 chunk 状态、无重组 | 单档 +50~65 行（283 → ~335–350；超 300 软线、不触 500 硬限） | **选定** |
| 2 | B 核→端中性回调（`onChildStream` 类） | 触核回调契约（须端中立名） | 核改共享管线（TUI 亦载——加性但面更宽） | ✓ 结构免疫 | ✓ | 核 + 端双档 + 第二内容通道 | **否决**：契约面更宽 + 内容通道分叉（relay 前缀单源被绕开、CLI 口径分家）；误伤免疫收益不抵 |
| 3 | C 协议面收正（webview 自分流） | 端渲染层须懂协议前缀（分层反转） | 不影响 | 同 A 暴露 | ✓ | 4+ 渲染点扩散 + tool/cmd 结构化字段须 webview 重建 | **否决**：与「宿主侧分流」既有分层相反（W15 事件面先例 = host 单点）+ 多面扩散 |

**误伤面裁定（判据③）**：接受——与 CLI 同规。缓解三案评估：① **角色白名单**：误伤不减尽（引语含角色名）+ 制造端差（VSC 严于 CLI）；② **活跃键守卫**：**不可行**——sync spawn 块出生 = 首内容 chunk（读数 #5），守卫会丢同步子代理内容；③ 核侧显式通道 = 候选 B（已否决）。已知暴露 = 父级 token 恰以 `[\w-]+#\d+/` 起始（如「issue#123/」）会被分流（CLI 现存同象）；重评入口 = 单函数；判据 = 与 CLI 同规 + 正反用例锁两面。

**关键决策记录（含否决备选）**：

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-1 | 选定 A | 否决 B（契约面宽 + 通道分叉）· C（分层反转 + 多面扩散）——取舍 = 误伤免疫让位于「核零改 + 单点 + CLI 同规」 |
| D-2 | 落点 = `panel-callbacks.mjs`（与 `relaySubagentEventToken` 并列；导出可直测——⑬ 先例）；不新建档 | W13/W15 裁定「端壳缝不新增档」；单消费者单点 |
| D-3 | 分流产物 = `toolPanelPayload` 既有白名单字段（协议零新增） | `panel-toolpanel.mjs:14-21` 已备 kind/text/sub/tool/cmd |
| D-4 | 不恢复旧「→ 工具结果行」 | 现核无生产者（读数 #6）；CLI 口径同无——登记观察（（十）#2） |

#### （三）修复点精确化（file:line + 改动形态 + 逐面等价 + 生命周期零回归）

**修复点 1（新增·单点）**：`thincoder-vscode/src/extension/panel-callbacks.mjs`——新增导出 `relaySubagentContentChunk(panel, face, a, b)`（置 `relaySubagentEventToken` 邻位，:83 后）：

```js
export function relaySubagentContentChunk(panel, face, a, b) {
  const path = parseRelayPath(String(a ?? ""))
  if (!path) return false
  const sub = path.inner.length > 0 ? path.inner.join("/") : undefined // D-M8 嵌套子标
  let chunk
  if (face === "toolCall") {
    const argsJson = JSON.stringify(b) || ""
    chunk = { kind: "tool", text: `${path.rest} ${argsJson.slice(0, 120)}`,
      tool: path.rest, cmd: typeof b?.command === "string" ? b.command : undefined, sub }
  } else if (face === "toolOutput") {
    chunk = { kind: "tool", text: typeof b === "string" ? b : String(b?.text ?? ""), sub }
  } else {
    chunk = { kind: face === "think" ? "think" : "text", text: path.rest, sub }
  }
  panel._panel?.webview.postMessage(toolPanelPayload("sub:" + path.head, chunk))
  return true
}
```

**修复点 2（四路接线——`buildPanelCallbacks` 内，次序敏感）**：

| 路 | 现文 | 改动形态 |
|---|---|---|
| `onToken` :187-192 | 事件面 → 主流 | 事件面（**不动**）→ 插 `if (relaySubagentContentChunk(panel, "text", tok)) return`（事件面**之后**、主流**之前**） |
| `onReasoning` :193 | 直发主流 | 前置 `if (relaySubagentContentChunk(panel, "think", r)) return` |
| `onToolCall` :236 | 直发主流 | 前置 `if (relaySubagentContentChunk(panel, "toolCall", n, a)) return` |
| `onToolOutput` :244 | 直发主流 | 前置 `if (relaySubagentContentChunk(panel, "toolOutput", n, chunk)) return` |

**逐面等价论证**（对照原 VSC 呈现 + CLI 口径；原 VSC 源 = `_retired…/subagent-run.mjs:97-121`）：

| 面 | 现核到端数据 | 路由产物（toolPanel 载荷） | 对照 |
|---|---|---|---|
| text | `onToken("role#N/t")` | `{kind:"text", text:t, sub?}` | 原 `panel({kind:"text",text})`——**逐字段同形** |
| think | `onReasoning("role#N/t")` | `{kind:"think", text:t, sub?}` | 原 `panel({kind:"think",text})`——逐字段同形 |
| tool 调用行 | `onToolCall("role#N/tool", args)` | `{kind:"tool", text: tool+空格+argsJson≤120, tool, cmd?, sub?}` | 原 :100-107 同构（名字→tool、cmd 提取、≤120） |
| tool 输出行 | `onToolOutput("role#N/tool", chunk)` | `{kind:"tool", text:chunk 文本, sub?}` | 旧 VSC 无此路（未接线）；**新核等效面** = CLI `routeSubToolOutput`（`tui/subagent-blocks.mjs:339-357` 追加工具行）+ 核 kind-preserving relay 同形（`advisor-async.mjs:238`） |

**`⟦ev⟧` 生命周期面零回归论证**：① 次序 = 事件面先吃（`relaySubagentEventToken` :38-83 不改——`⟦ev⟧*` / `[model]` 全量在内容面之前 return）；② 未知 `⟦ev⟧` 兜底静默消费策略不变（:81）；③ 现有 ⑬ 用例（`test/chat-panel-messages.test.mjs:385-419`）零断言行改动；④ `subagent` / `subagentApproval` 状态族（:206-209）与本修零交集。

**分片边界安全（判据④）**：前缀 = 核生成侧逐 chunk 重加（`spawn-child.mjs:135` onToken 先 strip 哨兵再加前缀；:138/:141/:144 同）——**每个 chunk 自带完整前缀（含嵌套链 `a#1/b#2/`）**；端侧逐 chunk 独立解析 → 无 carry-over、无重组、无半前缀（前缀非模型输出，切分不产生残片）。

#### （四）反证面（硬项——修前必红）

- **测试落点**：新档 `thincoder-vscode/test/subagent-content-relay.test.mjs`（host 面直驱；登记 `test/files.mjs` 清单——新增测试必修）。手法 = `buildPanelCallbacks(stubPanel, {})` 真函数直驱 + 桩 panel 捕 postMessage（先例 = `test/chat-panel-messages.test.mjs:385-389` 直取 `relaySubagentEventToken`）。
- **用例表**（正常 / 边界 / 错误——输入 / 预期输出）：

| # | 类型 | 输入 | 预期输出（机判断言） |
|---|---|---|---|
| T1 | 正常·四路分流 | 依次注入 `onToken("eng-coder#2/hello")` · `onReasoning("eng-coder#2/think")` · `onToolCall("eng-coder#2/read", {path:"x.mjs"})` · `onToolOutput("eng-coder#2/read", "out")` | 恰 4 条 `{type:"toolPanel", name:"sub:eng-coder#2"}`：kind = text / think / tool / tool；tool 行含 `tool:"read"`；text 逐字段——**修前必红**（今态 = 4 条主流消息） |
| T2 | 正常·主流零命中（反向） | 同 T1 注入后全量扫 `posted` | 类型 ∈ {token, reasoning, toolCall, toolOutput} 且载荷含 `eng-coder#2` 者 = **0 条** |
| T3 | 边界·嵌套子标 | `onToken("eng-coder#2/explore#1/act")` | 载荷 `name:"sub:eng-coder#2"` + `sub:"explore#1"`（D-M8 形态） |
| T4 | 边界·无前缀零误改（正控） | `onToken("plain")` · `onReasoning("r")` · `onToolCall("read", {…})` | 原样主流消息（分流不越界） |
| T5 | 错误/回归·事件面不变 | `relaySubagentEventToken(p, "eng-coder#5/hello chunk") === false`；`⟦ev⟧queued…` 形态 === true 且出 `{type:"subagent"}` | 事件面零改 |

- **修前必红 + 原样记录要求**：① 测试先落（含 files.mjs 登记）；② 修前跑 `node --test test/subagent-content-relay.test.mjs` → **必红**（今态 4 条主流消息，T1/T2 断言失败）——失败输出**逐字**记入 §5；③ 落修复；④ 单档复跑绿；⑤ 全链复跑（见（七）命令集）。
- **mock provider 兼容性**：本用例零 provider 依赖（纯回调注入）——集成链（`test/integration/scenario-*` mock-llm）保持全绿即证兼容。

#### （五）同族三面清点（修 / 登记各有判据）

| 面 | 现核发点（前缀） | 本修后 | 判据与结论 |
|---|---|---|---|
| escalate | `escalate#N/`（`escalate-async.mjs:158` · sync `subagent-actions.mjs:386`） | 内容分流入 `sub:escalate#N` 块（首内容 chunk 出生）；终态冻结经 `blockNamesFor` 宽松键匹配（`webview/activity.js:53-62`） | **内容面随本修恢复**；残余 = 频道语法（webview 认旧形态 `sub:escalate <label> #N`——`activity.js:46`；现核不产该形态 ⇒ role=null、头标语义缺）⇒ **登记**（语法收正 = webview 面 + 角色枚举/头标语义面，超「单点端修」半径；判据 = 内容与终态可用、旧形态在现核零生产者） |
| consult | `consult#N/`（`consult.mjs:292`） | 同上（`sub:consult#N`） | 同上——**登记** |
| advisor | `advisor#N/`（`advisor-async.mjs:230-241`；⟦ev⟧async+[model] `:299-300`） | `sub:advisor#N` ✓ 语法匹配（`activity.js:44` enum 含 advisor · `FAMILY_ROLES` 含 advisor——建块门 `:284` 放行） | **完整恢复（零残余）** |
| （附）sync advisor 工具流 | 旧 = `onToolPanel("advisor", chunk)`（`retired :277`）+ webview `advisorChunk`（`chat.js:294`）；现核零生产者 | 内容经工具卡（`onToolOutput` name="advisor"）承载 | **观察项**（第 4 接收面——形态差非内容丢）；另批候选，父侧裁（（十一）#2） |

#### （六）文档收正（哪模块收正哪模块档）

> 时点 = **实施轮随批**（07:08 裁定「改到哪模块收正哪模块的档」）；本设计轮不预写实施态。权威活档 = `docs/vsc/design/**`（基准层）；产品树 `thincoder-vscode/docs/design/**` = 迁移期参照历史（D-C14——零触碰）。验收回指 = （八）AC7。

| # | 模块面 | 权威档 | 收正内容 |
|---|---|---|---|
| 1 | 端壳内容中继面（`panel-callbacks.mjs`） | `docs/vsc/design/WEBVIEW.md` §5（投递链节） | 增「内容面投递」：子代内容 chunk 四路经 relay 前缀文法端侧分流 → `sub:<role>#<id>`（含嵌套子标）；事件面 / 内容面次序；+ §10 回指行 + 变更记录行 |
| 2 | 协议面（`toolPanel` 生产者） | `docs/vsc/design/WEBVIEW-PROTOCOL.md` §2 `:49` toolPanel 行 / §7 `:82` 演进表行 | 生产者补记（事件中继 + 内容中继双源；payload 字段零变）；变更记录行 |
| 3 | 核侧接线登记 | `docs/core/design/AGENT-LOOP.md` §6.18 `:396`（W15 行） | 同格内补内容面一句（坐标/状态行——核契约零改）；变更记录行。**顺带**：该行 `:391`/`:393` 引 `docs/vsc/design/WEBVIEW.md` §7.4/§14 = 迁移前旧节号（现档 262 行无该节）——收正该行时一并改指现节（§5/§10）或登记（见（十）#6） |
| 4 | 记录 | 本档 §5 | 收正读数（逐档 diff + 机检） |

#### （七）受影响文件全清单（R24a · as-of 2026-09-16 实核 · `split("\n").length` 口径）+ 执行宿主

| # | 档 | 现值 | 预计增量 | 超线判断 / 备注 |
|---|---|---|---|---|
| 1 | `thincoder-vscode/src/extension/panel-callbacks.mjs` | 283 | +50~65（→ ~335–350） | **超 300 软线（advisory）**；远低于 500 硬限——不需拆分（评审若要求收敛：备选 = 分流函数并入 `panel-toolpanel.mjs`（23 行）+ 调用点 re-export） |
| 2 | `thincoder-vscode/test/subagent-content-relay.test.mjs`（新建） | 0 | ~100–120 | 新档 <500 ✓ |
| 3 | `thincoder-vscode/test/files.mjs` | 81 | +1 | 清单登记（新增测试必修） |
| 4 | `thincoder-vscode/test/chat-panel-messages.test.mjs` | 420 | ±3（⑬ `:402-405` 注释语义收正——零断言行） | <500 ✓ |
| 5 | `docs/vsc/design/WEBVIEW.md`（实施轮） | 262 | +8~14 | 文档档（非代码行限） |
| 6 | `docs/vsc/design/WEBVIEW-PROTOCOL.md`（实施轮） | 271 | ±6 | 同上 |
| 7 | `docs/core/design/AGENT-LOOP.md`（实施轮） | 506 | ±4 | 同上 |

**零触碰**：`thincoder-core/**`（核零改——判据①）· `thincoder-vscode/webview/**`（接收面已活——§1③）· `src/extension/panel-messages.mjs`（530——不动）· `panel-toolpanel.mjs`（23——白名单已备）· `src/agent/setup.mjs`（**645**——本批零触碰；>500 硬限债务在册（台账条目），非本批受影响面）· 台账 `docs/TODO.md` · 他批批次档。

**执行宿主 = CLI**（修复面全在仓库文件内）。复跑命令：

- 单档红灯（修前必红）：`thincoder-vscode` 目录 → `node --test test/subagent-content-relay.test.mjs`；
- 端侧链：`npm test`（快层）· `npm run test:full` · `npm run test:integration` · `npm run lint` · `npm run doc:check`（strict——域 = thincoder-vscode）；
- 仓根三闸：`d:/teamcode/thincoder` → `node scripts/doc-anchors.mjs` · `node scripts/check-doc-width.mjs` · `node scripts/check-ledger.mjs`（exit 0）；
- 面板态人工复核 = **用户 reload 项**（不改文件）。

#### （八）验收判据（逐条可机判 · 回指条目）

| # | 判据 | 机判 | 回指 |
|---|---|---|---|
| AC1 | 四路内容分流（含嵌套子标） | T1 / T3 绿 | E1 · F-W1 |
| AC2 | 反向 = 前缀 chunk 主流零命中 | T2 绿 | E2 · §1.6-2 |
| AC3 | 事件 / 生命周期面零回归 | T5 + ⑬ 组 + `⟦ev⟧` 族既有用例全绿（chat-panel-messages ⑫⑬ · async-parity · digest-visibility · activity-flow 族） | E2 |
| AC4 | 端侧测试链 + 三闸全绿 | （七）命令集 exit 0 | E2 · N-W5 |
| AC5 | 修前必红原样记录 | §5 含失败输出逐字与时点 | E2 |
| AC6 | 同族三面清点在案 | 本 §2（五） | E3 · §1.6-3 |
| AC7 | 文档收正落位 | （六）3 档收正 diff + `doc:check` 0 悬空 | E4 · §1.6-4 |

#### （九）边界（本批不做——承 §1.7 三条 + 展开）

1. 不重开前序批（spawn-fix / tool-table-dup / reasoning-echo）——本批 = 同链第四处、独立建批。
2. 不改台账 / 不动他批批次档；勘察发现的越批项（（十））只登记、不代改。
3. 机制缝约不变：核内零端概念；不新增回调名（B 否决）；relay 前缀单源不绕开。
4. **webview / 协议零改**：`sub:` 频道名、`toolPanel` 载荷字段、webview 渲染与块语义零触碰（「只增不改」纪律——D-W11）；consult / escalate 频道语法残余（（五））不做收正。
5. UI / 交互决策 = **零新增**（呈现恢复为既有语义：text / think / tool 行入块）；`open` 面 2 项且均已裁定：① 工具输出行的状态词尾随 = 既有 `noteChunk` legacy 尾句路径（非新增语义）——如 UX 要稳定态词 ⇒ 另议；② 前缀误伤面 = 接受（CLI 同规——重评入口 = 单函数）。
6. 不 commit / 不发起评审（设计轮后由父侧定）。

#### （十）发现（逐条 · 不静默）

| # | 发现 | 处置 |
|---|---|---|
| 1 | §1.5 候选 A 第四路措辞（`onToolResult`）与实码不符——实为 `onToolOutput` | 本 §2 按实码落（（一）#6）；§1 不改（父侧可注） |
| 2 | 旧 VSC「→ 工具结果行」在现核无生产者（child `onToolResult` 未接线；CLI 口径同无） | 本批不恢复（D-4）——登记；若要恢复 ⇒ 核侧面另批 |
| 3 | sync advisor 工具流接收面（`webview/chat.js:294` `advisorChunk`）自 W13 无生产者（第 4 接收面——内容未丢，经工具卡承载） | 观察项——父侧裁是否另批（（十一）#2） |
| 4 | `test/chat-panel-messages.test.mjs:402-405` ⑬ 注释「原样转发」语义滞后（分流后由内容面接管） | 随本批**注释收正**（零断言行） |
| 5 | `src/agent/setup.mjs` 现值 645 行 vs 台账条目读数 683（2026-09-15）——读数差 38 | 非本批面 ⇒ 父侧核（台账读数刷新） |
| 6 | `docs/core/design/AGENT-LOOP.md:391/:393` 引 `docs/vsc/design/WEBVIEW.md` §7.4/§14 = 迁移前旧节号（现档无该节） | 见（六）#3——收正该行时一并处置 |
| 7 | 前缀误伤面（父级正文恰以 `[\w-]+#\d+/` 起始——如「issue#123/」）与 CLI 同象 | 接受（（二）裁定）；登记以免复发争议 |

#### （十一）未决（真判不准 / 需人裁——一律打回主 agent）

1. **文档收正落点 vs 本席获授写域**：获授 = 本记录 + `thincoder-vscode/docs/design/**`（现值 = 迁移期参照历史·不维护）+ `docs/core/design/AGENT-LOOP.md`；而权威活档 = `docs/vsc/design/{WEBVIEW,WEBVIEW-PROTOCOL}.md`（不在获授面）。本判 = 实施轮随批收正（（六）已点名 3 档）——请父侧确认实施轮 file 域含 `docs/vsc/design/**`；若要求设计轮预写 ⇒ 扩写域或另派。
2. sync advisor 接收面（（十）#3）——修 / 另批 / 保持观察，请裁。
3. 前缀误伤面若要求守卫（role 白名单）⇒ 端差代价已知（VSC 严于 CLI）——本判 = 不守；请裁。

**设计轮自检**：需求两层（台账条目 + F-W1）具体到可设计 ✓ · 受影响文件全清单 + 行数（R24a）✓ · 验收逐条回指（八）✓ · UI / 交互决策全落档（（九）5）✓ · 方案对比（A/B/C）✓ · 反证面（硬项）✓ · 同族清点（五）✓ · 文档收正计划（六）✓。

**读数与补记（同轮 · 首版后置 · 零语义）**

- 三闸 + doc:check as-of 2026-09-16（设计轮自跑）：
  ① 宽度闸 **OK**（414 档全扫 · 含本档——无 >300 字符单行；一致性 V1/V2/V3 新增 0 条）；
  ② 台账闸 **OK**（0 处违规 · 基线 0）；
  ③ doc-anchors **域一（根域 · 125 档）0 悬空 ✓**；**域二（CLI 树参照历史 · 99 档）存量 37 悬空**——全为 W6/W12/W14 删除面残留（`src/compact.mjs` · `src/advisor/provider.mjs` · `src/agent-tools/subagent-escalate-async.mjs` 等），非本批写面；
  ④ VSC 域 `doc:check`（strict）= **PASS**（命中 0）。
- **（八）AC4 判据细化**：三闸判据 = **本批零新增**（域一保持 0 悬空；域二读数不高于开工基线 **37**；宽度 / 台账闸维持 OK）——域二存量清理归文档维护批。
- **（十）补记 #8**：doc-anchors 域二存量 37（W13/W15 曾记 1——现 37：W13–W17 删档后增长）——父侧留意（消解路径 = 参照历史档锚注记批）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 验收判据 · 需求覆盖 | 🟡 | （五）escalate/consult 两行断言「内容面随本修恢复」、判据 = 「内容与终态可用」（本档 :187 · :188），但 ① T 列表（:172-178）零 escalate/consult 用例 ⇒ AC6 只判「在案」，该断言无机判支撑；② 同行自述 role=null、头标语义缺（:187）；③ 在案档记「前置不满足：role 不明 / 非 family（consult · escalate）⇒ 不补（no-op）」（WEBVIEW.md:120）——「终态可用」对 never-born 块不成立 | 二选一：① 补一条机判用例（注入 `escalate#2/out` ⇒ 断言出 `name:"sub:escalate#2"` 的 toolPanel，或至少断言分流发生）；② 收窄措辞为「内容到达（角色/头标语义缺 · 终态补桩按 WEBVIEW.md:120 不覆盖）——待另批」，并在 §4 批准轮把该用户可见残余明示给用户 |
| 2 | 文档一致性（同档两段） | 🟡 | §1.5 候选 A 把第四路写为 `onToolResult`（:51），§2（一）#6 与（十）#1 改按实码 `onToolOutput`（:95 · :249）——同档两段对同一机制命名不一 | 判定：文内已显式登记并给出裁定源（实码为准）⇒ 非未决双源，按 R1 报 🟡 交父侧注记——在 §1.5 该行补「第四路实码 = `onToolOutput`（见 §2（一）#6）」即消解（设计轮无权改 §1——一段一作者） |
| 3 | 清晰度 · 单点原则 | 🟡 | §1.2③ 自述 `panel-callbacks.mjs:245` 已有 `onToolPanel` 处理器（「webview `toolPanel` → `sub:*` 频道」），而（三）新建 `relaySubagentContentChunk` 直接 `panel._panel?.webview.postMessage(...)`（:140）——设计未说明二者关系（复用 / 并存 / 职责区分） | 在（三）点明：新函数是否复用该既有发射缝；若并存，说明为何不共用，并确保 `toolPanelPayload` 仍是唯一载荷构造点（WEBVIEW-PROTOCOL.md:71 三落点纪律） |
| 4 | 验收可判性 · 口径对齐 | 🟡 | T2 以「类型 ∈ {token, reasoning, toolCall, toolOutput}」作反向断言（:175），但协议档记工具回传消息名为 `toolResult`（WEBVIEW-PROTOCOL.md:18 · :37），`toolOutput` 不在该档消息族；WEBVIEW.md:255 则列 `toolCall`/`toolOutput`/`toolResult` 三面 ⇒ 实际发射名未钉死时 T2 有按名空过风险。附：协议档 `cmd`（参数摘要 ≤60——WEBVIEW-PROTOCOL.md:49）由哪层保证未明，而新构造点透传原命令串（:134） | ① 在设计里钉死实际发射的类型名，或把 T2 改为按载荷内容全量扫（不限类型名）——消空过风险；② 注明 `cmd ≤60` 的落层（桥 / 渲染），使（六）#2 收正后协议档口径一致 |
| 5 | 范围协调（R5） | 🟡 | （十一）三项待父侧裁：① 实施轮 file 域是否含 `docs/vsc/design/**`——AC7 与（六）三档收正依赖此项（:259）；② sync advisor 第 4 接收面处置（:260）；③ 前缀误伤是否加守卫（:261）——非缺陷，属协调项 | 父侧在 §4 / 实施轮前落定 ①（否则 AC7 悬空）；②③ 可随 §4 一并裁并登记去向 |
| 6 | 引用纪律（指针） | 🔵 | （六）#2 把 `WEBVIEW-PROTOCOL.md` 的 `:82` 记为「§7 演进表行」（:199）——`:82` 实为 **§3.2 协议增量登记**表第 3 行（:76-85）；§7 = 关键决策记录（:201 起），其中无 `:82` | 收正时把节标改为 §3.2（行锚 `:82` 正确，可不动） |
| 7 | R24a / 体量 | 🔵 | ① `panel-callbacks.mjs` 本批后 ~335–350 行 ⇒ 超 300 软线（已附备选：分流函数并入 `panel-toolpanel.mjs`——:207）；软线为 advisory、远低于 500 硬限，无须拆分；② `AGENT-LOOP.md` 自读 506 行 = **超 500 硬限 +6**（AGENT-LOOP.md:467——拆分候选待裁定在案），本批（六）#3 拟再增行（:200 · :213） | ① 父侧在 §4 确认取软线或落备选拆分（两者皆合规）；② 硬限债按 R3 只在案、不由本批重裁——建议（六）#3 收正句内带「本档增行 +N 后读数」，避免读数再漂移 |
| 8 | 测试面（可选加锁） | 🔵 | 零回归论证依赖「事件面先吃、内容面后判」次序（:163），但 T 列表无两条交界用例：① 带前缀的 `⟦ev⟧` 事件 token（AGENT-LOOP.md:396 在案「嵌套 relay 前缀（孙代事件）按 head 折叠」为该面既有行为）；② 已接受的误伤形态（父级正文 `issue#123/…` ⇒ 被分流——:242 · :255） | 各加 1 条（可标 optional）：① 前缀事件 token ⇒ 仍出 `{type:"subagent"}` 且不入块内容；② 误伤形态 ⇒ 锁定为「已知接受」，日后收严文法即成显式改动 |
| 9 | 验证限制（本轮） | 🔵 | 评审域 = 声明四档（代码未读）⇒ 代码/测试侧数值与（一）#1–#9 读数本轮一律 `unverified`：`panel-callbacks.mjs` 283 · `test/files.mjs` 81 · `chat-panel-messages.test.mjs` 420 · 新档 0 · `setup.mjs` 645。已核项：WEBVIEW.md **262** ✓（= 其 §9 自读数）· WEBVIEW-PROTOCOL.md **271** ✓ · AGENT-LOOP.md **506** ✓（= 其 §9 自读数 as-of 2026-09-16）· 锚点 `:49` / `:82` / `:391` / `:393` / `:396` 逐处命中 ✓。另：AC3 所列 `async-parity`（:230）未在两档在案资产清单出现（WEBVIEW.md:253-254 · WEBVIEW-PROTOCOL.md:265——两档自述「用例表归测试层」，故不必然为错）。本轮另观察：AGENT-LOOP.md §9 自读数在两次读取间由 493 行变为 506 行，提示该档评审期间被并发改动 | 开工前抽核代码侧 4 个 R24a 数值与 `async-parity` 档名、并重锚 AGENT-LOOP.md 行号；若要求本轮即核 ⇒ 需扩大评审域（现声明域不含代码） |

计数：🔴 0 · 🟡 5 · 🔵 4（共 9 条）

VERDICT: pass

## §4 用户批准（主 agent）

## §5 实施记录（eng-coder）

### 实施轮（2026-09-16 · eng-coder · 提交 sha `2c6b17f2`）

**落修文件（7 档——6 档入单笔提交 · 1 档未提交〔见未落项〕）**：

| # | 档 | 变更 |
|---|---|---|
| 1 | `thincoder-vscode/src/extension/panel-callbacks.mjs` | 283 → **331** 行：`+emitToolPanel`（发射单点）+ `relaySubagentContentChunk`（内容分流单点）+ 四路接线（onToken / onReasoning / onToolCall / onToolOutput）；`onToolPanel` 改走同一发射单点 |
| 2 | `thincoder-vscode/test/subagent-content-relay.test.mjs`（新建） | 144 行——T1–T7（块内命中 / 主流零命中 / 嵌套子标 / 无前缀正控 / 事件面零回归 / escalate·consult / 误伤锁定） |
| 3 | `thincoder-vscode/test/files.mjs` | +1 登记行（新档入册——N-W5「档名在册」） |
| 4 | `thincoder-vscode/test/chat-panel-messages.test.mjs` | ⑬ `:402-404` 注释语义收正（零断言行；`:407` 断言原文保留） |
| 5 | `docs/vsc/design/WEBVIEW.md` | 262 → 269 行（§5.3 增「内容面投递」+ §10 增行 6〔机检面顺延 7〕+ §9 读数 + 变更记录） |
| 6 | `docs/vsc/design/WEBVIEW-PROTOCOL.md` | 271 → 272 行（§3 `toolPanel` 行生产者双源 + `cmd` 落层；§3.1 发射端现体；§3.2 #3 发射点；§10 读数；变更记录） |
| 7 | `docs/core/design/AGENT-LOOP.md` | 507 → 509 行（§6.18 W15 行 ⑤ 内容中继 + `:391`/`:393` 旧节号收正 + §9 读数〔含「增行 +2 后读数」〕+ 变更记录）——**未入提交**（同档携并行批未提交改动——提交归属父侧） |

**⓪ 基线读数（开工抽核——§2（七）R24a / §3 🔵#9 差异如实登记）**：

- 相符：`panel-callbacks.mjs` 283 ✓ · `chat-panel-messages.test.mjs` 420 ✓ · `panel-toolpanel.mjs` 23 ✓ · `panel-messages.mjs` 530 ✓ · `WEBVIEW.md` 262 ✓ · `WEBVIEW-PROTOCOL.md` 271 ✓ · `test/async-parity.test.mjs` 档名存在 ✓。
- **差异 2 处**：① `test/files.mjs` 实测 **82**（§2 记 81——`split("\n").length` 口径差 1）；② `AGENT-LOOP.md` 实测 **507**（§2 记 506——§3 评审 🔵#9 已观察该档读数漂移；差 = 并行批设计轮新增行）。

**反证面（修前必红——原样记录）**：

- 手法 = 测试先落（新档 + `files.mjs` 登记）→ **修前**直跑今态（未改代码）→ 落修 → 复跑绿；红灯原件 = `.thincoder/tmp/red-run.log`（2026-09-16 **00:57**）。
- 命令：`cd thincoder-vscode && node --test test/subagent-content-relay.test.mjs`（exit 1）。
- 汇总逐字：`ℹ tests 7 · pass 2 · fail 5`；逐例：`✖ T1 (1.9153ms) · ✖ T2 (0.2559ms) · ✖ T3 (0.1607ms) · ✔ T4 (0.7346ms) · ✔ T5 (0.3654ms) · ✖ T6 (0.6039ms) · ✖ T7 (0.1654ms)`。

失败断言逐字（摘）：

```
✖ T1: AssertionError: 恰 4 条 toolPanel（修前 = 0——四条全落主流）  0 !== 4
✖ T2: AssertionError: 四型主流消息零在场（修前 = 4 条）  4 !== 0
✖ T3: TypeError: Cannot read properties of undefined (reading 'name')
✖ T6: AssertionError: + []  - [ 'sub:escalate#2', 'sub:consult#1' ]
✖ T7: TypeError: Cannot read properties of undefined (reading 'name')
```

**修复后复跑链（2026-09-16 00:58–01:02 · 长测试先落盘 `.thincoder/tmp/`）**：

| 命令 | 读数 |
|---|---|
| `node --test test/subagent-content-relay.test.mjs test/chat-panel-messages.test.mjs` | 16/16/0（新档 7 + ⑬ 组 9） |
| `npm test`（快层） | **560/525/0/35**（基线 553/518/0/35 **+7**）——首跑 slow 门报 1 条他档未归册超时（`edit-tool-improvement.test.mjs:222`，954.3ms——机器负载闪变）；复跑零拦截绿 |
| `npm run test:full` | **560/560/0**（基线 553/553/0 +7） |
| `npm run test:integration` | **34/34/0** |
| `npm run lint` | 195 档 OK（基线 194 + 新档 1） |
| `npm run doc:check`（strict） | V5 命中 0 |
| `thincoder-core` → `node --test` | 全绿（核零触碰回归，基线 191/191/0） |
| 仓根三闸 | 见下 |

**仓根三闸读数（本批零新增判据）**：

- `doc-anchors.mjs`：域一（根域 · 125 档 · 含 `docs/vsc/**` 本批写面）**悬空 0** ✓；域二（CLI 树参照历史 · 99 档）存量 **37**（= 开工基线，零新增）；exit 1 归域二存量。
- `check-doc-width.mjs`：**1 处**超宽 = `docs/batches/2026-09-16-subagent-reasoning-echo.md:228`（392 字符——**并行批** §3 评审落笔引入，非本批档；本批三档零命中）；一致性 V1/V2/V3 新增 0 条。
- `check-ledger.mjs`：**1 处** = `docs/TODO.md:57` 技术条目缺 `file:line` 证据形态（他批/父侧面——本批台账零触碰）。
- 结论：三闸「**本批零新增**」成立；上述 2 处红均为他批在飞面（归父侧收口处置）。

**决策透明表**：

| # | 决策 | 依据 / 取舍 |
|---|---|---|
| 1 | 发射单点 = 抽模块级 `emitToolPanel(panel, name, chunk)`，`onToolPanel` 与内容分流同调 | 父侧裁决①——模块级函数无法直呼闭包内处理器 ⇒ 走备选（抽单一发射函数）；全档 `toolPanelPayload(` 构造点恰 **1 处**（`:98`，审计实核） |
| 2 | 内容面发射走**直投** postMessage（与 `onToolPanel` 同缝），不入 `_wvOutbox` | 同裁决①（复用既有缝）；outbox = 出生事件族（§5.1.4），内容 chunk 非出生事件 |
| 3 | T2 双保险：实码发射类型名钉死（token / reasoning / toolCall / toolOutput——`:230`/`:234`/`:280`/`:291`）+ 载荷内容全量扫（不限类型名） | 父侧裁决②（防按名空过） |
| 4 | `cmd` ≤60 落层查明 = **webview 块头渲染**（`activity-view.js` `noteChunk` `:167-168`——超 60 截 59+…）；桥/生产者透传原串 | 父侧裁决②；已写入 `WEBVIEW-PROTOCOL.md` §3 行 |
| 5 | escalate 分流用例 T6 落地（consult 并入同例） | 父侧裁决③——（五）「内容面随本修恢复」获得机判支撑 |
| 6 | 🔵#8 两锁定落 T5（前缀 ⟦ev⟧ 仍出 `subagent`、零块内容）+ T7（`issue#123/…` 误伤 = 已知接受） | 父侧裁决④ |
| 7 | `AGENT-LOOP.md` 收正**落笔**（D5 冻结窗口已闭——并行批 §3 评审已落盘 = 在途下界已过，落笔前实核）——但**不入本笔提交** | 父侧裁决⑥（条件 = 写入被拒则跳过；实测未拒）+ 提交纪律「勿纳入他人未提交改动」（`--only` 为档粒度，纳入即两批混提） |
| 8 | 前缀守卫不加（与 CLI 同规）；sync advisor 第 4 接收面不作（父侧已登记·观察项） | 父侧裁决⑦ |

**实施 / 审计 / 评审轮次与终态**：

- **分歧审计**（explore 只读 · BLOCKING · **1 轮**）：DEVIATIONS **1 条** = PARTIAL「AC5 红灯原样记录未落档（本 §5 即其闭合动作）」；其余各面零分歧（无静默简化 · 单点构造恰 1 处 · OUT-OF-LIST 零越界〔实测 7 档 = 声明域〕· 与核 `wrapChildCallbacks` / CLI `routeSub*` 逐路对位）。
- **代码评审**（advisor type=code · sync · **1 轮**）：**VERDICT: pass（0🔴 · 3🟡 · 3🔵）**——🟡×3 = ① 331 行超 300 软线（advisory·设计已裁接受）② §4/§5/§6 落档态（本 §5 闭合其一）③ escalate/consult 残余未含 ⏹ 后果（转呈请项）；🔵×3 = toolOutput 逐 chunk 一行端差（登记）/ `onToolResult` 未接 = D-4 已登记 / 端到端用户复核项。**零 must-fix、零代码修正轮**。
- **终态 = `clean`**（无未决 🔴；3🟡 均裁定非 must-fix 并落档）。

**未落项 / 呈请项 / 观察项**：

1. **呈请项（提请 §4 明示用户）**：escalate / consult 残余 = ① 频道语法（webview 认旧形态 `sub:escalate <label> #N`）② **role=null ⇒ 无 ⏹ 停止控件**（`activity-view.js:139` 门 + `:14` 枚举）③ 非 family 不补桩（`WEBVIEW.md:120`）；webview 面零触碰（本批边界）⇒ 另批候选。
2. **未提交 1 档**：`docs/core/design/AGENT-LOOP.md`（本批收正已落盘 · 回读核对过；携并行批未提交改动 ⇒ 提交与混合 diff 归属父侧）。
3. **他批在飞面（非本批引入）**：宽度 1 处（`2026-09-16-subagent-reasoning-echo.md:228`）· 台账 1 处（`TODO.md:57`）· doc-anchors 域二存量 37。
4. **用户复核项**：reload 后面板态人工复核（子代理 text / think / tool 行回 `sub:` 块）——设计（七）既定人工项；结论建议落 §6。
5. **观察（登记备查）**：`slow` 门首跑对他档 `edit-tool-improvement.test.mjs:222` 闪变报点（954ms > 800ms 阈值；复跑零拦截）——与本批无关。

**补记（评审 🔵 处置 · 2026-09-16）**：

1. toolOutput 面逐 chunk 一行（vs CLI 追加同卡——`webview/ui.js:50-52` / `subagent-blocks.mjs:347-353`）= 呈现粒度端差，登记为**用户复核项**（webview 面另一批候选）。
2. 子代 `onToolResult` 未接分流 = D-4 已登记（现核零生产者——`spawn-child.mjs:131-148` 实核），非遗漏。
3. 端到端接收侧（webview 渲染）零本批机判 = 设计既定（用户 reload 项，见未落项 4）。

## §6 验证与收口（父代理）

### 6.1 实施与验证（父侧实核）

- 实施提交 `2c6b17f2`（`git show` 实核 = 6 档 / +215/−12）：`panel-callbacks.mjs` 283→331（单点发射 `emitToolPanel:97-99` · 新分流 `relaySubagentContentChunk:104-120` · 四路接线 `:229/:233/:279/:290` · `onToolPanel:293`）
  · 新测档 `test/subagent-content-relay.test.mjs`（144 行 T1–T7）· `test/files.mjs` 登记 · 文档收正 `WEBVIEW.md` 262→269 · `WEBVIEW-PROTOCOL.md` 271→272。
- **反证面（原样在案）**：修前必红 = `node --test test/subagent-content-relay.test.mjs` → **7 / 2 pass / 5 fail**（T1 `0 !== 4` · T2 `4 !== 0` · T3/T7 TypeError · T6 `[] vs ['sub:escalate#2','sub:consult#1']`；日志 `.thincoder/tmp/red-run.log` @00:57）⇒ 落修后全绿。
- 复跑链（实施笔读数）：新档+⑬ **16/16/0** · `npm test` **560/525/0/35** · `test:full` **560/560/0** · `test:integration` **34/34/0** · `lint` 195 档 OK · `doc:check` 命中 0 · 核 `node --test` 全绿 · 仓根三闸本批零新增。

### 6.2 评审与修正轮

- 代码评审（advisor · 1 轮）= **pass（0🔴 · 3🟡 · 3🔵）**，零 must-fix、零修正轮；审视分歧审计 1 轮（1 PARTIAL 已由 §5 闭合）。
- 评审发现处置：🟡 软线 331 = 取软线（R3 不重裁）· 🟡 §4/§6 = 本段落定 ✓ · 🟡 escalate/consult 残余 = §5 呈请项 ✓；🔵 三项 = 登记 / 设计既定（用户 reload 项）✓。

### 6.3 测试寿命处置

T1–T7 = **转 ② 长期资产（常驻快层）**——三条件全满足（业务可观察 = 子代理输出归块/主流零命中；集成未覆盖 = 分流面首测；可稳定驱动 = buildPanelCallbacks 直驱零网络）；不适用退役。

### 6.4 呈请项（明示用户——§4 面）

1. **escalate/consult 残余**：频道头标角色语义缺（role=null ⇒ 无 ⏹ 停止控件）+ 非 family 终态不补桩（`WEBVIEW.md:120`）——webview 面本批零触碰，修 = 另批候选（已在册）；
2. **修前旧会话不回填**：本修只影响新产物；既有旧块形态不变（预期、无须动作）。

### 6.5 收口行（核销同步清单）

- 台账：`docs/TODO.md` 技术待办「子代理内容面 chunk 通道无 host 侧生产者」→ `docs/TODO-archive.md` §四（已核销）；技术待办计数 9 → 8。
- 同批父侧收尾：`docs/core/design/AGENT-LOOP.md` 两批收正（本批 §6.18 `:391/:393` 旧节号 + ③ 批 §9/变更记录）随本收口提交入笔（实施笔因并行批同档而未纳——已如实登记）。
- 提交：实现 = `2c6b17f2`（单笔）；收口 = 本记录 + 台账两档 + `AGENT-LOOP.md`。
- 推送：两远端（gitee / github）；凭证：本批 designId 槽位终消费（链终）。

### 6.6 未落项（携带）

1. `toolOutput` 逐 chunk 一行 vs CLI 追加同卡 = 呈现粒度端差（§5 补记 #1——用户 reload 复核项）；
2. sync advisor 第 4 死接收面（`docs/TODO.md` 同区行——触发=条件）；
3. 用户面板态人工复核（reload 后子代理 text/think/tool 行回 `sub:` 块）。

### 6.7 结论

批终态 = clean（评审 pass · 反证闭环齐 · 全链绿 · 核零改缝约自持）。
