/**
 * read-history.test.mjs — SESSION.md §9 message timestamps + read_history tool (VS Code mirror).
 * Covers the same contracts as thincoder/test/read-history.test.mjs: pushReal ts stamping,
 * compaction-injection ts, send-layer ts strip, tool filters/limits/windows, depth-0-only
 * registration with the human line attached to the agent.
 */
import { describe, it, beforeEach, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createHash } from "node:crypto"

import { pushReal } from "../src/agent/run-helpers.mjs"
import { stripLocalMessageFields } from "../src/escape.mjs"
import { truncateFallback } from "../src/compact.mjs"
import { readHistoryTool } from "../src/agent-tools/read-history.mjs"
import { recentChangesTool } from "../src/agent-tools/recent_changes.mjs"
import { memoryTool } from "../src/memory-tool.mjs"
import { codeSearchTool, docSearchTool } from "../src/tools/code.mjs"
import { _setSessionsDirForTest, _resetSessionsDirForTest, normalizeCwd } from "../src/extension/session-io.mjs"

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

// ---------------------------------------------------------------- SESSION.md §13 R19（跨会话历史检索 + 消歧互指——VS Code 镜像）
// D-R19b 族表总纲逐字稿（SESSION.md §13——唯一源——两端照抄——fail-when-unchanged）
const FAMILY_TABLE =
  "检索/记忆族选哪个：查**本会话**说过/裁定过 → read_history（默认）；查**别的会话/项目**旧对话 → read_history 带 path/cwd 参数；查**本 run 改过哪些文件** → recent_changes；查**跨会话已存知识/约定**（memory）→ memory search；查**项目设计文档** → doc_search；查**代码实现** → code_search；查 git 历史快照 → checkpoint cat/versions。read_history 只查会话消息——文件级改动用 recent_changes——知识与约定用 memory——互相不替代。"

function cwdHash(c) {
  return createHash("sha1").update(normalizeCwd(c)).digest("hex")
}

function writeSessionFile(sdir, cwd, slot, data) {
  writeFileSync(join(sdir, `${cwdHash(cwd)}.json.${slot}`), JSON.stringify(data), "utf8")
}

function sessionData(overrides) {
  return { version: 2, cwd: "D:\\proj", title: "t", updatedAt: Date.now(), history: [], ...overrides }
}

describe("R19 cross-session + cwd discovery (SESSION.md §13 D-R19a — VS Code mirror)", () => {
  let sdir = null
  let cwdDir = null
  beforeEach(() => {
    sdir = mkdtempSync(join(tmpdir(), "vsc-rh19-sess-"))
    cwdDir = mkdtempSync(join(tmpdir(), "vsc-rh19-cwd-"))
    _setSessionsDirForTest(sdir)
  })
  after(() => {
    _resetSessionsDirForTest()
    try { rmSync(sdir, { recursive: true, force: true }) } catch {}
    try { rmSync(cwdDir, { recursive: true, force: true }) } catch {}
  })

  it("T-R19.1: no path → THIS session only — session files on disk are never touched (zero change)", () => {
    writeSessionFile(sdir, cwdDir, 1, sessionData({ history: [{ role: "user", content: "磁盘旧会话里的裁定 X", ts: 1 }] }))
    const live = [{ role: "user", content: "本会话消息", ts: 9 }]
    const out = query(live, {})
    assert.equal(out.length, 1)
    assert.equal(out[0].content, "本会话消息")
    const kw = query(live, { keyword: "磁盘旧会话" })
    assert.deepEqual(kw, [], "keyword never leaks into disk sessions")
    assert.ok(String(readHistoryTool.execute({ path: null }, { agent: { _fullHistory: live } })).includes("本会话消息"), "null path behaves like no path")
  })

  it("T-R19.2: cross-session single slot — full file path + same filter surface (incl. ts window)", () => {
    const filePath = join(sdir, `${cwdHash(cwdDir)}.json.3`)
    const data = sessionData({
      cwd: cwdDir, title: "旧会话", updatedAt: 555,
      history: [
        { role: "user", content: "上次讨论的方案", ts: 100 },
        { role: "assistant", content: "", ts: 200, tool_calls: [{ id: "c1", type: "function", function: { name: "read", arguments: "{}" } }] },
        { role: "tool", tool_call_id: "c1", name: "read", content: "决定用 A 方案", ts: 300 },
        { role: "user", content: "无 ts 的旧消息" },
      ],
    })
    writeFileSync(filePath, JSON.stringify(data), "utf8")
    const kw = query([], { path: filePath, keyword: "A 方案" })
    assert.equal(kw.length, 1, "keyword hits the old session message")
    assert.equal(kw[0].role, "tool")
    assert.equal(kw[0].ts, 300, "hit carries its stored ts")
    const byTool = query([], { path: filePath, tool: "read" })
    assert.deepEqual(byTool.map((m) => m.role), ["assistant", "tool"], "declaration + result across sessions too")
    const windowed = query([], { path: filePath, since: 200, until: 300 })
    assert.equal(windowed.length, 2, "time window applies; no-ts message excluded")
    const oldest = query([], { path: filePath, limit: 2, direction: "oldest" })
    assert.deepEqual(oldest.map((m) => m.role), ["user", "assistant"], "limit/direction shared")
  })

  it("T-R19.3: cwd discovery — slot number + FULL file path + title/messages/updatedAt, newest first, other cwds excluded", () => {
    writeSessionFile(sdir, cwdDir, 2, sessionData({ cwd: cwdDir, title: "会话 B", updatedAt: 2000, history: [1, 2, 3, 4, 5].map((i) => ({ role: "user", content: `b${i}` })) }))
    writeSessionFile(sdir, cwdDir, 1, sessionData({ cwd: cwdDir, title: "会话 A", updatedAt: 1000, history: [1, 2, 3].map((i) => ({ role: "user", content: `a${i}` })) }))
    // 历史短哈希命名（迁移落地后从未再访问的旧 cwd——advisor 修复：发现面只读覆盖 legacy 候选名，不触发改名迁移）
    writeFileSync(join(sdir, `${cwdHash(cwdDir).slice(0, 12)}.json.4`), JSON.stringify(sessionData({ cwd: cwdDir, title: "legacy 会话", updatedAt: 3000, history: [{ role: "user", content: "旧格式裁定" }] })), "utf8")
    const other = mkdtempSync(join(tmpdir(), "vsc-rh19-other-"))
    try {
      writeSessionFile(sdir, other, 7, sessionData({ cwd: other, title: "别的项目", updatedAt: 9999, history: [{ role: "user", content: "x" }] }))
      const out = String(readHistoryTool.execute({ path: `cwd:${cwdDir}` }, { agent: {} }))
      const idxB = out.indexOf("slot 2:")
      const idxA = out.indexOf("slot 1:")
      assert.ok(idxB >= 0 && idxA >= 0, `both slots listed: ${out}`)
      assert.ok(out.indexOf("slot 4:") < idxB, "legacy short-hash slot 4 newest (updatedAt 3000) — listed first")
      const legacyPath = join(sdir, `${cwdHash(cwdDir).slice(0, 12)}.json.4`)
      assert.ok(out.includes(legacyPath), "legacy file FULL path present — follow-up path= query works on any listed name")
      assert.ok(out.includes("legacy 会话") && out.includes("updatedAt: 3000"), "legacy row carries title + updatedAt")
      assert.ok(out.includes("会话 B") && out.includes("会话 A"), "titles present")
      assert.match(out, /messages: 5/)
      assert.match(out, /updatedAt: 2000/)
      assert.ok(out.includes("Re-call read_history with path="), "two-step hint present")
      assert.ok(!out.includes("别的项目"), "other cwd's sessions excluded")
      assert.ok(!out.includes(`${cwdHash(other)}.json.7`), "other hash files excluded")
    } finally {
      try { rmSync(other, { recursive: true, force: true }) } catch {}
    }
  })

  it("T-R19.3b/3c: unknown cwd errors; existing cwd with no sessions → empty list + hint", () => {
    const missing = join(cwdDir, "no-such-dir")
    const err = String(readHistoryTool.execute({ path: `cwd:${missing}` }, { agent: {} }))
    assert.ok(err.startsWith("Error: no sessions for cwd"), err)
    assert.match(err, /directory not found/, "明确文案——无该 cwd 会话目录")
    const empty = String(readHistoryTool.execute({ path: `cwd:${cwdDir}` }, { agent: {} }))
    assert.match(empty, /no sessions for cwd/, "空结果 + 无会话提示")
    const emptyErr = String(readHistoryTool.execute({ path: "cwd:" }, { agent: {} }))
    assert.match(emptyErr, /invalid path "cwd:"/)
  })

  it("T-R19.3d: missing/corrupt/non-file targets error — never crash, never rename", () => {
    const gone = join(sdir, `${cwdHash(cwdDir)}.json.9`)
    assert.match(String(readHistoryTool.execute({ path: gone }, { agent: {} })), /Error: session file not found/)
    const corrupt = join(sdir, `${cwdHash(cwdDir)}.json.1`)
    writeFileSync(corrupt, "{not json!!!", "utf8")
    assert.match(String(readHistoryTool.execute({ path: corrupt }, { agent: {} })), /Error: cannot parse session file/)
    assert.ok(!corrupt.endsWith(".corrupted") && !corrupt.endsWith(".unreadable"), "read-only — target untouched (no rename)")
    assert.match(String(readHistoryTool.execute({ path: cwdDir }, { agent: {} })), /Error: cannot read session file/, "a directory is not a session file")
    const notSession = join(sdir, `${cwdHash(cwdDir)}.json.2`)
    writeFileSync(notSession, JSON.stringify({ version: 2, history: "nope" }), "utf8")
    assert.match(String(readHistoryTool.execute({ path: notSession }, { agent: {} })), /Error: not a session history file/)
  })

  it("T-R19.7: >200,000-line file → size error before full parse (design-finalized message)", () => {
    const huge = join(sdir, `${cwdHash(cwdDir)}.json.4`)
    writeFileSync(huge, "x\n".repeat(200_001), "utf8")
    assert.equal(
      String(readHistoryTool.execute({ path: huge }, { agent: {} })),
      JSON.stringify({ error: "session too large — refine keyword or since/until" }),
      "超限文案逐字（评审 #3 定稿）——错误在解析前返回"
    )
    // 边界下多行合法 JSON 仍可查（行扫不误伤常规多行文件）
    const pretty = join(sdir, `${cwdHash(cwdDir)}.json.5`)
    writeFileSync(pretty, JSON.stringify(sessionData({ cwd: cwdDir, history: [{ role: "user", content: "多行文件里的裁定", ts: 42 }] }), null, 2), "utf8")
    const hit = query([], { path: pretty, keyword: "多行文件" })
    assert.equal(hit.length, 1)
    assert.equal(hit[0].ts, 42)
  })
})

describe("R19 description anchors — 消歧总纲与互指（SESSION.md §13 D-R19b）", () => {
  it("T-R19.5: read_history description carries the family table verbatim (fail-when-unchanged)", () => {
    assert.ok(readHistoryTool.description.includes(FAMILY_TABLE), "D-R19b 族表总纲逐字在 read_history 描述尾段")
    assert.ok(readHistoryTool.description.includes("path="), "path 参数说明在描述中")
    assert.ok(readHistoryTool.description.includes("cwd:"), "cwd: 前缀说明在描述中")
    assert.ok(String(readHistoryTool.parameters.properties.path.description).includes("cwd:"), "path 参数 schema 说明含 cwd:")
  })

  it("T-R19.6: recent_changes / memory / doc_search / code_search descriptions carry the inter-ref tails", () => {
    assert.ok(recentChangesTool.description.includes("会话级历史用 read_history"), "recent_changes 互指尾句")
    assert.ok(memoryTool.description.includes("会话消息历史不在 memory——用 read_history"), "memory search 段互指句")
    for (const t of [codeSearchTool, docSearchTool]) {
      assert.ok(t.description.includes("查设计决策用 doc_search——查实现用 code_search——查会话用 read_history"), `${t.name} 互指句含 read_history 引用`)
    }
  })
})

describe("cleanup", () => {
  it("removes the sandbox", () => {
    try { rmSync(tmp, { recursive: true, force: true }) } catch {}
  })
})
