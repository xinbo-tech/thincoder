/**
 * settings-tools.js — tools & services card (split out of settings.js): MCP server
 * list + add form, embedding/websearch key rows, semantic-index status.
 */
import { escHtml } from "./ui.js"
import { t } from "./i18n.js"
import { SS } from "./settings-state.js"
import { keyRowEdit, flashSaved } from "./settings-widgets.js"

/** Install the window._* handlers the embed/websearch key rows' inline onclick attributes call. */
export function installToolsKeyHandlers() {
  // Embedding key row
  window._editEmbedKey = function() {
    const row = document.getElementById("row-embed")
    keyRowEdit(row, {
      label: t("settings.embeddingLabel"), placeholder: "sk-...",
      onSave: (v, btn) => { window._vscode.postMessage({ type: "saveEmbedKey", key: v }); flashSaved(btn) },
      onCancel: () => {
        const row = document.getElementById("row-embed")
        row.replaceChildren()
        const lbl = document.createElement("span"); lbl.className = "key-label"; lbl.textContent = t("settings.embeddingLabel")
        const has = SS.indexStatus?.hasEmbedder
        const st = document.createElement("span"); st.className = "key-status " + (has ? "ok" : ""); st.textContent = has ? "****" : "—"
        const editBtn = document.createElement("button"); editBtn.className = "key-btn"; editBtn.textContent = has ? t("settings.changeKey") : t("settings.addKey")
        editBtn.addEventListener("click", () => window._editEmbedKey())
        row.append(lbl, st, editBtn)
        if (has) {
          const delBtn = document.createElement("button"); delBtn.className = "key-btn del-key"; delBtn.textContent = "✕"
          delBtn.addEventListener("click", (e) => window._delEmbedKey(e.currentTarget))
          row.appendChild(delBtn)
        }
      },
    })
  }

  window._delEmbedKey = function(btn) {
    window._confirmDelete(btn, () => window._vscode.postMessage({ type: "deleteEmbedKey" }))
  }

  // Web search key (Tavily)
  window._editWebsearchKey = function() {
    const row = document.getElementById("row-websearch")
    keyRowEdit(row, {
      label: t("settings.websearchLabel"), placeholder: "tvly-...",
      onSave: (v, btn) => { window._vscode.postMessage({ type: "saveWebsearchKey", key: v }); flashSaved(btn) },
      onCancel: () => {
        const row = document.getElementById("row-websearch")
        row.replaceChildren()
        const lbl = document.createElement("span"); lbl.className = "key-label"; lbl.textContent = t("settings.websearchLabel")
        const has = SS.websearchSettings?.hasKey
        const st = document.createElement("span"); st.className = "key-status " + (has ? "ok" : ""); st.textContent = has ? "****" : "—"
        const editBtn = document.createElement("button"); editBtn.className = "key-btn"; editBtn.textContent = has ? t("settings.changeKey") : t("settings.addKey")
        editBtn.addEventListener("click", () => window._editWebsearchKey())
        row.append(lbl, st, editBtn)
        if (has) {
          const delBtn = document.createElement("button"); delBtn.className = "key-btn del-key"; delBtn.textContent = "✕"
          delBtn.addEventListener("click", (e) => window._delWebsearchKey(e.currentTarget))
          row.appendChild(delBtn)
        }
      },
    })
  }

  window._delWebsearchKey = function(btn) {
    window._confirmDelete(btn, () => window._vscode.postMessage({ type: "deleteWebsearchKey" }))
  }
}

/** Tools & Services card HTML (MCP servers + web search key + semantic index). */
export function toolsCardHtml() {
  let html = ""
  // ─── Tools & Services card (MCP servers + web search key + semantic index) ───
  html += `<section class="settings-card"><h4 class="settings-card-title">${t("settings.toolsSection")}</h4><div class="settings-card-body">`
  html += `<div class="settings-subtitle">${t("settings.mcpSection")}</div>`
  html += `<div id="mcp-list"></div>`
  html += `<button id="mcp-add-btn" class="key-btn">${t("settings.mcpAdd")}</button>`
  // F5/MCP.md §4：同一表单服务 add 与 edit（edit 时 name 只读）——token 一等字段（F6②）
  // + headers 逗号分隔提示（F6③，value 可含空格）。
  html += `<div id="mcp-form" style="display:none">
    <div class="key-field"><label>${t("settings.mcp.name")}</label><input id="mcp-name" placeholder="my-server"></div>
    <div class="key-field"><label>${t("settings.mcp.type")}</label><select id="mcp-type"><option value="stdio">stdio</option><option value="http">http</option><option value="ws">ws</option></select></div>
    <div id="mcp-stdio-fields">
      <div class="key-field"><label>${t("settings.mcp.command")}</label><input id="mcp-command" placeholder="npx"></div>
      <div class="key-field"><label>${t("settings.mcp.args")}</label><input id="mcp-args" placeholder="-y pkg"></div>
      <div class="key-field"><label>${t("settings.mcp.env")}</label><input id="mcp-env" placeholder="KEY=value, KEY2=value2 (comma-separated)"></div>
    </div>
    <div id="mcp-http-fields" style="display:none">
      <div class="key-field"><label>${t("settings.mcp.url")}</label><input id="mcp-url" placeholder="https://..."></div>
      <div class="key-field"><label>${t("settings.mcp.token")}</label><input id="mcp-token" placeholder="paste token (Bearer)"></div>
      <div class="key-field"><label>${t("settings.mcp.headers")}</label><input id="mcp-headers" placeholder="Authorization=Bearer xxx, X-Foo=bar"></div>
    </div>
    <div id="mcp-ws-fields" style="display:none">
      <div class="key-field"><label>${t("settings.mcp.wsUrl")}</label><input id="mcp-ws-url" placeholder="ws://..."></div>
      <div class="key-field"><label>${t("settings.mcp.token")}</label><input id="mcp-ws-token" placeholder="paste token (Bearer)"></div>
      <div class="key-field"><label>${t("settings.mcp.headers")}</label><input id="mcp-ws-headers" placeholder="Authorization=Bearer xxx, X-Foo=bar"></div>
    </div>
    <button id="mcp-save-btn" class="key-btn">${t("settings.save")}</button>
    <button id="mcp-cancel-btn" class="key-btn">${t("settings.cancel")}</button>
  </div>`
  html += `<div class="settings-subtitle">${t("settings.websearchSection")}</div>`
  const ws = SS.websearchSettings || {}
  html += `<div class="key-row" id="row-websearch">
    <span class="key-label">${t("settings.websearchLabel")}</span>
    <span class="key-status ${ws.hasKey ? "ok" : ""}" id="status-websearch">${ws.hasKey ? "****" : "—"}</span>
    ${ws.hasKey
      ? `<button class="key-btn" onclick="window._editWebsearchKey()">${t("settings.changeKey")}</button>
         <button class="key-btn del-key" onclick="window._delWebsearchKey(this)">✕</button>`
      : `<button class="key-btn" onclick="window._editWebsearchKey()">${t("settings.addKey")}</button>`}
  </div>
  <div style="font-size:11px;opacity:0.55;padding:2px 0">${t("settings.websearchHelp")}</div>`
  html += `<div class="settings-subtitle">${t("settings.indexSection")}</div>`
  const embedConfigured = SS.indexStatus?.hasEmbedder || false
  html += `<div class="key-row" id="row-embed">
    <span class="key-label">${t("settings.embeddingLabel")}</span>
    <span class="key-status ${embedConfigured ? "ok" : ""}" id="status-embed">${embedConfigured ? "****" : "—"}</span>
    ${embedConfigured
      ? `<button class="key-btn" onclick="window._editEmbedKey()">${t("settings.changeKey")}</button>
         <button class="key-btn del-key" onclick="window._delEmbedKey(this)">✕</button>`
      : `<button class="key-btn" onclick="window._editEmbedKey()">${t("settings.addKey")}</button>`}
  </div>
  <div id="index-status" style="font-size:12px;opacity:0.7;padding:4px 0">—</div>
  <button id="index-build-btn" class="key-btn">${t("settings.indexBuild") || "Build Index"}</button>`
  html += `</div></section>`
  return html
}

/** Bind the MCP form controls + index build button, render MCP/index status, and
 *  request the MCP status from the extension. */
export function bindToolsControls() {
  // Bind MCP type toggle
  document.getElementById("mcp-type").addEventListener("change", (e) => {
    document.getElementById("mcp-stdio-fields").style.display = e.target.value === "stdio" ? "" : "none"
    document.getElementById("mcp-http-fields").style.display = e.target.value === "http" ? "" : "none"
    document.getElementById("mcp-ws-fields").style.display = e.target.value === "ws" ? "" : "none"
  })

  // Bind MCP add
  document.getElementById("mcp-add-btn").addEventListener("click", () => {
    openMcpForm(null)
  })

  // Bind MCP save (add AND edit — name 锁定：edit 时 input readonly)
  document.getElementById("mcp-save-btn").addEventListener("click", () => {
    const nameEl = document.getElementById("mcp-name")
    const name = nameEl.value.trim()
    if (!name) return
    const type = document.getElementById("mcp-type").value
    const config = {}
    if (type === "stdio") {
      config.command = document.getElementById("mcp-command").value.trim()
      const argsStr = document.getElementById("mcp-args").value.trim()
      config.args = argsStr ? argsStr.split(/\s+/).map((s) => s.trim()).filter(Boolean) : []
      const envStr = document.getElementById("mcp-env").value.trim()
      if (envStr) config.env = parseHeadersLike(envStr)
    } else if (type === "ws") {
      config.wsUrl = document.getElementById("mcp-ws-url").value.trim()
      const token = document.getElementById("mcp-ws-token").value.trim()
      if (token) config.token = token
      const headersStr = document.getElementById("mcp-ws-headers").value.trim()
      if (headersStr) config.headers = parseHeadersLike(headersStr)
    } else {
      config.url = document.getElementById("mcp-url").value.trim()
      const token = document.getElementById("mcp-token").value.trim()
      if (token) config.token = token
      const headersStr = document.getElementById("mcp-headers").value.trim()
      if (headersStr) config.headers = parseHeadersLike(headersStr)
    }
    const editing = nameEl.readOnly
    window._vscode.postMessage(editing ? { type: "editMcp", name, config } : { type: "saveMcpServer", name, config })
    flashSaved(document.getElementById("mcp-save-btn"))
    document.getElementById("mcp-form").style.display = "none"
  })

  // Bind MCP cancel
  document.getElementById("mcp-cancel-btn").addEventListener("click", () => {
    document.getElementById("mcp-form").style.display = "none"
  })

  // Bind index build button
  document.getElementById("index-build-btn").addEventListener("click", () => {
    window._vscode.postMessage({ type: "buildIndex" })
    document.getElementById("index-status").textContent = t("settings.indexBuilding")
    document.getElementById("index-build-btn").disabled = true
  })

  // Render index status if we have it
  if (SS.indexStatus) renderIndexStatus()

  // Render MCP server list
  renderMcpList()

  // Request MCP status
  window._vscode.postMessage({ type: "getMcpStatus" })
}

export function renderMcpList() {
  const list = document.getElementById("mcp-list")
  if (!list) return
  const servers = window._mcpServers // array of { name, desc, connected, toolCount, config }
  if (!Array.isArray(servers) || servers.length === 0) {
    list.innerHTML = `<div style="font-size:12px;opacity:0.5;padding:4px 0">${t("settings.mcp.noServers")}</div>`
    return
  }
  list.innerHTML = servers.map((s) => {
    const mark = s.connected ? "●" : "○"
    const markColor = s.connected ? "color:var(--accent)" : "opacity:0.4"
    const type = s.desc.startsWith("ws:") || s.desc.startsWith("wss:") ? "ws" : s.desc.startsWith("http") ? "http" : "stdio"
    const count = s.connected && s.toolCount ? ` · ${s.toolCount} tools` : ""
    return `<div class="key-row" style="font-size:12px">
      <span style="${markColor};width:14px">${mark}</span>
      <span class="key-label">${escHtml(s.name)}</span>
      <span style="opacity:0.5;flex:1;margin:0 8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(s.desc)}${count}</span>
      <span style="font-size:10px;opacity:0.4;margin-right:8px">${type}</span>
      <button class="key-btn mcp-tools-btn" data-name="${escHtml(s.name)}">${t("settings.mcp.tools")}</button>
      <button class="key-btn mcp-edit-btn" data-name="${escHtml(s.name)}">${t("settings.mcp.edit")}</button>
      <button class="key-btn mcp-test-btn" data-name="${escHtml(s.name)}">${t("settings.mcp.test")}</button>
      <button class="key-btn mcp-reconnect-btn" data-name="${escHtml(s.name)}">${t("settings.mcp.reconnect")}</button>
      <button class="key-btn del-key mcp-del-btn" data-name="${escHtml(s.name)}">✕</button>
    </div>
    <div class="mcp-tools-detail" id="mcp-tools-${escHtml(s.name)}" style="display:none"></div>`
  }).join("")
  list.querySelectorAll(".mcp-del-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      window._confirmDelete(btn, () => window._vscode.postMessage({ type: "deleteMcpServer", name: btn.dataset.name }))
    })
  })
  list.querySelectorAll(".mcp-tools-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const detail = document.getElementById("mcp-tools-" + btn.dataset.name)
      if (!detail) return
      if (detail.style.display !== "none") { detail.style.display = "none"; return }
      detail.style.display = ""
      detail.innerHTML = '<div style="opacity:0.5;font-size:11px">' + t("settings.mcp.loading") + "</div>"
      window._vscode.postMessage({ type: "mcpTools", name: btn.dataset.name })
    })
  })
  list.querySelectorAll(".mcp-edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const s = (window._mcpServers || []).find((x) => x.name === btn.dataset.name)
      openMcpForm(s?.config ? { ...s.config, name: s.name } : null)
    })
  })
  list.querySelectorAll(".mcp-test-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const detail = document.getElementById("mcp-tools-" + btn.dataset.name)
      if (detail) {
        detail.style.display = ""
        detail.innerHTML = '<div style="opacity:0.5;font-size:11px">' + t("settings.mcp.testing") + "</div>"
      }
      window._vscode.postMessage({ type: "testMcp", name: btn.dataset.name })
    })
  })
  list.querySelectorAll(".mcp-reconnect-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      window._vscode.postMessage({ type: "reconnectMcp", name: btn.dataset.name })
    })
  })
}

/** MCP test result (F4/D-2): render under the server row (same expander as tools). */
export function updateMcpTestResult({ name, ok, toolCount, latencyMs, error }) {
  const detail = document.getElementById("mcp-tools-" + name)
  if (!detail) return
  if (!ok) {
    detail.innerHTML = `<div style="color:#f14c4c;font-size:11px;padding:4px 0">${escHtml(error || "failed")}</div>`
    return
  }
  detail.innerHTML = `<div style="color:var(--green,#4ec9b0);font-size:11px;padding:4px 0">${escHtml(t("settings.mcp.testOk", { count: toolCount, latency: latencyMs }))}</div>`
}

/** MCP tools expander result: render the tool list (or error) under the server row. */
export function updateMcpTools({ name, tools, error }) {
  const detail = document.getElementById("mcp-tools-" + name)
  if (!detail) return
  if (error) {
    detail.innerHTML = `<div style="color:#f14c4c;font-size:11px;padding:4px 0">${escHtml(error)}</div>`
    return
  }
  if (!tools || tools.length === 0) {
    detail.innerHTML = `<div style="opacity:0.5;font-size:11px;padding:4px 0">${t("settings.mcp.noTools")}</div>`
    return
  }
  detail.innerHTML = tools.map((tl) => {
    const params = tl.inputSchema?.properties ? Object.keys(tl.inputSchema.properties).join(", ") : ""
    return `<div class="mcp-tool-row">
      <div class="mcp-tool-name">${escHtml(tl.name)}</div>
      <div class="mcp-tool-desc">${escHtml(tl.description || "")}</div>
      ${params ? `<div class="mcp-tool-params">params: ${escHtml(params)}</div>` : ""}
    </div>`
  }).join("")
}

export function updateWebsearchSettings(settings) {
  SS.websearchSettings = settings || {}
}

export function updateIndexStatus(s) {
  SS.indexStatus = s
  renderIndexStatus()
}

function renderIndexStatus() {
  const el = document.getElementById("index-status")
  if (!el) return
  const btn = document.getElementById("index-build-btn")
  if (!SS.indexStatus) {
    el.textContent = t("settings.indexNoKey")
    if (btn) btn.disabled = true
    return
  }
  if (SS.indexStatus.built) {
    const mm = SS.indexStatus.mismatch
    if (mm) {
      // B1（MEMORY.md §4.2 契约四）：索引在但由另一模型构建——状态行直说两个模型名 + 保留
      // 重建入口（否则用户只看到"搜不到"，看不到"给了错结果"）。
      el.textContent = t("settings.indexMismatch", { index: mm.indexModel, current: mm.currentModel })
    } else {
      el.textContent = t("settings.indexBuilt", { files: SS.indexStatus.files, chunks: SS.indexStatus.chunks })
    }
    if (btn) { btn.textContent = t("settings.indexRebuild") || "Rebuild Index"; btn.disabled = false }
  } else {
    el.textContent = t("settings.indexNotBuilt")
    if (btn) btn.disabled = false
  }
}

// ─── MCP add/edit form helpers (F5/F6, MCP.md §4) ─────────────────────────────

/** F6③（CLI parseHeaders parity）：`key=value, key2=value2` 逗号分隔解析——value 可含
 *  空格（Bearer token 场景）。`k=`（空 value）删除该项；返回 null = 全部清空。 */
export function parseHeadersLike(input) {
  const out = {}
  for (const pair of String(input).split(",")) {
    const eq = pair.indexOf("=")
    if (eq > 0) {
      const key = pair.slice(0, eq).trim()
      const value = pair.slice(eq + 1).trim().replace(/^["']|["']$/g, "")
      if (!key) continue
      if (value) out[key] = value
      else delete out[key]
    }
  }
  return Object.keys(out).length > 0 ? out : null
}

/** Open the MCP form: null = add (blank), otherwise prefill from the server's config
 *  (edit — name input becomes readonly, F3 name 不可改). */
export function openMcpForm(cfg) {
  const nameEl = document.getElementById("mcp-name")
  const editing = !!cfg
  document.getElementById("mcp-form").style.display = "block"
  nameEl.value = editing ? cfg.name : ""
  nameEl.readOnly = editing
  const type = editing ? (cfg.wsUrl ? "ws" : cfg.url ? "http" : "stdio") : "stdio"
  document.getElementById("mcp-type").value = type
  document.getElementById("mcp-command").value = editing && cfg.command ? cfg.command : ""
  document.getElementById("mcp-args").value = editing && Array.isArray(cfg.args) ? cfg.args.join(" ") : ""
  document.getElementById("mcp-env").value = editing && cfg.env ? kvToInput(cfg.env) : ""
  document.getElementById("mcp-url").value = editing && cfg.url ? cfg.url : ""
  document.getElementById("mcp-token").value = editing && cfg.token ? cfg.token : ""
  document.getElementById("mcp-headers").value = editing && cfg.headers ? kvToInput(cfg.headers) : ""
  document.getElementById("mcp-ws-url").value = editing && cfg.wsUrl ? cfg.wsUrl : ""
  document.getElementById("mcp-ws-token").value = editing && cfg.token ? cfg.token : ""
  document.getElementById("mcp-ws-headers").value = editing && cfg.headers ? kvToInput(cfg.headers) : ""
  document.getElementById("mcp-stdio-fields").style.display = type === "stdio" ? "" : "none"
  document.getElementById("mcp-http-fields").style.display = type === "http" ? "" : "none"
  document.getElementById("mcp-ws-fields").style.display = type === "ws" ? "" : "none"
}

/** headers/env 对象 → 单行输入串（`k=v, k2=v2`，与 parseHeadersLike 互逆）。 */
function kvToInput(obj) {
  return Object.entries(obj).map(([k, v]) => `${k}=${v}`).join(", ")
}
