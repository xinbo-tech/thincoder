/**
 * sync-block-stop.test.mjs — X10（端差·显示面消差批 · 批次档
 * `docs/batches/2026-09-20-display-parity-batch.md` §2.2 X10 + §2.10.5 #4）机器验收。
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
 * ⚠ 现场判定读数（2026-09-20 实核 · 父侧裁定 = 设计预案「降级登记」——批档 §2.8 #7 / §2.10.9 #16②）：
 * 本档 T-S1/T-S2/T-S4 用**夹具预置** registry 键驱动门控与路由 ⇒ **display-logic-only**（验证的是“事实
 * 到位后的机制”，不构成生产可达性证据）。真实出生序列里，sync 出生 token `[model]` 由 `buildSpawnChild`
 * （`agent-tools/subagent-spawn.mjs:459` → `spawn-child.mjs:75`）发射，**早于** registry 写点
 * `armSyncChildAbort`（`agent-tools/subagent.mjs:329`，晚于 `:276` 且中间无 await）⇒ 载荷产者
 * （`panel-subagent-relay.mjs` `syncLiveOf`）在该时刻必空 ⇒ 生产 ⏹ 不可达（首回合更有 `panel._agent`
 * 未绑定盲窗——`panel-turn-loop.mjs:163` 才回写）。判据 / 门控 / 路由三条**本身正确**（产者侧序修好后
 * ⏹ 自然成活）；产者侧序缺陷 = 出批上抛（父侧已入账）。裁定落地后本档须补一条**按真发射顺序**的断言。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import * as vscode from "vscode"
import files from "./files.mjs"
import { relaySubagentEventToken } from "../src/extension/panel-callbacks.mjs"
import { handlePanelMessage } from "../src/extension/panel-messages.mjs"
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

// ─── ① 载荷产者（宿主）──────────────────────────

test("T-S1 载荷产者（relay [model] 支）：registry 命中 ⇒ syncLive:true；不可达 ⇒ false（不伪造）", () => {
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
