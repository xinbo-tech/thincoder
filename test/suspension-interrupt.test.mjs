/**
 * suspension-interrupt.test.mjs — tests extracted per AGENT-LOOP.md §18.14 (test files split by domain).
 * Source(s): suspension.test.mjs.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { LONG_REPORT } from "./helpers/long-report.mjs"
import { waitFor } from "./helpers/wait-for.mjs"


function trackedCtx(overrides) {
  const ctx = driverCtx(overrides)
  cleanups.push(ctx.agent.cwd)
  return ctx
}
function fakeEntry(agent, id, role = "coder") {
  agent._asyncSubagents ??= new Map()
  agent._asyncQueue ??= []
  let _settle
  const entry = {
    id: String(id), role, relayPrefix: `${role}#${id}/`,
    status: "running", report: null, error: null, done: false,
    promise: new Promise((res) => { _settle = res }),
    _settle: () => _settle(),
  }
  agent._asyncSubagents.set(String(id), entry)
  return entry
}
function mockSettle(agent, entry, report = `report-${entry.id}`) {
  entry.report = report
  entry.status = "done"
  entry.done = true
  for (const w of (agent._asyncWaiters ?? []).splice(0)) { try { w() } catch { /* noop */ } }
  entry._settle()
}
function driverCtx(overrides = {}) {
  const agent = {
    cwd: mkdtempSync(join(tmpdir(), "thincoder-susp-")),
    provider: { model: "test-model" },
    history: [],
    config: {},
    tasks: [],
    tools: [],
    title: "test",
  }
  const state = {
    lines: [], streaming: "", reasoning: "",
    subTasks: {}, tasks: [], queue: [], pendingInput: [],
    processing: false, controller: null, interruptPrompt: null,
    permission: null, currentTool: null, processingStarted: 0,
    status: "Ready", suspended: false,
    tokens: { prompt: 0, completion: 0, cacheHit: 0, cacheMiss: 0, reasoningTokens: 0 },
  }
  const calls = { runAgent: [], slash: [], saved: 0, suspendedDuringUser: null }
  const ctx = {
    agent, state, calls,
    pushLine: (text, color, kind) => state.lines.push({ text, color, _kind: kind }),
    pushLabel: (text) => state.lines.push({ kind: "label", text }),
    render: () => {},
    scheduleRender: () => {},
    ensureAssistantLabel: () => {},
    askPermission: async () => true,
    askBatchPermission: async () => "approveAll",
    askQuestion: async () => "",
    handleSlash: async (text) => { calls.slash.push(text) },
    summarize: () => "",
    // 默认 mock：记录调用（含当时 _suspended）+ 模拟 runAgent 首行的 D-S3 pending
    // 注入消费（消化轮开跑即把 pending 注入历史——真实实现 splice 后 pushReal reminder）
    runAgent: async (_agent, text, _cbs, opts) => {
      const rec = { text, autoTurn: opts?.autoTurn ?? false, suspended: agent._suspended }
      calls.runAgent.push(rec)
      const pend = agent._pendingAsyncResults
      if (pend?.length) {
        for (const e of pend.splice(0)) {
          agent.history.push({ role: "user", content: `[System reminder: async subagent #${e.id} finished]\n${e.report ?? e.error ?? ""}` })
        }
      }
      return "ok"
    },
    saveSession: () => { calls.saved++ },
    ...overrides,
  }
  return ctx
}
const cleanups = []



test("round2 偏差#4 TUI：挂起态 Ctrl+C = 武装窗口两级中止——纯等待期首次仅提示武装，再次按下才中止 abort 集合全部 controller（round1 #3 children 不逃逸语义随两次制保留）", async () => {
  const { createKeyHandler } = await import("../src/tui/key-handler.mjs")
  const noop = () => {}
  const c1 = new AbortController() // Ctrl+I 重建前的旧 controller（会话期仍 live）
  const c2 = new AbortController() // 会话 controller（_sessionAbort）
  const agent = { autoApprove: false, _sessionAbort: c2, _sessionAbortAll: [c1, c2] }
  const state = {
    input: [], cursor: 0, history: [], historyIndex: -1, _draft: null,
    processing: false, controller: null, interruptPrompt: null,
    permission: null, question: null, picker: null, wizard: null,
    search: null, queue: [], pendingInput: [],
    suspended: true, exitArmed: false, status: "后台 1 子代理运行中", lines: [],
    _suspAborted: false, suspAbortArmed: false,
  }
  let woke = 0
  state._suspWake = () => { woke++ }
  const ctx = {
    agent, state, render: noop, popPicker: () => false, renderPickerLines: noop,
    handleSlash: noop, handleTab: noop,
    submit: async () => {}, pasteClipboardImage: async () => {},
    wizardChooseProvider: noop, wizardSubmitText: noop, cancelWizard: noop,
    wizardProviderItems: () => [], renderWizard: noop,
    pushLine: noop, cleanup: noop, showPicker: noop, loadOlder: noop,
  }
  const handler = createKeyHandler(ctx)
  try {
    handler("\x03", { ctrl: true, name: "c" })
    assert.equal(c1.signal.aborted, false, "首次按下不清池不中止（防误触——round2 偏差 #4）")
    assert.equal(c2.signal.aborted, false, "首次按下不中止会话 controller")
    assert.equal(state._suspAborted, false, "首次按下不标记中止")
    assert.equal(state.suspAbortArmed, true, "首次按下武装（3s 窗口，仿空闲态退出）")
    handler("\x03", { ctrl: true, name: "c" })
    assert.equal(c1.signal.aborted, true, "窗口内再次按下：旧 controller（重建前 spawn 的 children 持其 signal）同被中止")
    assert.equal(c2.signal.aborted, true, "会话 controller 中止")
    assert.equal(state._suspAborted, true, "标记中止（driver 收尾清池）")
    assert.equal(state.suspAbortArmed, false, "中止后解除武装")
    assert.equal(woke, 1, "唤醒挂起会话 driver")
  } finally {
    clearTimeout(ctx.suspArmTimer)
  }
})



test("round2 偏差#4 TUI：digest 处理中首次 Ctrl+C 仅中止当前回合（后台 controller 不中止），再次按下才彻底中止", async () => {
  const { createKeyHandler } = await import("../src/tui/key-handler.mjs")
  const noop = () => {}
  const c1 = new AbortController() // 会话 controller（_sessionAbort——后台子代理共享）
  const cur = new AbortController() // digest 当前回合 controller
  const agent = { autoApprove: false, _sessionAbort: c1, _sessionAbortAll: [c1] }
  const lines = []
  const state = {
    input: [], cursor: 0, history: [], historyIndex: -1, _draft: null,
    processing: true, controller: cur, interruptPrompt: null,
    permission: null, question: null, picker: null, wizard: null,
    search: null, queue: [], pendingInput: [],
    suspended: true, exitArmed: false, status: "后台 1 子代理运行中", lines,
    _suspAborted: false, suspAbortArmed: false,
  }
  let woke = 0
  state._suspWake = () => { woke++ }
  const ctx = {
    agent, state, render: noop, popPicker: () => false, renderPickerLines: noop,
    handleSlash: noop, handleTab: noop,
    submit: async () => {}, pasteClipboardImage: async () => {},
    wizardChooseProvider: noop, wizardSubmitText: noop, cancelWizard: noop,
    wizardProviderItems: () => [], renderWizard: noop,
    pushLine: (t) => lines.push(t), cleanup: noop, showPicker: noop, loadOlder: noop,
  }
  const handler = createKeyHandler(ctx)
  try {
    handler("\x03", { ctrl: true, name: "c" })
    assert.equal(cur.signal.aborted, true, "首次按下仅中止当前 digest/回合（刷屏误触场景）")
    assert.equal(c1.signal.aborted, false, "会话 controller 不受影响——后台子代理继续跑（不清池）")
    assert.equal(state._suspAborted, false, "不清池——会话仍在")
    assert.equal(state.suspAbortArmed, true, "武装（再次按下 = 彻底中止全部后台）")
    assert.ok(lines.some((l) => String(l).includes("again")), "提示再次按下语义（不静默）")
    handler("\x03", { ctrl: true, name: "c" })
    assert.equal(c1.signal.aborted, true, "再次按下（武装窗口内）：彻底中止——会话 controller 中止")
    assert.equal(state._suspAborted, true, "标记中止（driver 收尾清池）")
    assert.equal(woke, 1, "唤醒 driver")
  } finally {
    clearTimeout(ctx.suspArmTimer)
  }
})


// ═══════════════════════════════════════════════════════════════════════════
// §17.6 Ctrl+C processing 态武装化（AGENT-LOOP.md §17.6——2026-09-03 紧急修复）：
//   T-C1 / T-C2 / T-C3 / T-C5 handler 级 + T-C4/T-C5b 驱动级（映射见文件头）
// ═══════════════════════════════════════════════════════════════════════════

/** §17.6 Ctrl+C 用例 ctx：真实 AbortController + abort 参数捕获 + 池 fake 条目。 */
function ctrlCHandlerCtx(overrides = {}) {
  const ctrl = new AbortController()
  const abortCalls = []
  const origAbort = ctrl.abort.bind(ctrl)
  ctrl.abort = (reason) => { abortCalls.push(reason); return origAbort(reason) }
  const agent = {
    autoApprove: false,
    _asyncSubagents: new Map([["1", { id: "1", role: "coder", relayPrefix: "coder#1/", status: "running", report: null, error: null, done: false }]]),
    _asyncQueue: [],
    _sessionAbort: null, _sessionAbortAll: null,
  }
  const lines = []
  const state = {
    input: [], cursor: 0, history: [], historyIndex: -1, _draft: null,
    processing: true, controller: ctrl, interruptPrompt: null,
    permission: null, question: null, picker: null, wizard: null,
    search: null, queue: [], pendingInput: [],
    suspended: false, exitArmed: false, status: "Processing...", lines,
    _suspAborted: false, suspAbortArmed: false,
  }
  let woke = 0
  state._suspWake = () => { woke++ }
  const noop = () => {}
  const ctx = {
    agent, state, render: noop, popPicker: () => false, renderPickerLines: noop,
    handleSlash: noop, handleTab: noop,
    submit: async () => {}, pasteClipboardImage: async () => {},
    wizardChooseProvider: noop, wizardSubmitText: noop, cancelWizard: noop,
    wizardProviderItems: () => [], renderWizard: noop,
    pushLine: (t) => lines.push(t), cleanup: noop, showPicker: noop, loadOlder: noop,
    ...overrides,
  }
  return { ctx, ctrl, abortCalls, state, agent, lines, getWoke: () => woke }
}


test("T-C1 §17.6 processing 态首按（非挂起）：interrupt 无 message——停回合不清池（后台保留）+ 武装 3s（2026-09-03 紧急修复——修复前一次 Ctrl+C 即平 abort 清池误杀全部后台子代理）", async () => {
  const { createKeyHandler } = await import("../src/tui/key-handler.mjs")
  const { ctx, ctrl, abortCalls, state, agent, lines, getWoke } = ctrlCHandlerCtx()
  const handler = createKeyHandler(ctx)
  try {
    handler("\x03", { ctrl: true, name: "c" })
    assert.equal(abortCalls.length, 1, "首按一次 abort")
    assert.deepEqual(abortCalls[0], { interrupt: true }, "T-C1: interrupt 语义 + 无 message（agent.mjs 回合收尾的 !interrupt 清池分支被排除）")
    assert.equal(ctrl.signal.aborted, true, "当前回合 controller 已中止（回合停）")
    assert.equal(agent._asyncSubagents.size, 1, "T-C1: 池保留——后台子代理条目未被清（核心验收 AC-C1）")
    assert.equal(state.suspAbortArmed, true, "武装 3s（窗口内再按 = 全停）")
    assert.equal(state._suspAborted, false, "不清池——非全停标记")
    assert.equal(getWoke(), 0, "无 driver 唤醒（非挂起语境）")
    assert.ok(lines.some((l) => String(l).includes("stopped current turn") && String(l).includes("again")), "D-C3: 提示含再按语义（对齐挂起态文案）")
  } finally {
    clearTimeout(ctx.suspArmTimer)
  }
})



test("T-C2 §17.6 3s 内二按（非挂起 processing）= 显式全停（D-C4 /abort 语义锁定）：平 abort（无 interrupt——走 agent.mjs 清池分支）+ 解除武装 + 不粘滞", async () => {
  const { createKeyHandler } = await import("../src/tui/key-handler.mjs")
  const { ctx, abortCalls, state, lines } = ctrlCHandlerCtx()
  const handler = createKeyHandler(ctx)
  try {
    handler("\x03", { ctrl: true, name: "c" })
    handler("\x03", { ctrl: true, name: "c" })
    assert.equal(abortCalls.length, 2)
    assert.deepEqual(abortCalls[0], { interrupt: true }, "首按 interrupt")
    assert.equal(abortCalls[1], undefined, "T-C2: 二按平 abort（无 interrupt——agent.mjs 清池分支——全停——D-C4 /abort 显式全停语义）")
    assert.equal(state.suspAbortArmed, false, "全停后解除武装")
    assert.equal(state._suspAborted, false, "非挂起语境不置 _suspAborted（防粘滞阻塞未来挂起会话重入——round2 偏差 #1 语义）")
    assert.ok(lines.some((l) => String(l).includes("Aborting background subagents")), "全停提示")
  } finally {
    clearTimeout(ctx.suspArmTimer)
  }
})



test("T-C3 §17.6 武装过期复位：首按 3s 后过期——再按 = 首按语义（interrupt 无 message——不清池——重新武装）", async () => {
  const { createKeyHandler } = await import("../src/tui/key-handler.mjs")
  const { ctx, abortCalls, state, agent } = ctrlCHandlerCtx()
  ctx.exitArmDelay = 50 // 缩短武装窗口：测试不空等 3s（同 exitArmDelay 语义——过期自动复位）
  const handler = createKeyHandler(ctx)
  try {
    handler("\x03", { ctrl: true, name: "c" })
    assert.equal(state.suspAbortArmed, true, "首按武装")
    await waitFor(() => state.suspAbortArmed === false)
    handler("\x03", { ctrl: true, name: "c" })
    assert.equal(abortCalls.length, 2)
    assert.deepEqual(abortCalls[1], { interrupt: true }, "T-C3: 过期后再按 = 首按语义（interrupt 无 message——不清池）——非全停")
    assert.equal(agent._asyncSubagents.size, 1, "池仍保留")
    assert.equal(state.suspAbortArmed, true, "重新武装")
  } finally {
    clearTimeout(ctx.suspArmTimer)
  }
})



test("T-C4 §17.6 agent-turn 区分机制（round1 #1）：interrupt 有 message（Ctrl+I）= 重建续跑；无 message（Ctrl+C 首按）= 停回合不续跑 + [User interrupt: undefined] 垃圾回滚", async () => {
  const { runAgentTurn } = await import("../src/tui/agent-turn.mjs")
  // 场景 1：有 message → 续跑（新 controller 未中止——第二轮正常完成——既有 Ctrl+I 回归）
  const ctx1 = trackedCtx()
  let n1 = 0
  const sigs = []
  ctx1.runAgent = async (_agent, text, _cbs, opts) => {
    n1++
    sigs.push(opts.signal)
    if (n1 === 1) {
      ctx1.state.controller.abort({ interrupt: true, message: "插话" }) // 模拟 key-handler Ctrl+I 提交
      throw Object.assign(new Error("User interrupted"), { name: "AbortError" })
    }
    return "ok"
  }
  await runAgentTurn(ctx1, "消息1")
  assert.equal(n1, 2, "T-C4: 有 message interrupt → 重建续跑（Ctrl+I 路径零回归）")
  assert.equal(sigs[1].aborted, false, "T-C4: 续跑在新 controller（未中止）")
  // 场景 2：无 message → 停回合不续跑 + 垃圾回滚（partial 部分输出保留——interrupt
  // 家族语义：§2 Ctrl+I 同款"提交部分输出"，无 message 停回合沿用——advisor round1
  // 🟡 裁定记录：回滚 partial 需区分工具/子代理路径的既有完整消息（不可靠）——不做）
  const ctx2 = trackedCtx()
  let n2 = 0
  ctx2.runAgent = async (_agent, text, _cbs, opts) => {
    n2++
    ctx2.calls.runAgent.push({ text, autoTurn: opts?.autoTurn ?? false })
    if (n2 === 1) {
      // 模拟 agent.mjs 中断副作用：response.interrupted 路径——先 pushReal 部分输出
      // （L328-330），再无条件注入 "[User interrupt: undefined]"（L331-334——无守卫）
      _agent.history.push({ role: "assistant", content: "部分输出（生成中断处截断）" })
      _agent.history.push({ role: "user", content: "[User interrupt: undefined]" })
      ctx2.state.controller.abort({ interrupt: true }) // 模拟 key-handler Ctrl+C 首按（无 message）
      throw Object.assign(new Error("User interrupted"), { name: "AbortError" })
    }
    return "ok"
  }
  await runAgentTurn(ctx2, "消息2")
  assert.equal(n2, 1, "T-C4: 无 message interrupt → 停回合不续跑")
  assert.equal(ctx2.state.controller, null, "回合已收尾（controller 释放）")
  assert.deepEqual(ctx2.agent.history.map((m) => [m.role, m.content]),
    [["assistant", "部分输出（生成中断处截断）"]],
    "T-C4: [User interrupt: undefined] 垃圾已回滚；partial 部分输出保留（interrupt 家族语义——D-C2 agent.mjs 零改动下的回合层回滚只清垃圾）")
  assert.equal(ctx2.state.processing, false, "回 idle——无挂起会话（池空）")
})



test("T-C2b §17.6 无后台池的普通回合：首按停回合后二按不吞键——落回空闲退出双确认（无误导性全停提示——advisor round1 🟡 处置）", async () => {
  const { createKeyHandler } = await import("../src/tui/key-handler.mjs")
  const { ctx, abortCalls, state, agent, lines } = ctrlCHandlerCtx()
  agent._asyncSubagents.clear() // 无后台池
  const handler = createKeyHandler(ctx)
  try {
    handler("\x03", { ctrl: true, name: "c" })
    assert.deepEqual(abortCalls[0], { interrupt: true }, "首按停回合（interrupt 无 message）")
    assert.equal(state.suspAbortArmed, true, "首按武装")
    // 回合已停（driver 侧 unwind——processing/controller 释放）
    state.processing = false
    state.controller = null
    handler("\x03", { ctrl: true, name: "c" })
    assert.equal(state.suspAbortArmed, false, "二按解除武装")
    assert.equal(state.exitArmed, true, "T-C2b: 无目标可停 → 落回空闲退出双确认（不吞键——退出仍 3 按：停/arm-exit/exit）")
    assert.equal(abortCalls.length, 1, "无第二次 abort（无全停动作）")
    assert.ok(!lines.some((l) => String(l).includes("Aborting background subagents")), "无误导性全停提示（无后台却提示中止后台）")
    assert.ok(lines.some((l) => String(l).includes("within 3s to exit")), "落回空闲退出提示")
  } finally {
    clearTimeout(ctx.suspArmTimer)
  }
})



test("T-C2c §17.6 advisor round2 🟡 处置：回合启动解除空闲退出武装（exitArmed 不跨回合残留——陈旧武装会让落空穿透后的下一次按下无确认即时退出）", async () => {
  const { runAgentTurn } = await import("../src/tui/agent-turn.mjs")
  const ctx = trackedCtx()
  ctx.state.exitArmed = true // 模拟空闲态一次 Ctrl+C 后残留的武装
  ctx.state.status = "Ready"
  let timerFired = 0
  ctx.exitArmTimer = setTimeout(() => { timerFired++; ctx.state.exitArmed = false }, 50)
  await runAgentTurn(ctx, "消息")
  assert.equal(ctx.calls.runAgent.length, 1, "回合正常执行")
  assert.equal(ctx.state.exitArmed, false, "T-C2c: 回合启动即解除 exitArmed（不跨回合残留）")
  assert.equal(ctx.exitArmTimer, null, "T-C2c: 陈旧武装计时一并清除（不残留）")
  await new Promise((r) => setTimeout(r, 80))
  assert.equal(timerFired, 0, "T-C2c: 陈旧 timer 已被 clearTimeout——不触发")
  assert.equal(ctx.state.exitArmed, false, "状态不再被陈旧 timer 改写")
})



test("T-C5 §17.6 挂起态首按 = interrupt 无 message（digest/会话内回合停——会话与后台保留）+ 双确认零回归（偏差#4 语义）", async () => {
  const { createKeyHandler } = await import("../src/tui/key-handler.mjs")
  const session = new AbortController() // _sessionAbort（后台子代理共享）
  const { ctx, ctrl: cur, abortCalls, state, lines, getWoke } = ctrlCHandlerCtx()
  ctx.agent._sessionAbort = session
  ctx.agent._sessionAbortAll = [session]
  state.suspended = true
  state.status = "后台 1 子代理运行中"
  const handler = createKeyHandler(ctx)
  try {
    handler("\x03", { ctrl: true, name: "c" })
    assert.equal(abortCalls.length, 1)
    assert.deepEqual(abortCalls[0], { interrupt: true }, "T-C5: 挂起态首按（digest/会话内回合）= interrupt 无 message——interrupt 排除 agent.mjs 回合收尾清池（平 abort 一次首按即误杀全部后台——2026-09-03 用户实证根因——提示'再按才杀'与实际'一次就全杀'不符）")
    assert.equal(cur.signal.aborted, true, "仅中止当前回合")
    assert.equal(session.signal.aborted, false, "会话 controller 不受影响——后台子代理继续跑（不清池）")
    assert.equal(ctx.agent._asyncSubagents.size, 1, "池保留")
    assert.equal(state.suspAbortArmed, true, "武装（再按 = 彻底中止——偏差#4 语义）")
    assert.equal(getWoke(), 0, "首按不唤醒 driver")
    assert.ok(lines.some((l) => String(l).includes("again")), "提示再次按下语义（不静默）")
    handler("\x03", { ctrl: true, name: "c" })
    assert.equal(abortCalls.length, 2)
    assert.equal(abortCalls[1], undefined, "二按平 abort（全停语义——偏差#4 零变化）")
    assert.equal(session.signal.aborted, true, "会话 controller 中止（彻底中止）")
    assert.equal(state._suspAborted, true, "标记中止（driver 收尾清池）")
    assert.equal(state.suspAbortArmed, false, "中止后解除武装")
    assert.equal(getWoke(), 1, "唤醒 driver")
  } finally {
    clearTimeout(ctx.suspArmTimer)
  }
})



test("T-C5b §17.6 E2E：会话内回合 Ctrl+C 首按（interrupt 无 message）→ 回合停——会话与后台子代理保留——随后 settle 照常消化（2026-09-03 用户实证场景——修复前挂起态首按平 abort 清池即杀光后台）", async () => {
  const { runAgentTurn } = await import("../src/tui/agent-turn.mjs")
  const ctx = trackedCtx()
  const A = fakeEntry(ctx.agent, 1) // 会话期后台子代理（长跑——session-bound）
  let callNo = 0
  ctx.runAgent = async (_agent, text, _cbs, opts) => {
    callNo++
    ctx.calls.runAgent.push({ text, autoTurn: opts?.autoTurn ?? false })
    if (opts?.autoTurn) {
      // 消化轮——runAgent 首行注入消费（D-S3 ②——同默认 mock）
      const pend = _agent._pendingAsyncResults
      if (pend?.length) {
        for (const e of pend.splice(0)) {
          _agent.history.push({ role: "user", content: `[System reminder: async subagent #${e.id} finished]\n${e.report ?? e.error ?? ""}` })
        }
      }
      return "ok"
    }
    if (callNo === 1) return "收尾" // 首回合（池 A 已 live → 回合尾进挂起会话）
    // 会话内用户回合：在途——等 Ctrl+C 首按（interrupt 无 message）中止
    return new Promise((resolve, reject) => {
      opts.signal.addEventListener("abort", () => {
        if (opts.signal.reason?.interrupt && !opts.signal.reason?.message) {
          // 模拟 agent.mjs 中断注入副作用（chat catch——无 message 成 undefined 垃圾）
          _agent.history.push({ role: "user", content: "[User interrupt: undefined]" })
        }
        reject(Object.assign(new Error("User interrupted"), { name: "AbortError" }))
      }, { once: true })
    })
  }
  const turnP = runAgentTurn(ctx, "首回合")
  await waitFor(() => ctx.state.suspended === true && typeof ctx.state._suspWake === "function")
  // 用户输入（模拟挂起态 Enter）→ 会话内新回合
  ctx.state.pendingInput.push("会话内消息")
  ctx.state._suspWake()
  await waitFor(() => ctx.state.processing === true)
  // 模拟 key-handler Ctrl+C 首按（§17.6 D-C1——interrupt 无 message——挂起态①）
  ctx.state.controller?.abort({ interrupt: true })
  await waitFor(() => ctx.state.processing === false)
  await new Promise((r) => setTimeout(r, 60)) // 回合停判定窗（无误续跑 / 无会话误退）
  assert.equal(ctx.calls.runAgent.length, 2, "会话内回合已停（无续跑第二轮）")
  assert.equal(ctx.state.suspended, true, "T-C5b: 会话保留——未误退（修复前平 abort 回合收尾清池 → 会话即死）")
  assert.equal(ctx.agent._asyncSubagents.size, 1, "T-C5b: 池保留——后台子代理未死（核心验收 AC-C1）")
  assert.ok(!ctx.agent.history.some((m) => String(m.content ?? "") === "[User interrupt: undefined]"), "垃圾上下文已回滚")
  // 后台 settle → 会话照常开消化轮 → 自然退出回 idle
  mockSettle(ctx.agent, A, LONG_REPORT("A 结果"))
  await turnP
  assert.ok(ctx.calls.runAgent.some((c) => c.autoTurn && c.text === ""), "T-C5b: 会话续活——settle 后照常消化")
  assert.ok(ctx.agent.history.some((m) => String(m.content ?? "").includes("async subagent #1 finished")), "消化注入不丢")
  assert.equal(ctx.state.suspended, false, "池空自然退出")
  assert.equal(ctx.state.status, "Ready")
})



