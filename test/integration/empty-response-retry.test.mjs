/**
 * empty-response-retry.test.mjs — 集成用例档：RTM 故事 15「偶发空响应不打断会话」
 * （`test/RTM.md:186`–`:188` 三行 15-1 / 15-2 / 15-3；机制权威 = `docs/core/design/AGENT-LOOP.md` §6.5①）。
 *
 * 业务可观察结果：提供端瞬时吐空之后，用户照常拿到答复；只有**连续**空才抛 `LLM returned empty response`。
 * 驱动 = 真会话链路（`createAgent` + `runAgent`，一次 `runAgent` = CLI 里发一条消息 ⇒ 同一 run），
 * 模型侧 = 本机假 OpenAI SSE 端点（先例 `test/integration/context-overflow-guard.test.mjs:93`）——
 * 零外网、零付费端点、零 `fetch` 全局桩。
 *
 * 单 run 形的两条构造约束（设计档 §6.5① `:412`，本档照做）：
 * ① 中间那个「实质响应」**必须带工具调用**——零工具调用的带正文响应在 `turn-loop.mjs:244`（`return cr.content`）
 *   即收束本 run，序列会跨到下一个 run 而被起手复位（`run-start.mjs:134`）抹平，测不到本笔；
 * ② `_emptyRetries` 的读点一律在**桩回调内**（下一轮取值之前）——run 结束后再读，值已被后续轮 / 下一次 run 覆盖。
 */
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { createServer } from "node:http"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { createAgent, runAgent } from "../../thincoder-core/agent.mjs"
import { _resetLogsDirForTest, _setLogsDirForTest } from "../../thincoder-core/log.mjs"

// ---------- 夹具 ----------

const cwd = mkdtempSync(join(tmpdir(), "empty-retry-int-"))
const logsDir = mkdtempSync(join(tmpdir(), "empty-retry-int-logs-"))
_setLogsDirForTest(logsDir)
after(() => {
  _resetLogsDirForTest()
  rmSync(cwd, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
  rmSync(logsDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
})

/** 实质轮携带的工具（提供端常见形态：只发工具调用、正文空；执行只回一个串，不碰磁盘）。 */
const PROBE_TOOL = {
  name: "probe_ping",
  description: "no-op probe (integration fixture)",
  parameters: { type: "object", properties: {}, additionalProperties: false },
  readonly: true,
  execute: async () => "pong",
}

/**
 * 一轮响应的形态：`{ content?: string, tool?: true }`。
 * 零正文 + 零工具调用 ⇒ 空响应；`tool: true` ⇒ 带工具调用（`content` 有无都算「有实质」）。
 */
const sseChunks = (reply) => {
  if (reply.tool) {
    const delta = {
      content: reply.content ?? "",
      tool_calls: [{ index: 0, id: "call_probe", type: "function", function: { name: "probe_ping", arguments: "{}" } }],
    }
    return [
      { choices: [{ delta: { content: reply.content ?? "" }, finish_reason: null }] },
      { choices: [{ delta: { tool_calls: delta.tool_calls }, finish_reason: null }] },
      { choices: [{ delta: {}, finish_reason: "tool_calls" }] },
    ]
  }
  return [
    { choices: [{ delta: { content: reply.content ?? "" }, finish_reason: null }] },
    { choices: [{ delta: {}, finish_reason: "stop" }] },
  ]
}

/**
 * 假 OpenAI SSE 端点：第 N 次请求按 `script[N]` 回放（越界取末项）。
 * 每次请求到达即把**当前** `read()` 值记进 `reads` —— 那正是上一轮响应处理完毕、本轮取值之前。
 */
const providerStub = (reads, read, script) => {
  const requests = []
  const server = createServer((req, res) => {
    let raw = ""
    req.on("data", (chunk) => { raw += chunk })
    req.on("end", () => {
      const turn = requests.length
      requests.push(raw)
      reads.push({ turn, emptyRetries: read() })
      const reply = script[Math.min(turn, script.length - 1)]
      res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" })
      for (const chunk of sseChunks(reply)) res.write(`data: ${JSON.stringify(chunk)}\n\n`)
      res.write("data: [DONE]\n\n")
      res.end()
    })
  })
  return new Promise((done) => {
    server.listen(0, "127.0.0.1", () => done({
      port: server.address().port,
      requests,
      close: () => new Promise((finish) => { server.closeAllConnections?.(); server.close(() => finish()) }),
    }))
  })
}

/** 一次 CLI 会话夹具：真 `createAgent` + 本机假端点（隔离工作目录，注入面最小）。 */
async function session(t, script) {
  const agent = createAgent({
    provider: null,
    tools: [PROBE_TOOL],
    config: { agent: { maxTurns: 10 }, traces: { enabled: false } },
    cwd,
    history: [],
  })
  const reads = []
  const stub = await providerStub(reads, () => agent._emptyRetries, script)
  t.after(() => stub.close())
  agent.provider = { model: "deepseek-flash", baseURL: `http://127.0.0.1:${stub.port}`, apiKey: "sk-test" }
  return { agent, stub, reads }
}

/** 空响应提醒条数（`completion.mjs` 注入的原文锚 = 「your last response was empty」）。 */
const emptyReminders = (agent) => agent.history.filter(
  (m) => typeof m.content === "string" && m.content.includes("your last response was empty"),
).length

// ---------- 故事 15 三行 ----------

test("15-1 空 → 带正文且带工具调用 → 空 → 带正文：用户拿到两次答复，全程不抛", { timeout: 60_000 }, async (t) => {
  const s = await session(t, [
    {},                                        // 1 空
    { content: "checking", tool: true },       // 2 实质（正文 + 工具调用）
    {},                                        // 3 空
    { content: "answered" },                   // 4 正文 ⇒ 收束本 run
  ])

  const answer = await runAgent(s.agent, "hi", {})

  assert.equal(answer, "answered", "用户拿到答复，而不是 `LLM returned empty response`")
  assert.equal(s.stub.requests.length, 4, "四轮模型调用：空 · 实质（带工具） · 空 · 正文——同一 run 内")
  // 用户可见的两次正文答复：工具轮正文（"checking"）与收束正文（"answered"）
  const assistantTexts = s.agent.history
    .filter((m) => m.role === "assistant" && typeof m.content === "string" && !m.tool_calls)
    .map((m) => m.content)
  assert.deepEqual(assistantTexts, ["answered"], "收束正文进历史")
  const toolRound = s.agent.history.find(
    (m) => m.role === "assistant" && typeof m.content === "string" && m.content.includes("checking"),
  )
  assert.ok(toolRound, "工具轮正文同样落进历史——两次正文答复都到用户手里")

  assert.equal(s.reads[0].emptyRetries, 0, "新 run 起点计数 = 0")
  assert.equal(s.reads[1].emptyRetries, 1, "首个空之后计数 = 1")
  assert.equal(s.reads[2].emptyRetries, 0, "中间实质轮之后计数读到 0（读点在下一轮取值之前）")
  assert.equal(s.reads[3].emptyRetries, 1, "其后的空从 1 重新起算——不是累计到 2")
})

test("15-2 桩恒回空：第 3 次空当场抛 `LLM returned empty response`，前两次各注入一次提醒", { timeout: 60_000 }, async (t) => {
  const s = await session(t, [{}]) // 恒回空响应

  const error = await runAgent(s.agent, "hi", {}).then(() => null, (e) => e)

  assert.ok(error, "连续空必须抛（不得静默当正常收尾）")
  assert.match(error.message, /LLM returned empty response/, `抛的是空响应错误，实读：${error.message}`)
  assert.equal(s.stub.requests.length, 3, "恰三次模型调用——第 3 次空当场抛（额度 MAX_EMPTY_RETRIES = 2 不动）")
  assert.deepEqual(s.reads.map((r) => r.emptyRetries), [0, 1, 2], "计数逐轮 0 → 1 → 2，第 3 次空时已到上限")
  assert.equal(emptyReminders(s.agent), 2, "前两次空各注入一次提醒（用户在第三次才看到错误）")
})

test("15-3 空 → 带工具调用 → 空 → 空 → 带正文：不抛（工具轮复位；修前第 3 次空即抛）", { timeout: 60_000 }, async (t) => {
  const s = await session(t, [
    {},                     // 1 空
    { tool: true },         // 2 工具轮（正文空、带工具调用）⇒ 复位
    {},                     // 3 空
    {},                     // 4 空
    { content: "answered" }, // 5 正文
  ])

  const answer = await runAgent(s.agent, "hi", {}).then((v) => v, (e) => e)

  assert.equal(answer, "answered", `全程不抛——修前此处是 \`LLM returned empty response\`，实读：${answer?.message ?? answer}`)
  assert.equal(s.stub.requests.length, 5, "五轮模型调用全部走完（中和清零行时中途即抛）")
  assert.deepEqual(
    s.reads.map((r) => r.emptyRetries), [0, 1, 0, 1, 2],
    "工具轮复位 ⇒ 其后的两次空各计 1 / 2，随即拿到正文——没有连续第三次空"
  )
  assert.equal(s.agent._emptyRetries, 0, "收束正文轮照常清零")
  // 序列里有三次空（首空 + 工具轮之后两次空），三次都在额度内 ⇒ 各注入一次提醒。
  // 工具轮本身既不入空分支、也不递增空预算——修前它会「白挂」一次计数，使第 3 次空当场抛（提醒只到 2 条）。
  assert.equal(emptyReminders(s.agent), 3, "三次空各注入一次提醒——工具轮不消费、也不递增空预算")
})
