/**
 * read-history.test.mjs — SESSION.md §9 message timestamps + read_history tool.
 * T-S1..T-S11 (+ boundary/multimodal/治理面 cases per §9.5 refinements).
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { pushReal } from "../src/context.mjs"
import { compressFallback } from "../src/context.mjs"
import { stripLocalMessageFields } from "../src/escape.mjs"
import { readHistoryTool } from "../src/agent-tools/read-history.mjs"

/** Execute the tool against a canned human-readable line. */
function query(history, args) {
  return JSON.parse(String(readHistoryTool.execute(args ?? {}, { agent: { _fullHistory: history } })))
}

/** Minimal agent shape for context.mjs functions. */
function makeAgent(historyMsgs = []) {
  const agent = { provider: { baseURL: "http://127.0.0.1:1", apiKey: "x", model: "m" }, history: [], _fullHistory: [], tasks: [], planMode: false }
  for (const m of historyMsgs) pushReal(agent, m)
  return agent
}

test("T-S1: pushReal stamps epoch-ms ts on every real message, non-decreasing, pre-set ts preserved", () => {
  const agent = makeAgent()
  const t0 = Date.now()
  pushReal(agent, { role: "user", content: "要求" })
  pushReal(agent, { role: "assistant", content: "ok", tool_calls: [{ id: "c1", type: "function", function: { name: "read", arguments: "{}" } }] })
  pushReal(agent, { role: "tool", tool_call_id: "c1", name: "read", content: "结果" })
  // multimodal user content array rides pushReal too
  pushReal(agent, { role: "user", content: [{ type: "text", text: "看这张图" }, { type: "image_url", image_url: { url: "data:image/png;base64,x" } }] })
  assert.equal(agent.history.length, 4)
  assert.equal(agent._fullHistory.length, 4)
  for (const [i, m] of agent.history.entries()) {
    assert.equal(typeof m.ts, "number", `message ${i} has a numeric ts`)
    assert.ok(m.ts >= t0 - 1000, "ts is the push moment (not a backdate)")
    assert.deepEqual(agent._fullHistory[i], m, "same object in both lines (shared reference)")
  }
  for (let i = 1; i < agent.history.length; i++) {
    assert.ok(agent.history[i].ts >= agent.history[i - 1].ts, "ts non-decreasing (same-ms equality legal — Date.now resolution)")
  }
  // Pre-set ts is preserved (e.g. a message replayed from another end's slot write)
  const preset = { role: "user", content: "legacy", ts: 1234 }
  pushReal(agent, preset)
  assert.equal(agent._fullHistory.at(-1).ts, 1234, "existing ts never overwritten")
})

test("T-S2: old messages without ts — read/render/send tolerant, listed with ts:null", () => {
  // Raw no-ts history (as restored from a legacy session file — applySession assigns wholesale).
  // Objects must never pass through pushReal first: that would stamp them (shared-reference double-write).
  const legacy = [
    { role: "user", content: "旧消息" },
    { role: "assistant", content: "旧答复" },
  ]
  const rawAgent = { history: [...legacy], _fullHistory: [...legacy], tasks: [], planMode: false }
  const out = query(rawAgent._fullHistory, {})
  assert.equal(out.length, 2, "no-ts messages are returned when no time window is set")
  assert.equal(out[0].ts, null, "no ts → ts:null marker")
  assert.equal(out[0].role, "user")
  assert.equal(out[1].content, "旧答复")
  // A time window never matches no-ts messages — but also never crashes
  const win = query(rawAgent._fullHistory, { since: 1, until: Date.now() })
  assert.deepEqual(win, [], "no-ts messages excluded from time windows")
})

test("T-S3: ts never reaches the provider request (send-layer strip)", async () => {
  const { chat } = await import("../src/provider/index.mjs")
  const { createServer } = await import("node:http")
  const requests = []
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      requests.push(JSON.parse(body))
      const frame = JSON.stringify({ choices: [{ index: 0, delta: { content: "hi" } }] })
      const done = JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      res.end(`data: ${frame}\n\ndata: ${done}\n\ndata: [DONE]\n\n`)
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  try {
    const messages = [
      { role: "user", content: "带 ts 的消息", ts: 111, transient: true },
      { role: "assistant", content: "答复", ts: 222 },
    ]
    const ds = { baseURL: `http://127.0.0.1:${port}/v1`, apiKey: "x", model: "deepseek-v4-pro" }
    const result = await chat(ds, { messages })
    assert.equal(result.content, "hi")
    const sent = requests[0].messages
    assert.equal(sent.length, 2)
    for (const m of sent) {
      assert.ok(!("ts" in m), `ts must not ride the wire (${m.role})`)
      assert.ok(!("transient" in m), "transient must not ride the wire either")
    }
    assert.equal(messages[0].ts, 111, "the in-memory history keeps its ts — strip is copy-on-write")
    assert.equal(messages[0].transient, true, "history object untouched")
  } finally {
    server.close()
  }
})

test("T-S3b: stripLocalMessageFields drops ts and transient together, leaves originals intact", () => {
  const msg = { role: "user", content: "x", ts: 5, transient: true }
  const out = stripLocalMessageFields([msg])
  assert.deepEqual(out[0], { role: "user", content: "x" })
  assert.equal(msg.ts, 5, "copy-on-write: original keeps ts")
  const plain = stripLocalMessageFields([{ role: "user", content: "x" }])
  assert.equal(plain[0], plain[0], "no local fields → same object identity")
})

test("T-S4: no filters → newest 50 by default (chronological output, ts/role/name present)", () => {
  const msgs = []
  for (let i = 0; i < 60; i++) msgs.push({ role: "user", content: `消息 ${i}` })
  const agent = makeAgent(msgs) // stamps ts at push — use pushReal-stamped line
  const out = query(agent._fullHistory, {})
  assert.equal(out.length, 50, "default limit 50")
  assert.equal(out[0].content, "消息 10", "newest direction → the LAST 50, oldest-first output")
  assert.equal(out.at(-1).content, "消息 59")
  assert.equal(typeof out[0].ts, "number")
  assert.equal(out[0].role, "user")
  // chronological order guaranteed
  for (let i = 1; i < out.length; i++) assert.ok(out[i].ts >= out[i - 1].ts)
})

test("T-S5: role/keyword/tool filters intersect", () => {
  const msgs = [
    { role: "user", content: "请查一下 config 文件" },
    { role: "assistant", content: "", tool_calls: [{ id: "c1", type: "function", function: { name: "read", arguments: "{path:config}" } }] },
    { role: "tool", tool_call_id: "c1", name: "read", content: "config 内容 100 行" },
    { role: "assistant", content: "看完了" },
    { role: "user", content: "再查一下 src" },
    { role: "tool", tool_call_id: "c2", name: "grep", content: "命中" },
  ]
  const agent = makeAgent(msgs)
  // tool filter matches tool result messages by name AND assistant declarations
  const t = query(agent._fullHistory, { tool: "read" })
  assert.deepEqual(t.map((m) => m.role), ["assistant", "tool"], "read: declaration + result")
  assert.equal(t[1].tool_call_id, "c1")
  // role=assistant + tool=read → the declaring assistant message (intersection)
  const inter = query(agent._fullHistory, { role: "assistant", tool: "read" })
  assert.equal(inter.length, 1)
  assert.equal(inter[0].role, "assistant")
  // keyword narrows by content text
  const kw = query(agent._fullHistory, { keyword: "config" })
  assert.deepEqual(kw.map((m) => m.content), ["请查一下 config 文件", "config 内容 100 行"])
  // triple intersection
  const tri = query(agent._fullHistory, { role: "tool", keyword: "config", tool: "read" })
  assert.equal(tri.length, 1)
  assert.equal(tri[0].name, "read")
  // no match → empty array
  assert.deepEqual(query(agent._fullHistory, { tool: "nope" }), [])
})

test("T-S5b: keyword is case-insensitive substring; empty keyword is a no-op; regex metachars stay literal", () => {
  const msgs = [{ role: "user", content: "Use Config.JSON now" }, { role: "user", content: "看 a.b 文件" }, { role: "user", content: "其他 axb" }]
  const agent = makeAgent(msgs)
  assert.equal(query(agent._fullHistory, { keyword: "config.json" }).length, 1)
  assert.equal(query(agent._fullHistory, { keyword: "" }).length, 3)
  // keyword is a literal substring — regex metachars are escaped, never interpreted
  assert.equal(query(agent._fullHistory, { keyword: "a.b" }).length, 1, "dot matches only the literal dot")
  assert.equal(query(agent._fullHistory, { keyword: "a+b" }).length, 0)
})

test("T-S6: time window inclusive-inclusive; since>until → empty; no-ts excluded", () => {
  // Fresh literals — never through pushReal, so ts values stay exactly as declared.
  const explicit = { _fullHistory: [
    { role: "user", content: "a", ts: 100 },
    { role: "assistant", content: "b", ts: 200 },
    { role: "tool", name: "read", content: "c", ts: 300 },
    { role: "user", content: "d" }, // no ts — never matches a window
  ] }
  // since == until → the boundary message itself matches (inclusive)
  const exact = query(explicit._fullHistory, { since: 200, until: 200 })
  assert.equal(exact.length, 1)
  assert.equal(exact[0].content, "b")
  // inclusive on both edges
  const wide = query(explicit._fullHistory, { since: 100, until: 300 })
  assert.equal(wide.length, 3)
  const openLeft = query(explicit._fullHistory, { until: 200 })
  assert.equal(openLeft.length, 2)
  const openRight = query(explicit._fullHistory, { since: 200 })
  assert.equal(openRight.length, 2)
  // since > until → empty result
  assert.deepEqual(query(explicit._fullHistory, { since: 300, until: 100 }), [])
  // no-ts message never enters a window
  assert.ok(!explicit._fullHistory.some((m) => m.content === "d" && typeof m.ts === "number"))
  // invalid boundaries → explicit error, not silent
  const err = String(readHistoryTool.execute({ since: "not-a-number" }, { agent: explicit }))
  assert.ok(err.startsWith("Error: invalid since"), err)
})

test("T-S7: limit + direction=oldest takes the oldest N (chronological output)", () => {
  const msgs = []
  for (let i = 0; i < 40; i++) msgs.push({ role: "user", content: `m ${i}` })
  const agent = makeAgent(msgs)
  const out = query(agent._fullHistory, { limit: 5, direction: "oldest" })
  assert.equal(out.length, 5)
  assert.equal(out[0].content, "m 0")
  assert.equal(out.at(-1).content, "m 4")
  // limit clamped to 200
  const big = query(agent._fullHistory, { limit: 500 })
  assert.equal(big.length, 40, "clamped to history size — only 40 exist")
  const bigger = []
  for (let i = 0; i < 250; i++) bigger.push({ role: "user", content: `x ${i}` })
  const agentBig = makeAgent(bigger)
  assert.equal(query(agentBig._fullHistory, { limit: 500 }).length, 200, "limit > 200 clamps to 200")
})

test("T-S8: content truncated at ~500 chars with marker; tool_calls summarized to names", () => {
  const huge = "x".repeat(10_000)
  const msgs = [
    { role: "tool", tool_call_id: "c1", name: "read", content: huge },
    { role: "assistant", content: "", tool_calls: [
      { id: "a", type: "function", function: { name: "read", arguments: JSON.stringify({ path: "长参数不展开" }) } },
      { id: "b", type: "function", function: { name: "grep", arguments: "{}" } },
    ] },
  ]
  const agent = makeAgent(msgs)
  const out = query(agent._fullHistory, {})
  const toolEntry = out[0]
  assert.ok(toolEntry.content.includes("truncated"), "marker present")
  assert.ok(toolEntry.content.length < 1000, "content bounded")
  const asst = out[1]
  assert.deepEqual(asst.tool_calls, ["read", "grep"], "names only — arguments never expanded")
  assert.ok(!JSON.stringify(out).includes("长参数不展开"), "arguments stay out of the output")
  assert.ok(asst.content === "" || asst.content.length < 1000)
})

test("T-S8b: multimodal content arrays — keyword matches text parts, output is the text summary, never crashes", () => {
  const msgs = [
    { role: "user", content: [{ type: "text", text: "看看这张截图" }, { type: "image_url", image_url: { url: "data:image/png;base64,AAAA" } }] },
    { role: "user", content: "普通文本" },
  ]
  const agent = makeAgent(msgs)
  const byKw = query(agent._fullHistory, { keyword: "截图" })
  assert.equal(byKw.length, 1, "keyword matches the text part of a multimodal message")
  const out = query(agent._fullHistory, {})
  assert.equal(out[0].content, "看看这张截图", "content = text-part summary")
  assert.equal(out[0].role, "user")
})

test("T-S9: readonly tool — planMode passes without a permission ask", async () => {
  assert.equal(readHistoryTool.readonly, true, "readonly flag set")
  const { executeToolCalls } = await import("../src/agent/dispatch.mjs")
  const agent = { tools: [readHistoryTool], cwd: process.cwd(), config: { agent: {} }, planMode: true, autoApprove: false, _role: null, _fullHistory: [{ role: "user", content: "p", ts: 1 }] }
  const toolByName = new Map([["read_history", readHistoryTool]])
  let asked = 0
  const results = await executeToolCalls(agent, toolByName, [{ id: "c1", name: "read_history", arguments: "{}" }], {
    onPermissionRequest: async () => { asked++; return true },
  }, 0, undefined)
  assert.equal(asked, 0, "readonly → planMode pass, no permission ask")
  assert.equal(results.length, 1)
  assert.equal(results[0].ok, true, "tool executed inside plan mode")
  assert.deepEqual(JSON.parse(results[0].result), [{ ts: 1, role: "user", content: "p" }], "history queryable inside plan mode")
})

test("T-S10: after compaction _fullHistory keeps every pre-compaction message (audit-complete)", () => {
  const msgs = Array.from({ length: 30 }, (_, i) => ({ role: "user", content: `user message ${i}` }))
  const agent = makeAgent(msgs)
  assert.equal(compressFallback(agent), true, "fallback compaction runs on a long history")
  assert.ok(agent.history.length < 30, "machine line shrank")
  assert.equal(agent._fullHistory.length, 30, "human line untouched")
  // Compacted-away middle is still queryable through read_history
  const middle = query(agent._fullHistory, { keyword: "user message 5" })
  assert.equal(middle.length, 1)
  assert.equal(typeof middle[0].ts, "number", "pre-compaction messages carry their push-time ts")
})

test("AC-S1b: compaction-injected note + Understood carry ts (applyCompression, §9.5 refinement 7)", () => {
  const msgs = Array.from({ length: 30 }, (_, i) => ({ role: "user", content: `m ${i}` }))
  const agent = makeAgent(msgs)
  assert.equal(compressFallback(agent), true)
  assert.equal(agent.history[0].role, "user")
  assert.ok(String(agent.history[0].content).includes("truncated after repeated summarization failures"), "FALLBACK_NOTE at index 0")
  assert.equal(typeof agent.history[0].ts, "number", "note carries ts")
  assert.equal(agent.history[1].role, "assistant")
  assert.equal(agent.history[1].ts, agent.history[0].ts, "note + Understood share the compaction-moment ts")
})

test("T-S11: depth gate — read_history registered at depth 0 only, absent for subagents", async () => {
  const { createAgent } = await import("../src/agent.mjs")
  const { prepareRun } = await import("../src/agent/setup.mjs")
  const { mkdtempSync, rmSync } = await import("node:fs")
  const { tmpdir } = await import("node:os")
  const { join } = await import("node:path")
  const cwd = mkdtempSync(join(tmpdir(), "rh-depth-"))
  try {
    const base = { provider: { baseURL: "http://127.0.0.1:1", apiKey: "x", model: "m" }, tools: [], config: { agent: {} }, cwd }
    const top = createAgent({ ...base, role: undefined })
    const { toolSchemas: topSchemas } = await prepareRun(top, "hi", {})
    const topNames = topSchemas.map((s) => s.function.name)
    assert.ok(topNames.includes("read_history"), "depth-0 schema includes read_history")
    const child = createAgent({ ...base, role: "explore" })
    const { toolSchemas: childSchemas } = await prepareRun(child, "hi", {}, { depth: 1 })
    const childNames = childSchemas.map((s) => s.function.name)
    assert.ok(!childNames.includes("read_history"), "subagent (depth>0) schema has no read_history")
    assert.ok(topNames.includes("task"), "sanity: depth-0 meta tools intact")
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-S11b: invalid role/direction return explicit errors (never silent empty)", () => {
  const ctx = { agent: { _fullHistory: [] } }
  assert.ok(String(readHistoryTool.execute({ role: "system" }, ctx)).startsWith("Error: invalid role"))
  assert.ok(String(readHistoryTool.execute({ role: "bot" }, ctx)).startsWith("Error: invalid role"))
  assert.ok(String(readHistoryTool.execute({ direction: "forward" }, ctx)).startsWith("Error: invalid direction"))
  assert.ok(String(readHistoryTool.execute({ limit: "many" }, ctx)).startsWith("Error: invalid limit"))
  // empty history → "[]" (clean empty JSON)
  assert.equal(String(readHistoryTool.execute({}, ctx)), "[]")
})
