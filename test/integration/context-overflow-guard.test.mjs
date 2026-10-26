/**
 * context-overflow-guard.test.mjs — 集成用例 11-1 … 11-4（`test/RTM.md` CLI 端故事 11「上下文越窗守卫」；
 * 用例设计 = 批档 §2「集成测试设计（delta vs `test/RTM.md`）」；机制正文 = `docs/core/design/CONTEXT-COMPACTION.md` §6.17）。
 *
 * 业务入口两档（都是用户真会走的那条路）：
 *  - 11-1 / 11-2 / 11-4 = **真会话链路**：`runAgent`（prepareRun → 安全点守卫 → 压缩 → 发送面净判 → 回执）；
 *  - 11-3 = 安全点（`runCompactionCheck`）∥ 发送面（`chat`）按回合环同序（`agent/turn-loop.mjs:119-131`）——
 *    该行设计的交互组件就是「预算面 ↔ 发送面」，故不进会话层。
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
import { _resetLogsDirForTest, _setLogsDirForTest } from "../../thincoder-core/log.mjs"

// ---------- 夹具 ----------

/** 压缩摘要请求的识别锚 = `SUMMARIZE_PROMPT` 首句（唯一一处走 `stage:"compress"` 的载荷）。 */
const SUMMARIZE_SIG = "The conversation above is our work log so far"

/** 估算 n token 的 ASCII 载荷（`_estimateSingle`：ASCII 4 字符 / token）。 */
const asciiTokens = (n) => "x".repeat(n * 4)

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

/**
 * 假 OpenAI 端点：每个请求留档（`{ compress, body, status }`），回 SSE 文本或 HTTP 错误。
 * `handler(record)` 返回 `{ content }`（200 + SSE）或 `{ status, text }`（HTTP 错误）。
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
async function session(t, { history = [], handler, model = "deepseek-flash", compactThreshold }) {
  const stub = await providerStub(handler)
  t.after(() => stub.close())
  const provider = { model, baseURL: `http://127.0.0.1:${stub.port}`, apiKey: "sk-test" }
  const agent = createAgent({
    provider,
    tools: [],
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
    // （"y".repeat(2_800_000)，ASCII/4）⇒ 压后仍 > limit 616,000。
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
    // 安全点位形：生产循环只在末条为 user / tool 时检查（`agent/turn-loop.mjs:121-122`）。
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

test('11-4 provider 回 400 越窗报文：错误带 context_overflow、不重试（fetch 恰好 1 次）', { timeout: 120_000 }, async (t) => {
  const overflowText = JSON.stringify({
    error: {
      message: "This model's maximum context length is 1048576 tokens. However, you requested 1068083 tokens (674867 in the messages, 393216 in the completion).",
    },
  })
  const s = await session(t, { handler: () => ({ status: 400, text: overflowText }) })

  const error = await runAgent(s.agent, "hi", s.callbacks).then(() => null, (e) => e)

  assert.ok(error, "400 必须作为错误浮到用户面前")
  assert.equal(error.kind, "context_overflow", "越窗报文归一类（同族词表 = provider/errors.mjs classifyResponsesErrorCode）")
  assert.equal(error.retryable, false, "不可重试")
  assert.match(error.message, /上下文超限——\/compact/, "回执带可执行提示（压缩后重试）")
  assert.equal(s.stub.requests.length, 1, "400 判终局 ⇒ 恰好一次 fetch（零重试）")
})
