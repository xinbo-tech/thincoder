/**
 * busy-injection-vsc.test.mjs — F16（busy 期消息注入 · 台账 #213）机器验收 · VSC 半。
 * 设计权威：`docs/vsc/design/WEBVIEW-INPUT.md` §1 C-B2-6（+ §7 U-I8）；批次档
 * `docs/batches/2026-09-21-busy-injection.md` §2 用例表（T-V16-1…4；另加 T-V16-3b =
 * C-B2-6 细则② 第二分支「池空 idle 归位续发」的测试锁——用例表未列，实现面同锁）。
 * fix 轮（2026-09-22 · 批档 §2 实施悬空裁定轮）：T-V16-5 = 二次提交守卫（细则①——host
 * `busyQueued` 镜像 / 槽满不出泡不清框 / 复位恢复排队）；T-V16-6 = 送达侧贴图降级对位
 * （细则⑥——装载②/装载① 同过 F-1 判定 / 来源标记支降级 / mock 成功与 null 两形兜底）。
 * busy-extend 批（2026-09-22 · 台账 #224 · 批档 §2 用例面）：T-V16-4a 改述（挂起会话内 busy
 * 同排队面）；T-V16-7 = 载体两态会话侧受理（槽空 / 槽满——真实 `_chat` susp 分支）；
 * T-V16-8 = 跨载体二次提交守卫；T-V16-10 = 会话在飞入槽项来源标记 + F-1 判定两形。
 * 手法：① webview-env（happy-dom + capturedPosts）驱真 `send()` + 真 `chat.js` 消息 case
 * （`busyQueued` 镜像——先例 `workspace-guard.test.mjs` 15/16 组）；② vscode-mock 载体 +
 * 桩面板驱 `routeUserTurn` / `enterSuspensionTurn`（先例 `chat-panel-messages.test.mjs` /
 * `async-parity.test.mjs`）。零网络零 TTY。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import * as vscode from "vscode"
import { setupWebview, installFullIndexFixture } from "./helpers/webview-env.mjs"
import { handlePanelMessage, routeUserTurn, _cwd } from "../src/extension/panel-messages.mjs"
import { enterSuspensionTurn } from "../src/extension/panel-turn-stages.mjs"
import { _setConfigPathForTest } from "@thincoder/core/config.mjs"
import { newSlot, _setSessionsDirForTest, _resetSessionsDirForTest } from "../src/extension/session-io.mjs"
// T-V16-7 / T-V16-10：会话在飞受理走真实 `_chat` susp 分支（桩面板 + 原型方法绑定的直驱先例
// = `chat-panel-messages.test.mjs` ③⑧——生产同码路径，非桩自实现）。
import { ChatPanel } from "../src/extension/chat-panel.mjs"

// ═══ 第一部分：webview 面（真 send()——T-V16-1 / T-V16-4 webview 两态）═══════════

let cleanupEnv
let capturedPosts
let W = null

before(async () => {
  const env = setupWebview()
  cleanupEnv = env.cleanup
  capturedPosts = env.capturedPosts
  installFullIndexFixture()
  const state = await import("../webview/state.js")
  // fix 轮（2026-09-22）：夹具升级为全量 index.html id 组，并引真 `chat.js` 模块图——
  // T-V16-5「host 推 `busyQueued` ⇒ 镜像复位」需真消息 case（先例 `workspace-guard.test.mjs`；
  // 全量夹具为小夹具超集——既有用例断言面零改）。
  await import("../webview/chat.js")
  W = {
    S: state.S,
    ctx: state.ctx,
    t: (await import("../webview/i18n.js")).t,
    send: (await import("../webview/send.js")).send,
    toast: await import("../webview/toast.js"),
  }
})

after(() => {
  // toast 2.6s 计时器清掉（防 node --test 悬挂）
  try { clearTimeout(W?.toast?.showToast?._t) } catch { /* no toast yet */ }
  // chat.js 顶层的启动加载画面 3s 兜底计时器：providerStatus 是清它的那一拍（先例
  // `workspace-guard.test.mjs` after）；panels.js 2s 状态行 interval 经 unload 清。
  try { window.dispatchEvent(new window.MessageEvent("message", { data: { type: "providerStatus", status: {}, keyOk: true } })) } catch { /* teardown edge */ }
  try { window.dispatchEvent(new window.Event("unload")) } catch { /* teardown edge */ }
  cleanupEnv()
})

/** 逐测冷启复位（同文件串行——模块状态共享，每测独立起点）。 */
function resetSend(value) {
  const { S, ctx } = W
  S._turnState = "idle"
  S._suspended = false
  S._workspaceRequired = false
  S._busyQueuedPending = false // C-B2-6 细则① 镜像（fix 轮——初启态）
  S._phase = null
  S._taskProgress = null
  ctx.inputEl.value = value
  ctx._pastedImages.length = 0
  const toastEl = document.getElementById("paste-toast")
  if (toastEl) { toastEl.classList.remove("visible"); toastEl.textContent = "" }
}

/** 等待微任务链落定（宿主 face 断言前——routeUserTurn 内部异步段）。 */
const settle = () => new Promise((r) => setTimeout(r, 5))

test("T-V16-1 正常：`running && !_suspended` send ⇒ 本地气泡 + `queuedUserMessage` 上行（不 setLoading 不清面板 零 userMessage）", () => {
  resetSend("busy 排队文本")
  const { S, ctx, send } = W
  S._turnState = "running"
  S._taskProgress = { done: 1, total: 2 } // 面板态哨兵（不清面板的观测点）
  const bubbles = document.querySelectorAll(".message.user").length
  const mark = capturedPosts.length
  send()
  const posts = capturedPosts.slice(mark)
  const queued = posts.filter((m) => m.type === "queuedUserMessage")
  assert.equal(queued.length, 1, "恰 1 条 queuedUserMessage 上行")
  assert.equal(queued[0].text, "busy 排队文本", "文本随消息上传（host 单槽装载）")
  assert.equal(posts.filter((m) => m.type === "userMessage").length, 0, "零 userMessage（不经正常发送面）")
  assert.equal(document.querySelectorAll(".message.user").length, bubbles + 1, "本地气泡先行上屏（送达时即 user 回声面）")
  assert.equal(ctx.inputEl.value, "", "输入框清空（消息已受理——用户视为已发送）")
  assert.equal(S._phase, null, "不 setLoading（回合仍跑在既有流上——零 thinking 态开启）")
  assert.deepEqual(S._taskProgress, { done: 1, total: 2 }, "不清面板（任务面板态零改）")
  assert.equal(S._turnStart, null, "回合态簿记零触碰（_turnStart 归下一回合起点）")
})

test("T-V16-4a 边界（webview）：挂起会话内 busy（`running && _suspended`）⇒ 同排队面（busy-extend 批 · C-B2-6）：本地气泡 + `queuedUserMessage` + 清框 ∧ 零 toast ∧ 零 `userMessage`", () => {
  resetSend("digest 期文本")
  const { S, ctx, send } = W
  S._turnState = "running"
  S._suspended = true // 挂起会话内 busy（digest / 会话内用户回合）——`_suspended` 不再分流
  const bubbles = document.querySelectorAll(".message.user").length
  const mark = capturedPosts.length
  send()
  const posts = capturedPosts.slice(mark)
  const queued = posts.filter((m) => m.type === "queuedUserMessage")
  assert.equal(queued.length, 1, "恰 1 条 queuedUserMessage 上行（同面受理）")
  assert.equal(queued[0].text, "digest 期文本", "文本随消息上传（host 单槽两载体）")
  assert.equal(posts.filter((m) => m.type === "userMessage").length, 0, "零 userMessage（不经正常发送面）")
  assert.equal(document.querySelectorAll(".message.user").length, bubbles + 1, "本地气泡先行上屏")
  assert.equal(ctx.inputEl.value, "", "输入框清空（消息已受理——用户视为已发送）")
  const toastEl = document.getElementById("paste-toast")
  assert.ok(!toastEl?.classList.contains("visible"), "零 toast（受理非拒发——C-B2-4 面随本批撤销）")
})

test("T-V16-4b 边界（webview）：纯挂起等待面（`susp`）send ⇒ 走既有路径（userMessage 上行——零回归）", () => {
  resetSend("池等待文本")
  const { S, send } = W
  S._turnState = "susp"
  const mark = capturedPosts.length
  send()
  const posts = capturedPosts.slice(mark)
  assert.equal(posts.filter((m) => m.type === "userMessage").length, 1, "走既有 userMessage 路径（susp.pendingInput 单槽——零改）")
  assert.equal(posts.filter((m) => m.type === "queuedUserMessage").length, 0, "零排队上行（非普通回合 busy 面）")
})

test("T-V16-5 边界（webview 满队守卫——C-B2-6 细则①）：`running && !_suspended` 且 `S._busyQueuedCount >= 8` ⇒ 零上行 / 零新气泡 / 文本保留 / toast = `input.slotFull`；host 推 `count:0` ⇒ 镜像复位 ⇒ 再 send 恢复排队", () => {
  resetSend("满队文本")
  const { S, ctx, send, t } = W
  S._turnState = "running"
  S._busyQueuedCount = 8 // 满队镜像（host `busyQueued { count }` 权威值——queue-visible 批容量 8）
  const bubbles = document.querySelectorAll(".message.user").length
  const mark = capturedPosts.length
  send()
  const posts = capturedPosts.slice(mark)
  assert.equal(posts.filter((m) => m.type === "queuedUserMessage").length, 0, "零 queuedUserMessage 上行（不出泡）")
  assert.equal(posts.filter((m) => m.type === "userMessage").length, 0, "零 userMessage（不经正常发送面）")
  assert.equal(document.querySelectorAll(".message.user").length, bubbles, "零新气泡")
  assert.equal(ctx.inputEl.value, "满队文本", "文本保留不吞（对位 CLI 满队面 = 文本保留形）")
  const toastEl = document.getElementById("paste-toast")
  assert.ok(toastEl?.classList.contains("visible"), "toast 即时可见（不静默拒）")
  assert.equal(toastEl.textContent, t("input.slotFull"), "toast 文案 = 新键 `input.slotFull`（值改条数阈 8）")
  clearTimeout(W.toast.showToast._t)

  // host 推送权威收敛（真 chat-messages.js `case \"busyQueued\"`——消费即清）：镜像复位 ⇒ 再 send 恢复排队
  window.dispatchEvent(new window.MessageEvent("message", { data: { type: "busyQueued", pending: false, count: 0, items: [] } }))
  assert.equal(S._busyQueuedCount, 0, "镜像随 host 推送复位")
  const mark2 = capturedPosts.length, bubbles2 = document.querySelectorAll(".message.user").length
  send()
  const posts2 = capturedPosts.slice(mark2)
  assert.equal(posts2.filter((m) => m.type === "queuedUserMessage").length, 1, "队未满 ⇒ 再 send 恢复排队上行")
  assert.equal(S._busyQueuedCount, 1, "受理即本地先行自增（防同 tick 二连 Enter 竞态）")
  assert.equal(document.querySelectorAll(".message.user").length, bubbles2 + 1, "本地气泡上屏（受理面）")
  clearTimeout(W.toast.showToast._t)
})

// ─── T-V16-8 边界（webview · 满队跨载体守卫）：host 推 count:8（会话载体占用）───

test("T-V16-8 边界（webview 跨载体）：host 推满队（`count:8`——会话载体占用、`_busyQueued` 空）⇒ 不出泡 / 不清框 / toast `input.slotFull`；推送 `count:0` ⇒ 镜像复位恢复受理", () => {
  resetSend("跨载体满队")
  const { S, ctx, send, t } = W
  S._turnState = "running"
  // 满队镜像（host 推两载体合计——`items` 面标记渲染 = queue-visible-vsc.test.mjs T-V16-12）
  window.dispatchEvent(new window.MessageEvent("message", { data: { type: "busyQueued", pending: true, count: 8 } }))
  assert.equal(S._busyQueuedCount, 8, "host 推两载体合计满队 ⇒ 镜像置位")
  const bubbles = document.querySelectorAll(".message.user").length
  const mark = capturedPosts.length
  send()
  const posts = capturedPosts.slice(mark)
  assert.deepEqual([posts.filter((m) => m.type === "queuedUserMessage").length, posts.filter((m) => m.type === "userMessage").length, document.querySelectorAll(".message.user").length], [0, 0, bubbles], "不出泡 / 零 userMessage / 零新气泡（跨载体满队守卫生效）")
  assert.equal(ctx.inputEl.value, "跨载体满队", "文本保留不吞（不清框）")
  const toastEl = document.getElementById("paste-toast")
  assert.ok(toastEl?.classList.contains("visible") && toastEl.textContent === t("input.slotFull"), "toast 即时可见且文案 = `input.slotFull`（守卫判据源扩两载体生效）")
  clearTimeout(W.toast.showToast._t)
  // 消费即清（host 推实况）⇒ 镜像复位 ⇒ 恢复受理
  window.dispatchEvent(new window.MessageEvent("message", { data: { type: "busyQueued", pending: false, count: 0, items: [] } }))
  assert.equal(S._busyQueuedCount, 0, "镜像随 host 推送复位")
  send()
  assert.equal(ctx.inputEl.value, "", "恢复受理（清框）")
  clearTimeout(W.toast.showToast._t)
})

// ═══ 第二部分：host 面（routeUserTurn 分流 + enterSuspensionTurn 装载两分支）═══════

/** 桩面板（vscode-mock 载体——生产 ChatPanel 的被读字段子集 + 记录面）。 */
function stubPanel(over = {}) {
  const posted = []
  const p = {
    _turnState: "idle",
    _susp: null,
    _busyQueued: [],
    _abortController: null,
    _turnControllers: [],
    _publishTurnState(state) { p._turnState = state },
    _refreshStatus() {},
    _chatCalls: [],
    _chat(...args) { p._chatCalls.push(args); return Promise.resolve() },
    _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } },
    posted,
    ...over,
  }
  return p
}

/** 警告捕获（vscode-mock 面——先例 `chat-panel-messages.test.mjs`）。 */
async function withWarnings(fn) {
  const realWarn = vscode.window.showWarningMessage
  const warned = []
  vscode.window.showWarningMessage = async (m) => { warned.push(m) }
  try {
    await fn(warned)
  } finally {
    vscode.window.showWarningMessage = realWarn
  }
  return warned
}

test("T-V16-2 host 入队：普通回合 busy ⇒ `_busyQueued` 连续入队 + 不续发（零 _chat）零警告；满队（第 9 条）⇒ 拒收 + 提示（不覆盖）；挂起会内 busy ⇒ 同面受理（经 `_chat` susp 分支入会话队列）", async () => {
  const p = stubPanel({ _turnState: "running" })
  await withWarnings(async (warned) => {
    // ① 空队：入队（webview 上行同入口——queuedUserMessage case 分发）
    await handlePanelMessage(p, { type: "queuedUserMessage", text: "q1" })
    await settle()
    assert.deepEqual(p._busyQueued.map((q) => q.text), ["q1"], "普通回合 busy ⇒ 入队")
    assert.deepEqual(p._chatCalls, [], "不续发（零并发回合——回合仍在跑）")
    assert.equal(warned.length, 0, "入队零警告（受理即反馈）")

    // ② 容量内再提交 ⇒ 连续入队（queue-visible 批：阈 1 → 8）
    await routeUserTurn(p, { text: "q2" })
    await settle()
    assert.deepEqual([p._busyQueued.map((q) => q.text), warned.length], [["q1", "q2"], 0], "容量内再提交 ⇒ 连续入队（多槽）零警告")

    // ③ 满队（第 9 条）：拒收 + 提示——队内既有不被覆盖
    for (let i = 3; i <= 8; i++) await routeUserTurn(p, { text: `q${i}` })
    await routeUserTurn(p, { text: "ninth" })
    await settle()
    assert.deepEqual([p._busyQueued.length, warned.length, p._chatCalls.length], [8, 1, 0], "满队拒收：不覆盖 + 恰一次提示 + 零回合")

    // ④ 挂起会话内 busy（_susp 在场）：busy-extend 批改述——同面受理（走既有 `_chat` susp 分支入会话队列）
    const sp = stubPanel({ _turnState: "running", _susp: { active: true, pendingInput: [] } })
    await routeUserTurn(sp, { text: "during-digest" })
    await settle()
    assert.equal(sp._busyQueued.length, 0, "会话在飞 ⇒ 不入无会话队（载体两态）")
    assert.deepEqual([warned.length, sp._chatCalls.length], [1, 1], "受理零新警告（原「拒收 + 提示」撤销）+ 经 `_chat` 受理")
  })
})

/** 会话在飞 busy 面板（T-V16-7/T-V16-10）：桩面板 + 真实 `_chat` susp 分支（生产同码路径）
 *  + `_suspWake` 计数——受理 / 拒收 / 推送三面均可观测。 */
function sessionPanel() {
  const p = stubPanel({ _turnState: "running", _susp: { active: true, pendingInput: [] } })
  const wakes = { n: 0 }
  p._suspWake = () => { wakes.n++ }
  p._chat = (...args) => ChatPanel.prototype._chat.apply(p, args)
  p.wakes = wakes
  return p
}

test("T-V16-7 边界（host · 载体两态会话侧）：`routeUserTurn` 于 `running ∧ _susp` ⇒ 队未满：入 `susp.pendingInput`（来源标记）+ 推 `busyQueued{pending:true}` + 唤醒 + 零警告；满队：拒收 + 警告 + 不覆盖 + 推实况", async () => {
  // ① 队空：入会话队列（无会话队零动）+ 镜像推送 + 零即时回合
  const p1 = sessionPanel()
  await withWarnings(async (warned) => {
    await routeUserTurn(p1, { text: "during-session" })
    await settle()
    assert.deepEqual([p1._busyQueued, p1._susp.pendingInput.map((q) => q.text)], [[], ["during-session"]], "入会话队列（无会话队零动——载体两态）")
    assert.equal(p1._susp.pendingInput[0].fromBusyQueue, true, "入队项携来源标记（细则⑥）")
    assert.deepEqual(p1.posted.map((m) => `${m.type}:${m.pending}`), ["busyQueued:false", "busyQueued:true"], "入口复位推（#221 前移——队空 false）+ 受理推队内实况 true")
    assert.deepEqual([warned.length, p1.wakes.n, p1._turnState], [0, 1, "running"], "受理零警告 + 唤醒一次 + 零即时回合（susp 分支 return）")
  })

  // ② 满队（会话载体 8 条——`_busyQueued` 空）：拒收 + 警告 + 不覆盖 + 推实况 true
  const p2 = sessionPanel()
  for (let i = 0; i < 8; i++) p2._susp.pendingInput.push({ text: `q${i}` })
  await withWarnings(async (warned) => {
    await routeUserTurn(p2, { text: "ninth" })
    await settle()
    assert.deepEqual([p2._susp.pendingInput.length, warned.length, p2.wakes.n, p2.posted.map((m) => `${m.type}:${m.pending}`).join("|")],
      [8, 1, 0, "busyQueued:true|busyQueued:true"], "满队拒收：不覆盖 + 恰一次警告 + 零唤醒 + 实况两推（跨载体守卫判据源——T-V16-8 host 侧）")
  })
})

test("T-V16-3 装载①（池 live 进会话）：`_busyQueued` 残项预填 `susp.pendingInput` ⇒ driver 消费以原文开用户回合（消费清槽）", async () => {
  const history = []
  history._asyncSubagents = new Map([["1", { id: 1, role: "explore", status: "running" }]])
  history._suspended = false
  const p = stubPanel({ _turnState: "susp" })
  p._busyQueued = [{ text: "预填消息", modelOverride: undefined, reasoning: undefined, providerName: undefined, images: undefined }]
  const turns = []
  const runChat = async (_panel, args) => {
    turns.push(args)
    history._asyncSubagents.clear() // 消费后池空 → 会话自然退出（防悬挂）
  }
  await enterSuspensionTurn(p, { turnSlot: 1, distillSlot: null, history, fullHistory: [], skipSession: false, susp: false, runChat })
  assert.deepEqual(turns.map((t) => t.text), ["预填消息"], "driver 以原文开用户回合（预填生效——D-S5 输入优先）")
  assert.equal(turns[0].skipSession, true, "会话内回合（skipSession 形态零改）")
  assert.equal(p._busyQueued.length, 0, "槽随入口移交（避免二次装载）")
  assert.deepEqual(p.posted.filter((m) => m.type === "busyQueued").map((m) => m.pending), [false, false], "消费即清两推：装载① splice + driver 步骤 1（C-B2-6 细则① 三支消费点——镜像不黏滞）")
  assert.equal(p._susp, null, "会话自然退出（_susp 清）")
})

test("T-V16-3b 装载②（池空 idle 归位——C-B2-6 细则② 第二分支）：`_busyQueued` 非空 ⇒ 直接续发普通回合（后清槽）；两态（idle 已广播 / susp 归位窗）", async () => {
  // ① finalizeTurn 已广播 idle（池空）——本入口此时才达
  const h1 = []
  const p1 = stubPanel({ _turnState: "idle" })
  p1._busyQueued = [{ text: "late-1" }]
  const turns1 = []
  await enterSuspensionTurn(p1, { turnSlot: 1, distillSlot: null, history: h1, fullHistory: [], skipSession: false, susp: false, runChat: async (_p, args) => { turns1.push(args) } })
  assert.deepEqual(turns1.map((t) => t.text), ["late-1"], "池空归位 ⇒ 以该消息续发普通回合")
  assert.equal(p1._busyQueued.length, 0, "后清槽（消费即清）")

  // ② 释放窗口关（susp 广播后池已死）——归位 idle + 续发
  const h2 = []
  const p2 = stubPanel({ _turnState: "susp" })
  p2._busyQueued = [{ text: "late-2" }]
  const turns2 = []
  await enterSuspensionTurn(p2, { turnSlot: 1, distillSlot: null, history: h2, fullHistory: [], skipSession: false, susp: false, runChat: async (_p, args) => { turns2.push(args) } })
  assert.equal(p2._turnState, "idle", "无会话 ⇒ 忙态归位 idle（防 susp 悬空）")
  assert.deepEqual(turns2.map((t) => t.text), ["late-2"], "queued 残项续发（不静默丢）")

  // ③ 槽空 / skipSession ⇒ 零动作（既有形状零变）
  const p3 = stubPanel({ _turnState: "idle" })
  let called = 0
  await enterSuspensionTurn(p3, { turnSlot: 1, distillSlot: null, history: [], fullHistory: [], skipSession: false, susp: false, runChat: async () => { called++ } })
  assert.equal(called, 0, "槽空 ⇒ 零续发")
})

test("T-V16-4c 边界（host）：纯挂起等待 / idle ⇒ 走既有 `_chat` 路径（payload 零改——零回归）", async () => {
  const sa = stubPanel({ _turnState: "susp", _susp: { active: true, pendingInput: [] } })
  await handlePanelMessage(sa, { type: "userMessage", text: "to-session" })
  await settle()
  assert.deepEqual(sa._chatCalls, [["to-session", undefined, undefined, undefined, undefined]], "纯挂起等待 ⇒ _chat（_chat 内 pendingInput 单槽——零改）")
  assert.equal(sa._busyQueued.length, 0, "零入队（非普通回合 busy 面）")

  const ip = stubPanel({ _turnState: "idle" })
  await handlePanelMessage(ip, { type: "userMessage", text: "direct" })
  await settle()
  assert.deepEqual(ip._chatCalls, [["direct", undefined, undefined, undefined, undefined]], "idle ⇒ 直发 _chat（原语义等价）")
})

// ═══ 第三部分：送达侧贴图降级对位（C-B2-6 细则⑥ · fix 轮 2026-09-22）═════════════

const BUSY_IMG = ["/tmp/tc-busy-a.png"]

/** 入槽项形态（`routeUserTurn` busy 分支实产字段 + per-call 缝 `visionReader`）。 */
function busyItem(mock, over = {}) {
  return { text: "看图", modelOverride: "deepseek-v4-pro", reasoning: undefined, providerName: "ds", images: [...BUSY_IMG], fromBusyQueue: true, visionReader: mock, ...over }
}

test("T-V16-6 正常/边界（C-B2-6 细则⑥）：装载②（idle 归位）与装载①（池 live 预填 → driver 消费）送达前同过 F-1 判定——mock 成功 ⇒ 描述注入 + images 清空；mock null ⇒ 原样兜底（不静默丢）", async () => {
  const OK_DESC = "一只戴帽子的猫"
  const okMarker = `[图片 ${BUSY_IMG[0]} 描述: ${OK_DESC}]`

  // ① 装载②（池空 idle 归位）：降级 await 窗前先置 running（F-1 忙锁不变量）+ 同一判定
  const p2 = stubPanel({ _turnState: "idle" })
  p2._busyQueued = [busyItem(async () => ({ ok: true, description: OK_DESC }))]
  const turns2 = []
  await enterSuspensionTurn(p2, { turnSlot: 1, distillSlot: null, history: [], fullHistory: [], skipSession: false, susp: false, runChat: async (_p, args) => { turns2.push(args) } })
  assert.equal(turns2.length, 1, "残项续发一回合")
  assert.equal(turns2[0].text, `看图\n\n${okMarker}`, "装载②：描述注入 text（与 idle 面同一判定）")
  assert.equal(turns2[0].images, undefined, "装载②：images 清空（主回合按纯文本跑）")
  assert.equal(p2._turnState, "running", "装载②：先置 running 再 await（忙锁不变量）")
  assert.equal(p2._busyQueued.length, 0, "消费清槽（零残留）")

  // ② 装载①（池 live 预填 `susp.pendingInput` → driver 消费）——窗内 `_turnState` = susp（无 Stop 面）
  const history = []
  history._asyncSubagents = new Map([["1", { id: 1, role: "explore", status: "running" }]])
  history._suspended = false
  const p1 = stubPanel({ _turnState: "susp" })
  let stateInWindow = null
  p1._busyQueued = [busyItem(async () => { stateInWindow = p1._turnState; return { ok: true, description: OK_DESC } })]
  const turns1 = []
  const runChat1 = async (_panel, args) => { turns1.push(args); history._asyncSubagents.clear() } // 消费后池空 → 会话自然退出
  await enterSuspensionTurn(p1, { turnSlot: 1, distillSlot: null, history, fullHistory: [], skipSession: false, susp: false, runChat: runChat1 })
  assert.equal(turns1.length, 1, "driver 消费单槽开用户回合（预填生效——D-S5 输入优先）")
  assert.equal(turns1[0].text, `看图\n\n${okMarker}`, "装载①：来源标记支同过降级判定")
  assert.equal(turns1[0].images, undefined, "装载①：images 清空")
  assert.equal(turns1[0].skipSession, true, "会话内回合形状零改")
  assert.equal(stateInWindow, "susp", "装载① 窗内 `_turnState` = susp（无 Stop 面）")
  assert.equal(p1._busyQueued.length, 0, "槽随入口移交（splice——零残留）")

  // ③ mock null（无渠道 / spawn 失败 / 超时 / 空返同路）⇒ 原样兜底——不静默丢
  const p3 = stubPanel({ _turnState: "idle" })
  p3._busyQueued = [busyItem(async () => null)]
  const turns3 = []
  await enterSuspensionTurn(p3, { turnSlot: 1, distillSlot: null, history: [], fullHistory: [], skipSession: false, susp: false, runChat: async (_p, args) => { turns3.push(args) } })
  assert.equal(turns3[0].text, "看图", "fallback：文本零改动")
  assert.deepEqual(turns3[0].images, BUSY_IMG, "fallback：images 保留下发（可读不静默丢）")

  // ④ 纯挂起既有路径零改（装载① 无来源标记项——对位挂起空闲 `_chat` 直填形态）⇒ 零降级
  const h4 = []
  h4._asyncSubagents = new Map([["1", { id: 1, role: "explore", status: "running" }]])
  h4._suspended = false
  const p4 = stubPanel({ _turnState: "susp" })
  let called4 = 0
  p4._busyQueued = [{ text: "纯挂起项", modelOverride: "deepseek-v4-pro", providerName: "ds", images: [...BUSY_IMG], visionReader: async () => { called4 += 1; return { ok: true, description: "x" } } }]
  const turns4 = []
  const runChat4 = async (_panel, args) => { turns4.push(args); h4._asyncSubagents.clear() }
  await enterSuspensionTurn(p4, { turnSlot: 1, distillSlot: null, history: h4, fullHistory: [], skipSession: false, susp: false, runChat: runChat4 })
  assert.equal(called4, 0, "无来源标记 ⇒ 判决函数不可达（纯挂起既有路径零改）")
  assert.equal(turns4[0].text, "纯挂起项", "文本零改动")
  assert.deepEqual(turns4[0].images, BUSY_IMG, "images 原样（零旁路）")
})

test("T-V16-10 正常/边界（C-B2-6 细则⑥ · 会话在飞面）：入槽项携来源标记 + `visionReader` 缝 ⇒ 送达前过 F-1 判定（成功 ⇒ 描述注入 + images 清空；null ⇒ 原样兜底——不静默丢）", async () => {
  const OK_DESC = "一只戴帽子的猫"
  const okMarker = `[图片 ${BUSY_IMG[0]} 描述: ${OK_DESC}]`

  // ① 会话在飞受理：`routeUserTurn` 实产入槽项字段（来源标记 + per-call 缝）
  const mock = async () => ({ ok: true, description: OK_DESC })
  const p = sessionPanel()
  await routeUserTurn(p, { text: "看图", visionReader: mock })
  await settle()
  const item = p._susp.pendingInput[0] // 会话在飞实产入槽项（`_chat` susp 分支）
  assert.deepEqual([item.fromBusyQueue, item.visionReader], [true, mock], "来源标记 + `visionReader` 缝随项（仅该支降级——纯挂起既有路径零改）")

  // ② 送达侧（driver 消费支——`runTurn` 闭包：装载① 与会话在飞同支；images = 已落盘路径形）
  const history = []
  history._asyncSubagents = new Map([["1", { id: 1, role: "explore", status: "running" }]])
  history._suspended = false
  const p1 = stubPanel({ _turnState: "susp" })
  p1._busyQueued = [{ ...item, modelOverride: "deepseek-v4-pro", providerName: "ds", images: [...BUSY_IMG] }]
  const turns = []
  const runChat1 = async (_panel, args) => { turns.push(args); history._asyncSubagents.clear() } // 消费后池空 → 会话自然退出
  await enterSuspensionTurn(p1, { turnSlot: 1, distillSlot: null, history, fullHistory: [], skipSession: false, susp: false, runChat: runChat1 })
  assert.equal(turns.length, 1, "driver 消费单槽开用户回合")
  assert.deepEqual([turns[0].text, turns[0].images], [`看图\n\n${okMarker}`, undefined], "来源标记支同过降级判定（描述注入 + images 清空）")
  // ③ mock null（无渠道 / spawn 失败 / 超时 / 空返同路）⇒ 原样兜底——不静默丢
  const h3 = []
  h3._asyncSubagents = new Map([["1", { id: 1, role: "explore", status: "running" }]])
  h3._suspended = false
  const p3 = stubPanel({ _turnState: "susp" })
  p3._busyQueued = [{ ...item, visionReader: async () => null, modelOverride: "deepseek-v4-pro", providerName: "ds", images: [...BUSY_IMG] }]
  const turns3 = []
  await enterSuspensionTurn(p3, { turnSlot: 1, distillSlot: null, history: h3, fullHistory: [], skipSession: false, susp: false, runChat: async (_p, args) => { turns3.push(args); h3._asyncSubagents.clear() } })
  assert.deepEqual([turns3[0].text, turns3[0].images], ["看图", BUSY_IMG], "fallback：文本零改动 + images 保留下发（可读不静默丢）")
})

test("T-V16-5b（fix 轮收敛补全 · 评审 🟡#1）：归位受理路径同推槽内实况——镜像本地先行置位后不留黏滞死角", async () => {
  // 窄竞态形：镜像仍 running 而 host 已归位（idle）⇒ 消息落归位受理路径（非 busy 分支）
  const p = stubPanel({ _turnState: "idle" })
  await handlePanelMessage(p, { type: "queuedUserMessage", text: "race" })
  await settle()
  assert.deepEqual(p.posted.map((m) => `${m.type}:${m.pending}`), ["busyQueued:false"], "归位受理 ⇒ 推槽内实况 false（webview 镜像复位——不留黏滞）")
  assert.equal(p._chatCalls.length, 1, "消息直发回合（不丢）")

  // 残项在场（释放窗口）⇒ 推实况 true——不误报空槽
  const p2 = stubPanel({ _turnState: "idle" })
  p2._busyQueued = [{ text: "still-there" }]
  await handlePanelMessage(p2, { type: "queuedUserMessage", text: "next" })
  await settle()
  assert.deepEqual(p2.posted.map((m) => `${m.type}:${m.pending}`), ["busyQueued:true"], "有残项 ⇒ 推 true（实况——不误报）")
  assert.deepEqual(p2._busyQueued.map((q) => q.text), ["still-there"], "残项零动（归位路径不入槽不覆盖）")
})

// ═══ 第四部分：hygiene-sweep 批（#219 冷启 suspension 镜像 / #221 复位推前移）══════

/** #219 用桩面板（ChatPanel 原型真实方法——webviewReady case 需 _pushStatus / _publishTurnState
 *  等原型面；槽/配置路径由用例内隔离）。先例 = `session-boot.test.mjs` bootPanel。 */
function protoPanel(over = {}) {
  const posted = []
  const p = Object.create(ChatPanel.prototype)
  Object.assign(p, {
    _slot: null,
    _agent: null,
    _autoApprove: false,
    _turnState: "idle",
    _susp: null,
    _distillController: null,
    _abortController: null,
    _statusBar: null,
    _wvOutbox: [],
    _context: {
      subscriptions: [],
      secrets: { get: async () => undefined, delete: async () => {} },
      globalState: { get: async () => undefined, update: async () => {} },
      workspaceState: { get: () => undefined, update: async () => {} },
    },
    _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } },
    posted,
    ...over,
  })
  return p
}

test("T-V19 #219 冷启镜像：webviewReady 握手补推 `suspension{active:true}` ⇒ webview `_suspended === true`（无会话 ⇒ 零推）", async () => {
  const tmpd = mkdtempSync(join(tmpdir(), "tc-219-"))
  const realLang = vscode.env.language
  _setConfigPathForTest(join(tmpd, "config.json"))
  _setSessionsDirForTest(join(tmpd, "sessions"))
  vscode.env.language = "en" // vscode mock 无 env.language——webviewReady 的 i18n 推送需要
  try {
    await newSlot(_cwd()) // fixture 槽（webviewReady 快段 resumeSlot 认领确定性）
    const lines = { history: { _asyncSubagents: new Map([["1", { id: 1, role: "explore", status: "running" }]]), _asyncAdvisors: new Map() }, fullHistory: [] }
    const p = protoPanel({ _susp: { lines, pendingInput: [] } })
    await handlePanelMessage(p, { type: "webviewReady" })
    const susp = p.posted.filter((m) => m.type === "suspension")
    assert.equal(susp.length, 1, "恰一次 suspension 重推（挂起会话在场——Reload 冷启镜像复位源）")
    assert.equal(susp[0].active, true, "active:true（会话在飞）")
    // 真 webview 接收面：`_suspended` 唯一驱动源 = 该消息族（`panels.js:102`）
    const { handleSuspensionMessage } = await import("../webview/panels.js")
    W.S._suspended = false
    handleSuspensionMessage(susp[0])
    assert.equal(W.S._suspended, true, "冷启镜像复位：`_susp` 在场 ⇒ `_suspended === true`")

    // 负控：无挂起会话 ⇒ 零 suspension 推（与 turnState 分支同判）
    const q = protoPanel()
    await handlePanelMessage(q, { type: "webviewReady" })
    assert.equal(q.posted.filter((m) => m.type === "suspension").length, 0, "无 `_susp` ⇒ 零重推")
  } finally {
    vscode.env.language = realLang
    _setConfigPathForTest(null)
    _resetSessionsDirForTest()
    try { rmSync(tmpd, { recursive: true, force: true }) } catch { /* ignore */ }
  }
})

test("T-V21 #221 复位推前移：带图消息在降级 await 挂起期 ⇒ 镜像已在 await 前复位（postMessage 序断言）", async () => {
  const tmpd = mkdtempSync(join(tmpdir(), "tc-221-"))
  const realFolders = vscode.workspace.workspaceFolders
  vscode.workspace.workspaceFolders = [{ uri: { fsPath: tmpd } }] // 贴图落盘定向 temp（不污工作树）
  try {
    const p = stubPanel({ _turnState: "idle" })
    let release
    const gate = new Promise((r) => { release = r })
    const visionReader = async () => { await gate; return null } // 吊住降级 await（窗内可见序）
    const DATAURL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
    const turn = routeUserTurn(p, { text: "看图", modelOverride: "deepseek-v4-pro", providerName: "ds", images: [DATAURL], visionReader })
    await settle()
    assert.deepEqual(p.posted.map((m) => `${m.type}:${m.pending}`), ["busyQueued:false"], "await 挂起期已推复位实况（#221 前移——后置位此点为零推）")
    assert.deepEqual(p._chatCalls, [], "降级未完成 ⇒ 零回合（窗仍在）")
    release()
    await turn
    assert.equal(p._chatCalls.length, 1, "放行 ⇒ 回合照常（零语义变化）")
  } finally {
    vscode.workspace.workspaceFolders = realFolders
    try { rmSync(tmpd, { recursive: true, force: true }) } catch { /* ignore */ }
  }
})
