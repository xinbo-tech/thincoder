/**
 * tui-exit-cleanup.test.mjs — RESIZE-MOUSE-LEAK-FIX F-1/F-2 测试（2026-09-09——设计档
 * RESIZE-MOUSE-LEAK-FIX.md）。AC-1：cleanup 唯一权威序（① mouseOff → ② settle
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
import { createKeyHandler } from "../src/tui/key-handler.mjs"
import { _setSessionsDirForTest, _resetSessionsDirForTest, getSessionId, loadManifest, manifestPath, readEndMarker, claimSlot, writeEndMarker } from "@thincoder/core/session-slots.mjs"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

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
  const agent = { history: [], provider: null, cwd: process.cwd(), _currentTurn: 0, _maxTurns: 0 }
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

// ─── F-XR1 退出释放（EXIT-CLAIM-RELEASE 批 · SESSION.md §6.18——T4 CLI 退出分支 e2e）──────────

/** T4 盘面夹具：本进程认领 41 + marker 指 41（真核面驱动——释放序 / 失败容忍锚真实返回值）。
 *  cwd 域 = **chdir 后的 process.cwd()**（接线行硬编码 process.cwd()——盘面必须落在同域）。 */
function seedT4() {
  const sessionsDir = mkdtempSync(join(tmpdir(), "tc-tui-exit-"))
  _setSessionsDirForTest(sessionsDir)
  const cwd = process.cwd()
  writeFileSync(manifestPath(cwd), JSON.stringify({ version: 2, slots: { 41: { updatedAt: 1 } }, slotSessions: {}, sessionId: null }))
  claimSlot(cwd, 41)
  writeEndMarker(cwd, 41)
  return sessionsDir
}

function minimalState() {
  return {
    input: [], cursor: 0, processing: false, exitArmed: false, controller: null, currentTool: null,
    question: null, picker: null, permission: null, wizard: null, interruptPrompt: null, search: null,
    suspended: false, lines: [], scroll: 0, subTasks: {}, tasks: [], status: "Ready", dims: { get: () => ({ cols: 100, rows: 40 }) },
  }
}

function exitCtx(state) {
  return {
    agent: {}, state, render: () => {}, popPicker: () => {}, renderPickerLines: () => {},
    handleSlash: () => {}, handleTab: () => {}, submit: () => {}, pasteClipboardImage: () => {},
    wizardChooseProvider: () => {}, wizardSubmitText: () => {}, wizardProviderItems: () => {},
    cancelWizard: () => {}, renderWizard: () => {}, pushLine: () => {}, showPicker: () => {},
    cleanup: () => {}, // cleanup 序已归 AC-1 锁序测试——本组桩化
    exitDelay: 30000, // 注入大值：定时器不到时（测试完主动清——延迟退出形态保留）
  }
}

test("T4 CLI 退出 e2e：先释放后定时器注册 ∧ 桩收 exit(0) ∧ 失败容忍（核 false ⇒ 退出零阻）∧ 盘面已释放", async () => {
  // cwd 域（接线行硬编码 process.cwd()——设计钉死）：测试进程 chdir 进真实 temp 目录 =
  // 模拟「CLI 在该目录启动」（node --test 每文件独立子进程——chdir 不外溢他档）。
  const realCwd = process.cwd()
  const cwdDir = mkdtempSync(join(tmpdir(), "tc-tui-exit-cwd-"))
  process.chdir(cwdDir)
  const dir = seedT4()
  try {
    const CWD = process.cwd() // 夹具域（chdir 后）——接线行 process.cwd() 同域
    assert.equal(loadManifest(CWD).slotSessions[41], getSessionId(), "前置：本进程认领在（夹具自检）")

    // e2e：onKeypress 驱 Ctrl+C 两次（空闲双确认）→ 释放 → exitTimer。
    const ctx = exitCtx(minimalState())
    ctx.exitDelay = 30 // 小值：观测窗内装回真 setTimeout——到时即触发回调载荷（桩收 exit(0)）
    const onKeypress = createKeyHandler(ctx)
    const exitCalls = []
    const realExit = process.exit
    const realSetTimeout = globalThis.setTimeout
    let releaseDoneAtTimerRegistration = null
    process.exit = (code) => { exitCalls.push(code) } // 桩收 exit(0)
    try {
      onKeypress("c", { ctrl: true, name: "c" }) // 首按 = 武装（arm 分支自管的 setTimeout 不在补丁窗内）
      assert.equal(ctx.state.exitArmed, true, "首按武装（空闲双确认）")

      // 释放序观测缝：定时器注册那一刻读盘——释放必须已完成（同步先于注册——D-SE42）。
      // 包装只观测不拦截：真实定时器（exitDelay=30ms）在注册后照常起跑。
      globalThis.setTimeout = (fn, ms) => {
        releaseDoneAtTimerRegistration = loadManifest(CWD).slotSessions[41] === undefined
        const t = realSetTimeout(fn, ms)
        ctx.exitTimer = t
        return t
      }
      onKeypress("c", { ctrl: true, name: "c" }) // 二按 = 退出分支
      assert.equal(exitCalls.length, 0, "注册后未到时 ⇒ exit 尚未触发（延迟形态在）")
      await new Promise((r) => realSetTimeout(r, 120)) // 越过 30ms 到时窗——回调载荷必达
    } finally {
      globalThis.setTimeout = realSetTimeout
      process.exit = realExit
    }
    assert.equal(releaseDoneAtTimerRegistration, true, "先释放后定时器注册（注册时释放已落盘——D-SE42）")
    assert.equal(ctx.exitTimer != null, true, "exitTimer 已捕获")
    assert.deepEqual(exitCalls, [0], "桩收 exit(0)——定时器到时回调载荷（退出码 0 原样）")
    assert.equal(loadManifest(CWD).slotSessions[41], undefined, "盘面：本进程认领已释放（真核函数已跑）")
    assert.equal(readEndMarker(CWD)?.slot, 41, "盘面：marker 仍指 41（路标保留——F-XR2）")

    // 失败容忍（评审 #1 收正面——容忍面在核 D-SE41）：核返回 false（已无认领可释放）⇒
    // 退出分支照常走完、定时器恒注册（退出零阻）；接线层零防护 + 抛错形态不可自然发生
    // （核永不抛）——false 返回值本身已由核面早退组断言。exitDelay=30ms 到时载荷同上一段。
    const ctx2 = exitCtx(minimalState())
    ctx2.exitDelay = 30
    const onKeypress2 = createKeyHandler(ctx2)
    const exitCalls2 = []
    const realExit2 = process.exit
    process.exit = (code) => { exitCalls2.push(code) }
    try {
      onKeypress2("c", { ctrl: true, name: "c" })
      onKeypress2("c", { ctrl: true, name: "c" })
      await new Promise((r) => realSetTimeout(r, 120))
    } finally {
      process.exit = realExit2
    }
    assert.equal(ctx2.exitTimer != null, true, "失败容忍：定时器恒注册（退出零阻）")
    assert.deepEqual(exitCalls2, [0], "失败容忍：exit 仍到时载荷（exit(0)——退出零阻实证）")
  } finally {
    process.chdir(realCwd)
    rmSync(cwdDir, { recursive: true, force: true })
    _resetSessionsDirForTest()
    rmSync(dir, { recursive: true, force: true })
  }
})
