/**
 * sync-block-stop.test.mjs — X10（端差·显示面消差批 · 批次档
 * `docs/batches/2026-09-20-display-parity-batch.md` §2.2 X10 + §2.10.5 #4）机器验收；
 * 出生面随 #133 序修（sync 可达性批 `docs/batches/2026-09-20-sync-reachability-batch.md`
 * §2.2/§2.3/§2.5）就地升级为**真序夹具**。
 *
 * 面：① 载荷产者（`panel-subagent-relay.mjs` `[model]` 支）：核 sync registry（`_syncChildAborts`
 * ——只读消费，禁第二套）命中 ⇒ `syncLive:true`；不可达（无 `_agent` / 无键）⇒ false（不伪造）；
 * ② webview 门控（`activity-view.js` `updateStopButton`）：running + `syncLive === true` ⇒ ⏹ 在位
 * （title = 停标签）；载体 = `meta`（2 s 拍体后仍在）；③ 点击委托 ⇒ 恰一条 `cancelSubagent`
 * 载荷（与 async 用例同形 `{type, id:Number, role}`）；④ 宿主取消路由（`panel-messages-turn.mjs`）：
 * 核 `cancelSyncChild` 单源（stopped 旗标 + 条目 ctrl.abort）；未知键 ⇒ 警告 no-op；async 池零触碰。
 * 手法：host 真 relay / 真路由 + 真 webview 模块（activity-live-visibility 同骨架；点击面走真
 * chat.js 模块图——activity-flow T-R13 同法）。
 *
 * 真序面（#133——T-S1a/T-S1b/T-S1d/T-S1e/T-B1/T-B2）：sync 出生 token `[model]` 不再由装配面
 * 发射，改由 SYNC-CANCEL 单点 `armSyncChildAbort(parent, key, baseSignal, announce)` 在 registry
 * 写入**之后**当场宣告（先登记、后宣告 ⇒ VSC 载荷产者 `syncLiveOf` 在该时刻必命中）⇒ ⏹ 运行期可达。
 * 两面夹 = 真序证据：T-S1a（装配面零发射）+ T-S1b（宣告时刻 registry 已在位）；T-S1d = 生产两条
 * 调用的**链路形状**冻结（不冒充真序证据）；T-S1e / T-B2 = 生产接线结构机检；判据 / 门控 / 路由
 * 三条（T-S1c 与 T-S2–T-S6）夹具升级零改判据。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import * as vscode from "vscode"
import files from "./files.mjs"
import { relaySubagentEventToken } from "../src/extension/panel-callbacks.mjs"
import { handlePanelMessage } from "../src/extension/panel-messages.mjs"
import { buildSpawnChild } from "@thincoder/core/agent-tools/subagent-spawn.mjs"
import { emitRelayModel } from "@thincoder/core/agent/spawn-child.mjs"
import { armSyncChildAbort } from "@thincoder/core/agent-tools/subagent.mjs"
import { setupWebview, installChatFixture } from "./helpers/webview-env.mjs"

const RS = "\x1e"
let cleanupEnv, capturedPosts

before(() => {
  vscode.env.language = "en"
  const env = setupWebview()
  cleanupEnv = env.cleanup
  capturedPosts = env.capturedPosts
  installChatFixture()
})

after(() => {
  try { window.dispatchEvent(new window.Event("unload")) } catch { /* happy-dom teardown edge */ }
  cleanupEnv()
})

/** 桩面板（relay / 路由最小面）。 */
function stubPanel(extra = {}) {
  const posted = []
  const p = {
    _wvReady: true, _agent: null, _susp: null, _liveLines: null, _turnState: "idle",
    _questionQueue: [], _permissionQueue: [], _refreshStatus() {},
    _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } },
    ...extra,
  }
  p.posted = posted
  return p
}

/** webview 模块组（真 activity.js / activity-view.js——逐测冷启复位）。 */
async function wv() {
  const state = await import("../webview/state.js")
  const activity = await import("../webview/activity.js")
  const diag = await import("../webview/activity-diag.js")
  const env = { S: state.S, ctx: state.ctx, diag, ...activity }
  env.ctx.messagesEl.replaceChildren()
  env.ctx.activityEl.replaceChildren()
  env.S._subBlocks.clear()
  env.S._subDescShown = true
  env.diag.resetSubTrace()
  return env
}

const subMsg = (status, role, id, extra = {}) => ({ type: "subagent", status, role, id, ...extra })
const stopBtn = (block) => block.querySelector(".sub-stop-btn")

// ─── ①′ #133 真序夹具（装配面 / 出生序单点 / 链路形状 / 接线）──────────────

/** 真装配夹具：`buildSpawnChild` sync 分支（explore——readonly 工具集；provider apiKey 齐、
 *  无 model 覆盖 ⇒ childProvider.model = parent.provider.model）。tokens = 装配面发射 spy。 */
function syncAssembly() {
  const tokens = []
  const parent = {
    cwd: "/proj", _role: "coder", _touchedFiles: [],
    tools: [], provider: { name: "p", baseURL: "https://x", model: "m", apiKey: "k" },
    config: { agent: {} },
  }
  const ctx = { agent: parent, depth: 0, callbacks: { onToken: (t) => tokens.push(String(t)) }, cwd: "/proj" }
  return { parent, ctx, tokens }
}

/** 载荷形状（`startedAt` 为时钟字段 ⇒ 只断言其类型，其余逐字）。 */
const shapeOf = (p) => ({ ...p, startedAt: typeof p?.startedAt })

const startedShape = (role, id, model) => ({
  type: "subagent", role, id, status: "started", pool: false, model, startedAt: "number", syncLive: true,
})

const readCore = (rel) => readFileSync(new URL(`../../thincoder-core/${rel}`, import.meta.url), "utf8")
/** 归一（结构机检用）：先剥整行 `//` 注释再坍缩空白——注释插拔不改变调用形判据。 */
const flat = (src) => src.replace(/^\s*\/\/.*$/gm, "").replace(/\s+/g, " ")

test("T-S1a 装配面零发射：sync 分支只取号（`[model]` 不发——出生宣告归 arm 单点）", () => {
  const { parent, ctx, tokens } = syncAssembly()
  const built = buildSpawnChild(parent, ctx, { task: "survey the repo" }, "explore", false, [], [], null)
  assert.deepEqual(tokens, [], "装配面零发射（先红：装配面发 1 条 [model]）")
  assert.match(built.relayPrefix, /^explore#\d+\/$/, "取号仍在装配面（relayPrefix 形如 explore#N/）")
  assert.equal(parent._subAgentCounter, 1, "取号恰 +1（取号段仍在装配面——发射段外移）")
})

test("T-S1b 出生序单点：registry 写入之后宣告 ⇒ 载荷 syncLive:true（真 relay 闭路）", () => {
  const { parent, ctx } = syncAssembly()
  const built = buildSpawnChild(parent, ctx, { task: "survey the repo" }, "explore", false, [], [], null)
  const key = built.relayPrefix.slice(0, -1)
  const panel = stubPanel({ _agent: parent })
  let registryAtAnnounce = null
  const { ctrl, disarm } = armSyncChildAbort(parent, key, null, () => {
    registryAtAnnounce = parent._syncChildAborts?.has(key) === true
    emitRelayModel((t) => relaySubagentEventToken(panel, t), built.relayPrefix, "m")
  })
  assert.equal(registryAtAnnounce, true, "宣告时刻 registry 已在位（序即契约——先红：第 4 参被忽略 ⇒ null）")
  const load = panel.posted.at(-1)
  assert.ok(load, "宣告产出载荷（先红：零载荷）")
  assert.deepEqual(shapeOf(load), startedShape("explore", Number(key.split("#")[1]), "m"),
    "载荷 = {status:'started', pool:false, model, syncLive:true}（不可中止事实随载荷）")
  assert.equal(parent._syncChildAborts.has(key), true, "宣告在 arm 内 ⇒ registry 键在位")
  assert.ok(ctrl instanceof AbortController, "自属 controller 照旧")
  disarm()
  assert.equal(parent._syncChildAborts.has(key), false, "disarm 注销（跨回合零残留）")
})

// ─── ① 载荷产者（宿主 · 判据——T-S1c）───────────────

test("T-S1c 判据零回归（原 T-S1）载荷产者（relay [model] 支）：registry 命中 ⇒ syncLive:true；不可达 ⇒ false（不伪造）", () => {
  const ac = new AbortController()
  const agent = { _syncChildAborts: new Map([["coder#2", { ctrl: ac, stopped: false }]]) }
  const p = stubPanel({ _agent: agent })
  // sync 出生面 = `[model]`（无 ⟦ev⟧async ⇒ pool:false）
  assert.equal(relaySubagentEventToken(p, "coder#2/[model]m"), true)
  assert.deepEqual(p.posted.at(-1), { type: "subagent", role: "coder", id: 2, status: "started", pool: false, model: "m", startedAt: p.posted.at(-1).startedAt, syncLive: true },
    "registry 命中 ⇒ syncLive:true（可中止事实随载荷）")
  // 无 registry（headless / 面板 agent 不可达）⇒ false
  const q = stubPanel()
  relaySubagentEventToken(q, "coder#3/[model]m")
  assert.equal(q.posted.at(-1).syncLive, false, "无 _agent ⇒ syncLive:false（不伪造可中止）")
  // registry 无该键（已注销 / 未注册）⇒ false
  const r = stubPanel({ _agent: { _syncChildAborts: new Map() } })
  relaySubagentEventToken(r, "coder#2/[model]m")
  assert.equal(r.posted.at(-1).syncLive, false, "键未命中 ⇒ false")
  // async 出生面（⟦ev⟧async 前置）⇒ pool:true + syncLive:false（既有分支零回归）
  const a = stubPanel({ _agent: agent })
  relaySubagentEventToken(a, `coder#2/⟦ev⟧async${RS}`)
  relaySubagentEventToken(a, "coder#2/[model]m")
  assert.equal(a.posted.at(-1).pool, true, "async 支 pool:true 零回归")
  assert.equal(a.posted.at(-1).syncLive, false, "async 块不因 registry 同名键误标 syncLive")
})

test("T-S1d 链路形状冻结：生产两条调用复刻首回合序列 ⇒ 载荷与 T-S1b 同形（不冒充真序证据）", () => {
  const { parent, ctx } = syncAssembly()
  const built = buildSpawnChild(parent, ctx, { task: "survey the repo" }, "explore", false, [], [], null)
  const panel = stubPanel({ _agent: parent })
  const syncKey = built.relayPrefix.slice(0, -1)
  // 生产形（`agent-tools/subagent.mjs` 阻塞路径）：第 4 参 = announce 闭包，模型取自 built.childProvider
  const { disarm } = armSyncChildAbort(parent, syncKey, null, () =>
    emitRelayModel((t) => relaySubagentEventToken(panel, t), built.relayPrefix, built.childProvider?.model ?? ""))
  const load = panel.posted.at(-1)
  assert.ok(load, "链路形状：生产两条调用产出载荷（先红：零载荷）")
  assert.deepEqual(shapeOf(load), startedShape("explore", Number(syncKey.split("#")[1]), "m"), "与 T-S1b 同形（model = childProvider.model）")
  disarm()
})

test("T-S1e 生产调用点接线（结构机检）：subagent.mjs 阻塞路径第 4 参 = announce 闭包", () => {
  const src = flat(readCore("agent-tools/subagent.mjs"))
  assert.ok(src.includes("armSyncChildAbort(parent, syncKey, baseSignal, () => emitRelayModel(ctx.callbacks?.onToken,"),
    "阻塞路径调用形在位（第 4 参 = announce 闭包——评审 #1 选项②）")
  assert.match(src, /registry\.set\(key, \{ ctrl, stopped: false \}\) try \{ announce\?\.\(\) \}/,
    "序即契约：arm 内登记先于宣告（宣告包异常自清，不改登记→宣告次序）")
})

test("T-B1 面板绑定 holder 契约：bindPanelAgent(panel, holder) 双向活绑定", async () => {
  const mod = await import("../src/extension/panel-turn-loop.mjs")
  assert.equal(typeof mod.bindPanelAgent, "function", "bindPanelAgent 导出件在位（先红：helper 不存在）")
  const panel = { _agent: null }
  const holder = { agent: null }
  mod.bindPanelAgent(panel, holder)
  const a = { tag: "a" }
  holder.agent = a
  assert.equal(panel._agent, a, "宿主写回 holder.agent ⇒ 面板字段当场同步（首回合盲窗收口）")
  const b = { tag: "b" }
  panel._agent = b
  assert.equal(holder.agent, b, "面板槽直写 ⇒ holder.agent 实读（同一槽单源）")
})

test("T-B2 接线机检：panel-turn-loop.mjs 中 bindPanelAgent(panel, ro) 在位", () => {
  const src = flat(readFileSync(new URL("../src/extension/panel-turn-loop.mjs", import.meta.url), "utf8"))
  assert.ok(src.includes("bindPanelAgent(panel, ro)"), "runTurnLoop 构造 ro 后一行接入（先红：零接入）")
})

// ─── ② webview 门控（syncLive 支）─────────────────

test("T-S2 门控（syncLive 支）：running + syncLive ⇒ ⏹ 在位（title = 停标签）；2 s 拍体后仍在", async () => {
  const env = await wv()
  env.applySubagentStatus(subMsg("started", "coder", 2, { pool: false, syncLive: true, model: "m" }))
  const block = env.S._subBlocks.get("sub:coder#2")
  const btn = stopBtn(block)
  assert.ok(btn, "syncLive 块 ⏹ 在位（先红：门控只认 pool === true ⇒ 无按钮）")
  assert.equal(btn.title, "Stop this subagent", "title = 停标签（locale 键 sub.stopBtn）")
  assert.equal(block._subMeta.syncLive, true, "门控载体 = meta.syncLive（块级活态载体）")
  env.refreshLiveHeaders() // 2 s 拍体（panels._panelTimer 同点）
  assert.ok(stopBtn(block), "2 s 拍体后 ⏹ 仍在（门控读 meta，非 DOM 一次写）")
  // 缺省（false / undefined）⇒ 无 ⏹（不伪造）——与同步 spawn 无 registry 时同形
  env.applySubagentStatus(subMsg("started", "explore", 5, { pool: false }))
  assert.equal(stopBtn(env.S._subBlocks.get("sub:explore#5")), null, "syncLive 缺省 ⇒ 无 ⏹")
})

test("T-S3 零回归：pool === true 既有支不变 / queued 取消支不变 / 冻结块 ⏹ 移除", async () => {
  const env = await wv()
  env.applySubagentStatus(subMsg("started", "explore", 11, { pool: true }))
  const poolBlock = env.S._subBlocks.get("sub:explore#11")
  assert.ok(stopBtn(poolBlock), "async（pool === true）支零回归")
  env.applySubagentStatus(subMsg("queued", "eng-coder", 12, { position: 2, kind: "slot" }))
  const queued = env.S._subBlocks.get("sub:eng-coder#12")
  assert.ok(stopBtn(queued), "queued 取消支零回归")
  assert.equal(stopBtn(queued).title, "cancel queue")
  // 冻结（done）→ ⏹ 移除
  env.applySubagentStatus(subMsg("started", "coder", 13, { pool: false, syncLive: true }))
  const syncBlock = env.S._subBlocks.get("sub:coder#13")
  assert.ok(stopBtn(syncBlock), "前置：syncLive 块有 ⏹")
  env.applySubagentStatus(subMsg("done", "coder", 13))
  assert.equal(stopBtn(syncBlock), null, "冻结块 ⏹ 移除（既有语义）")
})

test("T-S4 点击委托：恰一条 cancelSubagent 载荷 {type, id:Number, role}（与 async 用例同形）", async () => {
  const env = await wv()
  // 真 chat.js 模块图（⏹ 点击单委托点——activity-flow T-R13 同法：追加缺失 id 后引导真图）
  const GRAPH_IDS = ("chat-container session-bar session-arrow new-session-btn panels toolbar at-dropdown " +
    "input-row file-input attach-btn paste-bar paste-badge controls-row auto-btn advisor-btn eng-btn " +
    "plan-btn settings-btn settings-panel settings-close settings-body").split(" ")
  for (const id of GRAPH_IDS) {
    if (document.getElementById(id)) continue
    const el = document.createElement("div")
    el.id = id
    document.body.appendChild(el)
  }
  await import("../webview/chat.js")
  env.applySubagentStatus(subMsg("started", "coder", 21, { pool: false, syncLive: true, model: "m" }))
  const block = env.S._subBlocks.get("sub:coder#21")
  const btn = stopBtn(block)
  assert.ok(btn, "前置：⏹ 在位")
  const mark = capturedPosts.length
  const ev = new window.MouseEvent("click", { bubbles: true, cancelable: true })
  btn.dispatchEvent(ev)
  const posts = capturedPosts.slice(mark).filter((m) => m.type === "cancelSubagent")
  assert.deepEqual(posts, [{ type: "cancelSubagent", id: 21, role: "coder" }], "载荷逐字（id 数值化——与 async 用例同形）")
  assert.equal(ev.defaultPrevented, true, "preventDefault 真触（不翻折叠）")
  assert.ok(block.classList.contains("sub-live"), "块状态不翻（仍 live——终态由宿主事件驱动）")
})

// ─── ③ 宿主取消路由（sync 支）─────────────────────

/** 池 history 最小载体（async 池面——断言"零触碰"用）。 */
function poolHistory() {
  const history = []
  Object.assign(history, { _asyncSubagents: new Map(), _asyncAdvisors: new Map(), _pendingAsyncResults: [] })
  return history
}

test("T-S5 取消路由（sync 支）：核 cancelSyncChild 单源（stopped 旗标 + 条目 ctrl.abort）；未知键 ⇒ 警告 no-op；async 池零触碰", async () => {
  const ac = new AbortController()
  const agent = { _syncChildAborts: new Map([["coder#2", { ctrl: ac, stopped: false }]]) }
  const history = poolHistory()
  const p = stubPanel({ _agent: agent, _liveLines: { history, fullHistory: history, cwd: "/proj" } })
  await handlePanelMessage(p, { type: "cancelSubagent", id: 2, role: "coder" })
  const entry = agent._syncChildAborts.get("coder#2")
  assert.equal(entry.stopped, true, "stopped 旗标置位（与核 cancelSyncChild 同源）")
  assert.equal(ac.signal.aborted, true, "条目 ctrl 定向 abort（真中止路径——childRunOpts.signal）")
  assert.equal(history._asyncSubagents.size, 0, "async 池零触碰")
  assert.equal(p.posted.length, 0, "host 侧零协议消息（收尾由核 ⟦ev⟧stopped 中继驱动——不另发）")
  // 未知键（陈旧 ⏹ / 已注销）⇒ 警告 + no-op（无虚构状态）
  const q = stubPanel({ _agent: { _syncChildAborts: new Map() }, _liveLines: { history, fullHistory: history, cwd: "/proj" } })
  const realWarn = console.warn
  const warned = []
  console.warn = (m) => { warned.push(String(m)) }
  try {
    await handlePanelMessage(q, { type: "cancelSubagent", id: 9, role: "coder" })
  } finally { console.warn = realWarn }
  assert.equal(warned.length, 1, "陈旧键 ⇒ 警告一次（no-op）")
  assert.equal(q.posted.length, 0, "零协议消息")
  // role 不符（键形 role#id 不命中）⇒ 同 no-op（交叉校验语义保持）
  const r = stubPanel({ _agent: agent, _liveLines: { history, fullHistory: history, cwd: "/proj" } })
  const warned2 = []
  console.warn = (m) => { warned2.push(String(m)) }
  try {
    await handlePanelMessage(r, { type: "cancelSubagent", id: 2, role: "explore" })
  } finally { console.warn = realWarn }
  assert.equal(warned2.length, 1, "role 不符 ⇒ no-op（键形 role#id 交叉校验）")
})

test("T-S6 接线机检：本档登记 test/files.mjs", () => {
  assert.ok(files.includes("test/sync-block-stop.test.mjs"), "本档已登记 test/files.mjs")
})
