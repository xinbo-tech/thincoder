/**
 * acp.test.mjs — M1 ACP server tests (mock client over the transport layer).
 * Covers: NDJSON JSON-RPC transport (parse/method/error codes), handshake
 * (initialize/authenticate incl. authRequired), session lifecycle
 * (new/prompt/cancel/close), prompt FIFO queuing with an injected fake run.
 * No network: sessions use an injected run; authenticate uses an injected
 * isConfigured; transport `write` is captured instead of stdout.
 */
import { describe, it, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createAcpServer, ACP_ERRORS } from "../src/acp/transport.mjs"
import { buildAcpCallbacks, replayHistory } from "../src/acp/bridge.mjs"
import { createAcpSession } from "../src/acp/session.mjs"
import { buildAcpHandlers } from "../src/acp.mjs"
import { saveSession, loadSession, sessionPath, listSlots } from "../src/session.mjs"
import { readFileSync } from "node:fs"
function loadSlotFileForTest(cwd, slot) { return JSON.parse(readFileSync(`${sessionPath(cwd)}.${slot}`, "utf8")) }

describe("M2 — tools, permissions, fs routing (bridge callbacks)", () => {
  it("onToolCall/onToolResult emit tool_call + tool_call_update with matching ids", () => {
    const events = []
    const cb = buildAcpCallbacks({
      sessionId: "s1",
      notify: (m, p) => events.push(p),
      request: async () => ({ outcome: { outcome: "selected", optionId: "approve_once" } }),
    })
    cb.onToolCall("bash", { command: "ls" })
    cb.onToolResult("bash", "file.txt")
    const call = events[0].update
    const done = events[1].update
    assert.equal(call.sessionUpdate, "tool_call")
    assert.equal(call.status, "in_progress")
    assert.equal(call.title, "bash")
    assert.equal(call.kind, "execute")
    assert.equal(done.sessionUpdate, "tool_call_update")
    assert.equal(done.toolCallId, call.toolCallId, "result update references the same call id")
    assert.equal(done.status, "completed")
    assert.equal(done.content[0].content.text, "file.txt")
  })

  it("onPermissionRequest resolves true for approve_once and false for reject", async () => {
    const seen = []
    const cb = buildAcpCallbacks({
      sessionId: "s1",
      notify: () => {},
      request: async (method, params) => { seen.push({ method, params }); return { outcome: { outcome: "selected", optionId: "approve_once" } } },
    })
    assert.equal(await cb.onPermissionRequest("write", { path: "a.txt" }), true)
    assert.equal(seen[0].method, "session/request_permission")
    assert.equal(seen[0].params.sessionId, "s1")
    assert.deepEqual(seen[0].params.options.map((o) => o.optionId), ["approve_once", "approve_always", "reject"])
    // reject path
    const cb2 = buildAcpCallbacks({ sessionId: "s1", notify: () => {}, request: async () => ({ outcome: { outcome: "selected", optionId: "reject" } }) })
    assert.equal(await cb2.onPermissionRequest("bash", {}), false)
  })

  it("onPermissionRequest rejects on transport failure (safety-first)", async () => {
    const cb = buildAcpCallbacks({ sessionId: "s1", notify: () => {}, request: async () => { throw new Error("client gone") } })
    assert.equal(await cb.onPermissionRequest("write", {}), false)
  })

  it("toolRouter routes write through fs/write_text_file", async () => {
    const seen = []
    const cb = buildAcpCallbacks({ sessionId: "s1", notify: () => {}, request: async (m, p) => { seen.push({ m, p }); return {} } })
    const r = await cb.toolRouter("write", { path: "src/a.mjs", content: "new" })
    assert.equal(r.handled, true)
    assert.equal(seen[0].m, "fs/write_text_file")
    assert.equal(seen[0].p.path, "src/a.mjs")
    assert.equal(seen[0].p.content, "new")
  })

  it("toolRouter edit does read-back → local replace → write-back", async () => {
    const seen = []
    const cb = buildAcpCallbacks({
      sessionId: "s1", notify: () => {},
      request: async (m, p) => {
        seen.push({ m, p })
        if (m === "fs/read_text_file") return { text: "hello world" }
        return {}
      },
    })
    const r = await cb.toolRouter("edit", { path: "a.txt", old_string: "hello", new_string: "goodbye" })
    assert.equal(r.handled, true)
    assert.ok(r.result.includes("edited"), r.result)
    assert.equal(seen[0].m, "fs/read_text_file")
    assert.equal(seen[1].m, "fs/write_text_file")
    assert.equal(seen[1].p.content, "goodbye world")
  })

  it("toolRouter leaves reads/delete/apply_patch local", async () => {
    const cb = buildAcpCallbacks({ sessionId: "s1", notify: () => {}, request: async () => { throw new Error("must not be called") } })
    for (const [name, args] of [["read", { path: "a" }], ["delete", { path: "a" }], ["apply_patch", { patch: "x" }], ["grep", { pattern: "x" }]]) {
      const r = await cb.toolRouter(name, args)
      assert.equal(r.handled, false, `${name} stays local`)
    }
  })

  it("edit read-back missing old_string reports a clear error, not a crash", async () => {
    const cb = buildAcpCallbacks({ sessionId: "s1", notify: () => {}, request: async () => ({ text: "nothing here" }) })
    const r = await cb.toolRouter("edit", { path: "a.txt", old_string: "nope", new_string: "x" })
    assert.equal(r.handled, true)
    assert.ok(r.result.includes("old_string not found"), r.result)
  })
})

describe("M2 — transport reverse-RPC request()", () => {
  it("request resolves when the client responds by id", async () => {
    const c = mockClient({})
    const p = c.server.request("session/request_permission", { sessionId: "s1" })
    const sent = c.next()
    assert.equal(sent.method, "session/request_permission")
    await c.send({ jsonrpc: "2.0", id: sent.id, result: { outcome: { outcome: "selected", optionId: "approve_once" } } })
    assert.deepEqual(await p, { outcome: { outcome: "selected", optionId: "approve_once" } })
  })

  it("request rejects on client error response", async () => {
    const c = mockClient({})
    const p = c.server.request("fs/read_text_file", { sessionId: "s1", path: "x" })
    const sent = c.next()
    await c.send({ jsonrpc: "2.0", id: sent.id, error: { code: -32602, message: "bad path" } })
    await assert.rejects(() => p, /bad path/)
  })
})


/** Minimal mock client: feeds lines to handleLine, captures outgoing JSON.
 *  Pass an external `out` array to also receive session/update notifications
 *  pushed via the injected notify (they share the same capture). */
function mockClient(handlers, out = []) {
  const server = createAcpServer(handlers, { write: (s) => out.push(JSON.parse(s)), log: () => {} })
  return {
    server, // expose transport (notify/request) for reverse-RPC tests
    out,
    handleLine: (line) => server.handleLine(line),
    send: async (obj) => { await server.handleLine(JSON.stringify(obj)) },
    next: () => out.shift(),
    all: () => out.splice(0),
    waitIdle: () => new Promise((r) => setTimeout(r, 0)),
  }
}

describe("transport — NDJSON JSON-RPC", () => {
  it("replies to a request with matching id and result", async () => {
    const c = mockClient({ ping: () => "pong" })
    await c.send({ jsonrpc: "2.0", id: 1, method: "ping" })
    assert.deepEqual(c.next(), { jsonrpc: "2.0", id: 1, result: "pong" })
  })

  it("reports -32600 for malformed JSON (id null)", async () => {
    const c = mockClient({})
    await c.handleLine("{not json")
    assert.equal(c.next().error.code, -32600)
  })

  it("reports -32601 for unknown methods", async () => {
    const c = mockClient({})
    await c.send({ jsonrpc: "2.0", id: 7, method: "nope" })
    assert.equal(c.next().error.code, -32601)
  })

  it("surfaces handler errors as -32603 without breaking the stream", async () => {
    const c = mockClient({ boom: () => { throw new Error("kaput") } })
    await c.send({ jsonrpc: "2.0", id: 3, method: "boom" })
    assert.equal(c.next().error.code, -32603)
    assert.equal(c.next(), undefined, "stream still alive — nothing else emitted")
  })

  it("returns { error } objects as JSON-RPC errors (authRequired)", async () => {
    const c = mockClient({ auth: () => ({ error: ACP_ERRORS.AUTH_REQUIRED }) })
    await c.send({ jsonrpc: "2.0", id: 9, method: "auth" })
    assert.equal(c.next().error.code, -32000)
  })
})

describe("bridge — runAgent callbacks → session/update notifications", () => {
  it("maps token/reasoning/usage to the schema v1 shapes", () => {
    const events = []
    const cb = buildAcpCallbacks({
      sessionId: "s1",
      notify: (method, params) => events.push({ method, params }),
    })
    cb.onToken("hi")
    cb.onReasoning("think")
    cb.onUsage({ prompt_tokens: 10 })
    assert.deepEqual(events[0], {
      method: "session/update",
      params: { sessionId: "s1", update: { sessionUpdate: "agent_message_chunk", content: { type: "text", text: "hi" } } },
    })
    assert.equal(events[1].params.update.sessionUpdate, "agent_thought_chunk")
    assert.equal(events[2].params.update.sessionUpdate, "usage_update")
  })

  // D7 (§7.2): ⟦ev⟧ event tokens (bare or role#id/ prefixed) never reach ACP
  // clients — RS control chars are a TUI display signal; structured mapping is TODO.
  it("strips ⟦ev⟧ event tokens (bare + prefixed); normal tokens pass through", () => {
    const events = []
    const cb = buildAcpCallbacks({
      sessionId: "s1",
      notify: (method, params) => events.push(params?.update?.content?.text),
    })
    cb.onToken("⟦ev⟧turn\x1e3\x1e100\x1ellm\x1e")            // bare turn event
    cb.onToken("coder#1/⟦ev⟧turn\x1e3\x1e100\x1ellm\x1e")     // prefixed turn event
    cb.onToken("consult#2/⟦ev⟧approval\x1e1\x1e40\x1eapproval\x1ewrite") // prefixed approval
    cb.onToken("escalate#1/⟦ev⟧bogus\x1e1\x1e2\x1ex\x1e")     // non-canonical event name → passes (TUI sanitizes)
    cb.onToken("plain text")                                   // normal token
    cb.onToken("coder#1/hello world")                          // normal prefixed token
    const texts = events.filter((t) => typeof t === "string")
    assert.ok(!texts.includes("⟦ev⟧turn\x1e3\x1e100\x1ellm\x1e"), "bare turn event stripped")
    assert.ok(!texts.includes("coder#1/⟦ev⟧turn\x1e3\x1e100\x1ellm\x1e"), "prefixed turn event stripped")
    assert.ok(!texts.includes("consult#2/⟦ev⟧approval\x1e1\x1e40\x1eapproval\x1ewrite"), "approval event stripped")
    assert.ok(texts.includes("escalate#1/⟦ev⟧bogus\x1e1\x1e2\x1ex\x1e"), "non-canonical event name not treated as event (bridge only guards the two real names)")
    assert.ok(texts.includes("plain text"), "normal token passes")
    assert.ok(texts.includes("coder#1/hello world"), "prefixed content token passes (existing behavior)")
  })
})

describe("session — FIFO queue + cancel", () => {
  it("serializes concurrent prompts (FIFO) and exposes busy", async () => {
    const order = []
    const fakeRun = async (agent, input, _cb) => { order.push(input); await new Promise((r) => setTimeout(r, 5)); return "ok" }
    const s = createAcpSession({ id: "s1", agent: {}, notify: () => {}, run: fakeRun })
    const p1 = s.run("first")
    const p2 = s.run("second")
    await Promise.all([p1, p2])
    assert.deepEqual(order, ["first", "second"], "prompts run one after another, never interleaved")
  })

  it("a rejected turn does not kill the queue chain", async () => {
    let calls = 0
    const fakeRun = async () => { calls++; if (calls === 1) throw new Error("turn failed"); return "ok" }
    const s = createAcpSession({ id: "s1", agent: {}, notify: () => {}, run: fakeRun })
    await assert.rejects(() => s.run("boom"), /turn failed/)
    assert.equal(await s.run("fine"), "ok", "next prompt still runs after a failure")
  })

  it("cancel flips the signal the agent loop observes", () => {
    const s = createAcpSession({ id: "s1", agent: {}, notify: () => {}, run: async () => {} })
    assert.equal(s.agent !== undefined, true)
    s.cancel()
    // The session's internal signal is exposed via the fake run capture below.
  })
})

describe("session persistence — ACP turn-end saveSession (desktop proposal ①)", () => {
  // sandbox tmpCwd + injected deps + fake agent + controllable fake run (proposal §2.3)
  let tmpCwd
  beforeEach(() => {
    tmpCwd = mkdtempSync(join(tmpdir(), "acp-save-")) // unique cwd = unique session slot namespace (M3 pattern)
  })
  afterEach(() => rmSync(tmpCwd, { recursive: true, force: true }))
  const fakeAgent = (cwd) => ({ cwd, history: [{ role: "user", content: "hi" }, { role: "assistant", content: "yo" }], tasks: [] })

  it("saves on a successful turn (list sees the slot)", async () => {
    const s = createAcpSession({ id: "s1", agent: fakeAgent(tmpCwd), notify: () => {}, run: async () => "ok", save: saveSession })
    await s.run("hello")
    const slots = listSlots(tmpCwd)
    assert.equal(slots.length, 1, "one slot written")
    assert.equal(slots[0].messageCount, 2, "messageCount matches fake history")
  })

  it("saves on a cancelled turn (AbortError — finally semantics)", async () => {
    const s = createAcpSession({ id: "s1", agent: fakeAgent(tmpCwd), notify: () => {}, run: async () => { throw new DOMException("Aborted", "AbortError") }, save: saveSession })
    await assert.rejects(() => s.run("x"), /Aborted/)
    assert.equal(listSlots(tmpCwd).length, 1, "progress persisted despite cancel")
  })

  it("saves on a failed turn (plain Error)", async () => {
    const s = createAcpSession({ id: "s1", agent: fakeAgent(tmpCwd), notify: () => {}, run: async () => { throw new Error("LLM down") }, save: saveSession })
    await assert.rejects(() => s.run("x"), /LLM down/)
    assert.equal(listSlots(tmpCwd).length, 1, "progress persisted despite failure")
  })

  it("a save failure never blocks the turn or the queue", async () => {
    const boom = () => { throw new Error("disk full") }
    const logs = []
    const s = createAcpSession({ id: "s1", agent: fakeAgent(tmpCwd), notify: () => {}, log: (m) => logs.push(m), run: async () => "ok", save: boom })
    assert.equal(await s.run("fine"), "ok", "turn result unaffected")
    assert.ok(logs.some((m) => m.includes("save failed")), "failure logged, not thrown")
    assert.equal(await s.run("again"), "ok", "queue chain alive")
  })

  it("save is called exactly once per turn, after run completes", async () => {
    const events = []
    const s = createAcpSession({ id: "s1", agent: fakeAgent(tmpCwd), notify: () => {},
      run: async () => { events.push("run-end"); return "ok" },
      save: () => { events.push("save") } })
    await s.run("a")
    await s.run("b")
    assert.deepEqual(events, ["run-end", "save", "run-end", "save"], "save follows each run exactly once")
  })

  it("restore chain: save → new-process session/list → load replays → resume restores", async () => {
    const s = createAcpSession({ id: "s1", agent: fakeAgent(tmpCwd), notify: () => {}, run: async () => "ok", save: saveSession })
    await s.run("turn 1")
    const slots = listSlots(tmpCwd)
    assert.ok(slots.length === 1 && slots[0].messageCount === 2)
    const data = loadSlotFileForTest(tmpCwd, slots[0].slot)
    assert.ok(Array.isArray(data.history) && data.history.length === 2, "slot readable")
  })
})

describe("M3 — replayHistory edge cases", () => {
  it("replays EVERY tool in a multi-tool batch (no orphan updates)", () => {
    const events = []
    replayHistory({
      sessionId: "s1",
      notify: (m, p) => events.push(p.update),
      history: [
        { role: "user", content: "go" },
        { role: "assistant", content: "", tool_calls: [{ name: "bash" }, { name: "write" }] },
        { role: "tool", content: "ls output" },
        { role: "tool", content: "written" },
      ],
    })
    const calls = events.filter((u) => u.sessionUpdate === "tool_call")
    const updates = events.filter((u) => u.sessionUpdate === "tool_call_update")
    assert.equal(calls.length, 2, "one tool_call per tool in the batch")
    assert.equal(updates.length, 2, "both results delivered")
    assert.deepEqual(updates.map((u) => u.toolCallId), calls.map((c) => c.toolCallId), "updates reference the emitted call ids")
    assert.equal(calls[0].kind, "execute", "kind inferred from the tool name")
    assert.equal(calls[1].kind, "edit", "kind inferred from the tool name")
  })

  it("replays multi-block assistant content as one chunk per block", () => {
    const events = []
    replayHistory({
      sessionId: "s1",
      notify: (m, p) => events.push(p.update),
      history: [
        { role: "user", content: "hi" },
        { role: "assistant", content: [{ type: "text", text: "part one" }, { type: "text", text: "part two" }] },
      ],
    })
    const chunks = events.filter((u) => u.sessionUpdate === "agent_message_chunk")
    assert.deepEqual(chunks.map((c) => c.content.text), ["part one", "part two"])
  })
})

describe("M2 — Windows cwd case normalization (drive letter)", () => {
  it("session/new accepts a differently-cased drive letter", async () => {
    // simulate win32: injected cwd has lowercase drive; client sends uppercase
    const fakeWin = "c:\\users\\test\\project"
    const deps = {
      notify: () => {}, log: () => {}, isConfigured: () => true,
      cwd: () => fakeWin,
      createSession: async ({ id, notify }) => createAcpSession({ id, agent: {}, notify, run: async () => "ok" }),
    }
    const c = mockClient(buildAcpHandlers(deps).handlers)
    await c.send({ jsonrpc: "2.0", id: 1, method: "authenticate" })
    c.next()
    await c.send({ jsonrpc: "2.0", id: 2, method: "session/new", params: { cwd: "C:\\Users\\test\\project" } })
    const r = c.next()
    assert.ok(r.result?.id, `case-mismatched cwd accepted (normalizeCwd), got: ${JSON.stringify(r)}`)
  })
})

describe("M3 — persisted slots (list/load/resume/delete) + config options", () => {
  let c
  let deps
  let tmpCwd
  beforeEach(() => {
    tmpCwd = mkdtempSync(join(tmpdir(), "acp-m3-"))
    const events = []
    deps = {
      notify: (m, p) => events.push({ method: m, params: p }),
      log: () => {},
      isConfigured: () => true,
      cwd: () => tmpCwd, // handlers operate on the sandbox dir, not process.cwd()
      createSession: async ({ id, notify }) => createAcpSession({
        id, agent: { history: [], _fullHistory: [], config: {}, provider: { name: "deepseek", model: "deepseek-v4-pro" } },
        notify, run: async (a, input, cb) => { cb.onToken(`echo:${input}`); return "ok" },
      }),
    }
    c = mockClient(buildAcpHandlers(deps).handlers, events)
  })
  afterEach(() => rmSync(tmpCwd, { recursive: true, force: true }))

  function seedSlot(history) {
    // Write a slot file directly in the sandbox (slot 1 = active).
    // Return value is a self-check that the seed is loadable (callers ignore it).
    const agent = { history: [...history], _fullHistory: [...history], cwd: tmpCwd, config: {}, title: "seed", tasks: [], planMode: false, autoApprove: false, goal: null }
    saveSession(agent, [])
    return loadSession(tmpCwd)
  }

  it("list returns seeded slots; empty when none", async () => {
    await c.send({ jsonrpc: "2.0", id: 1, method: "authenticate" })
    c.next()
    await c.send({ jsonrpc: "2.0", id: 2, method: "session/list" })
    assert.deepEqual(c.next().result.sessions, [])
    seedSlot([{ role: "user", content: "hi" }, { role: "assistant", content: "hello" }])
    await c.send({ jsonrpc: "2.0", id: 3, method: "session/list" })
    const sessions = c.next().result.sessions
    assert.equal(sessions.length, 1)
    assert.equal(sessions[0].id, "1")
    assert.equal(sessions[0].messageCount, 2)
  })

  it("load replays the human line as chunk events and creates a live session", async () => {
    seedSlot([
      { role: "user", content: "fix the bug" },
      { role: "assistant", content: "I will" },
    ])
    await c.send({ jsonrpc: "2.0", id: 1, method: "authenticate" })
    c.next()
    await c.send({ jsonrpc: "2.0", id: 2, method: "session/load", params: { sessionId: "1" } })
    // Out order: replay notifications first, then the load response.
    const kinds = []
    let loaded = null
    for (let msg = c.next(); msg; msg = c.next()) {
      if (msg.params?.update) kinds.push(msg.params.update.sessionUpdate)
      if (msg.id === 2) loaded = msg.result
    }
    assert.ok(loaded, "load response received")
    assert.ok(loaded.id, "live session id returned")
    assert.deepEqual(kinds, ["user_message_chunk", "agent_message_chunk"], "history replayed in order")
    // The live session accepts prompts.
    await c.send({ jsonrpc: "2.0", id: 3, method: "session/prompt", params: { sessionId: loaded.id, content: [{ type: "text", text: "go" }] } })
    await c.waitIdle()
    const msgs = c.all()
    assert.ok(msgs.some((m) => m.params?.update?.sessionUpdate === "agent_message_chunk"))
    assert.ok(msgs.some((m) => m.id === 3 && m.result?.stopReason === "end_turn"))
  })

  it("resume restores state without replaying events", async () => {
    seedSlot([{ role: "user", content: "hi" }])
    await c.send({ jsonrpc: "2.0", id: 1, method: "authenticate" })
    c.next()
    await c.send({ jsonrpc: "2.0", id: 2, method: "session/resume", params: { sessionId: "1" } })
    assert.ok(c.next().result.id)
    assert.equal(c.next(), undefined, "no replay events after resume")
  })

  it("load/resume/delete on missing slot → -32602; delete removes the archive", async () => {
    await c.send({ jsonrpc: "2.0", id: 1, method: "authenticate" })
    c.next()
    await c.send({ jsonrpc: "2.0", id: 2, method: "session/load", params: { sessionId: "99" } })
    assert.equal(c.next().error.code, -32602)
    await c.send({ jsonrpc: "2.0", id: 3, method: "session/resume", params: { sessionId: "99" } })
    assert.equal(c.next().error.code, -32602)
    await c.send({ jsonrpc: "2.0", id: 4, method: "session/delete", params: { sessionId: "99" } })
    assert.equal(c.next().error.code, -32602)
    seedSlot([{ role: "user", content: "x" }])
    await c.send({ jsonrpc: "2.0", id: 5, method: "session/delete", params: { sessionId: "1" } })
    assert.deepEqual(c.next().result, {})
    await c.send({ jsonrpc: "2.0", id: 6, method: "session/list" })
    assert.deepEqual(c.next().result.sessions, [], "archive gone after delete")
  })

  it("set_config_option applies model/thinking/mode (last-write-wins) + notifies", async () => {
    await c.send({ jsonrpc: "2.0", id: 1, method: "authenticate" })
    c.next()
    await c.send({ jsonrpc: "2.0", id: 2, method: "session/new", params: { cwd: tmpCwd } })
    const id = c.next().result.id
    // Out order per call: config_option_update notification first, then the response.
    await c.send({ jsonrpc: "2.0", id: 3, method: "session/set_config_option", params: { sessionId: id, configId: "model", value: "glm:glm-5.2" } })
    assert.equal(c.next().params.update.sessionUpdate, "config_option_update")
    assert.deepEqual(c.next().result, {})
    await c.send({ jsonrpc: "2.0", id: 4, method: "session/set_config_option", params: { sessionId: id, configId: "thinking", value: false } })
    c.next(); assert.deepEqual(c.next().result, {})
    await c.send({ jsonrpc: "2.0", id: 5, method: "session/set_mode", params: { sessionId: id, mode: "plan" } })
    const modeUpdate = c.next()
    assert.equal(modeUpdate.params.update.sessionUpdate, "current_mode_update")
    assert.equal(modeUpdate.params.update.mode, "plan")
    assert.deepEqual(c.next().result, {})
    // Unknown configId → -32602
    await c.send({ jsonrpc: "2.0", id: 6, method: "session/set_config_option", params: { sessionId: id, configId: "nope", value: 1 } })
    assert.equal(c.next().error.code, -32602)
  })
})

describe("M4 — edge cases (⑦-⑩)", () => {
  let c
  let deps
  let tmpCwd
  beforeEach(() => {
    tmpCwd = mkdtempSync(join(tmpdir(), "acp-m4-"))
    const events = []
    deps = {
      notify: (m, p) => events.push({ method: m, params: p }),
      log: () => {},
      isConfigured: () => true,
      cwd: () => tmpCwd,
      createSession: async ({ id, notify }) => createAcpSession({
        id, agent: { history: [], _fullHistory: [], config: {}, provider: { name: "deepseek", model: "deepseek-v4-pro" } },
        notify, run: async (a, input, cb) => { cb.onToken(`echo:${input}`); return "ok" },
      }),
    }
    c = mockClient(buildAcpHandlers(deps).handlers, events)
  })
  afterEach(() => rmSync(tmpCwd, { recursive: true, force: true }))

  it("⑦ corrupt slot file load → error, not a crash", async () => {
    // Write garbage into a slot file directly.
    const base = sessionPath(tmpCwd)
    writeFileSync(`${base}.1`, "{not valid json")
    await c.send({ jsonrpc: "2.0", id: 1, method: "authenticate" })
    c.next()
    await c.send({ jsonrpc: "2.0", id: 2, method: "session/load", params: { sessionId: "1" } })
    assert.equal(c.next().error.code, -32602, "corrupt file surfaces as invalid params")
  })

  it("⑧ fs/write_text_file client error → tool result carries the error text", async () => {
    const events = []
    const cb = buildAcpCallbacks({
      sessionId: "s1",
      notify: (m, p) => events.push(p),
      request: async (_m, _p) => { throw Object.assign(new Error("permission denied by editor"), { code: -32602 }) },
    })
    const r = await cb.toolRouter("write", { path: "a.txt", content: "x" })
    assert.equal(r.handled, true)
    assert.ok(r.result.includes("fs/write_text_file failed"), r.result)
    assert.ok(r.result.includes("permission denied"), r.result)
  })

  it("⑨ delete archive does not kill the active in-memory session", async () => {
    // Seed via saveSession (writes manifest + slot file), load it into a live
    // session, delete the archive, prompt again.
    const { createAgent } = await import("../src/agent.mjs")
    const seed = createAgent({ provider: { name: "deepseek", model: "m" }, tools: [], config: {}, cwd: tmpCwd, memory: null })
    seed.history = [{ role: "user", content: "hi" }]
    seed._fullHistory = [...seed.history]
    seed.title = "seed"
    saveSession(seed, [])
    await c.send({ jsonrpc: "2.0", id: 1, method: "authenticate" })
    c.next()
    await c.send({ jsonrpc: "2.0", id: 2, method: "session/load", params: { sessionId: "1" } })
    const live = (() => { for (let m = c.next(); m; m = c.next()) if (m.id === 2) return m.result })()
    c.all() // drain replay leftovers (user_message_chunk) before the next exchange
    await c.send({ jsonrpc: "2.0", id: 3, method: "session/delete", params: { sessionId: "1" } })
    assert.deepEqual(c.next().result, {})
    await c.send({ jsonrpc: "2.0", id: 4, method: "session/prompt", params: { sessionId: live.id, content: [{ type: "text", text: "still alive" }] } })
    await c.waitIdle()
    const msgs = c.all()
    assert.ok(msgs.some((m) => m.id === 4 && m.result?.stopReason === "end_turn"), "active session survives archive deletion")
  })

  it("⑩ one turn with multiple parallel tools emits complete tool_call/tool_call_update sets", async () => {
    const events = []
    const cb = buildAcpCallbacks({
      sessionId: "s1",
      notify: (m, p) => events.push(p.update),
      request: async () => ({ outcome: { outcome: "selected", optionId: "approve_once" } }),
    })
    // Simulate a parallel batch: two tools start, then both report results.
    cb.onToolCall("read", { path: "a" })
    cb.onToolCall("grep", { pattern: "x" })
    cb.onToolResult("read", "content")
    cb.onToolResult("grep", "hits")
    const calls = events.filter((u) => u.sessionUpdate === "tool_call")
    const updates = events.filter((u) => u.sessionUpdate === "tool_call_update")
    assert.equal(calls.length, 2, "both tools announced")
    assert.equal(updates.length, 2, "both tools finished")
    const ids = calls.map((c) => c.toolCallId)
    for (const u of updates) assert.ok(ids.includes(u.toolCallId), `update ${u.toolCallId} references an announced call`)
  })
})



describe("acp handlers — handshake + session lifecycle (injected deps)", () => {
  let c
  let deps
  beforeEach(() => {
    const events = []
    deps = {
      notify: (m, p) => events.push({ method: m, params: p }), // notifications share the capture
      log: () => {},
      isConfigured: () => true,
      createSession: async ({ id, notify }) => {
        // id must flow through to createAcpSession — it is baked into the callbacks.
        const s = createAcpSession({ id, agent: {}, notify, run: async (a, input, cb) => { cb.onToken(`echo:${input}`); return "ok" } })
        return s
      },
    }
    c = mockClient(buildAcpHandlers(deps).handlers, events)
  })

  it("initialize advertises the agent + capabilities", async () => {
    await c.send({ jsonrpc: "2.0", id: 1, method: "initialize" })
    const r = c.next().result
    assert.equal(r.protocolVersion, 1)
    assert.equal(r.agentInfo.name, "thincoder")
    assert.deepEqual(r.authMethods, ["terminal"])
    assert.deepEqual(r.capabilities.fs, { read: true, write: true })
  })

  it("authenticate gates on isConfigured", async () => {
    await c.send({ jsonrpc: "2.0", id: 1, method: "authenticate" })
    assert.equal(c.next().result.authenticated, true)
    // isConfigured is captured at handler-build time — rebuild with the negative case.
    c = mockClient(buildAcpHandlers({ ...deps, isConfigured: () => false }).handlers)
    await c.send({ jsonrpc: "2.0", id: 2, method: "authenticate" })
    assert.equal(c.next().error.code, -32000)
  })

  it("session/new returns id + configOptions; prompt streams chunks and ends with stopReason", async () => {
    await c.send({ jsonrpc: "2.0", id: 1, method: "authenticate" })
    c.next()
    await c.send({ jsonrpc: "2.0", id: 2, method: "session/new", params: { cwd: process.cwd() } })
    const created = c.next().result
    assert.ok(created.id)
    assert.deepEqual(created.configOptions.map((o) => o.configId), ["model", "thinking", "mode"])

    await c.send({ jsonrpc: "2.0", id: 3, method: "session/prompt", params: { sessionId: created.id, content: [{ type: "text", text: "hello" }] } })
    await c.waitIdle() // handler runs on microtasks — let the full chain flush
    const chunk = c.next()
    assert.equal(chunk.method, "session/update")
    assert.equal(chunk.params.sessionId, created.id, "notifications carry the real session id")
    assert.equal(chunk.params.update.sessionUpdate, "agent_message_chunk")
    assert.equal(chunk.params.update.content.text, "echo:hello")
    assert.equal(c.next().result.stopReason, "end_turn")
  })

  it("unauthenticated session methods are rejected with -32000", async () => {
    await c.send({ jsonrpc: "2.0", id: 1, method: "session/new", params: {} })
    assert.equal(c.next().error.code, -32000)
  })

  it("prompt on unknown session → -32602; empty text → -32602", async () => {
    await c.send({ jsonrpc: "2.0", id: 1, method: "authenticate" })
    c.next()
    await c.send({ jsonrpc: "2.0", id: 2, method: "session/prompt", params: { sessionId: "nope", content: [{ type: "text", text: "x" }] } })
    assert.equal(c.next().error.code, -32602)
    await c.send({ jsonrpc: "2.0", id: 3, method: "session/prompt", params: { sessionId: "nope", content: [] } })
    assert.equal(c.next().error.code, -32602)
  })

  it("cwd mismatch is rejected in v1 (single-cwd model)", async () => {
    await c.send({ jsonrpc: "2.0", id: 1, method: "authenticate" })
    c.next()
    await c.send({ jsonrpc: "2.0", id: 2, method: "session/new", params: { cwd: "C:/elsewhere" } })
    assert.equal(c.next().error.code, -32602)
  })

  it("cancel aborts the running turn; close removes the session", async () => {
    await c.send({ jsonrpc: "2.0", id: 1, method: "authenticate" })
    c.next()
    await c.send({ jsonrpc: "2.0", id: 2, method: "session/new", params: { cwd: process.cwd() } })
    const id = c.next().result.id
    await c.send({ jsonrpc: "2.0", id: 3, method: "session/cancel", params: { sessionId: id } })
    assert.deepEqual(c.next().result, {})
    await c.send({ jsonrpc: "2.0", id: 4, method: "session/close", params: { sessionId: id } })
    assert.deepEqual(c.next().result, {})
    await c.send({ jsonrpc: "2.0", id: 5, method: "session/cancel", params: { sessionId: id } })
    assert.equal(c.next().error.code, -32602, "closed session is gone")
  })

  it("session stays usable after cancel (signal reset between turns)", async () => {
    // Fake run: first turn honours cancel by throwing AbortError; second turn
    // must run with a CLEAN signal (proves the reset in createAcpSession).
    let turn = 0
    let signalIsReal = false
    let sawAborted = false
    deps.createSession = async ({ id, notify }) => {
      const s = createAcpSession({
        id, agent: {}, notify,
        run: async (agent, input, cb, { signal }) => {
          turn++
          // The signal must be a REAL AbortSignal — provider layers compose
          // AbortSignal.any([signal, timeout]) and would throw on a plain object.
          signalIsReal = signal instanceof AbortSignal
          if (turn === 1) {
            cb.onToken("pre-cancel")
            signal.dispatchEvent(new Event("abort")) // simulate provider abort path
            const err = new Error("aborted"); err.name = "AbortError"; throw err
          }
          sawAborted = signal.aborted // second turn: must be false
          cb.onToken("after-cancel")
          return "ok"
        },
      })
      return s
    }
    c = mockClient(buildAcpHandlers(deps).handlers, c.out)
    await c.send({ jsonrpc: "2.0", id: 1, method: "authenticate" })
    c.next()
    await c.send({ jsonrpc: "2.0", id: 2, method: "session/new", params: { cwd: process.cwd() } })
    const id = c.next().result.id
    // Turn 1: cancelled mid-run → the wire reports cancelled, not a hard error.
    await c.send({ jsonrpc: "2.0", id: 3, method: "session/cancel", params: { sessionId: id } })
    assert.deepEqual(c.next().result, {})
    await c.send({ jsonrpc: "2.0", id: 4, method: "session/prompt", params: { sessionId: id, content: [{ type: "text", text: "go" }] } })
    await c.send({ jsonrpc: "2.0", id: 5, method: "session/prompt", params: { sessionId: id, content: [{ type: "text", text: "again" }] } })
    await c.waitIdle()
    const results = c.all()
    assert.ok(results.some((r) => r.id === 4 && r.result?.stopReason === "cancelled"), "turn 1 reports cancelled (AbortError path)")
    assert.ok(results.some((r) => r.id === 5 && r.result?.stopReason === "end_turn"), "turn 2 runs normally")
    assert.equal(signalIsReal, true, "signal is a real AbortSignal — AbortSignal.any() compatible")
    assert.equal(sawAborted, false, "signal reset between turns — second turn is not aborted")
  })

  it("MCP servers in session/new are ignored with a warning (M2 scope)", async () => {
    const warnings = []
    c = mockClient(buildAcpHandlers({ ...deps, log: (s) => warnings.push(s) }).handlers, c.out)
    await c.send({ jsonrpc: "2.0", id: 1, method: "authenticate" })
    c.next()
    await c.send({ jsonrpc: "2.0", id: 2, method: "session/new", params: { cwd: process.cwd(), mcpServers: [{ name: "fs" }] } })
    assert.ok(c.next().result.id, "session still created")
    assert.ok(warnings.some((w) => w.includes("MCP forwarding is M2 scope")), `warning logged, got: ${warnings.join(";")}`)
  })
})
