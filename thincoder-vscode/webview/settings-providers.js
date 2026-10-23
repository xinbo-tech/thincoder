/**
 * settings-providers.js — providers card (split out of settings.js): provider list
 * rendering, key editing, and live status updates. 添加表单族（字段序 ∥ 拉取 ∥ 保存）已迁
 * `settings-provider-dialog.js`（三端对齐批 · 2026-10-07——#1029 弹窗化）。
 */
import { escHtml } from "./ui.js"
import { t } from "./i18n.js"
import { SS, PROVIDER_LABELS } from "./settings-state.js"
import { keyRowEdit, flashSaved } from "./settings-widgets.js"
import { openProviderContextDialog } from "./settings-provider-dialog.js"

/** 行面上下文回显（`docs/core/design/PROVIDER.md` §6.15「读面载荷」· R31③-VSC 行面 ∥ R33）：读宿主下发的
 *  `modelContextText`（同键展示串——宿主经核 `formatDeclaredContextK` 出词，K→token 换算只在核一处）——
 *  逐条 `模型: <核出词>`；单条即 `<核出词>`；无声明 ⇒ `未声明` ∥ `Not declared`。
 *  为什么不在这里拼 K 串：声明 `1024` 时自拼出 `1024K`、核出 `1M`（R33 判缺陷写法一）；也不读
 *  `modelContext` 原值自算。为什么不读 `providerSpec().context`：渠道条目无 `model`（`config-io.mjs`
 *  `delete p.model`）⇒ 链的 L1 永不命中，该值最多走到 L2 旧键 ∥ L5 默认（写 128 会显 125K）。
 *  webview 零 `@thincoder/core` 引用 ⇒ 串由宿主下发，面板内不 import 核。 */
function contextDeclaredText(s0) {
  const table = s0?.modelContextText
  const keys = table && typeof table === "object" && !Array.isArray(table) ? Object.keys(table) : []
  if (keys.length === 0) return t("settings.providers.contextNotDeclared")
  const pair = (k2) => `${escHtml(k2)}: ${escHtml(String(table[k2]))}`
  return keys.length === 1 ? escHtml(String(table[keys[0]])) : keys.map(pair).join(" · ")
}

/** 密钥行静态态恢复（#1053）：现读 SS——取消径 ∥ 保存受理回执径共用（不重建面板：其余卡在编编辑存活）。 */
function restoreKeyRow(row, name) {
  const label = SS.providerStatus.labels?.[name] || PROVIDER_LABELS[name] || name
  const s0 = SS.providerStatus.providers?.[name] || {}
  row.replaceChildren()
  const lbl = document.createElement("span"); lbl.className = "prov-name"; lbl.textContent = label
  const st = document.createElement("span"); st.className = "key-status " + (s0.configured ? "ok" : ""); st.textContent = s0.configured ? (s0.masked || "****") : t("settings.notConfigured")
  const act = document.createElement("span"); act.className = "prov-actions"
  const editBtn = document.createElement("button"); editBtn.className = "key-btn"; editBtn.textContent = s0.configured ? t("settings.setKey") : t("settings.addKey")
  editBtn.addEventListener("click", () => window._editKey(name))
  const delBtn = document.createElement("button"); delBtn.className = "key-btn del-key"; delBtn.textContent = "✕"; delBtn.disabled = !!s0.isActive
  delBtn.addEventListener("click", (e) => window._removeProvider(name, e.currentTarget))
  act.append(editBtn, delBtn)
  row.append(lbl, st, act)
}

/** Install the window._* handlers the providers card's inline onclick attributes call. */
export function installProviderHandlers() {
  // Expose to inline onclick handlers
  window._editKey = function(name) {
    const row = document.getElementById("rowline-" + name)
    if (!row) return
    keyRowEdit(row, {
      label: SS.providerStatus.labels?.[name] || PROVIDER_LABELS[name] || name, placeholder: "sk-...",
      // #1053：保存只发消息——徽标闪移离发送点（拒径零回执 ⇒ 零闪；受理 ⇒ 回执径 `onProviderKeySaved` 闪）
      onSave: (v) => { window._vscode.postMessage({ type: "saveProviderKey", name, key: v }) },
      // in-place restore — cancel must NOT rebuild the panel (other cards' in-progress edits survive)
      onCancel: () => restoreKeyRow(row, name),
    })
  }

  // Provider management (panel-internal, posts payloads to the extension host)
  // 上下文编辑弹窗（R31③-VSC）：入口 = 渠道行动作簇 `Context…` 钮（弹窗体 = `settings-provider-dialog.js`）
  window._openProviderContextDialog = openProviderContextDialog
  window._setProviderProxy = function(name, proxy) {
    window._vscode.postMessage({ type: "setProviderProxy", name, proxy })
  }
  // provider 行 ✕（删整条）：载体 = `data-name` + 卡级装配位绑定（卡 HTML 装配位；删整条时
  // 其 apiKey 原文随条目消失 —— 不可复得类，`SETTINGS.md` §2.10 入口册 #4）。消息名 / 载荷
  // 逐字不变；载荷闭包 = 开框时捕获（同 §2.10 弹框契约）。
  window._removeProvider = function(name, btn) {
    window._confirmSecretDelete(btn, () => window._vscode.postMessage({ type: "removeProvider", name }))
  }
}

/** #1053 受理回执消费（host → webview `providerKeySaved`；`chat-messages.js` case 转发）：
 *  同名字行在编（password 输入在位）⇒ 原地恢复静态行（现读 SS）+ 闪徽标；无在编 ⇒ 零动作。 */
export function onProviderKeySaved(name) {
  const row = document.getElementById("rowline-" + name)
  if (!row || !row.querySelector("input[type=password]")) return
  restoreKeyRow(row, name)
  flashSaved()
}

/** 上下文保存受理回执消费（host → webview `providerContextSaved`——成径先重推 `providerStatus` 再发本回执）：
 *  写径 ⇒ 行内就地显 `settings.providers.contextSaved`（4s 自散），模板 `<N>` = 宿主出词串 `kText`
 *  （模板不补 `K`——补了 `1M` 会出 `1MK`）；清除径（`kText === null`）⇒ 零提示
 *  （行面已随状态重绘转 `未声明`）。 */
export function onProviderContextSaved({ name, model, kText } = {}) {
  if (kText === null || kText === undefined) return
  const row = document.getElementById("prov-" + name)
  if (!row) return
  const label = SS.providerStatus.labels?.[name] || PROVIDER_LABELS[name] || name
  const hint = document.createElement("div")
  hint.className = "prov-hint prov-context-saved"
  hint.textContent = t("settings.providers.contextSaved", { provider: label, model, k: kText })
  row.appendChild(hint)
  setTimeout(() => hint.remove(), 4000)
}

/**
 * Providers card HTML — the ONLY card that must refresh while the panel is open:
 * add/remove/provider-change pushes arrive after every provider mutation, and the
 * list must update in place (buildSettings runs only on open, which is why a new
 * provider used to appear only after closing and reopening the panel).
 */
export function providersCardHtml() {
  const ps = SS.providerStatus.providers || {}
  let html = `<section id="providers-card" class="settings-card"><h4 class="settings-card-title">${t("settings.providersSection")}</h4><div class="settings-card-body">`
  html += `<div id="prov-list">`
  for (const [name, s0] of Object.entries(ps)) {
    const label = SS.providerStatus.labels?.[name] || PROVIDER_LABELS[name] || name
    const active = !!s0.isActive
    const configured = !!s0.configured
    // 副行（2026-10-09 清除批：渠道条目不携模型——显示回退 = baseURL；原「渠道无默认模型」词族退场）
    // 类名 `prov-model` 沿旧（样式复用——内容 = baseURL）
    const sub = []
    if (s0.baseURL) sub.push(escHtml(s0.baseURL))
    sub.push(`<span class="prov-context">${contextDeclaredText(s0)}</span>`)
    if (s0.available === false) sub.push(`<span class="prov-unavailable">${s0.failure === "hostBusy" ? t("settings.providerHostBusy") : t("settings.providerUnavailable")}</span>`)
    html += `<div class="prov-row" id="prov-${escHtml(name)}">
      <div class="prov-main" id="rowline-${escHtml(name)}">
        <span class="prov-dot ${configured ? "ok" : ""}"></span>
        <span class="prov-name">${escHtml(label)}</span>
        <span class="key-status ${configured ? "ok" : ""}">${configured ? escHtml(s0.masked) : t("settings.notConfigured")}</span>
        <span class="prov-actions">
          <button class="key-btn" onclick="window._editKey('${escHtml(name)}')">${configured ? t("settings.setKey") : t("settings.addKey")}</button>
          <button class="key-btn ctx-btn" onclick="window._openProviderContextDialog('${escHtml(name)}')">${t("settings.providers.context")}</button>
          <button class="key-btn del-key" data-name="${escHtml(name)}" ${active ? "disabled" : ""} title="${t("settings.remove")}">✕</button>
        </span>
      </div>
      <div class="prov-sub">
        <span class="prov-model">${sub.join(" · ")}</span>
        <label class="switch" title="${t("settings.proxyRowTitle")}"><input type="checkbox" ${s0.proxy ? "checked" : ""} onchange="window._setProviderProxy('${escHtml(name)}', this.checked)"> ${t("settings.proxyRow")}</label>
      </div>
      ${s0.available === false && s0.unavailableReason && s0.failure !== "hostBusy" ? `<div class="prov-hint">${escHtml(s0.unavailableReason)}</div>` : ""}
    </div>`
  }
  html += `<button id="prov-add-btn" class="key-btn" onclick="window._openAddProviderDialog()">${t("settings.addProvider")}</button>`
  html += `</div>`

  html += `</div></section>`
  return html
}

/** Bind the card's addEventListener-wired controls — the provider-row ✕ delete buttons
 *  (`data-name` carrier; inline onclick is undrivable under the test fixture — SETTINGS.md §2.10
 *  载体绑定段)。添加表单族已迁弹窗档（其钮随档自绑）。 */
export function bindAddProviderForm() {
  // 卡行 ✕（两建面路径 `buildSettings` / `renderProvidersCard` 均经此单点重绑）。选择器带
  // `[data-name]` ⇒ 编辑行取消重建位的 ✕（无 `data-name`、自持 addEventListener）不入本域。
  for (const btn of document.querySelectorAll("#prov-list .del-key[data-name]")) {
    btn.addEventListener("click", () => {
      const name = btn.dataset.name // 开框时捕获：弹框在位期间的行重绘不改删除目标
      window._removeProvider(name, btn)
    })
  }
}

/** Re-render ONLY the providers card in place (panel open). A full buildSettings()
 *  rebuild would clobber in-progress edits in the other cards — forbidden by design.
 *  P2-6 保表单段已撤（三端对齐批 · #1029）：添加表单迁出本卡（弹窗挂 body）⇒ 卡重建不再
 *  触碰在编输入——「框不重绘」天然保真。 */
export function renderProvidersCard() {
  const card = document.getElementById("providers-card")
  if (!card) return
  card.outerHTML = providersCardHtml()
  bindAddProviderForm()
}

export function updateProviderStatus(status) {
  const changed = JSON.stringify(SS.providerStatus) !== JSON.stringify(status)
  SS.providerStatus = status
  if (!changed) return
  // Live refresh: providerStatus pushes arrive after every provider mutation (add /
  // remove / key / proxy). When the panel is open, update the providers card in
  // place — otherwise the change only appears on the next open (stale list bug).
  const panel = document.getElementById("settings-panel")
  if (panel && panel.style.display === "flex") {
    // #1053 在编守卫：密钥行在编（`#prov-list` 内 password 输入在位）⇒ 本拍只更新 SS 不重绘
    //（用户输入优先于推送——沿 U-S10 工具键行 skipWhileEditing 同判；行关不依赖状态推送——回执径就地恢复）
    if (!document.querySelector("#prov-list input[type=password]")) renderProvidersCard()
  }
}
