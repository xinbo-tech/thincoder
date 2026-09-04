/**
 * tui-picker.test.mjs — tests extracted per AGENT-LOOP.md §18.14 (test files split by domain).
 * Source(s): tui.test.mjs.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { stringWidth, wrapText } from "../src/tui/render.mjs"
import { computeLayout } from "../src/tui/layout.mjs"
import { createKeyHandler } from "../src/tui/key-handler.mjs"
import { C } from "../src/tui/ansi.mjs"
import { renderFrame, renderPicker, renderStatus } from "../src/tui/render-frame.mjs"

function tuiState(overrides = {}) {
  return {
    lines: [], streaming: "", input: [], cursor: 0,
    history: [], historyIndex: -1, _draft: null, scroll: 0,
    processing: false, controller: null,
    permission: null, permissionPreview: [], question: null,
    picker: null, wizard: null, tasks: [],
    tokens: { prompt: 0, completion: 0, cacheHit: 0, cacheMiss: 0, reasoningTokens: 0 },
    ctxCache: { len: -1, tokens: 0 }, reasoning: "",
    _advisorBlocks: [], // matches index.mjs baseline (advisor ordered blocks)
    toolStreams: {}, subTasks: {}, outputPanels: {},
    currentTool: null, processingStarted: 0, status: "Ready", queue: [],
    ...overrides,
  }
}
function tuiAgent(overrides = {}) {
  return {
    provider: { model: "deepseek-chat", apiKey: "sk-test", baseURL: "https://test" },
    cwd: "/home/test/project",
    autoApprove: false, planMode: false,
    config: { agent: { compactThreshold: 100_000 } },
    tasks: [],
    ...overrides,
  }
}
function keyCtx(state, agent = null) {
  return {
    agent: agent || tuiAgent(), state,
    render: noop, popPicker: () => false, renderPickerLines: noop,
    handleSlash: noop, handleTab: noop,
    submit: async () => {}, pasteClipboardImage: async () => {},
    wizardChooseProvider: noop, wizardSubmitText: noop, cancelWizard: noop,
    wizardProviderItems: () => [], renderWizard: noop,
    pushLine: noop, cleanup: noop,
  }
}
function noop() {}


// ====================================================================
// picker 重构（Phase A/B/C）：renderFrame 回归 / key-handler picker 分支 / renderPicker / layout 约束
// ====================================================================

const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, "")

/** picker 状态工厂：20 个 item，lines 已构建（winH 依赖 lines.length） */
function pickerState(overrides = {}) {
  const items = Array.from({ length: 20 }, (_, i) => ({ type: "item", text: `item${i}` }))
  return {
    title: "Demo", entries: items,
    lines: items.map((it, _i) => ({ text: `   ${it.text}`, color: "" })),
    index: 0, scroll: 0, selectedLine: 0, filter: "", filteredItems: items,
    ...overrides,
  }
}


test("renderFrame: picker 打开时全量重绘返回 frame/cursorRow/cursorCol 且含 picker 标题（Phase A 回归）", () => {
  const state = tuiState({ picker: pickerState() })
  const { frame, cursorRow, cursorCol } = renderFrame(state, tuiAgent(), { cols: 80, rows: 24, slashCommands: [] })
  assert.ok(stripAnsi(frame).includes("Demo"), "frame 应包含 picker 标题")
  assert.equal(typeof cursorRow, "number")
  assert.equal(typeof cursorCol, "number")
})



test("keyHandler: picker 中可打印字符进入 filter，控制字符（Tab）不进", () => {
  const state = tuiState({ picker: pickerState() })
  const handler = createKeyHandler(keyCtx(state))
  handler("a", { name: "a" })
  handler("b", { name: "b" })
  assert.equal(state.picker.filter, "ab")
  handler("\t", { name: "tab" })
  assert.equal(state.picker.filter, "ab", "Tab 不应进入 filter")
})



test("keyHandler: picker filter 变化重置 index/scroll；Backspace 删 filter 字符", () => {
  const state = tuiState({ picker: pickerState({ index: 5, scroll: 3 }) })
  const handler = createKeyHandler(keyCtx(state))
  handler("x", { name: "x" })
  assert.equal(state.picker.filter, "x")
  assert.equal(state.picker.index, 0, "filter 变化重置 index")
  assert.equal(state.picker.scroll, 0, "filter 变化重置 scroll")
  handler("", { name: "backspace" })
  assert.equal(state.picker.filter, "")
  handler("", { name: "backspace" }) // 空 filter 时 backspace 无副作用、不抛错
  assert.equal(state.picker.filter, "")
})



test("keyHandler: picker PgUp/PgDn/Home/End 导航与边界", () => {
  const state = tuiState({ picker: pickerState() })
  const handler = createKeyHandler(keyCtx(state))
  // 与 key-handler 同一数据源：layout 实际 picker 面板高减标题行
  const winH = computeLayout(state, { cols: process.stdout.columns || 80, rows: process.stdout.rows || 24 }).panels.picker.h - 1
  handler("", { name: "pagedown" })
  assert.equal(state.picker.index, Math.min(19, winH))
  handler("", { name: "pageup" })
  assert.equal(state.picker.index, 0)
  handler("", { name: "end" })
  assert.equal(state.picker.index, 19)
  handler("", { name: "pagedown" })
  assert.equal(state.picker.index, 19, "PgDn 到底后 clamp")
  handler("", { name: "home" })
  assert.equal(state.picker.index, 0)
  handler("", { name: "pageup" })
  assert.equal(state.picker.index, 0, "PgUp 到顶后 clamp")
})



test("keyHandler: picker PgDn 步长跟随 layout 小终端压缩后的实际可视窗", () => {
  const state = tuiState({ picker: pickerState() })
  const handler = createKeyHandler(keyCtx(state))
  const origRows = process.stdout.rows
  process.stdout.rows = 9 // 触发 pickerFinalH 压缩（6 → 3）
  try {
    const h = computeLayout(state, { cols: 80, rows: 9 }).panels.picker.h
    assert.equal(h, 3, "小终端 picker 被压到 3 行")
    handler("", { name: "pagedown" })
    assert.equal(state.picker.index, h - 1, "PgDn 按实际可视窗（2 行）跳，而不是未压缩的 5 行")
  } finally {
    process.stdout.rows = origRows
  }
})



test("keyHandler: picker Enter 调 popPicker(选中项)、Esc 调 popPicker(null)", () => {
  const pops = []
  const state = tuiState({ picker: pickerState({ index: 3 }) })
  const handler = createKeyHandler({ ...keyCtx(state), popPicker: (v) => { pops.push(v); return true } })
  handler("", { name: "return" })
  assert.equal(pops[0], state.picker.filteredItems[3], "Enter resolve 过滤后列表的当前项")
  handler("", { name: "escape" })
  assert.equal(pops[1], null, "Esc resolve null")
})



test("keyHandler: Ctrl+C 在 picker 打开时取消 picker 而不是退出", () => {
  const pops = []
  let cleaned = false
  const state = tuiState({ picker: pickerState() })
  const handler = createKeyHandler({ ...keyCtx(state), popPicker: (v) => { pops.push(v); return true }, cleanup: () => { cleaned = true } })
  handler("", { name: "c", ctrl: true })
  assert.deepEqual(pops, [null], "Ctrl+C = 取消当前 picker")
  assert.equal(cleaned, false, "不应触发退出")
})



test("keyHandler: Ctrl+C 无 picker 时第一段仅提示不退出（防误触）", () => {
  let cleaned = false
  const lines = []
  const state = tuiState()
  const ctx = {
    ...keyCtx(state),
    cleanup: () => { cleaned = true },
    exitDelay: 60_000,
    exitArmDelay: 60_000,
    pushLine: (text) => lines.push(text),
  }
  const handler = createKeyHandler(ctx)
  try {
    handler("", { name: "c", ctrl: true })
    assert.equal(cleaned, false, "第一次 Ctrl+C 不应退出")
    assert.equal(state.exitArmed, true, "第一次 Ctrl+C 武装 exitArmed")
    assert.ok(ctx.exitArmTimer, "武装定时器已创建")
    assert.ok(lines.some((l) => l.includes("again")), "给出再按确认提示")
    // 第二次 Ctrl+C 才真正退出
    handler("", { name: "c", ctrl: true })
    assert.equal(cleaned, true, "第二次 Ctrl+C 走 cleanup 退出路径")
    assert.ok(ctx.exitTimer, "退出定时器已创建")
  } finally {
    clearTimeout(ctx.exitArmTimer)
    clearTimeout(ctx.exitTimer)
  }
})



test("keyHandler: Ctrl+C 武装超时后自动解除，需重新武装", async () => {
  let cleaned = false
  const state = tuiState()
  const ctx = {
    ...keyCtx(state),
    cleanup: () => { cleaned = true },
    exitDelay: 60_000,
    exitArmDelay: 10,
  }
  const handler = createKeyHandler(ctx)
  handler("", { name: "c", ctrl: true })
  assert.equal(state.exitArmed, true)
  await new Promise((r) => setTimeout(r, 30))
  assert.equal(state.exitArmed, false, "窗口过期后自动解除")
  handler("", { name: "c", ctrl: true })
  assert.equal(cleaned, false, "解除后再次 Ctrl+C 仍只是武装")
  assert.equal(state.exitArmed, true)
  clearTimeout(ctx.exitArmTimer)
  clearTimeout(ctx.exitTimer)
})



test("renderPicker: 位置指示 / filter 标题 / ↑ more / ↓ more", () => {
  const picker = pickerState({ index: 2, scroll: 5, filter: "ab" })
  const state = tuiState({ picker })
  const out = renderPicker(state, 60, { y: 0, h: 6 }, picker).map(stripAnsi)
  assert.ok(out[0].includes("❯ Demo"), "标题行含 picker 标题")
  assert.ok(out[0].includes("│ ab"), "标题行含 filter 输入")
  assert.ok(out[0].includes("3/20"), "标题行右侧含位置指示")
  assert.ok(out[1].includes("↑ more"), "窗口上方有更多内容时首行提示")
  assert.ok(out[5].includes("↓ more"), "窗口下方有更多内容时末行提示")
})



test("renderPicker: 超长 filter 的标题行被截断，右侧位置指示保留", () => {
  const picker = pickerState({ index: 2, filter: "x".repeat(200) })
  const state = tuiState({ picker })
  const out = renderPicker(state, 40, { y: 0, h: 3 }, picker).map(stripAnsi)
  assert.ok(stringWidth(out[0]) <= 39, `标题行不超终端宽（实际 ${stringWidth(out[0])}）`)
  assert.ok(out[0].includes("3/20"), "右侧位置指示保留")
})



test("renderStatus: picker 激活时提示输入即过滤与 PgUp/PgDn", () => {
  const state = tuiState({ picker: pickerState() })
  const agent = { provider: { model: "test" }, cwd: "/test", planMode: false, autoApprove: false, config: {} }
  const line = stripAnsi(renderStatus(state, agent, 120, []))
  assert.ok(line.includes("filter"), "提示输入即过滤")
  assert.ok(line.includes("PgUp/PgDn"), "提示翻页导航")
})



test("keyHandler: picker 中粘贴多行文本先清洗换行再进 filter", () => {
  const state = tuiState({ picker: pickerState() })
  const handler = createKeyHandler(keyCtx(state))
  handler("ab\ncd\r\nef", {})
  assert.equal(state.picker.filter, "abcdef", "换行被清洗，其余字符进入 filter")
  // 清洗后仍含其他控制字符的整段丢弃
  handler("x\x07y", {})
  assert.equal(state.picker.filter, "abcdef", "含控制字符的输入仍被丢弃")
})



test("renderPicker: 单行可视窗时上下都有更多内容显示合并指示 ↑↓ more", () => {
  const picker = pickerState({ scroll: 5 }) // 20 项，窗口夹在中间
  const state = tuiState({ picker })
  const out = renderPicker(state, 60, { y: 0, h: 2 }, picker).map(stripAnsi) // h=2 → winH=1
  assert.ok(out[1].includes("↑↓ more"), "首行即末行时两个方向的 more 指示合并")
  assert.ok(out[1].includes("item5"), "条目内容仍正常显示")
})



test("renderPicker: 超宽行截断加省略号且不超宽", () => {
  const picker = pickerState({ lines: [{ text: "x".repeat(200), color: "" }], scroll: 0 })
  const state = tuiState({ picker })
  const out = renderPicker(state, 40, { y: 0, h: 3 }, picker).map(stripAnsi)
  assert.ok(out[1].endsWith("…"), "截断行末尾加省略号")
  assert.ok(stringWidth(out[1]) <= 39, "不超终端宽")
})



// ====================================================================
// SESSION.md §8 — T2 启动弹选择 + T7 取消（promptProviderIfInvalid）
// ====================================================================


test("T2 启动弹选择：_providerInvalid → openModelPicker 被调用；选定后无提示行", async () => {
  const { promptProviderIfInvalid } = await import("../src/tui/index.mjs")
  let picked = false
  const pushed = []
  const agent = { _providerInvalid: true, provider: null }
  // 用户选定 → selectModel 后 agent.provider 为有效值
  const openModelPicker = async () => { picked = true; agent.provider = { name: "deepseek", baseURL: "https://api.deepseek.com", model: "deepseek-chat" } }
  const r = await promptProviderIfInvalid(agent, openModelPicker, (t) => pushed.push(t))
  assert.equal(r, true)
  assert.equal(picked, true, "先弹模型选择 picker")
  assert.equal(pushed.length, 0, "选定后不推提示行")
})



test("T7 选择取消（Esc）：provider 仍 null → 提示行 + 不抛错，仍进 TUI（D-S2）", async () => {
  const { promptProviderIfInvalid } = await import("../src/tui/index.mjs")
  const pushed = []
  const agent = { _providerInvalid: true, provider: null }
  const openModelPicker = async () => { /* Esc → provider 保持 null */ }
  const r = await promptProviderIfInvalid(agent, openModelPicker, (t) => pushed.push(t))
  assert.equal(r, true)
  assert.equal(pushed.length, 1, "推送提示行")
  assert.equal(pushed[0], "未配置有效 provider，可用 /model 选择或 /provider 配置", "提示行文案逐字")
})



test("T7b 无 provider 直接进入（_providerInvalid 未置位但 provider 为 null）→ 同样弹选择", async () => {
  const { promptProviderIfInvalid } = await import("../src/tui/index.mjs")
  let picked = false
  const agent = { provider: null }
  const r = await promptProviderIfInvalid(agent, async () => { picked = true }, () => {})
  assert.equal(r, true)
  assert.equal(picked, true, "!agent.provider 即触发（D-S2 判据之一）")
})



test("T5 回归：provider 有效 → 不弹选择，不推提示行", async () => {
  const { promptProviderIfInvalid } = await import("../src/tui/index.mjs")
  let picked = false
  const agent = { provider: { name: "deepseek", model: "deepseek-chat" } }
  const r = await promptProviderIfInvalid(agent, async () => { picked = true }, () => {})
  assert.equal(r, false)
  assert.equal(picked, false)
})
