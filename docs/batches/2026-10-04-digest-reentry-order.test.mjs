/**
 * 2026-10-04-digest-reentry-order.test.mjs — 批次本地单元件（台账 #910 · digest 回填落位批 · 实施轮）·
 * 任务书 = `docs/batches/2026-10-04-digest-reentry-order.md` §2（设计块 + 修正块 十·①–⑥ —— **以修正块为准**）。
 * 六腿：
 *   1 **记录序对账（核心）**——`applyPage` 回填页 ⇒ 结构作业 = `{ kind: "build" }`（零 `prepend` 作业型）∥
 *      帧出口（作业含 build ⇒ 构造径）后文档序（`[data-block-kind]` + `[data-digest]` 合序）≡ 记录序 = [旧, D20×3, 今, live×2]；
 *      行标 `at` 逐组对；运行期轮 = 流末
 *   2 **同尺对拍**——同 merged 态：「回填帧」输出 ≡「整置（`mountChat`）」输出（逐位同序——回填 = 重建径同一性）
 *   3 **活流回归（负控——恒绿）**——活流轮出生 = 流末（到达序）∥ `cap` ∕ `end` 追加 ∥ 既有行零动（同节点）∥ 归档块随到达入流
 *   4 **零机具负控**——代码痕（射击面 = `thincoder-desktop/renderer/**`）：`reentryBackfill` 零命中 ∥ `prepend` 作业型零命中
 *      （引号 ∥ 花括号 ∥ 注形三面）∥ `data-at` 零命中；导出面：`syncDigest` 在场 ∥ `reentryBackfill` 无残留
 *   5 **幂等 ∕ 换代**——复跑同态 ⇒ 零增零写（同节点）；位次轮换代（新对象同 `at`）⇒ 零重复行
 *   6 **构造帧出口补偿（三例——批档修正块 十·②）**——(a) 收束帧 ∧ 非跟滚 ∧ ΔH > 0 ⇒ 恰两读 ∥ 写 `compensateTop`
 *      （写值 = 算式同式）；**含「仅记录页」形**（零块并入 ∥ 行族复列 ⇒ ΔH > 0 ⇒ 照写——块数漏口封口证）·
 *      (b) 收束帧 ∧ 非跟滚 ∧ ΔH = 0 ⇒ 零补写 · (c) 收束帧 ∧ 跟滚 ⇒ 贴底 ∥ 零补偿 ∥ 零读；
 *      源面锁 = `renderer/app.mjs` 谓词 ∥ 两读 ∥ 算式引调在场（镜像 = 本件 `paint` —— 卡面不入镜）
 * 随批留存 · 不进仓套件（全清令：仓套件不写 ∕ 不改 ∕ 不跑）。
 * 复跑（cwd = 仓库根，即含 `thincoder-core/` 的目录）：node --test docs/batches/2026-10-04-digest-reentry-order.test.mjs
 * 纪律：行为断言优先（真页读体 ∥ 真帧路 ∥ 真构树面）；真机一条 = 父侧闭合（实施后）——本档只落机检面。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（须先于任何 /rc/ 取件注册）

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-core"))) throw new Error(`从仓库根（含 thincoder-core/）运行：cwd = ${ROOT}`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)

const [pageRead, wake, i18n, i18nCore, chat, chatModel, chrome, rowsMod, scrollMod] = await Promise.all([
  mod("thincoder-desktop/renderer/page-read.mjs"), // 页读径（回填并入 ∥ 结构作业）
  mod("thincoder-desktop/renderer/events-wake.mjs"), // `ev:digest` 归约（活流轮三型）
  mod("thincoder-desktop/renderer/i18n.mjs"), // 词面投影（t）
  mod("thincoder-core/i18n.mjs"), // 核字典投影（词面单源）
  mod("thincoder-desktop/renderer/views/chat.mjs"), // 挂载 ∥ 帧尾六步（真路）
  mod("thincoder-desktop/renderer/views/chat-model.mjs"), // 帧模型（窗出口）
  mod("thincoder-desktop/renderer/views/chat-chrome.mjs"), // 帧尾态刷（引调面）
  mod("thincoder-desktop/renderer/views/chat-digest-rows.mjs"), // 行族单档（导出面 ∥ 机具零存面）
  mod("thincoder-desktop/renderer/views/chat-scroll.mjs"), // 补偿算式 ∥ 窗限（单源）
])

// ─── 假 DOM（属性 ∕ 选择器 ∕ 结构 —— 沿 `2026-10-01-desktop-flow-reconcile.test.mjs` 先例）──

class FakeText {
  constructor(value) {
    this.textContent = String(value)
    this.parentNode = null
  }
  get nodeType() { return 3 }
  get ownerDocument() { return globalThis.document }
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
  get ownerDocument() { return globalThis.document }
  get children() { return this.childNodes.filter((node) => node instanceof FakeNode) }
  get firstChild() { return this.childNodes[0] ?? null }
  get lastElementChild() { const list = this.children; return list[list.length - 1] ?? null }
  get nextSibling() {
    if (this.parentNode === null) return null
    const at = this.parentNode.childNodes.indexOf(this)
    return at < 0 ? null : this.parentNode.childNodes[at + 1] ?? null
  }
  get nextElementSibling() {
    let node = this.nextSibling
    while (node !== null && node.nodeType !== 1) node = node.nextSibling
    return node
  }
  get isConnected() {
    for (let node = this; node !== null; node = node.parentNode) if (node.__connected === true) return true
    return false
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
  get classList() {
    const read = () => (this.attrs.class ?? "").split(/\s+/).filter(Boolean)
    const self = this
    return {
      add: (...cs) => { self.attrs.class = [...new Set([...read(), ...cs])].join(" ") },
      remove: (...cs) => { self.attrs.class = read().filter((c) => !cs.includes(c)).join(" ") },
      contains: (c) => read().includes(c),
      toggle: (c, force) => {
        const want = force === undefined ? !read().includes(c) : force === true
        if (want) self.classList.add(c)
        else self.classList.remove(c)
      },
    }
  }
  get dataset() {
    const self = this
    const nameOf = (key) => `data-${String(key).replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`
    return new Proxy({}, {
      get: (_target, key) => (typeof key === "string" ? self.getAttribute(nameOf(key)) : undefined),
      set: (_target, key, value) => { self.setAttribute(nameOf(key), String(value)); return true },
    })
  }
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
  closest(sel) { for (let node = this; node !== null; node = node.parentNode) if (node instanceof FakeNode && select(node, sel)) return node; return null }
  matches(sel) { return select(this, sel) }
}

/** 流根假件（读 / 写两面可排：`clears` = 根清树次数（构造径唯一清点）；`scrollWrites` = `scrollTop` 写入序）。 */
class FlowNode extends FakeNode {
  constructor(tag) {
    super(tag)
    this.clears = 0
    this.scrollWrites = []
  }
  set scrollTop(value) {
    this.scrollWrites.push(value)
    super.scrollTop = value
  }
  get scrollTop() { return super.scrollTop }
  replaceChildren(...nodes) {
    this.clears += 1
    super.replaceChildren(...nodes)
  }
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

// ─── 场景脚手架（真路：页读 ∥ mountChat ∥ settleFrame；`paint` = 帧出口镜像）──

const KEY = "1"
const zh = () => i18n.initDict({ locale: "zh", dict: i18nCore.projectDictionary("zh") })
const MAX = scrollMod.MAX_RENDER_BLOCKS

const baseState = (over = {}) => ({
  activeSession: KEY, blocks: [], digest: {}, stopMark: {}, following: true, pendingNew: 0,
  history: { hasOlder: false, inFlight: false }, pool: {}, ...over,
})
const receipt = (messages, over = {}) => ({ ok: true, messages, hasOlder: false, next: null, meta: {}, flags: null, queue: null, ...over })
const liveRound = (over = {}) => ({ status: "start", n: 2, tier: null, from: null, msg: null, ...over })

const rowsOf = (root) => [...root.querySelectorAll("[data-digest]")]
const blocksOf = (root) => root.childNodes.filter((node) => node instanceof FakeNode && node.getAttribute("data-block-kind") !== null)
const typeOfRow = (row) => ["label", "count", "cap", "end"].find((name) => row.getAttribute(`data-digest-${name}`) !== null) ?? null
const atOfRow = (row) => (typeof row?._digestRound?.at === "number" && Number.isFinite(row._digestRound.at) ? row._digestRound.at : null)
const seqOf = (root) => [...root.querySelectorAll("[data-block-kind],[data-digest]")].map((node) => (node.getAttribute("data-digest") !== null ? "D" : "b"))
const indexIn = (root, node) => root.childNodes.indexOf(node)
/** 同节点判据（**身份面** —— `deepEqual` 只证结构等价，证不了「同节点」）：逐位 `===`。 */
const sameRefs = (list, expected) => list.length === expected.length && list.every((node, index) => node === expected[index])

const makeCtx = () => ({ frame: null, limit: MAX })
/** 帧出口镜像（`renderer/app.mjs` `paintChat` —— 构造 ∥ 结算两径 + 构造帧出口补偿；卡面 ∥ 清账不入镜 —— 异根 ∥ 零高度扰）。
 *  返回 `{ constructed, mounted }`；`ctx` = 帧链（`frame` = 上帧账 · `limit` = 窗限）。 */
const paint = (root, ctx, state, scroll = null, handlers = {}) => {
  const inFlight = state.history?.inFlight === true
  const prev = ctx.frame?.state ?? null
  const added = (state.blocks?.length ?? 0) - (prev?.blocks?.length ?? 0)
  ctx.limit = scrollMod.nextWindow({ limit: ctx.limit, inFlight: prev?.history?.inFlight === true }, inFlight, added)
  const model = chatModel.chatModel(state, ctx.limit)
  const ops = Array.isArray(state.flowOps) ? state.flowOps : []
  const construct = ctx.frame === null || ops.some((op) => op?.kind === "build") || (prev !== null && state.locale !== prev.locale)
  let mounted
  if (construct) {
    // 构造帧出口补偿（回填收束帧）：读门 = 上帧在飞 ∧ 本帧坍落 ∧ 非跟滚；写门 = 高度净增 ΔH ≠ 0（镜像 app.mjs 构造支）。
    const t0 = root !== null && scroll !== null && prev?.history?.inFlight === true && state.history?.inFlight !== true && state.following !== true
      ? scroll.readMetrics() : null
    mounted = chat.mountChat(root, state, handlers, ctx.limit).mounted
    chrome.syncChrome(root, model, handlers)
    if (t0 !== null) {
      const t1 = scroll.readMetrics()
      if (t1.scrollHeight - t0.scrollHeight !== 0) root.scrollTop = scrollMod.compensateTop({ prevTop: t0.scrollTop, prevHeight: t0.scrollHeight, nextHeight: t1.scrollHeight })
    }
  } else {
    mounted = chat.settleFrame(root, model, scroll, handlers, { mounted: ctx.frame.mounted, hidden: ctx.frame.hidden, ops })
  }
  ctx.frame = { state, mounted, hidden: model.hidden }
  return { constructed: construct, mounted }
}
/** 读数源（补偿腿：逐次读值可排 —— t0 ∥ t1）。 */
const scrollQueue = (values) => ({
  reads: 0,
  readMetrics() {
    const value = values[this.reads] ?? values[values.length - 1]
    this.reads += 1
    return { scrollTop: 0, scrollHeight: 0, clientHeight: 0, ...value }
  },
})
const freshRoot = () => { const root = new FlowNode("div"); root.__connected = true; return root }

/** 回填场景（腿 1 ∕ 2 ∕ 5 共用）：mount [今(at 90) + 运行期轮] ⇒ `applyPage` 回填页 [旧(10) + digest 20/22]。 */
const backfillScene = () => {
  const live = liveRound({ n: 2 })
  const seeded = baseState({ blocks: [{ kind: "assistant", text: "今", at: 90, id: "n0" }], digest: { [KEY]: [live] } })
  const merged = pageRead.applyPage(seeded, receipt([
    { kind: "assistant", text: "旧", idx: 10 },
    { kind: "digest", status: "start", n: 1, tier: null, idx: 20 },
    { kind: "digest", status: "end", ok: true, ms: 500, idx: 22 },
  ], { hasOlder: true, next: 5 }), { key: KEY, before: 9 })
  return { live, seeded, merged }
}
/** 在飞帧态（`beginBackfill` 落态：在飞置位——收束帧身份的上半；零作业）。 */
const inFlightState = (state) => ({ ...state, history: { hasOlder: true, inFlight: true, page: 5 }, flowOps: [] })

// ─── 腿 1：记录序对账（核心）────────────────────────────────

test("腿 1·记录序对账：回填 ⇒ 结构作业 = build（零 prepend 作业型）⇒ 构造径整置 ⇒ 文档序 ≡ 记录序", async () => {
  const { seeded, merged } = backfillScene()
  // 1a 纯件：结构作业 = [{ kind: "build" }]（整置 —— 零 prepend）
  assert.deepEqual(merged.flowOps, [{ kind: "build" }], "回填径结构作业 = build（整置——零 prepend 作业型）")
  assert.deepEqual(merged.blocks.map((block) => block.text), ["旧", "今"], "块序 = 记录序（页块并入——旧居首）")
  assert.deepEqual(merged.digest[KEY].map((round) => round.at ?? null), [20, null], "并入：折叠轮居前 ∥ 运行期轮随后")

  await withFakeDom(async () => {
    zh()
    const root = freshRoot()
    const ctx = makeCtx()
    // 1b 帧出口（镜像 `paintChat`：作业含 build ⇒ 构造径）——文档序 ≡ 记录序
    const first = paint(root, ctx, seeded)
    assert.equal(first.constructed, true, "首帧 = 构造径（无账）")
    const seal = paint(root, ctx, merged)
    assert.equal(seal.constructed, true, "回填帧：作业含 build ⇒ 构造径（整置）")
    assert.deepEqual(seqOf(root), ["b", "D", "D", "D", "b", "D", "D"], "文档序 ≡ 记录序 = [旧, D20×3, 今, live×2]（位次轮行于其记录位次 ∥ 运行期轮 = 流末）")
    const rows = rowsOf(root)
    assert.equal(rows.length, 5, "行族全量（位次轮三行 + 运行期轮两行）")
    assert.deepEqual(rows.slice(0, 3).map(typeOfRow), ["label", "count", "end"], "位次轮行组行序（族内：标签 → 计数 → 终态）")
    assert.ok(rows.slice(0, 3).every((row) => atOfRow(row) === 20), "位次轮行标 = 记录位次 20（记录位次原位——非流末）")
    assert.ok(rows.slice(3).every((row) => row._digestRound === merged.digest[KEY][1]), "运行期轮行标 = 运行期轮对象（流末两组归属）")
    assert.ok(indexIn(root, rows[0]) > indexIn(root, blocksOf(root)[0]), "位次轮行组居旧(10)之后")
    assert.ok(indexIn(root, rows[0]) < indexIn(root, blocksOf(root)[1]), "位次轮行组居今(90)之前（记录位次）")
  })
})

// ─── 腿 2：同尺对拍 ────────────────────────────────────────

test("腿 2·同尺对拍：同 merged 态「回填帧」输出 ≡「整置（mountChat）」输出（逐位同序）", async () => {
  await withFakeDom(async () => {
    zh()
    const { seeded, merged } = backfillScene()
    const rootA = freshRoot()
    const ctx = makeCtx()
    paint(rootA, ctx, seeded)
    paint(rootA, ctx, merged) // 回填帧（真帧路镜像）
    const rootB = freshRoot()
    chat.mountChat(rootB, merged, {}, ctx.limit)
    chrome.syncChrome(rootB, chatModel.chatModel(merged, ctx.limit), {})
    assert.deepEqual(seqOf(rootA), seqOf(rootB), "回填帧输出 ≡ 整置输出（逐位同序——回填 = 重建径同一性）")
    const [rowsA, rowsB] = [rowsOf(rootA), rowsOf(rootB)]
    assert.equal(rowsA.length, rowsB.length, "行族数同")
    assert.deepEqual(rowsA.map(typeOfRow), rowsB.map(typeOfRow), "行族行型逐位同序")
    assert.deepEqual(rowsA.map(atOfRow), rowsB.map(atOfRow), "行族行标逐位同（记录位次）")
  })
})

// ─── 腿 3：活流回归（负控——恒绿）───────────────────────────

test("腿 3·活流回归（负控——恒绿）：活流轮出生 = 流末（到达序）∥ cap ∕ end 追加 ∥ 既有行零动 ∥ 归档块随到达入流", async () => {
  await withFakeDom(async () => {
    zh()
    const root = freshRoot()
    const ctx = makeCtx()
    const blockA = { kind: "assistant", text: "甲", id: "a0" }
    let state = baseState({ blocks: [blockA] })
    paint(root, ctx, state) // 首帧（构造径）
    const nodeA = blocksOf(root)[0]

    // 3a 起跑：行族出生 = 当刻流末（到达序）
    state = wake.onDigest(state, { key: KEY, status: "start", n: 2 })
    paint(root, ctx, state)
    const born = rowsOf(root)
    assert.equal(born.length, 2, "起跑：标签行 + 计数行（两行）")
    assert.deepEqual(born.map(typeOfRow), ["label", "count"], "行序 = 标签 → 计数")
    assert.ok(born.every((row) => row._digestRound === state.digest[KEY][0]), "行标 = 本轮（帧层记账）")
    assert.ok(indexIn(root, born[0]) > indexIn(root, nodeA), "行族居流末（既有块之后——到达序）")

    // 3b cap ∕ end 追加（到达序；既有行零动）
    state = wake.onDigest(state, { key: KEY, status: "cap", mode: "auto" })
    paint(root, ctx, state)
    const withCap = rowsOf(root)
    assert.equal(withCap.length, 3, "cap 行追加")
    assert.equal(typeOfRow(withCap[2]), "cap", "cap 行居尾")
    assert.ok(sameRefs(withCap.slice(0, 2), born), "cap 帧：既有行零动（同节点）")
    state = wake.onDigest(state, { key: KEY, status: "end", ok: true, ms: 900 })
    paint(root, ctx, state)
    const ended = rowsOf(root)
    assert.equal(ended.length, 4, "终态行追加")
    assert.equal(typeOfRow(ended[3]), "end", "终态行居尾（零就地换文）")
    assert.ok(sameRefs(ended.slice(0, 3), withCap), "end 帧：既有行零动（同节点）")
    assert.equal(blocksOf(root)[0], nodeA, "既有块节点同对象（零重建）")

    // 3c 归档块随到达入流（行族之后 —— 到达序）
    const sub = { kind: "subagent", meta: { key: "sub:coder#1", label: "coder#1", role: "eng-coder", id: 1, status: "done", frozen: true, startedAt: 1, doneAt: 2 }, rows: [{ kind: "text", text: "报告行" }] }
    state = { ...state, blocks: [...state.blocks, sub] }
    paint(root, ctx, state)
    assert.deepEqual(blocksOf(root).map((node) => node.getAttribute("data-block-kind")), ["assistant", "subagent"], "归档块到达入流（块序尾）")
    assert.ok(indexIn(root, blocksOf(root)[1]) > indexIn(root, ended[3]), "归档块居行族之后（到达序）")
    assert.ok(sameRefs(rowsOf(root), ended), "归档块到达：行族零动（同节点）")
    assert.equal(blocksOf(root)[0], nodeA, "既有块节点零动（同对象）")
  })
})

// ─── 腿 4：零机具负控 ──────────────────────────────────────

test("腿 4·零机具负控：代码痕零命中（reentryBackfill ∥ prepend 作业型 ∥ data-at）+ 导出面", () => {
  const dir = join(ROOT, "thincoder-desktop/renderer")
  const walk = (rel) => {
    const out = []
    for (const entry of readdirSync(join(dir, rel), { withFileTypes: true })) {
      const path = rel === "" ? entry.name : `${rel}/${entry.name}`
      if (entry.isDirectory()) out.push(...walk(path))
      else out.push(path)
    }
    return out
  }
  const hits = []
  for (const file of walk("").filter((name) => name.endsWith(".mjs"))) {
    readFileSync(join(dir, file), "utf8").split("\n").forEach((line, index) => {
      if (line.includes("reentryBackfill")) hits.push(`${file}:${index + 1} [reentryBackfill]`)
      if (line.includes('"prepend"')) hits.push(`${file}:${index + 1} [prepend-job]`)
      if (line.includes("prepend{count}") || line.includes("`prepend`")) hits.push(`${file}:${index + 1} [prepend-doc]`)
      if (line.includes("data-at")) hits.push(`${file}:${index + 1} [data-at]`)
    })
  }
  assert.deepEqual(hits, [], "零机具：reentryBackfill ∥ prepend 作业型（三形） ∥ data-at 零命中")
  assert.equal("reentryBackfill" in rowsMod, false, "导出面：reentryBackfill 无残留")
  assert.equal(typeof rowsMod.syncDigest, "function", "导出面：syncDigest 在场")
  assert.equal(typeof pageRead.applyPage, "function", "导出面：applyPage 在场")
})

// ─── 腿 5：幂等 ∕ 换代 ─────────────────────────────────────

test("腿 5·幂等 ∕ 换代：复跑同态 ⇒ 零增零写（同节点）∥ 位次轮换代（新对象同 at）⇒ 零重复行", async () => {
  await withFakeDom(async () => {
    zh()
    const root = freshRoot()
    const ctx = makeCtx()
    const { seeded, merged } = backfillScene()
    paint(root, ctx, seeded)
    paint(root, ctx, merged) // 回填帧（构造径）
    const rebuilt = rowsOf(root)
    const blocksAfter = blocksOf(root)

    // 5a 复跑同态（作业已清）⇒ 零增零写（同节点）
    const again = paint(root, ctx, { ...merged, flowOps: [] })
    assert.equal(again.constructed, false, "复跑：走结算径（作业已清）")
    assert.ok(sameRefs(rowsOf(root), rebuilt), "复跑：行族零增零写（同节点——身份面）")
    assert.ok(sameRefs(blocksOf(root), blocksAfter), "复跑：块族零动（同节点）")
    assert.equal(root.clears, 2, "整场清树恰两次（首帧 + 回填帧——复跑零清）")

    // 5b 位次轮换代（新对象同 `at`）⇒ 零重复行
    const rotated = { ...merged.digest[KEY][0] }
    assert.notEqual(rotated, merged.digest[KEY][0], "换代 = 新对象（引用断）")
    assert.equal(rotated.at, 20, "同轮位次不变")
    const rotatedState = { ...merged, flowOps: [], digest: { [KEY]: [rotated, merged.digest[KEY][1]] } }
    paint(root, ctx, rotatedState)
    assert.equal(rowsOf(root).length, rebuilt.length, "换代后复跑：行数零增（零重复行）")
    assert.ok(sameRefs(rowsOf(root), rebuilt), "换代后复跑：同节点零动（身份面）")
  })
})

// ─── 腿 6：构造帧出口补偿（三例 + 源面锁）───────────────────

test("腿 6·构造帧出口补偿：收束帧 ∧ 非跟滚 ∧ ΔH ≠ 0 ⇒ 恰两读 ∥ 写算式同式（含「仅记录页」封口证）∥ ΔH = 0 ⇒ 零补写 ∥ 跟滚 ⇒ 贴底 ∥ 零读", async () => {
  const { seeded, merged } = backfillScene()

  // 6a 收束帧 ∧ 非跟滚 ∧ ΔH > 0 ⇒ 恰两读 ∥ 写 compensateTop（写值 = 算式同式）
  await withFakeDom(async () => {
    zh()
    const root = freshRoot()
    root.scrollHeight = 3000; root.clientHeight = 200; root._scrollTop = 400
    const sc = scrollQueue([
      { scrollTop: 400, scrollHeight: 2000, clientHeight: 200 }, // t0
      { scrollTop: 410, scrollHeight: 2064, clientHeight: 200 }, // t1
    ])
    const ctx = makeCtx()
    paint(root, ctx, { ...seeded, following: false }, sc) // 首帧（构造径——根快照复填写面在场）
    paint(root, ctx, inFlightState({ ...seeded, following: false }), sc) // 在飞帧（零读零写）
    sc.reads = 0
    root.scrollWrites.length = 0
    const sealed = paint(root, ctx, { ...merged, following: false }, sc) // 收束帧（回填页并入）
    assert.equal(sealed.constructed, true, "收束帧：构造径（回填 = 整置）")
    assert.equal(sc.reads, 2, "收束帧：恰两读（t0 ∥ t1）")
    assert.deepEqual(
      root.scrollWrites,
      [400, scrollMod.compensateTop({ prevTop: 400, prevHeight: 2000, nextHeight: 2064 })],
      "写值 = 算式同式（首写 = 根快照复填——mountChat 既有；补偿 = 末写）",
    )
  })

  // 6a-bis「仅记录页」：零块并入 ∥ 行族复列 ⇒ ΔH > 0 ⇒ 照写（块数漏口封口证）
  await withFakeDom(async () => {
    zh()
    const root = freshRoot()
    root.scrollHeight = 3000; root.clientHeight = 200; root._scrollTop = 300
    const sc = scrollQueue([
      { scrollTop: 300, scrollHeight: 2000, clientHeight: 200 }, // t0
      { scrollTop: 310, scrollHeight: 2050, clientHeight: 200 }, // t1
    ])
    const ctx = makeCtx()
    const live = liveRound({ n: 2 })
    const only = baseState({ blocks: [{ kind: "assistant", text: "今", id: "n1" }], digest: { [KEY]: [live] } }) // 块零位次 ⇒ 下界未知 ⇒ 折叠轮全数在区
    paint(root, ctx, { ...only, following: false }, sc)
    const begin = inFlightState({ ...only, following: false })
    paint(root, ctx, begin, sc)
    const mergedOnly = pageRead.applyPage(begin, receipt([
      { kind: "digest", status: "start", n: 1, tier: null, idx: 20 },
      { kind: "digest", status: "end", ok: true, ms: 500, idx: 22 },
    ], { hasOlder: true, next: 5 }), { key: KEY, before: 9 })
    assert.equal(mergedOnly.blocks.length, only.blocks.length, "仅记录页：零块并入（added = 0）")
    const limitBefore = ctx.limit
    sc.reads = 0
    root.scrollWrites.length = 0
    paint(root, ctx, { ...mergedOnly, following: false }, sc)
    assert.equal(ctx.limit, limitBefore, "仅记录页：窗限零增（块数并入 = 0 —— 块数断漏口面在场）")
    assert.equal(sc.reads, 2, "仅记录页：恰两读（读数裁剪不破）")
    assert.deepEqual(root.scrollWrites, [300, scrollMod.compensateTop({ prevTop: 300, prevHeight: 2000, nextHeight: 2050 })], "零块并入 ∧ ΔH > 0 ⇒ 照写（封口证：块数断不达）")
    assert.equal(rowsOf(root).length, 5, "行族复列在场（位次轮三行 + 运行期轮两行——高度净增来源）")
  })

  // 6b 收束帧 ∧ 非跟滚 ∧ ΔH = 0 ⇒ 零补写
  await withFakeDom(async () => {
    zh()
    const root = freshRoot()
    root.scrollHeight = 3000; root.clientHeight = 200; root._scrollTop = 400
    const sc = scrollQueue([
      { scrollTop: 400, scrollHeight: 2000, clientHeight: 200 }, // t0
      { scrollTop: 400, scrollHeight: 2000, clientHeight: 200 }, // t1（ΔH = 0）
    ])
    const ctx = makeCtx()
    paint(root, ctx, { ...seeded, following: false }, sc)
    paint(root, ctx, inFlightState({ ...seeded, following: false }), sc)
    sc.reads = 0
    root.scrollWrites.length = 0
    paint(root, ctx, { ...merged, following: false }, sc)
    assert.equal(sc.reads, 2, "ΔH = 0：两读数在场（读门不变）")
    assert.deepEqual(root.scrollWrites, [400], "ΔH = 0：零补写（唯根快照复填——写门 = 高度净增 ΔH ≠ 0）")
  })

  // 6c 收束帧 ∧ 跟滚 ⇒ 贴底 ∥ 零补偿 ∥ 零读
  await withFakeDom(async () => {
    zh()
    const root = freshRoot()
    root.scrollHeight = 3000; root.clientHeight = 200; root._scrollTop = 400
    const sc = scrollQueue([{ scrollTop: 400, scrollHeight: 2000, clientHeight: 200 }])
    const ctx = makeCtx()
    paint(root, ctx, { ...seeded, following: false }, sc) // 前史：非跟滚（根快照位稳——零贴底写）
    paint(root, ctx, inFlightState({ ...seeded, following: false }), sc)
    sc.reads = 0
    root.scrollWrites.length = 0
    paint(root, ctx, merged, sc) // 收束帧 ∧ 跟滚（正滚动）
    assert.equal(sc.reads, 0, "跟滚：零读（读数裁剪不破）")
    assert.deepEqual(root.scrollWrites, [400, Number.MAX_SAFE_INTEGER], "跟滚：根快照复填 + 贴底覆盖（mountChat 承接）；零补偿")
  })

  // 源面锁（镜面对位：`renderer/app.mjs` 构造支谓词 ∥ 两读 ∥ 算式引调在场）
  const appSrc = readFileSync(join(ROOT, "thincoder-desktop/renderer/app.mjs"), "utf8")
  assert.ok(appSrc.includes("prev?.history?.inFlight === true"), "谓词：上帧在飞")
  assert.ok(appSrc.includes("state.history?.inFlight !== true"), "谓词：本帧坍落")
  assert.ok(appSrc.includes("state.following !== true"), "谓词：非跟滚")
  assert.equal(appSrc.split("chatScroll.readMetrics()").length - 1, 2, "恰两读（t0 ∥ t1——源面计数）")
  assert.ok(appSrc.includes("compensateTop("), "算式引调在场（单源 = views/chat-scroll.mjs）")
})