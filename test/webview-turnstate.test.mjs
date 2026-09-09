/**
 * webview-turnstate.test.mjs — SESSION-FLOW-C C2 测试（webview 忙态收敛 reducer 组）。
 * docs/design/SESSION-FLOW-C.md C2 节（F-C2a~e——AC-C2 组：_turnState 枚举转换 /
 * renderStatusBar 单 writer / Stop susp 常显 / _suspCounts 不陈旧——N3 单来源镜像侧）。
 * A3（SESSION-FLOW-A——2026-09-09）→ F-6（SESSION-ACTIVITY-REVISED——2026-09-09）：
 * ③ 尾段断言再翻转——Stop 派生由 state≠idle 收窄为 state==="running"（评审 #1 定论：
 * susp = 纯后台池跑——主空闲——不显 Stop——无全停——子代理停止靠活动区每块 ⏹）。
 * INPUT-LOCK（C'——2026-09-09，thincoder/docs/design/INPUT-LOCK-ASYNC.md）→ 修订
 * （INPUT-LOCK-BEHAVIOR-REVISED——2026-09-09）：⑤ 状态派生组——busy（running 含 digest——
 * 单一判据）不禁录入（readOnly 锁移除——打字回显）+ busy 占位符 + send 拒发（Enter/发送
 * 按钮——文本保留）/susp·idle 默认占位符——Ctrl+I 中断模态占位符归属（ctx._interruptMode）。
 *
 * 手法（webview 侧 happy-dom——smoke-settings.mjs 模式）：setupWebview（helpers/
 * webview-env.mjs——happy-dom 注册 + en locale + acquireVsCodeApi 桥桩）+ installChatFixture
 * 后动态 import 真模块（state.js/loading.js/status-bar.js/panels.js——单一运行时对象 S），
 * 直接驱动 host 消息对应的 reducer（chat.js window message case 的行为等价面：
 * loading case → setLoading；turnState case → handleTurnStateMessage；suspension →
 * handleSuspensionMessage）——不引导 chat.js 全量模块图。
 * 快层直跑（全部 <800ms——无真实定时器；panels.js 的 2s 状态行 interval 在 after 经
 * unload 事件清掉——防悬挂）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { setupWebview, installChatFixture } from "./helpers/webview-env.mjs"

// ─── happy-dom 环境（必须先于 webview 模块 import——state.js 顶层读 DOM + acquireVsCodeApi）───

let cleanupEnv
let capturedPosts

before(() => {
  const env = setupWebview()
  cleanupEnv = env.cleanup
  capturedPosts = env.capturedPosts
  installChatFixture()
})

after(() => {
  // panels.js 模块顶的 2s 清扫 interval——经其注册的 unload 监听清掉（防 node --test 悬挂）
  try { window.dispatchEvent(new window.Event("unload")) } catch { /* happy-dom teardown edge */ }
  cleanupEnv()
})

/** 动态 import 真模块（模块缓存——每文件一次；必须在 setupWebview 之后）。 */
async function loadWebview() {
  const state = await import("../webview/state.js")
  const loading = await import("../webview/loading.js")
  const statusBar = await import("../webview/status-bar.js")
  const panels = await import("../webview/panels.js")
  const sendMod = await import("../webview/send.js")
  const i18n = await import("../webview/i18n.js")
  return { S: state.S, ctx: state.ctx, t: i18n.t, send: sendMod.send, setLoading: loading.setLoading, applyBusyLock: loading.applyBusyLock, renderStatusBar: statusBar.renderStatusBar, ...panels }
}

const statusLine = () => document.getElementById("status-line").innerHTML
const abortShown = () => document.getElementById("abort-btn").style.display === "flex"

/** 逐测冷启复位（node --test 同文件串行——模块缓存共享同一 S——每测独立起点）。 */
function resetBusy({ S, ctx }) {
  S._turnState = "idle"
  S._suspended = false
  S._suspCounts = null
  S._phase = null
  ctx.isRunning = false
  ctx._interruptMode = false
  ctx.inputEl.readOnly = false
  document.getElementById("abort-btn").style.display = "none"
  document.getElementById("status-line").innerHTML = ""
}

// ─── ① susp 进出 + loading 交替 → S._turnState/isRunning 转换（AC-C2 枚举）──────

test("① _turnState 枚举转换（AC-C2）：idle→running→susp→running(digest)→susp→idle + loading 交替驱动 isRunning/phase", async () => {
  const { S, ctx, setLoading, handleTurnStateMessage, handleSuspensionMessage } = await loadWebview()
  resetBusy({ S, ctx })
  // 初始（webview 冷启）
  assert.equal(S._turnState, "idle", "初始 idle")
  assert.equal(S._phase, null)

  // 回合开始：host 回合入口广播 running（先于 loading:true）
  handleTurnStateMessage({ type: "turnState", state: "running" })
  assert.equal(S._turnState, "running")
  setLoading(ctx, true) // loading:true 消息
  assert.equal(ctx.isRunning, true, "loading:true → isRunning")
  assert.equal(S._phase, "thinking", "loading:true → S._phase=thinking")
  assert.equal(abortShown(), true)

  // 挂起会话进入：释放窗口/会话入口广播 susp + suspension active:true（带计数）
  handleTurnStateMessage({ type: "turnState", state: "susp", counts: { running: 2, queued: 0, pending: 1, done: 0 } })
  assert.equal(S._turnState, "susp")
  handleSuspensionMessage({ type: "suspension", active: true, running: 2, queued: 0, pending: 1, done: 0 })
  assert.equal(S._suspended, true, "suspension active → _suspended")
  assert.equal(S._suspCounts.pending, 1)

  // digest 交替：digest 回合 running + loading true/false——状态/按钮正确翻转。
  // （host 序：digest 尾 finally 先广播 susp 再发 loading:false——panel-chat.mjs 292-300）
  handleTurnStateMessage({ type: "turnState", state: "running" })
  assert.equal(S._turnState, "running", "digest 执行中 → running")
  setLoading(ctx, true)
  assert.equal(ctx.isRunning, true)
  handleTurnStateMessage({ type: "turnState", state: "susp" })
  assert.equal(S._turnState, "susp", "digest 尾 → 回 susp")
  setLoading(ctx, false) // digest 尾 loading:false（host 序：state susp 先于 loading:false——见 ③）
  assert.equal(ctx.isRunning, false, "loading:false → isRunning false")
  assert.equal(S._phase, null)

  // 会话退出：suspension active:false + turnState idle（host 序：idle 先于 suspension 终态）
  handleTurnStateMessage({ type: "turnState", state: "idle" })
  assert.equal(S._turnState, "idle")
  handleSuspensionMessage({ type: "suspension", active: false })
  assert.equal(S._suspended, false, "suspension exit → _suspended false")
  assert.equal(S._suspCounts, null, "计数随会话退出清空")
})

// ─── ② #status-line 单 writer（AC-C2——F-C2c/H-E）：loading 不覆写徽标 ────────

test("② renderStatusBar 单 writer：loading 消息不覆写徽标——thinking 同线绘制——终态 = 最后消息驱动", async () => {
  const { S, ctx, setLoading, handleTaskProgress, handleTurnStateMessage, handleSuspensionMessage } = await loadWebview()
  resetBusy({ S, ctx })
  // 先置 task 徽标（taskProgress 消息 → renderStatusBar 绘 task-badge）
  handleTaskProgress({ type: "taskProgress", done: 1, inProgress: 0, pending: 1, total: 2, items: [
    { title: "a", status: "done" }, { title: "b", status: "pending" },
  ] })
  assert.ok(S._taskStatus, "badge 文本就位")
  assert.ok(statusLine().includes("task-badge"), "状态行含 task 徽标")

  // loading:true（旧实现：innerHTML 覆写状态行 → 徽标被清——H-E）
  setLoading(ctx, true)
  const afterLoad = statusLine()
  assert.ok(afterLoad.includes("task-badge"), "loading 不覆写徽标（单 writer——修 H-E）")
  assert.ok(afterLoad.includes("Thinking"), "thinking 段由 renderStatusBar 同线绘制")
  assert.ok(afterLoad.includes("loading-dots"), "thinking 带 loading dots")

  // loading:false（旧实现：thinking 留在状态行直到下个 usage 渲染——终态不干净）
  setLoading(ctx, false)
  const afterOff = statusLine()
  assert.ok(afterOff.includes("task-badge"), "loading:false 后徽标仍在")
  assert.ok(!afterOff.includes("Thinking"), "终态 = 最后消息驱动——thinking 已清除")

  // 挂起期：susp + 计数 → 状态行含 ⏳ 段；digest loading 交替不清计数行
  handleTurnStateMessage({ type: "turnState", state: "susp" })
  handleSuspensionMessage({ type: "suspension", active: true, running: 1, queued: 0, pending: 3, done: 0 })
  const withSusp = statusLine()
  assert.ok(withSusp.includes("awaiting digestion"), "susp 计数段就位（1 running · 3 awaiting digestion）")
  setLoading(ctx, true)
  setLoading(ctx, false)
  const afterDigestToggles = statusLine()
  assert.ok(afterDigestToggles.includes("awaiting digestion"), "digest loading 交替不覆写 susp 计数")
  assert.ok(!afterDigestToggles.includes("Thinking"))
})

// ─── ③ Stop running 派生（AC-6——F-6 收窄：state≠idle → running——susp 不显）───

test("③ Stop running 派生（AC-6——SESSION-ACTIVITY-REVISED F-6 断言翻转）：susp 纯池跑不显——running 期（digest/普通回合/Reload 冷启）loading 交替都不隐——idle 收起", async () => {
  const { S, ctx, setLoading, handleTurnStateMessage } = await loadWebview()
  resetBusy({ S, ctx })
  assert.equal(abortShown(), false, "初始（idle）无 Stop")

  // 挂起会话进入（digest 间等待——纯后台池跑——主空闲）——无 Stop（F-6 反转：susp 不显）
  handleTurnStateMessage({ type: "turnState", state: "susp" })
  assert.equal(abortShown(), false, "susp 纯池跑 Stop 不显（无全停——子代理 ⏹ 逐块停）")

  // digest 序列：running+loading:true → susp+loading:false（host 广播序）——running 期显、
  // susp 期隐（F-6：Stop 只停主会话 digest 轮——digest 间无可停主会话）
  for (let i = 0; i < 3; i++) {
    handleTurnStateMessage({ type: "turnState", state: "running" })
    setLoading(ctx, true)      // digest 开始
    assert.equal(abortShown(), true, `digest ${i} loading:true → Stop 显`)
    handleTurnStateMessage({ type: "turnState", state: "susp" })
    setLoading(ctx, false)     // digest 尾（host 序：state susp 先于 loading:false）
    assert.equal(abortShown(), false, `digest ${i} 尾 → susp → Stop 收起（纯池等待——无全停——F-6 翻转）`)
  }

  // 会话退出 → idle → Stop 收起
  handleTurnStateMessage({ type: "turnState", state: "idle" })
  assert.equal(abortShown(), false, "idle → Stop 收起")

  // 普通回合（running 派生保留——A3 窗口）：running 期 loading 交替不隐 Stop（标题窗口/
  // digest 起跑窗口同属 running——隐藏窗口即闪烁源）
  handleTurnStateMessage({ type: "turnState", state: "running" })
  setLoading(ctx, true)
  assert.equal(abortShown(), true)
  setLoading(ctx, false)
  assert.equal(abortShown(), true, "running+loading:false → Stop 仍显（running 派生——AC-6）")

  // Reload 冷启：webviewReady 重推 running（host F-C2b——冷启后无 loading 消息）→ Stop 恢复
  handleTurnStateMessage({ type: "turnState", state: "idle" })
  assert.equal(abortShown(), false, "idle → Stop 收起")
  handleTurnStateMessage({ type: "turnState", state: "running" }) // Reload 冷启重推形
  assert.equal(abortShown(), true, "Reload 冷启 running（无 loading 消息）→ Stop 恢复（派生）")
  handleTurnStateMessage({ type: "turnState", state: "idle" })
  assert.equal(abortShown(), false, "终态 idle → Stop 收起")
})

// ─── ④ _suspCounts 不陈旧（AC-C2e——F-C2e）：重发后 webview 计数 = host 实际 ──

test("④ _suspCounts 在 re-post 间不陈旧（AC-C2e）：digest 间重发/settle 触发点后计数 = host 实际——loading 交替不清计数", async () => {
  const { S, ctx, setLoading, handleTurnStateMessage, handleSuspensionMessage } = await loadWebview()
  resetBusy({ S, ctx })

  // 会话进入：host 计数（轮末 282/300 重发形）
  handleTurnStateMessage({ type: "turnState", state: "susp", counts: { running: 2, queued: 1, pending: 0, done: 0 } })
  handleSuspensionMessage({ type: "suspension", active: true, running: 2, queued: 1, pending: 0, done: 0 })
  assert.deepEqual(S._suspCounts, { running: 2, queued: 1, pending: 0, done: 0 }, "进入计数 = host 实际")

  // digest 执行中 settle 触发点重发（F-C2e：onAsyncSettled → turnState 带 counts——state 随当前）
  handleTurnStateMessage({ type: "turnState", state: "running", counts: { running: 1, queued: 0, pending: 2, done: 1 } })
  assert.equal(S._turnState, "running", "settle 重发不翻状态（running 中）")
  assert.deepEqual(S._suspCounts, { running: 1, queued: 0, pending: 2, done: 1 }, "settle 触发点计数刷新 = host 实际")

  // digest 间轮末重发（282/300——suspension + turnState 双通道同源）
  setLoading(ctx, true)
  setLoading(ctx, false) // digest loading 交替
  handleTurnStateMessage({ type: "turnState", state: "susp", counts: { running: 1, queued: 0, pending: 1, done: 0 } })
  handleSuspensionMessage({ type: "suspension", active: true, running: 1, queued: 0, pending: 1, done: 0 })
  assert.deepEqual(S._suspCounts, { running: 1, queued: 0, pending: 1, done: 0 }, "轮末重发后计数 = host 实际（不陈旧）")

  // loading 消息不清计数（状态行单 writer 保留 ⏳ 段）
  assert.ok(statusLine().includes("background subagent"), "状态行 ⏳ 段在位")
  assert.equal(S._suspCounts.pending, 1, "loading 交替后计数未被清/覆写")

  // 无 counts 的 running 广播（digest 开始）保留既有计数（reducer 不误清）
  handleTurnStateMessage({ type: "turnState", state: "running" })
  assert.deepEqual(S._suspCounts, { running: 1, queued: 0, pending: 1, done: 0 }, "无 counts 广播不清计数")

  // 会话退出清空（suspension 终态）
  handleSuspensionMessage({ type: "suspension", active: false })
  assert.equal(S._suspCounts, null, "会话退出计数清空")
})

// ─── ⑤ INPUT-LOCK busy 输入面（修订——INPUT-LOCK-BEHAVIOR-REVISED：不禁录入只禁 send）───

test("⑤ busy 不禁录入 + send 禁（INPUT-LOCK-BEHAVIOR-REVISED——AC-1/AC-2）：running → readOnly false（打字回显）+ busy 占位符 + send 拒发（Enter/发送按钮——文本保留不吞）；loading 交替不翻；susp/idle 默认占位符；Ctrl+I 中断模态占位符归属（ctx._interruptMode——注入通道不误伤）", async () => {
  const { S, ctx, t, send, setLoading, applyBusyLock, handleTurnStateMessage } = await loadWebview()
  resetBusy({ S, ctx })
  const input = ctx.inputEl
  const userPosts = () => capturedPosts.filter((m) => m.type === "userMessage")

  // 回合/digest（running——单一判据）：loading:true —— 输入框不禁（readOnly false——可打字回显）
  handleTurnStateMessage({ type: "turnState", state: "running" })
  setLoading(ctx, true)
  assert.equal(input.readOnly, false, "running → 输入不禁（readOnly false——AC-1 可录入）")
  assert.equal(input.placeholder, t("input.busyPlaceholder"), "running → busy 占位符文案")
  // 打字回显 + send 拒发（Enter 路径 = send() 出口守卫——文本保留不吞不拒收）
  input.value = "busy 期录入的文字"
  const before = userPosts().length
  send()
  assert.equal(input.value, "busy 期录入的文字", "send 拒发后文本保留输入框（AC-2——不吞）")
  assert.equal(userPosts().length, before, "busy send 拒发——无 userMessage 发出（AC-2）")
  assert.equal(input.placeholder, t("input.busyPlaceholder"), "拒发提示 = busy 占位符（send.js 出口守卫）")
  // loading 交替不翻（running 派生——防 digest 间闪烁）
  setLoading(ctx, false)
  assert.equal(input.readOnly, false, "running + loading:false → 仍不禁（running 派生）")
  assert.equal(input.placeholder, t("input.busyPlaceholder"), "running + loading:false → busy 占位符仍在")

  // 挂起会话（susp——主空闲）：默认占位符（输入开放——消息填单槽不排队）
  handleTurnStateMessage({ type: "turnState", state: "susp" })
  setLoading(ctx, false)
  assert.equal(input.readOnly, false, "susp → 不禁录入")
  assert.equal(input.placeholder, t("input.placeholder"), "susp → 默认占位符恢复")

  // digest 执行中（susp 会话内回合 → running）：再进 busy 态
  handleTurnStateMessage({ type: "turnState", state: "running" })
  setLoading(ctx, true)
  assert.equal(input.readOnly, false, "digest（running）→ 不禁录入（同判据）")
  assert.equal(input.placeholder, t("input.busyPlaceholder"), "digest → busy 占位符")
  // digest 尾 → 回 susp：默认占位符
  handleTurnStateMessage({ type: "turnState", state: "susp" })
  setLoading(ctx, false)
  assert.equal(input.placeholder, t("input.placeholder"), "digest 尾回 susp → 默认占位符")

  // idle：默认占位符（会话退出/普通回合尾）
  handleTurnStateMessage({ type: "turnState", state: "idle" })
  setLoading(ctx, false)
  assert.equal(input.placeholder, t("input.placeholder"), "idle → 默认占位符")

  // Ctrl+I 中断模态（红线——注入通道保留）：模态激活期间占位符归 input.js（applyBusyLock
  // 不动）；模态退出（ctx._interruptMode 复位）→ applyBusyLock 重派生（回 busy 占位符）
  handleTurnStateMessage({ type: "turnState", state: "running" })
  ctx.inputEl.placeholder = "sentinel" // 模态中由 input.js enterInterruptMode 管理——applyBusyLock 不抢
  ctx._interruptMode = true
  applyBusyLock()
  assert.equal(input.placeholder, "sentinel", "中断模态激活 → applyBusyLock 不碰占位符（归本模态管理）")
  assert.equal(input.readOnly, false, "中断模态 → 输入可编辑（注入框）")
  ctx._interruptMode = false
  applyBusyLock()
  assert.equal(input.placeholder, t("input.busyPlaceholder"), "模态退出 → 重派生回 busy 占位符")
  handleTurnStateMessage({ type: "turnState", state: "idle" })
  applyBusyLock()
  assert.equal(input.placeholder, t("input.placeholder"), "idle → 终态默认占位符")
})
