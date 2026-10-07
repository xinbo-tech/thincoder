/**
 * settings-mcp-dialog.js — MCP 添加 ∕ 编辑弹窗（添加入口弹窗统一批 · 2026-10-07 · 台账 #1054）。
 *
 * 设计单源 = `docs/vsc/design/SETTINGS.md` §2.17 ①（表单族自 `settings-mcp.js` 析出——沿
 * `settings-provider-dialog.js` 先例）：单例开合 ∥ 开框重置（新增态 = 表单空 ∥ 三组行集零行 ∥
 * 状态行清）∥ 五路关（保存〔守卫通过才发 + 关〕∥ 取消 ∥ 背板 ∥ 框内 Esc〔`stopPropagation`——
 * 不连带关设置面板〕∥ `closeSettings()` 同清）∥ 拒因可见（name 空 ⇒ 零发 ∥ 不关框 ∥ 在编值保留
 * ∥ `#mcp-status` 显 `settings.mcp.nameRequired`）。
 * 无在飞果入框路径（探测 ∥ 重连结果皆落列表行面——`updateMcpTools` ∥ `updateMcpTestResult`）
 * ⇒ 不设代际（与添加弹窗有拉取探果不同）。
 * 面形（沿 §2.16 ① 全件复用）：幕 = `.settings-dialog-backdrop`（z 999）；卡 = `#mcp-dialog` +
 * `.settings-dialog`（z 1000）；体 = `.settings-card-body` + 首件 `.settings-subtitle`（态标题）+
 * 既有 `#mcp-form` 容器（id ∥ 字段 id ∥ kv 行集助手 ∥ 三型组零改）+ 体尾 `#mcp-status`
 * （`.key-status` 样式复用）。零新 CSS。
 */
import { escHtml } from "./ui.js"
import { t } from "./i18n.js"
import { flashSaved } from "./settings-widgets.js"

/** 行式键值三组（行 `data-kv-row` 值 ∥ 加行钮 `data-kv-add` 值——stdio `env` ∥ http `headers` ∥ ws `headers`）。 */
const KV_GROUPS = Object.freeze(["env", "headers", "ws-headers"])

/** 开框建面的实件面（关框即弃——模块内唯一持有；`null` = 框不在场）。 */
let _els = null

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

/** MCP 表单 HTML（弹窗体回插点——F5/MCP.md §4：同一表单服务 add 与 edit，edit 时 name 只读；
 *  env ∥ headers 两组列 = 行集 + `[+ 添加行]`）。 */
function mcpFormHtml() {
  let html = ""
  // F5/MCP.md §4：同一表单服务 add 与 edit（edit 时 name 只读）——token 一等字段（F6②）+ 行式键值（F6③ 承接）
  html += `<div id="mcp-form">
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

/** 建两件（框幕 + 卡）并挂 `document.body`：态标题（两态词）+ 体（表单 ∥ 状态行）+ 表单控件绑定。 */
function buildDialog(editing) {
  const backdrop = document.createElement("div")
  backdrop.className = "settings-dialog-backdrop"
  backdrop.addEventListener("click", closeMcpDialog)

  const card = document.createElement("div")
  card.id = "mcp-dialog"
  card.className = "settings-dialog"
  card.setAttribute("role", "dialog")
  card.setAttribute("aria-modal", "true")
  const titleKey = editing ? "settings.mcp.editTitle" : "settings.mcp.addTitle"
  card.setAttribute("aria-label", t(titleKey))
  // 框内 Esc：拦截冒泡 ⇒ 不连带执行 chat.js 的「关设置面板」分支（面板保持打开——沿确认弹框同判）
  card.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return
    e.stopPropagation()
    closeMcpDialog()
  })

  const body = document.createElement("div")
  body.className = "settings-card-body"
  const subtitle = document.createElement("div")
  subtitle.className = "settings-subtitle"
  subtitle.textContent = t(titleKey)
  body.appendChild(subtitle)
  body.insertAdjacentHTML("beforeend", mcpFormHtml())
  const status = document.createElement("div")
  status.id = "mcp-status"
  status.className = "key-status"
  body.appendChild(status)
  card.appendChild(body)
  document.body.append(backdrop, card)

  // 表单控件绑定（建面即绑——型组切换 ∥ kv 加删行 ∥ 保存 ∥ 取消）
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
  document.getElementById("mcp-save-btn").addEventListener("click", saveMcpForm)
  document.getElementById("mcp-cancel-btn").addEventListener("click", closeMcpDialog)
  return { backdrop, card }
}

/** 开框（单例：已在框 ⇒ 零动作）：建两件挂 `document.body`；新增态 = 表单空（type 回首项 ∥ 三组
 *  行集零行 ∥ `#mcp-status` 清）∥ 编辑态 = 预填 + name 只读；初始焦点 = `#mcp-name`（新增）∥
 *  `#mcp-type`（编辑）（+50ms）。 */
export function openMcpDialog(cfg) {
  if (document.getElementById("mcp-dialog")) return
  const editing = !!cfg
  _els = buildDialog(editing)
  const nameEl = document.getElementById("mcp-name")
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
  // 初始焦点 = `#mcp-name`（新增）∥ `#mcp-type`（编辑）（+50ms——元素引用先行捕获：
  // 框在定时器到期前关闭 ⇒ 焦对已摘节点 = 零动作，不取 `document` 重查，沿 `settings-provider-dialog.js` 先例）
  const focusEl = document.getElementById(editing ? "mcp-type" : "mcp-name")
  setTimeout(() => focusEl.focus(), 50)
}

/** 关框（五路同效的清除入口，幂等）：卡 ∥ 幕两件同清（只清自身两件——#1054 跨框互清收正）。 */
export function closeMcpDialog() {
  _els?.card?.remove()
  _els?.backdrop?.remove()
  _els = null
}

/** 保存（守卫通过才发 + 关）：name 空 ⇒ 拒因可见（零发 ∥ 不关框 ∥ 在编值保留）；受理 ⇒ 发消息
 *  （edit 态 = `editMcp` ∥ 新增态 = `saveMcpServer`——`nameEl.readOnly` 判别，两形零改）+ 关框。 */
function saveMcpForm() {
  const nameEl = document.getElementById("mcp-name")
  const name = nameEl.value.trim()
  if (!name) {
    const status = document.getElementById("mcp-status")
    status.textContent = t("settings.mcp.nameRequired")
    status.style.color = "var(--red)"
    return
  }
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
  closeMcpDialog()
}
