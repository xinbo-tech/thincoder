/**
 * mouse-sane-gate.test.mjs — RESIZE-MOUSE-LEAK-FIX F-3 sane-gate 测试（2026-09-09——设计档
 * RESIZE-MOUSE-LEAK-FIX.md）。落点 ① handleMouseClick 入口 + ② handleWheel 入口
 * （mouse.mjs）——越界丢弃（col > cols || row > rows——> 非 >=——末行列合法）、正常坐标不回归；
 * ③ index.mjs 滚轮 fallback 前拦截与 ①② 共用同一 mouseOob 判定（判定本体在 mouse.mjs 锁测
 * ——index.mjs 的 startTUI 数据闭包无单测缝——与既有 index 内部路径同测试面边界）。
 * 确定性单元（computeLayout 纯函数面——queued-stop 同款桩）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { handleMouseClick, handleWheel, mouseOob } from "../src/tui/mouse.mjs"
import { computeLayout } from "../src/tui/layout.mjs"

/** 最小 state（computeLayout 读取面全覆盖——queued-stop 同款）。 */
function mkState(dims, over = {}) {
  return {
    input: "", cursor: 0, tasks: [], lines: [], scroll: 0, subTasks: {},
    search: null, interruptPrompt: null, question: null, picker: null, permission: null,
    wizard: null, expandedBlocks: new Set(), _frozenSubKeys: new Set(),
    streaming: "", reasoning: "", foldEnabled: true, dims: { get: () => dims },
    ...over,
  }
}

test("F-3 sane-gate ①：越界点击丢弃——正常坐标与末列点击不回归", () => {
  const dims = { cols: 40, rows: 24 }
  const state = mkState(dims, {
    picker: { entries: [{ type: "item" }], filteredItems: [{ type: "item", label: "x" }], lines: [{ _row: 0 }], scroll: 0 },
  })
  const pickerRow = computeLayout(state, dims).panels.picker.y + 2 // picker 首内容行（1-based——同 queued-stop 几何契约）
  const acted = []
  const ctx = (s) => ({ state: s, render() {}, popPicker: (i) => acted.push(i) })

  // 正常坐标不回归：动作执行（popPicker 真动作——gate 只拦越界）
  assert.equal(handleMouseClick(ctx(state), 2, pickerRow), true, "合法坐标点击被消费")
  assert.equal(acted.length, 1, "动作执行")
  // 末列合法（> 非 >=）
  acted.length = 0
  assert.equal(handleMouseClick(ctx(state), dims.cols, pickerRow), true, "col == cols 点击被消费")
  assert.equal(acted.length, 1, "末列点击动作执行（末列不误丢）")
  // 越界 → 丢弃（零动作零消费）
  acted.length = 0
  assert.equal(handleMouseClick(ctx(state), dims.cols + 1, pickerRow), false, "col > cols 丢弃")
  assert.equal(acted.length, 0, "越界点击零动作")
  assert.equal(handleMouseClick(ctx(state), 2, dims.rows + 1), false, "row > rows 丢弃")
})

test("F-3 sane-gate ①/② 短路证明：越界丢弃在 computeLayout 前——边界坐标穿过 gate", () => {
  // tasks 缺失 → computeLayout 必抛（state.tasks.length）——越界若 gate 失效会命中 layout
  // （抛错分叉观察：短路 = 干净 false；边界穿过 = 抛 = 到达旧路径）
  const dims = { cols: 40, rows: 24 }
  const bad = mkState(dims, { tasks: undefined })
  assert.equal(handleMouseClick({ state: bad, render() {}, popPicker() {} }, dims.cols + 1, dims.rows), false, "click 越界 col 短路（不触 layout）")
  assert.equal(handleWheel({ state: bad }, 65, dims.cols, dims.rows + 1), false, "wheel 越界 row 短路（不触 layout）")
  assert.throws(() => handleMouseClick({ state: bad, render() {}, popPicker() {} }, dims.cols, dims.rows), "click 边界（col == cols 且 row == rows）穿过 gate 到旧路径")
  assert.throws(() => handleWheel({ state: bad }, 65, dims.cols, dims.rows), "wheel 边界 row == rows 穿过 gate 到旧路径")
})

test("F-3 sane-gate ②：越界滚轮丢弃——正常坐标不回归", () => {
  const dims = { cols: 40, rows: 24 }
  const state = mkState(dims)
  const wheel = (col, row) => handleWheel({ state }, 65, col, row)
  assert.equal(wheel(dims.cols + 1, 10), false, "col > cols 滚轮丢弃（不落面板）")
  assert.equal(wheel(10, dims.rows + 1), false, "row > rows 滚轮丢弃（不落面板）")
  assert.equal(wheel(10, 10), false, "合法坐标滚轮语义不变——未命中块 = 未消费（会话滚动面——index ③ 门控）")
})

test("F-3 sane-gate ③ 契约（index 滚轮 fallback 越界禁滚）", () => {
  // index.mjs 的 ③ 在 startTUI 数据闭包内（无单测缝——与既有 index 内部路径同边界）——
  // 此处锁 ③ 赖以成立的契约对（index :217-220 与 ①② 共用同一 mouseOob 判定 + 同一 dims 来源）：
  // 越界 wheel：mouseOob=true（index 将 continue 跳过整分支——会话滚动零发生）
  // + handleWheel=false（未消费——若无 ③ 拦截即穿到 fallback 滚动——③ 为唯一拦点）
  const dims = { cols: 40, rows: 24 }
  const state = mkState(dims, { _hasOlder: false })
  const oob = { col: dims.cols + 1, row: 5 } // 滚上（button 64）越界——fallback 若触发会 scroll += 3
  assert.equal(mouseOob(oob.col, oob.row, dims), true, "③ skip 判定成立（index 分支整跳过——不消费不滚动）")
  assert.equal(handleWheel({ state }, 64, oob.col, oob.row), false, "越界 wheel 未消费——无 ③ 会穿到 fallback（落点必要性）")
  assert.equal(state.scroll, 0, "会话滚动零发生（index ③ 拦下后的终态）")
  // 对照：合法坐标同按钮 = 未消费 false——fallback 会话滚动合法拥有该路径（③ 只拦越界）
  assert.equal(mouseOob(10, 5, dims), false, "合法坐标 skip 判定不成立")
  assert.equal(handleWheel({ state }, 64, 10, 5), false, "合法坐标未命中块 = 未消费（会话滚动语义保留）")
})
