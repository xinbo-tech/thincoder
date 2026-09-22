/**
 * session-index.test.mjs — 会话派生索引库核心面（SESSION.md §6.19 D-SE43–D-SE47；批档 §2 用例表）：
 * T-1 建库 / T-2+T-3 增量与幂等 / T-4 段轮转 / T-5 段重写（materialize）/ T-6 等长改写（tail_hash）/
 * T-7 源消失清行 / T-12+T-13 删库与坏库自愈 / T-15 双句柄并发 / T-16+T-17 主存零改与零依赖 /
 * T-18 FTS 语义（all 面）。夹具 = 真实盘面（真段文件 + 真槽 JSON，无 mock）；沙箱缝 =
 * `_setSessionsDirForTest` + `_setSessionIndexDirForTest`（禁触真实用户目录）。
 * read_history 侧面（T-8/T-9/T-10/T-11）= `thincoder-cli/test/read-history-guard.test.mjs`。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { _setSessionsDirForTest, _resetSessionsDirForTest } from "../session-slots.mjs"
import * as IDX from "../session-index.mjs"
import * as Q from "../session-index-query.mjs"
import * as BUILD from "../session-index-build.mjs"
import * as PASS from "../session-index-pass.mjs"

const CORE = join(dirname(fileURLToPath(import.meta.url)), "..")
const REPO = join(CORE, "..")
const HASH = "a".repeat(40)
const HASH_B = "b".repeat(40)
const dirs = []
process.on("exit", () => { for (const d of dirs) { try { rmSync(d, { recursive: true, force: true }) } catch { /* ignore */ } } })

/** 沙箱：temp sessions 根 + temp 索引目录（禁触真实 `~/.thincoder`）。 */
const sandbox = () => {
  const root = mkdtempSync(join(tmpdir(), "core-si-"))
  dirs.push(root)
  const sessions = join(root, "sessions")
  mkdirSync(sessions)
  _setSessionsDirForTest(sessions)
  IDX._setSessionIndexDirForTest(join(root, "index"))
  BUILD._resetSessionIndexStats()
  return { sessions, dbPath: join(root, "index", IDX.SESSION_INDEX_DB_NAME) }
}
const teardown = () => { _resetSessionsDirForTest(); IDX._resetSessionIndexDirForTest() }
const slotFile = (sessions, hash = HASH, slot = 1) => join(sessions, `${hash}.json.${slot}`)
const segFile = (slot, n) => join(`${slot}.d`, `seg-${String(n).padStart(6, "0")}.jsonl`)
const msg = (i) => ({ role: i % 3 === 0 ? "user" : i % 3 === 1 ? "assistant" : "tool", ts: 1000 + i, ...(i % 3 === 2 ? { name: "bash" } : {}), content: `m${i} kw${i % 5 === 0 ? " 命中" : ""}` })
const decl = (i) => ({ role: "assistant", ts: 1000 + i, content: "", tool_calls: [{ id: `call_${i}`, type: "function", function: { name: "read", arguments: `{"path":"f${i}"}` } }] })
const lineAt = (i) => JSON.stringify(i === 5 ? decl(i) : msg(i)) // 第 5 条 = 声明行夹具（tool_calls 面）
const withDb = (fn) => { const db = IDX.openSessionIndex(); assert.ok(db, "索引库可打开"); try { return fn(db) } finally { db.close() } }
const countOf = (db, table) => db.prepare(`SELECT COUNT(*) n FROM ${table}`).get().n
const allOf = (db, sql, ...args) => db.prepare(sql).all(...args)

/** sidecar 夹具：`batches` = 每段消息数（全局序号生成——段号与 idx 算术同 §6.14）；
 *  槽 JSON 写同内容投影（= `saveProjectedSlot` 产物语义——materialize / src 切换面用）。 */
function seedSidecar(sessions, batches, { hash = HASH, slot = 1, identity = "id-a" } = {}) {
  const file = slotFile(sessions, hash, slot)
  mkdirSync(`${file}.d`, { recursive: true })
  const all = []
  let i = 0
  batches.forEach((n, k) => {
    const lines = []
    for (let j = 0; j < n; j++, i++) { const m = i === 5 ? decl(i) : msg(i); all.push(m); lines.push(JSON.stringify(m)) }
    writeFileSync(segFile(file, k + 1), lines.join("\n") + "\n")
  })
  writeFileSync(join(`${file}.d`, "meta.json"), JSON.stringify({ v: 1, segSize: 100, identity }))
  writeFileSync(file, JSON.stringify({ version: 2, cwd: "C:/proj/a", history: all }))
  return file
}

/** JSON-only 夹具：单行槽（`version 2` + `history`）。 */
function seedJson(sessions, history, { hash = HASH_B, slot = 1, extra = {} } = {}) {
  const file = slotFile(sessions, hash, slot)
  writeFileSync(file, JSON.stringify({ version: 2, cwd: "C:/proj/b", history, ...extra }))
  return file
}

test("T-1 建库：行数与内容对拍 + schema 五面 + 取源双路 / 元数据取源面", () => {
  const { sessions } = sandbox()
  const side = seedSidecar(sessions, [100, 100, 50])
  seedJson(sessions, Array.from({ length: 40 }, (_, i) => msg(i)))
  writeFileSync(join(sessions, `${HASH_B}.json.manifest`), JSON.stringify({ slots: { 1: { ts: 5, title: "Session B", updatedAt: 7777 } }, active: 1 }))
  withDb((db) => {
    assert.equal(PASS.syncSessions(db).changed, 2)
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type IN ('table','index')").all().map((t) => t.name)
    for (const t of ["sessions", "messages", "tool_calls", "messages_fts", "index_meta"]) assert.ok(tables.includes(t), `schema 面在位：${t}`)
    assert.deepEqual([countOf(db, "sessions"), countOf(db, "messages")], [2, 290])
    const sid = db.prepare("SELECT id FROM sessions WHERE file = ?").get(side).id
    allOf(db, "SELECT idx, ts, role, content FROM messages WHERE sid = ? ORDER BY idx", sid).forEach((row, i) => {
      const src = i === 5 ? decl(i) : msg(i)
      assert.deepEqual([row.idx, row.ts, row.role, row.content], [i, src.ts, src.role, src.content ?? ""])
    })
    const calls = allOf(db, "SELECT msg_idx, ord, call_id, name, args FROM tool_calls")
    assert.deepEqual(calls.map((c) => [c.msg_idx, c.ord, c.call_id, c.name, c.args]), [[5, 0, "call_5", "read", '{"path":"f5"}']])
    // 取源双路 + `cwd`（头 4KB）/ `title` / `updated_at`（manifest 槽摘要）
    const sess = allOf(db, "SELECT src, cwd, title, updated_at, seg_n FROM sessions ORDER BY src")
    assert.deepEqual(sess.map((s) => [s.src, s.cwd, s.title, s.updated_at, s.seg_n]), [["json", "C:/proj/b", "Session B", 7777, 0], ["sidecar", "C:/proj/a", null, null, 3]])
    const sum = IDX.indexSummary(db)
    assert.deepEqual([sum.sessions, sum.sidecar, sum.json, sum.messages, sum.toolCalls], [2, 1, 1, 290, 1])
  })
  teardown()
})

test("T-2/T-3 增量与幂等：恰增 1 行（idx = 旧 total）∧ 其余 rowid 不变 ∧ 二次 pass 零读零写", () => {
  const { sessions } = sandbox()
  const file = seedSidecar(sessions, [100, 100, 50])
  withDb((db) => {
    PASS.syncSessions(db)
    const before = allOf(db, "SELECT rowid, idx FROM messages ORDER BY rowid LIMIT 5")
    const total = countOf(db, "messages")
    BUILD._resetSessionIndexStats()
    appendFileSync(segFile(file, 3), JSON.stringify({ role: "assistant", ts: 9999, content: "appended" }) + "\n")
    assert.equal(PASS.syncSessions(db).changed, 1)
    assert.equal(BUILD._indexStats.segmentReads, 1, "增量 = 单段读（不重读前缀）")
    assert.equal(countOf(db, "messages"), total + 1)
    assert.equal(allOf(db, "SELECT MAX(idx) m FROM messages")[0].m, total, "新行 idx = 旧 total")
    assert.deepEqual(allOf(db, "SELECT rowid, idx FROM messages ORDER BY rowid LIMIT 5"), before, "其余行 rowid 不变")
    assert.equal(allOf(db, "SELECT content FROM messages WHERE idx = ?", total)[0].content, "appended")
    // 幂等：无源变 ⇒ 零读零写 + 行数 / 水位 / pass_at 不变（pass_at = 最近一次实际写入时刻）
    const steady = () => [countOf(db, "messages"), allOf(db, "SELECT seg_n, seg_bytes, seg_mtime, tail_hash FROM sessions"), IDX.readMeta(db, "pass_at")]
    const after = steady()
    BUILD._resetSessionIndexStats()
    assert.equal(PASS.syncSessions(db).changed, 0, "无源变 ⇒ 零动作")
    assert.deepEqual([BUILD._indexStats.bytesRead, BUILD._indexStats.segmentReads], [0, 0], "零读零写")
    assert.deepEqual(steady(), after, "行数 / 水位 / pass_at 不变")
  })
  teardown()
})

test("T-4 段轮转：第 101 条入新段 ⇒ 行数 = 源条数 ∧ seg 列跨段取值正确", () => {
  const { sessions } = sandbox()
  const file = seedSidecar(sessions, [100])
  withDb((db) => {
    PASS.syncSessions(db)
    writeFileSync(segFile(file, 2), lineAt(100) + "\n") // 轮转：下一段（§6.14 段不变式）
    PASS.syncSessions(db)
    appendFileSync(segFile(file, 2), lineAt(101) + "\n") // 新段续写（水位段增量）
    PASS.syncSessions(db)
    assert.equal(countOf(db, "messages"), 102)
    const bySeg = allOf(db, "SELECT seg, COUNT(*) n FROM messages GROUP BY seg ORDER BY seg")
    assert.deepEqual(bySeg.map((r) => [r.seg, r.n]), [[1, 100], [2, 2]])
    assert.deepEqual(allOf(db, "SELECT idx FROM messages WHERE seg = 2 ORDER BY idx").map((r) => r.idx), [100, 101])
  })
  teardown()
})

test("T-5 段重写（materialize 面）：删 .d ⇒ 依槽 JSON 重建 ⇒ 行数不增 ∧ 水位回落再前进", () => {
  const { sessions } = sandbox()
  const file = seedSidecar(sessions, [100, 50])
  withDb((db) => {
    PASS.syncSessions(db)
    const total = countOf(db, "messages")
    rmSync(`${file}.d`, { recursive: true, force: true })
    assert.equal(PASS.syncSessions(db).changed, 1, "src 切换（sidecar → json）⇒ 会话级重建")
    const back = allOf(db, "SELECT src, seg_n FROM sessions")[0]
    assert.deepEqual([back.src, back.seg_n], ["json", 0], "水位回落（src 切换 ⇒ json 面）")
    assert.equal(countOf(db, "messages"), total, "行数不增")
    seedSidecar(sessions, [100, 50]) // materialize：依槽 JSON 重建同内容段
    assert.equal(PASS.syncSessions(db).changed, 1, "src 切回 sidecar ⇒ 重建（水位再前进）")
    assert.equal(countOf(db, "messages"), total, "行数不增（UNIQUE(sid, idx) 零冲突）")
    assert.equal(countOf(db, "messages_fts"), total, "FTS 同删同建")
    const s = allOf(db, "SELECT src, seg_n FROM sessions")[0]
    assert.deepEqual([s.src, s.seg_n], ["sidecar", 2], "水位回落再前进")
  })
  teardown()
})

test("T-6 等长改写：同字节数 / 异内容 ⇒ tail_hash 命中 ⇒ 段重建（新文本命中、旧文本不命中）", () => {
  const { sessions } = sandbox()
  const file = seedSidecar(sessions, [100, 50])
  withDb((db) => {
    PASS.syncSessions(db)
    const p = segFile(file, 2)
    const raw = readFileSync(p, "utf8")
    const swapped = raw.replace("m149", "Z149")
    assert.equal(swapped.length, raw.length, "夹具 = 等长改写（同字节数）")
    writeFileSync(p, swapped)
    assert.equal(PASS.syncSessions(db).changed, 1, "size 相同 + mtime 变 ⇒ tail_hash 第三层检出")
    assert.equal(Q.querySessionRows(db, file, { keyword: "m149" }).length, 0, "旧文本不命中")
    assert.equal(Q.querySessionRows(db, file, { keyword: "Z149" }).length, 1, "新文本命中")
    assert.deepEqual([countOf(db, "messages"), countOf(db, "messages_fts")], [150, 150], "行数守恒")
  })
  teardown()
})

test("T-7 源消失清行：删槽文件 + .d ⇒ 行 0（级联清）+ 他会话零动", () => {
  const { sessions } = sandbox()
  const file = seedSidecar(sessions, [100, 30])
  seedJson(sessions, Array.from({ length: 10 }, (_, i) => msg(i)))
  withDb((db) => {
    PASS.syncSessions(db)
    assert.equal(countOf(db, "sessions"), 2)
    rmSync(file, { force: true })
    rmSync(`${file}.d`, { recursive: true, force: true })
    assert.equal(PASS.syncSessions(db).pruned, 1)
    assert.equal(countOf(db, "sessions"), 1)
    assert.equal(allOf(db, "SELECT COUNT(*) n FROM messages WHERE sid NOT IN (SELECT id FROM sessions)")[0].n, 0, "级联清（零孤儿行）")
    assert.deepEqual([countOf(db, "messages"), countOf(db, "messages_fts")], [10, 10])
  })
  teardown()
})

test("T-12/T-13 自愈：删库（含 -wal / -shm）与坏库 ⇒ 现场保留 + 自动重建（行数 = 源）+ 查询可用", () => {
  const { sessions, dbPath } = sandbox()
  const file = seedSidecar(sessions, [100, 20])
  withDb((db) => PASS.syncSessions(db))
  for (const s of ["", "-wal", "-shm"]) rmSync(dbPath + s, { force: true })
  assert.equal(existsSync(dbPath), false)
  withDb((db) => {
    BUILD.ensureSessionIndexed(db, file)
    assert.equal(countOf(db, "messages"), 120, "缺库 ⇒ ensure 自动重建")
  })
  withDb((db) => assert.equal(Q.querySessionRows(db, file, {}).length, 50, "查询成功（缺省窗口 50）"))
  for (const s of ["", "-wal", "-shm"]) rmSync(dbPath + s, { force: true })
  writeFileSync(dbPath, "not a sqlite database at all — junk bytes")
  withDb((db) => {
    BUILD.ensureSessionIndexed(db, file)
    assert.equal(countOf(db, "messages"), 120, "坏库 ⇒ 自动重建")
  })
  const kept = readdirSync(dirname(dbPath)).filter((n) => n.startsWith(`${IDX.SESSION_INDEX_DB_NAME}.corrupt-`))
  assert.equal(kept.length, 1, "现场改名保留（零静默丢弃）")
  assert.ok(readFileSync(join(dirname(dbPath), kept[0]), "utf8").startsWith("not a sqlite"))
  teardown()
})

test("T-15 双句柄并发：两 openSessionIndex 同库交错 sync ⇒ 无异常 ∧ 行数正确（无重复 / 无丢失）", () => {
  const { sessions } = sandbox()
  const a = seedSidecar(sessions, [100, 50])
  const b = seedJson(sessions, Array.from({ length: 30 }, (_, i) => msg(i)))
  const db1 = IDX.openSessionIndex()
  const db2 = IDX.openSessionIndex()
  try {
    PASS.syncSessions(db1)
    PASS.syncSessions(db2)
    appendFileSync(segFile(a, 2), JSON.stringify(msg(999)) + "\n")
    PASS.syncSessions(db2)
    PASS.syncSessions(db1)
    const n = countOf(db1, "messages")
    assert.equal(n, 181, "150 + 30 + 1（无重复 / 无丢失）")
    assert.deepEqual([countOf(db1, "messages_fts"), countOf(db1, "sessions")], [n, 2])
    assert.equal(BUILD.ensureSessionIndexed(db2, b).changed, false, "他句柄已建面：幂等零写")
  } finally { db1.close(); db2.close() }
  teardown()
})

test("T-16/T-17 主存零改 + 零依赖：树三元组不变 ∧ dependencies 零新增 ∧ 新档 ≤300 行 / 仅 node: 与相对", () => {
  const { sessions } = sandbox()
  const file = seedSidecar(sessions, [100, 30])
  seedJson(sessions, Array.from({ length: 12 }, (_, i) => msg(i)))
  const snapshot = () => {
    const out = []
    const walk = (dir, rel = "") => {
      for (const e of readdirSync(dir, { withFileTypes: true }).sort((x, y) => x.name.localeCompare(y.name))) {
        const p = join(dir, e.name)
        if (e.isDirectory()) { out.push(`${rel}${e.name}/`); walk(p, `${rel}${e.name}/`) } else { const st = statSync(p); out.push(`${rel}${e.name}|${st.size}|${st.mtimeMs}`) }
      }
    }
    walk(sessions)
    return out
  }
  const before = snapshot()
  withDb((db) => {
    PASS.syncSessions(db)
    BUILD.ensureSessionIndexed(db, file)
    Q.querySessionRows(db, file, { keyword: "kw" })
    Q.queryAllRows(db, { keyword: "kw0" })
  })
  assert.deepEqual(snapshot(), before, "索引只读主存（绝不写回 sessions 树）")
  const deps = (rel) => Object.keys(JSON.parse(readFileSync(join(REPO, rel), "utf8")).dependencies ?? {})
  assert.deepEqual(deps("thincoder-core/package.json"), [], "核零依赖")
  for (const rel of ["thincoder-cli/package.json", "thincoder-vscode/package.json"]) assert.deepEqual(deps(rel), ["@thincoder/core"], `${rel} 零新增`)
  const clean = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1")
  const files = ["session-index.mjs", "session-index-query.mjs", "session-index-build.mjs", "session-index-pass.mjs", "session-index-cmd.mjs", "fts-text.mjs"]
  for (const f of files) {
    const src = readFileSync(join(CORE, f), "utf8")
    const specs = [...clean(src).matchAll(/\bfrom\s+["']([^"']+)["']/g)].map((m) => m[1])
    assert.deepEqual(specs.filter((s) => !s.startsWith("node:") && !s.startsWith(".")), [], `${f}：仅 node: / 相对路径`)
    assert.ok(src.split("\n").length - 1 <= 300, `${f} ≤300（advisory 线——无需 >300 登记）`)
  }
  teardown()
})

test("T-18 FTS 语义（all 面）：CJK 短语命中 / ASCII 词 / 纯标点退化 LIKE（元字符按字面）", () => {
  const { sessions } = sandbox()
  const file = seedSidecar(sessions, [3])
  writeFileSync(segFile(file, 1), [
    JSON.stringify({ role: "user", ts: 1, content: "命名 规范 的讨论" }),
    JSON.stringify({ role: "assistant", ts: 2, content: "keyword-abc 命中" }),
    JSON.stringify({ role: "user", ts: 3, content: "百分比 % 符号 _ 下划线" }),
  ].join("\n") + "\n")
  withDb((db) => {
    PASS.syncSessions(db)
    const hit = (kw) => Q.queryAllRows(db, { keyword: kw }).map((r) => r.idx)
    assert.deepEqual(hit("命名"), [0], "CJK 短语（逐字间隔）命中")
    assert.deepEqual(hit("规范"), [0])
    assert.deepEqual(hit("keyword-abc"), [1], "ASCII 词命中")
    assert.deepEqual(hit("keyword"), [1])
    assert.deepEqual(hit("%"), [2], "纯标点 ⇒ 退化 LIKE（`%` 按字面：命中含 `%` 的消息，非全匹配）")
    assert.deepEqual(hit("_"), [2], "`_` 按字面（非单字符通配）")
    assert.deepEqual(hit("no-such-term"), [])
  })
  teardown()
})
