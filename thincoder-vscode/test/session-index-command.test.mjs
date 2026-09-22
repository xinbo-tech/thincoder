/**
 * session-index-command.test.mjs — VSC 端会话索引命令面（SESSION.md §6.19 D-SE46「VSC 对位」）：
 * ① 行为：`runSessionIndexCommand` 处理体（清四表 → 全量重扫临时 sessions 根 → 摘要 + 宿主提示）；
 * ② AC-7 VSC 侧机检：`contributes.commands` 注册 + `extension.mjs` 处理体 / 启动拍挂点 +
 *    端壳档**零静态核索引 import**（node:sqlite 不进端壳静态闭包——W8 契约②同族判据）；
 * ③ T-17 VSC 侧：`dependencies` 零新增 + 核新档经 `@thincoder/core/*` 可达；本档入册 `test/files.mjs`。
 * 夹具纪律：显式注入 temp `dir` / `dbPath`（禁触真实 `~/.thincoder`）+ mock 宿主面（`api` 注入）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { runSessionIndexCommand } from "../src/extension/session-index-command.mjs"

const dirs = []
process.on("exit", () => { for (const d of dirs) { try { rmSync(d, { recursive: true, force: true }) } catch { /* ignore */ } } })

/** mock 宿主面：记录提示调用。 */
function mockApi() {
  const calls = { info: [], error: [] }
  return {
    calls,
    api: {
      window: {
        showInformationMessage: async (msg) => { calls.info.push(msg); return undefined },
        showErrorMessage: async (msg) => { calls.error.push(msg); return undefined },
      },
    },
  }
}

/** 会话夹具：一格 JSON 槽（含一条工具声明行）+ 一格 sidecar 档。 */
function seedSessions(dir) {
  const hashA = "a".repeat(40)
  const hashB = "b".repeat(40)
  writeFileSync(join(dir, `${hashA}.json.1`), JSON.stringify({
    version: 2, cwd: "C:/p/a",
    history: [
      { role: "user", ts: 1, content: "u0" },
      { role: "assistant", ts: 2, content: "", tool_calls: [{ id: "c1", type: "function", function: { name: "read", arguments: '{"path":"x"}' } }] },
    ],
  }))
  const side = join(dir, `${hashB}.json.2`)
  mkdirSync(`${side}.d`, { recursive: true })
  writeFileSync(join(`${side}.d`, "seg-000001.jsonl"), JSON.stringify({ role: "user", ts: 3, content: "s0" }) + "\n")
  writeFileSync(join(`${side}.d`, "meta.json"), JSON.stringify({ v: 1, identity: "id-b" }))
  writeFileSync(side, JSON.stringify({ version: 2, cwd: "C:/p/b", history: [] }))
}

test("处理体：重建临时 sessions 根 ⇒ 摘要 + 宿主提示（行数 / 工具调用 / session.file 面）", async () => {
  const root = mkdtempSync(join(tmpdir(), "vsc-si-")); dirs.push(root)
  const dir = join(root, "sessions"); mkdirSync(dir)
  seedSessions(dir)
  const dbPath = join(root, "index", "session-index.db")
  const { api, calls } = mockApi()
  const r = await runSessionIndexCommand({ dir, dbPath, api })
  assert.equal(r.ok, true)
  assert.equal(r.sessions, 2, "两档（json + sidecar）")
  assert.equal(r.messages, 3, "2 + 1")
  assert.equal(r.toolCalls, 1)
  assert.equal(calls.info.length, 1)
  assert.match(calls.info[0], /session index rebuilt — 2 session\(s\), 3 messages, 1 tool calls\./)
  assert.equal(calls.error.length, 0)
  assert.ok(existsSync(dbPath), "库落注入路径")
})

test("处理体：空 sessions 根 ⇒ 0 读 + 提示仍达（索引可重建 = 零权威）", async () => {
  const root = mkdtempSync(join(tmpdir(), "vsc-si-empty-")); dirs.push(root)
  const dir = join(root, "sessions"); mkdirSync(dir)
  const { api, calls } = mockApi()
  const r = await runSessionIndexCommand({ dir, dbPath: join(root, "index", "session-index.db"), api })
  assert.deepEqual([r.ok, r.sessions, r.messages], [true, 0, 0])
  assert.equal(calls.info.length, 1)
})

test("机检：contributes.commands 注册 + extension.mjs 处理体与启动拍挂点 + 端壳零静态核索引 import", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
  const cmds = (pkg.contributes?.commands ?? []).map((c) => c.command)
  assert.ok(cmds.includes("thincoder.sessionIndexRebuild"), "contributes.commands 注册（CLI 对位 = session index --rebuild）")
  const ext = readFileSync(new URL("../extension.mjs", import.meta.url), "utf8")
  assert.match(ext, /registerCommand\("thincoder\.sessionIndexRebuild"/, "extension.mjs 挂处理体")
  assert.match(ext, /runSessionIndexCommand\(\{ api: vscode \}\)/, "处理体 = 端侧命令档（api 注入）")
  assert.match(ext, /scheduleSessionIndexPassSafe\(\)/, "启动拍挂点（触发点②——端壳）")
  const src = readFileSync(new URL("../src/extension/session-index-command.mjs", import.meta.url), "utf8")
  const clean = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1") // 注释剥除（判据看代码面）
  assert.equal(/^\s*import\s+[^()]*from\s+["']@thincoder\/core\//m.test(clean), false, "核索引面零静态 import")
  assert.match(clean, /await import\("@thincoder\/core\/session-index/, "核索引面经动态 import（W8 契约②同族）")
  const manifest = readFileSync(new URL("./files.mjs", import.meta.url), "utf8")
  assert.ok(manifest.includes('"test/session-index-command.test.mjs"'), "本档已登记 test/files.mjs（未登记 ⇒ runner fail-closed）")
})

test("T-17 VSC 侧：dependencies 零新增 ∧ 核新档经 @thincoder/core 可达", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
  assert.deepEqual(Object.keys(pkg.dependencies ?? {}), ["@thincoder/core"], "VSC 依赖面零新增")
  assert.equal(Object.keys(pkg.devDependencies ?? {}).includes("node:sqlite"), false)
  for (const f of ["session-index.mjs", "session-index-query.mjs", "session-index-build.mjs", "session-index-pass.mjs", "fts-text.mjs"]) {
    assert.ok(existsSync(new URL(`../node_modules/@thincoder/core/${f}`, import.meta.url)), `核新档可达：${f}`)
  }
})
