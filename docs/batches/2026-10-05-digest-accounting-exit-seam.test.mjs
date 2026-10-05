/**
 * 2026-10-05-digest-accounting-exit-seam.test.mjs — 批内件·出口缝分档（消化账务批 · 台账 #930）。
 * 任务书 = `docs/batches/2026-10-05-digest-accounting.md` §2（终值）∥ 判据单源 = 设计档 §6.31
 * （`docs/core/design/AGENT-LOOP-ASYNC-POOL.md`）。本档 = 出口缝两腿**纯搬移**自
 * `docs/batches/2026-10-05-digest-accounting.test.mjs`（500 行硬门拆档——腿内容逐字零改）：
 * T-DA15（出口缝修正——idle 清场投递账过滤 · #41 披露① · 父侧裁定 2026-10-05）∥ T-DA16
 * （出口缝修正②——fallback 支投递账分区 + 清场单遍分区 · #44 披露①扩散面 ∥ 披露④ · 父侧裁定）。
 * 平 node 直驱（核侧全真件——无假件替身）：两腿主体直驱核件 `finishSuspension` / `startSuspension` ∥ T-DA16① 另经真
 * `runAgent` 一轮（投递 = `beginRun` ∥ 落痕 = turn-loop ∥ 见账 = `finalizeAgentTurn`）；模型面 = `globalThis.fetch` 桩（SSE 字节）⇒ 零网络 / 零真实等待。
 * 跑法（仓根 `thincoder/`）：node --test docs/batches/2026-10-05-digest-accounting-exit-seam.test.mjs
 * 先红后绿：两腿各自修正前红读（读数 = 批档 §5）。本件不入仓套件（批内件 · 随批留存）。
 * 行数注（内容口径）：本档 165 行 ∥ 宿主档 408 行（拆前 502 行——500 行硬门拆分；读取器显示值 +1）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = fileURLToPath(new URL("../../", import.meta.url)) // 仓根（thincoder/）
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)

const CORE = await mod("thincoder-core/agent.mjs") // runAgent / createAgent
const SUSP = await mod("thincoder-core/agent/suspension.mjs") // finishSuspension / startSuspension

/* ── 夹具（自足子集——逐字取自宿主档）── */

const mkAgent = (over = {}) => Object.assign(
  CORE.createAgent({
    provider: { name: "harness", model: "harness-model", apiKey: "k", baseURL: "http://127.0.0.1:1/v1" },
    tools: [], config: { agent: {}, traces: { enabled: false } }, cwd: ROOT, memory: null, history: [],
  }),
  { _pendingAsyncResults: [] },
  over,
)

/** 待消化条目（settle 后形——`report`/`childAgent` 双持：销账时才全释）。 */
const entry = (id, over = {}) => ({ id, role: "subagent", done: true, status: "done", report: `report-${id}`, childAgent: { fake: id }, ...over })

const enc = new TextEncoder()
const sseResponse = (text) => ({
  ok: true, status: 200, headers: new Headers({ "content-type": "text/event-stream" }),
  body: new ReadableStream({ start(c) { c.enqueue(enc.encode(text)); c.close() } }),
  text: async () => "", json: async () => ({}),
})
/** 回合 SSE（sse transport——content 行 + 可选 finish_reason 行；缺 finish 行 ⇒ 缺席支面）。 */
const turnSSE = (content, { finish = "stop" } = {}) =>
  `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n` +
  (finish ? `data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: finish }], usage: { prompt_tokens: 9, completion_tokens: 4, total_tokens: 13 } })}\n\n` : "") +
  `data: [DONE]\n\n`

/** fetch 桩（响应队列——中途耗尽 = 显式炸，不静默空转）。 */
async function withFetch(responses, fn) {
  const real = globalThis.fetch
  const queue = [...responses]
  const calls = []
  globalThis.fetch = async (url, init) => {
    calls.push(String(url))
    const next = queue.shift()
    if (next === undefined) throw new Error(`fetch stub exhausted (call #${calls.length})`)
    return next
  }
  try { return await fn(calls) } finally { globalThis.fetch = real }
}

/** 真窗消化轮：runAgent(autoTurn) —— run-start 投递 ∥ turn-loop 落痕 ∥ finalize 见账（全真件）。 */
const digestRound = (agent, content, over = {}) =>
  withFetch([sseResponse(turnSSE(content))], () => CORE.runAgent(agent, "", {}, { autoTurn: true, suspDriven: true, ...over }))

const countIn = (agent, needle) => agent.history.filter((m) => String(m.content).includes(needle)).length
const REQ_PREFIX = "[System reminder: digest accounting"

/* ── T-DA15 · 出口缝·idle 清场按投递账过滤（#41 披露① · 父侧裁定 2026-10-05——先红后绿）── */
test("T-DA15 · idle 清场投递账过滤：已投递条不注入且留容器 ∥ 未投递条照注入；跳过条不入 reclaim", async () => {
  // ① 清场单点直驱（判据 = 条目既有 `_daDelivered`——调用窗 `_daSession` 已复位，不以其为门）
  const direct = mkAgent()
  const d1 = entry(151, { _daDelivered: true })
  const d2 = entry(152)
  direct._pendingAsyncResults = [d1, d2]
  const injectedA = []
  const flushed = await SUSP.finishSuspension(direct, { injectResidual: async (e) => { injectedA.push(e) } })
  assert.deepEqual(injectedA, [d2], "已投递条零注入 ∥ 未投递条照注入")
  assert.deepEqual(flushed.injected, [d2], "`injected` = 成功前缀（跳过条不入）")
  assert.deepEqual(flushed.left, [d2], "`left` = 注入集离容全量（跳过条不取、留容器）")
  assert.equal(flushed.error, null, "零错收口")
  assert.deepEqual(direct._pendingAsyncResults, [d1], "已投递条仍驻容器（状态面可见 / 可续账）")
  assert.equal(d1._daDelivered, true, "条目标记零改")

  // ② 回退形直驱（无投递账条）：逐字沿用——全量注入 + 容器取尽
  const fb = mkAgent()
  const f1 = entry(155); const f2 = entry(156)
  fb._pendingAsyncResults = [f1, f2]
  const injectedB = []
  const flushedB = await SUSP.finishSuspension(fb, { injectResidual: async (e) => { injectedB.push(e) } })
  assert.deepEqual(injectedB, [f1, f2], "无 `_daDelivered` 条全量注入（回退形零变）")
  assert.deepEqual(flushedB.left, [f1, f2], "`left` = 离容全量（注入集全取）")
  assert.equal(fb._pendingAsyncResults.length, 0, "容器取尽（旧行为逐字）")

  // ③ 全径：会话内消化轮抛非 abort 错 ⇒ 异常收束走 idle 清场（披露① 原场景）
  const agent = mkAgent({ _daSession: true })
  const e1 = entry(153, { _daDelivered: true })
  const e2 = entry(154)
  agent._pendingAsyncResults = [e1, e2]
  const seen = []
  const reclaims = []
  const handle = SUSP.startSuspension({
    carrier: agent,
    runTurn: async () => { throw new Error("digest round blew up") },
    injectResidual: async (e) => { seen.push(e) },
    hooks: { reclaim: (c) => reclaims.push(c) },
  })
  let thrown = null
  try { await handle.done } catch (err) { thrown = err }
  assert.equal(thrown?.message, "digest round blew up", "非 abort 异常沿旧径上抛（fail-loud 保持）")
  assert.deepEqual(seen, [e2], "已投递条不注入（防重复内容）∥ 未投递条照注入")
  assert.deepEqual(agent._pendingAsyncResults, [e1], "已投递条仍驻容器（退出即可见 / 可续账）")
  assert.equal(e1.report, "report-153", "跳过条零释放（report 留待续账）")
  assert.equal(agent._daSession, false, "会话标记已复位（退出面）")
  assert.deepEqual(reclaims.filter((c) => c.length > 0), [[e2]], "跳过条不入 reclaim（补发面 = 注入集）")
})

/* ── T-DA16 · 出口缝②·fallback 支投递账分区（#44 披露①扩散面 · 父侧裁定 2026-10-05——先红后绿）── */
test("T-DA16 · fallback 直驱按投递账分区：已投递条不注入且留容器 ∥ 缺省条照注入 + 照释放", async () => {
  // ① 全真件直驱（无 `_daSession`——会话退出后 / headless 形）：上一会话退出残余（已投递未销账）
  //    与缺省条交错；判据 = 条目既有 `_daDelivered` 字段（不新造）。
  const agent = mkAgent()
  const d1 = entry(161, { _daDelivered: true })
  const f1 = entry(162)
  const d2 = entry(163, { _daDelivered: true })
  const f2 = entry(164)
  agent._pendingAsyncResults = [d1, f1, d2, f2]
  await digestRound(agent, "普通作答")

  assert.deepEqual(agent._pendingAsyncResults.map((e) => e.id), [161, 163], "已投递条留容器（原序）——内容已在历史")
  assert.equal(countIn(agent, "async subagent #161"), 0, "已投递条零注入（防重复）")
  assert.equal(countIn(agent, "async subagent #163"), 0, "已投递条零注入（防重复）")
  assert.equal(d1.report, "report-161", "跳过条零释放（report 留待续账）")
  assert.equal(d1.childAgent?.fake, 161, "跳过条零释放（childAgent 不动）")
  assert.equal(countIn(agent, "async subagent #162"), 1, "缺省条照注入（恰一次）")
  assert.equal(countIn(agent, "async subagent #164"), 1, "缺省条照注入（恰一次）")
  assert.ok(
    agent.history.findIndex((m) => String(m.content).includes("async subagent #162")) <
    agent.history.findIndex((m) => String(m.content).includes("async subagent #164")),
    "注入顺序 = 容器原序",
  )
  assert.equal(f1.childAgent, null, "缺省条照释放（childAgent）")
  assert.equal(f1.report, null, "缺省条照释放（report）")
  assert.equal(f2.childAgent, null, "缺省条照释放（childAgent）")
  assert.equal(f2.report, null, "缺省条照释放（report）")
  assert.equal(f1._daDelivered, undefined, "零账目动作（无投递账）")
  assert.equal(countIn(agent, REQ_PREFIX), 0, "fallback 零账目要求行")
  assert.equal((agent._unsettledDigests ?? []).length, 0, "零升级账本")

  // ② 清场单遍分区·顺序面复核（#44 披露④——离容顺序 ∥ 留容器顺序双面不缩水；改前 / 改后同绿）
  const ord = mkAgent()
  const o1 = entry(165, { _daDelivered: true })
  const o2 = entry(166)
  const o3 = entry(167, { _daDelivered: true })
  const o4 = entry(168)
  ord._pendingAsyncResults = [o1, o2, o3, o4]
  const injectedC = []
  const flushedC = await SUSP.finishSuspension(ord, { injectResidual: async (e) => { injectedC.push(e) } })
  assert.deepEqual(injectedC.map((e) => e.id), [166, 168], "离容顺序 = 容器原序")
  assert.deepEqual(flushedC.left.map((e) => e.id), [166, 168], "`left` = 注入集离容全量（顺序不缩水）")
  assert.deepEqual(ord._pendingAsyncResults.map((e) => e.id), [165, 167], "留容器集原序")
})
