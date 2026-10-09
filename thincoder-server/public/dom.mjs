/**
 * dom.mjs — 控制台渲染助手 + 提示条（webui/WEBUI.md §1——结构轮自 `app.mjs` 逐字外拆）：`h`（建元素）∥ `table`（表格 +
 * 表尾行计数）∥ 格式化（`fmtTs`/`fmtValue`/`fmtModelQuotas`）∥ 一次性秘密区（`showSecret` + `copyText` 三路回退）∥
 * `usageTable`（用量表——本人 ∥ 全队同构）∥ `dataShell`（数据表页视口高壳——§2.6②）∥ `flash`（提示条——携 `flashEl`/计时器）。
 * 消费单点 = `app.mjs`（`viewCtx()` 装配——视图面零改）。
 */
import { t, langTag } from "./i18n.mjs"

// ── 渲染助手 ────────────────────────────────────────────────────────────────

/** 建元素：props（class ∥ text ∥ value ∥ on* 事件 ∥ 其余属性）+ 子节点（字符串 ⇒ 文本节点——天然转义）。 */
export function h(tag, props = {}, ...children) {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue
    if (key === "class") node.className = value
    else if (key === "text") node.textContent = String(value)
    else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2), value)
    else if (["value", "checked", "disabled", "hidden"].includes(key)) node[key] = value
    else node.setAttribute(key, value)
  }
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue
    node.append(child instanceof Node ? child : document.createTextNode(String(child)))
  }
  return node
}

/** 表格（宽表横滚 = CSS `.table-wrap`）；cell = 值 ∥ 节点 ∥ 节点数组；`foot = true` ⇒ 表尾 `<tfoot>` 行计数
 *  （「共 N 项」= 渲染行数派生——§2.6③；用户 2026-10-07 08:26 收正：计数 = 表内 tfoot，非壳级行）。 */
export function table(headers, rows, { foot = false } = {}) {
  return h("div", { class: "table-wrap" },
    h("table", {},
      h("thead", {}, h("tr", {}, ...headers.map((label) => h("th", { text: label })))),
      h("tbody", {}, ...rows.map((cells) => h("tr", {}, ...cells.map((cell) => h("td", {}, ...(Array.isArray(cell) ? cell : [cell])))))),
      ...(foot ? [h("tfoot", {}, h("tr", {}, h("td", { colspan: String(headers.length), text: t("common.rowCount", { count: rows.length }) })))] : [])))
}

export const fmtTs = (ts) => new Date(ts).toLocaleString(langTag()) // 语言随 locale（zh-CN ∥ en——§2.2）
export const fmtValue = (value) => (value === null || value === undefined ? "—" : String(value)) // 「—」语言中性（保留）
/** 分模型配额 = 覆盖计数（§2.4②——列表列 ∥ 弹窗 ∥ 我的页三处同源）：0 ⇒「按平台」∥ N ⇒「N 个模型」。 */
export const fmtModelQuotas = (modelQuotas) => {
  const count = Object.keys(modelQuotas ?? {}).length
  return count === 0 ? t("common.quotaByPlatform") : t("common.modelQuotaCount", { count })
}

/** 一次性秘密回显区（key 明文 ∥ 临时密码——「仅此一次」提示 + 可全选文本 + 复制钮；三处秘密面随动）。 */
export function showSecret(box, label, value) {
  const code = h("code", { class: "secret-value", text: value })
  const button = h("button", { type: "button", class: "tiny", text: t("common.copy") })
  button.addEventListener("click", () => { copyText(value, code, button) })
  box.replaceChildren(
    h("p", { class: "secret-label", text: t("common.secretNote", { label }) }),
    code,
    button,
  )
  box.hidden = false
}

/** 复制三路回退（§2.3⑥——`showSecret` 全局随动）：① `navigator.clipboard.writeText`（安全上下文）⇒
 *  ② 选中明文 + `document.execCommand("copy")` ⇒ ③ 仍失败 ⇒ 保持选中 + flash 手动提示；
 *  成功反馈 = 钮文案「已复制」（2s 复位）。 */
async function copyText(value, code, button) {
  let copied = false
  try {
    await navigator.clipboard.writeText(value) // ① 安全上下文
    copied = true
  } catch { /* 落② */ }
  if (!copied) {
    try {
      const range = document.createRange()
      range.selectNodeContents(code)
      const selection = window.getSelection()
      selection.removeAllRanges()
      selection.addRange(range) // 选中明文（②③ 共用——③ 保持选中）
      copied = document.execCommand("copy") === true // ② 遗留通道
    } catch { /* 落③（选中未成——手动提示同面） */ }
  }
  if (!copied) { flash(t("common.copyManual")); return } // ③ 手动兜底
  button.textContent = t("common.copied")
  setTimeout(() => { button.textContent = t("common.copy") }, 2000)
}

/** 用量表（本人 ∥ 全队同构；全队加成员 + key 列；`foot = true` ⇒ 表尾计数行——仅我的·用量页〔壳面〕传）。 */
export function usageTable(rows, { withMember = false, foot = false } = {}) {
  if (rows.length === 0) return h("p", { class: "hint", text: t("usage.empty") })
  const headers = [
    t("usage.col.time"), ...(withMember ? [t("usage.col.member"), t("usage.col.key")] : []), t("usage.col.endpoint"),
    t("usage.col.model"), t("usage.col.status"), t("usage.col.prompt"), t("usage.col.completion"), t("usage.col.total"), t("usage.col.duration"),
  ]
  const body = rows.map((row) => [
    fmtTs(row.ts),
    ...(withMember ? [row.member, h("code", { text: row.keyHint ?? "—" })] : []),
    row.endpoint, row.model, row.status,
    fmtValue(row.promptTokens), fmtValue(row.completionTokens), fmtValue(row.totalTokens),
    String(row.durationMs),
  ])
  return table(headers, body, { foot })
}

/** 数据表页视口高壳（§2.6②——页头固定 ∥ 表区吃剩高；行计数 = **表内 `<tfoot>`**〔`table(…, { foot: true })`〕）：
 *  两段挂到视图根（表卡自持表尾计数——2026-10-07 08:26 用户收正：计数入表，非壳级行）。
 *  挂载前提 = 视图根 `<section>` 直属 `main#app`。 */
export function dataShell(mount, { head, area }) {
  mount.append(
    h("div", { class: "page-head" }, head),
    h("div", { class: "page-area" }, area),
  )
}

const flashEl = document.getElementById("flash")
let flashTimer = null
export function flash(message) {
  flashEl.textContent = message
  flashEl.hidden = false
  if (flashTimer) clearTimeout(flashTimer)
  flashTimer = setTimeout(() => { flashEl.hidden = true }, 8000)
}
