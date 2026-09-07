/**
 * subagent-observe-send.test.mjs — SUBAGENT-OBSERVE-SEND.md (2026-09-08) observe/send action
 * executor tests (VSC 端). Locks the pure executor layer — pool lookups, the N=5 truncation
 * summary extraction, current-tool capture, send queue + running-only validation, readonly/
 * control classification. The full send→child-turn-boundary delivery runs through the real
 * agent loop (agent.mjs turnInput) and is exercised by the live flow; these lock the
 * decision surface the flow depends on.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { subagentObserve, subagentSend, SUBAGENT_OBSERVE_RECENT } from "../src/agent-tools/subagent-actions.mjs"
import { subagentTool } from "../src/agent-tools/subagent.mjs"

/** Minimal parent agent + async-pool shape the executors read. */
function mkEntry(over) {
  const base = {
    id: 1, role: "explore", status: "running", model: "m", maxTurns: 100, turn: 0,
    startedAt: Date.now() - 5000, done: false, report: null, cancelled: false,
    controller: null, _injected: [], _currentTool: null, childAgent: null,
  }
  return Object.assign(base, over)
}
const runningAgent = (entry, cwd) => ({ agent: { _asyncSubagents: new Map([[entry.id, entry]]) }, cwd, depth: 0 })
const childHist = () => [
  { role: "user", content: "spawn task" },
  { role: "assistant", content: null, tool_calls: [{ function: { name: "read" } }] },
  { role: "tool", content: "…" },
  { role: "assistant", content: "step one plan line" },
  { role: "assistant", content: null, tool_calls: [{ function: { name: "edit" } }, { function: { name: "edit" } }] },
  { role: "tool", content: "…" },
  { role: "assistant", content: "a long first line\nsecond line" },
  { role: "tool", content: "…" },
  { role: "assistant", content: null, tool_calls: [{ function: { name: "lint" } }] },
  { role: "tool", content: "…" },
  { role: "assistant", content: "final-ish step" },
  { role: "tool", content: "…" },
  { role: "assistant", content: null, tool_calls: [{ function: { name: "verify" } }] },
  { role: "tool", content: "…" },
]

test("observe running: last-N summaries (truncation extract) + current tool + turn/touched", () => {
  const childAgent = { history: childHist(), _touchedFiles: ["/proj/a.mjs"] }
  const entry = mkEntry({ turn: 6, childAgent, _currentTool: { name: "grep", args: "{}" } })
  const out = JSON.parse(subagentObserve({ id: entry.id }, runningAgent(entry, "/proj")))
  assert.equal(out.status, "running")
  assert.equal(out.turn, 6)
  assert.deepEqual(out.currentTool, { name: "grep", args: "{}" })
  assert.ok(out.touchedFiles, "running 0+ changes carry touchedFiles summary")
  // 7 assistant steps → newest 5 kept; extraction = tool names or first line of content.
  assert.equal(out.recent.length, SUBAGENT_OBSERVE_RECENT)
  assert.equal(out.recent[0], "tools: edit, edit") // oldest of the kept 5
  assert.ok(out.recent[1].startsWith("a long first line"), "multi-line content collapses to first line")
  assert.equal(out.recent[1], "a long first line") // content first line (multi-line collapsed)
  assert.ok(out.recent.includes("tools: verify"), "newest kept")
  assert.ok(!out.recent.includes("tools: read"), "oldest assistant steps dropped beyond N=5")
  assert.ok(!out.recent.includes("step one plan line"), "6th-oldest dropped beyond N=5")
  assert.ok(!out.recent.some((s) => s.includes("second line")), "full content body not returned (truncation, N2)")
})

test("observe running zero changes → touched placeholder", () => {
  const childAgent = { history: childHist(), _touchedFiles: [] }
  const entry = mkEntry({ childAgent })
  const out = JSON.parse(subagentObserve({ id: entry.id }, runningAgent(entry, "/proj")))
  assert.equal(out.touched, "—（尚无改动）")
})

test("observe queued → placeholder (未启动), no childAgent state", () => {
  const entry = mkEntry({ status: "queued", position: 2, childAgent: null })
  const out = JSON.parse(subagentObserve({ id: entry.id }, runningAgent(entry, "/proj")))
  assert.equal(out.status, "queued")
  assert.equal(out.recent.length, 0)
  assert.equal(out.currentTool, null)
  assert.equal(out.touched, "—（未启动）")
})

test("observe done → terminal + report preview (still queryable)", () => {
  const childAgent = { history: [], _touchedFiles: [] }
  const entry = mkEntry({ done: true, status: "done", report: "final report text here", childAgent })
  const out = JSON.parse(subagentObserve({ id: entry.id }, runningAgent(entry, "/proj")))
  assert.equal(out.status, "done")
  assert.equal(out.reportPreview, "final report text here")
})

test("observe unknown / missing id → clear error", () => {
  const entry = mkEntry({})
  const ctx = runningAgent(entry, "/proj")
  const unknown = JSON.parse(subagentObserve({ id: 999 }, ctx))
  assert.equal(unknown.status, "error")
  assert.match(unknown.error, /unknown async subagent id: 999/)
  const missing = JSON.parse(subagentObserve({}, ctx))
  assert.equal(missing.status, "error")
  assert.match(missing.error, /observe requires an id/)
})

test("send running: queues message on entry._injected, returns injected", () => {
  const entry = mkEntry({})
  const out = JSON.parse(subagentSend({ id: entry.id, message: "go left instead" }, runningAgent(entry, "/proj")))
  assert.equal(out.status, "injected")
  assert.equal(entry._injected.length, 1)
  assert.equal(entry._injected[0].message, "go left instead")
})

test("send queued → error (only running accepts)", () => {
  const entry = mkEntry({ status: "queued", childAgent: null })
  const out = JSON.parse(subagentSend({ id: entry.id, message: "hi" }, runningAgent(entry, "/proj")))
  assert.equal(out.status, "error")
  assert.match(out.error, /still queued/)
})

test("send settled/done → error", () => {
  const entry = mkEntry({ done: true, status: "done" })
  const out = JSON.parse(subagentSend({ id: entry.id, message: "hi" }, runningAgent(entry, "/proj")))
  assert.equal(out.status, "error")
  assert.match(out.error, /already finished/)
})

test("send racing a concurrent cancel → error (not silently queued)", () => {
  const entry = mkEntry({ cancelled: true }) // running but cancel-flagged mid-flight
  const out = JSON.parse(subagentSend({ id: entry.id, message: "hi" }, runningAgent(entry, "/proj")))
  assert.equal(out.status, "error")
  assert.match(out.error, /being cancelled/)
  assert.equal(entry._injected.length, 0)
})

test("send sync/unknown id → error (a sync spawn returns no pool id)", () => {
  const entry = mkEntry({})
  const out = JSON.parse(subagentSend({ id: 777, message: "hi" }, runningAgent(entry, "/proj")))
  assert.equal(out.status, "error")
  assert.match(out.error, /unknown async subagent id: 777/)
})

test("send missing id / empty message → clear error", () => {
  const entry = mkEntry({})
  const ctx = runningAgent(entry, "/proj")
  const noId = JSON.parse(subagentSend({ message: "hi" }, ctx))
  assert.equal(noId.status, "error")
  const noMsg = JSON.parse(subagentSend({ id: entry.id }, ctx))
  assert.equal(noMsg.status, "error")
  assert.match(noMsg.error, /non-empty message/)
})

test("credential discipline (AC4): observe/send never touch designToken/designId", () => {
  const entry = mkEntry({})
  const ctx = runningAgent(entry, "/proj")
  const obs = JSON.parse(subagentObserve({ id: entry.id, designToken: "x", designId: "y" }, ctx))
  assert.equal(obs.status, "running")
  const snd = JSON.parse(subagentSend({ id: entry.id, message: "m", designToken: "x", designId: "y" }, ctx))
  assert.equal(snd.status, "injected")
})

test("classification (评审 #4): observe=readonly, send=control", () => {
  assert.equal(subagentTool.isReadonlyAction({ action: "observe" }), true)
  assert.equal(subagentTool.isReadonlyAction({ action: "status" }), true)
  assert.equal(subagentTool.isControlAction({ action: "send" }), true)
  assert.equal(subagentTool.isControlAction({ action: "cancel" }), true)
  assert.equal(subagentTool.isReadonlyAction({ action: "send" }), false)
  assert.equal(subagentTool.isControlAction({ action: "observe" }), false)
})

test("depth gate: observe/send unavailable inside a subagent (depth>0)", () => {
  const entry = mkEntry({})
  const innerCtx = { agent: { _asyncSubagents: new Map() }, cwd: "/proj", depth: 1 }
  const obs = JSON.parse(subagentObserve({ id: entry.id }, innerCtx))
  assert.equal(obs.status, "error")
  const snd = JSON.parse(subagentSend({ id: entry.id, message: "hi" }, innerCtx))
  assert.equal(snd.status, "error")
})
