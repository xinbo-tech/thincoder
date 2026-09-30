/**
 * 2026-09-29-desktop-residuals-sweep-wave-a.test.mjs — 桌面残余族清账批 · **实施波 A** 批次本地件
 * ⚠ 断代失效（2026-09-30 · 台账 #731 核处）：本件白盒断言所测内部形态已随后续批次演进（#719 消化面重构 ∥ chat-tree 拆档 ∥ 锚链序变更等）——重跑必红为预期；特性现形态的回归锚以近期批件为准。本件留档参考，勿按红态排障。
 * （潜行形：写门相抵 #545 ⇒ 父侧已收位到 `docs/batches/` 终位；运行 = 自 `thincoder/` 根
 *  `node --import ./thincoder-desktop/test/rc-resolve.mjs --test docs/batches/2026-09-29-desktop-residuals-sweep-wave-a.test.mjs`）。
 * 腿集（设计 §2 修正轮 §4 机检腿清单 · 本波射程）：
 *   ① 菜单词表（#533 —— 两值 + 未知 ∕ 缺失回落 + en 现值逐字回归）
 *   ② `ev:susp` 出窗帧 `interrupted`（#554① —— 中止径 true ∕ 自然退出径 false · 键恒在场布尔形）
 *   ③ toast 径（#556 —— 改名失败两径 ⇒ 可见 toast；词面两语键在场）
 *   ④ 目标卡开合（#554② —— 默认合 · 点按两态可切 · 徽标在场判据零改）
 *   ⑤ 值提取 ∕ 坐标比对（#534 亮色值 + 对比重算；#535 码面两处；#555 五处逐处引文↔目标行实名核对）
 */
import assert from "node:assert/strict"
import { test } from "node:test"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const here = dirname(fileURLToPath(import.meta.url)) // 终位 = thincoder/docs/batches（深度已按终位收正——父侧 2026-09-29）
const dskPath = (rel) => join(here, "../..", "thincoder-desktop", rel) // 桌面根相对（读取用）
const dsk = (rel) => pathToFileURL(dskPath(rel)).href // 桌面根相对（file:// 形 —— 动态 import 用）
const repo = (rel) => join(here, "../..", rel) // 仓根相对（读取用）

// ─── 迷你 DOM 桩（本文件用最小面：attr ∕ classList ∕ hidden ∕ 事件登记与触发 ∕ #id 读 ∕ querySelector 注册表）──
class FakeText {
  constructor(value) { this.textContent = String(value) }
}
class FakeNode {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase()
    this.attrs = {}
    this.dataset = {}
    this.children = []
    this.textContent = ""
    this.parent = null
    this.isConnected = true
    this._classes = new Set()
    this._listeners = {}
    this.classList = {
      add: (...cs) => { for (const c of cs) this._classes.add(c) },
      remove: (...cs) => { for (const c of cs) this._classes.delete(c) },
      contains: (c) => this._classes.has(c),
    }
  }
  set className(value) { this._classes = new Set(String(value).split(/\s+/).filter(Boolean)) }
  get className() { return [...this._classes].join(" ") }
  setAttribute(k, v) { this.attrs[k] = String(v) }
  getAttribute(k) { return this.attrs[k] ?? null }
  addEventListener(type, fn) { (this._listeners[type] ??= []).push(fn) }
  fire(type, ev) { for (const fn of [...(this._listeners[type] ?? [])]) fn(ev) }
  focus() {}
  appendChild(node) { const n = node instanceof FakeNode || node instanceof FakeText ? node : new FakeText(node); n.parent = this; this.children.push(n); this.bump(); return n }
  append(...nodes) { for (const n of nodes) this.appendChild(n) }
  insertBefore(node, anchor) {
    const at = anchor == null ? -1 : this.children.indexOf(anchor)
    if (at < 0) this.children.push(node); else this.children.splice(at, 0, node)
    node.parent = this
    this.bump()
    return node
  }
  get firstChild() { return this.children[0] ?? null }
  replaceChildren(...nodes) { for (const c of this.children) c.parent = null; this.children = []; for (const n of nodes) this.appendChild(n) }
  remove() { if (this.parent) { const at = this.parent.children.indexOf(this); if (at >= 0) this.parent.children.splice(at, 1); this.parent.bump() } }
  set innerHTML(value) { this._html = String(value) }
  get content() { this._content ??= new FakeNode("#fragment"); return this._content }
  bump() { this.textContent = this.children.map((c) => c.textContent ?? "").join("") }
}
const docRegistry = { goalCard: null }
globalThis.Node = FakeNode
globalThis.document = {
  createElement: (tag) => new FakeNode(tag),
  createTextNode: (value) => new FakeText(value),
  body: new FakeNode("body"),
  getElementById(id) {
    for (const c of globalThis.document.body.children) if (c.id === id) return c
    return null
  },
  querySelector(sel) {
    return sel === '[data-card="goal"]' ? docRegistry.goalCard : null
  },
}

// 窄桥桩（先于 `mount-sessions.mjs` 模块级读取 —— `const host = globalThis.thincoder`）。
const bridge = { invoke: async () => ({ ok: false, reason: "mtime-conflict" }) }
globalThis.thincoder = bridge

const { initDict, t } = await import(dsk("renderer/i18n.mjs"))
initDict({ locale: "en", dict: {} })
const { VIEWS_DICT } = await import(dsk("renderer/i18n-views.mjs"))
const { menuLabels } = await import(dsk("src/main/menu-words.mjs"))
const { createSuspensionDrive } = await import(dsk("src/main/suspension-drive.mjs"))
const { confirmRename } = await import(dsk("renderer/mount-sessions.mjs"))
const { showToast } = await import("/rc/toast.mjs")
const { goalBadgeVisible, goalCardNode, goalPanelOpen, toggleGoalPanel } = await import(dsk("renderer/views/goal.mjs"))
const { build } = await import(dsk("renderer/dom.mjs"))
const { statusModel, statusTree } = await import(dsk("renderer/views/statusline.mjs"))

const tick = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms))
const until = async (cond, tries = 200) => { for (let i = 0; i < tries; i += 1) { if (cond()) return true; await tick(1) } return cond() }
const lines = (path) => readFileSync(path, "utf8").split("\n")
const out = (label, value) => console.log(`[读数] ${label}: ${value}`)

// ─── ① #533 菜单词表 ─────────────────────────────────────────────────────────
test("① #533 菜单词表：en 表逐字不变 + zh（归一）命中 zh 值 + 未知 ∕ 空 ∕ 缺失 ⇒ 回落 en", () => {
  const en = { maintenance: "Maintenance", cleanUp: "Clean up session data…", rebuildIndex: "Rebuild session index" }
  const zh = { maintenance: "维护", cleanUp: "清理会话数据…", rebuildIndex: "重建会话索引" }
  assert.deepEqual(menuLabels("en"), en)
  assert.deepEqual(menuLabels("zh"), zh) // zh 词值已裁（#533 上抛 1）⇒ 微单落值同拍改述（防绿转红）
  assert.deepEqual(menuLabels("zh-CN"), zh) // 归一（zh-CN ⇒ zh）
  assert.deepEqual(menuLabels("fr"), en) // 未知 ⇒ en
  assert.deepEqual(menuLabels(""), en) // 空 ⇒ en
  assert.deepEqual(menuLabels(undefined), en) // 缺失 ⇒ en
  out("① menuLabels(en)", JSON.stringify(menuLabels("en")))
  out("① menuLabels(zh) ∕ zh-CN", `${JSON.stringify(menuLabels("zh"))} ∕ ${JSON.stringify(menuLabels("zh-CN"))}`)
  out("① menuLabels(fr) ∕ 空 ∕ 缺失", `${JSON.stringify(menuLabels("fr"))} ∕ ${JSON.stringify(menuLabels(""))} ∕ ${JSON.stringify(menuLabels(undefined))}`)
})

// ─── ② #554① ev:susp 出窗帧 interrupted ────────────────────────────────────
test("② #554① ev:susp 出窗帧 interrupted：中止径 true ∕ 自然退出径 false（键恒在场 · 布尔形）", async () => {
  const mk = () => {
    const posts = []
    const drive = createSuspensionDrive({
      post: (ch, payload) => posts.push({ ch, payload }),
      runTurn: async () => {},
      timer: () => ({ unref() {} }),
      clear: () => {},
    })
    const agent = {
      config: { agent: {} }, history: [],
      _asyncSubagents: new Map([[1, { id: 1, role: "coder", status: "running" }]]),
    }
    return { drive, posts, agent }
  }
  const endFrame = (posts) => posts.filter((p) => p.ch === "ev:susp" && p.payload?.active === false).at(-1)?.payload

  const aborted = mk()
  assert.equal(aborted.drive.start("k", aborted.agent), true)
  await tick()
  aborted.drive.abort("k")
  assert.ok(await until(() => aborted.drive.size() === 0), "中止径：窗应出窗")
  const abortedEnd = endFrame(aborted.posts)
  assert.ok(abortedEnd !== undefined, "中止径：出窗帧在场")
  assert.equal(abortedEnd.interrupted, true)

  const natural = mk()
  assert.equal(natural.drive.start("k", natural.agent), true)
  await tick()
  natural.agent._asyncSubagents.clear() // 池空
  for (const wake of [...(natural.agent._asyncWaiters ?? [])]) wake() // settle 广播 ⇒ 循环自然退出
  assert.ok(await until(() => natural.drive.size() === 0), "自然退出径：窗应出窗")
  const naturalEnd = endFrame(natural.posts)
  assert.ok(naturalEnd !== undefined, "自然退出径：出窗帧在场")
  assert.ok("interrupted" in naturalEnd, "键恒在场（布尔形不伪造）")
  assert.equal(naturalEnd.interrupted, false)

  out("② 中止径出窗帧", JSON.stringify(abortedEnd))
  out("② 自然退出径出窗帧", JSON.stringify(naturalEnd))
})

// ─── ③ #556 toast 径 ────────────────────────────────────────────────────────
test("③ #556 改名失败径 ⇒ toast（回执拒 ∕ 抛两径）+ 词面两语键在场", async () => {
  assert.equal(VIEWS_DICT.en["session.renameFailed"], "Could not rename the session (${reason})")
  assert.equal(VIEWS_DICT.zh["session.renameFailed"], "会话改名失败（${reason}）")
  // 回执拒径
  assert.equal(await confirmRename("1", "标题"), false)
  const first = document.getElementById("paste-toast")
  assert.equal(first?.textContent, "Could not rename the session (mtime-conflict)")
  // 抛径
  bridge.invoke = async () => { throw new Error("boom") }
  assert.equal(await confirmRename("1", "标题"), false)
  assert.equal(document.getElementById("paste-toast")?.textContent, "Could not rename the session (boom)")
  // zh 词面投影（t 同源）
  initDict({ locale: "zh", dict: {} })
  const zhText = t("session.renameFailed", { reason: "冲突" })
  initDict({ locale: "en", dict: {} })
  assert.equal(zhText, "会话改名失败（冲突）")
  out("③ toast（回执拒径）", JSON.stringify("Could not rename the session (mtime-conflict)"))
  out("③ toast（抛径）", JSON.stringify(document.getElementById("paste-toast")?.textContent))
  out("③ zh 投影", JSON.stringify(zhText))
  clearTimeout(showToast._t) // 清淡出计时器（免测试进程滞留）
})

// ─── ④ #554② 目标卡开合 ────────────────────────────────────────────────────
test("④ #554② 目标卡开合：默认合 · 点按两态可切 · 徽标在场判据零改", () => {
  const goal = { status: "active", objective: "ship wave A", criteria: "legs green" }
  assert.equal(goalPanelOpen(), false) // 默认 = 合（实施轮核定：改默认不显）
  assert.equal(goalCardNode(goal).hidden, true) // 新卡挂载即隐藏
  assert.notEqual(goalCardNode(goal, { open: true }).hidden, true) // 开态不隐藏
  // 徽标在场判据零改（核可见判据 ∧ active 态门）
  assert.equal(goalBadgeVisible(goal), true)
  assert.equal(goalBadgeVisible({ status: "done" }), false)
  assert.equal(goalBadgeVisible(null), false)
  // 🎯 点击面接线（状态树 → build → 点按）
  const model = statusModel({ activeSession: "1", goal: { 1: goal } })
  const tree = statusTree(model)
  const goalDesc = tree.children.find((n) => n?.props?.["data-goal"] !== undefined)
  assert.ok(goalDesc !== undefined, "🎯 节点在场")
  assert.equal(goalDesc.props.role, "button")
  assert.equal(goalDesc.props.tabindex, "0")
  assert.equal(typeof goalDesc.props.onClick, "function")
  assert.equal(typeof goalDesc.props.onKeydown, "function")
  const node = build(goalDesc)
  // 活卡注册（文档单例读面 —— `[data-card="goal"]`）
  docRegistry.goalCard = goalCardNode(goal, { open: goalPanelOpen() })
  node.fire("click")
  assert.equal(goalPanelOpen(), true)
  assert.equal(docRegistry.goalCard.hidden, false) // 点按 ⇒ 开（卡显）
  node.fire("click")
  assert.equal(goalPanelOpen(), false)
  assert.equal(docRegistry.goalCard.hidden, true) // 再点 ⇒ 合（卡隐）
  // Enter 键径（桌面可点节点通则）
  node.fire("keydown", { key: "Enter", preventDefault() {} })
  assert.equal(goalPanelOpen(), true)
  // 直接出口同源（toggleGoalPanel 与点击面单点）
  assert.equal(toggleGoalPanel(), false)
  docRegistry.goalCard = null
  out("④ 开合两态", `默认合=${goalCardNode(goal).hidden} · 点按后 开=${true}∥合=${true} 两态可切 · 键径同源`)
})

// ─── ⑤ 值提取 ∕ 坐标比对 ───────────────────────────────────────────────────
test("⑤a #534 亮色值 = #0a7b0a + 对比重算 ≥ 4.5（暗色零动）", () => {
  const lum = (hex) => {
    const v = hex.replace("#", "")
    const chan = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
    const [r, g, b] = [0, 2, 4].map((i) => chan(parseInt(v.slice(i, i + 2), 16) / 255))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
  const theme = lines(dskPath("renderer/theme.css"))
  const light = theme[15]
  assert.match(light, /--mode-advisor: #0a7b0a;/)
  assert.match(theme[51], /--mode-advisor: #23d18b;/) // 暗色零动（CLI 忠实值）
  const onBg = ratio(lum("#0a7b0a"), lum("#f7f8fa"))
  assert.ok(onBg >= 4.5, `对比 ${onBg.toFixed(2)} 应 ≥ 4.5`)
  out("⑤a 亮色值", `#0a7b0a · 对 --bg ${onBg.toFixed(2)}:1 ∕ 白底 ${ratio(lum("#0a7b0a"), lum("#ffffff")).toFixed(2)}:1 · 暗色 #23d18b 零动`)
})

test("⑤b #535 码面 2：两处注释坐标 = render-frame.mjs:233-236（目标行实名）", () => {
  const rf = lines(repo("thincoder-cli/src/tui/render-frame.mjs"))
  const four = rf.slice(232, 236) // 233-236（停滞批增行后重锚——父侧随动 2026-09-29）
  assert.ok(four.every((l) => /Banner = /.test(l)), "233-236 = 四 banner 常量行")
  assert.match(rf[236], /bannerPrefix/) // 237 = bannerPrefix（邻位核对）
  const banner = lines(dskPath("renderer/views/statusline-banner.mjs")).slice(0, 10).join("\n")
  const host = lines(dskPath("src/main/agent-host.mjs")).slice(195, 215).join("\n")
  assert.match(banner, /render-frame\.mjs:233-236/)
  assert.match(host, /render-frame\.mjs:233-236/)
  out("⑤b 坐标", `statusline-banner.mjs:5 ∕ agent-host.mjs:207 ⇒ render-frame.mjs:233-236（233-236 四行逐行含 Banner =）`)
})

test("⑤c #555 五处注释坐标：逐处引文 ↔ 目标行实名核对（届盘实读）", () => {
  const core = (rel) => lines(repo(`thincoder-core/${rel}`))
  const at = (list, n) => list[n - 1] ?? ""
  const sites = []
  const check = (label, list, n, needle) => {
    assert.ok(at(list, n).includes(needle), `${label}（:${n} 应含 ${needle}）`)
    sites.push(`${label}:${n}✓`)
  }
  // ① src/agent/setup.mjs（四坐标）
  const vscSetup = lines(repo("thincoder-vscode/src/agent/setup.mjs")).join("\n")
  assert.ok(vscSetup.includes("subagent.mjs:271"), "① setup.mjs 引 :271")
  assert.ok(vscSetup.includes(":194"), "① setup.mjs 引 :194")
  assert.ok(vscSetup.includes("subagent-spawn.mjs:304"), "① setup.mjs 引 :304")
  assert.ok(vscSetup.includes("subagent-async.mjs:291"), "① setup.mjs 引 :291")
  check("subagent.mjs:271", core("agent-tools/subagent.mjs"), 271, "parent.autoApprove")
  check("subagent.mjs:194", core("agent-tools/subagent.mjs"), 194, "autoApprove")
  check("subagent-spawn.mjs:304", core("agent-tools/subagent-spawn.mjs"), 304, "parent.autoApprove")
  check("subagent-async.mjs:291", core("agent-tools/subagent-async.mjs"), 291, "agent.autoApprove")
  // ② / ③ / ④ panel-callbacks.mjs
  const cb = lines(repo("thincoder-vscode/src/extension/panel-callbacks.mjs")).join("\n")
  assert.ok(cb.includes("dispatch-run.mjs:137"), "② 引 dispatch-run.mjs:137")
  assert.ok(cb.includes("subagent-spawn.mjs:318"), "③ 引 :318")
  assert.ok(cb.includes("subagent-spawn.mjs:308"), "④ 引 :308")
  check("dispatch-run.mjs:137", core("agent/dispatch-run.mjs"), 137, "_subagentKey")
  check("subagent-spawn.mjs:318", core("agent-tools/subagent-spawn.mjs"), 318, "onPermissionRequest")
  check("subagent-spawn.mjs:308", core("agent-tools/subagent-spawn.mjs"), 308, "return false")
  // ⑤ panel-subagent-relay.mjs（六 token）
  const relay = lines(repo("thincoder-vscode/src/extension/panel-subagent-relay.mjs")).join("\n")
  for (const ref of ["subagent-run.mjs:163", "subagent-scheduler.mjs:356", "subagent-async.mjs:281", "async-settle.mjs:239/273/275", "agent/turn-loop.mjs:77"]) {
    assert.ok(relay.includes(ref), `⑤ 引 ${ref}`)
  }
  check("subagent-run.mjs:163", core("agent-tools/subagent-run.mjs"), 163, "⟦ev⟧async")
  check("subagent-scheduler.mjs:356", core("agent-tools/subagent-scheduler.mjs"), 356, "⟦ev⟧queued")
  check("subagent-async.mjs:281", core("agent-tools/subagent-async.mjs"), 281, "⟦ev⟧cancelled")
  check("async-settle.mjs:239", core("agent-tools/async-settle.mjs"), 239, "⟦ev⟧stopped")
  check("async-settle.mjs:273", core("agent-tools/async-settle.mjs"), 273, "⟦ev⟧settled")
  check("async-settle.mjs:275", core("agent-tools/async-settle.mjs"), 275, "⟦ev⟧done")
  check("agent/turn-loop.mjs:77", core("agent/turn-loop.mjs"), 77, "⟦ev⟧turn") // 2026-09-29 拆分后重锚（父侧随动）
  out("⑤c #555 逐处核对", sites.join(" · "))
})
