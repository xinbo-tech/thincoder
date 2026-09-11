/**
 * turn-across-segments.test.mjs — 跨段累计编号（VSC 端——设计档 docs/design/
 * TURN-CAP-CONTINUE.md §19.1-19.8）用例表 1:1：T1-T11。
 * T1-T3 编号帧向量（段 1 首轮 · 续跑段首轮 · 第 3 段中段）· T4 不变式扫描（限可达域）·
 * T5/T6 消费助手 applyTurnFrame（fixture entry / 空 entry）· T7 webview 冻结头（显示面零改动）·
 * T9 真 runAgent 直驱段间生产断言（载体缺口核心）· T10 真 runChild 消费侧接线（段前累计 →
 * 续跑段种子）· T11 种子锚（仅 escalate 支——无行为覆盖的唯一驻留锁）。
 * 2026-09-11 TEST-LIFECYCLE 扫① 削段：原 T8 源码字面锚全删（行为由 T1-T4/T9/T10 覆盖）；
 * T11 裁为 escalate-async 种子最小锚（agent.mjs/runChild 两份已被 T9/T10 行为覆盖，删）。
 * AC 映射：AC1′←T1-T4/T9 · AC2′←T5/T6/T10 · AC3′←T11 · AC4′←T7 · AC5′←T9
 * （全量回归缝 = `npm test` / `npm run test:full`）。
 * 接缝注（T9/T10——设计 §19.6）：T9 provider 桩 = 不可解析（无 baseURL——chat 即抛）；
 * fetch 桩以 AbortError 立即重抛（绕开 requestWithRetry 的 1s/2s/4s 退避——机械保证零网络；
 * 每段 ~0.8s 为 agent setup 开销）。onAgentTurn 在循环头先于 chat 发射——测试 catch 抛错、
 * 只收帧。T10 夹具 = entry 空对象 + onQuestion 返回 "Continue" + 空 parent（merge 空 sink
 * 早退）；段 2 假 runAgent 以 onAgentTurn(2, 101)（= turnFrame(2, 0, 100)，与 T9 同口径）
 * 模拟生成侧帧。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { turnFrame, applyTurnFrame } from "../src/agent/run-helpers.mjs"
import { runAgent, ContinueError } from "../src/agent.mjs"
import { runChild } from "../src/agent-tools/subagent-run.mjs"
import { setupWebview, installChatFixture } from "./helpers/webview-env.mjs"

/** 源码读取（EOL 归一——源码锚判据不因 CRLF/LF 写法漂移）。 */
const readSrc = (rel) => readFileSync(new URL(rel, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const escalateAsyncSrc = readSrc("../src/agent-tools/subagent-escalate-async.mjs")

/** 池条目最小形状（fixture——mkEntry 风格，test/subagent-observe-send.test.mjs 先例）。 */
function mkEntry(over = {}) {
  return { id: 1, role: "explore", status: "running", model: "m", turn: 0, maxTurns: 100, ...over }
}

let env
let tmpCwd
before(() => {
  env = setupWebview()
  installChatFixture()
  tmpCwd = mkdtempSync(join(tmpdir(), "turn-seg-"))
})
after(() => {
  env?.cleanup?.()
  try { rmSync(tmpCwd, { recursive: true, force: true }) } catch { /* best effort */ }
})

// ─── T1-T3：编号帧向量（正常 / 边界）────────────────────────────────────────

test("T1 段 1 首轮（正常）：turnFrame(1, 0, 100) → {turn: 1, maxTurns: 100}", () => {
  assert.deepEqual(turnFrame(1, 0, 100), { turn: 1, maxTurns: 100 })
})

test("T2 续跑段首轮（边界——缺陷点）：turnFrame(101, 0, 100) → {turn: 101, maxTurns: 200}——不回到 1", () => {
  const f = turnFrame(101, 0, 100)
  assert.deepEqual(f, { turn: 101, maxTurns: 200 })
  assert.notEqual(f.turn, 1, "续跑段首轮编号不重置")
})

test("T3 第 3 段中段（边界）：turnFrame(238, 37, 100) → {turn: 238, maxTurns: 300}", () => {
  assert.deepEqual(turnFrame(238, 37, 100), { turn: 238, maxTurns: 300 })
})

// ─── T4：不变式扫描（边界——限可达域）───────────────────────────────────────

test("T4 不变式扫描（边界）：限可达域内恒 turn ≥ 1 · turn ≤ maxTurns · maxTurns = 段前累计 + 段预算", () => {
  for (const seq of [1, 100, 101, 250]) {
    for (const max of [40, 100]) {
      for (let turn = 0; turn < max; turn++) {
        // 可达域：段内 turn ∈ [0, max)；该轮累计序数 seq ≥ turn + 1（段前累计 ≥ 0）
        if (seq < turn + 1) continue
        const f = turnFrame(seq, turn, max)
        const at = `seq=${seq} turn=${turn} max=${max}`
        assert.ok(f.turn >= 1, `${at}: turn ≥ 1`)
        assert.ok(f.turn <= f.maxTurns, `${at}: turn ≤ maxTurns（不越累计预算）`)
        assert.equal(f.maxTurns, seq - turn - 1 + max, `${at}: 差额项 = 段前累计`)
      }
    }
  }
})

// ─── T5/T6：消费助手 applyTurnFrame（正常 / 边界）────────────────────────────

test("T5 消费助手（正常）：applyTurnFrame(entry, 101, 200) → entry.turn=101 / maxTurns=200", () => {
  const entry = mkEntry()
  applyTurnFrame(entry, 101, 200)
  assert.equal(entry.turn, 101, "entry.turn = 帧第一参（累计编号）")
  assert.equal(entry.maxTurns, 200, "entry.maxTurns = 帧第二参（累计预算）")
  // 兼容形态：帧缺第二参（mt undefined）→ 不覆盖既有 maxTurns（契约：maxTurns > 0 才写）
  applyTurnFrame(entry, 55)
  assert.equal(entry.turn, 55, "缺第二参仍更新编号")
  assert.equal(entry.maxTurns, 200, "缺第二参不覆盖既有预算")
})

test("T6 空 entry（边界——sync 路径）：applyTurnFrame(null, 101, 200) → no-op 不抛", () => {
  assert.doesNotThrow(() => applyTurnFrame(null, 101, 200), "entry 空 → no-op（sync 零影响）")
})

// ─── T7：显示面零改动（正常——webview 冻结头消费累计值）────────────────────

test("T7 显示面零改动（正常）：终态消息 {turn:130, maxTurns:200} → 冻结头含 turn 130/200", async () => {
  const state = await import("../webview/state.js")
  const activity = await import("../webview/activity.js")
  const { S, ctx } = state
  ctx.messagesEl.replaceChildren()
  S._subBlocks.clear()
  activity.applySubagentStatus({ type: "subagent", status: "started", role: "explore", id: 7, pool: true, model: "glm-5.3" })
  activity.applySubagentStatus({ type: "subagent", status: "done", role: "explore", id: 7, turn: 130, maxTurns: 200 })
  const block = S._subBlocks.get("sub:explore#7")
  assert.ok(block, "块在位（started 出生）")
  const hdr = block.querySelector(".sub-hdr").textContent
  assert.ok(hdr.includes("turn 130/200"), `冻结头逐字渲染累计编号（webview 零改动）：${hdr}`)
})

// ─── T9：段间生产断言（边界——真 runAgent 直驱 ×3 段）───────────────────────

test("T9 段间生产断言（边界——本缺口核心）：段 2 首帧 = 段 1 累计 + 1（真 runAgent）", async () => {
  const origFetch = globalThis.fetch
  // fetch 桩：AbortError 立即重抛（requestWithRetry 不重试）——机械保证零网络 + 零退避等待
  globalThis.fetch = async () => { throw new DOMException("The operation was aborted.", "AbortError") }
  const provider = { name: "stub", model: "stub-model" } // 不可解析（无 baseURL/apiKey）
  const framesOf = async (opts) => {
    const frames = []
    try {
      await runAgent(provider, tmpCwd, "task", { onAgentTurn: (t, mt) => frames.push([t, mt]) }, undefined, true, opts)
    } catch { /* chat 即抛——只收帧（接缝注） */ }
    return frames
  }
  try {
    const seg1 = await framesOf({ depth: 1, maxTurns: 100, resume: false })
    assert.deepEqual(seg1, [[1, 100]], "段 1 首帧 (1, 100)")
    const seg2 = await framesOf({ depth: 1, maxTurns: 100, resume: true, _turnSeqBase: seg1.at(-1)[0] })
    assert.deepEqual(seg2, [[2, 101]], "段 2 首帧 (2, 101) = 段 1 累计 + 1（不回到 1）")
    const seg3 = await framesOf({ depth: 1, maxTurns: 100, resume: false })
    assert.deepEqual(seg3, [[1, 100]], "段 3 首帧 (1, 100)——新链复位")
  } finally {
    globalThis.fetch = origFetch
  }
})

// ─── T10：消费侧接线（边界——真 runChild + 假 runAgent）─────────────────────

test("T10 消费侧接线（边界）：段前累计 → 续跑段 opts 种子；entry/终态通知携累计值", async () => {
  const entry = {} // 空对象夹具（接缝注）——applyTurnFrame 直接写字段
  const calls = []
  const notifications = []
  const fakeRunAgent = async (p, cwd, input, callbacks, signal, flag, opts) => {
    calls.push({ opts: { ...opts } })
    if (calls.length === 1) {
      callbacks.onAgentTurn(1, 100) // 段 1 帧（生成侧口径）
      throw new ContinueError(100)
    }
    callbacks.onAgentTurn(2, 101) // 段 2 首帧 = turnFrame(2, 0, 100)（与 T9 同口径）
    return "stub report"
  }
  const out = await runChild(entry, {
    parent: {},
    ctx: { callbacks: { onQuestion: async () => "Continue", onSubagent: (m) => notifications.push(m) } },
    cwd: tmpCwd,
    runAgent: fakeRunAgent,
    role: "explore",
    subId: 7,
    maxTurns: 100,
    childInput: "task",
    provider: { name: "stub", model: "stub-model" },
    designId: null,
    task: "task",
    asyncFlag: false,
    childSignal: undefined,
  })
  assert.equal(calls.length, 2, "ContinueError → onQuestion Continue → 续跑（两段）")
  assert.equal(calls[0].opts.resume, false, "段 1 非续跑")
  assert.equal("_turnSeqBase" in calls[0].opts, false, "种子仅挂续跑支（段 1 不携）")
  assert.equal(calls[1].opts.resume, true, "段 2 resume:true")
  assert.equal(calls[1].opts._turnSeqBase, 1, "续跑段种子 = 段前累计（段 1 帧第一参）")
  assert.equal(entry.turn, 2, "entry.turn = 段 2 帧第一参（累计）")
  assert.equal(entry.maxTurns, 101, "entry.maxTurns = 段 2 帧第二参（累计预算）")
  const tail = notifications.at(-1)
  assert.deepEqual(
    { id: tail?.id, role: tail?.role, status: tail?.status, turn: tail?.turn, maxTurns: tail?.maxTurns },
    { id: 7, role: "explore", status: "done", turn: 2, maxTurns: 101 },
    "终态通知 {turn: 2, maxTurns: 101}（webview 冻结头数据源）",
  )
  assert.match(out, /^Subagent \(explore\) completed/, "正常完成报告")
})

// ─── T11：escalate 种子锚（错误——唯一驻留锁）──────────────────────────────

test("T11 种子锚（错误）：escalate-async 续跑支种子传参驻留（该路径无行为覆盖——最小锁）", () => {
  // 裁段注（扫①）：agent.mjs 种子落点与 runChild 种子支已被 T9/T10 行为覆盖（真 runAgent 段间帧
  // + 真 runChild opts 断言）——重复项删；escalate-async 续跑支全仓无行为覆盖，驻留最小锚。
  assert.equal((escalateAsyncSrc.match(/_turnSeqBase: turnBase/g) ?? []).length, 1, "escalate-async 续跑支种子传参 1 命中（fail-when-unchanged）")
  assert.ok(escalateAsyncSrc.includes("let turnBase = 0"), "段前累计循环外声明（escalate-async）")
})
