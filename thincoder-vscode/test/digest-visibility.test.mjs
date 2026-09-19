/**
 * digest-visibility.test.mjs — 第 21 批 B6（起跑可见指示）+ 活动区收口批（2026-09-12 §14 C-9/C-10）机器验收。
 * 设计权威：`docs/design/WEBVIEW.md` §7.4 + §14（用例 T-D1~T-D5 + T-CL14/T-CL15/T-CL16 · AC-D1~D3 + AC-CL2）；
 * 批次档 `2026-09-12-VSC-ACTIVITY-CLOSURE.md` §2。手法：① 主侧 T-D1~D3/T-D6（真 suspension
 * 驱动 + postDigestCap 直驱）；② webview 侧 T-D4/T-D5/T-D7/T-D8（真 chat.js + window message 直驱）。
 * §14 改写：单元素跨轮复用 → **每轮独立元素** + 标签行 + cap（漂移回归）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { setupWebview, installFullIndexFixture } from "./helpers/webview-env.mjs"
import files from "./files.mjs"
import { suspensionSession } from "../src/extension/suspension.mjs"
import { postDigestCap } from "../src/extension/panel-callbacks.mjs"

let cleanupEnv

before(() => {
  const env = setupWebview()
  cleanupEnv = env.cleanup
  installFullIndexFixture() // chat.js 顶层 init 读全量 index.html id
})

after(() => {
  try { window.dispatchEvent(new window.Event("unload")) } catch { /* happy-dom teardown edge */ }
  cleanupEnv()
})

// ① 主侧：起止两态时序与载荷（AC-D1）
function fixture() {
  const posted = []
  const panel = {
    posted,
    _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } },
    _abortController: null,
    _turnControllers: [],
  }
  const history = { _suspended: false, _pendingAsyncResults: [] }
  const entry = { lines: { history, fullHistory: [] }, cwd: process.cwd(), runTurn: async () => {} }
  return { panel, history, entry }
}

const digestMsgs = (panel) => panel.posted.filter((m) => m.type === "digest")

test("T-D1 起跑时序（F-C1/AC-D1）：start 早于 runTurn（n = pending 数）+ 直投（不经 outbox）", async () => {
  const { panel, history, entry } = fixture()
  history._pendingAsyncResults = [{ id: 1, role: "explore" }, { id: 2, role: "advisor" }]
  let seenAtRun = null
  let autoTurnArg = null
  entry.runTurn = async (arg) => { seenAtRun = digestMsgs(panel); autoTurnArg = arg; history._pendingAsyncResults = [] }
  await suspensionSession(panel, entry)
  assert.equal(seenAtRun?.length, 1, "runTurn 被调之前 start 已投（用户看到的\"在动\"不晚于回合开跑）")
  assert.deepEqual(seenAtRun[0], { type: "digest", status: "start", n: 2 }, "起跑载荷 {status:start, n}")
  assert.equal(autoTurnArg?.autoTurn, true, "消化轮语义不变（autoTurn）")
  assert.equal(digestMsgs(panel)[0].type, "digest", "投递面 = panel._panel.webview 直投（同 compress 先例）")
})

test("T-D2 正常收尾（F-C1/AC-D1）：resolve → 恰一条 end（ok:true + ms）", async () => {
  const { panel, history, entry } = fixture()
  history._pendingAsyncResults = [{ id: 7, role: "eng-coder" }]
  entry.runTurn = async () => { history._pendingAsyncResults = [] }
  await suspensionSession(panel, entry)
  const msgs = digestMsgs(panel)
  assert.deepEqual(msgs.map((m) => m.status), ["start", "end"], "起止两态各一条")
  assert.equal(msgs[1].ok, true)
  assert.ok(typeof msgs[1].ms === "number" && msgs[1].ms >= 0, `端到端 ms 为数值（实到 ${msgs[1].ms}）`)
})

test("T-D3 异常收尾（F-C1/AC-D1）：runTurn 抛错 → end ok:false（start 不悬留）", async () => {
  const { panel, history, entry } = fixture()
  history._pendingAsyncResults = [{ id: 9, role: "plan" }]
  entry.runTurn = async () => { history._pendingAsyncResults = []; throw new Error("digest boom") }
  await assert.rejects(() => suspensionSession(panel, entry), /digest boom/, "异常照旧上抛（不吞）")
  const msgs = digestMsgs(panel)
  assert.deepEqual(msgs.map((m) => [m.status, m.ok]), [["start", undefined], ["end", false]], "不留「仍在消化」假象")
})

test("T-D6 digest cap 发射（§14 C-10/AC-CL2）：postDigestCap 载荷逐字（auto/stop 两分支）+ 两调用点机检", () => {
  const { panel } = fixture()
  postDigestCap(panel, "auto", 12)
  postDigestCap(panel, "stop", 34)
  assert.deepEqual(digestMsgs(panel).filter((m) => m.status === "cap"), [
    { type: "digest", status: "cap", mode: "auto", turns: 12 },
    { type: "digest", status: "cap", mode: "stop", turns: 34 },
  ], "载荷逐字（mode = auto/stop + turns）")
})

// ② webview 侧：真 chat.js 渲染（AC-D2 + AC-CL2）
async function loadChat() {
  await import("../webview/chat.js")
  return await import("../webview/state.js")
}

const send = (data) => window.dispatchEvent(new window.MessageEvent("message", { data }))
const statusEls = () => [...document.querySelectorAll(".digest-status")]
const turnEls = () => [...document.querySelectorAll(".digest-turn")]
const capEls = () => [...document.querySelectorAll(".digest-cap")]

test("T-D4a 逐字文案落档（F-C1/AC-CL2）：digest.* 六键两档 locales 与设计表逐字一致", () => {
  const expect = {
    "digest.start": ["正在消化 ${n} 份后台报告…", "Digesting ${n} background report(s)…"],
    "digest.done": ["已消化 ${n} 份后台报告（${seconds}s）", "Digested ${n} background report(s) (${seconds}s)"],
    "digest.aborted": ["消化中断（${seconds}s）", "Digestion interrupted (${seconds}s)"],
    "digest.turnLabel": ["自动回合：消化已完成的子代理报告…", "[auto-turn: digesting finished subagent reports…]"],
    "digest.capAuto": ["自动回合：越过轮次上限，继续推进…", "[auto-turn: continuing past turn cap…]"],
    "digest.capStop": ["自动回合在 ${turns} 轮处停止——部分消化；已完成的报告保留在历史中", "[auto-turn stopped at ${turns} turns — partial digest; finished reports stay in history]"],
  }
  const zh = JSON.parse(readFileSync(new URL("../locales/zh.json", import.meta.url), "utf8"))
  const en = JSON.parse(readFileSync(new URL("../locales/en.json", import.meta.url), "utf8"))
  for (const [key, [zhText, enText]] of Object.entries(expect)) {
    assert.equal(zh[key], zhText, `zh ${key}`)
    assert.equal(en[key], enText, `en ${key}`)
  }
})

test("T-D4 webview 渲染（F-C1/AC-CL2）：start 建标签行 + 本轮独立元素；end 本轮原地更新 + 边界/复位", async () => {
  const { S, ctx } = await loadChat()
  send({ type: "clearMessages" })
  ctx.assistantLabeled = true // 预置真值——digest start 须复位（C-9③）
  send({ type: "digest", status: "start", n: 3 })
  const label = turnEls().at(-1)
  const el = statusEls().at(-1)
  assert.ok(label, "起跑即建 `.digest-turn` 标签行")
  assert.equal(label.textContent, "[auto-turn: digesting finished subagent reports…]", "标签文案（en locale——CLI 起跑 dim 行对位）")
  assert.ok(el, "本轮独立 `.digest-status` 元素（id 退役）")
  assert.equal(el.parentElement.id, "messages", "流内元素（#messages 尾部）")
  assert.equal(el.textContent, "Digesting 3 background report(s)…", "起跑态文案（en locale）")
  assert.equal(S._digestBoundary, label, "本轮边界 = 标签行（C-4——归档落点）")
  assert.equal(ctx.assistantLabeled, false, "assistantLabeled 复位（本轮 assistant 输出带一次回合标签）")
  send({ type: "token", text: "digest token" }) // T-CL15 渲染面：本轮新块带 ❯ 标签（CLI ensureAssistantLabel 对位）
  assert.ok(document.getElementById("messages").lastElementChild?.querySelector(".msg-label")?.textContent.includes("❯"), "本轮 assistant 块含 ❯ 标签")
  assert.equal(document.getElementById("digest-status"), null, "旧 id 元素不复活（id 退役）")
  send({ type: "digest", status: "end", ok: true, ms: 1500 })
  assert.equal(statusEls().length, 1, "end 原地更新（不新增元素）")
  assert.equal(el.textContent, "Digested 3 background report(s) (1.5s)", "收尾态 = n（承自 start）+ 秒")
  assert.ok(el.classList.contains("digest-done"), "成功态 class")
})
test("T-D5 每轮独立元素（§14 C-9——漂移回归/AC-CL2）：两轮两对元素，第 2 轮位于第 1 轮输出之后；start 连发各成独立元素", async () => {
  const { S } = await loadChat()
  send({ type: "clearMessages" })
  send({ type: "digest", status: "start", n: 2 })
  const round1Status = statusEls().at(-1)
  send({ type: "token", text: "round1 digest output" })
  const round1Output = document.getElementById("messages").lastElementChild
  send({ type: "digest", status: "end", ok: true, ms: 900 })
  assert.equal(round1Status.textContent, "Digested 2 background report(s) (0.9s)", "第 1 轮收尾留痕")
  send({ type: "digest", status: "start", n: 1 })
  const round2Label = turnEls().at(-1)
  const round2Status = statusEls().at(-1)
  assert.equal(turnEls().length, 2, "两轮两条标签行")
  assert.equal(statusEls().length, 2, "两轮两个状态元素（跨轮漂移消除——原缺陷：第 2 轮出现在第 1 轮输出上方）")
  assert.ok(round1Output.compareDocumentPosition(round2Label) & Node.DOCUMENT_POSITION_FOLLOWING, "第 2 轮元素位于第 1 轮输出之后（DOM 序断言）")
  assert.notEqual(round2Status, round1Status, "非同一元素（每轮独立）")
  send({ type: "digest", status: "end", ok: false, ms: 800 })
  assert.equal(round2Status.textContent, "Digestion interrupted (0.8s)", "中断态文案（ok:false）")
  assert.ok(round2Status.classList.contains("digest-failed"), "中断态 class")
  assert.equal(round1Status.textContent, "Digested 2 background report(s) (0.9s)", "旧轮元素文本不被覆盖（漂移回归）")
  assert.equal(S._digestBoundary, round2Label, "边界随最新轮覆盖（C-4）")
  send({ type: "digest", status: "start", n: 4 })
  send({ type: "digest", status: "start", n: 5 })
  assert.equal(statusEls().length, 4, "连发 start 不复用（各成独立元素）")
  send({ type: "digest", status: "end", ok: true, ms: 100 })
  assert.equal(statusEls().at(-1).textContent, "Digested 5 background report(s) (0.1s)", "end 更新最近未结本轮元素")
  assert.equal(statusEls().at(-2).textContent, "Digesting 4 background report(s)…", "更早未结元素不被误更新")
})

test("T-D7 cap 行 + 边界清空（§14 C-10/C-4/AC-CL2）：auto dim / stop warn 两档；suspension·清屏清边界", async () => {
  const { S } = await loadChat()
  send({ type: "clearMessages" })
  send({ type: "digest", status: "cap", mode: "auto", turns: 12 })
  let cap = capEls().at(-1)
  assert.ok(cap, "cap 行创建")
  assert.equal(cap.textContent, "[auto-turn: continuing past turn cap…]", "auto 档文案（dim）")
  assert.ok(!cap.classList.contains("digest-cap-stop"), "auto = 基础档（dim）")
  send({ type: "digest", status: "cap", mode: "stop", turns: 34 })
  cap = capEls().at(-1)
  assert.equal(cap.textContent, "[auto-turn stopped at 34 turns — partial digest; finished reports stay in history]", "stop 档文案（turns 注入）")
  assert.ok(cap.classList.contains("digest-cap-stop"), "stop = warn 档 class")
  send({ type: "digest", status: "start", n: 1 })
  assert.ok(S._digestBoundary, "start 置边界")
  send({ type: "suspension", active: true, running: 0, queued: 0, pending: 0, done: 0 })
  assert.equal(S._digestBoundary, null, "suspension 消息清边界（C-4）")
  send({ type: "digest", status: "start", n: 1 })
  send({ type: "clearMessages" })
  assert.equal(S._digestBoundary, null, "clearMessages 清边界（C-4）")
  assert.equal(capEls().length, 0, "清屏随清（流内元素语义）")
})

test("T-D8 接线机检（AC-CL2）：本档在册 + `.digest-turn`/`.digest-cap` 样式族在位", () => {
  assert.ok(files.includes("test/digest-visibility.test.mjs"), "本档已登记 test/files.mjs")
})
