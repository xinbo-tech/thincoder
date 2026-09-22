/**
 * session-index.mjs — 会话派生索引库：打开 / DDL / schema / 行写入原语 / 测试缝（SESSION.md §6.19）。
 *
 * 机制契约全文 = `docs/core/design/SESSION.md` §6.19（D-SE43–D-SE47；D2 单一权威源）。
 * 本档 = 「DB 打开 / DDL / schema / 测试缝」面；查询与 FTS 检索 = `session-index-query.mjs`；
 * 写面（枚举 / 水位增量 / 会话重建 / 延迟拍 / 清行）= `session-index-build.mjs` +
 * `session-index-pass.mjs`（>300 软线按设计「跨档线拆分预案」二分）；命令面 = `session-index-cmd.mjs`。
 *
 * **零权威**：主存（槽 JSON + `{槽}.d/` sidecar + manifest）= 真源；本库只读主存（整读 / 偏移
 * `readSync`），**绝不写回** sessions 树；库丢 / 坏 = 重生成（D-SE46 打开即验 + 改名保留自愈）。
 * **零第三方依赖**：仅 `node:` + 仓内相对 import（FTS5 同装配先例 = `memory/schema.mjs`）。
 * 本档静态 import `node:sqlite` ⇒ **消费侧一律动态 import**（W8 契约②——`ledger-db.mjs` 同款：
 * 静态 import 会把 node:sqlite 拉进 `read_history` 的装配期静态闭包）。
 */
import { DatabaseSync } from "node:sqlite"
import { existsSync, mkdirSync, renameSync, rmSync, statSync } from "node:fs"
import { dirname, join } from "node:path"
import { configDir } from "./config-io.mjs"
import { segmentCJK } from "./fts-text.mjs"

/** 库名（单库——与 `memory.db` 同区 `~/.thincoder/`；D-SE43）。 */
export const SESSION_INDEX_DB_NAME = "session-index.db"
/** schema 版本（`index_meta.v` 不符 ⇒ 重建——不做迁移；D-SE46）。 */
export const SESSION_INDEX_SCHEMA_VERSION = "1"
/** 多进程（CLI + VSC 同启）竞争：WAL + busy_timeout（`memory/schema.mjs` 同值）。 */
export const SESSION_INDEX_BUSY_TIMEOUT = 3000
/** 水位 `tail_hash` 窗口 = 末段尾 4KB（D-SE45——等长改写检出）。 */
export const TAIL_HASH_BYTES = 4096
/** `tool_calls` 输出上限（= 存储面同值——`slimForDisplay` 截断面即精度上限；D-SE47）。 */
export const ARG_MAX_CHARS = 300
/** 延迟拍预算（D-SE45 触发点②：单趟 ≤ 2000ms 且 ≤ 40 会话）。 */
export const INDEX_PASS_BUDGET_MS = 2000
export const INDEX_PASS_MAX_SESSIONS = 40
/** 查询窗口缺省 / 上限（与 read_history 参数面同值：缺省 50 / 上限 200）。 */
export const DEFAULT_QUERY_LIMIT = 50
export const MAX_QUERY_LIMIT = 200

// ── 测试缝（`_setLedgerDirForTest` 同款：测试不碰真实用户目录）─────────────────
let indexDirOverride = null
export function _setSessionIndexDirForTest(dir) { indexDirOverride = dir }
export function _resetSessionIndexDirForTest() { indexDirOverride = null }
export function sessionIndexDir() { return indexDirOverride ?? configDir }
export function sessionIndexDbPath() { return join(sessionIndexDir(), SESSION_INDEX_DB_NAME) }

/** DDL（四表 + FTS + 元表；`UNIQUE(sid, idx)` 兼作查询主索引——同列序不重复建；D-SE44）。 */
export const SESSION_INDEX_DDL = `
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY,
  cwd_key TEXT NOT NULL,
  slot INTEGER NOT NULL,
  file TEXT NOT NULL,
  cwd TEXT,
  title TEXT,
  identity TEXT,
  src TEXT NOT NULL,
  updated_at INTEGER,
  indexed_at INTEGER,
  seg_n INTEGER NOT NULL DEFAULT 0,
  seg_bytes INTEGER NOT NULL DEFAULT 0,
  seg_mtime REAL NOT NULL DEFAULT 0,
  tail_hash TEXT NOT NULL DEFAULT '',
  UNIQUE(cwd_key, slot)
);
CREATE TABLE IF NOT EXISTS messages (
  rowid INTEGER PRIMARY KEY,
  sid INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  idx INTEGER NOT NULL,
  seg INTEGER NOT NULL,
  ts INTEGER,
  role TEXT,
  name TEXT,
  tool_call_id TEXT,
  content TEXT NOT NULL DEFAULT '',
  UNIQUE(sid, idx)
);
CREATE INDEX IF NOT EXISTS messages_ts ON messages(ts);
CREATE INDEX IF NOT EXISTS messages_name ON messages(name);
CREATE TABLE IF NOT EXISTS tool_calls (
  id INTEGER PRIMARY KEY,
  sid INTEGER NOT NULL,
  msg_idx INTEGER NOT NULL,
  ord INTEGER NOT NULL,
  call_id TEXT,
  name TEXT,
  args TEXT,
  UNIQUE(sid, msg_idx, ord)
);
CREATE INDEX IF NOT EXISTS tool_calls_name ON tool_calls(name);
CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(seg_content, seg_name, tokenize='unicode61');
CREATE TABLE IF NOT EXISTS index_meta (k TEXT PRIMARY KEY, v TEXT);
`

function openRaw(path) {
  const db = new DatabaseSync(path)
  try {
    db.exec(`PRAGMA journal_mode = WAL`)
    db.exec(`PRAGMA busy_timeout = ${SESSION_INDEX_BUSY_TIMEOUT}`)
    db.exec(`PRAGMA foreign_keys = ON`)
    db.exec(SESSION_INDEX_DDL)
    const v = readMeta(db, "v")
    if (v !== null && v !== SESSION_INDEX_SCHEMA_VERSION) throw new Error(`session index schema ${v} ≠ ${SESSION_INDEX_SCHEMA_VERSION}`)
    if (v === null) {
      writeMeta(db, "v", SESSION_INDEX_SCHEMA_VERSION)
      writeMeta(db, "built_at", Date.now())
    }
  } catch (e) {
    // 失败句柄必须关闭：Windows 上未关闭的句柄会让改名失败（现场保留 + 新建两步都落空）
    try { db.close() } catch { /* ignore */ }
    throw e
  }
  return db
}

/** 打开即验 + 开箱自愈（D-SE46）：缺失 ⇒ 建；打开 / DDL / 版本失败 ⇒ 现场改名
 *  `session-index.db.corrupt-<epochms>`（连同 `-wal` / `-shm`——否则残 WAL 会挂到新库上）+ 新建空库。
 *  仍失败（磁盘满 / 目录不可写 / 无 node:sqlite）⇒ **null = 静默降级**（查询回落主存路径，主存零险）。 */
export function openSessionIndex({ path = sessionIndexDbPath() } = {}) {
  try { mkdirSync(dirname(path), { recursive: true }) } catch { /* 已存在 / 并发建目录竞争 */ }
  try { return openRaw(path) } catch { /* 缺失 / 坏库 / 版本不符 ⇒ 走自愈 */ }
  const stamp = `${path}.corrupt-${Date.now()}`
  for (const suffix of ["", "-wal", "-shm"]) {
    try { if (existsSync(path + suffix)) renameSync(path + suffix, stamp + suffix) } catch { /* 现场保留尽力面 */ }
  }
  try { return openRaw(path) } catch { return null }
}

/** 元表读 / 写（`v` = schema 版本 · `built_at` = 首建 / 全量重建时刻 · `pass_at` = **最近一次
 *  实际写入（变更）时刻**（无源变的 pass 零写、不推进）· 计数快照）。 */
export function readMeta(db, k) {
  try {
    const row = db.prepare("SELECT v FROM index_meta WHERE k = ?").get(k)
    return row ? row.v : null
  } catch { return null }
}

export function writeMeta(db, k, v) {
  db.prepare("INSERT INTO index_meta (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v").run(k, String(v))
}

// ── 行形态（写入面与读出面共用同一口径）──────────────────────────────────────

/** 消息文本（多模态数组取 text 部件拼接）。**与 `agent-tools/read-history.mjs` 的 JSON 面
 *  `messageText` 同规则**——两面各自持有（索引面不得静态引 read-history 的装配面，反之亦然），
 *  等价性由过滤矩阵对拍用例覆盖。 */
export function messageText(m) {
  if (typeof m?.content === "string") return m.content
  if (Array.isArray(m?.content)) {
    return m.content
      .map((p) => (p && typeof p === "object" && p.type === "text" ? p.text ?? "" : ""))
      .filter((t) => t.length > 0)
      .join(" ")
  }
  return ""
}

/** 一次工具声明 → `{ name, args, call_id }`（`{function:{…}}` 与扁平两形兼容；`args` 逐字取存储串）。 */
export function toolCallParts(tc) {
  return {
    call_id: tc?.id ?? null,
    name: tc?.function?.name ?? tc?.name ?? "",
    args: typeof tc?.function?.arguments === "string" ? tc.function.arguments
      : typeof tc?.arguments === "string" ? tc.arguments : null,
  }
}

/** 输出上限（= 存储面同值：≤300 原样，超限截 300 + `…`）。 */
export function capArguments(s) {
  const t = String(s ?? "")
  return t.length <= ARG_MAX_CHARS ? t : t.slice(0, ARG_MAX_CHARS) + "…"
}

// ── 删除面单点（FTS 同删义务——无触发器：四条删除路径全部经此函数，同事务内同步删；§6.19）──

/** 删行单点：`fromIdx = null` ⇒ 整会话（消息 + FTS + 工具声明 + 会话行）；给定 `fromIdx` ⇒ 区间
 *  （`idx >= fromIdx` 的消息 / FTS 与 `msg_idx >= fromIdx` 的声明——段重写 / 重扫面）。 */
export function deleteSessionRows(db, sid, { fromIdx = null } = {}) {
  const range = fromIdx === null ? "" : " AND idx >= ?"
  const mArgs = fromIdx === null ? [sid] : [sid, fromIdx]
  const tRange = fromIdx === null ? "" : " AND msg_idx >= ?"
  db.prepare(`DELETE FROM messages_fts WHERE rowid IN (SELECT rowid FROM messages WHERE sid = ?${range})`).run(...mArgs)
  db.prepare(`DELETE FROM tool_calls WHERE sid = ?${tRange}`).run(...mArgs)
  db.prepare(`DELETE FROM messages WHERE sid = ?${range}`).run(...mArgs)
  if (fromIdx === null) db.prepare(`DELETE FROM sessions WHERE id = ?`).run(sid)
}

/** 单会话清行（源消失面——单事务；幂等）：删四表该会话行 + 推进 `pass_at`
 *  （查询侧据此走回落路径——既有 `session file not found` 文案逐字保留）。 */
export function dropSessionRows(db, sid, now = Date.now()) {
  db.exec("BEGIN IMMEDIATE")
  try {
    deleteSessionRows(db, sid, { fromIdx: null })
    writeMeta(db, "pass_at", now)
    db.exec("COMMIT")
  } catch (e) {
    try { db.exec("ROLLBACK") } catch { /* ignore */ }
    throw e
  }
}

/** `--rebuild` 面：清四表（单事务）+ 刷新 `built_at`。 */
export function clearIndex(db) {
  db.exec("BEGIN IMMEDIATE")
  try {
    db.exec("DELETE FROM messages_fts")
    db.exec("DELETE FROM tool_calls")
    db.exec("DELETE FROM messages")
    db.exec("DELETE FROM sessions")
    writeMeta(db, "built_at", Date.now())
    db.exec("COMMIT")
  } catch (e) {
    try { db.exec("ROLLBACK") } catch { /* 回滚尽力面 */ }
    throw e
  }
}

// ── 会话行 / 消息行 / 声明行写入 ─────────────────────────────────────────────

export function findSessionByFile(db, file) {
  try { return db.prepare("SELECT * FROM sessions WHERE file = ?").get(file) ?? null } catch { return null }
}

export function findSessionByCwdSlot(db, cwdKey, slot) {
  try { return db.prepare("SELECT * FROM sessions WHERE cwd_key = ? AND slot = ?").get(cwdKey, slot) ?? null } catch { return null }
}

/** 建会话行（返回 sid）；同 `(cwd_key, slot)` 已占 ⇒ 先摘旧行（槽号回收 / 轮转 / 本行重建面——
 *  新旧行不混，`UNIQUE(cwd_key, slot)` 零冲突）。 */
export function insertSession(db, row) {
  const old = findSessionByCwdSlot(db, row.cwd_key, row.slot)
  if (old) deleteSessionRows(db, old.id, { fromIdx: null })
  const r = db.prepare(
    `INSERT INTO sessions (cwd_key, slot, file, cwd, title, identity, src, updated_at, indexed_at, seg_n, seg_bytes, seg_mtime, tail_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(row.cwd_key, row.slot, row.file, row.cwd ?? null, row.title ?? null, row.identity ?? null, row.src,
    row.updated_at ?? null, row.indexed_at ?? null, row.seg_n ?? 0, row.seg_bytes ?? 0, row.seg_mtime ?? 0, row.tail_hash ?? "")
  return Number(r.lastInsertRowid)
}

/** 会话级元数据 / 水位推进（单语句——写面在同一事务内调用）。 */
export function updateSession(db, sid, patch) {
  const cols = ["cwd", "title", "identity", "src", "updated_at", "indexed_at", "seg_n", "seg_bytes", "seg_mtime", "tail_hash"]
  const set = cols.filter((c) => patch[c] !== undefined)
  if (set.length === 0) return
  db.prepare(`UPDATE sessions SET ${set.map((c) => `${c} = ?`).join(", ")} WHERE id = ?`).run(...set.map((c) => patch[c]), sid)
}

/** 插消息行（连同 FTS 行——同事务）。`rows` = `{ idx, seg, ts, role, name, tool_call_id, content }`。 */
export function insertMessages(db, sid, rows) {
  const msg = db.prepare(`INSERT INTO messages (sid, idx, seg, ts, role, name, tool_call_id, content) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
  const fts = db.prepare(`INSERT INTO messages_fts (rowid, seg_content, seg_name) VALUES (?, ?, ?)`)
  for (const r of rows) {
    const info = msg.run(sid, r.idx, r.seg, r.ts ?? null, r.role ?? null, r.name ?? null, r.tool_call_id ?? null, r.content ?? "")
    fts.run(Number(info.lastInsertRowid), segmentCJK(r.content ?? ""), segmentCJK(r.name ?? ""))
  }
}

/** 插声明行（`ord` = 该消息内声明序；`args` = 存储串逐字）。 */
export function insertToolCalls(db, sid, rows) {
  const stmt = db.prepare(`INSERT INTO tool_calls (sid, msg_idx, ord, call_id, name, args) VALUES (?, ?, ?, ?, ?, ?)`)
  for (const r of rows) stmt.run(sid, r.msg_idx, r.ord, r.call_id ?? null, r.name ?? "", r.args ?? null)
}

/** `--status` 读数（行数 / 取源分布 / 库字节 / 水位覆盖 / 上次变更时刻）。 */
export function indexSummary(db, { path = sessionIndexDbPath() } = {}) {
  const one = (sql) => { try { return Number(Object.values(db.prepare(sql).get())[0] ?? 0) } catch { return 0 } }
  let bytes = 0
  try { bytes = statSync(path).size } catch { /* 库不在 / 不可读 ⇒ 0 */ }
  return {
    sessions: one("SELECT COUNT(*) FROM sessions"),
    sidecar: one("SELECT COUNT(*) FROM sessions WHERE src = 'sidecar'"),
    json: one("SELECT COUNT(*) FROM sessions WHERE src = 'json'"),
    messages: one("SELECT COUNT(*) FROM messages"),
    toolCalls: one("SELECT COUNT(*) FROM tool_calls"),
    bytes,
    builtAt: Number(readMeta(db, "built_at") ?? 0),
    passAt: Number(readMeta(db, "pass_at") ?? 0),
  }
}

/** 库侧清理（测试收尾 / 现场重置）：删库文件三件套（含 WAL / SHM）。 */
export function removeIndexFiles(path = sessionIndexDbPath()) {
  for (const suffix of ["", "-wal", "-shm"]) {
    try { rmSync(path + suffix, { force: true }) } catch { /* 尽力面 */ }
  }
}
