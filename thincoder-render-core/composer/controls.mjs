/**
 * controls.mjs — 控件行七钮 + 模式钮两态 + AUTO 确认工厂（核化 VSC `webview/mode-buttons.js`(131) +
 * `index.html:53-63` 控件行结构——上提批 `2026-09-28-desktop-input-vsc-align.md` §2.3 ∕ §2.4 P8；
 * 模块级副作用（DOM 查询 ∕ 事件注册 ∕ `vscode.*` 直调）搬进工厂体，语义零变）。
 *
 * 面：
 *  - 结构七钮（`#model-btn` ∕ `#reasoning-btn` ∕ `#auto-btn` ∕ `#advisor-btn` ∕ `#eng-btn` ∕ `#plan-btn` ∕
 *    `#settings-btn`——title ∕ aria-label ∕ 静止字面照 `index.html` 逐字；`Send` ∕ `Stop` 族静态字面口径 = C4）。
 *    模型 ∕ 推理两钮的接线与两浮层归 `model-menu.mjs`（本档只造钮 + 给出引用）。
 *  - 模式钮两态（`mode-buttons.js:19-50` 逐字）：advisor ∕ eng 两态类；ENG×PLAN 互斥（工程态 ⇒ plan 钮
 *    `disabled` + `toolbar.planDisabled` 题注 + 不亮 active）；plan 点击守卫兜底。
 *  - AUTO 两态 + 内联确认（`:52-111` 逐字）：关无确认；开走 popover（背板 + alertdialog，焦点默认落取消）；
 *    两出口 = yes 置位 + `⚠ AUTO` / no 关；Esc 关（源 = `chat.js:107-108` 本件部分——确认在场期注册监听）。
 *  - 推送面（`:106-130` 三 handler 逐字）：`autoApprove` ∕ `agentSettings` ∕ `planMode` ⇒ 镜像 + 重绘
 *    （`planMode` 兼 `#input-row.plan-active` 与状态行刷新）。
 *
 * 注入面（五项之局部）：② `post`（`setAdvisorGuard` ∕ `setEngineeringEnabled` ∕ `setPlanMode` ∕
 * `setAutoApprove` 出站）；③ `state`（模式位读面：`flags()`——**构造期初值即落面**：`paintFlags()` 同点重绘，
 * 缺省 flags 下与 VSC 静态 HTML 起始面逐字同形）；⑤ `hooks`（`openSettings` 第 7 钮出口 ·
 * `syncModeState` 跨面状态同步（status-bar 同面读 `_planActive`）· `onStatusRefresh`（`:129`）·
 * `onAgentSettings`（`:117-118`——VSC 绑设置面板刷新的 `updateAgentSettings`））；④ 取词 = 核 `../i18n.mjs`。
 */
import { t } from "../i18n.mjs"

/**
 * 控件行工厂。`deps`：`post` ∕ `state.flags()` 读面 ∕ `hooks`（见件头）· `inputRow`（`#input-row`——plan-active 类宿主）·
 * `inputEl`（浮层关后回焦）。返回：`{ el, modelBtn, reasoningBtn, applyModeButtons, applyAutoApprove,
 * applyAgentSettings, applyPlanMode, syncModeState, toggleAuto, togglePlan, toggleEng }`——三 toggle = 各钮 handler
 * 提取件（斜径 `/auto` ∥ `/plan` ∥ `/eng` 同钮同门消费；见其函数注）。
 */
export function createControlsRow({ post, state = {}, hooks = {}, inputRow, inputEl } = {}) {
  const row = document.createElement("div")
  row.id = "controls-row"

  const ctrlBtn = (id, extraClass, title, ariaLabel, text, aria) => {
    const btn = document.createElement("button")
    btn.id = id
    btn.className = extraClass ? `ctrl-btn ${extraClass}` : "ctrl-btn"
    btn.title = title
    btn.setAttribute("aria-label", ariaLabel)
    if (aria) btn.setAttribute("aria-haspopup", aria)
    btn.textContent = text
    row.appendChild(btn)
    return btn
  }
  const modelBtn = ctrlBtn("model-btn", "", "Change model", "Change model", "...", "listbox")
  const reasoningBtn = ctrlBtn("reasoning-btn", "active", "Reasoning effort", "Reasoning effort", "max", "listbox")
  const autoBtn = ctrlBtn("auto-btn", "", "Auto-approve tools", "Toggle auto-approve", "AUTO")
  const advisorBtn = ctrlBtn("advisor-btn", "", "Advisor review", "Toggle advisor review", "ADVISOR")
  const engBtn = ctrlBtn("eng-btn", "", "Engineering mode", "Toggle engineering mode", "ENG")
  const planBtn = ctrlBtn("plan-btn", "", "Plan mode (read-only exploration)", "Toggle plan mode", "PLAN")
  const settingsBtn = ctrlBtn("settings-btn", "", "Settings", "Open settings", "⚙")

  /** plan 按钮缺省 title（静态 HTML——i18n-dom 不管 plan 面）：非工程态回填用。 */
  const planDefaultTitle = planBtn.title

  // ── 模式位（读面初值 → 面内核态；变更经 `syncModeState` 回端）──
  const init = state.flags?.() ?? {}
  let _autoApprove = init.autoApprove === true
  let _advisorOn = init.advisorGuard === true
  let _engOn = init.engineering === true
  let _planActive = init.planMode === true

  /** 跨面状态同步（⑤ 注入）——VSC 绑 = S 三 ∕ 四位镜像（status-bar 同面读 `_planActive`）。 */
  function syncModeState() {
    hooks.syncModeState?.({ autoApprove: _autoApprove, advisorGuard: _advisorOn, engineering: _engOn, planMode: _planActive })
  }

  /** 钮面重绘（内态 → 面）：构造期初绘 ∥ AUTO 推送 ∕ 点击终点共用；不含跨面同步（见 `syncModeState`）。 */
  function paintFlags() {
    applyModeButtons()
    autoBtn.classList.toggle("active", _autoApprove)
    autoBtn.classList.toggle("warning", _autoApprove)
    autoBtn.textContent = _autoApprove ? "⚠ AUTO" : "AUTO"
  }

  function applyModeButtons() {
    advisorBtn.classList.toggle("active", _advisorOn)
    advisorBtn.classList.toggle("warning", _advisorOn)
    engBtn.classList.toggle("active", _engOn)
    engBtn.classList.toggle("warning", _engOn)
    // ENG-PLAN-EXCLUSION（FR31 ② / AC13——宿主 `_setPlanMode` 拒绝的回弹口径）：工程模式 ⇒
    // plan 面排除——按钮 disabled + title（新键 `toolbar.planDisabled`，两 locale 同步）+ 不亮
    // active 类（半状态不呈现）。非工程态逐字回落既有形态。
    const planActive = _planActive === true && _engOn !== true
    planBtn.classList.toggle("active", planActive)
    planBtn.classList.toggle("warning", planActive)
    planBtn.disabled = _engOn === true
    planBtn.title = _engOn === true ? t("toolbar.planDisabled") : planDefaultTitle
  }

  advisorBtn.addEventListener("click", () => {
    _advisorOn = !_advisorOn
    applyModeButtons()
    post("setAdvisorGuard", { value: _advisorOn })
    syncModeState()
  })

  /** 三 toggle handler **提取件**（`docs/render-core/design/RENDER-CORE.md` §5 条 6 动作句柄面）：斜径
   *  `/auto` ∥ `/plan` ∥ `/eng` 与各钮点击走**同一函数**（同钮同门——门随函数）。返值 = 斜径契约：
   *  `true` = **已受理**（已执行 ∨ 二段交互在场）· `false` = 未受理（门拒 ⇒ 面板层出条目 `rejectKey` toast）；
   *  钮径忽略返值 ⇒ **零行为改**。三钮均无忙态门（机制差异在册——桌面钮径本就忙期可用，见 §2.3）。 */
  function toggleAuto() {
    if (!_autoApprove) {
      // Show inline confirmation instead of blocked confirm()
      showAutoConfirm()
      return true // 二段交互在场 = 已受理（`/auto` 确认 popover 径同判：popover 在场 = 文本使命已尽）
    }
    // Turning OFF — no confirmation needed
    _autoApprove = false
    paintFlags()
    post("setAutoApprove", { value: false })
    syncModeState()
    return true
  }

  function togglePlan() {
    // ENG-PLAN-EXCLUSION（FR31 ②）：工程模式点击守卫（disabled 的兜底——不依赖宿主回弹）。
    if (_engOn === true) return false // 门拒（斜径 ⇒ 面板层出 `rejectKey` = `toolbar.planDisabled`）
    _planActive = !_planActive
    applyModeButtons()
    post("setPlanMode", { value: _planActive })
    syncModeState()
    return true
  }

  function toggleEng() {
    _engOn = !_engOn
    applyModeButtons()
    post("setEngineeringEnabled", { value: _engOn })
    syncModeState()
    return true
  }

  engBtn.addEventListener("click", toggleEng)
  planBtn.addEventListener("click", togglePlan)
  settingsBtn.addEventListener("click", () => hooks.openSettings?.())
  autoBtn.addEventListener("click", toggleAuto)

  function showAutoConfirm() {
    const existing = document.querySelector(".auto-confirm")
    if (existing) existing.remove()
    // A stale backdrop from a previous invocation would block clicks on the UI.
    document.querySelector(".auto-backdrop")?.remove()

    const backdrop = document.createElement("div")
    backdrop.className = "auto-backdrop"

    const popover = document.createElement("div")
    popover.className = "auto-confirm"
    popover.setAttribute("role", "alertdialog")
    popover.setAttribute("aria-label", t("toolbar.autoApprove"))
    popover.innerHTML = `<div class="auto-confirm-text">${t("auto.confirmText")}</div>
    <div class="auto-confirm-actions">
      <button class="auto-confirm-yes" aria-label="${t("auto.enable")}">${t("auto.enable")}</button>
      <button class="auto-confirm-no" aria-label="${t("auto.cancel")}">${t("auto.cancel")}</button>
    </div>`

    document.body.appendChild(backdrop)
    document.body.appendChild(popover)
    // Focus the cancel button (safer default)
    setTimeout(() => popover.querySelector(".auto-confirm-no")?.focus(), 50)

    const close = () => {
      document.removeEventListener("keydown", onKeydown)
      popover.remove()
      backdrop.remove()
      inputEl.focus()
    }
    // Esc 关（B18 第二出口；源 = VSC `chat.js:107-108` 的 auto-confirm 段）：在场期注册，关即摘。
    const onKeydown = (e) => { if (e.key === "Escape") close() }
    document.addEventListener("keydown", onKeydown)

    backdrop.addEventListener("click", () => close())
    popover.querySelector(".auto-confirm-yes").addEventListener("click", () => {
      close()
      _autoApprove = true
      paintFlags()
      post("setAutoApprove", { value: true })
      syncModeState()
    })
    popover.querySelector(".auto-confirm-no").addEventListener("click", close)
  }

  /** autoApprove message: extension pushed the current flag (e.g. on startup). */
  function applyAutoApprove(m) {
    _autoApprove = m.value
    paintFlags()
    syncModeState()
  }

  /**
   * agentSettings message: refresh the settings panel (via ⑤ `onAgentSettings`——VSC 绑
   * `updateAgentSettings`) and mirror the advisor/engineering flags onto the quick-switch buttons.
   */
  function applyAgentSettings(m) {
    hooks.onAgentSettings?.(m.settings || {})
    _advisorOn = !!(m.settings?.advisor?.guard)
    _engOn = !!(m.settings?.engineering)
    applyModeButtons()
    syncModeState()
  }

  /** planMode message: toggle the plan styling, button state, and status bar. */
  function applyPlanMode(m) {
    _planActive = m.active
    inputRow.classList.toggle("plan-active", _planActive)
    applyModeButtons()
    syncModeState()
    hooks.onStatusRefresh?.() // VSC `:129` renderStatusBar（唯一 writer）——状态行刷新归端（本条无相位变化）
  }

  // 构造期初绘一次（③ `flags()` 读面 → 钮面 ∥ AUTO 面同点落位）：VSC 侧不可达「内态与钮面分离」态（其
  // `_advisorOn ∕ _engOn ∕ _autoApprove ∕ _planActive` 只经「必重绘」的推送 ∕ 点击入口写入）；本核多一个读面
  // 初值 ⇒ 同点补绘。缺省 flags（全假）下与 VSC 静态 HTML 起始面逐字同形（零差）；无跨面同步（构造非状态变更）。
  paintFlags()

  return { el: row, modelBtn, reasoningBtn, applyModeButtons, applyAutoApprove, applyAgentSettings, applyPlanMode, syncModeState, toggleAuto, togglePlan, toggleEng }
}
