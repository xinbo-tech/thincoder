/**
 * completion.mjs tests — handleCompletion empty-response recovery.
 * Empty responses (reasoning exhausted / truncated output) must inject a retry
 * reminder instead of aborting the whole turn; after MAX_EMPTY_RETRIES (2)
 * consecutive empties the original error surfaces.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { handleCompletion } from "../src/agent/completion.mjs"

function baseAgent(overrides = {}) {
  return {
    history: [],
    tasks: [],
    config: { agent: {}, advisor: {} },
    provider: { model: "test-model" },
    _mutatedThisRun: false,
    _touchedFiles: [],
    ...overrides,
  }
}

const baseResponse = { content: "ok", toolCalls: [], finishReason: "stop" }
const emptyResponse = { content: null, toolCalls: [], finishReason: "stop" }

test("handleCompletion: empty response injects retry reminder and continues", () => {
  const agent = baseAgent()
  const turned = []
  const cr = handleCompletion(agent, emptyResponse, 0, 0, 0, false, 0, { onTurnEnd: (a, t) => turned.push(t) })
  assert.equal(cr.action, "continue")
  assert.equal(agent._emptyRetries, 1)
  assert.deepEqual(turned, [0], "onTurnEnd called so the loop can continue")
  const last = agent.history.at(-1)
  assert.equal(last.role, "user")
  assert.ok(last.content.startsWith("[System reminder: your last response was empty"), last.content)
  // Empty retry reminder is machine-only — the human-readable line stays untouched
  assert.equal(agent._fullHistory, undefined)
})

test("handleCompletion: empty response does not consume verify/advisor pushback budget", () => {
  const agent = baseAgent()
  const cr = handleCompletion(agent, emptyResponse, 0, 0, 2, false, 3, {})
  assert.equal(cr.guardPushbacks, 2)
  assert.equal(cr.advisorPushbacks, 3)
})

test("handleCompletion: consecutive empties exceed budget and throw the original error", () => {
  const agent = baseAgent()
  assert.equal(handleCompletion(agent, emptyResponse, 0, 0, 0, false, 0, {}).action, "continue")
  assert.equal(handleCompletion(agent, emptyResponse, 0, 1, 0, false, 0, {}).action, "continue")
  assert.throws(
    () => handleCompletion(agent, emptyResponse, 0, 2, 0, false, 0, {}),
    /LLM returned empty response.*test-model/,
  )
  assert.equal(agent._emptyRetries, 2, "budget exhausted at 2 retries")
})

test("handleCompletion: retry budget resets per run (fresh agent object)", () => {
  const a1 = baseAgent()
  handleCompletion(a1, emptyResponse, 0, 0, 0, false, 0, {})
  const a2 = baseAgent()
  const cr = handleCompletion(a2, emptyResponse, 0, 0, 0, false, 0, {})
  assert.equal(cr.action, "continue", "a fresh agent gets a fresh budget")
})

test("handleCompletion: non-empty response unaffected (normal completion path)", () => {
  const agent = baseAgent()
  const cr = handleCompletion(agent, baseResponse, 0, 0, 0, false, 0, {})
  assert.equal(cr.action, "done")
  assert.equal(cr.content, "ok")
  assert.deepEqual(agent.history.at(-1), { role: "assistant", content: "ok" }, "real response committed via pushReal")
  assert.deepEqual(agent._fullHistory.at(-1), { role: "assistant", content: "ok" }, "and mirrored to the human-readable line")
})

test("handleCompletion: pending tasks still take priority over empty retry? no — empty check first", () => {
  // The empty check is the first gate: a model that returned nothing cannot be
  // reminded about tasks, so the retry reminder wins over the pending-task reminder.
  const agent = baseAgent({ tasks: [{ title: "T1", status: "pending" }] })
  const cr = handleCompletion(agent, emptyResponse, 0, 0, 0, false, 0, {})
  assert.equal(cr.action, "continue")
  const last = agent.history.at(-1)
  assert.ok(last.content.startsWith("[System reminder: your last response was empty"), last.content)
})

test("handleCompletion: pending-task pushback fires at most ONCE (no unbounded loop)", () => {
  const agent = baseAgent({ tasks: [{ title: "T1", status: "pending" }] })
  // First completion attempt with pending → one reminder, continue
  const cr1 = handleCompletion(agent, baseResponse, 0, 0, 0, false, 0, {})
  assert.equal(cr1.action, "continue")
  assert.equal(agent._taskPushbacks, 1)
  const last = agent.history.at(-1)
  assert.ok(last.content.startsWith("[System reminder: you still have pending tasks: T1"), last.content)
  assert.ok(last.content.includes("only reminder"), "copy says it is the only reminder")

  // Second completion attempt → model is free to finish (no second pushback)
  const cr2 = handleCompletion(agent, baseResponse, 0, 1, 0, false, 0, {})
  assert.equal(cr2.action, "done", "second attempt is not pushed back")
  assert.equal(cr2.content, "ok")
})

test("handleCompletion: updating the task list resets the pushback budget", async () => {
  const agent = baseAgent({ tasks: [{ title: "T1", status: "pending" }] })
  handleCompletion(agent, baseResponse, 0, 0, 0, false, 0, {})
  assert.equal(agent._taskPushbacks, 1)
  // Task tool updates the list (statuses changed) → fresh budget
  const { taskTool } = await import("../src/agent-tools/task.mjs")
  taskTool.execute({ items: [{ title: "T1", status: "in_progress" }, { title: "T2", status: "pending" }] }, { agent })
  assert.equal(agent._taskPushbacks, 0, "task update resets the counter")
  const cr = handleCompletion(agent, baseResponse, 0, 1, 0, false, 0, {})
  assert.equal(cr.action, "continue", "fresh list state earns one reminder again")
  assert.equal(agent._taskPushbacks, 1)
})

test("handleCompletion: no pending tasks → no pushback, no counter touched", () => {
  const agent = baseAgent({ tasks: [{ title: "D1", status: "done" }] })
  const cr = handleCompletion(agent, baseResponse, 0, 0, 0, false, 0, {})
  assert.equal(cr.action, "done")
  assert.equal(agent._taskPushbacks ?? 0, 0)
})

test("handleCompletion: advisor guard pushes back BELOW the convergence cap", () => {
  const agent = baseAgent({
    config: { agent: {}, advisor: { guard: true } },
    _mutatedThisRun: true,
    _touchedFiles: ["src/a.mjs"],
    _calledAdvisorThisRun: false,
    _advisorRound: 2,
  })
  const cr = handleCompletion(agent, baseResponse, 0, 0, 0, false, 0, {})
  assert.equal(cr.action, "continue", "mutations without a review → reminder injected")
  const last = agent.history.at(-1)
  assert.ok(last.content.startsWith("[System reminder: you changed code"), last.content)
  assert.ok(last.content.includes("round 3"), "round number = _advisorRound + 1")
})

test("handleCompletion: advisor guard does NOT push back at/after the convergence cap", () => {
  // Cap sync regression (observed "round 7" loop): beyond MAX_ADVISOR_ROUNDS the
  // advisor tool refuses reviews (run.mjs cap), so pushing back would loop
  // forever — fix → pushback → cap-refused call → fix → … The guard must let
  // the run finish; the cap message from the last accepted review stands.
  const agent = baseAgent({
    config: { agent: {}, advisor: { guard: true } },
    _mutatedThisRun: true,
    _touchedFiles: ["src/a.mjs"],
    _calledAdvisorThisRun: false,
    _advisorRound: 5, // MAX_ADVISOR_ROUNDS
  })
  const cr = handleCompletion(agent, baseResponse, 0, 0, 0, false, 0, {})
  assert.equal(cr.action, "done", "cap reached → no more pushback")
  const last = agent.history.at(-1)
  assert.ok(!last.content.startsWith("[System reminder: you changed code"), "no advisor reminder after cap")
})

test("handleCompletion: advisor guard default OFF — no config pushes nothing back (2026-08-21)", () => {
  const agent = baseAgent({
    config: { agent: {}, advisor: {} },
    _mutatedThisRun: true,
    _touchedFiles: ["src/a.mjs"],
    _calledAdvisorThisRun: false,
    _advisorRound: 0,
  })
  const cr = handleCompletion(agent, baseResponse, 0, 0, 0, false, 0, {})
  assert.equal(cr.action, "done", "guard defaults OFF → completion accepted without a review")
  assert.ok(!agent.history.some((m) => m.content?.includes("MUST get an advisor review")), "no advisor reminder injected")
})

test("handleCompletion: legacy advisor.enabled no longer triggers the guard (deprecated, 2026-08-21)", () => {
  const agent = baseAgent({
    config: { agent: {}, advisor: { enabled: true } },
    _mutatedThisRun: true,
    _touchedFiles: ["src/a.mjs"],
    _calledAdvisorThisRun: false,
    _advisorRound: 0,
  })
  const cr = handleCompletion(agent, baseResponse, 0, 0, 0, false, 0, {})
  assert.equal(cr.action, "done", "enabled is not read anymore → no pushback")
  assert.ok(!agent.history.some((m) => m.content?.includes("MUST get an advisor review")), "no advisor reminder injected")
})

test("handleCompletion: engineering mode is exempt from the advisor guard even with guard: true", () => {
  const agent = baseAgent({
    config: { agent: { engineering: true }, advisor: { guard: true } },
    _mutatedThisRun: true,
    _touchedFiles: ["src/a.mjs"],
    _calledAdvisorThisRun: false,
    _advisorRound: 0,
  })
  const cr = handleCompletion(agent, baseResponse, 0, 0, 0, false, 0, {})
  assert.equal(cr.action, "done", "engineering mode never gets advisor pushback")
  assert.ok(!agent.history.some((m) => m.content?.includes("MUST get an advisor review")), "no advisor reminder injected")
})


