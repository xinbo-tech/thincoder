/**
 * 2026-10-10-purge-residue-sweep.test.mjs — 残留清除扫批（台账 #1090 ∥ #1121 ∥ #1125 ∥ #1126 ∥ #1127）批次本地单元件
 * （随批留存归档 · 不进仓套件）。名随批次档 · 住批次目录；复跑（从仓库根 `thincoder/`）：
 *   node --import thincoder-desktop/test/rc-resolve.mjs --test docs/batches/2026-10-10-purge-residue-sweep.test.mjs
 * `/rc/` 解析钩子须预载（渲染档取核件面 —— 同进程；不预载 ⇒ `mount-composer.mjs` 的 `/rc/…` 导入即 ERR_MODULE_NOT_FOUND）；
 * 导入按 `process.cwd()`（仓库根）相对解析。
 *
 * 腿（批档 §2 批内件设计 `:140`）：
 *   a）行 toggle 三判：展开 ⇒ 收起 ⇒ 再展开；两态零 post；菜单层恒在场（`aria-expanded` 随组体同拍）
 *   b）拾取单点 + `row` 直传：双事件序 ⇒ 恰一次；菜单在场期换行集 ⇒ 原行仍可拾（零静默丢点）
 *   c）写失败 ⇒ 失败行在场（`data-notice="prefs-failed"`）+ 钮回滚槽现值 + 槽零写（空槽 ⇒ 钮回「未选」空态）
 *   d）写回失败 ⇒ 回执携 `carryover` 码（真 `createAgentHost`：config 路径不可读 ⇒ 失败径；槽写照旧不反扑）
 *   e）源扫负向锁（AC-1090/1–3 ∥ AC-1125/1 ∥ AC-1126/1–2 ∥ AC-1127/1 机检面）
 * 纪律：只读面 ∕ 行为断言（真核件优先——假 DOM 仅替**宿主面**：零浏览器 ∥ 零网；`⌛` 真机走查归父侧闭合）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readFileSync, readdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（渲染档取核件面 —— 同进程）

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-core"))) throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)
const text = (rel) => readFileSync(resolve(ROOT, rel), "utf8")
const tmpDir = (name) => mkdtempSync(join(tmpdir(), name))

// ─── 核件词面接线（同生产装配单点：端侧注册面注入核 `setStrings`）+ 假宿主面 ────────────────────
const { setStrings } = await mod("thincoder-render-core/i18n.mjs")
const hostI18n = await mod("thincoder-desktop/renderer/i18n.mjs")
hostI18n.setStringsSink(setStrings) // 核件取词注册面（面板经核 `t` 取词）
hostI18n.initDict({ locale: "zh" }) // 中文词面（提示行 `{reason}` 位断言用）

/** 精简假 DOM（结构 ∥ 属性 ∥ `dataset` ∥ 监听器簿记 ∥ 选择器 ∥ body 树 —— 沿 `2026-10-04-desktop-model-switch-unlock.test.mjs`
 *  批内件假 DOM 先例 + 本批增补：`dataset`（`data-flyout-open` 行标）∥ 复合选择器（`.mm-row[data-flyout-open]`）∥
 *  `[data-slot="composer"]` 槽位命中）。 */
class FakeNode {
  constructor(tag = "div") {
    this.tagName = String(tag).toUpperCase()
    this.attrs = new Map()
    this.children = []
    this.parentNode = null
    this.style = {}
    this._text = ""
    this._listeners = new Map()
    this.id = ""
    this.className = ""
    this.value = ""
    this.placeholder = ""
    this.disabled = false
    this.readOnly = false
    this.scrollHeight = 10
    this.offsetHeight = 200
    this.selectionStart = 0
    this.selectionEnd = 0
  }
  get classList() {
    const self = this
    const read = () => String(self.attrs.get("class") ?? self.className ?? "").split(/\s+/).filter(Boolean)
    const write = (list) => { self.attrs.set("class", list.join(" ")); self.className = list.join(" ") }
    return {
      add: (...n) => write([...new Set([...read(), ...n])]),
      remove: (...n) => write(read().filter((x) => !n.includes(x))),
      contains: (n) => read().includes(n),
      toggle: (n, on) => (on ? write([...new Set([...read(), n])]) : write(read().filter((x) => x !== n))),
    }
  }
  /** `dataset`（#1121：行标 `data-flyout-open`）——camelCase ⇄ `data-kebab`，读写同源住 `attrs`。 */
  get dataset() {
    const self = this
    const toAttr = (k) => "data-" + String(k).replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())
    const seed = {}
    for (const [k, v] of self.attrs) if (k.startsWith("data-")) seed[k.slice(5).replace(/-([a-z])/g, (_m, c) => c.toUpperCase())] = v
    return new Proxy(seed, {
      get: (t, k) => (typeof k === "string" ? t[k] : undefined),
      set: (_t, k, v) => { self.attrs.set(toAttr(k), String(v)); return true },
      deleteProperty: (_t, k) => { self.attrs.delete(toAttr(k)); return true },
    })
  }
  get textContent() { return this.children.length === 0 ? (this._text ?? "") : (this._text ?? "") + this.children.map((c) => c.textContent).join("") }
  set textContent(v) { this._text = String(v ?? ""); this.children.length = 0 }
  get innerHTML() { return this._text }
  set innerHTML(v) { this._text = String(v ?? ""); this.children.length = 0 }
  setAttribute(n, v) { this.attrs.set(n, String(v)) }
  getAttribute(n) { return this.attrs.has(n) ? this.attrs.get(n) : null }
  removeAttribute(n) { this.attrs.delete(n) }
  addEventListener(type, fn) { if (!this._listeners.has(type)) this._listeners.set(type, []); this._listeners.get(type).push(fn) }
  removeEventListener(type, fn) { const l = this._listeners.get(type) ?? []; const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1) }
  dispatch(type, event = {}) { for (const fn of [...(this._listeners.get(type) ?? [])]) fn({ preventDefault() {}, stopPropagation() {}, ...event }) }
  append(...nodes) {
    for (const child of nodes) {
      if (child === null || child === undefined) continue
      if (typeof child === "object") { child.parentNode = this; this.children.push(child); continue }
      const textNode = new FakeNode("#text")
      textNode.textContent = String(child)
      textNode.parentNode = this
      this.children.push(textNode)
    }
  }
  /** 连通判据（`isConnected` —— `model-menu.mjs` 组体开合读面：`flyout.isConnected` ⇔ 真开；
   *  根部落到 `BODY` ∕ `HTML` 即连通 —— 真浏览器同义）。 */
  get isConnected() {
    let node = this
    while (node.parentNode !== null) node = node.parentNode
    return node.tagName === "BODY" || node.tagName === "HTML"
  }
  appendChild(child) { this.append(child); return child }
  insertBefore(child, ref) { const i = this.children.indexOf(ref); if (i < 0) this.append(child); else { child.parentNode = this; this.children.splice(i, 0, child) } return child }
  removeChild(n) { const i = this.children.indexOf(n); if (i >= 0) this.children.splice(i, 1); n.parentNode = null; return n }
  remove() { this.parentNode?.removeChild(this) }
  replaceChildren(...nodes) { this.children.length = 0; this.append(...nodes) }
  querySelectorAll(sel) { const out = []; const walk = (n) => { for (const c of n.children) { if (matches(c, sel)) out.push(c); walk(c) } }; walk(this); return out }
  querySelector(sel) { return this.querySelectorAll(sel)[0] ?? null }
  contains(n) { let p = n; while (p) { if (p === this) return true; p = p.parentNode } return false }
  getBoundingClientRect() { return { left: 0, top: 10, right: 100, bottom: 40, width: 100, height: 30 } }
  focus() {}
  click() { this.dispatch("click", {}) }
  setSelectionRange() {}
}
/** 匹配器：`#id` ∥ `.cls` ∥ `[attr]` ∥ `[attr="v"]` ∥ 标签 ∥ 复合（`.cls[attr]` —— 本批 `data-flyout-open` 行标读面）。 */
function matches(node, sel) {
  const raw = String(sel).trim()
  if (raw.startsWith("#")) return node.id === raw.slice(1) || node.getAttribute("id") === raw.slice(1)
  const head = /^([\w-]*)((?:[\w-]*\.[\w-]+|\[[\w-]+(?:="[^"]*")?\])*)$/.exec(raw)
  if (head === null) return false
  const [, tag, rest] = head
  if (tag !== "" && node.tagName !== tag.toUpperCase()) return false
  for (const part of rest.match(/\.[\w-]+|\[[\w-]+(?:="[^"]*")?\]/g) ?? []) {
    if (part.startsWith(".")) {
      if (!String(node.attrs.get("class") ?? node.className ?? "").split(/\s+/).includes(part.slice(1))) return false
      continue
    }
    const name = /^\[([\w-]+)/.exec(part)[1]
    const value = /="([^"]*)"\]$/.exec(part)
    const got = node.getAttribute(name)
    if (value === null ? got === null : got !== value[1]) return false
  }
  return true
}
/** 后代选择器链（`[data-slot="composer"] #send-btn` —— 空格分段逐级下钻）。 */
function queryIn(scope, sel) {
  let node = scope
  for (const part of String(sel).trim().split(/\s+/)) {
    node = node.querySelector(part)
    if (node === null) return null
  }
  return node
}
function installEnv() {
  const body = new FakeNode("body")
  const head = new FakeNode("head")
  const listeners = new Map()
  const doc = {
    body,
    head,
    documentElement: new FakeNode("html"),
    createElement: (tag) => new FakeNode(tag),
    createTextNode: (t) => { const n = new FakeNode("#text"); n.textContent = t; return n },
    getElementById: (id) => body.querySelector("#" + id) ?? null,
    addEventListener: (type, fn) => { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(fn) },
    removeEventListener: (type, fn) => { const l = listeners.get(type) ?? []; const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1) },
    querySelector: (sel) => queryIn(body, sel),
    querySelectorAll: (sel) => body.querySelectorAll(sel),
  }
  const win = { innerHeight: 800, innerWidth: 1200, requestAnimationFrame: (fn) => { fn(); return 1 }, addEventListener() {}, removeEventListener() {} }
  globalThis.document = doc
  globalThis.window = win
  globalThis.Node = FakeNode // `renderer/dom.mjs` `fill` 的 `child instanceof Node` 判据（真实树建点）
}

/** 核件面候选行（核件面形；P1 组 = m1 ∥ P2 组 = m2 —— 两渠两行）。 */
const MODELS = [
  { id: "m1", provider: "p1", group: "p1", label: "m1", reasoning: ["off", "high"] },
  { id: "m2", provider: "p2", group: "p2", label: "m2", reasoning: [] },
]
/** `model:catalog` 回执行（端侧投影入参形 = `{ provider, id, effortEnum, thinkOff }`）。 */
const CATALOG = [
  { provider: "p1", id: "m1", thinkOff: true, effortEnum: [] },
  { provider: "p2", id: "m2", thinkOff: true, effortEnum: [] },
]

const overlayOf = () => globalThis.document.body.querySelector(".mm-overlay")
const rowList = (scope) => (scope === null ? [] : scope.children.filter((c) => String(c.attrs.get("class") ?? c.className ?? "").split(/\s+/).includes("mm-row")))
/** provider 行 = `.mm-panel` 直属行；条目行 = 组体内行（`listBox` 内 —— 逐树下钻）。 */
const providerRows = (overlay) => rowList(overlay.querySelector(".mm-panel"))
const entryRows = (overlay) => overlay.querySelector(".mm-flyout").querySelectorAll(".mm-row")
const settle = async (fn, ms = 2000) => {
  const t0 = Date.now()
  while (!fn()) { if (Date.now() - t0 > ms) throw new Error("settle timeout"); await new Promise((r) => setTimeout(r, 5)) }
}

// ─── 腿 a（AC-1121/1）：行 = 分组/展开控件（toggle 三判 · 两态零 post · 菜单层恒在场）──────

test("a）行 toggle 三判：悬停/点击 = 展开⇄收起（`aria-expanded` 同拍 ∥ 两态零 post ∥ 菜单层恒在场）", async () => {
  installEnv()
  const { openModelMenu } = await mod("thincoder-render-core/composer/model-menu.mjs")
  const picks = []
  const anchor = globalThis.document.createElement("button")
  globalThis.document.body.append(anchor)
  openModelMenu({ anchorEl: anchor, models: MODELS, value: { provider: "p2", model: "m2" }, onPick: (pick) => picks.push(pick) })
  const overlay = overlayOf()
  assert.notEqual(overlay, null, "菜单层在场")
  const row = providerRows(overlay).find((r) => r.textContent.includes("p1"))
  assert.notEqual(row, undefined, "provider 行在场（p1）")
  assert.equal(row.getAttribute("role"), "button", "行 = 分组/展开控件（role=button）")
  assert.equal(row.getAttribute("aria-selected"), null, "行零选中语义（`aria-selected` 退场）")
  assert.equal(row.getAttribute("aria-expanded"), "false", "初态 aria-expanded=false")
  assert.equal(overlay.querySelector(".mm-flyout"), null, "初态组体不在场")
  // 段 1：悬停 ⇒ 展开（组体在场 + aria 同拍）
  row.dispatch("mouseenter")
  assert.notEqual(overlay.querySelector(".mm-flyout"), null, "悬停 ⇒ 组体在场（展开）")
  assert.equal(row.getAttribute("aria-expanded"), "true", "展开态 = `aria-expanded=true`")
  assert.equal(overlayOf(), overlay, "悬停不关菜单层")
  // 段 2：点击（已展开）⇒ 收起 —— 组体退场 ∥ 行标清 ∥ aria 回落；菜单层恒在场（开合两级解耦）
  row.dispatch("click", {})
  assert.equal(overlay.querySelector(".mm-flyout"), null, "点击 ⇒ 组体退场（收起）")
  assert.equal(row.getAttribute("data-flyout-open"), null, "行标（`data-flyout-open`）随组体退场")
  assert.equal(row.getAttribute("aria-expanded"), "false", "收起态 = `aria-expanded=false`")
  assert.equal(overlayOf(), overlay, "行点击不关菜单层（开合两级解耦）")
  // 段 3：再点击（无 hover 径）⇒ 再展开（触摸/无 hover 亦走此径）
  row.dispatch("click", {})
  assert.notEqual(overlay.querySelector(".mm-flyout"), null, "再点击 ⇒ 组体复在场（展开）")
  assert.equal(row.getAttribute("aria-expanded"), "true", "再展开 = `aria-expanded=true`")
  assert.equal(overlayOf(), overlay, "两态皆不关菜单层")
  assert.equal(picks.length, 0, "两态皆零 post（行非拾取面 —— 零 `selectModel` ∥ 零槽写）")
})

// ─── 腿 b（AC-1121/2）：拾取单点 + `row` 直传 ───────────────────────────────────────────

test("b）拾取单点 + `row` 直传：双事件序恰一次 ∥ 在场期换行集仍生效（零静默丢点）", async () => {
  installEnv()
  const { createModelMenu } = await mod("thincoder-render-core/composer/model-menu.mjs")
  const posts = []
  const modelBtn = globalThis.document.createElement("button")
  const reasoningBtn = globalThis.document.createElement("button")
  const controlsRow = globalThis.document.createElement("div")
  globalThis.document.body.append(modelBtn, reasoningBtn, controlsRow)
  const menu = createModelMenu({
    post: (type, payload) => posts.push({ type, payload }),
    state: { models: () => MODELS },
    hooks: {},
    modelBtn,
    reasoningBtn,
    controlsRow,
    blocked: () => false,
  })
  const countPosts = (type) => posts.filter((p) => p.type === type)
  // 段 1：双事件序（mousedown + click）⇒ 恰一次拾取（拾取单点在 click）
  menu.open()
  const overlay = overlayOf()
  assert.notEqual(overlay, null, "菜单层在场")
  providerRows(overlay).find((r) => r.textContent.includes("p1")).dispatch("mouseenter")
  const entry = entryRows(overlay).find((r) => r.textContent.includes("m1"))
  assert.notEqual(entry, undefined, "条目行在场（m1）")
  entry.dispatch("mousedown", {})
  assert.equal(countPosts("selectModel").length, 0, "mousedown 零拾取（单点在 click）")
  assert.notEqual(overlayOf(), null, "mousedown 不关菜单（零幽灵点击）")
  entry.dispatch("click", {})
  const picked = countPosts("selectModel")
  assert.equal(picked.length, 1, "双事件序 ⇒ 恰一次 `selectModel`（双发退场）")
  assert.equal(picked[0].payload.model, "m1", "拾取载荷 = 条目行模型")
  assert.equal(picked[0].payload.provider, "p1", "拾取载荷 = 条目行渠道")
  assert.equal(overlayOf(), null, "拾取后菜单层退场")
  // 段 2：菜单在场期候选换行集 ⇒ 旧行对象仍在手 ⇒ 原条目仍可拾取（`row` 直传 —— 零「查无即静默丢」）
  posts.length = 0
  menu.open()
  const overlay2 = overlayOf()
  providerRows(overlay2).find((r) => r.textContent.includes("p1")).dispatch("mouseenter")
  const entry2 = entryRows(overlay2).find((r) => r.textContent.includes("m1"))
  menu.applyModels({ type: "models", models: [{ id: "z9", provider: "p9", group: "p9", label: "z9", reasoning: [] }], prefs: {} })
  assert.equal(menu.models().some((m) => m.id === "m1"), false, "前提：行集已换（旧行不在缓存面）")
  entry2.dispatch("mousedown", {})
  entry2.dispatch("click", {})
  const late = countPosts("selectModel")
  assert.equal(late.length, 1, "在场期换行集 ⇒ 拾取仍生效（零静默丢点）")
  assert.equal(late[0].payload.model, "m1", "拾取载荷 = 渲染时行对象（`row` 直传）")
  assert.equal(late[0].payload.provider, "p1", "拾取载荷渠道随行对象")
})

// ─── 腿 c（AC-1121/3）：写失败 ⇒ 失败行 + 钮回滚 + 槽零写 ─────────────────────────────────

/** 全链装配（真 `attachComposer`：写面 ∥ 派生面 ∥ 核件面板 —— 回滚钩注入点 = 生产装配同一处）。 */
async function bootComposer({ sessionMeta = {}, failPick = "m1" } = {}) {
  installEnv()
  const { createStore } = await mod("thincoder-desktop/renderer/store.mjs")
  const { attachComposer } = await mod("thincoder-desktop/renderer/mount-composer.mjs")
  const store = createStore()
  const slot = globalThis.document.createElement("div")
  slot.setAttribute("data-slot", "composer")
  globalThis.document.body.append(slot)
  store.set({ activeSession: "1", sessionMeta })
  const invokes = []
  const host = {
    invoke: async (channel, payload) => {
      invokes.push({ channel, payload })
      if (channel === "model:catalog") return { ok: true, models: CATALOG }
      if (channel === "session:prefs") {
        const patch = payload?.patch ?? {}
        if (typeof patch.model === "string" && patch.model === failPick) return { ok: false, reason: "slot-missing" } // 写失败径
        // 回声径（推送回写）：按补丁镜像槽元（真宿主同形 —— 只落给定键）
        const meta = { ...(store.get().sessionMeta?.["1"] ?? {}) }
        if (typeof patch.model === "string") meta.model = patch.model
        if (typeof patch.provider === "string") meta.provider = patch.provider
        if (typeof patch.effort === "string") meta.effort = patch.effort
        return { ok: true, reason: null, cwd: "/x", slot: 1, meta }
      }
      if (channel === "session:flags") return { ok: true, flags: {} }
      return { ok: false, reason: "unexpected-channel" }
    },
  }
  attachComposer(host, { store })
  await settle(() => (store.get().modelCandidates?.models ?? []).length > 0) // 候选面首取落地
  return {
    store,
    slot,
    invokes,
    modelBtn: () => slot.querySelector("#model-btn"),
    noticeRow: (kind) => slot.querySelector(`[data-notice="${kind}"]`),
  }
}
/** 菜单开 ⇒ p1 组体开 ⇒ 条目行（m1）双事件序拾取（与腿 b 同径 —— 生产拾取面）。 */
async function pickEntry(slot, label = "m1") {
  slot.querySelector("#model-btn").dispatch("click", {})
  const overlay = overlayOf()
  providerRows(overlay).find((r) => r.textContent.includes("p1")).dispatch("mouseenter")
  const entry = entryRows(overlay).find((r) => r.textContent.includes(label))
  entry.dispatch("mousedown", {})
  entry.dispatch("click", {})
}

test("c-1）写失败：失败行在场（`prefs-failed`）∧ 钮 ∥ 选中态回滚槽现值 ∧ 槽零写（零回写 ∥ 零自激）", async () => {
  const { store, slot, invokes, modelBtn, noticeRow } = await bootComposer({ sessionMeta: { "1": { provider: "p2", model: "m2" } } })
  assert.equal(modelBtn().textContent, "m2", "初态：钮文本 = 槽现值（推送 prefs 派生）")
  const writesBefore = invokes.filter((i) => i.channel === "session:prefs").length // 拾取前写径计数（回滚零重写负向锁基准）
  await pickEntry(slot)
  await settle(() => noticeRow("prefs-failed") !== null)
  await new Promise((r) => setTimeout(r, 60)) // 自激窗（回滚重推 ⇒ 自动回写 ⇒ 失败 ⇒ … 若存在必在此显形）
  const row = noticeRow("prefs-failed")
  assert.equal(row.getAttribute("class"), "composer-notice", "行形 = `composer-notice`（B21 单形不动）")
  assert.ok(row.textContent.includes("slot-missing"), "行带出回执码（`{reason}` 位）—— 零静默")
  assert.equal(noticeRow("send-failed"), null, "负向锁：非发送失败行（来源分家）")
  assert.equal(modelBtn().textContent, "m2", "钮文本回滚槽现值（乐观值 m1 零留影）")
  const failedPick = invokes.filter((i) => i.channel === "session:prefs" && i.payload?.patch?.model === "m1")
  assert.equal(failedPick.length, 1, "写径恰一次（零重发）")
  assert.equal(invokes.filter((i) => i.channel === "session:prefs").length, writesBefore + 1, "回滚零回写：拾取后 `session:prefs` 新增恰 1 笔（失败选定）——零重写 ∥ 零自激（`rollback` 位 ⇒ 核回写门闭）")
  assert.equal(store.get().sessionMeta["1"].model, "m2", "槽零写：失败选定未落切片（model = 槽现值）")
  assert.equal(store.get().sessionMeta["1"].provider, "p2", "槽零写：失败选定未落切片（provider = 槽现值）")
  const later = invokes.filter((i) => i.channel === "session:prefs" && i.payload?.patch?.model === "m1")
  assert.equal(later.length, 1, "回滚后零重发失败写（回滚 = 槽现值重派生，非重写）")
})

test("c-2）写失败 ∧ 槽复合缺：钮回「未选」空态（回滚重推专属 —— 乐观值零留影）", async () => {
  const { slot, store, modelBtn, noticeRow } = await bootComposer({ sessionMeta: {} })
  assert.equal(modelBtn().textContent, "...", "初态：占位符（未选）")
  await pickEntry(slot)
  await settle(() => noticeRow("prefs-failed") !== null)
  assert.equal(modelBtn().textContent, "", "槽复合缺 ⇒ 钮复归空态（`rollback` 位专属支）")
  assert.deepEqual(store.get().sessionMeta, {}, "槽零写（空槽保持空 —— 零假造）")
})

// ─── 腿 d（AC-1121/3）：写回失败 ⇒ 回执携 `carryover` 码 ∧ 同行可见 ∧ 槽写不反扑 ────────────

test("d）写回失败：真宿主回执携 `carryover:{ ok:false, reason }` ∧ 槽写照旧（不反扑）", async () => {
  const cfgIo = await mod("thincoder-desktop/node_modules/@thincoder/core/config-io.mjs")
  const coreSession = await mod("thincoder-desktop/node_modules/@thincoder/core/session.mjs")
  const probeMod = await mod("thincoder-desktop/node_modules/@thincoder/core/provider/list-models.mjs")
  const [agentHostMod, sessionSlotsMod] = await Promise.all([
    mod("thincoder-desktop/src/main/agent-host.mjs"),
    mod("thincoder-desktop/src/main/session-slots.mjs"),
  ])
  sessionSlotsMod._setSessionsDirForTest(tmpDir("prs-sessions-"))
  cfgIo._setConfigPathForTest(tmpDir("prs-cfgdir-")) // config 路径 = 目录 ⇒ 读/写必失败（写回径失败）
  probeMod._setProbeImplForTest(async () => ({ ok: false, error: "probe stub" })) // 零网
  const cwd = tmpDir("prs-cwd-")
  const host = agentHostMod.createAgentHost({
    emit: () => {},
    projects: { currentCwd: () => cwd },
    assemble: async () => { throw new Error("assemble must not run in setPrefs path") },
    run: async () => {},
  })
  const logged = []
  const origError = console.error
  console.error = (...args) => { logged.push(args.map(String).join(" ")) }
  try {
    const slot = await sessionSlotsMod.newSession(cwd)
    let receipt = null
    let threw = null
    try { receipt = host.setPrefs(String(slot), { provider: "p1", model: "m2" }) } catch (error) { threw = error }
    assert.equal(threw, null, "零进程抛")
    assert.equal(receipt?.ok, true, "槽写受理：回执仍 `ok:true`（不反扑 —— 本会话已生效）")
    assert.equal(receipt?.carryover?.ok, false, "回执叠加失败码 `carryover:{ ok:false }`（#1121 修③）")
    assert.equal(typeof receipt.carryover.reason, "string", "失败码携 `reason`（零静默）")
    assert.ok(receipt.carryover.reason !== "", "`reason` 非空")
    assert.equal("providerState" in (receipt ?? {}), false, "失败径零 `providerState`（键缺席 —— 既有面零变）")
    assert.equal(coreSession.loadSlotFile(cwd, slot).activeModel, "m2", "槽写照旧（本会话已生效）")
    assert.ok(logged.some((line) => line.includes("carryover failed")), "主侧 console.error 记错（零静默）")
  } finally {
    console.error = origError
    probeMod._setProbeImplForTest(null)
    cfgIo._resetConfigPathForTest()
    sessionSlotsMod._resetSessionsDirForTest()
  }
})

test("d-2）渲染面消费：成功回执携 `carryover` 失败码 ⇒ 同一条失败行（槽写照旧不反扑）", async () => {
  installEnv()
  const { createStore } = await mod("thincoder-desktop/renderer/store.mjs")
  const { createComposerWire } = await mod("thincoder-desktop/renderer/composer-wire.mjs")
  const store = createStore()
  store.set({ activeSession: "1" })
  let rollbacks = 0
  let repaints = 0
  const wire = createComposerWire({
    store,
    activeKey: () => store.get().activeSession,
    call: async () => ({ ok: true, reason: null, cwd: "/x", slot: 1, meta: { provider: "p1", model: "m2" }, carryover: { ok: false, reason: "mtime-conflict" } }),
    push: () => {},
    panelOf: () => null,
    repaint: () => { repaints += 1 },
    rollbackPrefs: () => { rollbacks += 1 },
  })
  wire.post("selectModel", { provider: "p1", model: "m2" })
  await settle(() => wire.failure() !== null)
  assert.equal(wire.failure()?.reason, "mtime-conflict", "失败行源携写回失败码")
  assert.equal(wire.failure()?.source, "session:prefs", "来源 = 偏好写径（词 ∥ 行属性路由判据）")
  assert.equal(repaints > 0, true, "提示行重挂（同行可见）")
  assert.equal(rollbacks, 0, "槽写受理 ⇒ 零回滚（槽写不反扑）")
  assert.equal(store.get().sessionMeta["1"].model, "m2", "槽写照旧落切片")
})

// ─── 腿 e：源扫负向锁（AC-1090 ∥ AC-1125 ∥ AC-1126 ∥ AC-1127 机检面）─────────────────────

/** 代码树枚举（排除依赖 ∥ 构建产物 ∥ 归档 ∥ 临时面）。 */
function codeFiles(roots) {
  const skip = new Set(["node_modules", "dist", "dist-r3", "dist-r4", "build", "release", ".thincoder", ".git", "artifacts", "coverage", "_archive"])
  const out = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) { if (!skip.has(entry.name)) walk(join(dir, entry.name)) }
      else if (/\.(mjs|js|cjs)$/.test(entry.name)) out.push(join(dir, entry.name))
    }
    return out
  }
  for (const root of roots) if (existsSync(join(ROOT, root))) walk(join(ROOT, root))
  return out
}
const DESKTOP_SOURCES = codeFiles(["thincoder-desktop/renderer", "thincoder-desktop/src"])
const hitsIn = (files, re) => files.filter((file) => re.test(readFileSync(file, "utf8"))).map((file) => file.slice(ROOT.length + 1))

test("e-1）AC-1090/1–2 ∥ AC-1126/1–2：切片种子 ∥ 投影行清零 ∧ 回执活面保留", () => {
  assert.equal(hitsIn(DESKTOP_SOURCES, /settings\??\.defaultModel/).join(","), "", "`settings.defaultModel` 切片零读点")
  assert.equal(hitsIn(DESKTOP_SOURCES, /\bdefaultModel:\s*(null|current)\b/).join(","), "", "切片种子 ∥ 两写点零命中（`store.mjs` ∥ `mount-settings-reads.mjs`）")
  const reads = text("thincoder-desktop/renderer/mount-settings-reads.mjs")
  assert.ok(reads.includes("receipt?.defaultModel"), "活面保留：`activeModel()` 回执 `defaultModel` 直读不动")
  assert.ok(text("thincoder-desktop/src/main/providers.mjs").includes("defaultModel:"), "活面保留：`provider:list` 回执 `defaultModel` 键不动")
  assert.equal(hitsIn(DESKTOP_SOURCES, /proxy\??\.model\b/).join(","), "", "`env.proxy.model` 零命中（种子 + 投影行）")
  assert.equal(hitsIn(DESKTOP_SOURCES, /\bmodel:\s*false\b/).join(","), "", "种子 ∥ 夹具零 `model: false` 残键")
})

test("e-2）AC-1090/3（cmd-config 写即归一）∥ AC-1125/1 ∥ AC-1127/1（源扫）", () => {
  const cmdConfig = text("thincoder-cli/src/tui/cmd-config.mjs")
  assert.ok(/raw\.proxy = \{ uri: newUri, web:/.test(cmdConfig), "seturi 写即归一：两键重建 `{ uri, web }`")
  assert.equal(cmdConfig.includes("{ ...raw.proxy, uri: newUri }"), false, "旧「原样保留」形退场（残键随写清零）")
  assert.ok(cmdConfig.includes("raw.proxy = { ...pc, web: !pc.web }"), "toggleweb 径照旧（归一态两键）")
  const vision = text("thincoder-core/vision-reader.mjs")
  assert.equal((vision.match(/明书不恢复/g) ?? []).length, 2, "「明书不恢复」写实在位（档头 + 函数注两处）")
  const visionAll = codeFiles(["thincoder-core", "thincoder-vscode/src", "thincoder-desktop/src", "thincoder-desktop/renderer", "thincoder-cli/src", "thincoder-render-core"])
  assert.equal(hitsIn(visionAll, /判定源重定在途/).join(","), "", "「判定源重定在途」零命中（D8 失效表述清零）")
  assert.equal(existsSync(join(ROOT, "thincoder-vscode/src/extension/vision-channel.mjs")), false, "`vision-channel.mjs` 档删（盘上零件）")
  assert.equal(hitsIn(visionAll, /(?:from|require\()\s*["'`][^"'`]*vision-channel/).join(","), "", "仓内零 import（静态 ∥ 动态 —— 档头沿革注不算引用）")
})

test("e-3）AC-1121/2 回查支 ∥ 词键两语（机检面）", async () => {
  const core = text("thincoder-render-core/composer/model-menu.mjs")
  assert.ok(core.includes("row ?? _models.find("), "`row` 直传优先 + 回查兜底（VSC 三消费面不吃该键）在档")
  assert.ok(core.includes("unknown pick"), "回查亦无 ⇒ 记错一行（零静默）在档")
  assert.equal(/row\.addEventListener\("mousedown", \(e\) => \{ e\.preventDefault\(\); e\.stopPropagation\(\); pickModel/.test(core), false, "`mousedown` 拾取退场（单点在 click）")
  assert.ok(text("thincoder-vscode/webview/model-menu.js").includes("composer/model-menu.mjs"), "VSC 消费面 = 核件 re-export（两端同源）")
  const { VIEWS_DICT } = await mod("thincoder-desktop/renderer/i18n-views.mjs")
  assert.equal(typeof VIEWS_DICT.en["composer.prefs.failed"], "string", "新键 en 在位")
  assert.equal(typeof VIEWS_DICT.zh["composer.prefs.failed"], "string", "新键 zh 在位")
  assert.equal(Object.keys(VIEWS_DICT.en).length, Object.keys(VIEWS_DICT.zh).length, "两语键集仍相等")
})
