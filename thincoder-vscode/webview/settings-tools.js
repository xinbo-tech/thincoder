/**
 * settings-tools.js — tools & services card (split out of settings.js): MCP server
 * list + add form, embedding/websearch key rows, semantic-index status.
 */
import { escHtml } from "./ui.js"
import { t } from "./i18n.js"
import { SS } from "./settings-state.js"
import { keyRowEdit, flashSaved } from "./settings-widgets.js"

/** Install the window._* handlers the embed/websearch key rows' controls call（键行钮经
 *  `renderKeyRow` 单点绑到这些 handler——行内属性绑定已摘除，见 `SETTINGS.md` §2.10）。 */
export function installToolsKeyHandlers() {
  // Embedding key row
  window._editEmbedKey = function() {
    const row = document.getElementById("row-embed")
    keyRowEdit(row, {
      label: t("settings.embeddingLabel"), placeholder: "sk-...",
      onSave: (v, btn) => { window._vscode.postMessage({ type: "saveEmbedKey", key: v }); flashSaved(btn) },
      onCancel: () => {
        // 取消 = 回到键行静止态——与工具卡渲染器**同源**（`embedRowHtml`——单一表达式；
        // 绑定随同点重贴——`renderKeyRow`；编辑态输入框在位 ⇒ 守卫显式关）
        renderKeyRow("row-embed", embedRowHtml(), { skipWhileEditing: false })
      },
    })
  }

  window._delEmbedKey = function(btn) {
    window._confirmSecretDelete(btn, () => window._vscode.postMessage({ type: "deleteEmbedKey" }))
  }

  // Web search key (Tavily)
  window._editWebsearchKey = function() {
    const row = document.getElementById("row-websearch")
    keyRowEdit(row, {
      label: t("settings.websearchLabel"), placeholder: "tvly-...",
      onSave: (v, btn) => { window._vscode.postMessage({ type: "saveWebsearchKey", key: v }); flashSaved(btn) },
      onCancel: () => {
        // 取消 = 回到键行静止态——与工具卡渲染器**同源**（`websearchRowHtml`——单一表达式；
        // 绑定随同点重贴——`renderKeyRow`；编辑态输入框在位 ⇒ 守卫显式关）
        renderKeyRow("row-websearch", websearchRowHtml(), { skipWhileEditing: false })
      },
    })
  }

  window._delWebsearchKey = function(btn) {
    window._confirmSecretDelete(btn, () => window._vscode.postMessage({ type: "deleteWebsearchKey" }))
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
  html += websearchRowHtml()
  html += `<div style="font-size:11px;opacity:0.55;padding:2px 0">${t("settings.websearchHelp")}</div>`
  html += `<div class="settings-subtitle">${t("settings.indexSection")}</div>`
  html += embedRowHtml()
  html += `<div id="index-status" style="font-size:12px;opacity:0.7;padding:4px 0">—</div>`
  html += `<button id="index-build-btn" class="key-btn">${t("settings.indexBuild") || "Build Index"}</button>`
  html += `</div></section>`
  return html
}

/** Bind the MCP form controls + index build button, render MCP/index status, and
 *  request the MCP status from the extension. */
export function bindToolsControls() {
  // 键行单点装配（渲染 + 绑定）——行内属性绑定已摘除 ⇒ 钮必须经此重贴（建面 · 推送回填 · 取消重建三路同点）
  renderKeyRow("row-websearch", websearchRowHtml())
  renderKeyRow("row-embed", embedRowHtml())

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
      // 不可复得类（删整条时 token / headers 一并消失——`SETTINGS.md` §2.10 入口册 #5）：过确认门；
      // 载荷 = 开框时捕获（弹框在位期间的整表重绘不改删除目标——同 §2.10 弹框契约）
      const name = btn.dataset.name
      window._confirmSecretDelete(btn, () => window._vscode.postMessage({ type: "deleteMcpServer", name }))
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

/** 键行 HTML：Web search（渲染器与回填**同源**——单一表达式；`updateWebsearchSettings` 整行重绘）。 */
function websearchRowHtml() {
  const ws = SS.websearchSettings || {}
  return `<div class="key-row" id="row-websearch">
    <span class="key-label">${t("settings.websearchLabel")}</span>
    <span class="key-status ${ws.hasKey ? "ok" : ""}" id="status-websearch">${ws.hasKey ? "****" : "—"}</span>
    ${ws.hasKey
      ? `<button class="key-btn">${t("settings.changeKey")}</button>
         <button class="key-btn del-key">✕</button>`
      : `<button class="key-btn">${t("settings.addKey")}</button>`}
  </div>`
}

/** 键行 HTML：Semantic Index（同上——`renderIndexStatus` 现同拍重绘 `#row-embed`）。 */
function embedRowHtml() {
  const embedConfigured = SS.indexStatus?.hasEmbedder || false
  return `<div class="key-row" id="row-embed">
    <span class="key-label">${t("settings.embeddingLabel")}</span>
    <span class="key-status ${embedConfigured ? "ok" : ""}" id="status-embed">${embedConfigured ? "****" : "—"}</span>
    ${embedConfigured
      ? `<button class="key-btn">${t("settings.changeKey")}</button>
         <button class="key-btn del-key">✕</button>`
      : `<button class="key-btn">${t("settings.addKey")}</button>`}
  </div>`
}

/** 键行两控件动作（按行 id 索引）——渲染 + 绑定的单点 `renderKeyRow` 从此表取动作。 */
const KEY_ROW_ACTIONS = {
  "row-websearch": {
    onEdit: () => window._editWebsearchKey(),
    onDelete: (btn) => window._delWebsearchKey(btn),
  },
  "row-embed": {
    onEdit: () => window._editEmbedKey(),
    onDelete: (btn) => window._delEmbedKey(btn),
  },
}

/** 键行单点：渲染 + 绑定（`renderKeyRow(id, html)`）——两处密钥行的两个控件（编辑钮
 *  `[Change]` / 空态 `[Add]` · 删除钮 `✕`）一并在此装配，行内属性绑定已摘除（夹具
 *  （happy-dom）下行内属性绑定不可驱动 ⇒ 判据动作面不可机判——`SETTINGS.md` §2.10）。
 *  `skipWhileEditing` = 键行编辑中（输入框在位）则跳过重绘——用户输入优先于推送（U-S10）；
 *  `onCancel` 重建路径显式置 false（编辑态即因输入框在位——守卫不关则无法回静止态）。 */
function renderKeyRow(id, html, { skipWhileEditing = true } = {}) {
  const row = document.getElementById(id)
  if (!row) return
  if (skipWhileEditing && row.querySelector("input")) return
  row.outerHTML = html
  const fresh = document.getElementById(id)
  const actions = KEY_ROW_ACTIONS[id]
  if (!fresh || !actions) return
  fresh.querySelector(".key-btn:not(.del-key)")?.addEventListener("click", () => actions.onEdit())
  fresh.querySelector(".del-key")?.addEventListener("click", (e) => actions.onDelete(e.currentTarget))
}

export function updateWebsearchSettings(settings) {
  SS.websearchSettings = settings || {}
  renderKeyRow("row-websearch", websearchRowHtml())
}

export function updateIndexStatus(s) {
  SS.indexStatus = s
  renderIndexStatus()
}

function renderIndexStatus() {
  // D-W5：`#row-embed` 键行同拍重绘（indexStatus 为异步推送——可能晚于 agentSettings 触发拍；
  // 不扩则建面后到达时保持 `—` = 假阴性）
  renderKeyRow("row-embed", embedRowHtml())
  const el = document.getElementById("index-status")
  if (!el) return
  const btn = document.getElementById("index-build-btn")
  if (!SS.indexStatus) {
    el.textContent = t("settings.indexNoKey")
    if (btn) btn.disabled = true
    return
  }
  if (SS.indexStatus.built) {
    // W8（索引面归一）：mismatch 分支退场——核面 = 失效向量置空 + 检索懒回填（模型变更零手动重建）。
    el.textContent = t("settings.indexBuilt", { files: SS.indexStatus.files, chunks: SS.indexStatus.chunks })
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
