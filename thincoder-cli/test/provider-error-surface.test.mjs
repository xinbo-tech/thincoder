/**
 * provider-error-surface.test.mjs — X8（2026-09-20 端差·显示面消差批 批 3）用例：
 * CLI provider 失败面 = 友好首行（URL 脱敏）+ 诊断两行（`→ Provider` / `→ Model`）+
 * Retry 询问（复用 `state.permission` 机制——同意 ⇒ 重建 controller + resume 重入；
 * 拒绝 ⇒ 现状 break，`[error]` 行保留）。对位标尺 = VSC `panel-turn-loop.mjs:150-155`
 * （脱敏正则/三行判据）+ `webview/ui.js:408-421`（error-retry-btn）。
 * 手法：runAgentTurn 测试缝（`ctx.runAgent` 注入——首调抛 provider 错误、次调只记录 opts）；
 * 应答经 key-modes 真处理器（handlePermissionMode——与 TTY 同路径）。无 TTY / 无网络。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { runAgentTurn } from "../src/tui/agent-turn.mjs"
import { handlePermissionMode } from "../src/tui/key-modes.mjs"
import { renderRows, renderStatus } from "../src/tui/render-frame.mjs"

const PROVIDER = { name: "glm", baseURL: "https://api.example.com/v1", model: "glm-5.3" }
/** 供应商错误原文（首行含 baseURL——脱敏面判据；次行 = 不应进首行的后续行）。 */
const RAW = "Provider request failed: 502 Bad Gateway from https://api.example.com/v1/chat/completions\nupstream detail line"

/** 回合驱动 rig（runAgentTurn 直驱——最小 agent/state；runAgent 注入不触网）。 */
function rig() {
  const lines = []
  const calls = []
  const agent = {
    provider: { ...PROVIDER }, history: [], title: "t", autoApprove: false,
    _asyncSubagents: new Map(), _asyncAdvisors: new Map(), _pendingAsyncResults: [],
  }
  const state = {
    lines: [], subTasks: {}, tasks: [], queue: [], input: [], cursor: 0,
    processing: false, status: "Ready", suspended: false, _suspPending: false, _suspAborted: false,
    streaming: "", reasoning: "", permission: null, permissionPreview: [], _advisorBlocks: [],
    attentionAwaiting: false, exitArmed: false,
  }
  const ctx = {
    agent,
    state,
    pushLine: (text) => lines.push(String(text)),
    pushLabel: (text) => lines.push(String(text)),
    render() {}, scheduleRender() {}, ensureAssistantLabel() {},
    askPermission: null, askBatchPermission: null, askQuestion: null,
    handleSlash: async () => {},
    saveSession: () => {},
    runAgent: async (_a, text, _cb, opts) => {
      calls.push({ text: String(text), opts: { ...(opts ?? {}) } })
      if (calls.length === 1) throw new Error(RAW)
    },
  }
  return { agent, state, ctx, lines, calls }
}

/** 等条件成立（微任务/定时器推进——上限 3s = 失败上限，防重载 CI 误报；不成立即抛，避免悬挂）。 */
async function until(fn, ms = 3000, detail = null) {
  const t0 = Date.now()
  while (!fn()) {
    if (Date.now() - t0 > ms) throw new Error(`until timeout${detail ? ` — ${typeof detail === "function" ? detail() : detail}` : ""}`)
    await new Promise((r) => setTimeout(r, 1))
  }
}

/** 应答 permission 询问（TTY 同路径 = handlePermissionMode——y/n 键）。 */
function answer(r, key) {
  handlePermissionMode(key, { name: key }, {
    state: r.state,
    agent: r.agent,
    pushLine: (text) => r.lines.push(String(text)),
    render() {},
  })
}

test("X8 失败面：首行含 [endpoint] ∧ 不含原 URL ∧ 单行；诊断两行含 provider / model（VSC 同判据）", async () => {
  const r = rig()
  const p = runAgentTurn(r.ctx, "hello")
  await until(() => r.state.permission, 3000, () => JSON.stringify(r.lines))
  answer(r, "n")
  await p
  const errLine = r.lines.find((l) => l.startsWith("[error] "))
  assert.ok(errLine, `[error] 行在位（实读：${JSON.stringify(r.lines)}）`)
  assert.ok(errLine.includes("[endpoint]"), "首行 URL 脱敏为 [endpoint]")
  assert.ok(!errLine.includes("https://api.example.com"), "首行不含原 URL")
  assert.ok(!errLine.includes("\n") && !errLine.includes("upstream detail line"), "友好首行 = 原文首行（不含后续行）")
  assert.ok(r.lines.includes(`→ Provider: ${PROVIDER.baseURL}`), "诊断行 → Provider 逐字（VSC 同形）")
  assert.ok(r.lines.includes(`→ Model: ${PROVIDER.model}`), "诊断行 → Model 逐字")
})

test("X8 Retry 同意：permission 询问名 = retry ⇒ 重建 controller + resume=true 重入；拒绝 ⇒ 单调用 + [error] 保留", async () => {
  // 同意路径：第二调用 resume=true ∧ 新 signal（history 不重复推入——ContinueError 同法）
  const y = rig()
  const py = runAgentTurn(y.ctx, "hello")
  await until(() => y.state.permission, 3000, () => JSON.stringify(y.lines))
  assert.equal(y.state.permission.name, "retry", "询问名 = retry（复用 permission 面板——TUI 组件零新增）")
  answer(y, "y")
  await py
  assert.equal(y.calls.length, 2, "同意 ⇒ 重入回合（第二次 runAgent 调用）")
  assert.equal(y.calls[0].opts.resume, false, "首调 resume=false")
  assert.equal(y.calls[1].opts.resume, true, "重入以 resume=true（同 history 续跑）")
  assert.notEqual(y.calls[1].opts.signal, y.calls[0].opts.signal, "重建 controller（新 signal）")
  assert.equal(y.calls[1].opts.signal.aborted, false, "新 controller 未中止")
  assert.equal(y.state.permission, null, "应答后询问态关闭")
  assert.ok(y.lines.some((l) => l.startsWith("[error] ")), "重入后 [error] 行仍在流中（诊断上下文保留）")

  // 拒绝路径：不重入 + [error] 保留 + 回合正常收尾
  const n = rig()
  const pn = runAgentTurn(n.ctx, "hello")
  await until(() => n.state.permission, 3000, () => JSON.stringify(n.lines))
  answer(n, "n")
  await pn
  assert.equal(n.calls.length, 1, "拒绝 ⇒ 不再重入")
  assert.ok(n.lines.some((l) => l.startsWith("[error] ")), "拒绝后 [error] 行保留（现状 break）")
  assert.equal(n.state.permission, null, "拒绝后询问态关闭")
  assert.equal(n.state.processing, false, "回合收尾（processing 复位——不悬挂）")
})

test("X8 边界：非 Error 抛出（字符串）也出首行（VSC `e.message || String(e)` 同式）", async () => {
  const r = rig()
  r.ctx.runAgent = async () => { throw "boom-from-provider" }
  const p = runAgentTurn(r.ctx, "hello")
  await until(() => r.state.permission, 3000, () => JSON.stringify(r.lines))
  answer(r, "n")
  await p
  assert.ok(r.lines.some((l) => l === "[error] boom-from-provider"), `字符串抛出仍出首行（实读：${JSON.stringify(r.lines)}）`)
})

// ─── #132 ① Retry 仅 y/n（框面 + 键面）────────────────────────────────────

/** permission 模态直驱（真 key-modes 处理器）——返回 resolve 记录 + 按键面。 */
function permProbe(name, permOver = {}) {
  const r = rig()
  const calls = []
  r.agent._pendingReminders = []
  r.state.permission = { name, args: {}, resolve: (v) => calls.push(v), ...permOver }
  const press = (key) => handlePermissionMode(key === "escape" ? "" : key, { name: key }, {
    state: r.state, agent: r.agent, pushLine: (t) => r.lines.push(String(t)), render() {},
  })
  return { r, calls, press }
}

const RETRY = { name: "retry", args: {}, batch: null }

test("T-R1 retry 键面：`a` 被吞（零 AUTO 副作用 / 不消模态 / 不 resolve）；`y` ⇒ true；`n` / Esc ⇒ false", () => {
  const a = permProbe("retry", RETRY)
  a.press("a")
  assert.equal(a.calls.length, 0, "`a` 不 resolve（键被吞——等有效键）")
  assert.equal(a.r.agent.autoApprove, false, "`a` 不翻会话级 AUTO")
  assert.deepEqual(a.r.agent._pendingReminders, [], "`a` 不推 AUTO 提醒")
  assert.ok(a.r.state.permission, "模态仍在（悬挂态——非静默放行）")
  assert.ok(!a.r.lines.some((l) => l.includes("[auto]")), "无 [auto] 轨迹行")

  const y = permProbe("retry", RETRY)
  y.press("y")
  assert.deepEqual(y.calls, [true], "`y` ⇒ resolve(true)")
  assert.equal(y.r.state.permission, null, "应答即消模态")
  assert.ok(y.r.lines.some((l) => l.includes("[approved] retry")), "轨迹行保留（与 continue 面不同——retry 无自有输出行）")

  const n = permProbe("retry", RETRY)
  n.press("n")
  assert.deepEqual(n.calls, [false], "`n` ⇒ resolve(false)")

  const esc = permProbe("retry", RETRY)
  esc.press("escape")
  assert.deepEqual(esc.calls, [false], "Esc ⇒ resolve(false)")
})

test("T-R2 retry 端到端：`a` 被吞 ⇒ 不重入（悬挂）；随后 `n` ⇒ 单调用 + [error] 保留 + 收尾", async () => {
  const r = rig()
  const p = runAgentTurn(r.ctx, "hello")
  await until(() => r.state.permission, 3000, () => JSON.stringify(r.lines))
  answer(r, "a")
  await new Promise((res) => setTimeout(res, 20))
  assert.equal(r.calls.length, 1, "`a` 被吞 ⇒ 不重入")
  assert.ok(r.state.permission, "模态悬挂（有效键前不 resolve——rig 收尾走 `n`）")
  answer(r, "n")
  await p
  assert.equal(r.calls.length, 1, "`n` ⇒ 不重入（断回合）")
  assert.ok(r.lines.some((l) => l.startsWith("[error] ")), "[error] 行保留")
  assert.equal(r.state.processing, false, "回合收尾（不悬挂）")
})

/** 帧面最小状态（renderRows / renderStatus 直驱——attention-state.test.mjs 同款）。 */
function frameState(over = {}) {
  return {
    input: [], cursor: 0, scroll: 0, tasks: [], queue: [], history: [], historyIndex: -1, _draft: null,
    processing: false, processingStarted: Date.now(), status: "Ready", currentTool: null,
    tokens: { prompt: 0, completion: 0, cacheHit: 0, cacheMiss: 0, reasoningTokens: 0 },
    ctxCache: { tokens: 0 }, permission: null, question: null, picker: null, wizard: null, search: null,
    interruptPrompt: null, suspended: false, _suspPending: false, attentionAwaiting: false,
    subTasks: {}, lines: [], permissionPreview: [], streaming: "", reasoning: "",
    ...over,
  }
}
const frameAgent = () => ({ provider: null, cwd: "x", autoApprove: false, planMode: false, config: null, _currentTurn: 0, _maxTurns: 0 })
const rowsOf = (perm) => renderRows(frameState({ permission: perm }), frameAgent(), { cols: 80, rows: 24, slashCommands: [] }).rows.join("\n")

test("T-R3 框面字面：retry ⇒ 标题 ` Retry? (y/n) ` + 提示行 ` y: retry │ n: stop`；continue / 通用框 / batch 框零改", () => {
  const retry = rowsOf({ name: "retry" })
  assert.ok(retry.includes(" Retry? (y/n) "), "retry 标题逐字")
  assert.ok(retry.includes(" y: retry │ n: stop"), "retry 提示行逐字")
  assert.ok(!retry.includes("a: approve all"), "retry 框不广告 `a` 键")

  const cont = rowsOf({ name: "continue" })
  assert.ok(cont.includes(" Continue? (y/n) ") && cont.includes(" y: continue │ n: stop"), "continue 两字面零改")

  const generic = rowsOf({ name: "bash" })
  assert.ok(generic.includes(" Allow bash? (y/n/a) "), "通用框标题零改")
  assert.ok(renderStatus(frameState({ permission: { name: "bash" } }), frameAgent(), 80, []).includes(" y: approve │ n: deny │ a: approve all (AUTO)"), "通用框提示行零改")

  const batch = rowsOf({ name: "3 tools need permission: read, write", batch: { tools: [], count: 3 } })
  assert.ok(batch.includes("(a/o/n)"), "batch 框标题零改")
  assert.ok(renderStatus(frameState({ permission: { name: "x", batch: { tools: [], count: 3 } } }), frameAgent(), 80, []).includes(" a: approve all │ o: one by one │ n: deny"), "batch 框提示行零改")
})

test("T-R4 ① 回归：通用 permission 框 `a` ⇒ autoApprove=true + 推 AUTO 提醒；batch 框 `a/o/n` 零改", () => {
  const g = permProbe("bash")
  g.press("a")
  assert.deepEqual(g.calls, [true], "通用框 `a` ⇒ resolve(true)")
  assert.equal(g.r.agent.autoApprove, true, "`a` 仍翻 AUTO（既有语义零回归）")
  assert.equal(g.r.agent._pendingReminders.length, 1, "AUTO 提醒仍推")

  const b = permProbe("3 tools need permission: read, write", { batch: { tools: [], count: 3 } })
  b.press("a")
  assert.deepEqual(b.calls, ["approveAll"], "batch `a` ⇒ approveAll（批语义零改）")
  const bo = permProbe("3 tools need permission: read, write", { batch: { tools: [], count: 3 } })
  bo.press("o")
  assert.deepEqual(bo.calls, ["oneByOne"], "batch `o` ⇒ oneByOne")
  const bn = permProbe("3 tools need permission: read, write", { batch: { tools: [], count: 3 } })
  bn.press("n")
  assert.deepEqual(bn.calls, ["deny"], "batch `n` ⇒ deny")
  assert.equal(b.r.agent.autoApprove, false, "batch `a` 不翻会话级 AUTO（既有语义）")
})

// ─── #132 ② provider 原文余行 = log-only（表面零膨胀）──────────────────────

/** 真跑一轮失败面 + 读盘：返回 { lines, entry, line }（entry = 落盘的 err:provider 事件）。 */
async function runLogged(raw, t) {
  const logDir = mkdtempSync(join(tmpdir(), "tc-errprovider-"))
  t.after(() => { try { rmSync(logDir, { recursive: true, force: true }) } catch { /* ignore */ } })
  const r = rig()
  r.ctx.runAgent = async () => { throw new Error(raw) }
  process.env.THINCODER_LOG_DIR = logDir
  try {
    const p = runAgentTurn(r.ctx, "hello")
    await until(() => r.state.permission, 3000, () => JSON.stringify(r.lines))
    answer(r, "n")
    await p
  } finally {
    delete process.env.THINCODER_LOG_DIR
  }
  const file = join(logDir, readdirSync(logDir)[0])
  const line = readFileSync(file, "utf8").split("\n").find((l) => l.includes('"ev":"err:provider"'))
  return { lines: r.lines, line, entry: line ? JSON.parse(line) : null }
}

test("T-L1 `err:provider` 脱敏覆盖面：两行原文（两行各含 URL）⇒ `err`/`head` 同过管道 ∧ 整行不含原 URL", async (t) => {
  const raw = "Provider request failed: 502 from https://api.example.com/v1/chat/completions\nupstream MARKER detail from https://other.example.com/x"
  const { line, entry } = await runLogged(raw, t)
  assert.ok(line, "err:provider 事件已落盘（现盘先红：无该事件）")
  assert.ok(entry.err.includes("[endpoint]"), "`err` = 脱敏首行")
  assert.ok(entry.head.includes("MARKER"), "`head` = 余行合单行")
  assert.ok(entry.head.includes("[endpoint]"), "`head` 同过脱敏管道（第二行 URL ⇒ [endpoint]）")
  assert.ok(!line.includes("api.example.com") && !line.includes("other.example.com"), "整行不含任一原 URL（两行覆盖）")
  assert.ok(line.length < 512, `单行 <512（实读 ${line.length}）`)
})

test("T-L2 边界：单行原文 ⇒ `head` 字段缺省（null／undefined——勿传空串）∧ 行全长 <512", async (t) => {
  const raw = "Provider request failed: 502 from https://api.example.com/v1"
  const { line, entry } = await runLogged(raw, t)
  assert.ok(line, "err:provider 事件已落盘")
  assert.ok(!("head" in entry), "单行原文 ⇒ head 字段不在（空串守卫：传 \"\" 会落字段）")
  assert.ok(entry.err.includes("[endpoint]"), "首行仍脱敏")
  assert.ok(line.length < 512, `行全长 <512（实读 ${line.length}）`)
})

test("T-L3 表面零膨胀：多行原文 ⇒ `[error]` 1 + 诊断 2 = 3 行（逐行断言）", async (t) => {
  const raw = "Provider request failed: 502 from https://api.example.com/v1\nupstream detail line"
  const { lines } = await runLogged(raw, t)
  const at = lines.findIndex((l) => l.startsWith("[error] "))
  assert.ok(at >= 0, "[error] 行在位")
  const tail = lines.slice(at)
  assert.deepEqual(tail.slice(0, 3), [
    "[error] Provider request failed: 502 from [endpoint]",
    `→ Provider: ${PROVIDER.baseURL}`,
    `→ Model: ${PROVIDER.model}`,
  ], `失败面恰三行（逐行断言——余行不入 UI；实读 ${JSON.stringify(tail)})`)
  assert.ok(tail.length === 3 || tail[3].includes("[denied] retry"), "第 4 行仅为 retry 轨迹行（授权面既定）——日志行不增 UI 行")
})
