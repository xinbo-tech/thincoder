/**
 * hooks-stop.test.mjs — 第 30 批 STOP-HOOK（设计 AGENT-LOOP.md §21，需求 §7）：
 * T-HS1–T-HS11——Stop 触发面五态 / 载荷三态 / 非阻塞（信号同步）/ matcher 忽略 /
 * 失败静默 / PreToolUse matcher 回归 / 事件集静态收口（AC-HS1–AC-HS5）。
 * 快层零网络：假 hook 脚本 = tmpdir 运行期生成（command = process.execPath——
 * 免 PATH / Windows 差异）；配置注入面 = 既有缝（桩 agent.config.hooks[event]，§21.6 注记）。
 */
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { finalizeAgentTurn } from "../src/agent/run-stages.mjs"
import { runHooks } from "../src/hooks.mjs"
import { ContinueError } from "../src/agent/helpers.mjs"

const ROOT = fileURLToPath(new URL("..", import.meta.url))

const tmpDirs = []
after(() => {
  for (const d of tmpDirs) {
    try { rmSync(d, { recursive: true, force: true }) } catch { /* best effort */ }
  }
})

/** 假 hook 脚本（运行期生成——argv: <payloadPath> <startedPath|-> <goPath|->）；
 *  信号同步形态（T-HS2）：先落 started → 等 go（≤10s 超时自杀，此间不落载荷）→ 落载荷。
 *  脚本错误（含 stderr 摘要）落 `${payload}.err`——轮询失败信息用。 */
const SCRIPT_SOURCE = `import { existsSync, writeFileSync } from "node:fs"

const [payloadPath, startedPath, goPath] = process.argv.slice(2)

try {
  let input = ""
  for await (const chunk of process.stdin) input += chunk
  if (startedPath !== "-") writeFileSync(startedPath, "started")
  if (goPath !== "-") {
    const deadline = Date.now() + 10000
    while (!existsSync(goPath)) {
      if (Date.now() > deadline) process.exit(3)
      await new Promise((r) => setTimeout(r, 25))
    }
  }
  writeFileSync(payloadPath, input)
  process.exit(0)
} catch (err) {
  try { writeFileSync(payloadPath + ".err", String(err?.stack ?? err)) } catch {}
  process.exit(4)
}
`

/** 假 hook 夹具：tmpdir 运行期生成脚本 + 产物路径（dir 级隔离）。 */
function hookFixture() {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-stop-hook-"))
  tmpDirs.push(dir)
  const script = join(dir, "hook.mjs")
  writeFileSync(script, SCRIPT_SOURCE, "utf8")
  return { dir, script, path: (name) => join(dir, name) }
}

/** hook 条目：node 可执行 + 假脚本（started / go 可空——"-" = 不用）。 */
function hookEntry({ script, payload, started = "-", go = "-", ...rest }) {
  return { command: process.execPath, args: [script, payload, started, go], ...rest }
}

/** 桩 agent（§21.6 勘察注记：finalizeAgentTurn 依赖对最小桩零崩溃）。 */
function stubAgent(hooks = {}) {
  return { config: { hooks }, _currentTurn: 7 }
}

/** 探针配置：Stop 的 length getter 计读取次数（>0 = 触发块已调用 runHooks——确定性负判据）。 */
function probeStopConfig() {
  let reads = 0
  return {
    agent: { config: { hooks: { Stop: { get length() { reads += 1; return 0 } } } } },
    reads: () => reads,
  }
}

const readIfExists = (p) => (existsSync(p) ? readFileSync(p, "utf8") : null)

/** 轮询（≤5s 上限——§21.6 注记）：命中返回真值，超时返回 null。 */
async function poll(fn, timeoutMs = 5000, intervalMs = 50) {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    const value = fn()
    if (value) return value
    if (Date.now() > deadline) return null
    await new Promise((r) => setTimeout(r, intervalMs))
  }
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

/** 失败信息（§21.6 注记统一形态）：目标路径 + 脚本 stderr 摘要（errSource 缺省 = target——
 *  T-HS2 的 started 失败需指向 payload 的 .err——脚本错误只落该处）。 */
function artifactFail(target, label, errSource = target) {
  const errFile = `${errSource}.err`
  const detail = existsSync(errFile) ? readFileSync(errFile, "utf8") : "(no script error output)"
  return `${label} — target: ${target}\nscript error summary: ${detail}`
}

// ── T-HS1–T-HS9：触发判定 / 载荷（AC-HS1 / AC-HS2 / AC-HS3） ─────────────────

test("T-HS1 正常：主会话 run 终止触发 Stop——载荷骨架 / reason=done", async () => {
  const f = hookFixture()
  const payload = f.path("payload.json")
  const agent = stubAgent({ Stop: [hookEntry({ script: f.script, payload })] })

  await finalizeAgentTurn(agent, { depth: 0 })

  const raw = await poll(() => readIfExists(payload))
  assert.ok(raw, artifactFail(payload, "Stop payload not produced"))
  const p = JSON.parse(raw)
  assert.equal(p.event, "Stop")
  assert.equal(p.toolName, null)
  assert.equal(p.toolArgs, null)
  assert.equal(p.result, null)
  assert.equal(p.error, null)
  assert.equal(p.reason, "done")
  assert.equal(p.turn, 7)
  assert.ok(!Number.isNaN(Date.parse(p.timestamp)), `timestamp not parseable: ${p.timestamp}`)
  assert.equal(new Date(p.timestamp).toISOString(), p.timestamp, "timestamp must be ISO 8601")
})

test("T-HS2 边界：非阻塞（宿主返回先于脚本产物——信号同步）", { timeout: 15_000 }, async () => {
  const f = hookFixture()
  const payload = f.path("payload.json")
  const started = f.path("started")
  const go = f.path("go")
  const agent = stubAgent({ Stop: [hookEntry({ script: f.script, payload, started, go })] })

  // await 化回归 → 宿主与脚本互等（脚本等 go、测试等宿主）→ 脚本 ≤10s 自杀 / 测试 15s 超时红。
  await finalizeAgentTurn(agent, { depth: 0 })

  const startedOk = await poll(() => existsSync(started))
  assert.ok(startedOk, artifactFail(started, "script never started", payload))
  assert.equal(existsSync(payload), false, `host returned before script product — payload must not exist yet: ${payload}`)

  writeFileSync(go, "go")
  const raw = await poll(() => readIfExists(payload))
  assert.ok(raw, artifactFail(payload, "payload never appeared after go (script died waiting)"))
  assert.equal(JSON.parse(raw).event, "Stop")
})

test("T-HS3 边界：撞帽（ContinueError）→ reason=maxTurns / error=null", async () => {
  const f = hookFixture()
  const payload = f.path("payload.json")
  const agent = stubAgent({ Stop: [hookEntry({ script: f.script, payload })] })

  await finalizeAgentTurn(agent, { depth: 0, thrownError: new ContinueError(50) })

  const raw = await poll(() => readIfExists(payload))
  assert.ok(raw, artifactFail(payload, "Stop payload not produced"))
  const p = JSON.parse(raw)
  assert.equal(p.reason, "maxTurns")
  assert.equal(p.error, null)
})

test("T-HS4 边界：子代理（depth=1）不触发", async () => {
  const probe = probeStopConfig()
  await finalizeAgentTurn(probe.agent, { depth: 1 })
  assert.equal(probe.reads(), 0, "Stop config must not be consulted for depth > 0")
})

test("T-HS5 边界：用户中止（signal 已 abort / AbortError 展开）不触发", async () => {
  const aborted = probeStopConfig()
  await finalizeAgentTurn(aborted.agent, { depth: 0, signal: { aborted: true } })
  assert.equal(aborted.reads(), 0, "aborted signal must suppress Stop")

  const abortErr = probeStopConfig()
  await finalizeAgentTurn(abortErr.agent, {
    depth: 0,
    thrownError: Object.assign(new Error("User interrupted"), { name: "AbortError" }),
  })
  assert.equal(abortErr.reads(), 0, "AbortError unwinding must suppress Stop")
})

test("T-HS6 边界：auto-turn（digest）回合同样触发", async () => {
  const f = hookFixture()
  const payload = f.path("payload.json")
  const agent = stubAgent({ Stop: [hookEntry({ script: f.script, payload })] })

  await finalizeAgentTurn(agent, { depth: 0, autoTurn: true })

  const raw = await poll(() => readIfExists(payload))
  assert.ok(raw, artifactFail(payload, "auto-turn run must fire Stop"))
  assert.equal(JSON.parse(raw).reason, "done")
})

test("T-HS7 边界：Stop hook 带 matcher（无工具名）仍触发", async () => {
  const f = hookFixture()
  const payload = f.path("payload.json")
  const agent = stubAgent({ Stop: [hookEntry({ script: f.script, payload, matcher: "^bash$" })] })

  await finalizeAgentTurn(agent, { depth: 0 })

  const raw = await poll(() => readIfExists(payload))
  assert.ok(raw, artifactFail(payload, "matcher must be ignored by no-tool-name events"))
  assert.equal(JSON.parse(raw).event, "Stop")
})

test("T-HS8 错误：hook 命令不存在 → 零异常、零产物", async () => {
  const f = hookFixture()
  const payload = f.path("payload.json")
  const agent = stubAgent({ Stop: [{ command: join(f.dir, "no-such-command.exe"), args: [f.script, payload] }] })

  await finalizeAgentTurn(agent, { depth: 0 }) // 不抛即「零异常」
  await delay(250) // 异步 spawn 失败冒泡窗口——未处置即测试进程红

  assert.equal(existsSync(payload), false, `payload must not exist: ${payload}`)
  assert.equal(existsSync(`${payload}.err`), false, `script must not have run: ${payload}.err`)
})

test("T-HS9 错误：非预期异常 → reason=error / error=message", async () => {
  const f = hookFixture()
  const payload = f.path("payload.json")
  const agent = stubAgent({ Stop: [hookEntry({ script: f.script, payload })] })

  await finalizeAgentTurn(agent, { depth: 0, thrownError: new Error("boom") })

  const raw = await poll(() => readIfExists(payload))
  assert.ok(raw, artifactFail(payload, "Stop payload not produced"))
  const p = JSON.parse(raw)
  assert.equal(p.reason, "error")
  assert.equal(p.error, "boom")
})

// ── T-HS10–T-HS11：matcher 回归 / 事件集收口（AC-HS4 / AC-HS5） ───────────────

test("T-HS10 回归：工具事件 matcher 过滤语义保持（PreToolUse 直驱）", async () => {
  const f = hookFixture()
  const payload = f.path("payload.json")
  const agent = stubAgent({ PreToolUse: [hookEntry({ script: f.script, payload, matcher: "^bash$" })] })

  await runHooks("PreToolUse", { agent, toolName: "read" })
  assert.equal(existsSync(payload), false, `matcher ^bash$ must filter out "read": ${payload}`)

  await runHooks("PreToolUse", { agent, toolName: "bash" })
  const raw = await poll(() => readIfExists(payload))
  assert.ok(raw, artifactFail(payload, '"bash" must pass the matcher'))
  const p = JSON.parse(raw)
  assert.equal(p.event, "PreToolUse")
  assert.equal(p.toolName, "bash")
})

test("T-HS11 静态：事件集收口——含 Stop、不含 Notification、头部事件表四类齐 + matcher 守卫形态在位（AC-HS4）", () => {
  const src = readFileSync(join(ROOT, "src/hooks.mjs"), "utf8")
  assert.ok(src.includes("Stop"), "src/hooks.mjs must declare the Stop event")
  assert.ok(!src.includes("Notification"), "Notification declaration must be removed")
  assert.ok(src.includes("ctx.toolName != null"), "matcher guard form must be in place (AC-HS4)")
  const events = [...src.matchAll(/^ \*   (\w+)\s+—/gm)].map((m) => m[1])
  assert.deepEqual(events, ["PreToolUse", "PostToolUse", "PostToolUseFailure", "Stop"])
})
