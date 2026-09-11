/**
 * digest-visibility.test.mjs — 第 21 批（B6 消化轮起跑可见指示）机器验收。
 * 设计权威：`docs/design/WEBVIEW.md` §7.4（契约 · 用例 T-D1~T-D5 · AC-D1~D3）；
 * 批次档 `thincoder/docs/batches/2026-09-11-VSC-INDEX-PERCEPTION.md` §2。
 *
 * 两组手法（同文件——happy-dom 注册只影响 DOM 全局，extension 侧模块零 DOM 依赖）：
 * ① 主侧（T-D1~D3）：真 `suspensionSession` + 桩面板（posted 捕获）+ mock runTurn——起止
 *    两态时序与载荷；
 * ② webview 侧（T-D4/T-D5——AC-D2「驱动真 chat.js 模块」）：happy-dom 全量 id fixture +
 *    window message 事件直驱 chat.js 的 `case "digest"` → `#digest-status` 三态渲染。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { setupWebview } from "./helpers/webview-env.mjs"
import files from "./files.mjs"
import { suspensionSession } from "../src/extension/suspension.mjs"

let cleanupEnv

// chat.js 顶层 init 读全量 index.html id（webview-env 的 installChatFixture 只覆盖 25 个 id
// 的 reducer 组——本档要引导真 chat.js 模块图，fixture 需与 index.html 对齐）。
const INDEX_IDS = ("chat-container session-bar project-btn session-selector session-title session-arrow " +
  "session-dropdown new-session-btn messages panels goal-panel task-panel toolbar status-line at-dropdown " +
  "input-row file-input input attach-btn send-btn abort-btn paste-bar paste-badge controls-row model-btn " +
  "reasoning-btn auto-btn advisor-btn eng-btn plan-btn settings-btn model-dropdown reasoning-dropdown " +
  "settings-panel settings-close settings-body welcome-panel welcome-heading welcome-text " +
  "welcome-provider-label welcome-provider welcome-key-label welcome-key welcome-save-btn welcome-skip-btn " +
  "welcome-settings-btn").split(" ")

before(() => {
  const env = setupWebview()
  cleanupEnv = env.cleanup
  document.body.innerHTML = INDEX_IDS.map((id) => `<div id="${id}"></div>`).join("")
})

after(() => {
  try { window.dispatchEvent(new window.Event("unload")) } catch { /* happy-dom teardown edge */ }
  cleanupEnv()
})

// ─── ① 主侧：起止两态时序与载荷（AC-D1） ───────────────────────────────

/** 桩面板 + 挂起会话 fixture（pending 两条 → 消化轮触发条件）。 */
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

// ─── ② webview 侧：真 chat.js 渲染（AC-D2） ───────────────────────────

async function loadChat() {
  await import("../webview/chat.js") // 顶层注册 window message 监听（引导真模块图）
}

const send = (data) => window.dispatchEvent(new window.MessageEvent("message", { data }))
const digestEl = () => document.getElementById("digest-status")

/** 逐字文案（设计 §7.4 表——两档 locales 值即为判据）。 */
test("T-D4a 逐字文案落档（F-C1）：digest.* 三键两档 locales 与设计表逐字一致", () => {
  const expect = {
    "digest.start": ["正在消化 ${n} 份后台报告…", "Digesting ${n} background report(s)…"],
    "digest.done": ["已消化 ${n} 份后台报告（${seconds}s）", "Digested ${n} background report(s) (${seconds}s)"],
    "digest.aborted": ["消化中断（${seconds}s）", "Digestion interrupted (${seconds}s)"],
  }
  const zh = JSON.parse(readFileSync(new URL("../locales/zh.json", import.meta.url), "utf8"))
  const en = JSON.parse(readFileSync(new URL("../locales/en.json", import.meta.url), "utf8"))
  for (const [key, [zhText, enText]] of Object.entries(expect)) {
    assert.equal(zh[key], zhText, `zh ${key}`)
    assert.equal(en[key], enText, `en ${key}`)
  }
})

test("T-D4 webview 渲染（F-C1/AC-D2）：start / end(ok) / end(!ok) 三态原地更新（含 n / 秒）", async () => {
  await loadChat()
  digestEl()?.remove()
  send({ type: "digest", status: "start", n: 3 })
  let el = digestEl()
  assert.ok(el, "起跑即建 #digest-status 元素")
  assert.equal(el.parentElement.id, "messages", "流内元素（#messages 尾部）")
  assert.equal(el.className, "digest-status")
  assert.equal(el.textContent, "Digesting 3 background report(s)…", "起跑态文案（en locale）")
  send({ type: "digest", status: "end", ok: true, ms: 1500 })
  el = digestEl()
  assert.equal(el.textContent, "Digested 3 background report(s) (1.5s)", "收尾态 = n（承自 start）+ 秒（ms/1000 一位小数）")
  assert.ok(el.classList.contains("digest-done"), "成功态 class")
  assert.equal(document.querySelectorAll("#digest-status").length, 1, "原地更新（不新增元素）")
  send({ type: "digest", status: "start", n: 1 })
  send({ type: "digest", status: "end", ok: false, ms: 800 })
  el = digestEl()
  assert.equal(el.textContent, "Digestion interrupted (0.8s)", "中断态文案（ok:false）")
  assert.ok(el.classList.contains("digest-failed"), "中断态 class")
})

test("T-D5 幂等（F-C1/AC-D2）：重复 start（合并轮连发）→ 单元素原地更新", async () => {
  await loadChat()
  digestEl()?.remove()
  send({ type: "digest", status: "start", n: 2 })
  send({ type: "digest", status: "start", n: 5 })
  assert.equal(document.querySelectorAll("#digest-status").length, 1, "单元素（不重复建）")
  assert.equal(digestEl().textContent, "Digesting 5 background report(s)…", "更新为最新 n")
  assert.ok(files.includes("test/digest-visibility.test.mjs"), "本档已登记 test/files.mjs")
})
