/**
 * 2026-09-29-parity-b1-vsc-core-loop.test.mjs — 批次本地单元件（parity-b1 · VSC+CLI 收口核 · 随批留存归档）。
 * 拆自 `2026-09-29-parity-b1-vsc-core.test.mjs`（#788 批内件挂载面归一——拆分计划 §2.11「先拆后改」；断言逐字迁移）。
 * 覆盖 = G4 循环关键臂（P4：空响应重试 ∕ 中断（核抛无 `.reason` 判据）∥ guard 推回 ∥ 蒸馏发射 + 核增补 B ∥ 域文本组合 + 缺省）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑 = 从仓库根 `thincoder/`：
 *   node --test docs/batches/2026-09-29-parity-b1-vsc-core-loop.test.mjs
 */
import test from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { registerHooks } from "node:module"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-core"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const HERE = fileURLToPath(import.meta.url)


const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)

// vscode 桩（进程内钩——主进程 VSC 模块装载面；子进程另有其桩，见 runLoopChild）
const VSCODE_STUB_SRC = `
const mk = () => new Proxy(function vscodeStub() {}, { get: (t, p) => (p === Symbol.toPrimitive || p === "then" ? undefined : mk()), apply: () => undefined, construct: () => mk() });
export const window = mk(); export const workspace = mk(); export const commands = mk(); export const env = mk(); export const languages = mk();
export const Uri = mk(); export const Range = mk(); export const Position = mk(); export const Selection = mk(); export const MarkdownString = mk();
export const ThemeColor = mk(); export const StatusBarAlignment = mk(); export const ProgressLocation = mk(); export const ConfigurationTarget = mk();
export const DiagnosticSeverity = mk(); export const DocumentSymbol = mk(); export const SymbolKind = mk(); export const RelativePattern = mk();
export const WorkspaceEdit = mk(); export const WebviewView = mk(); export const CancellationToken = mk(); export const Disposable = mk();
export const EventEmitter = class EventEmitter { constructor() { this.event = () => ({ dispose() {} }) } fire() {} dispose() {} };
export default { window, workspace, commands, env, languages, Uri };
`
const VSCODE_STUB_URL = "data:text/javascript," + encodeURIComponent(VSCODE_STUB_SRC)
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "vscode") return { url: VSCODE_STUB_URL, shortCircuit: true }
    return next(specifier, context)
  },
})

// ─── 模块装载（真件；跨包同一性按「各自解析上下文」+ realpath 双证——先例 = B2 批内件注②）──


const coreDispatch = await mod("thincoder-core/agent/dispatch.mjs")
const coreHelpers = await mod("thincoder-vscode/node_modules/@thincoder/core/agent/helpers.mjs")
const coreCompletion = await mod("thincoder-core/agent/completion.mjs")
const coreAgentMod = await mod("thincoder-core/agent.mjs")
const vscTurnDomains = await mod("thincoder-vscode/src/agent/turn-domains.mjs")


// ═════════════════════ G4 · 循环关键臂（P4 + 核增补 B ∕ E） ═════════════════════

const mkCoreAgent = (over = {}) => Object.assign(
  coreAgentMod.createAgent({
    provider: { name: "harness", model: "harness-model", apiKey: "k", baseURL: "http://127.0.0.1:1/v1" },
    tools: [], config: { agent: {}, traces: { enabled: false } }, cwd: ROOT, memory: null, history: [],
  }),
  over,
)
const enc = new TextEncoder()
const sseBody = (text) => ({
  ok: true, status: 200, headers: new Headers({ "content-type": "text/event-stream" }),
  body: new ReadableStream({ start(c) { c.enqueue(enc.encode(text)); c.close() } }),
  text: async () => "", json: async () => ({}),
})
const sseOpen = (chunks) => ({
  ok: true, status: 200, headers: new Headers({ "content-type": "text/event-stream" }),
  body: new ReadableStream({ start(c) { for (const ch of chunks) c.enqueue(enc.encode(ch)) } }),
  text: async () => "", json: async () => ({}),
})

test("G4a 空响应重试：首轮空 content ⇒ 注入重试提醒 ⇒ 次轮即答（2 fetch · _emptyRetries=1）", async () => {
  const realFetch = globalThis.fetch
  let n = 0
  globalThis.fetch = async () => {
    n += 1
    if (n === 1) return sseBody(`data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: "stop" }] })}\n\ndata: [DONE]\n\n`)
    return sseBody(`data: ${JSON.stringify({ choices: [{ delta: { content: "OK-AFTER-RETRY" } }] })}\n\ndata: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: "stop" }], usage: { prompt_tokens: 3, completion_tokens: 1 } })}\n\ndata: [DONE]\n\n`)
  }
  try {
    const agent = mkCoreAgent()
    const content = await coreAgentMod.runAgent(agent, "hi", {}, {})
    assert.equal(content, "OK-AFTER-RETRY", "次轮内容返回")
    assert.equal(n, 2, "恰两次模型调用（空响应重试一次）")
    assert.equal(agent._emptyRetries, 1, "空响应计数 +1")
    assert.ok(agent.history.some((m) => String(m.content).includes("your last response was empty")), "重试提醒入历史")
  } finally {
    globalThis.fetch = realFetch
  }
})

test("G4b 中断：AbortError 抛出自核 —— 无 `.reason`（回落 signal.reason 判据）+ 中断消息入历史", async () => {
  const realFetch = globalThis.fetch
  globalThis.fetch = async () => sseOpen([`data: ${JSON.stringify({ choices: [{ delta: { content: "partial" } }] })}\n\n`])
  try {
    const agent = mkCoreAgent()
    const ctl = new AbortController()
    setTimeout(() => ctl.abort(Object.assign(new Error("x"), { interrupt: true, message: "INT-MSG" })), 60)
    let thrown = null
    try { await coreAgentMod.runAgent(agent, "hi", {}, { signal: ctl.signal }) } catch (e) { thrown = e }
    assert.ok(thrown, "中断 ⇒ 抛出")
    assert.equal(thrown.name, "AbortError", "name = AbortError")
    assert.equal(thrown.reason, undefined, "核抛出物不设 .reason（消费面回落 signal.reason 的判据）")
    assert.deepEqual(thrown.abortInfo, { trigger: "user", layer: "agent", detail: "interrupted-response" }, "abortInfo 标注（interrupted-response 站点）")
    assert.equal(thrown.message, "User interrupted", "message 逐字")
    assert.equal(ctl.signal.reason.message, "INT-MSG", "signal.reason = 中断载荷（回落源）")
    assert.ok(agent.history.some((m) => m.content === "[User interrupt: INT-MSG]"), "中断消息入历史")
  } finally {
    globalThis.fetch = realFetch
  }
})

test("G4c guard 推回：空响应二上限后抛（MAX_EMPTY_RETRIES=2）· 有内容 ⇒ done + pushReal", () => {
  const mkA = () => ({ history: [], config: { agent: {} }, tasks: [], provider: { model: "m" } })
  {
    const agent = mkA()
    const r1 = coreCompletion.handleCompletion(agent, { content: "", toolCalls: [] }, 0, 0, 0, false, 0, {})
    assert.equal(r1.action, "continue", "第 1 次空 ⇒ continue")
    assert.equal(agent._emptyRetries, 1)
    const r2 = coreCompletion.handleCompletion(agent, { content: "", toolCalls: [] }, 0, 0, 0, false, 0, {})
    assert.equal(r2.action, "continue", "第 2 次空 ⇒ continue")
    assert.throws(() => coreCompletion.handleCompletion(agent, { content: "", toolCalls: [] }, 0, 0, 0, false, 0, {}), /empty response/, "第 3 次空 ⇒ 抛（有界）")
  }
  {
    const agent = mkA()
    const turns = []
    const r = coreCompletion.handleCompletion(agent, { content: "DONE-TEXT", toolCalls: [] }, 0, 0, 0, false, 0, { onTurnEnd: (a, t) => turns.push(t) })
    assert.equal(r.action, "done")
    assert.equal(r.content, "DONE-TEXT")
    assert.equal(agent.history.at(-1).content, "DONE-TEXT", "内容入历史（pushReal 面）")
    assert.deepEqual(turns, [], "干净完成不触 onTurnEnd")
  }
  {
    const agent = Object.assign(mkA(), { _mutatedThisRun: true, tasks: [] })
    agent.config.agent.verifyGuard = true
    const r = coreCompletion.handleCompletion(agent, { content: "C1", toolCalls: [] }, 0, 0, 0, false, 0, {})
    assert.equal(r.action, "continue", "verify guard 推回（改动未验证）")
    assert.ok(agent.history.at(-1).content.includes("you modified files in this run"), "推回提醒逐字锚")
  }
  // guard 快照 ∕ 回填单点（核 helpers —— D-S6 载体）
  const a2 = { _mutatedThisRun: true, _touchedFiles: ["x"], _advisorRound: 2 }
  const snap = coreHelpers.snapshotGuard(a2)
  assert.deepEqual(Object.keys(snap).sort(), [...coreHelpers.INHERITED_GUARD_KEYS].sort(), "快照 7 键")
  a2._mutatedThisRun = false; a2._advisorRound = 0
  coreHelpers.restoreGuard(a2, snap)
  assert.equal(a2._mutatedThisRun, true, "回填恢复（存在键）")
  assert.equal(a2._advisorRound, 2, "回填恢复（数值键）")
})

test("G4d 核增补 B：蒸馏专用 signal（显式 = distillSignal ∕ 缺省 = 运行 signal——零默认变更）", async () => {
  const realFetch = globalThis.fetch
  const toolCallSSE = (id, path) =>
    `data: ${JSON.stringify({ choices: [{ delta: { tool_calls: [{ index: 0, id, type: "function", function: { name: "ls", arguments: JSON.stringify({ path }) } }] } }] })}\n\n` +
    `data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: "tool_calls" }] })}\n\ndata: [DONE]\n\n`
  const contentSSE = (content) =>
    `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n` +
    `data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: "stop" }], usage: { prompt_tokens: 10, completion_tokens: 2, total_tokens: 12 } })}\n\ndata: [DONE]\n\n`
  const stubRun = async ({ distillSignal }) => {
    const calls = []
    let n = 0
    globalThis.fetch = async (url, init) => {
      n += 1
      calls.push({ n, signal: init?.signal })
      if (n <= 3) return sseBody(toolCallSSE(`call_${n}`, ["thincoder-core", "thincoder-vscode", "thincoder-cli"][n - 1]))
      return sseBody(contentSSE("SUMMARY-HARNESS"))
    }
    const runCtl = new AbortController()
    const agent = mkCoreAgent()
    const content = await coreAgentMod.runAgent(agent, "explore the repo", {}, { signal: runCtl.signal, ...(distillSignal !== undefined ? { distillSignal } : {}) })
    const pending = agent._pendingDistill
    if (pending) await pending
    return { calls, content, agent, runSignal: runCtl.signal }
  }
  try {
    const distillCtl = new AbortController()
    const withSignal = await stubRun({ distillSignal: distillCtl.signal })
    assert.equal(withSignal.calls.length, 5, "3 工具轮 + 1 收尾 + 1 蒸馏轮")
    assert.equal(withSignal.calls[4].signal, distillCtl.signal, "蒸馏轮 fetch signal === distillSignal（运行 signal 分离）")
    assert.equal(withSignal.content, "SUMMARY-HARNESS")
    assert.ok(withSignal.agent.history.some((m) => typeof m.content === "string" && m.content.startsWith("[Exploration summary]")), "蒸馏摘要入历史（发射面）")

    const noSignal = await stubRun({})
    assert.equal(noSignal.calls.length, 5)
    assert.equal(noSignal.calls[4].signal, noSignal.runSignal, "缺省 ⇒ 回落运行 signal（零默认变更）")
  } finally {
    globalThis.fetch = realFetch
  }
})

test("G4e 域文本组合：核缺省基座 ∕ opts.turnDomainText 逐字进历史 + VSC 组合点（overlay 收尾括号内）", async () => {
  const realFetch = globalThis.fetch
  globalThis.fetch = async () => ({ ok: false, status: 400, text: async () => "harness", headers: new Headers() })
  try {
    const a1 = mkCoreAgent()
    try { await coreAgentMod.runAgent(a1, "x", {}, { autoTurn: true, turnDomainText: "CUSTOM-DOMAIN-MARKER" }) } catch { /* provider 桩失败——只看推送面 */ }
    assert.ok(a1.history.some((m) => m.content === "CUSTOM-DOMAIN-MARKER"), "turnDomainText 逐字进历史（autoTurn 轮）")
    const a2 = mkCoreAgent()
    try { await coreAgentMod.runAgent(a2, "x", {}, { autoTurn: true }) } catch { /* 同上 */ }
    assert.ok(a2.history.some((m) => m.content === coreHelpers.AUTO_TURN_DIGEST_DOMAIN), "缺省 = 核基座逐字（AUTO_TURN_DIGEST_DOMAIN）")
    // VSC 组合点：overlay 落基座正文之后、闭合 `]` 之前（fail-closed 恒在场）
    const composed = vscTurnDomains.composeTurnDomain(false, false, false)
    assert.ok(composed.endsWith(`${vscTurnDomains.VSC_TURN_OVERLAY}]`), "overlay 收尾括号内拼接")
    assert.notEqual(composed, coreHelpers.AUTO_TURN_DIGEST_DOMAIN, "组合 ≠ 裸基座")
    assert.ok(composed.includes(coreHelpers.AUTO_TURN_DIGEST_DOMAIN.slice(0, -1)), "基座正文逐字在组合串内（端侧零自持副本）")
    assert.equal(vscTurnDomains.composeTurnDomain(true, true, true), vscTurnDomains.composeTurnDomain(true, false, false), "唤醒轮基座与模式无关（判据序）")
  } finally {
    globalThis.fetch = realFetch
  }
})

test("G4f 核增补 E1 ∕ E2：动作谓词采纳（钩子优先）· D5 冻结面 `file_ops` 外门 + 批次档腿判据集不变", async () => {
  const CWD = ROOT
  const makeAgent = (over = {}) => ({
    cwd: CWD, planMode: false, autoApprove: false, _role: null, _engDesignReviewed: false,
    _engTaskAuthorized: false, _touchedFiles: [], _mutationSeq: 0, _mutLog: [],
    config: { agent: { engineering: false } },
    ...over,
  })
  const tool = (name, over = {}) => ({ name, readonly: false, parallel: false, execute: async () => `ok:${name}`, ...over })
  const call = (name, args) => ({ id: `id-${name}`, name, arguments: JSON.stringify(args ?? {}) })
  const run = (agent, name, t, args, opts = {}) =>
    coreDispatch.executeToolCalls(agent, new Map([[name, t]]), [call(name, args)], opts.callbacks ?? {}, opts.depth ?? 0, opts.signal)
  const denied = (r) => (r?.[0]?.denied ? r[0].reason : null)

  const gitTool = tool("git", { isReadonlyAction: (a) => a?.action === "status" || a?.action === "log" })
  assert.ok((await run(makeAgent({ planMode: true }), "git", gitTool, { action: "status" }))[0].ok === true, "E1① planMode：钩子判只读 ⇒ 放行")
  assert.equal(denied(await run(makeAgent({ planMode: true }), "git", gitTool, { action: "commit" })), "plan mode", "E1② 钩子判非只读 ⇒ 拒")
  assert.ok((await run(makeAgent(), "git", gitTool, { action: "log" }, { callbacks: {} }))[0].ok === true, "E1③ 钩子判只读 ⇒ 免审批直行")
  assert.ok((await run(makeAgent({ planMode: true }), "subagent", tool("subagent"), { action: "status" }))[0].ok === true, "E1④ 无钩子 ⇒ 核名面谓词回落（status 只读）")
  assert.equal(denied(await run(makeAgent({ planMode: true }), "subagent", tool("subagent", { isReadonlyAction: () => false }), { action: "status" })), "plan mode", "E1⑤ 钩子在场即权威（false ⇒ 不回落）")
  assert.equal(denied(await run(makeAgent(), "bash", tool("bash"), { command: "echo hi" }, { callbacks: {} })), "no permission handler", "E1⑥ 核内工具零钩子回归（无 handler ⇒ 仍拒）")

  const FROZEN = resolve(CWD, "docs/batches/2026-09-29-other.md")
  const reviewAgent = () => makeAgent({ _asyncAdvisors: new Map([["7", { id: "7", reviewType: "design", status: "running", run: { batchDoc: FROZEN } }]]) })
  assert.equal(denied(await run(reviewAgent(), "file_ops", tool("file_ops"), { action: "move", source: "a.txt", dest: "docs/batches/2026-09-29-other.md" })), "d5 freeze window", "E2① file_ops move dest 命中 ⇒ D5 拒")
  assert.equal(denied(await run(reviewAgent(), "file_ops", tool("file_ops"), { action: "copy", dest: "docs/batches/2026-09-29-other.md" })), "d5 freeze window", "E2② file_ops copy dest 命中 ⇒ D5 拒")
  assert.ok((await run(reviewAgent(), "file_ops", tool("file_ops"), { action: "move", source: "a.txt", dest: "elsewhere/b.txt" }, { callbacks: { onPermissionRequest: async () => true } }))[0].ok === true, "E2③ 未命中 ⇒ 放行（非全拒）")
  assert.equal(denied(await run(reviewAgent(), "write", tool("write"), { path: "docs/batches/2026-09-29-other.md" })), "d5 freeze window", "E2④ FILE_MUTATORS 冻结面回归")
  const own = makeAgent({ _batchDoc: resolve(CWD, "docs/batches/2026-09-29-mine.md") })
  assert.equal(denied(await run(own, "write", tool("write"), { path: "docs/batches/2026-09-29-other.md" }, { depth: 1 })), "cross-batch record write", "E2⑤ 批次档写门回归（判据集不变）")
  assert.notEqual(denied(await run(own, "file_ops", tool("file_ops"), { action: "move", source: "a.txt", dest: "docs/batches/2026-09-29-other.md" }, { depth: 1 })), "cross-batch record write", "E2⑥ file_ops 不入批次档写门（判据集 = FILE_MUTATORS）")
})
