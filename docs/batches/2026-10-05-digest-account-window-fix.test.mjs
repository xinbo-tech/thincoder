/**
 * 2026-10-05-digest-account-window-fix.test.mjs — 批内件（消化账务取件窗收正批 · 台账 #939 · 实施轮）。
 * 任务书 = `docs/batches/2026-10-05-digest-account-window-fix.md` §2（含修正块——以修正块为准）；
 * 判据单源 = 设计档 `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.31.5 / §6.31.10（用例 T-DA17–T-DA20）。
 * 用例 = T-DA17（★ 红绿对——首轮签收跨轮存活）∥ T-DA18（跨 run 清位）∥ T-DA19（未签收照重投）
 * ∥ T-DA20（缺痕两臂）+ 评审轮 2 ② 两臂（a 压缩臂 ∥ b 非会话门臂）。
 * 自持夹具（不 import `2026-10-05-digest-accounting.test.mjs` #930 冻结件——夹具体例沿其惯例）；
 * 驱动 = 真 `runAgent` + `globalThis.fetch` 桩（多轮 SSE——工具调用用未注册名 ⇒ 错误结果不中断回路）；
 * 日志隔离沿批内件惯例（`withLogs`）。
 * 跑法（仓根 `thincoder/`）：node --test docs/batches/2026-10-05-digest-account-window-fix.test.mjs
 * 先红后绿（改前码红读 = 批档 §5——四红）：T-DA17 红（首轮签收被收口轮覆盖 ⇒ 假重投）∥ T-DA20 臂 2 红
 * （撞帽未收口 ⇒ 窗空）∥ 臂 a 红（早轮签收不存续）∥ 臂 b 红（收口单写无会话门 ⇒ 非会话亦落痕）。
 */
import test, { after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = fileURLToPath(new URL("../../", import.meta.url)) // 仓根（thincoder/）
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)

const CORE = await mod("thincoder-core/agent.mjs") // runAgent / createAgent
const LOG = await mod("thincoder-core/log.mjs")

const SANDBOX = mkdtempSync(join(tmpdir(), "da-window-"))
after(() => rmSync(SANDBOX, { recursive: true, force: true }))

/* ── 夹具：假 carrier（真 runAgent 宿主）/ 待消化条目 / SSE 桩 / 日志读面 ── */

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
/** 回合 SSE（sse transport）：content 行 + 可选工具调用行（未注册名——错误结果不中断回路）+ finish 行。 */
const turnSSE = (content, { finish = "stop", tool = null } = {}) =>
  `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n` +
  (tool ? `data: ${JSON.stringify({ choices: [{ delta: { tool_calls: [{ index: 0, id: `call_${tool}`, type: "function", function: { name: tool, arguments: "{}" } }] } }] })}\n\n` : "") +
  `data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: finish }], usage: { prompt_tokens: 9, completion_tokens: 4, total_tokens: 13 } })}\n\n` +
  `data: [DONE]\n\n`

/** fetch 桩（响应队列——中途耗尽 = 显式炸，不静默空转）。 */
async function withFetch(responses, fn) {
  const real = globalThis.fetch
  const queue = [...responses]
  const calls = []
  globalThis.fetch = async (url) => {
    calls.push(String(url))
    const next = queue.shift()
    if (next === undefined) throw new Error(`fetch stub exhausted (call #${calls.length})`)
    return next
  }
  try { return await fn(calls) } finally { globalThis.fetch = real }
}

/** 真窗消化轮：runAgent(autoTurn)——run-start 投递/清位 ∥ turn-loop 逐轮落痕 ∥ finalize 见账（全真件）。 */
const digestRound = (agent, content, over = {}) =>
  withFetch([sseResponse(turnSSE(content))], () => CORE.runAgent(agent, "", {}, { autoTurn: true, suspDriven: true, ...over }))

/* ── 日志读面（落盘隔离缝——恰一条/零条类断言；文件按 agent-*.log 全读——免按日现算文件名）── */
const logDirOf = (tag) => join(SANDBOX, `logs-${tag}`)
const logEvents = (dir, ev) => {
  try {
    return readdirSync(dir)
      .filter((name) => name.startsWith("agent-") && name.endsWith(".log"))
      .flatMap((name) => readFileSync(join(dir, name), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)))
      .filter((e) => e.ev === ev)
  } catch { return [] }
}
async function withLogs(tag, fn) {
  const dir = logDirOf(tag)
  LOG._setLogsDirForTest(dir)
  try {
    LOG.logEvent("t:seam", { probe: true }) // 正控：读面不可用 ⇒ 零条断言恒真（哨兵先证可读）
    if (logEvents(dir, "t:seam").length !== 1) throw new Error("log read seam not working — zero-event assertions would be vacuous")
    return await fn(dir)
  } finally { LOG._resetLogsDirForTest() }
}

const countIn = (agent, needle) => agent.history.filter((m) => String(m.content).includes(needle)).length

/* ── T-DA17 · 缺陷回归（★ 红→绿）· 首轮签收跨轮存活 ── */
test("T-DA17 · 首轮签收跨轮存活：轮 1 签收 + 工具调用 ⇒ 轮 2 收口无签收仍判覆盖（零重投）", async () => {
  await withLogs("w17", async (dir) => {
    const agent = mkAgent({ _daSession: true })
    const e = entry(3)
    agent._pendingAsyncResults = [e]
    const turn1 = turnSSE("[digest-ack #3] digested — 首轮签收", { finish: "tool_calls", tool: "no_such_tool" })
    await withFetch([sseResponse(turn1), sseResponse(turnSSE("收口轮：本轮无签收行"))], () =>
      CORE.runAgent(agent, "", {}, { autoTurn: true, suspDriven: true }))

    assert.equal(agent._pendingAsyncResults.length, 0, "覆盖 ⇒ 离容器")
    assert.equal(e.report, null, "销账释放 report")
    assert.equal(e.childAgent, null, "销账释放 childAgent")
    assert.equal(e._daFailures, undefined, "零失败（`_daFailures` 缺省）")
    assert.notEqual(e._daRetry, true, "零重投标记")
    assert.equal(countIn(agent, "async subagent #3"), 1, "注入计数 = 1（零重投）")
    assert.equal((agent._unsettledDigests ?? []).length, 0, "零升级")
    assert.equal(logEvents(dir, "ev:unsettled").length, 0, "零升级事件")
  })
})

/* ── T-DA18 · 回归·跨 run 清位 ── */
test("T-DA18 · 跨 run 清位：run A 的签收文本不替 run B 作证", async () => {
  await withLogs("w18", async () => {
    const agent = mkAgent({ _daSession: true })
    await digestRound(agent, "[digest-ack #44] digested — 别家的条") // #44 不属 run A（零判定对象）
    assert.equal(agent._pendingAsyncResults.length, 0, "run A 无条可判")

    const e44 = entry(44)
    agent._pendingAsyncResults = [e44]
    await digestRound(agent, "run B：本轮未给账目")
    assert.equal(e44._daFailures, 1, "上一 run 文本不作证 ⇒ 未覆盖 +1")
    assert.equal(e44._daRetry, true, "重投窗口保留")
    assert.equal(agent._pendingAsyncResults.length, 1, "条留容器（零假覆盖）")
  })
})

/* ── T-DA19 · 回归·未签收照重投（两 runAgent）── */
test("T-DA19 · 未签收照重投：轮 1 无签收 ⇒ 失败 +1 留容器；轮 2 补账 ⇒ 全销", async () => {
  await withLogs("w19", async () => {
    const agent = mkAgent({ _daSession: true })
    const e = entry(19)
    agent._pendingAsyncResults = [e]
    await digestRound(agent, "轮 1：未给账目")
    assert.equal(e._daFailures, 1, "未覆盖 ⇒ 失败 +1")
    assert.equal(e._daRetry, true, "重投标记（下轮消化轮回路）")
    assert.equal(agent._pendingAsyncResults.length, 1, "条留容器")
    assert.equal(e.report, "report-19", "report 保留至销账（重投需原文）")
    assert.equal(e.childAgent, null, "childAgent 已释（投递后）")

    await digestRound(agent, "[digest-ack #19] digested — 补账")
    assert.equal(agent._pendingAsyncResults.length, 0, "轮 2 补账 ⇒ 全销")
    assert.equal(e.report, null, "销账释放 report")
    assert.equal(countIn(agent, "async subagent #19"), 2, "注入计数 = 2（首投 + 重投）")
  })
})

/* ── T-DA20 · 边界·缺痕两臂 ── */
test("T-DA20 · 缺痕两臂：臂 1 零模型轮 ⇒ 全条未覆盖；臂 2 早轮签收 + 撞帽未收口 ⇒ 按累积痕销账", async () => {
  await withLogs("w20", async () => {
    const a1 = mkAgent({ _daSession: true })
    const e1 = entry(201)
    a1._pendingAsyncResults = [e1]
    let thrown1 = null
    try { await CORE.runAgent(a1, "", {}, { autoTurn: true, suspDriven: true, maxTurns: 0 }) } catch (err) { thrown1 = err }
    assert.equal(thrown1?.name, "ContinueError", "臂 1 撞帽径（零模型轮）")
    assert.equal(e1._daFailures, 1, "零输出落痕 ⇒ 未覆盖 +1（安全方向）")
    assert.equal(a1._pendingAsyncResults.length, 1, "零假销账")

    const a2 = mkAgent({ _daSession: true })
    const e2 = entry(202)
    a2._pendingAsyncResults = [e2]
    let thrown2 = null
    try {
      await withFetch([sseResponse(turnSSE("[digest-ack #202] digested — 早轮签收", { finish: "tool_calls", tool: "no_such_tool" }))], () =>
        CORE.runAgent(a2, "", {}, { autoTurn: true, suspDriven: true, maxTurns: 1 }))
    } catch (err) { thrown2 = err }
    assert.equal(thrown2?.name, "ContinueError", "臂 2 撞帽未收口（maxTurns: 1）")
    assert.equal(a2._pendingAsyncResults.length, 0, "按累积痕判定 ⇒ 销账")
    assert.equal(e2.report, null, "销账释放 report")
    assert.equal(e2._daFailures, undefined, "零失败")
  })
})

/* ── 评审轮 2 ② 臂 a · 压缩臂（写点抗 `history` 整体替换）── */
test("窗-臂 a · 压缩臂：run 内 applyCompression（history 整体替换）后早轮签收仍判覆盖", async () => {
  await withLogs("w21", async () => {
    const agent = mkAgent({ _daSession: true })
    const e = entry(203)
    agent._pendingAsyncResults = [e]
    let compressInfo = null
    let heads = 0
    // 驱动 = `consumeInjected` 回合头回调（生产缝）+ F-CC2 `_pendingCompact` 槽：第 2 回合头挂强制压缩
    // ⇒ 早轮签收之后、收口之前触发真实摘要径 `applyCompression`（非缩体面——mode: "summary" 断言钉驱动）。
    const consumeInjected = (a) => {
      heads += 1
      if (heads === 2) a._pendingCompact = { focus: "压缩臂：验写点抗 history 整体替换" }
    }
    let seenCalls = null
    await withFetch([
      sseResponse(turnSSE("[digest-ack #203] digested — 早轮签收", { finish: "tool_calls", tool: "no_such_tool" })),
      sseResponse(turnSSE("压缩摘要（测试桩）")), // 摘要调用（compress 面）
      sseResponse(turnSSE("收口轮：无签收（压缩后）")),
    ], (calls) => {
      seenCalls = calls
      return CORE.runAgent(agent, "", { onCompress: (info) => { compressInfo = info } }, {
        autoTurn: true, suspDriven: true, consumeInjected,
      })
    })

    assert.equal(compressInfo?.mode, "summary", "压缩臂驱动成立：真实摘要径（applyCompression——history 整体替换）")
    assert.ok(agent.history.some((m) => String(m.content).includes("压缩摘要（测试桩）")), "压缩注记在盘（压缩确已发生）")
    assert.equal(seenCalls.length, 3, "恰三次调用（轮 1 ∥ 摘要 ∥ 轮 2）")
    assert.equal(agent._pendingAsyncResults.length, 0, "早轮签收跨压缩存活 ⇒ 覆盖销账")
    assert.equal(e.report, null, "销账释放 report")
    assert.equal(e._daFailures, undefined, "零失败")
  })
})

/* ── 评审轮 2 ② 臂 b · 非会话门（非会话零落痕）── */
test("窗-臂 b · 非会话门：非会话 run（无 `_daSession`）⇒ 零落痕（父字段 ∥ history 双零）", async () => {
  await withLogs("w22", async () => {
    const agent = mkAgent() // headless / 直连 `runAgent` 形——无 `_daSession`
    await withFetch([sseResponse(turnSSE("普通作答（非会话）"))], () => CORE.runAgent(agent, "hi", {}, {}))
    assert.equal(agent._lastRunOutput ?? null, null, "父字段零落痕（逐轮追加写点门）")
    assert.equal(agent.history._lastRunOutput ?? null, null, "history 零落痕（收口单写已废）")
  })
})
