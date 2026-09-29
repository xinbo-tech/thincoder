/**
 * panel-subagent-relay.mjs — 子代理 → webview 投递面（自 `panel-callbacks.mjs` 拆出——VSC
 * 四档结构拆分批 2026-09-18 · 设计 `docs/vsc/design/VSC-DEBT.md` §12.2.3）。
 *
 * 迁出段（逐字搬迁 · 既有注释一并随迁）：relay 中继面（事件 token 转换 + 内容 chunk 分流 +
 * `emitToolPanel` 载荷单点）· 任务可见性族投递队列（`WV_OUTBOX_MAX` / `postSubagentEvent` /
 * `flushSubagentOutbox`）。
 * 留主档（`panel-callbacks.mjs`）= 回调装配面：`makeAskInPanel` / `statusTextPayload` /
 * `postDigestCap` / `buildPanelCallbacks`。
 *
 * ⚠ 1-hop 解析面（设计 §12.2.3 R-1–R-6 · 硬约束）：本档 = **持 RELAYS 登记行的档**
 * （行格式与既有两行同形、精确等值匹配——格式约定在档）成对约束：
 *   ① 本档裸标识符发射位（`postMessage(payload)`）= `postSubagentEvent` 与 `flushSubagentOutbox`
 *      两处（本档唯二）；
 *   ② 载荷字面量构造面**必须同档**（`relayLiterals` 只扫本档同名牌的调用点——注释内勿写
 *      「名 + 左括号」形态，lexer 亦扫之）：本档内构造调用点四处 = `relaySubagentEventToken`
 *      的 emit（`type: "subagent"`）+ 下方两转口 `postSubagentStatus` / `postSubagentApproval`
 *      + `emitToolPanel`（`type: "toolPanel"`——2026-09-19 批同口入队，字面量随行以保 §12 记账）。
 * 缺①或②任一 ⇒ 协议面记账缺行为（机器面已随测试退役——2026-09-28）；漏
 * `subagentApproval` 一半 ⇒ 分发表 `wrongDisp` 失配（表记 `活` ∕ 实得 `删`）。
 *
 * B7 2a（2026-09-29 · 批档 `docs/batches/2026-09-29-parity-b7-minor.md` §2.2.2 · R2 交接收口）：
 * 事件面 ∕ 内容构形面换接 **rc 单源**（`@thincoder/render-core/subblocks/relay.mjs`）——
 * `relayEventToSubPatch`（识别 ∕ 剥除 ∕ 映射 ∕ pending ∕ queued 缓存全表在 rc）+
 * `relaySubContentChunk`（内容构形 ∕ 前缀剥除 ∕ 四面 gate 全在 rc——desk ∕ VSC 双消费）。
 * per-panel relay 状态 = rc `createRelayScope()`（WeakMap 代原 `_relayAsyncPending` ∕
 * `_relayQueuedInfo` 双缓存——多面板互不串味语义不变）；`queuedInfoOf` 转口改 scope 形
 * （导出名 ∕ 形参形零改）。宿主分工（副作用留端）：`ev:substrip` 留痕经 rc `deps.onStripped`
 * （NFR-A2 保形）；`ev:subcontent` 收据 ∕ `noteContentFirst` ∕ `emitToolPanel` 两调用照旧。
 * 信封 ∕ outbox ∕ 留痕（`ev:subdeliver`）保形。
 *
 * 缝保持（KD-12）：`panel-callbacks.mjs` 按**既有导出名** re-export 本档导出件（六件 + #118 新增
 * `queuedInfoOf`）⇒ 消费档 import 面零改（`relaySubagentEventToken` 消费面：`panel-messages.mjs`
 * （`flushSubagentOutbox`）· `panel-messages-turn.mjs:24`（`cancelSubagent` 合成 callbacks——`:123`
 * 调用）· `suspension.mjs:38`（`queuedInfoOf`——重生投影 `:94` 调用））。
 * 依赖单向：本档零 import 主档（`panel-callbacks → panel-subagent-relay`——无环）。
 */
import { createRelayScope, relayEventToSubPatch, relayPathOf, relaySubContentChunk,
  queuedInfoOf as scopeQueuedInfoOf } from "@thincoder/render-core/subblocks/relay.mjs"
import { toolPanelPayload } from "./panel-toolpanel.mjs"
import { logEvent } from "@thincoder/core/log.mjs"

// ─── W15（2026-09-15 · R5「⏹ queued 等待头回收」+ W13 观察项收口）事件中继面 ───────────
// 核异步族（spawn/settle/cancel）经 `ctx.callbacks.onToken` 发 **relay 前缀 ⟦ev⟧ 事件 token**
// （TUI routeSubToken 消费面；`subagent-run.mjs:163` `⟦ev⟧async` · `subagent-scheduler.mjs:356`
// `⟦ev⟧queued` · `subagent-async.mjs:281` `⟦ev⟧cancelled` · `async-settle.mjs:239/273/275`
// `⟦ev⟧stopped/⟦ev⟧settled/⟦ev⟧done` · 核 `agent/turn-loop.mjs:77`（2026-09-29 拆分后重锚·父侧随动）子代 `⟦ev⟧turn`）。VSC 消费面 =
// `{type:"subagent", …}` 状态消息（webview `activity.js` `applySubagentStatus`）。
//
// `relaySubagentEventToken` = 转换单点：识别（relay 前缀 + ⟦ev⟧/[model] 形态）即**消费**
// （返回 true——不再以裸 token 文本泄漏）；未识别 → false（调用方原样转发）。两类调用面：
//   ① 面板 `onToken` 包装（buildPanelCallbacks）——运行期事件流；
//   ② ⏹/取消路径的合成 callbacks（panel-messages `cancelSubagent`——核 `executeCancelAction`
//      的 `⟦ev⟧cancelled` + `refreshQueuedTokens` 中继）。
// 映射表 ∕ pending 集 ∕ queued 缓存 ∕ 终态词 = rc 单源（B7 2a 换接）：`⟦ev⟧async` → 记 pending
// （started 载荷 pool:true 判定）；尾随 `[model]` → `started` 载荷（model 入块头）；pending /
// queued 挂 per-panel scope（多面板互不串味）。

/** per-panel relay 状态（rc `createRelayScope()`——`pendingAsync`：`⟦ev⟧async` 已见、待
 *  `[model]` 出生；`queued`：queued 四项缓存。WeakMap 代原双缓存（#118 R1 载体同款：
 *  panel 弱映射；多面板互不串味语义不变）。键 = relay 前缀 head；清点 = started /
 *  cancelled / 终态分支（排队信息作废）；缓存缺省 = 降级态。 */
const _relayScopes = new WeakMap() // panel → scope
function relayScopeOf(panel) {
  let scope = _relayScopes.get(panel)
  if (!scope) { scope = createRelayScope(); _relayScopes.set(panel, scope) }
  return scope
}

/** queued 缓存读点（#118 R1/R2——重生投影载荷**同形单源**：`suspension.mjs` `reassertLiveChildren`
 *  的 queued 行四项取自本缓存）。未消费过该键的 queued token ⇒ null（降级态）。
 *  B7 2a：转口 rc（per-panel scope 形——导出名 ∕ 形参形零改；消费面 import 行零改）。 */
export function queuedInfoOf(panel, key) { return scopeQueuedInfoOf(relayScopeOf(panel), key) }

/** X10（显示面消差批 §2.10.5 #4）：sync 块 ⏹ 门控**事实**——核 sync registry
 *  `agent._syncChildAborts`（核写点 `subagent.mjs` `armSyncChildAbort`；键 = relay 前缀去尾 `role#id`）
 *  **只读**消费（禁第二套 registry——§2.7 边界）。谓词与 ⏹ 路由（`panel-messages-turn.mjs`
 *  cancelSubagent 面）及 CLI 门控逐字同源（`thincoder-cli/src/tui/subagent-panel.mjs:123`：
 *  `state._agent?._syncChildAborts?.has(sub.key) === true`）。registry 不可达（无面板 agent /
 *  headless / 面板 agent 未绑定窗口）⇒ false——**不伪造可中止**（可见但不可中止违 D-M7）。 */
function syncLiveOf(panel, key) {
  return panel?._agent?._syncChildAborts?.has(key) === true
}

/** 事件 token → webview 活动区状态消息（映射单源 = rc `relayEventToSubPatch`）。识别返回 true
 *  （不再以裸 token 文本泄漏）；未知形态（非本面）返回 false。逐支语义（queued / cancelled /
 *  stopped / settled / done / turn / async+[model]/ 嵌套剥除 / 表外 ⟦ev⟧）见 rc 件映射表。
 *  消费判定保形（= 换接前 true 分支合集：path 存在 ∧ `rest` 起于 `⟦ev⟧`／`[model]`）——rc 返回
 *  `null` 双义（「本面已消费、无 patch」∕「非本面」）⇒ 以同形复核区分；rc 载荷重组为旧信封
 *  `{ type: "subagent", role, id, …载荷 }`（键序逐字同——行为对拍面零差）。 */
export function relaySubagentEventToken(panel, tok) {
  const text = String(tok ?? "")
  if (!text.includes("⟦ev⟧") && !text.includes("[model]")) return false
  const patch = relayEventToSubPatch(text, relayScopeOf(panel), {
    // X10：sync 出生面事实（端 registry 只读采样——rc 不可算）；NFR-A2 留痕（`ev:substrip`——
    // 嵌套剥除不路由，独立事件名保形）。
    syncLiveOf: (head) => syncLiveOf(panel, head),
    onStripped: (info) => logEvent("ev:substrip", info),
  })
  if (patch !== null) {
    const { role, id, ...payload } = patch
    postSubagentEvent(panel, { type: "subagent", role, id, ...payload })
    return true // 识别即消费
  }
  // null 复核：`rest` 起于事件字面 ⇒ 本面已消费（剥除 ∕ async / 表外 ⟦ev⟧——不得泄漏）；
  // 否则非事件面（`rest` 为内容文本——含字面形态的内层内容 chunk 仍走内容面——T-N6 锁语义）。
  const path = relayPathOf(text)
  return path !== null && (path.rest.startsWith("⟦ev⟧") || path.rest.startsWith("[model]"))
}

// ─── W15 内容中继面（2026-09-16 子代理面板通道恢复批——子代理内容回流 `sub:` 块）────────
// 核迁移版子代回调（`wrapChildCallbacks`——`thincoder-core/agent/spawn-child.mjs:131-148`）带
// relay 前缀（`role#id/`）到达端壳；事件面（`relaySubagentEventToken`）只吃 `⟦ev⟧`/`[model]`，
// 其余前缀 chunk（text / think / tool 调用行 / tool 输出行）原走主流 ⇒ 面板通道缺生产者
//（迁前端侧自持面丢失——子代理内容被塞进主会话流）。本面 = **内容分流单点**：前缀 chunk →
// `toolPanel` `sub:<role>#<id>` 载荷（webview `activity.js` 子代理块接收面；文法与 CLI
// `routeSub*` 同源——`thincoder-core/agent/relay-prefix.mjs`）。次序：事件面先吃、内容面后判
//（`onToken` 内——事件面 return 之后、主流 postMessage 之前）；前缀由核逐 chunk 重加 ⇒
// 端侧逐 chunk 独立解析（无跨 chunk 重组、无半前缀）。

/** `toolPanel` 载荷发射单点（`onToolPanel` 与 `relaySubagentContentChunk` 共用——§3.1 三落点②）：
 *  2026-09-19（⑤ · D-W28）由直投改**同口入队**（`postSubagentEvent`）；`type` 字面量随行——
 *  §12 机检 1-hop 记账面（载荷字段仍单源 = `toolPanelPayload`）。 */
export function emitToolPanel(panel, name, chunk) {
  postSubagentEvent(panel, { type: "toolPanel", ...toolPanelPayload(name, chunk) })
}

/** 子代内容 chunk 分流：relay 前缀（含嵌套链——D-M8 子标）→ 面板载荷；无前缀 ∕ 非四面 → false
 *  （调用方原样转发）。构形单源 = rc `relaySubContentChunk`（B7 2a——前缀剥除 ∕ 四面 gate
 *  （`text` ∕ `think` ∕ `toolCall` ∕ `toolOutput`；第五路 `toolResult` 死路——无产者证据链
 *  `WEBVIEW.md` §5.3）∕ chunk 形全在 rc 件）。宿主分工（副作用留端）：`ch` 由 chunk 重导
 *  （`role#id`——与 `path.head` 等价）；两宿主调用照旧——`noteContentFirst`（`ev:subcontent`
 *  正收据）+ `emitToolPanel`。**面随载荷**（`face`：CLI 以「哪个路由函数被调用」表达面，
 *  本端四面压成单 `toolPanel` 载荷 ⇒ 面必须随载荷）；工具面 chunk 携 `tool`（relay 前缀
 *  rest 逐字——与 CLI `fresh` 判据同源）。 */
export function relaySubagentContentChunk(panel, face, a, b) {
  const chunk = relaySubContentChunk(face, a, b)
  if (chunk === null) return false
  const ch = "sub:" + `${chunk.role}#${chunk.id}`
  noteContentFirst(panel, ch, face)
  emitToolPanel(panel, ch, chunk)
  return true
}

/** 面板 → 已实收频道集（`ev:subcontent` 去重载体——挂 panel 弱映射）。 */
const _subContentSeen = new WeakMap() // panel → Set<频道名>

/** 内容面正收据（§5.3——`logEvent("ev:subcontent", …)`，载荷 `{ ch, face }`）：每频道**首条**
 *  （该频道首条实收面）。**不并入** `ev:subdeliver` 五处置计数（评审 #11——T-A13 判据面零改）。 */
function noteContentFirst(panel, ch, face) {
  let seen = _subContentSeen.get(panel)
  if (!seen) { seen = new Set(); _subContentSeen.set(panel, seen) }
  if (seen.has(ch)) return
  seen.add(ch)
  logEvent("ev:subcontent", { ch, face })
}

// ─── 任务可见性族投递队列（2026-09-11 第 10 批——WEBVIEW.md §5.1.4 第 1 条）———
/** 队列上界（§5.1.4 第 1 条——溢出丢最旧 + 留痕）。 */
export const WV_OUTBOX_MAX = 200

/** 任务可见性族消息投递（subagent 族**唯一**入口——§5.1.4 第 1 条）：就绪（`_wvReady === true`）
 *  → 直投；否则入队（暗窗口零丢失——webviewReady 握手 flush 补发）+ 溢出丢最旧。返回是否直投。
 *  族边界：suspension.mjs `reclaimDigestedBlocks` 的 done 补发为**直投、不入队**（非出生事件）。
 *  2026-09-19（§5.3）：**五处置全记**（本节 `direct` / `enqueue` / `drop-overflow` + `flush` /
 *  `discard-dispose` 两外点）——载荷含 `ch`（频道名）· `status` · `wvReady`。 */
export function postSubagentEvent(panel, payload) {
  if (panel._wvReady === true) {
    panel._panel?.webview.postMessage(payload)
    deliverTrace(panel, "direct", payload)
    return true
  }
  const q = (panel._wvOutbox ??= [])
  q.push(payload)
  let dropped = 0
  while (q.length > WV_OUTBOX_MAX) { q.shift(); dropped++ }
  if (dropped > 0) panel._wvOutboxDropped = (panel._wvOutboxDropped ?? 0) + dropped
  deliverTrace(panel, "enqueue", payload, { queued: q.length })
  if (dropped > 0) deliverTrace(panel, "drop-overflow", payload, { dropped: panel._wvOutboxDropped ?? 0 })
  return false
}

/** 频道名派生 + 批量摘要（`ch` 留痕载荷——§5.3）：内容面 `name` / 事件面 `sub:<role>#<id>`；
 *  摘要去重（超长由 logEvent 截尾）。批量处置（`flush` / `discard-dispose`）用之。 */
export function subagentChannelOf(payload) {
  if (typeof payload?.name === "string") return payload.name
  return payload?.role != null && payload?.id != null ? `sub:${payload.role}#${payload.id}` : null
}

export function subagentChannelSummary(payloads) {
  return [...new Set(payloads.map(subagentChannelOf).filter(Boolean))].join(",")
}

/** 投递处置留痕载荷：`ch` = 内容面 `name` / 事件面 `sub:<role>#<id>`（频道名——§5.3）。 */
function deliverTrace(panel, action, payload, extra = {}) {
  logEvent("ev:subdeliver", { action, ch: subagentChannelOf(payload), status: payload?.status ?? null, wvReady: panel._wvReady === true, ...extra })
}

/** 就绪补发（§5.1.4 第 2 条——webviewReady case 两拍之一）：按入队序 flush + 出队计数留痕；
 *  丢弃计数归零（下一窗口重新计）。返回补发条数。 */
export function flushSubagentOutbox(panel) {
  const q = panel._wvOutbox
  if (!Array.isArray(q) || q.length === 0) return 0
  const flushed = q.splice(0)
  for (const payload of flushed) panel._panel?.webview.postMessage(payload)
  logEvent("ev:subdeliver", { action: "flush", ch: subagentChannelSummary(flushed), n: flushed.length, dropped: panel._wvOutboxDropped ?? 0, wvReady: panel._wvReady === true })
  panel._wvOutboxDropped = 0
  return flushed.length
}

// ─── 投递转口（本批新增 · 零语义——设计 §12.2.3 R-3/R-4）：字面量构造面随 relay 面同档 ────
/** 子代理状态投递转口（载荷构造逐字承原 `panel-callbacks.mjs` `onSubagent` 内联式；返回值
 *  原样回传——原调用点为表达式体箭头）。原调用点改委托（R-4）。 */
export function postSubagentStatus(panel, info) {
  return postSubagentEvent(panel, { type: "subagent", ...info })
}

/** 子代理审批态投递转口（载荷构造逐字承原 `panel-callbacks.mjs` `onSubagentApproval` 内联式
 *  ——AGENT-LOOP-SUBAGENT.md §6.7.6 C-8 child 权限通道 announce 块头通知；返回值原样回传）。原调用点改委托（R-4）。 */
export function postSubagentApproval(panel, info) {
  return postSubagentEvent(panel, { type: "subagentApproval", ...info })
}
