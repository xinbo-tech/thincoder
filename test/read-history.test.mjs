/**
 * read-history.test.mjs — SESSION.md §9 message timestamps + read_history tool (VS Code mirror).
 * Covers the same contracts as thincoder/test/read-history.test.mjs: pushReal ts stamping,
 * compaction-injection ts, send-layer ts strip, tool filters/limits/windows, depth-0-only
 * registration with the human line attached to the agent.
 */
import { describe, it, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { pushReal } from "../src/agent/run-helpers.mjs"
import { stripLocalMessageFields } from "../src/escape.mjs"
import { truncateFallback } from "../src/compact.mjs"
import { readHistoryTool } from "../src/agent-tools/read-history.mjs"

let tmp = null
let cfgPath = null

function query(history, args) {
  return JSON.parse(String(readHistoryTool.execute(args ?? {}, { agent: { _fullHistory: history } })))
}

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "vsc-rh-"))
  cfgPath = join(tmp, "config.json")
})

async function pinnedConfig() {
  const { _setConfigPathForTest } = await import("../src/config-io.mjs")
  _setConfigPathForTest(cfgPath)
  writeFileSync(cfgPath, JSON.stringify({ agent: {} }), "utf8")
}

describe("pushReal ts stamping (SESSION.md §9 D-S1, CLI parity)", () => {
  it("stamps an epoch-ms ts on every real message, non-decreasing, pre-set ts preserved", () => {
    const history = []
    const fullHistory = []
    const t0 = Date.now()
    pushReal(history, fullHistory, { role: "user", content: "要求" })
    pushReal(history, fullHistory, { role: "assistant", content: "ok", tool_calls: [{ id: "c1", type: "function", function: { name: "read", arguments: "{}" } }] })
    pushReal(history, fullHistory, { role: "tool", tool_call_id: "c1", name: "read", content: "结果" })
    pushReal(history, fullHistory, { role: "user", content: [{ type: "text", text: "看这张图" }, { type: "image_url", image_url: { url: "data:image/png;base64,x" } }] })
    assert.equal(history.length, 4)
    assert.equal(fullHistory.length, 4)
    for (const [i, m] of history.entries()) {
      assert.equal(typeof m.ts, "number", `message ${i} has a numeric ts`)
      assert.ok(m.ts >= t0 - 1000, "ts is the push moment")
      assert.equal(fullHistory[i], m, "same object in both lines")
    }
    for (let i = 1; i < history.length; i++) {
      assert.ok(history[i].ts >= history[i - 1].ts, "ts non-decreasing (same-ms legal)")
    }
    const preset = { role: "user", content: "x", ts: 42 }
    pushReal(history, fullHistory, preset)
    assert.equal(fullHistory.at(-1).ts, 42, "existing ts preserved")
  })

  it("old messages without ts survive with ts:null and never match a time window", () => {
    const raw = [
      { role: "user", content: "旧消息" },
      { role: "assistant", content: "旧答复" },
    ]
    const out = query(raw, {})
    assert.equal(out.length, 2)
    assert.equal(out[0].ts, null)
    assert.equal(out[1].content, "旧答复")
    assert.deepEqual(query(raw, { since: 1, until: Date.now() }), [], "no-ts excluded from windows")
  })
})

describe("ts strip — local field never reaches the wire (T-S3)", () => {
  it("stripLocalMessageFields drops ts and transient together, originals untouched", () => {
    const msg = { role: "user", content: "x", ts: 5, transient: true }
    const out = stripLocalMessageFields([msg])
    assert.deepEqual(out[0], { role: "user", content: "x" })
    assert.equal(msg.ts, 5, "copy-on-write")
    const plain = { role: "user", content: "x" }
    assert.equal(stripLocalMessageFields([plain])[0], plain, "no local fields → same object")
  })
})

describe("compaction injections carry ts (CLI applyCompression parity)", () => {
  it("truncateFallback injects note + Understood with the same ts", () => {
    const history = Array.from({ length: 20 }, (_, i) => ({ role: "user", content: `m ${i} ` + "x".repeat(30) }))
    const out = truncateFallback(history, { model: "m" })
    assert.ok(out, "fallback runs on a splittable history")
    assert.equal(out[0].role, "user")
    assert.ok(String(out[0].content).includes("truncated after repeated summarization failures"))
    assert.equal(typeof out[0].ts, "number", "note carries ts")
    assert.equal(out[1].ts, out[0].ts, "Understood carries the same compaction-moment ts")
  })
})

describe("read_history filter semantics", () => {
  it("no filters → newest 50 by default, chronological output", () => {
    const msgs = []
    for (let i = 0; i < 60; i++) msgs.push({ role: "user", content: `消息 ${i}` })
    const history = []
    const fullHistory = []
    for (const m of msgs) pushReal(history, fullHistory, m)
    const out = query(fullHistory, {})
    assert.equal(out.length, 50)
    assert.equal(out[0].content, "消息 10")
    assert.equal(out.at(-1).content, "消息 59")
    for (let i = 1; i < out.length; i++) assert.ok(out[i].ts >= out[i - 1].ts)
  })

  it("role/keyword/tool intersect (tool matches results by name AND assistant declarations)", () => {
    const msgs = [
      { role: "user", content: "请查一下 config 文件" },
      { role: "assistant", content: "", tool_calls: [{ id: "c1", type: "function", function: { name: "read", arguments: "{}" } }] },
      { role: "tool", tool_call_id: "c1", name: "read", content: "config 内容 100 行" },
      { role: "assistant", content: "看完了" },
    ]
    const history = []
    const fullHistory = []
    for (const m of msgs) pushReal(history, fullHistory, m)
    const t = query(fullHistory, { tool: "read" })
    assert.deepEqual(t.map((m) => m.role), ["assistant", "tool"], "declaration + result")
    assert.equal(t[1].tool_call_id, "c1")
    const inter = query(fullHistory, { role: "assistant", tool: "read" })
    assert.equal(inter.length, 1)
    const kw = query(fullHistory, { keyword: "config" })
    assert.deepEqual(kw.map((m) => m.role), ["user", "tool"])
    const tri = query(fullHistory, { role: "tool", keyword: "config", tool: "read" })
    assert.equal(tri.length, 1)
    assert.equal(tri[0].name, "read")
  })

  it("time window inclusive-inclusive; since>until empty; invalid boundaries error", () => {
    const fullHistory = [
      { role: "user", content: "a", ts: 100 },
      { role: "assistant", content: "b", ts: 200 },
      { role: "tool", name: "read", content: "c", ts: 300 },
      { role: "user", content: "d" },
    ]
    assert.equal(query(fullHistory, { since: 200, until: 200 }).length, 1, "since == until matches the boundary message")
    assert.equal(query(fullHistory, { since: 100, until: 300 }).length, 3)
    assert.equal(query(fullHistory, { until: 200 }).length, 2)
    assert.equal(query(fullHistory, { since: 200 }).length, 2)
    assert.deepEqual(query(fullHistory, { since: 300, until: 100 }), [])
    const err = String(readHistoryTool.execute({ since: "junk" }, { agent: { _fullHistory: fullHistory } }))
    assert.ok(err.startsWith("Error: invalid since"), err)
  })

  it("limit + direction=oldest; limit clamped to 200", () => {
    const msgs = []
    for (let i = 0; i < 40; i++) msgs.push({ role: "user", content: `m ${i}` })
    const fullHistory = []
    for (const m of msgs) pushReal([], fullHistory, m)
    const out = query(fullHistory, { limit: 5, direction: "oldest" })
    assert.equal(out.length, 5)
    assert.equal(out[0].content, "m 0")
    assert.equal(out.at(-1).content, "m 4")
    // limit > 200 clamps to 200 (CLI T-S7 mirror)
    const many = []
    for (let i = 0; i < 250; i++) many.push({ role: "user", content: `x ${i}` })
    const bigFull = []
    for (const m of many) pushReal([], bigFull, m)
    assert.equal(query(bigFull, { limit: 500 }).length, 200, "limit > 200 clamps to 200")
  })

  it("keyword is case-insensitive substring; empty keyword is a no-op; regex metachars stay literal (CLI T-S5b mirror)", () => {
    const msgs = [{ role: "user", content: "Use Config.JSON now" }, { role: "user", content: "看 a.b 文件" }, { role: "user", content: "其他 axb" }]
    const fullHistory = []
    for (const m of msgs) pushReal([], fullHistory, m)
    assert.equal(query(fullHistory, { keyword: "config.json" }).length, 1)
    assert.equal(query(fullHistory, { keyword: "" }).length, 3)
    assert.equal(query(fullHistory, { keyword: "a.b" }).length, 1, "dot matches only the literal dot")
    assert.equal(query(fullHistory, { keyword: "a+b" }).length, 0)
  })

  it("fallback leaves the caller-held human line untouched — old messages stay queryable with ts (CLI T-S10 mirror)", () => {
    const history = []
    const fullHistory = []
    for (let i = 0; i < 30; i++) pushReal(history, fullHistory, { role: "user", content: `user message ${i}` })
    const out = truncateFallback(history, { model: "m" })
    assert.ok(out, "fallback runs on a long machine line")
    assert.notEqual(out, history, "returns a NEW machine line")
    assert.equal(history.length, 30, "input (the caller-held line) untouched — VS Code keeps fullHistory separate by construction")
    assert.equal(fullHistory.length, 30, "human line untouched")
    const mid = query(fullHistory, { keyword: "user message 5" })
    assert.equal(mid.length, 1, "pre-compaction messages still queryable")
    assert.equal(typeof mid[0].ts, "number", "they keep their push-time ts")
  })

  it("content truncated with marker; tool_calls summarized to names; multimodal text matched", () => {
    const msgs = [
      { role: "tool", tool_call_id: "c1", name: "read", content: "x".repeat(10_000) },
      { role: "assistant", content: "", tool_calls: [
        { id: "a", type: "function", function: { name: "read", arguments: "{}" } },
        { id: "b", type: "function", function: { name: "grep", arguments: "{}" } },
      ] },
      { role: "user", content: [{ type: "text", text: "看看这张截图" }, { type: "image_url", image_url: { url: "data:image/png;base64,AAAA" } }] },
    ]
    const fullHistory = []
    for (const m of msgs) pushReal([], fullHistory, m)
    const out = query(fullHistory, {})
    assert.ok(out[0].content.includes("truncated"), "marker present")
    assert.ok(out[0].content.length < 1000)
    assert.deepEqual(out[1].tool_calls, ["read", "grep"], "names only")
    assert.ok(!JSON.stringify(out).includes("AAAA"), "image payload never in output")
    assert.equal(out[2].content, "看看这张截图", "multimodal text summary")
    assert.equal(query(fullHistory, { keyword: "截图" }).length, 1, "keyword matches text parts")
  })

  it("readonly: true; invalid role/direction/limit error explicitly; empty history → []", () => {
    assert.equal(readHistoryTool.readonly, true)
    const ctx = { agent: { _fullHistory: [] } }
    assert.ok(String(readHistoryTool.execute({ role: "system" }, ctx)).startsWith("Error: invalid role"))
    assert.ok(String(readHistoryTool.execute({ direction: "sideways" }, ctx)).startsWith("Error: invalid direction"))
    assert.ok(String(readHistoryTool.execute({ limit: "many" }, ctx)).startsWith("Error: invalid limit"))
    assert.equal(String(readHistoryTool.execute({}, ctx)), "[]")
  })
})

describe("registration — depth-0 only + human-line attach (D-S2)", () => {
  it("depth-0 schemas include read_history; explore children exclude it; agent._fullHistory attached", async () => {
    await pinnedConfig()
    const { setupAgentRun } = await import("../src/agent/setup.mjs")
    const opts = { engState: { enabled: null, advisorGuard: null, engDesignToken: null } }
    const fullHistorySeed = []
    const top = await setupAgentRun({
      provider: { name: "t", model: "deepseek-v4-pro" },
      cwd: tmp,
      input: "hi",
      opts: { ...opts, fullHistory: fullHistorySeed },
      depth: 0, role: null, getAuto: () => true,
    })
    const topNames = top.toolSchemas.map((s) => s.function.name)
    assert.ok(topNames.includes("read_history"), "depth-0 schema includes read_history")
    assert.equal(top.agent._fullHistory, fullHistorySeed, "human line attached to the agent for the tool ctx")
    assert.equal(top.fullHistory, fullHistorySeed, "setup returns the same line")
    assert.equal(typeof top.fullHistory.at(-1)?.ts, "number", "the setup user message is stamped")
    // explore child: throwaway lines, tool absent
    const child = await setupAgentRun({
      provider: { name: "t", model: "deepseek-v4-pro" },
      cwd: tmp,
      input: "hi",
      opts: { ...opts },
      depth: 1, role: "explore", getAuto: () => true,
    })
    const childNames = child.toolSchemas.map((s) => s.function.name)
    assert.ok(!childNames.includes("read_history"), "subagent (depth>0) has no read_history")
  })

  it("depth-0 agent can query its own live line through the tool", async () => {
    await pinnedConfig()
    const { setupAgentRun } = await import("../src/agent/setup.mjs")
    const fullHistorySeed = [{ role: "user", content: "你好" }]
    const top = await setupAgentRun({
      provider: { name: "t", model: "deepseek-v4-pro" },
      cwd: tmp,
      input: "第二个问题",
      opts: { engState: { enabled: null, advisorGuard: null, engDesignToken: null }, fullHistory: fullHistorySeed },
      depth: 0, role: null, getAuto: () => true,
    })
    const out = JSON.parse(String(readHistoryTool.execute({ keyword: "你好" }, { agent: top.agent })))
    assert.equal(out.length, 1, "reads the live human line via ctx.agent._fullHistory")
    assert.equal(out[0].content, "你好")
  })
})

describe("send layer + plan-mode governance (CLI T-S3/T-S9 mirrors)", () => {
  it("ts never reaches a provider request (wire-level, T-S3 mirror)", async () => {
    const { chat } = await import("../src/provider.mjs")
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
      const provider = { baseURL: `http://127.0.0.1:${port}/v1`, apiKey: "x", model: "deepseek-v4-pro" }
      const result = await chat(provider, { messages })
      assert.equal(result.content, "hi")
      const sent = requests[0].messages
      assert.equal(sent.length, 2)
      for (const m of sent) {
        assert.ok(!("ts" in m), `ts must not ride the wire (${m.role})`)
        assert.ok(!("transient" in m), "transient must not ride the wire either")
      }
      assert.equal(messages[0].ts, 111, "in-memory history keeps its ts — strip is copy-on-write")
    } finally {
      server.close()
    }
  })

  it("readonly tool: planMode passes without a permission ask (dispatch-level, T-S9 mirror)", async () => {
    const { executeToolBatches } = await import("../src/agent/execute-tools.mjs")
    const cwd = mkdtempSync(join(tmpdir(), "vsc-rh-dispatch-"))
    try {
      const history = []
      const fullHistory = [{ role: "user", content: "p", ts: 1 }]
      const calls = []
      const agent = {
        _planMode: true, _role: null,
        config: { agent: {} },
        _mutatedThisRun: false, _touchedFiles: [],
        _calledAdvisorThisRun: false, _verifiedThisRun: false, _advisorRound: 0,
        _fullHistory: fullHistory,
      }
      const callbacks = {
        onPermissionRequired: (name) => { calls.push(["single", name]); return true },
        onToolCall: (name) => calls.push(["tool", name]),
      }
      const toolByName = new Map([["read_history", readHistoryTool]])
      await executeToolBatches(agent, {
        response: { toolCalls: [{ id: "c1", name: "read_history", arguments: "{}" }] },
        history, fullHistory,
        toolByName, getAuto: () => false,
        callbacks, signal: undefined, cwd, recentSigs: [], depth: 0,
      })
      assert.deepEqual(calls, [["tool", "read_history"]], "executed inside plan mode with NO permission ask")
      const toolMsg = fullHistory.at(-1)
      assert.equal(toolMsg.role, "tool")
      assert.equal(toolMsg.name, "read_history")
      assert.equal(typeof toolMsg.ts, "number", "committed result is a real message with ts")
      const parsed = JSON.parse(toolMsg.content)
      assert.deepEqual(parsed, [{ ts: 1, role: "user", content: "p" }], "history queryable inside plan mode")
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })
})

describe("cleanup", () => {
  it("removes the sandbox", () => {
    try { rmSync(tmp, { recursive: true, force: true }) } catch {}
  })
})
