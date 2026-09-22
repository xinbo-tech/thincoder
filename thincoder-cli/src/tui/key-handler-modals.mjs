import { computeLayout } from "./layout.mjs"

/** 模态族之一（2026-09-22 structure-debt §2.1 分族 2 · #226）：通用列表 picker——
 *  ↑↓/PgUp/PgDn/Home/End 导航 + 输入即过滤 + Enter 选中 + Esc 取消；块体自 key-handler.mjs
 *  createKeyHandler 逐字搬移（仅去缩进；函数体自持原块入口判定）。
 *  路由 = 分派器 createKeyHandler（守卫 = 同一条原块入口条件 `state.picker`）。 */
export function handlePickerKeys(str, key, ctx) {
  const { state, renderPickerLines, popPicker } = ctx
  // generic list picker: ↑↓/PgUp/PgDn/Home/End 导航，输入即过滤，Enter 选中，Esc 取消
  if (state.picker) {
    const p = state.picker
    const items = p.filteredItems ?? p.entries.filter((e) => e.type === "item")
    // 可视窗高度：直接取 layout 算出的实际 picker 面板高（含小终端 pickerFinalH 压缩），减标题行。
    // 单一数据源，避免与 layout.mjs 公式漂移
    const winH = Math.max(1, (computeLayout(state, { cols: (state.dims?.get() ?? {}).cols ?? (process.stdout.columns || 80), rows: (state.dims?.get() ?? {}).rows ?? ((state.dims?.get() ?? {}).rows ?? (process.stdout.rows || 24)) }).panels.picker?.h ?? p.lines.length + 1) - 1)
    const applyFilter = (f) => {
      p.filter = f
      p.index = 0
      p.scroll = 0
      renderPickerLines()
    }
    if (key.name === "escape") {
      popPicker(null)
    } else if (key.name === "up" && items.length) {
      p.index = (p.index - 1 + items.length) % items.length
      renderPickerLines()
    } else if (key.name === "down" && items.length) {
      p.index = (p.index + 1) % items.length
      renderPickerLines()
    } else if (key.name === "pageup" && items.length) {
      p.index = Math.max(0, p.index - winH)
      renderPickerLines()
    } else if (key.name === "pagedown" && items.length) {
      p.index = Math.min(items.length - 1, p.index + winH)
      renderPickerLines()
    } else if (key.name === "home" && items.length) {
      p.index = 0
      renderPickerLines()
    } else if (key.name === "end" && items.length) {
      p.index = items.length - 1
      renderPickerLines()
    } else if (key.name === "backspace") {
      if (p.filter) applyFilter(p.filter.slice(0, -1))
    } else if ((key.name === "return" || key.name === "enter" || str === "\r") && items.length) {
      popPicker(items[p.index]) // 选中即关闭
    } else if (str && !key.ctrl && !key.meta) {
      // 输入即过滤；粘贴的多行文本先去换行（与输入框清洗口径一致），仍含控制字符则整段丢弃
      const text = str.replace(/[\r\n]+/g, "")
      if (text && !/[\x00-\x1f\x7f]/.test(text)) applyFilter(p.filter + text)
    }
    return
  }
}

/** 模态族之二（分族 2 · #226）：初始配置 wizard——menu step ↑↓/Enter/Esc；text step Enter 提交 /
 *  Esc 取消，其余编辑键回落至编辑族（落空面由分派器守卫与块内返回点共同界定）。
 *  路由 = 分派器 createKeyHandler。 */
export function handleWizardKeys(str, key, ctx) {
  const { state, renderWizard, cancelWizard, wizardProviderItems, wizardChooseProvider, wizardSubmitText } = ctx
  // initial config wizard: menu step ↑↓/Enter/Esc; text step Enter submit, Esc cancel, edit keys fall through to normal input
  if (state.wizard) {
    const w = state.wizard
    if (key.name === "escape") {
      cancelWizard()
      return
    }
    if (w.step === "provider") {
      const items = wizardProviderItems()
      if (key.name === "up" && items.length) {
        w.index = (w.index - 1 + items.length) % items.length
        renderWizard()
      } else if (key.name === "down" && items.length) {
        w.index = (w.index + 1) % items.length
        renderWizard()
      } else if ((key.name === "return" || key.name === "enter" || str === "\r") && items.length) {
        wizardChooseProvider(items[w.index])
      }
      return
    }
    if (key.name === "return") {
      wizardSubmitText()
      return
    }
    // text steps: block scroll/history, remaining edit keys fall through to normal input logic below
    if (key.name === "up" || key.name === "down" || key.name === "pageup" || key.name === "pagedown") return
  }
}
