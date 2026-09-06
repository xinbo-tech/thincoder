/**
 * read-history.test.mjs — SESSION.md §9 message timestamps + read_history tool.
 * T-S1..T-S11 (+ boundary/multimodal/治理面 cases per §9.5 refinements) +
 * T-R19.1..7 (§13 R19 跨会话检索 + 检索族消歧——2026-09-06).
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname } from "node:path"
import { pushReal } from "../src/context.mjs"
import { compressFallback } from "../src/context.mjs"
import { stripLocalMessageFields } from "../src/escape.mjs"
import { readHistoryTool, READ_HISTORY_SCAN_MAX } from "../src/agent-tools/read-history.mjs"
import { recentChangesTool } from "../src/agent-tools/recent-changes.mjs"
import { sessionPath, manifestPath, slotPath } from "../src/session-slots.mjs"

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

// ────────────────────────────────────────────────────────────────
// R19 跨会话检索 + 检索族消歧（SESSION.md §13——T-R19.1..7——2026-09-06）
// 会话文件落在真实 ~/.thincoder/sessions（configDir import 时固定）；mkdtemp cwd 哈希唯一，
// 测试只写/删自己的哈希文件（session-eng-advisor.test.mjs 同型先例）。
// ────────────────────────────────────────────────────────────────

/** 清理某 cwd 哈希前缀在本机 sessions 目录落下的全部文件（含 manifest/end marker）。 */
function cleanupSessionFiles(cwd) {
  const base = sessionPath(cwd)
  for (const suffix of ["", ".manifest", ".manifest.cli", ".1", ".2", ".tmp"]) {
    try { rmSync(base + suffix, { force: true }) } catch {}
  }
}

/** 写入一个 manifest（slots 摘要 digest 形态——新格式——listSlots 无需读槽文件即可列元数据）。 */
function writeManifest(cwd, slots) {
  const m = {
    active: Object.keys(slots).length > 0 ? Math.max(...Object.keys(slots).map(Number)) : null,
    slots,
    slotSessions: Object.fromEntries(Object.keys(slots).map((n) => [n, `pid-1-${n}`])),
    sessionId: "r19-test",
  }
  mkdirSync(dirname(manifestPath(cwd)), { recursive: true })
  writeFileSync(manifestPath(cwd), JSON.stringify(m), "utf8")
}

function execTool(args, cwd) {
  return String(readHistoryTool.execute(args, { agent: { cwd, _fullHistory: [] } }))
}

test("T-R19.1: 缺省 = 本会话（不传 path）——既有行为零变化（回归）", () => {
  const tmp = mkdtempSync(join(tmpdir(), "rh-r19-default-"))
  try {
    // 磁盘上放一个"诱惑"会话文件——缺省查询绝不能读它
    writeFileSync(join(tmp, "session.json.1"), JSON.stringify({ version: 2, cwd: tmp, title: "磁盘旧会话", history: [
      { role: "user", content: "磁盘里的旧消息", ts: 1 },
    ] }), "utf8")
    const out = query([{ role: "user", content: "本会话的新消息", ts: 2 }], { keyword: "消息" })
    assert.equal(out.length, 1, "缺省只查本会话 _fullHistory")
    assert.equal(out[0].content, "本会话的新消息")
    assert.equal(out[0].ts, 2)
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

test("T-R19.2: 跨会话单槽——path = 指定会话文件 + keyword 命中旧会话消息（含 ts）", () => {
  const tmp = mkdtempSync(join(tmpdir(), "rh-r19-deep-"))
  const file = join(tmp, "old-session.json.2")
  try {
    writeFileSync(file, JSON.stringify({
      version: 2,
      cwd: "D:\\other-project",
      title: "旧项目会话",
      updatedAt: 111,
      history: [
        { role: "user", content: "裁定：方案 A 落地", ts: 100 },
        { role: "assistant", content: "", ts: 101, tool_calls: [{ id: "g1", type: "function", function: { name: "grep", arguments: "{}" } }] },
        { role: "tool", name: "grep", tool_call_id: "g1", content: "命中 3 处", ts: 102 },
        { role: "user", content: "没有 ts 的旧线" }, // 无 ts → 永不上时间窗
        { role: "user", content: "另一个裁定：方案 B 否决", ts: 103 },
      ],
    }), "utf8")
    // keyword 命中（含 ts）
    const byKw = JSON.parse(execTool({ path: file, keyword: "方案 A" }, tmp))
    assert.equal(byKw.length, 1)
    assert.equal(byKw[0].content, "裁定：方案 A 落地")
    assert.equal(byKw[0].ts, 100, "旧会话消息带 ts 返回")
    // tool 面（声明 + 结果）同语义
    const byTool = JSON.parse(execTool({ path: file, tool: "grep" }, tmp))
    assert.deepEqual(byTool.map((m) => m.role), ["assistant", "tool"], "声明 + 结果两条")
    // 时间窗面（无 ts 消息被排除）
    const byWin = JSON.parse(execTool({ path: file, since: 102, until: 103 }, tmp))
    assert.deepEqual(byWin.map((m) => m.content), ["命中 3 处", "另一个裁定：方案 B 否决"], "since/until inclusive-inclusive")
    // 相对路径按项目 cwd 解析（覆写前查——后续覆写会换内容）
    const rel = JSON.parse(execTool({ path: "old-session.json.2", keyword: "方案" }, tmp))
    assert.ok(rel.length >= 1, "相对路径相对 agent.cwd 解析")
    // limit clamp（>200 → 200）沿用 §9.5 #5
    const many = []
    for (let i = 0; i < 250; i++) many.push({ role: "user", content: `m ${i}`, ts: 1000 + i })
    writeFileSync(file, JSON.stringify({ version: 2, cwd: "D:\\other-project", history: many }), "utf8")
    assert.equal(JSON.parse(execTool({ path: file, limit: 500 }, tmp)).length, 200, "limit > 200 钳制 200")
    // direction=oldest 取最早端
    const oldest = JSON.parse(execTool({ path: file, limit: 3, direction: "oldest" }, tmp))
    assert.deepEqual(oldest.map((m) => m.content), ["m 0", "m 1", "m 2"])
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

test("T-R19.3: cwd 发现面——path = \"cwd:xxx\" 列槽摘要（槽号 + 完整文件路径 + title/消息数/时间）", () => {
  const cwd = mkdtempSync(join(tmpdir(), "rh-r19-list-"))
  try {
    writeManifest(cwd, {
      "1": { ts: 1000, messageCount: 4, turnCount: 2, firstMessage: "a", activeProvider: "p", updatedAt: 2000, title: "旧会话 A" },
      "2": { ts: 3000, messageCount: 9, turnCount: 3, firstMessage: "b", activeProvider: "p", updatedAt: 4000, title: "新会话 B" },
    })
    const out = execTool({ path: `cwd:${cwd}` }, cwd)
    assert.ok(out.startsWith(`Session slots for cwd: ${cwd}`), "发现面头行含 cwd")
    assert.ok(out.includes(`slot 1: ${slotPath(cwd, 1)}`), "槽摘要含槽号 + 完整文件路径（slot 1——寻址字段）")
    assert.ok(out.includes(`slot 2: ${slotPath(cwd, 2)}`), "槽摘要含槽号 + 完整文件路径（slot 2）")
    assert.ok(out.includes('title: "旧会话 A"'), "摘要含 title")
    assert.ok(out.includes("messages: 4"), "摘要含消息数")
    assert.ok(out.includes("updatedAt: 2000"), "摘要含更新时间")
    // 时间序（updatedAt 降序）：slot 2（4000）先于 slot 1（2000）
    assert.ok(out.indexOf("slot 2:") < out.indexOf("slot 1:"), "列表按时间序（新 → 旧）")
  } finally {
    cleanupSessionFiles(cwd)
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-R19.3b: 错误——未知 cwd（path = \"cwd:nonexistent\"）明确文案", () => {
  const gone = mkdtempSync(join(tmpdir(), "rh-r19-gone-"))
  rmSync(gone, { recursive: true, force: true }) // 目录已不存在 = 未知 cwd
  const out = execTool({ path: `cwd:${gone}` }, gone)
  assert.ok(out.startsWith("Error: unknown cwd"), out)
  assert.ok(out.includes("no session directory for this cwd"), "明确文案（无该 cwd 会话目录）")
})

test("T-R19.3c: 边界——cwd 无槽（存在但从未开会话）→ 空列表 + 提示", () => {
  const empty = mkdtempSync(join(tmpdir(), "rh-r19-empty-"))
  try {
    const out = execTool({ path: `cwd:${empty}` }, empty)
    assert.ok(!out.startsWith("Error"), "无会话不是错误")
    assert.ok(out.includes("no session slots"), "空列表提示（无会话）")
  } finally {
    cleanupSessionFiles(empty)
    rmSync(empty, { recursive: true, force: true })
  }
})

test("T-R19.3d: 错误——目标文件缺失/损坏 → 错误返回（不崩——§9 错误处理同型）", () => {
  const tmp = mkdtempSync(join(tmpdir(), "rh-r19-bad-"))
  try {
    // 缺失
    const missing = execTool({ path: join(tmp, "nope.json.3") }, tmp)
    assert.ok(missing.startsWith("Error: session file not found"), missing)
    // 损坏（非 JSON）
    const corrupt = join(tmp, "corrupt.json.1")
    writeFileSync(corrupt, "{ this is not json", "utf8")
    const badJson = execTool({ path: corrupt }, tmp)
    assert.ok(badJson.startsWith("Error:") && badJson.includes("not a valid session file"), badJson)
    // 结构非法（JSON 但无 history 数组）
    const noHist = join(tmp, "nohist.json.1")
    writeFileSync(noHist, JSON.stringify({ version: 2, cwd: tmp, title: "x" }), "utf8")
    const badHist = execTool({ path: noHist }, tmp)
    assert.ok(badHist.startsWith("Error:") && badHist.includes("no history array"), badHist)
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

test("T-R19.4: 子代理拒——read_history 仍 depth-0 only（含 path 参数的 schema 只在 depth 0）", async () => {
  const { createAgent } = await import("../src/agent.mjs")
  const { prepareRun } = await import("../src/agent/setup.mjs")
  const cwd = mkdtempSync(join(tmpdir(), "rh-r19-depth-"))
  try {
    const base = { provider: { baseURL: "http://127.0.0.1:1", apiKey: "x", model: "m" }, tools: [], config: { agent: {} }, cwd }
    const top = createAgent({ ...base, role: undefined })
    const { toolSchemas: topSchemas } = await prepareRun(top, "hi", {})
    const rhSchema = topSchemas.find((s) => s.function.name === "read_history")
    assert.ok(rhSchema, "depth-0 schema includes read_history")
    assert.ok(rhSchema.function.parameters.properties.path, "R19: path 参数在 depth-0 schema")
    const child = createAgent({ ...base, role: "explore" })
    const { toolSchemas: childSchemas } = await prepareRun(child, "hi", {}, { depth: 1 })
    assert.ok(!childSchemas.some((s) => s.function.name === "read_history"), "子代理（depth>0）无 read_history（跨会话面同样拒）")
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-R19.5: 消歧描述锚——read_history 描述含族表尾段（D-R19b 逐字——fail-when-unchanged）", () => {
  const guide =
    "检索/记忆族选哪个：查**本会话**说过/裁定过 → read_history（默认）；查**别的会话/项目**旧对话 → read_history 带 path/cwd 参数；查**本 run 改过哪些文件** → recent_changes；查**跨会话已存知识/约定**（memory）→ memory search；查**项目设计文档** → doc_search；查**代码实现** → code_search；查 git 历史快照 → checkpoint cat/versions。read_history 只查会话消息——文件级改动用 recent_changes——知识与约定用 memory——互相不替代。"
  assert.ok(readHistoryTool.description.includes(guide), "T-R19.5: D-R19b 族表逐字在描述尾段")
  assert.ok(readHistoryTool.description.includes("checkpoint cat/versions"), "评审 #8 核验：git/checkpoint 动作面含 versions——总纲句保留 cat/versions")
})

test("T-R19.6: 消歧补句——recent_changes/memory/doc_search/code_search 描述互指 read_history", async () => {
  const { docSearchTool, memoryTools } = await import("../src/memory/docs.mjs")
  const { codeSearchTool } = await import("../src/memory/code-sync.mjs")
  assert.ok(recentChangesTool.description.includes("For session-level history (what was said in a session), use read_history."), "recent_changes 尾句互指 read_history")
  assert.ok(memoryTools(null, {})[0].description.includes("Session message history (what was said in this or past sessions) is NOT in memory"), "memory 补句（会话消息历史不在 memory）")
  assert.ok(memoryTools(null, {})[0].description.includes("read_history"), "memory 补句指向 read_history")
  assert.ok(docSearchTool(null).description.includes("use read_history"), "doc_search 描述补 read_history 引用")
  assert.ok(codeSearchTool(null).description.includes("use read_history"), "code_search 描述补 read_history 引用")
})

test("T-R19.7: 大会话护栏——>200,000 行文件返回定稿错误文案（不读全文）", () => {
  const tmp = mkdtempSync(join(tmpdir(), "rh-r19-scanmax-"))
  try {
    const huge = join(tmp, "huge.json.1")
    writeFileSync(huge, "x\n".repeat(READ_HISTORY_SCAN_MAX + 1), "utf8") // 200,001 行
    const out = execTool({ path: huge, keyword: "anything" }, tmp)
    assert.deepEqual(JSON.parse(out), { error: "session too large — refine keyword or since/until" }, "T-R19.7: 定稿错误文案（JSON）")
    // 边界：恰好 200,000 行不触发护栏（走解析路径——非 JSON → 普通错误而非超限文案）
    const boundary = join(tmp, "boundary.json.1")
    writeFileSync(boundary, "y\n".repeat(READ_HISTORY_SCAN_MAX), "utf8")
    const boundaryOut = execTool({ path: boundary }, tmp)
    assert.ok(!boundaryOut.includes("session too large"), "恰好 200,000 行不超限（护栏边界精确）")
    assert.ok(boundaryOut.startsWith("Error:"), "边界文件走正常解析错误路径")
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

