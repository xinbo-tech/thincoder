/**
 * activity.js — 子代理活动块生命周期编排（2026-09-12 活动区收口——WEBVIEW.md §14 现行机制）。
 * 位置三度更替（活动区 → 流尾 → 活动区 → **消化后归档入流**）——**两态机与块身份语义始终
 * 不变**（live → frozen；frozen 上 `awaitingDigest` 单标志 = settled 驻留——**非第二状态机**）。
 *
 * 出生 = 区尾 append（`#subagent-activity`）；终态两路（C-1）：① `settled` → 折叠 + 驻留（态词
 * `t("sub.awaitingDigest")`）；② 其余终态 → 折叠 + **即时归档**（C-3 ②尾追）；③ 消化回收（`done`
 * 命中 awaitingDigest）→ 归档：digest 边界（`S._digestBoundary`）有效 ⇒ 边界之前（CLI 序），否则
 * 尾追退化（C-4）。**归档 = 单次 DOM 插入**（无 per-block 锚 / 无降序 / 无位移校正——非 §12.4 旧
 * DOM-move 锚链）。幂等守卫 = 冻结或 tombstone（!isConnected）⇒ `ensureBlock` 返 null；**区内保留
 * 上限已退役**（C-6——区居民 = live + awaitingDigest）；queued → ⏳ 等待头；不做跨 reload 恢复。
 *
 * 第 10 批（§5.1）：① 新代接管（旧 awaitingDigest 块即时归档——C-5③；记 `takeover` 痕迹 +
 * 新块 `oldReclaimPending` 吞守卫）；② 终态补块（never-born 桩集精确成员表 = §5.1.4 第 6 条
 * ——补桩 = 折叠 + 立即归档——C-5②）。
 *
 * 2026-09-19（子代理 live 块可见性批——WEBVIEW.md §5.3/§5.5）：出生面 = **存活闸**（`queued` /
 * `started` 命中冻结键 ⇒ 接管建新代；不限角色族 / `pool`——②③ 去门）；非出生面命中冻结 / 墓碑键
 * ⇒ 丢弃 + 痕（⑦ 禁静默）；终态判据扩 tombstone 形；补桩前置收窄（consult / escalate 纳入）；
 * 出生可见性 = 钉底跟随 / 未钉底计数钮；痕迹面迁出 `activity-diag.js`。
 *
 * 呈现委 activity-view.js（refreshBlock/refreshLiveHeaders/updateStopButton/noteChunk）；
 * 消费面：panels.js（applySubagentStatus/freezeLiveBlocks/refreshLiveHeaders）、chat.js
 * （resetActivity）、streaming.js（ensureBlock/noteChunk/resetActivity/maybeScrollBlock）。
 * 块内容区跟滚（§13）：initBlockFollow + maybeScrollBlock。
 *
 * 拆分评估（§14.6）：越 300 软线——本批不拆（上限机制退役抵消新增；<500 硬限余量足）。
 */
import { ctx, S } from "./state.js"
import { buildAdvisorBlock, maybeScrollActivity } from "./ui.js"
import { refreshBlock } from "./activity-view.js"
import { t } from "./i18n.js"
import { traceSub, traceSubOnce, clearSubTraceChannel } from "./activity-diag.js"
import { noteActivityBirth, clearActivityNew } from "./activity-new.js"

// streaming.js import 面不变（noteChunk 定义在 activity-view.js 叶——hub re-export）
export { noteChunk } from "./activity-view.js"

// ─── Channel parsing ─────────────────────────────

/** Parse an activity channel name ("sub:eng-coder#1", "sub:consult glm-5.2 #4",
 *  "sub:escalate glm-5.2 #6") → { channel, label, role, id, model } (label = the
 *  header key — channel minus the "sub:" prefix). */
function parseChannel(name) {
  const channel = String(name ?? "")
  const label = channel.startsWith("sub:") ? channel.slice(4) : channel
  const m = /^sub:(explore|plan|coder|eng-coder|eng-designer|advisor)#(\d+)$/.exec(channel)
  if (m) return { channel, label, role: m[1], id: Number(m[2]), model: null }
  const c = /^sub:(consult|escalate) (.+) #(\d+)$/.exec(channel)
  if (c) return { channel, label, role: c[1], id: Number(c[3]), model: c[2] } // CLI 形态残留（不作判据）
  // 键文法单源（2026-09-19——核 `relay-prefix.mjs` `[\w-]+#\d+`；consult / escalate 端侧键不含模型段）
  const g = /^sub:([\w-]+)#(\d+)$/.exec(channel)
  if (g) return { channel, label, role: g[1], id: Number(g[2]), model: null }
  return { channel, label, role: null, id: null, model: null }
}

/** Block names matching one child identity（消息字段 role/id 及——consult 键嵌模型——
 *  model/sessionId）。查键用——绝不建块。 */
function blockNamesFor(role, id, model, sessionId) {
  if (role === "consult" && model != null && sessionId != null) {
    return [`sub:consult ${model} #${sessionId}`]
  }
  const out = []
  for (const name of S._subBlocks.keys()) {
    if (name.startsWith(`sub:${role}`) && name.endsWith(`#${id}`)) out.push(name)
  }
  return out
}

// ─── Block lifecycle ────────────────────────

/** 建块（出生 / 新代接管 / 终态补桩三路径共用——§5.1.4）：append 活动区
 *  （`#subagent-activity`）区尾 + 挂 meta 基座 + toggle 监听。不入 map——入册由调用方定
 *  （三路径同规：_set 后返回）。 */
function buildBlock(name) {
  const ch = parseChannel(name)
  const block = buildAdvisorBlock(ch.label)
  block.classList.add("sub-block", "sub-live")
  block.dataset.subname = ch.channel
  block.dataset.subrole = ch.role ?? ""
  if (ch.id != null) block.dataset.subid = String(ch.id)
  block.open = true
  block._subMeta = {
    channel: ch.channel, label: ch.label, role: ch.role, id: ch.id, model: ch.model,
    startedAt: Date.now(), pool: null,
    turn: null, maxTurns: 0, status: "running", stateWord: null,
    doneAt: null, frozen: false, error: null, queued: false,
    queueInfo: null, awaitingDigest: false,
    // X6/X11（显示面消差批 §2.2 · 收口轮 #134 ②）：块头注记（`— <note>`——turn-cap /
    // stopped-by-user / interrupted 共用**单一载体**，禁第二注记字段）；X10：sync 可中止事实
    // （⏹ 门控支基底——与 async `pool` 并列；缺省 false = 无门控支——零回归）。
    note: null, syncLive: false,
    // §18 C-8（child permission gate）：child ask 审批态（tool 名 ≤40 or null——
    // onSubagentApproval 驱动；块头 ⏸ + 态词；freeze 清态）
    approval: null,
  }
  block.addEventListener("toggle", () => { if (block._subMeta && !block._subMeta.frozen) refreshBlock(block) })
  // A13（群 A 批）：会话首个活动块的说明行（新用户可理解——一次性）。位置 = summary 之后、
  // .advisor-content 之前（details 直接子——refreshBlock 只重建 summary，本行不被擦；
  // tailLines 射程 = .advisor-content 子元素——本行不在内，tail-3 不受扰）。
  if (!S._subDescShown) {
    S._subDescShown = true
    const desc = document.createElement("div")
    desc.className = "sub-desc"
    desc.textContent = t("sub.desc")
    block.insertBefore(desc, block.querySelector(".advisor-content"))
  }
  ctx.activityEl.appendChild(block) // 出生位 = 活动区区尾（live 阶段驻区——归档由 C-3 驱动）
  // §5.5 出生可见性（D-W27）：钉底 ⇒ 跟随；未钉底 ⇒ 不改 scrollTop + 区首计数钮（不夺阅读位）
  if (ctx._pinActivity === false) noteActivityBirth()
  else maybeScrollActivity(ctx) // 出生即区钉底（_pinActivity=false 上读中不强拉）
  initBlockFollow(block) // 块级跟滚监听（§13——出生/接管/补桩三路径共用本点）
  refreshBlock(block)
  return block
}

// ─── Block follow-scroll（§13——块内容区下列）───────

/** 块级跟滚监听（§13 C-LU1——出生接线）：内容区挂 wheel / touchmove 让位监听
 *  （{ passive: true }——与 ui.js initScrollFollow 同形），处理式 = 近底 24px 判据写
 *  `内容区._pinFollow`（族同口径——gap < 24 即近底）。内容区缺失零操作。 */
function initBlockFollow(block) {
  const content = block.querySelector(".advisor-content")
  if (!content) return
  const onScroll = () => { content._pinFollow = content.scrollHeight - content.scrollTop - content.clientHeight < 24 }
  content.addEventListener("wheel", onScroll, { passive: true })
  content.addEventListener("touchmove", onScroll, { passive: true })
}

/** 块级跟滚应用（§13 C-LU1——streaming.js rAF 尾逐块消费）：折叠（open=false）或已移除
 *  （!isConnected）→ no-op（零滚动副作用）；默认钉底（`内容区._pinFollow !== false` idiom
 *  同 ctx._pinBottom）→ 写超值不读 scrollHeight（ui.js:449-450 口径——免强制同步布局）。 */
export function maybeScrollBlock(block) {
  if (!block?.isConnected || !block.open) return
  const content = block.querySelector(".advisor-content")
  if (!content || content._pinFollow === false) return
  content.scrollTop = Number.MAX_SAFE_INTEGER
}

/** Get (create on first sight) the activity block for a channel name。块出生即 append
 *  到活动区 `#subagent-activity` 区尾（label = channel 去 sub: 前缀）。返回契约：
 *  - map 无键 → 新建块（meta = { status:"running", … }）+ append 区尾 + 区钉底
 *  - map 有键且已终态（frozen）→ null（幂等守卫——迟来消息丢弃；**含已归档块**）
 *  - map 有键且 live 但元素被移除（!isConnected——边缘残留）→ tombstone 守卫 → null
 *  - map 有键且 live → 返回既有元素（重复 started/queued 覆盖式刷新头词——不重挂） */
export function ensureBlock(name) {
  const existing = S._subBlocks.get(name)
  if (existing) {
    // 单 map 单守卫：终态（frozen）或被移除（!isConnected——live tombstone）的条目
    // 一律返 null——后续消息全部丢弃（绝不复活重建）。簿记条目保留至 resetActivity 才清。
    if (existing._subMeta?.frozen || !existing.isConnected) return null
    return existing
  }
  const block = buildBlock(name)
  S._subBlocks.set(name, block)
  traceSub("birth", name) // 出生面正收据（§5.3 痕族）
  return block
}

/** 出生闸（§5.3——出生事件 = `queued` / `started`；**不限角色族、不限 `pool`**——②③ 去门）：无
 *  条目 ⇒ 新建（`birth` 痕）；已冻结 ⇒ 接管建新代（`takeover` 痕——D-W25）；live ⇒ 复用（幂等——
 *  `reassert-hit` 正收据）；tombstone ⇒ 丢弃 + `drop-tombstone` 痕。role / id 非法 ⇒ null（不可建）。 */
function enterBlock(m) {
  if (m?.role == null || m?.id == null) return null
  const name = `sub:${m.role}#${m.id}`
  const ch = parseChannel(name)
  if (ch.role == null || ch.id == null) return null
  const existing = S._subBlocks.get(name)
  if (!existing) return ensureBlock(name)
  if (existing._subMeta?.frozen) return takeoverBlock(name)
  if (!existing.isConnected) { traceSubOnce("drop-tombstone", name); return null }
  traceSubOnce("reassert-hit", name)
  return existing
}

/** 新代接管（§5.1.4 第 5 条——started + pool:true 命中 map 中同名已冻结条目）：建新块并
 *  改绑键 + 记 `takeover` 痕迹。**旧 awaitingDigest 块（回收在途）即时归档**（§14 C-5③：
 *  清 awaitingDigest——头词回终态形态；旧块在流内作历史）+ 新块记 `oldReclaimPending`——
 *  其后该键首条 `done` 视为旧代回收吞掉（C-5③ 防御）。已归档旧块本就在流内，零动作。
 *  显式取舍：接管后该频道的迟到 chunk 会落进新块（仅“id 重复 + 两实例消息交错”可见）。 */
export function takeoverBlock(name) {
  const old = S._subBlocks.get(name)
  const reclaimPending = old?._subMeta?.awaitingDigest === true
  if (reclaimPending) archiveBlock(old)
  const block = buildBlock(name)
  if (reclaimPending) block._subMeta.oldReclaimPending = true
  S._subBlocks.set(name, block)
  clearSubTraceChannel(name) // 生命周期边界：新一代的丢弃 / 命中面重新计首条（高频面去重）
  traceSub("takeover", name)
  return block
}

/** 终态原地折叠（freeze——2026-09-11 活动区回归：区内原地；本批起折叠后去向由调用方定：
 *  settled → awaitingDigest 驻留；其余终态 → 即时归档（C-1/C-3））: 终态翻 + class
 *  sub-live→sub-frozen + 折叠 open=false + ⏹ 移除 + 头词刷新——无 DOM move/无锚插。
 *  `opts.note`（X11——会话中止 `interrupted`）⇒ 写块级活态载体 `meta.note`（与 X6 同载体）。 */
function freezeBlock(block, kind, opts = {}) {
  const meta = block._subMeta
  if (!meta || meta.frozen) return
  meta.status = kind === "stopped" ? "cancelled" : kind === "error" ? "error" : "done"
  meta.frozen = true
  meta.doneAt = meta.doneAt ?? Date.now()
  meta.approval = null // §18 C-8：终态清审批态（头词不悬空）
  if (opts.note != null) meta.note = String(opts.note)
  block.classList.remove("sub-live")
  block.classList.add("sub-frozen")
  block.open = false
  block.querySelector(".sub-stop-btn")?.remove()
  refreshBlock(block)
}

/** 归档（§14 C-3——单次 DOM 插入）：块元素原地进 `#messages`。`atBoundary=true`（消化
 *  回收）且本轮边界 `S._digestBoundary` 有效（isConnected）→ `insertBefore(块, 边界)`
 *  （CLI 序：块在 digest 文本之前；同批多块 = 到达序——逐个 insertBefore 保序相邻）；
 *  其余（普通终态 / 补桩 / 会话退出 flush / 边界失效 / 无边界）→ `appendChild` 尾追退化
 *  （C-4）。幂等：已归档（parentNode === messagesEl）→ no-op。归档时清 awaitingDigest
 *  ——头词回终态形态（不留悬空「等待消化」）。 */
function archiveBlock(block, atBoundary = false) {
  const messagesEl = ctx.messagesEl
  if (!block || !messagesEl || block.parentNode === messagesEl) return
  const boundary = atBoundary ? S._digestBoundary : null
  if (boundary?.isConnected) messagesEl.insertBefore(block, boundary)
  else messagesEl.appendChild(block)
  if (block._subMeta?.awaitingDigest) {
    block._subMeta.awaitingDigest = false
    refreshBlock(block)
  }
}

/** 终态补桩判定（§5.1.4 第 6 条——桩集**精确成员表**）：无 map 条目时按表判定——返回折叠
 *  kind（done/stopped/error）或 null（不补）。表内显式不补行：`answered`（有块折叠、无块
 *  no-op——回复走 digest 呈现）· `cancelled(was:"queued")`（从未启动不冻结）· 表外 status。 */
function terminalStubKind(m) {
  switch (m.status) {
    case "done":
    case "settled": return "done"
    case "error": return "error"
    case "cancelled": return m.was === "queued" ? null : "stopped" // 运行中取消（含 was 缺省）→ 补桩
    case "terminated": return "stopped"
    case "failed": return "error"
    default: return null
  }
}

/** 终态补桩前置（§5.3 终态必现——2026-09-19 收窄）：`id` 在 ∧ 角色段合法（`[\w-]+`）∧ 回读
 *  一致（D-W10——`FAMILY_ROLES` 补桩前置退场：consult / escalate 纳入）；不满足 → no-op + 痕。 */
function stubAllowed(m) {
  if (m.role == null || m.id == null) return false
  if (!/^[\w-]+$/.test(String(m.role))) return false
  const ch = parseChannel(`sub:${m.role}#${m.id}`)
  return ch.role === m.role && ch.id != null
}

/** 终态补块（never-born / tombstone 终态防御——§5.3「终态必现」）：补**已折叠**桩（立即折叠 +
 *  立即归档——§14 C-5②）+ 记 `late-terminal-stub`；入册同出生路径（后续消息走幂等守卫）。
 *  注记随桩（X6/X11：与 error / turn 同规——载荷携 `note` 即写 `meta.note`，头词不丢）。 */
function stubTerminalBlock(name, m, kind) {
  const block = buildBlock(name)
  const meta = block._subMeta
  if (kind === "error" && m.error) meta.error = m.error
  if (m.note != null) meta.note = String(m.note)
  if (m.maxTurns != null) meta.maxTurns = m.maxTurns
  if (m.turn != null) meta.turn = m.turn
  S._subBlocks.set(name, block)
  freezeBlock(block, kind)
  archiveBlock(block)
  traceSub("late-terminal-stub", name)
}

/** Status-message effects on blocks（两态机 + awaitingDigest 单标志——事件字段自足）:
 *  - **出生面 = 存活闸**（§5.3——queued / started）：不限角色族 / `pool`；冻结键 ⇒ 接管；墓碑 ⇒ 丢弃 + 痕
 *  - queued → ⏳ 等待头 + `queueInfo`（C-11②/#118 四项）；started → 翻 running；turn（C-11③）→ 头 turn N/M 实时
 *  - cancelled(was:"queued") → 等待头移除（不冻结）；settled → 折叠 + awaitingDigest 驻留（C-2）
 *  - 其余终态 → 折叠 + 即时归档（C-3 ②）；消化回收：`done` 命中 awaitingDigest → 归档（C-3 ①）
 *  - 旧代回收吞守卫（C-5③）：接管时旧块 awaiting → 新块 `oldReclaimPending`——其后该键首条 `done` 吞
 *  - 非出生面命中冻结键 ⇒ `drop-frozen` 痕（⑦）；终态补块无可用条目 ⇒ 按表补桩；前置不满足 ⇒
 *    no-op + `drop-unknown-role`（角色段非法 / id 缺失 / 回读不一致）。 */
export function applySubagentStatus(m) {
  if (m.status === "queued") {
    const block = enterBlock(m) // 出生闸（§5.3——`queued` 亦出生事件）
    if (!block) return // 不可建（role/id 非法）/ tombstone——丢弃
    const meta = block._subMeta
    meta.status = "queued"
    meta.queued = true
    // C-11②/#118：排队信息入**块级活态载体**（`_subMeta.queueInfo`——两条刷新路径共读，
    // 无回落通道；WEBVIEW.md §5.2）——`kind` 判词（slot ⇒ 槽满词 / 否则 reason 原文）/ `reason`
    // 文本 / `position` / `waiting` 对位字段。
    meta.queueInfo = { kind: m.kind ?? null, position: m.position ?? null, waiting: m.waiting ?? null, reason: m.reason ?? null }
    refreshBlock(block)
    return
  }
  if (m.status === "turn") {
    // C-11③ 逐轮进展帧（onAgentTurn → status:"turn"）：区头 turn N/M 实时
    for (const name of blockNamesFor(m.role, m.id, m.model, m.sessionId)) {
      const block = S._subBlocks.get(name)
      if (!block?._subMeta) continue
      // ⑦ 非出生面禁静默（§5.3）：冻结 / 墓碑键吞掉的 turn 帧 ⇒ 丢弃 + 痕（状态面逐条）。
      if (block._subMeta.frozen) { traceSub("drop-frozen", name); continue }
      if (!block.isConnected) { traceSub("drop-tombstone", name); continue }
      if (m.turn != null) block._subMeta.turn = m.turn
      if (m.maxTurns != null) block._subMeta.maxTurns = m.maxTurns
      refreshBlock(block)
    }
    return
  }
  if (m.status === "started") {
    // 出生面 = 存活闸（§5.3——D-W25/D-W26）：出生事件即建块 / 接管，不限角色族 / `pool`（②③ 去门）。
    enterBlock(m)
    for (const name of blockNamesFor(m.role, m.id, m.model, m.sessionId)) {
      const block = S._subBlocks.get(name)
      // 冻结块不收 started——不半复活（与终态分支同形）
      if (!block?._subMeta || block._subMeta.frozen) continue
      const meta = block._subMeta
      meta.status = "running"
      meta.stateWord = null // queued 头残留等待标注清掉（转 running——由 chunk 状态词接管）
      meta.queued = false
      meta.queueInfo = null // C-11②：started 后清排队信息
      // pool 标记语义: async 池条目 started 携 pool:true；同步 spawn 不带 → false。
      meta.pool = m.pool === true
      // X10（§2.10.5 #4）：sync 可中止事实（宿主只读核 registry 判定——载荷缺省/false ⇒ 零门控支）。
      meta.syncLive = m.syncLive === true
      if (m.startedAt) meta.startedAt = m.startedAt
      if (m.model) meta.model = m.model
      if (m.maxTurns != null) meta.maxTurns = m.maxTurns
      if (m.turn != null) meta.turn = m.turn
      refreshBlock(block)
    }
    return
  }
  if (m.status === "cancelled" && m.was === "queued") {
    // §20 D-SD3b: queued 取消（从未启动——无冻结）→ 等待块头移除（CLI waiting 块移除
    // 同语义——不冻结）。
    for (const name of blockNamesFor(m.role, m.id, m.model, m.sessionId)) {
      const block = S._subBlocks.get(name)
      if (block?._subMeta && !block._subMeta.frozen && block._subMeta.status === "queued") {
        S._subBlocks.delete(name)
        block.remove()
      }
    }
    return
  }
  // Terminal statuses → 原地折叠（终态集合闭合——settled 视同 done 但驻留待回收）。
  const kind = m.status === "done" || m.status === "settled" ? "done"
    : m.status === "cancelled" ? "stopped"
    : m.status === "error" ? "error"
    : m.status === "answered" ? "done"
    : m.status === "terminated" ? "stopped"
    : m.status === "failed" ? "error"
    : null
  if (kind === null) return
  // 旧代回收吞守卫（C-5③）：该键首条 done = 旧代回收（新块 live/awaiting 均不触）→ 吞。
  if (m.status === "done") {
    for (const name of blockNamesFor(m.role, m.id, m.model, m.sessionId)) {
      const block = S._subBlocks.get(name)
      if (block?._subMeta?.oldReclaimPending) {
        block._subMeta.oldReclaimPending = false
        return
      }
    }
  }
  let hasEntry = false
  for (const name of blockNamesFor(m.role, m.id, m.model, m.sessionId)) {
    const block = S._subBlocks.get(name)
    if (!block?._subMeta) continue
    if (!block.isConnected) continue // live tombstone ⇒ 条目不可用、走补桩（F-A2 判据扩——§5.3）
    hasEntry = true // 有可用 map 条目者不受补桩表影响（既有折叠/守卫语义——§5.1.4 第 6 条）
    if (block._subMeta.frozen) {
      // 消化回收（C-1③/C-3①）：awaitingDigest 收 done → 归档（轮边界前）；其余终态 ⇒ 丢弃 + 痕（⑦）
      if (m.status === "done" && block._subMeta.awaitingDigest) archiveBlock(block, true)
      else traceSub("drop-frozen", name)
      continue
    }
    const meta = block._subMeta
    if (kind === "error" && m.error) meta.error = m.error
    // X6（§2.2）：注记入块级活态载体（与 X11 共用——两条刷新路径共读，无回落通道）。
    if (m.note != null) meta.note = String(m.note)
    if (m.maxTurns != null) meta.maxTurns = m.maxTurns
    if (m.turn != null) meta.turn = m.turn
    freezeBlock(block, kind)
    if (m.status === "settled") {
      meta.awaitingDigest = true // C-2：驻留待回收（头词加 awaiting 态词）
      refreshBlock(block)
    } else {
      archiveBlock(block) // C-3 ②：即时归档（尾追）
    }
  }
  // 终态补块（never-born / tombstone 终态防御——§5.3「终态必现」）：无可用块条目 → 按表补桩；
  // 前置不满足 → no-op + `drop-unknown-role`（answered / queued-cancel 为表内不补行——不补痕）。
  if (!hasEntry) {
    const stubKind = terminalStubKind(m)
    if (stubKind === null) return
    if (!stubAllowed(m)) {
      traceSub("drop-unknown-role", m.role == null || m.id == null ? "(unidentified)" : `sub:${m.role}#${m.id}`)
      return
    }
    stubTerminalBlock(`sub:${m.role}#${m.id}`, m, stubKind)
  }
}

/** live 块头定时刷新（§14 C-11④——panels `_panelTimer`（既有 2s）同点调用）：elapsed
 *  段随 Date.now() 重算（事件驱动之外的时间推进）。**不设运行态门**——仅刷现存 live 块
 *  （`_turnState` 为 `susp` 的纯池跑主场景照刷）；无 live 块 = 零操作。 */
export function refreshLiveHeaders() {
  for (const block of S._subBlocks.values()) {
    if (block?._subMeta && !block._subMeta.frozen && block.isConnected) refreshBlock(block)
  }
}

/** 审批态通知（§18 C-8——child permission gate）：`onSubagentApproval` 消息（tool 非空 =
 *  等待审批 / null = 清态）→ 块头 `⏸` + 态词 `等待审批: <tool>`。`blockNamesFor` 查块
 *  （**绝不建块**——无块 child 不因审批事件出生）；命中且非冻结 → `meta.approval = tool
 *  （≤40） | null` + refreshBlock；冻结/未知 → 丢弃（幂等守卫同族——与 applySubagentStatus
 *  终态守卫同规）。 */
export function applySubagentApproval(m) {
  if (m?.role == null || m?.id == null) return
  for (const name of blockNamesFor(m.role, m.id, m.model, m.sessionId)) {
    const block = S._subBlocks.get(name)
    if (!block?._subMeta || block._subMeta.frozen) continue
    block._subMeta.approval = m.tool ? String(m.tool).slice(0, 40) : null
    refreshBlock(block)
  }
}

/** 会话退出 freeze 兜底（suspension active:false + freeze:true——§14 C-8——panels 直接
 *  消费）：区**全体**归档——live → 折叠；awaitingDigest → 归档；已在流者不动（尾追）。
 *  host 既定注释语义「补发 done 冻结：随会话退出折叠进流」的兑现；CLI freezeAllSubTasks
 *  中断语义：不留悬空块（abort 同路径）。
 *  X11（§2.2）：`interrupted`（会话中止真值源）⇒ 未冻结块折叠时补 `— interrupted` 注记
 *  （`meta.note`——与 X6 同载体）；已冻结（含 awaitingDigest）块不回头改写。 */
export function freezeLiveBlocks(interrupted = false) {
  for (const block of [...S._subBlocks.values()]) {
    if (!block?._subMeta) continue
    if (!block._subMeta.frozen) freezeBlock(block, "done", interrupted ? { note: "interrupted" } : undefined)
    if (block.parentNode === ctx.activityEl) archiveBlock(block)
  }
}

/** Full reset — 回合中止（abort 无挂起会话）/会话清（§14 C-7）：**只清区子树**（live +
 *  awaitingDigest）+ 清 map + 区子树内防御孤儿清——**流内归档块（会话历史）不动**；计数钮同清。 */
export function resetActivity() {
  for (const block of S._subBlocks.values()) {
    if (block?.parentNode === ctx.activityEl) block.remove()
  }
  S._subBlocks.clear()
  clearActivityNew() // §5.5：resetActivity 同清（钮按需建 / 删——N=0 ⇒ :empty 零高不回归）
  // 防御清：map 外孤儿块（限区子树——流内归档块＝会话历史不得误删）
  for (const el of [...(ctx.activityEl?.children ?? [])]) {
    if (el.classList.contains("sub-block")) el.remove()
  }
}
