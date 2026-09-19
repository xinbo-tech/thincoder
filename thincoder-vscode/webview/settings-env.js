/**
 * settings-env.js — environment card (split out of settings.js): proxy settings
 * (CHANGE-TO-SAVE + connection test) and shell selection.
 *
 * F-W8 / F-W9 / F-W10 / F-W11（`docs/batches/2026-09-18-vsc-settings-wiring.md` §2；机制单源 =
 * `docs/vsc/design/SETTINGS.md` §2.8 / §2.9）：
 *  - **回填** = 控件级（快照到达即刷活控件，跳过聚焦中的控件——回填与用户输入互不覆盖；
 *    整卡零重建）；
 *  - **写值纪律** = 基线判据（基线 = 该控件最后一次被写入控件的值：建面渲染 / 回填写入 /
 *    用户编辑；跳过聚焦 ⇒ 零写入 ⇒ 基线冻结于现屏值）+ 逐字段载荷（只发本次被编辑字段）；
 *  - **Shell 接线**（change → `saveShellSettings` → 写盘 + 回填）。
 */
import { escHtml } from "./ui.js"
import { t } from "./i18n.js"
import { SS } from "./settings-state.js"
import { flashSaved } from "./settings-widgets.js"

/** 控件基线（§2.8 基线判据——模块内状态：SS 形状本批零改）。 */
const _pxBaseline = { uri: "", web: false, model: false }
const _shBaseline = { select: "", custom: "" }

/** Shell 回显全表达式（§2.9——建面渲染 / 推送回填 / 就地回显**同一式**）：`current` 匹配候选
 *  （按值相等——含 `System default` 候选的 `value:null` 对 `current:null`）⇒ 选择器回到该候选 +
 *  自定义框清空；无匹配 ⇒ 选择器置 `__custom__` + 自定义框 = `current`。 */
function shellEchoState() {
  const cands = SS.shellCandidates || []
  const current = SS.shellValue ?? null
  const matched = cands.find((c) => (c.value ?? null) === current) ?? null
  const isCustom = current !== null && !matched
  return {
    isCustom,
    current,
    selectValue: isCustom ? "__custom__" : (matched ? (matched.value || "") : ""),
    customValue: isCustom ? current : "",
  }
}

/** Shell 候选表选项 HTML（渲染器与回填同源——单一表达式）。 */
function shellOptionsHtml() {
  const cands = SS.shellCandidates || []
  const { isCustom, current } = shellEchoState()
  return cands.map((c) => `<option value="${escHtml(c.value || "")}" ${!isCustom && (c.value ?? null) === current ? "selected" : ""}>${escHtml(c.name)}</option>`).join("")
    + `<option value="__custom__" ${isCustom ? "selected" : ""}>${t("settings.shellCustom")}</option>`
}

/** Environment card HTML (proxy + shell). */
export function envCardHtml() {
  const px = SS.proxySettings || {}
  const shell = shellEchoState()
  let html = ""
  // ─── Environment card (proxy + shell) ───
  html += `<section class="settings-card"><h4 class="settings-card-title">${t("settings.envSection")}</h4><div class="settings-card-body">`
  html += `<div class="settings-subtitle">${t("settings.proxySection")}</div>`
  html += `<div class="key-field"><label title="${t("settings.proxyUriHelp")}">${t("settings.proxyUri")}</label><input id="px-uri" placeholder="http://127.0.0.1:7890" value="${escHtml(px.uri || "")}"></div>`
  html += `<label class="switch" title="${t("settings.proxyWebHelp")}"><input type="checkbox" id="px-web" ${px.web !== false ? "checked" : ""}> ${t("settings.proxyWeb")}</label>`
  html += `<label class="switch" title="${t("settings.proxyModelHelp")}"><input type="checkbox" id="px-model" ${px.model ? "checked" : ""}> ${t("settings.proxyModel")}</label>`
  html += `<div> <button id="px-test-btn" class="key-btn">${t("settings.proxyTest")}</button></div>`
  html += `<div id="px-test-result" style="font-size:12px;opacity:0.7;padding:4px 0">—</div>`
  html += `<div class="settings-subtitle">${t("settings.shellSection")}</div>`
  html += `<div class="key-field"><label title="${t("settings.shellHelp")}">${t("settings.shellSelect")}</label><select id="sh-select">
      ${shellOptionsHtml()}
    </select></div>
    <div class="key-field"><label>${t("settings.shellPath")}</label><input id="sh-custom" placeholder="C:\\path\\to\\shell.exe" value="${shell.isCustom ? escHtml(shell.current) : ""}"></div>`
  html += `</div></section>`
  return html
}

/** 建面渲染 = 基线写入点（基线 = 渲染值——与 `envCardHtml` 同一表达式；每建面重种）。 */
function seedBaselines() {
  const uri = document.getElementById("px-uri")
  const web = document.getElementById("px-web")
  const model = document.getElementById("px-model")
  _pxBaseline.uri = uri ? uri.value.trim() : ""
  _pxBaseline.web = web ? !!web.checked : false
  _pxBaseline.model = model ? !!model.checked : false
  _shBaseline.select = document.getElementById("sh-select")?.value ?? ""
  _shBaseline.custom = document.getElementById("sh-custom")?.value.trim() ?? ""
}

/** Bind the proxy + shell controls. Explicit per-control binding — NEVER a card/document-wide
 *  query. The old `closest(".settings-card") || document` fell through to document
 *  (px-save-btn does not exist), binding autoSaveProxy to EVERY input's change in the panel:
 *  blurring any field re-posted proxy with whatever was (or wasn't) in px-uri,
 *  silently deleting it. */
export function bindEnvControls() {
  seedBaselines()
  for (const id of ["px-uri", "px-web", "px-model"]) {
    document.getElementById(id)?.addEventListener("change", () => saveProxyField(id))
  }
  document.getElementById("sh-select")?.addEventListener("change", onShellSelectChange)
  document.getElementById("sh-custom")?.addEventListener("change", onShellCustomChange)

  const pxTest = document.getElementById("px-test-btn")
  if (pxTest) {
    pxTest.addEventListener("click", () => {
      const result = document.getElementById("px-test-result")
      if (result) result.textContent = t("settings.proxyTestRunning")
      const uri = document.getElementById("px-uri")?.value?.trim() || ""
      window._vscode.postMessage({ type: "testProxy", uri })
    })
  }
}

/** 代理 CHANGE-TO-SAVE 单字段发值门（§2.8 两条判据）：屏值 ≠ 基线才发（未编辑的 change——
 *  blur / Enter 未改值 / 快照未达拍 ⇒ 零发值）；payload 只含本次被编辑字段。发值后
 *  基线 ← 本次屏值（同值 change 连发 ⇒ 恰 1 次 post——幂等门）。 */
function saveProxyField(id) {
  const field = id === "px-uri" ? "uri" : id === "px-web" ? "web" : "model"
  const el = document.getElementById(id)
  if (!el) return
  const value = field === "uri" ? el.value.trim() : !!el.checked
  if (value === _pxBaseline[field]) return
  window._vscode.postMessage({ type: "saveProxySettings", settings: { [field]: value } })
  _pxBaseline[field] = value
  flashSaved(document.getElementById("px-test-btn"))
}

/** `#sh-select` change（F-W11 接线圈 · §2.9）：候选值 ⇒ 发 `{ value }`（写 `config.shell`）；
 *  `System default`（屏值 `""`——路径册 #2）⇒ 发 `{ value:"" }`（宿主删键 = 系统默认）；
 *  `__custom__` 哨兵 = 切换输入意图（非写意图）⇒ 零发值。 */
function onShellSelectChange() {
  const sel = document.getElementById("sh-select")
  if (!sel) return
  const value = sel.value
  if (value === "__custom__" || value === _shBaseline.select) {
    _shBaseline.select = value
    return
  }
  window._vscode.postMessage({ type: "saveShellSettings", value })
  _shBaseline.select = value
}

/** `#sh-custom` change（§2.9）：非空 ⇒ 发 `{ value }`；空 ⇒ 零发值 + 按快照就地回显
 *  （§2.8 路径册 #3：空自定义路径 = 未完成输入，不是删除触发）。 */
function onShellCustomChange() {
  const el = document.getElementById("sh-custom")
  if (!el) return
  const value = el.value.trim()
  if (!value) {
    refillShellControls(false) // 就地回显（用户显式动作触发——不跳聚焦）
    return
  }
  if (value === _shBaseline.custom) return
  window._vscode.postMessage({ type: "saveShellSettings", value })
  _shBaseline.custom = value
}

/** 控件级回填（§2.8 回填表——收到即刷活控件，不重建整卡）：按快照覆写屏值，写入即更新基线；
 *  **跳过聚焦中的控件**（U-S10）⇒ 零写入 ⇒ 基线冻结于控件现屏值（不随 SS 前移）。 */
function refillProxyControls() {
  const px = SS.proxySettings || {}
  const uri = document.getElementById("px-uri")
  if (uri && uri !== document.activeElement) {
    uri.value = px.uri || ""
    _pxBaseline.uri = uri.value.trim()
  }
  const web = document.getElementById("px-web")
  if (web && web !== document.activeElement) {
    web.checked = px.web !== false
    _pxBaseline.web = !!web.checked
  }
  const model = document.getElementById("px-model")
  if (model && model !== document.activeElement) {
    model.checked = !!px.model
    _pxBaseline.model = !!model.checked
  }
}

/** Shell 控件回填 / 就地回显（§2.9 回显全表达式）。`skipFocused` = 推送回填（§2.8：跳过
 *  聚焦中的控件）；就地回显（用户清空 `#sh-custom`——路径册 #3）不跳（用户动作触发）。 */
function refillShellControls(skipFocused) {
  const { selectValue, customValue } = shellEchoState()
  const sel = document.getElementById("sh-select")
  if (sel && !(skipFocused && sel === document.activeElement)) {
    sel.innerHTML = shellOptionsHtml() // 选项表随快照同源重绘
    sel.value = selectValue            // 选中项 = 回显全表达式结果（显式赋值——不依赖 innerHTML 的选中语义）
    _shBaseline.select = sel.value
  }
  const cus = document.getElementById("sh-custom")
  if (cus && !(skipFocused && cus === document.activeElement)) {
    cus.value = customValue
    _shBaseline.custom = cus.value.trim()
  }
}

export function updateShellCandidates(payload) {
  SS.shellCandidates = payload?.candidates || []
  SS.shellValue = payload?.current ?? null
  refillShellControls(true)
}

export function updateProxySettings(settings) {
  SS.proxySettings = settings
  refillProxyControls()
}

export function updateProxyTestResult(result) {
  const el = document.getElementById("px-test-result")
  if (!el) return
  if (result?.ok) el.textContent = `✓ OK (HTTP ${result.status})`
  else if (result?.status) el.textContent = `✗ HTTP ${result.status}`
  else el.textContent = `✗ ${result?.error || "unknown error"}`
}
