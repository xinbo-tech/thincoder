/**
 * lifecycle-hooks.test.mjs — P2 机制层端差批（`docs/batches/2026-09-20-mechanism-parity-batch.md`
 * §2.16）机器验收（VSC 端）：`finalizeAgentTurn` 的 Stop 钩子 + advisor-run 收口。
 *
 * T-LH1–T-LH9：触发面五态（正常 / maxTurns / error / 中止 / AbortError / depth>0）/ 载荷三态 /
 * 非阻塞（确定性缝）/ 收口两态（关闭 · 自动回合豁免 · 池非空豁免）。
 *
 * 手法（照 CLI `thincoder-cli/test/hooks-stop.test.mjs`）：假 hook 脚本 = tmpdir 运行期生成
 * （`command = process.execPath`——免 PATH / Windows 差异）；配置注入面 = 桩 `agent.config.hooks`。
 * T-LH7 非阻塞 = **确定性缝**（脚本先写到达标记【含 pid】再永不 resolve——断言「宿主已返回 ∧
 * 脚本进程仍存活」，零墙钟计时；实现侧若 await 则用例挂死 = 失败）。
 * 负判据（零调用）= 探针配置（`Stop` 的 `length` getter 计读取次数）。
 */
import { test, after } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { finalizeAgentTurn } from "../src/agent/run-stages.mjs"
import { ContinueError } from "../src/agent.mjs"
// §2.18 端半读侧单点（生产同一符号：`src/agent.mjs:117` 起手回填）
import { restoreGuard } from "@thincoder/core/agent/helpers.mjs"
import { buildTopLevelAgent, hydrateRun } from "../src/agent/setup.mjs"
import { _setConfigPathForTest } from "@thincoder/core/config.mjs"
import { _setSessionsDirForTest, _resetSessionsDirForTest } from "../src/extension/session-slots.mjs"
import { _gitFailureCooldownForTests, _clearGitFailureCooldownForTests } from "../src/agent/setup-reminders.mjs"

const tmpDirs = []
after(() => {
  for (const d of tmpDirs) {
    try { rmSync(d, { recursive: true, force: true }) } catch { /* best effort */ }
  }
})

/** 假 hook 脚本——argv：<mode> <outPath>。`payload` = 落 stdin；`hang` = 先落 pid 再永不 resolve。 */
const SCRIPT_SOURCE = `import { writeFileSync } from "node:fs"

const [mode, outPath] = process.argv.slice(2)
let input = ""
for await (const chunk of process.stdin) input += chunk
if (mode === "hang") {
  writeFileSync(outPath, String(process.pid)) // 到达标记（含 pid）——宿主返回后才应出现
  setInterval(() => {}, 1000)                 // 活跃句柄 ⇒ 事件循环不空转（挂起的 Promise 自身不保活）
  await new Promise(() => {})                 // 永不 resolve（实现侧 await 化 ⇒ 用例挂死 = 失败）
}
writeFileSync(outPath, input)
process.exit(0)
`

/** 夹具：tmpdir 运行期生成脚本 + 产物路径。 */
function hookFixture() {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-vsc-stop-hook-"))
  tmpDirs.push(dir)
  const script = join(dir, "hook.mjs")
  writeFileSync(script, SCRIPT_SOURCE, "utf8")
  return { dir, script, path: (name) => join(dir, name) }
}

/** hook 条目：node 可执行 + 假脚本（mode / out 由用例给）。 */
const hookEntry = ({ script, mode = "payload", out, ...rest }) => ({ command: process.execPath, args: [script, mode, out], ...rest })

/** 挂起缝的 spawn 超时（≤ 默认 10s）：存活断言窗口 ≫ 断言时点，且不使本档尾挂 10s+。 */
const HANG_TIMEOUT_MS = 4000

const readIfExists = (p) => (existsSync(p) ? readFileSync(p, "utf8") : null)

/** 轮询（就绪判据——≤5s；非断言面）。 */
async function poll(fn, timeoutMs = 5000, intervalMs = 25) {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    const v = fn()
    if (v) return v
    if (Date.now() > deadline) return null
    await new Promise((r) => setTimeout(r, intervalMs))
  }
}

/** 桩 agent（finalizeAgentTurn 依赖对最小桩零崩溃——ctx.history 必给对象：depth-0 写池载体）。 */
const stubAgent = (hooks = {}, over = {}) => ({ config: { hooks }, _turnSeq: 7, _touchedFiles: [], ...over })

/** 探针配置：Stop 的 `length` getter 计读取次数（>0 = 触发块已进 runHooks——确定性负判据）。 */
function probeStop() {
  let reads = 0
  return {
    agent: stubAgent({ Stop: { get length() { reads += 1; return 0 } } }),
    reads: () => reads,
  }
}

const ctxFor = (over = {}) => ({ depth: 0, history: {}, ...over })

// ─── T-LH1–T-LH3：载荷三态（正常 / maxTurns / error）─────────────────────────

test("T-LH1 正常：主会话 run 终止触发 Stop——event/turn/reason 载荷", async () => {
  const f = hookFixture()
  const out = f.path("payload.json")
  const agent = stubAgent({ Stop: [hookEntry({ script: f.script, out })] })

  await finalizeAgentTurn(agent, ctxFor())

  const raw = await poll(() => readIfExists(out))
  assert.ok(raw, `Stop payload not produced: ${out}`)
  const p = JSON.parse(raw)
  assert.equal(p.event, "Stop")
  assert.equal(p.toolName, null, "无工具名事件（Stop）")
  assert.equal(p.reason, "done")
  assert.equal(p.turn, 7, "轮号载荷 = 端壳 _turnSeq（链内累计轮号）")
  assert.equal(p.error, null)
  assert.ok(!Number.isNaN(Date.parse(p.timestamp)), `timestamp not parseable: ${p.timestamp}`)
})

test("T-LH2 边界：撞帽（ContinueError）→ reason=maxTurns / error=null", async () => {
  const f = hookFixture()
  const out = f.path("payload.json")
  const agent = stubAgent({ Stop: [hookEntry({ script: f.script, out })] })

  await finalizeAgentTurn(agent, ctxFor({ thrownError: new ContinueError(5) }))

  const raw = await poll(() => readIfExists(out))
  assert.ok(raw, `Stop payload not produced: ${out}`)
  const p = JSON.parse(raw)
  assert.equal(p.reason, "maxTurns")
  assert.equal(p.error, null, "ContinueError 不入 error 位")
})

test("T-LH3 边界：非预期异常 → reason=error / error=message", async () => {
  const f = hookFixture()
  const out = f.path("payload.json")
  const agent = stubAgent({ Stop: [hookEntry({ script: f.script, out })] })

  await finalizeAgentTurn(agent, ctxFor({ thrownError: new Error("x") }))

  const raw = await poll(() => readIfExists(out))
  assert.ok(raw, `Stop payload not produced: ${out}`)
  const p = JSON.parse(raw)
  assert.equal(p.reason, "error")
  assert.equal(p.error, "x")
})

// ─── T-LH4–T-LH6：不触发三态（中止 / AbortError / depth>0）───────────────────

test("T-LH4 边界：用户中止（signal 已 abort）→ 零调用", async () => {
  const probe = probeStop()
  await finalizeAgentTurn(probe.agent, ctxFor({ signal: { aborted: true } }))
  assert.equal(probe.reads(), 0, "中止不得触发 Stop（钩子面零读取）")
})

test("T-LH5 边界：AbortError 展开 → 零调用", async () => {
  const probe = probeStop()
  await finalizeAgentTurn(probe.agent, ctxFor({ thrownError: Object.assign(new Error("User interrupted"), { name: "AbortError" }) }))
  assert.equal(probe.reads(), 0, "AbortError 展开不得触发 Stop")
})

test("T-LH6 边界：子代理（depth>0）→ 零调用", async () => {
  const probe = probeStop()
  await finalizeAgentTurn(probe.agent, { depth: 1, history: {} })
  assert.equal(probe.reads(), 0, "depth>0 不触发端侧 Stop（子代走核循环——无双重触发）")
})

// ─── T-LH7：非阻塞（确定性缝）──────────────────────────────────────────────

test("T-LH7 边界：非阻塞——宿主返回 ∧ 脚本进程仍存活（未 await 钩子）", async () => {
  const f = hookFixture()
  const arrived = f.path("arrived")
  const agent = stubAgent({ Stop: [hookEntry({ script: f.script, mode: "hang", out: arrived, timeout: HANG_TIMEOUT_MS })] })

  await finalizeAgentTurn(agent, ctxFor()) // await 化回归 ⇒ 本行永不返回（用例挂死 = 失败）

  // 就绪窗口 2s（批档 §2.16 声明的上限）< 脚本 spawn 超时 4s（HANG_TIMEOUT_MS）——窗口内
  // 子进程不会被超时回收 ⇒ 归 null 即真「未启动」（而非被回收——失败信息可判别）。
  const pidRaw = await poll(() => readIfExists(arrived), 2000)
  assert.ok(pidRaw, `到达标记 not produced（脚本未启动或已被 await）: ${arrived}`)
  const pid = Number(pidRaw)
  assert.ok(Number.isInteger(pid) && pid > 0, `标记须含 pid：${pidRaw}`)
  try {
    assert.doesNotThrow(() => process.kill(pid, 0), "宿主返回后脚本仍存活 ⇒ 判「未 await 钩子」")
  } finally {
    try { process.kill(pid) } catch { /* 已退出（spawn timeout）——零动作 */ }
  }
})

// ─── T-LH8–T-LH9：advisor-run 收口两态 ──────────────────────────────────────

test("T-LH8 正常/边界：正常结束 ⇒ OPEN code 实例关闭；autoTurn ⇒ 不关", async () => {
  const mkAgent = () => ({ history: {}, _advisorRuns: new Map([["r1", { id: "r1", reviewType: "code", open: true }]]), _asyncAdvisors: new Map(), _asyncSubagents: new Map() })

  const normal = mkAgent()
  await finalizeAgentTurn(normal, ctxFor())
  assert.equal(normal._advisorRuns.get("r1").open, false, "正常结束 ⇒ closeOpenCodeAdvisorRuns 被调（OPEN code 实例关闭）")

  const digest = mkAgent()
  await finalizeAgentTurn(digest, ctxFor({ autoTurn: true }))
  assert.equal(digest._advisorRuns.get("r1").open, true, "自动回合豁免（其消化先于修复轮）")
})

test("T-LH9 边界：评审池非空 ⇒ 实例保持 open（核内建守卫）", async () => {
  const agent = { history: {}, _advisorRuns: new Map([["r1", { id: "r1", reviewType: "code", open: true }]]), _asyncAdvisors: new Map([["a1", { id: "a1", role: "advisor", done: false }]]), _asyncSubagents: new Map() }

  await finalizeAgentTurn(agent, ctxFor())

  assert.equal(agent._advisorRuns.get("r1").open, true, "池内有在跑步评审 ⇒ 线程保持 open（修复轮可续）")
})

// ─── T-LH10：配置面 plumb（§2.16 步 3/4——钩子可达的前提：config.json`hooks` 段进 agent.config）

test("T-LH10 装配面：hydrateRun 携 `hooks` 段 ⇒ agent.config.hooks 落地（缺段 → null）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-vsc-stop-hook-cfg-"))
  tmpDirs.push(dir)
  const proj = join(dir, "proj")
  mkdirSync(proj, { recursive: true })
  const cfgPath = join(dir, "config.json")
  _setConfigPathForTest(cfgPath)
  _setSessionsDirForTest(join(dir, "sessions"))
  _gitFailureCooldownForTests(proj, Date.now())
  const run = () => hydrateRun(buildTopLevelAgent(), {
    provider: { model: "deepseek-v4-pro" }, cwd: proj, input: "hi",
    opts: { engState: { enabled: false } }, depth: 0, role: null, getAuto: () => false,
  })
  try {
    const hooks = { Stop: [{ command: "x", args: [], action: "notify" }] }
    writeFileSync(cfgPath, JSON.stringify({ providers: [], defaultModel: null, hooks }))
    const withHooks = await run()
    assert.deepEqual(withHooks.agent.config.hooks, hooks, "hooks 段整建进 agent.config（`runHooks` 消费面）")

    writeFileSync(cfgPath, JSON.stringify({ providers: [], defaultModel: null }))
    const without = await run()
    assert.equal(without.agent.config.hooks, null, "缺段 → null（钩子恒空转而非报错）")
  } finally {
    _setConfigPathForTest(null)
    _resetSessionsDirForTest()
    _clearGitFailureCooldownForTests(proj)
  }
})

// ─── T-LH11：§2.18 端半 guard 快照/回填（写侧 = auto 轮收尾 · 读侧 = 下轮起手）────

test("T-LH11 §2.18 端半：auto 轮收尾七键入载体；满载体回填 / 空载体 no-op（不清键）", async () => {
  const carry = {}
  const agent = {
    history: {}, _mutatedThisRun: true, _verifiedThisRun: true, _verifyPassed: true,
    _calledAdvisorThisRun: true, _touchedFiles: ["/x/a.mjs"], _verifyRetries: 2, _advisorRound: 3,
  }

  await finalizeAgentTurn(agent, { depth: 0, history: {}, autoTurn: true, guardCarry: carry })

  assert.deepEqual(carry, {
    _mutatedThisRun: true, _verifiedThisRun: true, _verifyPassed: true,
    _calledAdvisorThisRun: true, _touchedFiles: ["/x/a.mjs"], _verifyRetries: 2, _advisorRound: 3,
  }, "auto 轮收尾 ⇒ 七键快照入端载体（`panel._guardCarry`——载体留端）")

  // 读侧（`src/agent.mjs:117` 起手 restoreGuard）：满载体 ⇒ 标记回填
  const next = { _mutatedThisRun: false, _verifiedThisRun: false, _verifyPassed: undefined, _calledAdvisorThisRun: false, _touchedFiles: [], _verifyRetries: 0, _advisorRound: 0 }
  restoreGuard(next, carry)
  assert.equal(next._mutatedThisRun, true, "满载体：变更标记回填（auto 轮变更逃不出 guard）")
  assert.deepEqual(next._touchedFiles, ["/x/a.mjs"], "满载体：touch 清单回填")
  assert.equal(next._advisorRound, 3, "满载体：轮次回填")

  // 空载体（auto 轮被 Stop / ContinueError 收尾 ⇒ `panel._guardCarry` 保持 `{}`）：核读侧 `in` 守卫 ⇒ 零拷贝
  const empty = { _mutatedThisRun: false, _verifiedThisRun: false, _verifyPassed: undefined, _calledAdvisorThisRun: false, _touchedFiles: [], _verifyRetries: 0, _advisorRound: 0 }
  restoreGuard(empty, {})
  assert.equal(empty._mutatedThisRun, false, "空载体：保留 resetRunState 复位值（不清成 undefined）")
  assert.deepEqual(empty._touchedFiles, [], "空载体不清键（旧口径写 undefined ⇒ `_touchedFiles.length` 类 TypeError 面）")
  assert.equal(empty._advisorRound, 0)
})
