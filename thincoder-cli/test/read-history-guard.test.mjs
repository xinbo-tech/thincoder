/**
 * read-history-guard.test.mjs — read_history 跨会话面测试（SESSION.md §6.13 D-R19a + §6.19 D-SE47）：
 * ① 行扫第一道保留（READ_HISTORY_SCAN_MAX = 200,000 行——流式计数——超限 parse 前拒绝）；
 * ② 消息数第二道（parse 后 history.length > READ_HISTORY_MAX_MESSAGES = 50,000 即拒——单行 JSON 槽）；
 * ③ 正常查询不回归（小槽深查 keyword 过滤 / 恰好 50,000 边界放行 / 无 path 本会话缺省）；
 * ④ **C 洞**（T-8/T-9）：>50,000 消息档经索引可答 ∥ 未索引同档仍逐字 TOO_LARGE（回落零回归）；
 * ⑤ **E 洞**（T-10）：`path:"all"` 跨 cwd 命中 + 行携 `session.file` 回查锚 + limit/direction；
 * ⑥ 过滤矩阵等价（T-11）：索引路径 ∥ JSON 回落路径逐条相等（含 `[{name, arguments}]` 形）；
 * ⑦ 查询面自愈（T-12）：删库后有段档查询经懒保证重建。
 * 全部经 `readHistoryTool.execute` 公开面驱动（真实盘面夹具——无 mock）；索引/会话目录沙箱缝
 * （禁触真实 `~/.thincoder`）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { readHistoryTool } from "@thincoder/core/agent-tools/read-history.mjs"
import { _setSessionsDirForTest, _resetSessionsDirForTest } from "@thincoder/core/session-slots.mjs"
import { _setSessionIndexDirForTest, _resetSessionIndexDirForTest, openSessionIndex, SESSION_INDEX_DB_NAME } from "@thincoder/core/session-index.mjs"
import { rebuildAllSessions } from "@thincoder/core/session-index-pass.mjs"

/** 超限错误文案（SESSION.md §6.13——逐字定稿——断言与实现同文案）。 */
const TOO_LARGE = JSON.stringify({ error: "session too large — refine keyword or since/until" })
const MAX_MSGS = 50_000
const MAX_LINES = 200_000
const HASH_A = "a".repeat(40)
const HASH_B = "b".repeat(40)

const dirs = []
const tmp = (prefix) => { const d = mkdtempSync(join(tmpdir(), prefix)); dirs.push(d); return d }
process.on("exit", () => { for (const d of dirs) { try { rmSync(d, { recursive: true, force: true }) } catch { /* ignore */ } } })

let dir, small, big, boundary, lineOver, idxDir

/** 会话沙箱：temp sessions 根 + temp 索引目录（两缝齐设——真实用户目录零触碰）。 */
function sandbox() {
  const sessions = join(tmp("rh-si-"), "sessions")
  mkdirSync(sessions)
  _setSessionsDirForTest(sessions)
  return sessions
}
/** 索引建面（② 拍 / ③ `--rebuild` 面——T-8/T-10 夹具的建索引前置，非查询期 ensure）。 */
function buildIndex(dirName) {
  const db = openSessionIndex()
  assert.ok(db, "索引库可打开")
  try { return rebuildAllSessions(db, { dir: dirName }) } finally { db.close() }
}
/** sidecar 夹具（`batches` = 每段消息数）+ 同内容槽 JSON 投影（= `saveProjectedSlot` 语义）。 */
function seedSidecar(sessions, hash, batches, slot = 1) {
  const file = join(sessions, `${hash}.json.${slot}`)
  mkdirSync(`${file}.d`, { recursive: true })
  const all = []
  let i = 0
  batches.forEach((n, k) => {
    const lines = []
    for (let j = 0; j < n; j++, i++) {
      const m = i === 3
        ? { role: "assistant", ts: 3000 + i, content: "", tool_calls: [{ id: `c${i}`, type: "function", function: { name: "read", arguments: `{"path":"f${i}"}` } }] }
        : { role: i % 3 === 2 ? "tool" : i % 2 ? "assistant" : "user", ts: 1000 + i, ...(i % 3 === 2 ? { name: "bash", tool_call_id: `c${i}` } : {}), content: `m${i} target ${i}` }
      all.push(m)
      lines.push(JSON.stringify(m))
    }
    writeFileSync(join(`${file}.d`, `seg-${String(k + 1).padStart(6, "0")}.jsonl`), lines.join("\n") + "\n")
  })
  writeFileSync(join(`${file}.d`, "meta.json"), JSON.stringify({ v: 1, segSize: 100, identity: `id-${hash[0]}` }))
  writeFileSync(file, JSON.stringify({ version: 2, cwd: `C:/p/${hash[0]}`, history: all }))
  return file
}
const seedJson = (sessions, hash, history, slot = 1, extra = {}) => {
  const file = join(sessions, `${hash}.json.${slot}`)
  writeFileSync(file, JSON.stringify({ version: 2, cwd: `C:/p/${hash[0]}`, history, ...extra }))
  return file
}

before(() => {
  dir = tmp("rh-guard-")
  idxDir = tmp("rh-guard-idx-")
  _setSessionIndexDirForTest(idxDir)
  const mk = (name, body) => {
    const p = join(dir, name)
    writeFileSync(p, body)
    return p
  }
  small = mk("small.json", JSON.stringify({
    history: [
      { role: "user", ts: 1, content: "alpha keyword one" },
      { role: "assistant", ts: 2, content: "beta reply" },
      { role: "user", ts: 3, content: "gamma keyword two" },
    ],
  }))
  // 单行 JSON 槽（无换行——行扫通过）——超限/边界夹具只在消息数上分
  const mkMessages = (n) => JSON.stringify({
    history: Array.from({ length: n }, (_, i) => ({ role: "user", content: `m${i}` })),
  })
  big = mk("big.json", mkMessages(MAX_MSGS + 1))
  boundary = mk("boundary.json", mkMessages(MAX_MSGS))
  // 超 200,000 行——行扫第一道必须 parse 前拒绝（内容非 JSON 也无妨——行扫先拒）
  lineOver = mk("lines.json", "x\n".repeat(MAX_LINES + 1))
})

after(() => {
  _resetSessionsDirForTest()
  _resetSessionIndexDirForTest()
})

test("消息数第二道：>50,000 消息的单行 JSON 槽被拒——定稿文案（非 parse/结构错误）", async () => {
  assert.equal(await readHistoryTool.execute({ path: big }, { agent: {} }), TOO_LARGE)
})

test("消息数边界：恰好 50,000 消息放行——limit 窗口仍生效（newest 50）", async () => {
  const arr = JSON.parse(await readHistoryTool.execute({ path: boundary }, { agent: {} }))
  assert.ok(Array.isArray(arr))
  assert.equal(arr.length, 50)
  assert.equal(arr[0].content, `m${MAX_MSGS - 50}`) // newest 端起点（chronological 输出）
})

test("行扫第一道保留：>200,000 行的文件在 parse 前被拒——同一定稿文案", async () => {
  assert.equal(await readHistoryTool.execute({ path: lineOver }, { agent: {} }), TOO_LARGE)
})

test("正常查询不回归：小槽深查 keyword 命中/未命中 + 无 path 本会话缺省", async () => {
  const hit = JSON.parse(await readHistoryTool.execute({ path: small, keyword: "alpha" }, { agent: {} }))
  assert.equal(hit.length, 1)
  assert.equal(hit[0].role, "user")
  assert.equal(hit[0].content, "alpha keyword one")
  assert.equal(JSON.parse(await readHistoryTool.execute({ path: small, keyword: "no-such-word" }, { agent: {} })).length, 0)
  const local = JSON.parse(await readHistoryTool.execute({}, {
    agent: { _fullHistory: [{ role: "user", ts: 1, content: "local talk" }] },
  }))
  assert.equal(local[0].content, "local talk")
})

test("T-8/T-9 大会话（C）：索引命中 ⇒ 可答（非 TOO_LARGE）∥ 未索引 ⇒ 逐字护栏（回落零回归）", async () => {
  const sessions = sandbox()
  const huge = seedJson(sessions, HASH_A, Array.from({ length: MAX_MSGS + 1 }, (_, i) => ({ role: i % 7 === 0 ? "user" : "assistant", ts: 5000 + i, content: `m${i} hit${i % 100 === 0 ? " target" : ""}` })))
  assert.equal(await readHistoryTool.execute({ path: huge, keyword: "hit" }, { agent: {} }), TOO_LARGE, "T-9 库内无该行 ⇒ 回落 JSON 路径 + 逐字护栏（src=json 免 ensure）")
  buildIndex(sessions)
  const out = await readHistoryTool.execute({ path: huge, keyword: "target", limit: 3 }, { agent: {} })
  assert.ok(Array.isArray(JSON.parse(out)), "T-8 索引命中 ⇒ SQL 检索（无行扫 / 消息数护栏 ⇒ 超大会话照答）")
  assert.equal(JSON.parse(out).length, 3)
})

test("T-10 跨会话检索（E）：两 cwd 均命中 + 行携 session.file 回查锚 + limit/direction 生效", async () => {
  const sessions = sandbox()
  const a = seedSidecar(sessions, HASH_A, [4]) // 有段档
  const b = seedJson(sessions, HASH_B, Array.from({ length: 6 }, (_, i) => ({ role: "user", ts: 9000 + i, content: `B 侧 target ${i}` })))
  buildIndex(sessions)
  const rows = JSON.parse(await readHistoryTool.execute({ path: "all", keyword: "target", limit: 20 }, { agent: {} }))
  assert.equal(new Set(rows.map((r) => r.session.file)).size, 2, "两 cwd 均命中")
  assert.ok(rows.every((r) => typeof r.session.file === "string" && r.session.slot >= 1 && typeof r.session.cwd === "string" && typeof r.idx === "number"), "寻址字段必露（回查锚）")
  const deep = JSON.parse(await readHistoryTool.execute({ path: rows[0].session.file, keyword: "target" }, { agent: {} }))
  assert.ok(deep.length >= 1, "回查锚可用：复制行内路径重调 path= 深查")
  const newest = JSON.parse(await readHistoryTool.execute({ path: "all", keyword: "target", limit: 2 }, { agent: {} }))
  const oldest = JSON.parse(await readHistoryTool.execute({ path: "all", keyword: "target", direction: "oldest", limit: 2 }, { agent: {} }))
  assert.notDeepEqual(newest.map((r) => r.idx), oldest.map((r) => r.idx), "direction 取端生效")
  assert.ok(rows.some((r) => r.session.file === a) && rows.some((r) => r.session.file === b))
})

test("T-11 过滤矩阵等价：索引路径 ∥ JSON 回落路径逐条相等（role / keyword / tool / since / until）", async () => {
  const sessions = sandbox()
  const side = seedSidecar(sessions, HASH_A, [100, 20])
  buildIndex(sessions)
  // 回落面夹具 = 同内容的槽 JSON 副本（非 sessions 树 ⇒ 索引必不命中）
  const copy = join(dir, "copy-of-slot.json")
  writeFileSync(copy, readFileSync(side))
  const matrices = [
    { role: "user" },
    { role: "assistant" },
    { keyword: "target 5" },
    { tool: "read" },
    { tool: "bash" },
    { since: 1010, until: 1050, direction: "oldest" },
    { role: "tool", since: 1000 },
  ]
  for (const f of matrices) {
    const indexed = JSON.parse(await readHistoryTool.execute({ path: side, limit: 200, ...f }, { agent: {} }))
    const fallback = JSON.parse(await readHistoryTool.execute({ path: copy, limit: 200, ...f }, { agent: {} }))
    assert.ok(indexed.length > 0 || f.tool === "read", `矩阵非空（${JSON.stringify(f)}）`)
    assert.deepEqual(indexed, fallback, `逐条相等：${JSON.stringify(f)}`)
  }
  // `tool_calls` 输出形（AC-2）：两路同形 `[{name, arguments}]`（上限 300 字符）
  const withDecl = JSON.parse(await readHistoryTool.execute({ path: side, tool: "read", limit: 5 }, { agent: {} }))
  assert.deepEqual(withDecl[0].tool_calls, [{ name: "read", arguments: '{"path":"f3"}' }])
})

test("T-12 查询面自愈：删库后有段档查询 ⇒ 懒保证自动重建 + 查询返回行", async () => {
  const sessions = sandbox()
  const side = seedSidecar(sessions, HASH_A, [5])
  buildIndex(sessions)
  const dbPath = join(idxDir, SESSION_INDEX_DB_NAME)
  for (const s of ["", "-wal", "-shm"]) rmSync(dbPath + s, { force: true })
  assert.equal(existsSync(dbPath), false)
  const rows = JSON.parse(await readHistoryTool.execute({ path: side, keyword: "target" }, { agent: {} }))
  assert.ok(rows.length > 0, "删库 ⇒ 当次 ensure 重建（有段档射程）")
  assert.ok(existsSync(dbPath), "新库出现")
})

test("AC-2 声明形上限：`arguments` >300 字符 ⇒ 截 300 + `…`（索引 ∥ 回落两路同形）", async () => {
  const sessions = sandbox()
  const long = '{"path":"' + "x".repeat(320) + '"}'
  const decl = { role: "assistant", ts: 2, content: "", tool_calls: [{ id: "c1", type: "function", function: { name: "read", arguments: long } }] }
  const file = join(sessions, `${HASH_A}.json.1`)
  mkdirSync(`${file}.d`, { recursive: true })
  writeFileSync(join(`${file}.d`, "seg-000001.jsonl"), [JSON.stringify({ role: "user", ts: 1, content: "u" }), JSON.stringify(decl)].join("\n") + "\n")
  writeFileSync(join(`${file}.d`, "meta.json"), JSON.stringify({ v: 1, identity: "id-a" }))
  writeFileSync(file, JSON.stringify({ version: 2, cwd: "C:/p/a", history: [{ role: "user", ts: 1, content: "u" }, decl] }))
  const copy = join(dir, "copy-long-args.json")
  writeFileSync(copy, readFileSync(file)) // 回落面（非 sessions 树 ⇒ 索引必不命中）
  for (const p of [file, copy]) { // file 走索引（懒保证面——有段档）∥ copy 走既有 JSON 路径
    const rows = JSON.parse(await readHistoryTool.execute({ path: p, tool: "read" }, { agent: {} }))
    assert.equal(rows.length, 1)
    assert.equal(rows[0].tool_calls[0].name, "read")
    assert.equal(rows[0].tool_calls[0].arguments.length, 301, "截 300 字符 + `…`（存储面同值）")
    assert.ok(rows[0].tool_calls[0].arguments.endsWith("…"))
  }
})

test("边界：源已删（库内仍有行）⇒ ensure 先清该会话行 ⇒ 逐字回落 `session file not found`", async () => {
  const sessions = sandbox()
  const side = seedSidecar(sessions, HASH_A, [4])
  buildIndex(sessions)
  rmSync(side, { force: true })
  rmSync(`${side}.d`, { recursive: true, force: true })
  assert.equal(await readHistoryTool.execute({ path: side, keyword: "target" }, { agent: {} }), `Error: session file not found: ${side}`, "既有文案逐字")
  const db = openSessionIndex()
  try { assert.equal(db.prepare("SELECT COUNT(*) n FROM sessions").get().n, 0, "库内该会话行已清（级联）") } finally { db.close() }
})
