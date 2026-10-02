/**
 * view-state.mjs — 视图状态快照族（重建保真「位置 ∕ 状态」半边 —— 批档 §2.2 · #604 草稿保真总闸；
 * #606④⑤ 消费面）：`captureView(root)` 于重绘前捕获 ∕ `restoreView(root, snap)` 于重建后复填。
 *
 * 快照 schema：`snap = { scrolls, drafts, focus }`（逐条声明式 —— 复填仅及捕获域，零域外写）：
 *   ① `scrolls` = `[{ loc, path, top }]` —— 根（`loc: null`）+ 域内 `[data-view-scroll]` 标记件（键 = 标记取值）；
 *   ② `drafts` = `[{ loc, nth, path, value, checked, selectionStart, selectionEnd }]` —— 域内 `[data-draft]`
 *      申报控件（键 = 控件 `id`；无 `id` 控件 ⇒ 标记取值作显式键 —— 标记面单源 = 各视图档）；
 *   ③ `focus` = `{ chain, path } | null` —— 域内 `document.activeElement` 键回退链
 *      （`id` → `data-field` → `data-action`〔同键多例 ⇒ 以 `data-slot` 祖先限定〕→ 结构路径兜底）。
 * 解析语义（复填侧）：键命中 ⇒ 同键件集内按捕获位序（`nth`）取件（同键多例消歧 —— 文档序相对位序
 * 跨重建稳定）；位序不达 ⇒ 键集内结构就近者；键零命中 ⇒ `null`（不复填——入残件）；结构路径只留给焦点链
 * 末环（`restoreFocus`）。**作用域**：草稿项携最近 `[data-draft-scope]` 祖先取值（表单身份面 —— 身份换 ⇒
 * 键不达，不复填）；键件缺失 ∕ 滚位写入未落
 * （内容短 ⇒ 截断）⇒ 入**残件**返回（复填未落件，供调用面跨在途重建携带 —— `mergeViewSnaps`）。
 * 复填序 = 焦点 → 草稿 → 滚位末写（焦点默认滚动 ∕ 选区落位先行 —— 滚位不被其内滚扰动）。
 * 纪律：零 `node:` / 零裸包；容器缺位 ⇒ 捕获 `null`、复填零动作；键面字面 `data-*` 与视图档同源。
 */

/** 原样属性读（存在 ⇒ 串〔可空串〕；缺 ⇒ `null`）。 */
function rawAttr(el, name) {
  const value = typeof el?.getAttribute === "function" ? el.getAttribute(name) : null
  return typeof value === "string" ? value : null
}

/** 键面属性读：非空串才算键（空串 ∕ 缺 ⇒ `null`）。 */
function keyAttr(el, name) {
  const value = rawAttr(el, name)
  return value !== null && value !== "" ? value : null
}

/** 元素子件（`tagName` 归一到元素面 —— 真 DOM 上为零过滤；文本件不入结构路径）。 */
function elementChildren(node) {
  const list = node?.children
  if (list == null) return []
  return Array.from(list).filter((child) => child !== null && typeof child === "object" && typeof child.tagName === "string")
}

/** 结构路径（根起逐层元素子件序号；不在域内 ⇒ `null`）——键回退链末环 ∕ 多例消歧用。 */
function pathOf(el, root) {
  const path = []
  let node = el
  while (node !== null && node !== undefined && node !== root) {
    const parent = node.parentNode ?? null
    if (parent === null) return null
    path.push(elementChildren(parent).indexOf(node))
    node = parent
  }
  if (node !== root) return null
  path.reverse()
  return path
}

/** 结构路径解析（逐层元素子件取位；任一层缺口 ⇒ `null`）。 */
function byPath(root, path) {
  if (!Array.isArray(path)) return null
  let node = root
  for (const index of path) {
    const children = elementChildren(node)
    node = Number.isInteger(index) ? children[index] ?? null : null
    if (node === null) return null
  }
  return node
}

/** 键匹配件集（`loc = { attr, value, scope?, slot? }`；`scope` = 最近 `[data-draft-scope]` 祖先取值比对，`slot` = 以 `data-slot` 祖先限定）。 */
function locate(root, loc) {
  if (loc === null || typeof loc !== "object" || typeof loc.attr !== "string") return []
  if (typeof root.querySelectorAll !== "function") return []
  const out = []
  for (const el of root.querySelectorAll(`[${loc.attr}]`)) {
    if (rawAttr(el, loc.attr) !== loc.value) continue
    if (loc.scope !== undefined && loc.scope !== scopeOf(el, root)) continue
    if (typeof loc.slot === "string" && !withinSlot(el, root, loc.slot)) continue
    out.push(el)
  }
  return out
}

/** 祖先属性取值（含自身，链尽至根；取最近一件 —— 链断 ⇒ `null`）。 */
function ancestorAttr(el, root, name) {
  for (let node = el; node !== null && node !== undefined; node = node.parentNode ?? null) {
    const value = keyAttr(node, name)
    if (value !== null) return value
    if (node === root) break
  }
  return null
}

/** 草稿项作用域（最近 `data-draft-scope` 祖先取值 —— 表单身份面；链尽 ⇒ `null`）。 */
const scopeOf = (el, root) => ancestorAttr(el, root, "data-draft-scope")

/** `data-slot` 祖先限定（含自身；链尽仍不达 ⇒ 假）。 */
function withinSlot(el, root, slot) {
  for (let node = el; node !== null && node !== undefined; node = node.parentNode ?? null) {
    if (keyAttr(node, "data-slot") === slot) return true
    if (node === root) break
  }
  return false
}

/** 带捕获位序的键面（同键件集内文档序下标 —— 同键多例消歧；位序不达 ⇒ 仅键面）。 */
function withNth(root, el, loc) {
  if (loc === null) return null
  const nth = locate(root, loc).indexOf(el)
  return nth >= 0 ? { ...loc, nth } : loc
}

/** 键解析：命中 ⇒ 按捕获位序（`nth`）取件；位序不达 ⇒ 结构路径就近者；再无 ⇒ 文档序首件；零命中 ⇒ `null`。 */
function pickByKey(root, loc, path) {
  const hits = locate(root, loc)
  if (hits.length === 0) return null
  if (Number.isInteger(loc?.nth) && hits[loc.nth] !== undefined) return hits[loc.nth]
  const wanted = Array.isArray(path) ? path.join("/") : null
  if (wanted !== null) {
    const near = hits.find((el) => {
      const held = pathOf(el, root)
      return Array.isArray(held) && held.join("/") === wanted
    })
    if (near !== undefined) return near
  }
  return hits[0]
}

/** 复填件解析：键命中 ⇒ 取件（`pickByKey` —— 作用域不符在 `locate` 内已零取）；**键零命中 ⇒ `null`** —— 零域外写（入残件）。 */
function resolveTarget(root, loc, path) {
  return pickByKey(root, loc, path)
}

/** 键面同一判定（`attr` + `value` + `scope` + `nth` 全等 —— 并合去重口径）。 */
function sameLoc(a, b) {
  if (a === null || b === null) return a === b
  return a.attr === b.attr && a.value === b.value
    && (a.scope ?? null) === (b.scope ?? null) && (a.nth ?? null) === (b.nth ?? null)
}

/**
 * 快照并合（跨在途重建携带）：`fresh` 件优先；与 `fresh` 键面不冲突的 `prev` 件入并。
 * `trust` 假（旧树在途 —— 新值可能为截断 ∕ 半形产物）⇒ 滚位以 `prev` 为先（免截断值覆盖待落滚位）。
 */
export function mergeViewSnaps(prev, fresh, { trust = true } = {}) {
  if (prev === null || prev === undefined) return fresh
  const drafts = [...fresh.drafts, ...prev.drafts.filter((p) => !fresh.drafts.some((f) => sameLoc(f.loc, p.loc)))]
  const focus = fresh.focus ?? prev.focus
  const scrolls = trust
    ? [...fresh.scrolls, ...prev.scrolls.filter((p) => !fresh.scrolls.some((f) => sameLoc(f.loc, p.loc)))]
    : [...fresh.scrolls.filter((f) => !prev.scrolls.some((p) => sameLoc(f.loc, p.loc))), ...prev.scrolls]
  return { scrolls, drafts, focus }
}

/** **草稿失效过滤**（写成功径一次性失效集 —— 该表单草稿作废）：`loc.scope` 命中集者摘除（捕获件 ∕ 并合残件同滤 ——
 *  免旧值跨重建复活）；空集 ∕ 容器缺位 ⇒ 原样（零成本）；无作用域件永不受波及（他表单草稿零误伤）。 */
export function dropDrafts(snap, scopes) {
  const set = scopes instanceof Set ? scopes : new Set(Array.isArray(scopes) ? scopes : [])
  if (set.size === 0 || snap === null || typeof snap !== "object" || !Array.isArray(snap.drafts)) return snap
  const kept = snap.drafts.filter((entry) => !set.has(entry?.loc?.scope ?? null))
  return kept.length === snap.drafts.length ? snap : { ...snap, drafts: kept }
}

/** 域内申报件集（标记面 = 属性在场）。 */
function marked(root, attr) {
  return Array.from(root.querySelectorAll(`[${attr}]`))
}

/** 滚位读数归一（非有限数 ⇒ 0）。 */
const scrollTopOf = (el) => (Number.isFinite(el?.scrollTop) ? el.scrollTop : 0)

/** 草稿项显式键：`id` 优先；无 `id` ⇒ 标记取值作显式键；两者皆缺 ⇒ `null`（键缺席 ⇒ 不复填——入残件）；带作用域与捕获位序。 */
function draftLoc(el, root) {
  const id = keyAttr(el, "id")
  if (id !== null) return withNth(root, el, { attr: "id", value: id, scope: scopeOf(el, root) })
  const mark = keyAttr(el, "data-draft")
  return withNth(root, el, mark !== null ? { attr: "data-draft", value: mark, scope: scopeOf(el, root) } : null)
}

/** 焦点键回退链（捕获优先序）：`id` → `data-field` → `data-action`（同键多例 ⇒ `data-slot` 祖先限定）；逐环带捕获位序。 */
function focusChain(el, root) {
  const chain = []
  const id = keyAttr(el, "id")
  if (id !== null) chain.push(withNth(root, el, { attr: "id", value: id }))
  const field = keyAttr(el, "data-field")
  if (field !== null) chain.push(withNth(root, el, { attr: "data-field", value: field }))
  const action = keyAttr(el, "data-action")
  if (action !== null) {
    const same = root.querySelectorAll(`[data-action="${action}"]`)
    const slot = same.length > 1 ? ancestorAttr(el, root, "data-slot") : null
    const loc = slot === null ? { attr: "data-action", value: action } : { attr: "data-action", value: action, slot }
    chain.push(withNth(root, el, loc))
  }
  return chain
}

/** 域内判定（自身 ∕ 祖先链达根）。 */
function isWithin(el, root) {
  for (let node = el; node !== null && node !== undefined; node = node.parentNode ?? null) {
    if (node === root) return true
  }
  return false
}

/** 捕获：`scrolls`（根 + `[data-view-scroll]` 标记件）· `drafts`（`[data-draft]` 申报控件）· `focus`（域内活动件）。 */
export function captureView(root) {
  if (root === null || root === undefined || typeof root.querySelectorAll !== "function") return null
  const scrolls = [{ loc: null, path: [], top: scrollTopOf(root) }]
  for (const el of marked(root, "data-view-scroll")) {
    const loc = withNth(root, el, { attr: "data-view-scroll", value: rawAttr(el, "data-view-scroll") ?? "", scope: scopeOf(el, root) })
    scrolls.push({ loc, path: pathOf(el, root), top: scrollTopOf(el) })
  }
  const drafts = marked(root, "data-draft").map((el) => ({
    loc: draftLoc(el, root),
    path: pathOf(el, root),
    value: typeof el.value === "string" ? el.value : null,
    checked: typeof el.checked === "boolean" ? el.checked : null,
    selectionStart: Number.isInteger(el.selectionStart) ? el.selectionStart : null,
    selectionEnd: Number.isInteger(el.selectionEnd) ? el.selectionEnd : null,
  }))
  const active = globalThis.document?.activeElement ?? null
  const focus = active !== null && active !== undefined && isWithin(active, root)
    ? { chain: focusChain(active, root), path: pathOf(active, root) }
    : null
  return { scrolls, drafts, focus }
}

/** 控件值复填（`select`：捕获值无对应选项 ⇒ 零写 —— 不留空选 ∕ 不吞模型面新值）。 */
function setControlValue(el, value) {
  if (el.tagName === "SELECT") {
    const options = typeof el.querySelectorAll === "function" ? Array.from(el.querySelectorAll("option")) : []
    if (!options.some((option) => rawAttr(option, "value") === value)) return
  }
  el.value = value
}

/** 置焦一件并核落位（不可焦件 ⇒ 假 —— 链继续 ∕ 入残件）。 */
function focusLanded(el) {
  if (el === null || el === undefined || typeof el.focus !== "function") return false
  el.focus()
  return globalThis.document?.activeElement === el
}

/** 焦点复填：回退链逐环试（命中且落位即止），链尽不达 ⇒ 结构路径兜底；未落 ⇒ 回原焦点面（残件）。 */
function restoreFocus(root, focus) {
  if (focus === null || typeof focus !== "object") return null
  for (const loc of Array.isArray(focus.chain) ? focus.chain : []) {
    if (focusLanded(pickByKey(root, loc, focus.path))) return null
  }
  return focusLanded(byPath(root, focus.path)) ? null : focus
}

/** 草稿复填：值 ∕ `checked` ∕ 光标区间逐控件回写（键零命中 ⇒ 入残件——不复填）；未落件入残件。 */
function restoreDrafts(root, drafts) {
  const rest = []
  for (const entry of Array.isArray(drafts) ? drafts : []) {
    if (entry === null || typeof entry !== "object") continue
    const el = resolveTarget(root, entry.loc, entry.path)
    if (el === null) {
      rest.push(entry)
      continue
    }
    if (typeof entry.checked === "boolean" && typeof el.checked === "boolean") el.checked = entry.checked
    if (typeof entry.value === "string") setControlValue(el, entry.value)
    if (Number.isInteger(entry.selectionStart) && typeof el.setSelectionRange === "function") {
      el.setSelectionRange(entry.selectionStart, Number.isInteger(entry.selectionEnd) ? entry.selectionEnd : entry.selectionStart)
    }
  }
  return rest
}

/** 滚位复填（根 + 标记件；末写 —— 免被焦点 ∕ 选区复填引起的内滚覆盖）；写入未达（截）件入残件。 */
function restoreScrolls(root, scrolls) {
  const rest = []
  for (const entry of Array.isArray(scrolls) ? scrolls : []) {
    if (entry === null || typeof entry !== "object") continue
    const el = entry.loc === null ? root : resolveTarget(root, entry.loc, entry.path)
    if (el === null || el === undefined) {
      rest.push(entry)
      continue
    }
    if (!Number.isFinite(entry.top)) continue
    el.scrollTop = entry.top
    if (el.scrollTop !== entry.top) rest.push(entry)
  }
  return rest
}

/** 复填总闸：`scrolls` ∕ `drafts` ∕ `focus` 三段逐复（容器缺位 ∕ 空快照 ⇒ 零动作 ∕ 零残件）；
 *  序 = 焦点 → 草稿 → 滚位末写（焦点默认滚动 ∕ 选区落位先行 —— 滚位不被其内滚扰动）。
 *  返回未落**残件**（同 schema 形 —— 调用面可跨在途重建携带）。 */
export function restoreView(root, snap) {
  if (root === null || root === undefined || snap === null || typeof snap !== "object") return null
  const focus = restoreFocus(root, snap.focus)
  const drafts = restoreDrafts(root, snap.drafts)
  const scrolls = restoreScrolls(root, snap.scrolls)
  return { scrolls, drafts, focus }
}
