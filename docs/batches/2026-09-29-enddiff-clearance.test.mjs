/**
 * 2026-09-29-enddiff-clearance.test.mjs — 端差清算轮（#626–#637）批内件（批 A 核钩子 + 批 B 桌面码面机检腿）。
 * 覆盖（判据单源 = `docs/batches/2026-09-29-enddiff-clearance.md` §2.1 逐条「判据」列）：
 *   A 腿（#628）：核六推回点各触 `onSubTurnBreak` 恰一次（+ `onTurnEnd` 超集零回归）· 干净完成零触 ·
 *     两负向锁（`post-turn.mjs` 工具批尾零触 + `turn-loop.mjs` 中断注入点零载波——结构锁）· 桌面桥
 *     `onSubTurnBreak` ⇒ `ev:activity{turnBreak}`（`onTurnEnd` 摘挂）· VSC 面板 `turnBreak` 达 webview（F1 复活 · 端到端）。
 *   B 腿：#627 探测两臂 + 纯函数三面（候选表 ∕ argv ∕ spawn 形）+ 注入缝全链四臂 · #630 `.sub-desc` 四臂
 *     （首枚恰一 ∕ 跨会话零重插 ∕ 零块重建零重插 ∕ 新 root 归零复发）· #631 中断摘要逐字（+ 已结算零改写）·
 *     #635 数值行「零发送」维持（父侧裁 (a)——B6 臂实录）+ #645 核清除形扩族落定（B6b 改判：数值键 null
 *     ⇒ ok + 盘删键 + 回读默认）· #637 受占切换半幅（动作层三臂 + 渲染面 toast 两向）⇒ **拆分产物**
 *     `docs/batches/2026-09-29-enddiff-clearance-b637.test.mjs`（>500 拆档——2026-09-29 core-carryover 批）。
 * 跑法（仓根）：node --test docs/batches/2026-09-29-enddiff-clearance.test.mjs
 * **运行器面注（2026-09-29 实测）**：本机 Node 24 `node --test` 子进程报告面存在 stdout 帧竞争——用例内 `console.log`
 * 达一定量时运行器偶发 `Unable to deserialize cloned data`（用例全绿仍报红；同机既有锁件亦罕发）；对策 = 读数
 * 走 `process.stderr.write`（本件已落，实测 12 连稳定）；另稳形 = `--test-isolation=none`（同进程直跑，读数 stdout 可见）。
 * （`/rc/` 解析钩子在档内静态预载；electron 桩 = data: URL registerHooks——ipc 装载面。）
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { createRequire, registerHooks } from "node:module"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（须先于任何 /rc/ 取件）

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const at = (p) => pathToFileURL(join(ROOT, p)).href
const req = createRequire(join(ROOT, "thincoder-desktop/package.json"))
const coreAt = (p) => pathToFileURL(req.resolve("@thincoder/core/" + p)).href
const read = (p) => readFileSync(join(ROOT, p), "utf8")
const tick = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms))
const out = (label, value) => process.stderr.write(`[读数] ${label}: ${value}\n`) // 读数走 stderr（见档头「运行器面」注——stdout 读数在本机 Node 子报告帧内相抵）
const contentLines = (text) => {
  const parts = text.split("\n")
  if (parts.length && parts[parts.length - 1] === "") parts.pop()
  return parts.length
}

// ─── electron 桩（ipc.mjs 装载面；`shell.openPath` 经 globalThis 注入计数 ∕ 变臂）──────────
const ELEC = `
export const protocol = { registerSchemesAsPrivileged: () => {}, handle: () => {} }
export const BrowserWindow = class {}
export const Menu = { buildFromTemplate: () => ({}) }
export const dialog = { showMessageBox: async () => ({}), showOpenDialog: async () => ({ filePaths: [] }) }
export const nativeTheme = { shouldUseDarkColors: false }
export const net = { fetch: async () => ({ status: 0, headers: new Headers() }) }
export const shell = { openExternal: () => {}, openPath: async (p) => globalThis.__enddiffOpenPath(p) }
export const ipcMain = { handle: () => {}, removeHandler: () => {} }
export const app = { getPath: () => "", quit: () => {}, on: () => {}, whenReady: async () => {} }
`
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "electron") return { url: "data:text/javascript," + encodeURIComponent(ELEC), shortCircuit: true }
    return nextResolve(specifier, context)
  },
})

// ─── mini 假 DOM（pool ∕ toast ∕ 设置行面最小集 —— 沿 `2026-09-28-desktop-subblock-follow` 件先例）──
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
const docRegistry = { settingsScope: null }
const docBody = new FakeNode("body")
globalThis.Node = FakeNode
globalThis.document = {
  createElement: (tag) => new FakeNode(tag),
  createTextNode: (value) => new FakeText(value),
  body: docBody,
  getElementById(id) { for (const c of docBody.children) if (c.id === id) return c; return null },
  querySelector(sel) { return sel === '[data-slot="settings"]' ? docRegistry.settingsScope : null },
}
// 注：`globalThis.window` 缓设（须后于 ipc.mjs 装载 —— 否则 preload.cjs 顶层 `assemble()` 走 require("electron")）。

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

const coreCompletion = await import(coreAt("agent/completion.mjs"))
const corePostTurn = await import(coreAt("agent/post-turn.mjs"))
const { createBridge } = await import(at("thincoder-desktop/src/main/agent-bridge.mjs"))
const { buildPanelCallbacks } = await import(at("thincoder-vscode/src/extension/panel-callbacks.mjs"))
const editorOpen = await import(at("thincoder-desktop/src/main/editor-open.mjs"))
const { fileOpen } = await import(at("thincoder-desktop/src/main/ipc.mjs"))
globalThis.window = {} // 渲染面装载（先于其取件；主侧装载面之后 —— 避 preload.cjs 装配面）
const { createAgentExits } = await import(at("thincoder-desktop/renderer/mount-settings-segments-agent.mjs"))
const { mountPool } = await import(at("thincoder-desktop/renderer/views/activity.mjs"))
const chatTool = await import(at("thincoder-desktop/renderer/views/chat-tool.mjs"))
const sessionActions = await import(at("thincoder-desktop/src/main/session-actions.mjs"))
const sessionWire = await import(at("thincoder-desktop/renderer/session-wire.mjs"))
const { showToast } = await import("/rc/toast.mjs")
const coreSlots = await import(coreAt("session-slots.mjs"))
const processProbe = await import(coreAt("process-probe.mjs"))

// ─── A 腿 · #628 核钩子 ────────────────────────────────────────────────────────

const mkAgent = (over = {}) => ({ history: [], config: { agent: {} }, tasks: [], provider: { model: "m" }, ...over })
const runCompletion = (agent, content, opts = {}) => {
  const hits = { break: 0, end: 0 }
  const r = coreCompletion.handleCompletion(agent, { content, toolCalls: [] }, opts.depth ?? 0, 0, opts.guardPushbacks ?? 0, opts.honest ?? false, opts.advisorPushbacks ?? 0, {
    onSubTurnBreak: () => { hits.break += 1 },
    onTurnEnd: () => { hits.end += 1 },
  })
  return { r, hits }
}
const AT_LEAST_ONE = (hits, label) => {
  assert.equal(hits.break, 1, `${label}：onSubTurnBreak 恰一次`)
  assert.equal(hits.end, 1, `${label}：onTurnEnd 超集零回归（恰一次）`)
}

test("A1 #628 · 六推回点各触 onSubTurnBreak 恰一次（+ onTurnEnd 回归）；干净完成零触", () => {
  AT_LEAST_ONE(runCompletion(mkAgent(), "").hits, "① 空响应续跑")
  AT_LEAST_ONE(runCompletion(mkAgent({ tasks: [{ status: "pending", title: "t" }] }), "C").hits, "② 待办推回")
  const g3 = mkAgent({ _mutatedThisRun: true }); g3.config.agent.verifyGuard = true
  AT_LEAST_ONE(runCompletion(g3, "C").hits, "③ verify 守卫推回")
  const g4 = mkAgent({ _mutatedThisRun: true, _verifiedThisRun: true, _verifyPassed: false, _verifyRetries: 0 }); g4.config.agent.verifyGuard = true
  AT_LEAST_ONE(runCompletion(g4, "C").hits, "④ verify 重试推回")
  const g5 = mkAgent({ _mutatedThisRun: true, _verifiedThisRun: true, _verifyPassed: false, _verifyRetries: 3 }); g5.config.agent.verifyGuard = true
  AT_LEAST_ONE(runCompletion(g5, "C").hits, "⑤ verify 耗尽诚实行")
  const g6 = mkAgent({ _mutatedThisRun: true }); g6.config.advisor = { guard: true }
  AT_LEAST_ONE(runCompletion(g6, "C").hits, "⑥ advisor 守卫推回")
  const clean = runCompletion(mkAgent(), "DONE")
  assert.equal(clean.r.action, "done")
  assert.deepEqual(clean.hits, { break: 0, end: 0 }, "干净完成零触（控制臂）")
  out("A1 六点计数", "break=1 ∧ end=1 ×6 · 控制臂 0/0")
})

test("A2 #628 · 负向锁：post-turn 工具批尾零触（行为）+ turn-loop ∕ post-turn 零载波（结构）", () => {
  const agentPT = { history: [], _pendingReminders: [], _pendingTimers: [] }
  const hits = { break: 0, end: 0 }
  corePostTurn.injectPostTurn(agentPT, [], [], { onSubTurnBreak: () => { hits.break += 1 }, onTurnEnd: () => { hits.end += 1 } }, 0)
  assert.equal(hits.break, 0, "post-turn：onSubTurnBreak 零触（窄义 —— 与 VSC 不断块同判）")
  assert.equal(hits.end, 1, "post-turn：onTurnEnd 照旧恰一次（超集语义零改）")

  const completion = read("thincoder-core/agent/completion.mjs")
  const callSites = completion.split("\n").filter((l) => l.includes("onSubTurnBreak?.()")).filter((l) => l.trim().startsWith("callbacks.")).length
  assert.equal(callSites, 6, "completion.mjs：onSubTurnBreak 调用点恰 6（六推回点）")
  for (const file of ["thincoder-core/agent/post-turn.mjs", "thincoder-core/agent/turn-loop.mjs"]) {
    assert.equal(read(file).includes("onSubTurnBreak"), false, `${file}：onSubTurnBreak 零载波（中断注入 ∕ 工具批尾两点不再产 turnBreak）`)
  }
  out("A2 负向锁", "post-turn break=0 · 两档结构零载波 · completion 调用点=6")
})

test("A3 #628 · 桌面桥改挂：onSubTurnBreak ⇒ ev:activity{turnBreak}；onTurnEnd 摘挂", () => {
  const posts = []
  const cbs = createBridge({ post: (channel, payload) => posts.push({ channel, payload }) })("7")
  assert.equal(typeof cbs.onSubTurnBreak, "function", "窄义钩子在场")
  cbs.onSubTurnBreak()
  assert.deepEqual(posts.at(-1), { channel: "ev:activity", payload: { key: "7", event: "turnBreak" } }, "turnBreak 出站形（键前置 + 无 fields）")
  assert.equal("onTurnEnd" in cbs, false, "onTurnEnd 摘挂（不再产 turnBreak）")
  out("A3 桥面", JSON.stringify(posts.at(-1)))
})

test("A4 #628 · VSC 面板：turnBreak 达 webview（单点 + 核六点端到端 —— F1 复活）", () => {
  const messages = []
  const panel = { _panel: { webview: { postMessage: (m) => messages.push(m) } }, _pushSettingsLight() {}, _setPlanMode() {} }
  const cbs = buildPanelCallbacks(panel, { cwd: "", p: {}, fullHistory: [], history: [], providerName: "x", turnSlot: null, distillSlot: null, autoTurn: false })
  cbs.onSubTurnBreak()
  assert.deepEqual(messages.at(-1), { type: "turnBreak" }, "面板单点 ⇒ webview turnBreak")
  const g = mkAgent({ _mutatedThisRun: true }); g.config.agent.verifyGuard = true
  coreCompletion.handleCompletion(g, { content: "C", toolCalls: [] }, 0, 0, 0, false, 0, cbs)
  assert.deepEqual(messages.at(-1), { type: "turnBreak" }, "核推回点 ⇒ VSC webview turnBreak（B1 死面复活）")
  out("A4 VSC", `messages=${messages.length} · last=${JSON.stringify(messages.at(-1))}`)
})

// ─── B 腿 · #627 编辑器探测 ∕ 全链 ─────────────────────────────────────────────

test("B1 #627 · 纯函数面：候选表 ∕ argv 构造 ∕ spawn 形（win32 ⇒ cmd 包装）", () => {
  assert.deepEqual([...editorOpen.EDITOR_CANDIDATES], ["code", "code-insiders", "cursor", "subl"], "候选表与优先序")
  assert.equal(editorOpen.editorStyleOf("C:/tools/subl.cmd"), "colon", "subl ⇒ path:line 形")
  assert.equal(editorOpen.editorStyleOf("/usr/bin/code"), "goto", "code 族 ⇒ --goto 形")
  assert.deepEqual(editorOpen.buildEditorArgs("C:/tools/code.cmd", "a.mjs", 7), ["--goto", "a.mjs:7"], "命中 ⇒ 参数含行")
  assert.deepEqual(editorOpen.buildEditorArgs("C:/tools/subl.exe", "a b.mjs", 12), ["a b.mjs:12"], "subl ⇒ path:line")
  assert.deepEqual(editorOpen.buildEditorArgs("C:/tools/code.cmd", "a.mjs", undefined), ["a.mjs"], "无行参 ⇒ 纯路径")
  assert.deepEqual(editorOpen.buildEditorArgs("C:/tools/code.cmd", "a.mjs", -1), ["a.mjs"], "非正整数行 ⇒ 纯路径")

  const spec = editorOpen.spawnSpecOf("C:/Prog Files/code.cmd", ["--goto", "C:/my proj/a.mjs:3"], "win32")
  assert.equal(spec.command, "cmd.exe", "win32 + .cmd ⇒ cmd 包装")
  assert.deepEqual(spec.args, ["/d", "/s", "/c", '"C:/Prog Files/code.cmd" --goto "C:/my proj/a.mjs:3"'], "argv 数组 ⇒ 命令行（核 quoteArg 引用）")
  assert.equal(spec.windowsVerbatimArguments, true)
  assert.deepEqual(editorOpen.spawnSpecOf("C:/tools/subl.exe", ["a.mjs:1"], "win32"), { command: "C:/tools/subl.exe", args: ["a.mjs:1"], windowsVerbatimArguments: false }, "win32 + .exe ⇒ 直 spawn")
  assert.deepEqual(editorOpen.spawnSpecOf("/usr/bin/code", ["--goto", "a.mjs:1"], "linux"), { command: "/usr/bin/code", args: ["--goto", "a.mjs:1"], windowsVerbatimArguments: false }, "非 win32 ⇒ 直 spawn")
  out("B1 spawn 形", JSON.stringify(spec.args.at(-1)))
})

test("B2 #627 · 探测：优先序首命中 ∕ 回显入口路径 ∕ 未命中 ⇒ null ∕ memo", async () => {
  const calls = []
  editorOpen._setEditorDetectForTest(async (cmd) => { calls.push(cmd); return cmd === "cursor" ? "C:/tools/cursor.cmd" : null })
  try {
    assert.equal(await editorOpen.detectEditorCli(), "C:/tools/cursor.cmd", "首命中回显入口路径")
    assert.deepEqual(calls, ["code", "code-insiders", "cursor"], "探测序 = 候选表序（首命中即取）")
    const before = calls.length
    assert.equal(await editorOpen.detectEditorCli(), "C:/tools/cursor.cmd", "memo 命中")
    assert.equal(calls.length, before, "memo：二次调用零重探")
    editorOpen._setEditorDetectForTest(async () => null)
    assert.equal(await editorOpen.detectEditorCli(), null, "未命中 ⇒ null（调用面兜底）")
  } finally { editorOpen._setEditorDetectForTest(null) }
  out("B2 探测", `calls=${JSON.stringify(calls)}`)
})

test("B3 #627 · 全链四臂（注入缝）：命中 ⇒ spawn 含行 ∕ 未命中 ∕ spawn 失败 ∕ 全链失败", async () => {
  const spawnCalls = []
  const openPathCalls = []
  globalThis.__enddiffOpenPath = async (p) => { openPathCalls.push(p); return "" }
  editorOpen._setEditorSpawnForTest((entry, args) => { spawnCalls.push({ entry, args }); return true })
  try {
    // 臂① 命中 ⇒ spawn（参数含行）· 兜底零起
    editorOpen._setEditorDetectForTest(async () => "C:/tools/code.cmd")
    let r = await fileOpen({ path: "C:/proj/a.mjs", line: 42 })
    assert.deepEqual(r, { ok: true, reason: null })
    assert.deepEqual(spawnCalls.at(-1).args, ["--goto", "C:/proj/a.mjs:42"], "参数含行")
    assert.equal(openPathCalls.length, 0, "命中径兜底零起")
    // 臂② 未命中 ⇒ 兜底恰一次
    editorOpen._setEditorDetectForTest(async () => null)
    r = await fileOpen({ path: "C:/proj/b.mjs", line: 1 })
    assert.deepEqual(r, { ok: true, reason: null })
    assert.equal(openPathCalls.length, 1, "未命中 ⇒ 兜底恰一次")
    assert.equal(spawnCalls.length, 1, "未命中 ⇒ spawn 零起")
    // 臂③ spawn 失败 ⇒ 兜底恰一次
    editorOpen._setEditorDetectForTest(async () => "C:/tools/code.cmd")
    editorOpen._setEditorSpawnForTest((entry, args) => { spawnCalls.push({ entry, args }); return false })
    r = await fileOpen({ path: "C:/proj/c.mjs", line: 2 })
    assert.deepEqual(r, { ok: true, reason: null })
    assert.equal(openPathCalls.length, 2, "spawn 失败 ⇒ 兜底恰一次")
    // 臂④ 全链失败 ⇒ {ok:false, reason} 直传（零静默）
    globalThis.__enddiffOpenPath = async (p) => { openPathCalls.push(p); return "no association" }
    r = await fileOpen({ path: "C:/proj/d.mjs" })
    assert.deepEqual(r, { ok: false, reason: "no association" }, "兜底亦败 ⇒ 错误串直传")
    // 臂⑤ 坏载荷 ⇒ bad-path（零探测 ∕ 零 spawn ∕ 零兜底）
    const probes = spawnCalls.length
    r = await fileOpen({ path: "relative/x.mjs" })
    assert.deepEqual(r, { ok: false, reason: "bad-path" })
    assert.equal(spawnCalls.length, probes, "bad-path ⇒ 零 spawn")
    assert.equal(openPathCalls.length, 3, "bad-path ⇒ 零兜底")
  } finally {
    editorOpen._setEditorDetectForTest(null)
    editorOpen._setEditorSpawnForTest(null)
    delete globalThis.__enddiffOpenPath
  }
  out("B3 全链", `spawn=${spawnCalls.length} · openPath=${openPathCalls.length}`)
})

// ─── B 腿 · #630 `.sub-desc` 判据 ─────────────────────────────────────────────

const row = (text) => ({ kind: "text", text })
const liveEntry = (rows, extra = {}) => ({ key: "sub:coder#1", label: "coder#1", role: "coder", id: 1, status: "running", pool: true, frozen: false, rows, ...extra })
const poolState = (blocks, extra = {}) => ({
  activeSession: "1",
  pool: { approvals: [], queue: [], running: blocks.length, approval: 0 },
  subBlocks: { "1": blocks },
  poolCollapsed: {},
  ...extra,
})
const descCount = (root) => root.querySelectorAll(".sub-desc").length

test("B4 #630 · `.sub-desc`：首枚块出生恰一 ∕ 跨会话零重插 ∕ 零块重建零重插 ∕ 新 root 归零复发", () => {
  const root = new FakeNode("div")
  mountPool(root, poolState([liveEntry([row("a")])]))
  assert.equal(descCount(root), 1, "首枚块出生 ⇒ `.sub-desc` 恰一")
  const block = root.querySelector(".sub-block")
  const desc = root.querySelector(".sub-desc")
  assert.equal(desc.parent, block, "插入点零改（块元素内）")
  assert.ok(block.children.indexOf(desc) < block.children.indexOf(block.querySelector(".advisor-content")), "位置 = `.advisor-content` 之前")

  // 会话换代（族重建）⇒ 新块出生零重插（旧判据 = 族 DOM 探针 ⇒ 此处会重插）
  mountPool(root, { ...poolState([liveEntry([row("a")], { id: 2 })]), activeSession: "2", subBlocks: { "2": [liveEntry([row("a")], { id: 2 })] } })
  assert.equal(descCount(root), 0, "跨会话切换后再出生 ⇒ 零重插（root 旗标一次置位）")

  // 零块重建（族容器弃账）⇒ 再生零重插
  mountPool(root, poolState([]))
  mountPool(root, poolState([liveEntry([row("a")])]))
  assert.equal(descCount(root), 0, "零块重建后再出生 ⇒ 零重插")

  // 新 root（app 重载同判）⇒ 归零 ∴ 再显一次
  const fresh = new FakeNode("div")
  mountPool(fresh, poolState([liveEntry([row("a")])]))
  assert.equal(descCount(fresh), 1, "新 root ⇒ 旗标归零（VSC webview 重载同判）")
  out("B4 `.sub-desc`", `首发=1 · 换代=0 · 零块重建=0 · 新 root=1`)
})

// ─── B 腿 · #631 中断工具卡摘要 ───────────────────────────────────────────────

test("B5 #631 · 中断未结算卡：状态段 = 已中断 ∧ 摘要段 = `→ (interrupted)` 逐字；已结算零改写", () => {
  initDict({ locale: "zh", dict: {} })
  const segOf = (block) => {
    const card = chatTool.toolCard(block, "k1", {})
    const head = card.children[0]
    return Object.fromEntries(head.children.map((seg) => [seg.props["data-seg"], seg.children[0]]))
  }
  const interrupted = segOf({ kind: "tool", name: "bash", status: "interrupted", argsSummary: "x" })
  assert.equal(interrupted.status, "已中断", "状态段 = 词表值")
  assert.equal(interrupted.summary, "→ (interrupted)", "摘要段 = VSC 逐字（`→ ` 前缀自带）")
  const settled = segOf({ kind: "tool", name: "read", status: "done", result: "12 lines", durationMs: 30 })
  assert.notEqual(settled.summary, "→ (interrupted)", "已结算卡零改写（derived 摘要）")
  assert.ok(String(settled.summary).startsWith("→ "), "既有摘要段格式零改")
  initDict({ locale: "en", dict: projectDictionary("en") })
  out("B5 中断卡", `status=${interrupted.status} · summary=${interrupted.summary} · settled=${settled.summary}`)
})

// ─── B 腿 · #635 数值行「零发送」维持（父侧裁 (a)）────────────────────────────────

test("B6 #635 · 数值行无效 ⇒ 零发送（现状维持）；合法值 ⇒ 写；形状表键族 null 面在场", async () => {
  const calls = []
  const patches = []
  const fields = [{ path: "agent.maxTurns", value: 12 }]
  const scope = new FakeNode("div")
  const mkRow = (path, value) => {
    const r = new FakeNode("div")
    r.setAttribute("data-field", path)
    const input = new FakeNode("input")
    input.type = "number"
    input.value = value
    r.appendChild(input)
    return r
  }
  const invalidRow = mkRow("agent.maxTurns", "")
  scope.querySelectorAll = (sel) => (sel === "[data-field]" ? [invalidRow] : [])
  docRegistry.settingsScope = scope
  const exits = createAgentExits({
    ask: async (channel, payload) => { calls.push([channel, payload]); return { ok: true, reason: null, fields } },
    store: { get: () => ({ settings: { agent: { fields } } }), set: () => {} },
    setSettings: (patch) => { patches.push(patch); }, report: () => {}, clearReport: () => {},
    slot: '[data-slot="settings"]', paintSettings: () => {},
  })
  try {
    await exits.handlers.onSaveAgent()
    assert.equal(calls.length, 0, "无效数值行 ⇒ 零发送（不写盘 · 零乐观改）")
    invalidRow.querySelector("input").value = "33"
    await exits.handlers.onSaveAgent()
    assert.deepEqual(calls.at(-1), ["settings:agent", { patch: { "agent.maxTurns": 33 } }], "合法值 ⇒ 写（变更集照发）")
    await exits.handlers.onNamedField({ path: "agent.maxTurns", kind: "number" }, { target: { value: "" } })
    assert.equal(calls.length, 1, "具名径无效数值 ⇒ 零发送")
    await exits.handlers.onNamedField({ path: "agent.subagentModel", kind: "model" }, { target: { value: "" } })
    assert.deepEqual(calls.at(-1), ["settings:agent", { patch: { "agent.subagentModel": null } }], "形状表键族：空选 ⇒ null（显式清除面在场）")
  } finally {
    docRegistry.settingsScope = null
  }
  out("B6 数值行", `calls=${calls.length} · patches=${patches.length}`)
})

test("B6b #645 · 主侧事实：数值已知键 null ⇒ 放行（盘删键 + 回读默认——核清除形扩族落定）", async () => {
  const coreIo = await import(coreAt("config-io.mjs"))
  const settingsMain = await import(at("thincoder-desktop/src/main/settings.mjs"))
  const dir = mkdtempSync(join(tmpdir(), "enddiff-settings-"))
  const cfg = join(dir, "config.json")
  writeFileSync(cfg, JSON.stringify({ agent: { maxTurns: 12, subagentModel: "openai:o3" } }))
  coreIo._setConfigPathForTest(cfg)
  try {
    const numeric = settingsMain.settingsAgent({ patch: { "agent.maxTurns": null } })
    assert.equal(numeric.ok, true, "数值键 null ⇒ 放行（#645 核放行面扩 number/boolean）")
    assert.equal("maxTurns" in JSON.parse(readFileSync(cfg, "utf8")).agent, false, "null ⇒ 盘删键（回退默认）")
    assert.equal(numeric.fields.find((f) => f.path === "agent.maxTurns")?.value, 200, "回读 = DEFAULTS 默认（200）")
    const shape = settingsMain.settingsAgent({ patch: { "agent.subagentModel": null } })
    assert.equal(shape.ok, true, "形状表键族 null ⇒ 放行")
    assert.equal("subagentModel" in JSON.parse(readFileSync(cfg, "utf8")).agent, false, "null ⇒ 删键（回退默认）")
  } finally {
    coreIo._resetConfigPathForTest()
  }
  out("B6b 主侧", "数值键 null 删键回退默认 ∕ 形状表键族 null 删键")
})
