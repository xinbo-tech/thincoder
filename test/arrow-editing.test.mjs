/**
 * arrow-editing.test.mjs — 第 31 批「方向键编辑」（2026-09-11）用例锁：主输入框 ↑↓ 竖移
 * （三规则：翻历史恒历史 / 竖移优先 / 边界回落）+ Inject 框（Ctrl+I）四方向键编辑。
 * 契约 = docs/design/TUI-INPUT-BOX.md §3（三规则）+ §8（Inject）+ §9.6（T-A1..T-A11 十一条
 * 1:1）；需求 = docs/requirements/TUI.md F11 / N8。
 * 手法：createKeyHandler / handleInterruptMode / insertPastedText 直驱（无真实 TTY——同
 * input-lock.test.mjs）；竖移几何 = moveCursorVertical(chars, cursor, inputContentWidth(cols))。
 * 纯函数快层（无定时器/无 IO——不属 slow 归册）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { createKeyHandler } from "../src/tui/key-handler.mjs"
import { handleInterruptMode } from "../src/tui/key-modes.mjs"
import { insertPastedText } from "../src/tui/clipboard.mjs"
import { layoutInput } from "../src/tui/render.mjs"
import { inputContentWidth } from "../src/tui/layout.mjs"

/** 最小按键态（input-lock.test.mjs 同款 + dims 固定 80×24——竖移宽度确定）。 */
function baseState(over = {}) {
  return {
    input: [], cursor: 0, history: [], historyIndex: -1, _draft: null,
    processing: false, suspended: false, _suspPending: false, pendingInput: [],
    queue: [], subTasks: {}, tasks: [], scroll: 0, _followTail: true,
    dims: { get: () => ({ cols: 80, rows: 24 }) },
    ...over,
  }
}

/** createKeyHandler 桩 ctx（input-lock.test.mjs 同款——render/submit/提示行记录）。 */
function keyCtx(state, over = {}) {
  const calls = { submit: 0, lines: [] }
  const base = {
    agent: {},
    state,
    render() {}, popPicker() {}, renderPickerLines() {},
    handleSlash: async () => {}, handleTab() {},
    submit: async () => { calls.submit++ },
    pasteClipboardImage: async () => {},
    wizardChooseProvider() {}, wizardSubmitText() {}, cancelWizard() {},
    wizardProviderItems: () => [], renderWizard() {},
    pushLine: (text) => calls.lines.push(text),
    cleanup() {}, showPicker() {}, loadOlder() {},
    ...over,
  }
  base.calls = calls
  return base
}

/** handleInterruptMode 桩 ctx（Inject 模态直驱）。 */
function ipCtx(state) {
  const lines = []
  return { state, render() {}, pushLine: (t) => lines.push(t), lines }
}

/** 具名键（箭头/Home/End/Esc 等特殊键——readline 的 str 为空）。 */
const press = (kh, name) => kh(undefined, { name })

// ─── T-A1 正常：多行 ↑↓ 竖移（可视行口径）──────────────────────────

test("T-A1 正常：多行输入 ↑↓ 竖移——cursor 9（第 3 行 col1）↑→ 5（第 2 行 col1）↓→ 9；历史面零涉", () => {
  // 夹具带非空历史：竖移必须优先于历史回落（否则断言即红——措施可判别）
  const s = baseState({ input: [..."aaa\nbbb\nccc"], cursor: 9, history: ["prev"] })
  const kh = createKeyHandler(keyCtx(s))
  press(kh, "up")
  assert.equal(s.cursor, 5, "↑ → 第 2 行 col1（index 5）")
  assert.deepEqual(s.input, [..."aaa\nbbb\nccc"], "文本逐字不变（未回落历史）")
  assert.equal(s.historyIndex, -1, "竖移不进入历史导航（D-31.6）")
  assert.equal(s._draft, null, "竖移不存草稿")
  press(kh, "down")
  assert.equal(s.cursor, 9, "↓ → 第 3 行 col1（显示列保持——逐键现算）")
  assert.equal(s.historyIndex, -1)
})

// ─── T-A2 边界：短行端钳制 ──────────────────────────────────────

test("T-A2 边界：cursor 2（第 1 行行尾——落 \\n）↓→ 4（行 2 仅 1 字符→钳制行尾）；再 ↑→ 1", () => {
  const s = baseState({ input: [..."aa\nb"], cursor: 2 })
  const kh = createKeyHandler(keyCtx(s))
  press(kh, "down")
  assert.equal(s.cursor, 4, "↓ 目标行更短 → 钳制到行尾（index 4）")
  assert.equal(s.historyIndex, -1, "竖移零历史副作用")
  press(kh, "up")
  assert.equal(s.cursor, 1, "↑ 列保持 = 钳制后的列 1")
})

// ─── T-A3 边界：显示列口径（CJK 宽 2）───────────────────────────

test("T-A3 边界：显示列口径（CJK 占 2 列）——[中,文,\\n,a,b] cursor 5 ↑→ 1（显示列 2 非 codepoint 计数）", () => {
  const s = baseState({ input: ["中", "文", "\n", "a", "b"], cursor: 5 })
  press(createKeyHandler(keyCtx(s)), "up")
  assert.equal(s.cursor, 1, "第 2 行显示列 2 → 第 1 行显示列 2 = 「中」之后（index 1）")
})

// ─── T-A4 正常：单行 ↑ 回落历史（草稿保护）+ ↓ 还原 ──────────────

test("T-A4 正常：单行 ↑→ 历史导航（historyIndex 0 / input=prev / _draft 存原稿）；↓→ 还原草稿", () => {
  const s = baseState({ input: [..."hello"], cursor: 5, history: ["prev"] })
  const kh = createKeyHandler(keyCtx(s))
  press(kh, "up")
  assert.equal(s.historyIndex, 0, "单行无可移邻行 → 回落历史导航")
  assert.deepEqual(s.input, [..."prev"])
  assert.deepEqual(s._draft, [..."hello"], "未提交输入存草稿")
  assert.equal(s.cursor, 4, "历史载入 cursor = 条目末")
  press(kh, "down")
  assert.equal(s.historyIndex, -1)
  assert.deepEqual(s.input, [..."hello"], "↓ 走到头 → 还原草稿")
  assert.equal(s._draft, null, "还原后清草稿")
})

// ─── T-A5 边界：多行顶行 ↑ 回落历史；末行 ↓ 无动作 ────────────────

test("T-A5 边界：多行顶行 ↑→ 回落历史（载入 prev + 原稿入草稿）；末行 ↓→ 零变化", () => {
  const s1 = baseState({ input: [..."aa\nbb"], cursor: 1, history: ["prev"] })
  press(createKeyHandler(keyCtx(s1)), "up")
  assert.equal(s1.historyIndex, 0, "顶行 ↑ 无可移邻行 → 历史导航")
  assert.deepEqual(s1.input, [..."prev"])
  assert.deepEqual(s1._draft, [..."aa\nbb"], "多行原稿入草稿")

  const s2 = baseState({ input: [..."aa\nbb"], cursor: 5, history: ["prev"] })
  press(createKeyHandler(keyCtx(s2)), "down")
  assert.equal(s2.cursor, 5, "末行 ↓ 无邻行 → 零变化")
  assert.deepEqual(s2.input, [..."aa\nbb"])
  assert.equal(s2.historyIndex, -1, "↓ 不进入历史")
  assert.equal(s2._draft, null)
})

// ─── T-A6 边界：翻历史中恒历史（多行条目也不竖移）─────────────────

test("T-A6 边界：历史条目多行时 ↑↓ 恒历史——index 1（x\\ny）↑→ 0（older）↓→ 1；未竖移", () => {
  const s = baseState({ input: [], history: ["older", "x\ny"] }) // index0=older / index1 最新（push 序）
  const kh = createKeyHandler(keyCtx(s))
  press(kh, "up")
  assert.equal(s.historyIndex, 1, "首次 ↑ 进入历史（最新条目——historyIndex 变）")
  assert.deepEqual(s.input, [..."x\ny"], "载入最新条目")
  assert.equal(s.cursor, 3, "载入 cursor = 条目末")
  press(kh, "up")
  assert.equal(s.historyIndex, 0, "再 ↑ = 历史回退（多行条目不竖移——恒历史）")
  assert.deepEqual(s.input, [..."older"], "换条目（未竖移 = input 被换）")
  assert.equal(s.cursor, 5, "新条目末 cursor=5")
  press(kh, "down")
  assert.equal(s.historyIndex, 1, "↓ 前进回最新")
  assert.deepEqual(s.input, [..."x\ny"])
  assert.equal(s.cursor, 3)
})

// ─── T-A7 边界：processing 期——竖移放行 + 历史导航禁 ─────────────

test("T-A7 边界：processing 期竖移放行（多行 ↑ cursor 5→2）；单行 ↑ / 末行 ↓ 零变化（历史禁）", () => {
  // 多行 ↑：竖移放行（纯编辑——与字符/退格/←→ 同权）
  const s1 = baseState({ processing: true, history: ["prev"], input: [..."aa\nbbbb"], cursor: 5 })
  press(createKeyHandler(keyCtx(s1)), "up")
  assert.equal(s1.cursor, 2, "末行 col2 → ↑ → 首行 col2（竖移放行）")
  assert.deepEqual(s1.input, [..."aa\nbbbb"], "input 不变（历史禁——不载入 prev）")
  assert.equal(s1.historyIndex, -1, "历史禁——不进入导航")
  assert.equal(s1._draft, null, "不存草稿（历史分支未走）")

  // 单行 ↑：无可移邻行 + 历史禁 → 零变化（非空历史夹具——可判别）
  const s2 = baseState({ processing: true, history: ["prev"], input: [..."solo"], cursor: 4 })
  press(createKeyHandler(keyCtx(s2)), "up")
  assert.equal(s2.cursor, 4, "单行 ↑ 零变化（历史禁——不回落）")
  assert.deepEqual(s2.input, [..."solo"], "不载入 prev")
  assert.equal(s2.historyIndex, -1)

  // 末行 ↓：无可移邻行 → 零变化
  const s3 = baseState({ processing: true, history: ["prev"], input: [..."aa\nbbbb"], cursor: 5 })
  press(createKeyHandler(keyCtx(s3)), "down")
  assert.equal(s3.cursor, 5, "末行 ↓ 零变化")
  assert.deepEqual(s3.input, [..."aa\nbbbb"])
  assert.equal(s3.historyIndex, -1)
})

// ─── T-A8 正常：Inject 框四方向键（折行竖移 + 钳制 + ←→/Home/End/Ctrl+U）──

test("T-A8 正常：Inject { chars: 60×a, cursor: 30 } cols=40——↓ 钳制 60 / ↑ 列保持 / ←→ Home/End Ctrl+U", () => {
  const chars = Array.from("a".repeat(60))
  // 几何：内容宽 = inputContentWidth(40) = 35；layoutInput 每行再预留 2 列行前缀（`▸ ` / 续行 2 空格）
  // → 行 1 = 33 字符（显示宽 35 = 前缀 2 + 33）、行 2 = 27 字符（显示宽 29）。设计档 §9.6 T-A8 括注
  // 「行 1 宽 35 / 行 2 宽 25」未减行前缀——本用例按实测几何断言（交付报告「偏差披露」）。
  assert.equal(inputContentWidth(40), 35, "内容宽单源（§9.3 #3）")
  assert.deepEqual(
    layoutInput(chars, 30, inputContentWidth(40)).lines.map((l) => l.length),
    [35, 29],
    "折 2 行：33 / 27 字符（各含 2 列前缀）",
  )

  const s = {
    interruptPrompt: { chars: [...chars], cursor: 30 },
    history: ["prev"], historyIndex: -1, // 注入框无历史回落——夹具可判别
    dims: { get: () => ({ cols: 40, rows: 24 }) },
  }
  const ctx = ipCtx(s)
  const ip = (key) => handleInterruptMode(undefined, key, ctx)

  ip({ name: "down" })
  assert.equal(s.interruptPrompt.cursor, 60, "↓ 行 2 更短（27 字符）→ 钳制行尾 cursor=60")
  ip({ name: "up" })
  assert.equal(s.interruptPrompt.cursor, 27, "↑ 列保持 = 行 2 行尾列 27（逐键现算——不回 30）")
  ip({ name: "down" })
  assert.equal(s.interruptPrompt.cursor, 60, "↓ 复得 60")
  ip({ name: "down" })
  assert.equal(s.interruptPrompt.cursor, 60, "末行 ↓ 无邻行 → 吞（零变化）")
  assert.equal(s.historyIndex, -1, "注入框 ↑↓ 不牵动主输入框历史")
  ip({ name: "left" })
  assert.equal(s.interruptPrompt.cursor, 59, "← 边界内移动")
  ip({ name: "home" })
  assert.equal(s.interruptPrompt.cursor, 0, "Home → 0")
  ip({ name: "end" })
  assert.equal(s.interruptPrompt.cursor, 60, "End → 60")
  ip({ name: "u", ctrl: true })
  assert.deepEqual(s.interruptPrompt.chars, [], "Ctrl+U → chars 空")
  assert.equal(s.interruptPrompt.cursor, 0, "Ctrl+U → cursor=0")
})

// ─── T-A9 错误/回归：Inject Enter 提交 / 空提交 / Esc ─────────────

test("T-A9 错误/回归：Inject Enter（非空 + processing）→ abort({interrupt,message}) + [inject] 提示；空不 abort；Esc 置 null", () => {
  const mk = (chars) => {
    const aborts = []
    const state = {
      interruptPrompt: { chars: [...chars], cursor: chars.length },
      processing: true,
      controller: { signal: { aborted: false }, abort: (payload) => aborts.push(payload) },
    }
    return { state, aborts, ctx: ipCtx(state) }
  }

  // 非空提交：abort + [inject] 提示 + 框关闭
  const a = mk([..."hi there"])
  assert.equal(handleInterruptMode(undefined, { name: "return" }, a.ctx), true, "模态激活时消费按键")
  assert.deepEqual(a.aborts, [{ interrupt: true, message: "hi there" }], "abort 载荷（interrupt + message）")
  assert.match(a.ctx.lines[0], /\[inject\] hi there/, "[inject] 提示行")
  assert.equal(a.state.interruptPrompt, null, "提交后框关闭")

  // 空（trim 后）：不 abort（框仍关闭——无提示）
  const b = mk([" ", " "])
  handleInterruptMode(undefined, { name: "return" }, b.ctx)
  assert.equal(b.aborts.length, 0, "空提交不 abort")
  assert.equal(b.state.interruptPrompt, null, "空提交仍关闭框")
  assert.equal(b.ctx.lines.length, 0, "空提交无提示")

  // Esc：取消（不 abort）
  const c = mk([..."x"])
  handleInterruptMode(undefined, { name: "escape" }, c.ctx)
  assert.equal(c.state.interruptPrompt, null, "Esc 取消（置 null）")
  assert.equal(c.aborts.length, 0, "Esc 不 abort")
})

// ─── T-A10 正常：粘贴落 cursor（注入框分支）──────────────────────

test("T-A10 正常：insertPastedText 注入框分支——落 cursor 处、无 \\n、\\t → 2 空格、主输入框零污染", () => {
  const s = {
    interruptPrompt: { chars: [..."ab"], cursor: 1 },
    input: [..."MAIN"], cursor: 4,
  }
  insertPastedText(s, "ab\ncd\t e")
  assert.equal(s.interruptPrompt.chars.join(""), "aabcd   eb", "落 cursor=1 处、\\n 去除、\\t → 2 空格")
  assert.equal(s.interruptPrompt.cursor, 9, "光标落插入文本之后")
  assert.ok(!s.interruptPrompt.chars.includes("\n"), "单行不变式：无 \\n")
  assert.deepEqual(s.input, [..."MAIN"], "主输入框零污染")
  assert.equal(s.cursor, 4, "主输入框光标不动")
})

// ─── T-A11 回归：空输入 / 单行非历史 ↓ 零副作用 ──────────────────

test("T-A11 回归：空 input + 空 history ↑；单行 input（非历史）↓ → 均零副作用（无异常、无状态变化）", () => {
  const s1 = baseState({ input: [], cursor: 0, history: [] })
  const c1 = keyCtx(s1)
  const kh1 = createKeyHandler(c1)
  assert.doesNotThrow(() => press(kh1, "up"), "空态 ↑ 无异常")
  assert.equal(s1.cursor, 0, "cursor 不变")
  assert.deepEqual(s1.input, [], "input 不变")
  assert.equal(s1.historyIndex, -1)
  assert.equal(s1._draft, null)
  assert.equal(c1.calls.submit, 0, "不触发提交")

  const s2 = baseState({ input: [..."abc"], cursor: 3, history: ["prev"] })
  press(createKeyHandler(keyCtx(s2)), "down")
  assert.equal(s2.cursor, 3, "单行 ↓ 零变化")
  assert.deepEqual(s2.input, [..."abc"])
  assert.equal(s2.historyIndex, -1, "↓ 不进入历史")
  assert.equal(s2._draft, null)
})
