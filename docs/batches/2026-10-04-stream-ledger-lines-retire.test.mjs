/**
 * 2026-10-04-stream-ledger-lines-retire.test.mjs — 流尾台账行组退役批（桌面舱 B）批次本地单元件（随批留存归档）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑 = 从仓库根 `thincoder/`：
 *   node --test docs/batches/2026-10-04-stream-ledger-lines-retire.test.mjs
 *
 * 腿（批档 §2.5 用例表 T1–T10 + §2.10 增补 T11–T15；去面 = 桌面流尾组 ∥ VSC 通知行 ∥ CLI 行推线面 ∥ 核 `lines` 深清）：
 *   T1 桌面归约：`lines` 载荷零写（`ledgerDetail`/`ledgerMarker` 照写 ∥ marker null = 清残影）
 *   T2 桌面归约：保留面回归（`detailLines` ∥ `marker` 写/清/形不合 —— 同值原引用）
 *   T3 桌面模型 ∥ 键表（model 零 `ledger` 键；`CHAT_KEYS` 零 `ledgerLines`；`SESSION_KEYS` 含 `ledger`）
 *   T4 桌面构树 ∥ 帧刷 ∥ 锚链顺链（假 DOM —— 零 `[data-ledger]`/`[data-ledger-line]`；逐链断言落的节点）
 *   T5 桌面源面锁（六档零 `data-ledger`/`syncLedger`/`ledgerGroupNode`/`ledgerAnchorOf`/`ledgerOf`/`ledgerLines`）
 *   T6 主机出站：`ev:ledger` 载荷零 `lines`（真拍链 + 假 post）；源面零 `LINE_COLORS`/`pending`
 *   T7 VSC 源面 ∥ 档存（零 `ledgerNotice` ∥ 零 `pushLine`/`pushLedgerStartup`；`webview/ledger-line.js` 不在盘）
 *   T8 孤儿终检（live 源码树四符号零命中；`ledgerNotice` 仅余会话注记族保留形）
 *   T9 样式面（core.css / chat-fixes.css / chat.css 零 `.chat-ledger`/`.ledger-line`）
 *   T10 词面零触（`（属主已死 ` 单源仍在 `ledger-executors.mjs`）
 *   T11 CLI 源面锁（`startLedgerSurface({ state, agent, render })` 形；胶水零 `colors`/`pushLine`）
 *   T12 核面锁（`ledger-surface.mjs` 零 `pushLine`/notify/行产；`ledger.mjs` 零七符号）
 *   T13 核行为（假 `pushLine` 零调用 ∥ `state.ledger` 痕迹照写 ∥ `render` 照调）
 *   T14 核保留面（`formatDetailLine`/`detailScans`/`executorTail`/`formatMarker` 在位 ∥ `scopeMarkerOf` 判位照旧）
 *   T15 CLI 保面（`render-frame.mjs` `ledgerHint` 链源面零改）
 * 扫描口径（T8/T10）：live 源码树 = 仓根递归，排除 `docs` ∥ `node_modules` ∥ `.git` ∥ `.thincoder` ∥ `dist*` ∥ `_archive`
 * （记录面 / 产物面 / 临时面）；文件型 = `.mjs/.cjs/.js/.css/.html/.json/.md`（日志 ∥ 锁档除外）。真机走查归父侧。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, relative, resolve, sep } from "node:path"
import { pathToFileURL } from "node:url"

import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（渲染档取件链同生产）

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-desktop"))) throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)
const text = (rel) => readFileSync(resolve(ROOT, rel), "utf8")

const RENDERER = "thincoder-desktop/renderer"
const MAIN = "thincoder-desktop/src/main"
const VSC = "thincoder-vscode"
const CLI = "thincoder-cli/src/tui"

const slices = await mod(`${RENDERER}/events-slices.mjs`)
const chatModelMod = await mod(`${RENDERER}/views/chat-model.mjs`)
const chromeMod = await mod(`${RENDERER}/views/chat-chrome.mjs`)
const treeMod = await mod(`${RENDERER}/views/chat-tree.mjs`)
const compressMod = await mod(`${RENDERER}/views/compress-status.mjs`)
const dispatchMod = await mod(`${RENDERER}/frame-dispatch.mjs`)
const i18n = await mod(`${RENDERER}/i18n.mjs`)
const projectInfo = await mod(`${MAIN}/project-info.mjs`)
const coreSurface = await mod("thincoder-core/ledger-surface.mjs")
const coreLedger = await mod("thincoder-core/ledger.mjs")
const coreDb = await mod("thincoder-core/ledger-db.mjs")
const coreCmd = await mod("thincoder-core/ledger-cmd.mjs")
// T6 专用取件链：桌面 `@thincoder/core` = 符号链接路径（独立模块实例）——注入缝须与 `project-info.mjs` 同实例（实读）。
const NM = "thincoder-desktop/node_modules/@thincoder/core"
const coreDbNm = await mod(`${NM}/ledger-db.mjs`)
const coreCmdNm = await mod(`${NM}/ledger-cmd.mjs`)

// ─── 扫描面（T8/T10）· 临时台账夹具（T6/T13）────────────────────────────────────

/** live 源码树遍历（排除面见档头扫描口径）。 */
function scanSource() {
  const SKIP_DIRS = new Set(["node_modules", ".git", ".thincoder", "docs", "coverage", ".vscode-test"])
  const SCAN_EXT = /\.(mjs|cjs|js|css|html|json|md)$/
  const out = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name) || entry.name.startsWith("dist") || entry.name === "_archive") continue
        walk(join(dir, entry.name))
      } else if (SCAN_EXT.test(entry.name) && entry.name !== "package-lock.json") {
        const abs = join(dir, entry.name)
        out.push({ rel: relative(ROOT, abs).split(sep).join("/"), body: readFileSync(abs, "utf8") })
      }
    }
  }
  walk(ROOT)
  return out
}

const created = []
const tmpBase = (tag) => { const d = mkdtempSync(join(tmpdir(), `slr-${tag}-`)); created.push(d); return d }
const cleanup = () => { for (const d of created.splice(0)) rmSync(d, { recursive: true, force: true }) }
test.after(cleanup)

/** 项目目录（manifest 在场 —— 归属解析确定；先例 = 标记范围合计批夹具）。 */
function mkProject(parent, name) {
  const dir = join(parent, name)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, phase: "initial-dev" }, null, 2))
  return dir
}

// ─── 假 DOM（T4 —— 迷你解析：属性 / `.class` 选择器 / 文本 ∥ 追加面）──────────────

class FakeText {
  constructor(raw) { this.textContent = String(raw); this.parentNode = null }
  remove() { if (this.parentNode) this.parentNode.removeChild(this) }
}

class FakeNode {
  constructor(tag = "div") {
    this.tagName = String(tag).toUpperCase()
    this.attrs = new Map()
    this.children = []
    this.parentNode = null
    this._text = ""
    this._html = ""
  }
  get textContent() { return this.children.length === 0 ? (this._text ?? "") : (this._text ?? "") + this.children.map((c) => c.textContent).join("") }
  set textContent(value) { this._text = String(value ?? ""); this.children.length = 0 }
  set innerHTML(value) { this._html = String(value ?? ""); this._text = ""; this.children.length = 0 }
  get innerHTML() { return this._html }
  setAttribute(name, value) { this.attrs.set(String(name), String(value)) }
  getAttribute(name) { return this.attrs.has(name) ? this.attrs.get(name) : null }
  removeAttribute(name) { this.attrs.delete(name) }
  getAttributeNames() { return [...this.attrs.keys()] }
  addEventListener() {}
  removeEventListener() {}
  _attach(child, at = -1) {
    const node = typeof child === "object" && child !== null ? child : new FakeText(String(child))
    node.parentNode = this
    if (at < 0) this.children.push(node)
    else this.children.splice(at, 0, node)
    return node
  }
  append(child) { return this._attach(child) }
  appendChild(child) { return this._attach(child) }
  get childNodes() { return this.children }
  insertBefore(child, ref) {
    const at = ref === null || ref === undefined ? -1 : this.children.indexOf(ref)
    return this._attach(child, at)
  }
  prepend(child) { return this._attach(child, 0) }
  replaceChildren() { this.children.length = 0; this._text = "" }
  removeChild(node) { const at = this.children.indexOf(node); if (at >= 0) this.children.splice(at, 1); node.parentNode = null; return node }
  remove() { if (this.parentNode) this.parentNode.removeChild(this) }
  replaceWith(next) {
    const p = this.parentNode
    if (!p) return
    const at = p.children.indexOf(this)
    if (at < 0) return
    p.children.splice(at, 1, next)
    next.parentNode = p
    this.parentNode = null
  }
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
    const walk = (node) => {
      for (const child of node.children) {
        if (typeof child.matches !== "function") continue
        if (child.matches(selector)) out.push(child)
        walk(child)
      }
    }
    walk(this)
    return out
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null }
}

function withFakeDom(fn) {
  const doc = { createElement: (tag) => new FakeNode(tag), createTextNode: (raw) => new FakeText(raw) }
  const prevDoc = globalThis.document
  const prevNode = globalThis.Node
  globalThis.document = doc
  globalThis.Node = FakeNode
  try { return fn(doc) } finally {
    globalThis.document = prevDoc
    globalThis.Node = prevNode
  }
}

const mkNode = (attr, value = "") => { const node = new FakeNode("div"); if (attr) node.setAttribute(attr, value); return node }

/** 帧模型（手构 —— 各键切片自控；T4 专用）。 */
const flowModel = (extra = {}) => ({
  state: "flow", blocks: [], hidden: 0, following: true, pendingNew: 0,
  approval: [], guide: null, digest: null, compress: null, timer: null, stopped: false, help: null,
  ...extra,
})

/** 子序记号（T4 断言读数 —— 首命中锚名）。 */
function seqOf(root) {
  const NAMES = [["data-compress", "compress"], ["data-timer", "timer"], ["data-stopped", "stopped"], ["data-ledger", "ledger"], ["data-help", "help"], ["data-card", "card"], ["data-pill", "pill"]]
  return root.children.map((child) => {
    if (typeof child.getAttribute !== "function") return "text"
    for (const [attr, name] of NAMES) if (child.getAttribute(attr) !== null) return name
    return "other"
  })
}

// ─── T1 桌面归约：`lines` 载荷零写 ───────────────────────────────────────────────

test("T1 桌面归约：`lines` 载荷零写 ∥ 保留面照写（marker null = 清残影）", () => {
  const state = {}
  const linesOnly = slices.onLedger(state, { key: "s1", lines: [{ text: "台账变化：…", warn: true }] })
  assert.equal(linesOnly, state, "纯 `lines` 载荷 ⇒ 原引用（切片面已退场）")
  assert.equal(Object.hasOwn(linesOnly, "ledgerLines"), false, "状态零 `ledgerLines` 键")

  const full = slices.onLedger(state, {
    key: "s1",
    lines: [{ text: "台账变化：…", warn: true }, { text: "台账变化：…", warn: false }],
    detailLines: ["台账 proj：需求池 1 · 技术待办 0（老化 0）"],
    marker: { text: "台账 1·0", warn: false },
  })
  assert.equal(Object.hasOwn(full, "ledgerLines"), false, "多行 `lines` 亦零写")
  assert.deepEqual(full.ledgerDetail, ["台账 proj：需求池 1 · 技术待办 0（老化 0）"], "`detailLines` 照写（保留面）")
  assert.deepEqual(full.ledgerMarker, { text: "台账 1·0", warn: false }, "`marker` 照写（保留面）")

  const cleared = slices.onLedger(full, { key: "s1", lines: [{ text: "台账变化：…", warn: true }], marker: null })
  assert.equal(cleared.ledgerMarker, null, "marker null = 清残影（保留面语义）")
  assert.deepEqual(cleared.ledgerDetail, full.ledgerDetail, "`detailLines` 不随 lines 载荷动")
})

// ─── T2 桌面归约：保留面回归（防误伤）────────────────────────────────────────────

test("T2 桌面归约：`detailLines`/`marker` 写/清/形不合 —— 同值原引用", () => {
  const base = slices.onLedger({}, { key: "s1", detailLines: ["L2-a"], marker: { text: "台账 1·0", warn: true } })
  assert.equal(slices.onLedger(base, { key: "s1", detailLines: ["L2-a"], marker: { text: "台账 1·0", warn: true } }), base, "同值 ⇒ 原引用（零重绘）")
  const regenerated = slices.onLedger(base, { key: "s1", detailLines: ["L2-b"], marker: { text: "台账 2·1", warn: false } })
  assert.deepEqual(regenerated.ledgerDetail, ["L2-b"], "明细换代 ⇒ 写")
  assert.deepEqual(regenerated.ledgerMarker, { text: "台账 2·1", warn: false }, "状态位换代 ⇒ 写")

  const badShape = slices.onLedger(base, { key: "s1", marker: { text: "" } })
  assert.equal(badShape, base, "marker 形不合（空串）⇒ 零写（禁假造）")
  const notObject = slices.onLedger(base, { key: "s1", marker: 7 })
  assert.equal(notObject, base, "marker 非载体 ⇒ 零写")

  const cleared = slices.onLedger(base, { key: "s1", marker: null })
  assert.equal(cleared.ledgerMarker, null, "prev 在场 ∧ marker null ⇒ 写 null（清残影键在场）")

  const emptyDetail = slices.onLedger(base, { key: "s1", detailLines: [] })
  assert.deepEqual(emptyDetail.ledgerDetail, [], "空集照写（清 tooltip —— 禁假造）")
})

// ─── T3 桌面模型 ∥ 键表 ─────────────────────────────────────────────────────────

test("T3 桌面模型 ∥ 键表：model 零 `ledger` 键 ∥ `CHAT_KEYS` 零 `ledgerLines` ∥ `SESSION_KEYS` 含 `ledger`", () => {
  const state = {
    activeSession: "s1", following: true, hidden: 0, blocks: [{ id: "b1", kind: "user", text: "hi" }],
    ledgerLines: { s1: [{ text: "台账变化：…", warn: true }] },
    ledgerDetail: ["L2"], ledgerMarker: { text: "台账 1·0", warn: false },
  }
  const model = chatModelMod.chatModel(state)
  assert.equal(Object.hasOwn(model, "ledger"), false, "模型零 `ledger` 键（`ledgerLines` 切片喂入亦零读）")
  assert.equal(model.ledger, undefined, "零 `ledger` 读面")
  const emptyModel = chatModelMod.chatModel({ activeSession: "s1", blocks: [] })
  assert.equal(Object.hasOwn(emptyModel, "ledger"), false, "`empty` 帧同零键")

  assert.equal(dispatchMod.CHAT_KEYS.includes("ledgerLines"), false, "`CHAT_KEYS` 零 `ledgerLines`（流面帧触发面退场）")
  assert.equal(dispatchMod.SESSION_KEYS.includes("ledger"), true, "`SESSION_KEYS` 含 `ledger`（会话注记切片 —— 保留面）")
})

// ─── T4 桌面构树 ∥ 帧刷 ∥ 锚链顺链 ───────────────────────────────────────────────

test("T4 桌面构树 ∥ 帧刷：零 `[data-ledger]`/`[data-ledger-line]`（携行集亦零节点）", () => {
  const ledgerSlice = [{ text: "台账变化：…", warn: true }]
  const tree = treeMod.chatTree(flowModel({ ledger: ledgerSlice }))
  const marks = { group: 0, line: 0 }
  const walk = (node) => {
    if (node === null || typeof node !== "object") return
    if (node.props?.["data-ledger"] !== undefined) marks.group += 1
    if (node.props?.["data-ledger-line"] !== undefined) marks.line += 1
    for (const child of Array.isArray(node.children) ? node.children : []) walk(child)
  }
  walk(tree)
  assert.equal(marks.group, 0, "构树零 `[data-ledger]` 组")
  assert.equal(marks.line, 0, "构树零 `[data-ledger-line]` 行")
  assert.equal(Object.hasOwn(chromeMod, "ledgerGroupNode"), false, "导出面零 `ledgerGroupNode`")

  withFakeDom(() => {
    i18n.initDict({})
    const root = new FakeNode("div")
    chromeMod.syncChrome(root, flowModel({ ledger: ledgerSlice }), {})
    assert.equal(root.querySelector("[data-ledger]"), null, "帧刷后零 `[data-ledger]`")
    assert.equal(root.querySelector("[data-ledger-line]"), null, "帧刷后零 `[data-ledger-line]`")
  })
})

test("T4·锚链顺链：`blockAnchor`/`compressAnchorOf` 退化为次锚（越过 `[data-ledger]`）", () => {
  withFakeDom(() => {
    const chain = [["data-timer", "timer"], ["data-stopped", "stopped"], ["data-help", "help"], ["data-card", "card"], ["data-pill", "pill"]]
    for (const [attr, name] of chain) {
      const root = new FakeNode("div")
      root.append(mkNode("data-ledger")) // 残影件（模拟旧版式节点）—— 链不收
      const target = mkNode(attr, "")
      root.append(target)
      assert.equal(chromeMod.blockAnchor(root), target, `blockAnchor 顺链 ⇒ ${name}`)
      assert.equal(compressMod.compressAnchorOf(root), target, `compressAnchorOf 顺链 ⇒ ${name}`)
    }
    const lone = new FakeNode("div")
    lone.append(mkNode("data-ledger"))
    assert.equal(chromeMod.blockAnchor(lone), null, "仅残影件 ⇒ 锚零（链面零收益）")
    assert.equal(compressMod.compressAnchorOf(lone), null, "compressAnchorOf 同零")
  })
})

test("T4·尾组行为锚：`timerAnchorOf`/`stoppedAnchorOf` 顺链落点（逐链断言落的节点）", () => {
  withFakeDom(() => {
    i18n.initDict({})
    const helpRows = [{ kind: "label", text: "帮助" }]
    // ① 次锚 = 帮助行族（无停止痕 ∥ 无残影件）：timer ∥ stopped 恒居 help 前——[timer][stopped][help][pill]
    //   （卡面在场判据 = 待决项 —— 无待决项时 syncCards 按设计摘除卡节点 ⇒ 本腿不携卡件；卡锚单元腿见上一条）
    const rootA = new FakeNode("div")
    rootA.append(mkNode("data-help"))
    rootA.append(mkNode("data-pill"))
    chromeMod.syncChrome(rootA, flowModel({ timer: { text: "到期触发" }, stopped: true, help: helpRows, following: false }), {})
    assert.deepEqual(seqOf(rootA), ["timer", "stopped", "help", "pill"], "timer ∥ stopped 落 help 前（次锚 = help）")
    // ② 残影件在场：链越过 `[data-ledger]` —— 新节点落该件之后、帮助行族之前
    const rootB = new FakeNode("div")
    rootB.append(mkNode("data-ledger"))
    rootB.append(mkNode("data-help"))
    rootB.append(mkNode("data-pill"))
    chromeMod.syncChrome(rootB, flowModel({ timer: { text: "到期触发" }, stopped: true, help: helpRows, following: false }), {})
    assert.deepEqual(seqOf(rootB), ["ledger", "timer", "stopped", "help", "pill"], "锚不落残影件（顺链至 help）")
  })
})

// ─── T5 桌面源面锁 ──────────────────────────────────────────────────────────────

test("T5 桌面源面锁：六档零行组面词汇", () => {
  const targets = [
    `${RENDERER}/views/chat-chrome.mjs`, `${RENDERER}/views/chat-tree.mjs`, `${RENDERER}/views/chat-model.mjs`,
    `${RENDERER}/events-slices.mjs`, `${RENDERER}/frame-dispatch.mjs`, `${RENDERER}/views/compress-status.mjs`,
  ]
  const tokens = ["data-ledger", "syncLedger", "ledgerGroupNode", "ledgerAnchorOf", "ledgerOf", "ledgerLines", "台账行"]
  const leftovers = []
  for (const rel of targets) {
    const body = text(rel)
    for (const token of tokens) if (body.includes(token)) leftovers.push(`${rel} :: ${token}`)
  }
  assert.deepEqual(leftovers, [], "六档零命中（源面锁）")
})

// ─── T6 主机出站：载荷零 `lines` ────────────────────────────────────────────────

test("T6 主机出站：`ev:ledger` 载荷零 `lines` ∥ 明细 ∥ 状态位照出；源面零 `LINE_COLORS`/`pending`", async () => {
  const base = tmpBase("t6")
  coreDbNm._setLedgerDirForTest(join(base, "ledger-db"))
  try {
    const proj = mkProject(join(base, "ws"), "proj-x")
    coreCmdNm.ledgerAdd({ cwd: proj, row: { kind: "requirement", title: "需求一" } })
    coreCmdNm.ledgerAdd({ cwd: proj, row: { kind: "tech_todo", title: "待办一" } })
    const emitted = []
    const surface = await projectInfo.pushLedgerLines({ cwd: proj, key: "1", post: (channel, payload) => emitted.push({ channel, payload }) })
    assert.ok(surface !== null && typeof surface.dispose === "function", "拍面句柄在场（真核拍链）")
    const deadline = Date.now() + 8000
    while (emitted.length === 0 && Date.now() < deadline) await new Promise((r) => setTimeout(r, 25))
    projectInfo.stopLedgerRefresh()
    assert.equal(emitted.length, 1, "首拍恰一出站（周期拍未至）")
    const { channel, payload } = emitted[0]
    assert.equal(channel, "ev:ledger", "通道不变")
    assert.equal(Object.hasOwn(payload, "lines"), false, "载荷零 `lines` 键")
    assert.equal(payload.key, "1", "键面照旧")
    assert.ok(Array.isArray(payload.detailLines) && payload.detailLines.length === 1, "`detailLines` 照出（单档单行）")
    assert.match(payload.detailLines[0], /^台账 proj-x：需求池 1 · 技术待办 1（老化 0）/, "明细行核产逐字")
    assert.deepEqual(payload.marker, { text: "台账 1·1", warn: false }, "`marker` 照出（核判位转发）")
    const src = text(`${MAIN}/project-info.mjs`)
    assert.equal(src.includes("LINE_COLORS"), false, "源面零 `LINE_COLORS`")
    assert.equal(src.includes("pending"), false, "源面零 `pending`（拍内行缓冲已退场）")
  } finally {
    coreDbNm._resetLedgerDirForTest()
  }
})

// ─── T7 VSC 源面 ∥ 档存 ─────────────────────────────────────────────────────────

test("T7 VSC 源面 ∥ 档存：零 `ledgerNotice` ∥ 零 `pushLine`/`pushLedgerStartup`；孤儿档不在盘", () => {
  const messages = text(`${VSC}/webview/chat-messages.js`)
  assert.equal(messages.includes("ledgerNotice"), false, "`chat-messages.js` 零 `ledgerNotice`（消息名）")
  const surface = text(`${VSC}/src/extension/ledger-surface.mjs`)
  for (const token of ["ledgerNotice", "pushLine", "pushLedgerStartup"]) {
    assert.equal(surface.includes(token), false, `VSC 胶水零 \`${token}\``)
  }
  const panel = text(`${VSC}/src/extension/panel-messages.mjs`)
  for (const token of ["pushLedgerStartup", "ledgerNotice"]) {
    assert.equal(panel.includes(token), false, `面板面零 \`${token}\``)
  }
  assert.equal(existsSync(resolve(ROOT, `${VSC}/webview/ledger-line.js`)), false, "`webview/ledger-line.js` 已删（孤儿档）")
})

// ─── T8 孤儿终检（表征扫描）─────────────────────────────────────────────────────

test("T8 孤儿终检：四符号全树零命中；`ledgerNotice` 仅余会话注记族保留形", () => {
  const files = scanSource()
  assert.ok(files.length > 100, `扫描面在场（${files.length} 档）`)
  for (const token of ["renderLedgerLine", "addLedgerNotice", "data-ledger-line", "ledgerLines"]) {
    const hits = files.filter((f) => f.body.includes(token)).map((f) => f.rel)
    assert.deepEqual(hits, [], `\`${token}\` 零命中`)
  }
  const RETAINED = ["session.ledgerNotice", "ledgerNoticeNode", "ledgerNoticeText"]
  const noticeFiles = files.filter((f) => f.body.includes("ledgerNotice"))
  assert.ok(noticeFiles.length > 0, "会话注记族保留形在场（`session.ledgerNotice` 键族）")
  const strays = []
  for (const f of noticeFiles) {
    for (const line of f.body.split("\n")) {
      if (!line.includes("ledgerNotice")) continue
      if (!RETAINED.some((form) => line.includes(form))) strays.push(`${f.rel} :: ${line.trim()}`)
    }
  }
  assert.deepEqual(strays, [], "保留形外零命中（消息名面已退场）")
})

// ─── T9 样式面 ─────────────────────────────────────────────────────────────────

test("T9 样式面：三 CSS 零 `.chat-ledger`/`.ledger-line`", () => {
  const core = text(`${RENDERER}/core.css`)
  assert.equal(core.includes(".ledger-line"), false, "`core.css` 零 `.ledger-line` 规则")
  assert.equal(core.includes(".chat-ledger"), false, "`core.css` 零 `.chat-ledger`")
  const fixes = text(`${RENDERER}/chat-fixes.css`)
  assert.equal(fixes.includes(".chat-ledger"), false, "`chat-fixes.css` 零 `.chat-ledger` 块")
  assert.equal(fixes.includes("ledger-line"), false, "`chat-fixes.css` 零行面词汇")
  const vscCss = text(`${VSC}/webview/chat.css`)
  assert.equal(vscCss.includes(".ledger-line"), false, "VSC `chat.css` 零 `.ledger-line` 规则")
})

// ─── T10 词面零触 ──────────────────────────────────────────────────────────────

test("T10 词面零触：`（属主已死 ` 单源仍在 `ledger-executors.mjs`", () => {
  const executors = text("thincoder-core/ledger-executors.mjs")
  assert.ok(executors.includes("（属主已死 ${dead}，可接手）"), "词面单源在档（逐字契约）")
  const hits = scanSource().filter((f) => f.body.includes("（属主已死 "))
  const files = [...new Set(hits.map((f) => f.rel))]
  assert.deepEqual(files, ["thincoder-core/ledger-executors.mjs"], "全树单源（本批未改词面）")
})

// ─── T11 CLI 源面锁 ────────────────────────────────────────────────────────────

test("T11 CLI 源面锁：调用形 `{ state, agent, render }` ∥ 胶水零 `colors`/`pushLine`", () => {
  const idx = text(`${CLI}/index.mjs`)
  assert.match(idx, /startLedgerSurface\(\{ state, agent, render \}\)/, "调用形 = { state, agent, render }（去 `pushLine`）")
  const glue = text(`${CLI}/ledger-surface.mjs`)
  for (const token of ["colors", "pushLine", "import { C }"]) {
    assert.equal(glue.includes(token), false, `CLI 胶水零 \`${token}\``)
  }
})

// ─── T12 核面锁 ────────────────────────────────────────────────────────────────

test("T12 核面锁：`ledger-surface.mjs` 零 pushLine/notify/行产；`ledger.mjs` 零七符号", () => {
  const surface = text("thincoder-core/ledger-surface.mjs")
  for (const token of ["pushLine", "notify", "startup", "planChangeLines", "formatAgingLine", "formatThresholdLine", "detailScans"]) {
    assert.equal(surface.includes(token), false, `核 surface 零 \`${token}\``)
  }
  const ledger = text("thincoder-core/ledger.mjs")
  for (const token of ["planChangeLines", "formatAgingLine", "formatThresholdLine", "notifyKey", "loadNotifyState", "saveNotifyState", "NOTIFY_FILE"]) {
    assert.equal(ledger.includes(token), false, `核 ledger 零 \`${token}\``)
  }
})

// ─── T13 核行为（负向锁）────────────────────────────────────────────────────────

test("T13 核行为：注入假 `pushLine` ⇒ 零调用 ∥ `state.ledger` 照写 ∥ `render` 照调", async () => {
  const base = tmpBase("t13")
  coreDb._setLedgerDirForTest(join(base, "ledger-db"))
  try {
    const proj = mkProject(join(base, "ws"), "proj-y")
    coreCmd.ledgerAdd({ cwd: proj, row: { kind: "requirement", title: "需求一" } })
    const state = { ledger: null }
    const pushed = []
    let renders = 0
    await coreSurface.runLedgerScan({
      state, anchor: proj,
      render: () => { renders += 1 },
      pushLine: (text, warn) => pushed.push({ text, warn }),
      colors: {},
    })
    assert.equal(pushed.length, 0, "假 `pushLine` 零调用（行产面退场）")
    assert.equal(renders, 1, "`render` 照调（恰一拍一次）")
    assert.equal(state.ledger.marker, "台账 1·0", "`state.ledger` 标记照写（核单源）")
    assert.equal(state.ledger.warn, false, "判位照旧（零老化 ∥ 零死执行者）")
    assert.equal(typeof state.ledger.scannedAt, "number", "时间戳在场")
  } finally {
    coreDb._resetLedgerDirForTest()
  }
})

// ─── T14 核保留面 ──────────────────────────────────────────────────────────────

test("T14 核保留面：`formatDetailLine`/`detailScans`/`executorTail`/`formatMarker` 在位 ∥ `scopeMarkerOf` 判位照旧", () => {
  for (const name of ["formatDetailLine", "detailScans", "executorTail", "formatMarker", "scopeMarkerOf"]) {
    assert.equal(typeof coreLedger[name], "function", `\`${name}\` 在位`)
  }
  assert.equal(coreLedger.formatMarker({ pool: 3, tech: 2 }), "台账 3·2", "L1 标记逐字")
  assert.equal(coreLedger.formatMarker(null), null, "无 scan ⇒ null")

  assert.equal(coreLedger.executorTail({ executors: [] }), "", "无在途 ⇒ 空串")
  assert.equal(coreLedger.executorTail({ executors: [{ state: "dead", staleDays: 0 }] }), "（属主已死 1，可接手）", "死执行者优先")
  assert.equal(coreLedger.executorTail({ executors: [{ state: "alive", staleDays: 2 }] }), "（执行中 1 · 最长 2 天未动）", "长停滞形")
  assert.equal(coreLedger.executorTail({ executors: [{ state: "alive", staleDays: null }] }), "（执行中 1）", "短停滞形")

  const line = coreLedger.formatDetailLine({ name: "p", pool: 2, tech: 1, aged: 1, thresholdReached: true, executors: [{ state: "dead", staleDays: 3 }] })
  assert.equal(line, "台账 p：需求池 2 · 技术待办 1（老化 1） — 可开批（属主已死 1，可接手）", "L2 明细行逐字（判活尾段在内）")

  const a = { root: "/a", pool: 1, tech: 0, aged: 0 }
  const b = { root: "/b", pool: 2, tech: 0, aged: 1, actionable: true }
  const c = { root: "/c", pool: 0, tech: 0, aged: 0, actionable: false }
  assert.deepEqual(coreLedger.detailScans([a, b, c], a).map((s) => s.root), ["/a", "/b"], "明细行集 = current + actionable 余项")

  assert.deepEqual(coreLedger.scopeMarkerOf([], { current: null }), { marker: null, warn: false }, "空范围 ⇒ 零标记（不落 0·0）")
  assert.deepEqual(coreLedger.scopeMarkerOf([a, b], { current: { root: "/a" } }), { marker: "台账 1·0", warn: false }, "具体项目锚 ⇒ 仅自身")
  assert.deepEqual(coreLedger.scopeMarkerOf([a, b], { current: null }), { marker: "台账 3·0", warn: true }, "容器根锚 ⇒ 族内合计（warn 随行动项）")
})

// ─── T15 CLI 保面（`render-frame.mjs` L1 链零改）────────────────────────────────

test("T15 CLI 保面：`render-frame.mjs` `ledgerHint` 链源面零改", () => {
  const frame = text(`${CLI}/render-frame.mjs`)
  assert.match(frame, /const lg = state\.ledger/, "L1 读面在档")
  assert.match(frame, /const ledgerHint = lg\?\.marker/, "`ledgerHint` 链在档")
  assert.match(frame, /\$\{ledgerHint\}/, "链段注入在档（状态簇）")
  assert.equal(/ledgerGroupNode|ledgerLines|data-ledger/.test(frame), false, "零行推线面词汇")
})