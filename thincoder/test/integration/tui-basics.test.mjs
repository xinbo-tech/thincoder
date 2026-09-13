/**
 * tui-basics.test.mjs — 集成场景 ⑤（TESTING.md §5.5——TUI / 面板基本盘）。
 *
 * 业务语义：用户敲字、回车发送、审批弹窗里按键、最后干净退出——四条用户可感知的
 * 交互路径都要真的走通（不是 mock 掉交互层）。
 * 驱动 = 真 state + 真 key-handler + 真 interaction + 真 render-loop + 真 exit cleanup；
 * runAgent 缝按既有注入点替换为记录器（TUI 只负责交接，agent 循环由场景 ① 覆盖）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { createKeyHandler } from "../../src/tui/key-handler.mjs"
import { createRenderLoop } from "../../src/tui/render-loop.mjs"
import { createInteraction } from "../../src/tui/interaction.mjs"
import { createExitCleanup, setTuiActive, isTuiActive } from "../../src/tui/tui-lifecycle.mjs"
import { runAgentTurn } from "../../src/tui/agent-turn.mjs"

const DIMS = { cols: 100, rows: 40 }

/** 真 TUI state 形态（键处理 / 渲染 / 回合驱动共同消费的字段集）+ 帧写入记录。 */
function mkTui() {
  const writes = []
  const state = {
    input: [], cursor: 0, history: [], historyIndex: -1, queue: [], pendingInput: [],
    tasks: [], lines: [], scroll: 0, subTasks: {},
    search: null, interruptPrompt: null, question: null, picker: null, permission: null, wizard: null,
    status: "Ready", tokens: { prompt: 0, completion: 0, cacheHit: 0, cacheMiss: 0, reasoningTokens: 0 },
    ctxCache: { len: 0, tokens: 0 }, processing: false, currentTool: null, processingStarted: 0,
    streaming: "", reasoning: "", _followTail: true, _pauseAnchorLen: null, _hasOlder: false,
    expandedBlocks: new Set(), dims: { get: () => DIMS },
    suspended: false, _suspPending: false, attentionAwaiting: false, exitArmed: false,
  }
  const agent = {
    history: [], provider: { name: "mock", model: "mock-model" }, cwd: process.cwd(), title: "scene",
    tasks: [], _currentTurn: 0, _maxTurns: 0, config: { agent: {} },
  }
  const pushLine = (text) => state.lines.push({ kind: "line", text: String(text) })
  const pushLabel = (text) => state.lines.push({ kind: "label", text: String(text) })
  const render = createRenderLoop(state, agent, { startupDims: DIMS, SLASH_COMMANDS: [], pendingNoticeReady: () => false }, pushLine, (s) => writes.push(s)).render
  return { state, agent, writes, render, pushLine, pushLabel }
}

const tick = (ms) => new Promise((r) => setTimeout(r, ms))

test("⑤ 正常：输入 → Enter 提交 —— 文本送达 agent 循环、渲染面出帧", async (t) => {
  const { state, agent, writes, render, pushLine, pushLabel } = mkTui()
  setTuiActive(true)
  t.after(() => setTuiActive(false))

  const delivered = []
  const turnCtx = {
    agent, state, render, pushLine, pushLabel,
    scheduleRender: render, ensureAssistantLabel: () => {},
    askPermission: async () => true, askBatchPermission: async () => "approveAll", askQuestion: async () => "x",
    handleSlash: async () => {}, saveSession: () => {}, distillFlushTimeoutMs: 10,
    runAgent: async (_agent, input) => { delivered.push(input); return "ok" },
    exitTimer: null, exitArmTimer: null,
  }
  const onKeypress = createKeyHandler({
    ...turnCtx,
    popPicker: () => {}, renderPickerLines: () => {}, handleTab: () => {}, cleanup: () => {},
    showPicker: () => {}, submit: () => runAgentTurn(turnCtx, state.input.join("").trim()),
  })

  for (const ch of "hello there") onKeypress(ch, { name: ch })
  assert.equal(state.input.join(""), "hello there", "输入进入编辑框（真输入面）")
  onKeypress("\r", { name: "return" })
  const t0 = Date.now()
  while (delivered.length === 0 && Date.now() - t0 < 3_000) await tick(10)

  assert.deepEqual(delivered, ["hello there"], "Enter 提交 → 文本原样送达 agent 循环（交接文本）")
  await tick(80)
  assert.ok(writes.length > 0, "渲染面出帧（帧断言）")
  assert.equal(state.processing, false, "回合收尾——processing 复位")
})

test("⑤ 边界：审批 / 提问面 —— 面板响应把回调结果正确交回", async (t) => {
  const { state, agent, render, pushLine, pushLabel } = mkTui()
  const interaction = createInteraction({ agent, state, pushLine, pushLabel, render, summarize: (a) => JSON.stringify(a ?? {}).slice(0, 60) })
  const onKeypress = createKeyHandler({
    agent, state, render, pushLine, pushLabel, popPicker: () => {}, renderPickerLines: () => {},
    handleTab: () => {}, cleanup: () => {}, showPicker: () => {}, submit: async () => {},
  })

  // 写文件审批：面板列出待批准内容 → 按 y 批准 → 回调收到 true
  const pending = interaction.askPermission("write", { path: "lib/feature.mjs", content: "export const x = 1\n" })
  assert.ok(state.permission, "审批请求进入面板态")
  assert.ok(state.permissionPreview.join("\n").includes("lib/feature.mjs"), "面板展示待批准的文件路径")
  onKeypress("y", { name: "y" })
  assert.equal(await pending, true, "按 y → 批准放行（回调结果交回）")
  assert.equal(state.permission, null, "审批态关闭")

  // 提问面：选项列表 → ↓ 选中第二项 → Enter 确认
  const answer = interaction.askQuestion("which approach?", ["A", "B", "C"])
  assert.ok(state.question, "提问进入面板态")
  onKeypress("", { name: "down" })
  onKeypress("\r", { name: "return" })
  assert.equal(await answer, "B", "面板选择结果交回（↓ + Enter = 第二项）")
  assert.equal(state.question, null, "提问态关闭")
})

test("⑤ 错误：退出键 → 清理 —— 真清理序、活动态清除、退出后零帧", async (t) => {
  const { state, agent, writes, render, pushLine, pushLabel } = mkTui()
  setTuiActive(true)
  t.after(() => setTuiActive(false))

  const calls = []
  const cleanup = createExitCleanup({
    agent,
    saveSession: () => calls.push("save"),
    closeAllMcp: () => calls.push("mcp"),
    stdin: { setRawMode: (v) => calls.push(`raw:${v}`), removeAllListeners: (ev) => calls.push(`rm:${ev}`), pause: () => calls.push("pause") },
    write: () => calls.push("write"),
  })
  const ctx = {
    agent, state, render, pushLine, pushLabel, popPicker: () => {}, renderPickerLines: () => {},
    handleTab: () => {}, cleanup, showPicker: () => {}, submit: async () => {},
    exitArmDelay: 30_000, exitDelay: 60_000,
  }
  const onKeypress = createKeyHandler(ctx)

  onKeypress("", { ctrl: true, name: "c" })
  assert.equal(calls.length, 0, "首按只武装不清理（防误触——双确认）")
  assert.ok(state.lines.some((l) => String(l.text).includes("Press Ctrl+C again")), "首发提示可见")

  onKeypress("", { ctrl: true, name: "c" })
  assert.equal(calls[0], "save", "清理先保存会话（真 createExitCleanup 序）")
  assert.equal(calls[1], "mcp", "再关 MCP 子进程（无孤儿）")
  assert.ok(calls.indexOf("write") < calls.indexOf("raw:false"), "终端恢复序列先于 raw off")
  assert.ok(calls.indexOf("raw:false") < calls.indexOf("rm:data"), "raw off 先于 stdin 排空")
  assert.ok(calls.indexOf("rm:data") < calls.indexOf("pause"), "排空序：摘监听先于 pause")
  assert.equal(isTuiActive(), false, "清理完成清 TUI 活动态")

  const before = writes.length
  render()
  await tick(80)
  assert.equal(writes.length, before, "退出后零帧（主屏不再被重绘）")
  clearTimeout(ctx.exitTimer)
})
