/**
 * subagent-note-parity.test.mjs — X6 / X11（端差·显示面消差批 · 批次档
 * `docs/batches/2026-09-20-display-parity-batch.md` §2.2 X6/X11 + §2.10.5 #4 / §2.10.6 #7）机器验收。
 *
 * 面：① 宿主注记判据（`panel-callbacks.onToolResult` 第 4 参 subKey 命中 ⇒ done 载荷补 `note`——
 * 标记常量 = 核零依赖叶 `@thincoder/core/agent/child-marks.mjs`；判据序同 CLI `tool-events.mjs:217`）；
 * ② relay `⟦ev⟧stopped` **零注记**（`panel-subagent-relay.mjs`——第 4 位原因词恒字面 `stopped`，
 * 与冻结头 verb 重复 ⇒ 不传；CLI 标尺 = `subagent-blocks.mjs:263-273` 同分支不置 `lastError`）；
 * ③ webview 承面（`activity-view.js` 冻结头 `— <note>`——X6 done 停因注记 + X11 `— interrupted`；
 * error 面走 `meta.error`；载体 = `meta.note` 单一字段，禁第二注记字段）；
 * ④ X11 宿主真值源（`suspension.mjs` 会话中止旗标 ⇒ `suspension` 终态载荷 `interrupted`）。
 * 手法：host 真回调装配 + 真 relay → 捕获载荷喂真 webview 模块（activity-live-visibility 同骨架）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import * as vscode from "vscode"
import files from "./files.mjs"
import { TURN_CAP_MARK, STOPPED_MARK } from "@thincoder/core/agent/spawn-child.mjs" // 核单源锚（既有公共面）
import { buildPanelCallbacks, relaySubagentEventToken } from "../src/extension/panel-callbacks.mjs"
import { suspensionSession } from "../src/extension/suspension.mjs"
import { setupWebview, installChatFixture } from "./helpers/webview-env.mjs"

const RS = "\x1e"
let cleanupEnv

before(() => {
  vscode.env.language = "en"
  cleanupEnv = setupWebview().cleanup
  installChatFixture()
})

after(() => {
  try { window.dispatchEvent(new window.Event("unload")) } catch { /* happy-dom teardown edge */ }
  cleanupEnv()
})

/** 桩面板（真 ChatPanel 最小面：回调装配只读 `_panel` / `_agent` / `_wvReady`）。 */
function stubPanel(extra = {}) {
  const posted = []
  const p = {
    _wvReady: true, _agent: null, _susp: null, _turnControllers: [], _abortController: null,
    _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } },
    _saveLines() {},
    _publishTurnState() {},
    ...extra,
  }
  p.posted = posted
  return p
}

/** 回调装配 deps 最小面（onToolResult 读 cwd；余键为其它回调共用面）。 */
const deps = () => ({
  cwd: "/proj", p: {}, fullHistory: [], history: [], providerName: "p",
  turnSlot: {}, distillSlot: {}, autoTurn: false, askInPanel: () => {}, slotStamp: {},
})

/** webview 模块组（真 activity.js / activity-view.js / panels.js——逐测冷启复位）。 */
async function wv() {
  const state = await import("../webview/state.js")
  const activity = await import("../webview/activity.js")
  const view = await import("../webview/activity-view.js")
  const panels = await import("../webview/panels.js")
  const diag = await import("../webview/activity-diag.js")
  const env = {
    S: state.S, ctx: state.ctx, diag, ...activity, refreshBlock: view.refreshBlock,
    handleSuspensionMessage: panels.handleSuspensionMessage,
  }
  env.ctx.messagesEl.replaceChildren()
  env.ctx.activityEl.replaceChildren()
  env.S._subBlocks.clear()
  env.S._subDescShown = true
  env.S._digestBoundary = null
  env.diag.resetSubTrace()
  return env
}

const subMsg = (status, role, id, extra = {}) => ({ type: "subagent", status, role, id, ...extra })
const hdrOf = (block) => block.querySelector(".sub-hdr").textContent
/** host 载荷 → webview 承面（仅 subagent 族——其余族由他档覆盖）。 */
const feed = (env, payloads) => { for (const m of payloads) if (m.type === "subagent") env.applySubagentStatus(m) }
const subagentMsgs = (p) => p.posted.filter((m) => m.type === "subagent")

// ─── ① 宿主注记判据（X6 载荷面）─────────────────────────────

test("T-N1 注记判据（X6 载荷面）：subKey + 核标记 ⇒ done 载荷 note = CLI 同源文案；无标记 ⇒ null（不伪造）", () => {
  const p = stubPanel()
  const cbs = buildPanelCallbacks(p, deps())
  // turn-cap 锚（`spawn-child.mjs` TURN_CAP_MARK——sync 降级 partial 报告必含）
  cbs.onToolResult("subagent", `Subagent (coder) ${TURN_CAP_MARK} (12 turns) — work may be partial`, "tc1", "coder#2")
  assert.deepEqual(subagentMsgs(p), [{ type: "subagent", status: "done", role: "coder", id: 2, note: "turn cap reached — work may be partial" }],
    "turn-cap 注记逐字（判据序同 CLI tool-events.mjs:217）")
  // 停面锚（STOPPED_MARK）
  cbs.onToolResult("subagent", `Subagent (plan) ${STOPPED_MARK} — work may be partial`, "tc2", "plan#3")
  assert.equal(subagentMsgs(p).at(-1).note, "stopped by user — work may be partial", "停面注记逐字")
  // 无标记 ⇒ note null（不伪造）
  cbs.onToolResult("subagent", "all good — no marker", "tc3", "explore#4")
  assert.deepEqual(subagentMsgs(p).at(-1), { type: "subagent", status: "done", role: "explore", id: 4, note: null }, "无标记 ⇒ note null")
  // 无 subKey（async ack / 普通工具）⇒ 零注记载荷（既有冻结锚面零改）
  const n = subagentMsgs(p).length
  cbs.onToolResult("bash", `whatever ${TURN_CAP_MARK}`, "tc4")
  assert.equal(subagentMsgs(p).length, n, "无 subKey ⇒ 零 done 载荷（标记不误伤普通工具结果）")
})

// ─── ② webview 承面（X6 块头）+ 两刷新路径 ────────────────────

test("T-N2 注记承面（X6 块头）：done 冻结头渲 `— <note>`；2 s 拍体 / 覆盖式重建 / 迟到消息三径不丢", async () => {
  const env = await wv()
  const p = stubPanel()
  const cbs = buildPanelCallbacks(p, deps())
  env.applySubagentStatus(subMsg("started", "coder", 2, { pool: false, model: "m" }))
  cbs.onToolResult("subagent", `Subagent (coder) ${TURN_CAP_MARK} (12 turns) — work may be partial`, "t1", "coder#2")
  feed(env, p.posted)
  const block = env.S._subBlocks.get("sub:coder#2")
  assert.ok(block && block._subMeta.frozen, "sync 完成锚 ⇒ 块冻结（既有 settle 面零改）")
  assert.ok(hdrOf(block).includes("— turn cap reached — work may be partial"), `冻结头含注记（实到 ${JSON.stringify(hdrOf(block))}）`)
  // ① 2 s 拍体（panels._panelTimer 同点 = refreshLiveHeaders）
  env.refreshLiveHeaders()
  assert.ok(hdrOf(block).includes("— turn cap reached"), "2 s 拍体后注记仍在")
  // ② 覆盖式重建（refreshBlock——started / turn 消息对 live 块驱动的同一重建式）
  env.refreshBlock(block)
  assert.ok(hdrOf(block).includes("— turn cap reached"), "覆盖式重建后注记仍在（载体 = meta，非一次性 DOM 写）")
  // ③ 迟到消息（turn 帧——冻结守卫丢弃）零改写
  const before = hdrOf(block)
  env.applySubagentStatus(subMsg("turn", "coder", 2, { turn: 5, maxTurns: 100 }))
  assert.equal(hdrOf(block), before, "迟到 turn 帧零改写（注记不被重建吞）")
  assert.equal(block._subMeta.note, "turn cap reached — work may be partial", "载体 = meta.note 单字段")
})

test("T-N3 stopped 面零注记（CLI 标尺 · 收口轮 #134 ②）+ error 面零回归：`⟦ev⟧stopped` 不再透传原因词", async () => {
  const env = await wv()
  // 真核发射字面（async-settle.mjs:239 / subagent.mjs:364 同形）——第 4 位 = 恒定字面「stopped」，
  // 与冻结头 verb（[⏹ … · stopped 12s]）重复 ⇒ 按 CLI 标尺不入注记面（CLI `subagent-blocks.mjs:263-273`
  // 该分支只置 `stopped=true`、不置 `lastError` ⇒ 同面零注记）。
  const p = stubPanel()
  env.applySubagentStatus(subMsg("started", "eng-coder", 5, { pool: true, model: "glm" }))
  assert.equal(relaySubagentEventToken(p, `eng-coder#5/⟦ev⟧stopped${RS}0${RS}0${RS}stopped${RS}`), true)
  assert.deepEqual(subagentMsgs(p), [{ type: "subagent", role: "eng-coder", id: 5, status: "cancelled" }],
    "stopped 载荷不携 `note` 字段（不传——不伪造）")
  feed(env, p.posted)
  const block = env.S._subBlocks.get("sub:eng-coder#5")
  assert.equal(block._subMeta.note, null, "该路径不写 `meta.note`（零注记）")
  assert.ok(hdrOf(block).includes("stopped"), `冻结头 verb 仍在（去的是冗余注记——实到 ${JSON.stringify(hdrOf(block))}）`)
  assert.ok(!hdrOf(block).includes("—"), `冻结头零注记（重复词已去——实到 ${JSON.stringify(hdrOf(block))}）`)
  // 刷新路径复核（覆盖式重建；2 s 拍体对冻结块本就 no-op）：注记不复活
  env.refreshBlock(block)
  assert.equal(block._subMeta.note, null, "覆盖式重建后仍零注记")
  assert.ok(!hdrOf(block).includes("—"), "覆盖式重建后仍无注记尾接")
  // 空位变体（防御形）⇒ 与有值形归一（零注记——无幻影断句）
  const p2 = stubPanel()
  env.applySubagentStatus(subMsg("started", "explore", 6, { pool: true }))
  relaySubagentEventToken(p2, `explore#6/⟦ev⟧stopped${RS}${RS}${RS}${RS}`)
  assert.deepEqual(subagentMsgs(p2), [{ type: "subagent", role: "explore", id: 6, status: "cancelled" }], "空位变体同形（两形归一）")
  feed(env, p2.posted)
  const b2 = env.S._subBlocks.get("sub:explore#6")
  assert.equal(b2._subMeta.note, null, "空位 ⇒ note null")
  assert.ok(!hdrOf(b2).includes("—"), `零注记（实到 ${JSON.stringify(hdrOf(b2))}）`)
  // error 面（既有 meta.error 载体）零回归
  env.applySubagentStatus(subMsg("started", "plan", 7, { pool: true }))
  env.applySubagentStatus(subMsg("error", "plan", 7, { error: "boom" }))
  assert.ok(hdrOf(env.S._subBlocks.get("sub:plan#7")).includes("— boom"), "error 注记（meta.error）零回归")
})

// ─── ③ X11 interrupted（承面 + 宿主真值源）────────────────────

test("T-N4 interrupted 注记（X11 承面）：freeze + interrupted ⇒ 区全体块头 `— interrupted`；缺省零注记；已在流块不动", async () => {
  const env = await wv()
  // 已在流块（先正常收尾归档一块——会话历史）
  env.applySubagentStatus(subMsg("started", "plan", 9, { pool: true }))
  env.applySubagentStatus(subMsg("done", "plan", 9))
  const archived = env.S._subBlocks.get("sub:plan#9")
  const archivedHdr = hdrOf(archived)
  assert.equal(archived.parentNode, env.ctx.messagesEl, "前置：归档块在流内")
  // 区两块 live（async / sync 各一）
  env.applySubagentStatus(subMsg("started", "explore", 1, { pool: true, model: "m1" }))
  env.applySubagentStatus(subMsg("started", "eng-coder", 2, { pool: false }))
  const live = [...env.S._subBlocks.values()].filter((b) => b !== archived)
  assert.equal(live.length, 2, "前置：区内两块 live")
  env.handleSuspensionMessage({ type: "suspension", active: false, freeze: true, interrupted: true })
  for (const b of live) {
    assert.ok(hdrOf(b).includes("— interrupted"), `块头含 interrupted 注记（${b.dataset.subname}——实到 ${JSON.stringify(hdrOf(b))}）`)
    assert.equal(b.parentNode, env.ctx.messagesEl, "冻结 + 归档落流（C-8 语义不变）")
  }
  assert.equal(hdrOf(archived), archivedHdr, "已在流块不动（不回头补注记）")
  // 自然退出（interrupted 缺省）⇒ 零注记（不伪造）
  env.applySubagentStatus(subMsg("started", "explore", 3, { pool: true }))
  const b3 = env.S._subBlocks.get("sub:explore#3")
  env.handleSuspensionMessage({ type: "suspension", active: false, freeze: true })
  assert.ok(!hdrOf(b3).includes("interrupted"), `自然退出零注记（实到 ${JSON.stringify(hdrOf(b3))}）`)
})

test("T-N5 X11 宿主真值源：会话中止 ⇒ suspension 终态载荷 interrupted:true；自然退出 ⇒ false", async () => {
  // 中止路径：susp.abort 已 abort ⇒ 驱动不进入循环，finally 判 aborted
  const p = stubPanel()
  const ac = new AbortController()
  ac.abort()
  p._abortController = ac
  const history = { _suspended: false, _pendingAsyncResults: [], _asyncSubagents: new Map(), _asyncAdvisors: new Map() }
  await suspensionSession(p, { lines: { history, fullHistory: [] }, runTurn: async () => {}, turnSlot: {}, distillSlot: {} })
  const endMsg = p.posted.filter((m) => m.type === "suspension").at(-1)
  assert.deepEqual(endMsg, { type: "suspension", active: false, freeze: true, interrupted: true }, "中止路径 ⇒ interrupted:true（宿主 abort 旗标可分辨）")
  // 自然退出（池空）：abort 面未触发 ⇒ interrupted:false（不伪造）
  const q = stubPanel()
  const h2 = { _suspended: false, _pendingAsyncResults: [], _asyncSubagents: new Map(), _asyncAdvisors: new Map() }
  await suspensionSession(q, { lines: { history: h2, fullHistory: [] }, runTurn: async () => {}, turnSlot: {}, distillSlot: {} })
  assert.deepEqual(q.posted.filter((m) => m.type === "suspension").at(-1),
    { type: "suspension", active: false, freeze: true, interrupted: false }, "自然退出 ⇒ interrupted:false")
})

// ─── 接线机检 ─────────────────────────────

test("T-N6 终态补桩携注记（never-born / tombstone 防御面）：done + note 无块条目 ⇒ 桩头渲 `— <note>`", async () => {
  const env = await wv()
  // 无前置 started（never-born 面）——终态直到 ⇒ 补桩（立即折叠 + 立即归档）
  env.applySubagentStatus(subMsg("done", "eng-coder", 8, { note: "turn cap reached — work may be partial" }))
  const stub = env.S._subBlocks.get("sub:eng-coder#8")
  assert.ok(stub && stub._subMeta.frozen, "补桩（冻结 + 归档）")
  assert.equal(stub._subMeta.note, "turn cap reached — work may be partial", "注记随桩（与 error / turn 同规）")
  assert.ok(hdrOf(stub).includes("— turn cap reached"), `桩头含注记（实到 ${JSON.stringify(hdrOf(stub))}）`)
})

test("T-N7 接线机检：本档登记 test/files.mjs", () => {
  assert.ok(files.includes("test/subagent-note-parity.test.mjs"), "本档已登记 test/files.mjs")
})
