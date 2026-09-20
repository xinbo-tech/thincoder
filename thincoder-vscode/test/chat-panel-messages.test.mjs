/**
 * chat-panel-messages.test.mjs — 面板入口（消息 / 控制 / 状态）面测试——桩面板驱动。
 *
 * 拆分来源：test/chat-panel.test.mjs（621 行 > 500 硬限无豁免）——切点判据 =
 * docs/design/LEDGER-SELF-CONTAINED.md D18 四条（§5 D18 行；实施轮 E）。
 * 本档承载原档「面板入口语义」面：SESSION-FLOW-C C1 消息秩序（拒收 / 控制直通 / 启动闩 /
 * 响应器匹配 / 忙态状态机）+ INPUT-LOCK（拒收 + `_chat` 单槽交接）+ A 批 A1 sendMessage
 * 守卫 + QUEUED-VISIBILITY F-2 取消路由。
 *
 * 手法：桩面板驱动（`stubPanel` 桩方法记录 + 字段直控）——不跑真实回合。组①-⑫ 全部
 * <800ms——直跑即可（slow ≡ test，无归册阈值）。
 *
 * 夹具自持（D18②）：本档自带 `stubPanel`——零跨档 import、零余档真实回合夹具依赖
 * （余档 `chat-panel.test.mjs` = 真实模块直驱面：`runPanelChat` 回合执行 / `atComplete`
 * 索引补全 / `resolveTurnModelAndStamp` 模型决策）。
 * 用例名 / 编号自原档逐字保留；`test(` 计数守恒 **19 = 10（本档）+ 9（余档）**
 *（2026-09-17 af 批 +T-AF11（F-11 VSC ⏹ advisor 目标并入共用路径）——原句「17 = 8（本档）+ 9（余档）」
 *  为拆分时点值，其后 W15 事件中继例（⑬）已使本档实档 +1；本行按实档收正）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import * as vscode from "vscode"
import { handlePanelMessage } from "../src/extension/panel-messages.mjs"
import { newTurnController } from "../src/extension/panel-chat.mjs"
import { makeAskInPanel } from "../src/extension/panel-callbacks.mjs"
import { ChatPanel } from "../src/extension/chat-panel.mjs"

/** C1/C2 桩面板——方法记录 + 字段直控（桩 _chat 记参返回 resolve——组④ 除外）。
 *  C2（SESSION-FLOW-C F-C2a）：忙态以 _turnState 枚举表达（旧 _turnActive 布尔已退役）。
 *  INPUT-LOCK（C'）：_suspQueue 已删（排队机制废弃）——不设。 */
function stubPanel(overrides = {}) {
  const posted = []
  const p = {
    _turnState: "idle",
    _turnControllers: [],
    _abortController: null,
    _abortRequested: false,
    _susp: null,
    _questionQueue: [],
    _questionSeq: 0,
    _permissionQueue: [],
    _statusBar: null,
    _stopClickTs: null,
    _chatCalls: [],
    _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } },
    _chat(...args) { p._chatCalls.push(args); return Promise.resolve() },
    _activeHistory() { return [] },
    _refreshStatus() {},
    _setStatus() {},
    posted,
    ...overrides,
  }
  return p
}

// ─── ① INPUT-LOCK 拒收 + retry 同入口（F-C1e/H-F + C'）──────────────

test("① busy（running）拒收不排队（INPUT-LOCK C'）：userMessage/retry 一律拒——无 _chat 无回执无容器——警告明示；空闲直发（排队机制废弃）", async () => {
  const realWarn = vscode.window.showWarningMessage
  const warned = []
  vscode.window.showWarningMessage = async (m) => { warned.push(m) }
  try {
    const p = stubPanel({ _turnState: "running" })
    await handlePanelMessage(p, { type: "userMessage", text: "second" })
    await handlePanelMessage(p, { type: "userMessage", text: "third" })
    assert.deepEqual(p._chatCalls, [], "回合运行中不得开并发回合（直呼 _chat）")
    assert.equal(warned.length, 2, "每条拒收一次警告（明示不静默丢）")
    assert.equal(p.posted.length, 0, "拒收零消息（无回显无回执——排队 UI 已废）")

    // retry（H-F——守卫双份修复前直呼 _chat 绕过 turnActive 队列）→ 同拒收
    const rp = stubPanel({
      _turnState: "running",
      _activeHistory: () => [{ role: "user", content: "retry-me", provider: "p1" }],
    })
    await handlePanelMessage(rp, { type: "retry" })
    assert.equal(rp._chatCalls.length, 0, "retry 回合中不直呼 _chat")
    assert.equal(warned.length, 3, "retry 拒收同警告")
  } finally {
    vscode.window.showWarningMessage = realWarn
  }

  // 空闲 retry 直发（同入口的直呼分支——模型/provider 透传）
  const rp2 = stubPanel({ _activeHistory: () => [{ role: "user", content: "again", provider: "p2" }] })
  await handlePanelMessage(rp2, { type: "retry" })
  assert.deepEqual(rp2._chatCalls, [["again", undefined, undefined, "p2", undefined]], "空闲 retry 经 _chat 直发（与 userMessage 同参形——原语义）")

  // 空闲 userMessage 直发（无队列无回执）
  const ip = stubPanel({})
  await handlePanelMessage(ip, { type: "userMessage", text: "free" })
  assert.deepEqual(ip._chatCalls, [["free", undefined, undefined, undefined, undefined]], "空闲 userMessage → _chat 直发（原语义等价）")
})

// ─── ② 控制直通（红线不变量）──────────────────────

test("② 控制直通（AC 红线——不引入全量 FIFO 串行）：turnActive 中 abort 直达 controller——不被消息队列阻塞——交付有效不置闩", async () => {
  const ctrl = new AbortController()
  const p = stubPanel({ _turnState: "running", _abortController: ctrl })
  await handlePanelMessage(p, { type: "abort" })
  assert.equal(ctrl.signal.aborted, true, "运行中 abort 必须直达（控制消息永不排队——杀 Stop 即失败）")
  assert.equal(p._abortRequested, false, "交付有效的 abort 不置闩（防中断续跑/下次正常回合误杀）")
  assert.equal(p._abortRequested, false, "交付有效的 abort 不置闩（防中断续跑/下次正常回合误杀）")
})

// ─── ③ C1a 启动闩（F-C1b/H-C）───────────────────

test("③ C1a 启动闩（H-C）：Startup 窗口 abort/interrupt → 记闩 → 新建 controller 立即 aborted + 复位——下次正常回合干净启动", async () => {
  // Startup 窗口形态：回合起点已清僵尸 controller（_abortController null）——本回合
  // controller 尚未建立——abort 无活 controller 可交付。F-6（SESSION-ACTIVITY-REVISED）：
  // abort 只在主会话 running 时交付（Startup 窗口 state 已在回合入口发布为 running——
  // runPanelChatImpl 顶部任何 await 前——真态一致）；susp 纯池等待期 Stop 不可点不交付。
  const p = stubPanel({ _turnState: "running", _abortController: null })
  await handlePanelMessage(p, { type: "abort" })
  assert.equal(p._abortRequested, true, "窗口内无活 controller → 记闩")

  const c1 = newTurnController(p)
  assert.equal(c1.signal.aborted, true, "置位 → 新建 controller 立即 abort（Startup 窗口 Stop 生效）")
  assert.equal(p._abortRequested, false, "消费即复位")
  assert.equal(p._abortController, c1, "新建 controller 挂面板")

  const c2 = newTurnController(p)
  assert.equal(c2.signal.aborted, false, "复位后新建 controller 干净——下次正常回合不误杀")
  assert.equal(p._abortRequested, false)

  // interrupt 同闩路径（窗口内 Ctrl+I 无法注入续跑——记闩 → 回合起点立即停）
  const p2 = stubPanel({ _abortController: null })
  await handlePanelMessage(p2, { type: "interrupt", message: "redirect" })
  assert.equal(p2._abortRequested, true)
  const c3 = newTurnController(p2)
  assert.equal(c3.signal.aborted, true)
  assert.equal(p2._abortRequested, false)
  const c4 = newTurnController(p2)
  assert.equal(c4.signal.aborted, false, "中断闩消费后同样干净")
})

// ─── ⑤ 响应器匹配（F-C1d/H-D）────────────────────

test("⑤ 响应器匹配（H-D）：questionResponse 按 promptId 查队列——不匹配 no-op 不 resolve 队头——匹配条目错序也各归其位", async () => {
  const p = stubPanel({ _abortController: new AbortController() })
  const ask = makeAskInPanel(p)
  const r1 = ask("q1", ["A"])
  const r2 = ask("q2", ["B"])
  const resolved = []
  r1.then((a) => resolved.push(["r1", a]))
  r2.then((a) => resolved.push(["r2", a]))
  const ids = p.posted.filter((m) => m.type === "question").map((m) => m.promptId)
  assert.equal(ids.length, 2, "每问一张卡（host 发 question 带 promptId）")
  assert.equal(new Set(ids).size, 2, "每问自增 id")

  // 迟到/陈旧响应（id 不匹配——卡片已被取消或早已不在屏）→ no-op——队头绝不 resolve
  await handlePanelMessage(p, { type: "questionResponse", answer: "stale", promptId: 9999 })
  assert.equal(resolved.length, 0, "不匹配 id no-op——不 resolve 队头")
  assert.equal(p._questionQueue.length, 2, "队列原样保留")

  // 乱序响应（旧无条件 shift 会把 r2 的答案错配给队头 r1——id 匹配各归其位）
  await handlePanelMessage(p, { type: "questionResponse", answer: "B-answer", promptId: ids[1] })
  await handlePanelMessage(p, { type: "questionResponse", answer: "A-answer", promptId: ids[0] })
  assert.deepEqual(resolved, [["r2", "B-answer"], ["r1", "A-answer"]], "按 id resolve——错序不乱配")
  assert.equal(p._questionQueue.length, 0, "队列随 resolve 出队")

  // 无 promptId（旧 webview 回退）→ 队头语义
  const p3 = stubPanel({ _abortController: new AbortController() })
  const ask3 = makeAskInPanel(p3)
  const r3 = ask3("legacy", null)
  const seen = []
  r3.then((a) => seen.push(a))
  await handlePanelMessage(p3, { type: "questionResponse", answer: "head" })
  assert.deepEqual(seen, ["head"], "无 promptId → 队头（历史语义不回退破坏）")

  // Stop 释放未答卡——questionCancelled 随行 promptId（webview 据此移除正确卡片）。
  // F-6：Stop 只在 running 期点击（susp 纯池等待不可点——状态门）
  const p2 = stubPanel({ _turnState: "running", _abortController: new AbortController() })
  const ask2 = makeAskInPanel(p2)
  const rr = []
  ask2("q", null).then((a) => rr.push(a))
  const qid = p2.posted.find((m) => m.type === "question").promptId
  await handlePanelMessage(p2, { type: "abort" })
  const cancels = p2.posted.filter((m) => m.type === "questionCancelled")
  assert.equal(cancels.length, 1)
  assert.equal(cancels[0].promptId, qid, "questionCancelled 随行 promptId")
  assert.deepEqual(rr, [null], "abort 释放等待回合（resolve null）")
  assert.equal(p2._questionQueue.length, 0)
})

// ─── ⑦ C2 忙态：枚举转换/谓词/等待修饰/路由守卫（F-C2a + AC-C2）──────

test("⑦ C2 忙态状态机（F-C2a）：_publishTurnState 单一广播幂等 + turnBusy 谓词 + waiting 修饰态优先 + routeUserTurn 按枚举路由", async () => {
  // 转换 + 广播：ChatPanel 原型方法（真实 _refreshStatus/_setStatus 路径——vscode mock
  // 无 ThemeColor——_setStatus 以实例覆盖记录）。
  const posted = []
  const seenStatus = []
  const p = Object.create(ChatPanel.prototype)
  Object.assign(p, {
    _turnState: "idle",
    _susp: null,
    _permissionQueue: [],
    _questionQueue: [],
    _statusBar: null,
    _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } },
  })
  p._setStatus = (s) => seenStatus.push(s)

  p._publishTurnState("running")
  assert.equal(p._turnState, "running", "枚举转换 idle→running")
  assert.equal(p.turnBusy(), true)
  assert.equal(posted.at(-1).type, "turnState")
  assert.equal(posted.at(-1).state, "running")
  assert.equal(posted.at(-1).counts, undefined, "running 无 counts")
  const n = posted.length
  p._publishTurnState("running")
  assert.equal(posted.length, n, "同态重发无 counts → 不重发（幂等）")

  // susp + counts（挂起会话轮末/进入广播形）→ 重发带 counts
  p._publishTurnState("susp", { running: 2, queued: 0, pending: 1, done: 0 })
  assert.equal(p._turnState, "susp")
  assert.deepEqual(posted.at(-1).counts, { running: 2, queued: 0, pending: 1, done: 0 })
  p._publishTurnState("idle")
  assert.equal(p.turnBusy(), false, "idle → turnBusy false")

  // waiting 修饰态：权限/question 队列非空 → waiting 优先（不翻转枚举——非互斥）
  p._publishTurnState("susp")
  p._permissionQueue.push({})
  p._refreshStatus()
  assert.deepEqual(seenStatus.at(-1), "waiting", "waiting 优先 running（susp 也算 busy）")
  assert.equal(p._turnState, "susp", "waiting 不入枚举——修饰态非互斥")
  p._permissionQueue.length = 0
  p._refreshStatus()
  assert.deepEqual(seenStatus.at(-1), "running", "队列空 → susp busy → running")
  p._publishTurnState("idle")
  p._refreshStatus()
  assert.deepEqual(seenStatus.at(-1), "idle", "idle → idle")

  // routeUserTurn 按枚举路由：running → 拒收（INPUT-LOCK C'——不排队不直发——警告
  // 明示）；susp 两态与 idle → _chat（_chat 内上游分流 pendingInput 单槽——D-S5 唤醒
  // 语义不被队列短路）
  const realWarn = vscode.window.showWarningMessage
  const warned = []
  vscode.window.showWarningMessage = async (m) => { warned.push(m) }
  try {
    const qp = stubPanel({ _turnState: "running" })
    await handlePanelMessage(qp, { type: "userMessage", text: "during" })
    assert.deepEqual(qp._chatCalls, [], "running → 拒收（不直呼 _chat——禁排队）")
    assert.equal(warned.length, 1, "拒收警告一次")

    const sp = stubPanel({ _turnState: "susp", _susp: null }) // 释放窗口（会话未建——同步零事件窗口）
    await handlePanelMessage(sp, { type: "userMessage", text: "window" })
    assert.equal(sp._chatCalls.length, 1, "susp（非 running）→ 走 _chat（上游分流/防御拒）")

    const sa = stubPanel({ _turnState: "susp", _susp: { active: true } })
    await handlePanelMessage(sa, { type: "userMessage", text: "session" })
    assert.equal(sa._chatCalls.length, 1, "susp 会话活跃 → _chat（_chat 内 pendingInput 分流）")

    const ip = stubPanel({ _turnState: "idle" })
    await handlePanelMessage(ip, { type: "userMessage", text: "direct" })
    assert.equal(ip._chatCalls.length, 1, "idle → 直发 _chat")
  } finally {
    vscode.window.showWarningMessage = realWarn
  }
})

// ─── ⑧ A1 sendMessage 守卫（F-A1 + INPUT-LOCK）────────────────

test("⑧ A1 sendMessage 走 routeUserTurn（F-A1 + C'）：running 拒收先于回显（无假气泡无排队回执）；susp 两态回显 + 走 _chat 上游分流；idle 直发；空面板 warning 分支（A1e）", async () => {
  // running：拒收先于回显——不 postMessage userMessage、不 _chat（禁排队——无"气泡 +
  // message queued"形态）——警告明示（用户重发由自己掌控）
  const realWarn = vscode.window.showWarningMessage
  const warned = []
  vscode.window.showWarningMessage = async (m) => { warned.push(m) }
  try {
    const p = stubPanel({ _turnState: "running" })
    ChatPanel.prototype.sendMessage.call(p, "cmd-during")
    assert.equal(p._chatCalls.length, 0, "running 下命令发送不直呼 _chat（修 R6——不再杀当前回合）")
    assert.equal(p.posted.filter((m) => m.type === "userMessage").length, 0, "拒收无回显（不画假气泡——排队形态已废）")
    assert.equal(warned.length, 1, "拒收警告一次")
  } finally {
    vscode.window.showWarningMessage = realWarn
  }

  // susp 会话活跃 → 回显 + _chat（_chat 内上游分流 pendingInput——D-S5 唤醒语义不被队列短路）
  const sa = stubPanel({ _turnState: "susp", _susp: { active: true } })
  ChatPanel.prototype.sendMessage.call(sa, "to-session")
  assert.deepEqual(sa._chatCalls, [["to-session", undefined, undefined, undefined, undefined]], "susp 会话活跃 → _chat（上游 pendingInput 分流）")
  assert.equal(sa.posted.filter((m) => m.type === "userMessage").length, 1, "susp 回显一次（气泡先行观感）")
  // susp 释放窗口（会话未建——同步零事件窗口）→ 回显 + _chat（上游防御拒——不开并发）
  const sw = stubPanel({ _turnState: "susp", _susp: null })
  ChatPanel.prototype.sendMessage.call(sw, "in-window")
  assert.deepEqual(sw._chatCalls, [["in-window", undefined, undefined, undefined, undefined]], "susp 释放窗口 → _chat（上游分流）")

  // idle 直发（旧 sendMessage 语义等价——_chat(text) 同参形）
  const ip = stubPanel({ _turnState: "idle" })
  ChatPanel.prototype.sendMessage.call(ip, "direct")
  assert.deepEqual(ip._chatCalls, [["direct", undefined, undefined, undefined, undefined]], "idle → 直发 _chat（原语义等价）")

  // A1e（评审 #6 错误用例）：_panel 空 → warning 分支保留——不直呼 _chat
  const realWarn2 = vscode.window.showWarningMessage
  let warned2 = 0
  vscode.window.showWarningMessage = async () => { warned2++ }
  try {
    const ep = stubPanel({ _panel: null })
    ChatPanel.prototype.sendMessage.call(ep, "no-panel")
    assert.equal(warned2, 1, "空面板 → showWarningMessage 一次（分支保留）")
    assert.equal(ep._chatCalls.length, 0, "空面板不直呼 _chat")
  } finally {
    vscode.window.showWarningMessage = realWarn2
  }
})

// ─── ⑪ _chat 单槽交接（INPUT-LOCK C'——F-6 单槽化测试锁）────────────────

test("⑪ _chat 单槽（INPUT-LOCK）：挂起会话活跃期消息填 pendingInput 单槽 + 唤醒 driver；槽满/释放窗口（susp 无会话）拒收——零并发守卫不静默丢", async () => {
  const realWarn = vscode.window.showWarningMessage
  const warned = []
  vscode.window.showWarningMessage = async (m) => { warned.push(m) }
  try {
    // 会话活跃：真实 _chat 分流——pendingInput 单槽 + _suspWake（挂起空闲唤醒即消费）
    const wakes = []
    const p = stubPanel({ _susp: { active: true, pendingInput: [] }, _suspWake: () => wakes.push("wake") })
    await ChatPanel.prototype._chat.call(p, "m1", undefined, undefined, undefined, undefined)
    assert.deepEqual(p._susp.pendingInput.map((q) => q.text), ["m1"], "单槽填入（至多一条待交接）")
    assert.deepEqual(wakes, ["wake"], "唤醒 driver（waitForSettleOrWake 单槽）")
    // 槽满（同事件循环竞态防御——正常不可达）→ 拒收提示——不覆盖不静默丢
    await ChatPanel.prototype._chat.call(p, "m2", undefined, undefined, undefined, undefined)
    assert.equal(p._susp.pendingInput.length, 1, "槽满不覆盖")
    assert.deepEqual(p._susp.pendingInput[0].text, "m1", "原消息保留（零丢失）")
    assert.equal(warned.length, 1, "槽满拒收警告一次")

    // 释放窗口（_turnState susp 且无会话——防御：开并发独立回合会孤儿化后台池——AC-S2）
    const rw = stubPanel({ _turnState: "susp", _susp: null })
    await ChatPanel.prototype._chat.call(rw, "win", undefined, undefined, undefined, undefined)
    assert.equal(rw._chatCalls.length, 0, "释放窗口防御拒（真实 _chat 不开并发回合）")
    assert.equal(warned.length, 2, "防御拒收警告一次")

    // idle：真实 _chat → runPanelChat fire（stub runPanelChat 不可注入——此处断言经桩 _chat
    // 路由层面已在 ⑧ idle 分支覆盖——直接构造回合的路径由组④⑨⑩真实 runPanelChat 覆盖）
  } finally {
    vscode.window.showWarningMessage = realWarn
  }
})

// ─── ⑫ F-2 queued 取消路由（QUEUED-VISIBILITY F-2——自 pool-snapshot.test.mjs 迁入——
// REMOVE-POOL-SNAPSHOT 2026-09-09：F-3 快照重推撤销——F-2 取消路由覆盖保留——红线）────

/** 最小 live lines history（真数组 + 池 expando——与 agent 运行期 history 同形——
 *  cancelSubagent 路由读 _asyncSubagents/_asyncTombstones 的最小载体面）。 */
function poolHistory() {
  const history = []
  Object.assign(history, {
    _asyncSubagents: new Map(),
    _asyncAdvisors: new Map(),
    _asyncTombstones: new Map(),
    _pendingAsyncResults: [],
  })
  return history
}

test("⑫ F-2 cancelSubagent 路由（queued 目标）：引擎出队 + 墓碑 + W15 等待头回收事件——陈旧 ⏹ no-op（用例表 F-2 错误行）", async () => {
  const history = poolHistory()
  // relayPrefix 必携（生产池条目形状——executeAsyncSpawn 写侧恒有；事件中继面据此解析 role/id）
  const e9 = { id: 9, role: "eng-coder", status: "queued", done: false, cancelled: false, _files: [], _dependsOn: [], relayPrefix: "eng-coder#9/" }
  // W13 键形单源（评审 🔴 收口）：核池键恒 `String(id)`（写侧 `set(String(id))`）——夹具锁 String 键，
  // 防读键形回归被数字键夹具掩盖（原 `Number(msg.id)` 归一在生产恒 miss 的旧病理）。
  history._asyncSubagents.set("9", e9)
  const p = stubPanel({ _liveLines: { history, fullHistory: history, cwd: "C:/ws" }, _wvReady: true })

  await handlePanelMessage(p, { type: "cancelSubagent", id: "9", role: "eng-coder" })

  assert.equal(history._asyncSubagents.has(9), false, "queued 目标出队（map 移除——核 executeCancelAction）")
  assert.equal(history._asyncSubagents.has("9"), false, "String 键形出池（键形单源——回归锁）")
  assert.deepEqual(history._asyncTombstones.get("9"), { status: "cancelled", role: "eng-coder" }, "出队即终态 → cancelled 墓碑（依赖者查得；键形 = String 归一）")
  // W15（R5——等待头回收 + W13 观察项）：核 `⟦ev⟧cancelled` 经事件中继面 → webview 协议消息
  // （原 `callbacks: {}` = 该事件 no-op——webview ⏳ 等待块悬留）。`_onCancelled` 端侧旧缝已退役（W13）
  // ——本面为唯一通道。
  assert.deepEqual(
    p.posted.filter((m) => m.type === "subagent" && m.status === "cancelled"),
    [{ type: "subagent", role: "eng-coder", id: 9, status: "cancelled", was: "queued" }],
    "queued 取消 → cancelled(was:'queued') 事件（webview activity.js 移除 ⏳ 等待块）",
  )
  assert.equal(p.posted.filter((m) => m.type === "token").length, 0, "事件 token 零裸文本泄漏（识别即消费）")

  // 陈旧 ⏹（块已出队残留点击——用例表 F-2 错误行）→ 路由 no-op（未知 id——无虚构状态）
  await handlePanelMessage(p, { type: "cancelSubagent", id: "9", role: "eng-coder" })
  assert.equal(history._asyncTombstones.size, 1, "无新墓碑（幂等）")
  assert.equal(p.posted.filter((m) => m.type === "subagent" && m.status === "cancelled").length, 1, "陈旧点击零新事件（no-op）")
})

// ─── ⑬ W15 事件中继面（R5）：核 ⟦ev⟧ 事件 token → webview 活动区协议消息映射单点 ────

test("⑬ W15 事件中继：queued/cancelled/stopped/turn/done/settled/async+[model] 映射；非事件不消费", async () => {
  const { relaySubagentEventToken } = await import("../src/extension/panel-callbacks.mjs")
  const posted = []
  const p = { _wvReady: true, _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } } }
  const consume = (tok) => relaySubagentEventToken(p, tok)
  const RS = "\x1e"

  // 池生命周期事件（核发射面：subagent-run / subagent-scheduler / subagent-async / async-settle / 核 agent.mjs 子代 turn）
  assert.equal(consume(`eng-coder#4/⟦ev⟧queued${RS}slot${RS}3${RS}queued${RS}`), true)
  assert.equal(consume(`explore#2/⟦ev⟧queued${RS}depc${RS}1${RS}queued${RS}dependency cancelled`), true)
  assert.equal(consume(`eng-coder#5/⟦ev⟧async${RS}`), true)
  assert.equal(consume("eng-coder#5/[model]glm-5.3"), true)
  assert.equal(consume(`eng-coder#5/⟦ev⟧turn${RS}7${RS}100${RS}llm${RS}`), true)
  assert.equal(consume(`eng-coder#5/⟦ev⟧cancelled${RS}`), true)
  assert.equal(consume(`eng-coder#5/⟦ev⟧stopped${RS}0${RS}0${RS}stopped${RS}`), true)
  assert.equal(consume(`eng-coder#5/⟦ev⟧settled${RS}0${RS}0${RS}settled${RS}`), true)
  assert.equal(consume(`eng-coder#5/⟦ev⟧done${RS}0${RS}0${RS}done${RS}`), true)
  // 非事件面：主会话普通 token / 无前缀 [model]——不消费（原样转发）；relay 前缀内容 chunk
  // 事件中继不消费（由内容中继面 relaySubagentContentChunk 接管 → `sub:` 面板频道——
  // 见 test/subagent-content-relay.test.mjs T1–T7）。
  assert.equal(consume("plain main-agent token"), false)
  assert.equal(consume("[model]glm-5.3"), false)
  assert.equal(consume("eng-coder#5/hello chunk"), false)

  const [q1, q2, started, turn, cancelled, stopped, settled, done] = posted
  // 载荷四项（#118）：`kind` 随行 = 显示面判词单源（slot ⇒ 槽满词 / 其余 ⇒ reason 原文）。
  assert.deepEqual(q1, { type: "subagent", role: "eng-coder", id: 4, status: "queued", position: 3, waiting: null, reason: null, kind: "slot" })
  assert.deepEqual(q2, { type: "subagent", role: "explore", id: 2, status: "queued", position: 1, waiting: "dependency-cancelled", reason: "dependency cancelled", kind: "depc" })
  assert.equal(started.status, "started")
  assert.equal(started.pool, true, "async 标记 → pool:true（webview ⏹/接管判据）")
  assert.equal(started.model, "glm-5.3")
  assert.ok(typeof started.startedAt === "number", "startedAt 随行（elapsed 不丢）")
  assert.deepEqual(turn, { type: "subagent", role: "eng-coder", id: 5, status: "turn", turn: 7, maxTurns: 100 })
  assert.deepEqual(cancelled, { type: "subagent", role: "eng-coder", id: 5, status: "cancelled", was: "queued" })
  // X6 收口（2026-09-20 · 父侧裁定 #134 ②）：`⟦ev⟧stopped` 第 4 位（原因词位——核发射恒字面
  // "stopped"）与冻结头 verb 重复 ⇒ **零注记**（CLI 标尺：`subagent-blocks.mjs:263-273` 同分支不置
  // `lastError`）；有值 / 空位两形归一为同一载荷。
  assert.deepEqual(stopped, { type: "subagent", role: "eng-coder", id: 5, status: "cancelled" })
  assert.deepEqual(settled, { type: "subagent", role: "eng-coder", id: 5, status: "settled" })
  assert.deepEqual(done, { type: "subagent", role: "eng-coder", id: 5, status: "done" })
})

// ─── ⑭ af 批 T-AF11：VSC ⏹ advisor 目标并入共用路径（F-11——原 advisor 专用分支退役）────

/** advisor 池 queued 条目最小形（核 launch 写侧形状——`advisor-async.mjs:414` 入队 +
 *  relayPrefix / position / run.docSetKey 齐；合成 parent 读取面）。 */
function advisorQueuedEntry(id, docSetKey) {
  return {
    id, role: "advisor", reviewType: "design", run: { reviewType: "design", docSetKey, round: 0 },
    reviewId: `r${id}`, designId: null, designToken: null, documents: null, paths: null, object: null,
    relayPrefix: `advisor#${id}/`, status: "queued", position: 1,
    report: null, error: null, done: false, cancelled: false, promise: null, _settle: null,
    startedAt: null, controller: { signal: { aborted: false } },
  }
}

test("⑭ T-AF11 cancelSubagent 路由（advisor 目标·queued）：并入共用路径 ⇒ cancelled(was:'queued') 中继 + 队列零残留 + 墓碑（先红：零消息——等待头悬留）", async () => {
  const history = poolHistory()
  const e5 = advisorQueuedEntry(5, "K1")
  history._asyncAdvisors.set("5", e5)
  history._asyncAdvisorQueue = [e5] // 核写侧载体（VSC 形 = history——CARRIER_FIELDS 绑定面）
  const p = stubPanel({ _liveLines: { history, fullHistory: history, cwd: "C:/ws" }, _wvReady: true })

  await handlePanelMessage(p, { type: "cancelSubagent", id: "5", role: "advisor" })

  assert.equal(history._asyncAdvisorQueue.length, 0, "队列零残留（核 dequeueAdvisor 经载体吸收命中）")
  assert.equal(history._asyncAdvisors.has("5"), false, "出池")
  assert.deepEqual(history._asyncTombstones.get("5"), { status: "cancelled", role: "advisor" }, "出队即终态 → cancelled 墓碑")
  assert.deepEqual(
    p.posted.filter((m) => m.type === "subagent"),
    [{ type: "subagent", role: "advisor", id: 5, status: "cancelled", was: "queued" }],
    "恰 1 条 cancelled(was:'queued')（webview 等待头移除；零 ⟦ev⟧stopped ⇒ 无第二条 cancelled）",
  )
  assert.equal(p.posted.filter((m) => m.type === "token").length, 0, "事件 token 零裸文本泄漏（识别即消费）")
  assert.equal(history.filter((m) => m.role === "user").length, 1, "机读线提醒恰 1 条（评审已取消——token 未签发）")
})
