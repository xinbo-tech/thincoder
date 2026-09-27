/**
 * timer-wake.test.mjs — timer 到期自唤醒 · 核侧用例族（批 timer-wake 2026-09-27 · 台账 #443）。
 *
 * 设计权威 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30（机制单源；用例表 = §6.30.7，
 * 宿主落点 = §6.30.7 末「用例宿主」行）。
 * 本档覆盖：T-TW1（到期件三件）· T-TW2（post-turn 回归——行为零变）· T-TW7（在途帽显式拒）·
 * T-TW9 核侧半（选择面：`timerTurn` ⇒ `TIMER_TURN_DOMAIN` 选中；模式三元回归 = `turn-domain-mode.test.mjs`）。
 * 形态：纯函数直驱 + `injectPostTurn` 直驱 + 真 `runAgent` 端到端（唯一替身 = `globalThis.fetch`
 * 桩——先例 `turn-cap-checkpoint.test.mjs:92-102`）；全部零真实等待。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { TIMER_MAX_PENDING, pendingTimerDeadline, takeExpiredTimers, injectTimerReminders } from "../agent/timers.mjs"
import { injectPostTurn } from "../agent/post-turn.mjs"
import { timerTool } from "../agent-tools/timer.mjs"
import { createAgent, runAgent } from "../agent.mjs"
import { TIMER_TURN_DOMAIN, AUTO_TURN_DIGEST_DOMAIN, UPSTREAM_TURN_DOMAIN } from "../agent/helpers.mjs"

const ENC = new TextEncoder()

/** fetch 桩（SSE 文本回合——真 runAgent 的唯一替身，见批档/设计 §6.30.7）。 */
function installStub(text = "done") {
  const calls = []
  const saved = globalThis.fetch
  globalThis.fetch = async (_url, opts) => {
    calls.push(JSON.parse(opts.body))
    const frames = [
      { choices: [{ delta: { content: text } }] },
      { choices: [{ delta: {}, finish_reason: "stop" }] },
    ]
    const sse = frames.map((f) => `data: ${JSON.stringify(f)}\n\n`).join("") + "data: [DONE]\n\n"
    return { ok: true, status: 200, headers: { get: () => "text/event-stream" }, body: [ENC.encode(sse)] }
  }
  return { calls, restore: () => { globalThis.fetch = saved } }
}

/** 最小主 agent（真 createAgent——provider 指向假 host，出站被 fetch 桩拦下）。
 *  `autoApprove` = createAgent 顶层会话字段（`/auto` 的运行时面），不是 config 键。 */
function makeAgent(dir, { autoApprove = false, ...agentCfg } = {}) {
  const provider = { name: "stub", model: "stub-model", baseURL: "http://stub.invalid/v1", apiKey: "k" }
  return createAgent({ cwd: dir, provider, tools: [], autoApprove, config: { agent: { ...agentCfg }, providersList: [{ ...provider }] }, role: "main" })
}

// ─── T-TW1 · 正常：核到期件三件 ─────────────────────────────────────────────

test("T-TW1 核到期件：deadline = 最近时点；恰取到期项并出列；二次调用零返（幂等）；空在途 ⇒ null", () => {
  const now = 1_000_000
  const agent = {
    _pendingTimers: [
      { id: 1, expiresAt: now - 5_000, message: "expired-A" },
      { id: 2, expiresAt: now + 60_000, message: "future-B" },
      { id: 3, expiresAt: now - 1, message: "expired-C" },
    ],
  }
  assert.equal(pendingTimerDeadline(agent), now - 5_000, "deadline = 在途最近到期时点")
  const expired = takeExpiredTimers(agent, now)
  assert.deepEqual(expired.map((t) => t.id), [1, 3], "恰取到期项（原序）")
  assert.deepEqual(agent._pendingTimers.map((t) => t.id), [2], "到期项出列；未到期原样保留")
  assert.deepEqual(takeExpiredTimers(agent, now), [], "二次调用零返（到期即消费——绝不重复投递）")
  assert.equal(pendingTimerDeadline(agent), now + 60_000, "deadline 随出列前移")
  assert.equal(pendingTimerDeadline({ _pendingTimers: [] }), null, "空在途 ⇒ null")
  assert.deepEqual(injectTimerReminders(agent, []), [], "空批零注入")
})

test("T-TW1b 注入单点：逐条落历史 + 返回原文（同一串——显示面复用零第二份字面）", () => {
  const agent = { history: [] }
  const lines = injectTimerReminders(agent, [{ message: "run the probe" }, { message: "pull the data" }])
  assert.deepEqual(lines, [
    "[System reminder: ⏰ timer — run the probe]",
    "[System reminder: ⏰ timer — pull the data]",
  ])
  assert.deepEqual(agent.history.map((h) => h.content), lines, "历史 = 注入单点产物（role: user 同既有形态）")
  assert.ok(agent.history.every((h) => h.role === "user"))
})

// ─── T-TW2 · 正常：post-turn 回归（行为零变）─────────────────────────────────

const blankAgent = (over = {}) => ({ history: [], _pendingTimers: [], _pendingReminders: [], goal: null, config: {}, ...over })

test("T-TW2 post-turn 回归：到期 ⇒ 逐字注入一条 + 出列；未到期 ⇒ 零注入 + 在途不动", () => {
  const a1 = blankAgent({ _pendingTimers: [{ id: 1, expiresAt: Date.now() - 1, message: "check the log" }] })
  injectPostTurn(a1, [], [], {}, 0)
  assert.equal(a1.history.length, 1, "到期恰注入一条")
  assert.equal(a1.history[0].content, "[System reminder: ⏰ timer — check the log]", "逐字形态不变")
  assert.equal(a1.history[0].role, "user")
  assert.equal(a1._pendingTimers.length, 0, "到期项出列")

  const a2 = blankAgent({ _pendingTimers: [{ id: 9, expiresAt: Date.now() + 60_000, message: "later" }] })
  injectPostTurn(a2, [], [], {}, 0)
  assert.equal(a2.history.length, 0, "未到期 ⇒ 零注入")
  assert.equal(a2._pendingTimers.length, 1, "在途保留")
})

// ─── T-TW7 · 错误：在途条数帽（显式拒）──────────────────────────────────────

test(`T-TW7 在途帽 ${TIMER_MAX_PENDING}：超限显式抛错（可读文本）；在途保持不静默丢 / 不静默清`, () => {
  const seed = (n) => Array.from({ length: n }, (_, i) => ({ id: i, expiresAt: Date.now() + 60_000, message: `t${i}` }))
  const agent = { _pendingTimers: seed(TIMER_MAX_PENDING) }
  assert.throws(() => timerTool.execute({ seconds: 30 }, { agent }), /timers already pending \(max 8\)/,
    "第 9 次设 timer ⇒ 显式拒（可读文本）")
  assert.equal(agent._pendingTimers.length, TIMER_MAX_PENDING, "在途保持 8（不静默丢 / 不静默清）")
  // 腾出一格 ⇒ 可设；恰回满
  agent._pendingTimers.pop()
  assert.match(timerTool.execute({ seconds: 30 }, { agent }), /Timer set for 30 seconds/)
  assert.equal(agent._pendingTimers.length, TIMER_MAX_PENDING)
  // 尾条到期但未送达 ⇒ 仍在途 ⇒ 仍拒（清场归消费点，工具不代清）
  agent._pendingTimers[TIMER_MAX_PENDING - 1].expiresAt = Date.now() - 1
  assert.throws(() => timerTool.execute({ seconds: 30 }, { agent }), /timers already pending/)
})

// ─── T-TW9（核侧半）· 正常：域文本选择面（第三变体）──────────────────────────

test("T-TW9 选择面：`autoTurn + timerTurn`（手动档）⇒ history 选中 TIMER_TURN_DOMAIN（逐字 · 单行 · 括号收）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "timer-wake-"))
  const stub = installStub()
  try {
    const agent = makeAgent(dir)
    await runAgent(agent, "", {}, { autoTurn: true, timerTurn: true })
    const injected = agent.history.filter((h) => h.role === "user" && typeof h.content === "string" && h.content.startsWith("[System reminder: auto-turn"))
    assert.equal(injected.length, 1, "恰一条域文本")
    assert.equal(injected[0].content, TIMER_TURN_DOMAIN, "选中 timer 变体（逐字）")
    assert.ok(!injected[0].content.includes("\n"), "单行（无换行）")
    assert.ok(injected[0].content.endsWith("]"), "括号收尾")
    // wire 面：域文本确入首请求（机器线独有——不进 fullHistory 的部分不在本断言域）
    assert.ok(stub.calls[0].messages.some((m) => String(m.content ?? "") === TIMER_TURN_DOMAIN), "首请求含域文本")

    // 旁证：digest 档不受影响（无 timerTurn ⇒ 既有基座）；上游轮优先不回归
    const digestAgent = makeAgent(dir)
    await runAgent(digestAgent, "", {}, { autoTurn: true })
    assert.ok(digestAgent.history.some((h) => h.content === AUTO_TURN_DIGEST_DOMAIN), "digest 档 = 既有基座（零回归）")
    const askAgent = makeAgent(dir)
    await runAgent(askAgent, "", {}, { autoTurn: true, upstreamTurn: true, timerTurn: true })
    assert.ok(askAgent.history.some((h) => h.content === UPSTREAM_TURN_DOMAIN), "两旗同持 ⇒ 上游轮优先（不回归）")
    assert.ok(!askAgent.history.some((h) => h.content === TIMER_TURN_DOMAIN), "timer 变体不越位")
  } finally {
    stub.restore()
    rmSync(dir, { recursive: true, force: true })
  }
})

test("T-TW9b AUTO 档零注入（既有口径）：autoApprove ⇒ 三变体皆零注入", async () => {
  const dir = mkdtempSync(join(tmpdir(), "timer-wake-"))
  const stub = installStub()
  try {
    const agent = makeAgent(dir, { autoApprove: true })
    await runAgent(agent, "", {}, { autoTurn: true, timerTurn: true })
    for (const [label, text] of [["timer", TIMER_TURN_DOMAIN], ["digest", AUTO_TURN_DIGEST_DOMAIN], ["upstream", UPSTREAM_TURN_DOMAIN]]) {
      assert.ok(!agent.history.some((h) => h.content === text), `AUTO 档零 ${label} 域文本（既有口径）`)
    }
  } finally {
    stub.restore()
    rmSync(dir, { recursive: true, force: true })
  }
})
