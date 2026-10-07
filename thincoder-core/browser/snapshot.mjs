/**
 * browser/snapshot.mjs — 页面侧快照脚本 ∥ 结果归一 ∥ 引用表 ∥ 紧凑渲染 ∥ 页摘（BROWSER-TOOL.md §2.3）。
 *
 * 页面侧脚本一律经 `Runtime.evaluate` **一次性执行、不驻留**（§3.3）；每条表达式带一个块注释标识
 * 前缀（`thincoder-browser:<种类>`）——回执/调试可辨出处，单测假传输按此前缀派发。
 * 引用表：`key = tag + "|" + selector`，跨快照复用原号（KD-1 / F-BT4「微变不全失效」）。
 */
export const DEFAULT_MAX = 100
export const MAX_ELEMENTS = 200
export const MAX_SNAPSHOT_CHARS = 20_000
export const COMPACT_ROWS = 30 // 失败回执的紧凑清单行数

const mark = (kind) => `/*thincoder-browser:${kind}*/`

/**
 * 页面侧快照函数源串（`(opts) => 记录集`）。
 * 走交互元素（§2.3）：`a[href]` / `button` / `input`（非 hidden） / `select` / `textarea` /
 * `[role=button]` / `[onclick]` / `[tabindex]`；`selector` = 稳定寻址链（`#id` → `[data-testid]`
 * → `[name]` → `[href]` → 结构路径）；password 输入**不取 value**（N-BT4）。
 */
export const SNAPSHOT_EXPR = String.raw`function (opts) {
  var SEL = 'a[href],button,input:not([type=hidden]),select,textarea,[role=button],[onclick],[tabindex]'
  var norm = function (s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, 60) }
  var esc = function (s) {
    try { return (globalThis.CSS && CSS.escape) ? CSS.escape(String(s)) : String(s).replace(/[^a-zA-Z0-9_-]/g, function (c) { return '\\' + c }) }
    catch (e) { return String(s) }
  }
  var unique = function (sel) { try { return document.querySelectorAll(sel).length === 1 } catch (e) { return false } }
  var pathOf = function (el) {
    var parts = []
    var cur = el
    while (cur && cur.nodeType === 1 && cur !== document.documentElement) {
      if (cur.id && unique('#' + esc(cur.id))) { parts.unshift('#' + esc(cur.id)); break }
      var tag = cur.tagName.toLowerCase()
      var parent = cur.parentElement
      if (!parent) { parts.unshift(tag); break }
      var same = Array.prototype.filter.call(parent.children, function (c) { return c.tagName === cur.tagName })
      parts.unshift(same.length > 1 ? tag + ':nth-of-type(' + (same.indexOf(cur) + 1) + ')' : tag)
      cur = parent
    }
    return parts.join(' > ')
  }
  var selectorOf = function (el) {
    if (el.id && unique('#' + esc(el.id))) return '#' + esc(el.id)
    var testid = el.getAttribute('data-testid')
    if (testid && unique('[data-testid="' + testid + '"]')) return '[data-testid="' + testid + '"]'
    var name = el.getAttribute('name')
    if (name && unique('[name="' + name + '"]')) return '[name="' + name + '"]'
    var href = el.getAttribute('href')
    if (href && el.tagName === 'A' && unique('[href="' + href + '"]')) return '[href="' + href + '"]'
    return pathOf(el)
  }
  var roleOf = function (el, tag) {
    var t = String(el.getAttribute('type') || '').toLowerCase()
    if (tag === 'a') return 'link'
    if (tag === 'select') return 'select'
    if (tag === 'textarea') return 'textbox'
    if (tag === 'button') return 'button'
    if (tag === 'input') {
      if (t === 'password') return 'password'
      if (t === 'checkbox') return 'checkbox'
      if (t === 'radio') return 'radio'
      if (t === 'submit' || t === 'button' || t === 'reset' || t === 'image') return 'button'
      return 'textbox'
    }
    if (el.getAttribute('role') === 'button' || el.hasAttribute('onclick')) return 'button'
    return 'other'
  }
  var nameOf = function (el) {
    // 可及名取序照 §2.3：aria-label ∥ 文本 ∥ placeholder ∥ title
    return norm(el.getAttribute('aria-label') || el.innerText || el.textContent || el.getAttribute('placeholder') || el.getAttribute('title') || '')
  }
  var root = (opts && opts.selector) ? document.querySelector(opts.selector) : document
  if (!root) return { missing: true, url: location.href, title: document.title, elements: [], total: 0 }
  var nodes = []
  if (root.nodeType === 1 && root.matches && root.matches(SEL)) nodes.push(root)
  var found = root.querySelectorAll ? root.querySelectorAll(SEL) : []
  for (var i = 0; i < found.length; i++) nodes.push(found[i])
  var max = Math.max(1, (opts && opts.max) ? opts.max : 100)
  var elements = []
  for (var j = 0; j < nodes.length && elements.length < max; j++) {
    var el = nodes[j]
    var tag = el.tagName.toLowerCase()
    var role = roleOf(el, tag)
    var rec = {
      tag: tag,
      role: role,
      name: nameOf(el),
      selector: selectorOf(el),
      disabled: Boolean(el.disabled) || el.getAttribute('aria-disabled') === 'true',
    }
    if (role === 'textbox' || role === 'select') rec.value = norm(el.value)
    elements.push(rec)
  }
  return { url: location.href, title: document.title, total: nodes.length, elements: elements }
}`

/** 快照表达式（页面侧一次执行）。 */
export function snapshotExpression({ selector = null, max = DEFAULT_MAX } = {}) {
  return `${mark("snapshot")}(${SNAPSHOT_EXPR})(${JSON.stringify({ selector, max })})`
}

/** 当前页信息表达式（URL ∥ title ∥ readyState）。 */
export function pageInfoExpression() {
  return `${mark("pageinfo")}(function () { return { url: location.href, title: document.title, readyState: document.readyState } })()`
}

/** 点击表达式（寻址 + tag 一致校验 + disabled 判；返回 `{found, disabled, tag?}`）。 */
export function clickExpression(selector, tag) {
  return `${mark("click")}(function () {
  var el = document.querySelector(${JSON.stringify(selector)})
  if (!el) return { found: false }
  var tag = el.tagName.toLowerCase()
  if (tag !== ${JSON.stringify(tag)}) return { found: false, tag: tag }
  if (el.disabled) return { found: true, disabled: true }
  el.scrollIntoView({ block: 'center' })
  el.click()
  return { found: true, disabled: false }
})()`
}

/** 输入表达式（原生 value setter + input/change 事件；回执判据 = `password` 标记）。 */
export function typeExpression(selector, tag, text, clear) {
  return `${mark("type")}(function () {
  var el = document.querySelector(${JSON.stringify(selector)})
  if (!el) return { found: false }
  var tag = el.tagName.toLowerCase()
  if (tag !== ${JSON.stringify(tag)}) return { found: false, tag: tag }
  if (tag !== 'input' && tag !== 'textarea') return { found: true, disabled: false, password: false, fillable: false }
  var password = tag === 'input' && String(el.getAttribute('type') || '').toLowerCase() === 'password'
  if (el.disabled) return { found: true, disabled: true, password: password }
  var proto = tag === 'textarea' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  var desc = Object.getOwnPropertyDescriptor(proto, 'value')
  var next = ${clear ? "true" : "false"} ? ${JSON.stringify(text)} : String(el.value == null ? '' : el.value) + ${JSON.stringify(text)}
  if (desc && desc.set) desc.set.call(el, next); else el.value = next
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
  return { found: true, disabled: false, password: password }
})()`
}

/** 等待谓词表达式（selector ∥ text ∥ url——networkIdle 走核侧事件计数）。 */
export function waitExpression(kind, value) {
  const expr = kind === "selector" ? `!!document.querySelector(${JSON.stringify(value)})`
    : kind === "text" ? `String((document.body && document.body.innerText) || '').includes(${JSON.stringify(value)})`
      : `location.href.includes(${JSON.stringify(value)})`
  return `${mark("wait")}(function () { return ${expr} })()`
}

/** 页面侧结果 → 形状归一的记录集（不可信输入：缺字段/异型一律归一，不抛）。 */
export function normalizeSnapshot(raw) {
  const r = raw && typeof raw === "object" ? raw : {}
  const elements = (Array.isArray(r.elements) ? r.elements : [])
    .filter((e) => e && typeof e === "object" && e.selector)
    .map((e) => {
      const rec = {
        tag: String(e.tag ?? "").toLowerCase(),
        role: String(e.role ?? "other"),
        name: String(e.name ?? ""),
        selector: String(e.selector),
        disabled: e.disabled === true,
      }
      if (e.value !== undefined && e.value !== null && String(e.value) !== "") rec.value = String(e.value)
      return rec
    })
  return {
    url: String(r.url ?? ""),
    title: String(r.title ?? ""),
    elements,
    total: Number.isInteger(r.total) ? Math.max(r.total, elements.length) : elements.length,
    missing: r.missing === true,
  }
}

/** 核侧引用表（会话级——`byRef` 反查、`byKey` 复用、`counter` 会话内单调）。 */
export function createRefTable() {
  return { byRef: new Map(), byKey: new Map(), counter: 1 }
}

/** 记录集 → 引用行（key 已在表 ⇒ 复用原号；未见 ⇒ 新号 + `isNew`）。 */
export function assignRefs(table, elements) {
  const rows = []
  for (const el of elements) {
    const key = `${el.tag}|${el.selector}`
    let entry = table.byKey.get(key)
    const isNew = !entry
    if (isNew) {
      entry = { ref: `e${table.counter++}`, key, selector: el.selector, tag: el.tag, name: el.name }
      table.byKey.set(key, entry)
      table.byRef.set(entry.ref, entry)
    } else {
      entry.name = el.name // 名随页面更新；号不变（F-BT4）
    }
    rows.push({ ...el, ref: entry.ref, isNew })
  }
  return rows
}

/** 结果行文法：`<ref> <role> "<name>"` + `[value=…]`（password 除外）+ `[new]` + `[disabled]`。 */
export function rowLine(row) {
  const marks = []
  if (row.role !== "password" && row.value !== undefined && String(row.value) !== "") marks.push(`[value="${row.value}"]`)
  if (row.isNew) marks.push("[new]")
  if (row.disabled) marks.push("[disabled]")
  return `${row.ref} ${row.role} "${row.name}"${marks.length ? ` ${marks.join(" ")}` : ""}`
}

/** 页摘行（内容与出处同行——N-BT2 来源标注）。 */
export function pageDigest(url, title) {
  return `[page] ${url} — "${title}"`
}

/** 紧凑渲染：页摘 ∥ 计数行 ∥ 元素行 ∥ 截断标记；总文本 ≤ 20,000 字符（N-BT3）。 */
export function renderSnapshot({ url, title, rows = [], total = rows.length }) {
  const lines = [pageDigest(url, title), `[${total} interactive elements (${rows.filter((r) => r.isNew).length} new)]`]
  for (const row of rows) lines.push(rowLine(row))
  if (total > rows.length) lines.push(`[truncated: showing ${rows.length} of ${total} — pass selector to narrow]`)
  return truncateText(lines.join("\n"), MAX_SNAPSHOT_CHARS, "pass selector to narrow")
}

/** 截断（`truncate` 同款标记形态——`tools/shared.mjs:190-193`）。 */
export function truncateText(text, max, note = "narrow the request") {
  if (text.length <= max) return text
  return `${text.slice(0, max)}\n[... truncated: ${text.length - max} chars omitted — ${note}]`
}
