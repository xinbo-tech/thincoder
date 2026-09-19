/**
 * dispatch-hooks.test.mjs — P2 机制层端差批（`docs/batches/2026-09-20-mechanism-parity-batch.md`
 * §2.17）机器验收（VSC 端）：`executeToolBatches` 派发面 hooks 四调用点。
 *
 * T-DH1–T-DH7：PreToolUse 放行 / 阻断（含 readonly 同测）/ PostToolUse / PostToolUseFailure /
 * 中止不落钩子 / 前置门禁不落钩子。
 * 手法：假 hook 脚本 = tmpdir 运行期生成（`command = process.execPath`——免 PATH / Windows 差异），
 * 每次调用把 stdin 载荷落盘 + 按 argv 退出码退出；零调用负判据 = 探针配置（`length` getter 计读取）。
 * 断言面 = 工具是否执行（业务可观察）+ 模型可见结果逐字 + 钩子载荷。
 */
import { test, after } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { executeToolBatches } from "../src/agent/execute-tools.mjs"

const tmpDirs = []
let ws
after(() => {
  for (const d of tmpDirs) {
    try { rmSync(d, { recursive: true, force: true }) } catch { /* best effort */ }
  }
})

function mkTmp(prefix) {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  tmpDirs.push(dir)
  return dir
}
ws = mkTmp("thincoder-vsc-dispatch-hooks-")

/** 假 hook 脚本——argv：<outPath> <exitCode>；载荷落盘后按退出码退出。 */
const SCRIPT_SOURCE = `import { writeFileSync } from "node:fs"

const [outPath, exitCode] = process.argv.slice(2)
let input = ""
for await (const chunk of process.stdin) input += chunk
writeFileSync(outPath, input)
process.exit(Number(exitCode))
`

function hookFixture() {
  const dir = mkTmp("thincoder-vsc-dispatch-hook-")
  const script = join(dir, "hook.mjs")
  writeFileSync(script, SCRIPT_SOURCE, "utf8")
  return { script, path: (name) => join(dir, name) }
}

/** 真 hook 条目（逐调用落独立载荷档——fire-and-forget 事件靠轮询读）。 */
const hookEntry = ({ script, out, code = 0, ...rest }) => ({ command: process.execPath, args: [script, out, String(code)], ...rest })

/** 探针配置：三事件各以 `length` getter 计读取次数（>0 = 该事件已进 runHooks——确定性负判据）。 */
function probeConfig() {
  const reads = { PreToolUse: 0, PostToolUse: 0, PostToolUseFailure: 0 }
  const probe = (k) => ({ get length() { reads[k] += 1; return 0 } })
  return { config: { hooks: { PreToolUse: probe("PreToolUse"), PostToolUse: probe("PostToolUse"), PostToolUseFailure: probe("PostToolUseFailure") } }, reads }
}

const readIfExists = (p) => (existsSync(p) ? readFileSync(p, "utf8") : null)

async function poll(fn, timeoutMs = 3000, intervalMs = 25) {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    const v = fn()
    if (v) return v
    if (Date.now() > deadline) return null
    await new Promise((r) => setTimeout(r, intervalMs))
  }
}

/** 写工具桩（落 executed 记录执行事实；返回串可控）。 */
const writeTool = (executed, out = (a) => `Wrote ${a.path}`) => ({
  name: "write",
  touchedPaths: (a) => [a.path],
  execute: async (a) => { executed.push(a.path); return out(a) },
})

/** 只读工具桩（不过权限块——PreToolUse 合流点仍须触发）。 */
const readTool = (executed) => ({
  name: "read",
  readonly: true,
  execute: async () => { executed.push("read"); return "file body" },
})

/** 直驱一次工具批（生产调用形状——`src/agent.mjs` 调用点同参）。 */
async function runBatch({ agent, toolByName, toolCalls, getAuto = () => true, callbacks = {}, signal = null, depth = 0 }) {
  const history = []
  await executeToolBatches(agent, {
    response: { toolCalls }, history, fullHistory: [], toolByName,
    getAuto, callbacks, signal, cwd: ws, recentSigs: [], depth,
  })
  return { history, results: () => history.filter((m) => m.role === "tool").map((m) => m.content) }
}

const tc = (id, name, args) => ({ id, name, arguments: JSON.stringify(args) })

// ─── T-DH1–T-DH3：PreToolUse（放行 / 阻断 / readonly 同测）────────────────────

test("T-DH1 正常：PreToolUse 放行 ⇒ 工具执行 ∧ 钩子收到 {event, toolName, toolArgs}", async () => {
  const f = hookFixture()
  const out = f.path("pre.json")
  const executed = []
  const agent = { cwd: ws, config: { hooks: { PreToolUse: [hookEntry({ script: f.script, out })] } }, _touchedFiles: [], history: [] }

  const r = await runBatch({ agent, toolByName: new Map([["write", writeTool(executed)]]), toolCalls: [tc("t1", "write", { path: "a.txt", content: "x" })] })

  assert.deepEqual(executed, ["a.txt"], "钩子放行 ⇒ 工具执行")
  const payload = JSON.parse(readIfExists(out))
  assert.equal(payload.event, "PreToolUse")
  assert.equal(payload.toolName, "write")
  assert.deepEqual(payload.toolArgs, { path: "a.txt", content: "x" })
  assert.equal(r.results()[0], "Wrote a.txt")
})

test("T-DH2 正常（阻断）：block + 非零退出 ⇒ 工具未执行 ∧ 模型可见结果逐字同核 ∧ 零记账", async () => {
  const f = hookFixture()
  const out = f.path("pre.json")
  const executed = []
  const agent = { cwd: ws, config: { hooks: { PreToolUse: [hookEntry({ script: f.script, out, code: 3, action: "block" })] } }, _touchedFiles: [], history: [] }

  const r = await runBatch({ agent, toolByName: new Map([["write", writeTool(executed)]]), toolCalls: [tc("t1", "write", { path: "b.txt", content: "x" })] })

  assert.deepEqual(executed, [], "阻断 ⇒ 工具不执行")
  assert.equal(r.results()[0], "Error: blocked by PreToolUse hook", "模型可见结果逐字（核 `dispatch.mjs:337-338`）")
  assert.notEqual(agent._mutatedThisRun, true, "meta:null ⇒ 不入变更记账")
  assert.deepEqual(agent._touchedFiles, [], "meta:null ⇒ 不入 touch 记账")
  assert.equal(JSON.parse(readIfExists(out)).event, "PreToolUse", "钩子确实被调用（阻断非空转）")
})

test("T-DH3 边界：readonly 工具（不过权限块）⇒ 钩子仍被调用", async () => {
  const f = hookFixture()
  const out = f.path("pre.json")
  const executed = []
  const agent = { cwd: ws, config: { hooks: { PreToolUse: [hookEntry({ script: f.script, out, code: 4, action: "block" })] } }, _touchedFiles: [], history: [] }

  const r = await runBatch({ agent, toolByName: new Map([["read", readTool(executed)]]), toolCalls: [tc("t1", "read", { path: "a.txt" })] })

  assert.deepEqual(executed, [], "readonly 同受 PreToolUse 门（核 `dispatch.mjs:257-261` 同）")
  assert.equal(r.results()[0], "Error: blocked by PreToolUse hook")
  assert.equal(JSON.parse(readIfExists(out)).toolName, "read", "只读路（不过权限块）仍达合流点")
})

// ─── T-DH4–T-DH5：PostToolUse / PostToolUseFailure ──────────────────────────

test("T-DH4 正常：PostToolUse（fire-and-forget）载荷 result = 原始结果（非 offload 后文本）", async () => {
  const f = hookFixture()
  const out = f.path("post.json")
  const executed = []
  const big = "x".repeat(70_000) // > 64K ⇒ 结果落盘 offload（钩子载荷仍须为原文）
  const agent = { cwd: ws, config: { hooks: { PostToolUse: [hookEntry({ script: f.script, out })] } }, _touchedFiles: [], history: [] }

  const r = await runBatch({ agent, toolByName: new Map([["write", writeTool(executed, () => big)]]), toolCalls: [tc("t1", "write", { path: "big.txt", content: "x" })] })

  const raw = await poll(() => readIfExists(out))
  assert.ok(raw, `PostToolUse payload not produced: ${out}`)
  const payload = JSON.parse(raw)
  assert.equal(payload.event, "PostToolUse")
  assert.equal(payload.result.length, big.length, "载荷 = 原始结果（offload 前的全文）")
  assert.ok(r.results()[0].length < big.length, "模型可见结果 = offload 后文本（与载荷不同形——两路证据）")
})

test("T-DH5 错误：工具 throw ⇒ PostToolUseFailure 收到 error ∧ 成功钩子不触发", async () => {
  const f = hookFixture()
  const failOut = f.path("fail.json")
  const okOut = f.path("ok.json")
  const boom = { name: "write", touchedPaths: (a) => [a.path], execute: async () => { throw new Error("boom") } }
  const agent = {
    cwd: ws, _touchedFiles: [], history: [],
    config: { hooks: { PostToolUseFailure: [hookEntry({ script: f.script, out: failOut })], PostToolUse: [hookEntry({ script: f.script, out: okOut })] } },
  }

  const r = await runBatch({ agent, toolByName: new Map([["write", boom]]), toolCalls: [tc("t1", "write", { path: "c.txt", content: "x" })] })

  const raw = await poll(() => readIfExists(failOut))
  assert.ok(raw, `PostToolUseFailure payload not produced: ${failOut}`)
  const payload = JSON.parse(raw)
  assert.equal(payload.event, "PostToolUseFailure")
  assert.equal(payload.error, "boom", "载荷 error = 异常 message")
  assert.equal(payload.result, null, "失败事件不带成功载荷")
  assert.equal(r.results()[0], "Error: boom", "模型可见结果 = Error: <message>")
  assert.equal(existsSync(okOut), false, "成功钩子不触发")
})

// ─── T-DH6–T-DH7：不落钩子两路（中止 / 前置门禁）────────────────────────────

test("T-DH6 边界：中止（signal.aborted）⇒ 工具不执行 ∧ 零钩子调用", async () => {
  const probe = probeConfig()
  const executed = []
  const agent = { cwd: ws, config: probe.config, _touchedFiles: [], history: [] }

  // 中止 = 异常传播（核 dispatch 同款：AbortError 不得被吞）——用例面 = 工具未执行 + 零钩子
  await assert.rejects(
    () => runBatch({
      agent, toolByName: new Map([["write", writeTool(executed)]]),
      toolCalls: [tc("t1", "write", { path: "d.txt", content: "x" })],
      signal: { aborted: true },
    }),
    (e) => e?.name === "AbortError",
    "中止须传播（不得静默吞）",
  )

  assert.deepEqual(executed, [], "中止 ⇒ 工具不执行")
  assert.deepEqual(probe.reads, { PreToolUse: 0, PostToolUse: 0, PostToolUseFailure: 0 }, "中止路径零钩子（核同）")
})

test("T-DH7 边界：前置门禁（planMode）⇒ 结果原样 ∧ 零钩子调用", async () => {
  const probe = probeConfig()
  const executed = []
  const agent = { cwd: ws, config: probe.config, _planMode: true, _touchedFiles: [], history: [] }

  const r = await runBatch({ agent, toolByName: new Map([["write", writeTool(executed)]]), toolCalls: [tc("t1", "write", { path: "e.txt", content: "x" })] })

  assert.deepEqual(executed, [], "planMode ⇒ 工具不执行")
  assert.equal(r.results()[0], "Error: plan mode active", "前置门禁结果原样")
  assert.deepEqual(probe.reads, { PreToolUse: 0, PostToolUse: 0, PostToolUseFailure: 0 }, "前置门禁早退在钩子点之前（核 Phase 1 同序）")
})
