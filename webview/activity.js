/**
 * activity.js — 子代理活动块生命周期编排（ACTIVITY-REWRITE-SIMPLE——B1 流尾简单形态
 * 回归——手工重写去加戏：活动区容器/DOM move/落流锚插/settle 驻留/簿记 map/跨 reload
 * 恢复全删——SESSION-FLOW-B B1（52e03f3）流尾形态 = 参照）。
 *
 * 块出生即 #messages 流尾（与 .message 同层——append 不插锚——150 窗出生即计无豁免）。
 * 生命周期只有 live → frozen 两态——终态（任何非 queued/started 的 status——done/
 * settled/error/cancelled/answered/terminated/failed…——settled 视同 done）原地折叠
 * （class sub-live→sub-frozen + open=false + ⏹ 移除 + 头词 ✓ done Ns——无 DOM move/
 * 无锚插/无 report preview）。幂等守卫 = map 有键且已终态 → ensureBlock 返 null（迟来
 * 消息丢弃——绝不复活重建）；live 块被 150 窗裁（!isConnected）→ tombstone 守卫（条目
 * 保留——终态/被裁同守卫——后续消息一律丢弃——resetActivity 才清）。queued → ⏳ 等待头（含取消 ⏹——F-2——QUEUED-VISIBILITY 保留——取消
 * 沿既有 cancelSubagent 路径——协议零改）；started → 翻 running。不做跨 reload 恢复
 * （reload 进程死块死——消息流是历史——SESSION-RESTORE-PARITY）。
 *
 * 呈现委 activity-view.js（refreshBlock/updateStopButton/noteChunk——单一权威在其头
 * ——依赖纯 DAG 无环：activity→view，view 不依赖 core）。freeze 原地折叠 ~15 行并入本
 * 文件（旧冻结叶已删——freeze 并入本文件）。消费面：panels.js（applySubagentStatus/freezeLive
 * Blocks）、chat.js（resetActivity）、streaming.js（ensureBlock/noteChunk/resetActivity
 * ——noteChunk 经本文件 re-export——import 面不变）。
 */
import { ctx, S } from "./state.js"
import { buildAdvisorBlock, maybeScrollDown } from "./ui.js"
import { FAMILY_ROLES, refreshBlock } from "./activity-view.js"

// streaming.js import 面不变（noteChunk 定义在 activity-view.js 叶——hub re-export）
export { noteChunk } from "./activity-view.js"

// ─── Channel parsing ─────────────────────────────

/** Parse an activity channel name ("sub:eng-coder#1", "sub:consult glm-5.2 #4",
 *  "sub:escalate glm-5.2 #6") → { channel, label, role, id, model } (label = the
 *  header key — channel minus the "sub:" prefix). */
function parseChannel(name) {
  const channel = String(name ?? "")
  const label = channel.startsWith("sub:") ? channel.slice(4) : channel
  const m = /^sub:(explore|plan|coder|eng-coder|advisor)#(\d+)$/.exec(channel)
  if (m) return { channel, label, role: m[1], id: Number(m[2]), model: null }
  const c = /^sub:(consult|escalate) (.+) #(\d+)$/.exec(channel)
  if (c) return { channel, label, role: c[1], id: Number(c[3]), model: c[2] }
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

// ─── Block lifecycle ─────────────────────────────

/** Get (create on first sight) the activity block for a channel name。块出生即 append
 *  到 #messages 流尾（与 .message 同层——label = channel 去 sub: 前缀——150 窗出生即
 *  计无豁免）。返回契约：
 *  - map 无键 → 新建块（meta = { status:"running", … }）+ append 流尾 + 钉底
 *  - map 有键且已终态（frozen）→ null（幂等守卫——迟来消息丢弃）
 *  - map 有键且 live 但元素被 150 窗裁（!isConnected）→ tombstone 守卫 → null（条目保
 *    留——后续消息一律丢弃——resetActivity 才清）
 *  - map 有键且 live → 返回既有元素（重复 started/queued 覆盖式刷新头词——不重挂） */
export function ensureBlock(name) {
  const existing = S._subBlocks.get(name)
  if (existing) {
    // 单 map 单守卫：终态（frozen）或被 150 窗裁（!isConnected——live tombstone）的条目
    // 一律返 null——后续消息全部丢弃（绝不复活重建）。簿记条目保留至 resetActivity 才清
    // （与冻结条目同生命周期——frozen 元素随窗裁后守卫仍在）。
    if (existing._subMeta?.frozen || !existing.isConnected) return null
    return existing
  }
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
  }
  block.addEventListener("toggle", () => { if (block._subMeta && !block._subMeta.frozen) refreshBlock(block) })
  ctx.messagesEl.appendChild(block)
  maybeScrollDown(ctx) // 出生即钉底（B1 参照——pinBottom=false 上读中不强拉）
  S._subBlocks.set(name, block)
  refreshBlock(block)
  return block
}

 /** 终态原地折叠（ACTIVITY-REWRITE-SIMPLE——freeze 由旧冻结叶并入本文件）:
 *  终态翻 + class sub-live→sub-frozen + 折叠 open=false + ⏹ 移除 + 头词刷新——原地
 *  （元素已在 #messages 出生位——无 DOM move/无锚插/无 report preview）。 */
function freezeBlock(block, kind) {
  const meta = block._subMeta
  if (!meta || meta.frozen) return
  meta.status = kind === "stopped" ? "cancelled" : kind === "error" ? "error" : "done"
  meta.frozen = true
  meta.doneAt = meta.doneAt ?? Date.now()
  block.classList.remove("sub-live")
  block.classList.add("sub-frozen")
  block.open = false
  block.querySelector(".sub-stop-btn")?.remove()
  refreshBlock(block)
}

/** Status-message effects on blocks（三态机——事件字段自足——簿记 map 已删）:
 *  - queued → 建 ⏳ 等待头（含取消 ⏹——F-2——头只显 ⏳——无位置/等待原因词）
 *  - started → 翻 running（queued 头转 running；FAMILY+pool 出生即建块——同步 spawn
 *    首 chunk 建块）
 *  - cancelled（was:"queued"）→ 等待头移除（从未启动——不冻结）
 *  - 其余 status 一律终态折叠（终态集合闭合）——lookup-only 绝不建块——settled 视同
 *    done 即时折叠（无 awaiting 驻留）——answered 有块折叠无块 no-op（回复走 digest
 *    呈现——权威面）——无块一律 no-op（reload 后陈旧消息不复活） */
export function applySubagentStatus(m) {
  if (m.status === "queued") {
    if (m.id == null || m.role == null) return
    const block = ensureBlock(`sub:${m.role}#${m.id}`)
    if (!block) return // 终态守卫/tombstone——丢弃
    const meta = block._subMeta
    meta.status = "queued"
    meta.queued = true
    refreshBlock(block)
    return
  }
  if (m.status === "started") {
    // Pool children of the cancelable family get their block at START (visible
    // before the first relay chunk; sync spawns create on first chunk).
    if (FAMILY_ROLES.includes(m.role) && m.pool && m.id != null) ensureBlock(`sub:${m.role}#${m.id}`)
    for (const name of blockNamesFor(m.role, m.id, m.model, m.sessionId)) {
      const block = S._subBlocks.get(name)
      // 冻结块不收 started——不半复活（与终态分支同形）
      if (!block?._subMeta || block._subMeta.frozen) continue
      const meta = block._subMeta
      meta.status = "running"
      meta.stateWord = null // queued 头残留等待标注清掉（转 running——由 chunk 状态词接管）
      meta.queued = false
      // pool 标记语义: async 池条目 started 携 pool:true；同步 spawn 不带 → false。
      meta.pool = m.pool === true
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
  // Terminal statuses → 原地折叠（终态集合闭合——settled 视同 done）。
  const kind = m.status === "done" || m.status === "settled" ? "done"
    : m.status === "cancelled" ? "stopped"
    : m.status === "error" ? "error"
    : m.status === "answered" ? "done"
    : m.status === "terminated" ? "stopped"
    : m.status === "failed" ? "error"
    : null
  if (kind === null) return
  for (const name of blockNamesFor(m.role, m.id, m.model, m.sessionId)) {
    const block = S._subBlocks.get(name)
    if (!block?._subMeta || block._subMeta.frozen) continue
    const meta = block._subMeta
    if (kind === "error" && m.error) meta.error = m.error
    if (m.maxTurns != null) meta.maxTurns = m.maxTurns
    if (m.turn != null) meta.turn = m.turn
    freezeBlock(block, kind)
  }
}

/** Session-exit freeze 兜底（suspension active:false + freeze:true——§17.5.5——panels
 *  直接消费）: 残余 live 块折叠进流（settled 已随消息即时折叠——此兜底只覆盖极窄竞态
 *  ——CLI freezeAllSubTasks 中断语义：不留悬空 live 块）。 */
export function freezeLiveBlocks() {
  for (const block of [...S._subBlocks.values()]) {
    if (block?._subMeta && !block._subMeta.frozen) freezeBlock(block, "done")
  }
}

/** Full reset — 回合中止（abort 无挂起会话）/会话清: 移除 live 块（.sub-live——流内
 *  孤儿一并防御清）+ 清 map。Frozen 块不动（会话流历史——随 150 窗裁）。 */
export function resetActivity() {
  for (const block of S._subBlocks.values()) {
    if (block?._subMeta && !block._subMeta.frozen) block.remove()
  }
  S._subBlocks.clear()
  // 防御清：map 外孤儿 live 块（边缘路径残留）——frozen 不动（无 sub-live）
  for (const el of document.querySelectorAll(".sub-block.sub-live")) el.remove()
}
