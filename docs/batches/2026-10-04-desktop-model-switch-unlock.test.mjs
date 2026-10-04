/**
 * 2026-10-04-desktop-model-switch-unlock.test.mjs — 批内件（模型切换解锁批 · 台账 #918 · 实施轮）。
 * 判据表 = 批档 `docs/batches/2026-10-04-desktop-model-switch-unlock.md` §2 测试面（T1–T6 六腿）；
 * 机制单源 = 批档 §2（时序表 D-A…D-G ∥ V-A…V-C）+ `docs/render-core/design/RENDER-CORE.md` §5 条 6 +
 * `docs/desktop/design/COMPOSER.md` KD-19（在飞受理 ∥ 施加顺延）。
 *
 * 面（只测本批改动面 —— 平 node；T1/T2 假 DOM 直驱核件，T3–T6 结构机检 + T4 核直测）：
 *   T1 钮面解锁（核 · 假 DOM）：`running` / `susp` 两态 ⇒ 两钮 `disabled === false` ∧ `aria-disabled` 缺席 ∧
 *      忙态点击 ⇒ `.mm-overlay` 在场 ∧ 进忙态不关已弹浮层；`/model` 斜径同态 ⇒ 受理（清框 ∧ 零 toast）。
 *   T2 回写门保留（核 · 假 DOM）：忙态 `models` 推送（prefs 命中）⇒ 零 `selectModel` / `selectReasoning` post；idle ⇒ 照发。
 *   T3 源判据（核 · 结构机检）：`panel.mjs` ∥ `model-menu.mjs` 零 `modelSwitchBlocked` ∥ 零 `applyModelSwitchGate` ∥
 *      零 `aria-disabled`（整档负扫——实读依据见腿内注）；`writebackBlocked` 在位。
 *   T4 落盘保护（核 `saveSession` 直测）：槽复合在场 ⇒ `prefsSeedOnly` 保存后复合保留 ∧ 无选项 ⇒ 记忆值覆写（对照）；
 *      空槽 ⇒ 播种；`effort` 键在场（含 `null` 值）⇒ 槽值保留。
 *   T5 桌面宿主源判据（结构机检）：`agent-host.mjs` 零 `fail("busy")` ∧ 含 `_pendingPrefsApply`（位 = agent 对象
 *      字段——中止径随弃 ∥ 零模块级位表）；`session-io.mjs` 两落盘点带 `prefsSeedOnly` ∧ `applyPendingPrefs` 导出；
 *      `turn-face.mjs` 结算尾调用在盘。
 *   T6 VSC 落盘源判据（结构机检）：四处落盘点含 `seed:` 印章（逐处）∧ `saveLines` 三键判据句在盘；
 *      `slash.busy` 两语键退场（负扫）。
 *
 * 本件不进仓套件（批内件 · 随批留存）；跑法（cwd = thincoder/）：
 *   node --test docs/batches/2026-10-04-desktop-model-switch-unlock.test.mjs
 */
import test, { after } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

// 家目录沙箱（安全网 —— 核 configDir 于模组装载期取值；一切 (动态) import 之前覆盖）。
const HOME_SANDBOX = mkdtempSync(join(tmpdir(), "msu-home-"))
process.env.HOME = HOME_SANDBOX
process.env.USERPROFILE = HOME_SANDBOX

const ROOT_URL = new URL("../../", import.meta.url) // 仓根（docs/batches 两层深）
const ROOT = fileURLToPath(ROOT_URL)
if (!existsSync(join(ROOT, "thincoder-core"))) throw new Error(`从仓库根（thincoder/）运行（ROOT = ${ROOT}）`)

const mod = (rel) => import(new URL(rel, ROOT_URL).href)
const text = (rel) => readFileSync(join(ROOT, rel), "utf8")

const coreSession = await mod("thincoder-core/session.mjs")
const coreSlots = await mod("thincoder-core/session-slots.mjs")

const created = []
const tmpDir = (tag) => { const d = mkdtempSync(join(tmpdir(), `msu-${tag}-`)); created.push(d); return d }
after(() => {
  coreSlots._resetSessionsDirForTest()
  for (const d of created.splice(0)) rmSync(d, { recursive: true, force: true })
  rmSync(HOME_SANDBOX, { recursive: true, force: true })
})

// ─── 核件词面接线（同生产装配单点：端侧注册面注入核 `setStrings`）+ 假环境 ─────────────────

const { setStrings } = await mod("thincoder-render-core/i18n.mjs")
const hostI18n = await mod("thincoder-desktop/renderer/i18n.mjs")
hostI18n.setStringsSink(setStrings) // 核件取词注册面（面板经核 `t` 取词）
hostI18n.initDict({ locale: "zh" })
const { createComposerPanel } = await mod("thincoder-render-core/composer/panel.mjs")
const { showToast } = await mod("thincoder-render-core/toast.mjs")
const { createSlashCommands } = await mod("thincoder-desktop/renderer/slash-commands.mjs")
const { VIEWS_DICT } = await mod("thincoder-desktop/renderer/i18n-views.mjs")
const SLASH_COMMANDS = createSlashCommands(() => true)

/** 精简假 DOM（结构 ∥ 属性 ∥ 监听器簿记 ∥ 选择器 ∥ body 树 —— 沿 `2026-10-01-desktop-slash-commands.test.mjs`
 *  批内件假 DOM 先例；只覆盖面板腿触面）。 */
class FakeNode {
  constructor(tag = "div") {
    this.tagName = String(tag).toUpperCase()
    this.attrs = new Map()
    this.children = []
    this.parentNode = null
    this.style = {}
    this._text = ""
    this._listeners = new Map()
    this.id = ""
    this.className = ""
    this.value = ""
    this.disabled = false
    this.readOnly = false
    this.scrollHeight = 10
    this.selectionStart = 0
    this.selectionEnd = 0
  }
  get classList() {
    const self = this
    const read = () => String(self.attrs.get("class") ?? self.className ?? "").split(/\s+/).filter(Boolean)
    const write = (list) => { self.attrs.set("class", list.join(" ")); self.className = list.join(" ") }
    return {
      add: (...n) => write([...new Set([...read(), ...n])]),
      remove: (...n) => write(read().filter((x) => !n.includes(x))),
      contains: (n) => read().includes(n),
      toggle: (n, on) => (on ? write([...new Set([...read(), n])]) : write(read().filter((x) => x !== n))),
    }
  }
  get textContent() { return this.children.length === 0 ? (this._text ?? "") : (this._text ?? "") + this.children.map((c) => c.textContent).join("") }
  set textContent(v) { this._text = String(v ?? ""); this.children.length = 0 }
  get innerHTML() { return this._text }
  set innerHTML(v) { this._text = String(v ?? ""); this.children.length = 0 }
  setAttribute(n, v) { this.attrs.set(n, String(v)) }
  getAttribute(n) { return this.attrs.has(n) ? this.attrs.get(n) : null }
  addEventListener(type, fn) { if (!this._listeners.has(type)) this._listeners.set(type, []); this._listeners.get(type).push(fn) }
  removeEventListener(type, fn) { const l = this._listeners.get(type) ?? []; const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1) }
  dispatch(type, event = {}) { for (const fn of [...(this._listeners.get(type) ?? [])]) fn({ preventDefault() {}, stopPropagation() {}, ...event }) }
  append(...nodes) { for (const child of nodes) { if (child !== null && typeof child === "object") { child.parentNode = this; this.children.push(child) } } }
  appendChild(child) { this.append(child); return child }
  insertBefore(child, ref) { const i = this.children.indexOf(ref); if (i < 0) this.append(child); else { child.parentNode = this; this.children.splice(i, 0, child) } return child }
  removeChild(n) { const i = this.children.indexOf(n); if (i >= 0) this.children.splice(i, 1); n.parentNode = null; return n }
  remove() { this.parentNode?.removeChild(this) }
  querySelectorAll(sel) { const out = []; const walk = (n) => { for (const c of n.children) { if (matches(c, sel)) out.push(c); walk(c) } }; walk(this); return out }
  querySelector(sel) { return this.querySelectorAll(sel)[0] ?? null }
  contains(n) { let p = n; while (p) { if (p === this) return true; p = p.parentNode } return false }
  getBoundingClientRect() { return { left: 0, top: 10, right: 100, bottom: 40, width: 100, height: 30 } }
  focus() {}
  setSelectionRange() {}
}
function matches(node, sel) {
  const raw = String(sel).trim()
  if (raw.startsWith("#")) return node.id === raw.slice(1) || node.getAttribute("id") === raw.slice(1)
  if (raw.startsWith(".")) return String(node.getAttribute("class") ?? node.className ?? "").split(/\s+/).includes(raw.slice(1))
  const hit = /^([\w-]+)?\[([\w-]+)(?:="([^"]*)")?\]$/.exec(raw)
  if (hit) { if (hit[1] && node.tagName !== hit[1].toUpperCase()) return false; const v = node.getAttribute(hit[2]); return hit[3] === undefined ? v !== null : v === hit[3] }
  return node.tagName === raw.toUpperCase()
}
function installEnv() {
  const body = new FakeNode("body")
  const listeners = new Map()
  const doc = {
    body,
    createElement: (tag) => new FakeNode(tag),
    createTextNode: (t) => { const n = new FakeNode("#text"); n.textContent = t; return n },
    getElementById: (id) => body.querySelector("#" + id) ?? null,
    addEventListener: (type, fn) => { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(fn) },
    removeEventListener: (type, fn) => { const l = listeners.get(type) ?? []; const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1) },
    querySelector: () => null,
    querySelectorAll: () => [],
    head: new FakeNode("head"),
    documentElement: new FakeNode("html"),
  }
  const win = { innerHeight: 800, innerWidth: 1200, requestAnimationFrame: (fn) => { fn(); return 1 }, addEventListener() {}, removeEventListener() {} }
  globalThis.document = doc
  globalThis.window = win
  globalThis.requestAnimationFrame = win.requestAnimationFrame
}

/** 推送候选面（T2 prefs 命中用：m2 ∥ p2 在列）。 */
const MODELS = [
  { id: "m1", provider: "p1", group: "P1", label: "m1", reasoning: ["off", "high"] },
  { id: "m2", provider: "p2", group: "P2", label: "m2", reasoning: [] },
]

/** 起面板（真命令表注入 `deps.slash`；`state.subscribe` 捕获 = 推送入口 T2 用）。 */
function boot({ turnState = () => "idle" } = {}) {
  installEnv()
  const posts = []
  let push = null
  const root = new FakeNode("div")
  const state = {
    turnState,
    workspaceRequired: () => false,
    queue: () => ({ count: 0 }),
    models: () => MODELS,
    flags: () => ({}),
    subscribe: (handler) => { push = handler },
  }
  const panel = createComposerPanel({ root, post: (type, payload) => posts.push({ type, payload }), state, hooks: {}, slash: { commands: SLASH_COMMANDS } })
  return { panel, posts, root, push: (m) => push?.(m) }
}
/** 读当前 toast 文案（并清核 toast 的 2.6s 自动淡出定时器——防跑批时长绑墙钟）。 */
const toastText = () => {
  clearTimeout(showToast._t)
  return globalThis.document.body.querySelector("#paste-toast")?.textContent ?? null
}
const enter = (panel) => panel.inputEl.dispatch("keydown", { key: "Enter", shiftKey: false, isComposing: false })
const overlayPresent = () => globalThis.document.body.querySelector(".mm-overlay") !== null

// ─── T1 · 钮面解锁（核 · 假 DOM；改前红：门应用 disabled + aria-disabled + 忙态开拒）──────────────

test("T1 钮面解锁：running ∥ susp 两态 ⇒ 两钮可点 ∥ aria-disabled 缺席 ∥ 菜单可开 ∥ /model 受理 ∥ 进忙不关浮层", () => {
  for (const st of ["running", "susp"]) {
    // ① 忙态派生（生产 = loading ∥ turnState ∥ 守卫推送 re-derive）⇒ 两钮非禁用 ∧ aria-disabled 缺席
    const b1 = boot({ turnState: () => st })
    b1.panel.applyBusyLock()
    const modelBtn = b1.root.querySelector("#model-btn")
    const reasoningBtn = b1.root.querySelector("#reasoning-btn")
    assert.equal(modelBtn.disabled, false, `${st} · 模型钮可点（零 disabled 派生）`)
    assert.equal(reasoningBtn.disabled, false, `${st} · 推理钮可点（零 disabled 派生）`)
    assert.equal(modelBtn.getAttribute("aria-disabled"), null, `${st} · 模型钮 aria-disabled 缺席`)
    assert.equal(reasoningBtn.getAttribute("aria-disabled"), null, `${st} · 推理钮 aria-disabled 缺席`)
    // ② 忙态点击 ⇒ 正常开菜单（同 idle 面）
    modelBtn.dispatch("click", {})
    assert.ok(overlayPresent(), `${st} · 忙态点击模型钮 ⇒ .mm-overlay 在场`)
    // ③ `/model` 斜径同态 ⇒ 受理（清框 ∧ 零 toast ∧ 零上行 ∧ 同一菜单）
    const b2 = boot({ turnState: () => st })
    b2.panel.inputEl.value = "/model"
    enter(b2.panel)
    assert.equal(b2.panel.inputEl.value, "", `${st} · /model 忙态受理 ⇒ 清框`)
    assert.equal(toastText(), null, `${st} · /model 忙态受理 ⇒ 零 toast`)
    assert.ok(overlayPresent(), `${st} · /model ⇒ 同一菜单在场`)
    assert.deepEqual(b2.posts, [], `${st} · /model 零消息径上行`)
  }
  // ④ 进忙态不再关已弹浮层（R1 收窄点）
  let ts = "idle"
  const b3 = boot({ turnState: () => ts })
  b3.root.querySelector("#model-btn").dispatch("click", {})
  assert.ok(overlayPresent(), "idle 开菜单（前置）")
  ts = "running"
  b3.panel.applyBusyLock()
  assert.ok(overlayPresent(), "进忙态后浮层仍在（不再 close()）")
})

// ─── T2 · 回写门保留（核 · 假 DOM；负控在案——F-W14 回写门本批保留）──────────────────────────────

test("T2 回写门保留：忙态 models 推送（prefs 命中）⇒ 零回写（显示仍更新）；idle ⇒ 照发", () => {
  const prefs = { model: "m2", provider: "p2", reasoning: "off" }
  const busy = boot({ turnState: () => "running" })
  busy.panel.applyBusyLock()
  busy.push({ type: "models", models: MODELS, prefs })
  assert.deepEqual(busy.posts, [], "忙态零 `selectModel` ∥ `selectReasoning` 回写（陈旧回声不覆写忙期新选定）")
  assert.equal(busy.root.querySelector("#model-btn").textContent, "m2", "显示仍更新（回写门只治回写）")
  const idle = boot()
  idle.push({ type: "models", models: MODELS, prefs })
  assert.deepEqual(idle.posts.map((p) => p.type), ["selectModel", "selectReasoning"], "idle 照发（零回归）")
  assert.deepEqual(idle.posts[0].payload, { model: "m2", provider: "p2" })
  assert.deepEqual(idle.posts[1].payload, { reasoning: "off" })
})

// ─── T3 · 源判据（核 · 结构机检；改前红：两符号在位 + aria-disabled 两处命中）────────────────────

test("T3 源判据：panel ∥ model-menu 零 modelSwitchBlocked ∥ 零 applyModelSwitchGate ∥ 零 aria-disabled ∧ writebackBlocked 在位", () => {
  // 整档负扫成立性（实读依据）：现盘 `aria-disabled` 唯两处 —— `panel.mjs` 忙态门应用注文一行 ∥
  // `setAttribute("aria-disabled", …)` 一行，皆 `applyModelSwitchGate` 本体 ⇒ 整件删后恒零；`model-menu.mjs` 零命中。
  const panelSrc = text("thincoder-render-core/composer/panel.mjs")
  const menuSrc = text("thincoder-render-core/composer/model-menu.mjs")
  for (const [name, src] of [["panel.mjs", panelSrc], ["model-menu.mjs", menuSrc]]) {
    assert.equal(src.includes("modelSwitchBlocked"), false, `${name}: 零 modelSwitchBlocked（更名退场）`)
    assert.equal(src.includes("applyModelSwitchGate"), false, `${name}: 零 applyModelSwitchGate（整件退场）`)
    assert.equal(src.includes("aria-disabled"), false, `${name}: 零 aria-disabled（整档负扫）`)
  }
  assert.ok(panelSrc.includes("function writebackBlocked("), "panel.mjs: writebackBlocked 在位（回写门判据）")
  assert.ok(panelSrc.includes("blocked: () => writebackBlocked()"), "panel.mjs: 注入行指向更名判据")
})

// ─── T4 · 落盘保护（核 saveSession 直测；改前红：无 prefsSeedOnly 选项 ⇒ 起跑快照覆写）────────────

/** agent 假体（`saveSession` 最小集 —— 记忆 = 起跑快照 M1）。 */
function makeAgent(cwd, slot = 1) {
  return {
    cwd, _slot: slot,
    activeProvider: "p1", activeModel: "m1",
    provider: { name: "p1", model: "m1" },
    history: [], config: {},
  }
}

test("T4 落盘保护：槽复合在场 ⇒ prefsSeedOnly 零改写 ∥ 无选项覆写（对照）∥ 空槽播种 ∥ effort 键在场保留", () => {
  coreSlots._setSessionsDirForTest(tmpDir("t4-sessions-"))
  // ① 槽复合在场（M2）+ effort 键在场（"high"）——记忆 = M1
  const cwd1 = tmpDir("t4-cwd-")
  coreSlots.writeSessionFile(coreSession.slotPath(cwd1, 1), {
    version: 2, cwd: cwd1, title: "", activeProvider: "p2", activeModel: "m2", effort: "high",
    history: [], contextHistory: [],
  })
  coreSession.saveSession(makeAgent(cwd1), { prefsSeedOnly: true })
  let data = coreSession.loadSlotFile(cwd1, 1)
  assert.equal(data.activeProvider, "p2", "槽复合在场 ⇒ provider 零改写（M2 保留）")
  assert.equal(data.activeModel, "m2", "槽复合在场 ⇒ model 零改写（M2 保留）")
  assert.equal(data.effort, "high", "effort 键在场 ⇒ 槽值保留")
  // ② 对照：无选项 ⇒ 记忆值覆写（现行形 —— 起跑快照落盘）
  coreSession.saveSession(makeAgent(cwd1))
  data = coreSession.loadSlotFile(cwd1, 1)
  assert.equal(data.activeProvider, "p1", "无选项 ⇒ 记忆值覆写（对照）")
  assert.equal(data.activeModel, "m1", "无选项 ⇒ 记忆值覆写（对照）")
  // ③ 空槽 ⇒ 播种（槽缺三键 ⇒ 携记忆值）
  const cwd2 = tmpDir("t4-seed-")
  coreSession.saveSession(makeAgent(cwd2), { prefsSeedOnly: true })
  data = coreSession.loadSlotFile(cwd2, 1)
  assert.equal(data.activeProvider, "p1", "空槽 ⇒ 记忆值播种")
  assert.equal(data.activeModel, "m1", "空槽 ⇒ 记忆值播种")
  // ④ effort 键在场值为 null ⇒ 键保留（键在场判据——值可 null；记忆档位 ≠ 槽值）
  const cwd3 = tmpDir("t4-effort-null-")
  coreSlots.writeSessionFile(coreSession.slotPath(cwd3, 1), {
    version: 2, cwd: cwd3, title: "", activeProvider: "p1", activeModel: "m1", effort: null,
    history: [], contextHistory: [],
  })
  const agent3 = makeAgent(cwd3)
  agent3._slotEffort = "high" // 记忆档位（起跑快照）≠ 槽值
  coreSession.saveSession(agent3, { prefsSeedOnly: true })
  data = coreSession.loadSlotFile(cwd3, 1)
  assert.equal(Object.hasOwn(data, "effort"), true, "effort 键在场（值 null）⇒ 键保留（禁回填语义保持）")
  assert.equal(data.effort, null, "值 = 槽值 null（非记忆值）")
})

// ─── T5 · 桌面宿主源判据（结构机检；改前红：忙态拒在位 ∥ 位 ∥ 选项 ∥ 结算尾调用皆缺）──────────────

test("T5 桌面宿主源判据：零 fail(\"busy\") ∧ _pendingPrefsApply 位（agent 字段）∧ 两落盘点带 prefsSeedOnly ∧ 结算尾调用", () => {
  const hostSrc = text("thincoder-desktop/src/main/agent-host.mjs")
  assert.equal(hostSrc.includes('fail("busy")'), false, "零 fail(\"busy\")（在飞拒档退役——受理 ∥ 施加顺延）")
  assert.ok(hostSrc.includes("agent._pendingPrefsApply = true"), "在飞支记位（位 = agent 对象字段——中止径随弃）")
  assert.equal(/^\s*(const|let)\s+\w*[Pp]endingPrefs\w*\s*=/m.test(hostSrc), false, "零模块级位表（无独立清理面）")
  const io = text("thincoder-desktop/src/main/session-io.mjs")
  assert.ok(io.includes("saveSession(agent, { prefsSeedOnly: true })"), "落盘点带 prefsSeedOnly（回合关联落盘不携三键）")
  assert.ok(/export function saveDistilledSlot[\s\S]{0,300}?saveAgentSlot\(/.test(io), "蒸馏落位同经单函数（两落盘点同带选项）")
  assert.ok(io.includes("export function applyPendingPrefs(agent)"), "applyPendingPrefs 导出在盘")
  const tf = text("thincoder-desktop/src/main/turn-face.mjs")
  assert.ok(/saveAgentSlot\(agent\)[\s\S]{0,400}applyPendingPrefs\(agent\)/.test(tf), "结算尾调用在盘（落盘之后 ⇒ 施加顺延）")
})

// ─── T6 · VSC 落盘源判据（结构机检；改前红：spread 形在位 ∥ seed 通道缺 ∥ slash.busy 键在位）────────

test("T6 VSC 落盘源判据：四处落盘点 seed 印章（逐处）∧ saveLines 三键取值链 ∧ slash.busy 两语键退场（负扫）", () => {
  // 四处落盘点 = `finalizeTurn` ∥ `onComplete` ∥ `onDistilled` ∥ turn-loop（abort/error）
  const stages = text("thincoder-vscode/src/extension/panel-turn-stages.mjs")
  const cbs = text("thincoder-vscode/src/extension/panel-callbacks.mjs")
  const loop = text("thincoder-vscode/src/extension/panel-turn-loop.mjs")
  assert.equal((stages.match(/seed: slotStamp/g) ?? []).length, 2, "finalizeTurn 两分支皆携 seed 印章")
  assert.equal((cbs.match(/seed: slotStamp/g) ?? []).length, 2, "onComplete ∥ onDistilled 皆携 seed 印章")
  assert.equal((loop.match(/seed: slotStamp/g) ?? []).length, 1, "abort/error 落盘点携 seed 印章")
  for (const [name, src] of [["panel-turn-stages.mjs", stages], ["panel-callbacks.mjs", cbs], ["panel-turn-loop.mjs", loop]]) {
    assert.equal(src.includes("...slotStamp"), false, `${name}: 旧 spread 覆写形退场`)
  }
  const write = text("thincoder-vscode/src/extension/panel-session-write.mjs")
  assert.ok(write.includes("extra.seed"), "saveLines 播种通道在盘（回合起跑印章）")
  assert.ok(/activeProvider: extra\.activeProvider \?\? slotProvider/.test(write), "provider 取值链在盘（显式写位 > 槽在场 > seed）")
  assert.ok(/activeModel: extra\.activeModel \|\| slotModel/.test(write), "model 取值链在盘（显式写位 > 槽在场 > seed）")
  // `slash.busy` 两语键退场（负扫：键值表 ∥ `/model` 条目表；核 `renderer/i18n.mjs:76` 批注为历史注记保留——不扫）
  assert.equal(VIEWS_DICT.en["slash.busy"], undefined, "en 键退场")
  assert.equal(VIEWS_DICT.zh["slash.busy"], undefined, "zh 键退场")
  assert.equal(Object.keys(VIEWS_DICT.en).length, Object.keys(VIEWS_DICT.zh).length, "两语键集仍相等")
  assert.equal(text("thincoder-desktop/renderer/i18n-views.mjs").includes("slash.busy"), false, "词表档负扫零命中")
  assert.equal(text("thincoder-desktop/renderer/slash-commands.mjs").includes("slash.busy"), false, "命令表档负扫零命中")
})