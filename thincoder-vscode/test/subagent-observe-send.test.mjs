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
import { subagentObserve, subagentSend, SUBAGENT_OBSERVE_RECENT, subagentStatus, cancelSubagent, cancelSubagentAction } from "../src/agent-tools/subagent-actions.mjs"
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

// ═══ 第 10 批（AGENT-LOOP.md §18——advisor 池接入面：status 双池 / cancel 落点 / 指引）═══════

/** 评审池条目真形状（advisor-async launchAsyncAdvisor：role/reviewType/round/status/done）。 */
function advisorEntry(over = {}) {
  return {
    id: 9, role: "advisor", reviewType: "design", round: 2, status: "running",
    model: "glm-5.3", startedAt: Date.now() - 9000, done: false, cancelled: false,
    controller: new AbortController(), ...over,
  }
}

/** 本仓真载体形状：history 数组兼挂双池（agent.mjs 绑定不变式——accessor history 优先）。 */
function dualParent(over = {}) {
  const history = []
  history._asyncSubagents = new Map()
  history._asyncAdvisors = new Map()
  return { history, cwd: "/proj", ...over }
}

test("T-B1/T-B2/T-B3（AC-B1）：status 双池并表——概览含评审条目 + 单查命中评审池 + done 未取注记", () => {
  const parent = dualParent()
  parent.history._asyncSubagents.set(3, mkEntry({ id: 3, childAgent: { _touchedFiles: [] } }))
  parent.history._asyncAdvisors.set(9, advisorEntry())
  const ctx = { agent: parent, cwd: "/proj", depth: 0 }
  // 概览并表（T-B1）
  const ov = JSON.parse(subagentStatus({}, ctx))
  assert.equal(ov.overview.running.length, 2, "双池 running 并表（子代理 + 评审）")
  const review = ov.overview.running.find((r) => r.role === "advisor")
  assert.ok(review, "评审条目在概览 running 行")
  assert.equal(review.reviewType, "design")
  assert.equal(review.round, 2)
  assert.equal(typeof review.elapsedSec, "number", "评审行带 elapsedSec")
  assert.equal(review.turn, undefined, "评审行不带子代理 turn/maxTurns（字段面区分）")
  // 单查（advisor id——数值与字符串两形态）——不报 unknown（T-B2）
  for (const idArg of [9, "9"]) {
    const one = JSON.parse(subagentStatus({ id: idArg }, ctx))
    assert.equal(one.status, "running")
    assert.equal(one.role, "advisor")
    assert.equal(one.reviewType, "design")
    assert.equal(one.round, 2)
    assert.notEqual(one.status, "error")
  }
  // done 未取注记（T-B3/D-B5——不把已 settle 未消化当 running）
  parent.history._asyncAdvisors.get(9).status = "done"
  parent.history._asyncAdvisors.get(9).done = true
  const done = JSON.parse(subagentStatus({ id: 9 }, ctx))
  assert.equal(done.status, "done")
  assert.ok(done.note, "done 行带自动送达注记")
  assert.equal(JSON.parse(subagentStatus({}, ctx)).overview.running.length, 1, "done 评审不计入 running")
  // 未知 id 文案不变（既有测试锁定）
  assert.match(JSON.parse(subagentStatus({ id: 77 }, ctx)).error, /unknown async subagent id: 77/)
})

test("T-B2b（跨端同判定锁）：cancel→settle 窗口（cancelled=true、status 未变）评审 → 单查报 running（不另报 cancelled）", () => {
  const parent = dualParent()
  parent.history._asyncAdvisors.set(9, advisorEntry({ cancelled: true }))
  const ctx = { agent: parent, cwd: "/proj", depth: 0 }
  const one = JSON.parse(subagentStatus({ id: 9 }, ctx))
  assert.equal(one.status, "running", "取消在途不另报 cancelled（NFR-B1 跟端同判定——取消事实由 cancel 返回值承载）")
  assert.equal(one.reviewType, "design")
  assert.equal(one.round, 2)
})

test("T-B6/T-B7（AC-B3）：cancel 落评审池——abort + 零直接注入（提醒归核 settle）+ 幂等 + 已完成/未知/缺 id 既有错误行", () => {
  const parent = dualParent()
  const adv = advisorEntry()
  parent.history._asyncAdvisors.set(9, adv)
  // 工具动作路径（subagent.mjs execute → cancelSubagentAction）
  const r1 = JSON.parse(cancelSubagentAction({ id: 9 }, { agent: parent, depth: 0, cwd: "/proj" }))
  assert.equal(r1.status, "cancelled")
  assert.equal(adv.controller.signal.aborted, true, "条目 controller 已 abort（与面板 ⏹ 同源）")
  assert.equal(adv.cancelled, true)
  // W12（2026-09-15）改判：取消本身**不注入提醒**（原端侧行为）——核 entry 的 settle 在
  // cancelled 分支注入「评审已取消——token 未签发」（settleAsyncEntry——本端重复注入即双报）。
  assert.equal(parent.history.length, 0, "取消本身零注入（提醒归核 settle cancelled 分支）")
  const r2 = JSON.parse(cancelSubagentAction({ id: 9 }, { agent: parent, depth: 0, cwd: "/proj" }))
  assert.deepEqual(r2, r1, "重复取消幂等（同一确认）")
  assert.equal(parent.history.length, 0, "幂等——零注入")
  // 已完成评审 → already finished
  parent.history._asyncAdvisors.set(11, advisorEntry({ id: 11, status: "done", done: true }))
  assert.match(JSON.parse(cancelSubagentAction({ id: 11 }, { agent: parent, depth: 0, cwd: "/proj" })).error, /already finished/)
  // 两池皆无 / 缺 id → 既有文案
  assert.match(JSON.parse(cancelSubagent(parent, 88)).error, /unknown async subagent id/)
  assert.match(JSON.parse(cancelSubagent(parent, null)).error, /cancel requires an id/)
  // 子代理条目路径零回归（_asyncSubagents 命中时仍走本池取消）
  const sub = mkEntry({ id: 3, controller: new AbortController() })
  parent.history._asyncSubagents.set(3, sub)
  assert.equal(JSON.parse(cancelSubagent(parent, 3)).status, "cancelled")
  assert.equal(sub.controller.signal.aborted, true, "子代理取消路径不变")
})

test("T-B8（AC-B4）：observe/send 遇 advisor id → 明确指引（含 action:'status'），不报 unknown", () => {
  const parent = dualParent()
  parent.history._asyncAdvisors.set(9, advisorEntry())
  const ctx = { agent: parent, cwd: "/proj", depth: 0 }
  const obs = JSON.parse(subagentObserve({ id: 9 }, ctx))
  const snd = JSON.parse(subagentSend({ id: 9, message: "m" }, ctx))
  for (const o of [obs, snd]) {
    assert.equal(o.status, "error")
    assert.match(o.error, /ADVISOR/, "明示这是后台评审（不报含糊 id 错）")
    assert.ok(!/unknown/i.test(o.error), "不含 unknown（AC-B4 机判）")
    assert.match(o.error, /action:'status'/, "指向 action:'status' 或自动送达")
  }
  assert.equal(parent.history._asyncAdvisors.get(9)._injected, undefined, "send 不为评审开新能力（零注入）")
})
