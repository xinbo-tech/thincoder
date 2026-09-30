/**
 * 2026-09-29-desktop-digest-parity.test.mjs — 批内件（#670 桌面消化行组收口：终态留存 + 多轮累积 · 平 node）。
 * ⚠ 断代失效（2026-09-30 · 台账 #731 核处）：本件白盒断言所测内部形态已随后续批次演进（#719 消化面重构 ∥ chat-tree 拆档 ∥ 锚链序变更等）——重跑必红为预期；特性现形态的回归锚以近期批件为准。本件留档参考，勿按红态排障。
 *
 * 判据表 = 批档 §2.5 用例表 W1–W11（任务书 = `docs/batches/2026-09-29-desktop-digest-parity.md` §2；
 * 现行有效 = §2.12 轮 2 收正）。红 ∕ 绿规程：修前（单切片覆盖 ∕ `end` 后摘组 ∕ 无清点）⇒ W1–W6 ∕ W8–W10 红；
 * 落修（多轮记录 + 终态留存 + 首屏四清）⇒ 全绿；W7（组树零幻影）· W11（词键零新）= **零回归锁绿面** ——
 * 驱动面走真实归约 ∕ 源码面机检，两态同真。本件不入仓套件（批内件 · 随批留存）。
 * 跑法（仓根 `thincoder/`）：`node --test docs/batches/2026-09-29-desktop-digest-parity.test.mjs`。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（须先于任何 /rc/ 取件注册）

const ROOT = process.cwd()
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)
const text = (rel) => readFileSync(resolve(ROOT, rel), "utf8")

const [wake, digest, model, pageRead, i18n, dom, core] = await Promise.all([
  mod("thincoder-desktop/renderer/events-wake.mjs"), // W1–W5 归约面（onDigest）
  mod("thincoder-desktop/renderer/views/chat-digest.mjs"), // W6–W10 组树 ∕ 判据 ∕ 帧刷 ∕ 清点
  mod("thincoder-desktop/renderer/views/chat-model.mjs"), // W8 模型读面（digestOf 经 chatModel）
  mod("thincoder-desktop/renderer/page-read.mjs"), // W10 首屏门引调面
  mod("thincoder-desktop/renderer/i18n.mjs"), // 词面投影（t）
  mod("thincoder-desktop/renderer/dom.mjs"), // 描述符建树（build —— 单源 = 本档）
  mod("thincoder-core/i18n.mjs"), // 核字典投影（W6 ∕ W9 词面单源）
])

const KEY = "1"
const zh = () => i18n.initDict({ locale: "zh", dict: core.projectDictionary("zh") })

// ─── 假 DOM（属性 ∕ 选择器 ∕ 节点移动面 —— 沿批内件先例：compress-row-pin W 表同法）──

class FakeText {
  constructor(text) { this.textContent = String(text); this.parentNode = null }
  get nextSibling() { const p = this.parentNode; return p ? p.children[p.children.indexOf(this) + 1] ?? null : null }
  remove() { if (this.parentNode) this.parentNode.removeChild(this) }
}

class FakeNode {
  constructor(tag = "div") {
    this.tagName = String(tag).toUpperCase()
    this.attrs = new Map()
    this.children = []
    this.parentNode = null
    this._text = ""
  }
  get textContent() {
    if (this.children.length === 0) return this._text ?? ""
    return (this._text ?? "") + this.children.map((c) => c.textContent).join("")
  }
  set textContent(value) { this._text = String(value ?? ""); this.children.length = 0 }
  set innerHTML(value) { this._text = String(value); this.children = [] }
  get innerHTML() { return this._text ?? "" }
  setAttribute(name, value) { this.attrs.set(name, String(value)) }
  getAttribute(name) { return this.attrs.has(name) ? this.attrs.get(name) : null }
  getAttributeNames() { return [...this.attrs.keys()] }
  append(child) {
    if (child !== null && typeof child === "object") { child.parentNode = this; this.children.push(child) }
    else this.children.push(new FakeText(String(child)))
  }
  insertBefore(child, ref) {
    const at = ref === null || ref === undefined ? -1 : this.children.indexOf(ref)
    if (at < 0) { this.append(child); return child }
    child.parentNode = this
    this.children.splice(at, 0, child)
    return child
  }
  removeChild(node) { const at = this.children.indexOf(node); if (at >= 0) this.children.splice(at, 1); node.parentNode = null; return node }
  remove() { if (this.parentNode) this.parentNode.removeChild(this) }
  get nextSibling() { const p = this.parentNode; return p ? p.children[p.children.indexOf(this) + 1] ?? null : null }
  matches(selector) {
    const raw = String(selector).trim()
    if (raw.startsWith(".")) return String(this.getAttribute("class") ?? "").split(/\s+/).includes(raw.slice(1))
    const hit = /^\[([\w-]+)(?:="([^"]*)")?\]$/.exec(raw)
    if (!hit) return false
    const value = this.getAttribute(hit[1])
    return hit[2] === undefined ? value !== null : value === hit[2]
  }
  querySelectorAll(selector) {
    const out = []
    const walk = (node) => { for (const child of node.children) { if (!child.matches) continue; if (child.matches(selector)) out.push(child); walk(child) } }
    walk(this)
    return out
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null }
}

/** 假 DOM 置位（`dom.mjs` 唯一构造点 = `document.createElement` + `instanceof Node`）→ 跑 fn → 复位。 */
async function withFakeDom(fn) {
  const prevDoc = globalThis.document
  const prevNode = globalThis.Node
  globalThis.document = { createElement: (tag) => new FakeNode(tag) }
  globalThis.Node = FakeNode
  try { return await fn() } finally {
    globalThis.document = prevDoc
    globalThis.Node = prevNode
  }
}

/** 节点写入探针（W9 零写判据）：`textContent` 集 ∕ `setAttribute` 计数（读面原样透传）。 */
function spyWrites(node) {
  const desc = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(node), "textContent")
  const counts = { text: 0, attr: 0 }
  Object.defineProperty(node, "textContent", {
    configurable: true,
    get: () => desc.get.call(node),
    set: (value) => { counts.text += 1; desc.set.call(node, value) },
  })
  const setAttribute = node.setAttribute.bind(node)
  node.setAttribute = (...args) => { counts.attr += 1; return setAttribute(...args) }
  return counts
}

const round = (over = {}) => ({ status: "start", n: 1, tier: null, from: null, msg: null, ...over })

// ─── W1–W5：归约面（`onDigest` 多轮记录）────────────────────────────────────

test("W1 归约·多轮追加：start ×2 ⇒ 轮集长度 2（首轮 n 保 ∕ 两轮独立）", () => {
  let state = wake.onDigest({}, { key: KEY, status: "start", n: 3 })
  state = wake.onDigest(state, { key: KEY, status: "start", n: 1 })
  const rounds = state.digest[KEY]
  assert.equal(Array.isArray(rounds), true, "轮集 = 数组（多轮记录）")
  assert.equal(rounds.length, 2, "两轮各成独立记录（零覆盖）")
  assert.deepEqual(rounds[0], round({ n: 3 }), "首轮起跑读数保")
  assert.deepEqual(rounds[1], round({ n: 1 }), "次轮独立记录")
  const next = wake.onDigest(state, { key: KEY, status: "start", n: 2 })
  assert.equal(state.digest[KEY], rounds, "旧轮集零动（不可变写）")
  assert.notEqual(next.digest[KEY], rounds, "start 追加恒产新引用（每轮恰一发）")
})

test("W2 归约·end 就末轮：末轮 status:end + ok ∕ ms；起跑 n 保；前轮零动", () => {
  let state = wake.onDigest({}, { key: KEY, status: "start", n: 2 })
  state = wake.onDigest(state, { key: KEY, status: "start", n: 5 })
  state = wake.onDigest(state, { key: KEY, status: "end", ok: true, ms: 1234 })
  const rounds = state.digest[KEY]
  assert.equal(rounds.length, 2, "end 只更新（零增轮）")
  assert.equal(rounds[0].status, "start", "前轮零动（仍 start）")
  assert.deepEqual(rounds[1], round({ n: 5, status: "end", ok: true, ms: 1234 }), "末轮终态 + 起跑 n 保")
  const same = wake.onDigest(state, { key: KEY, status: "end", ok: true, ms: 1234 })
  assert.equal(same, state, "同值 ⇒ 原引用（零写）")
})

test("W3 归约·start 连发：未结轮连发 ⇒ 各成一轮；end 只更末轮（前轮保持 start）", () => {
  let state = wake.onDigest({}, { key: KEY, status: "start", n: 1 })
  state = wake.onDigest(state, { key: KEY, status: "start", n: 0 })
  state = wake.onDigest(state, { key: KEY, status: "end", ok: false, ms: 900 })
  const rounds = state.digest[KEY]
  assert.equal(rounds.length, 2, "连发各成一轮")
  assert.equal(rounds[0].status, "start", "前轮保持 start（VSC 只更最近一轮）")
  assert.deepEqual(rounds[1], round({ n: 0, status: "end", ok: false, ms: 900 }), "end 只更末轮（ok:false 落末轮）")
})

test("W4 归约·cap 挂末轮：并末轮保 n；cap 事实跨 end 存续；无轮 cap ∕ end ⇒ 原引用（零写）", () => {
  let state = wake.onDigest({}, { key: KEY, status: "start", n: 7 })
  state = wake.onDigest(state, { key: KEY, status: "cap", mode: "stop", turns: 3 })
  assert.equal(Array.isArray(state.digest[KEY]), true, "轮集 = 数组")
  assert.equal(state.digest[KEY][0].status, "cap", "末轮状态 = cap")
  assert.equal(state.digest[KEY][0].n, 7, "并末轮保起跑 n（#541）")
  assert.deepEqual(state.digest[KEY][0].cap, { mode: "stop", turns: 3 }, "撞帽事实挂末轮")
  state = wake.onDigest(state, { key: KEY, status: "end", ok: true, ms: 10 })
  assert.deepEqual(state.digest[KEY][0].cap, { mode: "stop", turns: 3 }, "cap 事实跨 end 存续（#541）")
  const bare = { digest: {} }
  assert.equal(wake.onDigest(bare, { key: KEY, status: "cap", mode: "auto", turns: 1 }), bare, "无轮 cap ⇒ 原引用（零写 · 防守档）")
  assert.equal(wake.onDigest(bare, { key: KEY, status: "end", ok: true, ms: 1 }), bare, "无轮 end ⇒ 原引用（零写 · 防守档）")
  const norm = wake.onDigest(wake.onDigest({}, { key: KEY, status: "start", n: 0 }), { key: KEY, status: "cap", mode: "weird", turns: "x" })
  assert.deepEqual(norm.digest[KEY][0].cap, { mode: "auto", turns: null }, "mode 表外 ⇒ auto · turns 非数 ⇒ null")
})

test("W5 归约·n=0 轮：start(n=0) ⇒ 轮在场；end 后仍 n=0", () => {
  let state = wake.onDigest({}, { key: KEY, status: "start", n: 0 })
  assert.equal(Array.isArray(state.digest[KEY]), true, "轮集 = 数组")
  assert.equal(state.digest[KEY].length, 1, "零计数轮仍在场（轮集非空）")
  state = wake.onDigest(state, { key: KEY, status: "end", ok: true, ms: 100 })
  assert.equal(state.digest[KEY][0].status, "end", "end 落末轮")
  assert.equal(state.digest[KEY][0].n, 0, "end 后仍 n=0（保起跑读数）")
})

// ─── W6–W9：组树 ∕ 判据 ∕ 帧刷 ────────────────────────────────────────────

test("W6 组树·多轮行序：[label,(count),(cap)]×N；锚逐轮齐备；终态文 ∕ class 单源", async () => {
  await withFakeDom(() => {
    zh()
    const rounds = [
      round({ n: 2 }),
      round({ n: 1, status: "end", ok: false, ms: 1500, cap: { mode: "stop", turns: 3 } }),
    ]
    const node = dom.build(digest.digestGroupNode(rounds))
    assert.equal(node.getAttribute("data-digest"), "", "组锚 data-digest")
    assert.equal(node.getAttribute("class"), "chat-digest", "组类 = chat-digest（值零改）")
    assert.equal(node.querySelectorAll("[data-digest-label]").length, 2, "逐轮标签行（多轮平铺）")
    assert.equal(node.querySelectorAll("[data-digest-count]").length, 2, "逐轮计数行（n > 0）")
    assert.equal(node.querySelectorAll("[data-digest-cap]").length, 1, "cap 行在场（末轮）")
    const order = node.children.map((c) => c.getAttribute("data-digest-label") !== null ? "label" : c.getAttribute("data-digest-count") !== null ? "count" : "cap")
    assert.deepEqual(order, ["label", "count", "label", "count", "cap"], "行序 = [label,(count),(cap)]×N")
    const counts = node.querySelectorAll("[data-digest-count]")
    assert.equal(counts[1].textContent, i18n.t("digest.aborted", { seconds: "1.5" }), "终态文单源（countRowText ⇒ digest.aborted）")
    assert.match(counts[1].getAttribute("class"), /digest-failed/, "终态 class 单源（countRowClass）")
    assert.equal(counts[0].textContent, i18n.t("digest.start", { n: 2 }), "起跑文（digest.start）")
    assert.equal(counts[0].getAttribute("class"), "digest-status", "起跑 class = 基类")
    assert.equal(node.querySelector("[data-digest-cap]").textContent, i18n.t("digest.capStop", { turns: 3 }), "cap 文单源（capText）")
  })
})

test("W7 组树·零幻影（零回归锁）：n=0 轮零计数行；cap 行为该轮组尾", async () => {
  await withFakeDom(() => {
    zh()
    let state = wake.onDigest({}, { key: KEY, status: "start", n: 0, tier: "ask", from: "sub1", msg: "报告" })
    state = wake.onDigest(state, { key: KEY, status: "cap", mode: "auto", turns: null })
    const node = dom.build(digest.digestGroupNode(state.digest[KEY]))
    assert.equal(node.querySelectorAll("[data-digest-count]").length, 0, "n = 0 ⇒ 零计数行（幻影行禁出）")
    assert.equal(node.querySelectorAll("[data-digest-cap]").length, 1, "cap 行在场（轮尾）")
    assert.equal(node.children[node.children.length - 1].getAttribute("data-digest-cap"), "", "cap 行为该轮组尾")
    assert.equal(node.querySelector("[data-digest-label]").textContent, i18n.t("digest.turnLabelAsk", { from: "sub1", msg: "报告" }), "ask 档标签文（两档单源）")
  })
})

test("W8 判据·留存：非空轮集 ⇒ 真（含全 end 轮——不留 cap 例外）；空 ∕ null ⇒ 假", () => {
  const end = round({ status: "end", ok: true, ms: 10 })
  assert.equal(digest.digestPresent([end]), true, "全终态轮 ⇒ 在场（留存判据）")
  assert.equal(digest.digestPresent([round()]), true, "起跑轮 ⇒ 在场")
  assert.equal(digest.digestPresent([end, round()]), true, "多轮 ⇒ 在场")
  assert.equal(digest.digestPresent([]), false, "空 ⇒ 不在场")
  assert.equal(digest.digestPresent(null), false, "null ⇒ 不在场")
  assert.equal(digest.digestPresent(undefined), false, "缺席 ⇒ 不在场")
  const read = (table) => model.chatModel({ activeSession: KEY, blocks: [], digest: table }).digest
  assert.equal(read({ 1: [end] }).length, 1, "chatModel.digest = 轮集")
  assert.equal(read({ 1: [] }), null, "空轮集 ⇒ null（禁假造）")
  assert.equal(read({ 1: { status: "end" } }), null, "非数组切片 ⇒ null（形态升级）")
})

test("W9 帧尾·逐轮原位：同态两帧 ⇒ 零 DOM 写且旧行身份保；追加轮 ⇒ 仅追加行；清点后 ⇒ 摘组", async () => {
  await withFakeDom(() => {
    zh()
    const root = new FakeNode("div")
    const first = round({ n: 2 })
    digest.syncDigest(root, { digest: [first] }, null)
    const group = root.querySelector("[data-digest]")
    const label = root.querySelector("[data-digest-label]")
    const count = root.querySelector("[data-digest-count]")
    assert.ok(group !== null, "首帧建组（自愈）")
    assert.equal(label.textContent, i18n.t("digest.turnLabel"), "标签行文在场")
    const probes = [group, label, count].map((node) => spyWrites(node))
    digest.syncDigest(root, { digest: [first] }, null)
    assert.equal(root.querySelector("[data-digest]"), group, "同态两帧 ⇒ 组节点身份保（零重建）")
    assert.equal(root.querySelector("[data-digest-label]"), label, "旧行节点身份零动")
    assert.equal(root.querySelector("[data-digest-count]"), count, "计数行身份零动")
    assert.deepEqual(probes.map((p) => [p.text, p.attr]), [[0, 0], [0, 0], [0, 0]], "同态两帧 ⇒ 零 DOM 写（行等价）")
    const done = round({ n: 2, status: "end", ok: true, ms: 1500 })
    digest.syncDigest(root, { digest: [done] }, null)
    assert.equal(root.querySelector("[data-digest-count]"), count, "终态就地刷（节点身份存续——不摘行）")
    assert.equal(count.textContent, i18n.t("digest.done", { n: 2, seconds: "1.5" }), "终态文就地落")
    assert.match(count.getAttribute("class"), /digest-done/, "终态 class 就地落")
    const second = round({ n: 1 })
    digest.syncDigest(root, { digest: [done, second] }, null)
    assert.equal(root.querySelector("[data-digest-label]"), label, "追加轮 ⇒ 旧轮行零动（身份保）")
    assert.equal(root.querySelectorAll("[data-digest-label]").length, 2, "追加轮 ⇒ 追加行（第二标签行）")
    assert.equal(root.querySelectorAll("[data-digest-count]").length, 2, "计数行同追加")
    assert.equal(root.querySelector("[data-digest-count]"), count, "旧计数行身份仍保")
    digest.syncDigest(root, { digest: null }, null)
    assert.equal(root.querySelector("[data-digest]"), null, "轮集空 ⇒ 摘组")
  })
})

// ─── W10–W11：清点 ∕ 词键 ─────────────────────────────────────────────────

test("W10 清点·四清：首屏 [终,终] ⇒ 键删；[终,未结] ⇒ 保末轮；回填 ∕ 非活动键 ⇒ 不清；原引用零写", async () => {
  assert.equal(typeof digest.clearDigest, "function", "clearDigest 在场（四清之四）")
  const end = round({ status: "end", ok: true, ms: 10 })
  const open = round({ n: 2 })
  const table = { 1: [end, end], 2: [open] }
  const cleared = digest.clearDigest(table, KEY)
  assert.equal(Object.hasOwn(cleared, KEY), false, "全终态 ⇒ 键删（存量痕清）")
  assert.equal(cleared[2], table[2], "他键零动")
  assert.deepEqual(digest.clearDigest({ 1: [end, open] }, KEY)[KEY], [open], "含未结末轮 ⇒ 保末轮（活态）")
  const single = { 1: [open] }
  assert.equal(digest.clearDigest(single, KEY), single, "保末轮即原样 ⇒ 原引用（零写）")
  assert.equal(digest.clearDigest(null, KEY), null, "null ⇒ 原引用（零写）")
  const odd = { 1: "x" }
  assert.equal(digest.clearDigest(odd, KEY), odd, "非数组切片 ⇒ 原引用（零写）")
  const absent = {}
  assert.equal(digest.clearDigest(absent, KEY), absent, "无轮 ⇒ 原引用（零写）")
  // 页读径（首屏门内四清同列 —— 回填 ∕ 非活动键不清）
  const state = { activeSession: KEY, blocks: [], digest: { 1: [end], 2: [end] } }
  const receipt = { ok: true, messages: [], hasOlder: false, next: null, flags: {}, queue: [] }
  const first = pageRead.applyPage(state, receipt, { key: KEY, before: null })
  assert.equal(Object.hasOwn(first.digest, KEY), false, "首屏 ⇒ 本键全终态轮清（四清同门）")
  assert.deepEqual(first.digest[2], [end], "非活动键零动")
  const backfill = pageRead.applyPage(state, receipt, { key: KEY, before: "cursor" })
  assert.equal(backfill.digest, state.digest, "回填读 ⇒ 不清（原引用）")
  const inactive = pageRead.applyPage(state, receipt, { key: "2", before: null })
  assert.equal(inactive.digest, state.digest, "非活动键首屏 ⇒ 不清（早退同径）")
})

test("W11 词键·零新（绿面）：digest.* 消费键 = 核字典七键；t() 投影直取（零新键）", () => {
  const src = text("thincoder-desktop/renderer/views/chat-digest.mjs")
  const used = [...new Set([...src.matchAll(/t\(\s*"([^"]+)"/g)].map((m) => m[1]))].filter((key) => key.startsWith("digest.")).sort()
  assert.deepEqual(used, ["digest.aborted", "digest.capAuto", "digest.capStop", "digest.done", "digest.start", "digest.turnLabel", "digest.turnLabelAsk"], "digest.* 消费键 = 核字典七键（#541 枚举同值 · 零新键）")
  const dict = core.projectDictionary("zh")
  for (const key of used) assert.equal(typeof dict[key], "string", `核字典在场（投影面直取）：${key}`)
  assert.equal(core.projectDictionary("en")["digest.capAuto"] !== undefined, true, "两语投影同源（核单源）")
})
