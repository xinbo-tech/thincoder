/**
 * 2026-09-30-window-maximize.test.mjs — 批内件（窗口重启最大化批 · 台账 #745 · 实施轮）。
 * 判据表 = 批档 `docs/batches/2026-09-30-window-maximize.md` §五（三腿）∥ 设计单源 = `docs/desktop/design/PROJECT.md` §2 KD-59。
 * 三腿（全绿 = 批内验收；扫描面 = `thincoder-desktop/src/main/window.mjs` 源面字面——该档顶层 import `electron`
 * ⇒ 不入 import，只读源）：
 *   腿 1 启动径含 maximize：`show: false` 在场（锚定构造函数选项块内）∥ `show: true` 零残留 ∥ `win.maximize()` 恰 1 处 ∥
 *        `win.show()` 恰 1 处 ∥ 序列 `show: false` → `win.maximize()` → `win.show()` 有序 ∥ 插点 = 构造函数后 ∥ `setMenu` 前；
 *   腿 2 判由在句：`win.maximize()` 前置近邻注（前 ~500 字符窗）携 `D31` ∥ 「永远」双锚（紧邻两行 = 注释）；
 *   腿 3 「永远」零记忆负控：窗口态族六名（`isMaximized` ∥ `unmaximize` ∥ `getBounds` ∥ `setBounds` ∥
 *        `setSize` ∥ `localStorage`）逐名零命中 ∥ `maximize(` 调用恰 1 处且无条件（零 `if` ∕ `&&` ∕ `||` ∕ `?` 包裹）。
 * 本件不入仓套件（批内件 · 随批留存）；跑法（仓根 `thincoder/`）：
 *   node --test docs/batches/2026-09-30-window-maximize.test.mjs
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const ROOT = process.cwd()
const SOURCE_PATH = resolve(ROOT, "thincoder-desktop/src/main/window.mjs")
let source
try {
  source = readFileSync(SOURCE_PATH, "utf8")
} catch {
  throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
}
const lines = source.split("\n")
const count = (haystack, needle) => haystack.split(needle).length - 1

/** 窗口态族六名（腿 3 扫描面——「永远」语义 = 零窗口态记忆：逐名零命中）。 */
const WINDOW_STATE_SYMBOLS = ["isMaximized", "unmaximize", "getBounds", "setBounds", "setSize", "localStorage"]

const MAXIMIZE_CALL = "win.maximize()"
const SHOW_CALL = "win.show()"
const createWindowStart = source.indexOf("export function createWindow")
const optionsStart = source.indexOf("new BrowserWindow(")
const optionsEnd = source.indexOf("})", optionsStart)
const setMenuIndex = source.indexOf("win.setMenu(")
const callIndex = source.indexOf(MAXIMIZE_CALL)
const callLine = lines.findIndex((line) => line.includes(MAXIMIZE_CALL))
/** 独立语句行定位（行 trim 后与语句逐字相等——排除注释旁证 ∥ 同行守卫形）。 */
const standaloneLine = (statement) => lines.findIndex((line) => line.trim() === statement)

// ─── 腿 1 · 启动径含 maximize（隐建 → maximize → show 有序）─────────────────────

test("腿 1 · 启动径含 maximize：隐建（show: false）→ maximize → show 有序 ∥ show: true 零残留", () => {
  const showFalseIndex = source.indexOf("show: false")
  assert.ok(showFalseIndex !== -1, "隐建 `show: false` 在场")
  assert.ok(optionsStart !== -1 && optionsEnd !== -1, "构造函数选项块定位成功")
  assert.ok(optionsStart < showFalseIndex && showFalseIndex < optionsEnd, "`show: false` = 构造函数选项块内（非注释旁证）")
  assert.equal(count(source, "show: true"), 0, "`show: true` 零残留")
  assert.equal(count(source, MAXIMIZE_CALL), 1, "`win.maximize()` 恰 1 处")
  assert.equal(count(source, SHOW_CALL), 1, "`win.show()` 恰 1 处")
  assert.notEqual(standaloneLine(MAXIMIZE_CALL), -1, "`win.maximize()` = 独立语句行")
  assert.notEqual(standaloneLine(SHOW_CALL), -1, "`win.show()` = 独立语句行")
  const order = [showFalseIndex, callIndex, source.indexOf(SHOW_CALL)]
  assert.ok(order.every((index) => index !== -1), `三元素皆命中：${order.join(" / ")}`)
  assert.ok(order[0] < order[1] && order[1] < order[2], `序列有序（show:false → maximize → show）：${order.join(" < ")}`)
  assert.ok(optionsEnd < callIndex && callIndex < setMenuIndex, "插点 = 构造函数后 ∥ `win.setMenu` 前")
})

// ─── 腿 2 · 判由在句（近邻注携 D31 ∥ 「永远」双锚）──────────────────────────────

test("腿 2 · 判由在句：`win.maximize()` 前置近邻注携 `D31` ∥ 「永远」", () => {
  assert.ok(callIndex !== -1, "`win.maximize()` 在盘")
  const near = source.slice(Math.max(0, callIndex - 500), callIndex)
  assert.ok(near.includes("D31"), "前 ~500 字符窗含 `D31` 锚")
  assert.ok(near.includes("永远"), "前 ~500 字符窗含「永远」锚")
  assert.ok(callLine >= 2, "调用行前有注释位")
  const above = lines.slice(callLine - 2, callLine)
  for (const line of above) assert.match(line, /^\s*\/\//, `紧邻两行 = 注释（判由注）：${line}`)
})

// ─── 腿 3 · 「永远」零记忆负控（窗口态族六名零命中 ∥ maximize 无条件恰 1 处）────

test("腿 3 · 「永远」零记忆负控：窗口态族六名零命中 ∥ `maximize` 恰 1 处且无条件", () => {
  for (const name of WINDOW_STATE_SYMBOLS) assert.equal(source.indexOf(name), -1, `零窗口态族符号：${name}`)
  assert.equal(count(source, "maximize("), 1, "`maximize` 调用恰 1 处")
  assert.ok(createWindowStart !== -1, "`createWindow` 在盘")
  assert.ok(createWindowStart < callIndex, "调用位于 `createWindow` 函数体内")
  assert.ok(!/\bif\b|&&|\|\||\?/.test(source.slice(createWindowStart, callIndex)), "调用前零条件包裹（`if` ∕ `&&` ∕ `||` ∕ `?`）")
  assert.equal(lines[callLine].trim(), MAXIMIZE_CALL, "调用 = 独立语句行（非同行守卫形）")
})
