/**
 * 2026-10-01-digest-rows-natural-form.test.mjs — 批次本地单元件（台账 #768 · 消化行自然形收正批 · 实施轮）·
 * 任务书 = `docs/batches/2026-10-01-digest-rows-natural-form.md` §2 ∥ §4.2（判据载体 = `docs/desktop/design/PROJECT.md`
 * §7「消化行自然形收正批注」八腿）。
 * 八腿（**断代 · 消化重放口径批 · 2026-10-01 · 台账 #771 ∥ #773 收正——腿 ②（`n = 0` 守句）/ 腿 ④（未结轮照现）随新口径翻**；
 *  新口径机检腿 = `docs/batches/2026-10-01-digest-replay-choices.test.mjs`）：
 * **as-of 注（父侧 · 2026-10-04——回填落位批 #910 收口）**：腿 ④ 4e ∥ 腿 ⑤ 5d 已改指**记录序形**（回填 = 整置；`prepend` 退场）；原「复入窗补建 = 流末（到达序）」断言随批撤销。判据单源 = `docs/batches/2026-10-04-digest-reentry-order.md` §2。
 *      ① **行出即留**（多轮串行：各行元素恒转续 ∥ 文 ∥ class 逐值不变；换代零摘除）
 *      ② **终态追加**（`end` ⇒ 终态行（锚 `data-digest-end`——词 = `digest.done` ∕ `digest.aborted`）追加；
 *         原 digesting 行在场且文不变（`digest.start` 逐字）；`n = 0` 轮零计数行 ∥ **零终态行**——守句）
 *      ③ **零就地换文负向锁**（全流程零文本改写已建行 ∥ 零行摘除调用）
 *      ④ **复列全量**（`foldDigest` 多轮产出 + 截断闸 + **未结轮照现**（可证面 = 轮间 ∥ 末页）；并入——折叠轮居前 ∥
 *         现轮集随后；未结轮归属 = 活流侧优先；双份消解 = 结构性——零跨侧去重键）
 *      ⑤ **重载复列**（假 DOM 重建径：全轮行组于其记录位次复列（恢复序 ≡ 记录序）∥ 窗下界之外零复列）
 *      ⑥ **帧刷幂等**（同帧双跑（`settleFrame` 步① + `syncChrome`）零增零改 ∥ 重建后采纳径零重建）
 *      ⑦ **记录面零动负向锁**（三型轮记录逐条全量出帧不变 ∥ `clearDigest` 未结末轮保逐字）
 *      ⑧ **追加径单式**（`start` ∥ `cap` ∥ `end` 三帧皆于当刻流末落位——锚 = `blockAnchor`（尾组 ∥ 卡 ∥ 药丸之前））
 * 随批留存 · 不进仓套件（全清令：仓套件不写 ∕ 不改 ∕ 不跑）。
 * 复跑（cwd = 仓库根，即含 `thincoder-core/` 的目录）：node --test docs/batches/2026-10-01-digest-rows-natural-form.test.mjs
 * 纪律：行为断言优先（真归约体 ∥ 真帧路 ∥ 真构树面）；真机一条 = 父侧闭合（D16 义务）——本档只落机检面。
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

const [wake, pageRead, i18n, i18nCore, chat, chatModel, chatTree, chrome, rowsMod] = await Promise.all([
  mod("thincoder-desktop/renderer/events-wake.mjs"), // `ev:digest` 归约（全轮累积 ∥ 零位置面）
  mod("thincoder-desktop/renderer/page-read.mjs"), // 页读径（复列全量（未结轮照现） ∥ 并入 ∥ 记录序块序）
  mod("thincoder-desktop/renderer/i18n.mjs"), // 词面投影（t）
  mod("thincoder-core/i18n.mjs"), // 核字典投影（词面单源）
  mod("thincoder-desktop/renderer/views/chat.mjs"), // 挂载 ∥ 帧尾六步（真路：入流步 ∥ 尾段挂载）
  mod("thincoder-desktop/renderer/views/chat-model.mjs"), // 帧模型
  mod("thincoder-desktop/renderer/views/chat-tree.mjs"), // 构树面（记录序复列）
  mod("thincoder-desktop/renderer/views/chat-chrome.mjs"), // 帧尾态刷（引调面）
  mod("thincoder-desktop/renderer/views/chat-digest-rows.mjs"), // 行族单档（行集 ∥ 帧刷 ∥ 清点）
])

// ─── 假 DOM（属性 ∕ 选择器 ∕ 结构 —— 沿 `2026-10-01-desktop-digest-teardown.test.mjs` 先例）──────────

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
const pageState = (over = {}) => ({
  activeSession: KEY, blocks: [], digest: {}, stopMark: {}, timerNotice: {}, compress: {}, helpLines: {},
  sessionMeta: {}, following: false, pendingNew: 0, history: { hasOlder: false, inFlight: false }, ...over,
})
const receipt = (messages, over = {}) => ({ ok: true, messages, hasOlder: false, next: null, meta: {}, flags: null, queue: null, ...over })
const liveRound = (over = {}) => ({ status: "start", n: 2, tier: null, from: null, msg: null, ...over })
const endRound = (over = {}) => ({ status: "end", n: 2, tier: null, from: null, msg: null, ok: true, ms: 900, ...over })

const rowsOf = (root) => [...root.querySelectorAll("[data-digest]")]
const blocksOf = (root) => [...root.querySelectorAll("[data-block-kind]")]
const at = (root, node) => root.childNodes.indexOf(node)
const typeOfRow = (row) => ["label", "count", "cap", "end"].find((name) => row.getAttribute(`data-digest-${name}`) !== null) ?? null
/** 真帧路（镜像 `renderer/app.mjs` `paintChat` 结算径）：模型 ⇒ 结算步（入流步 + 帧尾态刷）。 */
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
const freshRoot = () => { const root = new FakeNode("div"); root.__connected = true; return root }

/** 行账采样（腿 ①/③ 用）：首见即记，逐帧比对 —— 新行增、已建行不得改。 */
function rowLedger(root, ledger) {
  for (const row of rowsOf(root)) {
    if (!ledger.some((item) => item.node === row)) ledger.push({ node: row, text: row.textContent, cls: row.getAttribute("class") })
  }
  return ledger
}

// ─── 腿 ①：行出即留 ─────────────────────────────────────────

test("腿 ①·行出即留：多轮串行（各行元素恒转续 ∥ 文 ∥ class 逐值不变；换代零摘除）", async () => {
  // 1a 模型面：`start` 追加本轮（切片全轮累积 —— 旧轮不出模型）
  let st = { digest: {} }
  st = wake.onDigest(st, { key: KEY, status: "start", n: 2 })
  st = wake.onDigest(st, { key: KEY, status: "end", ok: true, ms: 900 })
  st = wake.onDigest(st, { key: KEY, status: "start", n: 1 })
  assert.equal(st.digest[KEY].length, 2, "全轮累积：起跑追加本轮（切片 = […旧轮, 本轮]）")
  assert.equal(st.digest[KEY][0].status, "end", "旧轮在模型（行出即留——零清理）")

  // 1b DOM 面：三轮串行（cap ∥ 失败终态 ∥ 再起跑），全量行车恒转续
  await withFakeDom(async () => {
    zh()
    const root = freshRoot()
    let state = baseState({ blocks: [{ kind: "assistant", text: "轮内", id: "k1" }] })
    let mounted = mount(root, state)
    const ledger = []
    const step = (next) => {
      state = next
      mounted = frame(root, state, mounted)
      rowLedger(root, ledger)
    }
    step(wake.onDigest(state, { key: KEY, status: "start", n: 2 })) // 轮 1：标签 + 计数
    assert.equal(rowsOf(root).length, 2, "轮 1 起跑：两行（标签 ∥ 计数）")
    step(wake.onDigest(state, { key: KEY, status: "cap", mode: "auto", turns: 3 })) // + cap 行
    assert.equal(rowsOf(root).length, 3, "cap 帧：cap 行追加")
    step(wake.onDigest(state, { key: KEY, status: "end", ok: true, ms: 900 })) // + 终态行
    assert.equal(rowsOf(root).length, 4, "end 帧：终态行追加")
    step(wake.onDigest(state, { key: KEY, status: "start", n: 1 })) // 轮 2：旧轮留置
    assert.equal(rowsOf(root).length, 6, "轮 2 起跑：旧轮四行留置 + 新轮两行")
    step(wake.onDigest(state, { key: KEY, status: "end", ok: false, ms: 400 })) // 轮 2 失败终态
    step(wake.onDigest(state, { key: KEY, status: "start", n: 3 })) // 轮 3 起跑
    step(wake.onDigest(state, { key: KEY, status: "end", ok: true, ms: 700 })) // 轮 3 终态
    const rows = rowsOf(root)
    assert.equal(rows.length, 10, "三轮行族全量在流（4 + 3 + 3）")
    assert.equal(ledger.length, rows.length, "行车账 = 在册行（零新生遗漏 ∥ 零摘除）")
    assert.ok(ledger.every((item) => item.node.parentNode !== null), "各行元素恒转续（零摘除——换代零删旧）")
    assert.ok(ledger.every((item) => item.node.textContent === item.text), "逐行文恒值（零就地换文）")
    assert.ok(ledger.every((item) => item.node.getAttribute("class") === item.cls), "逐行 class 恒值")
    assert.deepEqual(rows.map(typeOfRow), ["label", "count", "cap", "end", "label", "count", "end", "label", "count", "end"], "行序 = 到达序（各轮行组按出生序累进）")
  })

  // 1c 同批多轮（帧合并 ⇒ 一跳两轮）：按轮序逐轮于当刻流末出生
  await withFakeDom(async () => {
    zh()
    const root = freshRoot()
    let state = baseState({ blocks: [{ kind: "assistant", text: "轮内", id: "k1" }] })
    let mounted = mount(root, state)
    state = wake.onDigest(state, { key: KEY, status: "start", n: 1 })
    state = wake.onDigest(state, { key: KEY, status: "end", ok: true, ms: 500 })
    state = wake.onDigest(state, { key: KEY, status: "start", n: 2 })
    mounted = frame(root, state, mounted)
    const rows = rowsOf(root)
    assert.equal(rows.length, 5, "一跳两轮：旧轮组（3）+ 新轮组（2）逐轮出生")
    assert.deepEqual(rows.map(typeOfRow), ["label", "count", "end", "label", "count"], "行序 = 轮序（到达序）")
    void mounted
  })

  // 1d 同批合帧（边界轮收梢 + 新轮起跑同批到达）：边界轮收梢行同帧补落 ∥ 新轮出生
  await withFakeDom(async () => {
    zh()
    const root = freshRoot()
    let state = baseState({ blocks: [{ kind: "assistant", text: "轮内", id: "k1" }] })
    let mounted = mount(root, state)
    state = wake.onDigest(state, { key: KEY, status: "start", n: 2 })
    mounted = frame(root, state, mounted)
    assert.equal(rowsOf(root).length, 2, "边界轮起跑：两行在册")
    state = wake.onDigest(state, { key: KEY, status: "end", ok: true, ms: 900 })
    state = wake.onDigest(state, { key: KEY, status: "start", n: 1 }) // 同批（帧合并）
    mounted = frame(root, state, mounted)
    const rows = rowsOf(root)
    assert.equal(rows.length, 5, "单帧：边界轮收梢行同帧补落（3）∥ 新轮出生（2）")
    assert.deepEqual(rows.map(typeOfRow), ["label", "count", "end", "label", "count"], "行序 = 到达序（收梢行居新轮组之前）")
    void mounted
  })
})

// ─── 腿 ②：终态追加 ─────────────────────────────────────────

test("腿 ②·终态追加：`end` ⇒ 终态行（锚 ∥ 词）∥ 原 digesting 行逐字不变 ∥ `n = 0` 轮零计数行 ∥ 零终态行（守句）", async () => {
  // 2a 构树面形（digestRows：标签行恒在；计数行 ⟺ n > 0；终态行 ⟺ end ∧ n > 0）
  assert.equal(rowsMod.digestRows(liveRound({ n: 2 })).length, 2, "起跑 n=2：标签行 + 计数行")
  assert.equal(rowsMod.digestRows(liveRound({ n: 0 })).length, 1, "起跑 n=0：仅标签行（幻影计数行禁出）")
  assert.equal(rowsMod.digestRows(endRound({ n: 0 })).length, 1, "终态 n=0：仅标签行（零计数 ∥ 零终态——守句；新口径收正）")
  assert.equal(rowsMod.digestRows(endRound({ n: 3 })).length, 3, "终态 n=3：标签行 + 计数行 + 终态行")
  assert.equal(rowsMod.digestRows({ ...endRound({ n: 1 }), cap: { mode: "stop", turns: 2 } }).length, 4, "撞帽终态：族内紧邻四行")
  assert.equal(rowsMod.digestRows(endRound({ n: 1, tier: "ask", from: "a", msg: "b" })).length, 3, "ask 档终态：标签行仍在")

  await withFakeDom(async () => {
    zh()
    const root = freshRoot()
    let state = baseState({ blocks: [{ kind: "assistant", text: "轮内", id: "k1" }] })
    let mounted = mount(root, state)
    state = wake.onDigest(state, { key: KEY, status: "start", n: 2 })
    mounted = frame(root, state, mounted)
    const before = rowsOf(root)
    assert.deepEqual(before.map(typeOfRow), ["label", "count"], "起跑两行")

    // 2b 完成终态：终态行追加 ∥ 原行同节点 ∥ 文逐字不变
    state = wake.onDigest(state, { key: KEY, status: "end", ok: true, ms: 900 })
    mounted = frame(root, state, mounted)
    const after = rowsOf(root)
    assert.equal(after.length, 3, "`end` ⇒ 追加一条新行")
    assert.equal(after[0], before[0], "原标签行同节点（不动）")
    assert.equal(after[1], before[1], "原计数行同节点（不动）")
    assert.equal(after[1].textContent, i18n.t("digest.start", { n: 2 }), "计数行恒起跑文（逐字）")
    assert.equal(after[1].getAttribute("class"), "chat-digest digest-status", "计数行 class 恒起跑档")
    assert.equal(after[2].getAttribute("data-digest-end"), "", "终态行锚 = `data-digest-end`")
    assert.equal(after[2].textContent, i18n.t("digest.done", { n: 2, seconds: "0.9" }), "终态行词 = `digest.done`（零新键）")
    assert.ok(after[2].getAttribute("class").includes("digest-done"), "终态行 class = digest-done")
    assert.deepEqual(after.map(typeOfRow), ["label", "count", "end"], "行序 = 标签 → 计数 → 终态")

    // 2c 中断终态：词 = `digest.aborted` ∥ class = digest-failed
    state = wake.onDigest(state, { key: KEY, status: "start", n: 1 })
    mounted = frame(root, state, mounted)
    state = wake.onDigest(state, { key: KEY, status: "end", ok: false, ms: 400 })
    mounted = frame(root, state, mounted)
    const aborted = rowsOf(root).find((row) => row.getAttribute("data-digest-end") !== null && row.textContent.includes("中断"))
    assert.ok(aborted !== undefined, "中断终态行在场")
    assert.equal(aborted.textContent, i18n.t("digest.aborted", { seconds: "0.4" }), "终态行词 = `digest.aborted`")
    assert.ok(aborted.getAttribute("class").includes("digest-failed"), "中断终态行 class = digest-failed")

    // 2d `n = 0` 轮：零计数行 ∥ 零终态行（起跑 ∥ 终态两态皆无——守句；**消化重放口径批 · 2026-10-01 收正**）
    state = wake.onDigest(state, { key: KEY, status: "start", n: 0 })
    mounted = frame(root, state, mounted)
    const zero = rowsOf(root).slice(-1)
    assert.deepEqual(zero.map(typeOfRow), ["label"], "n=0 起跑：仅标签行")
    state = wake.onDigest(state, { key: KEY, status: "end", ok: true, ms: 100 })
    mounted = frame(root, state, mounted)
    assert.deepEqual(rowsOf(root).slice(-1).map(typeOfRow), ["label"], "n=0 终态：仅标签行（零计数 ∥ 零终态——幻影行禁出）")
  })
})

// ─── 腿 ③：零就地换文负向锁 ─────────────────────────────────

test("腿 ③·零就地换文负向锁：全流程零文本改写已建行 ∥ 零行摘除调用", async () => {
  await withFakeDom(async () => {
    zh()
    const root = freshRoot()
    // 探针：假 DOM 原型面记账（行面 —— `[data-digest]`）
    const removals = []
    const textWrites = []
    const isRow = (node) => node instanceof FakeNode && node.getAttribute("data-digest") !== null
    const origRemove = FakeNode.prototype.remove
    const origRemoveChild = FakeNode.prototype.removeChild
    const origReplace = FakeNode.prototype.replaceChildren
    const origDesc = Object.getOwnPropertyDescriptor(FakeNode.prototype, "textContent")
    FakeNode.prototype.remove = function () { if (isRow(this)) removals.push(this); return origRemove.call(this) }
    FakeNode.prototype.removeChild = function (child) { if (isRow(child)) removals.push(child); return origRemoveChild.call(this, child) }
    FakeNode.prototype.replaceChildren = function (...nodes) {
      for (const child of [...this.childNodes]) if (isRow(child)) removals.push(child)
      return origReplace.apply(this, nodes)
    }
    Object.defineProperty(FakeNode.prototype, "textContent", {
      get: origDesc.get,
      set(value) { if (isRow(this)) textWrites.push(this); origDesc.set.call(this, value) },
      configurable: true,
    })
    try {
      let state = baseState({ blocks: [{ kind: "assistant", text: "轮内", id: "k1" }] })
      let mounted = mount(root, state)
      const drive = [
        { status: "start", n: 2 },
        { status: "cap", mode: "stop", turns: 2 },
        { status: "end", ok: true, ms: 900 },
        { status: "start", n: 1 },
        { status: "end", ok: false, ms: 200 },
        { status: "start", n: 0 },
        { status: "end", ok: true, ms: 50 },
      ]
      for (const ev of drive) {
        state = wake.onDigest(state, { key: KEY, ...ev })
        mounted = frame(root, state, mounted)
        chrome.syncChrome(root, chatModel.chatModel(state), {}) // 帧尾态刷显式重跑（幂等面）
      }
      assert.ok(rowsOf(root).length >= 8, "多轮行族在册（流程走全）")
      assert.deepEqual(removals, [], "零行摘除调用（零清理机器）")
      assert.deepEqual(textWrites, [], "零文本改写已建行（行出生即定型）")
    } finally {
      FakeNode.prototype.remove = origRemove
      FakeNode.prototype.removeChild = origRemoveChild
      FakeNode.prototype.replaceChildren = origReplace
      Object.defineProperty(FakeNode.prototype, "textContent", origDesc)
    }
  })
})

// ─── 腿 ④：复列全量（foldDigest ∥ 并入）────────────────────────

test("腿 ④·复列全量：foldDigest 多轮产出 + 截断闸 + 未结轮照现 ∥ 并入（折叠轮居前 ∥ 现轮集随后）", () => {
  // **断代（消化重放口径批 · 2026-10-01 · 台账 #771 ∥ #773 收正）**：本腿原口径「末轮无 `end` 不产」退场 ⇒
  // 未结轮照现（可证面 = 轮间 ∥ 末页；位次门 = `at` 不可得 ⇒ 零产）；并入加未结轮归属（活流侧优先）。
  // 新口径机检腿 = `docs/batches/2026-10-01-digest-replay-choices.test.mjs`（腿 1–3 ∥ 5）。
  const twoRounds = [
    { kind: "digest", status: "start", n: 2, tier: null, idx: 20 },
    { kind: "digest", status: "end", ok: true, ms: 500, idx: 22 },
    { kind: "digest", status: "start", n: 1, tier: null, idx: 30 },
    { kind: "digest", status: "end", ok: true, ms: 800, idx: 34 },
  ]
  // 4a 复列全量（页内两完整轮 + 一轮未结 ⇒ 未结照现——末页可证）
  const s1 = pageRead.applyPage(pageState(), receipt([...twoRounds, { kind: "digest", status: "start", n: 3, tier: null, idx: 40 }]), { key: KEY, before: null })
  assert.equal(s1.digest[KEY].length, 3, "复列全量：两完整轮 + 尾残轮照现（原「末轮无 `end` 不产」退场）")
  assert.deepEqual(s1.digest[KEY].map((round) => round.at), [20, 30, 40], "各轮位次 = 其起跑记录 `idx`")
  assert.notEqual(s1.digest[KEY][2].status, "end", "尾残轮不产终态（照现 = 起跑 ∥ 计数 ∥ cap）")
  assert.equal(s1.blocks.length, 0, "记录不入块序")
  assert.deepEqual(s1.flowOps, [{ kind: "build" }], "首屏径结构作业 = build")

  // 4b 截断闸（起跑未载 ⇒ 该轮本页零产）∥ 尾残轮照现（单轮未结——末页可证）∥ 非末页尾残 ⇒ 零产（容差①）
  const s2 = pageRead.applyPage(pageState(), receipt([
    { kind: "digest", status: "end", ok: true, ms: 100, idx: 40 },
    { kind: "assistant", text: "B", idx: 42 },
  ]), { key: KEY, before: null })
  assert.equal(s2.digest[KEY], undefined, "跨页截断：起跑未载 ⇒ 该轮本页零产")
  const s3 = pageRead.applyPage(pageState(), receipt([{ kind: "digest", status: "start", n: 2, tier: null, idx: 50 }]), { key: KEY, before: null })
  assert.equal(s3.digest[KEY].length, 1, "末页单轮未结 ⇒ 照现（新口径）")
  assert.equal(s3.digest[KEY][0].at, 50, "位次 = 起跑记录 `idx`")
  const s3b = pageRead.applyPage(pageState(), receipt([{ kind: "digest", status: "start", n: 2, tier: null, idx: 50 }], { hasOlder: true, next: 5 }), { key: KEY, before: 9 })
  assert.equal(s3b.digest[KEY], undefined, "非末页尾残 ⇒ 零产（不可证——容差①）")

  // 4c 首屏径并入：终态现轮随清点（并入面仅未结末轮）⇒ 折叠轮居前 ∥ 现轮集随后
  const live = liveRound({ n: 5 })
  const ended = endRound({ n: 2 })
  const s4 = pageRead.applyPage(pageState({ digest: { [KEY]: [ended, live] } }), receipt(twoRounds), { key: KEY, before: null })
  assert.equal(s4.digest[KEY].length, 3, "并入 = 折叠两轮 + 未结末轮（并入面无双份）")
  assert.deepEqual(s4.digest[KEY].map((round) => round.at ?? null), [20, 30, null], "并序 = 折叠轮居前 ∥ 现轮集随后")
  assert.equal(s4.digest[KEY][2], live, "现轮集原引用（零改写）")
  assert.equal(s4.digest[KEY].some((round) => round === ended), false, "终态现轮随首屏清点退场（合并面零叠）")

  // 4d 零跨侧去重键：并集 = 纯串联（`at` 只随折叠轮侧；现轮集零位置面保持——无按键比对）
  assert.equal("at" in live, false, "现轮集零位置面（无 `at` 面）")
  assert.equal(s4.digest[KEY].filter((round) => "at" in round).length, 2, "`at` 只随折叠轮侧（两轮）")
  assert.equal(s4.digest[KEY].length, 2 + 1, "并集长度 = 折叠数 + 现轮数（零折叠 ∥ 零去重键）")

  // 4e 回填径并入：旧段并入（与活段零叠）——现轮集在场亦并入（非「原样」）
  const live2 = liveRound({ n: 2 })
  const back = pageRead.applyPage(
    baseState({ blocks: [{ kind: "assistant", text: "今", at: 90 }], digest: { [KEY]: [live2] } }),
    receipt([...twoRounds, { kind: "assistant", text: "旧", idx: 40, timestamp: 1 }], { hasOlder: true, next: 5 }),
    { key: KEY, before: 9 },
  )
  assert.equal(back.digest[KEY].length, 3, "回填径：折叠轮并入（现轮集在场不挡）")
  assert.deepEqual(back.digest[KEY].map((round) => round.at ?? null), [20, 30, null], "并序 = 折叠轮居前 ∥ 现轮集随后")
  assert.equal(back.digest[KEY][2], live2, "活段原引用（零改写）")
  assert.deepEqual(back.flowOps, [{ kind: "build" }], "回填径结构作业 = build（整置——记录序重放；回填落位批 2026-10-04）")
  assert.deepEqual(back.blocks.map((block) => block.text), ["旧", "今"], "块序 = 记录序（页块前插）")
})

// ─── 腿 ⑤：重载复列（重建径）────────────────────────────────

test("腿 ⑤·重载复列：全轮行组于其记录位次复列（恢复序 ≡ 记录序）∥ 窗下界之外零复列", async () => {
  const messages = [
    { kind: "assistant", text: "A1", idx: 2, timestamp: 1 },
    { kind: "digest", status: "start", n: 2, tier: null, idx: 4 },
    { kind: "assistant", text: "A2", idx: 6, timestamp: 2 },
    { kind: "digest", status: "end", ok: true, ms: 500, idx: 8 },
    { kind: "digest", status: "start", n: 1, tier: null, idx: 10 },
    { kind: "assistant", text: "A3", idx: 12, timestamp: 3 },
    { kind: "digest", status: "end", ok: true, ms: 800, idx: 14 },
  ]
  const s1 = pageRead.applyPage(pageState(), receipt(messages), { key: KEY, before: null })
  assert.equal(s1.digest[KEY].length, 2, "记录复列：两完整轮全产")
  assert.deepEqual(s1.blocks.map((block) => block.text), ["A1", "A2", "A3"], "块序 = 记录序")

  await withFakeDom(async () => {
    zh()
    const root = freshRoot()
    mount(root, s1)
    const order = [...root.querySelectorAll("[data-block-kind],[data-digest]")]
    const seq = order.map((node) => (node.getAttribute("data-digest") !== null ? "D" : node.getAttribute("data-block-kind").slice(0, 1)))
    assert.deepEqual(seq, ["a", "D", "D", "D", "a", "D", "D", "D", "a"], "文档序 = 记录序（行组居其记录位次——A1 之后 ∥ A2 之后再居 A2 之前）")
    assert.equal(rowsOf(root).length, 6, "两轮行组全量复列（各三轮：标签 ∥ 计数 ∥ 终态）")
    const groups = []
    for (const row of rowsOf(root)) {
      if (typeOfRow(row) === "label") groups.push([])
      groups[groups.length - 1].push(row)
    }
    assert.equal(groups.length, 2, "两轮行组（标签行 = 每轮首行）")
    assert.deepEqual(order.filter((node) => node.getAttribute("data-digest") !== null).indexOf(groups[0][0]) > -1, true, "组切分在册")

    // 5b 未结轮 = 流末（运行期轮居块序之后）
    const live = liveRound({ n: 4 })
    const s2 = pageRead.applyPage(pageState({ digest: { [KEY]: [live] } }), receipt(messages), { key: KEY, before: null })
    const root2 = freshRoot()
    mount(root2, s2)
    const seq2 = [...root2.querySelectorAll("[data-block-kind],[data-digest]")].map((node) => (node.getAttribute("data-digest") !== null ? "D" : "b"))
    assert.deepEqual(seq2.slice(-3), ["b", "D", "D"], "未结轮（运行期轮）= 流末（块序之后）")
    assert.equal(rowsOf(root2).length, 8, "折叠两轮组 + 未结轮组（6 + 2）")

    // 5c 窗下界之外零复列（位次 < 首枚已标块位次 ⇒ 窗口即窗口）
    const s3 = pageRead.applyPage(pageState(), receipt([
      { kind: "digest", status: "start", n: 2, tier: null, idx: 2 },
      { kind: "digest", status: "end", ok: true, ms: 500, idx: 4 },
      { kind: "assistant", text: "晚", idx: 10, timestamp: 1 },
    ]), { key: KEY, before: null })
    const root3 = freshRoot()
    mount(root3, s3)
    assert.equal(s3.digest[KEY].length, 1, "记录面照留（折出轮在档）")
    assert.equal(rowsOf(root3).length, 0, "窗下界之外零复列（位次 < 首枚已标块位次）")
    assert.equal(blocksOf(root3).length, 1, "块面零扰")

    // 5d 懒加载径（回填 = 整置——回填落位批 2026-10-04）：折叠轮并入 ⇒ 构造径重放（记录序）——位次轮行组落其记录位次（旧(10) 之后）∥ 节点换代（删档 + 新写）
    const root4 = freshRoot()
    let state4 = baseState({ blocks: [{ kind: "assistant", text: "今", at: 90, id: "n0" }] })
    let mounted4 = mount(root4, state4)
    state4 = wake.onDigest(state4, { key: KEY, status: "start", n: 2 })
    mounted4 = frame(root4, state4, mounted4)
    const born = rowsOf(root4)
    assert.equal(born.length, 2, "活轮行族在场（两行）")
    const merged = pageRead.applyPage(state4, receipt([
      { kind: "assistant", text: "旧", idx: 10, timestamp: 1 },
      { kind: "digest", status: "start", n: 1, tier: null, idx: 20 },
      { kind: "digest", status: "end", ok: true, ms: 500, idx: 22 },
    ], { hasOlder: true, next: 5 }), { key: KEY, before: 9 })
    assert.equal(merged.digest[KEY].length, 2, "并入：折叠轮居前 ∥ 活轮随后")
    mounted4 = frame(root4, merged, mounted4)
    const filled4 = rowsOf(root4)
    assert.equal(filled4.length, 5, "整置重放：位次轮三行 + 活轮两行（合计 5）")
    assert.ok(!filled4.some((row) => born.includes(row)), "节点换代（整置 = 删档 + 新写——非「零动」）")
    assert.deepEqual(filled4.map((row) => row._digestRound?.at ?? null), [20, 20, 20, null, null], "序 = 位次轮组（记录位次 20）→ 活轮组（流末）")
    assert.deepEqual(filled4.slice(0, 3).map(typeOfRow), ["label", "count", "end"], "位次轮组行序 = 标签 → 计数 → 终态")
    assert.deepEqual(blocksOf(root4).map((block) => block.textContent.includes("旧")), [true, false], "前插只动块（页块首前插）")
    const root5 = freshRoot()
    mount(root5, merged)
    assert.equal(rowsOf(root5).length, 5, "重建径承接：同一整置输出（幂等——5 行）")

    // 5e 重建后新轮起跑（混排态 —— 复列行组在场 ∥ 活流段尾部再添轮）：新轮行族出生（既有组零动）
    const root6 = freshRoot()
    let state6 = pageRead.applyPage(pageState(), receipt(messages), { key: KEY, before: null })
    let mounted6 = mount(root6, state6) // 构造径（重建复列）
    const repl = rowsOf(root6)
    assert.equal(repl.length, 6, "复列两轮行组（各三轮）")
    state6 = wake.onDigest({ ...state6, flowOps: [] }, { key: KEY, status: "start", n: 2 })
    mounted6 = frame(root6, state6, mounted6)
    const after6 = rowsOf(root6)
    assert.equal(after6.length, 8, "新轮起跑：行族于当刻流末出生（两行）")
    assert.deepEqual(after6.slice(0, 6), repl, "既有复列组零动（同节点 ∥ 零增）")
    assert.deepEqual(after6.slice(6).map(typeOfRow), ["label", "count"], "新轮行组 = 标签 + 计数")
    assert.ok(at(root6, after6[7]) > at(root6, after6[5]), "新轮行组居流末（既有组之后）")
    state6 = wake.onDigest({ ...state6, flowOps: [] }, { key: KEY, status: "end", ok: true, ms: 300 })
    mounted6 = frame(root6, state6, mounted6)
    assert.deepEqual(rowsOf(root6).slice(6).map(typeOfRow), ["label", "count", "end"], "终态行追加于新轮组（受词 ∥ 零换文）")
    assert.deepEqual(rowsOf(root6).slice(0, 6), repl, "既有复列组仍零动")
  })
})

// ─── 腿 ⑥：帧刷幂等 ─────────────────────────────────────────

test("腿 ⑥·帧刷幂等：同帧双跑零增零改 ∥ 重建后采纳径零重建", async () => {
  await withFakeDom(async () => {
    zh()
    const root = freshRoot()
    let state = baseState({ blocks: [{ kind: "assistant", text: "轮内", id: "k1" }] })
    let mounted = mount(root, state)
    state = wake.onDigest(state, { key: KEY, status: "start", n: 2 })
    mounted = frame(root, state, mounted) // 结算步：入流步（步①）+ 帧尾态刷（步③）同帧双跑
    const rows = rowsOf(root)
    assert.equal(rows.length, 2, "起跑行族两行")
    chrome.syncChrome(root, chatModel.chatModel(state), {}) // 帧尾态刷显式重跑
    assert.equal(rowsOf(root).length, 2, "同帧双跑：零增")
    assert.deepEqual(rowsOf(root), rows, "同帧双跑：同节点零改")
    mounted = frame(root, state, mounted) // 整帧重跑（零变更帧）
    assert.deepEqual(rowsOf(root), rows, "零变更帧：零增零改")
    state = wake.onDigest(state, { key: KEY, status: "end", ok: true, ms: 900 })
    mounted = frame(root, state, mounted)
    const after = rowsOf(root)
    assert.equal(after.length, 3, "end 帧：终态行一条（恰一条）")
    mounted = frame(root, state, mounted)
    assert.deepEqual(rowsOf(root), after, "终态后重跑：零增零改（幂等）")

    // 重建后采纳径：树面重建 ⇒ 行族新节点；同帧帧尾态刷采纳（零重建 ∥ 零增）
    const rebuilt = mount(root, state)
    const fresh = rowsOf(root)
    assert.equal(fresh.length, 3, "重建径行族 = 3 行（全轮复列）")
    assert.notEqual(fresh[0], after[0], "重建 ⇒ 新节点（树面重建）")
    chrome.syncChrome(root, chatModel.chatModel(state), {})
    assert.deepEqual(rowsOf(root), fresh, "采纳径：零重建 ∥ 零增（同节点）")
    const settled = frame(root, state, rebuilt)
    assert.deepEqual(rowsOf(root), fresh, "重建后首帧：采纳零重建")
    assert.equal(settled.length, 1, "块记账随帧（单块）")
  })
})

// ─── 腿 ⑦：记录面零动负向锁 ─────────────────────────────────

test("腿 ⑦·记录面零动：三型轮记录逐条全量出帧不变 ∥ `clearDigest` 未结末轮保逐字", () => {
  // 7a 归约面：三型帧记录全量累积（逐条出帧不变——零位置面标记）
  let st = { digest: {}, blocks: [] }
  st = wake.onDigest(st, { key: KEY, status: "start", n: 2 })
  const first = st.digest[KEY][0]
  assert.deepEqual(Object.keys(first).sort(), ["from", "msg", "n", "status", "tier"], "起跑轮记录键面（零位置面）")
  st = wake.onDigest(st, { key: KEY, status: "cap", mode: "stop", turns: 2 })
  st = wake.onDigest(st, { key: KEY, status: "end", ok: true, ms: 900 })
  assert.equal(st.digest[KEY].length, 1, "三型帧就末轮更新（同轮切片不变）")
  const ended = st.digest[KEY][0]
  assert.deepEqual(ended.cap, { mode: "stop", turns: 2 }, "cap 事实跨 `end` 存续")
  assert.deepEqual(Object.keys(ended).sort(), ["cap", "from", "ms", "msg", "n", "ok", "status", "tier", "unsettled"], "终态轮键面（零位置面——2026-10-05 消化账务批 #930：终态记录携 `unsettled`，缺省 0 归一）")
  assert.equal(first.n, 2, "起跑记录原引用零动（逐条出帧不变）")
  st = wake.onDigest(st, { key: KEY, status: "start", n: 1 })
  st = wake.onDigest(st, { key: KEY, status: "end", ok: false, ms: 100 })
  assert.equal(st.digest[KEY].length, 2, "三型轮记录逐条全量在档（记录面照留）")

  // 7b 清点面：未结末轮保（同引用——逐字）∥ 终态轮整清 ∥ 他键零动 ∥ 无轮原引用
  const live = liveRound({ n: 2 })
  const done = endRound({ n: 1 })
  const table = { [KEY]: [done, live], other: [live] }
  const cleared = rowsMod.clearDigest(table, KEY)
  assert.equal(cleared[KEY].length, 1, "终态轮整清（未结末轮保）")
  assert.equal(cleared[KEY][0], live, "未结末轮保逐字（同引用）")
  assert.equal(cleared.other, table.other, "他键零动")
  const solo = { [KEY]: [live] }
  assert.equal(rowsMod.clearDigest(solo, KEY), solo, "未结末轮独占 ⇒ 原引用（零写）")
  assert.equal(rowsMod.clearDigest({ [KEY]: [live] }, KEY)[KEY][0], live, "未结末轮保（零写径）")

  // 7c 宿主记录写点（负向锁：三型写点在盘 —— 本批零触）
  const main = (name) => readFileSync(join(ROOT, "thincoder-desktop/src/main", name), "utf8")
  assert.ok(main("suspension-drive.mjs").includes('appendRecord(agent, { kind: "digest", ...start })'), "宿主起跑记录写点在场")
  assert.ok(main("turn-face.mjs").includes('appendRecord(agent, { kind: "digest", status: "end", ok, ms, ...extra })'), "宿主终态记录写点在场（2026-10-05 消化账务批 #930：终态记录携 `unsettled`——字面随动）")
  assert.ok(main("turn-face.mjs").includes('appendRecord(agent, { kind: "digest", status: "cap"'), "宿主撞帽记录写点在场")
  const read = (name) => readFileSync(join(ROOT, "thincoder-desktop/renderer", name), "utf8")
  assert.ok(read("page-read.mjs").includes("onDigest"), "折叠直复用归约体（单一实现零副本）")
})

// ─── 腿 ⑧：追加径单式 ───────────────────────────────────────

test("腿 ⑧·追加径单式：`start` ∥ `cap` ∥ `end` 三帧皆于当刻流末落位（锚 = `blockAnchor`）", async () => {
  await withFakeDom(async () => {
    zh()
    const root = freshRoot()
    let state = baseState({ blocks: [{ kind: "assistant", text: "轮内", id: "k1" }], stopMark: { [KEY]: true } })
    let mounted = mount(root, state)
    const stop = root.querySelector("[data-stopped]")
    assert.ok(stop !== null, "尾组（停止痕）在场")
    state = wake.onDigest(state, { key: KEY, status: "start", n: 2 })
    mounted = frame(root, state, mounted)
    const two = rowsOf(root)
    assert.equal(two.length, 2, "start 帧：起跑两行")
    assert.ok(two.every((row) => at(root, row) < at(root, stop)), "start：行族落当刻流末（尾组之前）")
    // 同帧/后续帧常规新块 ⇒ 随流居行族之下（行族不挪）
    state = { ...state, blocks: [...state.blocks, { kind: "assistant", text: "轮内二", id: "k2" }] }
    mounted = frame(root, state, mounted)
    const second = blocksOf(root)[1]
    assert.ok(at(root, two[1]) < at(root, second), "常规新块随流居行族之下")
    // cap 帧 ⇒ cap 行于当刻流末追加（其位可与其族本体不相邻）
    state = wake.onDigest(state, { key: KEY, status: "cap", mode: "stop", turns: 2 })
    mounted = frame(root, state, mounted)
    const capRow = rowsOf(root).find((row) => row.getAttribute("data-digest-cap") !== null)
    assert.ok(capRow !== undefined, "cap 帧：cap 行在场")
    assert.ok(at(root, capRow) > at(root, second), "cap 行：当刻流末（居后到块之下）")
    assert.ok(at(root, capRow) < at(root, stop), "cap 行：尾组之前（锚 = blockAnchor）")
    // end 帧 ⇒ 终态行于当刻流末追加
    state = wake.onDigest(state, { key: KEY, status: "end", ok: true, ms: 900 })
    mounted = frame(root, state, mounted)
    const endRow = rowsOf(root).find((row) => row.getAttribute("data-digest-end") !== null)
    assert.ok(at(root, endRow) > at(root, capRow), "终态行：到达序追加（cap 行之后）")
    assert.ok(at(root, endRow) < at(root, stop), "终态行：尾组之前")
  })

  // 8b 药丸锚（无尾组 ⇒ 药丸之前）：停跟帧下新轮行族仍落当刻流末
  await withFakeDom(async () => {
    zh()
    const root = freshRoot()
    let state = baseState({ blocks: [{ kind: "assistant", text: "轮内", id: "k1" }], following: false })
    let mounted = mount(root, state)
    state = wake.onDigest(state, { key: KEY, status: "start", n: 2 })
    mounted = frame(root, state, mounted)
    const pill = root.querySelector("[data-pill]")
    assert.ok(pill !== null, "药丸在场（停跟）")
    const two = rowsOf(root)
    assert.equal(two.length, 2, "停跟帧：行族照建")
    assert.ok(two.every((row) => at(root, row) < at(root, pill)), "行族落药丸之前（锚 = blockAnchor 末档）")
  })
})
