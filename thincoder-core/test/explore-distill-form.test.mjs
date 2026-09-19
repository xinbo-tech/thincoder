/**
 * explore-distill-form.test.mjs — 蒸馏调用形态（会话续写 · 前缀复用）用例
 * （批次档 2026-09-18-distill-prefix §2.4 AC1–AC7 + §2.5 用例 1–7 · 台账 #47；机制条文 = 设计档
 * CONTEXT-COMPACTION.md §6.9 H1 / §6.15 / D-CC21）。
 *
 * 断言面：蒸馏请求 = [system(=extras.systemPrompt)] + `history[0, lastBlockEnd)`「真身」消息（原样引用）
 * + 尾部指令一条（`EXPLORE_SUMMARY_PROMPT`），随带与回合请求同一声明面的 tools（**不带** `tool_choice`——
 * §6.14 分区实测：该参数致服务端丢弃 tools 区），且不覆盖 `reasoningEffort` ⇒ 与回合侧同源（v3 形态）；
 * 与同会话回合请求（`[system, ...history]` + tools）共享可复用前缀——命中面 = 首现复用回合所建前缀。
 * 退化面：`extras` 缺省 ⇒ 无 system 头、不发 tools，形态 = 「history 前缀 + 指令」，正确性不变。
 * 失败面（N3）：`chat` 抛错 / `content` 空 ⇒ 无收缩返回、原历史保留、`onDistilled` 零触发。
 * 替换面（§6.9 H1 不动）：note 插首块位 / 探索块整体丢弃 / 非块消息保留 / `_fullHistory` 不触。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { summarizeRunExplorations, EXPLORE_SUMMARY_PROMPT } from "../explore-distill.mjs"
import { buildCompressMessages } from "../compress-form.mjs"
import { chat } from "../provider/core.mjs"
import { _rateHooks } from "../provider/rate.mjs"

const SYS = "SYSTEM-PROMPT-BYTES"
const PROVIDER = { name: "test", baseURL: "https://explore-distill.test/v1", apiKey: "k", model: "deepseek-flash" }
const NOTE_MARK = "[Exploration summary]"
/** 回合请求同一声明面（`toolSchemas` 形态——agent.mjs:241 / VSC agent.mjs 同数组）；蒸馏请求取同一引用 ⇒ 无第二构造点。 */
const TURN_TOOLS = [
  { type: "function", function: { name: "read", description: "Read a file", parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } } },
  { type: "function", function: { name: "grep", description: "Search", parameters: { type: "object", properties: { pattern: { type: "string" } }, required: ["pattern"] } } },
]

const tc = (id, name) => ({ id, type: "function", function: { name, arguments: `{"path":"${id}.mjs"}` } })

/** 一个纯探索块 = assistant(tool_calls) + 逐条 tool 结果（完整配对；`parallel` ⇒ 并行两调用）。 */
function exploreBlock(id, name, { parallel = false } = {}) {
  const calls = parallel ? [tc(`${id}a`, name), tc(`${id}b`, "glob")] : [tc(id, name)]
  return [
    { role: "assistant", content: null, tool_calls: calls },
    ...calls.map((c) => ({ role: "tool", tool_call_id: c.id, name: c.function.name, content: `${c.function.name} result ${c.id}` })),
  ]
}

/**
 * 夹具：前缀（非探索面）→ 块 1 → 块间非块消息 → 块 2 → 块 3（并行 ×2）；探索结果共 4 条（≥3 触发）。
 * `tailAfter`：末块之后再追加一条非块消息（用例 5 切点覆盖）。
 * `lastBlockEnd` = 末块的 `end`（按夹具结构独立算出——不读实现内部值）。
 */
function baseHistory({ tailAfter = false } = {}) {
  const history = [
    { role: "user", content: "u0" },
    { role: "assistant", content: "a1" },
  ]
  history.push(...exploreBlock("call_r1", "read"))
  history.push({ role: "assistant", content: "between blocks" }) // 块间非块消息（替换面须保留）
  history.push(...exploreBlock("call_g1", "grep"))
  history.push(...exploreBlock("call_r2", "read", { parallel: true }))
  const lastBlockEnd = history.length
  if (tailAfter) history.push({ role: "assistant", content: "trailing words" })
  return { history, lastBlockEnd }
}

/** fetch 桩：捕获出站请求体（JSON）。`abort` = 中止形态；`status ≥ 400` = 失败形态；content "" = 空摘要。 */
function stubFetch({ content = "SUMMARY-BODY", status = 200, abort = false } = {}) {
  const calls = []
  const saved = globalThis.fetch
  globalThis.fetch = async (_url, opts) => {
    calls.push(JSON.parse(opts.body))
    if (abort) throw new DOMException("The operation was aborted.", "AbortError")
    if (status >= 400) return { ok: false, status, text: async () => "boom" }
    const sse = `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\ndata: [DONE]\n\n`
    return { ok: true, status: 200, headers: { get: () => "text/event-stream" }, body: [new TextEncoder().encode(sse)] }
  }
  return { calls, restore: () => { globalThis.fetch = saved } }
}

const newAgent = (history, provider = PROVIDER) => ({
  provider, history,
  _runStartHistoryLen: 0,
  _lastPromptTokens: 4242,
  _usageAtLen: 7,
})

test("用例 1 正常：消息序 = system + [0, lastBlockEnd) 真身消息 + 指令（AC1 形态面 · 单源深等锁）", async () => {
  const { history, lastBlockEnd } = baseHistory()
  const agent = newAgent(history)
  const stub = stubFetch()
  let distilled = 0
  try {
    await summarizeRunExplorations(agent, { onDistilled: () => distilled++ }, null, 0, { systemPrompt: SYS, tools: TURN_TOOLS })
    assert.equal(stub.calls.length, 1, "单次摘要调用")
    const body = stub.calls[0]
    assert.equal(body.messages.length, lastBlockEnd + 2, "1 system + [0, lastBlockEnd) + 指令 1")
    assert.equal(body.messages[0].role, "system")
    assert.equal(body.messages[0].content, SYS, "首条 = 回合 systemPrompt 逐字节")
    assert.equal(body.messages.at(-1).role, "user", "末条 = 指令（user）")
    assert.equal(body.messages.at(-1).content, EXPLORE_SUMMARY_PROMPT, "末条内容 = 指令原样")
    assert.deepEqual(
      body.messages,
      buildCompressMessages(history, lastBlockEnd, SYS, EXPLORE_SUMMARY_PROMPT),
      "调用点形态 = 纯函数产物（单源 D2 + 序列化面退役同锁）",
    )
    const built = buildCompressMessages(history, lastBlockEnd, SYS, EXPLORE_SUMMARY_PROMPT)
    assert.equal(built[2], history[1], "中段消息原样引用（不拷贝 / 不截断）")
    assert.notEqual(agent.history, history, "收缩 = 新数组替换")
    assert.equal(agent.history[2].role, "user")
    assert.ok(agent.history[2].content.startsWith(NOTE_MARK), "note 插首块位")
    assert.ok(agent.history[2].content.includes("SUMMARY-BODY"), "摘要正文 = 桩 content")
    assert.equal(distilled, 1, "落地才算的 onDistilled")
    assert.equal(agent._lastPromptTokens, null, "基线失效（机器线换形）")
    assert.equal(agent._usageAtLen, null)
  } finally { stub.restore() }
})

test("用例 2 正常：请求去末条 = 回合请求（[system, ...history]）同长前缀（AC2）", async () => {
  const { history, lastBlockEnd } = baseHistory()
  const agent = newAgent(history)
  const stub = stubFetch()
  try {
    await summarizeRunExplorations(agent, {}, null, 0, { systemPrompt: SYS, tools: TURN_TOOLS })
    const prefix = stub.calls[0].messages.slice(0, -1)
    assert.equal(prefix.length, lastBlockEnd + 1, "system + [0, lastBlockEnd)")
    assert.deepEqual(
      prefix,
      [{ role: "system", content: SYS }, ...history].slice(0, prefix.length),
      "逐元素深等 ⇒ 前缀可复用（与同会话回合请求共享）",
    )
  } finally { stub.restore() }
})

test("用例 3 正常：body.tools = 回合同一数组（深等）、不发 tool_choice（AC3）", async () => {
  const { history } = baseHistory()
  const agent = newAgent(history)
  const stub = stubFetch()
  try {
    await summarizeRunExplorations(agent, {}, null, 0, { systemPrompt: SYS, tools: TURN_TOOLS })
    const body = stub.calls[0]
    // 线下可判形 = 与回合请求出站体逐字节同值（出站即 JSON.stringify，引用同一性不可观测）。
    await chat(PROVIDER, { messages: [{ role: "system", content: SYS }, ...history], tools: TURN_TOOLS })
    const turnBody = stub.calls.at(-1)
    assert.equal(JSON.stringify(body.tools), JSON.stringify(turnBody.tools), "声明面 = 回合请求出站值（逐字节同值）")
    assert.equal(JSON.stringify(body.tools), JSON.stringify(TURN_TOOLS), "= 声明面原样（无重排 / 无裁剪子集）")
    assert.equal(Object.hasOwn(body, "tool_choice"), false, "不发 tool_choice（§6.14 分区实测：该参数致服务端丢弃 tools 区）")
    assert.equal(Object.hasOwn(turnBody, "tool_choice"), false, "对照面：回合请求亦不发 tool_choice")
  } finally { stub.restore() }
})

test("用例 4 边界：reasoningEffort 与回合同源（不覆盖）；thinking 恒不发（AC4）", async () => {
  const provider = { ...PROVIDER, thinking: { type: "enabled" }, reasoningEffort: "max" } // 生产 config 形态（deepseek preset）
  const { history } = baseHistory()
  const agent = newAgent(history, provider)
  const stub = stubFetch()
  try {
    await summarizeRunExplorations(agent, {}, null, 0, { systemPrompt: SYS, tools: TURN_TOOLS })
    const body = stub.calls[0]
    await chat(provider, { messages: [{ role: "system", content: SYS }, ...history], tools: TURN_TOOLS })
    assert.equal(body.reasoning_effort, "max", "随带回合侧配置值（不硬编码）")
    assert.equal(body.reasoning_effort, stub.calls.at(-1).reasoning_effort, "与回合请求出站值同值（同源 = agent.provider 同字段）")
    assert.equal(Object.hasOwn(body, "thinking"), false, "thinking 恒不发（D9 静默——thinking:null 保留）")

    const { history: h2 } = baseHistory()
    const agent2 = newAgent(h2, { ...PROVIDER }) // 未配置 reasoningEffort
    await summarizeRunExplorations(agent2, {}, null, 0, { systemPrompt: SYS })
    const body2 = stub.calls.at(-1)
    assert.equal(Object.hasOwn(body2, "reasoning_effort"), false, "无配置 ⇒ 字段缺省（同修前）")
    assert.equal(Object.hasOwn(body2, "thinking"), false, "thinking 两态皆缺省")
  } finally { stub.restore() }
})

test("用例 5 边界：含末块全部 tool 消息；末块之后的尾部消息不进请求（AC5）", async () => {
  const { history, lastBlockEnd } = baseHistory({ tailAfter: true })
  assert.equal(history.at(-1).content, "trailing words", "夹具前提：末块之后有尾部消息")
  const agent = newAgent(history)
  const stub = stubFetch()
  try {
    await summarizeRunExplorations(agent, {}, null, 0, { systemPrompt: SYS, tools: TURN_TOOLS })
    const messages = stub.calls[0].messages
    assert.equal(messages.length, lastBlockEnd + 2, "切点 = 末块 end ⇒ 尾部消息不进请求")
    assert.equal(messages.some((m) => m.content === "trailing words"), false, "尾部消息不在请求内")
    assert.deepEqual(
      messages.filter((m) => m.role === "tool").map((m) => m.tool_call_id),
      ["call_r1", "call_g1", "call_r2a", "call_r2b"],
      "末块（并行 ×2）全部 tool 消息在内",
    )
    assert.deepEqual(messages.slice(1, -1), history.slice(0, lastBlockEnd), "中段 = [0, lastBlockEnd) 逐元素")
  } finally { stub.restore() }
})

test("用例 6 边界：extras 缺省 ⇒ 无 system 头、不发 tools；替换仍落（退化面 1）", async () => {
  const { history, lastBlockEnd } = baseHistory()
  const agent = newAgent(history)
  const stub = stubFetch()
  let distilled = 0
  try {
    await summarizeRunExplorations(agent, { onDistilled: () => distilled++ }, null, 0) // extras 缺省
    const body = stub.calls[0]
    assert.equal(Object.hasOwn(body, "tools"), false, "无声明面 ⇒ 不发 body.tools（部分服务端对该组合 400 ⇒ 仅直调/测试可达）")
    assert.equal(Object.hasOwn(body, "tool_choice"), false, "本形态恒不发 tool_choice")
    assert.equal(body.messages.some((m) => m.role === "system"), false, "无 system 头")
    assert.deepEqual(
      body.messages,
      buildCompressMessages(history, lastBlockEnd, undefined, EXPLORE_SUMMARY_PROMPT),
      "形态 = 「history 前缀 + 指令」（正确性不变）",
    )
    assert.ok(agent.history[2].content.startsWith(NOTE_MARK), "替换仍落")
    assert.equal(distilled, 1, "onDistilled 正常触发")
  } finally { stub.restore() }
})

test("用例 7 错误：chat 抛错 / content 空 ⇒ 无收缩返回、history 引用与内容不变、onDistilled 零触发（AC7）", async () => {
  const savedSleep = _rateHooks.sleep
  _rateHooks.sleep = async () => {} // 重试退避不真等（离线）
  let distilled = 0
  try {
    const { history } = baseHistory()
    const agent = newAgent(history)
    const s500 = stubFetch({ status: 500 })
    try {
      assert.equal(
        await summarizeRunExplorations(agent, { onDistilled: () => distilled++ }, null, 0, { systemPrompt: SYS }),
        undefined,
        "失败 ⇒ 无收缩返回（既有语义：if (!next) return）",
      )
      assert.equal(s500.calls.length, 4, "既有重试语义不变（1 + MAX_RETRIES）")
      assert.equal(agent.history, history, "同一数组引用 ⇒ 零改写")
      assert.equal(agent.history.length, history.length)
      assert.equal(agent._lastPromptTokens, 4242, "未落地 ⇒ 基线不动")
      assert.equal(distilled, 0, "onDistilled 零触发")
    } finally { s500.restore() }

    const { history: h2 } = baseHistory()
    const agent2 = newAgent(h2)
    const sEmpty = stubFetch({ content: "" })
    try {
      assert.equal(await summarizeRunExplorations(agent2, { onDistilled: () => distilled++ }, null, 0, { systemPrompt: SYS }), undefined)
      assert.equal(agent2.history, h2, "空摘要 ⇒ 原历史保留")
      assert.equal(agent2._lastPromptTokens, 4242)
      assert.equal(distilled, 0)
    } finally { sEmpty.restore() }
  } finally { _rateHooks.sleep = savedSleep }
})

test("用例 8 替换面回归（AC6）：note 插首块位、块全丢、非块保留、_fullHistory 不触", async () => {
  const { history } = baseHistory()
  const agent = newAgent(history)
  agent._fullHistory = history.slice() // 人读线（记录面——蒸馏只动机读线）
  const stub = stubFetch()
  try {
    await summarizeRunExplorations(agent, {}, null, 0, { systemPrompt: SYS, tools: TURN_TOOLS })
    const next = agent.history
    assert.deepEqual(next.slice(0, 2), [{ role: "user", content: "u0" }, { role: "assistant", content: "a1" }], "首块之前原位保留")
    assert.equal(next[2].content.startsWith(NOTE_MARK), true, "note 插首块位")
    assert.equal(next[3].content, "between blocks", "块间非块消息保留")
    assert.equal(next.length, 4, "3 块整体丢弃（6 条 → note 1 条）")
    assert.equal(next.some((m) => m.role === "tool"), false, "零 tool 消息残留（配对安全）")
    assert.equal(next.some((m) => m.tool_calls), false, "零 tool_calls 残留")
    assert.equal(agent._fullHistory.length, history.length, "_fullHistory 长度不变")
    assert.deepEqual(agent._fullHistory, history, "人读线引用与内容不触")
  } finally { stub.restore() }
})
