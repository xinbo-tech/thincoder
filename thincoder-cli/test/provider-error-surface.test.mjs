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
import { runAgentTurn } from "../src/tui/agent-turn.mjs"
import { handlePermissionMode } from "../src/tui/key-modes.mjs"

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
