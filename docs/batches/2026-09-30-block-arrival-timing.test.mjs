/**
 * 2026-09-30-block-arrival-timing.test.mjs — 批次本地单元件（台账 #746 · 块到达时点归位批 · 实施轮）·
 * 任务书 = `docs/batches/2026-09-30-block-arrival-timing.md` §2（两形腿 + 幂等腿；判句 J1/J2/J3）。
 * 腿 A「S 不夹运行中回合」：a 发射器级——`settleAsyncEntry`（非挂起态）⇒ 捕获 token 含 `⟦ev⟧settled`
 *                           ∧ 不含 `⟦ev⟧done`；条目留池（done-in-pool——驻留分流保留）；
 *                        b 渲染级——`onSubagent` 收 `settled` patch ⇒ 流内零增块（运行中回合块列不被插入）
 *                           ∧ 该块 `awaitingDigest` 驻留 ∧ 未归档（`region !== "flow"`）；
 *                        c relay 一跳——`⟦ev⟧settled` token ⇒ `{ status: "settled" }` patch（发射器 ↔
 *                           渲染面链闭合——事件名与映射同拍）。
 * 腿 B「[块][轮] 对不拆」：消费窗 `done` patch ⇒ 归档入流（位次居运行中回合块之后；`record:append` 照发）；
 *                         重复 `done` ⇒ 幂等零增（已归档墓碑零动作）；座次面（假 DOM，沿 #738 批件脚手架）
 *                         ——[块挂载][行族渲染] 两序 ⇒ 文档序 [块][行族]。
 * 随批留存 · 不进仓套件（全清令：仓套件不写 ∕ 不改 ∕ 不跑）。复跑（cwd = 仓库根，即含 `thincoder-core/` 的目录）：
 *   node --test docs/batches/2026-09-30-block-arrival-timing.test.mjs
 * 纪律：行为断言优先（真发射器 ∥ 真归约体 ∥ 真帧路）；真机一条 = 父侧闭合（D16 义务）——本档只落机检面。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（须先于任何 /rc/ 取件注册）

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-core"))) throw new Error(`从仓库根（含 thincoder-core/）运行：cwd = ${ROOT}`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)

const [settle, subagentReduce, i18n, i18nCore, chat, chatModel, chatStream] = await Promise.all([
  mod("thincoder-core/agent-tools/async-settle.mjs"), // 核件 settle 发射器（腿 A-a）
  mod("thincoder-desktop/renderer/subagent-reduce.mjs"), // 子 agent 归约径（腿 A-b ∥ B）
  mod("thincoder-desktop/renderer/i18n.mjs"), // 词面投影（t）
  mod("thincoder-core/i18n.mjs"), // 核字典投影（词面单源）
  mod("thincoder-desktop/renderer/views/chat.mjs"), // 挂载 ∥ 帧尾（真路——座次面）
  mod("thincoder-desktop/renderer/views/chat-model.mjs"), // 帧模型
  mod("thincoder-desktop/renderer/views/chat-stream.mjs"), // 对齐步（alignPlan——帧输入同源）
])

const KEY = "1"
const zh = () => i18n.initDict({ locale: "zh", dict: i18nCore.projectDictionary("zh") })

const baseState = (over = {}) => ({
  activeSession: KEY, blocks: [], digest: {}, pool: { running: 0, approval: 0, queue: [], approvals: [] },
  following: true, pendingNew: 0, history: {}, project: { cwd: "/p" }, ...over,
})
const subPatch = (status) => ({ key: KEY, role: "subagent", id: 7, status })

// ─── 腿 A-a：发射器级（非挂起态 settle ⇒ ⟦ev⟧settled；零 ⟦ev⟧done；留池）────────────────

test("腿 A-a·发射器级：非挂起态 settle ⇒ ⟦ev⟧settled、零 ⟦ev⟧done；条目留池（驻留分流保留）", () => {
  const tokens = []
  const entry = { role: "subagent", id: 7, relayPrefix: "subagent#7/", startedAt: Date.now(), _settle: null }
  const parent = { _asyncSubagents: new Map([[String(entry.id), entry]]), _pendingAsyncResults: [] } // 无 `_suspended` ⇒ 非挂起态
  const ctx = { signal: new AbortController().signal, callbacks: { onToken: (token) => tokens.push(token) } }
  settle.settleAsyncEntry(parent, entry, { pool: parent._asyncSubagents, ctx })
  assert.ok(tokens.some((token) => token.includes("⟦ev⟧settled")), "驻留事件在场（区块驻留待消费）")
  assert.ok(!tokens.some((token) => token.includes("⟦ev⟧done")), "零 `⟦ev⟧done`——不再自 settle 点发射")
  assert.equal(entry.done, true, "结算事实（done/status 翻）")
  assert.equal(parent._asyncSubagents.has("7"), true, "条目留池（done-in-pool——回合尾收集兜底）")
  assert.equal(parent._pendingAsyncResults.length, 0, "非挂起态不入 pending（分流保留）")
})

// ─── 腿 A-c：relay 一跳（`⟦ev⟧settled` token ⇒ `settled` patch——发射器 ↔ 渲染面链闭合）────────

test("腿 A-c·relay 一跳：`⟦ev⟧settled` token ⇒ `{ status: \"settled\" }` patch（闭集既有事件）", async () => {
  const relay = await mod("thincoder-render-core/subblocks/relay.mjs")
  const patch = relay.relayEventToSubPatch(`subagent#7/⟦ev⟧settled\x1e0\x1e0\x1esettled\x1e`, relay.createRelayScope())
  assert.deepEqual(patch, { status: "settled", role: "subagent", id: 7 }, "settle 发射面 token ⇒ 驻留 patch")
})

// ─── 腿 A-b：渲染级（`settled` patch ⇒ 流内零增块 + 驻留 + 未归档）────────────────────

test("腿 A-b·渲染级：`settled` patch ⇒ 流内零增块 ∧ `awaitingDigest` 驻留 ∧ 未归档", () => {
  let state = baseState({ subBlocks: {}, blocks: [{ kind: "assistant", text: "运行中回合输出" }] })
  const before = state.blocks.length
  state = subagentReduce.onSubagent(state, subPatch("started"), 0)
  const after = subagentReduce.onSubagent(state, subPatch("settled"), 0)
  assert.equal(after.blocks.length, before, "流内零增块（运行中回合块列不被插入——J1）")
  assert.ok(after.blocks.every((block) => block.kind !== "subagent"), "流内零归档块（未入流）")
  const block = after.subBlocks[KEY][0]
  assert.equal(block.awaitingDigest, true, "驻留待消化（区块中间态）")
  assert.notEqual(block.region, "flow", "未归档（非墓碑——J3 全程可见）")
})

// ─── 腿 B-模型：消费窗 `done` ⇒ 归档入流（位次居运行中回合块之后）；重复 `done` 幂等 ────────

test("腿 B-模型·[块][轮] 对不拆：消费窗 `done` ⇒ 归档入流（位次居回合块之后、记录照发）；重复 `done` 幂等", () => {
  const calls = []
  const prevBridge = globalThis.thincoder
  globalThis.thincoder = { invoke: (ch, payload) => { calls.push({ ch, payload }); return Promise.resolve({ ok: true }) } }
  try {
    const turnBlocks = [{ kind: "user", text: "问" }, { kind: "assistant", text: "运行中回合输出" }]
    let state = baseState({ subBlocks: {}, blocks: turnBlocks })
    state = subagentReduce.onSubagent(state, subPatch("started"), 0)
    state = subagentReduce.onSubagent(state, subPatch("settled"), 0)
    assert.equal(state.blocks.length, turnBlocks.length, "驻留期流内零增块")
    const archived = subagentReduce.onSubagent(state, subPatch("done"), 0) // 消费窗补发形
    assert.equal(archived.blocks.length, turnBlocks.length + 1, "归档入流恰一枚")
    assert.equal(archived.blocks.at(-1).kind, "subagent", "留档块形（尾位）")
    const at = archived.blocks.length - 1
    assert.ok(turnBlocks.every((_, index) => at > index), "位次居运行中回合全部块之后（[块]不夹回合内部）")
    assert.equal(archived.subBlocks[KEY][0].region, "flow", "表项墓碑（池内退场）")
    assert.equal(calls.filter((row) => row.ch === "record:append").length, 1, "归档时 `record:append` 照发")
    const again = subagentReduce.onSubagent(archived, subPatch("done"), 0) // reclaim 兜底形（重复）
    assert.equal(again.blocks, archived.blocks, "重复 `done` ⇒ 零新块（原引用——幂等）")
    assert.equal(calls.filter((row) => row.ch === "record:append").length, 1, "重复 `done` ⇒ 零新记录")
  } finally {
    if (prevBridge === undefined) delete globalThis.thincoder
    else globalThis.thincoder = prevBridge
  }
})

// ─── 假 DOM（座次面；沿 #738 批件脚手架 —— 属性 ∕ 选择器 ∕ 结构）────────────────────

class FakeText {
  constructor(value) { this.textContent = String(value); this.parentNode = null }
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
    this.scrollTop = 0
    this.scrollHeight = 1000
    this.clientHeight = 200
  }
  get nodeType() { return 1 }
  get children() { return this.childNodes.filter((node) => node instanceof FakeNode) }
  get firstChild() { return this.childNodes[0] ?? null }
  get lastChild() { return this.childNodes[this.childNodes.length - 1] ?? null }
  get lastElementChild() { const list = this.children; return list[list.length - 1] ?? null }
  get nextSibling() {
    if (this.parentNode === null) return null
    const at = this.parentNode.childNodes.indexOf(this)
    return at < 0 ? null : this.parentNode.childNodes[at + 1] ?? null
  }
  get previousElementSibling() {
    if (this.parentNode === null) return null
    const list = this.parentNode.children
    const at = list.indexOf(this)
    return at <= 0 ? null : list[at - 1]
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
      toggle: (c, force) => { if (force === undefined ? !read().includes(c) : force === true) self.classList.add(c); else self.classList.remove(c) },
    }
  }
  /** `dataset`（真 DOM 语义探针 —— 核件读面所需）。 */
  get dataset() {
    const self = this
    const nameOf = (key) => `data-${String(key).replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`
    return new Proxy({}, {
      get: (_target, key) => (typeof key === "string" ? self.getAttribute(nameOf(key)) : undefined),
      set: (_target, key, value) => { self.setAttribute(nameOf(key), String(value)); return true },
    })
  }
  getAttribute(name) { return Object.hasOwn(this.attrs, name) ? this.attrs[name] : null }
  getAttributeNames() { return Object.keys(this.attrs) }
  setAttribute(name, value) { this.attrs[name] = String(value) }
  removeAttribute(name) { delete this.attrs[name] }
  addEventListener(type, fn) { this.listeners.push({ type, fn }) }
  removeEventListener(type, fn) { this.listeners = this.listeners.filter((l) => !(l.type === type && l.fn === fn)) }
  append(...nodes) {
    for (const node of nodes) {
      const child = node instanceof FakeNode || node instanceof FakeText ? node : new FakeText(node)
      child.parentNode = this
      this.childNodes.push(child)
    }
  }
  appendChild(node) { this.append(node); return node }
  prepend(...nodes) { for (const node of [...nodes].reverse()) this.insertBefore(node, this.childNodes[0] ?? null) }
  insertBefore(node, ref) {
    const child = node instanceof FakeNode || node instanceof FakeText ? node : new FakeText(node)
    if (child.parentNode !== null) {
      const at = child.parentNode.childNodes.indexOf(child)
      if (at >= 0) child.parentNode.childNodes.splice(at, 1)
    }
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
  replaceWith(next) { if (this.parentNode !== null) { this.parentNode.insertBefore(next, this); this.remove() } }
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

// ─── 腿 B-座次：假 DOM 两序 ⇒ 文档序 [块][行族] ────────────────────────────────

const SCROLL = { readMetrics: () => ({ scrollTop: 0, scrollHeight: 1000, clientHeight: 200 }) }
const EMPTY_PLAN = { evict: 0, prepend: 0, tail: [], ok: true }
const SUB_META = { key: "sub:subagent#7", label: "subagent#7", role: "subagent", id: 7, pool: true, status: "done", frozen: true, startedAt: 0, doneAt: 1500 }
const LIVE_ROUND = { status: "start", n: 1, tier: null }
const directKinds = (root, attr) => root.children.filter((node) => node.getAttribute(attr) !== null)
const indexOf = (root, node) => root.childNodes.indexOf(node)
const mount = (root, state) => chat.mountChat(root, state, {})
const frame = (root, state, tier, plan, mounted = []) => chat.settleFrame(root, chatModel.chatModel(state), SCROLL, plan, tier, {}, mounted)

const subBlock = () => ({ kind: "subagent", meta: { ...SUB_META }, rows: [{ kind: "text", text: "行一" }] })

test("腿 B-座次·[块][轮] 对不拆：假 DOM 两序（挂早 ∥ 挂晚）⇒ 文档序 [块][行族]", async () => {
  await withFakeDom(async () => {
    zh()
    // 序 1（挂早）：归档块先挂（轮行未渲染）⇒ 行族随后落流 ⇒ [归档块][行族]
    {
      const root = new FakeNode("div")
      root.__connected = true
      const s1 = baseState({ blocks: [{ kind: "assistant", text: "输出" }] })
      const m1 = mount(root, s1)
      const s2 = { ...s1, blocks: [...s1.blocks, subBlock()] }
      const mounted2 = frame(root, s2, "append", chatStream.alignPlan(m1.mounted, s2.blocks, false, 0), m1.mounted)
      assert.equal(directKinds(root, "data-digest").length, 0, "序 1：挂入时轮行未渲染")
      frame(root, { ...s2, digest: { [KEY]: [LIVE_ROUND] } }, "none", EMPTY_PLAN, mounted2)
      const blocks = directKinds(root, "data-block-kind")
      const rounds = directKinds(root, "data-digest")
      assert.equal(blocks.length, 2, "序 1：块两枚（内容 + 归档块）")
      assert.equal(rounds.length, 1, "序 1：起跑帧 ⇒ 轮行落流末")
      assert.equal(blocks[1].getAttribute("data-block-kind"), "subagent", "序 1：第二枚 = 归档块")
      assert.ok(indexOf(root, blocks[1]) < indexOf(root, rounds[0]), "序 1：归档块居其消费行族之前（[块][行族]）")
    }
    // 序 2（挂晚）：轮行已渲染 ⇒ 归档块守卫前插族首 ⇒ [归档块][行族]
    {
      const root = new FakeNode("div")
      root.__connected = true
      const s1 = baseState({ blocks: [{ kind: "assistant", text: "输出" }], digest: { [KEY]: [LIVE_ROUND] } })
      const m1 = mount(root, s1)
      assert.equal(directKinds(root, "data-digest").length, 1, "序 2：轮行在场")
      const s2 = { ...s1, blocks: [...s1.blocks, subBlock()] }
      frame(root, s2, "append", chatStream.alignPlan(m1.mounted, s2.blocks, false, 0), m1.mounted)
      const blocks = directKinds(root, "data-block-kind")
      assert.equal(blocks.length, 2, "序 2：块两枚")
      assert.equal(blocks[1].getAttribute("data-block-kind"), "subagent", "序 2：第二枚 = 归档块")
      assert.ok(indexOf(root, blocks[1]) < indexOf(root, directKinds(root, "data-digest")[0]), "序 2：归档块居族前（[块][行族]）")
    }
  })
})
