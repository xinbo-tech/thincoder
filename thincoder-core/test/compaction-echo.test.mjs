/**
 * compaction-echo.test.mjs — 压缩注入回声安全面用例（D-CC18 · 批次档 2026-09-16-subagent-reasoning-echo §2）。
 *
 * 断言面（INV）：applyCompression 产物（降级路 `compressFallback` 直驱、无网络）零「无 reasoning_content
 * 的 assistant 紧邻 assistant」形态——DeepSeek 系 thinking 协议对压缩后首发请求 400 的成因形态
 * （轨迹实证：压缩后首发必死、同链 5 子代理全灭；判别面 = 相邻性，非「有无 reasoning」）。
 * 覆盖：T0 检测器正控（轨迹原样形态必报）· T1 触发形态（tail 首条 = assistant ⇒ 占位并入）·
 * T2 非触发回归（tail 首条 = user ⇒ 形状逐字同修前）· T3 边界（content null / 缺省 / 多模态数组）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { compressFallback, mergeAdjacentAssistantEchoes, isAssistantEchoPair } from "../context.mjs"
import { applySession } from "../session.mjs"

/** 占位回复字面（D9——与 context.mjs 的 COMPACTION_PLACEHOLDER 同字面） */
const PLACEHOLDER = "Understood. I'll continue from these notes, re-verifying anything transient."

/** 出站形态不变量检测器：报出「前一条 assistant 无 reasoning_content 且下一条仍为 assistant」的违例对 */
function echoViolations(messages) {
  const bad = []
  for (let i = 1; i < messages.length; i++) {
    const prev = messages[i - 1]
    if (prev.role === "assistant" && !prev.reasoning_content && messages[i].role === "assistant") {
      bad.push({ prevIndex: i - 1, index: i, prevContent: prev.content, content: messages[i].content })
    }
  }
  return bad
}

/** 40 条历史夹具（KEEP_HEAD = 0 ⇒ 切割面 tailStart = 24：keepTail = min(300, ⌊40 × 0.4⌋) = 16） */
function baseHistory() {
  const h = []
  for (let i = 0; i < 40; i++) {
    h.push(i % 2 === 0
      ? { role: "user", content: `u${i}`, ts: 1000 + i }
      : { role: "assistant", content: `a${i}`, reasoning_content: `r${i}`, ts: 1000 + i })
  }
  // 中段一条真实工具对（覆盖中段序列化 + tail 侧配对修复扫描）
  h[5] = {
    role: "assistant", content: null, reasoning_content: "r5", ts: 1005,
    tool_calls: [{ id: "call_mid", type: "function", function: { name: "grep", arguments: "{}" } }],
  }
  h[6] = { role: "tool", tool_call_id: "call_mid", name: "grep", content: "mid result", ts: 1006 }
  return h
}

function newAgent(history) {
  return { provider: { model: "deepseek-flash" }, history, tasks: [], planMode: false }
}

test("T0 检测器正控：轨迹档原样形态（占位 assistant 紧邻 assistant）必报违例", () => {
  // 轨迹 38478126a2c4-100.jsonl 失败请求形态逐字复刻（messages 索引 1..4）：
  // user(压缩注记) → assistant(占位·keys role|content|ts) → assistant(rc + tool_calls) → tool…
  const traceShape = [
    { role: "user", content: "[Context was automatically compacted. Below is a summary of earlier work. …]", ts: 1 },
    { role: "assistant", content: PLACEHOLDER, ts: 2 },
    { role: "assistant", content: null, reasoning_content: "…", tool_calls: [{ id: "call_x", type: "function", function: { name: "grep", arguments: "{}" } }], ts: 3 },
    { role: "tool", tool_call_id: "call_x", name: "grep", content: "…", ts: 4 },
  ]
  const bad = echoViolations(traceShape)
  assert.equal(bad.length, 1, "正控必须报出违例对（防恒绿空检测器）")
  assert.deepEqual([bad[0].prevIndex, bad[0].index], [1, 2])
})

test("T1 触发形态：tail 首条为 assistant ⇒ 占位并入该条（零违例 + 零丢失 + 边界 = head + 1）", () => {
  const h = baseHistory()
  h[24] = {
    role: "assistant", content: "draft 24", reasoning_content: "rc24", ts: 1024,
    tool_calls: [{ id: "call_t1", type: "function", function: { name: "read", arguments: "{\"path\":\"x\"}" } }],
  }
  h[25] = { role: "tool", tool_call_id: "call_t1", name: "read", content: "tool result 25", ts: 1025 }
  const agent = newAgent(h)

  assert.equal(compressFallback(agent), true)
  assert.deepEqual(echoViolations(agent.history), [], "产物零违例（INV）")
  assert.equal(agent.history.length, 17) // head(0) + note + merged + tail.slice(1) = tail + 1
  const merged = agent.history[1]
  assert.equal(merged.role, "assistant")
  assert.equal(merged.content, `${PLACEHOLDER}\n\ndraft 24`) // 占位 + 原串（零文本丢失）
  assert.equal(merged.reasoning_content, "rc24") // 推理链原样保留
  assert.equal(merged.tool_calls, h[24].tool_calls) // tool_calls 原样保留（同引用——shallow spread）
  assert.equal(merged.ts, 1024) // 保留尾首原 ts（D-S1 例外——不重写为压缩时刻）
  assert.equal(agent._runStartHistoryLen, 1) // head.length(0) + 1（并入分支）
  // copy-on-write：原对象零改、其余 tail 引用原样（两线共享引用的安全前提）
  assert.equal(h[24].content, "draft 24")
  assert.notEqual(merged, h[24])
  for (let i = 1; i < 16; i++) assert.equal(agent.history[1 + i], h[24 + i])
})

test("T2 非触发回归：tail 首条为 user ⇒ 形状逐字同修前（note + 占位 + tail，边界 = head + 2）", () => {
  const h = baseHistory() // h[24] = user（偶数位默认形态）
  const agent = newAgent(h)

  assert.equal(compressFallback(agent), true)
  assert.deepEqual(echoViolations(agent.history), [])
  assert.equal(agent.history.length, 18) // head(0) + 2 + tail(16)
  assert.equal(agent.history[0].role, "user")
  assert.equal(agent.history[1].role, "assistant")
  assert.equal(agent.history[1].content, PLACEHOLDER) // 常态形状逐字不变
  assert.equal(agent._runStartHistoryLen, 2) // head.length(0) + 2（常态）
  for (let i = 0; i < 16; i++) assert.equal(agent.history[2 + i], h[24 + i]) // tail 引用零改
})

test("T3 边界：content 为 null / 缺省 / 多模态数组 ⇒ 占位单独或前置 text part", () => {
  const cases = [
    { label: "null", content: null, expected: PLACEHOLDER },
    { label: "undefined", content: undefined, expected: PLACEHOLDER },
    { label: "empty string", content: "", expected: PLACEHOLDER },
    {
      label: "array",
      content: [{ type: "text", text: "part text" }, { type: "image_url", image_url: { url: "data:image/png;base64,AA" } }],
      expected: [
        { type: "text", text: PLACEHOLDER },
        { type: "text", text: "part text" },
        { type: "image_url", image_url: { url: "data:image/png;base64,AA" } },
      ],
    },
  ]
  for (const c of cases) {
    const h = baseHistory()
    const msg = { role: "assistant", reasoning_content: "rc", ts: 1024 }
    if (c.content !== undefined) msg.content = c.content
    h[24] = msg
    const agent = newAgent(h)

    assert.equal(compressFallback(agent), true, c.label)
    assert.deepEqual(echoViolations(agent.history), [], c.label)
    assert.deepEqual(agent.history[1].content, c.expected, c.label)
    assert.equal(agent.history[1].reasoning_content, "rc", c.label)
    assert.equal(agent._runStartHistoryLen, 1, c.label)
  }
})

// ─── D-CC19 恢复面回声归并（批 8 ENGINE-DEBT · ED-1——判据 1-5）────────────────

/** 已落盘机读线夹具：user + 占位 assistant（无 reasoning_content）+ 真 assistant（rc + tool_calls）+ tool。 */
function persistedMachineLine() {
  return [
    { role: "user", content: "hello", ts: 1 },
    { role: "assistant", content: "Understood. I'll continue from these notes.", ts: 2 },
    {
      role: "assistant", content: "answer body", reasoning_content: "rc-3", ts: 3,
      tool_calls: [{ id: "call_m2", type: "function", function: { name: "grep", arguments: "{}" } }],
    },
    { role: "tool", tool_call_id: "call_m2", name: "grep", content: "result", ts: 4 },
  ]
}

test("M0 零回归：干净输入返回同一数组引用（===）；健康会话恢复逐元素 JSON 相等", () => {
  const clean = [
    { role: "user", content: "q", ts: 1 },
    { role: "assistant", content: "a", reasoning_content: "r", ts: 2 },
  ]
  assert.equal(mergeAdjacentAssistantEchoes(clean), clean, "干净输入必须返回同一数组引用")
  assert.equal(mergeAdjacentAssistantEchoes(null), null, "非数组原样返回")
  const healthy = [...clean, { role: "user", content: "q2", ts: 3 }]
  const agent = newAgent([])
  applySession(agent, { history: healthy, contextHistory: healthy })
  assert.equal(agent.history.length, healthy.length)
  for (let i = 0; i < healthy.length; i++) {
    assert.equal(JSON.stringify(agent.history[i]), JSON.stringify(healthy[i]), `元素 ${i} 逐字相等`)
  }
})

test("M1 归并有效：病态对恢复后违例计数 = 0（applySession 调用点）", () => {
  const machine = persistedMachineLine()
  assert.equal(echoViolations(machine).length, 1, "夹具自带病态对（正控）")
  const agent = newAgent([])
  applySession(agent, { history: [], contextHistory: machine })
  assert.deepEqual(echoViolations(agent.history), [], "恢复后零违例形态")
  assert.equal(agent.history.length, machine.length - 1, "前条移除、其余原位")
  assert.equal(agent.history[1].content, `${machine[1].content}\n\nanswer body`, "文本以空行相接")
  assert.equal(agent.history[1].reasoning_content, "rc-3")
  assert.equal(agent.history[1].tool_calls, machine[2].tool_calls, "tool_calls 原样保留（同引用）")
  assert.equal(agent.history[1].ts, 3, "保留后条原 ts")
  assert.equal(machine.length, 4, "输入数组零改写（copy-on-write）")
})

test("M2 信息守恒：归并前后文本拼接逐字相等 + tool_calls 总数相等（不丢内容）", () => {
  const machine = persistedMachineLine()
  const textBefore = machine.map((m) => (typeof m.content === "string" ? m.content : "")).join("\n")
  const callsBefore = machine.reduce((n, m) => n + (m.tool_calls?.length ?? 0), 0)
  const out = mergeAdjacentAssistantEchoes(machine)
  const textAfter = out.map((m) => (typeof m.content === "string" ? m.content : "")).join("\n")
  const callsAfter = out.reduce((n, m) => n + (m.tool_calls?.length ?? 0), 0)
  assert.equal(callsAfter, callsBefore, "tool_calls 总数守恒（只搬位置）")
  // 归并只改被并对的接缝：全序文本仅在该接缝由 "\n" 变 "\n\n"——其余逐字守恒
  const seamBefore = `${machine[1].content}\n${machine[2].content}`
  const seamAfter = `${machine[1].content}\n\n${machine[2].content}`
  assert.equal(textAfter, textBefore.replace(seamBefore, seamAfter), "文本逐字守恒（仅接缝空行化）")
})

test("M3 边界：链式三连一次跑完；前条带 tool_calls 不并（F-3 上抛形态锁定）", () => {
  // 链式：A(无 rc) + B(无 rc) + C(有 rc) ⇒ 一条合并消息（迭代至不动点）
  const chain = [
    { role: "user", content: "q", ts: 1 },
    { role: "assistant", content: "A", ts: 2 },
    { role: "assistant", content: "B", ts: 3 },
    { role: "assistant", content: "C", reasoning_content: "rcC", ts: 4 },
  ]
  const merged = mergeAdjacentAssistantEchoes(chain)
  assert.equal(merged.length, 2)
  assert.equal(merged[1].content, "A\n\nB\n\nC", "链式归并至不动点")
  assert.equal(merged[1].reasoning_content, "rcC", "保留链尾字段")
  assert.equal(merged[1].ts, 4, "保留链尾原 ts")
  // 前条带 tool_calls ⇒ 谓词为假、不并（配对安全——孤儿 tool_result 面，上抛 F-3）
  const paired = [
    { role: "assistant", content: "x", tool_calls: [{ id: "c1", type: "function", function: { name: "read", arguments: "{}" } }], ts: 1 },
    { role: "assistant", content: "y", reasoning_content: "r", ts: 2 },
    { role: "tool", tool_call_id: "c1", name: "read", content: "res", ts: 3 },
  ]
  assert.equal(isAssistantEchoPair(paired[0], paired[1]), false, "带 tool_calls 的前条不可并")
  assert.equal(mergeAdjacentAssistantEchoes(paired), paired, "边界形态零改写（同引用锁定）")
  // content 形态：前条 null 文本（空）⇒ 后条 content 原样；前条串 + 后条数组 ⇒ text part 前置
  assert.deepEqual(
    mergeAdjacentAssistantEchoes([
      { role: "assistant", content: null, ts: 1 },
      { role: "assistant", content: "body", reasoning_content: "r", ts: 2 },
    ])[0].content,
    "body",
    "空前条文本 → 后条 content 原样",
  )
  assert.deepEqual(
    mergeAdjacentAssistantEchoes([
      { role: "assistant", content: "pre", ts: 1 },
      { role: "assistant", content: [{ type: "text", text: "part" }], reasoning_content: "r", ts: 2 },
    ])[0].content,
    [{ type: "text", text: "pre" }, { type: "text", text: "part" }],
    "后条多模态 → text part 前置",
  )
})
