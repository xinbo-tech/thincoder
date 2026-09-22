/**
 * compress-form.test.mjs — 压缩调用形态（会话续写 · 前缀复用）用例
 * （批次档 2026-09-18-compression-continuation §2.5 用例 1–8 + §2.10 v2 用例 9 · 台账 #39；机制条文 = 设计档
 * CONTEXT-COMPACTION.md §6.14 / D-CC20）。
 *
 * 断言面：压缩请求 = [system(=extras.systemPrompt)] + 中段「真身」消息（原样引用）+ 尾部指令一条，
 * 随带与回合请求同一声明面的 tools（v2 声明面对齐 · 设计档 §6.14 备选②——**不带 tool_choice**：实测该参数使服务端
 * 丢弃 tools 区 ⇒ 首现命中 0%），与同会话回合请求（[system, ...history] + tools）共享可复用前缀——命中面 =
 * 首现复用回合所建前缀（v2 探针复测 2026-09-18：带 tools 声明且 `reasoning_effort` 同值 ⇒ 8 格 84–98%；不带 tools /
 * 带 tool_choice:"none" / effort 异值 ⇒ 首现 0%）；v3 起随带与回合请求**同源**的 `reasoning_effort`（父侧 2026-09-18 裁定——
 * 用例 10 / 11；不硬编码、未配置 ⇒ 缺省）。extras.tools 缺省 ⇒ tools 不发（退化面 1 · 用例 9）。
 * tool_calls 泄漏（备选② 无抑制）⇒ 摘要面只取 content、零落点（用例 8）。失败面：空白摘要抛错、history 零改写（守卫落点 = applyCompression 之前）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { compressIfNeeded, SUMMARIZE_PROMPT } from "../context.mjs"
import { buildCompressMessages } from "../compress-form.mjs"
import { chat } from "../provider/core.mjs"
import { _rateHooks } from "../provider/rate.mjs"

const SYS = "SYSTEM-PROMPT-BYTES"
const PROVIDER = { name: "test", baseURL: "https://compress-form.test/v1", apiKey: "k", model: "deepseek-flash" }
const COMPACTION_MARK = "[Context was automatically compacted"
/** 占位回复字面（D9——与 context.mjs 的 COMPACTION_PLACEHOLDER 同字面） */
const PLACEHOLDER = "Understood. I'll continue from these notes, re-verifying anything transient."
/** 回合请求同一声明面（`toolSchemas` 形态——agent.mjs:241 / VSC run-stages.mjs:196 同数组）；压缩请求取同一引用 ⇒ 无第二构造点。 */
const TURN_TOOLS = [
  { type: "function", function: { name: "read", description: "Read a file", parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } } },
  { type: "function", function: { name: "grep", description: "Search", parameters: { type: "object", properties: { pattern: { type: "string" } }, required: ["pattern"] } } },
]
/** 泄漏形态的响应 tool_calls（服务端忽略 tool_choice 时的同出形态） */
const LEAK_TOOL_CALL = [{ index: 0, id: "call_leak", type: "function", function: { name: "read", arguments: "{\"path\":\"leak.mjs\"}" } }]

/**
 * 40 条历史夹具（deepseek-flash 1M 窗 ⇒ keepTail = min(300, ⌊40 × 0.4⌋) = 16 ⇒ 切点 tailStart = 24）。
 * `parallelTools`：索引 21/22/23 = assistant(tool_calls ×2) + 两条并行 tool 结果（落在中段尾部，
 * 配对完整）；`tailAssistant`：索引 24 = assistant（D-CC18 并入分支的 tail 首条形态）。
 * 夹具不带 ts：发送期 stripLocalMessageFields 恒等 ⇒ 请求前缀与 history 可逐元素深等。
 */
function baseHistory({ parallelTools = false, tailAssistant = false } = {}) {
  const h = []
  for (let i = 0; i < 40; i++) {
    h.push(i % 2 === 0
      ? { role: "user", content: `u${i}` }
      : { role: "assistant", content: `a${i}`, reasoning_content: `r${i}` })
  }
  if (parallelTools) {
    h[21] = {
      role: "assistant", content: null, reasoning_content: "r21",
      tool_calls: [
        { id: "call_p1", type: "function", function: { name: "read", arguments: "{\"path\":\"a.mjs\"}" } },
        { id: "call_p2", type: "function", function: { name: "grep", arguments: "{\"pattern\":\"x\"}" } },
      ],
    }
    h[22] = { role: "tool", tool_call_id: "call_p1", name: "read", content: "file a" }
    h[23] = { role: "tool", tool_call_id: "call_p2", name: "grep", content: "hits" }
  }
  if (tailAssistant) h[24] = { role: "assistant", content: "draft 24", reasoning_content: "rc24" }
  return h
}

/** fetch 桩：捕获出站请求体（JSON）。`abort` = 中止形态；`status ≥ 400` = 失败形态；content "" = 空白摘要；
 *  `toolCalls` = 泄漏形态（响应与 content 同出 tool_calls——服务端忽略 tool_choice）。 */
function stubFetch({ content = "SUMMARY-BODY", status = 200, abort = false, toolCalls = null } = {}) {
  const calls = []
  const saved = globalThis.fetch
  globalThis.fetch = async (_url, opts) => {
    calls.push(JSON.parse(opts.body))
    if (abort) throw new DOMException("The operation was aborted.", "AbortError")
    if (status >= 400) return { ok: false, status, text: async () => "boom" }
    const frames = toolCalls
      ? `data: ${JSON.stringify({ choices: [{ delta: { tool_calls: toolCalls } }] })}\n\n`
      : ""
    const sse = `${frames}data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\ndata: [DONE]\n\n`
    return { ok: true, status: 200, headers: { get: () => "text/event-stream" }, body: [new TextEncoder().encode(sse)] }
  }
  return { calls, restore: () => { globalThis.fetch = saved } }
}

const newAgent = (history) => ({ provider: PROVIDER, history, tasks: [], planMode: false })

/** 配对完整性检测器：孤儿 tool / 缺结果 tool_call / 归一化合成占位（[Tool result missing…]）三类违例。 */
function pairingViolations(messages) {
  const bad = []
  for (const m of messages) {
    if (m.role === "tool") {
      const owned = messages.some((x) => x.role === "assistant" && x.tool_calls?.some((tc) => tc.id === m.tool_call_id))
      if (!owned) bad.push(`orphan tool ${m.tool_call_id}`)
      if (String(m.content).startsWith("[Tool result missing")) bad.push(`synthetic ${m.tool_call_id}`)
    }
    for (const tc of m.tool_calls ?? []) {
      if (!messages.some((x) => x.role === "tool" && x.tool_call_id === tc.id)) bad.push(`no result ${tc.id}`)
    }
  }
  return bad
}

test("用例 12 #209：强制路第三去向——短历史 + 单条超限消息 + force ⇒ `shrinkOversized` 直落（零 LLM 调用）", async () => {
  const BIG = "x".repeat(9000)
  // 短历史形 = **单条超限消息**（切分无从落刀：`keepTailSize` 取 ⌊len×0.4⌋ ⇒ split 为 null）
  const agent = newAgent([{ role: "user", content: BIG }])
  const stub = stubFetch()
  try {
    assert.equal(await compressIfNeeded(agent, 1, {}, { force: true }), true, "强制路：短历史无从切中段 ⇒ 直落 shrinkOversized（返回 true）")
    assert.equal(stub.calls.length, 0, "零 LLM 调用（不走摘要路）")
    assert.notEqual(agent.history[0].content, BIG, "超限消息已截断（copy-on-write 替换）")
    assert.match(agent.history[0].content, /\[\.\.\. \d+ chars truncated — single message too large for context window \.\.\.\]/, "截断桩在场（确定性截断——非 fallback 路）")
    assert.ok(agent.history[0].content.length < BIG.length && agent.history[0].content.length <= 8000, "长度降至上限内（8000）")
    assert.equal(agent._lastCompressInfo ?? null, null, "非 fallback 态（`_lastCompressInfo` 不落）")
    assert.equal(agent._lastPromptTokens, null, "基线失效（同压缩语义）")
    // 正控：无 force ⇒ 阈值未达 ⇒ 零动作（第三去向不可达）
    const agent2 = newAgent([{ role: "user", content: BIG }])
    assert.equal(await compressIfNeeded(agent2, 10 ** 9, {}, {}), false, "无 force + 阈值未达 ⇒ false")
    assert.equal(agent2.history[0].content, BIG, "零改写")
  } finally { stub.restore() }
})

test("用例 1 正常：消息序 = system + 中段 + 指令（AC1 形态面；声明面见用例 8 / 退化见用例 9）", async () => {
  const history = baseHistory()
  const agent = newAgent(history)
  const stub = stubFetch()
  try {
    assert.equal(await compressIfNeeded(agent, 1, {}, { systemPrompt: SYS }), true, "阈值触达 ⇒ 压缩发生")
    assert.equal(stub.calls.length, 1)
    const body = stub.calls[0]
    assert.equal(body.messages.length, 26, "1 system + 中段 24 + 指令 1")
    assert.deepEqual(body.messages, buildCompressMessages(history, 24, SYS, SUMMARIZE_PROMPT), "调用点形态 = 纯函数产物")
    assert.equal(body.messages.at(-1).role, "user", "末条 = 指令（user）")
    assert.equal(body.messages.at(-1).content, SUMMARIZE_PROMPT)
    assert.equal(Object.hasOwn(body, "tools"), false, "本条 extras 无 tools ⇒ 声明面缺省（带声明面 = 用例 8；退化判据 = 用例 9）")
    assert.ok(agent.history[0].content.startsWith(COMPACTION_MARK), "摘要 note 落盘")
    assert.ok(agent.history[0].content.includes("SUMMARY-BODY"), "摘要正文 = 桩返回")
  } finally { stub.restore() }
})

test("用例 2 正常：压缩请求去末条 = 回合请求前缀的同长切片（AC2）", async () => {
  const history = baseHistory()
  const agent = newAgent(history)
  const stub = stubFetch()
  try {
    await compressIfNeeded(agent, 1, {}, { systemPrompt: SYS })
    const prefix = stub.calls[0].messages.slice(0, -1)
    assert.equal(prefix.length, 25, "system + 中段 24")
    assert.deepEqual(prefix, [{ role: "system", content: SYS }, ...history].slice(0, prefix.length), "逐元素深等 ⇒ 前缀可复用")
  } finally { stub.restore() }
})

test("用例 3 边界：尾部起于 assistant（D-CC18 并入分支）——切点不变、前缀同构", async () => {
  const history = baseHistory({ tailAssistant: true })
  assert.equal(history[24].role, "assistant", "夹具前提：tail 首条 = assistant")
  const agent = newAgent(history)
  const stub = stubFetch()
  try {
    await compressIfNeeded(agent, 1, {}, { systemPrompt: SYS })
    const messages = stub.calls[0].messages
    assert.equal(messages.length, 26, "切点 = 同一 tailStart（24）——与无并入分支同构")
    assert.deepEqual(messages.slice(0, -1), [{ role: "system", content: SYS }, ...history].slice(0, 25))
    assert.equal(agent._runStartHistoryLen, 1, "并入分支边界 = head + 1")
    assert.equal(agent.history[1].content, `${PLACEHOLDER}\n\ndraft 24`, "占位并入 tail 首条（零文本丢失）")
  } finally { stub.restore() }
})

test("用例 4 边界：并行工具结果落在中段尾部——配对完整、零孤儿、零合成占位（AC3）", async () => {
  const history = baseHistory({ parallelTools: true })
  assert.equal(pairingViolations([{ role: "tool", tool_call_id: "x", content: "y" }]).length, 1, "检测器正控")
  const agent = newAgent(history)
  const stub = stubFetch()
  try {
    await compressIfNeeded(agent, 1, {}, { systemPrompt: SYS })
    const messages = stub.calls[0].messages
    assert.deepEqual(
      messages.filter((m) => m.role === "tool").map((m) => m.tool_call_id),
      ["call_p1", "call_p2"],
      "两条并行 tool 结果都在请求内（中段）",
    )
    assert.equal(messages.some((m) => m.tool_calls?.length === 2), true, "tool_calls ×2 的 assistant 在中段")
    assert.deepEqual(pairingViolations(messages), [], "零孤儿 / 零缺结果 / 零合成占位")
  } finally { stub.restore() }
})

test("用例 5 边界：无 system（extras 缺省）——消息 = 中段 + 指令，不抛错（AC4）", async () => {
  const history = baseHistory()
  const agent = newAgent(history)
  const stub = stubFetch()
  try {
    assert.equal(await compressIfNeeded(agent, 1, {}, {}), true)
    const messages = stub.calls[0].messages
    assert.equal(messages.length, 25, "中段 24 + 指令 1（无 system 头）")
    assert.equal(messages.some((m) => m.role === "system"), false)
    assert.deepEqual(messages, buildCompressMessages(history, 24, undefined, SUMMARIZE_PROMPT))
  } finally { stub.restore() }
})

test("用例 6 错误：空白摘要 ⇒ 抛错且 agent.history 零改写（AC5）", async () => {
  const history = baseHistory()
  const agent = newAgent(history)
  const stub = stubFetch({ content: "" })
  try {
    await assert.rejects(compressIfNeeded(agent, 1, {}, { systemPrompt: SYS }), /compaction summary is empty/)
    assert.equal(agent.history, history, "同一数组引用 ⇒ 零改写")
    assert.equal(agent.history.length, 40)
    assert.equal(agent._lastCompressInfo, undefined, "未计为成功（无完成信息）")
  } finally { stub.restore() }
})

test("用例 7 错误：请求失败 / 中止——失败抛错、AbortError 透传；history 零改写（AC5）", async () => {
  const savedSleep = _rateHooks.sleep
  _rateHooks.sleep = async () => {} // 重试退避不真等（离线）
  try {
    const h500 = baseHistory()
    const a500 = newAgent(h500)
    const s500 = stubFetch({ status: 500 })
    try {
      await assert.rejects(
        compressIfNeeded(a500, 1, {}, { systemPrompt: SYS }),
        (e) => e.name !== "AbortError" && /500/.test(e.message),
      )
      assert.equal(s500.calls.length, 4, "既有重试语义不变（1 + MAX_RETRIES）")
      assert.equal(a500.history, h500, "失败不改 history")
    } finally { s500.restore() }

    const hAbort = baseHistory()
    const aAbort = newAgent(hAbort)
    const sAbort = stubFetch({ abort: true })
    try {
      await assert.rejects(
        compressIfNeeded(aAbort, 1, {}, { systemPrompt: SYS }),
        (e) => e.name === "AbortError",
        "中止透传（不吞）",
      )
      assert.equal(sAbort.calls.length, 1, "中止不重试")
      assert.equal(aAbort.history, hAbort)
    } finally { sAbort.restore() }
  } finally { _rateHooks.sleep = savedSleep }
})

test('用例 8 正常 v2：带 tool 中段 + 与回合同声明面 tools（无 tool_choice）+ 泄漏只取 content（设计 §6.14 判定规则 · 备选② 形态）', async () => {
  const history = baseHistory({ parallelTools: true })
  const agent = newAgent(history)
  const stub = stubFetch({ toolCalls: LEAK_TOOL_CALL })
  try {
    await compressIfNeeded(agent, 1, {}, { systemPrompt: SYS, tools: TURN_TOOLS })
    const body = stub.calls[0]
    // 同一声明面（回合请求 = `tools: toolSchemas`——agent.mjs:241；压缩调用点原样透传 `extras?.tools`，无第二构造点）：
    // 线下可判形 = 与回合请求出站体逐字节同值（出站即 JSON.stringify，引用同一性不可观测）。
    await chat(PROVIDER, { messages: [{ role: "system", content: SYS }, ...history], tools: TURN_TOOLS })
    const turnBody = stub.calls.at(-1)
    assert.equal(JSON.stringify(body.tools), JSON.stringify(turnBody.tools), "tools 声明面 = 回合请求出站值（逐字节同值）")
    assert.equal(JSON.stringify(body.tools), JSON.stringify(TURN_TOOLS), "= 声明面原样（无重排 / 无裁剪子集）")
    assert.equal(Object.hasOwn(body, "tool_choice"), false, "不发 tool_choice（实测该参数使服务端丢弃 tools 区 ⇒ 命中 0%——设计 §6.14 备选②）")
    assert.equal(Object.hasOwn(turnBody, "tool_choice"), false, "对照面：回合请求亦不发 tool_choice")
    assert.deepEqual(pairingViolations(body.messages), [], "中段 tool / tool_calls 配对完整、零归一化占位")
    assert.equal(body.messages.filter((m) => m.role === "tool").length, 2, "两条 tool 消息随中段发出")
    assert.ok(agent.history[0].content.includes("SUMMARY-BODY"), "摘要正文 = 桩 content")
    assert.deepEqual(agent.history.filter((m) => m.tool_calls?.length || m.role === "tool"), [],
      "泄漏的 tool_calls 零落点（不入 history / 不进注记）")
    assert.equal(JSON.stringify(agent.history).includes("call_leak"), false, "响应 tool_calls 不入摘要面")
  } finally { stub.restore() }
})

test("用例 9 边界：extras.tools 缺省 ⇒ tools / tool_choice 均不发（退化面 1 · AC8）", async () => {
  const history = baseHistory()
  const agent = newAgent(history)
  const stub = stubFetch()
  try {
    assert.equal(await compressIfNeeded(agent, 1, {}, { systemPrompt: SYS }), true)
    const body = stub.calls[0]
    assert.equal(Object.hasOwn(body, "tools"), false, "无声明面 ⇒ 不发 body.tools")
    assert.equal(Object.hasOwn(body, "tool_choice"), false, "无声明面 ⇒ 不发 body.tool_choice（本形态恒不发 ⇒ 退化面登记，非可判别面；部分服务端对该组合 400）")
    assert.equal(body.messages.length, 26, "消息序不变（1 system + 中段 24 + 指令 1）")
  } finally { stub.restore() }
})

test("用例 10 正常 v3：随带与回合请求同源的 reasoningEffort（不硬编码；v3 起 = 首现命中前提）", async () => {
  const history = baseHistory()
  const provider = { ...PROVIDER, thinking: { type: "enabled" }, reasoningEffort: "max" } // 生产 config 形态（deepseek preset）
  const agent = { provider, history, tasks: [], planMode: false }
  const stub = stubFetch()
  try {
    await compressIfNeeded(agent, 1, {}, { systemPrompt: SYS, tools: TURN_TOOLS })
    const body = stub.calls[0]
    await chat(provider, { messages: [{ role: "system", content: SYS }, ...history], tools: TURN_TOOLS })
    assert.equal(body.reasoning_effort, "max", "压缩请求随带回合侧配置值")
    assert.equal(body.reasoning_effort, stub.calls.at(-1).reasoning_effort, "与回合请求出站值同值（同源 = 调用侧 agent.provider 同字段）")
    assert.equal(Object.hasOwn(body, "thinking"), false, "thinking 仍不带（D9——不影响命中：探针 F4/F5）")

    const agent2 = { provider: { ...provider, reasoningEffort: "low" }, history: baseHistory(), tasks: [], planMode: false }
    await compressIfNeeded(agent2, 1, {}, { systemPrompt: SYS })
    assert.equal(stub.calls.at(-1).reasoning_effort, "low", "随配置档位而变 ⇒ 非硬编码（deepseek-flash enum = low/high/max）")
  } finally { stub.restore() }
})

test("用例 11 退化：provider 未配置 reasoningEffort ⇒ 压缩 / 回合两侧均不发（缺省同修前）", async () => {
  const history = baseHistory()
  const agent = newAgent(history)
  const stub = stubFetch()
  try {
    assert.equal(await compressIfNeeded(agent, 1, {}, { systemPrompt: SYS }), true)
    const body = stub.calls[0]
    await chat(PROVIDER, { messages: [{ role: "system", content: SYS }, ...history] })
    assert.equal(Object.hasOwn(body, "reasoning_effort"), false, "无配置 ⇒ 不发（= 修前行为）")
    assert.equal(Object.hasOwn(stub.calls.at(-1), "reasoning_effort"), false, "回合请求同侧缺省（同源判据）")
    assert.equal(Object.hasOwn(body, "thinking"), false, "thinking 恒不带（D9）")
  } finally { stub.restore() }
})
