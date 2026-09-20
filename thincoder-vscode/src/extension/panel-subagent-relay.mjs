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
 * （`test/protocol-coverage.test.mjs:33`——行格式与既有两行同形、精确等值匹配）成对约束：
 *   ① 本档裸标识符发射位（`postMessage(payload)`）= `postSubagentEvent` 与 `flushSubagentOutbox`
 *      两处（本档唯二）；
 *   ② 载荷字面量构造面**必须同档**（`relayLiterals` 只扫本档同名牌的调用点——注释内勿写
 *      「名 + 左括号」形态，lexer 亦扫之）：本档内构造调用点四处 = `relaySubagentEventToken`
 *      的 `emit`（`type: "subagent"`）+ 下方两转口 `postSubagentStatus` / `postSubagentApproval`
 *      + `emitToolPanel`（`type: "toolPanel"`——2026-09-19 批同口入队，字面量随行以保 §12 记账）。
 * 缺①或②任一 ⇒ `protocol-coverage.test.mjs` fail-closed 红（`:178` / `:180`）；漏
 * `subagentApproval` 一半 ⇒ T-6 `wrongDisp` 红（表记 `活` ∕ 实得 `删`）。
 *
 * 缝保持（KD-12）：`panel-callbacks.mjs` 按**既有导出名** re-export 本档导出件（六件 + #118 新增
 * `queuedInfoOf`）⇒ 消费档 import 面零改（`relaySubagentEventToken` 消费面：`panel-messages.mjs:28`
 * 一行随本批 case 迁移收窄为 `flushSubagentOutbox`——真消费点 = `panel-messages-turn.mjs:25`；
 * `suspension.mjs:27` · 测试 2 档）。
 * 依赖单向：本档零 import 主档（`panel-callbacks → panel-subagent-relay`——无环）。
 */
import { toolPanelPayload } from "./panel-toolpanel.mjs"
import { logEvent } from "@thincoder/core/log.mjs"
// W15（R5 · 事件中继面）：核 relay 前缀解析（`role#id/` 文法单一权威——零依赖）。
import { parseRelayPath } from "@thincoder/core/agent/relay-prefix.mjs"

// ─── W15（2026-09-15 · R5「⏹ queued 等待头回收」+ W13 观察项收口）事件中继面 ───────────
// 核异步族（spawn/settle/cancel）经 `ctx.callbacks.onToken` 发 **relay 前缀 ⟦ev⟧ 事件 token**
// （TUI routeSubToken 消费面；`subagent-run.mjs:143` `⟦ev⟧async` · `subagent-scheduler.mjs:337`
// `⟦ev⟧queued` · `subagent-async.mjs:262` `⟦ev⟧cancelled` · `async-settle.mjs:228/262/264`
// `⟦ev⟧stopped/⟦ev⟧settled/⟦ev⟧done` · 核 `agent.mjs:207` 子代 `⟦ev⟧turn`）。VSC 消费面 =
// `{type:"subagent", …}` 状态消息（webview `activity.js` `applySubagentStatus`）——原 W12/W13
// 镜像删旧后该转换面缺失（事件以裸文本泄漏 / ⏹ queued 取消无等待头回收事件）。
//
// `relaySubagentEventToken` = 转换单点：识别（relay 前缀 + ⟦ev⟧/[model] 形态）即**消费**
// （返回 true——不再以裸 token 文本泄漏）；未识别 → false（调用方原样转发）。两类调用面：
//   ① 面板 `onToken` 包装（buildPanelCallbacks）——运行期事件流；
//   ② ⏹/取消路径的合成 callbacks（panel-messages `cancelSubagent`——核 `executeCancelAction`
//      的 `⟦ev⟧cancelled` + `refreshQueuedTokens` 中继）。
// `⟦ev⟧async` → 记 pending（started 载荷 pool:true 判定）；尾随 `[model]` → `started` 载荷
// （model 入块头）。pending 表挂 panel 弱映射（多面板互不串味）。
const _relayAsyncPending = new WeakMap() // panel → Set<`role#id`>
// #118（2026-09-20 一致性同步批 · R1）：queued 载荷四项（`kind` / `position` / `waiting` / `reason`）
// 的**每面板缓存**（载体同款：`WeakMap<panel, Map<`role#id`, info>>`）。理由：`kind` / `detail` 只
// 存在于一次性 token（池条目仅携 `position`），而 webview 重载后的存活投影（`suspension.mjs`
// `reassertLiveChildren`）必须与 live 中继面**同形**——否则重绘后排队头回落「槽满等位」。
// 键 = relay 前缀 head；清点 = started / cancelled / 终态分支（排队信息作废）；缓存缺省 = 降级态。
const _relayQueuedInfo = new WeakMap() // panel → Map<`role#id`, {kind, position, waiting, reason}>

/** queued 缓存写点（#118 R1——queued 消费点同点入缓存）。 */
function rememberQueued(panel, key, info) {
  let m = _relayQueuedInfo.get(panel)
  if (!m) { m = new Map(); _relayQueuedInfo.set(panel, m) }
  m.set(key, info)
}

/** queued 缓存删点（#118 R1——`started` / `cancelled` / 终态分支删该键：排队信息作废）。 */
function forgetQueued(panel, key) { _relayQueuedInfo.get(panel)?.delete(key) }

/** queued 缓存读点（#118 R1/R2——重生投影载荷**同形单源**：`suspension.mjs`
 *  `reassertLiveChildren` 的 queued 行四项取自本缓存）。未消费过该键的 queued token ⇒ null
 *  （降级态：重发仅 `position`——WEBVIEW.md §5.2 降级形）。 */
export function queuedInfoOf(panel, key) { return _relayQueuedInfo.get(panel)?.get(key) ?? null }

/** X10（显示面消差批 §2.10.5 #4）：sync 块 ⏹ 门控**事实**——核 sync registry
 *  `agent._syncChildAborts`（核写点 `subagent.mjs` `armSyncChildAbort`；键 = relay 前缀去尾 `role#id`）
 *  **只读**消费（禁第二套 registry——§2.7 边界）。谓词与 ⏹ 路由（`panel-messages-turn.mjs`
 *  cancelSubagent 面）及 CLI 门控逐字同源（`thincoder-cli/src/tui/subagent-panel.mjs:123`：
 *  `state._agent?._syncChildAborts?.has(sub.key) === true`）。registry 不可达（无面板 agent /
 *  headless / 面板 agent 未绑定窗口）⇒ false——**不伪造可中止**（可见但不可中止违 D-M7）。 */
function syncLiveOf(panel, key) {
  return panel?._agent?._syncChildAborts?.has(key) === true
}

/** 事件 token → webview 活动区状态消息（映射表：queued / cancelled / stopped / settled /
 *  done / turn / async+[model]）。识别返回 true；未知形态（非本面事件）返回 false。 */
export function relaySubagentEventToken(panel, tok) {
  const text = String(tok ?? "")
  if (!text.includes("⟦ev⟧") && !text.includes("[model]")) return false
  const path = parseRelayPath(text)
  if (!path) return false
  const hash = path.head.indexOf("#")
  const role = path.head.slice(0, hash)
  const id = Number(path.head.slice(hash + 1))
  const rest = path.rest
  const emit = (payload) => { postSubagentEvent(panel, { type: "subagent", role, id, ...payload }); return true }
  if (rest.startsWith("⟦ev⟧async")) {
    let set = _relayAsyncPending.get(panel)
    if (!set) { set = new Set(); _relayAsyncPending.set(panel, set) }
    set.add(path.head)
    return true // [model] 随行补发 started
  }
  if (rest.startsWith("[model]")) {
    const pool = _relayAsyncPending.get(panel)?.delete(path.head) === true
    forgetQueued(panel, path.head) // #118 R1：已启动 ⇒ 排队信息作废
    // X10：sync 出生面事实（pool=false 且 registry 命中 ⇒ `syncLive:true`）——async 块恒 false。
    return emit({ status: "started", pool, model: rest.slice("[model]".length) || null, startedAt: Date.now(), syncLive: !pool && syncLiveOf(panel, path.head) })
  }
  if (rest.startsWith("⟦ev⟧queued")) {
    // 载荷：⟦ev⟧queued \x1e kind \x1e position \x1e queued \x1e detail（subagent-scheduler 发射面）
    // #118 R1：`kind` 随载荷下行（此前解析即丢——显示面无法区分 slot / wait / depc）；同点四项入
    // 每面板缓存（重生投影 `reassertLiveChildren` 读——live 面与重绘面同形）。
    const parts = rest.split("\x1e")
    const kind = parts[1]
    const detail = parts.slice(4).join("\x1e")
    const info = {
      kind: kind ?? null,
      position: Number(parts[2]) || null,
      waiting: kind === "slot" ? null : (kind === "depc" ? "dependency-cancelled" : "waiting-deps"),
      reason: kind === "slot" ? null : (detail || null),
    }
    rememberQueued(panel, path.head, info)
    return emit({ status: "queued", ...info })
  }
  if (rest.startsWith("⟦ev⟧cancelled")) {
    // 核仅在 queued 取消路径发（subagent-async executeCancelAction——出队即终态）
    forgetQueued(panel, path.head) // #118 R1：出队即终态（cancelled(was:"queued")——头移除）
    return emit({ status: "cancelled", was: "queued" })
  }
  // #118 R1：终态分支同删缓存键（该键后世代的 queued 事件会重写缓存，陈旧项不得滞留）。
  // X6 收口（#134 ②）：`⟦ev⟧stopped` 第 4 位 = **恒定字面**原因词 `stopped`（核发射 `⟦ev⟧stopped\x1e0\x1e0\x1estopped\x1e`——`agent-tools/async-settle.mjs:239` / `agent-tools/subagent.mjs:364` 同形，无第二取值）
  // ⇒ 与冻结头 verb `stopped` 重复 ⇒ **零注记**（不传 `note`；CLI 标尺 = `subagent-blocks.mjs:263-273` 该分支不置 `lastError`）；注记面（done 停因 / interrupted）零影响。
  if (rest.startsWith("⟦ev⟧stopped")) { forgetQueued(panel, path.head); return emit({ status: "cancelled" }) }
  if (rest.startsWith("⟦ev⟧settled")) { forgetQueued(panel, path.head); return emit({ status: "settled" }) }
  if (rest.startsWith("⟦ev⟧done")) { forgetQueued(panel, path.head); return emit({ status: "done" }) }
  if (rest.startsWith("⟦ev⟧turn")) {
    const parts = rest.split("\x1e")
    return emit({ status: "turn", turn: Number(parts[1]) || 0, maxTurns: Number(parts[2]) || 0 })
  }
  if (rest.startsWith("⟦ev⟧")) return true // 其余核事件（approval 等——VSC 另有通道）：消费不泄漏
  return false
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

/** 子代内容 chunk 分流：relay 前缀（含嵌套链——D-M8 子标）→ 面板载荷。无前缀 → false（调用方
 *  原样转发）。face ∈ text / think / toolCall / toolOutput / toolResult（五路调用面；后两路 = 输出 /
 *  结果行——2026-09-19 批补第五路：首参工具名带 `role#id/` 形）。 */
export function relaySubagentContentChunk(panel, face, a, b) {
  const path = parseRelayPath(String(a ?? ""))
  if (!path) return false
  const sub = path.inner.length > 0 ? path.inner.join("/") : undefined // D-M8 嵌套子标
  let chunk
  if (face === "toolCall") {
    const argsJson = JSON.stringify(b) || ""
    chunk = { kind: "tool", text: `${path.rest} ${argsJson.slice(0, 120)}`, tool: path.rest,
      cmd: typeof b?.command === "string" ? b.command : undefined, sub }
  } else if (face === "toolOutput" || face === "toolResult") {
    chunk = { kind: "tool", text: typeof b === "string" ? b : String(b?.text ?? ""), sub }
  } else {
    chunk = { kind: face === "think" ? "think" : "text", text: path.rest, sub }
  }
  const ch = "sub:" + path.head
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
 *  ——§18 C-8 child 权限通道 announce 块头通知；返回值原样回传）。原调用点改委托（R-4）。 */
export function postSubagentApproval(panel, info) {
  return postSubagentEvent(panel, { type: "subagentApproval", ...info })
}
