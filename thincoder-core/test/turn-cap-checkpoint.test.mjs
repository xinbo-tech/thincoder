/**
 * turn-cap-checkpoint.test.mjs — 撞帽检查点（批档 `docs/batches/2026-09-26-turn-cap-live-gap.md` §2.5 / §2.7 用例 1–3 / T2 / 7–9 / 12 / 13 的核侧面）。
 *
 * 形态：**真端到端**（真 `subagent` / `consult_start` 工具 + 真 runAgent 回合循环 + 真异步池条目
 * + 真 `send` / `cancel` 执行器），唯一替身 = 模型面 `globalThis.fetch` 桩（SSE 帧脚本；先例
 * `spawn-system-block.test.mjs:93-102`）。用例 3 的模型面替身 = `ctx.runAgent` 注入缝
 * （`consult.mjs:313` `const runner = ctx.runAgent ?? runAgent`）。
 *
 * 逐例对照（1–3 / T2 / 7–9 / 12 / 13）：1 async 子代 ask + send 续期（history 保留 · 任务文本不重注入 ·
 * 段数 +1）· 2 cancel ⇒ partial 含 TURN_CAP_MARK · 3 会诊（consult_stop 去向 · 续期 = 新段预算 + watchdog 重置）·
 * T2 零写盘链不跳闸（段边界仍走 ask + 段边界源码窗先红锚）· 7 同步族不挂起直接 partial ·
 * 8 abort 立即 partial · 9 会话收尾收 partial（promise 收敛）· 12 status/observe 二元 ·
 * 13 headless 异步族仍挂起；补例 14 = 异步飞刀族（send 续期 + cancel partial，登记 = docs/batches/2026-09-26-turn-cap-live-gap.md §2.7 T8）；10/11 落端套件。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { createAgent, ContinueError } from "../agent.mjs"
import { TURN_CAP_MARK } from "../agent/child-marks.mjs"
import { turnCapTrace } from "../agent-tools/checkpoint.mjs"
import { getAsyncPool } from "../agent-tools/async-settle.mjs"
import { upstreamWaiting } from "../agent-tools/parent-channel.mjs"
import { cancelAsyncSubagent } from "../agent-tools/subagent-async.mjs"
import { executeObserveAction, executeSendAction, executeStatusAction } from "../agent-tools/subagent-actions.mjs"
import { subagentTool } from "../agent-tools/subagent.mjs"
import { consultStartTool } from "../agent-tools/consult.mjs"
import { launchEscalateAsync } from "../agent-tools/escalate-async.mjs"

const ENC = new TextEncoder()
const TASK = "TASK-TEXT-marker-turn-cap — 撞帽检查点用例任务书"
const PROBLEM = "PROBLEM-TEXT-marker-consult — 会诊撞帽用例简报"
const FINAL_TEXT = `FINAL-REPORT ${"R".repeat(600)}`
const CONSULT_TIMEOUT_MS = 900_000

let tmp
let stub
let liveParent
let probeCalls

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "turn-cap-"))
  liveParent = null
  probeCalls = []
})
afterEach(async () => {
  // 先掐在飞子代（否则 fetch 桩还原后，残余回合会走真网络）——再还原桩、再删临时目录。
  for (const s of [...(getAsyncPool(liveParent, "subagent")?.values() ?? [])]) {
    try { s.controller?.abort?.({ abortTrigger: "test-teardown", abortDetail: "turn-cap-test" }) } catch { /* best effort */ }
  }
  for (const s of [...(getAsyncPool(liveParent, "consult")?.values() ?? [])]) {
    for (const c of s.controllers ?? []) {
      try { c.abort({ abortTrigger: "test-teardown", abortDetail: "turn-cap-test" }) } catch { /* best effort */ }
    }
  }
  if (stub) { stub.restore(); stub = null }
  await sleep(30)
  for (let i = 0; ; i++) {
    try { rmSync(tmp, { recursive: true, force: true }); return } catch { if (i >= 10) return; await sleep(100) }
  }
})

// ─── 夹具 ────────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function waitUntil(fn, { ms = 8000, label = "condition" } = {}) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    if (fn()) return true
    await sleep(5)
  }
  throw new Error(`timed out waiting for ${label}`)
}

/** 一帧 tool_call 回合（先例 spawn-system-block.test.mjs / spawn-child 族用例同款 SSE 形）。 */
const toolTurn = (name, args) => [
  { choices: [{ delta: { tool_calls: [{ index: 0, id: "c1", type: "function", function: { name, arguments: JSON.stringify(args) } }] } }] },
  { choices: [{ delta: {}, finish_reason: "tool_calls" }] },
]
/** 一帧文本回合（止于 finish_reason stop）。 */
const textTurn = (text) => [
  { choices: [{ delta: { content: text } }] },
  { choices: [{ delta: {}, finish_reason: "stop" }] },
]
/** 前 `turns` 次请求答「工具回合」，其后答「终报文本回合」。 */
const toolScript = (turns) => (n) => (n <= turns ? toolTurn("probe", { i: n }) : textTurn(FINAL_TEXT))

/** fetch 桩：捕获出站请求体（wire 面断言用）+ 按脚本回 SSE。 */
function installStub(script) {
  const calls = []
  const saved = globalThis.fetch
  globalThis.fetch = async (_url, opts) => {
    calls.push(JSON.parse(opts.body))
    const frames = script(calls.length)
    const sse = frames.map((f) => `data: ${JSON.stringify(f)}\n\n`).join("") + "data: [DONE]\n\n"
    return { ok: true, status: 200, headers: { get: () => "text/event-stream" }, body: [ENC.encode(sse)] }
  }
  return { calls, restore: () => { globalThis.fetch = saved } }
}

/** 只读探针工具 = 「带工具执行的回合」载体（纯 no-op，只计数调用）。 */
const PROBE = {
  name: "probe",
  description: "no-op probe (test double for a tool-execution turn)",
  readonly: true,
  parameters: { type: "object", properties: { i: { type: "number" } } },
  async execute(_args, _ctx) {
    probeCalls.push(1)
    return "probe-ok"
  },
}

function makeParent(agentCfg = {}) {
  const provider = { name: "stub", model: "stub-model", baseURL: "http://stub.invalid/v1", apiKey: "k" }
  const parent = createAgent({
    cwd: tmp,
    provider,
    tools: [PROBE],
    config: { agent: { ...agentCfg }, providersList: [{ ...provider, baseURL: "http://stub.invalid/v1" }] },
    role: "main",
  })
  liveParent = parent
  return parent
}

const CTX = (parent, over = {}) => ({ agent: parent, depth: 0, callbacks: {}, ...over })
const pool = (parent, kind = "subagent") => getAsyncPool(parent, kind)

async function spawnAsync(parent, ctx = CTX(parent), opts = {}) {
  const raw = await subagentTool.execute({ task: TASK, role: "explore", async: true, ...opts }, ctx)
  return JSON.parse(raw)
}
const send = (parent, id, message = "keep going") =>
  JSON.parse(executeSendAction({ id: String(id), message }, CTX(parent)))
const cancel = (parent, id) => cancelAsyncSubagent(parent, String(id))
const askQueue = (parent) => (parent._childUpstream ?? []).filter((e) => e.kind === "ask")
const wireText = (body) => body.messages.map((m) => (typeof m.content === "string" ? m.content : JSON.stringify(m.content ?? ""))).join("\n")

// ─── 用例 1 · async 子代撞帽 ⇒ 挂起；send 续期 ──────────────────────────────

test("用例 1 · async 子代撞帽 ⇒ 父侧 ask 挂起；send 续期（history 保留、任务文本不重投、段数 +1）", async () => {
  stub = installStub(toolScript(3))
  const parent = makeParent({ subagentTurns: 2 })
  const ack = await spawnAsync(parent)
  const entry = pool(parent).get(String(ack.id))
  assert.ok(entry, "异步池条目应在飞")

  await waitUntil(() => entry._turnCapRec, { label: "撞帽检查点登记" })

  // 挂起载荷：段数 / 累计轮次 + 去向（send 续期、cancel 停止）
  const asks = askQueue(parent)
  assert.equal(asks.length, 1)
  assert.match(asks[0].from, /^explore#/)
  assert.match(asks[0].message, /segments 1 · accumulated 2 turns/)
  assert.match(asks[0].message, /subagent action:'send' \(id 1\)/)
  assert.match(asks[0].message, /subagent action:'cancel' \(id 1\)/)
  assert.equal(asks[0].kind, "ask")
  assert.equal(upstreamWaiting(parent), true)

  // 挂起期：条目在飞、未 settle、无新条目、真工具回合数 = 预算
  const rec = entry._turnCapRec
  assert.equal(rec.turn, 2)
  assert.equal(typeof rec.resolve, "function")
  assert.equal(entry.status, "running")
  assert.ok(!entry.done)
  assert.equal(pool(parent).size, 1)
  assert.equal(probeCalls.length, 2)
  assert.equal(turnCapTrace(entry), "segments 1 · accumulated 2 turns")

  // 父答 send ⇒ 兑现（同 id、新段预算）
  const sent = send(parent, ack.id)
  assert.equal(sent.resumed, true)
  assert.equal(sent.status, "delivered")
  assert.match(sent.note, /turn-cap checkpoint delivered/)

  await waitUntil(() => entry.done === true, { label: "子代收口" })
  assert.equal(entry.error, null)
  assert.ok(!entry.cancelled)
  assert.ok(String(entry.report).startsWith("FINAL-REPORT"))
  assert.equal(entry._turnCapRec, undefined, "兑现后检查点应注销")

  // 第二段：任务文本不重投（wire 面恰 1 次）+ 段 1 的工具结果保留（history 未丢）
  const last = stub.calls.at(-1)
  assert.equal(stub.calls.length, 4)
  assert.equal(last.messages.filter((m) => String(m.content ?? "").includes(TASK)).length, 1)
  assert.equal(last.messages.filter((m) => String(m.content ?? "").includes("probe-ok")).length, 1)
  assert.equal(entry.childAgent._continueSegments, 2)
  assert.equal(entry.childAgent._turnSeq, 4, "累计轮次跨段不重置：段 1 两轮工具 + 段 2 工具轮与收尾文本轮各一")
})

// ─── 用例 2 · 挂起期 cancel ⇒ 立即 partial ──────────────────────────────────

test("用例 2 · 挂起期父答 cancel ⇒ 立即 partial 含 TURN_CAP_MARK、条目 cancelled", async () => {
  stub = installStub(toolScript(2))
  const parent = makeParent({ subagentTurns: 2 })
  const ack = await spawnAsync(parent)
  const entry = pool(parent).get(String(ack.id))
  await waitUntil(() => entry._turnCapRec, { label: "撞帽检查点登记" })

  const out = cancel(parent, ack.id)
  assert.equal(out.status, "cancelled")
  await waitUntil(() => entry.done === true, { label: "子代收口" })

  assert.equal(entry.cancelled, true)
  assert.ok(String(entry.report).includes(TURN_CAP_MARK), "partial 文案带公共锚点")
  assert.match(String(entry.report), /\(2 turns\)/)
  assert.equal(entry._turnCapRec, undefined)
  assert.equal(stub.calls.length, 2, "取消后不得再起新段")
})

// ─── 用例 3 · 会诊撞帽 ⇒ ask + send 续期（watchdog 重置） ────────────────────

test("用例 3 · 会诊撞帽 ⇒ 父侧 ask（consult_stop 去向）；send 续期 = 新段预算 + watchdog 重置", async () => {
  const armCalls = []
  const cleared = []
  const realSetTimeout = globalThis.setTimeout
  const realClearTimeout = globalThis.clearTimeout
  globalThis.setTimeout = (fn, ms, ...rest) => { const h = realSetTimeout(fn, ms, ...rest); armCalls.push({ h, ms }); return h }
  globalThis.clearTimeout = (h, ...rest) => { cleared.push(h); return realClearTimeout(h, ...rest) }
  const watchdogArms = () => armCalls.filter((a) => a.ms === CONSULT_TIMEOUT_MS)
  try {
    const parent = makeParent({
      consultTurns: 2,
      consultTimeoutMs: CONSULT_TIMEOUT_MS,
      consultModels: [{ provider: "stub", model: "stub-model" }],
    })
    const runs = []
    const fakeRunner = async (child, input, _cbs, opts) => {
      runs.push({ input, resume: opts?.resume === true, maxTurns: opts?.maxTurns })
      // 替身只替模型面——计数面按真回合循环语义预置（首段 2 轮工具回合撞帽）
      child._turnSeq = (child._turnSeq ?? 0) + 2
      if (runs.length === 1) throw new ContinueError(opts?.maxTurns)
      return "consult-resumed-verdict"
    }
    const started = JSON.parse(await consultStartTool.execute({ problem: PROBLEM }, CTX(parent, { runAgent: fakeRunner })))
    assert.equal(started.models.length, 1)
    const session = pool(parent, "consult").get(String(started.id))
    await waitUntil(() => session._turnCapRec, { label: "会诊撞帽检查点登记" })
    assert.equal(watchdogArms().length, 1, "首段 watchdog 已臂上")

    // 挂起载荷：去向 = consult_stop（非 subagent cancel）；continueQueue 串行链在场
    const asks = askQueue(parent)
    assert.equal(asks.length, 1)
    assert.match(asks[0].from, /stub:stub-model/)
    assert.match(asks[0].message, /segments 1 · accumulated 2 turns/)
    assert.match(asks[0].message, /consult_stop \(id 1\)/)
    assert.equal(/subagent action:'cancel'/.test(asks[0].message), false)
    assert.equal(upstreamWaiting(parent), true)
    assert.equal(typeof session.continueQueue?.then, "function")
    const rec = session._turnCapRec
    assert.equal(rec.turn, 2)
    assert.equal(rec.child._upstream.parent, parent)
    assert.equal(rec.child._upstream.sync, false)

    // send ⇒ 池未命中分支兑现（会诊会话）⇒ 新段预算 + watchdog 重臂 + continueQueue 兑现 true
    const sent = send(parent, started.id, "continue the diagnosis")
    assert.equal(sent.resumed, true)
    assert.match(sent.note, /turn-cap checkpoint delivered/)
    await waitUntil(() => runs.length === 2, { label: "第二段起跑" })
    assert.equal(runs[1].resume, true)
    assert.equal(runs[1].maxTurns, 2, "新段预算 = consultTurns")
    assert.equal(runs[1].input, runs[0].input, "输入面同串（history 保留，不重投任务书）")
    assert.deepEqual(rec.child._injected, ["continue the diagnosis"], "续期文本落注入队列（真 runner 时由 consumeInjected 回合头消费）")
    assert.equal(await session.continueQueue, true, "串行链兑现 true")
    await waitUntil(() => watchdogArms().length === 2, { label: "watchdog 重臂" })
    assert.ok(cleared.includes(watchdogArms()[0].h), "旧 watchdog 句柄被 clearTimeout")
    assert.equal(session._turnCapRec, undefined)
  } finally {
    for (const a of armCalls) realClearTimeout(a.h)
    globalThis.setTimeout = realSetTimeout
    globalThis.clearTimeout = realClearTimeout
  }
})

// ─── 用例 T2 · 零写盘链不跳闸（段边界仍走 ask）+ 段边界源码窗先红锚 ───────────

test("用例 T2 · 5 轮零写盘链 ⇒ 段边界 ask 恰一次（无跳闸）；段边界源码窗内无跳过决议", async () => {
  // 结构面（先红锚）：段边界「catch (e) {」→「await askContinue(e)」窗内不得再有跳过决议
  // （N7 跳闸行曾居此窗——窗内含 onDeclined ⇒ 本断言即红）。
  const src = readFileSync(new URL("../agent/spawn-child.mjs", import.meta.url), "utf8")
  const winFrom = src.lastIndexOf("catch (e) {")
  const winTo = src.indexOf("await askContinue(e)")
  assert.ok(winFrom > -1 && winTo > winFrom, "段边界窗口可定位（catch → askContinue）")
  assert.equal(src.slice(winFrom, winTo).includes("onDeclined"), false, "段边界无跳过决议")

  // 行为面（回归）：零写盘长链撞帽 ⇒ 照常报请继续（段预算 = 唯一触发点）
  stub = installStub(toolScript(5))
  const parent = makeParent({ subagentTurns: 5 })
  const ack = await spawnAsync(parent)
  const entry = pool(parent).get(String(ack.id))
  await waitUntil(() => entry._turnCapRec, { label: "零写盘链段边界报请" })

  const asks = askQueue(parent)
  assert.equal(asks.length, 1, "段边界 ask 恰一次")
  assert.match(asks[0].message, /segments 1 · accumulated 5 turns/)
  assert.equal(probeCalls.length, 5)
  assert.equal(entry.status, "running")
  assert.equal(stub.calls.length, 5, "零写盘不触发硬停——恰 5 轮后报请")

  cancel(parent, ack.id)
  await waitUntil(() => entry.done === true, { label: "清理收口" })
})

// ─── 用例 7 · 同步族 headless ⇒ 不挂起 ─────────────────────────────────────

test("用例 7 · 同步族（async:false）+ 无 onPermissionRequest ⇒ 不挂起、直接 partial", async () => {
  stub = installStub(toolScript(2))
  const parent = makeParent({ subagentTurns: 2 })
  const out = await subagentTool.execute({ task: TASK, role: "explore", async: false }, CTX(parent))
  assert.equal(typeof out, "string")
  assert.match(out, /^Subagent \(explore\) /)
  assert.ok(out.includes(TURN_CAP_MARK))
  assert.match(out, /\(2 turns\)/)
  assert.equal(askQueue(parent).length, 0, "同步族不挂起（无 ask）")
  assert.equal(pool(parent), null)
  assert.equal(stub.calls.length, 2)
})

// ─── 用例 8 · 挂起期 abort（Stop 优先） ─────────────────────────────────────

test("用例 8 · 挂起期 abort ⇒ 立即 partial、无 ask 残留、不重入", async () => {
  stub = installStub(toolScript(2))
  const parent = makeParent({ subagentTurns: 2 })
  const ack = await spawnAsync(parent)
  const entry = pool(parent).get(String(ack.id))
  await waitUntil(() => entry._turnCapRec, { label: "撞帽检查点登记" })

  entry.controller.abort({ abortTrigger: "stop", abortDetail: "user-stop" })
  await waitUntil(() => entry.done === true, { label: "abort 后收口" })
  assert.ok(String(entry.report).includes(TURN_CAP_MARK))
  assert.equal(entry._turnCapRec, undefined, "无 ask 残留")
  assert.ok(!entry.cancelled)
  assert.equal(stub.calls.length, 2, "不得重入续段")
})

// ─── 用例 9 · 会话收尾 ⇒ 条目收为 partial、无悬挂 ──────────────────────────

test("用例 9 · 挂起后父不再应答（会话收尾 abort）⇒ 条目收为 partial、entry.promise 收敛", async () => {
  stub = installStub(toolScript(2))
  const parent = makeParent({ subagentTurns: 2 })
  const ctrl = new AbortController()
  parent._sessionSignal = ctrl.signal // buildChildSignal(parent) 优先读会话信号
  const ack = await spawnAsync(parent)
  const entry = pool(parent).get(String(ack.id))
  const promise = entry.promise
  await waitUntil(() => entry._turnCapRec, { label: "撞帽检查点登记" })

  ctrl.abort({ abortTrigger: "session-stop", abortDetail: "session-closeout" })
  const settled = await Promise.race([promise.then(() => true), sleep(6000).then(() => false)])
  assert.equal(settled, true, "entry.promise 必须收敛（无悬挂进程）")
  assert.equal(entry.done, true)
  assert.ok(String(entry.report).includes(TURN_CAP_MARK))
  assert.ok(!entry.cancelled)
})

// ─── 用例 12 · status / observe 二元 ────────────────────────────────────────

test("用例 12 · status / observe 摘要含「段数 · 累计轮次」二元（挂起期与续段后）", async () => {
  stub = installStub(toolScript(4))
  const parent = makeParent({ subagentTurns: 2 })
  const ack = await spawnAsync(parent)
  const entry = pool(parent).get(String(ack.id))
  await waitUntil(() => entry._turnCapRec, { label: "首段撞帽" })
  const firstRec = entry._turnCapRec

  const st = JSON.parse(executeStatusAction({ id: String(ack.id) }, CTX(parent)))
  assert.equal(st.status, "running")
  assert.equal(st.turnCap, "segments 1 · accumulated 2 turns")
  const ob = JSON.parse(executeObserveAction({ id: String(ack.id) }, CTX(parent)))
  assert.equal(ob.turnCap, "segments 1 · accumulated 2 turns")

  // 续期 ⇒ 第二段再撞帽（同预算）——二元随段累计前进
  assert.equal(send(parent, ack.id).resumed, true)
  await waitUntil(() => entry._turnCapRec && entry._turnCapRec !== firstRec, { label: "第二段撞帽" })
  const st2 = JSON.parse(executeStatusAction({ id: String(ack.id) }, CTX(parent)))
  assert.equal(st2.turnCap, "segments 2 · accumulated 4 turns")
  const ob2 = JSON.parse(executeObserveAction({ id: String(ack.id) }, CTX(parent)))
  assert.equal(ob2.turnCap, "segments 2 · accumulated 4 turns")
  assert.equal(ob2.status, "running")

  cancel(parent, ack.id)
  await waitUntil(() => entry.done === true, { label: "清理收口" })
})

// ─── 用例 13 · 异步族 headless ⇒ 仍挂起 ────────────────────────────────────

test("用例 13 · 异步族 · 无 onPermissionRequest（headless）⇒ 仍登记挂起，答复通道 = 父 send", async () => {
  stub = installStub(toolScript(2))
  const parent = makeParent({ subagentTurns: 2 })
  const ctx = CTX(parent)
  assert.equal(ctx.onPermissionRequest, undefined)
  const ack = await spawnAsync(parent, ctx)
  const entry = pool(parent).get(String(ack.id))
  await waitUntil(() => entry._turnCapRec, { label: "headless 仍登记挂起" })

  assert.equal(upstreamWaiting(parent), true)
  assert.equal(parent._permQueue, undefined, "权限面未被触碰（答复通道非 handler）")
  assert.equal(probeCalls.length, 2)

  const sent = send(parent, ack.id, "resume please")
  assert.equal(sent.resumed, true)
  await waitUntil(() => entry.done === true, { label: "子代收口" })
  assert.ok(String(entry.report).startsWith("FINAL-REPORT"))
})

// ─── 补例 14 · 异步飞刀族（F8 第二执行体 · §2.5 用例表未见，待设计修正轮登记）───────────
//     真 runAgent 面（= 用例 1 同款桩）⇒ `escalate-async.mjs:231` 注入队列消费接线在断言内。

const ESC_PROVIDER = { name: "stub", model: "stub-model", baseURL: "http://stub.invalid/v1", apiKey: "k" }
const escLaunch = (parent) => JSON.parse(launchEscalateAsync(parent, CTX(parent), {
  task: TASK, provider: ESC_PROVIDER, tag: "stub:stub-model", effortNote: "",
}))

test("补例 14 · 异步飞刀撞帽 ⇒ 父侧 ask（池载具）；send 续期文本落新段；cancel 档 ⇒ partial", async () => {
  stub = installStub(toolScript(3))
  const parent = makeParent({ subagentTurns: 2 })
  const ack = escLaunch(parent)
  const entry = pool(parent).get(String(ack.id))
  await waitUntil(() => entry._turnCapRec, { label: "飞刀撞帽检查点登记" })

  const asks = askQueue(parent)
  assert.equal(asks.length, 1)
  assert.match(asks[0].from, /^escalate#/)
  assert.match(asks[0].message, /segments 1 · accumulated 2 turns/)
  assert.match(asks[0].message, /subagent action:'send' \(id 1\).+subagent action:'cancel' \(id 1\)/)
  assert.equal(upstreamWaiting(parent), true)
  assert.equal(entry.status, "running")
  assert.equal(pool(parent).size, 1, "挂起不 settle、不重派：无新池条目")
  assert.equal(parent._permQueue, undefined, "答复通道 = 父 send（不经权限面）")

  const sent = send(parent, ack.id, "RESUME-TEXT-marker-escalate")
  assert.equal(sent.resumed, true)
  await waitUntil(() => entry.done === true, { label: "飞刀收口" })
  assert.ok(String(entry.report).startsWith("escalate (stub:stub-model) post-op report:\nFINAL-REPORT"))

  const last = stub.calls.at(-1) // 新段消费面（真 runAgent 回合头 drain）：任务文本恰一次 + 续期文本恰一次
  assert.equal(stub.calls.length, 4)
  assert.equal(last.messages.filter((m) => String(m.content ?? "").includes(TASK)).length, 1)
  assert.equal(last.messages.filter((m) => String(m.content ?? "").includes("RESUME-TEXT-marker-escalate")).length, 1)
  assert.equal(entry.childAgent._continueSegments, 2)

  // ② 中止档：同父第二飞刀挂起期 cancel ⇒ 立即 partial（既有 onDeclined 降级，带公共锚点）
  stub.restore()
  stub = installStub(toolScript(2))
  const ack2 = escLaunch(parent)
  const e2 = pool(parent).get(String(ack2.id))
  await waitUntil(() => e2._turnCapRec, { label: "第二飞刀撞帽登记" })
  assert.equal(cancel(parent, ack2.id).status, "cancelled")
  await waitUntil(() => e2.done === true, { label: "第二飞刀收口" })
  assert.match(String(e2.error ?? e2.report ?? ""), /stopped: turn cap reached \(2 turns\)/, "取消档 partial 带公共锚点 + 撞帽轮次")
  assert.equal(e2._turnCapRec, undefined)
  assert.equal(stub.calls.length, 2, "取消后不得再起新段")
})
