/**
 * suspension.test.mjs — §17 挂起回合（AGENT-LOOP.md §17 D-S1..S9，2026-09-02 V2 完整版 +
 * 推进型）VS Code 端测试。用例映射见 AGENT-LOOP.md §17（T-S1..S17 完整表，§15.4 式）：
 *   T-S1 回合尾不等 / T-S2 注入不丢 / T-S3 挂起态输入可用 / T-S4 叠加并发 /
 *   T-S5 中止清池回归 / T-S6 挂起自然退出 / T-S7 手动档消化 / T-S8 禁 spawn 分档 /
 *   T-S9 排队续发 / T-S10 权限拒绝不悬挂 / T-S11 合并消化 / T-S12 AUTO 写一致性 /
 *   T-S13 §15 全回归（由 test/subagent.test.mjs 既有 27 用例覆盖——本文件不重复）/
 *   T-S14 中间态渲染 / T-S15 双模式输入 / T-S16 压缩兜底回归 / T-S17 settle-during-digest /
 *   T-S3b 真实路径唤醒（2026-09-02 偏差修复回归——真实 ChatPanel._chat 走通 _suspWake 单槽，
 *   见 ARCHITECTURE.md 变更段）/
 *   T-S18 释放窗口全路径 / T-S18a 会话入口 pendingInput 预装载 / T-S19 aborted settle 出池清理 /
 *   T-S20 会话中止统一 abort（2026-09-02 偏差修复 #2/#3 回归——ARCHITECTURE.md 变更段）/
 *   T-S21 中止排队不丢（2026-09-02 code review round2 #2-VS Code 回归——中止时 pendingInput
 *   残余以普通回合执行、不静默丢；变更段由架构师统一回写 ARCHITECTURE.md）。
 *
 * 分层（与 CLI test/suspension.test.mjs 同构，按 VS Code 架构落点）：
 *   agent 级  — 真实 runAgent + mock SSE LLM + 真实 async 子代理（subagent.test.mjs 手法；
 *               池/pending/_suspended 挂共享 depth-0 history 数组）
 *   驱动级    — suspensionSession（src/extension/suspension.mjs）+ mock panel/runTurn（T-S3b 用
 *               真实 ChatPanel + mock runTurn——覆盖 _chat 真实唤醒接线）——
 *               D-S9 状态机行表（settle→pending→合并消化轮；pendingInput 优先；池空退出）
 *   webview 级 — happy-dom + 真实 index.html + chat.js 消息循环——中间态渲染与输入态断言
 */
import { test, describe, it, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { createServer } from "node:http"
import { setupWebview } from "./helpers/webview-env.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))

// ─── 共享 harness（subagent.test.mjs / agent.test.mjs 同款手法）────────────

const LONG_REPORT = (tag) => `${tag} report ` + "x".repeat(200)

function textFrames(content) {
  return (
    `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content } }] })}\n\n` +
    `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
    "data: [DONE]\n\n"
  )
}

function toolCallFrames(name, args) {
  return (
    `data: ${JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: [{ index: 0, id: "call_1", type: "function", function: { name, arguments: JSON.stringify(args) } }] } }] })}\n\n` +
    `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }] })}\n\n` +
    "data: [DONE]\n\n"
  )
}

/** 内容路由 SSE server：when(body, calls) 首中即答；无命中 → fallback 文本。 */
async function routeServer(routes) {
  const calls = []
  const server = createServer((req, res) => {
    let bodyText = ""
    req.on("data", (c) => (bodyText += c))
    req.on("end", () => {
      calls.push(bodyText)
      const route = routes.find((r) => r.when(bodyText, calls))
      const frames = route?.frames ?? textFrames("fallback reply")
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      if (route?.delayMs) setTimeout(() => res.end(frames), route.delayMs)
      else res.end(frames)
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  return { server, port: server.address().port, calls }
}

const waitFor = async (fn, timeoutMs = 4000) => {
  const t0 = Date.now()
  while (!fn()) {
    if (Date.now() - t0 > timeoutMs) throw new Error("waitFor timeout")
    await new Promise((r) => setTimeout(r, 10))
  }
}

/** 工具级 fake parent（subagent.test.mjs asyncParent 同款 + 共享 history 载体）。 */
function fakeParent(port, extra = {}) {
  return {
    _provider: { name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" },
    config: {
      providersList: [{ name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" }],
      agent: { subagentTurns: 5, engineering: false },
    },
    _subIdCounter: 0,
    _touchedFiles: [],
    _asyncSubagents: new Map(),
    _asyncCheckN: 0,
    _inAutoTurn: false,
    history: [],
    ...extra,
  }
}

// ─── 驱动级 harness（suspensionSession + mock panel/runTurn）───────────────

function driverPanel() {
  const posts = []
  const panel = {
    _panel: { webview: { postMessage: (m) => posts.push(m) } },
    _abortController: new AbortController(),
    _susp: null,
    _suspWake: null,
    _saveLines: () => {},
    _refreshStatus: () => {},
  }
  return { panel, posts }
}

/** 一个 running 态 async entry（挂到共享 map——模拟真实池项）。 */
function runningEntry(history, id) {
  history._asyncSubagents ??= new Map()
  const entry = { id, role: "coder", status: "running", report: null, error: null, done: false }
  history._asyncSubagents.set(id, entry)
  return entry
}

/** settle 一个 entry（settleAsyncEntry 挂起分流镜像——driver 测试模拟 settle 回调：
 *  _suspended 期间移交 pending + 从池移除 + 唤醒 parked driver）。 */
function settleToPending(panel, history, entry, report) {
  entry.report = report
  entry.status = "done"
  entry.done = true
  if (history._suspended) {
    const pend = (history._pendingAsyncResults ??= [])
    if (!pend.includes(entry)) pend.push(entry)
    history._asyncSubagents?.delete(entry.id)
  }
  panel._suspWake?.()
}

/** runAgent run-start 的 pending 消费镜像（真实消费点在 agent.mjs 首行注入）。 */
function consumePending(history, consumed) {
  const pend = history._pendingAsyncResults
  if (pend?.length) {
    consumed.n += pend.length
    history._pendingAsyncResults = []
  }
}

function driverCtx(cwd) {
  const history = []
  const fullHistory = []
  const calls = []
  const consumed = { n: 0 }
  const { panel, posts } = driverPanel()
  const entry = {
    turnSlot: 1,
    distillSlot: 1,
    lines: { history, fullHistory },
    engState: {},
    cwd,
    // 默认 runTurn：记录 + 消费 pending（用户回合与 digest 的 run-start 都消费）。
    // 挂起标志由 driver 翻转（用户回合期 false、digest 期 true）——记录进 calls。
    runTurn: async ({ text = "", autoTurn = false } = {}) => {
      calls.push({ text, autoTurn, suspended: history._suspended })
      consumePending(history, consumed)
    },
  }
  return { history, fullHistory, calls, consumed, panel, posts, entry }
}

// ═══════════════════════════════════════════════════════════════════════════
// agent 级：T-S1 / T-S2 / T-S2b / T-S4（真实 async 子代理 + runAgent）
// ═══════════════════════════════════════════════════════════════════════════

test("T-S1 回合尾不阻塞 + T-S2 注入不丢（§17 D-S1/D-S3 ①：收已完成直注入 + 未完成留池）", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "tc-susp-"))
  let parentCalls = 0
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      const isChild = body.includes('"content":"后台慢活"') // 子代理的 user content（父回合无此形态）
      if (isChild) {
        // 子代理 600ms 后完成——父回合尾不得等它（T-S1）
        setTimeout(() => { res.writeHead(200, { "Content-Type": "text/event-stream" }); res.end(textFrames(LONG_REPORT("慢完成"))) }, 600)
        return
      }
      parentCalls++
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      if (parentCalls === 1) {
        // 父回合 1：spawn async 子代理
        res.end(toolCallFrames("subagent", { task: "后台慢活", role: "coder", async: true }))
      } else {
        // 父回合 2：立即收尾
        res.end(textFrames("主会话快速收尾"))
      }
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  try {
    const { runAgent } = await import("../src/agent.mjs")
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" }
    const history = []
    const fullHistory = []
    const t0 = Date.now()
    const out1 = await runAgent(provider, cwd, "派活", {}, undefined, true, { history, fullHistory })
    const elapsed = Date.now() - t0
    assert.equal(out1, "主会话快速收尾")
    assert.ok(elapsed < 500, `T-S1: 回合尾不等子代理（elapsed=${elapsed}ms < 600ms 子代理）`)
    assert.ok(history._asyncSubagents && history._asyncSubagents.size === 1, "未完成项保留在池（不清空不等待）")
    const entry = [...history._asyncSubagents.values()][0]
    assert.equal(entry.done, false, "子代理仍在 running——回合不等待")
    assert.ok(!history.some((m) => String(m.content ?? "").includes("async subagent #")), "未注入（子代理未完成）")
    // 子代理完成（非挂起 settle——留在池，由下个回合尾 collectSettled 直注入 ①）
    await entry.settled
    assert.equal(entry.done, true)
    // 回合 2：收尾注入（零丢失）
    await runAgent(provider, cwd, "继续", {}, undefined, true, { history, fullHistory })
    const injected = history.find((m) => String(m.content ?? "").includes("async subagent #1 (coder) finished"))
    assert.ok(injected, "T-S2: 已完成项注入（下回合可见）")
    assert.ok(String(injected.content).includes("慢完成 report"), "报告文本注入")
    assert.equal(history._asyncSubagents, undefined, "注入后从池移除（depth-0 载体释放）")
    // 人读线同步（pushReal 双线）
    assert.equal(fullHistory.filter((m) => String(m.content ?? "").includes("async subagent #1")).length, 1)
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-S2b 挂起期 settle → pending → 下回合 prepareRun 前注入（D-S3 ② 单注入点）", async () => {
  const { server, port } = await routeServer([
    { when: (b) => b.includes('"content":"后台活"'), frames: textFrames(LONG_REPORT("挂起完成")), delayMs: 250 },
    { when: () => true, frames: textFrames("回合2回复") },
  ])
  const cwd = mkdtempSync(join(tmpdir(), "tc-susp-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const { runAgent } = await import("../src/agent.mjs")
    const history = []
    const map = new Map()
    history._asyncSubagents = map
    const parent = fakeParent(port, { _asyncSubagents: map, history })
    const spawn = JSON.parse(String(await subagentTool.execute({ task: "后台活", role: "coder", async: true }, { agent: parent, cwd, callbacks: {}, depth: 0 })))
    const entry = map.get(spawn.id)
    assert.equal(entry.status, "running")
    // 模拟挂起会话开始：_suspended = true → settle 回调走挂起分流（延迟冻结 + 入 pending）
    history._suspended = true
    await entry.settled
    assert.equal(history._asyncSubagents.size, 0, "settle 回调把条目移交 pending（从池移除）")
    assert.equal(history._pendingAsyncResults.length, 1, "pending 记账")
    assert.equal(history._pendingAsyncResults[0], entry)
    history._suspended = false
    // 下一回合（用户回合）runAgent 首行注入 pending → prepareRun 前（单注入点）
    const fullHistory = []
    const out2 = await runAgent(parent._provider, cwd, "下一轮", {}, undefined, true, { history, fullHistory })
    assert.equal(out2, "回合2回复")
    assert.equal(history._pendingAsyncResults.length, 0, "注入即消费（pending 清空）")
    const injected = history.find((m) => String(m.content ?? "").includes("async subagent #1 (coder) finished"))
    assert.ok(injected, "注入不丢")
    const inputIdx = history.findIndex((m) => m.content === "下一轮")
    assert.ok(history.indexOf(injected) < inputIdx, "注入先于用户输入（prepareRun 前落定）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-S4 叠加并发：跨批次 async 池累积 + 完成未消费项保留（上限 4 全局由 subagent.test.mjs T6/T10/T11 覆盖）", async () => {
  const { server, port } = await routeServer([
    { when: (b) => b.includes('"content":"活A"'), frames: textFrames(LONG_REPORT("A")) },
    { when: (b) => b.includes('"content":"活B"'), frames: textFrames(LONG_REPORT("B")) },
    { when: () => true, frames: textFrames(LONG_REPORT("fallback")) },
  ])
  const cwd = mkdtempSync(join(tmpdir(), "tc-susp-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = fakeParent(port)
    const ctx = { agent: parent, cwd, callbacks: {}, depth: 0 }
    const a = JSON.parse(String(await subagentTool.execute({ task: "活A", role: "coder", async: true }, ctx)))
    const b = JSON.parse(String(await subagentTool.execute({ task: "活B", role: "coder", async: true }, ctx)))
    assert.equal(a.status, "running")
    assert.equal(b.status, "running")
    assert.ok(a.id !== b.id, "id 独立")
    assert.equal(parent._asyncSubagents.size, 2, "同批叠加")
    // 完成但未消费（非挂起）→ 保留在池（下回合收尾/check 才消费）——跨轮累积语义
    await Promise.all([...parent._asyncSubagents.values()].map((e) => e.settled))
    assert.equal(parent._asyncSubagents.size, 2, "settle 后未消费项保留池（F6 池累积）")
    assert.ok([...parent._asyncSubagents.values()].every((e) => e.done && e.report))
    parent._asyncSubagents.clear()
    parent._asyncQueue = []
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

// ═══════════════════════════════════════════════════════════════════════════
// agent 级：auto-turn（T-S7 / T-S8 / T-S10 / T-S12 / T-S16）
// ═══════════════════════════════════════════════════════════════════════════

test("T-S7 手动档消化：autoTurn 注入 pending + 消化动作域模板，模型总结进会话", async () => {
  const { server, port } = await routeServer([{ when: () => true, frames: textFrames("digested: 要点A、要点B") }])
  const cwd = mkdtempSync(join(tmpdir(), "tc-susp-"))
  try {
    const { runAgent } = await import("../src/agent.mjs")
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" }
    const history = []
    const fullHistory = []
    // 挂起期 settle 记账形态：pending 已就绪（settle 回调已移交）
    history._pendingAsyncResults = [{ id: 1, role: "coder", report: LONG_REPORT("消化物") }]
    const out = await runAgent(provider, cwd, "", {}, undefined, false, { history, fullHistory, autoTurn: true })
    assert.equal(out, "digested: 要点A、要点B")
    const injected = history.find((m) => String(m.content ?? "").includes("async subagent #1 (coder) finished"))
    assert.ok(injected, "pending 在 auto-turn 开跑前注入")
    assert.equal(history._pendingAsyncResults.length, 0, "注入即消费")
    const domain = history.find((m) => String(m.content ?? "").includes("auto-turn — background async subagents finished"))
    assert.ok(domain, "手动档（无 AUTO）注入消化动作域模板（D-S6 organize-only）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-S8 禁 spawn 分档：手动档 async+同步均机械拒绝 / AUTO 档放行（推进型）", async () => {
  const { server, port } = await routeServer([{ when: () => true, frames: textFrames(LONG_REPORT("AUTO 子代理")) }])
  const cwd = mkdtempSync(join(tmpdir(), "tc-susp-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = fakeParent(port)
    // 手动档（_inAutoTurn && !autoApprove）：async + 同步都拒绝，且不触网
    parent._inAutoTurn = true
    const manualCtx = { agent: parent, cwd, callbacks: {}, depth: 0, getAuto: () => false }
    const refAsync = JSON.parse(String(await subagentTool.execute({ task: "x", role: "coder", async: true }, manualCtx)))
    assert.equal(refAsync.status, "error")
    assert.equal(refAsync.error, "cannot spawn subagents from a manual auto-turn — wait for user input")
    const refSync = JSON.parse(String(await subagentTool.execute({ task: "x", role: "coder" }, manualCtx)))
    assert.equal(refSync.status, "error", "同步 spawn 同拒")
    assert.equal(parent._asyncSubagents.size, 0, "拒绝不登记")
    // AUTO 档：放行——async spawn 正常启动（推进链成立）
    const autoCtx = { agent: parent, cwd, callbacks: {}, depth: 0, getAuto: () => true }
    const ok = JSON.parse(String(await subagentTool.execute({ task: "AUTO 活", role: "coder", async: true }, autoCtx)))
    assert.equal(ok.status, "running", "AUTO 档放行 async")
    const entry = parent._asyncSubagents.get(ok.id)
    await entry.settled
    assert.equal(entry.done, true)
    assert.ok(String(entry.report).includes("AUTO 子代理 report"), "子代理正常跑完")
    parent._inAutoTurn = false
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-S10 权限拒绝不悬挂：手动档 digest 撞权限门（D-S7 deny stub 装配形态）→ 拒绝 + 不悬挂", async () => {
  const { server, port } = await routeServer([
    { when: (_b, calls) => calls.length === 1, frames: toolCallFrames("write", { path: "x.txt", content: "auto" }) },
    { when: () => true, frames: textFrames("digest 收尾") },
  ])
  const cwd = mkdtempSync(join(tmpdir(), "tc-susp-"))
  try {
    const { runAgent } = await import("../src/agent.mjs")
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" }
    const history = []
    const fullHistory = []
    history._pendingAsyncResults = [{ id: 1, role: "coder", report: "r" }]
    // 手动档装配契约（D-S7，panel-chat 同款 deny stub）：不弹面板、denied 不悬挂
    const callbacks = {
      onPermissionRequired: async () => false,
      onBatchPermissionRequest: async () => "deny",
      onQuestion: async () => null,
    }
    const out = await runAgent(provider, cwd, "", callbacks, undefined, false, { history, fullHistory, autoTurn: true })
    assert.equal(out, "digest 收尾", "拒绝不悬挂——回合正常完成")
    const denial = history.find((m) => String(m.content ?? "").includes("Denied by user"))
    assert.ok(denial, "write 被权限 stub 拒绝（结果入历史，无面板）")
    assert.ok(!existsSync(join(cwd, "x.txt")), "文件未被写")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-S12 AUTO 写一致性：AUTO 档 auto-turn = 普通回合全语义（写自动执行，推进型）", async () => {
  const { server, port } = await routeServer([
    { when: (_b, calls) => calls.length === 1, frames: toolCallFrames("write", { path: "x.txt", content: "auto-written" }) },
    { when: () => true, frames: textFrames("AUTO 收尾") },
  ])
  const cwd = mkdtempSync(join(tmpdir(), "tc-susp-"))
  try {
    const { runAgent } = await import("../src/agent.mjs")
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" }
    const history = []
    const fullHistory = []
    history._pendingAsyncResults = [{ id: 1, role: "coder", report: "r" }]
    const out = await runAgent(provider, cwd, "", {}, undefined, true, { history, fullHistory, autoTurn: true })
    assert.equal(out, "AUTO 收尾")
    assert.equal(readFileSync(join(cwd, "x.txt"), "utf8"), "auto-written", "AUTO 档写调用自动执行（用户授权无人值守）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-S16 压缩兜底回归（N4）：挂起期多注入后 auto-turn 开跑压缩触发", async () => {
  const { server, port } = await routeServer([
    { when: (_b, calls) => calls.length === 1, frames: textFrames("compressed summary") }, // 压缩摘要调用（turn 0 先于主 chat）
    { when: () => true, frames: textFrames("digest after compress") },
  ])
  const cwd = mkdtempSync(join(tmpdir(), "tc-susp-"))
  const cfgDir = mkdtempSync(join(tmpdir(), "tc-susp-cfg-"))
  const cfgPath = join(cfgDir, "config.json")
  const { _setConfigPathForTest } = await import("../src/config-io.mjs")
  _setConfigPathForTest(cfgPath)
  writeFileSync(cfgPath, JSON.stringify({ agent: { compactThreshold: 5000 } }))
  try {
    const { runAgent } = await import("../src/agent.mjs")
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" }
    const history = []
    const fullHistory = []
    // 多条挂起注入累积（大报告）撑爆阈值——估计路径含 system prompt + tools 开销
    history._pendingAsyncResults = [1, 2, 3].map((i) => ({ id: i, role: "coder", report: LONG_REPORT(String(i)).repeat(30) }))
    let compressed = false
    const out = await runAgent(provider, cwd, "", { onCompress: () => { compressed = true } }, undefined, false, { history, fullHistory, autoTurn: true })
    assert.equal(compressed, true, "下轮开跑压缩兜底触发（轮内安全点）")
    assert.equal(out, "digest after compress", "压缩后消化正常继续")
    assert.ok(history.some((m) => String(m.content ?? "").includes("[Context was automatically compacted")), "压缩笔记入历史")
  } finally {
    _setConfigPathForTest(null)
    rmSync(cfgDir, { recursive: true, force: true })
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

// ═══════════════════════════════════════════════════════════════════════════
// 驱动级：挂起会话状态机（T-S3 / T-S3b / T-S5 / T-S6 / T-S9 / T-S11 / T-S17）
// ═══════════════════════════════════════════════════════════════════════════

test("T-S6 挂起自然退出：settle → digest 消化完 → 池空 → 补发冻结 → idle", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "tc-susp-"))
  const D = driverCtx(cwd)
  const A = runningEntry(D.history, 1)
  try {
    const { suspensionSession } = await import("../src/extension/suspension.mjs")
    const sessionP = suspensionSession(D.panel, D.entry)
    await waitFor(() => D.panel._suspWake) // 已进入挂起 wait（等 settle/唤醒）
    settleToPending(D.panel, D.history, A, LONG_REPORT("A 结果"))
    await sessionP
    assert.deepEqual(D.calls.map((c) => ({ text: c.text, autoTurn: c.autoTurn })), [{ text: "", autoTurn: true }], "一个消化轮（无用户输入）")
    assert.equal(D.consumed.n, 1, "pending 被消化消费")
    assert.equal(D.history._suspended, false, "退出后 _suspended 清除")
    assert.equal(D.panel._susp, null, "会话句柄释放")
    assert.equal(D.panel._suspWake, null)
    assert.equal(D.history._asyncSubagents?.size ?? 0, 0, "池清空")
    assert.ok(!D.history.some((m) => String(m.content ?? "").includes("async subagent #")), "无残余注入（消化已消费，③ 兜底未触发）")
    const startPost = D.posts.find((p) => p.type === "suspension" && p.active === true)
    assert.ok(startPost, "挂起激活通知")
    const endPost = D.posts.find((p) => p.type === "suspension" && p.active === false)
    assert.ok(endPost && endPost.freeze === true, "退出补发冻结")
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-S3 挂起态输入可用：池非空时用户消息 → 普通新回合（不打断后台）；settle → 消化 → 自然退", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "tc-susp-"))
  const D = driverCtx(cwd)
  const A = runningEntry(D.history, 1)
  try {
    const { suspensionSession } = await import("../src/extension/suspension.mjs")
    const sessionP = suspensionSession(D.panel, D.entry)
    await waitFor(() => D.panel._suspWake)
    // 挂起等待期用户提交（chat-panel._chat 挂起分流：入队 + 唤醒）
    D.panel._susp.pendingInput.push({ text: "挂起中插话", modelOverride: null, reasoning: null, providerName: null, images: null })
    D.panel._suspWake?.()
    await waitFor(() => D.calls.length >= 1)
    assert.equal(D.calls[0].text, "挂起中插话", "挂起中输入 → 普通新回合立即开跑")
    assert.equal(D.calls[0].autoTurn, false)
    assert.equal(D.calls[0].suspended, false, "用户回合执行期 _suspended=false（普通回合语义：① 直注入 + settle 即冻结）")
    // 用户回合后池仍 live → 继续挂起；A settle → 消化轮（执行期 _suspended=true）
    await waitFor(() => D.panel._suspWake)
    settleToPending(D.panel, D.history, A, LONG_REPORT("A 结果"))
    await sessionP
    assert.deepEqual(D.calls.map((c) => c.text), ["挂起中插话", ""], "用户回合先、消化轮后")
    assert.equal(D.calls[1].autoTurn, true)
    assert.equal(D.calls[1].suspended, true, "消化轮执行期 _suspended=true（settle 延迟冻结 + pending 移交）")
    assert.equal(D.panel._susp, null)
    assert.equal(D.history._suspended, false)
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-S3b 真实路径唤醒：挂起纯等待期经真实 ChatPanel._chat 发消息 → driver 立即开新回合（2026-09-02 偏差修复回归——_chat 唤醒错槽 susp.wake 死字段 → _suspWake 单槽）", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "tc-susp-"))
  const history = []
  const fullHistory = []
  const calls = []
  const consumed = { n: 0 }
  const posts = []
  try {
    // 真实 ChatPanel（与 T-S3 的 mock panel 不同——必须走 chat-panel.mjs 真实 _chat 接线）
    const { ChatPanel } = await import("../src/extension/chat-panel.mjs")
    const panel = new ChatPanel({
      globalStorageUri: { fsPath: cwd },
      workspaceState: { get: () => undefined, update: async () => {} },
      subscriptions: [],
    })
    panel._panel = { webview: { postMessage: async (m) => posts.push(m) } }
    const entry = {
      turnSlot: 1,
      distillSlot: 1,
      lines: { history, fullHistory },
      engState: {},
      cwd,
      runTurn: async ({ text = "", autoTurn = false } = {}) => {
        calls.push({ text, autoTurn, suspended: history._suspended })
        consumePending(history, consumed)
      },
    }
    const A = runningEntry(history, 1) // 永不 settle 的长跑子代理——driver 无任何 settle 事件可依赖
    const { suspensionSession } = await import("../src/extension/suspension.mjs")
    const sessionP = suspensionSession(panel, entry)
    await waitFor(() => panel._suspWake) // 已进入挂起纯等待期（waitForSettleOrWake——无 digest、子代理在跑）
    assert.equal(A.done, false, "前提：此刻无 settle 事件")
    // 真实消息路径（webview userMessage → panel-messages → ChatPanel._chat 挂起分流：
    // pendingInput 入队 + 唤醒 driver）。修复前唤醒写死字段 susp.wake（全仓无赋值）→
    // driver 停在纯等待期、消息滞留 pendingInput 直到下一 settle——waitFor 超时即红。
    await panel._chat("挂起中插话", undefined, undefined, undefined, null)
    await waitFor(() => calls.length >= 1)
    assert.equal(calls[0].text, "挂起中插话", "经真实 _chat 路径 → driver 立即开普通新回合")
    assert.equal(calls[0].autoTurn, false, "用户回合（非 digest）")
    assert.equal(calls[0].suspended, false, "用户回合执行期 _suspended=false（普通回合语义）")
    assert.equal(A.done, false, "唤醒来自用户消息而非子代理 settle（A 全程未 settle）")
    assert.equal(history._pendingAsyncResults?.length ?? 0, 0, "非 settle 触发（无 pending 记账）")
    // 会话续行回归：A settle → 消化轮 → 池空自然退出
    await waitFor(() => panel._suspWake)
    settleToPending(panel, history, A, LONG_REPORT("A 结果"))
    await sessionP
    assert.deepEqual(calls.map((c) => c.text), ["挂起中插话", ""], "用户回合先、消化轮后")
    assert.equal(calls[1].autoTurn, true, "消化轮")
    assert.equal(calls[1].suspended, true, "digest 执行期 _suspended=true")
    assert.equal(consumed.n, 1, "settle 结果被消化消费")
    assert.equal(panel._susp, null, "池空自然退出（会话句柄释放）")
    assert.equal(panel._suspWake, null, "唤醒槽清空")
    assert.equal(history._suspended, false)
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-S5 中止清池回归：挂起会话中止 → 清池不注入 + 冻结 → idle", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "tc-susp-"))
  const D = driverCtx(cwd)
  const A = runningEntry(D.history, 1) // 永不 settle 的长跑子代理
  try {
    const { suspensionSession } = await import("../src/extension/suspension.mjs")
    const sessionP = suspensionSession(D.panel, D.entry)
    await waitFor(() => D.panel._suspWake)
    // panel-messages abort 分支同款：标记 + 会话 controller abort + 唤醒
    D.panel._susp.aborted = true
    D.panel._susp.abort.abort()
    D.panel._suspWake?.()
    await sessionP
    assert.equal(D.history._suspended, false)
    assert.equal(D.panel._susp, null)
    assert.equal(D.history._asyncSubagents?.size ?? 0, 0, "清池（不注入陈旧错误）")
    assert.equal(D.history._pendingAsyncResults?.length ?? 0, 0)
    assert.ok(!D.history.some((m) => String(m.content ?? "").includes("async subagent #")), "中止不注入")
    const endPost = D.posts.find((p) => p.type === "suspension" && p.active === false)
    assert.ok(endPost && endPost.freeze === true, "中止退出同样冻结（CLI freezeAllSubTasks 中断语义）")
    assert.equal(D.calls.length, 0, "中止无 digest")
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-S9 排队续发：digest 运行中用户 Enter → pendingInput 排队 → digest 后自动新回合（非打断）", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "tc-susp-"))
  const D = driverCtx(cwd)
  const A = runningEntry(D.history, 1)
  let digestStartedResolve
  const digestStarted = new Promise((r) => { digestStartedResolve = r })
  D.entry.runTurn = async ({ text = "", autoTurn = false } = {}) => {
    D.calls.push({ text, autoTurn, suspended: D.history._suspended })
    if (autoTurn) {
      digestStartedResolve()
      await new Promise((r) => setTimeout(r, 120)) // digest 处理中（模型回合窗口）
    }
    consumePending(D.history, D.consumed)
  }
  try {
    const { suspensionSession } = await import("../src/extension/suspension.mjs")
    const sessionP = suspensionSession(D.panel, D.entry)
    await waitFor(() => D.panel._suspWake)
    settleToPending(D.panel, D.history, A, LONG_REPORT("A 结果"))
    await digestStarted // digest 已开跑
    // digest 处理中用户 Enter（chat-panel._chat 分流——入队不打断）
    D.panel._susp.pendingInput.push({ text: "排队消息", modelOverride: null, reasoning: null, providerName: null, images: null })
    D.panel._suspWake?.()
    await sessionP
    assert.deepEqual(D.calls.map((c) => c.text), ["", "排队消息"], "digest 先、排队消息 digest 后自动续发")
    assert.deepEqual(D.calls.map((c) => c.autoTurn), [true, false], "排队消息是普通用户回合（不触发新 digest）")
    assert.equal(D.calls[0].suspended, true, "digest 期 _suspended 保持（settle 延迟冻结语义）")
    assert.equal(D.consumed.n, 1)
    assert.equal(D.panel._susp, null, "全部消化 + 输入执行完 → 自然退出")
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-S11 合并消化：多子代理近邻完成 → 一轮注入全部（N1 成本护栏）", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "tc-susp-"))
  const D = driverCtx(cwd)
  // 两个已 settle 未消费项直接放池（回合边界竞态形态——会话首轮 sweep 补入 pending）
  D.history._asyncSubagents = new Map([
    [1, { id: 1, role: "coder", status: "done", done: true, report: LONG_REPORT("A") }],
    [2, { id: 2, role: "coder", status: "done", done: true, report: LONG_REPORT("B") }],
  ])
  try {
    const { suspensionSession } = await import("../src/extension/suspension.mjs")
    await suspensionSession(D.panel, D.entry)
    assert.deepEqual(D.calls.map((c) => c.text), [""], "一轮消化全部（无逐项消化）")
    assert.equal(D.calls[0].autoTurn, true)
    assert.equal(D.consumed.n, 2, "多 pending 一次注入一轮消化")
    assert.equal(D.panel._susp, null)
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-S17 settle-during-digest：消化中 B settle → 轮末自动续开合并消化轮消化 B，不滞留", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "tc-susp-"))
  const D = driverCtx(cwd)
  const A = runningEntry(D.history, 1)
  const B = runningEntry(D.history, 2)
  D.entry.runTurn = async ({ text = "", autoTurn = false } = {}) => {
    D.calls.push({ text, autoTurn, suspended: D.history._suspended })
    if (autoTurn) {
      // 消化轮 run-start 只消费当时已入 pending 的项（真实 runAgent 首行注入的语义）——
      // 消费后、轮末之前 settle 的 B 落在 pending（settle 回调在 _suspended=true 下移交，
      // 不并发开新轮——单 runAgent 循环），由驱动下轮合并消化
      const atStart = D.history._pendingAsyncResults ?? []
      if (atStart.length) { D.consumed.n += atStart.length; D.history._pendingAsyncResults = [] }
      if (!B.done) settleToPending(D.panel, D.history, B, LONG_REPORT("B 结果"))
    } else {
      consumePending(D.history, D.consumed)
    }
  }
  try {
    const { suspensionSession } = await import("../src/extension/suspension.mjs")
    const sessionP = suspensionSession(D.panel, D.entry)
    await waitFor(() => D.panel._suspWake)
    settleToPending(D.panel, D.history, A, LONG_REPORT("A 结果")) // 触发第一次 digest
    await sessionP
    assert.deepEqual(D.calls.map((c) => c.text), ["", ""], "两轮消化：A 消化轮 + B 合并消化轮（轮末续开，不滞留）")
    assert.equal(D.calls.every((c) => c.autoTurn), true)
    assert.equal(D.consumed.n, 2, "B 被合并消化轮消费")
    assert.ok(!D.history.some((m) => String(m.content ?? "").includes("async subagent #")), "无残余注入（③ 兜底未触发——B 不滞留）")
    assert.equal(D.panel._susp, null, "池空自然退出")
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

// ═══════════════════════════════════════════════════════════════════════════
// §17.5 硬化轮（AGENT-LOOP.md §17.5/17.5.5——collectSettled 语义变更 + digest
// 完成逐条冻结回收；VS Code 同构）
// ═══════════════════════════════════════════════════════════════════════════

test("T-H7 (vscode, §17.5.5) digest 完成逐条回收：池内其他子代理运行中——已消化条目即发 done（块回收与池空解耦）", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "tc-susp-"))
  const D = driverCtx(cwd)
  const A8 = runningEntry(D.history, 8)
  const A9 = runningEntry(D.history, 9)
  try {
    const { suspensionSession } = await import("../src/extension/suspension.mjs")
    const sessionP = suspensionSession(D.panel, D.entry)
    await waitFor(() => D.panel._suspWake) // 挂起 wait（A8/A9 都在跑）
    // A9 挂起期 settle → pending → digest1 消化 → reclaimDigestedBlocks 逐条 done
    settleToPending(D.panel, D.history, A9, LONG_REPORT("A9 结果"))
    await waitFor(() => D.consumed.n === 1)
    const done9 = D.posts.find((p) => p.type === "subagent" && p.id === 9 && p.status === "done")
    assert.ok(done9, "digest1 完成即对 A9 补发 done（回收——不等池空；A8 仍运行）")
    assert.equal(D.panel._susp.active, true, "A8 仍在跑——会话未退出（块回收与池空解耦）")
    // A8 后 settle → digest2 消化 → 逐条回收 → 池空退出
    settleToPending(D.panel, D.history, A8, LONG_REPORT("A8 结果"))
    await sessionP
    assert.equal(D.consumed.n, 2, "A8 被消化")
    const done8 = D.posts.find((p) => p.type === "subagent" && p.id === 8 && p.status === "done")
    assert.ok(done8, "digest2 完成即对 A8 补发 done")
    assert.ok(D.posts.indexOf(done9) >= 0 && D.posts.indexOf(done9) < D.posts.indexOf(done8), "done9 先于 done8（各自 digest 后回收）")
    assert.equal(D.history._suspended, false, "池空自然退出")
    assert.equal(D.panel._susp, null)
    assert.equal(D.history._asyncSubagents?.size ?? 0, 0)
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("17.5.4 #6 (vscode): backgroundStatus 计入留池 settled 未消费项（done）——纯 settled 池进挂起状态行不误报 0", async () => {
  const { backgroundStatus } = await import("../src/extension/suspension.mjs")
  const history = []
  // 回合尾留池未消费条目（§17.5 核心场景：sweep 前的可见窗口——done 且仍在池）
  history._asyncSubagents = new Map([
    [1, { id: 1, role: "coder", status: "done", done: true }],
  ])
  const s = backgroundStatus(history)
  assert.equal(s.running, 0)
  assert.equal(s.queued, 0)
  assert.equal(s.pending, 0)
  assert.equal(s.done, 1, "留池 settled 未消费项计入 done（状态行 'N 完成待消化'）")
  // 对照：挂起期 settle 移交 pending 后池空——done 归零、pending 计数（sweep 后口径）
  history._asyncSubagents = undefined
  history._pendingAsyncResults = [{ id: 1, role: "coder", done: true }]
  const s2 = backgroundStatus(history)
  assert.equal(s2.done, 0)
  assert.equal(s2.pending, 1)
})



// ═══════════════════════════════════════════════════════════════════════════
// 偏差修复轮（2026-09-02 code review #2/#3/#4——ARCHITECTURE.md 变更段）：
//   T-S18   释放窗口：generateTitle await 期 _chat 入队 → 会话接管（不并发开回合、池不丢）
//   T-S18a 会话入口 pendingInput 预装载（驱动级——窗口队列移交 wiring）
//   T-S19   aborted settle 出池清理（中止的 done 僵尸不再让 poolLive 恒真）
//   T-S20   会话中止统一 abort：持旧 controller signal 的池 children 不逃逸
//   T-S21   中止排队不丢：digest 运行中 Enter 排队 → Stop 中止 → 排队消息普通回合执行
//           （2026-09-02 code review round2 #2-VS Code——中止静默丢弃 pendingInput 偏差）
// ═══════════════════════════════════════════════════════════════════════════

test("T-S18 释放窗口：generateTitle await 期 _chat 入队 → 会话接管——不并发开回合、池不丢（全路径真实回合）", async () => {
  // 真实 ChatPanel + 真实 runPanelChat/runAgent：首回合 spawn async 子代理（慢活）→ 回合尾
  // 池 live → finally 登记 _suspPending → _generateTitle 被 gate 挂起（释放窗口）→ 窗口期
  // panel._chat("second message") 必须入队（panel._suspQueue）而非开并发新回合；gate 释放后
  // 会话接管：入队消息在会话内执行 + 子代理 settle 消化——结果落盘（AC-S2 池不丢）。
  const cwd = mkdtempSync(join(tmpdir(), "tc-susp-window-"))
  const cfgDir = mkdtempSync(join(tmpdir(), "tc-susp-window-cfg-"))
  const sessDir = join(cwd, "sessions")
  const posts = []
  const { _setSessionsDirForTest, _resetSessionsDirForTest, loadSlot } = await import("../src/extension/session-io.mjs")
  const { _setConfigPathForTest } = await import("../src/config-io.mjs")
  const vscodeMock = await import("vscode")
  const savedFolders = vscodeMock.workspace.workspaceFolders
  const { server, port, calls } = await routeServer([
    // 首请求 = 父回合 turn 1：spawn async 子代理（T-S1 同款帧）
    { when: (_b, calls) => calls.length === 1, frames: toolCallFrames("subagent", { task: "T-S18 窗口慢活", role: "coder", async: true }) },
    // 子代理请求（content 精确形态——父回合只有 task 参数形态，不误命中）：慢活 900ms——
    // 父回合结束时子代理仍在 running（池 live）；回合收尾/会话消化均不命中此路由
    { when: (b) => b.includes('"content":"T-S18 窗口慢活"'), frames: textFrames("T-S18 窗口慢活子代理汇报: 完成"), delayMs: 900 },
    // 蒸馏请求（每 run 尾）
    { when: (b) => b.includes("You are distilling exploration tool results"), frames: textFrames("(no exploration summary)") },
    // 其余（父收尾 / 会话用户回合 / digest）——文本收尾即可
    { when: () => true, frames: textFrames("收尾回复") },
  ])
  try {
    _setConfigPathForTest(join(cfgDir, "config.json"))
    _setSessionsDirForTest(sessDir)
    // _cwd() 读 vscode.workspace.workspaceFolders[0]（panel-messages）——mock 需指向沙箱
    // （chat-panel.test.mjs beforeEach 同款；setProjectFolder 会校验 workspaceFolders，
    // mock 空列表下静默 no-op）
    vscodeMock.workspace.workspaceFolders = [{ uri: { fsPath: cwd } }]
    writeFileSync(join(cfgDir, "config.json"), JSON.stringify({
      providers: [{ name: "t", baseURL: `http://127.0.0.1:${port}`, model: "deepseek-v4-pro", apiKey: "k" }],
      activeProvider: "t",
      agent: { engineering: false },
    }))
    const { ChatPanel } = await import("../src/extension/chat-panel.mjs")
    const { saveSessionToSlot } = await import("../src/extension/session-io.mjs")
    const panel = new ChatPanel({
      globalStorageUri: { fsPath: cwd },
      workspaceState: { get: () => undefined, update: async () => {} },
      subscriptions: [],
    })
    panel._panel = { webview: { postMessage: async (m) => posts.push(m) } }
    // subagent 非 readonly——槽位预置 autoApprove（chat-panel.test.mjs makeBridgePanel 同款），
    // 权限门跳过；槽位空历史 → 首条真实消息（isFirstMessage → 标题生成路径）
    saveSessionToSlot(cwd, 1, { version: 2, cwd, updatedAt: Date.now(), title: "", history: [], contextHistory: [], display: [], tasks: [], planMode: false, autoApprove: true, engineering: false })
    panel._slot = 1
    // 释放窗口 gate：_generateTitle 挂起直到测试放行（真实标题生成是可达秒级的 LLM 调用——
    // 这里用 gate 精确控制窗口宽度）
    let titleStartedResolve
    let releaseTitleResolve
    const titleStarted = new Promise((r) => { titleStartedResolve = r })
    const releaseTitle = new Promise((r) => { releaseTitleResolve = r })
    panel._generateTitle = async () => { titleStartedResolve(); await releaseTitle }

    const p1 = panel._chat("first message", undefined, undefined, "t")
    await waitFor(() => panel._suspPending === true, 5000)
    await titleStarted
    assert.equal(panel._turnActive, false, "回合已释放 UI（挂起入口登记先于释放——窗口已开）")
    assert.equal(panel._susp ?? null, null, "会话尚未建立（窗口期）")
    assert.ok(panel._abortController && !panel._abortController.signal.aborted, "池 controller 未被 abort（无并发新回合）")
    // 子代理请求已发出（池 live 前提）——窗口仍开着（gate 未放行），慢启动也来得及
    await waitFor(() => calls.filter((b) => b.includes('"content":"T-S18 窗口慢活"')).length >= 1, 3000)

    // 窗口期用户消息：必须入队，不得开并发独立回合（修复前：直接 runPanelChat——重载磁盘
    // lines + abort 池 controller → 僵尸挂起或池结果丢失）
    await panel._chat("second message", undefined, undefined, "t")
    await waitFor(() => (panel._suspQueue ?? []).length === 1, 2000)
    assert.ok(!calls.some((b) => b.includes("second message")), "窗口期消息未触发并发 LLM 请求（入队不并发开回合）")
    assert.equal(panel._suspPending, true, "窗口未关闭（会话未建立）")

    // 放行标题 → 会话入口消费队列：second message 在会话内以普通回合执行；子代理 settle
    // → 注入/消化 → 池空自然退出（p1 覆盖整个链）
    releaseTitleResolve()
    await p1
    assert.equal(panel._susp, null, "会话自然退出（句柄释放）")
    assert.equal((panel._suspQueue ?? []).length, 0, "窗口队列被会话消费")
    assert.ok(calls.some((b) => b.includes("second message")), "窗口期消息在会话内执行（零丢失）")
    const data = loadSlot(cwd, panel._slot)
    const serialized = JSON.stringify(data?.history ?? [])
    assert.ok(serialized.includes("T-S18 窗口慢活子代理汇报: 完成"), "池结果注入落盘（AC-S2——池不丢）")
    assert.ok(!serialized.includes("error: Aborted"), "无中止错误注入")
    assert.ok(posts.some((p) => p.type === "suspension" && p.active === false), "挂起退出通知（补发冻结）")
  } finally {
    vscodeMock.workspace.workspaceFolders = savedFolders
    _setConfigPathForTest(null)
    _resetSessionsDirForTest()
    server.close()
    rmSync(cfgDir, { recursive: true, force: true })
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-S18a 会话入口 pendingInput 预装载（驱动级——释放窗口队列移交 wiring）", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "tc-susp-"))
  const D = driverCtx(cwd)
  const A = runningEntry(D.history, 1) // 长跑子代理（不 settle）
  D.entry.pendingInput = [{ text: "窗口期消息", modelOverride: null, reasoning: null, providerName: null, images: null }]
  try {
    const { suspensionSession } = await import("../src/extension/suspension.mjs")
    const sessionP = suspensionSession(D.panel, D.entry)
    await waitFor(() => D.calls.length >= 1, 2000)
    assert.equal(D.calls[0].text, "窗口期消息", "入口预装载消息 = 首个回合（先于任何 settle/digest——D-S5 用户优先）")
    assert.equal(D.calls[0].autoTurn, false)
    assert.equal(D.calls[0].suspended, false, "用户回合执行期 _suspended=false")
    // 用户回合后池仍 live → 继续挂起；A settle → 消化 → 池空自然退出
    await waitFor(() => D.panel._suspWake)
    settleToPending(D.panel, D.history, A, LONG_REPORT("A 结果"))
    await sessionP
    assert.deepEqual(D.calls.map((c) => c.text), ["窗口期消息", ""], "窗口消息先、消化轮后")
    assert.equal(D.calls[1].autoTurn, true)
    assert.equal(D.panel._susp, null)
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-S19 aborted settle 出池清理：中止的池项 settle 即从共享 map 移除——无 done 僵尸让 poolLive 恒真", async () => {
  const { server, port } = await routeServer([
    { when: () => true, frames: textFrames("T-S19 报告"), delayMs: 3000 }, // 长 LLM——测试窗口期子代理必在 running
  ])
  const cwd = mkdtempSync(join(tmpdir(), "tc-susp-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const { poolLive } = await import("../src/extension/suspension.mjs")
    const parent = fakeParent(port)
    const map = new Map()
    parent._asyncSubagents = map
    parent.history._asyncSubagents = map // agent.mjs 同款：共享 history 载体
    const controller = new AbortController()
    const ctx = { agent: parent, cwd, callbacks: {}, depth: 0, signal: controller.signal }
    const spawned = JSON.parse(String(await subagentTool.execute({ task: "T-S19 慢活", role: "coder", async: true }, ctx)))
    assert.equal(spawned.status, "running")
    const entry = map.get(spawned.id)
    assert.ok(poolLive(parent.history), "池 live 前提")
    controller.abort() // 中止（Stop 语义：外回合 / 释放窗口新回合 abort 池 controller）
    await waitFor(() => entry.done === true, 3000)
    assert.equal(map.size, 0, "aborted settle 出池清理（修复前：done 僵尸留在 map）")
    assert.equal(parent.history._pendingAsyncResults?.length ?? 0, 0, "不注入 pending（中止 = 丢弃，不注入陈旧错误）")
    assert.ok(!String(entry.report ?? "").includes("completed"), "子代理未跑完（被中止）")
    assert.equal(poolLive(parent.history), false, "poolLive 不再被僵尸条目钉死（驱动器可自然退出）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-S20 会话中止统一 abort：持旧 controller signal 的池 children 不逃逸（Ctrl+I/ContinueError 重建场景）", async () => {
  const { server, port } = await routeServer([
    { when: () => true, frames: textFrames("T-S20 报告"), delayMs: 5000 }, // 不中止则 5s 后才完成——waitFor 边界内必红
  ])
  const cwd = mkdtempSync(join(tmpdir(), "tc-susp-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const { suspensionSession } = await import("../src/extension/suspension.mjs")
    const D = driverCtx(cwd)
    const parent = fakeParent(port, { history: D.history })
    const map = new Map()
    parent._asyncSubagents = map
    D.history._asyncSubagents = map
    // 旧 controller（Ctrl+I / ContinueError 续跑重建前的 controller）——child 在旧 controller
    // 生效期 spawn，持有其 signal；panel._abortController（最后重建的 controller）已被替换
    const stale = new AbortController()
    D.panel._turnControllers = [stale] // runPanelChat 登记（会话入口快照 → susp.abortControllers）
    const ctx = { agent: parent, cwd, callbacks: {}, depth: 0, signal: stale.signal }
    const spawned = JSON.parse(String(await subagentTool.execute({ task: "T-S20 慢活", role: "coder", async: true }, ctx)))
    const entry = map.get(spawned.id)
    const sessionP = suspensionSession(D.panel, D.entry)
    await waitFor(() => D.panel._suspWake, 3000) // 会话 parked（child running——5s 延迟未到）
    assert.equal(entry.done, false, "前提：child 仍在 running")
    // panel-messages abort 分支同款（T-S5 手法 + 偏差修复 #3 的 abortControllers）
    D.panel._susp.aborted = true
    D.panel._susp.abortControllers?.forEach((c) => c.abort())
    D.panel._susp.abort.abort()
    D.panel._suspWake?.()
    await sessionP
    assert.equal(stale.signal.aborted, true, "旧 controller 被统一 abort（修复前只 abort 最后 controller——child 逃逸）")
    await waitFor(() => entry.done === true, 2000) // child 5s 延迟 → 2s 内 settle 只可能来自 abort
    assert.equal(map.size, 0, "池清空（会话中止语义）")
    assert.equal(D.panel._susp, null, "会话退出")
    assert.equal(D.history._suspended, false)
    assert.equal(D.calls.length, 0, "中止无 digest")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-S21 中止排队不丢（2026-09-02 code review round2 #2-VS Code 回归）：digest 运行中 Enter 排队 → Stop 中止会话 → 排队消息以普通回合执行", async () => {
  // 偏差：中止路径（suspension.mjs finally abort 分支）只清池不处理 susp.pendingInput，
  // 退出兜底又被 !aborted 门控 → digest 期间排队的用户消息永久消失（输入框已清空 +
  // 气泡已上屏——用户视为已发送、无任何提示）。修复：中止后同样兜底消费——abort 分支
  // 已清池 → 以普通回合执行（与释放窗口队列的中止兜底同语义，入队消息零丢失 AC-S2）。
  const cwd = mkdtempSync(join(tmpdir(), "tc-susp-"))
  const D = driverCtx(cwd)
  const A = runningEntry(D.history, 1) // 长跑子代理（不 settle——无自然退出路径）
  let digestStartedResolve
  const digestStarted = new Promise((r) => { digestStartedResolve = r })
  D.entry.runTurn = async ({ text = "", autoTurn = false } = {}) => {
    D.calls.push({ text, autoTurn, suspended: D.history._suspended })
    if (autoTurn) {
      digestStartedResolve()
      await new Promise((r) => setTimeout(r, 150)) // digest 处理中（模型回合窗口）
    }
    consumePending(D.history, D.consumed)
  }
  try {
    const { suspensionSession } = await import("../src/extension/suspension.mjs")
    const sessionP = suspensionSession(D.panel, D.entry)
    await waitFor(() => D.panel._suspWake)
    settleToPending(D.panel, D.history, A, LONG_REPORT("A 结果"))
    await digestStarted // digest 已开跑（settle 移交 pending 待消化）
    // digest 运行中用户 Enter（chat-panel._chat 挂起分流：pendingInput 入队 + 清框）
    const pendingQ = D.panel._susp.pendingInput
    pendingQ.push(
      { text: "中止前排队消息", modelOverride: null, reasoning: null, providerName: null, images: null },
      { text: "中止前排队消息 2", modelOverride: null, reasoning: null, providerName: null, images: null },
    )
    // 随后用户 Stop（panel-messages abort 分支同款：标记 + 会话 controller + 唤醒）
    D.panel._susp.aborted = true
    D.panel._susp.abortControllers?.forEach((c) => c.abort())
    D.panel._susp.abort.abort()
    D.panel._abortController?.abort()
    D.panel._suspWake?.()
    await sessionP
    // 中止语义照旧：清池不注入 + 无残余 pending + 补发冻结
    assert.equal(D.history._asyncSubagents?.size ?? 0, 0, "清池（§15 abort 语义——不注入陈旧错误）")
    assert.equal(D.history._pendingAsyncResults?.length ?? 0, 0, "pending 清空")
    assert.equal(D.history._suspended, false)
    assert.equal(D.panel._susp, null, "会话句柄释放")
    assert.equal(D.panel._suspWake, null, "唤醒槽清空")
    const endPost = D.posts.find((p) => p.type === "suspension" && p.active === false)
    assert.ok(endPost && endPost.freeze === true, "中止退出同样冻结")
    // 排队消息不静默丢：中止后以普通回合执行（修复前：!aborted 门控 → 消息永久消失——
    // calls 只到 digest 即红；执行序 = 入队序）
    assert.deepEqual(
      D.calls.map((c) => ({ text: c.text, autoTurn: c.autoTurn })),
      [
        { text: "", autoTurn: true }, // digest（mock 内自然结束——真实路径由 abort 中断）
        { text: "中止前排队消息", autoTurn: false },
        { text: "中止前排队消息 2", autoTurn: false },
      ],
      "digest 先、排队消息中止后以普通回合顺序执行（零丢失）",
    )
    assert.equal(D.calls[1].suspended, false, "排队消息执行期 _suspended=false（普通回合语义）")
    assert.equal(D.calls[2].suspended, false)
    assert.equal(pendingQ.length, 0, "队列消费干净")
    assert.equal(D.consumed.n, 1, "digest 消费 pending（中止不注入）")
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

// ═══════════════════════════════════════════════════════════════════════════
// webview 级：T-S14 中间态渲染 / T-S15 双模式输入（happy-dom + 真实 index.html）
// ═══════════════════════════════════════════════════════════════════════════

describe("§17 webview 态（T-S14 中间态渲染 + T-S15 双模式输入）", () => {
  let env
  let posts
  let chatModules

  before(async () => {
    env = setupWebview()
    const html = readFileSync(join(__dirname, "..", "webview", "index.html"), "utf8")
    const body = html.match(/<body>([\s\S]*)<\/body>/)?.[1] ?? ""
    document.body.innerHTML = body.replace(/<script[\s\S]*?<\/script>/g, "")
    posts = []
    globalThis.acquireVsCodeApi = () => ({ postMessage: (m) => posts.push(m), getState: () => null, setState: () => {} })
    await import("../webview/chat.js") // 消息循环接线（state.js 首次求值——body 已就位）
    chatModules = {
      ctx: (await import("../webview/state.js")).ctx,
      S: (await import("../webview/state.js")).S,
      setLoading: (await import("../webview/loading.js")).setLoading,
      send: (await import("../webview/send.js")).send,
    }
  })
  after(() => env?.cleanup())

  const post = (msg) => window.dispatchEvent(new window.MessageEvent("message", { data: msg }))
  const findBlock = (label) =>
    [...document.querySelectorAll("#messages .sub-block")].find((b) => b.querySelector("summary")?.textContent === label)

  it("T-S14 settled 中间态 + §17.5.5 逐条回收：'done · awaiting digestion' 驻留不折叠；digest 消化完成逐条 done 折叠（不等池空）；退出 freeze 仅兜底残项", async () => {
    const { ctx, S } = chatModules
    S._subagentMap = {} // 测试间隔离（面板行/折叠互不串扰）
    post({ type: "subagent", id: 21, role: "coder", status: "started", startedAt: Date.now(), model: "m" })
    post({ type: "toolPanel", name: "sub:coder#21", kind: "text", text: "working…" })
    const block = findBlock("coder#21")
    assert.ok(block && block.open, "活动区块已创建且展开")
    // 挂起激活 + 子代理完成（settled 通知——非 done，不折叠）
    post({ type: "suspension", active: true, running: 1, queued: 0, pending: 0 })
    post({ type: "subagent", id: 21, role: "coder", status: "settled" })
    const statusLine = document.getElementById("status-line").textContent
    assert.match(statusLine, /background subagent/, "状态行显示后台模式")
    const row = [...document.querySelectorAll("#subagent-panel .sub-item")]
      .find((r) => r.querySelector(".sub-role")?.textContent.includes("coder"))
    assert.ok(row, "面板行驻留")
    assert.match(row.textContent, /done · awaiting digestion/, "✓-pending 中间态（§7.2.1 挂起例外）")
    assert.equal(block.open, true, "settled 不折叠——驻留面板等消化")
    // 17.5.4 #6：回合尾留池 settled 未消费项（done 计数）进状态行——不误报 winding/0
    post({ type: "suspension", active: true, running: 0, queued: 0, pending: 0, done: 1 })
    assert.match(document.getElementById("status-line").textContent, /awaiting digestion/, "留池未消费项显示完成待消化计数（done→digesting）")
    // §17.5.5：digest 消化完成 → host reclaimDigestedBlocks 对该条目逐条补发 done——
    // 立即折叠回收（不等池空；同池其他子代理仍运行）
    post({ type: "subagent", id: 21, role: "coder", status: "done" })
    assert.equal(block.open, false, "digest 完成逐条 done → 折叠回收（保留可展开——17.5.5/T-H7）")
    assert.equal(S._subagentMap[21].status, "done", "settled → done（消化回收）")
    // 残项（未消化——仍驻留）：另一子代理 settled 后会话退出 → 退出 freeze 兜底折叠
    post({ type: "subagent", id: 22, role: "coder", status: "started", startedAt: Date.now(), model: "m" })
    post({ type: "toolPanel", name: "sub:coder#22", kind: "text", text: "working…" })
    const block22 = findBlock("coder#22")
    post({ type: "subagent", id: 22, role: "coder", status: "settled" })
    assert.equal(block22.open, true, "未消化残项驻留（等待下轮 digest 或退出 freeze）")
    post({ type: "suspension", active: false, freeze: true })
    assert.equal(block22.open, false, "退出 freeze 兜底折叠残项（17.5.5——仅兜底未消化）")
    assert.equal(S._subagentMap[22].status, "done", "残项 settled → done")
    assert.ok(!document.getElementById("status-line").textContent.includes("background subagent"), "退出后状态行恢复")
    // 视图复位
    post({ type: "suspension", active: false, freeze: false })
  })

  it("T-S15 双模式输入：挂起/消化中 Enter 不被吞（send 可用 + 输入框不锁）；后台事件零干扰（F3）", () => {
    const { ctx, S, setLoading, send } = chatModules
    const { _subagentMap } = S
    S._subagentMap = {}
    // 普通运行态基线：输入锁 + send 隐藏（digest 之外的既有语义不变）
    setLoading(ctx, true)
    assert.equal(ctx.inputEl.disabled, true, "普通处理中输入锁定")
    assert.equal(ctx.sendBtn.style.display, "none")
    assert.equal(ctx.abortBtn.style.display, "flex")
    // 挂起激活（digest 处理中 Enter 需要输入可用——F7）
    post({ type: "suspension", active: true, running: 1, queued: 0, pending: 0 })
    assert.equal(ctx.inputEl.disabled, false, "挂起态输入框不锁（F7）")
    assert.equal(ctx.sendBtn.style.display, "flex", "send 可见（Enter 提交/排队）")
    assert.equal(ctx.abortBtn.style.display, "flex", "Stop 可见（中止整个后台会话）")
    // digest 处理中（isRunning=true）Enter 提交照发——host 端排队（T-S9 驱动级断言队列）
    ctx.inputEl.value = "digest 中插话"
    const before = posts.length
    send()
    const sent = posts.slice(before).find((m) => m.type === "userMessage")
    assert.ok(sent && sent.text === "digest 中插话", "挂起运行中 Enter 不被吞（发送到 host 排队）")
    // F3：后台事件（settle 状态更新/计数刷新）不改输入框文本
    ctx.inputEl.value = "输入到一半的草稿…"
    post({ type: "suspension", active: true, running: 0, queued: 0, pending: 1 })
    post({ type: "subagent", id: 22, role: "coder", status: "settled" })
    assert.equal(ctx.inputEl.value, "输入到一半的草稿…", "后台事件零干扰（不清空/不改写）")
    // 退出挂起 → 恢复普通运行态锁定
    post({ type: "suspension", active: false, freeze: true })
    setLoading(ctx, true)
    assert.equal(ctx.inputEl.disabled, true, "退出挂起后普通锁定恢复")
    S._subagentMap = _subagentMap
  })
})
