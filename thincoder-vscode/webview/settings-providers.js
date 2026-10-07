/**
 * settings-providers.js — providers card (split out of settings.js): provider list
 * rendering, key editing, and live status updates. 添加表单族（字段序 ∥ 拉取 ∥ 保存）已迁
 * `settings-provider-dialog.js`（三端对齐批 · 2026-10-07——#1029 弹窗化）。
 */
import { escHtml } from "./ui.js"
import { t } from "./i18n.js"
import { SS, PROVIDER_LABELS } from "./settings-state.js"
import { keyRowEdit, flashSaved } from "./settings-widgets.js"
import { openModelMenu } from "./model-menu.js"

/** Install the window._* handlers the providers card's inline onclick attributes call. */
export function installProviderHandlers() {
  // Expose to inline onclick handlers
  window._editKey = function(name) {
    const row = document.getElementById("rowline-" + name)
    if (!row) return
    const label = SS.providerStatus.labels?.[name] || PROVIDER_LABELS[name] || name
    const s0 = SS.providerStatus.providers?.[name] || {}
    keyRowEdit(row, {
      label, placeholder: "sk-...",
      onSave: (v, btn) => { window._vscode.postMessage({ type: "saveProviderKey", name, key: v }); flashSaved(btn) },
      // in-place restore — cancel must NOT rebuild the panel (other cards' in-progress edits survive)
      onCancel: () => {
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
      },
    })
  }

  window._delKey = function(name, btn) {
    window._confirmSecretDelete(btn, () => window._vscode.postMessage({ type: "deleteProviderKey", name }))
  }

  // Provider management (panel-internal, posts payloads to the extension host)
  window._setProviderProxy = function(name, proxy) {
    window._vscode.postMessage({ type: "setProviderProxy", name, proxy })
  }
  // provider 行 ✕（删整条）：载体 = `data-name` + 卡级装配位绑定（卡 HTML `:123`；删整条时
  // 其 apiKey 原文随条目消失 —— 不可复得类，`SETTINGS.md` §2.10 入口册 #4）。消息名 / 载荷
  // 逐字不变；载荷闭包 = 开框时捕获（同 §2.10 弹框契约）。
  window._removeProvider = function(name, btn) {
    window._confirmSecretDelete(btn, () => window._vscode.postMessage({ type: "removeProvider", name }))
  }
  window._setDefaultModel = function(provider, model) {
    const dm = provider + ":" + model
    SS.agentSettings = { ...(SS.agentSettings ?? {}), defaultModel: dm }
    const v = document.getElementById("defaultmodel-value")
    if (v) v.textContent = dm
    window._vscode.postMessage({ type: "saveAgentSettings", settings: { defaultModel: dm } })
  }
  // MODEL-SELECTION：默认模型两级菜单（L1 provider → L2 该渠道的运行期候选）——数据源 =
  // 运行期 `/models` 拉取载荷（SS.getModels → chat.js 的 ctx._models；**不再直读 config 字段**）——
  // 写 raw.defaultModel。M9：准入失败渠道不入可选来源（拉不到列表 → 无候选行）。
  window._defaultModelMenu = function() {
    const btn = document.getElementById("defaultmodel-btn")
    const hint = document.getElementById("defaultmodel-hint")
    if (!btn) return
    const rows = []
    for (const m of SS.getModels?.() || []) {
      if (!m?.id || !m.provider) continue
      if (SS.providerStatus.providers?.[m.provider]?.available === false) continue // 不可用渠道剔出
      const label = SS.providerStatus.labels?.[m.provider] || PROVIDER_LABELS[m.provider] || m.provider
      rows.push({ id: m.id, label: m.label || m.id, provider: m.provider, group: label, reasoning: m.reasoning ?? [] })
    }
    if (rows.length === 0) {
      // #1032：空表 ⇒ 行内提示（修「点击静默」——零菜单）
      if (hint) hint.style.display = "block"
      return
    }
    if (hint) hint.style.display = "none"
    const cur = SS.agentSettings?.defaultModel ?? ""
    const sep = cur.indexOf(":")
    const value = sep > 0 ? { provider: cur.slice(0, sep), model: cur.slice(sep + 1) } : null
    openModelMenu({
      anchorEl: btn, models: rows, value,
      onPick: ({ provider, model }) => window._setDefaultModel(provider, model),
      up: true,
    })
  }
}

/**
 * Providers card HTML — the ONLY card that must refresh while the panel is open:
 * add/remove/provider-change pushes arrive after every provider mutation, and the
 * list must update in place (rebuildSettings runs only on open, which is why a new
 * provider used to appear only after closing and reopening the panel).
 */
export function providersCardHtml() {
  const ps = SS.providerStatus.providers || {}
  let html = `<section id="providers-card" class="settings-card"><h4 class="settings-card-title">${t("settings.providersSection")}</h4><div class="settings-card-body">`
  // MODEL-SELECTION：config.defaultModel 面板项（新会话起点——候选 = 运行期拉取的渠道模型；
  // 写 raw.defaultModel——会话槽不受影响）
  const dm = SS.agentSettings?.defaultModel ?? null
  html += `<div class="prov-row" id="prov-defaultmodel-row">
    <div class="prov-main">
      <span class="prov-name" title="${t("settings.defaultModelTitle")}">${t("settings.defaultModel")}</span>
      <span class="key-status ok" id="defaultmodel-value">${dm ? escHtml(dm) : t("settings.notConfigured")}</span>
      <span class="prov-actions"><button class="key-btn" id="defaultmodel-btn">${t("settings.pickModel")}…</button></span>
    </div>
    <div class="prov-hint" id="defaultmodel-hint" style="display:none">${t("settings.pickModelEmpty")}</div>
  </div>`
  html += `<div id="prov-list">`
  for (const [name, s0] of Object.entries(ps)) {
    const label = SS.providerStatus.labels?.[name] || PROVIDER_LABELS[name] || name
    const active = !!s0.isActive
    const configured = !!s0.configured
    html += `<div class="prov-row" id="prov-${escHtml(name)}">
      <div class="prov-main" id="rowline-${escHtml(name)}">
        <span class="prov-dot ${configured ? "ok" : ""}"></span>
        <span class="prov-name">${escHtml(label)}</span>
        <span class="key-status ${configured ? "ok" : ""}">${configured ? escHtml(s0.masked) : t("settings.notConfigured")}</span>
        <span class="prov-actions">
          <button class="key-btn" onclick="window._editKey('${escHtml(name)}')">${configured ? t("settings.setKey") : t("settings.addKey")}</button>
          <button class="key-btn del-key" data-name="${escHtml(name)}" ${active ? "disabled" : ""} title="${t("settings.remove")}">✕</button>
        </span>
      </div>
      <div class="prov-sub">
        <span class="prov-model">${escHtml(s0.model || t("settings.noDefaultModel"))}${s0.baseURL ? ` · ${escHtml(s0.baseURL)}` : ""}${s0.available === false ? ` · <span class="prov-unavailable">${s0.failure === "hostBusy" ? t("settings.providerHostBusy") : t("settings.providerUnavailable")}</span>` : ""}</span>
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

/** Bind the card's addEventListener-wired controls — the default-model row button plus the
 *  provider-row ✕ delete buttons (`data-name` carrier; inline onclick is undrivable under the
 *  test fixture — SETTINGS.md §2.10 载体绑定段)。添加表单族已迁弹窗档（其钮随档自绑）。 */
export function bindAddProviderForm() {
  document.getElementById("defaultmodel-btn")?.addEventListener("click", () => window._defaultModelMenu())
  // 卡行 ✕（两建面路径 `settings.js:185` / `renderProvidersCard` 均经此单点重绑）。选择器带
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
  if (panel && panel.style.display === "flex") renderProvidersCard()
}
