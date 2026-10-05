/**
 * lifecycle-records.mjs — 消化生命周期面记录承载件（#726 跨端消化面恢复批 —— CLI 承接面）。
 *
 * 机制单源 = `docs/core/design/SESSION.md` §6.26（记录形 ∥ 写缝 ∥ 读缝 ∥ 重建义务 ∥ 容差登记）；
 * CLI 承接细则 = `docs/cli/design/TUI-SESSION-VIEW.md` §6。本档 = 三写点 + 恢复面的**单一实现**：
 *   ① 记录形构建：`digest` 三型（start ∥ cap ∥ end）∥ `subagent` 快照（meta ∥ rows——rows 保尾 ≤500）；
 *   ② 痕行文本：digest 记录的可见行文案——live（`digestTurn` ∥ cap 分支）与重建（`historyToLines`）同调；
 *   ③ 重建：`subagent` 记录 ⇒ `_frozenSubTask` 合成件（渲染端零改消费——折叠头 + tail-3）；
 *   ④ 终态行回扫：end 记录页内缺席本轮 start ⇒ `store.page` 向更早逐段回读补齐 `n`（跨页零损）。
 * 写点三处 = `suspension-drive.mjs` `digestTurn` ∥ `agent-turn.mjs` cap 分支 ∥ `subagent-freeze.mjs` `freezeSubTaskLines`。
 */
import { t } from "@thincoder/core/i18n.mjs"
import { RECORD_SEG_MESSAGES } from "@thincoder/core/session-store.mjs"
import { C } from "./ansi.mjs"

/** rows 保尾上界（显示行——§6.26「有界保尾」：超界弃最旧 ⇒ 前置省略标记行，标记自身不占额度）。 */
export const RECORD_ROWS_MAX_LINES = 500

/** 写缝载体（`state._agent` ∥ `ctx.agent`——端侧钉定二源，生产同对象；双缺 ⇒ null ⇒ 核口零动作）。 */
export function recordCarrier(state, agent) {
  return state?._agent ?? agent ?? null
}

// ─── ① 记录形构建（写点三处）─────────────────────────────────────────────

/** digest 起跑记录（起跑两行同点）：`n` = 起跑待消化数（可 0）；`tier` 两档；ask 档携 `from`/`msg`。 */
export function digestStartRecord({ n, upstream, ask }) {
  return { kind: "digest", status: "start", n, tier: upstream ? "ask" : "digest", ...(ask ?? {}) }
}

/** digest 撞帽记录（cap 行同点；CLI 现无 auto 档产者——读取面按契约前向兼容）。 */
export function digestCapRecord(turns) {
  return { kind: "digest", status: "cap", mode: "stop", turns }
}

/** digest 收尾记录（终态行同点）：`ok` ∥ `ms`（行文案 `seconds` 由同一 `ms` 派生——同值单算式）；
 *  `unsettled` = 本轮未销账条数（消化账务批 · 2026-10-05 · 台账 #930 —— 残余行判据 ∥ 重建同调；
 *  零未销账 ⇒ 键缺席——零噪音，与帧面「> 0 才携」同判）。 */
export function digestEndRecord({ ok, ms, unsettled = 0 }) {
  return { kind: "digest", status: "end", ok, ms, ...(Number.isFinite(unsettled) && unsettled > 0 ? { unsettled } : {}) }
}

/** subagent 归档快照记录（冻结载体行插入同点）：meta = 冻结时点块头事实（含 `pool`/`queued?`——§6.26）
 *  ∥ rows = 块内容行集（保尾 ≤500）。#790：`key` 写面归一 = 规范形 `sub:<role>#<id>`。 */
export function subagentRecord(sub) {
  const localKey = String(sub.key ?? "")
  const meta = {
    key: localKey.startsWith("sub:") ? localKey : `sub:${localKey}`,
    role: sub.role ?? null,
    model: sub.model ?? null,
    startedAt: sub.started ?? null,
    doneAt: sub.doneAt ?? null,
    turn: sub.turn ?? null,
    maxTurns: sub.maxTurns ?? null,
    status: sub.stopped ? "stopped" : sub.lastError ? "error" : "done",
  }
  if (sub.queued) meta.queued = true // 排队（未启动）⇒ 重建面 waiting 标注（`pool` 不写——未知）
  else meta.pool = sub.async === true // 非排队显式两写（VSC 头段在场性判据 = `pool != null`——缺省会藏段）
  if (sub.lastError) meta.error = sub.lastError // §6.26 meta `error?`（块头事实——重建面还原冻结头 errPart）
  return { kind: "subagent", meta, rows: boundRows(rowsOf(sub)).map(({ kind, text }) => ({ kind, text })) }
}

/** 块内容行集（条目形 `{kind,text}` 同备；trim 标记随行——保尾裁量时不占额度）。 */
function rowsOf(sub) {
  const out = []
  for (const b of sub.blocks ?? []) {
    if (!b || typeof b.text !== "string") continue
    const row = { kind: typeof b.kind === "string" ? b.kind : "text", text: b.text }
    if (b._trimMarker === true) row._trimMarker = true
    out.push(row)
  }
  return out
}

/** 行显示行数（核 `countBlockLines` 同式：按 `\n` 切分、文末换行不计）。 */
function rowLines(row) {
  const lines = String(row?.text ?? "").split("\n")
  return lines[lines.length - 1] === "" ? lines.length - 1 : lines.length
}

/** rows 保尾上界（§6.26「有界保尾」）：超界弃最旧 ⇒ 前置省略标记行（`N` = 实弃显示行数、
 *  标记自身不占额度）；单行超界保末行（行 = 最小单元，不切行中——桌面归档先例同式）。 */
function boundRows(rows) {
  const list = Array.isArray(rows) ? rows : []
  const isMarker = (r) => r?._trimMarker === true
  const cost = (r) => (isMarker(r) ? 0 : rowLines(r))
  let total = 0
  let start = list.length
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const n = cost(list[i])
    if (total + n > RECORD_ROWS_MAX_LINES) break
    total += n
    start = i
  }
  if (start === list.length && list.length > 0) start = list.length - 1 // 单行超界：保末行（保尾）
  const kept = [...list.slice(0, start).filter(isMarker), ...list.slice(start)]
  if (kept.length === list.length) return list // 未超界：原引用（零写）
  let dropped = 0
  for (let i = 0; i < start; i += 1) dropped += cost(list[i])
  return [{ kind: "meta", text: `… [rows truncated: ${dropped} lines omitted]` }, ...kept]
}

// ─── ② 痕行文本（live ∥ 重建同调——单一实现零副本）─────────────────────────

/** digest 记录 ⇒ 痕行（文案与活流同算式）。`startN` = end 行的本轮起跑数（调用面解析——
 *  页内直用 ∥ 存储回扫）；缺省 / 非正数 / `ms` 非数 ⇒ 零行（活流同门 `pend0 > 0`）。 */
export function digestTraceLines(rec, startN = null) {
  if (rec?.kind !== "digest") return []
  if (rec.status === "start") {
    const ask = rec.tier === "ask" && rec.from !== undefined ? { from: rec.from, msg: rec.msg } : null
    const lines = [{ text: ask ? t("digest.turnLabelAsk", ask) : t("digest.turnLabel"), color: C.dim }]
    if (rec.n > 0) lines.push({ text: t("digest.start", { n: rec.n }), color: C.dim })
    return lines
  }
  if (rec.status === "cap") return [{ text: t("digest.capStop", { turns: rec.turns }), color: C.warn }]
  if (rec.status === "end") {
    if (!Number.isFinite(startN) || startN <= 0 || !Number.isFinite(rec.ms)) return []
    const seconds = (rec.ms / 1000).toFixed(1) // 与记录 `ms` 同值单算式
    const lines = [{ text: t(rec.ok === false ? "digest.aborted" : "digest.done", { n: startN, seconds }), color: C.dim }]
    // 未销账残余行（消化账务批 · 2026-10-05 · 台账 #930 · §6.31.6）：终态行之后再落一行 dim
    // （核字典 `digest.residue` 单源——端侧零自持字面）；零未销账 ⇒ 零行（零噪音）。
    // 随终态行同门（重建面 `startN` 不可得 ⇒ 零行——fail-closed）。
    const unsettled = Number.isFinite(rec.unsettled) && rec.unsettled > 0 ? rec.unsettled : 0
    if (unsettled > 0) lines.push({ text: t("digest.residue", { n: unsettled }), color: C.dim })
    return lines
  }
  return []
}

// ─── ③ 重建（读面）：subagent 记录 ⇒ 合成件 ────────────────────────────────

/** subagent 记录 ⇒ `_frozenSubTask` 合成件（重建面；渲染端零改消费——折叠头 + tail-3 原式）。
 *  meta 块头事实逐项回填（渲染端读面：started→elapsed ∥ turn/maxTurns ∥ stopped ∥ error→errPart）；
 *  #790：`pool`/`queued` ⇒ CLI 本地两事实（`async`/`queued`）∥ `key` 剥 `sub:` 前缀（显示 = 本地无前缀形）。 */
export function synthSubTask(rec) {
  const meta = rec?.meta ?? {}
  const rows = Array.isArray(rec?.rows) ? rec.rows : []
  const blocks = rows.map((r) => ({ kind: typeof r?.kind === "string" ? r.kind : "text", text: String(r?.text ?? "") }))
  const doneAt = Number.isFinite(meta.doneAt) ? meta.doneAt : null
  const started = Number.isFinite(meta.startedAt) ? meta.startedAt : (doneAt ?? 0)
  return {
    key: String(meta.key ?? "").replace(/^sub:/, ""), // #790：读面容旧形——剥离判别（折叠键 ∥ 显示 = 本地无前缀形）
    role: meta.role ?? null,
    model: meta.model ?? null,
    started,
    done: true,
    doneAt: doneAt ?? started,
    turn: meta.turn ?? null,
    maxTurns: meta.maxTurns ?? null,
    async: meta.pool === true, // #790：记录 `pool` ⇒ 折叠头模式词（§6.26 命名映射：记录 pool ⇄ 本地 async）
    queued: meta.queued === true, // #790：排队冻结 ⇒ 折叠头 waiting 标注
    // #795 残项批：停止面词集扩三词（stopped ∥ cancelled ∥ terminated——词面判据单源 = §6.26；VSC/桌面写 cancelled）。
    stopped: meta.status === "stopped" || meta.status === "cancelled"
      || meta.status === "terminated",
    lastError: typeof meta.error === "string" ? meta.error : null,
    blocks,
    _charCount: blocks.reduce((n, b) => n + b.text.length, 0), // 行集字符和（§5.4 账实一致——恢复直算同源）
  }
}

// ─── ④ 终态行回扫（重建面：跨页分裂 ⇒ 存储逐段回读）─────────────────────────

/** 页内（含 ±1 页沿）本轮 start 直用：自 `idx` 向前命中最近 digest start ⇒ 其 `n`（无 ⇒ null）。 */
function pageStartN(records, idx) {
  for (let j = idx - 1; j >= 0; j -= 1) {
    const r = records[j]
    if (r?.kind === "digest" && r.status === "start") return typeof r.n === "number" ? r.n : null
  }
  return null
}

/** end 记录本轮 start 的 `n`（重建面解析序 = 预解析注记 `_startN`（跨页回扫产物）→ 页内回扫）。 */
export function resolvedStartN(records, idx) {
  const m = records?.[idx]
  if (m?._startN !== undefined) return m._startN
  return pageStartN(records, idx)
}

/** 存储回扫：`store.page` 向更早逐段回读，至命中本轮 start 止（跨页零损——容差①于 CLI 不成立）。 */
export function scanStoreForStartN(store, endIdx) {
  if (!store?.page || !Number.isFinite(endIdx) || endIdx <= 0) return null
  let hi = Math.floor(endIdx)
  while (hi > 0) {
    const lo = Math.max(0, hi - RECORD_SEG_MESSAGES)
    let messages = []
    try { messages = store.page(lo, hi, { margin: 0 })?.messages ?? [] } catch { return null }
    for (let k = messages.length - 1; k >= 0; k -= 1) {
      const r = messages[k]
      if (r?.kind === "digest" && r.status === "start") return typeof r.n === "number" ? r.n : null
    }
    hi = lo
  }
  return null
}

/** 预解析（调用面 = `restoreLines` ∥ `createLoadOlder`——持有存储读口）：页内（含 ±1 页沿）缺席
 *  本轮 start 的 end ⇒ 回扫 `n` 并注记 `_startN`（重建注记——不动存储形）。 */
export function resolveSplitTerminalNs(records, base, store) {
  if (!Array.isArray(records) || !store?.page || !Number.isFinite(base)) return
  for (let k = 0; k < records.length; k += 1) {
    const m = records[k]
    if (m?.kind !== "digest" || m.status !== "end" || m._startN !== undefined) continue
    if (pageStartN(records, k) !== null) continue // 页内直用——零回扫
    const n = scanStoreForStartN(store, base + k)
    if (n !== null) m._startN = n
  }
}
