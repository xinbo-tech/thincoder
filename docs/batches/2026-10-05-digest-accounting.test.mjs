/**
 * 2026-10-05-digest-accounting.test.mjs — 批内件（消化账务批 · 台账 #930 · 实施轮）。
 * 任务书 = `docs/batches/2026-10-05-digest-accounting.md` §2（终值）∥ 判据单源 = 设计档 §6.31
 * （`docs/core/design/AGENT-LOOP-ASYNC-POOL.md`）。用例 = §6.31.10 T-DA1–T-DA10 / T-DA12–T-DA14
 * （宿主 = 本档）+ 补充臂（会话标记 / 清账面 / i18n 键 / 常量对读位）；出口缝两腿（T-DA15 ∥ T-DA16）已拆档
 * 至 `docs/batches/2026-10-05-digest-accounting-exit-seam.test.mjs`（T-DA15 = 出口缝修正——idle 清场投递账过滤 · #41 披露① ∥ T-DA16 = fallback 支投递账分区 + 清场单遍分区 · #44 披露①扩散面 ∥ 披露④ · 父侧裁定 2026-10-05）。
 * 行数注（内容口径）：本档 408 行 ∥ 出口缝档 165 行（拆前 502 行——500 行硬门拆分；读取器显示值 +1）。
 * 平 node 直驱（核侧全真件——无假件替身）：投递面 = `beginRun`（run-start）∥ 落痕 = turn-loop
 * （同点直写）∥ 见账 = `finalizeAgentTurn`（run-stages）——三面皆经真 `runAgent` 一轮贯通；
 * 模型面 = `globalThis.fetch` 桩（SSE 字节）⇒ 零网络 / 零真实等待。
 * 跑法（仓根 `thincoder/`）：node --test docs/batches/2026-10-05-digest-accounting.test.mjs
 * 先红后绿：账目覆盖（T-DA1）/ 重投（T-DA2）/ 升级（T-DA5）/ 缺席支（T-DA13）四腿在改前码上
 * 给出红读（读数 = 批档 §5）；出口缝两腿（T-DA15 ∥ T-DA16）红读同 §5（腿已拆至出口缝档）。
 */
import test, { after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = fileURLToPath(new URL("../../", import.meta.url)) // 仓根（thincoder/）
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)

const CORE = await mod("thincoder-core/agent.mjs") // runAgent / createAgent / ContinueError
const ACCOUNT = await mod("thincoder-core/agent/digest-account.mjs") // 账务单件（判据单源）
const SUSP = await mod("thincoder-core/agent/suspension.mjs") // poolLive / startSuspension
const STAGES = await mod("thincoder-core/agent/run-stages.mjs") // injectResponseReminders
const COMPLETION = await mod("thincoder-core/agent/completion.mjs") // handleCompletion（F-DA6）
const QUERY = await mod("thincoder-core/agent-tools/subagent-actions-query.mjs") // status 面
const ANTHROPIC = await mod("thincoder-core/provider/anthropic.mjs")
const GOOGLE = await mod("thincoder-core/provider/google.mjs")
const RESPONSES = await mod("thincoder-core/provider/responses.mjs")
const LOG = await mod("thincoder-core/log.mjs")
const I18N = await mod("thincoder-core/i18n.mjs")

const SANDBOX = mkdtempSync(join(tmpdir(), "da-batch-"))
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
const REQ_PREFIX = "[System reminder: digest accounting"

/* ── T-DA1 · 正常·全覆盖销账（账目覆盖腿——先红后绿）── */
test("T-DA1 · 全覆盖销账：三行 ack ⇒ 三条全离容器 ∥ 零提醒/零事件/零残余", async () => {
  await withLogs("da1", async (dir) => {
    const agent = mkAgent({ _daSession: true })
    const [e1, e2, e3] = [entry(11), entry(12), entry(13)]
    agent._pendingAsyncResults = [e1, e2, e3]
    const ack = "[digest-ack #11] digested — 要点 a\n[digest-ack #12] digested — 要点 b\n[digest-ack #13] deferred — 原因 c"
    await digestRound(agent, ack)

    assert.equal(agent._pendingAsyncResults.length, 0, "覆盖 ⇒ 三条全离容器")
    assert.equal(e1.childAgent, null, "销账释放 childAgent（report 同释）")
    assert.equal(e1.report, null, "销账释放 report")
    assert.equal(e1._daRetry, false, "`_daRetry` 全清（投递后即清）")
    assert.equal(ACCOUNT.unsettledCount(agent), 0, "零残余（端面残余行判据 = 0）")
    assert.equal((agent._unsettledDigests ?? []).length, 0, "零升级")
    assert.equal(logEvents(dir, "ev:unsettled").length, 0, "零事件")
    assert.equal(countIn(agent, "never accounted"), 0, "零提醒")
    // 投递面：两条报告先落（先投递）∥ 账目要求行后拼（清单 = 全部未销账 id）
    const req = agent.history.find((m) => String(m.content).startsWith(REQ_PREFIX))
    assert.ok(req, "消化轮账目要求行在场（会话态消化轮）")
    assert.ok(req.content.includes("Not yet accounted: #11, #12, #13"), "清单 = 未销账 id 逐条")
    assert.equal(req.transient, true, "transient（机器线独有）")
    assert.ok(agent.history.indexOf(req) > agent.history.findIndex((m) => String(m.content).includes("async subagent #11")), "先投递后拼清单")
    assert.equal(countIn(agent, "[digest-ack #11] digested — 要点 a"), 1, "零工具轮纯文本判据可满足（逐字在盘）")
  })
})

/* ── T-DA2 · 正常·重投补账（重投腿——先红后绿）── */
test("T-DA2 · 重投补账：轮 1 缺 #22 ⇒ 留容器 `_daRetry`；轮 2 补投补账 ⇒ 全销", async () => {
  const agent = mkAgent({ _daSession: true })
  const [e21, e22] = [entry(21), entry(22)]
  agent._pendingAsyncResults = [e21, e22]
  await digestRound(agent, "[digest-ack #21] digested — a")

  assert.deepEqual(agent._pendingAsyncResults.map((e) => e.id), [22], "未覆盖条留容器")
  assert.equal(e22._daFailures, 1, "未覆盖 ⇒ 失败 +1")
  assert.equal(e22._daRetry, true, "重投标记（下轮消化轮回路）")
  assert.equal(e22.childAgent, null, "投递后仅释放 childAgent")
  assert.equal(e22.report, "report-22", "report 保留至销账/升级（重投需原文）")

  await digestRound(agent, "[digest-ack #21] digested — a\n[digest-ack #22] digested — b")
  assert.equal(agent._pendingAsyncResults.length, 0, "轮 2 补账 ⇒ 全销")
  assert.equal(countIn(agent, "async subagent #22"), 2, "#22 恰两投（首投 + 重投）")
  assert.equal(countIn(agent, "async subagent #21"), 1, "#21 恰一投（覆盖条零重投）")
})

/* ── T-DA3 · 正常·用户回合投递不销账 ── */
test("T-DA3 · 用户回合投递不销账：留容器（`_daDelivered`）；下一消化轮补账", async () => {
  const agent = mkAgent({ _daSession: true })
  const e = entry(31)
  agent._pendingAsyncResults = [e]
  await withFetch([sseResponse(turnSSE("用户回合作答"))], () => CORE.runAgent(agent, "hello", {}, { suspDriven: true }))

  assert.equal(e._daDelivered, true, "任意回合首投（投递面）")
  assert.equal(agent._pendingAsyncResults.length, 1, "用户回合不销账 ⇒ 留容器")
  assert.equal(countIn(agent, REQ_PREFIX), 0, "非消化轮不发账目要求行")

  await digestRound(agent, "[digest-ack #31] deferred — 留待处理")
  assert.equal(agent._pendingAsyncResults.length, 0, "消化轮补账 ⇒ 销（`deferred` 亦计覆盖）")
})

/* ── T-DA4 · 边界·防重复注入 ── */
test("T-DA4 · 防重复注入：`_daDelivered ∧ ¬_daRetry` ⇒ 不重复注入；账目仍判定", async () => {
  const agent = mkAgent({ _daSession: true })
  const e = entry(41)
  agent._pendingAsyncResults = [e]
  await withFetch([sseResponse(turnSSE("首投回合"))], () => CORE.runAgent(agent, "hi", {}, { suspDriven: true }))
  await digestRound(agent, "[digest-ack #41] digested — ok")

  assert.equal(countIn(agent, "async subagent #41"), 1, "注入计数 = 1（skip 后补账可销）")
  assert.equal(agent._pendingAsyncResults.length, 0, "skip 不碍账目判定")
})

/* ── T-DA5 · 错误·超限升级（升级腿——先红后绿）── */
test("T-DA5 · 超限升级：三轮未覆盖 ⇒ 离容器入账本 ∥ 恰一条提醒 + 恰一条 ev:unsettled", async () => {
  await withLogs("da5", async (dir) => {
    const agent = mkAgent({ _daSession: true })
    const e = entry(51)
    agent._pendingAsyncResults = [e]
    for (let i = 1; i <= 3; i++) await digestRound(agent, `轮 ${i}：未给账目`)

    assert.equal(e._daFailures, 3, "三轮未覆盖 ⇒ failures = 3")
    assert.equal(agent._pendingAsyncResults.length, 0, "升级 ⇒ 离容器")
    assert.equal(countIn(agent, "async subagent #51"), 3, "总投递 = 3（上限封顶）")
    const ledger = agent._unsettledDigests
    assert.equal(ledger.length, 1, "入升级账本")
    assert.deepEqual(
      { id: ledger[0].id, role: ledger[0].role, failures: ledger[0].failures },
      { id: "51", role: "subagent", failures: 3 },
      "账本行 `{ id, role, failures, report, at }`",
    )
    assert.equal(ledger[0].report, "report-51", "报告随升级保留（可接手）")
    const expected = "[System reminder: 1 background report(s) were delivered but never accounted after 3 digest rounds — automatic re-delivery has stopped and they are marked UNSETTLED: #51. Their content was delivered in this conversation; process them there or re-spawn the work. Readable via subagent action:'status'.]"
    assert.equal(agent.history.filter((m) => m.content === expected).length, 1, "恰一条升级提醒（逐字）")
    const events = logEvents(dir, "ev:unsettled")
    assert.equal(events.length, 1, "恰一条 ev:unsettled")
    assert.equal(events[0].n, 1, "字段 n")
    assert.equal(events[0].ids, "51", "字段 ids")
    assert.equal(SUSP.poolLive(agent), false, "升级后池可退（账本不入 poolLive）")
  })
})

/* ── T-DA6 · 边界·升级即终结 ── */
test("T-DA6 · 升级即终结：再开消化轮 ⇒ 零重投（账目终态）∥ poolLive 不含", async () => {
  const agent = mkAgent({ _daSession: true })
  agent._unsettledDigests = [{ id: "61", role: "subagent", failures: 3, report: "r", at: Date.now() }]
  agent._pendingAsyncResults = []
  await digestRound(agent, "又一轮（无条目可投）")
  assert.equal(agent._pendingAsyncResults.length, 0, "零重投（离容器已达终态）")
  assert.equal(agent._unsettledDigests.length, 1, "账本存续（可读可接手）")
  assert.equal(SUSP.poolLive(agent), false, "会话可退（账本不计 poolLive）")
})

/* ── T-DA7 · 边界·fallback 零回归 ── */
test("T-DA7 · fallback（无 `_daSession`）：splice 取尽 + 注入 + 双释放；零账目动作", async () => {
  await withLogs("da7", async (dir) => {
    const agent = mkAgent() // 无会话标记（headless / 直连 runAgent 形）
    const [e1, e2] = [entry(71), entry(72)]
    agent._pendingAsyncResults = [e1, e2]
    await digestRound(agent, "普通作答")

    assert.equal(agent._pendingAsyncResults.length, 0, "splice 取尽（旧行为逐字）")
    assert.equal(e1.childAgent, null, "注入即释放 childAgent")
    assert.equal(e1.report, null, "注入即释放 report（双释放）")
    assert.equal(e1._daDelivered, undefined, "零账目动作（无投递账）")
    assert.equal(countIn(agent, REQ_PREFIX), 0, "fallback 零账目要求行")
    assert.equal((agent._unsettledDigests ?? []).length, 0, "零升级账本")
    assert.equal(logEvents(dir, "ev:unsettled").length, 0, "零事件")
  })
})

/* ── T-DA8 · 边界·输出缺痕 ── */
test("T-DA8 · 输出缺痕（撞帽未收口）：全条失败 +1（重投窗口保留）；零假销账", async () => {
  const agent = mkAgent({ _daSession: true })
  const e = entry(81)
  agent._pendingAsyncResults = [e]
  let thrown = null
  try { await CORE.runAgent(agent, "", {}, { autoTurn: true, suspDriven: true, maxTurns: 0 }) } catch (err) { thrown = err }

  assert.equal(thrown?.name, "ContinueError", "撞帽径（未收口）")
  assert.equal(e._daDelivered, true, "投递已行（起跑窗）")
  assert.equal(e._daFailures, 1, "缺痕 ⇒ 未覆盖 +1（安全方向）")
  assert.equal(e._daRetry, true, "重投窗口保留")
  assert.equal(agent._pendingAsyncResults.length, 1, "零假销账（条留容器）")
})

/* ── T-DA9 · 边界·机检反例（账目解析器逐条）── */
test("T-DA9 · 机检反例：仅 id 无标记 / 仅标记无 id / 跨行 / 词界不吻合 ⇒ 皆不计覆盖", () => {
  assert.equal(ACCOUNT.coversDigestId("[digest-ack #12] digested — x", 12), true, "标记 + id（词界吻合）")
  assert.equal(ACCOUNT.coversDigestId("输出里提到 #12 但无标记", 12), false, "仅 id 无标记 ⇒ 不计")
  assert.equal(ACCOUNT.coversDigestId("[digest-ack] 无 id", 12), false, "仅标记无 id ⇒ 不计")
  assert.equal(ACCOUNT.coversDigestId("[digest-ack #123] digested — x", 12), false, "词界反例（`#12` ⊆ `#123`）⇒ 不计")
  assert.equal(ACCOUNT.coversDigestId("[digest-ack #12] x / [digest-ack #1] y", 1), true, "行内长 id 首现不吞后随正例（出现位续扫）")
  assert.equal(ACCOUNT.coversDigestId("[digest-ack #1] x\n#12 另起一行", 12), false, "跨行不合成（同一行判据）")
  assert.equal(ACCOUNT.coversDigestId("", 12), false, "空文本 ⇒ 不计")
  assert.equal(ACCOUNT.isDigestRound({ autoTurn: true }), true, "回合分类：消化轮")
  assert.equal(ACCOUNT.isDigestRound({ autoTurn: true, upstreamTurn: true }), false, "上行唤醒轮不属消化轮")
  assert.equal(ACCOUNT.isDigestRound({ autoTurn: true, timerTurn: true }), false, "timer 轮不属消化轮")
  assert.equal(ACCOUNT.isDigestRound({}), false, "用户回合不属消化轮")
})

/* ── T-DA10 · 正常·status 可见 ── */
test("T-DA10 · status 可见：unsettled 段三态行在场；单查 id 同解析；三处皆无 ⇒ 原错误文案", () => {
  const agent = mkAgent()
  agent._pendingAsyncResults = [
    entry(91, { _daDelivered: true }),
    entry(92, { _daDelivered: true, _daFailures: 1, _daRetry: true }),
  ]
  agent._unsettledDigests = [{ id: "93", role: "advisor", failures: 3, report: "R".repeat(500), at: Date.now() }]
  const overview = JSON.parse(QUERY.executeStatusAction({}, { agent, depth: 0 })).overview
  assert.deepEqual(
    overview.unsettled.map((r) => [r.id, r.state, r.attempts]),
    [["91", "awaiting-digest", 0], ["92", "retrying", 1], ["93", "unsettled", 3]],
    "三态行：在途未判 / 判过未覆盖 / 已升级",
  )
  assert.equal(overview.unsettled[2].preview.length, 400, "升级行 preview ≤400 字符")
  assert.equal(JSON.parse(QUERY.executeStatusAction({ id: "92" }, { agent, depth: 0 })).state, "retrying", "单查落 pending 同解析")
  assert.equal(JSON.parse(QUERY.executeStatusAction({ id: "93" }, { agent, depth: 0 })).state, "unsettled", "单查落升级账本同解析")
  assert.equal(
    JSON.parse(QUERY.executeStatusAction({ id: "999" }, { agent, depth: 0 })).error,
    "unknown async subagent id: 999",
    "三处皆无 ⇒ 原错误文案不变",
  )
})

/* ── T-DA12 · 正常·F-DA5 归一（四 transport 真件直驱）── */
test("T-DA12 · F-DA5 归一：anthropic 四类 / google 两类 + 透传 / responses completed；同轮零缺席提醒", async () => {
  const anthropicSSE = (reason) =>
    `event: message_start\ndata: ${JSON.stringify({ type: "message_start", message: { usage: { input_tokens: 5 } } })}\n\n` +
    `event: content_block_delta\ndata: ${JSON.stringify({ type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "hi" } })}\n\n` +
    `event: message_delta\ndata: ${JSON.stringify({ type: "message_delta", delta: { stop_reason: reason }, usage: { output_tokens: 3 } })}\n\n` +
    `event: message_stop\ndata: ${JSON.stringify({ type: "message_stop" })}\n\n`
  const aProvider = { model: "claude-sonnet-4-5", apiKey: "k", baseURL: "http://127.0.0.1:1", format: "anthropic" }
  for (const [raw, mapped] of [["end_turn", "stop"], ["stop_sequence", "stop"], ["tool_use", "tool_calls"], ["max_tokens", "length"], ["refusal", "refusal"]]) {
    const res = await withFetch([sseResponse(anthropicSSE(raw))], () => ANTHROPIC.chat(aProvider, { messages: [{ role: "user", content: "x" }] }))
    assert.equal(res.finishReason, mapped, `anthropic stop_reason「${raw}」⇒「${mapped}」`)
  }

  const geminiSSE = (reason) =>
    `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: "hi" }] }, finishReason: reason }], usageMetadata: { promptTokenCount: 3, candidatesTokenCount: 1, totalTokenCount: 4 } })}\n\n`
  const gProvider = { model: "gemini-2.5-flash", apiKey: "k", baseURL: "http://127.0.0.1:1", format: "google" }
  for (const [raw, mapped] of [["STOP", "stop"], ["MAX_TOKENS", "length"], ["SAFETY", "SAFETY"]]) {
    const res = await withFetch([sseResponse(geminiSSE(raw))], () => GOOGLE.chat(gProvider, { messages: [{ role: "user", content: "x" }] }))
    assert.equal(res.finishReason, mapped, `google finishReason「${raw}」⇒「${mapped}」`)
  }

  const done = await RESPONSES.parseStream({ body: [enc.encode(`data: ${JSON.stringify({ type: "response.completed", response: { id: "r1" } })}\n\n`)] }, {})
  assert.equal(done.finishReason, "stop", "responses completed ⇒ stop（原恒 null）")
  const incomplete = await RESPONSES.parseStream({ body: [enc.encode(`data: ${JSON.stringify({ type: "response.incomplete", response: { incomplete_details: { reason: "max_output_tokens" } } })}\n\n`)] }, {})
  assert.equal(incomplete.finishReason, "length", "incomplete 两值既判零变（max_output_tokens）")
  const filtered = await RESPONSES.parseStream({ body: [enc.encode(`data: ${JSON.stringify({ type: "response.incomplete", response: { incomplete_details: { reason: "content_filter" } } })}\n\n`)] }, {})
  assert.equal(filtered.finishReason, "content_filter", "incomplete 两值既判零变（content_filter）")

  await withLogs("da12", async (dir) => {
    const agent = mkAgent()
    for (const finishReason of ["stop", "tool_calls"]) {
      STAGES.injectResponseReminders(agent, { content: "x", toolCalls: [], finishReason })
    }
    assert.equal(countIn(agent, "ended without a finish signal"), 0, "归一值在场 ⇒ 零缺席提醒（非 stop 异常面零触）")
    assert.equal(logEvents(dir, "ev:finish-missing").length, 0, "零 ev:finish-missing")
  })
})

/* ── T-DA13 · 错误·F-DA5 缺席（缺席支腿——先红后绿）── */
test("T-DA13 · 缺席显式化：clean end 缺 finish_reason ⇒ 提醒恰一条 + ev:finish-missing 恰一条；partial/interrupted 零触", async () => {
  await withLogs("da13", async (dir) => {
    const agent = mkAgent()
    await withFetch([sseResponse(`data: ${JSON.stringify({ choices: [{ delta: { content: "半截作答" } }] })}\n\ndata: [DONE]\n\n`)], () => CORE.runAgent(agent, "hi", {}, {}))
    assert.equal(countIn(agent, "the previous turn ended without a finish signal"), 1, "同面提醒恰一条")
    const events = logEvents(dir, "ev:finish-missing")
    assert.equal(events.length, 1, "恰一条 ev:finish-missing")
    assert.equal(events[0].turn, 1, "字段 turn")
    assert.equal(events[0].auto, false, "字段 auto")
    assert.equal("child" in events[0], false, "depth-0 无 child 字段（undefined 不落盘）")

    const clean = mkAgent()
    STAGES.injectResponseReminders(clean, { content: "x", toolCalls: [], finishReason: null, partial: true })
    STAGES.injectResponseReminders(clean, { content: "x", toolCalls: [], finishReason: null, interrupted: true })
    assert.equal(countIn(clean, "ended without a finish signal"), 0, "partial / interrupted ⇒ 零提醒")
    assert.equal(logEvents(dir, "ev:finish-missing").length, 1, "窗口外零新增事件")
  })
})

/* ── T-DA14 · 错误·F-DA6 空停 ── */
test("T-DA14 · 空停显式化：纯空白 ⇒ 空响应支（≤2）后抛；非空半句零触", () => {
  const mkA = () => ({ history: [], config: { agent: {} }, tasks: [], provider: { model: "m" } })
  const blank = mkA()
  for (let i = 1; i <= 2; i++) {
    const r = COMPLETION.handleCompletion(blank, { content: " \n\t ", toolCalls: [] }, 0, 0, 0, false, 0, {})
    assert.equal(r.action, "continue", `纯空白第 ${i} 次 ⇒ 空响应重试臂`)
  }
  assert.equal(blank._emptyRetries, 2, "重试预算用满（MAX_EMPTY_RETRIES = 2）")
  assert.throws(() => COMPLETION.handleCompletion(blank, { content: "\u00a0\u2003", toolCalls: [] }, 0, 0, 0, false, 0, {}), /empty response/, "用尽 ⇒ 抛（fail-loud）")
  const half = mkA()
  const r = COMPLETION.handleCompletion(half, { content: "半句话就停了", toolCalls: [] }, 0, 0, 0, false, 0, {})
  assert.equal(r.action, "done", "非空半句 ⇒ 零触（信号层不可分辨——登记边界不做）")
})

/* ── 补充臂 · 会话标记 / 清账面 / 常量面（单件读数）── */
test("补充臂 · 会话标记：startSuspension 置真 / 退出复位 ∥ 中止清升级账本（会话 + 回合两径）", async () => {
  const observ = []
  const agent = mkAgent()
  agent._pendingAsyncResults = [entry(101)]
  const handle = SUSP.startSuspension({
    carrier: agent,
    abortSignal: null,
    runTurn: async () => { observ.push(agent._daSession) },
    injectResidual: async () => {},
  })
  agent._pendingAsyncResults = [] // 消化轮后条目离容（模拟见账销账——驱动自然退出）
  await handle.done
  assert.deepEqual(observ, [true], "会话期 `_daSession` = true（runTurn 观测点）")
  assert.equal(agent._daSession, false, "退出复位（会话外回 fallback 语义）")

  const agent2 = mkAgent()
  agent2._unsettledDigests = [{ id: "x", role: "subagent", failures: 3, report: "r", at: Date.now() }]
  const ctl = new AbortController()
  ctl.abort(Object.assign(new Error("stop"), { abortTrigger: "stop" }))
  const h2 = SUSP.startSuspension({ carrier: agent2, abortSignal: ctl.signal, runTurn: async () => {}, injectResidual: async () => {} })
  const res2 = await h2.done
  assert.equal(res2.reason, "aborted", "中止径（finishSuspension aborted 分支）")
  assert.deepEqual(agent2._unsettledDigests, [], "会话中止 ⇒ 升级账本随 pending 一并清（旧账不续）")

  const agent3 = mkAgent({ _daSession: true })
  const e3 = entry(103)
  agent3._pendingAsyncResults = [e3]
  agent3._unsettledDigests = [{ id: "y", role: "subagent", failures: 3, report: "r", at: Date.now() }]
  const aborted = new AbortController()
  aborted.abort(new Error("user stop"))
  let thrown3 = null
  try { await CORE.runAgent(agent3, "", {}, { autoTurn: true, suspDriven: true, signal: aborted.signal }) } catch (err) { thrown3 = err }
  assert.equal(thrown3?.name, "AbortError", "回合中止径")
  assert.deepEqual(agent3._unsettledDigests, [], "run-stages 中止分支同清（与 pending 同判）")
  assert.equal(e3._daFailures, undefined, "会话停止径不判账（清场语义归 finishSuspension）")

  // 常量 / i18n 面（端面消费单源）
  assert.equal(ACCOUNT.DA_RETRY_LIMIT, 2, "重投上限 N = 2（总投递 ≤3）")
  assert.equal(I18N.t("digest.residue", { n: 2 }, "zh"), "有 2 份后台报告未销账——将自动重投", "核键 zh（端面残余行行文单源）")
  assert.equal(I18N.t("digest.residue", { n: 2 }, "en"), "2 background report(s) not accounted — they will be re-delivered", "核键 en")
  assert.equal(ACCOUNT.digestAccountRequirement([7]), ACCOUNT.digestAccountRequirement([7]), "要求行拼装幂等")
  assert.ok(ACCOUNT.digestAccountRequirement([7, 8]).includes("Not yet accounted: #7, #8."), "清单形态逐条（#<id>）")
})
