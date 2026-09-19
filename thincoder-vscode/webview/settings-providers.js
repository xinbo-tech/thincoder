/**
 * settings-providers.js — providers card (split out of settings.js): provider list
 * rendering, add-provider form, key editing, and live status updates.
 */
import { escHtml } from "./ui.js"
import { t } from "./i18n.js"
import { SS, PROVIDER_LABELS } from "./settings-state.js"
import { keyRowEdit, flashSaved } from "./settings-widgets.js"
import { openModelMenu } from "./model-menu.js"

/** Show preset info (read-only) or custom fields depending on the Add form's type select. */
function paTypeChanged() {
  const type = document.getElementById("pa-type")?.value
  const info = document.getElementById("pa-preset-info")
  const customFields = document.getElementById("pa-custom-fields")
  if (!info || !customFields) return
  if (type === "custom") {
    info.style.display = "none"
    customFields.style.display = "block"
  } else {
    const p = (SS.providerStatus.presets || []).find((x) => x.name === type)
    info.style.display = "block"
    customFields.style.display = "none"
    // MODEL-SELECTION：预设行显单值默认模型（候选清单字段已退场）
    info.textContent = p ? `${p.model || "(no default model)"} · ${p.baseURL ?? ""}` : ""
  }
}

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
        const delBtn = document.createElement("button"); delBtn.className = "key-btn del-key"; delBtn.textContent = "−"; delBtn.disabled = !!s0.isActive
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
  // provider 行 −（删整条）：载体 = `data-name` + 卡级装配位绑定（卡 HTML `:185`；删整条时
  // 其 apiKey 原文随条目消失 —— 不可复得类，`SETTINGS.md` §2.10 入口册 #4）。消息名 / 载荷
  // 逐字不变；载荷闭包 = 开框时捕获（同 §2.10 弹框契约）。
  window._removeProvider = function(name, btn) {
    window._confirmSecretDelete(btn, () => window._vscode.postMessage({ type: "removeProvider", name }))
  }
  window._toggleAddForm = function(show) {
    const form = document.getElementById("prov-add-form")
    const list = document.getElementById("prov-list")
    if (!form || !list) return
    form.style.display = show ? "block" : "none"
    list.style.display = show ? "none" : "block"
    if (show) {
      const typeSel = document.getElementById("pa-type")
      if (typeSel) typeSel.value = typeSel.options[0]?.value ?? "custom"
      paTypeChanged()
      document.getElementById("pa-key") && (document.getElementById("pa-key").value = "")
    }
  }
  window._paTypeChanged = paTypeChanged
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
    if (!btn) return
    const rows = []
    for (const m of SS.getModels?.() || []) {
      if (!m?.id || !m.provider) continue
      if (SS.providerStatus.providers?.[m.provider]?.available === false) continue // 不可用渠道剔出
      const label = SS.providerStatus.labels?.[m.provider] || PROVIDER_LABELS[m.provider] || m.provider
      rows.push({ id: m.id, label: m.label || m.id, provider: m.provider, group: label, reasoning: m.reasoning ?? [] })
    }
    if (rows.length === 0) return
    const cur = SS.agentSettings?.defaultModel ?? ""
    const sep = cur.indexOf(":")
    const value = sep > 0 ? { provider: cur.slice(0, sep), model: cur.slice(sep + 1) } : null
    openModelMenu({
      anchorEl: btn, models: rows, value,
      onPick: ({ provider, model }) => window._setDefaultModel(provider, model),
      up: true,
    })
  }
  // Custom provider: probe baseURL+key via /models — validates the connection
  // AND populates the model dropdown so the model is picked, not hand-typed.
  window._paFetchModels = function() {
    const baseURL = document.getElementById("pa-url")?.value?.trim()
    const apiKey = document.getElementById("pa-key")?.value?.trim()
    // M1 三格式分派：探针必须携带表单选的 format（anthropic/google 与 openai 不同端点/头）
    const format = document.getElementById("pa-format")?.value
    const status = document.getElementById("pa-conn-status")
    if (!baseURL) {
      if (status) { status.textContent = t("settings.providerUrlRequired"); status.style.color = "var(--red)" }
      return
    }
    if (status) { status.textContent = t("settings.connecting"); status.style.color = "" }
    window._vscode.postMessage({ type: "testProvider", baseURL, apiKey, format })
  }
  window._paSave = function() {
    const type = document.getElementById("pa-type")?.value
    const key = document.getElementById("pa-key")?.value?.trim() || undefined
    if (type === "custom") {
      const model = document.getElementById("pa-model")?.value?.trim()
      if (!model) {
        // Custom model comes from the probed /models dropdown — must fetch first.
        const status = document.getElementById("pa-conn-status")
        if (status) { status.textContent = t("settings.fetchModelsFirst"); status.style.color = "var(--red)" }
        return
      }
      const custom = {
        name: document.getElementById("pa-name")?.value?.trim(),
        baseURL: document.getElementById("pa-url")?.value?.trim(),
        model,
        format: document.getElementById("pa-format")?.value,
      }
      window._vscode.postMessage({ type: "addProvider", custom, key })
    } else {
      window._vscode.postMessage({ type: "addProvider", preset: type, key })
    }
    window._toggleAddForm(false)
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
      <span class="prov-name" title="New sessions start from config.defaultModel">${t("settings.defaultModel")}</span>
      <span class="key-status ok" id="defaultmodel-value">${dm ? escHtml(dm) : t("settings.notConfigured")}</span>
      <span class="prov-actions"><button class="key-btn" id="defaultmodel-btn">${t("settings.pickModel")}…</button></span>
    </div>
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
          <button class="key-btn del-key" data-name="${escHtml(name)}" ${active ? "disabled" : ""} title="${t("settings.remove")}">−</button>
        </span>
      </div>
      <div class="prov-sub">
        <span class="prov-model">${escHtml(s0.model || "(no default model)")}${s0.baseURL ? ` · ${escHtml(s0.baseURL)}` : ""}${s0.available === false ? ` · <span class="prov-unavailable">${s0.failure === "hostBusy" ? "宿主繁忙" : "不可用"}</span>` : ""}</span>
        <label class="switch" title="${t("settings.proxyRowTitle")}"><input type="checkbox" ${s0.proxy ? "checked" : ""} onchange="window._setProviderProxy('${escHtml(name)}', this.checked)"> ${t("settings.proxyRow")}</label>
      </div>
      ${s0.available === false && s0.unavailableReason && s0.failure !== "hostBusy" ? `<div class="prov-hint">${escHtml(s0.unavailableReason)}</div>` : ""}
    </div>`
  }
  html += `<button id="prov-add-btn" class="key-btn" onclick="window._toggleAddForm(true)">${t("settings.addProvider")}</button>`
  html += `</div>`

  // [+ Add] form (hidden until toggled): preset select or custom fields
  const presets = SS.providerStatus.presets || []
  html += `<div id="prov-add-form" style="display:none">
    <div class="settings-subtitle">${t("settings.addProviderTitle")}</div>
    <div class="key-field"><label>${t("settings.presetChoice")}</label>
      <select id="pa-type" onchange="window._paTypeChanged()">
        ${presets.map((p) => `<option value="${escHtml(p.name)}">${escHtml(p.name)} — ${escHtml(p.desc)} (${escHtml(p.model || "")})</option>`).join("")}
        <option value="custom">${t("settings.customChoice")}</option>
      </select>
    </div>
    <div id="pa-preset-info" class="prov-model" style="padding:2px 0"></div>
    <div id="pa-custom-fields" style="display:none">
      <div class="key-field"><label>${t("settings.providerName")}</label><input id="pa-name" placeholder="my-provider"></div>
      <div class="key-field"><label>${t("settings.baseUrl")}</label><input id="pa-url" placeholder="https://api.example.com/v1"></div>
      <div class="key-field"><label>${t("settings.format")}</label>
        <select id="pa-format"><option value="openai">openai (default)</option><option value="anthropic">anthropic</option><option value="google">google</option></select>
      </div>
      <div class="key-row">
        <button id="pa-fetch-btn" class="key-btn" type="button" onclick="window._paFetchModels()">${t("settings.fetchModels")}</button>
        <span id="pa-conn-status" class="key-status"></span>
      </div>
      <div class="key-field"><label>${t("settings.model")}</label><select id="pa-model"></select></div>
    </div>
    <div class="key-field"><label>${t("settings.keyOptional")}</label><input id="pa-key" type="password" placeholder="sk-..."></div>
    <button id="pa-save-btn" class="key-btn">${t("settings.save")}</button>
    <button id="pa-cancel-btn" class="key-btn">${t("settings.cancel")}</button>
  </div>`
  html += `</div></section>`
  return html
}

/** Bind the card's addEventListener-wired controls — the [+ Add] form buttons (a re-rendered
 *  card must re-bind them or Save/Cancel silently die) plus the provider-row − delete buttons
 *  (`data-name` carrier; inline onclick is undrivable under the test fixture — SETTINGS.md
 *  §2.10 载体绑定段). */
export function bindAddProviderForm() {
  document.getElementById("pa-save-btn").addEventListener("click", () => { window._paSave(); flashSaved(document.getElementById("pa-save-btn")) })
  document.getElementById("pa-cancel-btn").addEventListener("click", () => window._toggleAddForm(false))
  document.getElementById("defaultmodel-btn")?.addEventListener("click", () => window._defaultModelMenu())
  // 卡行 −（两建面路径 `settings.js:131` / `renderProvidersCard` 均经此单点重绑）。选择器带
  // `[data-name]` ⇒ 编辑行取消重建位的 −（无 `data-name`、自持 addEventListener）不入本域。
  for (const btn of document.querySelectorAll("#prov-list .del-key[data-name]")) {
    btn.addEventListener("click", () => {
      const name = btn.dataset.name // 开框时捕获：弹框在位期间的行重绘不改删除目标
      window._removeProvider(name, btn)
    })
  }
  paTypeChanged()
}

/** Re-render ONLY the providers card in place (panel open). A full buildSettings()
 *  rebuild would clobber in-progress edits in the other cards — forbidden by design. */
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

/** Custom-provider connection probe result: populate the model dropdown or show the error. */
export function updateTestProviderResult(r) {
  const status = document.getElementById("pa-conn-status")
  const sel = document.getElementById("pa-model")
  if (!status || !sel) return
  if (r?.ok) {
    status.textContent = t("settings.connOk", { count: r.models?.length ?? 0 })
    status.style.color = "var(--green)"
    sel.innerHTML = (r.models ?? []).map((m) => `<option value="${escHtml(m)}">${escHtml(m)}</option>`).join("")
  } else {
    status.textContent = "✗ " + (r?.error || t("settings.connFailed"))
    status.style.color = "var(--red)"
    sel.innerHTML = ""
  }
}
