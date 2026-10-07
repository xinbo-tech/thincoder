/**
 * settings-consult-dialog.js — 会诊添加弹窗（添加入口弹窗统一批 · 2026-10-07 · 台账 #1054）。
 *
 * 设计单源 = `docs/vsc/design/SETTINGS.md` §2.17 ②：单例开合 ∥ 开框重置 ∥ 五路关（提交〔守卫通过
 * 才追加 + 关〕∥ 取消 ∥ 背板 ∥ 框内 Esc〔`stopPropagation`——不连带关设置面板〕∥ `closeSettings()`
 * 同清）∥ 初始焦点 = 模型选择件。两字段 = provider ∥ model（显示值——`.key-field` 标签 + 值 span）；
 * 模型选择件 = 既有浮层复用（`openModelMenu`——点选回填两字段；关框同清浮层）。
 * 提交径 = 追加完整行（provider + model）进 `#consult-rows` ⇒ 派 `consult-rows-changed`（既有保存链）
 * ⇒ 关框；行族件（`mountSlot` ∥ `setRowModel`）= 既有单点复用（本档只承「行追加口」）。
 * 上限 5 判据（与入口钮 disabled 同判）：提交守卫 = 不齐 ∥ 满 ⇒ 零发送。
 * 层序前提（浮层与弹窗同屏——本面）：浮层（`mm-overlay` z 1000 ∥ `mm-panel` 1001 ∥ `mm-flyout` 1002，
 * 挂 `document.body` 尾）与弹窗（幕 z 999 ∥ 卡 z 1000）同层（1000）以挂载序破平——后开者在上；
 * 浮层由框内点按开启（晚于弹窗挂载）⇒ 恒在弹窗之上；`closeConsultDialog` 同清浮层 ⇒ 关框零残留。
 * 零新 CSS（`.settings-dialog` ∥ `.settings-card-body` ∥ `.settings-subtitle` ∥ `.key-field` ∥ `.key-btn` 复用）。
 */
import { t } from "./i18n.js"
import { openModelMenu, closeModelMenu } from "./model-menu.js"
import { SS, labelFor } from "./settings-state.js"
import { mountSlot, setRowModel } from "./settings-models.js"

/** 开框建面的实件面（关框即弃——模块内唯一持有；`null` = 框不在场）。 */
let _els = null

/** 本框当前选型（`{ provider, model }` | `null`——点选回填；关框 ∥ 开框重置）。 */
let _picked = null

/** 体件：label + 控件（`.key-field` 形——字段样式复用）。 */
function field(labelText, control) {
  const wrap = document.createElement("div")
  wrap.className = "key-field"
  const label = document.createElement("label")
  label.textContent = labelText
  wrap.append(label, control)
  return wrap
}

/** 两显示值刷新（provider = 渠道显示名 ∥ model = 字面；未选 ⇒ `—`——零假造）。 */
function renderPicked() {
  if (!_els) return
  _els.providerSpan.textContent = _picked ? labelFor(_picked.provider) : "—"
  _els.modelSpan.textContent = _picked ? _picked.model : "—"
}

/** 建两件（框幕 + 卡）并挂 `document.body`：标题 + 两字段（显示值）+ 模型选择件 + 提交 ∥ 取消。 */
function buildDialog() {
  const backdrop = document.createElement("div")
  backdrop.className = "settings-dialog-backdrop"
  backdrop.addEventListener("click", closeConsultDialog)

  const card = document.createElement("div")
  card.id = "consult-add-dialog"
  card.className = "settings-dialog"
  card.setAttribute("role", "dialog")
  card.setAttribute("aria-modal", "true")
  card.setAttribute("aria-label", t("settings.consultAddTitle"))
  // 框内 Esc：拦截冒泡 ⇒ 不连带执行 chat.js 的「关设置面板」分支（面板保持打开——沿确认弹框同判）
  card.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return
    e.stopPropagation()
    closeConsultDialog()
  })

  const body = document.createElement("div")
  body.className = "settings-card-body"
  const subtitle = document.createElement("div")
  subtitle.className = "settings-subtitle"
  subtitle.textContent = t("settings.consultAddTitle")

  const providerSpan = document.createElement("span")
  providerSpan.id = "consult-provider-value"
  const modelSpan = document.createElement("span")
  modelSpan.id = "consult-model-value"

  // 模型选择件 = 既有浮层复用（点选回填两字段——再开时以本框现值标选中）
  const pickBtn = document.createElement("button")
  pickBtn.id = "consult-pick-btn"
  pickBtn.className = "key-btn"
  pickBtn.type = "button"
  pickBtn.textContent = t("settings.pickModel")
  pickBtn.addEventListener("click", () => openModelMenu({
    anchorEl: pickBtn,
    models: SS.getModels?.() || [],
    value: _picked,
    onPick: (picked) => { _picked = picked; renderPicked() },
  }))

  const submitBtn = document.createElement("button")
  submitBtn.id = "consult-save-btn"
  submitBtn.className = "key-btn"
  submitBtn.textContent = t("settings.consultAdd")
  submitBtn.addEventListener("click", submitConsult)

  const cancelBtn = document.createElement("button")
  cancelBtn.id = "consult-cancel-btn"
  cancelBtn.className = "key-btn"
  cancelBtn.textContent = t("settings.cancel")
  cancelBtn.addEventListener("click", closeConsultDialog)

  body.append(
    subtitle,
    field(t("settings.consultProvider"), providerSpan),
    field(t("settings.model"), modelSpan),
    pickBtn,
    submitBtn,
    cancelBtn,
  )
  card.appendChild(body)
  document.body.append(backdrop, card)
  return { backdrop, card, providerSpan, modelSpan, pickBtn }
}

/** 开框（单例：已在框 ⇒ 零动作）：建两件 + 开框重置（选型清——两字段回 `—`）+ 初始焦点 = 选择件（+50ms）。 */
export function openConsultDialog() {
  if (document.getElementById("consult-add-dialog")) return
  _picked = null
  const els = buildDialog()
  _els = els
  renderPicked()
  // 初始焦点 = 模型选择件（+50ms——元素引用先行捕获：框在定时器到期前关闭 ⇒ 焦对已摘节点
  // = 零动作，不取模块态重查，沿 `settings-provider-dialog.js` 先例）
  setTimeout(() => els.pickBtn.focus(), 50)
}

/** 关框（五路同效的清除入口，幂等）：同清浮层 + 卡 ∥ 幕两件同清（只清自身两件——#1054 跨框互清收正）。 */
export function closeConsultDialog() {
  if (!_els) return
  closeModelMenu()
  _els.card.remove()
  _els.backdrop.remove()
  _els = null
  _picked = null
}

/** 提交（守卫通过才追加 + 关）：不齐 ∥ 满 ⇒ 零发送；通过 ⇒ 追加完整行（provider + model）——
 *  复用行族两件（`mountSlot` 挂槽 ∥ `setRowModel` 落 dataset + effort + 派 `consult-rows-changed`）⇒ 关框。 */
function submitConsult() {
  const rows = document.getElementById("consult-rows")
  if (!rows || !_picked || !_picked.provider || !_picked.model) return
  if (rows.querySelectorAll(".consult-row").length >= 5) return
  const row = document.createElement("div")
  row.className = "key-field consult-row"
  row.innerHTML = `<span class="consult-model-slot"></span><button class="consult-del" title="${t("settings.consultRemove")}">✕</button>`
  rows.appendChild(row)
  mountSlot(row.querySelector(".consult-model-slot"), {
    provider: _picked.provider,
    model: _picked.model,
    onPick: ({ provider, model }) => setRowModel(row, provider, model),
  })
  setRowModel(row, _picked.provider, _picked.model)
  closeConsultDialog()
}
