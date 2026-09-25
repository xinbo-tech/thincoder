/**
 * busy-injection-vsc-webview.test.mjs — F16（busy 期消息注入 · 台账 #213）机器验收 · VSC 半
 * （webview 引导族半边）。
 *
 * 拆分（2026-09-25 file-tier-sweep 批 S3 · `docs/vsc/design/VSC-DEBT.md` §13.5——原
 * `busy-injection-vsc.test.mjs` 546 行越 500 硬限）：本档 = 第一部分全文（T-V16-1 / 4a / 4b /
 * 5 / 8——happy-dom 真 `send()` 引导面 + `before`/`after` 环境族）+ 原第四部分 #219 半边
 * （T-V19——全档唯一同时消费 `W` 与 `protoPanel` 者，与引导族同组即闭合）；桩面板族
 * （T-V16-2 / 3 / 3b / 4c / 5b / 6 / 7 / 10 + T-V21）留守原档。
 * 用例号零改零重排；夹具自持（零跨档 import——`W`/`capturedPosts`/`resetSend`/`protoPanel`）。
 *
 * 设计权威：`docs/vsc/design/WEBVIEW-INPUT.md` §1 C-B2-6（+ §7 U-I8）；批次档
 * `docs/batches/2026-09-21-busy-injection.md` §2 用例表（T-V16-1…4 住本族）。
 * fix 轮（2026-09-22 · 批档 §2 实施悬空裁定轮）：T-V16-5 = 二次提交守卫（细则①——host
 * `busyQueued` 镜像 / 槽满不出泡不清框 / 复位恢复排队）。busy-extend 批（2026-09-22 · 台账 #224 ·
 * 批档 §2 用例面）：T-V16-4a 改述（挂起会话内 busy 同排队面）；T-V16-8 = 跨载体二次提交守卫。
 * hygiene-sweep 批（#219）：T-V19 = 冷启 suspension 镜像。
 * 手法：webview-env（happy-dom + capturedPosts）驱真 `send()` + 真 `chat.js` 消息 case
 * （`busyQueued` 镜像——先例 `workspace-guard.test.mjs` 15/16 组）。零网络零 TTY。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import * as vscode from "vscode"
import { setupWebview, installFullIndexFixture } from "./helpers/webview-env.mjs"
import { handlePanelMessage, _cwd } from "../src/extension/panel-messages.mjs"
import { _setConfigPathForTest } from "@thincoder/core/config.mjs"
import { newSlot, _setSessionsDirForTest, _resetSessionsDirForTest } from "../src/extension/session-io.mjs"
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

// ═══ hygiene-sweep 批（#219 冷启 suspension 镜像——原档第四部分，随 webview 引导族迁本档）══════

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
