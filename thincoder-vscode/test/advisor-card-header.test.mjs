/**
 * advisor-card-header.test.mjs — X2 机器验收（端差·显示面消差批 · 批档 §2.2 X2 + §2.10.6 #8）。
 *
 * 缺陷：VSC 评审卡头与状态行都不显**轮次 / 生效模型**（CLI 两处都显）。
 * 判据权威：`docs/batches/2026-09-20-display-parity-batch.md` §2.2 X2（四要素）；CLI 标尺 =
 * `thincoder-cli/src/tui/tool-events.mjs:145`（状态行 `advisor review (round N · model)`）
 * + `:152`（卡头 `roundTag` = ` (round N · model)`）+ `:131`（`resolveAdvisorProvider(agent).model`，
 * try/catch 降 null——本端同函数同形）。
 *
 * 组①（宿主 · 无 DOM）：真 `buildPanelCallbacks` `onToolCall` —— advisor 携 `round`/`model`；
 *   非 advisor 零字段；无 agent / 解析失败 ⇒ 降级形（不抛）。组②（webview · happy-dom 真 chat.js）：
 *   卡头 `<span class="tool-call-round">` 字面 + 状态行字面逐字 = CLI；无 round 载荷逐字节同修前；
 *   2 s 拍体复绘字面不变。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { buildPanelCallbacks } from "../src/extension/panel-callbacks.mjs"
import { advisorRoundTag } from "../webview/ui.js"
import { setupWebview, installFullIndexFixture } from "./helpers/webview-env.mjs"

// ─── 组① 宿主：载荷字段（真回调装配）───────────────────────────────────────

function stubPanel(agent) {
  const posted = []
  const panel = {
    _agent: agent,
    _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } },
  }
  return { panel, posted }
}

const toolCall = (posted) => posted.find((m) => m.type === "toolCall")

test("X2-1 advisor ⇒ 载荷携 round（`_advisorRound + 1`）与生效模型（核 `resolveAdvisorProvider` 同源）", () => {
  const { panel, posted } = stubPanel({ _advisorRound: 1, provider: { model: "glm-5.2" } })
  buildPanelCallbacks(panel, {}).onToolCall("advisor", { type: "design" }, "c1")
  const p = toolCall(posted)
  assert.equal(p.round, 2, "轮次 = `_advisorRound + 1`（CLI :145/:152 同式）")
  assert.equal(p.model, "glm-5.2", "模型 = 生效 provider 模型（主 agent 兜底路）")
})

test("X2-2 advisor 渠道独立模型优先（判据 = 核 resolver ⇒ advisor 生效模型非主模型）", () => {
  const { panel, posted } = stubPanel({
    _advisorRound: 0,
    provider: { model: "k3" },
    providers: [{ name: "zhipu", model: "glm-5" }],
    config: { advisor: { provider: "zhipu", model: "glm-5.3" } },
  })
  buildPanelCallbacks(panel, {}).onToolCall("advisor", { type: "code" }, "c2")
  const p = toolCall(posted)
  assert.equal(p.round, 1, "轮次首轮 = 1")
  assert.equal(p.model, "glm-5.3", "advisor 渠道模型（非主模型 k3）")
})

test("X2-3 非 advisor 零字段（零改面）：载荷不含 round / model 键", () => {
  const { panel, posted } = stubPanel({ _advisorRound: 3, provider: { model: "glm-5.2" } })
  buildPanelCallbacks(panel, {}).onToolCall("read", { path: "x.mjs" }, "c3")
  const p = toolCall(posted)
  assert.equal("round" in p, false, "非 advisor 不携 round")
  assert.equal("model" in p, false, "非 advisor 不携 model")
})

test("X2-4 降级形（边界）：无 agent ⇒ round 1 + model null（try/catch 不抛）", () => {
  const { panel, posted } = stubPanel(null)
  buildPanelCallbacks(panel, {}).onToolCall("advisor", { type: "design" }, "c4")
  const p = toolCall(posted)
  assert.equal(p.round, 1, "无 agent ⇒ 轮次按 0 计（+1）")
  assert.equal(p.model, null, "模型降 null（不抛——CLI :131 同形）")
})

test("X2-5 `advisorRoundTag` 三态（卡头/状态行共用单源）", () => {
  assert.equal(advisorRoundTag(2, "glm-5.2"), "(round 2 · glm-5.2)", "满载形（CLI roundTag 字面）")
  assert.equal(advisorRoundTag(2, null), "(round 2)", "无模型 ⇒ 降级形（不显 null）")
  assert.equal(advisorRoundTag(null, "glm-5.2"), "", "无轮次 ⇒ 零标签（零改面）")
})

// ─── 组② webview：卡头 + 状态行（真 chat.js）────────────────────────────────

let cleanupEnv

before(() => {
  const env = setupWebview()
  cleanupEnv = env.cleanup
  installFullIndexFixture()
})

after(() => {
  try { window.dispatchEvent(new window.Event("unload")) } catch { /* happy-dom teardown edge */ }
  cleanupEnv()
})

const send = (data) => window.dispatchEvent(new window.MessageEvent("message", { data }))
const line = () => document.getElementById("status-line").innerHTML

async function loadChat() {
  await import("../webview/chat.js")
  const state = await import("../webview/state.js")
  const statusBar = await import("../webview/status-bar.js")
  const i18n = await import("../webview/i18n.js")
  return { S: state.S, renderStatusBar: statusBar.renderStatusBar, t: i18n.t }
}

test("X2-6 卡头 + 状态行：advisor 载荷 ⇒ `(round N · model)` 两处同字面（2 s 拍体不变）", async () => {
  const { S, renderStatusBar } = await loadChat()
  send({ type: "clearMessages" })
  send({ type: "toolCall", name: "advisor", args: '{"type":"design"}', id: "a1", round: 2, model: "glm-5.2" })
  const card = document.querySelector('.tool-call[data-tool-id="a1"]')
  assert.ok(card != null, "卡已建（前置）")
  assert.equal(card.querySelector(".tool-call-round")?.textContent, "(round 2 · glm-5.2)", "卡头轮次标签字面")
  assert.ok(line().includes("advisor review (round 2 · glm-5.2)"), `状态行 = CLI :145 逐字（实 ${line()}）`)
  // 刷新路径：状态行单源 `S._currentTool`（消息驱动 + 2 s 拍体复绘同值）
  const driven = line()
  renderStatusBar()
  assert.equal(line(), driven, "拍体复绘字面不变")
  assert.equal(S._currentTool, "advisor review (round 2 · glm-5.2)")
})

test("X2-7 降级形：`model: null` ⇒ `(round 2)`（不显 null）+ 状态行同形", async () => {
  await loadChat()
  send({ type: "clearMessages" })
  send({ type: "toolCall", name: "advisor", args: "{}", id: "a2", round: 2, model: null })
  const card = document.querySelector('.tool-call[data-tool-id="a2"]')
  assert.equal(card.querySelector(".tool-call-round")?.textContent, "(round 2)", "降级形")
  assert.ok(line().includes("advisor review (round 2)"), "状态行降级形")
  assert.ok(!line().includes("null"), "不显 `null`")
})

test("X2-8 非 advisor 载荷逐字节同修前：无轮次 span ∧ 卡头子元素序列 / 文本与旧模板等值", async () => {
  const { S, t } = await loadChat()
  send({ type: "clearMessages" })
  send({ type: "toolCall", name: "read", args: '{"path":"x.mjs"}', id: "r1" })
  const card = document.querySelector('.tool-call[data-tool-id="r1"]')
  const h = card.querySelector(".tool-call-header")
  assert.equal(card.querySelector(".tool-call-round"), null, "零轮次 span（零改面）")
  assert.deepEqual(
    [...h.children].map((el) => el.className),
    ["tool-call-icon", "tool-call-name", "tool-call-args", "tool-call-status"],
    "卡头子元素序列逐项同修前（无插入 / 无重排）",
  )
  assert.equal(h.textContent, `read{"path":"x.mjs"}${t("tool.running")}`, "卡头文本 = 旧模板拼接（名 + args slice + 状态词）")
  assert.equal(S._currentTool, "read", "状态行载体 = 工具名（非 advisor review 形）")
  assert.ok(line().includes("Tool: read"), `状态行渲染 = 工具名（实 ${line()}）`)
  assert.ok(!line().includes("advisor review"), "零误置")
})
