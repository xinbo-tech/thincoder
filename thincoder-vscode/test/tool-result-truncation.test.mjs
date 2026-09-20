/**
 * tool-result-truncation.test.mjs — X5 机器验收（端差·显示面消差批 · 批档 §2.2 X5 + §2.10.8 #13）。
 *
 * 缺陷：>64KB 静默截断——切片点在宿主（`panel-callbacks.mjs` `Text.slice(0, 64 * 1024)`），webview
 * 只收到 64K 文本 ⇒ `lib.js capText` 的 `t.length > max` 不触发 ⇒ 恰 64K 与超出**皆零提示**。
 * 判据权威：`docs/batches/2026-09-20-display-parity-batch.md` §2.2 X5（四要素）；
 * CLI 标尺 = `thincoder-cli/src/tui/tool-display.mjs:82-93`（行维 + 字符维双层可见标记）。
 *
 * 三层断言：
 *  ① 宿主：载荷携事实旗标 `truncated`（65K ⇒ true；恰 64K ⇒ false；`0` / `null` falsy 记录形）；
 *  ② 活卡：旗标驱动标记（正文尾 + 摘要尾）——**不由长度比较驱动**（`<= max` 边界洞不复辟）；
 *  ③ 刷新路径：恢复卡（`buildFinishedToolCard`）同标记字面——**旗标优先**（宿主传输切片点
 *    `panel-session.mjs sendHistoryPage` 立 `resultTruncated`）+ 长度维回落（旧载荷 / 夹具直喂）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { buildPanelCallbacks } from "../src/extension/panel-callbacks.mjs"
import { setupWebview, installChatFixture } from "./helpers/webview-env.mjs"

const MAX = 64 * 1024
/** 65K+ 结果（行维可读——便于断言正文尾标记）。 */
const BIG = ("a".repeat(99) + "\n").repeat(700) // 70_000 字符
const EXACT = "b".repeat(MAX)

function stubPanel() {
  const posted = []
  const panel = { _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } } }
  return { panel, posted }
}

const toolResult = (posted) => posted.find((m) => m.type === "toolResult")

// ─── ① 宿主：切片点事实旗标 ────────────────────────────────────────────────

test("X5-1 宿主 65K+：`truncated === true` ∧ 载荷文本 = 首 64K（切片语义零改）", () => {
  const { panel, posted } = stubPanel()
  buildPanelCallbacks(panel, { cwd: "/proj" }).onToolResult("bash", BIG, "t1")
  const p = toolResult(posted)
  assert.equal(p.truncated, true, "事实旗标 = true（修前 undefined ⇒ 静默）")
  assert.equal(p.text.length, MAX, "切片长度零改（64K 额度不动）")
  assert.equal(p.text, BIG.slice(0, MAX), "取首 64K 逐字")
  assert.deepEqual(p.links, [], "linkify 面零改（同切片文本）")
})

test("X5-2 宿主恰 64K（边界）：`truncated === false` ∧ 文本逐字完整", () => {
  const { panel, posted } = stubPanel()
  buildPanelCallbacks(panel, { cwd: "/proj" }).onToolResult("bash", EXACT, "t2")
  const p = toolResult(posted)
  assert.equal(p.truncated, false, "恰 64K ⇒ 未截断（`<= max` 边界洞不复辟）")
  assert.equal(p.text, EXACT, "文本逐字")
})

test("X5-3 falsy 边界（§2.10.8 #13 记录形）：`0` ⇒ `\"0\"` ∧ `truncated === false`；null ⇒ 空串", () => {
  const { panel, posted } = stubPanel()
  const cbs = buildPanelCallbacks(panel, { cwd: "/proj" })
  cbs.onToolResult("bash", 0, "t3")
  cbs.onToolResult("bash", null, "t4")
  const [zero, nul] = posted.filter((m) => m.type === "toolResult")
  assert.equal(zero.text, "0", "falsy 非串不静默丢弃（`String(r ?? \"\")`）")
  assert.equal(zero.truncated, false)
  assert.equal(nul.text, "", "null ⇒ 空串（与修前同形）")
  assert.equal(nul.truncated, false)
})

// ─── ② / ③ webview：活卡 + 恢复卡 ──────────────────────────────────────────

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

async function loadWebview() {
  const state = await import("../webview/state.js")
  const ui = await import("../webview/ui.js")
  const restore = await import("../webview/tool-card-restore.mjs")
  const i18n = await import("../webview/i18n.js")
  return { ctx: state.ctx, t: i18n.t, ...ui, ...restore }
}

/** 活卡（真 addTool → finishTool 路径）。 */
function liveCard(wv, text, truncated) {
  const { ctx } = wv
  ctx.messagesEl.replaceChildren()
  ctx.currentBlock = null
  ctx.currentTools = []
  ctx._toolRefs = {}
  ctx.assistantLabeled = true
  wv.addTool(ctx, "bash", '{"command":"x"}', "t1")
  wv.finishTool(ctx, "bash", "t1", text, [], truncated)
  const card = ctx.messagesEl.querySelector(".tool-call")
  assert.ok(card != null, "工具卡已建（前置）")
  return {
    body: card.querySelector(".tool-call-body").textContent,
    summary: card.querySelector(".tool-call-summary")?.textContent ?? null,
  }
}

test("X5-4 活卡（先红）：旗标 true ⇒ 正文尾 + 摘要尾双标记（`tool.truncated` 逐字）", async () => {
  const wv = await loadWebview()
  const marker = wv.t("tool.truncated")
  const c = liveCard(wv, EXACT, true)
  assert.ok(c.body.endsWith(marker), `正文尾标记（实 …${c.body.slice(-24)}）`)
  assert.ok(c.summary?.includes(marker), `摘要位尾部标注（实 ${c.summary}）`)
  assert.ok(c.body.startsWith(EXACT), "正文 = 切片文本（额度零改）")
})

test("X5-5 活卡恰 64K（边界）：旗标 false ⇒ 零标记（两处皆无）", async () => {
  const wv = await loadWebview()
  const marker = wv.t("tool.truncated")
  const c = liveCard(wv, EXACT, false)
  assert.ok(!c.body.includes(marker), "正文零标记")
  assert.ok(!(c.summary ?? "").includes(marker), "摘要零标记")
})

test("X5-6 旗标缺省（零回归面）：旧载荷（无 `truncated`）⇒ 零标记 ∧ 摘要照旧", async () => {
  const wv = await loadWebview()
  const marker = wv.t("tool.truncated")
  const c = liveCard(wv, "[stdout]:\nok\n\n(exit code 0)", undefined)
  assert.ok(!c.body.includes(marker), "零标记")
  assert.equal(c.summary, "→ bash: ok", "摘要逐字同修后正常面")
})

test("X5-7 刷新路径（真传输链）：发送面切片点立旗 ⇒ 恢复卡出同字面标记（生产可达）", async () => {
  const wv = await loadWebview()
  const marker = wv.t("tool.truncated")
  // 真产者：宿主 `sendHistoryPage`（transport 64K 切片点——`panel-session.mjs`）
  const { sendHistoryPage } = await import("../src/extension/panel-session.mjs")
  const posted = []
  const panel = { _panel: { webview: { postMessage: (m) => posted.push(m) } } }
  sendHistoryPage(panel, [{ kind: "assistant", idx: 1, text: "x", tools: [{ name: "bash", args: '{"command":"x"}', result: BIG }] }], false, false)
  const page = posted.find((m) => m.type === "historyPage")
  assert.ok(page != null, "historyPage 载荷已发（前置）")
  assert.equal(page.messages[0].tools[0].resultTruncated, true, "切片点立事实旗标（>64K）")
  assert.equal(page.messages[0].tools[0].result.length, MAX, "切片长度零改（64K 额度不动）")
  // 恢复卡真渲染路径：historyPage → assistant 帧 → 嵌套工具卡
  const frame = wv.buildAssistantRestore(wv.ctx, page.messages[0])
  const card = frame.querySelector(".tool-call")
  assert.ok(card != null, "恢复卡已建（前置）")
  assert.ok(card.querySelector(".tool-call-body").textContent.includes(marker), "恢复卡正文含同字面标记（两路径皆含）")
  // 未超额度 ⇒ 零标记；无旗标旧载荷 ⇒ 长度维回落仍出标记（登记面）
  const short = wv.buildFinishedToolCard({ name: "bash", args: "{}", result: "small" })
  assert.ok(!short.querySelector(".tool-call-body").textContent.includes(marker), "未超额度 ⇒ 零标记")
  const legacy = wv.buildFinishedToolCard({ name: "bash", args: "{}", result: BIG })
  assert.ok(legacy.querySelector(".tool-call-body").textContent.includes(marker), "无旗标旧载荷 ⇒ 长度维回落仍出标记")
})
