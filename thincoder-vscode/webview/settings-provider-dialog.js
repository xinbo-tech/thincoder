/**
 * settings-provider-dialog.js — provider 添加弹窗（表单族自 `settings-providers.js` 析出）。
 *
 * 三端对齐批（2026-10-07 · 台账 #1027 / #1028 / #1029 / #1031 / #1033）——设计单源 =
 * `docs/vsc/design/SETTINGS.md` §2.16：单例开合 ∥ 开框重置 ∥ 五路关（保存 ∥ 取消 ∥ 背板 ∥
 * 框内 Esc〔stopPropagation——不连带关设置面板〕∥ `closeSettings()` 同清）∥ 框实例代际
 * （在飞探果跨框零污染）∥ 字段序 = 用户填写序（名称→baseURL→格式→API Key→走 proxy→拉取→模型）。
 *
 * 框幕 = 独立类 `.settings-dialog-backdrop`（z 999——不入确认族共用类 `.auto-backdrop`：
 * 确认族帚扫站点零误扫）；卡 = `#prov-add-dialog` + 新类 `.settings-dialog`（z 1000）。
 * 两件挂 `document.body`（卡外于 providers 卡 ⇒ 卡重绘不触碰在编弹窗）。
 */
import { t } from "./i18n.js"
import { SS } from "./settings-state.js"
import { flashSaved } from "./settings-widgets.js"

/** 框实例代际（开 ∥ 关自增）∥ 最近一次拉取发起时的代际（落框前比对——不符 ⇒ 弃）。 */
let _addDialogEpoch = 0
let _fetchEpoch = 0

/** 开框建面的实件面（关框即弃——模块内唯一持有；`null` = 框不在场）。 */
let _els = null

/** 体件：label + 控件（`.key-field` 形——字段样式复用）。 */
function field(labelText, control) {
  const wrap = document.createElement("div")
  wrap.className = "key-field"
  const label = document.createElement("label")
  label.textContent = labelText
  wrap.append(label, control)
  return wrap
}

/** 预设信息 ∥ 自定形两条件块随类型切换（弹窗内直绑——无全局出入口）。 */
function paTypeChanged() {
  if (!_els) return
  const type = _els.type.value
  if (type === "custom") {
    _els.presetInfo.style.display = "none"
    _els.customFields.style.display = "block"
    _els.customTail.style.display = "block"
    return
  }
  const p = (SS.providerStatus.presets || []).find((x) => x.name === type)
  _els.presetInfo.style.display = "block"
  _els.customFields.style.display = "none"
  _els.customTail.style.display = "none"
  // MODEL-SELECTION：预设行显单值默认模型（候选清单字段已退场）
  _els.presetInfo.textContent = p ? `${p.model || t("settings.noDefaultModel")} · ${p.baseURL ?? ""}` : ""
}

/** 建两件（框幕 + 卡）并挂 `document.body`——字段序 = 用户填写序（§2.16 ②）。 */
function buildDialog() {
  const backdrop = document.createElement("div")
  backdrop.className = "settings-dialog-backdrop"
  backdrop.addEventListener("click", closeAddProviderDialog)

  const card = document.createElement("div")
  card.id = "prov-add-dialog"
  card.className = "settings-dialog"
  card.setAttribute("role", "dialog")
  card.setAttribute("aria-modal", "true")
  card.setAttribute("aria-label", t("settings.addProviderTitle"))
  // 框内 Esc：拦截冒泡 ⇒ 不连带执行 chat.js 的「关设置面板」分支（面板保持打开——沿确认弹框同判）
  card.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return
    e.stopPropagation()
    closeAddProviderDialog()
  })

  const body = document.createElement("div")
  body.className = "settings-card-body"
  const subtitle = document.createElement("div")
  subtitle.className = "settings-subtitle"
  subtitle.textContent = t("settings.addProviderTitle")

  const presets = SS.providerStatus.presets || []
  const type = document.createElement("select")
  type.id = "pa-type"
  for (const p of presets) {
    const opt = document.createElement("option")
    opt.value = p.name
    opt.textContent = `${p.name} — ${p.desc} (${p.model || ""})`
    type.appendChild(opt)
  }
  const customOpt = document.createElement("option")
  customOpt.value = "custom"
  customOpt.textContent = t("settings.customChoice")
  type.appendChild(customOpt)
  type.addEventListener("change", paTypeChanged)

  const presetInfo = document.createElement("div")
  presetInfo.id = "pa-preset-info"
  presetInfo.className = "prov-model"

  const customFields = document.createElement("div")
  customFields.id = "pa-custom-fields"
  customFields.style.display = "none"
  const name = document.createElement("input")
  name.id = "pa-name"
  name.placeholder = "my-provider"
  const url = document.createElement("input")
  url.id = "pa-url"
  url.placeholder = "https://api.example.com/v1"
  const format = document.createElement("select")
  format.id = "pa-format"
  for (const f of ["openai", "anthropic", "google"]) {
    const opt = document.createElement("option")
    opt.value = f
    opt.textContent = f === "openai" ? "openai (default)" : f
    format.appendChild(opt)
  }
  customFields.append(
    field(t("settings.providerName"), name),
    field(t("settings.baseUrl"), url),
    field(t("settings.format"), format),
  )

  const key = document.createElement("input")
  key.id = "pa-key"
  key.type = "password"
  key.placeholder = "sk-..."

  const proxy = document.createElement("input")
  proxy.id = "pa-proxy"
  proxy.type = "checkbox"
  const proxyLabel = document.createElement("label")
  proxyLabel.className = "switch"
  proxyLabel.title = t("settings.proxyRowTitle")
  proxyLabel.append(proxy, " " + t("settings.proxyRow"))

  const customTail = document.createElement("div")
  customTail.id = "pa-custom-tail"
  customTail.style.display = "none"
  const fetchBtn = document.createElement("button")
  fetchBtn.id = "pa-fetch-btn"
  fetchBtn.className = "key-btn"
  fetchBtn.type = "button"
  fetchBtn.textContent = t("settings.fetchModels")
  fetchBtn.addEventListener("click", paFetchModels)
  const status = document.createElement("span")
  status.id = "pa-conn-status"
  status.className = "key-status"
  const fetchRow = document.createElement("div")
  fetchRow.className = "key-row"
  fetchRow.append(fetchBtn, status)
  const model = document.createElement("input")
  model.id = "pa-model"
  model.setAttribute("list", "pa-model-candidates")
  const candidates = document.createElement("datalist")
  candidates.id = "pa-model-candidates"
  customTail.append(fetchRow, field(t("settings.model"), model), candidates)

  const saveBtn = document.createElement("button")
  saveBtn.id = "pa-save-btn"
  saveBtn.className = "key-btn"
  saveBtn.textContent = t("settings.save")
  // 收口轮②：徽标按保存结果门控——本地守卫拒 ⇒ 零闪；受理径（已发消息）才亮（settings-widgets 词/样式复用）。
  saveBtn.addEventListener("click", () => { if (paSave()) flashSaved(saveBtn) })
  const cancelBtn = document.createElement("button")
  cancelBtn.id = "pa-cancel-btn"
  cancelBtn.className = "key-btn"
  cancelBtn.textContent = t("settings.cancel")
  cancelBtn.addEventListener("click", closeAddProviderDialog)

  body.append(
    subtitle,
    field(t("settings.presetChoice"), type),
    presetInfo,
    customFields,
    field(t("settings.keyOptional"), key),
    proxyLabel,
    customTail,
    saveBtn,
    cancelBtn,
  )
  card.appendChild(body)
  document.body.append(backdrop, card)
  return { type, presetInfo, customFields, customTail, name, url, format, key, proxy, status, model, candidates }
}

/** 开框（单例：已在框 ⇒ 零动作）：建两件 + 开框重置 + 代际自增 + 初始焦点 = `#pa-type`（+50ms）。 */
export function openAddProviderDialog() {
  if (document.getElementById("prov-add-dialog")) return
  _addDialogEpoch += 1
  const els = buildDialog()
  _els = els
  // 开框重置（§2.16 ①）：类型回首项 ∥ key 清空 ∥ 走 proxy 未勾 ∥ 状态行空 ∥ 模型值 + 候选清空
  els.type.value = els.type.options[0]?.value ?? "custom"
  els.key.value = ""
  els.proxy.checked = false
  els.status.textContent = ""
  els.model.value = ""
  els.candidates.replaceChildren()
  paTypeChanged()
  setTimeout(() => els.type.focus(), 50)
}

/** 关框（五路同效的清除入口，幂等）：卡 ∥ 幕两件同清 + 代际自增 + 实件面弃置。 */
export function closeAddProviderDialog() {
  document.querySelectorAll(".settings-dialog-backdrop, .settings-dialog").forEach((el) => el.remove())
  _els = null
  _addDialogEpoch += 1
}

/** 〔拉取〕：探 baseURL+key（携 format ∥ 勾选态）——探果落框见 `updateTestProviderResult`。 */
function paFetchModels() {
  if (!_els) return
  const baseURL = _els.url.value?.trim()
  const statusEl = _els.status
  if (!baseURL) {
    statusEl.textContent = t("settings.providerUrlRequired")
    statusEl.style.color = "var(--red)"
    return
  }
  statusEl.textContent = t("settings.connecting")
  statusEl.style.color = ""
  // M1 三格式分派：探针必须携带表单选的 format（anthropic/google 与 openai 不同端点/头）；
  // ③′ 拉取路由随勾选：勾 ⇒ 宿主按核 `probeTargetOf` 双门槛判定；未勾 ∥ 缺省 ⇒ 直连。
  _fetchEpoch = _addDialogEpoch // 在飞代际：跨框弃果（落框前比对）
  const payload = { type: "testProvider", baseURL, apiKey: _els.key.value?.trim(), format: _els.format.value }
  if (_els.proxy.checked === true) payload.proxy = true
  window._vscode.postMessage(payload)
}

/** 保存：两形发点（custom ∥ preset）。本地守卫（custom 形 = baseURL ∥ model 非空——序同核
 *  `customFieldsError`）：守卫拒 ⇒ 展示拒因 + `false`——不发布 ∥ 不关框（在编值保留，可即改即重存）；
 *  受理 ⇒ 发布 + 关框 + `true`（徽标按返回值门控——见保存钮接线）。不拉取可存 = #1031（手输直存）。 */
function paSave() {
  if (!_els) return false
  const type = _els.type.value
  const key = _els.key.value?.trim() || undefined
  const payload = { type: "addProvider" }
  if (type === "custom") {
    const baseURL = _els.url.value?.trim()
    if (!baseURL) {
      _els.status.textContent = t("settings.providerUrlRequired")
      _els.status.style.color = "var(--red)"
      return false
    }
    const model = _els.model.value?.trim()
    if (!model) {
      _els.status.textContent = t("settings.modelRequired")
      _els.status.style.color = "var(--red)"
      return false
    }
    payload.custom = { name: _els.name.value?.trim(), baseURL, model, format: _els.format.value }
  } else {
    payload.preset = type
  }
  payload.key = key
  if (_els.proxy.checked === true) payload.proxy = true
  window._vscode.postMessage(payload)
  closeAddProviderDialog() // 关·保存 = 发消息后关（§2.16 ①——受理径）
  return true
}

/** 探果落框：代际不符 ⇒ 弃；探通 ⇒ 填候选（datalist，不自动选中）∥ 探败 ⇒ ✗ + 候选清空（键入值零清）。 */
export function updateTestProviderResult(r) {
  if (!_els || _fetchEpoch !== _addDialogEpoch) return
  const statusEl = _els.status
  if (r?.ok) {
    statusEl.textContent = t("settings.connOk", { count: r.models?.length ?? 0 })
    statusEl.style.color = "var(--green)"
    _els.candidates.replaceChildren()
    for (const m of r.models ?? []) {
      const opt = document.createElement("option")
      opt.value = m
      _els.candidates.appendChild(opt)
    }
  } else {
    statusEl.textContent = "✗ " + (r?.error || t("settings.connFailed"))
    statusEl.style.color = "var(--red)"
    _els.candidates.replaceChildren()
  }
}

/** 装全局出入口（`initSettings` 调用）：开框单例 + 保存直呼面（smoke 契约保留 `window._paSave`）。 */
export function installProviderDialogHandlers() {
  window._openAddProviderDialog = openAddProviderDialog
  window._paSave = paSave
}
