/**
 * settings-mcp.js — MCP 列表面（先拆后改：自 `settings-tools.js` 拆出——`SETTINGS.md` §2.10 拆档触发达成；
 * 表单族续拆入 `settings-mcp-dialog.js`——添加入口弹窗统一批 · 2026-10-07 · 台账 #1054 · `SETTINGS.md` §2.17 ①）。
 * 本档只留列表 ∥ 探测结果 ∥ 状态；env ∥ headers 行式键值机制（MCP 键值行式输入批 · 2026-10-07 ·
 * 台账 #1036；`SETTINGS.md` §2.4）随表单入弹窗档（助手 ∥ 三型组 ∥ 提交判据零改）。
 * 缝 = `bindMcpControls()` 回插口（`settings-tools.js` 消费）；导出面 = 列表渲染 + 两结果渲染。
 * 纪律：DOM 即态（表单态不入 SS）；零新 CSS。
 */
import { escHtml } from "./ui.js"
import { t } from "./i18n.js"
import { openMcpDialog } from "./settings-mcp-dialog.js"

/** MCP 控件绑定 + 列表渲染 + 状态请求（回插点 = `bindToolsControls`——卡级绑定另半在 `settings-tools.js`）。 */
export function bindMcpControls() {
  // 添加入口 ⇒ 弹窗（#1054 表单入框；行「Edit」= 同框复用，编辑态随 `renderMcpList`）
  document.getElementById("mcp-add-btn").addEventListener("click", () => {
    openMcpDialog(null)
  })

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
      // 编辑态 = 同框复用（#1054——弹窗体；name 只读 ∥ 预填语义零改，随表单族迁档）
      const s = (window._mcpServers || []).find((x) => x.name === btn.dataset.name)
      openMcpDialog(s?.config ? { ...s.config, name: s.name } : null)
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
