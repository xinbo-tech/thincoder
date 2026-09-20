/**
 * webview-tool-interrupted.test.mjs — M1 机器验收（端差·显示面消差批 · 批档 §2.1 M1 + §2.10.5 #6）。
 *
 * 缺陷：VSC 无回合尾清扫 ⇒ 中止后工具卡永停「执行中…」（CLI 有 `sweepToolBlocks`）。
 * 判据权威：`docs/batches/2026-09-20-display-parity-batch.md` §2.1 M1（四要素）+ §2.10.5(#6)
 * （清扫**恒执行** = CLI 回合 `finally` 对位：complete / aborted 两路径同规）；CLI 标尺 =
 * `thincoder-cli/src/tui/tool-display.mjs:60-72`（`b.done = true` + `summary = "(interrupted)"`），
 * 调用点 = `agent-turn.mjs:265`。
 *
 * 手法（happy-dom——`webview-tool-failure-signal.test.mjs` 同族）：真 `ui.js` 活卡路径
 * （`addTool` / `finishTool`）+ 真 `streaming.js finish()` + 真 `activity.js`
 * （`refreshLiveHeaders` = 2 s 拍体 / `resetActivity`）。
 * 刷新两路径断言（承 §1.3 ③）：工具卡在消息区、不在活动区重建链上 ⇒ 清扫后两刷新路径都不改该卡。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { setupWebview, installChatFixture } from "./helpers/webview-env.mjs"

let cleanupEnv

before(() => {
  const env = setupWebview()
  cleanupEnv = env.cleanup
  installChatFixture()
})

after(() => {
  try { window.dispatchEvent(new window.Event("unload")) } catch { /* happy-dom teardown edge */ }
  cleanupEnv()
})

/** 真模块直驱（模块缓存——每文件一次；须在 setupWebview 之后）。 */
async function loadWebview() {
  const state = await import("../webview/state.js")
  const ui = await import("../webview/ui.js")
  const streaming = await import("../webview/streaming.js")
  const activity = await import("../webview/activity.js")
  const i18n = await import("../webview/i18n.js")
  return { ctx: state.ctx, S: state.S, t: i18n.t, ...ui, ...streaming, ...activity }
}

/** 未结算活卡（`addTool` 后未收 `toolResult`——真路径）。 */
function unsettledCard(wv, id = "t1", name = "bash") {
  const { ctx } = wv
  ctx.messagesEl.replaceChildren()
  ctx.currentBlock = null
  ctx.currentTools = []
  ctx._toolRefs = {}
  ctx.assistantLabeled = true
  wv.addTool(ctx, name, '{"command":"sleep 5"}', id)
  const card = ctx.messagesEl.querySelector(`.tool-call[data-tool-id="${id}"]`)
  assert.ok(card != null, "活卡已建（前置）") // 布尔断言：DOM 节点不入断言载荷
  return {
    card,
    status: () => card.querySelector(".tool-call-status").textContent,
    color: () => card.querySelector(".tool-call-status").style.color,
    summary: () => card.querySelector(".tool-call-summary")?.textContent ?? null,
  }
}

// ─── M1-1 中止路径（正常 · 先红）────────────────────────────────────────────

test("M1-1 中止路径：`finish(true)` ⇒ 未结算卡清扫（interrupted 词 + `→ (interrupted)`，不套错误色）", async () => {
  const wv = await loadWebview()
  const c = unsettledCard(wv)
  assert.equal(c.status(), wv.t("tool.running"), "前置：卡处 tool.running（先红点 = 修前永停此值）")
  wv.finish(true)
  assert.equal(c.status(), wv.t("tool.interrupted"), "清扫后状态词 = tool.interrupted")
  assert.equal(c.summary(), "→ (interrupted)", "摘要 = `→ (interrupted)`（CLI sweepToolBlocks 同形）")
  assert.equal(c.color(), "", "不套错误色（CLI interrupted 为独立旗标，非 error 面）")
})

// ─── M1-2 清扫恒执行（§2.10.5 #6——正常收尾路径同清扫）──────────────────────

test("M1-2 正常路径：`finish(false)` 同样清扫未结算卡（清扫无条件 = CLI 回合 finally 对位）", async () => {
  const wv = await loadWebview()
  const c = unsettledCard(wv, "t2")
  wv.finish(false)
  assert.equal(c.status(), wv.t("tool.interrupted"), "正常收尾路径同清扫（不做时序假设）")
  assert.equal(c.summary(), "→ (interrupted)")
})

// ─── M1-3 已结算卡零改写（回归锚）───────────────────────────────────────────

test("M1-3 已结算卡零改写：`finishTool` 之后清扫 ⇒ 状态词与摘要逐字节同修前", async () => {
  const wv = await loadWebview()
  const c = unsettledCard(wv, "t3")
  wv.finishTool(wv.ctx, "bash", "t3", "[stdout]:\nok\n\n(exit code 0)", [])
  const settled = c.status()
  const settledSummary = c.summary()
  assert.ok(settled.startsWith(wv.t("tool.done")), `前置：已结算（实 ${settled}）`)
  wv.finish(true)
  assert.equal(c.status(), settled, "已结算卡零改写（`done` 唯一写点 = finishToolCard）")
  assert.equal(c.summary(), settledSummary, "摘要零改写")
})

// ─── M1-4 跨块同清扫 + 刷新两路径不复活（承 §1.3 ③）─────────────────────────

test("M1-4 跨块全清扫 + 刷新两路径不复活：同回合跨块卡全在表内；2 s 拍体 / resetActivity 后仍 interrupted", async () => {
  const wv = await loadWebview()
  const first = unsettledCard(wv, "t4a")
  wv.newBlock(wv.ctx) // 同回合第二块（跨块卡片同表——`_toolRefs` 由 `finish` 复位；会话清屏不涉该表）
  wv.addTool(wv.ctx, "read", '{"path":"a.mjs"}', "t4b")
  const second = wv.ctx.messagesEl.querySelector('.tool-call[data-tool-id="t4b"]')
  assert.ok(second != null, "第二块卡已建（前置）")
  wv.finish(true)
  for (const [label, card] of [["首块", first.card], ["次块", second]]) {
    assert.equal(card.querySelector(".tool-call-status").textContent, wv.t("tool.interrupted"), `${label}卡已清扫`)
    assert.equal(card.querySelector(".tool-call-summary")?.textContent, "→ (interrupted)", `${label}卡摘要`)
  }
  // 刷新路径①：2 s 拍体（`panels.js _panelTimer` → refreshLiveHeaders）——只刷活动区 live 块
  wv.refreshLiveHeaders()
  // 刷新路径②：活动区复位（resetActivity 只清区子树）——消息区卡片不复活为 running
  wv.resetActivity()
  for (const [label, card] of [["首块", first.card], ["次块", second]]) {
    assert.equal(card.querySelector(".tool-call-status").textContent, wv.t("tool.interrupted"), `${label}卡刷新后不变`)
  }
})
