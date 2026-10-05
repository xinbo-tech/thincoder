/**
 * record-restore.js — 重建件（#726 跨端消化面恢复批 · VSC 承接面）。
 *
 * 机制单源 = `docs/core/design/SESSION.md` §6.26；VSC 承接细则 = `docs/vsc/design/WEBVIEW.md` §5.7。
 * 两产生器（页级 pass 消费面 = `history.js` `applyHistoryPage`）：
 *   ① `digest` 记录 ⇒ 痕元素（构形单源 = `chat-status.js` 构形件——live ∥ 重建同调零副本）；
 *   ② `subagent` 记录 ⇒ 归档块元素 = **活形同构**（核 `subblocks` 原语直消费 + `rows` 回放 +
 *      冻结节 + tail-3）。
 * 判据：
 *   · **复列 = 全量（未结轮照现）**（轮锚 = 起跑记录：起跑 ∥ `n > 0` 计数 ∥ cap 元素随轮出；终态元素需同页 `start`；
 *     可证面 = 轮间 ∥ 末页（扫描结束仍 `open`）；起跑未载的 `cap` ∥ `end` 记录零产——容差① 沿用：跨页分裂轮本页不产）；
 *   · 落位 = **记录位次原位（零配对）**（重建径；与 live `archiveBlock` 到达序两径并存）——页级
 *     pass 按记录序入元素 ⇒ 元素自落其位；
 *   · 元素携 `data-idx`（= 记录全局 `idx`——分页游标 ∥ 防双渲染：同位命中 ⇒ 跳过，幂等）；
 *   · **未归档块不重建**（I-7 收窄：重建只产自记录——live / 在飞块非记录对象）。
 */
import { parseChannel } from "../node_modules/@thincoder/render-core/subblocks/channel.mjs"
import { renderSubBlock, renderSubagentChunk, initBlockFollow } from "../node_modules/@thincoder/render-core/subblocks/block.mjs"
import { refreshBlock } from "./activity-view.js"
import { digestTurnEl, digestCountEl, digestCapEl, digestTerminalEl, digestResidueEl } from "./chat-status.js"

/** 页级轮预扫（**复列全量（未结轮照现）**）：返回 `Map<页内记录下标, { n }>`（置集 = 该轮产出物的记录下标）。
 *  轮锚 = 起跑记录（`start`）；未结判定面 = **可证**两条——① **轮间**（后轮起跑已现 ⇒ 前轮未结——轮序单链）；
 *  ② **末页**（`tail`：**扫描结束仍 `open`**——跨非 digest 记录存续；`end` 若在必在页内）。
 *  `n` = 本轮起跑数（start 记录 `n`；缺 / 非数 ⇒ null）；起跑 ∥ `n > 0` 计数 ∥ cap 元素随轮出 —— 终态元素需同页 `end`；
 *  `end` ∥ `cap` 无同页 `start` ⇒ 零产（防并轮错位——对位桌面 `foldDigest` `open` 闸）；非末页尾残起跑 ⇒ 零产（不可证——容差①）。 */
export function scanPageRounds(messages, tail = false) {
  const plan = new Map()
  let open = null // 打开轮：{ idxs: [start 下标, ...cap 下标], n }
  for (let i = 0; i < messages.length; i += 1) {
    const m = messages[i]
    if (m?.kind !== "digest") continue
    if (m.status === "start") {
      // 轮间可证：后轮起跑已现 ⇒ 前未结轮照出（起跑/cap 归置集——不产终态）
      if (open) for (const idx of open.idxs) plan.set(idx, { n: open.n })
      open = { idxs: [i], n: typeof m.n === "number" ? m.n : null }
      continue
    }
    if (m.status === "cap") { if (open) open.idxs.push(i); continue }
    if (m.status === "end") {
      if (!open) continue // 起跑居前页（跨页分裂）⇒ 终态本页零产
      for (const idx of [...open.idxs, i]) plan.set(idx, { n: open.n })
      open = null
    }
  }
  // 末页可证：扫描结束仍 `open` ⇒ 该轮照现（尾残轮——`end` 若在必在页内）
  if (open && tail) for (const idx of open.idxs) plan.set(idx, { n: open.n })
  return plan
}

/** 单记录元素面（零元素 = 置集外（不可证 ∥ 未知型）——「未归档块不重建」I-7）：`ctx.messagesEl` 同位 `[data-idx]`
 *  命中 ⇒ 跳过（重建插入前去重——幂等）。起跑 ∥ cap 元素随轮出（扫轮置集——未结轮照现）；终态元素需 `n`
 *  （同页起跑）；`n` 非正 ⇒ 零元素（守句——幻影元素禁出）；`unsettled > 0` ⇒ 终态后附残余元素（消化账务批 ·
 *  2026-10-05 · 台账 #930——`end` 记录携载荷同出，live 同构形件）。 */
export function restoreRecordEls(ctx, msg, info) {
  if (!msg || !Number.isFinite(msg.idx)) return []
  if (ctx?.messagesEl?.querySelector(`[data-idx="${msg.idx}"]`) != null) return []
  if (msg.kind === "digest") {
    if (!info) return []
    if (msg.status === "start") {
      const els = [withIdx(digestTurnEl(msg), msg.idx)]
      if ((info.n ?? 0) > 0) els.push(withIdx(digestCountEl(info.n), msg.idx))
      return els
    }
    if (msg.status === "cap") return [withIdx(digestCapEl(msg.mode, msg.turns), msg.idx)]
    if (msg.status === "end") {
      // 活流同门：`n = 0` 轮无计数元素 ⇒ 终态零动作（禁幻影行）
      if (!(Number.isFinite(info.n) && info.n > 0)) return []
      const els = [withIdx(digestTerminalEl(msg.ok !== false, info.n, msg.ms), msg.idx)]
      // 消化账务批（§6.31.6）：`unsettled > 0` ⇒ 残余元素随出（复列承接——记录随载荷携 `unsettled`）
      if ((msg.unsettled ?? 0) > 0) els.push(withIdx(digestResidueEl(msg.unsettled), msg.idx))
      return els
    }
    return []
  }
  if (msg.kind === "subagent") return [withIdx(buildRestoreSubBlock(msg), msg.idx)]
  return []
}

/** 位次锚（重建径独占——live 元素零锚）：`data-idx` = 记录全局 `idx`。 */
function withIdx(el, idx) {
  el.dataset.idx = String(idx)
  return el
}

/** `subagent` 记录 ⇒ 归档块元素（活形同构）：核 `renderSubBlock` 建壳 + `rows` 逐条 `renderSubagentChunk`
 *  回放（重放闸 = 临未冻态——核 `appendAdvisorChunk` 拒冻结块追加）⇒ 冻结节（class 翻转 + `open=false`
 *  + ⏹ 摘除 + `refreshBlock`——tail-3 随折叠出）⇒ 跟滚接线（重建径同源——冻结块零写）。 */
function buildRestoreSubBlock(rec) {
  const model = synthSubModel(rec?.meta)
  const block = renderSubBlock(model)
  for (const row of Array.isArray(rec?.rows) ? rec.rows : []) renderSubagentChunk(block, row)
  model.frozen = true // 冻结节（fold 形——与 live fold 效果同形）
  block.classList.remove("sub-live")
  block.classList.add("sub-frozen")
  block.open = false
  block.querySelector(".sub-stop-btn")?.remove()
  refreshBlock(block)
  initBlockFollow(block)
  return block
}

/** 记录 `meta` ⇒ 块模型（核 `subblocks/state.mjs` 模型形——`renderSubBlock` ∥ `refreshBlock` 直消费）。
 *  已知字段读取 + 缺省回落（#790：`pool`/`queued` 回填 ∥ `key` 容旧形——无前缀 ⇒ 补 `sub:` 再解析）；
 *  `status` 归端容读（本端模型词 = done/cancelled/error；他端词
 *  stopped/terminated/failed 同判并收——记录形契约 `status?` 未钉词表，见批档披露）。 */
function synthSubModel(meta) {
  const m = meta ?? {}
  const rawKey = String(m.key ?? "")
  // #790 读面容旧形：存量 CLI 记录无前缀（append-only 不可迁移）⇒ 按键归一
  const key = rawKey.startsWith("sub:") ? rawKey : `sub:${rawKey}`
  const ch = parseChannel(key)
  const doneAt = Number.isFinite(m.doneAt) ? m.doneAt : null
  const startedAt = Number.isFinite(m.startedAt) ? m.startedAt : (doneAt ?? 0)
  return {
    key, label: ch.label,
    role: ch.role ?? (typeof m.role === "string" ? m.role : null), id: ch.id,
    model: typeof m.model === "string" && m.model !== "" ? m.model : null,
    startedAt, pool: typeof m.pool === "boolean" ? m.pool : null, syncLive: false,
    turn: Number.isFinite(m.turn) ? m.turn : null,
    maxTurns: Number.isFinite(m.maxTurns) ? m.maxTurns : 0,
    status: subStatusOf(m.status), stateWord: null,
    doneAt: doneAt ?? startedAt, frozen: false, error: typeof m.error === "string" ? m.error : null,
    note: typeof m.note === "string" ? m.note : null,
    queued: m.queued === true, queueInfo: null, awaitingDigest: false, approval: null,
  }
}

/** 记录 `status` ⇒ 本端模型词（容读并收——跨端作者词表分化在册）。 */
function subStatusOf(status) {
  if (status === "cancelled" || status === "stopped" || status === "terminated") return "cancelled"
  if (status === "error" || status === "failed") return "error"
  return "done"
}
