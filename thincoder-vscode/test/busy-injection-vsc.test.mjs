/**
 * busy-injection-vsc.test.mjs — F16（busy 期消息注入 · 台账 #213）机器验收 · VSC 半。
 * 设计权威：`docs/vsc/design/WEBVIEW-INPUT.md` §1 C-B2-6（+ §7 U-I8）；批次档
 * `docs/batches/2026-09-21-busy-injection.md` §2 用例表（T-V16-1…4；另加 T-V16-3b =
 * C-B2-6 细则② 第二分支「池空 idle 归位续发」的测试锁——用例表未列，实现面同锁）。
 * fix 轮（2026-09-22 · 批档 §2 实施悬空裁定轮）：T-V16-5 = 二次提交守卫（细则①——host
 * `busyQueued` 镜像 / 槽满不出泡不清框 / 复位恢复排队）；T-V16-6 = 送达侧贴图降级对位
 * （细则⑥——装载②/装载① 同过 F-1 判定 / 来源标记支降级 / mock 成功与 null 两形兜底）。
 * 手法：① webview-env（happy-dom + capturedPosts）驱真 `send()` + 真 `chat.js` 消息 case
 * （`busyQueued` 镜像——先例 `workspace-guard.test.mjs` 15/16 组）；② vscode-mock 载体 +
 * 桩面板驱 `routeUserTurn` / `enterSuspensionTurn`（先例 `chat-panel-messages.test.mjs` /
 * `async-parity.test.mjs`）。零网络零 TTY。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import * as vscode from "vscode"
import { setupWebview, installFullIndexFixture } from "./helpers/webview-env.mjs"
import { handlePanelMessage, routeUserTurn } from "../src/extension/panel-messages.mjs"
import { enterSuspensionTurn } from "../src/extension/panel-turn-stages.mjs"

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

test("T-V16-4a 边界（webview）：挂起会话内 busy（`running && _suspended`）⇒ 拒发零改（toast + 文本保留 + 零 queuedUserMessage）", () => {
  resetSend("digest 期文本")
  const { S, ctx, send, t } = W
  S._turnState = "running"
  S._suspended = true
  const mark = capturedPosts.length
  send()
  assert.equal(capturedPosts.slice(mark).filter((m) => m.type === "queuedUserMessage").length, 0, "零 queuedUserMessage（拒发面）")
  assert.equal(capturedPosts.slice(mark).filter((m) => m.type === "userMessage").length, 0, "零 userMessage")
  assert.equal(ctx.inputEl.value, "digest 期文本", "文本保留不吞")
  assert.equal(ctx.inputEl.placeholder, t("input.busyPlaceholder"), "占位符 = busy 串（既有锁零伤）")
  const toastEl = document.getElementById("paste-toast")
  assert.ok(toastEl?.classList.contains("visible"), "toast 即时可见")
  assert.equal(toastEl.textContent, t("input.busyPlaceholder"), "toast 文案 = busy 串（零新增 locale 键）")
  clearTimeout(W.toast.showToast._t)
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

test("T-V16-5 边界（webview 二次提交守卫 · 槽满镜像——C-B2-6 细则①）：`running && !_suspended` 且 `S._busyQueuedPending` ⇒ 零上行 / 零新气泡 / 文本保留 / toast = `input.slotFull`；host 推 `pending:false` ⇒ 镜像复位 ⇒ 再 send 恢复排队", () => {
  resetSend("槽满文本")
  const { S, ctx, send, t } = W
  S._turnState = "running"
  S._busyQueuedPending = true // 槽满镜像（host `busyQueued { pending:true }` 权威值）
  const bubbles = document.querySelectorAll(".message.user").length
  const mark = capturedPosts.length
  send()
  const posts = capturedPosts.slice(mark)
  assert.equal(posts.filter((m) => m.type === "queuedUserMessage").length, 0, "零 queuedUserMessage 上行（不出泡）")
  assert.equal(posts.filter((m) => m.type === "userMessage").length, 0, "零 userMessage（不经正常发送面）")
  assert.equal(document.querySelectorAll(".message.user").length, bubbles, "零新气泡")
  assert.equal(ctx.inputEl.value, "槽满文本", "文本保留不吞（对位 CLI 槽满面 = 文本保留形）")
  const toastEl = document.getElementById("paste-toast")
  assert.ok(toastEl?.classList.contains("visible"), "toast 即时可见（不静默拒）")
  assert.equal(toastEl.textContent, t("input.slotFull"), "toast 文案 = 新键 `input.slotFull`")
  clearTimeout(W.toast.showToast._t)

  // host 推送权威收敛（真 chat.js `case \"busyQueued\"`——消费即清）：镜像复位 ⇒ 再 send 恢复排队
  window.dispatchEvent(new window.MessageEvent("message", { data: { type: "busyQueued", pending: false } }))
  assert.equal(S._busyQueuedPending, false, "镜像随 host 推送复位")
  const mark2 = capturedPosts.length
  send()
  const posts2 = capturedPosts.slice(mark2)
  assert.equal(posts2.filter((m) => m.type === "queuedUserMessage").length, 1, "槽空 ⇒ 再 send 恢复排队上行")
  assert.equal(S._busyQueuedPending, true, "受理即本地先行置位（防同 tick 二连 Enter 竞态）")
  assert.equal(document.querySelectorAll(".message.user").length, bubbles + 1, "本地气泡上屏（受理面）")
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

test("T-V16-2 host 入槽：普通回合 busy ⇒ `_busyQueued` 单槽 + 不续发（零 _chat）零警告；槽满 ⇒ 拒收 + 提示（不覆盖）；挂起会内 busy ⇒ 拒收 + 提示零入槽", async () => {
  const p = stubPanel({ _turnState: "running" })
  await withWarnings(async (warned) => {
    // ① 空槽：入槽（webview 上行同入口——queuedUserMessage case 分发）
    await handlePanelMessage(p, { type: "queuedUserMessage", text: "q1" })
    await settle()
    assert.deepEqual(p._busyQueued.map((q) => q.text), ["q1"], "普通回合 busy ⇒ 入单槽")
    assert.deepEqual(p._chatCalls, [], "不续发（零并发回合——回合仍在跑）")
    assert.equal(warned.length, 0, "入槽零警告（受理即反馈）")

    // ② 槽满：拒收 + 提示——槽内既有不被覆盖
    await routeUserTurn(p, { text: "q2" })
    await settle()
    assert.deepEqual(p._busyQueued.map((q) => q.text), ["q1"], "槽满不覆盖")
    assert.equal(warned.length, 1, "槽满拒收恰一次提示（不静默丢）")
    assert.equal(p._chatCalls.length, 0, "拒收零回合")

    // ③ 挂起会话内 busy（_susp 在场）：拒收 + 提示——零入槽（C-B2-4 收窄后仅存面）
    const sp = stubPanel({ _turnState: "running", _susp: { active: true, pendingInput: [] } })
    await routeUserTurn(sp, { text: "during-digest" })
    await settle()
    assert.equal(sp._busyQueued.length, 0, "挂起会内 busy 零入槽")
    assert.equal(warned.length, 2, "拒收提示明示")
    assert.equal(sp._chatCalls.length, 0, "零回合")
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
