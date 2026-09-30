/**
 * 2026-09-29-enddiff-clearance-b637.test.mjs — 端差清算轮（#626–#637）批内件**拆分产物**（#637 受占切换半幅）。
 * 拆分来源 = `docs/batches/2026-09-29-enddiff-clearance.test.mjs`（现盘 >500 行硬限 ⇒ 2026-09-29
 * core-carryover 批拆档）：拆点 = B6b 块后 ∕ 原 #637 段标前；本档 = 原档 `:458-509` 逐字搬移
 * （B7 ∕ B8 两用例——断言零改、用例数守恒）；**头部自持**（imports + 助手 + 所需桩——零跨档 import）。
 * 覆盖（判据单源 = `docs/batches/2026-09-29-enddiff-clearance.md` §2.1 逐条「判据」列）：
 *   #637 动作层三臂（受占 ⇒ `occupied:true` ∧ 切换成立 ∕ 非受占 ⇒ 键缺席 ∕ 槽缺 ⇒ 失败信封）+
 *   渲染面 toast 两向（occupied ⇒ toast 在场 ∕ 非受占 ⇒ 零 toast）。
 * 跑法（仓根）：node --test .thincoder/tmp/2026-09-29-enddiff-clearance-b637.test.mjs（暂存位——现盘）
 *             node --test docs/batches/2026-09-29-enddiff-clearance-b637.test.mjs（终位——父侧移档后；同深 ⇒ 相对 import 一致）
 * 运行器面注（2026-09-29 实测，同原档）：本机 Node 24 `node --test` 子进程报告面存在 stdout 帧竞争——
 * 读数走 `process.stderr.write`（本件已落）；另稳形 = `--test-isolation=none`（同进程直跑，读数 stdout 可见）。
 * （`/rc/` 解析钩子在档内静态预载——toast 取件面。）
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { createRequire } from "node:module"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（须先于任何 /rc/ 取件）

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const at = (p) => pathToFileURL(join(ROOT, p)).href
const req = createRequire(join(ROOT, "thincoder-desktop/package.json"))
const coreAt = (p) => pathToFileURL(req.resolve("@thincoder/core/" + p)).href
const tick = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms))
const out = (label, value) => process.stderr.write(`[读数] ${label}: ${value}\n`) // 读数走 stderr（见档头「运行器面」注）

// ─── mini 假 DOM（toast ∕ 设置行面最小集 —— 沿 `2026-09-28-desktop-subblock-follow` 件先例）──
const camelOf = (name) => name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())
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
  fire(type, event = {}) { for (const l of this.listeners) if (l.type === type) l.fn({ type, ...event }) }
  focus() {}
  appendChild(node) {
    const child = node instanceof FakeNode ? node : new FakeText(node)
    child.parent = this
    this.children.push(child)
    this.bump()
    return child
  }
  append(...nodes) { for (const n of nodes) this.appendChild(n) }
  insertBefore(node, anchor) {
    const at = anchor == null ? -1 : this.children.indexOf(anchor)
    if (at < 0) this.children.push(node); else this.children.splice(at, 0, node)
    node.parent = this
    this.bump()
    return node
  }
  get childNodes() { return [...this.children] }
  get firstChild() { return this.children[0] ?? null }
  get lastElementChild() { return [...this.children].reverse().find((c) => c instanceof FakeNode) ?? null }
  get firstElementChild() { return this.children.find((c) => c instanceof FakeNode) ?? null }
  replaceChildren(...nodes) { for (const c of this.children) c.parent = null; this.children = []; for (const n of nodes) this.appendChild(n) }
  remove() { if (this.parent) { const at = this.parent.children.indexOf(this); if (at >= 0) this.parent.children.splice(at, 1); this.parent.bump() } }
  replaceWith(next) { const p = this.parent; if (!p) return; const at = p.children.indexOf(this); p.children[at] = next; next.parent = p; p.bump() }
  prepend(node) { this.children.unshift(node); node.parent = this; this.bump() }
  querySelector(sel) { let hit = null; this.walk((n) => { if (hit === null && matches(n, sel)) hit = n }); return hit }
  querySelectorAll(sel) { const outList = []; this.walk((n) => { if (matches(n, sel)) outList.push(n) }); return outList }
  closest(sel) { for (let n = this; n != null; n = n.parent ?? null) if (n instanceof FakeNode && matches(n, sel)) return n; return null }
  walk(fn) { for (const c of this.children) { if (c instanceof FakeNode) { fn(c); c.walk(fn) } } }
  set innerHTML(value) { this._html = String(value) }
  get innerHTML() { return this._html ?? "" }
  bump() { this.textContent = this.children.map((c) => c.textContent ?? "").join("") }
}
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
  getElementById(id) { for (const c of docBody.children) if (c.id === id) return c; return null },
}
// 注：本档零 electron 桩（依赖链零 electron 取件——主侧 route 只走 `./session-slots.mjs`）。

// ─── 窄桥桩（session-wire 模块级读取先于 —— 逐通道分发）────────────────────────────
const sessionSwitchState = { occupied: false }
globalThis.thincoder = {
  invoke: async (channel) => {
    if (channel === "session:switch") return { ok: true, reason: null, cwd: "c", slot: 1, ...(sessionSwitchState.occupied ? { occupied: true } : {}) }
    if (channel === "history:page") return { ok: true, messages: [], hasOlder: false, next: null, meta: {}, flags: {} }
    if (channel === "project:recent") return { cwd: "c", recent: [] }
    if (channel === "sessions:list") return { cwd: "c", sessions: [{ slot: 1 }], ledger: null }
    return { ok: true, reason: null }
  },
}

// ─── 词典装配（核件取词经注册端出 —— 沿 subblock 件先例）+ 取件 ───────────────────────
const { initDict, setStringsSink, t } = await import(at("thincoder-desktop/renderer/i18n.mjs"))
const { setStrings } = await import(at("thincoder-render-core/i18n.mjs"))
const { projectDictionary } = await import(coreAt("i18n.mjs"))
setStringsSink(setStrings)
initDict({ locale: "en", dict: projectDictionary("en") })

globalThis.window = {} // 渲染面装载（先于其取件——本档零主侧装载面，免 preload.cjs 装配面）
const sessionActions = await import(at("thincoder-desktop/src/main/session-actions.mjs"))
const sessionWire = await import(at("thincoder-desktop/renderer/session-wire.mjs"))
const { showToast } = await import("/rc/toast.mjs")
const coreSlots = await import(coreAt("session-slots.mjs"))
const processProbe = await import(coreAt("process-probe.mjs"))

// ─── B 腿 · #637 受占切换半幅 ─────────────────────────────────────────────────

test("B7 #637 · 动作层三臂：受占 ⇒ occupied:true ∧ 切换成立 ∕ 非受占 ⇒ 键缺席 ∕ 槽缺 ⇒ 失败信封", async () => {
  const dir = mkdtempSync(join(tmpdir(), "enddiff-slots-"))
  coreSlots._setSessionsDirForTest(dir)
  // 探测束注入缝（判据单源 = 核 `process-probe`）：属主 pid 存活 + 本产品身份 ⇒ 核判 occupied。
  processProbe._setProcessProbeTestImpl({
    aliveFn: (pids) => new Set(pids),
    cmdlineFn: (pids) => new Map(pids.map((p) => [p, "node bin/thincoder.cjs"])),
  })
  try {
    const cwd = join(dir, "proj")
    const created = await sessionActions.createSession(cwd)
    const slot = created.slot
    const mp = coreSlots.manifestPath(cwd)
    const writeOccupancy = (owner) => {
      const raw = JSON.parse(readFileSync(mp, "utf8"))
      raw.slotSessions = owner === null ? {} : { [slot]: owner }
      writeFileSync(mp, JSON.stringify(raw))
    }
    writeOccupancy(`${process.pid}-other-session`) // 受占（属主 = 另一 sessionId；pid 存活 ⇒ occupied）
    const occupied = sessionActions.switchSession(cwd, slot)
    assert.equal(occupied.ok, true, "受占 ⇒ 切换仍成立（核不认领 + 次存 fork）")
    assert.equal(occupied.occupied, true, "受占 ⇒ 回执增键 occupied:true")
    writeOccupancy(null)
    const free = sessionActions.switchSession(cwd, slot)
    assert.equal(free.ok, true)
    assert.equal("occupied" in free, false, "非受占 ⇒ 键缺席（既有形零回归）")
    const missing = sessionActions.switchSession(cwd, 99)
    assert.equal(missing.ok, false)
    assert.equal("occupied" in missing, false, "槽缺 ⇒ 失败信封无 occupied 键")
  } finally {
    processProbe._resetProcessProbeTestImpl()
    coreSlots._setSessionsDirForTest(null)
  }
  out("B7 动作层", "受占=occupied:true · 非受占=缺席 · 槽缺=fail")
})

test("B8 #637 · 渲染面：occupied ⇒ toast 在场（非受占 ⇒ 零 toast）", async () => {
  sessionSwitchState.occupied = false
  const first = await sessionWire.activateSession("1")
  assert.equal(first, true, "切换成功径")
  assert.equal(document.getElementById("paste-toast"), null, "非受占 ⇒ 零 toast")
  sessionSwitchState.occupied = true
  await sessionWire.activateSession("1")
  const toast = document.getElementById("paste-toast")
  assert.equal(toast?.textContent, t("session.occupied"), "受占 ⇒ toast 词面（词表值）")
  await tick()
  assert.equal(document.getElementById("paste-toast")?.textContent, t("session.occupied"), "toast 不被后续载入面覆写")
  clearTimeout(showToast._t) // 收尾卫生：toast 自散定时器不悬留（子进程事件环干净——运行器 IPC 不受扰）
  out("B8 渲染面", `toast=${JSON.stringify(toast?.textContent)}`)
})
