/**
 * 2026-10-01-digest-residue-pair.test.mjs — 批次本地单元件（台账 #767 · 消化面残余族处置批 · 实施轮）·
 * 任务书 = `docs/batches/2026-10-01-digest-residue-pair.md` §2（设计块 ∥ 修正块 1–6）。
 * 腿：
 *   ① **销件后现役面零悬空**（去名全链：机检扫描域零命中 ∥ 模块图装载 ∥ 两档导出面零残留）
 *   ② **复入窗 = 整置**（位次轮出窗（零行）→ 前插一页（入区）⇒ 整置重放——行归记录位次（回填落位批 2026-10-04 收正）→ 复跑序稳定 → 重建幂等）
 * **as-of 注（父侧 · 2026-10-04——回填落位批 #910 收口）**：腿 ②③ 已改指**整置形**（`prepend` 退场 ∥ `reentryBackfill` 已删）；原「流末补建」断言随批撤销。判据单源 = `docs/batches/2026-10-04-digest-reentry-order.md` §2。
 *   ③ **换代负控**（「换代后零重复建」——`cap` ∕ `end` 换代（新对象同位次）⇒ 同区间复跑行数零增）
 *   ④ **有行零写负控**（在区有行 ⇒ 零建 ∥ 零写——重建复列行族零复制 ∥ 位次轮行组零重标）
 * 随批留存 · 不进仓套件（全清令：仓套件不写 ∕ 不改 ∕ 不跑）。
 * 复跑（cwd = 仓库根，即含 `thincoder-core/` 的目录）：node --test docs/batches/2026-10-01-digest-residue-pair.test.mjs
 * 纪律：行为断言优先（真归约体 ∥ 真帧路 ∥ 真构树面）；真机一条 = 父侧闭合 —— 本档只落机检面。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（须先于任何 /rc/ 取件注册）

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-core"))) throw new Error(`从仓库根（含 thincoder-core/）运行：cwd = ${ROOT}`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)

const [pageRead, i18n, i18nCore, chat, chatModel, chrome, rowsMod] = await Promise.all([
  mod("thincoder-desktop/renderer/page-read.mjs"), // 页读径（回填并入 ∥ 结构作业）
  mod("thincoder-desktop/renderer/i18n.mjs"), // 词面投影（t）
  mod("thincoder-core/i18n.mjs"), // 核字典投影（词面单源）
  mod("thincoder-desktop/renderer/views/chat.mjs"), // 挂载 ∥ 帧尾六步（真路）
  mod("thincoder-desktop/renderer/views/chat-model.mjs"), // 帧模型（窗出口）
  mod("thincoder-desktop/renderer/views/chat-chrome.mjs"), // 帧尾态刷（引调面）
  mod("thincoder-desktop/renderer/views/chat-digest-rows.mjs"), // 行族单档（消件面 ∥ 复入窗补建面）
])

// ─── 假 DOM（属性 ∕ 选择器 ∕ 结构 —— 沿 `2026-10-01-digest-rows-natural-form.test.mjs` 先例）──

class FakeText {
  constructor(value) {
    this.textContent = String(value)
    this.parentNode = null
  }
  get nodeType() { return 3 }
  get nextSibling() {
    if (this.parentNode === null) return null
    const at = this.parentNode.childNodes.indexOf(this)
    return at < 0 ? null : this.parentNode.childNodes[at + 1] ?? null
  }
  remove() { if (this.parentNode !== null) this.parentNode.removeChild(this) }
}

class FakeNode {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase()
    this.attrs = {}
    this.childNodes = []
    this.parentNode = null
    this.listeners = []
    this._scrollTop = 0
    this._height = 200
    this._scrollHeight = 1000
  }
  get nodeType() { return 1 }
  get children() { return this.childNodes.filter((node) => node instanceof FakeNode) }
  get firstChild() { return this.childNodes[0] ?? null }
  get nextSibling() {
    if (this.parentNode === null) return null
    const at = this.parentNode.childNodes.indexOf(this)
    return at < 0 ? null : this.parentNode.childNodes[at + 1] ?? null
  }
  get textContent() { return this.childNodes.map((child) => child.textContent).join("") }
  set textContent(value) {
    this.replaceChildren()
    if (String(value ?? "") !== "") this.append(new FakeText(value))
  }
  get innerHTML() { return this.textContent }
  set innerHTML(value) { this.replaceChildren(new FakeText(value)) }
  get className() { return this.attrs.class ?? "" }
  set className(value) { this.attrs.class = String(value) }
  get scrollTop() { return this._scrollTop }
  set scrollTop(value) { this._scrollTop = Math.max(0, Math.min(Number(value) || 0, Math.max(0, this.scrollHeight - this._height))) }
  get scrollHeight() { return this._scrollHeight }
  set scrollHeight(value) { this._scrollHeight = Number(value) || 0 }
  get clientHeight() { return this._height }
  set clientHeight(value) { this._height = Number(value) || 0 }
  getAttribute(name) { return Object.hasOwn(this.attrs, name) ? this.attrs[name] : null }
  getAttributeNames() { return Object.keys(this.attrs) }
  setAttribute(name, value) { this.attrs[name] = String(value) }
  removeAttribute(name) { delete this.attrs[name] }
  addEventListener() {}
  removeEventListener() {}
  append(...nodes) {
    for (const node of nodes) {
      const child = node instanceof FakeNode || node instanceof FakeText ? node : new FakeText(node)
      if (child.parentNode !== null) child.parentNode.removeChild(child)
      child.parentNode = this
      this.childNodes.push(child)
    }
  }
  appendChild(node) { this.append(node); return node }
  prepend(...nodes) { for (const node of [...nodes].reverse()) this.insertBefore(node, this.childNodes[0] ?? null) }
  insertBefore(node, ref) {
    const child = node instanceof FakeNode || node instanceof FakeText ? node : new FakeText(node)
    if (child.parentNode !== null) child.parentNode.removeChild(child)
    child.parentNode = this
    const index = ref === null || ref === undefined ? -1 : this.childNodes.indexOf(ref)
    if (index < 0) this.childNodes.push(child)
    else this.childNodes.splice(index, 0, child)
    return child
  }
  removeChild(node) {
    const at = this.childNodes.indexOf(node)
    if (at >= 0) this.childNodes.splice(at, 1)
    node.parentNode = null
    return node
  }
  replaceWith(next) {
    if (this.parentNode === null) return
    this.parentNode.insertBefore(next, this)
    this.remove()
  }
  remove() { if (this.parentNode !== null) this.parentNode.removeChild(this) }
  replaceChildren(...nodes) {
    for (const child of this.childNodes) child.parentNode = null
    this.childNodes = []
    this.append(...nodes)
  }
  walk(fn) { for (const child of this.children) { fn(child); child.walk(fn) } }
  querySelector(sel) { let hit = null; this.walk((node) => { if (hit === null && select(node, sel)) hit = node }); return hit }
  querySelectorAll(sel) { const out = []; this.walk((node) => { if (select(node, sel)) out.push(node) }); return out }
}

function matchesSegment(node, sel) {
  if (sel.startsWith(".")) return String(node.getAttribute("class") ?? "").split(/\s+/).includes(sel.slice(1))
  if (/^[a-zA-Z][\w-]*$/.test(sel)) return node.tagName === sel.toUpperCase()
  const m = /^\[([^=\]]+)(?:="([^"]*)")?\]$/.exec(sel)
  if (m === null) return false
  const value = node.getAttribute(m[1])
  if (value === null) return false
  return m[2] === undefined || value === m[2]
}
function select(node, sel) { return String(sel).split(",").some((part) => selectOne(node, part.trim())) }
function selectOne(node, sel) {
  const parts = String(sel).trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return false
  if (!matchesSegment(node, parts[parts.length - 1])) return false
  let at = parts.length - 2
  for (let p = node.parentNode; p !== null && at >= 0; p = p.parentNode) {
    if (p instanceof FakeNode && matchesSegment(p, parts[at])) at -= 1
  }
  return at < 0
}

let prevDoc = null
let prevNode = null
function installFakeDom() {
  prevDoc = globalThis.document
  prevNode = globalThis.Node
  globalThis.document = {
    activeElement: null,
    createElement: (tag) => new FakeNode(tag),
    createTextNode: (value) => new FakeText(value),
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
  }
  globalThis.Node = FakeNode
}
function restoreFakeDom() {
  globalThis.document = prevDoc
  globalThis.Node = prevNode
}
async function withFakeDom(fn) {
  installFakeDom()
  try { return await fn() } finally { restoreFakeDom() }
}

// ─── 场景脚手架（真路：mountChat ∥ settleFrame）────────────────

const KEY = "1"
const zh = () => i18n.initDict({ locale: "zh", dict: i18nCore.projectDictionary("zh") })
const SCROLL = { readMetrics: () => ({ scrollTop: 0, scrollHeight: 1000, clientHeight: 200 }) }

const baseState = (over = {}) => ({
  activeSession: KEY, blocks: [], digest: {}, stopMark: {}, following: true, pendingNew: 0,
  history: { hasOlder: false, inFlight: false }, pool: {}, ...over,
})
const receipt = (messages, over = {}) => ({ ok: true, messages, hasOlder: false, next: null, meta: {}, flags: null, queue: null, ...over })
const liveRound = (over = {}) => ({ status: "start", n: 2, tier: null, from: null, msg: null, ...over })
const endRound = (over = {}) => ({ status: "end", n: 2, tier: null, from: null, msg: null, ok: true, ms: 900, ...over })

const rowsOf = (root) => [...root.querySelectorAll("[data-digest]")]
const at = (root, node) => root.childNodes.indexOf(node)
const typeOfRow = (row) => ["label", "count", "cap", "end"].find((name) => row.getAttribute(`data-digest-${name}`) !== null) ?? null
const atOfRow = (row) => (typeof row?._digestRound?.at === "number" && Number.isFinite(row._digestRound.at) ? row._digestRound.at : null)
/** 真帧路（镜像 `renderer/app.mjs` `paintChat`：含 `build` 作业 ⇒ 构造径（整置）；否则结算径）。 */
const frame = (root, state, mounted) => {
  const ops = state.flowOps ?? []
  if (ops.some((op) => op.kind === "build")) return mount(root, state)
  return chat.settleFrame(root, chatModel.chatModel(state), SCROLL, {}, { mounted, hidden: 0, ops })
}
/** 构造径（镜像 `renderer/app.mjs` `paintChat`：`mountChat` + 同帧帧尾态刷配对 —— 配对 = 不变量）。 */
const mount = (root, state) => {
  const model = chatModel.chatModel(state)
  const mounted = chat.mountChat(root, state, {}, 150).mounted
  chrome.syncChrome(root, model, {})
  return mounted
}
/** 同节点判据（**身份面** —— `deepEqual` 只证结构等价，证不了「同节点」）：逐位 `===`。 */
const sameRefs = (list, expected) => list.length === expected.length && list.every((node, index) => node === expected[index])
const freshRoot = () => { const root = new FakeNode("div"); root.__connected = true; return root }

/** 复入窗补建场景（腿 ②③④ 共用）：位次轮 `early`（`at` = 20）出窗（`floor` = 90 ⇒ 零行）∥ 运行期轮 `live` 在场。 */
function reentryScene() {
  const early = endRound({ n: 1, at: 20 })
  const live = liveRound({ n: 2 })
  const root = freshRoot()
  let state = baseState({ blocks: [{ kind: "assistant", text: "晚", at: 90, id: "a3" }], digest: { [KEY]: [early, live] } })
  let mounted = mount(root, state)
  return { root, early, live, state, mounted, setMounted: (value) => { mounted = value }, getMounted: () => mounted }
}
/** 前插一页（`floor` 90 ⇒ 10：位次轮入区——页面无消化记录 ⇒ 轮集零动）。 */
const prependPage = (state) => pageRead.applyPage(state, receipt([{ kind: "assistant", text: "旧", idx: 10, timestamp: 1 }], { hasOlder: true, next: 5 }), { key: KEY, before: 9 })

// ─── 腿 ①：销件后现役面零悬空 ───────────────────────────────

test("腿 ①·销件后现役面零悬空：去名全链（机检扫描域零命中 ∥ 模块图装载 ∥ 导出面零残留）", () => {
  const NAME = ["digest", "Present"].join("") // 字面拆分 —— 本件自身亦在零命中面内（不携裸名）
  // 1a 机检：扫描域 = `thincoder-desktop/renderer/**` ∥ `thincoder-desktop/test/**` ∥ `scripts/**`
  const hits = []
  const scan = (rel) => {
    for (const entry of readdirSync(rel, { withFileTypes: true })) {
      const path = join(rel, entry.name)
      if (entry.isDirectory()) { scan(path); continue }
      readFileSync(path, "utf8").split("\n").forEach((line, index) => { if (line.includes(NAME)) hits.push(`${path}:${index + 1}`) })
    }
  }
  for (const dir of ["thincoder-desktop/renderer", "thincoder-desktop/test", "scripts"]) scan(dir)
  assert.deepEqual(hits, [], "销件后现役面零命中（零悬空）")
  // 1b 导出面零残留（两档：定义面 ∥ 再出口面）∥ 装载面在场（模块图解析过 —— import 面零断）
  assert.equal(NAME in rowsMod, false, "行族单档：定义面已摘（导出零残留）")
  assert.equal(NAME in chrome, false, "帧尾态刷：再出口已摘（导出零残留）")
  assert.equal(typeof rowsMod.syncDigest, "function", "行族单档装载在场（syncDigest）")
  assert.equal(typeof chrome.syncChrome, "function", "帧尾态刷装载在场（syncChrome）")
  assert.equal(typeof chat.mountChat, "function", "挂载面装载在场（mountChat）")
  assert.equal(typeof pageRead.applyPage, "function", "页读面装载在场（applyPage）")
})

// ─── 腿 ②：复入窗补建 ──────────────────────────────────────

test("腿 ②·复入窗（回填落位批收正——整置形）：位次轮出窗（零行）→ 前插一页（入区）⇒ 整置重放——行归记录位次（零原地补建）→ 复跑序稳定", async () => {
  await withFakeDom(async () => {
    zh()
    const { root, early, live, state, getMounted, setMounted } = reentryScene()
    // 2a 出窗：`floor` = 90 > 20 ⇒ 位次轮零行（窗口即窗口）；运行期轮照常在场
    const before = rowsOf(root)
    assert.equal(before.length, 2, "运行期轮两行在场（位次轮出窗——零行）")
    assert.ok(before.every((row) => row._digestRound === live), "在册行皆属运行期轮（位次轮零行）")
    assert.deepEqual(before.map(typeOfRow), ["label", "count"], "运行期轮行序 = 标签 → 计数")

    // 2b 前插一页（入区）：`floor` 90 ⇒ 10 ⇒ 位次轮在区缺行 ⇒ 当刻流末补建
    const merged = prependPage(state)
    assert.equal(merged.digest[KEY].length, 2, "轮集零动（并入面：页面无消化记录）")
    setMounted(frame(root, merged, getMounted()))
    const after = rowsOf(root)
    assert.equal(after.length, 5, "整置重放：位次轮三行 + 活轮两行（合计 5）")
    assert.ok(!after.some((row) => before.includes(row)), "节点换代（整置 = 删档 + 新写——非「零动」）")
    assert.deepEqual(after.map((row) => atOfRow(row)), [20, 20, 20, null, null], "序 = 位次轮组（记录位次 20）→ 活轮组（流末）")
    assert.deepEqual(after.slice(0, 3).map(typeOfRow), ["label", "count", "end"], "位次轮组行序 = 标签 → 计数 → 终态")
    const seqA = [...root.querySelectorAll("[data-block-kind],[data-digest]")].map((node) => (node.getAttribute("data-digest") !== null ? "D" : "b"))
    assert.deepEqual(seqA, ["b", "D", "D", "D", "b", "D", "D"], "归记录位次：位次轮组居旧(10) 与晚(90) 之间（活轮落流末）")

    // 2c 复跑（整置重放——幂等）：行数 ∥ 序稳定（节点换代 = 重建体例）
    setMounted(frame(root, merged, getMounted()))
    const afterC = rowsOf(root)
    assert.equal(afterC.length, 5, "复跑：行数稳定（5）")
    assert.deepEqual(afterC.map((row) => atOfRow(row)), [20, 20, 20, null, null], "复跑：序稳定（位次轮组 → 活轮组）")

    // 2d 重建 ⇒ 归记录位次（构树面按记录位次复列；补建组随重建退场）
    setMounted(mount(root, merged))
    assert.equal(rowsOf(root).length, 5, "重建后行族全量（位次轮三行 + 运行期轮两行）")
    const seq = [...root.querySelectorAll("[data-block-kind],[data-digest]")].map((node) => (node.getAttribute("data-digest") !== null ? "D" : "b"))
    assert.deepEqual(seq, ["b", "D", "D", "D", "b", "D", "D"], "归记录位次：位次轮行组居旧(10) ∥ 晚(90) 之间（运行期轮落流末）")
    const rebuiltRows = rowsOf(root)
    assert.deepEqual(rebuiltRows.slice(0, 3).map(typeOfRow), ["label", "count", "end"], "重建径行组全量（三行）")
    assert.ok(rebuiltRows.slice(0, 3).every((row) => atOfRow(row) === 20), "重建径行组归于记录位次轮")
  })
})

// ─── 腿 ③：换代负控 ────────────────────────────────────────

test("腿 ③·换代负控（「换代后零重复建」）：`cap` ∕ `end` 换代（新对象同位次）⇒ 同区间复跑行数零增", async () => {
  await withFakeDom(async () => {
    zh()
    const { root, early, live, state, getMounted, setMounted } = reentryScene()
    const merged = prependPage(state)
    setMounted(frame(root, merged, getMounted()))
    const filled = rowsOf(root)
    assert.equal(filled.length, 5, "前置：整置重放在场（5 行）")

    // 3a 位次轮换代：同 `at` 新对象（模拟 `cap` ∕ `end` 更新 ⇒ 轮引用变）⇒ 判据以位次为断 ⇒ 零重复建
    const rotated = { ...early, ms: 500 }
    assert.notEqual(rotated, early, "换代 = 新对象（引用断）")
    assert.equal(rotated.at, early.at, "同轮位次不变")
    const rotatedState = { ...merged, flowOps: [], digest: { [KEY]: [rotated, live] } }
    setMounted(frame(root, rotatedState, getMounted()))
    assert.equal(rowsOf(root).length, 5, "换代后复跑：行数零增（零重复建）")
    assert.deepEqual(rowsOf(root).map((row) => atOfRow(row)), filled.map((row) => atOfRow(row)), "换代后复跑：序稳定（整置重放——节点换代）")

    // 3b 运行期轮换代（`cap` 帧 ⇒ 新对象）⇒ 既有三支面照旧（末轮行账续记——零重建）
    const rotatedLive = { ...live, n: 3 }
    const capState = { ...rotatedState, flowOps: [], digest: { [KEY]: [rotated, rotatedLive] } }
    setMounted(frame(root, capState, getMounted()))
    assert.equal(rowsOf(root).length, 5, "运行期轮换代：行数零增（同轮续记）")
    assert.ok(sameRefs(rowsOf(root).slice(0, 2), filled.slice(0, 2)), "运行期轮行节点零动（身份面）")
  })
})

// ─── 腿 ④：有行零写负控 ────────────────────────────────────

test("腿 ④·有行零写负控：在区有行 ⇒ 零建 ∥ 零写（重建复列行族零复制 ∥ 位次轮行组零重标）", async () => {
  await withFakeDom(async () => {
    zh()
    const { root, early, live, state } = reentryScene()
    const merged = prependPage(state)
    // 4a 重建径：两轮皆在区 ⇒ 复列行族全量在场（无补建面）
    const mounted = mount(root, merged)
    const repl = rowsOf(root)
    assert.equal(repl.length, 5, "重建径复列：位次轮三行 + 运行期轮两行")
    const carried = repl.filter((row) => atOfRow(row) === 20)
    assert.equal(carried.length, 3, "位次轮行组在册（重建径复列）")
    const labels = carried.map((row) => row._digestRound)

    // 4b 帧刷（真帧路）+ 帧尾态刷显式重跑：在区有行 ⇒ 零建（零复制）∥ 位次轮行组零重标
    const textWrites = []
    const removals = []
    const isRow = (node) => node instanceof FakeNode && node.getAttribute("data-digest") !== null
    const origDesc = Object.getOwnPropertyDescriptor(FakeNode.prototype, "textContent")
    const origRemove = FakeNode.prototype.remove
    FakeNode.prototype.remove = function () { if (isRow(this)) removals.push(this); return origRemove.call(this) }
    Object.defineProperty(FakeNode.prototype, "textContent", {
      get: origDesc.get,
      set(value) { if (isRow(this)) textWrites.push(this); origDesc.set.call(this, value) },
      configurable: true,
    })
    try {
      let next = frame(root, { ...merged, flowOps: [] }, mounted)
      chrome.syncChrome(root, chatModel.chatModel(merged), {})
      next = frame(root, { ...merged, flowOps: [] }, next)
      assert.ok(sameRefs(rowsOf(root), repl), "帧刷复跑：零建（同节点 ∥ 零增——身份面）")
      assert.ok(rowsOf(root).filter((row) => atOfRow(row) === 20).every((row, index) => row._digestRound === labels[index]), "位次轮行组零重标（补建步只读不写）")
      assert.deepEqual(removals, [], "零行摘除")
      assert.deepEqual(textWrites, [], "零文本改写已建行（行出生即定型）")
    } finally {
      FakeNode.prototype.remove = origRemove
      Object.defineProperty(FakeNode.prototype, "textContent", origDesc)
    }

    // 4c 越窗档（window 抬升 ⇒ 位次轮出区）：零建 ∥ 既有行留置（零摘除——出区者零补建）
    const narrow = { ...merged, blocks: merged.blocks.filter((block) => block.at !== 10), flowOps: [] }
    frame(root, narrow, mounted)
    assert.equal(rowsOf(root).length, 5, "出区：零建（既有行留置——零摘除）")
    assert.ok(sameRefs(rowsOf(root), repl), "出区：复列行族同节点零动（身份面）")
  })
})
