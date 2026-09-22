/**
 * session-index-boundary.test.mjs — 会话派生索引库边界情形表（SESSION.md §6.19）夹具面。
 *
 * 主档 `session-index.test.mjs`（T-1…T-18）已顶 300 advisory 线 ⇒ 边界表补行按行数纪律拆出邻档
 * （先例 = `batch-placeholder-gate.test.mjs` 自 `batch.test.mjs` 拆出）。覆盖：
 * ① 只有 `meta.json`（段数 0）⇒ `src=json`（空 `.d` ≠ 有内容，不立 sidecar 支）；
 * ② 末尾半行不建（水位停在最后一个换行处）；补齐后增量落行；
 * ③ 段缩水（`size < seg_bytes`）⇒ 该段起重建；④ `identity` 变更 ⇒ 会话级重建（新旧行不混）；
 * ⑤ 槽 JSON 无 `history` 数组 ⇒ 跳过（计入 `skipped`）且他会话零动；⑥ 库不可写 ⇒ 静默降级（null）。
 * 沙箱缝 = `_setSessionsDirForTest` + `_setSessionIndexDirForTest`（禁触真实用户目录）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { appendFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { _setSessionsDirForTest, _resetSessionsDirForTest } from "../session-slots.mjs"
import * as IDX from "../session-index.mjs"
import * as BUILD from "../session-index-build.mjs"
import * as PASS from "../session-index-pass.mjs"

const HASH = "a".repeat(40)
const HASH_B = "b".repeat(40)
const dirs = []
process.on("exit", () => { for (const d of dirs) { try { rmSync(d, { recursive: true, force: true }) } catch { /* ignore */ } } })
const sandbox = () => {
  const root = mkdtempSync(join(tmpdir(), "core-si-edge-"))
  dirs.push(root)
  const sessions = join(root, "sessions")
  mkdirSync(sessions)
  _setSessionsDirForTest(sessions)
  IDX._setSessionIndexDirForTest(join(root, "index"))
  BUILD._resetSessionIndexStats()
  return { sessions, dbPath: join(root, "index", IDX.SESSION_INDEX_DB_NAME) }
}
const teardown = () => { _resetSessionsDirForTest(); IDX._resetSessionIndexDirForTest() }
const msg = (i) => ({ role: "user", ts: 1000 + i, content: `m${i} edge` })
const lineAt = (i) => JSON.stringify(msg(i))
const slot = (sessions, hash = HASH, n = 1) => join(sessions, `${hash}.json.${n}`)
const segFile = (file, n) => join(`${file}.d`, `seg-${String(n).padStart(6, "0")}.jsonl`)
const withDb = (fn) => { const db = IDX.openSessionIndex(); assert.ok(db, "索引库可打开"); try { return fn(db) } finally { db.close() } }
const countOf = (db, table) => db.prepare(`SELECT COUNT(*) n FROM ${table}`).get().n

test("边界表①：只有 meta.json（段数 0）⇒ src=json（空 .d 不立 sidecar 支）", () => {
  const { sessions } = sandbox()
  const file = slot(sessions)
  mkdirSync(`${file}.d`, { recursive: true })
  writeFileSync(join(`${file}.d`, "meta.json"), JSON.stringify({ v: 1, identity: "id-a" }))
  writeFileSync(file, JSON.stringify({ version: 2, cwd: "C:/p/a", history: [msg(0), msg(1)] }))
  withDb((db) => {
    PASS.syncSessions(db)
    assert.deepEqual([db.prepare("SELECT src FROM sessions").get().src, countOf(db, "messages")], ["json", 2], "段数 0 ⇒ 走槽 JSON")
  })
  teardown()
})

test("边界表②：末尾半行不建（水位停最后换行处）+ 补齐后半行增量落行", () => {
  const { sessions } = sandbox()
  const file = slot(sessions)
  mkdirSync(`${file}.d`, { recursive: true })
  writeFileSync(join(`${file}.d`, "meta.json"), JSON.stringify({ v: 1, identity: "id-a" }))
  writeFileSync(segFile(file, 1), [lineAt(0), lineAt(1), '{"role":"user","ts":1002,"content":"half'].join("\n")) // 无尾换行 = 半行
  writeFileSync(file, JSON.stringify({ version: 2, cwd: "C:/p/a", history: [] }))
  withDb((db) => {
    PASS.syncSessions(db)
    assert.equal(countOf(db, "messages"), 2, "半行不建（只落完整行）")
    appendFileSync(segFile(file, 1), '-done"}\n') // 补全半行
    assert.equal(PASS.syncSessions(db).changed, 1)
    assert.equal(countOf(db, "messages"), 3, "补齐后自水位增量落行")
    assert.ok(db.prepare("SELECT content FROM messages WHERE idx = 2").get().content.endsWith("-done"))
  })
  teardown()
})

test("边界表③/④：段缩水 ⇒ 该段起重建；identity 变更 ⇒ 会话级重建（新旧行不混）", () => {
  const { sessions } = sandbox()
  const file = slot(sessions)
  mkdirSync(`${file}.d`, { recursive: true })
  writeFileSync(join(`${file}.d`, "meta.json"), JSON.stringify({ v: 1, identity: "id-a" }))
  writeFileSync(segFile(file, 1), [lineAt(0), lineAt(1), lineAt(2)].join("\n") + "\n")
  writeFileSync(file, JSON.stringify({ version: 2, cwd: "C:/p/a", history: [] }))
  withDb((db) => {
    PASS.syncSessions(db)
    assert.equal(countOf(db, "messages"), 3)
    writeFileSync(segFile(file, 1), [lineAt(7), lineAt(8)].join("\n") + "\n") // 缩水（重写为两行）
    assert.equal(PASS.syncSessions(db).changed, 1, "size < seg_bytes ⇒ 重写检出")
    assert.deepEqual(db.prepare("SELECT idx, content FROM messages ORDER BY idx").all().map((r) => [r.idx, r.content]), [[0, msg(7).content], [1, msg(8).content]], "该段起重建（按新内容）")
    writeFileSync(join(`${file}.d`, "meta.json"), JSON.stringify({ v: 1, identity: "id-b" })) // 槽号回收 / 轮转
    writeFileSync(segFile(file, 1), lineAt(9) + "\n")
    assert.equal(PASS.syncSessions(db).changed, 1, "identity 变更 ⇒ 会话级重建")
    assert.deepEqual(db.prepare("SELECT content FROM messages").all().map((r) => r.content), [msg(9).content], "新旧行不混")
    assert.equal(db.prepare("SELECT identity FROM sessions").get().identity, "id-b")
  })
  teardown()
})

test("边界表⑤：槽 JSON 无 history 数组 ⇒ 跳过（skipped 计数）且他会话零动", () => {
  const { sessions } = sandbox()
  const bad = slot(sessions)
  writeFileSync(bad, JSON.stringify({ version: 2, cwd: "C:/p/a", history: "not-an-array" }))
  const good = slot(sessions, HASH_B)
  writeFileSync(good, JSON.stringify({ version: 2, cwd: "C:/p/b", history: [msg(0)] }))
  withDb((db) => {
    const r = PASS.syncSessions(db)
    assert.deepEqual([r.changed, r.skipped], [1, 1], "非法档计入 skipped（非 changed）")
    assert.deepEqual([countOf(db, "sessions"), countOf(db, "messages")], [1, 1], "他会话零动")
    assert.equal(db.prepare("SELECT file FROM sessions").get().file, good)
  })
  teardown()
})

test("边界表⑥：库不可写 ⇒ openSessionIndex 返回 null（静默降级）；库路径被占 ⇒ 现场保留 + 新建", () => {
  const { sessions } = sandbox()
  const file = slot(sessions)
  writeFileSync(file, JSON.stringify({ version: 2, cwd: "C:/p/a", history: [msg(0)] }))
  const parentFile = join(sessions, "not-a-dir")
  writeFileSync(parentFile, "x") // 父路径是档 ⇒ 建库必失败（磁盘满 / 不可写同族）
  assert.equal(IDX.openSessionIndex({ path: join(parentFile, "sub", IDX.SESSION_INDEX_DB_NAME) }), null, "打不开 ⇒ null（不抛）")
  const blocked = join(sessions, "blocked")
  mkdirSync(blocked) // 库路径被目录占位
  const db = IDX.openSessionIndex({ path: join(blocked, IDX.SESSION_INDEX_DB_NAME) })
  assert.ok(db, "占位物 ⇒ 现场改名保留 + 新建空库（自愈）")
  try { assert.equal(countOf(db, "sessions"), 0, "新库为空") } finally { db.close() }
  withDb((db2) => { // 降级只在坏路径面：注入正常路径照常可用
    assert.equal(PASS.syncSessions(db2).changed, 1)
    assert.equal(countOf(db2, "messages"), 1)
  })
  teardown()
})
