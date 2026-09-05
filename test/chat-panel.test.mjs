/**
 * chat-panel.test.mjs — ChatPanel._saveLines session-write contract.
 * Focused regression: the extension must NOT preserve the CLI's `display`
 * (WYSIWYG render snapshot) — it doesn't maintain it, and the CLI resumes
 * from `display` in preference to `history`, so a stale snapshot hides every
 * message added in VS Code (user report: "TUI shows far fewer messages").
 */
import { describe, it, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import * as vscode from "vscode"
import { loadSlot, newSlot, switchToSlot, slotPath, loadManifest, saveManifest, writeEndMarker, readEndMarker, endMarkerPath, _setSessionsDirForTest, _resetSessionsDirForTest } from "../src/extension/session-io.mjs"
import { ensureSlot } from "../src/extension/panel-session.mjs"

let tmp
beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "tc-panel-"))
  _setSessionsDirForTest(join(tmp, "sessions"))
  // _cwd() reads vscode.workspace.workspaceFolders[0].uri.fsPath — point it at tmp
  vscode.workspace.workspaceFolders = [{ uri: { fsPath: tmp } }]
})
afterEach(() => {
  _resetSessionsDirForTest()
  rmSync(tmp, { recursive: true, force: true })
})

describe("ChatPanel._saveLines — display cleared (CLI resume parity)", () => {
  it("persists history but clears display so the CLI rebuilds from history", async () => {
    const { ChatPanel } = await import("../src/extension/chat-panel.mjs")
    const panel = new ChatPanel({
      globalStorageUri: { fsPath: tmp },
      workspaceState: { get: () => undefined, update: async () => {} },
      subscriptions: [],
    })

    const lines = [
      { role: "user", content: "hi" },
      { role: "assistant", content: "hello" },
    ]
    panel._saveLines(lines, lines, { activeProvider: "deepseek" })

    const data = loadSlot(tmp, 1)
    assert.ok(data, "slot written")
    assert.equal(data.history.length, 2, "history persisted")
    assert.deepEqual(data.display, [], "display must be cleared (CLI falls back to history)")
  })

  it("slims the human line on save but keeps the machine line full (CLI parity, 2026-08-30)", async () => {
    const { ChatPanel } = await import("../src/extension/chat-panel.mjs")
    const panel = new ChatPanel({
      globalStorageUri: { fsPath: tmp },
      workspaceState: { get: () => undefined, update: async () => {} },
      subscriptions: [],
    })
    const bigArgs = JSON.stringify({ code: "x".repeat(3000) })
    const bigResult = "out " + "y".repeat(2000)
    const full = [
      { role: "user", content: "看图" },
      { role: "assistant", content: "", tool_calls: [{ id: "t1", function: { name: "execute", arguments: bigArgs } }] },
      { role: "tool", tool_call_id: "t1", content: bigResult },
      { role: "user", content: [{ type: "text", text: "[read_image: a.png]" }, { type: "image_url", image_url: { url: "data:image/png;base64," + "Z".repeat(2000) } }] },
    ]
    panel._saveLines(full, full, { activeProvider: "deepseek" })

    const data = loadSlot(tmp, 1)
    const hist = data.history
    const ctx = data.contextHistory
    assert.ok(hist[1].tool_calls[0].function.arguments.length <= 301, "human line args trimmed")
    assert.ok(hist[2].content.length <= 526, "human line tool result trimmed")
    assert.ok(!JSON.stringify(hist[3].content).includes("base64,"), "human line image dropped to text part")
    assert.equal(ctx[1].tool_calls[0].function.arguments, bigArgs, "machine line args kept in full")
    assert.equal(ctx[2].content, bigResult, "machine line tool result kept in full")
    assert.ok(JSON.stringify(ctx[3].content).includes("base64,"), "machine line image kept in full")
  })


  it("clears a PRE-EXISTING stale display (CLI snapshot from before VS Code edits)", async () => {
    const { ChatPanel } = await import("../src/extension/chat-panel.mjs")
    const panel = new ChatPanel({
      globalStorageUri: { fsPath: tmp },
      workspaceState: { get: () => undefined, update: async () => {} },
      subscriptions: [],
    })

    // Simulate a stale CLI snapshot already in the slot
    panel._saveLines([{ role: "user", content: "old" }], [{ role: "user", content: "old" }], { activeProvider: "deepseek" })
    const { saveSessionToSlot } = await import("../src/extension/session-io.mjs")
    const stale = loadSlot(tmp, 1)
    stale.display = [{ text: "stale line", color: "dim" }]
    saveSessionToSlot(tmp, 1, stale)

    // A further VS Code turn must wipe that stale snapshot
    panel._saveLines(
      [{ role: "user", content: "old" }, { role: "assistant", content: "new" }],
      [{ role: "user", content: "old" }, { role: "assistant", content: "new" }],
      { activeProvider: "deepseek" },
    )
    assert.deepEqual(loadSlot(tmp, 1).display, [], "stale display cleared on VS Code write")
  })
})

describe("panel message routing — setAdvisorGuard (2026-08-21 advisor switch refactor)", () => {
  let cfgPath
  beforeEach(() => {
    cfgPath = join(tmp, "config.json")
    // Route config-io writes into the sandbox (same pattern as settings-panel.test.mjs)
  })

  it("setAdvisorGuard true → config.json advisor.guard === true, no enabled key written", async () => {
    const { _setConfigPathForTest, loadRaw } = await import("../src/config-io.mjs")
    _setConfigPathForTest(cfgPath)
    const { handlePanelMessage } = await import("../src/extension/panel-messages.mjs")
    const panel = { _pushSettingsLight: () => {} }
    await handlePanelMessage(panel, { type: "setAdvisorGuard", value: true })
    const raw = loadRaw()
    assert.equal(raw.agent.advisor.guard, true, "guard persisted from the toolbar switch")
    assert.ok(!("enabled" in raw.agent.advisor), "deprecated advisor.enabled is never written")
  })

  it("setAdvisorGuard false → advisor.guard === false", async () => {
    const { _setConfigPathForTest, loadRaw } = await import("../src/config-io.mjs")
    _setConfigPathForTest(cfgPath)
    const { handlePanelMessage } = await import("../src/extension/panel-messages.mjs")
    const panel = { _pushSettingsLight: () => {} }
    await handlePanelMessage(panel, { type: "setAdvisorGuard", value: false })
    assert.equal(loadRaw().agent.advisor.guard, false)
  })

  it("legacy setAdvisorEnabled message is a no-op (no config write)", async () => {
    const { _setConfigPathForTest, loadRaw } = await import("../src/config-io.mjs")
    _setConfigPathForTest(cfgPath)
    const { handlePanelMessage } = await import("../src/extension/panel-messages.mjs")
    const panel = { _pushSettingsLight: () => {} }
    await handlePanelMessage(panel, { type: "setAdvisorEnabled", value: true })
    assert.equal(loadRaw().agent, undefined, "unknown legacy message type must not write anything")
  })
})


// ─── Async distillation — panel save + slot guard + rapid-fire (SEND-STALL-DISTILL) ────────────

/** One-frame SSE replies (same shape as continue-on-turn-cap.test.mjs). */
const sseTurn = (content) => `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content }, finish_reason: "stop" }] })}\n\ndata: [DONE]\n\n`
const sseTools = (toolCalls) => `data: ${JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: toolCalls }, finish_reason: "stop" }] })}\n\ndata: [DONE]\n\n`
const readCalls = () => ["a.mjs", "b.mjs", "c.mjs"].map((f, i) => ({
  index: i, id: `call_${i}`, type: "function", function: { name: "read", arguments: JSON.stringify({ path: f }) },
}))

/** Scripted local provider: onRequest(index, body) → SSE string | { status, body } (may be async). */
async function scriptedLLMServer(onRequest) {
  const http = await import("node:http")
  const requests = []
  const server = http.createServer((req, res) => {
    let body = ""
    req.on("data", (c) => { body += c })
    req.on("end", () => {
      requests.push(body)
      Promise.resolve(onRequest(requests.length, body))
        .then((r) => {
          if (r && r.status) { res.writeHead(r.status, { "Content-Type": "application/json" }); res.end(r.body ?? ""); return }
          res.writeHead(200, { "Content-Type": "text/event-stream" })
          res.end(r)
        })
        .catch(() => { try { res.writeHead(500); res.end() } catch { /* socket already closed (client abort) */ } })
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  return { server, port: server.address().port, requests }
}

/** Real ChatPanel bound to a stub webview, provider routed to the scripted server. */
async function makePanel(port, posted) {
  const { ChatPanel } = await import("../src/extension/chat-panel.mjs")
  const { _setConfigPathForTest } = await import("../src/config-io.mjs")
  _setConfigPathForTest(join(tmp, "config.json"))
  writeFileSync(join(tmp, "config.json"), JSON.stringify({
    providers: [{ name: "t", baseURL: `http://127.0.0.1:${port}`, model: "unknown-model", apiKey: "sk-test" }],
    activeProvider: "t",
  }))
  const panel = new ChatPanel({
    globalStorageUri: { fsPath: tmp },
    workspaceState: { get: () => undefined, update: async () => {} },
    subscriptions: [],
  })
  panel._panel = { webview: { postMessage: async (m) => posted.push(m) } }
  return panel
}

const mkFiles = () => { for (const f of ["a.mjs", "b.mjs", "c.mjs"]) writeFileSync(join(tmp, f), "x\n") }

describe("async distillation — panel save + slot guard + rapid-fire (SEND-STALL-DISTILL)", () => {
  // Distill requests are a single user message carrying EXPLORE_SUMMARY_PROMPT. Detect by
  // message shape + prompt prefix — a raw body.includes() on the prompt fails because JSON
  // escapes the trailing newline (\\n in the wire body).
  const isDistillReq = (body) => {
    try {
      const m = JSON.parse(body)?.messages
      return m?.length === 1 && m[0]?.role === "user" && typeof m[0]?.content === "string"
        && m[0].content.startsWith("You are distilling exploration tool results")
    } catch { return false }
  }
  const noteIn = (ctx) => ctx.some((m) => typeof m.content === "string" && m.content.startsWith("[Exploration summary]"))

  it("AC5 — onDistilled re-saves: the session file ends with the compressed machine line", async () => {
    const { server, port } = await scriptedLLMServer(async (i, body) => {
      if (isDistillReq(body)) {
        await new Promise((r) => setTimeout(r, 2000))
        return sseTurn("panel async summary")
      }
      if (i === 1) return sseTools(readCalls())
      return sseTurn("panel final")
    })
    try {
      mkFiles()
      const panel = await makePanel(port, [])
      await panel._chat("first message", undefined, undefined, "t")
      assert.ok(panel._distillState.pending instanceof Promise, "distill pending after the turn")
      await panel._distillState.pending

      const data = loadSlot(tmp, panel._slot)
      assert.ok(data, "session written")
      assert.ok(noteIn(data.contextHistory ?? []), "contextHistory contains the summary note (AC5)")
      assert.ok(!data.history.some((m) => typeof m.content === "string" && m.content.startsWith("[Exploration summary]")), "human line never compressed")
    } finally {
      server.close()
    }
  })

  it("AC6 — slot switch while distill in flight: compressed history is NOT written into the new session", async () => {
    const { server, port } = await scriptedLLMServer(async (i, body) => {
      if (isDistillReq(body)) {
        await new Promise((r) => setTimeout(r, 2000))
        return sseTurn("async summary")
      }
      if (i === 1) return sseTools(readCalls())
      return sseTurn("done")
    })
    try {
      mkFiles()
      // Pre-create slot 2 so the "must stay clean" assertion is meaningful
      const { saveSessionToSlot } = await import("../src/extension/session-io.mjs")
      saveSessionToSlot(tmp, 2, { version: 2, cwd: tmp, updatedAt: Date.now(), title: "", history: [], contextHistory: [], display: [], tasks: [], planMode: false, autoApprove: false, engineering: false })
      const panel = await makePanel(port, [])
      panel._slot = 1
      await panel._chat("first message", undefined, undefined, "t")
      assert.ok(panel._distillState.pending instanceof Promise)
      panel._slot = 2   // user switched sessions while the distill is in flight
      await panel._distillState.pending

      const slot1 = loadSlot(tmp, 1)
      const slot2 = loadSlot(tmp, 2)
      assert.ok(!noteIn(slot2.contextHistory ?? []), "new session must not receive the old turn's compressed line (AC6)")
      assert.equal(slot2.history.length, 0, "new session untouched")
      assert.ok(!noteIn(slot1.contextHistory ?? []), "old session keeps the onComplete (uncompressed) save")
    } finally {
      server.close()
    }
  })

  it("AC6a — rapid second message does not abort the distill; run 2 starts from the compressed line", async () => {
    const { server, port, requests } = await scriptedLLMServer(async (i, body) => {
      if (isDistillReq(body)) {
        await new Promise((r) => setTimeout(r, 2000))
        return sseTurn("async summary")
      }
      if (i === 1) return sseTools(readCalls())
      return sseTurn("done")
    })
    try {
      mkFiles()
      const panel = await makePanel(port, [])
      await panel._chat("first message", undefined, undefined, "t")
      const controller = panel._distillController
      assert.ok(controller && !controller.signal.aborted, "distill controller active")
      assert.ok(panel._distillState.pending instanceof Promise, "distill in flight")

      await panel._chat("second message", undefined, undefined, "t")   // rapid-fire: must NOT abort the distill
      assert.equal(controller.signal.aborted, false, "distill not aborted by the second message (AC6a)")
      assert.equal(panel._distillController, controller, "controller not recreated per turn")

      const run2 = requests.find((b) => !isDistillReq(b) && b.includes("second message"))
      assert.ok(run2, "second-run request captured")
      const msgs = JSON.parse(run2).messages
      const ni = msgs.findIndex((m) => typeof m.content === "string" && m.content.startsWith("[Exploration summary]"))
      const ii = msgs.findIndex((m) => typeof m.content === "string" && m.content.includes("second message"))
      assert.ok(ni >= 0 && ii > ni, "run 2 starts from the compressed machine line (summary before input)")
    } finally {
      server.close()
    }
  })

  it("review #1 — session switch (loadSession) aborts the in-flight distill", async () => {
    const { server, port } = await scriptedLLMServer(async (i, body) => {
      if (isDistillReq(body)) {
        await new Promise((r) => setTimeout(r, 3000))
        return sseTurn("never lands")
      }
      if (i === 1) return sseTools(readCalls())
      return sseTurn("done")
    })
    try {
      mkFiles()
      const panel = await makePanel(port, [])
      await panel._chat("first message", undefined, undefined, "t")
      const controller = panel._distillController
      assert.ok(controller && !controller.signal.aborted)
      await panel._loadSession()   // session switch → abort hook
      assert.equal(controller.signal.aborted, true, "distill controller aborted on session switch")
      assert.equal(await panel._distillState.pending, null, "aborted distill resolves null")
      const data = loadSlot(tmp, panel._slot)
      assert.ok(!noteIn(data?.contextHistory ?? []), "no compressed note saved after abort")
    } finally {
      server.close()
    }
  })

  it("AC5 — onToolResult truncates the live tool result at 64K (old 20K cap lifted)", async () => {
    // read 方式（评审 #6，2026-08-25）：mkFiles 基础上额外建 70_000 字符 big.txt，第一轮发 read 调用
    // — 零额外工具注入。read 工具不截断（tools/file.mjs 无默认 limit）；>64K 结果经 offloadToolResult
    // 落盘为「提示 + 64K 预览 + ...」，onToolResult 再 slice(0, 64K) → 长度恰为 65536（评审 #7 精确断言）。
    mkFiles()
    writeFileSync(join(tmp, "big.txt"), "x".repeat(70_000))
    const { server, port } = await scriptedLLMServer(async (i, body) => {
      if (i === 1) return sseTools([{ index: 0, id: "c0", type: "function", function: { name: "read", arguments: JSON.stringify({ path: "big.txt" }) } }])
      return sseTurn("done")
    })
    try {
      const posted = []
      const panel = await makePanel(port, posted)
      await panel._chat("first message", undefined, undefined, "t")
      const toolMsg = posted.find((m) => m.type === "toolResult" && m.name === "read" && m.text.length > 20_000)
      assert.ok(toolMsg, "toolResult message posted (read)")
      assert.equal(toolMsg.text.length, 64 * 1024, "live tool result capped at exactly 64K (评审 #7 精确断言)")
    } finally {
      server.close()
    }
  })
})


// ─── v2 revival regression (2026-08-25): cleared token must not resurrect via ?? ───
describe("v2 token revival regression (2026-08-25)", () => {
it("eng(exit) → saveSession → loadSession: cleared token stays null (AC7)", async () => {
  const { _setConfigPathForTest } = await import("../src/config-io.mjs")
  _setConfigPathForTest(join(tmp, "config.json"))
  const { saveLines } = await import("../src/extension/panel-session.mjs")
  const { saveSessionToSlot } = await import("../src/extension/session-io.mjs")
  // Seed the slot with a stale token, then save with an explicitly-cleared (null) extra
  saveSessionToSlot(tmp, 1, { version: 2, cwd: tmp, updatedAt: Date.now(), history: [], contextHistory: [], display: [], tasks: [], planMode: false, autoApprove: false, engineering: false, engDesignToken: "stale:123:sig" })
  const panel = { _slot: 1, _panel: { webview: { postMessage: async () => {} } } }
  saveLines(panel, [], [], { activeProvider: "t", engDesignToken: null }) // exit-clear path
  const data = loadSlot(tmp, 1)
  assert.equal(data.engDesignToken, null, "explicit null must NOT revive the stale slot value (v2 ?? fix)")
})

})


// ─── toolPanel bridge model passthrough (2026-08-26 断链修复 — ARCHITECTURE.md「子agent/advisor 模型显示」T1–T3) ───
// 0.1.46 wired the emitter (advisor.mjs start chunk carries `model`) and the renderer
// (streaming.js consumes m.model) but NOT the bridge: panel-chat.mjs's onToolPanel dropped
// the field from the postMessage payload. These tests lock the bridge via real chat runs
// (scripted provider + stub webview capture — the distill describe's makePanel pattern).
describe("toolPanel bridge — model passthrough (advisor/subagent model display)", () => {
  /** Real ChatPanel bound to a stub webview; provider + agent sub-config routed to the sandbox. */
  async function makeBridgePanel(port, posted, agentCfg) {
    const { ChatPanel } = await import("../src/extension/chat-panel.mjs")
    const { _setConfigPathForTest } = await import("../src/config-io.mjs")
    _setConfigPathForTest(join(tmp, "config.json"))
    writeFileSync(join(tmp, "config.json"), JSON.stringify({
      providers: [{ name: "t", baseURL: `http://127.0.0.1:${port}`, model: "unknown-model", apiKey: "sk-test" }],
      activeProvider: "t",
      ...(agentCfg ? { agent: agentCfg } : {}),
    }))
    const panel = new ChatPanel({
      globalStorageUri: { fsPath: tmp },
      workspaceState: { get: () => undefined, update: async () => {} },
      subscriptions: [],
    })
    panel._panel = { webview: { postMessage: async (m) => posted.push(m) } }
    return panel
  }

  it("T1 — advisor start chunk: toolPanel payload carries the advisor's resolved model (F1/NF1)", async () => {
    const advisorCall = [{ index: 0, id: "c0", type: "function", function: { name: "advisor", arguments: JSON.stringify({ type: "code", paths: ["a.mjs"] }) } }]
    const { server, port } = await scriptedLLMServer(async (i) => {
      if (i === 1) return sseTools(advisorCall)                 // main run requests a code review
      if (i === 2) return sseTurn("All clear — no issues.")     // the advisor's own single-burst reply
      return sseTurn("done")
    })
    try {
      writeFileSync(join(tmp, "a.mjs"), "x\n")
      const posted = []
      const panel = await makeBridgePanel(port, posted, { advisor: { provider: "t", model: "deepseek-v4" } })
      await panel._chat("review a.mjs", undefined, undefined, "t")
      const start = posted.find((m) => m.type === "toolPanel" && m.name === "advisor" && m.kind === "start")
      assert.ok(start, "advisor start chunk crossed the bridge")
      assert.equal(start.model, "deepseek-v4", "bridge forwards chunk.model (silently dropped since 0.1.46)")
      assert.equal(start.round, 1)
    } finally {
      server.close()
    }
  })

  it("T2+T3 — subagent: onSubagent spread keeps model; model-less text chunks post model === undefined", async () => {
    const exploreCall = [{ index: 0, id: "c0", type: "function", function: { name: "subagent", arguments: JSON.stringify({ task: "inspect a.mjs", role: "explore" }) } }]
    const { server, port } = await scriptedLLMServer(async (i) => {
      if (i === 1) return sseTools(exploreCall)
      if (i === 2) return sseTurn("explore findings")           // child token stream → toolPanel text chunks
      return sseTurn("done")
    })
    try {
      writeFileSync(join(tmp, "a.mjs"), "x\n")
      const posted = []
      const panel = await makeBridgePanel(port, posted, { subagentModels: { explore: "glm-5.2" } })
      // subagentTool is not readonly — seed the bound slot with autoApprove so the permission gate is skipped
      const { saveSessionToSlot } = await import("../src/extension/session-io.mjs")
      saveSessionToSlot(tmp, 1, { version: 2, cwd: tmp, updatedAt: Date.now(), title: "", history: [], contextHistory: [], display: [], tasks: [], planMode: false, autoApprove: true, engineering: false })
      panel._slot = 1
      await panel._chat("spawn an explorer", undefined, undefined, "t")

      const started = posted.find((m) => m.type === "subagent" && m.status === "started")
      assert.ok(started, "subagent started event crossed the bridge")
      assert.equal(started.role, "explore")
      assert.equal(started.model, "glm-5.2", "onSubagent { type, ...info } spread keeps model (F2 — 展开透传不回退)")

      const textChunk = posted.find((m) => m.type === "toolPanel" && m.name === "sub:explore#1" && m.kind === "text")
      assert.ok(textChunk, "child token stream crossed the bridge as text chunks")
      assert.ok(textChunk.text.includes("explore findings"), "chunk text arrived intact")
      assert.equal(textChunk.model, undefined, "model-less chunk → payload.model === undefined (T3, 评审 #1 断言语义)")
    } finally {
      server.close()
    }
  })

  it("T4 — toolPanelPayload string compat branch: kind text, text verbatim, round/model undefined (NF1, 评审 #1)", async () => {
    // The string branch has no production trigger path (all emitters send objects),
    // so it is unreachable via the closure — direct-test the exported pure function.
    const { toolPanelPayload } = await import("../src/extension/panel-chat.mjs")
    let payload
    assert.doesNotThrow(() => { payload = toolPanelPayload("sub:explore#1", "raw string") })
    assert.equal(payload.type, "toolPanel")
    assert.equal(payload.name, "sub:explore#1")
    assert.equal(payload.kind, "text", "string chunk → kind 'text'")
    assert.equal(payload.text, "raw string", "string chunk → text verbatim")
    assert.equal(payload.model, undefined, "string chunk carries no model — chunk?.model safely undefined")
    assert.equal(payload.round, undefined, "string chunk carries no round")
  })

  it("T5 — §19.5 D-M8: toolPanelPayload forwards chunk.sub (nested sub-label) — string chunks stay clean", async () => {
    const { toolPanelPayload } = await import("../src/extension/panel-chat.mjs")
    const p = toolPanelPayload("sub:eng-coder#1", { kind: "tool", text: "read x", sub: "explore#1" })
    assert.equal(p.name, "sub:eng-coder#1")
    assert.equal(p.sub, "explore#1", "嵌套子代理段标随桥透传（webview 子标渲染输入）")
    assert.equal(p.kind, "tool")
    assert.equal(toolPanelPayload("sub:eng-coder#1", "raw").sub, undefined, "string 兼容分支无 sub（chunk?.sub 安全 undefined）")
  })

  it("T6 — §19.5 D-M7: cancelSubagent 消息路由 → 定向 abort（extension 层直连——不经模型回合）", async () => {
    const { handlePanelMessage } = await import("../src/extension/panel-messages.mjs")
    // 假面板：_liveLines = 挂起/运行中会话的 live lines（runPanelChat 登记——池 + 机读线载体）
    const history = []
    const aborted = []
    const notify = []
    const pool = new Map([
      [1, { id: 1, role: "eng-coder", status: "running", done: false, cancelled: false,
           controller: { abort: () => aborted.push(1), signal: { aborted: false } },
           _onCancelled: () => notify.push("cancelled-1") }],
      [2, { id: 2, role: "explore", status: "queued", done: false, cancelled: false,
           controller: { abort: () => aborted.push(2), signal: { aborted: false } },
           _onCancelled: () => notify.push("cancelled-2"), _resolve: () => {} }],
    ])
    history._asyncSubagents = pool
    const panel = { _liveLines: { history, fullHistory: [] }, _susp: null }
    // running 目标 → 定向 abort（只停该条目——标记 + controller abort + 机读线提醒注入）
    await handlePanelMessage(panel, { type: "cancelSubagent", id: 1, role: "eng-coder" })
    assert.deepEqual(aborted, [1], "条目级 controller 被 abort（其余不受影响）")
    assert.equal(pool.get(1).cancelled, true, "条目置 cancelled 标记（settle 走 cancelled 分支）")
    const reminder = history.filter((m) => typeof m.content === "string" && m.content.includes("subagent eng-coder#1 cancelled by user"))
    assert.equal(reminder.length, 1, "模型可见取消提醒注入机读线（半成品警示——UI ⏹ 与工具 cancel 同路径）")
    assert.match(reminder[0].content, /partial changes not merged\/audited/)
    // queued 目标 → 出队（无 abort）+ 即时冻结通知
    await handlePanelMessage(panel, { type: "cancelSubagent", id: 2, role: "explore" })
    assert.deepEqual(aborted, [1], "queued 取消无 abort（未启动）")
    assert.equal(pool.has(2), false, "queued 条目出队移除")
    assert.deepEqual(notify, ["cancelled-2"], "queued 取消即时冻结通知（entry._onCancelled——spawn 上下文绑定）")
    // 未知 id / role 不匹配（陈旧 ⏹/池已清）→ no-op（不虚构状态、不抛——advisor round 2 #6）
    await handlePanelMessage(panel, { type: "cancelSubagent", id: 99, role: "coder" })
    await handlePanelMessage(panel, { type: "cancelSubagent", id: 1, role: "explore" })
    assert.equal(pool.has(1), true, "role 不匹配 → no-op（同 id 异 role 不误停）")
    assert.equal(pool.get(1).cancelled, true, "既有取消标记未被二次触碰")
    assert.deepEqual(aborted, [1], "role 不匹配无 abort")
  })
})

describe("session switch race guards (GitHub #2/#5 — 2026-08-28)", () => {
  it("switchSession while a turn is running is REJECTED: slot unchanged, turn untouched, content lands in the ORIGINAL slot (GitHub #2/#5)", async () => {
    // Slow first response so the turn is genuinely in flight when the switch arrives.
    const { server, port } = await scriptedLLMServer(async (i) => {
      if (i === 1) { await new Promise((r) => setTimeout(r, 1500)); return sseTurn("slow reply for session 1") }
      return sseTurn("done")
    })
    try {
      mkFiles()
      // Pre-create slot 2 (clean target) so "zero pollution" is meaningful.
      const { saveSessionToSlot } = await import("../src/extension/session-io.mjs")
      saveSessionToSlot(tmp, 2, { version: 2, cwd: tmp, updatedAt: Date.now(), title: "", history: [], contextHistory: [] })
      const posted = []
      const panel = await makePanel(port, posted)
      const { handlePanelMessage } = await import("../src/extension/panel-messages.mjs")
      panel._slot = 1
      const turn = panel._chat("first message", undefined, undefined, "t")
      await new Promise((r) => setTimeout(r, 100)) // let the turn actually start
      assert.equal(panel._turnActive, true, "turn must be in flight")

      // The user clicks another session while the turn runs → guard must reject.
      await handlePanelMessage(panel, { type: "switchSession", slot: 2 })
      assert.equal(panel._slot, 1, "slot must NOT change while running")
      assert.equal(panel._turnActive, true, "running turn must be untouched by the rejected switch")
      await turn

      // Turn finishes → content must land in slot 1; slot 2 must stay untouched.
      const slot1 = loadSlot(tmp, 1)
      const slot2 = loadSlot(tmp, 2)
      assert.ok(slot1.history.some((m) => m.role === "assistant" && String(m.content).includes("slow reply for session 1")),
        "original slot holds the turn's reply")
      assert.equal(slot2.history.length, 0, "new session untouched (no cross-slot pollution)")
    } finally {
      server.close()
    }
  })

  it("newSession while a turn is running is REJECTED (no fresh slot bound)", async () => {
    const { server, port } = await scriptedLLMServer(async (i) => {
      if (i === 1) { await new Promise((r) => setTimeout(r, 1500)); return sseTurn("slow") }
      return sseTurn("done")
    })
    try {
      mkFiles()
      const panel = await makePanel(port, [])
      const { handlePanelMessage } = await import("../src/extension/panel-messages.mjs")
      panel._slot = 1
      const turn = panel._chat("msg", undefined, undefined, "t")
      await new Promise((r) => setTimeout(r, 100))
      assert.equal(panel._turnActive, true, "turn must be in flight")
      await handlePanelMessage(panel, { type: "newSession" })
      assert.equal(panel._slot, 1, "no new session may be bound while running")
      await turn
    } finally {
      server.close()
    }
  })

  it("saveLines slotOverride writes to the explicit slot (distill-style guard rail)", async () => {
    const { ChatPanel } = await import("../src/extension/chat-panel.mjs")
    const panel = new ChatPanel({
      globalStorageUri: { fsPath: tmp },
      workspaceState: { get: () => undefined, update: async () => {} },
      subscriptions: [],
    })
    const { saveSessionToSlot } = await import("../src/extension/session-io.mjs")
    saveSessionToSlot(tmp, 3, { version: 2, cwd: tmp, updatedAt: Date.now(), title: "", history: [], contextHistory: [] })
    panel._slot = 1 // "current" slot — must be ignored when slotOverride is given
    panel._saveLines(
      [{ role: "user", content: "hi" }],
      [{ role: "user", content: "hi" }],
      { activeProvider: "t" },
      3,
    )
    const slot3 = loadSlot(tmp, 3)
    assert.equal(slot3.history.length, 1, "content landed in the OVERRIDE slot")
    const slot1 = loadSlot(tmp, 1)
    assert.ok(!slot1 || slot1.history.length === 0, "current slot untouched when override given")
  })

  it("deleteSession while a turn is running is REJECTED — target slot file intact (交付评审 #2)", async () => {
    const { server, port } = await scriptedLLMServer(async (i) => {
      if (i === 1) { await new Promise((r) => setTimeout(r, 1500)); return sseTurn("slow") }
      return sseTurn("done")
    })
    try {
      mkFiles()
      const panel = await makePanel(port, [])
      const { handlePanelMessage } = await import("../src/extension/panel-messages.mjs")
      const { saveSessionToSlot } = await import("../src/extension/session-io.mjs")
      panel._slot = 1
      const turn = panel._chat("msg", undefined, undefined, "t")
      await new Promise((r) => setTimeout(r, 100))
      assert.equal(panel._turnActive, true, "turn must be in flight")
      // Pre-create slot 2 with content — the user tries to delete it mid-turn (any slot, not just active).
      saveSessionToSlot(tmp, 2, { version: 2, cwd: tmp, updatedAt: Date.now(), title: "victim", history: [], contextHistory: [] })
      await handlePanelMessage(panel, { type: "deleteSession", slot: 2 })
      assert.equal(panel._slot, 1, "panel binding untouched")
      assert.ok(loadSlot(tmp, 2), "target slot file must remain — guard rejected the delete")
      await turn
    } finally {
      server.close()
    }
  })

  it("ContinueError → Stop still persists the turn to disk (finally-save, CLI agent-turn.mjs parity)", async () => {
    // maxTurns=2 forces a Continue prompt; user picks Stop → the break previously skipped
    // the catch-block save, stranding the whole turn in memory (lost on session switch).
    // CLI parity: agent-turn.mjs's finally unconditionally saveSession's every exit path.
    const { server, port } = await scriptedLLMServer(async (i) => {
      void i
      return sseTurn(`filler reply ${Date.now()}`) // many replies; the cap will be hit
    })
    try {
      mkFiles()
      const { handlePanelMessage } = await import("../src/extension/panel-messages.mjs")
      const posted = []
      const panel = await makePanel(port, posted)
      const { _setConfigPathForTest } = await import("../src/config-io.mjs")
      // Tight turn budget via config.json agent.maxTurns
      _setConfigPathForTest(join(tmp, "config.json"))
      writeFileSync(join(tmp, "config.json"), JSON.stringify({
        providers: [{ name: "t", baseURL: `http://127.0.0.1:${port}`, model: "unknown-model", apiKey: "sk-test" }],
        activeProvider: "t",
        agent: { maxTurns: 2 },
      }))
      // Patch askInPanel: answer "Stop" when the Continue card appears
      panel._slot = 1
      const turn = panel._chat("keep this message", undefined, undefined, "t")
      // Drain question cards: the Continue card resolves with "Stop"
      const drain = setInterval(() => {
        while (panel._questionQueue?.length) {
          const q = panel._questionQueue.shift()
          q.resolve("Stop")
        }
      }, 50)
      try {
        await turn
      } finally {
        clearInterval(drain)
      }
      assert.equal(panel._turnActive, false, "turn unwound")
      const data = loadSlot(tmp, 1)
      assert.ok(data, "session file written on the declined-continue path")
      assert.ok(data.history.some((m) => m.role === "user" && String(m.content).includes("keep this message")),
        "the user's input survived in the session file (no stranded-in-memory turn)")
      assert.ok(data.history.length >= 2, "partial assistant work also persisted")
    } finally {
      server.close()
    }
  })
})

// ─── SESSION.md §10（R4）——面板层 end marker 流（T-M9：面板 resolve/新建/删除）────────

describe("panel end-marker flows（SESSION.md §10 R4——T-M9）", () => {
  const makePanel = async () => new (await import("../src/extension/chat-panel.mjs")).ChatPanel({
    globalStorageUri: { fsPath: tmp },
    workspaceState: { get: () => undefined, update: async () => {} },
    subscriptions: [],
  })

  it("面板打开（ensureSlot）按本端记录回自己的槽——CLI 活于他槽不抢", async () => {
    const dir = join(tmp, "sessions")
    mkdirSync(dir, { recursive: true })
    const DEAD = "99999999-dead"
    const session = (title, content) => JSON.stringify({
      version: 2, cwd: tmp, title, updatedAt: Date.now(),
      history: [{ role: "user", content }], contextHistory: [], tasks: [],
      sessionStart: "2026-09-01T00:00:00.000Z",
    })
    writeFileSync(slotPath(tmp, 1), session("panel session", "panel msg"))
    writeFileSync(slotPath(tmp, 2), session("cli session", "cli msg"))
    saveManifest(tmp, {
      slots: { 1: { ts: 1 }, 2: { ts: 2 } },
      slotSessions: { 1: DEAD, 2: `${process.pid}-foreign` },
      active: 2,
    }, null, { setActive: true })
    writeEndMarker(tmp, 1) // 本端（面板）记录 = 槽 1

    const panel = await makePanel()
    assert.equal(panel._slot, null)
    assert.equal(ensureSlot(panel), 1, "面板 resolve 回本端记录槽")
    assert.equal(readEndMarker(tmp).slot, 1)
    const m = loadManifest(tmp)
    assert.equal(m.slotSessions[2], `${process.pid}-foreign`, "CLI 活槽属主未被抢")
    assert.equal(ensureSlot(panel), 1, "粘性")
  })

  it("newSession → marker 跟随新槽；删记录槽（deleteSlotAndUpdate）→ 置空", async () => {
    const dir = join(tmp, "sessions")
    mkdirSync(dir, { recursive: true })
    const DEAD = "99999999-dead"
    writeFileSync(slotPath(tmp, 1), JSON.stringify({
      version: 2, cwd: tmp, title: "old", updatedAt: Date.now(),
      history: [{ role: "user", content: "old msg" }], contextHistory: [], tasks: [],
      sessionStart: "2026-09-01T00:00:00.000Z",
    }))
    saveManifest(tmp, { slots: { 1: { ts: 1 } }, slotSessions: { 1: DEAD }, active: 1 }, null, { setActive: true })
    writeEndMarker(tmp, 1)

    const panel = await makePanel()
    // 首开：回本端记录槽 1
    assert.equal(ensureSlot(panel), 1)
    assert.equal(readEndMarker(tmp).slot, 1)
    // 面板新建 → 槽 2 + marker=2（槽 1 有条目/文件——不复用）
    await panel._newSession()
    const s2 = panel._slot
    assert.equal(s2, 2, "新建会话绑定新槽")
    assert.equal(readEndMarker(tmp).slot, 2, "marker 跟随新槽")
    // 删本端记录槽 → 记录显式置空 + 文件保留（deleteSlotAndUpdate——deleteSession 内部同点）
    const { deleteSlotAndUpdate } = await import("../src/extension/session-io.mjs")
    deleteSlotAndUpdate(tmp, s2)
    assert.ok(existsSync(endMarkerPath(tmp)), "marker 文件保留")
    assert.equal(readEndMarker(tmp).slot, null, "记录置空——下次启动全新起步")
  })

  it("面板打开历史会话（pick）→ marker 跟随所选槽", async () => {
    const panel = await makePanel()
    ensureSlot(panel) // 槽 1 + marker=1
    const s2 = newSlot(tmp) // 另一"会话"
    // pick 历史会话：panel-messages switchSession 路径 = switchToSlot + 绑槽
    const data = switchToSlot(tmp, s2)
    assert.ok(data, "切换成功")
    panel._slot = s2
    assert.equal(readEndMarker(tmp).slot, s2, "pick 后 marker = 所选槽")
  })

  it("删除本端记录槽后面板自动重绑幸存槽 → marker 跟随幸存槽（重绑 = 落点，review 🟡#1）", async () => {
    const dir = join(tmp, "sessions")
    mkdirSync(dir, { recursive: true })
    const DEAD = "99999999-dead"
    // 槽 1 = 本端记录（当前面板槽）；槽 2 = 幸存会话（manifest active 指向它，死主可认领）
    for (const [slot, title, content] of [[1, "mine", "my msg"], [2, "survivor", "survivor msg"]]) {
      writeFileSync(slotPath(tmp, slot), JSON.stringify({
        version: 2, cwd: tmp, title, updatedAt: Date.now(),
        history: [{ role: "user", content }], contextHistory: [], tasks: [],
        sessionStart: "2026-09-01T00:00:00.000Z",
      }))
    }
    saveManifest(tmp, {
      slots: { 1: { ts: 1 }, 2: { ts: 2 } },
      slotSessions: { 1: DEAD, 2: DEAD },
      active: 2,
    }, null, { setActive: true })
    writeEndMarker(tmp, 1)
    const panel = await makePanel()
    panel._slot = 1
    assert.equal(ensureSlot(panel), 1, "面板在槽 1")
    // 删除面板当前槽（= 本端记录槽）：deleteSlotAndUpdate 置空记录，但面板重绑幸存槽继续
    await panel._deleteSession(1)
    assert.equal(panel._slot, 2, "面板重绑幸存槽")
    assert.equal(readEndMarker(tmp).slot, 2, "重绑 = 落点 → marker 跟随幸存槽（重启回幸存槽而非全新）")
  })

})
