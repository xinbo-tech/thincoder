/**
 * tui-selection-surfaces.test.mjs — 选择面收口（第 20 批 A1/A4——设计档 TUI.md §12）用例 1–9 1:1。
 * 直驱 createPickers / handleQuestionMode / renderWizard + renderPicker 纯函数面
 * （构造手法照 model-ref.test.mjs 脚本化 picker + 最小 state/computeLayout 桩）。
 * 纯单元：零网络、零子进程、零真实终端。
 */
import { test } from "node:test"
import assert from "node:assert/strict"

import { createPickers } from "../src/tui/pickers.mjs"
import { createWizard } from "../src/tui/wizard.mjs"
import { handleQuestionMode } from "../src/tui/key-modes.mjs"
import { createKeyHandler } from "../src/tui/key-handler.mjs"
import { computeLayout } from "../src/tui/layout.mjs"
import { renderPicker } from "../src/tui/render-frame.mjs"
import { stringWidth } from "../src/tui/render.mjs"
import { QUESTION_CUSTOM } from "../src/tui/interaction.mjs"

const strip = (s) => s.replace(/\x1b\[[0-9;]*m/g, "")
// 真 ANSI 色序列（stringWidth 计入零宽——行宽断言不能被色码污染）
const C = { text: "\x1b[97m", dim: "\x1b[2m", tool: "\x1b[36m", error: "\x1b[31m", warn: "\x1b[33m" }

/** 最小 state（computeLayout 读取面——最小桩）。 */
function mkState(dims = { cols: 80, rows: 24 }, over = {}) {
  return {
    input: "", cursor: 0, tasks: [], lines: [], scroll: 0, subTasks: {},
    search: null, interruptPrompt: null, question: null, picker: null, permission: null,
    wizard: null, expandedBlocks: new Set(), _frozenSubKeys: new Set(),
    streaming: "", reasoning: "", foldEnabled: true, status: "", dims: { get: () => dims },
    ...over,
  }
}

/** createPickers 装配（真 showPicker/rebuildLines——render 为桩）。 */
function mkPickers(over = {}) {
  const state = over.state ?? mkState(over.dims)
  const agent = over.agent ?? { providers: [], config: { agent: {} } }
  const pickers = createPickers({
    agent, state, render: () => {}, ansi: { bold: "\x1b[1m", reset: "\x1b[0m", dim: "\x1b[2m" }, C,
    pushLine: () => {}, persistRaw: async () => {}, askQuestion: async () => "", maskKey: (k) => k,
  })
  return { pickers, state, agent }
}

/** wizard 装配（n 个渠道——列表超窗用；hints = pushLine 收集面）。 */
function mkWizard(state, n, hints = []) {
  const agent = {
    providers: Array.from({ length: n }, (_, i) => ({ name: `p${i}`, baseURL: `https://p${i}.test`, model: "kimi-k3", apiKey: "k" })),
    config: { agent: {} },
  }
  const wizard = createWizard({
    agent, state, pushLine: (t) => hints.push(t), pushLabel: () => {}, render: () => {},
    persistRaw: async () => {}, openModelPicker: async () => {},
  })
  return { wizard, agent, hints }
}

const qctx = (state) => ({ state, pushLine: () => {}, render: () => {} })

test("用例 1 正常（F9/AC-A1-1）：item note 渲染——`  ` 分隔；无 note 零尾随", async () => {
  const { pickers, state } = mkPickers()
  const opening = pickers.showPicker("t", [{ type: "item", text: "a", note: "N1" }, { type: "item", text: "b" }])
  assert.equal(state.picker.lines[0].text, " ▸ a  N1", "有 note：prefix + text + `  ` + note")
  assert.equal(state.picker.lines[1].text, "   b", "无 note 不产生尾随空格")
  pickers.closePicker()
  await opening
})

test("用例 2 正常（F9/AC-A1-1）：header note 既有消费零回归", async () => {
  const { pickers, state } = mkPickers()
  const opening = pickers.showPicker("t", [{ type: "header", text: "H", note: "h1" }, { type: "item", text: "a" }])
  assert.equal(state.picker.lines[0].text, " H  h1")
  pickers.closePicker()
  await opening
})

test("用例 3 正常（F9/AC-A1-2）：真 buildProviderEntries——警示上移 text、note = baseURL、80 列渲染含警示", async () => {
  const agent = {
    providers: [
      { name: "kimi", baseURL: "https://api.moonshot.cn/v1", model: "kimi-k3" }, // 无 key
      { name: "broken", baseURL: "https://broken.test/v1", model: "deepseek-v4-pro", apiKey: "sk", _unavailable: true },
    ],
    activeProvider: "kimi", activeModel: "kimi-k3", config: { agent: {} },
  }
  const { pickers, state } = mkPickers({ agent })
  const opening = pickers.openModelPicker()
  const items = state.picker.entries.filter((e) => e.type === "item")
  const kimi = items.find((e) => e.provider === "kimi")
  const broken = items.find((e) => e.provider === "broken")
  assert.match(kimi.text, /\(no key\)/, "无 key 警示在 text（不再位于最先牺牲段）")
  assert.match(broken.text, /\(不可用\)/, "探不通警示在 text")
  assert.equal(kimi.note, "https://api.moonshot.cn/v1", "note 收窄为 baseURL")
  assert.equal(broken.note, "https://broken.test/v1")
  assert.ok(!/\(no key\)|\(不可用\)/.test(kimi.note + broken.note), "警示不再落在 note（最先牺牲段）")
  // 80 列渲染行含警示（AC-A1-2 判据）
  const dims = { cols: 80, rows: 24 }
  const lines = renderPicker(state, 80, computeLayout(state, dims).panels.picker, state.picker).map(strip)
  assert.ok(lines.some((l) => l.includes("(no key)")), "80 列渲染行含 (no key)")
  assert.ok(lines.some((l) => l.includes("(不可用)")), "80 列渲染行含 (不可用)")
  pickers.closePicker()
  await opening
})

test("用例 4 边界（F9/N7/AC-A1-3）：行宽预算——任意渲染行 ≤ cols−8、超宽右截断带 …、prefix+text 保全", async () => {
  const { pickers, state } = mkPickers()
  const entries = Array.from({ length: 10 }, (_, i) => ({ type: "item", text: `row${i}`, note: "N".repeat(200) }))
  const opening = pickers.showPicker("t", entries)
  const lines = renderPicker(state, 80, { h: 6 }, state.picker) // 可视窗 5 行——末行出 ↓ more 指示
  for (const l of lines) assert.ok(stringWidth(l) <= 72, `行宽 ≤ cols−8：${JSON.stringify(strip(l))} = ${stringWidth(l)}`)
  assert.ok(strip(lines.at(-1)).includes("↓ more"), "指示行在位（指示位宽在 8 格外另扣）")
  const row0 = strip(lines.find((l) => l.includes("row0")))
  assert.ok(row0.startsWith(" ▸ row0"), "prefix + text 段保全")
  assert.ok(row0.endsWith("…"), "超宽行尾截断省略号")
  pickers.closePicker()
  await opening
})

test("用例 5 边界（F10/AC-A4-2）：question options ↑↓ 环绕（末→0；首→末）", () => {
  const state = mkState()
  state.question = { options: ["a", "b", "c"], selected: 2, resolve: () => assert.fail("环绕不得 resolve") }
  handleQuestionMode("", { name: "down" }, qctx(state))
  assert.equal(state.question.selected, 0, "末项 ↓ → 第 0 项")
  handleQuestionMode("", { name: "up" }, qctx(state))
  assert.equal(state.question.selected, 2, "首项 ↑ → 末项")
})

test("用例 6 边界（F10/AC-A4-3）：wizard provider 选中行越窗 → scroll 滚入可视窗", () => {
  const dims = { cols: 80, rows: 24 }
  const state = mkState(dims)
  const { wizard } = mkWizard(state, 12)
  wizard.startWizard()
  state.wizard.index = wizard.wizardProviderItems().length - 1 // 列表超窗 + 选中越窗
  wizard.renderWizard()
  const w = state.wizard
  const winH = computeLayout(state, dims).panels.picker.h - 1
  assert.ok(w.scroll > 0, "越窗后 scroll 调整（原恒 0）")
  assert.ok(w.selectedLine >= w.scroll && w.selectedLine < w.scroll + winH, `选中行落 [scroll, scroll+winH)：sel=${w.selectedLine} scroll=${w.scroll} winH=${winH}`)
  const deep = w.scroll
  state.wizard.index = 0 // 回顶部：scroll 收回（选中行仍恒在窗内）
  wizard.renderWizard()
  assert.ok(state.wizard.scroll < deep, "选中项回顶 → scroll 收回")
  assert.ok(state.wizard.selectedLine >= state.wizard.scroll, "选中行仍在窗内（恒等式保持）")
})

test("用例 7 边界（F10/AC-A4-4）：question 自由文本态零回归 + Custom 哨兵渲染并参与环绕", () => {
  const state = mkState()
  state.question = { options: [], answer: [..."hi"], cursor: 1, resolve: () => {} }
  handleQuestionMode("X", { name: "x" }, qctx(state))
  assert.deepEqual(state.question.answer, [..."hXi"], "自由文本插入语义不变（codepoint 落光标）")
  assert.equal(state.question.cursor, 2)
  assert.equal(state.question.options.length, 0, "自由文本态不引入 options")
  const st2 = mkState()
  st2.question = { options: ["a", QUESTION_CUSTOM], selected: 0, resolve: () => {} }
  assert.deepEqual(computeLayout(st2, { cols: 80, rows: 24 }).boxLines, ["▸ a", "  ✍ Custom answer…"], "哨兵项渲染形态")
  handleQuestionMode("", { name: "up" }, qctx(st2))
  assert.equal(st2.question.selected, 1, "首项 ↑ → 哨兵项（环绕）")
  handleQuestionMode("", { name: "down" }, qctx(st2))
  assert.equal(st2.question.selected, 0, "哨兵项 ↓ → 首项（环绕）")
})

test("用例 8 错误（F10/AC-A4-3）：dims 缺失 / computeLayout 抛错 → winH 兜底 8——渲染不崩", () => {
  const state = mkState()
  state.dims = { get: () => { throw new Error("no dims") } } // computeLayout 抛错面
  const { wizard } = mkWizard(state, 20)
  wizard.startWizard()
  state.wizard.index = wizard.wizardProviderItems().length - 1
  assert.doesNotThrow(() => wizard.renderWizard(), "computeLayout 抛错被兜底吞——渲染不崩")
  assert.equal(state.wizard.selectedLine - state.wizard.scroll + 1, 8, "兜底 winH = 8（选中行贴窗底）")
  const st2 = mkState()
  delete st2.dims // dims 缺失面：computeLayout 走 stdout 兜底——同样不崩
  const { wizard: w2 } = mkWizard(st2, 20)
  w2.startWizard()
  st2.wizard.index = w2.wizardProviderItems().length - 1
  assert.doesNotThrow(() => w2.renderWizard(), "dims 缺失不崩")
  assert.ok(st2.wizard.selectedLine >= st2.wizard.scroll, "选中行恒在窗内")
})

test("用例 9 错误（F10/AC-A4-4）：零回归对照——picker 键位 / wizard Esc / question Esc", async () => {
  // ① picker：↑↓ 环绕 / PgUp 钳位 / Esc pop
  const { pickers, state } = mkPickers()
  const opening = pickers.showPicker("t", [{ type: "item", text: "a" }, { type: "item", text: "b" }, { type: "item", text: "c" }])
  const onKey = createKeyHandler({
    agent: { providers: [] }, state, render: () => {},
    popPicker: pickers.popPicker, renderPickerLines: pickers.renderPickerLines, pushLine: () => {},
  })
  onKey("", { name: "up" })
  assert.equal(state.picker.index, 2, "↑ 环绕：0 → 末项")
  onKey("", { name: "down" })
  assert.equal(state.picker.index, 0, "↓ 环绕：末 → 0")
  onKey("", { name: "pagedown" })
  assert.equal(state.picker.index, 2, "PgDn 钳位（不环绕）")
  onKey("", { name: "pageup" })
  assert.equal(state.picker.index, 0, "PgUp 钳位到首项")
  onKey("", { name: "escape" })
  assert.equal(await opening, null, "Esc = pop 当前层（resolve null）")

  // ② wizard Esc = 取消整个向导
  const state2 = mkState()
  const { wizard, agent, hints } = mkWizard(state2, 2)
  wizard.startWizard()
  const onKey2 = createKeyHandler({
    agent, state: state2, render: () => {}, pushLine: () => {},
    cancelWizard: wizard.cancelWizard, wizardProviderItems: wizard.wizardProviderItems,
    renderWizard: wizard.renderWizard, wizardChooseProvider: wizard.wizardChooseProvider,
    wizardSubmitText: wizard.wizardSubmitText,
  })
  onKey2("", { name: "escape" })
  assert.equal(state2.wizard, null, "wizard Esc → 整向导取消（既有语义）")
  assert.ok(hints.some((l) => l.includes("Skipped initial setup")), "取消提示行（既有文案）")

  // ③ question Esc：无 options → 中止；有 _backOptions → 回选项态
  const state3 = mkState()
  let aborted = null
  state3.question = { options: [], answer: [], cursor: 0, resolve: (v) => { aborted = v } }
  handleQuestionMode("", { name: "escape" }, qctx(state3))
  assert.equal(aborted, "", "无 options：Esc 中止 question")
  assert.equal(state3.question, null)
  const state4 = mkState()
  state4.question = { options: [], answer: [], cursor: 0, _backOptions: { options: ["a", "b"], selected: 1 }, resolve: () => {} }
  handleQuestionMode("", { name: "escape" }, qctx(state4))
  assert.deepEqual(state4.question.options, ["a", "b"], "有 _backOptions：Esc 回选项态")
  assert.equal(state4.question.selected, 1)
})
