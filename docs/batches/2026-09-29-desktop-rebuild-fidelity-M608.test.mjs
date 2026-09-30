/**
 * 2026-09-29-desktop-rebuild-fidelity-M608.test.mjs — 批次本地机检件 · 波 4（#608 留端未接族 + 效果执行等价）。
 * 覆盖（判据单源 = 批档 `docs/batches/2026-09-29-desktop-rebuild-fidelity.md` §2.6；说明行旗标语义沿父裁 A
 * 2026-09-29 = 盘上 #630 现态）：
 *   M-608a 效果执行等价对拍（平 node）：同 reducer 输出 ⇒ 桌面派生动作集 ≡ 核 effects 语义集——逐迁
 *          born ∕ takeover（含 awaiting 旧代先归档）∕ fold（+archive）∕ awaiting ∕ archive（驻留回收）∕ remove
 *          + 终态补桩 + 控制臂（零迁）+ 反证自检（比较器非空过）。**投影射程** = 条目类 ∕ 归档代计数 ∕ 触碰
 *          （`atBoundary` ∕ `clearAwaiting` ∕ `kind` 不入投影——端面动作由模型态幂等派生、核 effects 表不逐
 *          条执行，单源 = `subagent-reduce.mjs` 档注）；含 `error` 表外码边界（零写——有意收窄）。
 *   M-608b 说明行两例（假 DOM）：① 首出生 ⇒ `.sub-desc` 恰一（插入点 = 块元素内 `.advisor-content` 之前）；
 *          ② 首块移除（queued 取消 ⇒ 零块帧弃账）后再出生 ⇒ **不再插**（零重插；旧族 DOM 探针此处必重插 ⇒ 本测
 *          判别力）+ 语义钉（跨会话零重插 ∕ 新 root 归零 —— 沿 #630 KD-EC-4 面板级同判）。
 *   M-608c 文档面句收正（#608①–③）：核两档档头留端句在位（痕迹给由 ∕ 端复位面）∧ 旧形零残留。
 * 跑法（自仓库根）：`node --test .thincoder/tmp/2026-09-29-desktop-rebuild-fidelity-M608.test.mjs`
 * （两层深 ⇒ 与终位 `docs/batches/` 同深；读数走 stderr —— 沿本机运行器面先例；`/rc/` 解析钩子在档内静态预载。）
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（须先于任何 /rc/ 取件注册）

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const at = (p) => pathToFileURL(join(REPO, p)).href
const readRepo = (p) => readFileSync(join(REPO, p), "utf8")
const req = createRequire(join(REPO, "thincoder-desktop/package.json"))
const coreAt = (p) => pathToFileURL(req.resolve("@thincoder/core/" + p)).href
const out = (label, value) => process.stderr.write(`[读数] ${label}: ${value}\n`) // 读数走 stderr（运行器 stdout 帧竞争先例）

// ─── mini 假 DOM（值面 ∕ 选择器面 ∕ 结构面 —— 沿 enddiff-clearance 件先例；补 classList.toggle）──────────
class FakeText {
  constructor(value) { this.textContent = String(value) }
}
class FakeNode {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase()
    this.attrs = {}
    this.dataset = {}
    this.children = []
    this.listeners = []
    this.textContent = ""
    this.parent = null
    this.open = false
    this.isConnected = true
    this.scrollTop = 0
    this.scrollHeight = 0
    this.clientHeight = 0
    this._classes = new Set()
    this.classList = {
      add: (...cs) => { for (const c of cs) this._classes.add(c) },
      remove: (...cs) => { for (const c of cs) this._classes.delete(c) },
      contains: (c) => this._classes.has(c),
      toggle: (c, force) => { const want = force === undefined ? !this._classes.has(c) : force === true; if (want) this._classes.add(c); else this._classes.delete(c) },
    }
  }
  set className(value) { this._classes = new Set(String(value).split(/\s+/).filter(Boolean)) }
  get className() { return [...this._classes].join(" ") }
  setAttribute(k, v) {
    const s = String(v)
    this.attrs[k] = s
    if (k === "class") this.className = s
    else if (k.startsWith("data-")) this.dataset[camelOf(k.slice(5))] = s
  }
  getAttribute(k) {
    if (k.startsWith("data-")) {
      const v = this.dataset[camelOf(k.slice(5))]
      if (v !== undefined) return String(v)
    }
    return this.attrs[k] ?? null
  }
  removeAttribute(k) { delete this.attrs[k] }
  addEventListener(type, fn, options) { this.listeners.push({ type, fn, options }) }
  removeEventListener(type, fn) { this.listeners = this.listeners.filter((l) => !(l.type === type && l.fn === fn)) }
  appendChild(node) {
    const child = node instanceof FakeNode ? node : new FakeText(node)
    child.parent = this
    this.children.push(child)
    this.bump()
    return child
  }
  append(...nodes) { for (const n of nodes) this.appendChild(n) }
  prepend(...nodes) { for (const n of [...nodes].reverse()) { this.children.unshift(n); n.parent = this; this.bump() } }
  insertBefore(node, anchor) {
    const at2 = anchor == null ? -1 : this.children.indexOf(anchor)
    if (at2 < 0) this.children.push(node); else this.children.splice(at2, 0, node)
    node.parent = this
    this.bump()
    return node
  }
  get childNodes() { return [...this.children] }
  get firstChild() { return this.children[0] ?? null }
  get lastElementChild() { return [...this.children].reverse().find((c) => c instanceof FakeNode) ?? null }
  get firstElementChild() { return this.children.find((c) => c instanceof FakeNode) ?? null }
  get nextSibling() {
    if (!this.parent) return null
    const at2 = this.parent.children.indexOf(this)
    return at2 < 0 ? null : this.parent.children[at2 + 1] ?? null
  }
  replaceChildren(...nodes) { for (const c of this.children) c.parent = null; this.children = []; for (const n of nodes) this.appendChild(n) }
  remove() { if (this.parent) { const at2 = this.parent.children.indexOf(this); if (at2 >= 0) this.parent.children.splice(at2, 1); this.parent.bump() } }
  replaceWith(next) {
    const p = this.parent
    if (!p) return
    const at2 = p.children.indexOf(this)
    if (at2 >= 0) p.children[at2] = next
    next.parent = p
    p.bump()
  }
  querySelector(sel) { let hit = null; this.walk((n) => { if (hit === null && matches(n, sel)) hit = n }); return hit }
  querySelectorAll(sel) { const list = []; this.walk((n) => { if (matches(n, sel)) list.push(n) }); return list }
  closest(sel) { for (let n = this; n != null; n = n.parent ?? null) if (n instanceof FakeNode && matches(n, sel)) return n; return null }
  walk(fn) { for (const c of this.children) { if (c instanceof FakeNode) { fn(c); c.walk(fn) } } }
  set innerHTML(value) { this._html = String(value) }
  get innerHTML() { return this._html ?? "" }
  focus() {}
  bump() { this.textContent = this.children.map((c) => c.textContent ?? "").join("") }
}
function camelOf(name) { return name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase()) }
function matches(node, sel) {
  if (sel.startsWith(".")) return node.classList.contains(sel.slice(1))
  if (/^[a-zA-Z][\w-]*$/.test(sel)) return node.tagName === sel.toUpperCase()
  const m = /^\[([^=\]]+)(?:="([^"]*)")?\]$/.exec(sel)
  if (m === null) return false
  const value = m[1].startsWith("data-") ? node.dataset[camelOf(m[1].slice(5))] : node.attrs[m[1]]
  if (value === undefined) return false
  return m[2] === undefined || String(value) === m[2]
}
const docBody = new FakeNode("body")
globalThis.Node = FakeNode
globalThis.document = {
  createElement: (tag) => new FakeNode(tag),
  createTextNode: (value) => new FakeText(value),
  body: docBody,
  getElementById() { return null },
  querySelector() { return null },
}
globalThis.window = {}

// ─── 词典装配（核件取词经注册端出 —— 沿 subblock 件先例）────────────────────────────────
const { initDict, setStringsSink } = await import(at("thincoder-desktop/renderer/i18n.mjs"))
const { setStrings } = await import(at("thincoder-render-core/i18n.mjs"))
const { projectDictionary } = await import(coreAt("i18n.mjs"))
setStringsSink(setStrings)
initDict({ locale: "en", dict: projectDictionary("en") })

const { subBlocksReduce } = await import(at("thincoder-render-core/subblocks/state.mjs"))
const { onSubagent } = await import(at("thincoder-desktop/renderer/subagent-reduce.mjs"))
const { mountPool } = await import(at("thincoder-desktop/renderer/views/activity.mjs"))

// ─── M-608a · 效果执行等价对拍（平 node；零 DOM 面）──────────────────────────────────────

const SESSION = "1"
const mkBlock = (over = {}) => ({
  key: "sub:probe#1", label: "probe#1", role: "probe", id: 1, status: "running",
  frozen: false, awaitingDigest: false, rows: [], ...over,
})
const patchOf = (status, over = {}) => ({ status, role: "probe", id: 1, ...over })

/** 核 effects → 形签名（`type:key` 序）——逐迁表列。 */
const signature = (effects) => effects.map((e) => `${e.type}:${e.key}`)

/** 核 effects → 期望桌面事实（解释器：核效果语义的桌面可观测投影 —— 条目类 ∕ 归档代计数 ∕ 触碰）。 */
const expectedFacts = (effects) => {
  const map = new Map()
  for (const e of effects) {
    const f = map.get(e.key) ?? { entry: "absent", archived: 0, changed: false }
    f.changed = true
    if (e.type === "born" || e.type === "takeover") f.entry = "live"
    else if (e.type === "fold") f.entry = "frozen"
    else if (e.type === "awaiting") f.entry = "awaiting"
    else if (e.type === "archive") { f.entry = "tombstone"; f.archived += 1 }
    else if (e.type === "remove") f.entry = "absent"
    map.set(e.key, f)
  }
  return map
}

/** 桌面派生事实（模型前后 + 入流快照 → 可观测动作）：条目类 ∕ 归档代计数。 */
const derivedFacts = (before, afterList, flowBlocks) => {
  const map = new Map()
  const beforeMap = new Map(before.map((b) => [b.key, b]))
  const afterMap = new Map(afterList.map((b) => [b.key, b]))
  for (const [key, block] of afterMap) {
    if (beforeMap.get(key) === block) continue
    const f = { entry: "live", archived: 0, changed: true }
    if (block?.region === "flow") f.entry = "tombstone"
    else if (block?.frozen === true) f.entry = block?.awaitingDigest === true ? "awaiting" : "frozen"
    map.set(key, f)
  }
  for (const key of beforeMap.keys()) if (!afterMap.has(key)) map.set(key, { entry: "absent", archived: 0, changed: true })
  for (const snapshot of flowBlocks) {
    const key = snapshot?.meta?.key
    if (typeof key !== "string") continue
    const f = map.get(key) ?? { entry: "absent", archived: 0, changed: true }
    f.archived += 1
    map.set(key, f)
  }
  return map
}

const factsEqual = (a, b) => {
  const keys = [...new Set([...a.keys(), ...b.keys()])].sort()
  for (const key of keys) {
    const x = a.get(key) ?? null
    const y = b.get(key) ?? null
    if (JSON.stringify(x) !== JSON.stringify(y)) return false
  }
  return true
}

const factsRow = (entries) => new Map(Object.entries(entries))

/** 对拍一轮（同输入同刻，同一基准块对象 —— 触碰判据读同一引用源）：核 effects ∕ 桌面派生事实。 */
const runPair = (before, p) => {
  const coreList = structuredClone(before)
  const { effects } = subBlocksReduce(coreList, p, { now: () => 1000 })
  const deskBefore = structuredClone(before)
  const state0 = {
    activeSession: SESSION,
    subBlocks: { [SESSION]: deskBefore },
    pool: { running: deskBefore.length, approval: 0, queue: [], approvals: [] },
    blocks: [], following: true,
  }
  const state1 = onSubagent(state0, { key: SESSION, ...p }, 1000)
  return { effects, before: deskBefore, afterList: state1.subBlocks?.[SESSION] ?? [], flow: state1.blocks ?? [] }
}

/** 对拍断言：核签名 = 手写行 ∧ 桌面事实 ≡ 核 effects 语义 ∧ 桌面事实 = 手写行。 */
const assertPair = (label, rowSpec) => {
  const { effects, before, afterList, flow } = runPair(rowSpec.before, rowSpec.patch)
  assert.deepEqual(signature(effects), rowSpec.effects, `${label}：核 effects 签名`)
  const expected = expectedFacts(effects)
  const actual = derivedFacts(before, afterList, flow)
  assert.ok(factsEqual(actual, expected), `${label}：桌面派生事实 ≡ 核 effects 语义（actual=${JSON.stringify([...actual])} expected=${JSON.stringify([...expected])}）`)
  assert.ok(factsEqual(actual, rowSpec.facts), `${label}：桌面派生事实 = 逐迁表行（actual=${JSON.stringify([...actual])}）`)
  out(`M-608a ${label}`, `effects=[${signature(effects).join(",")}] · facts=${JSON.stringify([...actual])}`)
  return { effects, actual }
}

test("M-608a · 效果执行等价对拍：同 reducer 输出 ⇒ 桌面派生动作集 ≡ 核 effects 语义集（逐迁 born ∕ takeover ∕ fold ∕ awaiting ∕ archive ∕ remove）", () => {
  const KEY = "sub:probe#1"

  // ① born（queued 出生 = 出生事件）
  assertPair("born·queued", {
    before: [],
    patch: patchOf("queued", { pool: true, position: 1 }),
    effects: [`born:${KEY}`, `refresh:${KEY}`],
    facts: factsRow({ [KEY]: { entry: "live", archived: 0, changed: true } }),
  })
  // ② born（started 出生）
  assertPair("born·started", {
    before: [],
    patch: patchOf("started", { pool: true }),
    effects: [`born:${KEY}`, `refresh:${KEY}`],
    facts: factsRow({ [KEY]: { entry: "live", archived: 0, changed: true } }),
  })
  // ③ takeover（已归档旧代（frozen + region=flow）⇒ 新代建块改绑；旧代不重复归档）
  assertPair("takeover·已归档旧代", {
    before: [mkBlock({ frozen: true, status: "done", region: "flow" })],
    patch: patchOf("started", { pool: true }),
    effects: [`takeover:${KEY}`, `refresh:${KEY}`],
    facts: factsRow({ [KEY]: { entry: "live", archived: 0, changed: true } }),
  })
  // ④ takeover·awaiting 旧代（先归档后改绑 —— 核效果序同）
  assertPair("takeover·awaiting 旧代", {
    before: [mkBlock({ frozen: true, status: "settled", awaitingDigest: true })],
    patch: patchOf("started", { pool: true }),
    effects: [`archive:${KEY}`, `takeover:${KEY}`, `refresh:${KEY}`],
    facts: factsRow({ [KEY]: { entry: "live", archived: 1, changed: true } }),
  })
  // ⑤ fold + archive（live 收终态 ⇒ 折叠 + 即时归档入流）
  assertPair("fold+archive·done", {
    before: [mkBlock()],
    patch: patchOf("done"),
    effects: [`fold:${KEY}`, `archive:${KEY}`],
    facts: factsRow({ [KEY]: { entry: "tombstone", archived: 1, changed: true } }),
  })
  // ⑥ fold + awaiting（settled 驻留待消化）
  assertPair("fold+awaiting·settled", {
    before: [mkBlock()],
    patch: patchOf("settled"),
    effects: [`fold:${KEY}`, `awaiting:${KEY}`],
    facts: factsRow({ [KEY]: { entry: "awaiting", archived: 0, changed: true } }),
  })
  // ⑦ archive（驻留块消化回收 —— 归档即入流）
  assertPair("archive·驻留回收", {
    before: [mkBlock({ frozen: true, status: "settled", awaitingDigest: true })],
    patch: patchOf("done"),
    effects: [`archive:${KEY}`],
    facts: factsRow({ [KEY]: { entry: "tombstone", archived: 1, changed: true } }),
  })
  // ⑧ remove（queued 取消 —— 从未启动，不冻结）
  assertPair("remove·queued 取消", {
    before: [mkBlock({ status: "queued", queued: true })],
    patch: patchOf("cancelled", { was: "queued" }),
    effects: [`remove:${KEY}`],
    facts: factsRow({ [KEY]: { entry: "absent", archived: 0, changed: true } }),
  })
  // ⑨ 终态补桩（never-born done ⇒ born + fold + archive 复合 —— 「终态必现」防御）
  assertPair("stub·never-born done", {
    before: [],
    patch: patchOf("done", { id: 9 }),
    effects: ["born:sub:probe#9", "fold:sub:probe#9", "archive:sub:probe#9"],
    facts: factsRow({ "sub:probe#9": { entry: "tombstone", archived: 1, changed: true } }),
  })
  // ⑨b 边界·有意收窄：`error` = 桌面表外码（核 relay 谱无错误 token —— 单源 RENDER-CORE §5；错误径
  //     归宿 = `⟦ev⟧stopped` / `⟦ev⟧done`）⇒ 桌面零写（禁假造；本表其余逐迁皆在准入谱内）。
  {
    const state0 = {
      activeSession: SESSION,
      subBlocks: { [SESSION]: [mkBlock()] },
      pool: { running: 1, approval: 0, queue: [], approvals: [] },
      blocks: [], following: true,
    }
    const state1 = onSubagent(state0, { key: SESSION, ...patchOf("error", { id: 1 }) }, 1000)
    assert.equal(state1, state0, "error 表外码 ⇒ 桌面零写（原引用）")
    out("M-608a 边界", "error 表外码 ⇒ 零写（有意收窄——核 relay 谱无错误 token）")
  }
  // ⑩ 控制臂（非 queued 块收 queued 取消 ⇒ 零迁 ∧ 零派生 —— 零写）
  const zero = assertPair("控制臂·零迁", {
    before: [mkBlock()],
    patch: patchOf("cancelled", { was: "queued" }),
    effects: [],
    facts: factsRow({}),
  })
  assert.equal(zero.actual.size, 0, "控制臂：桌面零派生（零写）")

  // ⑪ 反证自检：比较器非空过（篡改一条事实 ⇒ 必判异）
  const truth = factsRow({ [KEY]: { entry: "tombstone", archived: 1, changed: true } })
  const corrupted = factsRow({ [KEY]: { entry: "frozen", archived: 1, changed: true } })
  assert.ok(factsEqual(truth, truth) === true, "反证自检：真值自反")
  assert.ok(factsEqual(corrupted, truth) === false, "反证自检：篡改必判异（比较器非空过）")
})

// ─── M-608b · 说明行两例（假 DOM 径）────────────────────────────────────────────────────

const row = (text) => ({ kind: "text", text })
const entry = (id, extra = {}) => ({
  key: `sub:probe#${id}`, label: `probe#${id}`, role: "probe", id, rows: [row("a")],
  frozen: false, status: "queued", queued: true, ...extra,
})
const poolStateOf = (blocks, session = "1") => ({
  activeSession: session,
  pool: { running: blocks.length, approval: 0, queue: [], approvals: [] },
  subBlocks: { [session]: blocks },
  poolCollapsed: {},
})
const descCount = (root) => root.querySelectorAll(".sub-desc").length

test("M-608b · 说明行两例：首出生 ⇒ desc 恰一；首块移除后再出生 ⇒ 不再插（+ #630 语义钉）", () => {
  const root = new FakeNode("div")
  root.setAttribute("data-slot", "pool")

  // 例 ①：首出生 ⇒ `.sub-desc` 恰一（插入点 = 块元素内 ∕ `.advisor-content` 之前）
  mountPool(root, poolStateOf([entry(1)]))
  assert.equal(descCount(root), 1, "首出生 ⇒ `.sub-desc` 恰一")
  const blockA = root.querySelector(".sub-block")
  const desc = root.querySelector(".sub-desc")
  assert.ok(blockA !== null && desc !== null, "块 ∕ 说明行在场")
  assert.equal(desc.parent, blockA, "插入点零改（块元素内）")
  const atContent = blockA.children.indexOf(blockA.querySelector(".advisor-content"))
  assert.ok(blockA.children.indexOf(desc) >= 0 && blockA.children.indexOf(desc) < atContent, "位置 = `.advisor-content` 之前")
  const familyA = root.querySelector('[data-family="subagents"]')
  assert.ok(familyA !== null, "族容器在场")

  // 二次出生（首块存续 + 新键）⇒ 仍恰一（唯一——旧判据同判，控制臂）
  mountPool(root, poolStateOf([entry(1), entry(2)]))
  assert.equal(root.querySelectorAll(".sub-block").length, 2, "二块在场")
  assert.equal(descCount(root), 1, "二块出生 ⇒ 仍恰一（不重复插）")

  // 例 ②：首块移除（queued 取消 ⇒ 块表空 ⇒ 零块帧弃账）后再出生 ⇒ 不再插
  mountPool(root, poolStateOf([]))
  assert.equal(root.querySelectorAll(".sub-block").length, 0, "零块帧 ⇒ 块离场")
  assert.equal(root.querySelector('[data-family="subagents"]'), null, "零块帧 ⇒ 族容器弃账（重建痕）")
  assert.equal(descCount(root), 0, "说明行随首块灭")
  mountPool(root, poolStateOf([entry(3)]))
  const familyC = root.querySelector('[data-family="subagents"]')
  assert.equal(root.querySelectorAll(".sub-block").length, 1, "再出生 ⇒ 新块在场")
  assert.ok(familyC !== null && familyC !== familyA, "再出生 ⇒ 新族容器（旧族 DOM 探针此处必重插 ⇒ 判别力）")
  assert.equal(descCount(root), 0, "首块移除后再出生 ⇒ 不再插（零重插）")

  // 语义钉（沿父裁 A = #630 KD-EC-4 面板级同判）：跨会话再出生 ⇒ 零重插；新 root ⇒ 归零复发
  const rootX = new FakeNode("div")
  rootX.setAttribute("data-slot", "pool")
  mountPool(rootX, poolStateOf([entry(1)]))
  assert.equal(descCount(rootX), 1, "新 root 会话 1：首出生 ⇒ 恰一")
  mountPool(rootX, poolStateOf([entry(5)], "2"))
  assert.equal(rootX.querySelectorAll(".sub-block").length, 1, "会话 2 新块在场")
  assert.equal(descCount(rootX), 0, "跨会话再出生 ⇒ 零重插（root 旗标一次置位）")
  const rootY = new FakeNode("div")
  rootY.setAttribute("data-slot", "pool")
  mountPool(rootY, poolStateOf([entry(1)]))
  assert.equal(descCount(rootY), 1, "新 root ⇒ 旗标归零（VSC webview 重载同判）")
  out("M-608b 说明行", `例一=1 · 二块=1 · 移除后灭 · 再出生=0 · 跨会话=0 · 新 root=1`)
})

// ─── M-608c · 文档面句收正（#608①–③）───────────────────────────────────────────────────

test("M-608c · 文档面句收正（#608①–③）：核两档留端句在位 ∧ 旧形零残留 ∧ 桌面零注入源面", () => {
  const stateSrc = readRepo("thincoder-render-core/subblocks/state.mjs")
  const blockSrc = readRepo("thincoder-render-core/subblocks/block.mjs")

  // ① 痕迹 = 端观测面——桌面无上行面 ⇒ 不接（给由）
  assert.ok(stateSrc.includes("痕迹 = 端观测面——桌面无上行面 ⇒ 不接（给由）"), "state：痕迹给由句在位")
  assert.ok(blockSrc.includes("端观测面——桌面无上行面 ⇒ 不接（给由）"), "block：痕迹给由句在位")
  // ② 丢弃痕 = 同族不接（落值句：桌面零注入由 —— deps 仅 { now } ∕ 丢弃径静默 return）
  assert.ok(stateSrc.includes("丢弃径静默 return") && stateSrc.includes("deps 仅 `{ now }`"), "state：丢弃痕零注入给由在位")
  // ②b 桌面源面核（给由可机检——非仅文本）：核态机调用形 = deps 仅 { now } ∧ 零 trace 注入
  const desktopSrc = readRepo("thincoder-desktop/renderer/subagent-reduce.mjs")
  assert.ok(desktopSrc.includes("subBlocksReduce(list, patch, { now: () => now })"), "desktop：核态机 deps 仅 { now }（零注入形）")
  assert.ok(!desktopSrc.includes("trace:"), "desktop：零 trace 注入（痕迹不接——给由）")
  // ③ 端复位面（VSC `resetActivity` ∕ 桌面 `resetSubBlocks`）
  assert.ok(stateSrc.includes("端复位面（VSC `resetActivity` ∕ 桌面 `resetSubBlocks`）"), "state：端复位面句在位")

  // 旧形零残留（被收正的表述不得留存）
  assert.ok(!stateSrc.includes("痕迹（`activity-diag.js`）"), "state：旧「痕迹（activity-diag.js）」零残留")
  assert.ok(!stateSrc.includes("`refreshLiveHeaders`）/ `resetActivity`。"), "state：旧裸 `resetActivity` 留端句零残留")
  assert.ok(!blockSrc.includes("说明行判重与插入点 · 痕迹 · 帧调度"), "block：旧裸痕迹项零残留")
  out("M-608c 文档面", `state=${stateSrc.length}B · block=${blockSrc.length}B · 五句在位 ∧ 三旧形零残留 · 桌面源面核 ✓`)
})
