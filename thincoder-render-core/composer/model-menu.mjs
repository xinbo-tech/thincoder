/**
 * model-menu.mjs — 模型两级菜单 + 推理下拉工厂（核化 VSC `webview/model-picker.js`(152) + `webview/model-menu.js`(272)
 * ——上提批 `2026-09-28-desktop-input-vsc-align.md` §2.3 ∕ §2.4 P6+P7；含 `effortSelection` 纯归一自
 * `webview/settings-state.js:44-56` 搬核——VSC 侧改指本档 ∕ 留 re-export，§2.7）。
 *
 * 导出面（四件 · 单源）：`effortSelection` ∕ `createModelMenu`（工厂）∥ **`openModelMenu` ∕ `closeModelMenu`**（模块级——
 * `model-menu.js:76-271` 逐字：全屏 overlay 收外点 ∕ 定位于触发钮视口矩形（下无位翻上）· provider 行 + 悬停 flyout
 * （事件驱动零 timer——row ∪ flyout 内陆保持）· 过滤框（子串 ∕ ↑↓ 高亮 ∕ Enter 取）· footer 管理三项；`onPick` ∕
 * `footer` 由调用方给）。独立导出与工厂**共用同一份实现**（禁两份）——消费面三处：本档两钮接线 ∕ VSC 设置族两档
 * （`settings-models.js:6` ∕ `settings-providers.js:9`——经 `model-menu.js` re-export shim）∥ 桌面。
 *
 * 面：
 *  - 两钮接线（`model-picker.js:13-36`）：模型钮 ⇒ `openModelMenu`（`up: true`）；推理钮 ⇒ 推理下拉开关（`:38-69` 档位列表 + ✓ 选中态 + 空档位两行说明）。
 *  - 候选推送面（`:111-151` handleModelsMessage 逐字）：`models` 推送 ⇒ 缓存 + 现值标记（忙态零回写）·
 *    表外 prefs 复合 ⇒ 只显不写槽（M10 v2）。
 *  - `mm-*` 样式 = **静态承载** `./model-menu.css`（2026-09-28 输入逻辑收正轮：原 JS 注入形在桌面侧依 CSP
 *    （`style-src 'self'`）被拒 ⇒ 注入路径撤，样式落静态资产；两端各以自身静态装载形引入 —— VSC = `webview/controls.css`
 *    `@import`，桌面 = `renderer/mount-composer.mjs` 注 `<link>`。单体量免越 500 硬限，故独立成档（同族 `composer.css` 口径））。
 *
 * 注入面（五项之局部）：② `post`（`selectModel` ∕ `selectReasoning` ∕ `addProvider` ∕ `removeProvider` ∕ `setKey` 出站）；
 * ③ `state`（`models` 读面初值 + 推送入口）；⑤ `hooks`（`confirmRemoveProvider` 确认门 ∕ `closeSiblingDropdowns` 邻面让位）；
 * ④ 取词 = 核 `../i18n.mjs`。忙态门判据（`loading.js` `modelSwitchBlocked`）由调用方以 `blocked()` 注入——判据单点在 `panel.mjs`。
 *
 * 推理下拉解散面（点外关 ∕ Esc 关）＝ VSC `chat.js:97-110,121-127` 本件部分（设置面 ∕ 会话下拉两段留端）；工厂化后本件自持（两端同形）。
 */
import { t } from "../i18n.mjs"

/**
 * 归一链单源（`settings-state.js:44-56` 搬核——设置面板 ∕ 聊天面板 picker / advisor 读面三面共用同一个 value）：
 *  ⓪ off 哨兵避支（§16.5 · 2026-09-25 收尾批并入）：`current === "none"`（读面 off 形字面）∧ 枚举
 *     不含 `"none"` ⇒ **中性档**（**不经 ② 支**）——off 形式不得降级为档位（用户从未选过）；
 *  ① 已存值 ∈ 枚举 ⇒ 取之；② 否则注册默认（**须 ∈ 枚举**）⇒ 取之；③ 否则 ⇒ `null`（中性档）。
 *  「已存值 ∉ 枚举」= 按枚举**显式判成员**（不再由浏览器「无匹配 option ⇒ value 落空」的代发行为承载结果）；
 *  中性档语义 = **不写 effort 载荷**（服务端默认与渠道条目原值照旧生效）。
 */
export function effortSelection(levels, current, registeredDefault) {
  const list = Array.isArray(levels) ? levels : []
  if (current === "none" && !list.includes("none")) return null
  if (list.includes(current)) return current
  if (list.includes(registeredDefault)) return registeredDefault
  return null
}

/** Short display names for menu rows — the preset desc strings are long annotations
 *  (key-compatibility notes etc.) meant for the add-provider form, not menus. */
const PROVIDER_SHORT = {
  deepseek: "DeepSeek", kimi: "Kimi", "kimi-code": "Kimi Code", glm: "GLM", "glm-code": "GLM Coding",
  qwen: "Qwen", qwenplan: "Qwen Plan", minimax: "MiniMax", openai: "OpenAI",
  claude: "Claude", gemini: "Gemini", grok: "Grok", mistral: "Mistral",
  volcengine: "Volcengine", hunyuan: "Hunyuan", siliconflow: "SiliconFlow",
  openrouter: "OpenRouter", groq: "Groq",
}
function shortName(provider, group) {
  return PROVIDER_SHORT[provider] || (group && group.length > 22 ? provider : group) || provider
}

// ─── 菜单实现（模块级单例 + 独立导出——VSC `model-menu.js:76-271` 逐字；工厂与独立导出共用同一份，单源）──

/** The current open menu's overlay element (or null). */
let _openOverlay = null

/** Close the open menu (idempotent). */
export function closeModelMenu() {
  _openOverlay?.remove()
  _openOverlay = null
  document.removeEventListener("keydown", onEsc, true)
  window.removeEventListener("resize", closeModelMenu)
}

function onEsc(e) { if (e.key === "Escape") closeModelMenu() }

/**
 * Open the model menu anchored to a trigger element.
 * @param anchorEl  the trigger (button) — menu positions from its viewport rect
 * @param models    [{ id, provider, group, label, reasoning, ... }]
 * @param value     { provider, model } | null — marks the current row with a check
 * @param onPick    ({ provider, model }) => void — menu closes before the callback
 * @param footer    [{ label, onClick }] — management entries (add/remove provider, set key)
 */
export function openModelMenu({ anchorEl, models, value, onPick, footer = [], up = false }) {
  closeModelMenu()

  const overlay = document.createElement("div")
  overlay.className = "mm-overlay"
  const panel = document.createElement("div")
  panel.className = "mm-panel"
  overlay.appendChild(panel)

  // ── content ──
  if (!models || models.length === 0) {
    const d = document.createElement("div")
    d.className = "mm-loading"
    d.textContent = t("model.loading") || "…"
    panel.appendChild(d)
  } else {
    const byProvider = new Map()
    for (const m of models) {
      const key = m.provider || m.group || ""
      if (!byProvider.has(key)) byProvider.set(key, { group: m.group || key, models: [] })
      byProvider.get(key).models.push(m)
    }
    for (const [provider, { group, models: provModels }] of byProvider) {
      panel.appendChild(providerRow(provider, group, provModels, value, onPick, overlay))
    }
  }
  if (footer.length > 0) {
    const sep = document.createElement("div")
    sep.className = "mm-sep"
    panel.appendChild(sep)
    for (const f of footer) {
      const item = document.createElement("div")
      item.className = "mm-row mm-manage"
      item.textContent = f.label
      item.addEventListener("click", (e) => { e.stopPropagation(); closeModelMenu(); f.onClick() })
      panel.appendChild(item)
    }
  }

  // ── positioning: viewport rect, flip up when no room below ──
  const place = () => {
    const r = anchorEl.getBoundingClientRect()
    const ph = Math.min(panel.offsetHeight || 200, 340)
    const below = window.innerHeight - r.bottom - 4
    const openUp = up || below < Math.min(ph, 180)
    panel.style.left = Math.max(4, Math.min(r.left, window.innerWidth - 270)) + "px"
    panel.style.top = openUp ? Math.max(4, r.top - ph - 4) + "px" : (r.bottom + 4) + "px"
  }

  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModelMenu() })
  // Flyout territory rule (event-driven, no timers): pointer over the open row or the
  // flyout keeps it open; over anything else (another row, the panel, the backdrop) closes
  // it — the row's own mouseenter will open ITS flyout on the same move.
  overlay.addEventListener("mouseover", (e) => {
    const row = overlay.querySelector(".mm-row[data-flyout-open]")
    if (!row) return
    const fly = overlay.querySelector(".mm-flyout")
    if (row.contains(e.target) || (fly && fly.contains(e.target))) return
    for (const f of overlay.querySelectorAll(".mm-flyout")) f.remove()
    delete row.dataset.flyoutOpen
  })
  document.addEventListener("keydown", onEsc, true)
  window.addEventListener("resize", closeModelMenu)

  document.body.appendChild(overlay)
  _openOverlay = overlay
  place()
  // measure after first paint for accurate height, then re-place
  window.requestAnimationFrame(place)
}

function providerRow(provider, group, models, value, onPick, overlay) {
  const current = models.find((m) => m.id === value?.model && (m.provider || "") === (value?.provider || ""))

  const item = document.createElement("div")
  item.className = "mm-row"
  item.setAttribute("role", "option")
  item.setAttribute("aria-selected", String(!!current))
  const name = document.createElement("span")
  name.textContent = shortName(provider, group)
  const arrow = document.createElement("span")
  arrow.className = "mm-arrow"
  arrow.textContent = "›"
  item.append(name, arrow)

  // Flyout open/close is PURELY event-driven — no timers, no grace windows.
  // Close condition: a mouseover bubbles up landing OUTSIDE (row ∪ flyout).
  // A stationary pointer generates no events → nothing closes. Ever.
  let flyout = null
  const pickModel = (m) => { closeModelMenu(); onPick({ provider: m.provider || provider, model: m.id }) }
  const openFlyout = () => {
    // The overlay-level mouseover handler removes flyouts from the DOM WITHOUT touching
    // this closure — a stale `flyout` reference made "hover back onto the same row" a
    // permanent no-op (first open works, every later hover dead). Trust the DOM, not the
    // closure: isConnected === genuinely open.
    if (flyout && flyout.isConnected) return
    flyout = null
    overlay.querySelectorAll(".mm-flyout").forEach((f) => f.remove()) // one flyout at a time
    overlay.querySelectorAll(".mm-row[data-flyout-open]").forEach((r) => delete r.dataset.flyoutOpen)
    flyout = document.createElement("div")
    flyout.className = "mm-flyout"
    item.dataset.flyoutOpen = "1"

    // Filter box (GitHub #4, 2026-08-31): type to narrow by case-insensitive
    // substring, same semantics as the CLI picker. ↑↓ moves a highlight,
    // Enter picks the highlighted (or first) match. Empty query shows all.
    const filter = document.createElement("input")
    filter.className = "mm-filter"
    filter.placeholder = t("model.filterPlaceholder") || "Filter models…"
    filter.addEventListener("click", (e) => e.stopPropagation()) // typing must not bubble to overlay-close
    flyout.appendChild(filter)

    const listBox = document.createElement("div")
    flyout.appendChild(listBox)

    let filtered = models.slice()
    let highlight = 0
    const renderList = () => {
      listBox.textContent = ""
      const q = filter.value.trim().toLowerCase()
      filtered = q ? models.filter((m) => (m.label || m.id).toLowerCase().includes(q)) : models.slice()
      highlight = Math.min(highlight, Math.max(0, filtered.length - 1))
      if (filtered.length === 0) {
        const nm = document.createElement("div")
        nm.className = "mm-filter-nomatch"
        nm.textContent = t("model.noMatch") || "No models match"
        listBox.appendChild(nm)
        return
      }
      filtered.forEach((m, i) => {
        const row = document.createElement("div")
        row.className = "mm-row"
        row.setAttribute("role", "option")
        const sel = m.id === value?.model && (m.provider || "") === (value?.provider || "")
        if (sel) row.setAttribute("aria-selected", "true")
        else if (i === highlight) row.setAttribute("aria-selected", "true")
        if (i === highlight) row.style.outline = "1px solid var(--vscode-focusBorder, #0078d4)"
        const lbl = document.createElement("span")
        lbl.textContent = m.label
        row.appendChild(lbl)
        if (sel) { const c = document.createElement("span"); c.className = "mm-check"; c.textContent = "✓"; row.appendChild(c) }
        row.addEventListener("mousedown", (e) => { e.preventDefault(); e.stopPropagation(); pickModel(m) })
        row.addEventListener("click", (e) => { e.stopPropagation(); pickModel(m) })
        listBox.appendChild(row)
      })
    }
    filter.addEventListener("input", () => { highlight = 0; renderList() })
    filter.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); highlight = Math.min(highlight + 1, filtered.length - 1); renderList() }
      else if (e.key === "ArrowUp") { e.preventDefault(); highlight = Math.max(highlight - 1, 0); renderList() }
      else if (e.key === "Enter") { e.preventDefault(); const m = filtered[highlight] ?? filtered[0]; if (m) pickModel(m) }
    })

    renderList()
    // Render the container first so the flyout has a measurable height, then focus the filter.
    overlay.appendChild(flyout)
    const rr = item.getBoundingClientRect()
    const fh = Math.min(flyout.offsetHeight || 200, 320)
    // FLUSH against the row's right edge (1px overlap) — no dead zone crossing.
    let left = rr.right - 1
    if (left + 190 > window.innerWidth) left = rr.left - 191 // flip left when no room on the right
    flyout.style.left = Math.max(4, left) + "px"
    flyout.style.top = Math.max(0, Math.min(rr.top - 1, window.innerHeight - fh - 4)) + "px"
    filter.focus()
  }

  item.addEventListener("mouseenter", openFlyout)
  // Leaving the row alone does NOT close — the shared overlay mouseover handler decides
  // based on where the pointer actually lands (row ∪ flyout stays open, anything else closes).
  // Click on the row is a NO-OP toggle fix (GitHub #4): it only ensures the flyout is open —
  // with hover already having opened it, clicking no longer closes it ("clicked, nothing happened").
  item.addEventListener("click", (e) => { e.stopPropagation(); openFlyout() })
  return item
}

/**
 * 菜单面工厂。`deps`：
 *  - `post(type, payload)`（② 出站）· `state`（③ `models()` 初值读面）· `hooks.confirmRemoveProvider(onConfirm)` ∕
 *    `hooks.closeSiblingDropdowns()`（⑤ 跨面）· `blocked()`（忙态门判据——单点在 `panel.mjs`）；
 *  - `modelBtn` ∕ `reasoningBtn` ∕ `controlsRow` = 控件行调用方已建的元素与容器（两浮层由本档建 + 挂入）。
 * 返回：`{ close, closeReasoning, applyModels, models, selection, reasoningDropdown, modelDropdown }`。
 */
export function createModelMenu(deps) {
  const { post, state = {}, hooks = {}, modelBtn, reasoningBtn, controlsRow, blocked = () => false } = deps

  // ── 结构（照 VSC `index.html:61-62`：两 `.dropdown` 位于控件行内七钮之后）──
  // `#model-dropdown` = 骨架面（VSC `ctx.dropdown` 零消费者——旧 dropdown 族遗留；结构单源锁同携 ⇒ 保留）
  const modelDropdown = document.createElement("div")
  modelDropdown.id = "model-dropdown"
  modelDropdown.className = "dropdown"
  modelDropdown.setAttribute("role", "listbox")
  modelDropdown.setAttribute("aria-label", "Model list")
  modelDropdown.style.display = "none"

  const reasoningDropdown = document.createElement("div")
  reasoningDropdown.id = "reasoning-dropdown"
  reasoningDropdown.className = "dropdown"
  reasoningDropdown.setAttribute("role", "listbox")
  reasoningDropdown.setAttribute("aria-label", "Reasoning levels")
  reasoningDropdown.style.display = "none"

  controlsRow.append(modelDropdown, reasoningDropdown)

  // ── 面板态（`ctx` 内生面：候选缓存 + 三现值）──
  let _models = typeof state.models === "function" ? (state.models() ?? []) : []
  let selectedModel = ""
  let selectedProvider = ""
  let selectedReasoning = "max"

  // ── 两钮接线（`model-picker.js:13-36` 逐字；DOM 查询 → 调用方给的元素引用）──

  modelBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      if (blocked()) return // F-W14：忙态门（零浮层、零写槽；读面仍由按钮显示承载）
      openModelMenu({
        anchorEl: modelBtn,
        models: _models,
        value: { provider: selectedProvider, model: selectedModel },
        onPick: ({ provider, model }) => {
          const m = _models.find((x) => x.id === model && (x.provider || "") === provider)
          if (m) selectModel(m)
        },
        footer: [
          { label: t("model.addProvider"), onClick: () => post("addProvider") },
          { label: t("model.removeProvider"), onClick: () => hooks.confirmRemoveProvider?.(() => post("removeProvider")) },
          // ↑ F-W17 确认门（SETTINGS.md §2.10 入口册 #6——删条即失 apiKey 原文）；VSC 绑 = `window._confirmSecretDelete(null, cb)`
          // （settings.js:47）+ footer onClick 被 model-menu.js:132 调用时不传参 ⇒ 无元素可给（btn=null 口径随注入面）。
          { label: t("model.setKey"), onClick: () => post("setKey") },
        ],
        up: true,
      })
    })
  reasoningBtn.addEventListener("click", () => {
    if (blocked()) return // F-W14：同谓词（两写槽入口同读）
    toggleDropdown(reasoningDropdown, () => buildReasoningDropdown())
  })

  function buildReasoningDropdown() {
    reasoningDropdown.innerHTML = ""
    const model = _models.find((m) => m.id === selectedModel)
    const levels = model?.reasoning || []
    if (levels.length === 0) {
      reasoningDropdown.appendChild(sectionEl(t("model.noReasoning")))
      const item = document.createElement("div")
      item.className = "dropdown-item"
      item.innerHTML = "<span>" + t("model.noReasoningDesc") + "</span>"
      item.style.opacity = "0.5"
      reasoningDropdown.appendChild(item)
      return
    }
    reasoningDropdown.appendChild(sectionEl(t("model.reasoning")))
    for (const level of levels) {
      const item = document.createElement("div")
      item.className = "dropdown-item"
      item.tabIndex = 0
      item.setAttribute("role", "option")
      item.setAttribute("aria-selected", String(level === selectedReasoning))
      const label = reasoningLabel(level)
      item.innerHTML = `<span>${label}</span>${level === selectedReasoning ? '<span class="check">✓</span>' : ""}`
      item.addEventListener("click", () => {
        selectedReasoning = level
        reasoningBtn.textContent = level === "none" ? "off" : label
        reasoningBtn.classList.toggle("active", level !== "none")
        reasoningDropdown.style.display = "none"
        post("selectReasoning", { reasoning: level })
      })
      reasoningDropdown.appendChild(item)
    }
  }

  function sectionEl(text) {
    const s = document.createElement("div")
    s.className = "dropdown-section"
    s.textContent = text
    return s
  }

  function selectModel(m) {
    selectedModel = m.id; selectedProvider = m.provider || ""
    modelBtn.textContent = m.id; closeModelMenu()
    post("selectModel", { model: m.id, provider: m.provider || "" })
    const levels = m.reasoning || []
    // 归一 = 单源 `effortSelection`（§15.4-1）：已存值∈枚举 > 注册默认∈枚举 > **中性档 `""`**
    // （不显式 effort ⇒ 回合侧 `if (reasoning)` 假值不 patch——`panel-turn-stages.mjs:98`）。
    // 不得回落 `levels[0]`：effort 型新档（qwen3.7/3.8-flash 族）首项 = `"none"` ⇒ 换模型即静默关思考。
    if (levels.length > 0) selectedReasoning = effortSelection(levels, selectedReasoning, m.effortDefault) ?? ""
    const visible = levels.length > 0 ? selectedReasoning : "off"
    reasoningBtn.textContent = visible === "" ? "—" : visible === "none" ? "off" : (reasoningLabel(visible))
    reasoningBtn.classList.toggle("active", levels.length > 0 && visible !== "off" && visible !== "")
  }

  function toggleDropdown(el, build) {
    const open = el.style.display !== "none"
    // Close all dropdowns first
    closeModelMenu()
    reasoningDropdown.style.display = "none"
    hooks.closeSiblingDropdowns?.() // VSC `:97-98`：`ctx.sessionDropdown` ∕ `ctx.sessionSelector` 两行 = 会话面（本批外）⇒ 注入
    el.style.display = open ? "none" : "block"
    if (!open) build()
    // Update aria-expanded on the trigger button
    if (el === reasoningDropdown) reasoningBtn.setAttribute("aria-expanded", String(!open))
  }

  /** Get reasoning label from i18n */
  function reasoningLabel(level) {
    return t("reasoning." + (level || "none"))
  }

  /** models message: apply the pushed model list + persisted prefs.（`model-picker.js:111-151` 逐字） */
  function applyModels(m) {
    _models = m.models || []
    if (_models.length > 0) {
      modelBtn.style.display = ""
      reasoningBtn.style.display = ""
      const prefs = m.prefs || {}
      const match = _models.find((x) => x.id === prefs.model && x.provider === prefs.provider)
      if (match) {
        selectedModel = match.id; selectedProvider = match.provider
        modelBtn.textContent = match.id
        selectedReasoning = prefs.reasoning || "off"
        const levels = match.reasoning || []
        // 归一（单源 = `effortSelection`，同 `selectModel` 内注释）：已存值∈枚举 > 注册默认∈枚举 >
        // 中性档 `""`——不得回落 `levels[0]`（§15.4；`levels[0] === "none"` 族两径都不再被静默关思考）。
        if (levels.length > 0) selectedReasoning = effortSelection(levels, selectedReasoning, match.effortDefault) ?? ""
        const visible = levels.length > 0 ? selectedReasoning : "off"
        reasoningBtn.textContent = visible === "" ? "—" : visible === "none" ? "off" : (reasoningLabel(visible))
        reasoningBtn.classList.toggle("active", levels.length > 0 && visible !== "off" && visible !== "")
        // F-W14：忙态零回写（显示仍更新——上列已刷）——不携快照覆写槽；idle 零回归（照发）
        if (!blocked()) {
          post("selectModel", { model: match.id, provider: match.provider })
          post("selectReasoning", { reasoning: selectedReasoning })
        }
      } else if (prefs.model) {
        // M10 MODEL-SELECTION v2 (2026-09-11 scope add-on, user ruling): a prefs composite
        // NOT in the pulled list must never silently write the session slot. Display AND
        // state fall back to the slot composite (turn-echo parity: send.js:47 →
        // turn-model.mjs:22); slot writes stay explicit-click only — zero selectModel /
        // selectReasoning posts (selectModel = the only slot writer; selectReasoning only
        // writes workspaceState). selectedReasoning stays untouched.
        selectedModel = prefs.model
        selectedProvider = prefs.provider
        modelBtn.textContent = prefs.model
      }
    } else {
      modelBtn.textContent = ""
      modelBtn.title = ""
      modelBtn.style.display = "none"
      reasoningBtn.style.display = "none"
    }
  }

  // ── 推理下拉自身解散面（点外关 ∕ Esc 关——源 = VSC `chat.js:97-110,121-127` 本件部分，见件头注）──
  document.addEventListener("click", (e) => {
    if (!reasoningDropdown.contains(e.target) && e.target !== reasoningBtn) reasoningDropdown.style.display = "none"
  })
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") reasoningDropdown.style.display = "none"
  })

  return {
    close: closeModelMenu,
    closeReasoning: () => { reasoningDropdown.style.display = "none" },
    applyModels,
    models: () => _models,
    selection: () => ({ model: selectedModel, provider: selectedProvider, reasoning: selectedReasoning }),
    modelDropdown,
    reasoningDropdown,
  }
}
