/**
 * 2026-09-29-desktop-copy-vsc-align.test.mjs — 批内件（批次本地件惯例：名随批次档 · 住 `docs/batches/`（终位）· 不登记 · 随批留存）：复制面对齐 VSC 批机检面 —— `src/main/context-menu.mjs` 两纯函数平 node 直测
 * （三语境条目集 ∕ `editFlags` 启用径 ∕ 两语词值）。
 * 跑法（`thincoder/` 根）：`node --test docs/batches/2026-09-29-desktop-copy-vsc-align.test.mjs`。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { contextMenuLabels, contextMenuTemplate } from "../../thincoder-desktop/src/main/context-menu.mjs"

test("三语境 · 可编辑 ⇒ 四件（序 = cut → copy → paste → selectAll）", () => {
  const labels = contextMenuLabels("en")
  const items = contextMenuTemplate(
    { isEditable: true, selectionText: "", editFlags: { canCut: true, canCopy: true, canPaste: true, canSelectAll: true } },
    labels)
  assert.deepEqual(items.map((item) => item.role), ["cut", "copy", "paste", "selectAll"])
  assert.deepEqual(items.map((item) => item.label), ["Cut", "Copy", "Paste", "Select All"])
})

test("三语境 · 非编辑 ∧ 选中 ⇒ 复制 ∕ 全选（两件）", () => {
  const labels = contextMenuLabels("en")
  const items = contextMenuTemplate({ isEditable: false, selectionText: "hello", editFlags: { canCopy: true, canSelectAll: true } }, labels)
  assert.deepEqual(items.map((item) => item.role), ["copy", "selectAll"])
  assert.deepEqual(items.map((item) => item.label), ["Copy", "Select All"])
})

test("三语境 · 非编辑 ∧ 空选 ⇒ 零菜单（空数组——宿主不 popup）", () => {
  assert.deepEqual(contextMenuTemplate({ isEditable: false, selectionText: "" }, contextMenuLabels("en")), [])
  assert.deepEqual(contextMenuTemplate({}, contextMenuLabels("en")), [])
})

test("editFlags 启用径 · 逐键映射 + 假值禁用 + 缺键不禁用（键缺席）", () => {
  const items = contextMenuTemplate(
    { isEditable: true, selectionText: "", editFlags: { canCut: false, canCopy: false, canPaste: true } },
    contextMenuLabels("en"))
  assert.equal(items.find((item) => item.role === "cut").enabled, false)
  assert.equal(items.find((item) => item.role === "copy").enabled, false)
  assert.equal(items.find((item) => item.role === "paste").enabled, true)
  assert.equal("enabled" in items.find((item) => item.role === "selectAll"), false) // 缺键 ⇒ 键缺席（Electron 缺省可用）
})

test("两语词值 · en ∕ zh + 归一（zh-CN ⇒ zh）+ 未知 ⇒ en", () => {
  assert.deepEqual(Object.values(contextMenuLabels("en")), ["Cut", "Copy", "Paste", "Select All"])
  assert.deepEqual(Object.values(contextMenuLabels("zh")), ["剪切", "复制", "粘贴", "全选"])
  assert.deepEqual(Object.values(contextMenuLabels("zh-CN")), ["剪切", "复制", "粘贴", "全选"])
  assert.deepEqual(Object.values(contextMenuLabels("fr")), ["Cut", "Copy", "Paste", "Select All"])
  assert.deepEqual(Object.values(contextMenuLabels(undefined)), ["Cut", "Copy", "Paste", "Select All"])
})
