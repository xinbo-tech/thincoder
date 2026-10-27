/**
 * context-overflow-guard.test.mjs — 集成用例 11-1 … 11-9（`test/RTM.md` CLI 端故事 11「超窗守卫与内部阶段豁免」；
 * 用例设计 = 批档 §2「集成测试设计（delta vs `test/RTM.md`）」；机制正文 = `docs/core/design/CONTEXT-COMPACTION.md` §6.17）。
 *
 * 业务入口两档（都是用户真会走的那条路）：
 *  - 11-1 / 11-2 / 11-4 / 11-6 / 11-7 / 11-8 = **真会话链路**：`runAgent`（prepareRun → 安全点守卫 → 压缩 → 发送面净判 → 回执）；
 *  - 11-3 / 11-9 = 安全点（`runCompactionCheck`）∥ 发送面（`chat`）按回合环同序（`agent/turn-loop.mjs:143-147`）——
 *    该行设计的交互组件就是「预算面 ↔ 发送面」与「`splitHistory` 无中段支 → `shrinkOversized`」，故不进会话层。
 *
 * 模型侧 = `node:http` 本机假 OpenAI SSE 端点 + 请求体留档（先例 `test/integration/review-doc-scope.test.mjs:27-52`）；
 * 零外网、零付费端点、零 `globalThis.fetch` 桩（走真 transport：`chat` → `proxyFetch` 直连分支 → 本机 127.0.0.1）。
 *
 * 断言口径 = 用户看到什么：压缩出现几次（面板事件）· 回合请求发没发出（桩计数）· 报错带哪几个实数 ·
 * 有没有收到服务端 400。不断言内部函数返回值。
 *
 * 全局夹具（隔离工作目录 / 日志目录）在本档载入时建立，由 `after` 兜底清理——与本档逐例的 `t.after` 两套生命周期。
 */
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { createServer } from "node:http"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { createAgent, runAgent } from "../../thincoder-core/agent.mjs"
import { runCompactionCheck } from "../../thincoder-core/agent/run-stages.mjs"
import { chat } from "../../thincoder-core/provider/core.mjs"
import { ASCII_CHARS_PER_TOKEN } from "../../thincoder-core/provider/rate.mjs"
import { contextUsage } from "../../thincoder-core/token-window.mjs"
import { _resetLogsDirForTest, _setLogsDirForTest } from "../../thincoder-core/log.mjs"

// ---------- 夹具 ----------

/** 压缩摘要请求的识别锚 = `SUMMARIZE_PROMPT` 首句（唯一一处走 `stage:"compress"` 的载荷）。 */
const SUMMARIZE_SIG = "The conversation above is our work log so far"

/** 估算 n token 的 ASCII 载荷（`_estimateSingle`：`ASCII_CHARS_PER_TOKEN` 字符 / token——常量单源，不硬编码）。 */
const asciiTokens = (n) => "x".repeat(n * ASCII_CHARS_PER_TOKEN)

/**
 * 40 条短历史 + 一条巨消息落在中段（索引 20）——压缩切分把中段摘掉就落到线下。
 * 与批内单测同形夹具（`docs/batches/2026-10-26-context-overflow-absent.test.mjs`），此处不复用文件：
 * 单测档收口即删，集成档须自持。
 */
const historyWithGiant = (tokens, { giantAt = 20, len = 40 } = {}) => {
  const history = Array.from({ length: len }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: `m${i}` }))
  history[giantAt] = { role: "user", content: asciiTokens(tokens) }
  return history
}

const isCompressRequest = (body) => String(body?.messages?.at(-1)?.content ?? "").startsWith(SUMMARIZE_SIG)

/** 40 条短消息：可摘中段在、token 量极小——11-6 / 11-8 的 `history` 面（复刻 `#1833` 现场：`history` 只一百来 token）。 */
const shortHistory = (len = 40) => Array.from({ length: len }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: `m${i}` }))

/**
 * 11-7 的夹具：可摘中段（索引 20 的巨消息）+ 尾部一条工具结果。
 * 尾部 = 最近 `keepTail` 条（1M 窗口 40 条 ⇒ 16）——工具结果落在其中，压缩只摘中段，结果随 tail 逐字保留；
 * 回合请求里仍带着它，回复才引得至（业务可观察：压缩没把用户依赖的结果吃掉）。
 */
const historyWithGiantAndTailResult = (tokens, result = "PINEAPPLE-42") => {
  const history = historyWithGiant(tokens)
  history[38] = { role: "assistant", content: "", tool_calls: [{ id: "call_probe", type: "function", function: { name: "bulk_probe", arguments: "{}" } }] }
  history[39] = { role: "tool", tool_call_id: "call_probe", content: result }
  return history
}

/** 回合请求里最后一条工具结果（桩把它拼回回复 ⇒ 「回复引用工具结果」落在文本上）。 */
const lastToolResult = (body) => String((body?.messages ?? []).filter((m) => m?.role === "tool").at(-1)?.content ?? "(no tool result)")

/**
 * 巨型工具 schema：`description` 的估算 ≈ `tokens`（估算式 = 3 ASCII 字符 / token）——把固定开销（`system + tools`）
 * 抬过压缩线，复刻 `#1833` 的「固定开销吃掉阈值」格。工具永不入调用面（桩只回文本，或只派 `context`）。
 */
const giantTool = (tokens) => ({
  name: "bulk_probe",
  description: asciiTokens(tokens),
  parameters: { type: "object", properties: {}, additionalProperties: false },
  readonly: true,
  execute: async () => "ok",
})

/** 工具调用帧（OpenAI 形：`delta.tool_calls` + `finish_reason:"tool_calls"`）——模型主动压缩那一路的载荷。 */
const toolCallChunks = (call) => [
  { choices: [{ delta: { tool_calls: [{ index: 0, id: call.id, type: "function", function: { name: call.name, arguments: JSON.stringify(call.args ?? {}) } }] }, finish_reason: null }] },
  { choices: [{ delta: {}, finish_reason: "tool_calls" }] },
]

/**
 * 假 OpenAI 端点：每个请求留档（`{ compress, body, status }`），回 SSE 文本或 HTTP 错误。
 * `handler(record)` 返回 `{ content }`（200 + SSE）∥ `{ toolCall }`（200 + SSE 工具调用）∥ `{ status, text }`（HTTP 错误）。
 */
function providerStub(handler) {
  const requests = []
  const server = createServer((req, res) => {
    let raw = ""
    req.on("data", (chunk) => { raw += chunk })
    req.on("end", () => {
      let body = null
      try { body = JSON.parse(raw) } catch { body = null }
      const record = { compress: isCompressRequest(body), body, status: null }
      requests.push(record)
      const reply = handler(record)
      record.status = reply.status ?? 200
      if (reply.status) {
        res.writeHead(reply.status, { "content-type": "application/json" })
        res.end(reply.text ?? "")
        return
      }
      res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" })
      if (reply.toolCall) {
        for (const chunk of toolCallChunks(reply.toolCall)) res.write(`data: ${JSON.stringify(chunk)}\n\n`)
        res.write("data: [DONE]\n\n")
        res.end()
        return
      }
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: reply.content ?? "" }, finish_reason: null }] })}\n\n`)
      res.write(`data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: "stop" }] })}\n\n`)
      res.write("data: [DONE]\n\n")
      res.end()
    })
  })
  const ready = new Promise((done) => server.listen(0, "127.0.0.1", () => done(server.address().port)))
  return ready.then((port) => ({
    port,
    requests,
    close: () => new Promise((done) => { server.closeAllConnections?.(); server.close(() => done()) }),
  }))
}

/** 隔离的会话工作目录（无 git / 无 AGENTS.md / 无索引 ⇒ 注入面最小、读数可复现）。 */
const cwd = mkdtempSync(join(tmpdir(), "ctx-overflow-int-"))
const logsDir = mkdtempSync(join(tmpdir(), "ctx-overflow-int-logs-"))
_setLogsDirForTest(logsDir)
after(() => {
  _resetLogsDirForTest()
  rmSync(cwd, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
  rmSync(logsDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
})

/** 真会话场景：假 provider + `createAgent`（`deepseek-flash` 无 `maxTokens` ⇒ absent 档）。 */
async function session(t, { history = [], handler, model = "deepseek-flash", compactThreshold, tools = [] }) {
  const stub = await providerStub(handler)
  t.after(() => stub.close())
  const provider = { model, baseURL: `http://127.0.0.1:${stub.port}`, apiKey: "sk-test" }
  const agent = createAgent({
    provider,
    tools,
    config: { agent: compactThreshold == null ? {} : { compactThreshold }, traces: { enabled: false } },
    cwd,
    history,
  })
  const events = { compress: [], start: [], fail: [] }
  const callbacks = {
    onCompress: (info) => events.compress.push(info),
    onCompressStart: (info) => events.start.push(info),
    onCompressFail: (error) => events.fail.push(String(error?.message ?? error)),
  }
  return { stub, provider, agent, events, callbacks }
}

const compressCalls = (stub) => stub.requests.filter((r) => r.compress)
const turnCalls = (stub) => stub.requests.filter((r) => !r.compress)

// ---------- 用例 ----------

test('11-1 CLI 会话估算越线：压缩出现一次、回合请求照发、无 400', { timeout: 120_000 }, async (t) => {
  const s = await session(t, {
    history: historyWithGiant(620_000),
    // 显式压缩线 750,000 抬到估算之上 ⇒ 阈值面早退，那一次压缩只可能来自**安全点守卫**
    // （620,039 > limit 616,000）——量的就是本批 ① 的那一跳。
    compactThreshold: 750_000,
    handler: ({ compress }) => ({ content: compress ? "SUMMARY: earlier work compressed." : "handled" }),
  })

  const answer = await runAgent(s.agent, "continue", s.callbacks)

  assert.equal(answer, "handled", "用户拿到答复（不是被守卫拦下的错误）")
  assert.equal(s.events.start.length, 1, "面板收到一次「开始压缩」")
  assert.equal(s.events.compress.length, 1, "面板收到一次「压缩完成」")
  assert.equal(s.events.compress[0].mode, "summary", "那一次是真摘要压缩（不是确定性降级）")
  assert.deepEqual(s.events.fail, [], "零压缩失败")

  assert.equal(compressCalls(s.stub).length, 1, "压缩请求恰一次（stage:compress 的 fetch）")
  assert.equal(turnCalls(s.stub).length, 1, "回合请求恰一次")
  assert.equal(s.stub.requests[0].compress, true, "压缩在回合请求之前（先压再发）")
  assert.ok(s.stub.requests.every((r) => r.status === 200), "零 400")
  const turn = turnCalls(s.stub)[0]
  assert.ok(turn.body.messages.some((m) => m.content === "continue"), "用户新发的那条消息随回合请求发出")
  assert.ok(s.stub.requests.every((r) => r.body.max_tokens === undefined), "absent 语义不动——本批仍不发 max_tokens")
})

test('11-2 摘要超长压后仍越线：一条带三实数的错误、回合请求零发、无 400', { timeout: 120_000 }, async (t) => {
  const s = await session(t, {
    history: historyWithGiant(620_000),
    // 同上：阈值面早退，这次压缩由守卫强压一次；摘要桩回 700,000-token 内容
    // （"y".repeat(2_100_000)，ASCII/4）⇒ 压后仍 > limit 616,000。
    compactThreshold: 750_000,
    handler: ({ compress }) => ({ content: compress ? "y".repeat(2_800_000) : "should never be sent" }),
  })

  const error = await runAgent(s.agent, "continue", s.callbacks).then(() => null, (e) => e)

  assert.ok(error, "压后仍越线必须当场报错")
  assert.equal(error.kind, "context_overflow", "错误分类 = 上下文超限")
  assert.equal(error.retryable, false, "不可重试（同一条请求不再重发）")
  const prompt = Number(/prompt ~(\d+) tokens/.exec(error.message)?.[1])
  assert.ok(prompt > 690_000, `三实数之一：prompt 估算 ${prompt} 取自压缩后的超长摘要（≈700,000），远超 limit 616,000`)
  assert.match(error.message, /max_tokens not sent/, "三实数之二：max_tokens 未发（absent 档）")
  assert.match(error.message, /window 1000000 \(limit 616000\)/, "三实数之三：窗口 / 上限")
  assert.doesNotMatch(error.message, /LLM API error/, "是本地拒绝，不是服务端 400 回执")

  assert.equal(compressCalls(s.stub).length, 1, "那一次强压确实发过（否则「压后仍超」不成立）")
  assert.equal(turnCalls(s.stub).length, 0, "回合请求零发（越窗请求没交给服务端）")
  assert.ok(s.stub.requests.every((r) => r.status === 200), "零 400")
})

test('11-3 absent 档：越线强压一次后照发；未越线零压缩——deepseek 形状与退化档各验', { timeout: 120_000 }, async (t) => {
  // 安全点 ∥ 发送面（`agent/turn-loop.mjs:119-131` 同序）：非会话层——本行的交互组件就是这两面。
  const safetyPoint = async (model, tokens, handler) => {
    const stub = await providerStub(handler)
    t.after(() => stub.close())
    const provider = { model, baseURL: `http://127.0.0.1:${stub.port}`, apiKey: "sk-test" }
    const events = { compress: [] }
    const callbacks = { onCompress: (info) => events.compress.push(info) }
    const agent = createAgent({
      provider,
      tools: [],
      config: { agent: {}, traces: { enabled: false } },
      cwd,
      history: historyWithGiant(tokens),
    })
    // 安全点位形：生产循环只在末条为 user / tool 时检查（`agent/turn-loop.mjs:143-147`）。
    agent.history.push({ role: "user", content: "continue" })
    // 阈值面抬到天上 ⇒ 本半段只量守卫（用户看到的那次「强压」）与发送面；阈值面不属本条被测面。
    const guardOnly = { threshold: Number.MAX_SAFE_INTEGER, callbacks, compactionOverhead: {}, signal: undefined, recentCallSigs: [] }
    agent._ctxBasis = { threshold: Number.MAX_SAFE_INTEGER, overhead: {} }
    let error = null
    try {
      await runCompactionCheck(agent, guardOnly)
      // 回合请求的载荷 = 压缩后的真实历史（`agent/chat-call.mjs:19` 同形）——量「压完之后这一条发得出去」。
      await chat(provider, {
        messages: [{ role: "system", content: "test-system" }, ...agent.history],
        logCtx: { stage: "turn", traces: false },
      })
    } catch (e) {
      error = e
    }
    return { stub, events, error }
  }

  // 半段一（越线，620,000）：强压一次，回合请求照发、无 400
  const over = await safetyPoint("deepseek-flash", 620_000, ({ compress }) => ({ content: compress ? "SUMMARY: compressed." : "handled" }))
  const overError = over.error
  assert.equal(overError, null, `越线强压后必须发得出去，实读错误：${overError?.message ?? ""}`)
  assert.equal(over.events.compress.length, 1, "面板收到一次压缩完成")
  assert.equal(compressCalls(over.stub).length, 1, "压缩请求恰一次（stage:compress 的 fetch）")
  assert.equal(turnCalls(over.stub).length, 1, "回合请求恰一次")
  assert.ok(over.stub.requests.every((r) => r.status === 200), "零 400")

  // 半段二（未越线，100,000）：零压缩、零抛、请求照发
  const under = await safetyPoint("deepseek-flash", 100_000, () => ({ content: "handled" }))
  assert.equal(under.error, null, "未越线不得抛")
  assert.equal(under.events.compress.length, 0, "零压缩")
  assert.equal(compressCalls(under.stub).length, 0, "零压缩请求")
  assert.equal(turnCalls(under.stub).length, 1, "请求照发")
  assert.equal(turnCalls(under.stub)[0].body.max_tokens, undefined, "absent 语义不动（不发 max_tokens）")

  // 半段三（退化档 256K 窗口 / 256K 最大回答 + 100,000）：上限由地板抬到 128,000 ⇒ 不误伤
  const degenerate = await safetyPoint("doubao-seed-2-1-turbo-260628", 100_000, () => ({ content: "handled" }))
  assert.equal(degenerate.error, null, "退化档不得被自己的上限卡死")
  assert.equal(degenerate.events.compress.length, 0, "零压缩（100,000 未到 128,000）")
  assert.equal(turnCalls(degenerate.stub).length, 1, "请求照发")
})

test('11-4a provider 回 400 越窗报文：压一次 + 重试一次，成功即返回', { timeout: 120_000 }, async (t) => {
  const overflowText = JSON.stringify({
    error: {
      message: "This model's maximum context length is 1048576 tokens. However, you requested 1068083 tokens (674867 in the messages, 393216 in the completion).",
      type: "invalid_request_error",
    },
  })
  let turnSeq = 0
  const s = await session(t, {
    handler: (rec) => {
      if (rec.compress) return { content: "SUMMARY: compressed once for the retry." }
      turnSeq += 1
      return turnSeq === 1 ? { status: 400, text: overflowText } : { content: "handled" }
    },
  })

  const answer = await runAgent(s.agent, "hi", s.callbacks)

  assert.equal(answer, "handled", "重试成功 ⇒ 用户拿到答复（不是错误）")
  assert.equal(s.events.compress.length, 1, "面板收到一次「压缩完成」（自适应压一次）")
  assert.equal(compressCalls(s.stub).length, 1, "压缩请求恰一次")
  assert.equal(turnCalls(s.stub).length, 2, "回合请求恰两次（首请求 400 + 重试一次）")
  assert.equal(turnCalls(s.stub)[0].status, 400, "首回合吃 400")
  assert.equal(turnCalls(s.stub)[1].status, 200, "重试回合 200")
})

test('11-4b 二次越窗：typed 错误浮出、不再压、不截断', { timeout: 120_000 }, async (t) => {
  const overflowText = JSON.stringify({
    error: {
      message: "This model's maximum context length is 1048576 tokens. However, you requested 1068083 tokens (674867 in the messages, 393216 in the completion).",
      type: "invalid_request_error",
    },
  })
  const s = await session(t, {
    handler: (rec) => (rec.compress ? { content: "SUMMARY: compressed once, still over." } : { status: 400, text: overflowText }),
  })

  const error = await runAgent(s.agent, "hi", s.callbacks).then(() => null, (e) => e)

  assert.ok(error, "二次越窗必须作为错误浮到用户面前")
  assert.equal(error.kind, "context_overflow", "越窗报文归一类（同族词表 = provider/errors.mjs classifyResponsesErrorCode）")
  assert.equal(error.retryable, false, "不可重试")
  assert.equal(compressCalls(s.stub).length, 1, "压缩恰一次（第二次越窗不再压）")
  assert.equal(turnCalls(s.stub).length, 2, "回合请求恰两次（首 + 重试），无第三次")
  const text = JSON.stringify(error.message)
  assert.ok(!text.includes("\u2026truncated") && !/truncated/i.test(text), "不静默截断")
})

// ---------- 11-6 / 11-7 / 11-8 / 11-9 可达性门（CONTEXT-COMPACTION.md §6.17）----------

test('11-6 正常：固定开销吃掉压缩线 ⇒ 零压缩、零摘要请求，用户照常拿到答复', { timeout: 120_000 }, async (t) => {
  const s = await session(t, {
    // 复刻 #1833 现场：压缩线 76,800（128K 档的线，此处写显式值 ⇒ 与本档窗口解耦）、
    // 巨型工具 schema 把 system + tools 抬到线上、history 只一百来 token。
    tools: [giantTool(50_000)],
    compactThreshold: 76_800,
    history: shortHistory(),
    handler: () => ({ content: "handled" }),
  })

  const answer = await runAgent(s.agent, "continue", s.callbacks)

  // 夹具前提（读数，不是推算）：固定开销本身已越过压缩线——门要挡的正是这一格。
  // 前提一旦不成立（提示词缩水等），本行当场红，不会变成「什么都没测到」的假绿。
  const premise = contextUsage(s.agent, s.agent._ctxBasis.overhead)
  assert.ok(premise.overhead > premise.threshold, `夹具前提：固定开销 ${premise.overhead} 应越过压缩线 ${premise.threshold}`)

  assert.equal(answer, "handled", "用户拿到答复（固定开销吃掉压缩线不得把回合拦下）")
  assert.equal(s.agent._lastCompressInfo, undefined, "零压缩事件（判据字段 `_lastCompressInfo` 未置位）")
  assert.equal(s.events.compress.length, 0, "零压缩事件（压完到不了线下 ⇒ 不压）")
  assert.equal(compressCalls(s.stub).length, 0, "零摘要请求（不为一次没有净减的摘要白付请求）")
  assert.equal(turnCalls(s.stub).length, 1, "回合请求恰一次")
  assert.ok(s.stub.requests.every((r) => r.status === 200), "零 400")
})

test('11-7 边界：固定开销逼近压缩线、中段可摘够 ⇒ 压缩恰一次，回复仍引用尾部工具结果', { timeout: 120_000 }, async (t) => {
  const s = await session(t, {
    // 开销逼近线（约 0.8 倍线）但仍在线下：门该放行，且这靠的是「中段够大」而不是「开销小」
    tools: [giantTool(300_000)],
    compactThreshold: 420_000,
    history: historyWithGiantAndTailResult(500_000),
    handler: ({ compress, body }) => ({ content: compress ? "SUMMARY: earlier work compressed." : `handled: ${lastToolResult(body)}` }),
  })

  const answer = await runAgent(s.agent, "continue", s.callbacks)

  // 夹具前提（读数）：开销逼近线但仍在线下（超线那一格是 11-6），且压完确实落到线下——门放行的正是这一格
  const premise = contextUsage(s.agent, s.agent._ctxBasis.overhead)
  assert.ok(premise.overhead > premise.threshold * 0.6, `夹具前提：固定开销 ${premise.overhead} 应逼近压缩线 ${premise.threshold}`)
  assert.ok(premise.overhead < premise.threshold, `夹具前提：开销须在线下（超线那格 = 11-6）`)
  assert.ok(premise.total <= premise.threshold, `压缩后确实落到线下（${premise.total} ≤ ${premise.threshold}）`)

  assert.equal(answer, "handled: PINEAPPLE-42", `回复应引用尾部工具结果（压缩只摘中段），实际：${answer}`)
  assert.equal(s.events.compress.length, 1, "压缩事件恰一次（判据字段 = `_lastCompressInfo.mode`）")
  assert.equal(s.events.compress[0].mode, "summary", "那一次是真摘要压缩（不是确定性降级）")
  assert.deepEqual(s.events.fail, [], "零压缩失败")
  assert.equal(compressCalls(s.stub).length, 1, "摘要请求恰一次")
  assert.equal(turnCalls(s.stub).length, 1, "回合请求恰一次（压缩之后那一个回合）")
  assert.equal(s.stub.requests[0].compress, true, "压缩在回合请求之前（先压再发）")
  assert.ok(s.stub.requests.every((r) => r.status === 200), "零 400")
})

test('11-8 边界：模型主动压缩（context 工具）不受门拦 —— 压后仍越线也执行恰一次', { timeout: 120_000 }, async (t) => {
  let dialogSeq = 0
  const s = await session(t, {
    // 与 11-6 同一格：阈值面本该被门挡住（压后仍越线），force 全文豁免
    tools: [giantTool(50_000)],
    compactThreshold: 76_800,
    history: shortHistory(),
    handler: (rec) => {
      if (rec.compress) return { content: "SUMMARY: compressed on request." }
      dialogSeq += 1
      return dialogSeq === 1
        ? { toolCall: { id: "call_compact", name: "context", args: { action: "compact", focus: "keep the current task" } } }
        : { content: "handled" }
    },
  })

  const answer = await runAgent(s.agent, "continue", s.callbacks)

  // 夹具前提（读数）：压完之后仍越过压缩线——门本该拦，force 仍放行
  const premise = contextUsage(s.agent, s.agent._ctxBasis.overhead)
  assert.ok(premise.total > premise.threshold, `夹具前提：压后仍越线（${premise.total} > ${premise.threshold}）`)

  assert.equal(answer, "handled", "主动压缩之后用户照常拿到答复")
  assert.equal(s.events.compress.length, 1, "压缩仍执行恰一次（门只拦阈值面，`force` 全文豁免）")
  assert.equal(s.events.compress[0].mode, "summary", "走的是真摘要压缩")
  assert.equal(compressCalls(s.stub).length, 1, "摘要请求恰一次")
  assert.equal(turnCalls(s.stub).length, 2, "回合请求两次（派 context 工具那次 + 压缩后的下一次）")
  assert.ok(s.stub.requests.every((r) => r.status === 200), "零 400")
})

test('11-9 错误：无中段可摘 ⇒ 走确定性截断，门不拦、零摘要请求', { timeout: 120_000 }, async (t) => {
  // 安全点位形（与 11-3 同口径——本行设计的交互组件 = `splitHistory` 无中段支 → `shrinkOversized`）：
  // 「无中段」只在整段历史就是那一条巨消息时出现；真会话里 `runAgent` 至少再推入两条机器提醒，
  // `keepTailSize` / `splitHistory` 因而总能切出中段（len 2 ⇒ keepTail 0 ⇒ 中段 = 整段）。
  const s = await session(t, { history: [{ role: "user", content: asciiTokens(10_000) }], handler: () => ({ content: "handled" }) })
  const callbacks = { onCompress: (info) => s.events.compress.push(info) }

  await runCompactionCheck(s.agent, { threshold: 5_000, callbacks, compactionOverhead: {}, signal: undefined, recentCallSigs: [] })

  const body = String(s.agent.history[0]?.content ?? "")
  assert.match(body, /chars truncated/, "体内出现截断标记（shrinkOversized 的降级路）")
  assert.ok(body.length < 30_000, "巨型消息确实被截断（30,000 字符 → 头尾保真）")
  assert.equal(s.events.compress.filter((e) => e.mode === "summary").length, 0, "零摘要压缩事件（门不拦降级路）")
  assert.equal(compressCalls(s.stub).length, 0, "零摘要请求（截断零网络）")
})

