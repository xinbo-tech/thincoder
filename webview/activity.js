/**
 * activity.js — 子代理活动块生命周期编排层（ACTIVITY-SPLIT 拆分——三文件终局——
 * SESSION-ACTIVITY-REVISED——B1 修正——CLI 单固定块面板形态回归——webview 镜像
 * CLI subagent-panel.mjs + subagent-freeze.mjs）。
 *
 * 本文件 = 核心编排层：频道解析与行簿记水合（parseChannel/blockNamesFor/rowFor）、
 * 建块（ensureBlock——live 块生于固定活动区 #subagent-activity——messages 与输入
 * 之间——终态 freeze 移入 #messages）、状态机（applySubagentStatus——queued/
 * started/settled/terminal 全分支——queued 等待块头 D-4——settled 记落流锚
 * _freezeAtEl——consult answered 无块防御）、会话退出批冻（freezeSettledBlocks——
 * 按 settled 行表驱动——panels.js 直接消费——留核心防环）与全量重置
 * （resetActivity——live 清区 + map 清——ticker 清理经 view.stopTicker）。
 *
 * 块头/状态词/⏹/区显隐与 pin/noteChunk/ticker = activity-view.js（呈现叶——单一
 * 权威在其头）；freeze 折叠/落流锚插/preview = activity-freeze.js（冻结叶）。依赖
 * 纯 DAG 无环：core→view/freeze（view/freeze 不依赖 core——view/freeze 亦不 import
 * panels/streaming——外部消费方 panels/chat/streaming 只 import 本文件）。
 *
 * 150 块 DOM 窗口: 只数 #messages 内冻结块（live 块在活动区——不计窗——预算 =
 * 并发池大小——池有界——裁剪函数零改）。Header field sources 与 ticker 语义见
 * activity-view.js 头（D-R22b 数据源映射）。
 *
 * Hub：view/freeze 叶全符号经下方 re-export 可达——外部消费方 import 面零改动
 * （liveBlocks/_ticker/_tickDisabled 私有不导出）。
 */
import { ctx, S } from "./state.js"
import { buildAdvisorBlock, appendAdvisorChunk } from "./ui.js"
import { FAMILY_ROLES, W, refreshBlock, pinActivityArea, updateAreaVisibility, ensureTicker, stopTicker } from "./activity-view.js"
import { freezeBlock } from "./activity-freeze.js"

// ─── Hub re-export（ACTIVITY-SPLIT——外部消费方零改动）─────────────────────────
// view 叶（refreshBlock/noteChunk/updateAreaVisibility/pinActivityArea/ensureTicker/
// stopTicker/activityTick/setActivityTickDisabled/FAMILY_ROLES/W）与 freeze 叶
// （freezeBlock）全量经本枢纽 re-export——panels/chat/streaming/测试动态 import
// activity.js 的符号面不变。liveBlocks/_ticker/_tickDisabled 私有不导出。
export * from "./activity-view.js"
export { freezeBlock } from "./activity-freeze.js"

// ─── Channel parsing ─────────────────────────────

/** Parse an activity channel name ("sub:eng-coder#1", "sub:consult glm-5.2 #4",
 *  "sub:escalate glm-5.2 #6") → { channel, label, role, id, model } (label = the
 *  header key — channel minus the "sub:" prefix). */
export function parseChannel(name) {
  const channel = String(name ?? "")
  const label = channel.startsWith("sub:") ? channel.slice(4) : channel
  const m = /^sub:(explore|plan|coder|eng-coder|advisor)#(\d+)$/.exec(channel)
  if (m) return { channel, label, role: m[1], id: Number(m[2]), model: null }
  const c = /^sub:(consult|escalate) (.+) #(\d+)$/.exec(channel)
  if (c) return { channel, label, role: c[1], id: Number(c[3]), model: c[2] } // 组序: c[2]=model 段, c[3]=数字 id（评审 #1——勿换位）
  return { channel, label, role: null, id: null, model: null }
}

/** Block names matching one child identity (message fields: role/id and — for
 *  consult whose key embeds the model — model/sessionId). Exported for the
 *  activity-flow test (两形态 coverage — family prefix/suffix + consult key). */
export function blockNamesFor(role, id, model, sessionId) {
  if (role === "consult" && model != null && sessionId != null) {
    return [`sub:consult ${model} #${sessionId}`]
  }
  const out = []
  for (const name of S._subBlocks.keys()) {
    if (name.startsWith(`sub:${role}`) && name.endsWith(`#${id}`)) out.push(name)
  }
  return out
}

/** Row-map lookup (S._subagentMap — 行面板撤除后的簿记——仅供块 meta 水合):
 *  family/escalate rows are id-keyed; consult rows carry sessionId + model. */
function rowFor(ch) {
  if (ch.role === "consult") {
    for (const row of Object.values(S._subagentMap)) {
      if (row.role === "consult" && row.model === ch.model && String(row.sessionId) === String(ch.id)) return row
    }
    return null
  }
  const row = S._subagentMap[ch.id]
  return row && (ch.role === null || row.role === ch.role) ? row : null
}

// ─── Block lifecycle ─────────────────────────────

/** Get (create on first sight) the activity block for a channel name. The block
 *  is BORN IN the fixed activity area (F-1 — #subagent-activity container,
 *  between #messages and the input; messages scroll never displaces it); freeze
 *  later MOVES the element into the #messages flow (tail push / settle anchor —
 *  F-4). */
export function ensureBlock(name) {
  let block = S._subBlocks.get(name)
  if (block) {
    // 防御性清扫：map 中冻结块元素已被 150 窗口裁掉（isConnected=false）→ 迟来消息
    // 拿不到活元素——移出簿记（tombstone 语义由调用点 frozen 守卫承担——迟到 chunk
    // 丢弃路径见 streaming.subagentChunk）
    if (block._subMeta?.frozen && !block.isConnected) {
      S._subBlocks.delete(name)
      block = null
    } else {
      return block
    }
  }
  const ch = parseChannel(name)
  const row = rowFor(ch)
  block = buildAdvisorBlock(ch.label)
  block.classList.add("sub-block", "sub-live")
  block.dataset.subname = ch.channel
  block.dataset.subrole = ch.role ?? ""
  if (ch.id != null) block.dataset.subid = String(ch.id)
  block.open = true
  block._subMeta = {
    channel: ch.channel, label: ch.label, role: ch.role, id: ch.id, model: ch.model ?? (row?.model ?? null),
    startedAt: row?.startedAt ?? Date.now(), pool: row?.pool ?? null,
    turn: null, maxTurns: 0, status: "running", stateWord: null,
    doneAt: null, frozen: false, error: null, queued: false,
    // F-4 落流锚（settle 时记录——CLI _freezeAt DOM 版）: 仅 settled 块携带
    _freezeAtEl: null, settleSeq: 0,
  }
  block.addEventListener("toggle", () => { if (block._subMeta && !block._subMeta.frozen) refreshBlock(block) })
  // 挂载点 = 活动区容器（F-1——不触碰 #messages——messages 滚动零扰动——live 固定可见）。
  if (ctx.subAgentArea) {
    ctx.subAgentArea.appendChild(block)
    pinActivityArea()
  }
  updateAreaVisibility()
  S._subBlocks.set(name, block)
  ensureTicker()
  refreshBlock(block)
  return block
}

/** Status-message effects on blocks (rows bookkeeping is in panels.js). */
export function applySubagentStatus(m) {
  if (m.status === "queued") {
    // D-4（SESSION-ACTIVITY-REVISED——queued 等待块头）: 排队 spawn 即建区内等待块头
    // （行面板撤除后 queued/waiting 等待态的唯一承载面——CLI waiting 块等价——F-3）。
    // 重复 queued（位置/等待态刷新——cancel 前移/依赖终态转移）覆盖式更新头；
    // 启动（started）后转 running（⏹ 随之出现——running+pool）；取消（was:"queued"）
    // 移除块头（从未启动——不冻结——CLI waiting 块移除同语义）。
    if (m.id == null || m.role == null) return
    const name = `sub:${m.role}#${m.id}`
    const block = ensureBlock(name)
    const meta = block._subMeta
    if (meta.frozen) return
    meta.status = "queued"
    meta.queued = true
    if (m.waiting) {
      meta.stateWord = W.waiting() + (m.reason ? " — " + String(m.reason).replace(/\s+/g, " ").trim().slice(0, 64) : "")
    } else if (m.position != null) {
      meta.stateWord = `${W.queued()} ${W.position(m.position)}`
    } else {
      meta.stateWord = W.queued()
    }
    refreshBlock(block)
    return
  }
  if (m.status === "started") {
    // Pool children of the cancelable family get their block at START (visible
    // before the first relay chunk; sync spawns create on first chunk). A queued
    // head (status queued) flips to running here — stale queue state word cleared.
    if (FAMILY_ROLES.includes(m.role) && m.pool && m.id != null) ensureBlock(`sub:${m.role}#${m.id}`)
    for (const name of blockNamesFor(m.role, m.id, m.model, m.sessionId)) {
      const block = S._subBlocks.get(name)
      // §27.1 F3（缺陷①）: 冻结块不收 started——不半复活（与终态分支同形）
      if (!block?._subMeta || block._subMeta.frozen) continue
      const meta = block._subMeta
      meta.status = "running"
      meta.stateWord = null // queued 头残留的等待标注清掉（转 running——由 chunk 状态词接管）
      meta.queued = false
      // pool 标记语义: async 池条目 started 携 pool:true；同步 spawn 不带 → false。
      // （escalate-async/advisor-async 亦携 pool:true——escalate 无 mode 词豁免）
      meta.pool = m.pool === true
      if (m.startedAt) meta.startedAt = m.startedAt
      if (m.model) meta.model = m.model
      if (m.maxTurns != null) meta.maxTurns = m.maxTurns
      if (m.turn != null) meta.turn = m.turn
      refreshBlock(block)
    }
    return
  }
  if (m.status === "settled") {
    for (const name of blockNamesFor(m.role, m.id, m.model, m.sessionId)) {
      const block = S._subBlocks.get(name)
      if (!block?._subMeta || block._subMeta.frozen) continue
      // F-4（SESSION-ACTIVITY-REVISED）: settle 翻状态 + 块留驻活动区（✓ "done ·
      // awaiting digestion"——区内等待 digest）——记落流锚 _freezeAtEl = settle 时
      // #messages 流尾元素（digest 报告流内排在锚后——digest done 补发时块插回
      // 报告前——CLI _freezeAt DOM 版）。多 settled 同锚按 settle 序升序落流
      // （settleSeq 单调——插入点 walk 见 freezeInsertPoint）。挂起期终态通知同携
      // entry 快照（terminalStatus）——冻结头 turn 延续（digest 补发 done 不再带
      // turn——meta 已存）。
      const meta = block._subMeta
      meta.status = "settled"
      meta.queued = false
      meta.doneAt = Date.now()
      meta._freezeAtEl = ctx.messagesEl ? ctx.messagesEl.lastElementChild : null
      meta.settleSeq = ++_settleSeq
      if (m.maxTurns != null) meta.maxTurns = m.maxTurns
      if (m.turn != null) meta.turn = m.turn
      refreshBlock(block)
    }
    return
  }
  // Terminal statuses → freeze into the message flow.
  const kind = m.status === "done" ? "done"
    : m.status === "cancelled" ? "stopped"
    : m.status === "error" ? "error"
    : m.status === "answered" ? "done"
    : m.status === "terminated" ? "stopped"
    : m.status === "failed" ? "error"
    : null
  if (kind === null) return
  // §20 D-SD3b: cancelled 带 was:"queued" = queued 取消（从未启动——无冻结）→ 等待
  // 块头移除（行面板撤前同语义——CLI waiting 块移除）。
  if (m.status === "cancelled" && m.was === "queued") {
    for (const name of blockNamesFor(m.role, m.id, m.model, m.sessionId)) {
      const block = S._subBlocks.get(name)
      if (block?._subMeta && !block._subMeta.frozen && block._subMeta.status === "queued") {
        S._subBlocks.delete(name)
        block.remove()
        updateAreaVisibility()
      }
    }
    return
  }
  const names = blockNamesFor(m.role, m.id, m.model, m.sessionId)
  let found = false
  for (const name of names) {
    const block = S._subBlocks.get(name)
    if (block?._subMeta) { found = true; break }
  }
  // ⑭ consult answered 无块防御（评审 #3——SESSION-ACTIVITY-REVISED）: answered 携
  // replyPreview 而无活动块（频道工具流未及建块/块已随重置消失——行面板撤后回复不
  // 得丢）→ 按 replyPreview 行快照建块再冻结（report 内容 = 快照行——digest 轮逐字
  // 呈现仍是回复权威呈现面——此块为防御承载）。
  if (!found && m.status === "answered" && m.model != null && m.sessionId != null && m.replyPreview) {
    const snap = ensureBlock(`sub:consult ${m.model} #${m.sessionId}`)
    appendAdvisorChunk(snap, "text", String(m.replyPreview))
    freezeBlock(snap, "done")
    return
  }
  for (const name of names) {
    const block = S._subBlocks.get(name)
    if (!block?._subMeta || block._subMeta.frozen) continue
    const meta = block._subMeta
    if (kind === "error" && m.error) meta.error = m.error
    if (m.maxTurns != null) meta.maxTurns = m.maxTurns
    if (m.turn != null) meta.turn = m.turn
    freezeBlock(block, kind)
  }
}

// settle 序单调计数器（同锚多 settled 落流序——Date.now() 同毫秒不可靠）
let _settleSeq = 0

/** Session-exit freeze (suspension freeze:true — §17.5.5 兜底): every block
 *  still live with a settled row freezes as done (anchored insert — settle 序
 *  升序逐块——同锚相对序 = settle 序）。 */
export function freezeSettledBlocks() {
  const blocks = []
  for (const [id, row] of Object.entries(S._subagentMap)) {
    if (row.status !== "settled") continue
    for (const name of blockNamesFor(row.role, row.id ?? id, row.model, row.sessionId)) {
      const block = S._subBlocks.get(name)
      if (block?._subMeta && !block._subMeta.frozen && block._subMeta.status === "settled") blocks.push(block)
    }
  }
  blocks.sort((a, b) => (a._subMeta.settleSeq ?? 0) - (b._subMeta.settleSeq ?? 0))
  for (const block of blocks) freezeBlock(block, "done")
  ensureTicker()
}

/** Full reset — turn abort（无挂起会话）/ session clear: live blocks are REMOVED
 *  from the activity AREA, map cleared, ticker stopped. Frozen blocks in
 *  #messages are NOT touched (F-4 — they live in the conversation history until
 *  the 150-block DOM window trims them). Defensive: stray live blocks outside
 *  the map (edge paths) are removed by their .sub-block.sub-live class — frozen
 *  blocks never carry sub-live. 区空即隐藏（updateAreaVisibility）。 */
export function resetActivity() {
  stopTicker() // ticker 清理 = view.stopTicker（ACTIVITY-SPLIT 评审 #1 例外——拆后 ticker 状态在 view 叶）
  for (const block of S._subBlocks.values()) {
    if (block?._subMeta && !block._subMeta.frozen && block.isConnected) block.remove()
  }
  S._subBlocks.clear()
  // 防御清：map 外孤儿 live 块（非冻结点产生的残留路径）——frozen 不动
  for (const el of document.querySelectorAll(".sub-block.sub-live")) el.remove()
  updateAreaVisibility()
}
