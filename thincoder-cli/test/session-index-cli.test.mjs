/**
 * session-index-cli.test.mjs — CLI 会话索引命令面（SESSION.md §6.19 D-SE46；批档 §2 用例 T-14）：
 * ① `runSessionIndex(["index","--status"|"--rebuild"])` 退出码 + 摘要行锚 + 行数 = 全量读数；
 * ② AC-7 CLI 侧机检：`case "session"` 分发 `gc` / `index` + USAGE 行（既有 gc 面零回归）；
 * ③ T-17 CLI 侧：CLI `package.json` 依赖面零新增 + 索引面经 `@thincoder/core/*` 可达（本档 import 即证）。
 * 夹具 = temp sessions 根 + temp 库路径注入缝（禁触真实 `~/.thincoder`）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { SESSION_INDEX_USAGE, runSessionIndex } from "@thincoder/core/session-index-cmd.mjs"
import { SESSION_INDEX_DB_NAME, INDEX_PASS_BUDGET_MS, INDEX_PASS_MAX_SESSIONS, openSessionIndex, _setSessionIndexDirForTest, _resetSessionIndexDirForTest } from "@thincoder/core/session-index.mjs"
import {
  INDEX_PASS_DELAY_MS, _resetSessionIndexPassScheduleForTest, _setSessionIndexPassDelayForTest, scheduleSessionIndexPass,
} from "@thincoder/core/session-index-pass.mjs"

const CLI = join(fileURLToPath(new URL(".", import.meta.url)), "..")
const dirs = []
process.on("exit", () => { for (const d of dirs) { try { rmSync(d, { recursive: true, force: true }) } catch { /* ignore */ } } })

/** 沙箱：temp sessions 根（两会话）+ temp 库路径；返回注入缝与捕获面。 */
function sandbox() {
  const root = mkdtempSync(join(tmpdir(), "cli-si-"))
  dirs.push(root)
  const sessions = join(root, "sessions")
  mkdirSync(sessions)
  const hashA = "a".repeat(40)
  const hashB = "b".repeat(40)
  writeFileSync(join(sessions, `${hashA}.json.1`), JSON.stringify({
    version: 2, cwd: "C:/p/a",
    history: Array.from({ length: 12 }, (_, i) => (i === 4
      ? { role: "assistant", ts: 100 + i, content: "", tool_calls: [{ id: `c${i}`, type: "function", function: { name: "read", arguments: `{"path":"f${i}"}` } }] }
      : { role: i % 2 ? "assistant" : "user", ts: 100 + i, content: `m${i}` })),
  }))
  // sidecar 档（取源 double 路覆盖：src 分布读数）
  const side = join(sessions, `${hashB}.json.1`)
  mkdirSync(`${side}.d`, { recursive: true })
  writeFileSync(join(`${side}.d`, "seg-000001.jsonl"), Array.from({ length: 5 }, (_, i) => JSON.stringify({ role: "user", ts: 200 + i, content: `s${i}` })).join("\n") + "\n")
  writeFileSync(join(`${side}.d`, "meta.json"), JSON.stringify({ v: 1, identity: "id-b" }))
  writeFileSync(side, JSON.stringify({ version: 2, cwd: "C:/p/b", history: [] }))
  const out = []
  const err = []
  return { sessions, dbPath: join(root, "index", SESSION_INDEX_DB_NAME), out, err, lines: () => out.join("\n") }
}

const run = (env, args) => runSessionIndex(args, { dir: env.sessions, dbPath: env.dbPath, out: (l) => env.out.push(l), err: (l) => env.err.push(l) })

test("T-14 `--rebuild`：退出码 0 + 重建行 + 摘要行（行数 = 全量、覆盖 2/2、取源分布）", async () => {
  const env = sandbox()
  assert.equal(await run(env, ["index", "--rebuild"]), 0)
  assert.equal(env.err.length, 0)
  assert.equal(env.out.length, 2)
  assert.equal(env.out[0], "Session index rebuilt: 2/2 session file(s) indexed")
  assert.match(env.out[1], /^Session index: 2 sessions \(sidecar 1 \/ json 1\) · 17 messages · 1 tool calls · [\d.]+ MB on disk · covered 2\/2 session file\(s\) on disk · last change \d{4}-/)
  assert.ok(existsSync(env.dbPath), "库落注入路径")
})

test("T-14 `--status` / 无参：同 --status（摘要行 + 退出码 0）；未建库 ⇒ 零读数（非报错）", async () => {
  const env = sandbox()
  assert.equal(await run(env, ["index", "--status"]), 0, "空库照跑（缺库 ⇒ 打开即建）")
  assert.equal(env.out.length, 1)
  assert.match(env.out[0], /^Session index: 0 sessions \(sidecar 0 \/ json 0\) · 0 messages · 0 tool calls · [\d.]+ MB on disk · covered 0\/2 session file\(s\) on disk · last change \(never\)$/)
  env.out.length = 0
  assert.equal(await run(env, ["index"]), 0, "无参 = 同 --status")
  assert.equal(env.out.length, 1)
  assert.match(env.out[0], /^Session index: 0 sessions/)
  env.out.length = 0
  assert.equal(await run(env, ["index", "--rebuild"]), 0)
  env.out.length = 0
  assert.equal(await run(env, ["index", "--status"]), 0)
  assert.match(env.out[0], /covered 2\/2 session file\(s\) on disk/, "重建后水位覆盖读数")
})

test("T-14 错用：旗标外 / 双旗标 / 缺子命令 ⇒ 用法行 + 退出码 1（零静默忽略）", async () => {
  const env = sandbox()
  for (const args of [["index", "--bogus"], ["index", "--status", "--rebuild"], ["session", "index"], []]) {
    env.err.length = 0
    env.out.length = 0
    assert.equal(await run(env, args), 1, `拒：${JSON.stringify(args)}`)
    assert.deepEqual(env.err, [SESSION_INDEX_USAGE])
    assert.equal(env.out.length, 0, "零输出（不落半途读数）")
  }
})

test("AC-7 CLI 侧机检：`case \"session\"` 分发 index / gc + USAGE 行（既有 gc 面零回归）", () => {
  const src = readFileSync(join(CLI, "bin", "thincoder.mjs"), "utf8")
  assert.match(src, /case "session": \{/, "session 分发块在位")
  assert.match(src, /if \(args\[0\] === "index"\) \{/, "index 分支判据")
  assert.match(src, /await import\("@thincoder\/core\/session-index-cmd\.mjs"\)/, "核命令面经动态 import（壳侧分发）")
  assert.match(src, /runSessionIndex\(args\)/, "index 处理体")
  assert.match(src, /await import\("@thincoder\/core\/session-gc\.mjs"\)/, "gc 面保留")
  assert.match(src, /runSessionGc\(args\)/, "gc 处理体保留")
  assert.match(src, /thincoder session index \[--status \| --rebuild\]/, "USAGE 行")
  assert.match(src, /scheduleSessionIndexPass\(\)/, "启动拍挂点（触发点②——会话型命令白名单分支，与轨迹清理同址簇）")
  assert.match(src, /await import\("@thincoder\/core\/session-index-pass\.mjs"\)/, "拍面经动态 import（壳侧挂点）")
})

test("T-17 CLI 侧：依赖面 = 既有单件（零新增）∧ 索引面经 @thincoder/core 可达", () => {
  const pkg = JSON.parse(readFileSync(join(CLI, "package.json"), "utf8"))
  assert.deepEqual(Object.keys(pkg.dependencies ?? {}), ["@thincoder/core"], "CLI 依赖面零新增")
  for (const f of ["session-index.mjs", "session-index-query.mjs", "session-index-build.mjs", "session-index-pass.mjs", "session-index-cmd.mjs", "fts-text.mjs"]) {
    assert.ok(existsSync(join(CLI, "node_modules", "@thincoder", "core", f)), `核新档可达：${f}`)
  }
})

test("触发点②：启动窗外延迟拍（缝 0ms）⇒ 一趟有界 pass 落库 ∧ 每进程一次（预算常量同值）", async () => {
  const env = sandbox()
  const indexDir = join(env.dbPath, "..")
  assert.deepEqual([INDEX_PASS_DELAY_MS, INDEX_PASS_BUDGET_MS, INDEX_PASS_MAX_SESSIONS], [3000, 2000, 40], "启动窗外 3s / 单趟 ≤2s 且 ≤40 会话（D-SE45）")
  _setSessionIndexDirForTest(indexDir)
  _resetSessionIndexPassScheduleForTest()
  _setSessionIndexPassDelayForTest(0)
  try {
    assert.equal(scheduleSessionIndexPass({ dir: env.sessions }), true, "首次调度点火")
    assert.equal(scheduleSessionIndexPass({ dir: env.sessions }), false, "每进程一次")
    await new Promise((r) => setTimeout(r, 200))
    const db = openSessionIndex()
    try { assert.equal(db.prepare("SELECT COUNT(*) n FROM messages").get().n, 17, "拍已把两档会话落库") } finally { db.close() }
  } finally {
    _setSessionIndexPassDelayForTest(INDEX_PASS_DELAY_MS)
    _resetSessionIndexDirForTest()
  }
})
