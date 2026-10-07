/**
 * settings-tools.js — tools & services card (split out of settings.js): MCP server
 * list（入口钮居本面 ∥ 表单族居 `settings-mcp-dialog.js`——#1054）, embedding/websearch
 * key rows, semantic-index status.
 */
import { t } from "./i18n.js"
import { SS } from "./settings-state.js"
import { keyRowEdit, flashSaved } from "./settings-widgets.js"
import { bindMcpControls } from "./settings-mcp.js"

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
  // MCP 表单已迁弹窗（#1054——`settings-mcp-dialog.js`；卡内只留列表 + 入口钮）
  html += `<div class="settings-subtitle">${t("settings.websearchSection")}</div>`
  html += websearchRowHtml()
  html += `<div style="font-size:11px;opacity:0.55;padding:2px 0">${t("settings.websearchHelp")}</div>`
  html += `<div class="settings-subtitle">${t("settings.indexSection")}</div>`
  html += embedRowHtml()
  html += `<div id="index-status" style="font-size:12px;opacity:0.7;padding:4px 0">—</div>`
  // P1 两读（KD-69 · 台账 #697）：库大小行 ∥ 逐 origin 行数行（缺位 ⇒ 隐藏——零节点；`pre-line` 供逐行）
  html += `<div id="index-db-size" style="font-size:12px;opacity:0.7;padding:2px 0;display:none"></div>`
  html += `<div id="index-origins" style="font-size:12px;opacity:0.7;padding:2px 0;display:none;white-space:pre-line"></div>`
  html += `<button id="index-build-btn" class="key-btn">${t("settings.indexBuild") || "Build Index"}</button>`
  html += `</div></section>`
  return html
}

/** Bind the index build button + render index status, and the MCP half (list render ∥
 *  status request) via `bindMcpControls()`（`settings-mcp.js`——表单族居弹窗档，#1054）。 */
export function bindToolsControls() {
  // 键行单点装配（渲染 + 绑定）——行内属性绑定已摘除 ⇒ 钮必须经此重贴（建面 · 推送回填 · 取消重建三路同点）
  renderKeyRow("row-websearch", websearchRowHtml())
  renderKeyRow("row-embed", embedRowHtml())

  // Bind index build button
  document.getElementById("index-build-btn").addEventListener("click", () => {
    window._vscode.postMessage({ type: "buildIndex" })
    document.getElementById("index-status").textContent = t("settings.indexBuilding")
    document.getElementById("index-build-btn").disabled = true
  })

  // Render index status if we have it
  if (SS.indexStatus) renderIndexStatus()

  // MCP 面（表单控件绑定 ∥ 列表渲染 ∥ 状态请求）——`settings-mcp.js`（MCP 面出档）
  bindMcpControls()
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

/** 字节数归一读数（P1）：非有限 ∕ 负 ⇒ `null`；< 1024 ⇒ `B`，否则逐级 `KB` ∕ `MB` ∕ `GB` 一位小数。 */
function formatBytes(value) {
  if (!Number.isFinite(value) || value < 0) return null
  if (value < 1024) return `${value} B`
  const kb = value / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  return `${(mb / 1024).toFixed(1)} GB`
}

/** P1 两读渲染（KD-69 —— 库大小行 ∥ 逐 origin 行数行）：值缺 ⇒ 隐藏（零节点，禁假造）；
 *  `textContent` 承载（origin 为盘径原串——零 HTML 注入面）；origin 行首前缀住本渲染面拼装。 */
function renderIndexReadings(status) {
  const size = document.getElementById("index-db-size")
  if (size) {
    const text = formatBytes(status?.dbBytes)
    if (text === null) { size.textContent = ""; size.style.display = "none" }
    else { size.textContent = t("settings.indexDbSize", { size: text }); size.style.display = "" }
  }
  const origins = document.getElementById("index-origins")
  if (origins) {
    const rows = Array.isArray(status?.origins) ? status.origins.filter((r) => r !== null && typeof r === "object") : []
    if (rows.length === 0) { origins.textContent = ""; origins.style.display = "none" }
    else {
      origins.textContent = rows.map((r) => `${String(r.origin ?? "")} — ${t("settings.indexOriginCounts", { code: Number.isFinite(r.code) ? r.code : 0, doc: Number.isFinite(r.doc) ? r.doc : 0 })}`).join("\n")
      origins.style.display = ""
    }
  }
}

function renderIndexStatus() {
  // D-W5：`#row-embed` 键行同拍重绘（indexStatus 为异步推送——可能晚于 agentSettings 触发拍；
  // 不扩则建面后到达时保持 `—` = 假阴性）
  renderKeyRow("row-embed", embedRowHtml())
  const el = document.getElementById("index-status")
  if (!el) return
  const btn = document.getElementById("index-build-btn")
  renderIndexReadings(SS.indexStatus)
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
