/**
 * 2026-09-30-digest-reflow-anchor.test.mjs — 批次本地单元件（台账 #738 · 消化回流归位批 · 实施轮）·
 * 任务书 = `docs/batches/2026-09-30-digest-reflow-anchor.md` §2 ∥ §4（机检腿六条）+ #738 修复轮（落位腿四条）。
 * 六腿：① 起跑窗补发序（`done` 先于回合执行）② `done` 幂等（重复零动作）③ `start` 全替（切片 = [本轮]）
 *      ④ `foldDigest` 最新一条（含未结末轮优先）⑤ 行集（终态非 ask 标签退场 ∥ ask 保留 ∥ live 双行）
 *      ⑥ 落位两序（假 DOM：挂早 ∥ 挂晚皆 [归档块][行族] + 换代末位重锚）。
 * 落位腿（#738 修复轮 —— 行恒居原位：终态 ∥ 复列 ∥ 后续动作三径零漂）：
 *      ⑦ 形 A（出窗折叠轮：低于窗下界 ⇒ 零插入；无下界 ⇒ 落尾——绝不插流首）
 *      ⑧ 形 B（运行期尾段内的位次轮：不落首枚未标块之前 ⇒ 落尾组锚）
 *      ⑨ 出生即定（活元素转位次 ⇒ 原位存续零重座）⑩ 三径链（终态 ∥ 复列 ∥ 后续动作 ⇒ 与块恒相邻）。
 * 随批留存 · 不进仓套件（全清令：仓套件不写 ∕ 不改 ∕ 不跑）。
 * 复跑（cwd = 仓库根，即含 `thincoder-core/` 的目录）：node --test docs/batches/2026-09-30-digest-reflow-anchor.test.mjs
 * 纪律：行为断言优先（真归约体 ∥ 真帧路 ∥ 真驱动装配）；真机三径 = 父侧闭合（D16 义务）——本档只落机检面。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（须先于任何 /rc/ 取件注册）

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-core"))) throw new Error(`从仓库根（含 thincoder-core/）运行：cwd = ${ROOT}`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)

const [wake, pageRead, i18n, i18nCore, seat, subagentReduce, driveMod, chat, chatModel, chatStream] = await Promise.all([
  mod("thincoder-desktop/renderer/events-wake.mjs"), // `ev:digest` 归约（只留当轮）
  mod("thincoder-desktop/renderer/page-read.mjs"), // 页读径（foldDigest ∥ withFoldedDigest）
  mod("thincoder-desktop/renderer/i18n.mjs"), // 词面投影（t）
  mod("thincoder-core/i18n.mjs"), // 核字典投影（词面单源）
  mod("thincoder-desktop/renderer/views/chat-digest-seat.mjs"), // 消化行族构树 ∥ 位次面
  mod("thincoder-desktop/renderer/subagent-reduce.mjs"), // 子 agent 归约径（done 幂等面）
  mod("thincoder-desktop/src/main/suspension-drive.mjs"), // 挂起驱动（起跑窗补发）
  mod("thincoder-desktop/renderer/views/chat.mjs"), // 挂载 ∥ 帧尾（真路）
  mod("thincoder-desktop/renderer/views/chat-model.mjs"), // 帧模型
  mod("thincoder-desktop/renderer/views/chat-stream.mjs"), // 对齐步（alignPlan —— 帧输入同源）
])

const KEY = "1"
const zh = () => i18n.initDict({ locale: "zh", dict: i18nCore.projectDictionary("zh") })
const until = async (fn, ms = 4000) => {
  const t0 = Date.now()
  while (!fn()) {
    if (Date.now() - t0 > ms) throw new Error("until timeout")
    await new Promise((r) => setTimeout(r, 5))
  }
  return true
}

// ─── 假 DOM（属性 ∕ 选择器（含逗号组）∕ 结构 —— 沿 digest-persistence 批内件先例）──────────

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
      toggle: (c, force) => {
        const want = force === undefined ? !read().includes(c) : force === true
        if (want) self.classList.add(c)
        else self.classList.remove(c)
      },
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
  prepend(...nodes) {
    for (const node of [...nodes].reverse()) this.insertBefore(node, this.childNodes[0] ?? null)
  }
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
  replaceWith(next) {
    if (this.parentNode === null) return
    this.parentNode.insertBefore(next, this)
    this.remove()
  }
  remove() {
    if (this.parentNode === null) return
    this.parentNode.removeChild(this)
  }
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

/** 单段选择器（类 ∕ 标签 ∕ `[attr]` ∕ `[attr="v"]`）。 */
function matchesSegment(node, sel) {
  if (sel.startsWith(".")) return String(node.getAttribute("class") ?? "").split(/\s+/).includes(sel.slice(1))
  if (/^[a-zA-Z][\w-]*$/.test(sel)) return node.tagName === sel.toUpperCase()
  const m = /^\[([^=\]]+)(?:="([^"]*)")?\]$/.exec(sel)
  if (m === null) return false
  const value = node.getAttribute(m[1])
  if (value === null) return false
  return m[2] === undefined || value === m[2]
}

/** 选择器（逗号组 `a, b` ∨ 后代组合 `a b` —— 逐段 `matchesSegment`）。 */
function select(node, sel) {
  return String(sel).split(",").some((part) => selectOne(node, part.trim()))
}
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

// ─── 场景脚手架（真路：mountChat ∥ settleFrame 六步）────────────
const SCROLL = { readMetrics: () => ({ scrollTop: 0, scrollHeight: 1000, clientHeight: 200 }) }
const EMPTY_PLAN = { evict: 0, prepend: 0, tail: [], ok: true }
const SUB_META = { key: "sub:explore#1", label: "sub:explore#1", role: "explore", id: 1, pool: true, status: "done", frozen: true, startedAt: 0, doneAt: 1500 }
const liveRound = { status: "start", n: 1, tier: null }
const endRound = { status: "end", ok: true, ms: 500, n: 1 }

const baseState = (over = {}) => ({
  activeSession: KEY, blocks: [], digest: {}, pool: { running: 0, approval: 0, queue: [], approvals: [] },
  following: true, pendingNew: 0, history: {}, project: { cwd: "/p" }, ...over,
})
const directBlocks = (root) => root.childNodes.filter((node) => node instanceof FakeNode && node.getAttribute("data-block-kind") !== null)
const directRounds = (root) => root.childNodes.filter((node) => node instanceof FakeNode && node.getAttribute("data-digest") !== null)
const indexOf = (root, node) => root.childNodes.indexOf(node)
const mount = (root, state, limit) => chat.mountChat(root, state, {}, limit)
const frame = (root, state, tier, plan, mounted = []) => chat.settleFrame(root, chatModel.chatModel(state), SCROLL, plan, tier, {}, mounted)

// ─── 腿 1：起跑窗补发序（`done` 先于回合执行）────────────────────────────

test("腿 1·起跑窗补发序：`ev:digest start` ⇒ 本轮将消费驻留条目逐条补发 `done`（先于回合执行）；reclaim 兜底再发", async () => {
  const entry = { role: "subagent", id: 7 }
  const agent = {
    title: "t", cwd: null, _slot: 1,
    _asyncSubagents: new Map([["s1", { status: "running" }]]),
    _asyncAdvisors: new Map(), _consultSessions: new Map(), _pendingAsyncResults: [entry],
    provider: { name: "vis", model: "claude-sonnet-4-5" }, config: { locale: "zh" }, memory: { db: null },
    history: [], _fullHistory: [],
  }
  const log = []
  const drive = driveMod.createSuspensionDrive({
    post: (ch, payload) => log.push({ type: "post", ch, payload }),
    runTurn: (key, agent1, text, opts = {}) => {
      log.push({ type: "run", text, opts }) // 序面：run 记录点 = 回合执行刻
      agent1._pendingAsyncResults.splice(0) // 模拟 run 首行注入器全量消费（`run-start.mjs`）
      return Promise.resolve()
    },
    timer: () => ({ unref() {} }), clear: () => {},
  })
  assert.equal(drive.start(KEY, agent, { cwd: "/p" }), true, "池活 ⇒ 入窗")
  await until(() => log.some((row) => row.type === "run"))
  const startAt = log.findIndex((row) => row.type === "post" && row.ch === "ev:digest" && row.payload.status === "start")
  const doneAt = log.findIndex((row) => row.type === "post" && row.ch === "ev:subagent" && row.payload.status === "done" && row.payload.id === 7)
  const runAt = log.findIndex((row) => row.type === "run")
  assert.ok(startAt >= 0 && doneAt >= 0 && runAt >= 0, "三事件皆在场")
  assert.ok(startAt < doneAt && doneAt < runAt, "序 = start ⇒ done ⇒ 回合执行（起跑窗补发）")
  assert.deepEqual(log[startAt].payload, { key: KEY, status: "start", n: 1 }, "起跑帧（n = 起跑 pending 数 —— 同快照源）")
  assert.deepEqual(log[doneAt].payload, { key: KEY, role: "subagent", id: 7, status: "done" }, "补发形 = VSC 收回面同款")
  await until(() => log.filter((row) => row.type === "post" && row.ch === "ev:subagent" && row.payload.status === "done").length >= 2)
  const doneRows = log.filter((row) => row.type === "post" && row.ch === "ev:subagent" && row.payload.status === "done")
  assert.equal(doneRows.length, 2, "起跑窗 + reclaim 兜底各一发（兜底幂等 —— 渲染面腿 2 锁）")
})

// ─── 腿 2：`done` 幂等（重复零动作）────────────────────────────

test("腿 2·`done` 幂等：重复 `done` ⇒ 零新块 ∥ 零新记录 ∥ 墓碑原位", () => {
  const calls = []
  const prevBridge = globalThis.thincoder
  globalThis.thincoder = { invoke: (ch, payload) => { calls.push({ ch, payload }); return Promise.resolve({ ok: true }) } }
  try {
    let state = baseState({ subBlocks: {} })
    state = subagentReduce.onSubagent(state, { key: KEY, role: "subagent", id: 7, status: "started" }, 0)
    state = subagentReduce.onSubagent(state, { key: KEY, role: "subagent", id: 7, status: "settled" }, 0)
    assert.equal(state.subBlocks[KEY][0].awaitingDigest, true, "settled ⇒ 驻留待消化")
    const archived = subagentReduce.onSubagent(state, { key: KEY, role: "subagent", id: 7, status: "done" }, 0)
    assert.equal(archived.blocks.length, 1, "`done` ⇒ 归档入流恰一枚")
    assert.equal(archived.blocks[0].kind, "subagent", "留档块形")
    assert.equal(archived.subBlocks[KEY][0].region, "flow", "表项墓碑（池内退场）")
    assert.equal(calls.filter((row) => row.ch === "record:append").length, 1, "归档记录出站恰一枚")
    const after = subagentReduce.onSubagent(archived, { key: KEY, role: "subagent", id: 7, status: "done" }, 0)
    assert.equal(after.blocks, archived.blocks, "重复 `done` ⇒ 零新块（blocks 原引用 —— 零动作）")
    assert.equal(calls.filter((row) => row.ch === "record:append").length, 1, "重复 `done` ⇒ 零新记录")
    assert.equal(after.subBlocks[KEY][0].region, "flow", "墓碑原位（零半复活）")
  } finally {
    if (prevBridge === undefined) delete globalThis.thincoder
    else globalThis.thincoder = prevBridge
  }
})

// ─── 腿 3：`start` 全替（切片 = [本轮]）────────────────────────────

test("腿 3·`start` 全替：切片 = [本轮]（旧轮退场）；`cap` ∕ `end` 就本轮更新；无轮零写", () => {
  let state = { digest: {} }
  state = wake.onDigest(state, { key: KEY, status: "start", n: 3, tier: null })
  assert.equal(state.digest[KEY].length, 1, "start ⇒ 本轮一条")
  state = wake.onDigest(state, { key: KEY, status: "end", ok: true, ms: 900 })
  state = wake.onDigest(state, { key: KEY, status: "start", n: 1, tier: "ask", from: "u", msg: "m" })
  assert.equal(state.digest[KEY].length, 1, "全替 —— 旧轮退场（历史行不留）")
  assert.equal(state.digest[KEY][0].status, "start", "本轮 = 新轮")
  assert.equal(state.digest[KEY][0].n, 1, "新轮起跑数")
  assert.equal(state.digest[KEY][0].tier, "ask", "ask 档随行")
  state = wake.onDigest(state, { key: KEY, status: "cap", mode: "stop", turns: 2 })
  state = wake.onDigest(state, { key: KEY, status: "end", ok: false, ms: 100 })
  assert.equal(state.digest[KEY].length, 1, "cap ∕ end 就本轮更新（零新轮）")
  assert.equal(state.digest[KEY][0].status, "end", "终态就地")
  assert.equal(state.digest[KEY][0].ok, false, "aborted 事实")
  assert.deepEqual(state.digest[KEY][0].cap, { mode: "stop", turns: 2 }, "撞帽事实跨 end 存续")
  assert.equal(wake.onDigest(state, { key: "9", status: "end", ok: true, ms: 1 }), state, "无轮 ⇒ 零写（防守档）")
})

// ─── 腿 4：`foldDigest` 最新一条（含未结末轮优先）────────────────────────────

test("腿 4·`foldDigest` 最新一条：只产末轮终态 ∥ 末轮无 `end` 不产；合并 ⇒ 场内存续优先（≤ 1）", () => {
  const recs = [
    { kind: "digest", status: "start", n: 2, tier: null, ts: 1, idx: 10 },
    { kind: "digest", status: "end", ok: true, ms: 500, ts: 2, idx: 11 },
    { kind: "digest", status: "start", n: 1, tier: null, ts: 3, idx: 20 },
    { kind: "digest", status: "end", ok: false, ms: 700, ts: 4, idx: 21 },
  ]
  const receiptOf = (messages, over = {}) => ({ ok: true, messages, hasOlder: false, next: null, meta: {}, flags: null, queue: null, ...over })
  const pageState = (over = {}) => ({ activeSession: KEY, blocks: [], digest: {}, stopMark: {}, timerNotice: {}, compress: {}, sessionMeta: {}, following: false, pendingNew: 0, ...over })
  const s1 = pageRead.applyPage(pageState(), receiptOf(recs), { key: KEY, before: null })
  assert.equal(s1.digest[KEY].length, 1, "只产最新一条（非叠加 ∥ 非最旧）")
  assert.equal(s1.digest[KEY][0].ok, false, "取末轮终态")
  assert.equal(s1.digest[KEY][0].at, 20, "位次 = 末轮起跑记录 idx")
  const unfinished = [...recs, { kind: "digest", status: "start", n: 1, tier: null, ts: 5, idx: 30 }]
  const s2 = pageRead.applyPage(pageState(), receiptOf(unfinished), { key: KEY, before: null })
  assert.equal(s2.digest[KEY].length, 1, "末轮无 `end` ⇒ 不产该轮（仍产上一终态轮）")
  assert.equal(s2.digest[KEY][0].at, 20, "位次归上一终态轮起跑记录（未结末轮零产 —— 防双份）")
  const onlyStart = [{ kind: "digest", status: "start", n: 1, tier: null, ts: 1, idx: 40 }]
  const s2b = pageRead.applyPage(pageState(), receiptOf(onlyStart), { key: KEY, before: null })
  assert.equal((s2b.digest ?? {})[KEY], undefined, "全无终态 ⇒ 零产（防双份）")
  const truncated = [...recs, { kind: "digest", status: "end", ok: true, ms: 9000, ts: 5, idx: 31 }]
  const s2c = pageRead.applyPage(pageState(), receiptOf(truncated), { key: KEY, before: null })
  assert.equal(s2c.digest[KEY].length, 1, "跨页截断（起跑未载的终态记录）不入折 ⇒ 该轮本页零产")
  assert.equal(s2c.digest[KEY][0].ok, false, "终态事实归本页终态轮（孤立记录零并轮零借位）")
  assert.equal(s2c.digest[KEY][0].ms, 700, "计时不借位")
  assert.equal(s2c.digest[KEY][0].at, 20, "位次不借位")
  const orphanOnly = [{ kind: "digest", status: "end", ok: true, ms: 1, ts: 1, idx: 50 }]
  const s2d = pageRead.applyPage(pageState(), receiptOf(orphanOnly), { key: KEY, before: null })
  assert.equal((s2d.digest ?? {})[KEY], undefined, "纯孤立终态记录 ⇒ 零产")
  const live = { status: "start", n: 2, tier: null, from: null, msg: null }
  const s3 = pageRead.applyPage(pageState({ digest: { [KEY]: [live] } }), receiptOf(recs), { key: KEY, before: null })
  assert.equal(s3.digest[KEY].length, 1, "合并后 ≤ 1（未结末轮 + 折叠轮不双份）")
  assert.equal(s3.digest[KEY][0], live, "未结末轮优先（活态保真 —— 场内存续）")
  const s4 = pageRead.applyPage(pageState(), receiptOf(recs), { key: KEY, before: 5 })
  assert.equal(s4.digest[KEY].length, 1, "切片无轮 ⇒ 采折叠最新一条（重建复列）")
  assert.equal(s4.digest[KEY][0].at, 20, "回填径位次随折叠")
  const current = { status: "end", ok: true, ms: 900, at: 99 }
  const older = [
    { kind: "digest", status: "start", n: 1, tier: null, ts: 1, idx: 5 },
    { kind: "digest", status: "end", ok: true, ms: 10, ts: 2, idx: 6 },
  ]
  const s5 = pageRead.applyPage(pageState({ digest: { [KEY]: [current] } }), receiptOf(older), { key: KEY, before: 40 })
  assert.equal(s5.digest[KEY].length, 1, "回填径合并后 ≤ 1")
  assert.equal(s5.digest[KEY][0], current, "更旧折叠轮不入显示（现轮集原样 —— 零回退）")
})

// ─── 腿 5：行集（终态非 ask 标签退场 ∥ ask 保留 ∥ live 双行）────────────────────────────

test("腿 5·行集：构树随 `status`（live 双行 ∥ 终态非 ask 标签退场 ∥ ask 档保留）+ 同帧原位增删", async () => {
  const rowsOf = (round) => seat.digestRoundNode(round).children.map((child) => (
    child.props["data-digest-label"] !== undefined ? "label" : child.props["data-digest-count"] !== undefined ? "count" : "cap"
  ))
  assert.deepEqual(rowsOf({ status: "start", n: 2, tier: null }), ["label", "count"], "live 双行（标签 + 计数）")
  assert.deepEqual(rowsOf({ status: "end", n: 2, ok: true, ms: 1200 }), ["count"], "终态非 ask ⇒ 标签行退场")
  assert.deepEqual(rowsOf({ status: "end", tier: "ask", from: "upstream", msg: "问", n: 0, ok: true, ms: 800 }), ["label"], "ask 档终态保留（n = 0 ⇒ 零计数行）")
  await withFakeDom(async () => {
    zh()
    const root = new FakeNode("div")
    root.__connected = true
    const s1 = baseState({ digest: { [KEY]: [liveRound] } })
    mount(root, s1)
    const el = directRounds(root)[0]
    assert.ok(el !== undefined, "轮元素在场")
    assert.ok(el.querySelector("[data-digest-label]") !== null, "live：标签行在场")
    assert.ok(el.querySelector("[data-digest-count]") !== null, "live：计数行在场")
    const s2 = baseState({ digest: { [KEY]: [{ status: "end", n: 1, ok: true, ms: 1200 }] } })
    frame(root, s2, "none", EMPTY_PLAN)
    assert.equal(directRounds(root)[0], el, "同帧原位（元素身份存续）")
    assert.equal(el.querySelector("[data-digest-label]"), null, "终态非 ask ⇒ 标签行原位摘除")
    assert.ok(el.querySelector("[data-digest-count]") !== null, "计数行留存（终态文）")
    const s3 = baseState({ digest: { [KEY]: [{ status: "end", tier: "ask", from: "u", msg: "m", n: 1, ok: true, ms: 900 }] } })
    frame(root, s3, "none", EMPTY_PLAN)
    assert.equal(directRounds(root)[0], el, "ask 档终态同帧原位")
    assert.ok(el.querySelector("[data-digest-label]") !== null, "ask 档终态 ⇒ 标签行原位补建")
  })
})

// ─── 腿 6：落位两序（假 DOM：挂早 ∥ 挂晚皆 [归档块][行族]）+ 换代末位重锚 ────────────────────

test("腿 6·落位两序：挂早 ∥ 挂晚皆 [归档块][行族]；行族后内容 ⇒ 内容尾尾插 + 换代末位重锚", async () => {
  await withFakeDom(async () => {
    zh()
    const sub = { kind: "subagent", meta: { ...SUB_META }, rows: [{ kind: "text", text: "行一" }] }
    const content = { kind: "assistant", text: "输出" }
    // 6a 挂早：归档块先入（轮行未渲染）⇒ 轮行随后落流末 = 其后
    {
      const root = new FakeNode("div")
      root.__connected = true
      const s1 = baseState({ blocks: [content] })
      const m1 = mount(root, s1)
      const s2 = { ...s1, blocks: [content, sub] }
      const mounted2 = frame(root, s2, "append", chatStream.alignPlan(m1.mounted, s2.blocks, false, 0), m1.mounted)
      assert.equal(directRounds(root).length, 0, "6a 挂早：挂入时轮行未渲染")
      const s3 = { ...s2, digest: { [KEY]: [liveRound] } }
      frame(root, s3, "none", EMPTY_PLAN, mounted2)
      const rounds = directRounds(root)
      assert.equal(rounds.length, 1, "6a 起跑帧 ⇒ 轮行落流末")
      assert.ok(indexOf(root, directBlocks(root)[1]) < indexOf(root, rounds[0]), "6a 挂早：归档块居其消费行族之前")
    }
    // 6b 挂晚：轮行已渲染（守卫前插族首）
    {
      const root = new FakeNode("div")
      root.__connected = true
      const s1 = baseState({ blocks: [content], digest: { [KEY]: [liveRound] } })
      const m1 = mount(root, s1)
      assert.equal(directRounds(root).length, 1, "6b 轮行在场")
      const s2 = { ...s1, blocks: [content, sub] }
      frame(root, s2, "append", chatStream.alignPlan(m1.mounted, s2.blocks, false, 0), m1.mounted)
      const blocks = directBlocks(root)
      assert.equal(blocks.length, 2, "6b 块两枚")
      assert.ok(indexOf(root, blocks[1]) < indexOf(root, directRounds(root)[0]), "6b 挂晚：守卫前插 ⇒ [归档块][行族]（归档块居族前）")
    }
    // 6c 行族后已有内容（守卫不过 + 换代末位重锚）：轮 N 输出居其行族之后 ⇒ 轮 N+1 起跑 ⇒ 内容尾尾插 ∥ 重锚 皆 [块][新轮行族]
    {
      const root = new FakeNode("div")
      root.__connected = true
      const s1 = baseState({ digest: { [KEY]: [endRound] } })
      const m1 = mount(root, s1)
      const s2 = { ...s1, blocks: [content] }
      const mounted2 = frame(root, s2, "append", chatStream.alignPlan(m1.mounted, s2.blocks, false, 0), m1.mounted)
      assert.ok(indexOf(root, directRounds(root)[0]) < indexOf(root, directBlocks(root)[0]), "6c 前置：行族居输出之前（活流就地）")
      const s3 = { ...s2, blocks: [content, sub], digest: { [KEY]: [liveRound] } }
      const mounted3 = frame(root, s3, "append", chatStream.alignPlan(mounted2, s3.blocks, false, 0), mounted2)
      const contentAt = indexOf(root, directBlocks(root)[0])
      const subAt = indexOf(root, directBlocks(root)[1])
      const roundIdx = indexOf(root, directRounds(root)[0])
      assert.ok(contentAt < subAt && subAt < roundIdx, "6c 换代：内容尾尾插 + 末位重锚 ⇒ [内容][归档块][新轮行族]")
      assert.equal(roundIdx, root.childNodes.length - 1, "6c 新轮行族恒居流末（末位重锚）")
      assert.equal(mounted3.length, 2, "6c 块记账两枚（DOM ≡ visible 不变式不破）")
      assert.equal(root.getAttribute("data-blocks"), "2", "根锚 data-blocks 随帧")
    }
  })
})

// ─── 腿 7：形 A（出窗折叠轮）——低于窗下界 ⇒ 零插入；无下界 ⇒ 落尾（绝不插流首）────────

test("腿 7·形 A（出窗折叠轮）：低于窗下界 ⇒ 零插入；无下界 ⇒ 落尾（绝不插流首）", async () => {
  await withFakeDom(async () => {
    zh()
    const old = { status: "end", ok: true, ms: 500, n: 1, at: 50 }
    // 7a 无已标块（下界未知）⇒ 在位但落尾（绝不流首——座/复列两径同判）
    {
      const root = new FakeNode("div")
      root.__connected = true
      const live = { kind: "assistant", text: "活" }
      const s1 = baseState({ blocks: [live] })
      mount(root, s1)
      const s2 = { ...s1, digest: { [KEY]: [{ ...old }] } }
      frame(root, s2, "none", EMPTY_PLAN)
      const rounds = directRounds(root)
      const blocks = directBlocks(root)
      assert.equal(rounds.length, 1, "7a 无下界 ⇒ 在位（零信息零动作）")
      assert.ok(indexOf(root, rounds[0]) > indexOf(root, blocks[blocks.length - 1]), "7a 落尾（绝不插流首）")
    }
    // 7b 首枚已标块（下界）之下 ⇒ 零插入（座位 ∥ 复列两径）
    {
      const root = new FakeNode("div")
      root.__connected = true
      const live = { kind: "assistant", text: "活" }
      const deep = { kind: "assistant", text: "深", at: 3712 }
      const s1 = baseState({ blocks: [live, deep] })
      mount(root, s1)
      const s2 = { ...s1, digest: { [KEY]: [{ ...old }] } }
      frame(root, s2, "none", EMPTY_PLAN)
      assert.equal(directRounds(root).length, 0, "7b 座位径：低于窗下界 ⇒ 零插入（绝不插块#0 前）")
    }
    {
      const root = new FakeNode("div")
      root.__connected = true
      const live = { kind: "assistant", text: "活" }
      const deep = { kind: "assistant", text: "深", at: 3712 }
      const s1 = baseState({ blocks: [live, deep], digest: { [KEY]: [{ ...old }] } })
      mount(root, s1)
      assert.equal(directRounds(root).length, 0, "7b 复列径：低于窗下界 ⇒ 不进树（绝不插流首）")
    }
  })
})

// ─── 腿 8：形 B（运行期尾段内的位次轮）——不落首枚未标块之前 ⇒ 落尾组锚 ────────

test("腿 8·形 B（运行期尾段内的位次轮）：不落首枚未标块之前 ⇒ 落尾组锚", async () => {
  await withFakeDom(async () => {
    zh()
    const head = { kind: "assistant", text: "前", at: 100 }
    const sub = { kind: "subagent", meta: { ...SUB_META }, rows: [{ kind: "text", text: "行一" }] }
    const tail = { kind: "assistant", text: "后" }
    const round = { status: "end", ok: true, ms: 500, n: 1, at: 500 }
    // 8a 座位径：已标锚皆位次更小 ⇒ 无合格锚 ⇒ 落尾（不落首枚未标块之前）
    {
      const root = new FakeNode("div")
      root.__connected = true
      const s1 = baseState({ blocks: [head, sub, tail] })
      mount(root, s1)
      const s2 = { ...s1, digest: { [KEY]: [{ ...round }] } }
      frame(root, s2, "none", EMPTY_PLAN)
      const rounds = directRounds(root)
      const blocks = directBlocks(root)
      assert.equal(rounds.length, 1, "8a 在位")
      assert.ok(indexOf(root, rounds[0]) > indexOf(root, blocks[blocks.length - 1]), "8a 落尾（不落块#38 式中段）")
    }
    // 8b 复列径（mount）：同判
    {
      const root = new FakeNode("div")
      root.__connected = true
      const s1 = baseState({ blocks: [head, sub, tail], digest: { [KEY]: [{ ...round }] } })
      mount(root, s1)
      const rounds = directRounds(root)
      const blocks = directBlocks(root)
      assert.equal(rounds.length, 1, "8b 在位")
      assert.ok(indexOf(root, rounds[0]) > indexOf(root, blocks[blocks.length - 1]), "8b 落尾（不落首枚未标块之前）")
    }
  })
})

// ─── 腿 9：出生即定——活元素转位次 ⇒ 原位存续（零重座）────────────────────

test("腿 9·出生即定：同轮已有元素（未标活元素）⇒ 转位次后原位存续（零重座）", async () => {
  await withFakeDom(async () => {
    zh()
    const head = { kind: "assistant", text: "前", at: 100 }
    const live = { kind: "assistant", text: "活" }
    const s1 = baseState({ blocks: [head, live], digest: { [KEY]: [{ status: "start", n: 1, tier: null }] } })
    const root = new FakeNode("div")
    root.__connected = true
    mount(root, s1)
    const el = directRounds(root)[0]
    assert.ok(el !== undefined, "活轮元素在场")
    const at0 = indexOf(root, el)
    assert.ok(el.querySelector("[data-digest-label]") !== null, "live：标签行在场")
    const s2 = { ...s1, digest: { [KEY]: [{ status: "end", ok: true, ms: 900, n: 1, at: 500 }] } }
    frame(root, s2, "none", EMPTY_PLAN)
    assert.equal(directRounds(root).length, 1, "恰一枚（零重座 ∥ 零双影）")
    assert.equal(directRounds(root)[0], el, "出生即定：元素身份存续（绝不再座）")
    assert.equal(indexOf(root, el), at0, "原位存续（零搬移）")
    assert.equal(el.querySelector("[data-digest-label]"), null, "行就地更新（终态标签退场）")
  })
})

// ─── 腿 10：三径链（终态 ∥ 复列 ∥ 后续动作）——行恒居其块相邻区 ────────────────

test("腿 10·三径链（终态 ∥ 复列 ∥ 后续动作）：行恒居其块相邻区", async () => {
  await withFakeDom(async () => {
    zh()
    const head = { kind: "assistant", text: "前", at: 100 }
    const mid = { kind: "assistant", text: "中", at: 101 }
    const sub = { kind: "subagent", meta: { ...SUB_META }, rows: [{ kind: "text", text: "行" }] }
    const root = new FakeNode("div")
    root.__connected = true
    // 径 1：起跑（活流就地）——[前][中][归档块][轮]
    const s1 = baseState({ blocks: [head, mid] })
    const m1 = mount(root, s1)
    const s2 = { ...s1, blocks: [head, mid, sub] }
    const m2 = frame(root, s2, "append", chatStream.alignPlan(m1.mounted, s2.blocks, false, 0), m1.mounted)
    const s3 = { ...s2, digest: { [KEY]: [{ status: "start", n: 1, tier: null }] } }
    frame(root, s3, "none", EMPTY_PLAN, m2)
    const el = directRounds(root)[0]
    assert.ok(el !== undefined, "径1：轮元素在场")
    assert.equal(indexOf(root, directBlocks(root)[2]) + 1, indexOf(root, el), "径1：起跑 ⇒ [归档块][轮] 相邻")
    // 径 2：终态转换（原地零漂）
    const s4 = { ...s3, digest: { [KEY]: [{ status: "end", ok: true, ms: 900, n: 1 }] } }
    frame(root, s4, "none", EMPTY_PLAN)
    assert.equal(directRounds(root)[0], el, "径2：终态 ⇒ 元素身份存续")
    assert.equal(indexOf(root, directBlocks(root)[2]) + 1, indexOf(root, el), "径2：相邻序保持（原地零漂）")
    // 径 3：复列（记录重建 ⇒ 轮随其块相邻）+ 后续动作（后续帧零搬移）
    const receipt = {
      ok: true,
      messages: [
        { kind: "assistant", text: "前", idx: 10, timestamp: 1 },
        { kind: "digest", status: "start", n: 1, idx: 20 },
        { kind: "subagent", meta: { ...SUB_META }, rows: [{ kind: "text", text: "行" }], idx: 21 },
        { kind: "digest", status: "end", ok: true, ms: 500, idx: 22 },
        { kind: "assistant", text: "后", idx: 30, timestamp: 2 },
      ],
      hasOlder: false, next: null, meta: {}, flags: null, queue: null,
    }
    const s5 = pageRead.applyPage(baseState(), receipt, { key: KEY, before: null })
    const root2 = new FakeNode("div")
    root2.__connected = true
    const m5 = mount(root2, s5)
    const el2 = directRounds(root2)[0]
    const sBlocks = directBlocks(root2)
    const subAt = sBlocks.findIndex((node) => node.getAttribute("data-block-kind") === "subagent")
    assert.ok(subAt >= 0, "径3：复列含归档块")
    assert.equal(Math.abs(indexOf(root2, el2) - indexOf(root2, sBlocks[subAt])), 1, "径3：复列 ⇒ 与归档块相邻（绝不流首/中段）")
    const s6 = { ...s5, blocks: [...s5.blocks, { kind: "assistant", text: "新", at: 40 }] }
    frame(root2, s6, "append", chatStream.alignPlan(m5.mounted, s6.blocks, false, 0), m5.mounted)
    assert.equal(directRounds(root2)[0], el2, "后续动作：元素身份存续")
    assert.equal(Math.abs(indexOf(root2, el2) - indexOf(root2, directBlocks(root2)[subAt])), 1, "后续动作：相邻序保持（零漂）")
    // 径 3b：复列·混窗剖面（已标前缀 + 未标运行期尾段 —— 真机 109/150 同形）⇒ 轮不落首枚未标块之前
    {
      const root3 = new FakeNode("div")
      root3.__connected = true
      const pre = { kind: "assistant", text: "前", at: 100 }
      const liveSub = { kind: "subagent", meta: { ...SUB_META }, rows: [{ kind: "text", text: "行" }] }
      const after = { kind: "assistant", text: "后" }
      const s7 = baseState({ blocks: [pre, liveSub, after], digest: { [KEY]: [{ status: "end", ok: true, ms: 500, n: 1, at: 500 }] } })
      mount(root3, s7)
      const rounds3 = directRounds(root3)
      const blocks3 = directBlocks(root3)
      assert.equal(rounds3.length, 1, "径3b 在位")
      assert.ok(indexOf(root3, rounds3[0]) > indexOf(root3, blocks3[blocks3.length - 1]), "径3b 复列·混窗：落尾（不落流首/中段）")
    }
  })
})
