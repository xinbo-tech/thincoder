/**
 * webview-input-history.test.mjs — 群 A 批 A10（VSC-MIRROR-SWEEP）。
 * 设计权威：`docs/design/WEBVIEW.md` §11.1（契约 C-MA10-1..6 / 用例 T-MA10-1..8 / AC-MA10-1..7）。
 *
 * 覆盖：连续上溯与 ↓ 回落（含草稿恢复）/ 单行任意位置触发（↑ 载入、↓ 吞键 no-op）/ 多行
 * 非边界零劫持（原生竖移保留＝零 preventDefault）/ IME 两分支守卫 / 下拉让位 / 边界门。
 * 手法（§11.1.5）：setupWebview + installChatFixture + 动态 import 真 `input.js`（副作用注册）；
 * 历史夹具直设 ctx._inputHistory / _historyIdx / _inputDraft（逐测复位）；
 * 断言面 = 输入框值 + dispatchEvent 返回值（false = 已 preventDefault）+ ctx 指针。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { setupWebview, installChatFixture } from "./helpers/webview-env.mjs"

let cleanupEnv
let W = null

before(async () => {
  const env = setupWebview()
  cleanupEnv = env.cleanup
  installChatFixture()
  document.body.insertAdjacentHTML("beforeend", `
    <div id="at-dropdown" style="display:none"></div>
    <div id="paste-bar" style="display:none"></div>
    <div id="paste-badge"></div>
    <input id="file-input" type="file">
    <button id="attach-btn"></button>
  `)
  // A10：历史面需真可定位光标元素（selectionStart / setSelectionRange）——共享 fixture 的
  // #input 是 div 占位；本档在 import 前换成真 textarea（index.html:34 同形态——fixture 零改）。
  const stub = document.getElementById("input")
  const ta = document.createElement("textarea")
  ta.id = "input"
  stub.replaceWith(ta)
  const state = await import("../webview/state.js")
  await import("../webview/input.js") // 副作用注册（监听挂载）
  W = { ctx: state.ctx, S: state.S, atDropdown: document.getElementById("at-dropdown") }
})

after(() => {
  try { window.dispatchEvent(new window.Event("unload")) } catch { /* happy-dom teardown edge */ }
  cleanupEnv()
})

const inputEl = () => W.ctx.inputEl

/** ↑/↓ 派发；返回 dispatchEvent 结果——false = defaultPrevented。 */
function pressKey(init) {
  return inputEl().dispatchEvent(new window.KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init }))
}

/** 逐测复位：历史夹具直设 + 光标位 + 下拉闭合。 */
function reset({ history = [], value = "", caret = null } = {}) {
  const { ctx } = W
  ctx._inputHistory = [...history]
  ctx._historyIdx = -1
  ctx._inputDraft = ""
  ctx.isRunning = false
  ctx._interruptMode = false
  W.atDropdown.style.display = "none"
  inputEl().value = value
  const at = caret === null ? value.length : caret
  inputEl().setSelectionRange(at, at)
}

// ─── T-MA10-1 正常：连续上溯不断裂（C-MA10-2）────────────────────────────────

test("T-MA10-1 ↑×4：c→b→a→a（顶端钳制——连续上溯不断裂）", () => {
  reset({ history: ["a", "b", "c"], value: "draft" })
  pressKey({ key: "ArrowUp" })
  assert.equal(inputEl().value, "c", "第 1 次 ↑ = 最新条目")
  pressKey({ key: "ArrowUp" })
  assert.equal(inputEl().value, "b", "第 2 次 ↑ 继续上溯（现门断裂点——修后不断）")
  pressKey({ key: "ArrowUp" })
  assert.equal(inputEl().value, "a", "第 3 次 ↑ 到最旧")
  pressKey({ key: "ArrowUp" })
  assert.equal(inputEl().value, "a", "第 4 次 ↑ 顶端钳制")
  assert.equal(W.ctx._inputDraft, "draft", "草稿 stash 在位")
})

// ─── T-MA10-2 正常：↓ 回落 + 草稿恢复（C-MA10-2）─────────────────────────────

test("T-MA10-2 接 T-MA10-1：↓→↓→↓ = b→c→草稿恢复（_historyIdx=-1 + _inputDraft 还原 + 吞键）", () => {
  reset({ history: ["a", "b", "c"], value: "draft" })
  pressKey({ key: "ArrowUp" })
  pressKey({ key: "ArrowUp" }) // b
  const notPrevented = pressKey({ key: "ArrowDown" })
  assert.equal(notPrevented, false, "历史态 ↓ 吞键（preventDefault）")
  assert.equal(inputEl().value, "c", "↓ 回落到较新条目")
  pressKey({ key: "ArrowDown" })
  assert.equal(inputEl().value, "draft", "越过最新 → 草稿恢复")
  assert.equal(W.ctx._historyIdx, -1, "复位为活动草稿态")
  assert.equal(W.ctx._inputDraft, "draft", "草稿内容保留")
})

// ─── T-MA10-3 边界：单行任意位置 ↑（C-MA10-3）───────────────────────────────

test("T-MA10-3 单行中段（selectionStart=5）↑ → 历史载入 + 草稿 stash", () => {
  reset({ history: ["old-1"], value: "hello world", caret: 5 })
  const notPrevented = pressKey({ key: "ArrowUp" })
  assert.equal(notPrevented, false, "单行 ↑ 恒吞键（任意位置）")
  assert.equal(inputEl().value, "old-1", "中段光标不阻断历史载入")
  assert.equal(W.ctx._inputDraft, "hello world", "草稿 stash")
})

// ─── T-MA10-4 边界：多行非边界零劫持（C-MA10-4）──────────────────────────────

test("T-MA10-4 多行 `aa\\nbb` 光标非边界（=1）↑/↓ → 零载入 + 零 preventDefault（原生竖移保留）", () => {
  reset({ history: ["old-1"], value: "aa\nbb", caret: 1 })
  const up = pressKey({ key: "ArrowUp" })
  assert.equal(up, true, "多行非边界 ↑ 不劫持")
  assert.equal(inputEl().value, "aa\nbb", "零历史载入")
  const down = pressKey({ key: "ArrowDown" })
  assert.equal(down, true, "多行非边界 ↓ 不劫持")
  assert.equal(inputEl().value, "aa\nbb", "零历史载入")
  assert.equal(W.ctx._historyIdx, -1, "历史指针未动")
})

// ─── T-MA10-5 边界：IME 守卫两分支（C-MA10-1①）──────────────────────────────

test("T-MA10-5 IME 组合期（isComposing / keyCode 229）↑/↓ → 零载入 + 零 preventDefault", () => {
  reset({ history: ["old-1"], value: "候选" })
  const up = pressKey({ key: "ArrowUp", isComposing: true })
  assert.equal(up, true, "isComposing ↑ 不处理")
  assert.equal(inputEl().value, "候选", "零载入")
  const down = pressKey({ key: "ArrowDown", keyCode: 229 })
  assert.equal(down, true, "keyCode 229 ↓ 不处理")
  assert.equal(inputEl().value, "候选", "零载入")
  assert.equal(W.ctx._historyIdx, -1, "历史指针未动")
})

// ─── T-MA10-6 边界：下拉让位（C-MA10-1②）────────────────────────────────────

test("T-MA10-6 #at-dropdown 打开 → ↑/↓ 零载入 + 零 preventDefault（让位不回归）", () => {
  reset({ history: ["old-1"], value: "" })
  W.atDropdown.style.display = "block"
  const up = pressKey({ key: "ArrowUp" })
  assert.equal(up, true, "下拉打开 ↑ 不处理")
  const down = pressKey({ key: "ArrowDown" })
  assert.equal(down, true, "下拉打开 ↓ 不处理")
  assert.equal(inputEl().value, "", "零载入")
  assert.equal(W.ctx._historyIdx, -1, "历史指针未动")
})

// ─── T-MA10-7 边界：多行边界门两向（C-MA10-4）───────────────────────────────

test("T-MA10-7 多行边界门：光标=0 ↑ 载入历史；光标=5（行末）↓ 吞键 + no-op", () => {
  reset({ history: ["old-1"], value: "aa\nbb", caret: 0 })
  const up = pressKey({ key: "ArrowUp" })
  assert.equal(up, false, "首行行首 ↑ 吞键触发")
  assert.equal(inputEl().value, "old-1", "边界门内载入历史")
  // 复位为多行非历史态，测末行行末 ↓
  reset({ history: ["old-1"], value: "aa\nbb", caret: 5 })
  const down = pressKey({ key: "ArrowDown" })
  assert.equal(down, false, "末行行末 ↓ 吞键")
  assert.equal(inputEl().value, "aa\nbb", "非历史态 ↓ no-op（无可回落）")
  assert.equal(W.ctx._historyIdx, -1, "历史指针未动")
})

// ─── T-MA10-8 边界：单行中段 ↓（C-MA10-3）───────────────────────────────────

test("T-MA10-8 单行中段（=5）非历史态 ↓ → 吞键（dispatchEvent false）+ 值不变 + _historyIdx 仍 −1", () => {
  reset({ history: ["old-1"], value: "hello world", caret: 5 })
  const notPrevented = pressKey({ key: "ArrowDown" })
  assert.equal(notPrevented, false, "单行 ↓ 恒吞键（任意位置）")
  assert.equal(inputEl().value, "hello world", "值不变（no-op）")
  assert.equal(W.ctx._historyIdx, -1, "零历史载入（指针仍 −1）")
  assert.equal(W.ctx._inputDraft, "", "未误写草稿")
})
