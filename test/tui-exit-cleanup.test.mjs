/**
 * tui-exit-cleanup.test.mjs — RESIZE-MOUSE-LEAK-FIX F-1/F-2 测试（2026-09-09——设计档
 * docs/design/RESIZE-MOUSE-LEAK-FIX.md）。AC-1：cleanup 唯一权威序（① mouseOff → ② settle
 * ~20ms → ③ raw off → ④ stdin 排空 → ⑤ 恢复屏幕 → ⑥ 清 TUI 活动态）——测试锁序。AC-2：
 * /exit 走 ctx.exit（不再直调 process.exit）+ 退出前无帧写入（渲染抑制——isTuiActive false
 * 后 render no-op——handleSlash 后无条件 render() 不重绘主屏）。
 * 确定性单元（无 io——cleanup 的 stdin/write 注入缝锁序；render-loop 用可真实出帧的假状态驱动）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { ansi } from "../src/tui/ansi.mjs"
import { setTuiActive, isTuiActive, createExitCleanup } from "../src/tui/tui-lifecycle.mjs"
import { handleExitCommand } from "../src/tui/cmd-exit.mjs"
import { createRenderLoop } from "../src/tui/render-loop.mjs"

const DIMS = { cols: 100, rows: 40 }

/** 可真实渲染一帧的最小 TUI state + agent（render-loop 假帧驱动面）。 */
function mkFrame() {
  const state = {
    input: [], cursor: 0, tasks: [], lines: [], scroll: 0, subTasks: {},
    search: null, interruptPrompt: null, question: null, picker: null, permission: null, wizard: null,
    status: "Ready", tokens: { prompt: 0, completion: 0, cacheHit: 0, cacheMiss: 0, reasoningTokens: 0 },
    ctxCache: { len: 0, tokens: 0 }, processing: false, currentTool: null, processingStarted: 0,
    streaming: "", reasoning: "", _followTail: true, _pauseAnchorLen: null, _hasOlder: false,
    expandedBlocks: new Set(), dims: { get: () => DIMS },
  }
  const agent = { history: [], provider: null, cwd: process.cwd(), _currentTurn: 0, _maxTurns: 0, _panelSnapshot: [] }
  return { state, agent }
}

/** 假 stdin（调用序记录——setRawMode/removeAllListeners/pause 面）。 */
function fakeStdin(calls) {
  return {
    setRawMode: (v) => calls.push(`raw:${v}`),
    removeAllListeners: (ev) => calls.push(`rm:${ev}`),
    pause: () => calls.push("pause"),
  }
}

test("AC-1 cleanup 唯一权威序：mouseOff → settle → raw off → 摘监听+pause → 余部 → 清活动态（锁序）", () => {
  const calls = []
  const out = []
  setTuiActive(true)
  const cleanup = createExitCleanup({
    agent: {}, saveSession: () => calls.push("save"), closeAllMcp: () => {},
    stdin: fakeStdin(calls),
    write: (s) => { out.push(s); calls.push("write") },
  })
  const t0 = performance.now()
  cleanup()
  const settleMs = performance.now() - t0
  assert.equal(calls[0], "save", "saveSession 先行（原序保留）")
  assert.ok(calls.indexOf("write") < calls.indexOf("raw:false"), "① mouseOff 写先于 ③ raw off")
  assert.ok(calls.indexOf("raw:false") < calls.indexOf("rm:data"), "③ raw off 先于摘监听")
  assert.ok(calls.indexOf("rm:data") < calls.indexOf("pause"), "摘监听先于 pause（排空序）")
  assert.ok(calls.indexOf("pause") < calls.lastIndexOf("write"), "④ 排空后 ⑤ 恢复屏幕")
  assert.ok(settleMs >= 18, `② settle 同步等待存在（实测 ${settleMs.toFixed(1)}ms ≈ 20ms）`)
  assert.equal(out.length, 2, "序列写两次：mouseOff 单独 + 余部一次")
  assert.equal(out[0], ansi.mouseOff, "① 只写 mouseOff（DECRST——不整包 writeCleanupSequence）")
  assert.equal(out[1], ansi.clearScreen + ansi.bracketedPasteOff + ansi.keyboardPop + ansi.modifyOtherKeysOff + ansi.mainBuffer + ansi.showCursor + ansi.reset + ansi.wrapOn, "⑤ = writeCleanupSequence 余部（不含 mouseOff）")
  assert.equal(isTuiActive(), false, "⑥ 清理完成清活动态")
  const n = calls.length
  cleanup()
  assert.equal(calls.length, n, "幂等（cleanedUp 守卫——延迟 exit 的 exit 事件再触发不重跑）")
})

test("AC-2 /exit 走 ctx.exit；cleanup 后 render 抑制（退出前无帧写入）", async () => {
  // /exit → ctx.exit（mock 断言——不再 process.exit 直调零提前量）
  let exitCalls = 0
  await handleExitCommand({ exit: () => { exitCalls++ } })
  assert.equal(exitCalls, 1, "/exit 命令走 ctx.exit")

  // 渲染抑制：tuiActive 期帧正常写（前置）→ cleanup（清活动态）→ render() 零帧写
  const { state, agent } = mkFrame()
  const writes = []
  setTuiActive(true)
  const { render } = createRenderLoop(state, agent,
    { startupDims: DIMS, SLASH_COMMANDS: [], pendingNoticeReady: () => false },
    () => {}, (s) => writes.push(s))
  render()
  await new Promise((r) => setTimeout(r, 100))
  assert.ok(writes.length > 0, "前置条件：tuiActive 期帧正常写入")
  const cleanup = createExitCleanup({
    agent, saveSession: () => {}, closeAllMcp: () => {},
    stdin: { setRawMode() {}, removeAllListeners() {}, pause() {} },
    write: () => {},
  })
  cleanup()
  assert.equal(isTuiActive(), false, "cleanup 清活动态（渲染抑制锚）")
  const before = writes.length
  render()
  await new Promise((r) => setTimeout(r, 100))
  assert.equal(writes.length, before, "isTuiActive false 后 render no-op——退出前无帧写入（handleSlash 后无条件 render() 不重绘主屏）")
  setTuiActive(false)
})
