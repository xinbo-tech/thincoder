/**
 * 2026-10-01-desktop-digest-teardown.test.mjs — 批次本地单元件（台账 #765 · 桌面消化痕彻底拆批 · 实施轮）·
 * 任务书 = `docs/batches/2026-10-01-desktop-digest-teardown.md` §2「基础重裁块」（单源）∥ §2「副本面清面轮」。
 * 七腿（腿集单表 —— 批档 §2 为准）：
 *   1 **单元素生命周期**——建 ≤2 行 ∥ 幂等零写同节点 ∥ 终态就地换文 ∥ 终态非 ask 标签退场 ∥ 新轮起跑 ⇒ 旧行真摘除（`parentNode === null`）+ 新节点
 *   2 **专用机制零存**（grep 零命中——点名面；射击面 = `thincoder-desktop/renderer/**`；详注见件内）
 *   3 **重挂复列末条 + 稳态序**——折出轮 ≤1 行 ∥ 重建轮于记录位次（重放序）∥ 重建径 [行族][归档块] ∥ 首帧后稳态
 *   4 **归档居其后 + 迟到退化**——真帧路：同帧批内到达序（行族出生先于补发块）∥ 多枚到达序 ∥ 下一帧对齐 `ok` ∥ 迟到 ⇒ 随到入流
 *   5 **记录面负向锁**——三型轮记录全量 ∥ 折出面 ∥ 宿主记录件零触（写点在盘——负向锁）
 *   6 **零面锁 + 懒加载径**——座次/锚/位次/族键零存（本轮集原引用 ∥ 节点零位置标）∥ 前插一页：块序仍 ⇔ 记录序 ∥ 行族与其归档块相对序不变 ∥ 行族零动——零算术
 *   7 **全流序对账**（恢复序 ≡ 记录序）——记录序列 → `chatTree` 文档序块序 ⇔ 记录序；白名单两档（族内压缩 ∥ 跨页丢轮）
 * 随批留存 · 不进仓套件（全清令：仓套件不写 ∕ 不改 ∕ 不跑）。
 * ⚠ 断代（2026-10-01 · 台账 #768 消化行自然形收正批）：腿 1 ∕ 3 ∕ 4 ∕ 6 = 已退场语义（终态就地换文 ∥ 标签退场 ∥ 换代摘除 ∥ 折出轮 ≤1）；驱动面 `paintPlan` ∕ `alignPlan` 已随流面重写（#764）退场 ⇒ **复跑必红为预期（留档对照 · 勿复跑）**；新口径 = `docs/batches/2026-10-01-digest-rows-natural-form.test.mjs`（八腿）。
 * 复跑（cwd = 仓库根，即含 `thincoder-core/` 的目录）：node --test docs/batches/2026-10-01-desktop-digest-teardown.test.mjs
 * 纪律：行为断言优先（真归约体 ∥ 真帧路 ∥ 真驱动装配）；真机一条 = 父侧闭合（D16 义务）——本档只落机检面。
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

const [wake, pageRead, i18n, i18nCore, chat, chatModel, chatStream, chatTree, rowsMod, subagentReduce, driveMod] = await Promise.all([
  mod("thincoder-desktop/renderer/events-wake.mjs"), // `ev:digest` ∥ `ev:susp` 归约（只留当轮 ∥ 零位置面）
  mod("thincoder-desktop/renderer/page-read.mjs"), // 页读径（折叠末条 ∥ 记录序块序 ∥ 前插零算术）
  mod("thincoder-desktop/renderer/i18n.mjs"), // 词面投影（t）
  mod("thincoder-core/i18n.mjs"), // 核字典投影（词面单源）
  mod("thincoder-desktop/renderer/views/chat.mjs"), // 挂载 ∥ 帧尾六步（真路：入流步 ∥ 尾段挂载）
  mod("thincoder-desktop/renderer/views/chat-model.mjs"), // 帧模型
  mod("thincoder-desktop/renderer/views/chat-stream.mjs"), // 对齐步
  mod("thincoder-desktop/renderer/views/chat-tree.mjs"), // 构树面（记录序复列）
  mod("thincoder-desktop/renderer/views/chat-digest-rows.mjs"), // 单档（行集 ∥ 帧刷 ∥ 清点）
  mod("thincoder-desktop/renderer/subagent-reduce.mjs"), // 子 agent 归约径（归档 = 到达序普通块）
  mod("thincoder-desktop/src/main/suspension-drive.mjs"), // 挂起驱动（起跑窗 —— 帧序实证面）
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

// ─── 假 DOM（属性 ∕ 选择器 ∕ 结构 —— 沿 `2026-10-01-digest-row-current-only.test.mjs` 先例）──────────

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

const SCROLL = { readMetrics: () => ({ scrollTop: 0, scrollHeight: 1000, clientHeight: 200 }) }
const SUB_META = { key: "sub:explore#1", label: "sub:explore#1", role: "explore", id: 1, pool: true, status: "done", frozen: true, startedAt: 0, doneAt: 1500 }

const baseState = (over = {}) => ({
  activeSession: KEY, blocks: [], digest: {}, subBlocks: {},
  pool: { running: 0, approval: 0, queue: [], approvals: [] },
  following: true, pendingNew: 0, history: {}, project: { cwd: "/p" }, ...over,
})
const pageState = (over = {}) => ({
  activeSession: KEY, blocks: [], digest: {}, stopMark: {}, timerNotice: {}, compress: {}, helpLines: {}, sessionMeta: {},
  following: false, pendingNew: 0, ...over,
})
const rowsOf = (root) => root.childNodes.filter((node) => node instanceof FakeNode && node.getAttribute("data-digest") !== null)
const blocksOf = (root) => root.childNodes.filter((node) => node instanceof FakeNode && node.getAttribute("data-block-kind") !== null)
const indexOf = (root, node) => root.childNodes.indexOf(node)
const mount = (root, state, limit) => chat.mountChat(root, state, {}, limit)
const modelOf = (state) => chatModel.chatModel(state)
const liveRound = (over = {}) => ({ status: "start", n: 2, tier: null, from: null, msg: null, ...over })
const endRound = (over = {}) => ({ status: "end", n: 2, tier: null, from: null, msg: null, ok: true, ms: 900, ...over })
/** 真帧路（镜像 `renderer/app.mjs` `paintChat`：帧前判据 ⇒ 对齐步 ⇒ 帧尾六步；`align.ok` 断言 = 硬化「腿断言 ⇒ 真径」链）。 */
const frame = (root, prev, next, mounted = []) => {
  const plan = chatStream.paintPlan({ prev, next, changedKeys: [] })
  const model = modelOf(next)
  const tailExempt = plan.tier === "patch" || plan.tier === "patch-append" ? plan.tier : false
  const align = chatStream.alignPlan(mounted, model.blocks, tailExempt, plan.appended ?? 0)
  assert.equal(align.ok, true, "对齐步成立（ok 假 ⇒ 真路走重挂径 —— 本件只断言增量径）")
  return chat.settleFrame(root, model, SCROLL, align, plan.tier, {}, mounted)
}

// ─── 腿 1：单元素生命周期（已退场 —— #768；新口径 = 新批件腿 ①②③） ─────────────────────────────────────

test("腿 1·单元素生命周期：建 ≤2 行 ∥ 幂等零写同节点 ∥ 终态就地换文 ∥ 终态非 ask 标签退场 ∥ 新轮起跑旧行真摘除", async () => {
  // 1a 行集形（纯构树 —— 单轮 ≤3 行；起跑态 ≤2）
  assert.equal(rowsMod.digestRows(liveRound({ n: 2 })).length, 2, "起跑 n=2：标签行 + 计数行")
  assert.equal(rowsMod.digestRows(liveRound({ n: 0 })).length, 1, "起跑 n=0：仅标签行（幻影计数行禁出）")
  const endRows = rowsMod.digestRows(endRound({ n: 2 }))
  assert.equal(endRows.length, 1, "终态非 ask：标签行退场 ⇒ 仅计数行")
  assert.ok(endRows[0].props["data-digest-count"] !== undefined, "余行 = 计数行")
  assert.equal(rowsMod.digestRows(endRound({ n: 0 })).length, 0, "终态非 ask n=0：零行")
  assert.equal(rowsMod.digestRows(endRound({ n: 1, tier: "ask", from: "a", msg: "b" })).length, 2, "ask 档终态：标签行保留")
  assert.equal(rowsMod.digestRows({ ...endRound({ n: 1 }), cap: { mode: "auto", turns: 3 } }).length, 2, "cap 行跨 end 存续")

  // 1b DOM 生命周期（真帧路）
  await withFakeDom(async () => {
    zh()
    const root = new FakeNode("div")
    root.__connected = true
    const b0 = { kind: "assistant", text: "轮内", id: "k1" }
    const r1 = liveRound({ n: 2 })
    const s1 = baseState({ blocks: [b0], digest: { [KEY]: [r1] } })
    const m1 = mount(root, s1)
    const first = rowsOf(root)
    assert.equal(first.length, 2, "首轮行族 = 2 行（≤2）")
    // 幂等：同态帧零写（同节点存续）
    const m2 = frame(root, s1, s1, m1.mounted)
    assert.equal(rowsOf(root)[0], first[0], "幂等：标签行同节点存续（零写）")
    assert.equal(rowsOf(root)[1], first[1], "幂等：计数行同节点存续（零写）")
    // 终态就地换文（非 ask：标签行退场）
    const r1end = { ...r1, status: "end", ok: true, ms: 900 }
    const s2 = baseState({ blocks: [b0], digest: { [KEY]: [r1end] } })
    const m3 = frame(root, s1, s2, m2)
    const after = rowsOf(root)
    assert.equal(after.length, 1, "终态非 ask：在场 1 行")
    assert.equal(first[0].parentNode, null, "标签行真退场（parentNode === null）")
    assert.equal(after[0], first[1], "计数行同节点存续（就地换文）")
    assert.ok(after[0].getAttribute("class").includes("digest-done"), "换文 class = digest-done")
    // 新轮起跑（轮对象引用变）⇒ 旧行真摘除 + 新节点
    const r2 = liveRound({ n: 1 })
    const s3 = baseState({ blocks: [b0], digest: { [KEY]: [r2] } })
    const m4 = frame(root, s2, s3, m3)
    const fresh = rowsOf(root)
    assert.equal(after[0].parentNode, null, "旧行真摘除（parentNode === null）")
    assert.equal(fresh.length, 2, "新轮行族 = 2 行")
    assert.notEqual(fresh[0], first[0], "新节点（非复用）")
    assert.notEqual(fresh[1], after[0], "新节点（非复用）")
    assert.ok(fresh.every((row) => row._digestRound === r2), "新行归属本轮（轮对象引用对位）")
    assert.equal(m4.length, 1, "块记账随帧")
    // 轮集空（显式空数组 —— 防守档）⇒ 摘全行；非 live 面（null）⇒ 零动作（禁对 `none` 帧摘除）
    rowsMod.syncDigest(root, { digest: null, blocks: [b0] }, null)
    assert.equal(rowsOf(root).length, 2, "非数组 ⇒ 零动作（不误摘）")
    rowsMod.syncDigest(root, { digest: [], blocks: [b0] }, null)
    assert.equal(rowsOf(root).length, 0, "模型轮集空 ⇒ 摘全行")
  })
})

// ─── 腿 2：专用机制零存（grep 零命中）────────────────────────

test("腿 2·专用机制零存：射击面 grep 零命中 + 文件名校验", () => {
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
  const files = walk("")
  // 文件名校验（`/seat|座次|追位/` 零命中 —— 全档面）
  for (const file of files) assert.ok(!/seat|座次|追位/.test(file), `文件名零命中：${file}`)
  assert.ok(existsSync(join(dir, "views/chat-digest-rows.mjs")), "新单档在场（views/chat-digest-rows.mjs）")
  assert.equal(existsSync(join(dir, "views/chat-digest.mjs")), false, "旧档已删（views/chat-digest.mjs）")
  assert.equal(existsSync(join(dir, "views/chat-digest-seat.mjs")), false, "旧档已删（改名件）")
  // 内容扫描（点名面 —— 终形随推导定；射击面 = renderer/**）
  const TERMS = [
    "座次", "seat", "追位", "_digestAt", "_digestRid", "nodeAt", "nodeRid", "familyKeyOf", "nodeFamilyKey",
    "_digestBoundary", "DigestBoundary", "boundaryRowOf", "archiveInsertPointOf", "shiftKept", "rebaseKept",
    "_blockSeat", "_blockAt", "_digestGraduated", "毕业", "插入点特例", "随窗", "边界物",
  ]
  const hits = []
  const allowed = []
  for (const file of files.filter((f) => /\.(mjs|css|html)$/.test(f))) {
    const lines = readFileSync(join(dir, file), "utf8").split("\n")
    for (let i = 0; i < lines.length; i += 1) {
      for (const term of TERMS) {
        if (!lines[i].includes(term)) continue
        // `随窗` 唯一列外：`chrome.css`「窗体宽」异义（与消化窗无涉——域内唯一成列）；除它一律零
        if (term === "随窗" && file === "chrome.css") allowed.push(`${file}:${i + 1}`)
        else hits.push(`${file}:${i + 1} [${term}]`)
      }
    }
  }
  assert.deepEqual(hits, [], "点名面零命中（专用机制零存）")
  assert.ok(allowed.every((hit) => hit === "chrome.css:37"), "`随窗` 列外仅限 chrome.css:37（窗体宽义；异义新增即红）")
  // 本族档面「随窗」硬零（列外不适用）
  const SCOPED = [
    "events-wake.mjs", "subagent-reduce.mjs", "page-read.mjs",
    "views/chat.mjs", "views/chat-tree.mjs", "views/chat-chrome.mjs", "views/chat-digest-rows.mjs",
  ]
  for (const file of SCOPED) {
    assert.ok(!readFileSync(join(dir, file), "utf8").includes("随窗"), `随窗零命中（本族档面）：${file}`)
  }
})

// ─── 腿 3：重挂复列末条 + 稳态序（已退场 —— #768；新口径 = 新批件腿 ④⑤） ─────────────────────────────

test("腿 3·重挂复列末条 + 稳态序：折出轮 ≤1 行 ∥ 重建轮记录位次 ∥ [行族][归档块] ∥ 首帧后稳态", async () => {
  // 3a 折出末条（记录序复列数据面 —— 复列最新一条）
  const receipt = {
    ok: true,
    messages: [
      { kind: "assistant", text: "前", idx: 10, timestamp: 1 },
      { kind: "digest", status: "start", n: 2, tier: null, idx: 20 },
      { kind: "assistant", text: "轮内", idx: 21, timestamp: 2 },
      { kind: "digest", status: "end", ok: true, ms: 500, idx: 22 },
      { kind: "digest", status: "start", n: 1, tier: null, idx: 30 },
      { kind: "assistant", text: "内容A", idx: 32, timestamp: 3 },
      { kind: "digest", status: "end", ok: true, ms: 800, idx: 34 },
      { kind: "subagent", meta: { ...SUB_META }, rows: [{ kind: "text", text: "行" }], idx: 36 },
    ],
    hasOlder: false, next: null, meta: {}, flags: null, queue: null,
  }
  const s1 = pageRead.applyPage(pageState(), receipt, { key: KEY, before: null })
  assert.equal(s1.digest[KEY].length, 1, "复列最新一条：页内两完整轮 ⇒ 只产末条")
  assert.equal(s1.digest[KEY][0].at, 30, "末条 = 第二轮（位次 = 其起跑记录 idx）")
  assert.equal("endAt" in s1.digest[KEY][0], false, "折出轮零携终态位次（位置面标随拆净）")
  assert.equal(s1.blocks.length, 4, "块序 = 记录序（四块 —— 归档块原位）")
  assert.equal(s1.blocks[3].kind, "subagent", "第四块 = 归档块（记录序：起跑记录之后）")

  // 3b 重挂：重建轮于记录位次复列（重放序）+ [行族][归档块]
  await withFakeDom(async () => {
    zh()
    const root = new FakeNode("div")
    root.__connected = true
    const m1 = mount(root, s1)
    const rows = rowsOf(root)
    const blocks = blocksOf(root)
    assert.equal(rows.length, 1, "折出轮 = 终态非 ask ⇒ 仅计数行（≤1）")
    assert.equal(blocks.length, 4, "块四枚（对齐步记账不破）")
    assert.ok(indexOf(root, rows[0]) > indexOf(root, blocks[1]), "行族居记录位次（轮内块 at=21 之后）")
    assert.ok(indexOf(root, rows[0]) < indexOf(root, blocks[2]), "行族居内容A 块之前（末条轮 at=30 < 32）")
    assert.ok(indexOf(root, rows[0]) < indexOf(root, blocks[3]), "重建径 [行族][归档块]（归档块不搬移）")
    // 3c 稳态：首帧（帧刷）之后 —— 行族仍居其归档块之前（同节点）
    const m2 = frame(root, s1, s1, m1.mounted)
    assert.equal(rowsOf(root)[0], rows[0], "稳态：行族同节点存续")
    assert.ok(indexOf(root, rowsOf(root)[0]) < indexOf(root, blocksOf(root)[3]), "稳态：行族仍居归档块之前")
    void m2
  })
})

// ─── 腿 4：归档居其后 + 迟到退化（真帧路）（已退场 —— #768〔驱动面随 #764 退场〕；归档 ∥ 迟到面语义保持〔#746 判句〕）────────────────────

test("腿 4·归档居其后 + 迟到退化：同帧批到达序 ∥ 多枚 ∥ 下一帧对齐 ok ∥ 迟到随到入流", async () => {
  // 4a 模型面：起跑帧 + 补发 done 同批 ⇒ 归档块（到达序普通块）
  const b0 = { kind: "assistant", text: "前", id: "b0" }
  const s0 = baseState({ blocks: [b0] })
  let st = wake.onDigest(s0, { key: KEY, status: "start", n: 2 })
  st = subagentReduce.onSubagent(st, { key: KEY, role: "subagent", id: 7, status: "started" }, 0)
  st = subagentReduce.onSubagent(st, { key: KEY, role: "subagent", id: 7, status: "settled" }, 0)
  st = subagentReduce.onSubagent(st, { key: KEY, role: "subagent", id: 7, status: "done" }, 0)
  assert.equal(st.blocks.length, 2, "归档块入模（普通块 —— 尾追）")
  assert.equal(st.blocks[1].kind, "subagent", "第二枚 = 归档块")
  assert.equal("seat" in st.blocks[1], false, "流内归档块零位置标")

  await withFakeDom(async () => {
    zh()
    const root = new FakeNode("div")
    root.__connected = true
    const m1 = mount(root, s0) // 起稿：无轮无归档
    const m2 = frame(root, s0, st, m1.mounted) // 真帧：同批（start 帧 + 补发块）
    const rows = rowsOf(root)
    const blocks = blocksOf(root)
    assert.equal(rows.length, 2, "行族在场（标签 + 计数）")
    assert.equal(blocks.length, 2, "块两枚")
    assert.ok(indexOf(root, rows[1]) < indexOf(root, blocks[1]), "回收块居族后（同帧到达序：行族出生先于补发块）")
    // 下一帧对齐 ok（模型序 ≡ DOM 序）——帧路自断言 align.ok；再核块序
    const m3 = frame(root, st, st, m2)
    assert.deepEqual(blocksOf(root).map((node) => node.getAttribute("data-block-kind")), ["assistant", "subagent"], "块序 = 模型序")
    assert.ok(indexOf(root, rowsOf(root)[0]) < indexOf(root, blocksOf(root)[1]), "稳态：行族居归档块之前")
    // 4b 多枚到达序（后续批）
    let st2 = subagentReduce.onSubagent(st, { key: KEY, role: "subagent", id: 8, status: "started" }, 0)
    st2 = subagentReduce.onSubagent(st2, { key: KEY, role: "subagent", id: 8, status: "settled" }, 0)
    st2 = subagentReduce.onSubagent(st2, { key: KEY, role: "subagent", id: 8, status: "done" }, 0)
    const m4 = frame(root, st, st2, m3)
    const blocks2 = blocksOf(root)
    assert.equal(blocks2.length, 3, "第二枚归档块入流")
    assert.ok(indexOf(root, rowsOf(root)[1]) < indexOf(root, blocks2[1]), "多枚到达序：皆居族后（第一枚）")
    assert.ok(indexOf(root, blocks2[1]) < indexOf(root, blocks2[2]), "多枚到达序：逐枚落于前枚之后")
    // 4c 迟到 ⇒ 随到入流（退化档：行族已立定，迟到块尾追——零回贴）
    let st3 = subagentReduce.onSubagent(st2, { key: KEY, role: "subagent", id: 9, status: "started" }, 0)
    st3 = subagentReduce.onSubagent(st3, { key: KEY, role: "subagent", id: 9, status: "settled" }, 0)
    const m5 = frame(root, st2, st3, m4) // 迟到块起稿帧（未归档）
    let st4 = subagentReduce.onSubagent(st3, { key: KEY, role: "subagent", id: 9, status: "done" }, 0)
    const m6 = frame(root, st3, st4, m5) // 迟到 done ⇒ 归档块随到入流（尾追）
    const blocks3 = blocksOf(root)
    assert.equal(blocks3.length, 4, "迟到块入流")
    assert.ok(indexOf(root, blocks3[3]) > indexOf(root, rowsOf(root)[1]), "迟到 ⇒ 随到入流（族之后 —— 不回贴族旁）")
  })
})

// ─── 腿 5：记录面负向锁 ─────────────────────────────────────

test("腿 5·记录面负向锁：三型轮记录全量 ∥ 折出面 ∥ 宿主记录件零触", async () => {
  // 5a 归约面：起跑轮记录键面（零位置面）；三型就末轮更新；切片恒 1
  let st = { digest: {}, blocks: [] }
  st = wake.onDigest(st, { key: KEY, status: "start", n: 2 })
  const r1 = st.digest[KEY][0]
  assert.deepEqual(Object.keys(r1).sort(), ["from", "msg", "n", "status", "tier"], "起跑轮记录键面 = { status, n, tier, from, msg }")
  st = wake.onDigest(st, { key: KEY, status: "cap", mode: "stop", turns: 2 })
  st = wake.onDigest(st, { key: KEY, status: "end", ok: true, ms: 900 })
  assert.equal(st.digest[KEY].length, 1, "三型轮记录就末轮更新（切片恒 1 —— 只留当轮）")
  const endst = st.digest[KEY][0]
  assert.deepEqual(endst.cap, { mode: "stop", turns: 2 }, "cap 事实跨 end 存续")
  assert.deepEqual(Object.keys(endst).sort(), ["cap", "from", "ms", "msg", "n", "ok", "status", "tier"], "终态轮键面（零位置面）")
  assert.equal(r1.n, 2, "起跑 n 保留（终态句需 n）")
  // 5b 折出面：末条 + 键面（`at` = 唯一位次读面；无 `endAt` ∥ 无位置面标）
  const s1 = pageRead.applyPage(pageState(), {
    ok: true,
    messages: [
      { kind: "digest", status: "start", n: 1, tier: null, idx: 30 },
      { kind: "digest", status: "end", ok: true, ms: 800, idx: 34 },
    ],
    hasOlder: false, next: null, meta: {}, flags: null, queue: null,
  }, { key: KEY, before: null })
  assert.deepEqual(Object.keys(s1.digest[KEY][0]).sort(), ["at", "from", "ms", "msg", "n", "ok", "status", "tier"], "折出轮键面（含位次 at；零运行期面标）")
  // 5c 驱动面（真装配）：起跑帧载荷键面 + 人读线记录入档（appendRecord 落写点）
  const log = []
  const agent = {
    title: "t", cwd: null, _slot: 1,
    _asyncSubagents: new Map([["s1", { status: "running" }]]), _asyncAdvisors: new Map(), _consultSessions: new Map(),
    _pendingAsyncResults: [{ role: "subagent", id: 7 }],
    provider: { name: "vis", model: "m" }, config: { locale: "zh" }, memory: { db: null }, history: [], _fullHistory: [],
  }
  const drive = driveMod.createSuspensionDrive({
    post: (ch, payload) => log.push({ type: "post", ch, payload }),
    runTurn: (key, agent1) => { agent1._pendingAsyncResults.splice(0); return Promise.resolve() },
    timer: () => ({ unref() {} }), clear: () => {},
  })
  assert.equal(drive.start(KEY, agent, { cwd: "/p" }), true, "入窗")
  await until(() => log.some((row) => row.type === "post" && row.ch === "ev:digest" && row.payload.status === "start"))
  const startRow = log.find((row) => row.type === "post" && row.ch === "ev:digest" && row.payload.status === "start")
  assert.deepEqual(Object.keys(startRow.payload).sort(), ["key", "n", "status"], "起跑帧载荷键面（零位置面）")
  assert.ok(agent._fullHistory.some((record) => record?.kind === "digest" && record?.status === "start"), "起跑记录入人读线（appendRecord）")
  // 5d 宿主记录件零触（负向锁：三型写点在盘 —— 记录面零动）
  const main = (name) => readFileSync(join(ROOT, "thincoder-desktop/src/main", name), "utf8")
  assert.ok(main("suspension-drive.mjs").includes('appendRecord(agent, { kind: "digest", ...start })'), "宿主起跑记录写点在场")
  assert.ok(main("turn-face.mjs").includes('appendRecord(agent, { kind: "digest", status: "end", ok, ms })'), "宿主终态记录写点在场")
  assert.ok(main("turn-face.mjs").includes('appendRecord(agent, { kind: "digest", status: "cap"'), "宿主撞帽记录写点在场")
  assert.ok(main("session-io.mjs").includes("export function appendRecord"), "记录追加薄壳在场")
})

// ─── 腿 6：零面锁 + 懒加载径（已退场 —— #768；懒加载径语义保持——窗口即窗口〔新批件腿 ⑤ 对位〕） ─────────────────────────────────

test("腿 6·零面锁 + 懒加载径：前插一页零算术 ∥ 块序仍 ⇔ 记录序 ∥ 行族相对序不变 ∥ 行族零动", async () => {
  // 6a 前插零算术（模型面）：现轮集非空 ⇒ 原引用（零位移）；块 = 页块前插
  const live = liveRound({ n: 2 })
  const keep = baseState({ blocks: [{ kind: "assistant", text: "今", at: 90 }], digest: { [KEY]: [live] } })
  const back = pageRead.applyPage(keep, {
    ok: true,
    messages: [
      { kind: "assistant", text: "旧", idx: 10, timestamp: 1 },
      { kind: "digest", status: "start", n: 1, tier: null, idx: 20 },
      { kind: "assistant", text: "旧内容", idx: 21, timestamp: 2 },
      { kind: "digest", status: "end", ok: true, ms: 500, idx: 22 },
    ],
    hasOlder: true, next: 5, meta: {}, flags: null, queue: null,
  }, { key: KEY, before: 9 })
  assert.equal(back.digest, keep.digest, "前插零算术：轮集原引用（零位移）")
  assert.deepEqual(back.blocks.map((b) => b.text), ["旧", "旧内容", "今"], "块序 = 记录序（页块前插）")

  // 6b 懒加载径（DOM）：行族与其归档块相对序不变 ∥ 行族零动（起稿走真活流路：出生帧 ⇒ 归档帧）
  await withFakeDom(async () => {
    zh()
    const b0 = { kind: "assistant", text: "今", id: "b0", at: 90 }
    const root = new FakeNode("div")
    root.__connected = true
    const s0 = baseState({ blocks: [b0] })
    const m0 = mount(root, s0) // 起稿：无轮无归档
    const s1 = wake.onDigest(s0, { key: KEY, status: "start", n: 2 }) // 行族出生（流末）
    const m1 = frame(root, s0, s1, m0.mounted)
    let st = subagentReduce.onSubagent(s1, { key: KEY, role: "subagent", id: 7, status: "started" }, 0)
    st = subagentReduce.onSubagent(st, { key: KEY, role: "subagent", id: 7, status: "settled" }, 0)
    st = subagentReduce.onSubagent(st, { key: KEY, role: "subagent", id: 7, status: "done" }, 0) // 归档块随后到达
    const m2 = frame(root, s1, st, m1)
    const rowNodes = rowsOf(root)
    assert.equal(rowNodes.length, 2, "起稿：行族两行（到达序出生）")
    assert.ok(indexOf(root, rowNodes[1]) < indexOf(root, blocksOf(root)[1]), "起稿：行族居其归档块之前（到达序）")
    // 懒加载：前插一页（含历史消化记录 —— 现轮集优先 ⇒ 折叠不并入）
    const back2 = pageRead.applyPage(st, {
      ok: true,
      messages: [
        { kind: "assistant", text: "旧", idx: 10, timestamp: 1 },
        { kind: "digest", status: "start", n: 1, tier: null, idx: 20 },
        { kind: "digest", status: "end", ok: true, ms: 500, idx: 22 },
      ],
      hasOlder: true, next: 5, meta: {}, flags: null, queue: null,
    }, { key: KEY, before: 9 })
    assert.equal(back2.digest, st.digest, "懒加载：轮集零动（原引用 —— 零算术）")
    const m3 = frame(root, st, back2, m2)
    assert.equal(rowsOf(root)[0], rowNodes[0], "行族零动（同节点 ∥ 零搬移）")
    assert.equal(rowsOf(root)[1], rowNodes[1], "行族零动（同节点）")
    assert.ok(indexOf(root, rowsOf(root)[1]) < indexOf(root, blocksOf(root)[2]), "行族与其归档块相对序不变")
    assert.deepEqual(blocksOf(root).map((node) => node.getAttribute("data-block-kind")), ["assistant", "assistant", "subagent"], "块序仍 ⇔ 记录序（页块前插 —— 归档块原位）")
    // 零面锁：节点零位置标（迁移面零存 —— 帧层也不再写位次 ∥ 座次段标）
    for (const node of [...blocksOf(root), ...rowsOf(root)]) {
      assert.equal("_blockAt" in node, false, "零 `_blockAt` 记账")
      assert.equal("_blockSeat" in node, false, "零 `_blockSeat` 记账")
      assert.equal("_digestAt" in node, false, "零 `_digestAt` 标")
      assert.equal("_digestRid" in node, false, "零 `_digestRid` 标")
      assert.equal("_digestBoundary" in node, false, "零 `_digestBoundary` 标")
    }
    void m3
  })
})

// ─── 腿 7：全流序对账（恢复序 ≡ 记录序）──────────────────────

test("腿 7·全流序对账：记录序列 → chatTree 文档序块序 ⇔ 记录序（白名单两档）", async () => {
  const messages = [
    { kind: "user", text: "U1", idx: 2, timestamp: 1 },
    { kind: "assistant", text: "A1", idx: 4, timestamp: 2 },
    { kind: "digest", status: "start", n: 2, tier: null, idx: 6 },
    { kind: "assistant", text: "A2", idx: 8, timestamp: 3 },
    { kind: "subagent", meta: { ...SUB_META }, rows: [], idx: 10 }, // 归档块（记录序居起跑之后）
    { kind: "digest", status: "end", ok: true, ms: 500, idx: 12 },
    { kind: "user", text: "U2", idx: 14, timestamp: 4 },
  ]
  const s = pageRead.applyPage(pageState(), { ok: true, messages, hasOlder: false, next: null, meta: {}, flags: null, queue: null }, { key: KEY, before: null })
  // 期望块序 = 记录序（去 digest 记录；白名单①族内压缩：折出轮折入行族——不产块）
  const expect = messages.filter((m) => m.kind !== "digest").flatMap((m) => pageRead.blockOfMessage(m))
  assert.deepEqual(s.blocks.map((b) => b.text ?? b.kind), expect.map((b) => b.text ?? b.kind), "模型块序 = 记录序")
  await withFakeDom(async () => {
    zh()
    const model = modelOf(s)
    const tree = chatTree.chatTree(model, {})
    const root = build(tree)
    // 文档序：块节点 + 行族节点（混排）
    const order = [...root.querySelectorAll("[data-block-kind],[data-digest]")]
    const seq = order.map((node) => (node.getAttribute("data-digest") !== null ? "digest" : node.getAttribute("data-block-kind")))
    assert.deepEqual(seq, ["user", "assistant", "digest", "assistant", "subagent", "user"], "文档序：行族居其记录位次（A1 之后、A2 之前）")
    assert.ok(indexOfIn(order, "digest") < order.findIndex((node) => node.getAttribute("data-block-kind") === "subagent"), "[行族][归档块]（记录序）")
    assert.equal(s.digest[KEY].length, 1, "折出轮 ≤1（只留当轮）")
  })
  // 白名单②跨页丢轮：起跑未载 ⇒ 该轮零产（零并轮零借位）；块不受影响
  const trunc = pageRead.applyPage(pageState(), {
    ok: true,
    messages: [{ kind: "digest", status: "end", ok: true, ms: 100, idx: 40 }, { kind: "assistant", text: "B", idx: 42, timestamp: 5 }],
    hasOlder: false, next: null, meta: {}, flags: null, queue: null,
  }, { key: KEY, before: null })
  assert.equal(trunc.digest[KEY], undefined, "跨页丢轮：起跑未载 ⇒ 该轮本页零产")
  assert.deepEqual(trunc.blocks.map((b) => b.text), ["B"], "跨页丢轮：块面零扰")
})

/** 序号查找（腿 7 内联用）。 */
function indexOfIn(list, mark) {
  return list.findIndex((node) => (node.getAttribute("data-digest") !== null ? "digest" : node.getAttribute("data-block-kind")) === mark)
}

/** 描述符建树（假 DOM 下 —— `renderer/dom.mjs` `build` 经 `document.createElement`）。 */
function build(node) {
  const el = document.createElement(node.tag)
  for (const [key, value] of Object.entries(node.props ?? {})) {
    if (key === "html") continue
    if (value === true) el.setAttribute(key, "")
    else if (value !== false && value != null) el.setAttribute(key, String(value))
  }
  const list = node.children == null ? [] : Array.isArray(node.children) ? node.children : [node.children]
  for (const child of list) {
    if (child == null) continue
    if (typeof child === "object" && typeof child.tag === "string") el.append(build(child))
    else if (child instanceof FakeNode || child instanceof FakeText) el.append(child)
    else el.append(String(child))
  }
  return el
}
