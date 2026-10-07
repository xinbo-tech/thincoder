/**
 * settings-mcp.js — MCP 面（先拆后改：自 `settings-tools.js` 拆出——`SETTINGS.md` §2.10 拆档触发达成）：
 * MCP 服务器列表 + 增 ∕ 改表单（三型字段组）。**env ∥ headers = 行式键值编辑器**（MCP 键值行式输入批 ·
 * 2026-10-07 · 台账 #1036；`SETTINGS.md` §2.4）：每行 = 键格 + 值格 + ✕，行集下 `[+ 添加行]`；零项 ⇒ 零行。
 * 值 = 字面（逗号 ∥ 等号 ∥ 引号 ∥ 空格原样——本批即修「值含逗号即坏」）；粘贴零解析（整块文本落一个格内）。
 * 提交口径：键 ∥ 值 trim；空键行 ∥ 空值行不提交；重复键后行胜；全空 ⇒ 该字段删除（`config` 不带该键）。
 * 缝 = `mcpFormHtml()` ∥ `bindMcpControls()` 两口回插；对外导出名零改（`settings.js` ∥ `chat.js` 消费面零改）。
 * 纪律：DOM 即态（表单态不入 SS）；零新 CSS（复用 `.key-row` ∥ `.key-btn` ∥ `.del-key` + 行内宽度 style）。
 */
import { escHtml } from "./ui.js"
import { t } from "./i18n.js"
import { flashSaved } from "./settings-widgets.js"

/** 行式键值三组（行 `data-kv-row` 值 ∥ 加行钮 `data-kv-add` 值——stdio `env` ∥ http `headers` ∥ ws `headers`）。 */
const KV_GROUPS = Object.freeze(["env", "headers", "ws-headers"])

/** 行式键值单行 HTML（键格 + 值格 + ✕——宽度行内 style；`✕` = 摘该行）。 */
function kvRowHtml(group, k = "", v = "") {
  return `<div class="key-row" data-kv-row="${group}">
    <input data-kv-part="k" style="flex:1;min-width:0" value="${escHtml(k)}" placeholder="${escHtml(t("settings.mcp.kvKey"))}">
    <input data-kv-part="v" style="flex:2;min-width:0" value="${escHtml(v)}" placeholder="${escHtml(t("settings.mcp.kvValue"))}">
    <button class="key-btn del-key" data-kv-del aria-label="${escHtml(t("settings.mcp.kvRemove"))}">✕</button>
  </div>`
}

/** 对象 → 行集（`Object.entries` 序 = 插入序；零项 ⇒ 零行——零假造）；整组重写（残行随摘）。 */
function kvRowsInto(group, obj) {
  const form = document.getElementById("mcp-form")
  const addBtn = form ? form.querySelector(`[data-kv-add="${group}"]`) : null
  if (!addBtn) return
  for (const row of form.querySelectorAll(`[data-kv-row="${group}"]`)) row.remove()
  const entries = obj !== null && typeof obj === "object" && !Array.isArray(obj) ? Object.entries(obj) : []
  if (entries.length > 0) addBtn.insertAdjacentHTML("beforebegin", entries.map(([k, v]) => kvRowHtml(group, String(k), String(v))).join(""))
}

/** 行集 → 对象（DOM 序；键 ∥ 值 trim；空键行 ∥ 空值行不提交；重复键后行胜；零项 ⇒ `null` = 清空）。 */
function kvObjectOf(group) {
  const form = document.getElementById("mcp-form")
  if (!form) return null
  const out = {}
  for (const row of form.querySelectorAll(`[data-kv-row="${group}"]`)) {
    const key = row.querySelector('[data-kv-part="k"]').value.trim()
    const value = row.querySelector('[data-kv-part="v"]').value.trim()
    if (!key || !value) continue
    out[key] = value
  }
  return Object.keys(out).length > 0 ? out : null
}

/** MCP 表单 HTML（回插点 = `toolsCardHtml` 卡壳——F5/MCP.md §4：同一表单服务 add 与 edit，
 *  edit 时 name 只读）；env ∥ headers 两组列 = 行集 + `[+ 添加行]`。 */
export function mcpFormHtml() {
  let html = ""
  // F5/MCP.md §4：同一表单服务 add 与 edit（edit 时 name 只读）——token 一等字段（F6②）+ 行式键值（F6③ 承接）
  html += `<div id="mcp-form" style="display:none">
    <div class="key-field"><label>${t("settings.mcp.name")}</label><input id="mcp-name" placeholder="my-server"></div>
    <div class="key-field"><label>${t("settings.mcp.type")}</label><select id="mcp-type"><option value="stdio">stdio</option><option value="http">http</option><option value="ws">ws</option></select></div>
    <div id="mcp-stdio-fields">
      <div class="key-field"><label>${t("settings.mcp.command")}</label><input id="mcp-command" placeholder="npx"></div>
      <div class="key-field"><label>${t("settings.mcp.args")}</label><input id="mcp-args" placeholder="-y pkg"></div>
      <div class="key-field"><label>${t("settings.mcp.env")}</label><button class="key-btn" data-kv-add="env">${t("settings.mcp.kvAdd")}</button></div>
    </div>
    <div id="mcp-http-fields" style="display:none">
      <div class="key-field"><label>${t("settings.mcp.url")}</label><input id="mcp-url" placeholder="https://..."></div>
      <div class="key-field"><label>${t("settings.mcp.token")}</label><input id="mcp-token" placeholder="paste token (Bearer)"></div>
      <div class="key-field"><label>${t("settings.mcp.headers")}</label><button class="key-btn" data-kv-add="headers">${t("settings.mcp.kvAdd")}</button></div>
    </div>
    <div id="mcp-ws-fields" style="display:none">
      <div class="key-field"><label>${t("settings.mcp.wsUrl")}</label><input id="mcp-ws-url" placeholder="ws://..."></div>
      <div class="key-field"><label>${t("settings.mcp.token")}</label><input id="mcp-ws-token" placeholder="paste token (Bearer)"></div>
      <div class="key-field"><label>${t("settings.mcp.headers")}</label><button class="key-btn" data-kv-add="ws-headers">${t("settings.mcp.kvAdd")}</button></div>
    </div>
    <button id="mcp-save-btn" class="key-btn">${t("settings.save")}</button>
    <button id="mcp-cancel-btn" class="key-btn">${t("settings.cancel")}</button>
  </div>`
  return html
}

/** MCP 表单控件绑定 + 列表渲染 + 状态请求（回插点 = `bindToolsControls`——卡级绑定另半在 `settings-tools.js`）。 */
export function bindMcpControls() {
  // Bind MCP type toggle
  document.getElementById("mcp-type").addEventListener("change", (e) => {
    document.getElementById("mcp-stdio-fields").style.display = e.target.value === "stdio" ? "" : "none"
    document.getElementById("mcp-http-fields").style.display = e.target.value === "http" ? "" : "none"
    document.getElementById("mcp-ws-fields").style.display = e.target.value === "ws" ? "" : "none"
  })

  // 行式键值：加行（尾附一空行）∥ 删行（摘该行）——行容器上的事件委托（表单态，不落盘）
  document.getElementById("mcp-form").addEventListener("click", (e) => {
    const addBtn = e.target.closest ? e.target.closest("[data-kv-add]") : null
    if (addBtn) {
      addBtn.insertAdjacentHTML("beforebegin", kvRowHtml(addBtn.dataset.kvAdd))
      return
    }
    const delBtn = e.target.closest ? e.target.closest("[data-kv-del]") : null
    if (delBtn) {
      const row = delBtn.closest(".key-row")
      if (row) row.remove()
    }
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
      const env = kvObjectOf("env")
      if (env) config.env = env
    } else if (type === "ws") {
      config.wsUrl = document.getElementById("mcp-ws-url").value.trim()
      const token = document.getElementById("mcp-ws-token").value.trim()
      if (token) config.token = token
      const headers = kvObjectOf("ws-headers")
      if (headers) config.headers = headers
    } else {
      config.url = document.getElementById("mcp-url").value.trim()
      const token = document.getElementById("mcp-token").value.trim()
      if (token) config.token = token
      const headers = kvObjectOf("headers")
      if (headers) config.headers = headers
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

/** Open the MCP form: null = add (blank), otherwise prefill from the server's config
 *  (edit — name input becomes readonly, F3 name 不可改)；行集按对象 `Object.entries` 序重灌（值 = 字面）。 */
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
  for (const group of KV_GROUPS) kvRowsInto(group, null)
  if (editing && cfg.env) kvRowsInto("env", cfg.env)
  if (editing && cfg.headers) { kvRowsInto("headers", cfg.headers); kvRowsInto("ws-headers", cfg.headers) }
  document.getElementById("mcp-url").value = editing && cfg.url ? cfg.url : ""
  document.getElementById("mcp-token").value = editing && cfg.token ? cfg.token : ""
  document.getElementById("mcp-ws-url").value = editing && cfg.wsUrl ? cfg.wsUrl : ""
  document.getElementById("mcp-ws-token").value = editing && cfg.token ? cfg.token : ""
  document.getElementById("mcp-stdio-fields").style.display = type === "stdio" ? "" : "none"
  document.getElementById("mcp-http-fields").style.display = type === "http" ? "" : "none"
  document.getElementById("mcp-ws-fields").style.display = type === "ws" ? "" : "none"
}
