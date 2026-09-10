import { computeLayout } from "./layout.mjs"
import { createModelPicker } from "./model-picker.mjs"

/** Generic list picker plumbing + /model two-level surface delegation.
 *  MODEL-MERGE-SESSION 拆分（评审 #9）：/model 两级面（L1 provider → L2 模型行——
 *  2026-09-10 MODEL-SELECTION v2 起 L2 行 = 运行期拉取候选）+ 渠道
 *  管理流 + selectModel + pickModelForSlot 迁 model-picker.mjs——本文件只留通用 picker
 *  栈（showPicker/closePicker/popPicker/rebuildLines）——createModelPicker 以 ctx 接收
 *  通用绑定（showPicker/closePicker/renderPickerLines）再行装配——index.mjs 消费面不变。
 *  单一 Promise API：showPicker(title, entries, { defaultIndex }) → Promise<entry|null>。
 *  picker 栈：state.pickerStack，state.picker 始终指向栈顶（layout/render/key-handler 都只读 state.picker）。
 *  选中即关闭（Enter = resolve + pop）；Esc = pop 当前层并 resolve(null)。菜单循环由调用方 while 重开。 */
export function createPickers(ctx) {
  const { agent, state, render, ansi, C, pushLine, persistRaw, askQuestion, maskKey } = ctx

  state.pickerStack ??= []

  /** 当前 picker 过滤后的 item 列表（filter 大小写不敏感子串匹配，header 不参与） */
  function pickerItems(p) {
    const f = (p.filter ?? "").toLowerCase()
    return p.entries.filter((e) => e.type === "item" && (!f || e.text.toLowerCase().includes(f)))
  }

  /** 弹出栈顶 picker 并 resolve 其 Promise。返回是否有 picker 被弹出。 */
  function popPicker(value) {
    const p = state.pickerStack.pop()
    if (!p) return false
    state.picker = state.pickerStack.at(-1) ?? null
    if (state.picker) rebuildLines()
    else render()
    p.resolve(value)
    return true
  }

  /** 关闭所有 picker：清空栈，挂起者全部 resolve(null)。 */
  function closePicker() {
    while (state.pickerStack.length) popPicker(null)
  }

  /** 打开 picker，返回选中 entry（Esc/取消 → null）。
   *  互斥保护：入栈前把现有挂起 picker 全部 resolve(null)，消除 Promise 悬挂。
   *  （正常嵌套是先 await 上一层返回再开新的，栈深通常为 1。） */
  function showPicker(title, entries, { defaultIndex = 0 } = {}) {
    closePicker()
    return new Promise((resolve) => {
      const itemCount = entries.filter((e) => e.type === "item").length
      // No selectable items — resolve immediately instead of showing an empty picker
      if (itemCount === 0) { resolve(null); return }
      const index = Math.max(0, Math.min(defaultIndex, Math.max(0, itemCount - 1)))
      state.picker = { title, entries, lines: [], index, scroll: 0, selectedLine: 0, filter: "", resolve }
      state.pickerStack.push(state.picker)
      rebuildLines()
    })
  }

  function rebuildLines() {
    const p = state.picker
    if (!p) return
    const items = pickerItems(p)
    p.filteredItems = items
    if (p.index >= items.length) p.index = Math.max(0, items.length - 1)
    const lines = []
    let row = 0, selLine = 0
    for (const e of p.entries) {
      if (e.type === "header") {
        lines.push({ text: ` ${e.text}${e.note ? `  ${e.note}` : ""}`, color: ansi.bold + C.tool })
      } else {
        if (!items.includes(e)) continue // 被 filter 滤掉
        const sel = row === p.index
        if (sel) selLine = lines.length
        const marker = e.marker ? `  ${e.marker}` : ""
        lines.push({ text: `${sel ? " ▸ " : "   "}${e.text}${marker}`, color: sel ? ansi.bold + C.text : C.dim, _row: row })
        row++
      }
    }
    if (p.filter && items.length === 0) lines.push({ text: "   (no match)", color: C.dim })
    p.lines = lines
    p.selectedLine = selLine

    // Auto-scroll: keep selectedLine within the visible window.
    // Fallback to a reasonable default when computeLayout can't run (e.g. test mocks without full state)
    let winH
    try {
      winH = Math.max(1, (computeLayout(state, { cols: (state.dims?.get() ?? {}).cols ?? (process.stdout.columns || 80), rows: (state.dims?.get() ?? {}).rows ?? (process.stdout.rows || 24) }).panels.picker?.h ?? lines.length + 1) - 1)
    } catch {
      winH = 8 // safe fallback for test mocks
    }
    if (p.selectedLine < p.scroll) p.scroll = p.selectedLine
    if (p.selectedLine >= p.scroll + winH) p.scroll = p.selectedLine - winH + 1
    p.scroll = Math.max(0, Math.min(p.scroll, Math.max(0, lines.length - winH)))

    render()
  }

  function renderPickerLines() { rebuildLines() }

  // /model 两级面 + selectModel + 渠道管理 + pickModelForSlot —— 迁 model-picker.mjs
  // （MODEL-MERGE-SESSION——pick 后本文件 ≤450）。createModelPicker 返回同名单函数，
  // 经本层原样转发（index.mjs/wizard/slash-commands 消费面零变化）。
  const modelPicker = createModelPicker({
    agent, state, render, ansi, C, pushLine, persistRaw, askQuestion, maskKey,
    showPicker, closePicker, renderPickerLines,
  })

  return { showPicker, closePicker, popPicker, renderPickerLines, ...modelPicker }
}
