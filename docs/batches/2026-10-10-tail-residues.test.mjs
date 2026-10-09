/**
 * 2026-10-10-tail-residues.test.mjs — 尾行三件收口批 · 单元腿（批内件 · 随批留存归档；不入仓套件）。
 * 跑法（thincoder/ 仓根）：`node --test docs/batches/2026-10-10-tail-residues.test.mjs`
 * 判据单源 = 批档 `docs/batches/2026-10-10-tail-residues.md` §2.2 ∥ §2.3 ∥ §2.4（+ 设计评审 §3 发现 3 抛错腿）。
 * 腿十（#711① 甲乙丙丁戊 ∥ #711② 甲乙乙′丙 ∥ #1073 甲乙）：
 *   ①甲 面序结算（双面同帧——改前 2ΔA + ΔB = 360 ⇒ 改后 ΔA + ΔB = 330，先红后绿）；
 *   ①乙 单面帧零回归（settled = 0 ⇒ 取代式 ≡ 原式）+ 既有纯函数腿逐值复跑（E4-JS ⑪ 原值）；
 *   ①丙 回退径（复读不可得：算式径并账，不叠前序；含退化空窗面零贡献）；
 *   ①丁 跟滚帧（delta = 0 ∥ 零矩形读 ∥ 贴底写覆盖）；
 *   ①戊 行数腿（净 ≤ +1 ⇒ 现值 498 < 500）；
 *   ②甲 披露助手（真 `mountSegments` 建账 + 假件面）：隐藏段 ⇒ 段 ±1 放窗 + `true`；在窗 ⇒ `true` 零写；未分段 ∥ 段号非法 ⇒ `false`；
 *   ②乙 核缝调用序（`deps.reveal` 先于 `scrollIntoView`；`scroll=false` 不调；缺 dep 零行为）——**面外补桩**：
 *        假文档装需 `window.NodeFilter` ∥ `document.createTreeWalker` ∥ `mark.closest` 三件（沿 E4-JS ⑨ 假件形 + 面外补桩）；
 *   ②乙′ 抛错径（评审发现 3）：`reveal` 抛 ⇒ `console.error` 恰一条 ∧ 跳转照常 ∧ 调用序不变；
 *   ②丙 端壳接线（桌面正锁：`reveal: revealSegmentAt` 真径驱动 ∧ import 在位）+ VSC 负锁（零 `reveal` 键 ∥ 单 root 调用面）；
 *   ③甲 写面三态回执门（假 panel）：`ok` ⇒ 恰一条回执；`no-write` ⇒ 零回执 + warn 一条；`conflict` ⇒ `providerError{providers,mtime-conflict}` ∧ 零回执；
 *   ③乙 真写面（临时 config 缝）：空钥 ⇒ `no-write` 零写盘；真钥 ⇒ `ok` 落盘（trim 语义回归）+ 冲突注入 ⇒ `conflict`。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（须先于任何渲染面取件）

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const vsc = (rel) => pathToFileURL(join(ROOT, "thincoder-vscode", rel)).href
const core = (rel) => pathToFileURL(join(ROOT, "thincoder-core", rel)).href
const desk = (rel) => pathToFileURL(join(ROOT, "thincoder-desktop", rel)).href

// 家目录重定向（安全网：一切动态 import 之前覆盖，防误写真实配置）
const HOME = mkdtempSync(join(tmpdir(), "tr-home-"))
process.env.HOME = HOME
process.env.USERPROFILE = HOME

// ─── VSC 链桩：vscode 模块桩 + 假 config-io（armed ⇒ 冲突归一串；695 ∥ 2026-10-08 冻结件同法）────────
const VSCODE_STUB_URL = "data:text/javascript," + encodeURIComponent(`
export const workspace = { workspaceFolders: [], workspaceFile: undefined, getConfiguration: () => ({ get: () => undefined, update: async () => {} }), onDidChangeWorkspaceFolders: () => ({ dispose() {} }), findFiles: async () => [], getWorkspaceFolder: () => null }
export const window = { showWarningMessage: async () => undefined, showErrorMessage: async () => undefined, showInformationMessage: async () => undefined, showQuickPick: async () => undefined, showInputBox: async () => undefined, createStatusBarItem: () => ({ show() {}, hide() {}, dispose() {}, tooltip: null, backgroundColor: null, command: null, text: "" }), activeTerminal: null, terminals: [], createTerminal: () => ({ show() {}, sendText() {}, dispose() {} }), onDidChangeTerminalShellIntegration: () => ({ dispose() {} }), onDidChangeActiveTextEditor: () => ({ dispose() {} }), withProgress: async (_o, fn) => fn({ report() {} }) }
export const commands = { executeCommand: async () => undefined, registerCommand: () => ({ dispose() {} }) }
export const Uri = { file: (p) => ({ fsPath: p, toString: () => String(p) }), parse: (p) => ({ fsPath: String(p), toString: () => String(p) }) }
export class MarkdownString { constructor(v) { this.value = v } }
export class ThemeColor { constructor(id) { this.id = id } }
export class ThemeIcon { constructor(id) { this.id = id } }
export class Disposable { dispose() {} }
export class EventEmitter { constructor() { this.event = () => ({ dispose() {} }); this.fire = () => {} } }
export const StatusBarAlignment = { Left: 1, Right: 2 }
export const ViewColumn = { One: 1 }
export const env = { openExternal: async () => undefined, language: "en" }
export const extensions = { getExtension: () => null }
export const languages = { createDiagnosticCollection: () => ({ set() {}, clear() {}, dispose() {} }), getDiagnostics: () => [] }
export class Position { constructor(line, ch) { this.line = line; this.character = ch } }
export class Range { constructor(s, e) { this.start = s; this.end = e } }
export const SymbolKind = {}
`)
const CORE_IO = core("config-io.mjs")
const FAKE_IO_URL = "data:text/javascript," + encodeURIComponent(`
import * as real from ${JSON.stringify(CORE_IO)}
export * from ${JSON.stringify(CORE_IO)}
export function setProviderKey(name, key) {
  if (globalThis.__trArmed !== true) return real.setProviderKey(name, key)
  return real.conflictError({ ok: false, reason: "mtime-conflict" })
}
`)
globalThis.__trArmed = false
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "vscode") return { url: VSCODE_STUB_URL, shortCircuit: true }
    if (specifier === "@thincoder/core/config-io.mjs") return { url: FAKE_IO_URL, shortCircuit: true }
    return nextResolve(specifier, context)
  },
})

// ─── ① 面序结算假件台：布局模型 = 文档序堆叠，壳 rect 按现显示态实时推得 ────────────────────────
const RAW = "x".repeat(25_000) // 25K 渲染文本 ⇒ 3 段（12K ∕ 段）
const ZERO_RECT = { top: 0, bottom: 0, height: 0 }

/** 建台：`defs` = [{ heights, window, top?, bare? }]（文档序）；`bare` = 零壳（退化面）。 */
function makeStage(defs) {
  const reads = { count: 0 }
  const layoutRects = new Map()
  let layout = () => {}
  const faces = defs.map((def) => {
    const segs = def.heights.map(() => [])
    const record = { face: null, raw: RAW, chars: RAW.length, count: def.heights.length, segs, tail: null, window: { ...def.window }, waits: [] }
    const shells = def.bare === true ? [] : def.heights.map((_, seg) => {
      const shell = {
        style: { display: "" },
        getBoundingClientRect: () => { reads.count += 1; layout(); return (layoutRects.get(record) ?? [])[seg] ?? ZERO_RECT },
      }
      segs[seg].push(shell)
      return shell
    })
    if (def.bare !== true) {
      for (let seg = 0; seg < shells.length; seg += 1) shells[seg].style.display = seg >= def.window.first && seg <= def.window.last ? "" : "none"
    }
    const rawNode = { nodeType: 3, data: RAW, parentNode: null }
    const tailSpan = { parentNode: null, nextSibling: null }
    const face = {
      nodeType: 1, childNodes: [rawNode], firstChild: rawNode, ownerDocument: null,
      querySelectorAll: () => [], contains: (node) => node === tailSpan,
      getAttribute: (k) => (k === "data-raw" ? RAW : null), setAttribute() {},
    }
    rawNode.parentNode = face
    tailSpan.parentNode = face
    record.face = face
    record.tail = { span: tailSpan, seg: def.heights.length - 1 }
    const node = { querySelector: (sel) => (sel === "[data-raw]" ? face : null) }
    seg.ACCOUNTS.set(face, record)
    return { def, record, face, node, shells }
  })
  layout = () => {
    let cursor = 0
    layoutRects.clear()
    for (const f of faces) {
      if (f.def.top !== undefined) cursor = f.def.top
      const rects = []
      for (let seg = 0; seg < f.def.heights.length; seg += 1) {
        const shell = f.shells[seg]
        if (shell !== undefined && shell.style.display !== "none") {
          rects.push({ top: cursor, bottom: cursor + f.def.heights[seg], height: f.def.heights[seg] })
          cursor += f.def.heights[seg]
        } else rects.push(ZERO_RECT)
      }
      layoutRects.set(f.record, rects)
    }
  }
  layout()
  const root = {
    scrollTop: 5000, scrollHeight: 100_000, clientHeight: 600,
    getBoundingClientRect: () => { reads.count += 1; return { top: 1000, bottom: 1600, height: 600 } },
  }
  const mounted = faces.map((f) => ({ node: f.node, block: { text: RAW, kind: "assistant" } }))
  return { faces, root, mounted, reads, layout }
}

const seg = await import(desk("renderer/views/chat-text-segments.mjs"))
const { revealSegmentAt } = await import(desk("renderer/views/chat-segment-reveal.mjs"))
const { createSearch } = await import(pathToFileURL(join(ROOT, "thincoder-render-core", "search.mjs")).href)

test("①甲 面序结算：双面同帧（复读径取代式 ⇒ ΔA + ΔB；改前 2ΔA + ΔB）", () => {
  // A（视口上——算式径：卸 h100 ∥ 挂 h130 ⇒ 自身 +30，起于 y=0）∥ B（跨视口顶——复读径：锚段 1 顶 1000 ⇒ 写后 1330）
  const stage = makeStage([
    { heights: [100, 900, 130], window: { first: 0, last: 1 } },
    { heights: [300, 300, 300], window: { first: 1, last: 2 } },
  ])
  stage.root.scrollTop = 5000
  const readout = seg.segmentViewStep(stage.root, { following: false }, stage.mounted)
  assert.equal(readout.faces, 2, "两面同帧成案")
  assert.deepEqual(readout.shows.slice().sort(), [0, 2].sort(), "段窗变更发生（读数面）")
  assert.equal(readout.delta, 330, `面序结算：ΔA(30) + ΔB(300) = 330（改前 = 2ΔA + ΔB = 360）`)
  assert.equal(stage.root.scrollTop, 5330, "scrollTop 写入量 = 基数 + delta（同值）")
})

test("①乙 单面帧零回归（取代式 ≡ 原式）+ E4-JS ⑪ 纯函数原值复跑", () => {
  const stage = makeStage([{ heights: [300, 300, 300], window: { first: 1, last: 2 }, top: 800 }])
  stage.root.scrollTop = 5000
  const readout = seg.segmentViewStep(stage.root, { following: false }, stage.mounted)
  assert.equal(readout.faces, 1, "单面帧")
  assert.equal(readout.delta, 300, "单面（已结算前序合计 = 0）⇒ 取代式 ≡ 原式：显示段 0（h300）位移 = 300")
  assert.equal(stage.root.scrollTop, 5300, "同值写入")
  // 既有纯函数腿（E4-JS 批内件 ⑪ 原值——本批零改锁定）
  const above = { top: 0, height: 100 }
  const half = { top: 150, height: 100 }
  const below = { top: 300, height: 100 }
  assert.equal(seg.aboveHeight(above, 200), 100)
  assert.equal(seg.aboveHeight(half, 200), 50, "跨界 ⇒ 只计锚上部分")
  assert.equal(seg.aboveHeight(below, 200), 0, "锚下变更零补偿")
  assert.equal(seg.aboveHeight(null, 200), 0, "缺件零假造")
  assert.equal(seg.compensateSegments({ anchorTop: 200, hides: [above], shows: [] }), -100, "卸上 ⇒ scrollTop -= h")
  assert.equal(seg.compensateSegments({ anchorTop: 200, hides: [], shows: [above] }), 100, "挂上 ⇒ scrollTop += h")
  assert.equal(seg.compensateSegments({ anchorTop: 200, hides: [below], shows: [below] }), 0)
  assert.equal(seg.aboveOf({ seg: 2, rect: { top: -100, height: 500 } }, 5, 0), 500, "锚前段 ⇒ 全高")
  assert.equal(seg.aboveOf({ seg: 7, rect: { top: 300, height: 500 } }, 5, 0), 0, "锚后段 ⇒ 零")
  assert.equal(seg.aboveOf({ seg: 5, rect: { top: -100, height: 500 } }, 5, 0), 100, "同段 ⇒ 屏面部分量")
  assert.equal(seg.aboveOf({ seg: 2, rect: null }, 5, 0), 0, "缺矩形零假造")
  assert.equal(seg.segmentShift({ anchorSeg: 5, anchorTop: 0, hides: [{ seg: 3, rect: { top: -900, height: 900 } }] }), -900, "卸上 ⇒ -全高")
  assert.equal(seg.segmentShift({ anchorSeg: 5, anchorTop: 0, shows: [{ seg: 4, rect: { top: -400, height: 400 } }] }), 400, "挂上 ⇒ +全高")
  assert.equal(seg.segmentShift({ anchorSeg: 5, anchorTop: 0, hides: [{ seg: 9, rect: { top: 100, height: 400 } }] }), 0, "锚下零补偿")
})

test("①丙 回退径：复读不可得（两面皆视口上 + 退化空窗面）⇒ 算式径并账，不叠前序", () => {
  const stage = makeStage([
    { heights: [10, 20, 35], window: { first: 0, last: 1 } },          // A：视口上（own = 35 − 10 = +25）
    { heights: [10, 20, 35], window: { first: 0, last: 1 }, top: 30 }, // D：视口上（own = +25）
    { heights: [10, 20, 35], window: { first: 0, last: -1 }, top: 110, bare: true }, // E：退化（空窗无壳——锚段不可测）
  ])
  stage.root.scrollTop = 5000
  const readout = seg.segmentViewStep(stage.root, { following: false }, stage.mounted)
  assert.equal(readout.faces, 3, "三面同帧成案（含退化面）")
  assert.equal(readout.delta, 50, "算式径并账：own_A(25) + own_D(25) + own_E(0)——前序位移不入（无一量叠两遍）")
  assert.equal(stage.root.scrollTop, 5050, "同值写入")
})

test("①丁 跟滚帧：delta = 0 ∥ 零矩形读 ∥ 贴底写覆盖", () => {
  const stage = makeStage([{ heights: [100, 900, 130], window: { first: 0, last: 1 } }])
  stage.reads.count = 0
  const readout = seg.segmentViewStep(stage.root, { following: true }, stage.mounted)
  assert.equal(readout.delta, 0, "跟滚帧零补偿读数")
  assert.equal(stage.reads.count, 0, "跟滚帧零读（根 ∥ 段壳皆零矩形读）")
  assert.equal(stage.root.scrollTop, Number.MAX_SAFE_INTEGER, "贴底写覆盖（写超值不读 scrollHeight）")
})

test("①戊 行数腿：净 ≤ +1 ⇒ 现值 498 < 500（贴层线）", () => {
  const lines = readFileSync(join(ROOT, "thincoder-desktop", "renderer", "views", "chat-text-segments.mjs"), "utf8").split("\n")
  if (lines.at(-1) === "") lines.pop()
  assert.equal(lines.length, 498, "现值 = 498（497 ⇒ 498——复读径面序结算净 +1）")
  assert.ok(lines.length < 500, "贴 500 线未越（≤500 口径；净 >3 行即须先执行在册拆分）")
})

// ─── ②甲 披露助手：真 `mountSegments` 建账（假 DOM）+ 假件命中 ─────────────────────────────────
/** 分段建账最小假 DOM（沿 E4-JS ⑫ 手造面件形）；节点带 closest（披露助手取面 ∥ 段）。 */
function makeBareDoc() {
  const closestOf = (node, sel) => {
    let cursor = node
    while (cursor !== null && cursor !== undefined) {
      if (sel === "[data-raw]" && cursor.nodeType === 1 && cursor.attrs?.["data-raw"] !== undefined) return cursor
      if (sel === "span[data-seg]" && cursor.nodeType === 1 && cursor.tagName === "SPAN" && cursor.attrs?.["data-seg"] !== undefined) return cursor
      cursor = cursor.parentNode
    }
    return null
  }
  class FText {
    constructor(data) { this.nodeType = 3; this.data = String(data); this.parentNode = null }
    get nextSibling() { const p = this.parentNode; if (!p) return null; const i = p.childNodes.indexOf(this); return p.childNodes[i + 1] ?? null }
    get previousSibling() { const p = this.parentNode; if (!p) return null; const i = p.childNodes.indexOf(this); return i > 0 ? p.childNodes[i - 1] : null }
    splitText(offset) {
      const tail = new FText(this.data.slice(offset))
      this.data = this.data.slice(0, offset)
      const i = this.parentNode.childNodes.indexOf(this)
      tail.parentNode = this.parentNode
      this.parentNode.childNodes.splice(i + 1, 0, tail)
      return tail
    }
    closest(sel) { return closestOf(this, sel) }
  }
  class FNode {
    constructor(tag) { this.nodeType = 1; this.tagName = String(tag).toUpperCase(); this.childNodes = []; this.parentNode = null; this.attrs = {}; this.style = { display: "" } }
    get firstChild() { return this.childNodes[0] ?? null }
    get nextSibling() { const p = this.parentNode; if (!p) return null; const i = p.childNodes.indexOf(this); return p.childNodes[i + 1] ?? null }
    setAttribute(k, v) { this.attrs[k] = String(v) }
    getAttribute(k) { return this.attrs[k] ?? null }
    insertBefore(node, ref) {
      if (node.parentNode !== null && node.parentNode !== undefined) node.parentNode.removeChild(node)
      const i = ref === null || ref === undefined ? this.childNodes.length : this.childNodes.indexOf(ref)
      this.childNodes.splice(i < 0 ? this.childNodes.length : i, 0, node)
      node.parentNode = this
      return node
    }
    appendChild(node) { return this.insertBefore(node, null) }
    removeChild(node) {
      const i = this.childNodes.indexOf(node)
      if (i >= 0) this.childNodes.splice(i, 1)
      node.parentNode = null
      return node
    }
    contains(node) { let c = node; while (c) { if (c === this) return true; c = c.parentNode } return false }
    querySelectorAll(sel) {
      const out = []
      const walk = (n) => { for (const c of n.childNodes ?? []) { if (c.nodeType === 1 && sel === "span[data-seg]" && c.attrs["data-seg"] !== undefined) out.push(c); walk(c) } }
      walk(this)
      return out
    }
    getBoundingClientRect() { return ZERO_RECT }
    closest(sel) { return closestOf(this, sel) }
  }
  return { FNode, FText }
}

test("②甲 披露助手：隐藏段命中 ⇒ 段 ±1 放窗 + true；在窗 ⇒ true 零写；未分段 ∥ 段号非法 ⇒ false", () => {
  const { FNode, FText } = makeBareDoc()
  const doc = { createElement: (tag) => new FNode(tag) }
  const face = new FNode("div")
  face.ownerDocument = doc
  face.setAttribute("data-raw", RAW)
  const text = new FText(RAW)
  face.appendChild(text)
  const record = seg.mountSegments({ querySelector: (sel) => (sel === "[data-raw]" ? face : null) }, { text: RAW, kind: "assistant" }, true)
  assert.ok(record, "真径建账成功")
  assert.equal(record.count, 3, "巨块 ⇒ 3 段")
  assert.deepEqual(record.window, { first: 1, last: 2 }, "跟滚初窗 = 底窗（段 0 隐藏）")
  const displayOf = (segNo) => record.segs[segNo].map((span) => span.style.display)
  // (a) 隐藏段（0）命中 ⇒ 段 ±1 放窗 + true
  const hiddenHit = doc.createElement("mark")
  record.segs[0][0].appendChild(hiddenHit)
  assert.equal(revealSegmentAt(hiddenHit), true, "隐藏段命中 ⇒ 披露成功")
  assert.deepEqual(record.window, { first: 0, last: 1 }, "一次性放窗（段 ±1）")
  assert.equal(displayOf(0).includes("none"), false, "命中段 0 已显示")
  assert.equal(displayOf(2).includes("none"), true, "窗外交（段 2）折回隐藏")
  // (b) 已在窗（段 1）⇒ true ∧ 零写（显示态 ∥ 窗逐值不变）
  const inWindowHit = doc.createElement("mark")
  record.segs[1][0].appendChild(inWindowHit)
  const snapshot = JSON.stringify({ window: record.window, d0: displayOf(0), d1: displayOf(1), d2: displayOf(2) })
  assert.equal(revealSegmentAt(inWindowHit), true, "已在窗 ⇒ true（幂等）")
  assert.equal(JSON.stringify({ window: record.window, d0: displayOf(0), d1: displayOf(1), d2: displayOf(2) }), snapshot, "零写（幂等）")
  // (c) 未分段面 ∥ 未在账 ⇒ false ∧ 零触
  const plain = new FNode("div")
  plain.setAttribute("data-raw", "small")
  const plainHit = doc.createElement("mark")
  plain.appendChild(plainHit)
  assert.equal(revealSegmentAt(plainHit), false, "未在账（零分区面）⇒ false")
  // (d) 段号非法 ⇒ false
  const bogus = new FNode("span")
  bogus.setAttribute("data-seg", "9")
  face.appendChild(bogus)
  const bogusHit = doc.createElement("mark")
  bogus.appendChild(bogusHit)
  assert.equal(revealSegmentAt(bogusHit), false, "段号越界 ⇒ false")
  // (e) 段外命中（非段壳内）⇒ false
  const nakedHit = doc.createElement("mark")
  face.appendChild(nakedHit)
  assert.equal(revealSegmentAt(nakedHit), false, "段壳外 ⇒ false")
})

// ─── ②乙 ∥ ②乙′ 核缝：假文档装（window.NodeFilter ∥ createTreeWalker ∥ closest 面外补桩）────────
/** 假搜索文档装（每例新装——marks ∥ 调用序 ∥ closest 探针）。 */
function makeSearchEnv() {
  const marks = []
  const seq = []
  const parent = { replaceChild() {}, normalize() {} }
  const textNode = { nodeType: 3, nodeValue: "hello world", parentElement: { closest: () => null }, parentNode: parent }
  const markOf = () => {
    const el = {
      nodeType: 1, tagName: "MARK", className: "", textContent: "", parentNode: parent,
      _classes: new Set(),
      closest: (sel) => { seq.push(["closest", sel]); return null },
      scrollIntoView: () => { seq.push(["scrollIntoView", el]) },
    }
    el.classList = {
      toggle: (name, force) => {
        const on = force === undefined ? !el._classes.has(name) : !!force
        if (on) el._classes.add(name); else el._classes.delete(name)
        return on
      },
    }
    return el
  }
  const rootEl = { querySelectorAll: (sel) => (sel === "mark.search-hit" ? marks.filter((m) => m.className === "search-hit") : []) }
  globalThis.window = { NodeFilter: { SHOW_TEXT: 4, FILTER_ACCEPT: 1, FILTER_REJECT: 2 } }
  globalThis.document = {
    addEventListener() {}, removeEventListener() {}, getElementById: () => null,
    querySelector: (sel) => (sel === '[data-slot="flow"]' ? rootEl : null),
    createDocumentFragment: () => ({ appendChild: () => {} }),
    createTextNode: (v) => ({ nodeType: 3, nodeValue: String(v) }),
    createElement: () => { const el = markOf(); marks.push(el); return el },
    createTreeWalker: (_r, _w, filter) => {
      let served = false
      return { nextNode: () => { if (served) return null; served = true; return filter.acceptNode(textNode) === 1 ? textNode : null } }
    },
  }
  return { marks, seq, rootEl }
}

test("②乙 核缝调用序：reveal 先于 scrollIntoView；搜索自跑不调；缺 dep 直跳不抛", () => {
  const envA = makeSearchEnv()
  const calls = []
  const searchA = createSearch({ root: envA.rootEl, reveal: (el) => { calls.push(["reveal", el]); envA.seq.push(["reveal", el]) } })
  searchA.performSearch("world")
  assert.equal(calls.length, 0, "搜索自跑（scroll = false）不调 reveal")
  searchA.jumpSearch(1)
  assert.deepEqual(envA.seq.map((e) => e[0]), ["reveal", "scrollIntoView"], "跳转径：reveal ⇒ scrollIntoView（序）")
  assert.equal(calls[0][1], envA.marks[0], "reveal 实参 = 当前命中件")
  assert.equal(envA.seq[1][1], envA.marks[0], "命中件照常 `scrollIntoView`")
  // 缺 reveal dep（VSC 形）⇒ 直跳不抛
  const envB = makeSearchEnv()
  const searchB = createSearch({ root: envB.rootEl })
  searchB.performSearch("world")
  searchB.jumpSearch(1)
  assert.deepEqual(envB.seq.map((e) => e[0]), ["scrollIntoView"], "缺 dep ⇒ 零额外调用（VSC 形零行为）")
})

test("②乙′ 抛错径：reveal 抛 ⇒ console.error 恰一条 ∧ 跳转照常 ∧ 调用序不变", () => {
  const env = makeSearchEnv()
  const errors = []
  const realError = console.error
  console.error = (...args) => { errors.push(args) }
  const search = createSearch({ root: env.rootEl, reveal: () => { env.seq.push(["reveal", "boom"]); throw new Error("reveal-boom") } })
  try {
    search.performSearch("world")
    search.jumpSearch(1)
  } finally {
    console.error = realError
  }
  assert.equal(errors.length, 1, "reveal 抛 ⇒ console.error 恰一条（零静默降级）")
  assert.equal(errors[0][0], "[search] reveal hook failed:", "记错词面")
  assert.deepEqual(env.seq.map((e) => e[0]), ["reveal", "scrollIntoView"], "失败仍照常跳转 ∥ 调用序不变")
})

test("②丙 端壳接线：桌面正锁（reveal 实参真径驱动 + import 在位）∥ VSC 负锁（零 reveal 键）", async () => {
  const env = makeSearchEnv()
  const { attachSearch } = await import(desk("renderer/search.mjs"))
  const face = attachSearch()
  assert.ok(face, "attachSearch 返回核件工厂面")
  face.performSearch("world")
  face.jumpSearch(1)
  assert.deepEqual(env.seq.map((e) => e[0]), ["closest", "scrollIntoView"], "桌面端壳已传 reveal（真披露助手执行 ⇒ closest 探针先于跳转）")
  assert.equal(env.seq[0][1], "[data-raw]", "披露助手取面径")
  const deskSrc = readFileSync(join(ROOT, "thincoder-desktop", "renderer", "search.mjs"), "utf8")
  assert.ok(deskSrc.includes('import { revealSegmentAt } from "./views/chat-segment-reveal.mjs"'), "桌面端壳 import 在位")
  assert.ok(deskSrc.includes("createSearch({ root, reveal: revealSegmentAt })"), "桌面端壳 reveal 实参在位")
  const vscSrc = readFileSync(join(ROOT, "thincoder-vscode", "webview", "search.js"), "utf8")
  assert.equal(vscSrc.includes("reveal"), false, "VSC 端壳零 reveal 键（搜索行为逐字不变）")
  assert.match(vscSrc, /createSearch\(\{\s*root:\s*ctx\.messagesEl\s*\}\)/, "VSC 调用面 = 单 root 实参（纯搬形保持）")
})

// ─── ③ 写结果三态：回执 ⟺ 真写 ──────────────────────────────────────────────────────────────────
const configCore = await import(CORE_IO)
const { handleSaveProviderKey } = await import(vsc("src/extension/panel-messages-settings.mjs"))
const { storeProviderKey } = await import(vsc("src/extension/presets.mjs"))
const alphaKeyOnDisk = (cfg) => JSON.parse(readFileSync(cfg, "utf8")).providers.find((p) => p?.name === "alpha")?.apiKey
const tmpCfg = (seed) => {
  const dir = mkdtempSync(join(tmpdir(), "tr-vsc-"))
  const cfg = join(dir, "config.json")
  writeFileSync(cfg, JSON.stringify(seed, null, 2) + "\n")
  return cfg
}

test("③甲 写面三态回执门（假 panel）：ok ⇒ 回执；no-write ⇒ 零回执 + warn 一条；conflict ⇒ 映射照旧", async () => {
  const warnLines = []
  const realWarn = console.warn
  console.warn = (...args) => { warnLines.push(args.join(" ")) }
  try {
    const run = async (result) => {
      const sink = []
      const panel = { _panel: { webview: { postMessage: (m) => sink.push(m) } }, _saveProviderKey: async () => result }
      await handleSaveProviderKey(panel, { name: "alpha", key: "" })
      return sink
    }
    const okSink = await run({ status: "ok" })
    assert.deepEqual(okSink.map((m) => m.type), ["providerKeySaved"], "ok ⇒ 恰一条受理回执")
    assert.equal(okSink[0].name, "alpha", "回执载荷 = { name }")
    const noWriteSink = await run({ status: "no-write" })
    assert.equal(noWriteSink.length, 0, "no-write ⇒ 零回执（回执 ⟺ 真写）")
    assert.equal(warnLines.length, 1, "no-write ⇒ warn 恰一条（零静默）")
    const conflictSink = await run({ status: "conflict", hint: configCore.CONFIG_CONFLICT_HINT })
    assert.deepEqual(conflictSink, [{ type: "providerError", scope: "providers", reason: "mtime-conflict" }], "conflict ⇒ providerError 词化码照旧")
    assert.equal(warnLines.length, 1, "conflict 不发 warn")
  } finally {
    console.warn = realWarn
  }
})

test("③乙 真写面（临时 config 缝）：空钥 no-write 零写盘 ∥ 真钥 ok 落盘 ∥ 冲突注入 conflict", async () => {
  const cfg = tmpCfg({ providers: [{ name: "alpha", baseURL: "http://127.0.0.1:9/v1", model: "m" }] })
  configCore._setConfigPathForTest(cfg)
  try {
    assert.deepEqual(await storeProviderKey("alpha", ""), { status: "no-write" }, "空钥 ⇒ no-write")
    assert.deepEqual(await storeProviderKey("alpha", "   "), { status: "no-write" }, "全空白 ⇒ no-write")
    assert.equal(alphaKeyOnDisk(cfg), undefined, "no-write ⇒ 盘面零写")
    assert.deepEqual(await storeProviderKey("alpha", " k "), { status: "ok" }, "真钥 ⇒ ok")
    assert.equal(alphaKeyOnDisk(cfg), "k", "trim 语义回归（盘面 apiKey = k）")
    globalThis.__trArmed = true
    try {
      assert.deepEqual(await storeProviderKey("alpha", "k2"), { status: "conflict", hint: configCore.CONFIG_CONFLICT_HINT }, "冲突 ⇒ conflict + hint 透传")
    } finally {
      globalThis.__trArmed = false
    }
    assert.equal(alphaKeyOnDisk(cfg), "k", "冲突 ⇒ 盘面零写（仍为前值 k）")
  } finally {
    configCore._resetConfigPathForTest()
  }
})
