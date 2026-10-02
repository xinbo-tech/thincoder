/**
 * 2026-10-01-desktop-slash-commands.test.mjs — 批内件（桌面 slash 命令批 · 台账 #761 · 实施轮 ∥ `/help` 增量）。
 * 判据表 = 批档 `docs/batches/2026-10-01-desktop-slash-commands.md` §2.7（E1 ∥ E6 ∥ E7）+ §2.5 项 1（机制句）
 * + §2.10（E10–E13 —— `/help` 增量；画件 ∥ 锚位归真机走查）；
 * 机制单源 = `docs/render-core/design/RENDER-CORE.md` §2 KD-RC-12 ∥ §5 条 6；端侧语义 = `docs/desktop/design/UI.md`
 * §1「本批注（slash 命令面 · 2026-10-01）」。
 *
 * 面（只测本批改动面 —— 平 node；纯函数腿零 DOM，面板腿走假 DOM）：
 *   腿 1 E1 例集：`parseSlash` ∥ `routeSlash` 判据（首字符 ∥ 大小写 ∥ 别名 `/m` `/p` `/h` ∥ 非首字符 ⇒ `null` ∥ `"/"` 未知）；
 *   腿 2 回落判据：未在册（`/nope` ∥ CLI 别名族 ∥ 本批不在册的 CLI 命令）⇒ `{ kind:"unknown" }`（**不发送**）；
 *   腿 3 E7 携参：`args` 解析（`"/model p:m"` ⇒ `args:"p:m"`；空余串 ⇒ `""`；args 原样不归一；`/help` 同判）；
 *   腿 4 E6 表纪律（扩）：端表 name ⊆ CLI 名集 ∥ aliases ⊆ CLI 别名键集 ∥ 组 ∥ `descKey` 在册 ∥ en 描述 == CLI `desc` 逐字；
 *   腿 5 表契约：5 条 + 别名 3 ∥ `rejectKey` ∥ 四行动条目 `run` 只调 `ctx.actions` ∥ `/help` 条 = 打印口闭包注入（返值直传）；
 *   腿 6 A–J **面板拦截段实跑**（假 DOM · 真命令表 · 真词表）：A `/model` 同菜单 + 清框 + 零上行 + 零 hooks + ↑ 召回 ∥
 *        B 未知 ⇒ toast + 文本留 ∥ C 忙态拒 ∥ D 携参拒 ∥ E ENG 态 `/plan` 拒 ∥ F 忙态 `/plan` 执行 ∥ G 会话守卫先于斜径 ∥
 *        H 非斜径照消息径 ∥ I 不传 `deps.slash` 零变（VSC 零接缝）∥ J `/help` ⇒ 打印口恰一调 + 清框 + 入历史 + 零上行；
 *   腿 7 词键面：反馈三键 + `/help` 六键 × 2 语逐字（en desc = CLI 逐字 ∥ `slash.unknown` 携指引）∥ 两语键集相等；
 *   腿 8 E10 行集：`formatHelp` 三段形（标签 ∥ 组序 = CLI 同序 ∥ 命令行）∥ 组内序 = 表序 ∥ 无组条目跳过；
 *   腿 9 E12 行集切片：`setHelpLines` 五判 ∥ 回底合成（打印口纯面 —— 画件 ∥ 锚位归真机走查）。
 *
 * 本件不进仓套件（批内件 · 随批留存）；跑法（任意 cwd——路径按本档自身位置解析）：
 *   node --test docs/batches/2026-10-01-desktop-slash-commands.test.mjs
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

const ROOT = new URL("../../", import.meta.url) // 仓根 = 本档上两级（thincoder/）
const rel = (p) => fileURLToPath(new URL(p, ROOT))
const src = (p) => readFileSync(rel(p), "utf8")

const { parseSlash, routeSlash, formatHelp } = await import(new URL("thincoder-render-core/composer/slash.mjs", ROOT).href)
const { createSlashCommands } = await import(new URL("thincoder-desktop/renderer/slash-commands.mjs", ROOT).href)
const { initialState, returnToBottom, setHelpLines } = await import(new URL("thincoder-desktop/renderer/store.mjs", ROOT).href)
const { VIEWS_DICT } = await import(new URL("thincoder-desktop/renderer/i18n-views.mjs", ROOT).href)
// 命令表（打印口缺省替身 —— 真表构造体同形；`/help` 腿另起替身注入）
const SLASH_COMMANDS = createSlashCommands(() => true)

// CLI 表（E6 参照面 —— 源档实读提取；CLI 侧本批零触 ⇒ 只读）
const cliSrc = src("thincoder-cli/src/tui/slash-commands.mjs")
const cliRows = new Map([...cliSrc.matchAll(/^\s*\{ name: "(\/[a-z]+)", group: "([A-Za-z]+)", desc: "([^"]*)" \}/gm)].map((m) => [m[1], { group: m[2], desc: m[3] }]))
const cliNames = new Set([...cliSrc.matchAll(/^\s*\{ name: "(\/[a-z]+)"/gm)].map((m) => m[1]))
const cliAliasLine = cliSrc.match(/export const SLASH_ALIASES = \{([^}]*)\}/)?.[1] ?? ""
const cliAliases = new Set([...cliAliasLine.matchAll(/"(\/[a-z]+)":/g)].map((m) => m[1]))

const byName = Object.fromEntries(SLASH_COMMANDS.map((c) => [c.name, c]))

// ─── 腿 1 · E1 例集（判据 ∥ 大小写 ∥ 别名 ∥ 非首字符 ∥ `"/"` 未知）───────────────────────────

test("腿 1 E1 例集：判据三值域 ∥ 大小写不敏感 ∥ 别名解析", () => {
  // parse 面（含 trim ∥ 小写归一）
  assert.deepEqual(parseSlash("  /model  "), { name: "/model", args: "" })
  assert.deepEqual(parseSlash("/MODEL"), { name: "/model", args: "" })
  assert.equal(parseSlash(42), null)
  assert.equal(parseSlash(null), null)
  assert.equal(parseSlash("foo /model"), null)

  // route 面——命中
  const c = routeSlash("/model", SLASH_COMMANDS)
  assert.equal(c.kind, "command")
  assert.equal(c.cmd, byName["/model"])
  assert.equal(c.args, "")
  assert.equal(routeSlash("/MODEL", SLASH_COMMANDS).cmd, byName["/model"]) // 大小写
  assert.equal(routeSlash("/m", SLASH_COMMANDS).cmd, byName["/model"]) // 别名
  assert.equal(routeSlash("/p", SLASH_COMMANDS).cmd, byName["/plan"]) // 别名
  assert.equal(routeSlash("/h", SLASH_COMMANDS).cmd, byName["/help"]) // 别名（`/help` 增量——KD-S9）
  assert.equal(routeSlash("/PLAN", SLASH_COMMANDS).cmd, byName["/plan"])

  // route 面——未知 ∥ 非斜径
  assert.deepEqual(routeSlash("/nope", SLASH_COMMANDS), { kind: "unknown", name: "/nope" })
  assert.deepEqual(routeSlash("/", SLASH_COMMANDS), { kind: "unknown", name: "/" })
  assert.equal(routeSlash("foo /model", SLASH_COMMANDS), null) // 非首字符 = 普通消息
  assert.equal(routeSlash("", SLASH_COMMANDS), null)
  assert.equal(routeSlash("   ", SLASH_COMMANDS), null)
})

// ─── 腿 2 · 回落判据（未在册 ⇒ 未知 ∥ 不发送）────────────────────────────────────────────

test("腿 2 回落判据：未在册（含 CLI 别名族 ∥ 本批不在册命令）⇒ unknown 且 name 原样归位", () => {
  for (const text of ["/nope", "/x", "/t", "/c", "/n", "/think", "/mcp", "/new"]) {
    const r = routeSlash(text, SLASH_COMMANDS)
    assert.equal(r?.kind, "unknown", `${text} 应回落未知`)
    assert.equal(r.name, text) // name = 小写首 token（含首 `/`）——toast `slash.unknown` 的 ${name} 面
  }
  // 大写未在册 ⇒ 小写名面（同判据）
  assert.deepEqual(routeSlash("/NOPE", SLASH_COMMANDS), { kind: "unknown", name: "/nope" })
})

// ─── 腿 3 · E7 携参（args 解析 ∥ run 前门判据面）───────────────────────────────────────────

test("腿 3 E7 携参：`args` 解析（非空 ⇒ run 前门拒；原样不归一）", () => {
  const r = routeSlash("/model p:m", SLASH_COMMANDS)
  assert.equal(r.kind, "command")
  assert.equal(r.cmd, byName["/model"])
  assert.equal(r.args, "p:m")
  assert.equal(routeSlash("/model   p:m  ", SLASH_COMMANDS).args, "p:m")
  assert.equal(routeSlash("/MODEL P:M", SLASH_COMMANDS).args, "P:M") // args 原样（大小写不归一——前门只判非空）
  assert.equal(routeSlash("/model", SLASH_COMMANDS).args, "")
  // `/help` 携参 = 同通用前门判（KD-S10——零特例）
  assert.equal(routeSlash("/help x", SLASH_COMMANDS).args, "x")
})

// ─── 腿 4 · E6 表纪律（端表 ⊆ CLI 表——不得自创命令）─────────────────────────────────────────

test("腿 4 E6 表纪律（扩）：name ⊆ CLI 名集 ∥ aliases ⊆ CLI 别名键集 ∥ 零重名 ∥ 组 ∥ en 描述逐字", () => {
  assert.ok(cliNames.size > 0 && cliAliases.size > 0 && cliRows.size > 0, "CLI 表提取失败（源档形状变化——机检失据）")
  const names = SLASH_COMMANDS.map((c) => c.name)
  const aliases = SLASH_COMMANDS.flatMap((c) => c.aliases ?? [])
  for (const n of names) assert.ok(cliNames.has(n), `自创命令（CLI 表外）: ${n}`)
  for (const a of aliases) assert.ok(cliAliases.has(a), `自创别名（CLI 表外）: ${a}`)
  assert.deepEqual(aliases, ["/m", "/p", "/h"]) // 别名集（逐字——`/h` 随落：CLI `:71` 在册）
  const all = [...names, ...aliases]
  assert.equal(new Set(all).size, all.length, "表内重名（含别名撞名）")
  // `/help` 面（增量 · E10）：组 ∥ `descKey` 在册 ∥ **en 描述 == CLI `desc` 逐字**（读 CLI 源档提取——沿 E6 同法）
  for (const cmd of SLASH_COMMANDS) {
    const row = cliRows.get(cmd.name)
    assert.ok(row !== undefined, `CLI 行缺: ${cmd.name}`)
    assert.equal(cmd.group, row.group, `${cmd.name} 组应与 CLI 同`)
    assert.equal(VIEWS_DICT.en[cmd.descKey], row.desc, `${cmd.name} en 描述应为 CLI desc 逐字`)
  }
})

// ─── 腿 5 · 表契约（5 条 + 别名 3 ∥ rejectKey ∥ run 只调 ctx.actions）────────────────────────

test("腿 5 表契约：在册 5 条 ∥ rejectKey ∥ 四行动条目 run 只调 ctx.actions ∥ `/help` 闭包打印口", () => {
  assert.deepEqual(SLASH_COMMANDS.map((c) => c.name), ["/model", "/auto", "/plan", "/eng", "/help"])
  assert.equal(byName["/model"].rejectKey, "slash.busy") // 忙态门（模型钮同判据）
  assert.equal(byName["/plan"].rejectKey, "toolbar.planDisabled") // ENG×PLAN 互斥（复用既有键）
  assert.equal(byName["/auto"].rejectKey, undefined)
  assert.equal(byName["/eng"].rejectKey, undefined)
  assert.equal(byName["/help"].rejectKey, undefined) // 打印 = 零状态写 ⇒ 无忙态门（KD-S10）

  const actionOf = { "/model": "openModelMenu", "/auto": "toggleAuto", "/plan": "togglePlan", "/eng": "toggleEng" }
  for (const cmd of SLASH_COMMANDS.filter((c) => c.name !== "/help")) {
    const calls = []
    const spy = (...args) => { calls.push(args); return true }
    const post = () => { throw new Error(`${cmd.name}: run 触 post——零消息径上行会毁`) }
    assert.equal(cmd.run({ args: "", raw: cmd.name, post, actions: { [actionOf[cmd.name]]: spy } }), true) // 受理 ⇒ 直传
    assert.deepEqual(calls, [[]], `${cmd.name}: 应恰一调所辖 action 且零参`)
    // 门拒径（action 返假）⇒ run 返假（面板层据此出条目 `rejectKey` toast）
    assert.equal(cmd.run({ args: "", raw: cmd.name, post, actions: { [actionOf[cmd.name]]: () => false } }), false)
  }
  // `/help` 条 = 打印口**闭包注入**（表构造时绑定；`run` 零参 ⇒ 面板 ∥ `ctx` 零触；返值直传 ⇒ 面板受理语义同判）
  for (const want of [true, false]) {
    let calls = 0
    const post = () => { throw new Error("/help: run 触 post——零消息径上行会毁") }
    const help = createSlashCommands(() => { calls += 1; return want }).find((c) => c.name === "/help")
    assert.equal(help.run({ args: "", raw: "/help", post, actions: {} }), want)
    assert.equal(calls, 1, "/help: 打印口应恰一调")
  }
})

// ─── 腿 6 · 面板拦截段实跑（假 DOM · 真命令表 · 真词表）──────────────────────────────────────

/** 精简假 DOM（结构 ∥ 属性 ∥ 监听器簿记 ∥ 选择器 ∥ body 树 —— 沿批内件假 DOM 先例；只覆盖面板腿触面）。 */
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

/** 假环境置位（每腿独立 body——toast ∥ 菜单浮层不跨腿）。 */
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

const { setStrings } = await import(new URL("thincoder-render-core/i18n.mjs", ROOT).href)
const hostI18n = await import(new URL("thincoder-desktop/renderer/i18n.mjs", ROOT).href)
hostI18n.setStringsSink(setStrings) // 核件取词注册面（同生产装配单点——面板经核 `t` 取词）
hostI18n.initDict({ locale: "zh" }) // 桌面真词表进核字典（三新键值面 = 本批契约）
const { createComposerPanel } = await import(new URL("thincoder-render-core/composer/panel.mjs", ROOT).href)
const { showToast } = await import(new URL("thincoder-render-core/toast.mjs", ROOT).href)

/** 起面板（真命令表注入 `deps.slash`；`slash: null` = 不传径——VSC 零接缝）。 */
function boot({ flags = {}, turnState = () => "idle", workspaceRequired = () => false, slash = { commands: SLASH_COMMANDS } } = {}) {
  installEnv()
  const posts = []
  const hookCalls = []
  const state = { turnState, workspaceRequired, queue: () => ({ count: 0 }), models: () => [], flags: () => flags }
  const hooks = {
    onTurnStart: () => hookCalls.push("onTurnStart"),
    onUserEcho: () => hookCalls.push("onUserEcho"),
    onWelcomeDismiss: () => hookCalls.push("onWelcomeDismiss"),
    onTitleHint: () => hookCalls.push("onTitleHint"),
  }
  const panel = createComposerPanel({ root: new FakeNode("div"), post: (type, payload) => posts.push({ type, payload }), state, hooks, slash })
  return { panel, posts, hookCalls }
}
/** 读当前 toast 文案（**并清核 toast 的 2.6s 自动淡出定时器**——防跑批时长绑墙钟）。 */
const toastText = () => {
  clearTimeout(showToast._t)
  return globalThis.document.body.querySelector("#paste-toast")?.textContent ?? null
}
const enter = (panel) => panel.inputEl.dispatch("keydown", { key: "Enter", shiftKey: false, isComposing: false })
const overlayPresent = () => globalThis.document.body.querySelector(".mm-overlay") !== null

test("腿 6A `/model` ⇒ 同一菜单在场 + 清框 + 零消息径上行 + 零 hooks + ↑ 可召回", () => {
  const { panel, posts, hookCalls } = boot()
  panel.inputEl.value = "/model"
  enter(panel)
  assert.ok(overlayPresent(), "`.mm-overlay` 应在场（同钮同函数）")
  assert.equal(panel.inputEl.value, "", "受理径应清框")
  assert.deepEqual(posts, [], "零 `msg:send` ∥ `queuedUserMessage` 上行")
  assert.ok(!hookCalls.includes("onTurnStart") && !hookCalls.includes("onUserEcho"), "零用户块面钩子")
  panel.inputEl.dispatch("keydown", { key: "ArrowUp", shiftKey: false, altKey: false, metaKey: false, ctrlKey: false, isComposing: false })
  assert.equal(panel.inputEl.value, "/model", "入输入历史（↑ 可召回）")
})

test("腿 6B 未知 `/nope` ⇒ toast `slash.unknown`（含 ${name} ∥ 携 `/help` 指引）+ 文本保留 + 零上行", () => {
  const { panel, posts } = boot()
  panel.inputEl.value = "/nope"
  enter(panel)
  assert.equal(toastText(), "未知命令：/nope（/help 查看可用命令）") // E11：值面携指引（逐字 = UI.md 本批注项 5）
  assert.equal(panel.inputEl.value, "/nope")
  assert.deepEqual(posts, [])
})

test("腿 6C 忙态 `/model` ⇒ 拒（toast `slash.busy`）+ 菜单不在场 + 文本保留", () => {
  const { panel, posts } = boot({ turnState: () => "running" })
  panel.inputEl.value = "/model"
  enter(panel)
  assert.equal(toastText(), "回合运行中不可用——请等回合结束后重试")
  assert.ok(!overlayPresent())
  assert.equal(panel.inputEl.value, "/model")
  assert.deepEqual(posts, [])
})

test("腿 6D 携参 `/model p:m` ⇒ run 前门拒（toast `slash.args`）+ 文本保留", () => {
  const { panel, posts } = boot()
  panel.inputEl.value = "/model p:m"
  enter(panel)
  assert.equal(toastText(), "此命令在此不接受参数")
  assert.equal(panel.inputEl.value, "/model p:m")
  assert.deepEqual(posts, [])
})

test("腿 6E ENG 态 `/plan` ⇒ 门拒（`rejectKey` = 既有键 `toolbar.planDisabled`）+ 文本保留", () => {
  const { panel, posts } = boot({ flags: { engineering: true } })
  panel.inputEl.value = "/plan"
  enter(panel)
  const planDisabled = hostI18n.t("toolbar.planDisabled")
  assert.notEqual(planDisabled, "toolbar.planDisabled", "键须在册（回落键名 = 缺键）——断言不得恒真")
  assert.equal(toastText(), planDisabled)
  assert.equal(panel.inputEl.value, "/plan")
  assert.deepEqual(posts, [], "门拒 ⇒ 零 `setPlanMode`")
})

test("腿 6F 忙态 `/plan` ⇒ 可执行（钮态翻转径——`setPlanMode` 上行）+ 清框", () => {
  const { panel, posts } = boot({ turnState: () => "running" })
  panel.inputEl.value = "/plan"
  enter(panel)
  assert.deepEqual(posts.map((p) => p.type), ["setPlanMode"])
  assert.equal(panel.inputEl.value, "")
})

test("腿 6G 无会话守卫先于斜径（E8）⇒ toast `workspace.required` + 文本保留 + 零菜单", () => {
  const { panel, posts } = boot({ workspaceRequired: () => true })
  panel.inputEl.value = "/model"
  enter(panel)
  const guardText = hostI18n.t("workspace.required")
  assert.notEqual(guardText, "workspace.required", "键须在册（回落键名 = 缺键）——断言不得恒真")
  assert.equal(toastText(), guardText)
  assert.equal(panel.inputEl.value, "/model")
  assert.deepEqual(posts, [])
  assert.ok(!overlayPresent())
})

test("腿 6H 非斜径（`foo /model`）⇒ 照普通消息径（`userMessage` 上行 + 两钩子）", () => {
  const { panel, posts, hookCalls } = boot()
  panel.inputEl.value = "foo /model"
  enter(panel)
  assert.ok(posts.some((p) => p.type === "userMessage"))
  assert.ok(hookCalls.includes("onTurnStart") && hookCalls.includes("onUserEcho"))
})

test("腿 6I 不传 `deps.slash` ⇒ 现行为零变（VSC 零接缝不变量）——`/model` 照普通消息径", () => {
  const { panel, posts, hookCalls } = boot({ slash: null })
  panel.inputEl.value = "/model"
  enter(panel)
  assert.ok(posts.some((p) => p.type === "userMessage"), "无斜径缝 ⇒ 照消息径上行")
  assert.ok(!overlayPresent(), "零菜单（未接斜径机制）")
  assert.equal(panel.inputEl.value, "", "普通径清框")
  assert.ok(hookCalls.includes("onTurnStart") && hookCalls.includes("onUserEcho"))
})

test("腿 6J `/help` ⇒ 打印口恰一调 + 清框 + 入历史 + 零上行 + 零 hooks（受理径）", () => {
  let calls = 0
  const { panel, posts, hookCalls } = boot({ slash: { commands: createSlashCommands(() => { calls += 1; return true }) } })
  panel.inputEl.value = "/help"
  enter(panel)
  assert.equal(calls, 1, "打印口应恰一调（端装配面闭包注入）")
  assert.equal(panel.inputEl.value, "", "受理径应清框")
  assert.deepEqual(posts, [], "零消息径上行（`msg:send` ∥ `queuedUserMessage`）")
  assert.ok(!hookCalls.includes("onTurnStart") && !hookCalls.includes("onUserEcho"), "零用户块面钩子")
  panel.inputEl.dispatch("keydown", { key: "ArrowUp", shiftKey: false, altKey: false, metaKey: false, ctrlKey: false, isComposing: false })
  assert.equal(panel.inputEl.value, "/help", "入输入历史（↑ 可召回）")
})

// ─── 腿 7 · 词键面（三键 + `/help` 六键 × 2 语 —— 值面逐字 = UI.md 本批注项 5）─────────────────

test("腿 7 词键面：九键 × 2 语在册 ∥ 值面逐字（en desc = CLI 逐字 ∥ `slash.unknown` 携指引）∥ 两语键集相等", () => {
  const expect = {
    "slash.unknown": ["Unknown command: ${name} (/help for available commands)", "未知命令：${name}（/help 查看可用命令）"],
    "slash.busy": ["Unavailable while the turn is running — try again when it finishes", "回合运行中不可用——请等回合结束后重试"],
    "slash.args": ["This command does not take arguments here", "此命令在此不接受参数"],
    "slash.help.label": ["❯ Help", "❯ 帮助"],
    "slash.desc.model": ["select model & manage providers", "选择模型并管理渠道"],
    "slash.desc.auto": ["toggle auto-approve", "切换自动批准"],
    "slash.desc.plan": ["toggle plan mode (design first, then implement)", "切换计划模式（先设计，再实现）"],
    "slash.desc.eng": ["toggle engineering mode — strict methodology enforcement", "切换工程模式——严格方法论约束"],
    "slash.desc.help": ["this list", "本清单"],
  }
  for (const [key, [en, zh]] of Object.entries(expect)) {
    assert.equal(VIEWS_DICT.en[key], en, `${key} en`)
    assert.equal(VIEWS_DICT.zh[key], zh, `${key} zh`)
  }
  assert.deepEqual(Object.keys(VIEWS_DICT.en).sort(), Object.keys(VIEWS_DICT.zh).sort(), "两语键集须相等（增键两语同增）")
})

// ─── 腿 8 · E10 行集（`formatHelp` —— 三段形 ∥ 组序 ∥ 组内序 ∥ 无组跳过）────────────────────────

test("腿 8 E10 `/help` 行集：标签 ∥ 组序（CLI 同序）∥ 命令行（别名括注 ∥ 双空格）∥ 组内序 = 表序 ∥ 无组跳过", () => {
  const t = (key) => VIEWS_DICT.en[key] ?? key
  const rows = formatHelp(SLASH_COMMANDS, t)
  assert.deepEqual(rows.map((r) => r.kind), ["label", "group", "cmd", "cmd", "cmd", "cmd", "group", "cmd"])
  assert.equal(rows[0].text, "❯ Help") // 标签（= `slash.help.label`；zh = `❯ 帮助`）
  assert.deepEqual(rows.filter((r) => r.kind === "group").map((r) => r.text), ["Agent:", "System:"])
  assert.deepEqual(rows.filter((r) => r.kind === "cmd").map((r) => r.text), [
    "/model (/m)  select model & manage providers", "/auto  toggle auto-approve",
    "/plan (/p)  toggle plan mode (design first, then implement)", "/eng  toggle engineering mode — strict methodology enforcement",
    "/help (/h)  this list",
  ])
  // 组序常量 = CLI 同序（四组全在 ⇒ 逐序出）；无组条目跳过（CLI `cmd-help.mjs:13` 同判）
  const fake = [{ name: "/d", group: "System" }, { name: "/c", group: "Project" }, { name: "/b", group: "Session" }, { name: "/skip" }, { name: "/a", group: "Agent" }]
  assert.deepEqual(formatHelp(fake, t).map((r) => r.text), ["❯ Help", "Agent:", "/a  ", "Session:", "/b  ", "Project:", "/c  ", "System:", "/d  "])
})

// ─── 腿 9 · E12 行集切片（`setHelpLines` 五判 ∥ 回底合成——打印口纯面）────────────────────────

test("腿 9 `setHelpLines` 五判 ∥ 打印口纯面合成（落切片 + 回底）", () => {
  const base = initialState()
  const rows = formatHelp(SLASH_COMMANDS, (key) => VIEWS_DICT.zh[key] ?? key)
  assert.equal(setHelpLines(base, "", rows), base) // 键无效 ⇒ 原引用
  assert.equal(setHelpLines(base, "k", "nope"), base) // 行集非数组 ∥ 空 ⇒ 清键（无键 ⇒ 零写 ⇒ 原引用）
  const once = setHelpLines(base, "k", rows)
  assert.notEqual(once, base)
  assert.equal(once.helpLines.k, rows) // 行集落切片（同引用 —— 内容等价短路判据面）
  assert.equal(setHelpLines(once, "k", rows), once) // 同值（同引用）⇒ 原引用
  assert.equal(setHelpLines(once, "k", []).helpLines.k, undefined) // 空 ⇒ 清键
  const bottomed = returnToBottom(setHelpLines({ ...base, following: false, pendingNew: 3 }, "k", rows))
  assert.equal(bottomed.following, true) // 打印 = 出内容 ⇒ 复跟回底（KD-S11）
  assert.equal(bottomed.pendingNew, 0)
  assert.equal(bottomed.helpLines.k, rows)
})
