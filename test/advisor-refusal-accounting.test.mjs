/**
 * advisor-refusal-accounting.test.mjs — 群 A 批 A6（VSC-MIRROR-SWEEP）。
 * 设计权威：`docs/design/ADVISOR-CONVERGENCE.md` §16.1（契约 1–5 / 用例 T-MA6-1–9 / AC-MA6-1–3）。
 *
 * 覆盖：① 工具层六类拒绝全部置位 `ctx._advisorRefused`（拒文原样）；② 记账块读同一 per-call
 * 载体 ⇒ 拒绝 = 未跑（不置 `_calledAdvisorThisRun` / 不推 `_advisorRound`）；③ builder 单源
 * （工具层预检与 runner 内部拒逐字相等）；④ 对照零回归（正常完成照常记账；async 路径零波及）。
 * 零网络：sync 收尾面走本地 SSE fake server（127.0.0.1）；run 面经 `ctx.runAdvisorReview` 缝注入。
 */
import { test, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync } from "node:fs"
import http from "node:http"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { advisorTool } from "../src/agent-tools/advisor.mjs"
import { buildCapMessage, MAX_ADVISOR_ROUNDS, ADVISOR_LAUNCH_REFUSAL_PREFIX, runAdvisorReview } from "../src/advisor/run.mjs"
import { executeToolBatches } from "../src/agent/execute-tools.mjs"

const tmpDirs = []
after(() => { for (const d of tmpDirs) rmSync(d, { recursive: true, force: true }) })

function mkws() { const dir = mkdtempSync(join(tmpdir(), "a6-")); tmpDirs.push(dir); return dir }
function write(root, rel, content) {
  const p = join(root, ...rel.split("/"))
  mkdirSync(join(p, ".."), { recursive: true })
  writeFileSync(p, content, "utf8")
  return p
}
const readSrc = (rel) => readFileSync(new URL(rel, import.meta.url), "utf8").replace(/\r\n/g, "\n")

/** 桩 agent（advisor 面最小字段集）。provider 指向本地 wire（T-MA6-6）。 */
function makeAgent(ws, over = {}) {
  return {
    cwd: ws, history: [], config: {},
    _provider: { name: "a6-wire", baseURL: "http://127.0.0.1:1/v1", apiKey: "k", model: "a6-model", format: "openai" },
    _advisorRound: 0, _calledAdvisorThisRun: false, _touchedFiles: [], _lastAdvisorOutput: null,
    _engDesignTokens: new Map(), _engDesignReviewed: false, _asyncAdvisors: new Map(), _advisorRuns: new Map(),
    ...over,
  }
}

/** 本地 SSE fake server（零外网）——同步评审收尾面。 */
function reviewServer({ text = "Round 1 — review complete. No issues." } = {}) {
  const server = http.createServer((req, res) => {
    let body = ""
    req.on("data", (c) => { body += c })
    req.on("end", () => {
      res.writeHead(200, { "content-type": "text/event-stream" })
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: text }, finish_reason: null }] })}\n\n`)
      res.write(`data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: "stop" }] })}\n\n`)
      res.write("data: [DONE]\n\n")
      res.end()
    })
  })
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((r) => server.close(r)) }))
  })
}

/** 经真实执行器驱动一次工具调用（记账块所在路径——toolCtx 提升面）。 */
async function driveBatches(agent, toolName, args, tool, { depth = 0 } = {}) {
  const fullHistory = []
  await executeToolBatches(agent, {
    response: { toolCalls: [{ id: "call_1", name: toolName, arguments: JSON.stringify(args) }] },
    history: agent.history, fullHistory,
    toolByName: new Map([[toolName, tool]]),
    getAuto: () => true,
    callbacks: {},
    signal: undefined,
    cwd: agent.cwd,
    recentSigs: [],
    depth,
  })
  return fullHistory
}

const ctxFor = (agent, extra = {}) => ({ agent, depth: 0, callbacks: {}, cwd: agent.cwd, ...extra })

// ─── T-MA6-1 错误：sync code 无 scope（类 #2——核心类）───────────────────────────

test("T-MA6-1 无 scope 拒：工具置位 + 拒文原样 + 记账零写（经真实执行器）", async () => {
  const ws = mkws()
  const agent = makeAgent(ws)
  // 工具层直调：置位 + 拒文
  const ctx = ctxFor(agent)
  const text = await advisorTool.execute({ type: "code", async: false }, ctx)
  assert.equal(text, "Advisor: no review scope specified. Provide paths (files/directories to review) or documents (acceptance criteria for code review).")
  assert.equal(ctx._advisorRefused, true, "拒绝置位（class #2）")
  // 执行器（记账块）：拒绝 = 未跑
  await driveBatches(agent, "advisor", { type: "code", async: false }, advisorTool)
  assert.equal(agent._calledAdvisorThisRun, false, "拒绝不置 called")
  assert.equal(agent._advisorRound, 0, "拒绝不推轮次")
})

// ─── T-MA6-2 错误：sync design 文档非法（类 #3）──────────────────────────────────

test("T-MA6-2 文档非法拒：置位 + 拒文 + 记账零写", async () => {
  const ws = mkws()
  const agent = makeAgent(ws)
  const ctx = ctxFor(agent)
  const text = await advisorTool.execute({ type: "design", documents: ["src/nope.mjs"], async: false }, ctx)
  assert.match(text, /^Advisor: design review documents must be documentation files/, "拒文原样")
  assert.equal(ctx._advisorRefused, true, "拒绝置位（class #3）")
  await driveBatches(agent, "advisor", { type: "design", documents: ["src/nope.mjs"], async: false }, advisorTool)
  assert.equal(agent._calledAdvisorThisRun, false)
  assert.equal(agent._advisorRound, 0)
})

// ─── T-MA6-3 错误：sync 启动拒（前缀契约——run 返回前缀串）─────────────────────────

test("T-MA6-3 sync 启动拒：前缀判定 → 置位 + 拒文返回 + 记账零写", async () => {
  const ws = mkws()
  const agent = makeAgent(ws)
  const refusal = `${ADVISOR_LAUNCH_REFUSAL_PREFIX} — the request does not carry the approval signal. Nothing was sent.`
  const ctx = ctxFor(agent, { runAdvisorReview: async () => refusal })
  write(ws, "x.mjs", "export const x = 1\n")
  const text = await advisorTool.execute({ type: "code", paths: ["x.mjs"], async: false }, ctx)
  assert.equal(text, refusal, "拒文原样返回")
  assert.equal(ctx._advisorRefused, true, "前缀判定置位（class #5）")
})

// ─── T-MA6-4 错误：cap 拒（工具层预检——零 LLM）+ T-MA6-7 builder 单源 ────────────

test("T-MA6-4 cap 拒：逐字 = buildCapMessage + 零 LLM（run 未被调）+ 记账零写", async () => {
  const ws = mkws()
  const agent = makeAgent(ws, { _advisorRound: MAX_ADVISOR_ROUNDS })
  let called = 0
  const ctx = ctxFor(agent, { runAdvisorReview: async () => { called++; return "should not run" } })
  const text = await advisorTool.execute({ type: "code", paths: ["x.mjs"], async: false }, ctx)
  assert.equal(text, buildCapMessage(agent), "工具层预检输出 = builder 单源逐字")
  assert.equal(called, 0, "零 LLM（run 未被调）")
  assert.equal(ctx._advisorRefused, true, "拒绝置位（class #6）")
  await driveBatches(agent, "advisor", { type: "code", paths: ["x.mjs"], async: false }, advisorTool)
  assert.equal(agent._calledAdvisorThisRun, false, "cap 拒零记账")
  assert.equal(agent._advisorRound, MAX_ADVISOR_ROUNDS, "轮次不变")
})

test("T-MA6-7 builder 单源对拍：runner 内部拒 ≡ 工具层预检 ≡ buildCapMessage（逐字）", async () => {
  const ws = mkws()
  const agent = makeAgent(ws, { _advisorRound: MAX_ADVISOR_ROUNDS, _lastAdvisorOutput: "| # | Issue |\n|---|---|\n| 1 | still open |" })
  const direct = await runAdvisorReview(agent, "code", {}, null, null, ["x.mjs"])
  const toolLayer = await advisorTool.execute({ type: "code", paths: ["x.mjs"], async: false }, ctxFor(agent))
  assert.equal(direct, buildCapMessage(agent), "runner 内部拒 = builder")
  assert.equal(toolLayer, direct, "工具层预检 = runner 内部拒（逐字）")
  assert.match(direct, /convergence cap reached after 5 rounds/, "文案在位")
  assert.match(direct, /still open/, "未决项摘要随 builder 输出（单源）")
})

// ─── T-MA6-5 边界：async 启动拒（池满——类 #4）───────────────────────────────────

test("T-MA6-5 async 池满拒：置位 + 拒文 + 记账零写（既有跳过路径）", async () => {
  const ws = mkws()
  const agent = makeAgent(ws, { config: { agent: { poolLimits: { advisor: 1 } } } })
  agent._asyncAdvisors.set(7, { status: "running" })
  const ctx = ctxFor(agent)
  const text = await advisorTool.execute({ type: "code", paths: ["x.mjs"], async: true }, ctx)
  assert.match(text, /^Advisor: another review is already running \(pool limit 1/, "池满拒文")
  assert.equal(ctx._advisorRefused, true, "拒绝置位（class #4）")
  await driveBatches(agent, "advisor", { type: "code", paths: ["x.mjs"], async: true }, advisorTool)
  assert.equal(agent._calledAdvisorThisRun, false)
  assert.equal(agent._advisorRound, 0)
})

// ─── T-MA6-8 边界：async 对照（cap 预检 sync-only——fresh async 零误拒）───────────

test("T-MA6-8 async + 轮次满：cap 预检不触发（无 cap 文案）+ 启动路径照常（ack）", async () => {
  const ws = mkws()
  const agent = makeAgent(ws, { _advisorRound: MAX_ADVISOR_ROUNDS })
  const ctx = ctxFor(agent, { runAdvisorReview: () => new Promise(() => {}) }) // 后台评审挂起（本用例只验启动面）
  const text = await advisorTool.execute({ type: "code", paths: ["x.mjs"], async: true }, ctx)
  assert.ok(!text.includes("convergence cap reached"), "cap 预检 sync-only——async 零误拒")
  assert.match(text, /review started in the background \(review #\d+, round 1\)/, "async 启动路径照常（ack）")
  assert.equal(agent._advisorRound, MAX_ADVISOR_ROUNDS, "async 不消耗全局轮次")
})

// ─── T-MA6-9 边界：async + depth>0（类 #1——显式 async 拒）───────────────────────

test("T-MA6-9 depth>0 显式 async 拒：置位 + 拒文 + 记账零写（既有跳过路径）", async () => {
  const ws = mkws()
  const agent = makeAgent(ws)
  const ctx = { ...ctxFor(agent), depth: 1 }
  const text = await advisorTool.execute({ type: "code", paths: ["x.mjs"], async: true }, ctx)
  assert.match(text, /^Advisor: async reviews are only available at the top level/, "拒文原样")
  assert.equal(ctx._advisorRefused, true, "拒绝置位（class #1）")
  await driveBatches(agent, "advisor", { type: "code", paths: ["x.mjs"], async: true }, advisorTool, { depth: 1 })
  assert.equal(agent._calledAdvisorThisRun, false)
  assert.equal(agent._advisorRound, 0)
})

// ─── T-MA6-6 正常：sync code 评审完成 → 照常记账（零回归对照）────────────────────

test("T-MA6-6 正常完成对照：走真 run（本地 wire 终稿）→ called 置位 + 轮次 +1", async () => {
  const ws = mkws()
  write(ws, "x.mjs", "export const x = 1\n")
  const srv = await reviewServer()
  const agent = makeAgent(ws)
  agent._provider = { ...agent._provider, baseURL: srv.url }
  try {
    const full = await driveBatches(agent, "advisor", { type: "code", paths: ["x.mjs"], async: false }, advisorTool)
    assert.equal(agent._calledAdvisorThisRun, true, "正常完成照常置位（零回归）")
    assert.equal(agent._advisorRound, 1, "code 评审推轮次 +1")
    const toolMsg = full.find((m) => m.role === "tool")
    assert.ok(toolMsg && !String(toolMsg.content).startsWith("Advisor: no review scope"), "结果非拒文")
  } finally {
    await srv.close()
  }
})

// ─── 记账接线（per-call 载体同一对象：工具写 → 记账块读）─────────────────────────

test("A6 载体接线：工具在 toolCtx 上置位 → 记账块读同一对象（跳过）；未置位 → 照常记账", async () => {
  const ws = mkws()
  const makeStub = (flag) => ({
    name: "advisor", readonly: true, sideEffectExempt: true,
    execute: async (args, ctx) => { if (flag) ctx._advisorRefused = true; return flag ? "Advisor: refused (stub)" : "Advisor: review text (stub)" },
  })
  const a1 = makeAgent(ws)
  await driveBatches(a1, "advisor", { type: "code", paths: ["x.mjs"], async: false }, makeStub(true))
  assert.equal(a1._calledAdvisorThisRun, false, "置位 → 零记账（同一载体）")
  assert.equal(a1._advisorRound, 0)
  const a2 = makeAgent(ws)
  await driveBatches(a2, "advisor", { type: "code", paths: ["x.mjs"], async: false }, makeStub(false))
  assert.equal(a2._calledAdvisorThisRun, true, "未置位 → 照常记账（零回归）")
  assert.equal(a2._advisorRound, 1)
})

// ─── AC-MA6-3 静态面：单源消费在位（旧内联拼装零残留）────────────────────────────

test("AC-MA6-3 静态：run.mjs 导出 builder + 内部改用同一 builder（旧内联拼装零残留）", () => {
  const runSrc = readSrc("../src/advisor/run.mjs")
  assert.ok(runSrc.includes("export function buildCapMessage(agent)"), "builder 导出在位")
  assert.equal((runSrc.match(/convergence cap reached after/g) || []).length, 1, "文案单源（恰 1 处）")
  const toolSrc = readSrc("../src/agent-tools/advisor.mjs")
  assert.ok(toolSrc.includes("return buildCapMessage(agent)"), "工具层预检消费同一 builder")
  const exSrc = readSrc("../src/agent/execute-tools.mjs")
  assert.ok(exSrc.includes("toolCtx?._advisorRefused !== true"), "记账块读 per-call 载体")
})
