/**
 * session-index-build.mjs — 会话枚举 / 取源 / 水位增量 / 会话重建（SESSION.md §6.19 D-SE44/D-SE45；写面）。
 *
 * 机制契约全文 = `docs/core/design/SESSION.md` §6.19（D2 单一权威源）。本档只**读**主存（槽 JSON 整读 / 段偏移
 * `readSync`），绝不写回 sessions 树（零权威）；`session-index.mjs` 的 >300 软线二分产物（设计「跨档线
 * 拆分预案」：枚举与水位增量 ∥ 重建 / 拍 / 清行——拍 / 清行 / 有界趟住 `session-index-pass.mjs`）。
 *
 * 取源**双路**：`<槽文件>.d/` 含 `seg-*.jsonl` ⇒ `src=sidecar`（增量面）；否则 `src=json`（槽 JSON
 * `history` 一次性整档读，mtime / size 键）。水位 = `(seg_n, seg_bytes, seg_mtime, tail_hash)` + 三规则（段号跳过 / 偏移追加（只落完整行）/ 重写检出）；零源变 ⇒ 零读零写。
 */
import { closeSync, openSync, readFileSync, readSync, readdirSync, statSync } from "node:fs"
import { createHash } from "node:crypto"
import { dirname, join } from "node:path"
import { sessionPath } from "./session-slots.mjs"
import { RECORD_SEG_MESSAGES, listSegments, recordDirOf, segName, tryParse } from "./session-segments.mjs"
import {
  TAIL_HASH_BYTES, deleteSessionRows, dropSessionRows, findSessionByFile, insertMessages, insertSession, insertToolCalls,
  messageText, toolCallParts, updateSession, writeMeta,
} from "./session-index.mjs"
/** 观测计数（测试缝：段读计数 / 读字节增量 / 已索引会话数）。 */
export const _indexStats = { segmentReads: 0, bytesRead: 0, sessionsIndexed: 0 }
export function _resetSessionIndexStats() { _indexStats.segmentReads = 0; _indexStats.bytesRead = 0; _indexStats.sessionsIndexed = 0 }

/** sessions 根（核 `sessionPath` 反推——`_setSessionsDirForTest` 沙箱缝自动随动；零副本）。 */
export function sessionsRoot() { return dirname(sessionPath(process.cwd())) }

/** 会话枚举：`^{40 位哈希}\.json\.\d+$` 文件名（不经 `.d` 枚举——孤儿 `.d` 实测 1,119 个）；按源 mtime 降序（拍的选择序）。 */
export function listSessionFiles({ dir = sessionsRoot() } = {}) {
  let names = []
  try { names = readdirSync(dir) } catch { return [] }
  const out = []
  for (const name of names) {
    const m = /^([0-9a-f]{40})\.json\.(\d+)$/.exec(name)
    if (!m) continue
    const file = join(dir, name)
    try { out.push({ file, cwdKey: m[1], slot: Number(m[2]), mtimeMs: statSync(file).mtimeMs }) } catch { /* 竞态消失 */ }
  }
  return out.sort((a, b) => b.mtimeMs - a.mtimeMs)
}

/** 槽文件名 → `{cwdKey, slot}`（枚举面同一正则；入参 = 槽文件绝对路径）。 */
export function slotFileKey(file) {
  const m = /^([0-9a-f]{40})\.json\.(\d+)$/.exec(file.replace(/\\/g, "/").split("/").pop() ?? "")
  return m ? { cwdKey: m[1], slot: Number(m[2]) } : null
}

/** 取源选择：段数 > 0 ⇒ `src=sidecar`；否则 `src=json`（空 `.d` / 只有 `meta.json` 不算有内容）。 */
export function resolveSource(file) {
  const dir = recordDirOf(file)
  const segs = listSegments(dir)
  return segs.length === 0 ? { src: "json", dir: null, segs: [] } : { src: "sidecar", dir, segs }
}

const segPath = (dir, n) => join(dir, segName(n))

/** 槽 JSON 头部 4KB 内的 `cwd`（有界读——不整体 parse；取不到 ⇒ null，行仍以 `file` 锚定）。 */
function readCwdHead(file) {
  let fd = null
  try {
    fd = openSync(file, "r")
    const buf = Buffer.alloc(4096)
    _indexStats.bytesRead += readSync(fd, buf, 0, 4096, 0)
    const m = /"cwd"\s*:\s*("(?:[^"\\]|\\.)*")/.exec(buf.toString("utf8"))
    const v = m ? JSON.parse(m[1]) : null
    return typeof v === "string" ? v : null
  } catch { return null } finally { if (fd !== null) try { closeSync(fd) } catch { /* ignore */ } }
}

/** `<hash>.json.manifest` 槽摘要（每 cwd 一次读；缺失 ⇒ null，不落错值）。 */
export function readManifestDigest(file, cwdKey) {
  try { const m = JSON.parse(readFileSync(join(dirname(file), `${cwdKey}.json.manifest`), "utf8")); return m?.slots && typeof m.slots === "object" ? m.slots : null } catch { return null }
}

/** sidecar 身份锚（`meta.json.identity`——槽号回收 / 轮转 ⇒ 会话级重建）。 */
function readSidecarIdentity(dir) {
  try { const m = JSON.parse(readFileSync(join(dir, "meta.json"), "utf8")); return typeof m?.identity === "string" && m.identity ? m.identity : null } catch { return null }
}

/** 一条消息 → 行（内容 / 名字 / 声明面同源；`ts` 仅取数值——legacy null）。 */
function messageRow(m, idx, seg) {
  return {
    idx, seg, ts: typeof m?.ts === "number" ? m.ts : null, role: typeof m?.role === "string" ? m.role : null,
    name: typeof m?.name === "string" ? m.name : null, tool_call_id: typeof m?.tool_call_id === "string" ? m.tool_call_id : null,
    content: messageText(m), calls: Array.isArray(m?.tool_calls) ? m.tool_calls.map(toolCallParts) : [],
  }
}

/** 完整行切分：末尾无换行的半行丢弃（只落完整行——水位停在最后一个换行处）。 */
function completeLines(text) {
  const cut = text.lastIndexOf("\n")
  if (cut < 0) return { lines: [], bytes: 0 }
  const lines = text.slice(0, cut + 1).split("\n")
  lines.pop()
  return { lines, bytes: Buffer.byteLength(text.slice(0, cut + 1), "utf8") }
}

/** 整段读（`mtime` = 读前 stat——并发写时下趟按 size 增量补齐）。 */
function readSegment(path) {
  let st = null
  try { st = statSync(path) } catch { return { lines: [], bytes: 0, mtime: 0 } }
  _indexStats.segmentReads++
  let text = ""
  try { text = readFileSync(path, "utf8") } catch { return { lines: [], bytes: 0, mtime: st.mtimeMs } }
  _indexStats.bytesRead += Buffer.byteLength(text, "utf8")
  return { ...completeLines(text), mtime: st.mtimeMs }
}

/** 偏移追加读（自 `fromByte`；只落完整行——返回新水位字节位）。 */
function readIncrement(path, fromByte) {
  let st = null
  try { st = statSync(path) } catch { return { lines: [], bytes: fromByte, mtime: 0 } }
  if (st.size <= fromByte) return { lines: [], bytes: fromByte, mtime: st.mtimeMs }
  let text = ""
  let fd = null
  _indexStats.segmentReads++
  try {
    fd = openSync(path, "r")
    const buf = Buffer.alloc(st.size - fromByte)
    const n = readSync(fd, buf, 0, buf.length, fromByte)
    text = buf.toString("utf8", 0, n)
    _indexStats.bytesRead += n
  } catch { return { lines: [], bytes: fromByte, mtime: st.mtimeMs } } finally { if (fd !== null) try { closeSync(fd) } catch { /* ignore */ } }
  const c = completeLines(text)
  return { lines: c.lines, bytes: fromByte + c.bytes, mtime: st.mtimeMs }
}

/** 尾哈希（文件末 4KB 的 sha1——等长改写检出，D-SE45 规则③；与比对侧同口径 = 现盘文件末尾窗口）。 */
function tailHash(path) {
  let st = null
  try { st = statSync(path) } catch { return "" }
  const len = Math.min(TAIL_HASH_BYTES, st.size)
  if (len <= 0) return ""
  const buf = Buffer.alloc(len)
  let fd = null
  try {
    fd = openSync(path, "r")
    const n = readSync(fd, buf, 0, len, st.size - len)
    _indexStats.bytesRead += n
    return createHash("sha1").update(buf.subarray(0, n)).digest("hex")
  } catch { return "" } finally { if (fd !== null) try { closeSync(fd) } catch { /* ignore */ } }
}

/** 行 → 消息行（半行 / 损坏行跳过；`idx` 只数可解析行——与槽 JSON 投影面跳过损坏行同口径；`k0` = 该段已落行数）。 */
function parsedRows(lines, seg, k0) {
  const base = (seg - 1) * RECORD_SEG_MESSAGES
  const rows = []
  for (const line of lines) {
    const m = line === "" ? undefined : tryParse(line)
    if (m === undefined) continue
    rows.push(messageRow(m, base + k0 + rows.length, seg))
  }
  return rows
}

/** 行集 → 表（消息 + FTS 同事务；声明 `ord` = 消息内序）。 */
function writeRows(db, sid, rows) {
  insertMessages(db, sid, rows)
  const calls = rows.flatMap((r) => r.calls.map((c, k) => ({ msg_idx: r.idx, ord: k, call_id: c.call_id, name: c.name, args: c.args })))
  insertToolCalls(db, sid, calls)
}

/** `pass_at` = 最近一次实际写入（变更）时刻 + 计数快照（无源变的 pass 零写、不推进）。 */
export function bumpMeta(db, now) {
  writeMeta(db, "pass_at", now)
  for (const [k, sql] of [["snapshot_sessions", "SELECT COUNT(*) FROM sessions"], ["snapshot_messages", "SELECT COUNT(*) FROM messages"], ["snapshot_tool_calls", "SELECT COUNT(*) FROM tool_calls"]]) {
    try { writeMeta(db, k, Object.values(db.prepare(sql).get())[0]) } catch { /* 计数快照尽力面 */ }
  }
}

/** 会话行公共字段（`cwd` / `title` / `updated_at` 取源见 §6.19：头 4KB + manifest 槽摘要）。 */
function sessionFields(file, srcTag, meta) {
  const d = meta.digest && meta.slot !== null ? meta.digest[String(meta.slot)] : null
  return {
    cwd_key: meta.cwdKey, slot: meta.slot, file, src: srcTag, identity: meta.identity, cwd: readCwdHead(file),
    title: typeof d?.title === "string" ? d.title : null,
    updated_at: Number.isFinite(d?.updatedAt) ? d.updatedAt : Number.isFinite(d?.ts) ? d.ts : null,
    indexed_at: meta.now,
  }
}

/** 单会话索引（水位增量；返回 `{changed, readBytes?}`——写失败 = 静默降级（主存零险））。 */
export function indexSession(db, file, { force = false, cwdKey = null, slot = null, digest = null, now = Date.now() } = {}) {
  let st = null
  try { st = statSync(file) } catch {
    // 源消失（库内可能仍有行）⇒ 先清该会话行（调用侧据此走回落路径——既有文案）
    const gone = findSessionByFile(db, file)
    if (gone) dropSessionRows(db, gone.id, now)
    return { changed: false, missing: true }
  }
  const src = resolveSource(file)
  const row = findSessionByFile(db, file)
  const lastSeg = src.segs.length ? src.segs[src.segs.length - 1] : 0
  const identity = src.src === "sidecar" ? readSidecarIdentity(src.dir) : null
  const shrank = !!row && row.src === "sidecar" && src.src === "sidecar" && lastSeg < row.seg_n
  const identityChanged = !!(identity && row && row.identity && identity !== row.identity)
  const full = force || !row || row.src !== src.src || shrank || identityChanged
  const key = slotFileKey(file)
  const meta = { cwdKey: cwdKey ?? row?.cwd_key ?? key?.cwdKey ?? null, slot: slot ?? row?.slot ?? key?.slot ?? null, identity, digest, now }

  if (src.src === "json") {
    if (!full && row.seg_bytes === st.size && row.seg_mtime === st.mtimeMs) return { changed: false, readBytes: 0 }
    return ingestJson(db, file, st, row, meta)
  }
  const plan = planSidecar(row, src, full)
  return plan.mode === "noop" ? { changed: false, readBytes: 0 } : ingestSidecar(db, file, src, plan, row, meta)
}

/** 水位三规则（D-SE45）：`full` ⇒ 全量重扫；否则按水位段 size / mtime / tail_hash 判 零动作 / 偏移追加 / 该段起重建；段号 > `seg_n` ⇒ 整段建。 */
function planSidecar(row, src, full) {
  if (full) return { mode: "reset", fromSeg: 1 }
  let st = null
  try { st = statSync(segPath(src.dir, row.seg_n)) } catch { return { mode: "reset", fromSeg: row.seg_n } }
  let mode = "noop"
  if (st.size < row.seg_bytes) mode = "reset" // ② 段被重写（_materialize / 隔离重建面）
  else if (st.size === row.seg_bytes) {
    // ② 零动作 / ③ 同尺寸异内容（等长重写）——只信 size / mtime 会漏检（尾哈希第三层）
    mode = st.mtimeMs === row.seg_mtime || tailHash(segPath(src.dir, row.seg_n)) === row.tail_hash ? "noop" : "reset"
  } else mode = "append" // ② 自 seg_bytes 偏移读增量
  if (mode === "noop" && src.segs[src.segs.length - 1] > row.seg_n) mode = "append" // 段号 > seg_n（轮转）
  return { mode, fromSeg: row.seg_n }
}

/** `src=json`：槽 JSON `history` 一次性整档读（mtime / size 键；无增量面 ⇒ 变即整会话重建）。 */
function ingestJson(db, file, st, row, meta) {
  _indexStats.segmentReads++
  let data = null
  try {
    const text = readFileSync(file, "utf8")
    _indexStats.bytesRead += Buffer.byteLength(text, "utf8")
    data = JSON.parse(text)
  } catch { return { changed: false, skipped: "unreadable" } }
  const history = Array.isArray(data?.history) ? data.history : null
  if (!history) return { changed: false, skipped: "no-history" }
  db.exec("BEGIN IMMEDIATE")
  try {
    if (row) deleteSessionRows(db, row.id, { fromIdx: null })
    const sid = insertSession(db, { ...sessionFields(file, "json", meta), seg_n: 0, seg_bytes: st.size, seg_mtime: st.mtimeMs, tail_hash: "" })
    const rows = []
    history.forEach((m, i) => rows.push(messageRow(m, i, 1)))
    writeRows(db, sid, rows)
    bumpMeta(db, meta.now)
    db.exec("COMMIT")
    _indexStats.sessionsIndexed++
    return { changed: true, messages: rows.length, readBytes: st.size }
  } catch (e) {
    try { db.exec("ROLLBACK") } catch { /* ignore */ }
    return { changed: false, error: e.message }
  }
}

/** `src=sidecar`：区间删行（reset 面）→ 增量 / 整段读 → 插行 → 水位推进（单事务）。 */
function ingestSidecar(db, file, src, plan, row, meta) {
  const fromSeg = plan.fromSeg
  db.exec("BEGIN IMMEDIATE")
  try {
    let sid = row?.id ?? null
    if (plan.mode === "reset" && sid !== null) {
      if (fromSeg <= 1) { deleteSessionRows(db, sid, { fromIdx: null }); sid = null }
      else deleteSessionRows(db, sid, { fromIdx: (fromSeg - 1) * RECORD_SEG_MESSAGES })
    }
    if (sid === null) sid = insertSession(db, { ...sessionFields(file, "sidecar", meta), seg_n: 0, seg_bytes: 0, seg_mtime: 0, tail_hash: "" })
    let last = null
    if (plan.mode === "append") {
      const have = Number(db.prepare("SELECT COUNT(*) AS n FROM messages WHERE sid = ? AND seg = ?").get(sid, row.seg_n)?.n ?? 0)
      const inc = readIncrement(segPath(src.dir, row.seg_n), row.seg_bytes)
      writeRows(db, sid, parsedRows(inc.lines, row.seg_n, have))
      last = { seg: row.seg_n, bytes: inc.bytes, mtime: inc.mtime }
    }
    for (const n of src.segs) {
      if (n < fromSeg) continue // ① 已写段不可变 ⇒ 跳过
      if (n === fromSeg && plan.mode === "append") continue // 水位段已按偏移增量处理
      const seg = readSegment(segPath(src.dir, n))
      writeRows(db, sid, parsedRows(seg.lines, n, 0))
      last = { seg: n, bytes: seg.bytes, mtime: seg.mtime }
    }
    const patch = last ? { seg_n: last.seg, seg_bytes: last.bytes, seg_mtime: last.mtime, tail_hash: tailHash(segPath(src.dir, last.seg)) } : {}
    updateSession(db, sid, { identity: meta.identity, src: "sidecar", indexed_at: meta.now, ...patch })
    bumpMeta(db, meta.now)
    db.exec("COMMIT")
    _indexStats.sessionsIndexed++
    return { changed: true, lastSeg: last?.seg ?? null }
  } catch (e) {
    try { db.exec("ROLLBACK") } catch { /* ignore */ }
    return { changed: false, error: e.message }
  }
}

/** 懒保证（触发点①——**射程 = 有段档（`src=sidecar`）**）：`src=json` 档免 ensure（整档 JSON 读与回落路径同成本、无收益 ⇒ 其索引化只归延迟拍 / `--rebuild` 两面）。 */
export function ensureSessionIndexed(db, file, opts = {}) {
  try { statSync(file) } catch { return indexSession(db, file, opts) } // 源消失 ⇒ 清行后回落（见下）
  const src = resolveSource(file)
  if (src.src !== "sidecar") return { changed: false, skipped: "json-source" }
  const row = findSessionByFile(db, file)
  const key = slotFileKey(file)
  const cwdKey = row?.cwd_key ?? key?.cwdKey ?? null
  if (row?.src === "json") return indexSession(db, file, { ...opts, cwdKey, slot: row.slot, digest: readManifestDigest(file, cwdKey) })
  return indexSession(db, file, { ...opts, cwdKey, slot: row?.slot ?? key?.slot ?? null, digest: row ? null : cwdKey ? readManifestDigest(file, cwdKey) : null })
}
