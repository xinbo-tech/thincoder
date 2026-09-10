/**
 * chat-panel.test.mjs — SESSION-FLOW-C C1 测试（VSC 消息秩序——竞态修复 + turn 句柄化）
 * + INPUT-LOCK-ASYNC（C'——thincoder/docs/design/INPUT-LOCK-ASYNC.md——2026-09-09）。
 * docs/design/SESSION-FLOW-C.md C1 节（F-C1a~e——修 H-B/H-C/H-A/H-D/H-F——AC-C1 组）。
 * 评审 #6：新文件——旧同名文件在 3b974ae「测试清空」中删除（git 核验——从未恢复）——
 * 以 files.mjs 实况重建（2026-09-09）。
 * A 批（SESSION-FLOW-A——2026-09-09）：⑧ A1 sendMessage 走 routeUserTurn（F-A1——running
 * 守卫/susp 两态回归/A1e 空面板 warning）+ ⑨⑩ A2 标题回合内（F-A2 方案 Y——真实
 * runPanelChat 桩测：标题窗口 = busy 测试锁 + 错误路径归位恒执行）。
 * INPUT-LOCK 批（C'——2026-09-09）：①⑦⑧⑨ 排队语义改拒收（_suspQueue/messageQueued/攒批
 * 全删）——running（含 digest/标题窗口）拒收 + 警告明示；⑪ _chat 单槽交接（pendingInput
 * 至多一条 + 唤醒 + 槽满/释放窗口防御拒）——测试锁。
 *
 * 手法：桩面板驱动（桩方法记录 + 可注入 resolve/reject）——不跑真实 agent 循环；组④经真实
 * ChatPanel 原型 + 真实 runPanelChat 驱动 setup 期异常（隔离 config/会话目录——_activeLines
 * 桩注入抛点——H-B 回归红线：修前此用例 unhandled rejection / await 红掉）；⑨⑩ 同骨架——
 * loading:true 首投即抛终止 try 体（isFirstMessage 已置位）→ 命中 finally 的 A2 标题段。
 * 组①-⑫ 全部 <800ms——快层直跑不标 slow（test/slow.mjs 归册阈值纪律）。
 * ⑫（2026-09-09）：F-2 queued 取消路由测试自 pool-snapshot.test.mjs 迁入（REMOVE-POOL-
 * SNAPSHOT 撤 F-3 快照重推——F-2 取消覆盖保留——红线）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import * as vscode from "vscode"
import { handlePanelMessage } from "../src/extension/panel-messages.mjs"
import { newTurnController, runPanelChat } from "../src/extension/panel-chat.mjs"
import { resolveTurnModelAndStamp } from "../src/extension/turn-model.mjs"
import { makeAskInPanel } from "../src/extension/panel-callbacks.mjs"
import { atComplete } from "../src/extension/panel-index.mjs"
import { ChatPanel } from "../src/extension/chat-panel.mjs"
import { _setConfigPathForTest } from "../src/config-io.mjs"
import { _setSessionsDirForTest, _resetSessionsDirForTest } from "../src/extension/session-io.mjs"

// ─── 环境隔离（组④ 走真实 runPanelChat——provider 解析 + 会话目录读全部指向临时目录）───

let _tmp

before(() => {
  _tmp = mkdtempSync(join(tmpdir(), "tc-c1-"))
  writeFileSync(join(_tmp, "config.json"), JSON.stringify({
  providers: [{ name: "p1", apiKey: "k1", baseURL: "http://127.0.0.1/v1", model: "m1" }],
  defaultModel: "p1:m1",
  }))
  _setConfigPathForTest(join(_tmp, "config.json"))
  _setSessionsDirForTest(join(_tmp, "sessions"))
})

after(() => {
  _setConfigPathForTest(null)
  _resetSessionsDirForTest()
  try { rmSync(_tmp, { recursive: true, force: true }) } catch { /* ignore */ }
})

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

/** 微任务/短定时冲刷（真实 runPanelChat 的 async 段全为同步体 await——单 setTimeout 足够）。 */
const settle = () => new Promise((r) => setTimeout(r, 10))

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

// ─── ④ 错误不悬挂（F-C1a/H-B 回归红线）──────────────

test("④ 错误不悬挂（H-B 回归红线）：回合 setup 期异常 → 保底 error + loading:false 发出——UI 不永卡 running——无 unhandled rejection", async () => {
  // 真实 ChatPanel 原型 + 真实 runPanelChat：instance 桩注入 setup 期抛点（_activeLines——
  // impl try 之前/之中的抛点即 H-B 来源）。修前（_chat 内 await runPanelChat）此用例
  // unhandled rejection 红掉——修后保底 catch 出 error + loading:false。
  const posted = []
  const p = Object.create(ChatPanel.prototype)
  Object.assign(p, {
    _slot: 0, // 绑定槽——ensureSlot 免盘
    _agent: null,
    _turnState: "idle",
    _abortController: null,
    _abortRequested: false,
    _turnControllers: [],
    _susp: null,
    _distillState: undefined,
    _distillController: undefined,
    _questionQueue: [],
    _permissionQueue: [],
    _statusBar: null,
    _context: { workspaceState: { get: () => undefined, update: async () => {} } },
    _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } },
    // 回合 setup 期异常注入点（impl 加载 lines 处——真实 runPanelChat 路径）
    _activeLines() { throw new Error("boom: setup failure") },
  })
  p._chat("hello") // fire-and-forget（生产语义）——修前此处产生 unhandled rejection
  await settle()
  assert.ok(p._turnHandle, "回合句柄挂面板（_turnHandle）")
  assert.equal(p._turnState, "idle", "忙态复位——不永卡 running（C2: 枚举 idle）")
  const tsIdle = posted.find((m) => m.type === "turnState" && m.state === "idle")
  assert.ok(tsIdle, "finally 忙态归位广播 turnState idle（C2 F-C2b——真实 impl 路径）")
  const err = posted.find((m) => m.type === "error")
  assert.ok(err, "保底 catch 发 error")
  assert.match(String(err.text), /boom: setup failure/, "error 携带原始 setup 异常")
  const off = posted.find((m) => m.type === "loading" && m.loading === false)
  assert.ok(off, "loading:false 保底发出（UI 停止旋转）")
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

// ─── ⑥ atComplete seq（F-C1c/H-A）────────────────

test("⑥ atComplete seq（H-A）：两次调用乱序 resolve → 只采纳新 seq——旧扫描不覆盖新下拉", async () => {
  const base = mkdtempSync(join(tmpdir(), "tc-c1-atc-"))
  const realFind = vscode.workspace.findFiles
  try {
    const resolvers = []
    vscode.workspace.findFiles = () => new Promise((res) => resolvers.push(res))
    const posted = []
    const p = { _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } } }
    try {
      const r1 = atComplete(p, "@alpha", base, 1)
      const r2 = atComplete(p, "@beta", base, 2)
      resolvers[1]([{ fsPath: join(base, "beta.js") }]) // 新扫描先返回
      resolvers[0]([{ fsPath: join(base, "alpha.js") }]) // 旧扫描迟到（findFiles 慢——H-A 窗口）
      await Promise.all([r1, r2])
    } finally {
      vscode.workspace.findFiles = realFind
    }
    const echoes = posted.filter((m) => m.type === "atResults")
    assert.equal(echoes.length, 1, "迟到旧扫描被丢弃——只回显最新 seq")
    assert.equal(echoes[0].seq, 2, "回显带 seq")
    assert.deepEqual(echoes[0].matches.map((m) => m.name), ["beta.js"], "新下拉内容不被旧扫描覆盖")
  } finally {
    vscode.workspace.findFiles = realFind
    try { rmSync(base, { recursive: true, force: true }) } catch { /* ignore */ }
  }
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

// ─── ⑨⑩ A2 标题回合内（F-A2——方案 Y）─────────────────

/** A2 真实 runPanelChat 骨架（⑨⑩ 共用）：真实 ChatPanel 原型 + 真实 runPanelChat——
 *  _activeLines 空线（isFirstMessage = true）+ loading:true 首投即抛（try 体内 :241 终止——
 *  命中 finally 时 isFirstMessage 已置位）。_generateTitle 实例覆盖——titleRejects=false →
 *  挂起于可控 gate（测试锁标题窗口）；true → 立即 reject（错误路径）。 */
function a2Panel({ titleRejects = false } = {}) {
  const posted = []
  const titleGate = []
  let loadingThrown = false
  const p = Object.create(ChatPanel.prototype)
  Object.assign(p, {
    _chatCalls: [],
    _slot: 0, // 绑定槽——ensureSlot 免盘
    _agent: null,
    _turnState: "idle",
    _abortController: null,
    _abortRequested: false,
    _turnControllers: [],
    _susp: null,
    _distillState: undefined,
    _distillController: undefined,
    _questionQueue: [],
    _permissionQueue: [],
    _statusBar: null,
    _context: { workspaceState: { get: () => undefined, update: async () => {} } },
    _panel: { webview: { postMessage: (m) => {
      // 回合进入 loading:true（impl :241）→ 抛——命中 finally（带 isFirstMessage）而不触网
      if (m.type === "loading" && m.loading === true && !loadingThrown) {
        loadingThrown = true
        throw new Error("boom-at-loading:true")
      }
      posted.push(m)
      return Promise.resolve(true)
    } } },
    _activeLines() { return { fullHistory: [], contextHistory: [] } }, // 空线——isFirstMessage = true
    _chat(...args) { p._chatCalls.push(args); return Promise.resolve() }, // 直发记录器（断言不并发用）
    _generateTitle: titleRejects
      ? async () => { throw new Error("title-boom") }
      : async () => new Promise((res) => titleGate.push(res)),
    posted,
  })
  return { p, titleGate }
}

test("⑨ A2 标题窗口 = busy（F-A2 测试锁 + INPUT-LOCK C'）：首回合标题 await 期间 _turnState 仍 running——userMessage 拒收（不并发不排队——禁排队）；标题完成后才归位", async () => {
  const { p, titleGate } = a2Panel()
  const turn = runPanelChat(p, { text: "first" })
  turn.catch(() => {}) // 防 settle 窗口 unhandled rejection（assert.rejects 稍后接管）
  await settle()
  assert.equal(titleGate.length, 1, "回合尾标题已触发（isFirstMessage——finally 内归位前）")
  assert.equal(p._turnState, "running", "标题 await 期间忙态未归位——仍 running（标题窗口 = busy——修前此点已 idle → 消息直开并发回合）")

  // 标题窗口内 userMessage → running 拒收——不并发直发不排队（R3 无池首回合并发锁 + C'）
  const realWarn = vscode.window.showWarningMessage
  const warned = []
  vscode.window.showWarningMessage = async (m) => { warned.push(m) }
  try {
    await handlePanelMessage(p, { type: "userMessage", text: "during-title" })
  } finally {
    vscode.window.showWarningMessage = realWarn
  }
  assert.equal(p._chatCalls.length, 0, "标题期间消息不直发 _chat（不并发新回合）")
  assert.equal(warned.length, 1, "拒收警告一次（禁排队——无入队容器无回执）")

  // 释放标题 → 归位执行（turnState idle 先于 loading:false——F-C2b 时序——A3 无闪烁前提）
  titleGate[0]()
  await assert.rejects(turn, /boom-at-loading/, "回合收尾于注入的 setup 异常（标题不吞回合错误）")
  const iIdle = p.posted.findIndex((m) => m.type === "turnState" && m.state === "idle")
  const iOff = p.posted.findIndex((m) => m.type === "loading" && m.loading === false)
  assert.ok(iIdle >= 0 && iOff > iIdle, "归位广播 turnState idle 先于 loading:false（标题后归位）")
  assert.equal(p._turnState, "idle", "终态 idle")
})

test("⑩ A2 错误路径（评审 #2）：标题失败不外抛——归位恒执行（turnState idle + loading:false 发出——不卡永久 busy）", async () => {
  const { p } = a2Panel({ titleRejects: true })
  const turn = runPanelChat(p, { text: "first" })
  turn.catch(() => {})
  await assert.rejects(turn, /boom-at-loading/, "标题错误被兜底吞掉——回合收尾于注入的 setup 异常（title-boom 不外泄）")
  assert.equal(p._turnState, "idle", "标题抛错仍归位 idle——不卡 running（修前：finally 内异常跳过归位 → 永 busy）")
  const tsIdle = p.posted.find((m) => m.type === "turnState" && m.state === "idle")
  assert.ok(tsIdle, "标题失败后归位广播仍发出（try/catch 兜底恒归位）")
  const loadOff = p.posted.find((m) => m.type === "loading" && m.loading === false)
  assert.ok(loadOff, "loading:false 仍发出（UI 停止旋转）")
  const lastTs = [...p.posted].reverse().find((m) => m.type === "turnState")
  assert.equal(lastTs.state, "idle", "终态广播 = idle（无残留 running）")
})

// ─── ⑪ MODEL-MERGE-SESSION 模型/stamp 决策（评审修复回归——行 1：槽复合不得被渠道默认顶掉）───

test("⑪ stamp 语义：webview echo == 槽复合 ≠ override——落槽值 = 槽模型（不再渠道默认顶槽）", () => {
  const slotRef = { provider: "deepseek", model: "deepseek-v4-flash" } // selectModel 已写槽的非默认模型
  // echo（dropdown 恒发 provider+model——send.js）与槽复合一致 → 非试运行
  let r = resolveTurnModelAndStamp({ providerName: "deepseek", modelOverride: "deepseek-v4-flash", slotRef, baseModel: "deepseek-v4-pro" })
  assert.equal(r.trialOverride, false, "echo == 槽模型 → 非 override")
  assert.equal(r.runModel, "deepseek-v4-flash")
  assert.equal(r.stampProvider, "deepseek")
  assert.equal(r.sessionStampModel, "deepseek-v4-flash", "落槽 = 槽模型——不被渠道默认 deepseek-v4-pro 顶掉（评审行 1 修复）")
  // 无 override（digest/挂起回合——槽渠道）→ 落槽 = 槽模型
  r = resolveTurnModelAndStamp({ providerName: "deepseek", modelOverride: null, slotRef, baseModel: "deepseek-v4-pro" })
  assert.equal(r.runModel, "deepseek-v4-flash")
  assert.equal(r.sessionStampModel, "deepseek-v4-flash")
})

test("⑪ 真 per-message override（≠ 槽复合）单回合不落槽——槽模型保留（裁定④）", () => {
  const slotRef = { provider: "deepseek", model: "deepseek-v4-flash" }
  const r = resolveTurnModelAndStamp({ providerName: "deepseek", modelOverride: "deepseek-r1-trial", slotRef, baseModel: "deepseek-v4-pro" })
  assert.equal(r.trialOverride, true, "与槽不符的显式模型 = 试运行")
  assert.equal(r.runModel, "deepseek-r1-trial", "试运行模型跑本回合")
  assert.equal(r.sessionStampModel, "deepseek-v4-flash", "落槽保留槽模型——override 不落槽")
})

test("⑪ 空槽（新会话首回合）echo/override = 播种实际运行复合——非试运行（评审行 3 修复）", () => {
  // 无槽复合：dropdown 沿用上一会话模型（F-7 沿用当前——selectModel 先写槽的流程在空槽未发生）
  // → 首回合 echo 即本会话播种值——落槽 = 实际运行模型（恒非空——CLI saveSession 对拍）
  const r = resolveTurnModelAndStamp({ providerName: "deepseek", modelOverride: "deepseek-v4-flash", slotRef: null, baseModel: "deepseek-v4-pro" })
  assert.equal(r.trialOverride, false, "无槽复合可比 → 非试运行")
  assert.equal(r.runModel, "deepseek-v4-flash")
  assert.equal(r.sessionStampModel, "deepseek-v4-flash", "空槽播实际运行模型（修前：播渠道默认 → 重开后模型静默翻转）")
  assert.equal(r.stampProvider, "deepseek")
  // 无 echo（config 默认解析运行）同样播种实际复合
  const r2 = resolveTurnModelAndStamp({ providerName: "deepseek", modelOverride: null, slotRef: null, baseModel: "deepseek-v4-pro" })
  assert.equal(r2.sessionStampModel, "deepseek-v4-pro")
})

test("⑪ 异渠道 echo（陈旧下拉/协议边缘）不覆写槽复合——stamp 恒为槽渠道（评审行 4 加固）", () => {
  const slotRef = { provider: "deepseek", model: "deepseek-v4-flash" }
  // 与槽渠道冲突的显式 provider+model：跑请求的模型——会话记录保持槽复合（会话模型只经 selectModel 变更）
  const r = resolveTurnModelAndStamp({ providerName: "kimi", modelOverride: "kimi-k3", slotRef, baseModel: "deepseek-v4-pro" })
  assert.equal(r.trialOverride, true)
  assert.equal(r.runModel, "kimi-k3", "本回合按请求模型跑")
  assert.equal(r.stampProvider, "deepseek", "槽渠道权威——不因陈旧 echo 换渠道")
  assert.equal(r.sessionStampModel, "deepseek-v4-flash", "槽复合完整保留")
})

test("⑪ 槽渠道优先：providerName 缺席 → slotRef 渠道/模型生效；legacy 无模型槽保留语义", () => {
  const slotRef = { provider: "kimi", model: "kimi-k3" }
  const r = resolveTurnModelAndStamp({ providerName: "kimi", modelOverride: null, slotRef, baseModel: null })
  assert.equal(r.runModel, "kimi-k3")
  assert.equal(r.sessionStampModel, "kimi-k3")
  // legacy 槽（provider 在、model null）——同渠道试运行 stamp null → saveLines ?? 保留槽值
  const legacy = resolveTurnModelAndStamp({ providerName: "kimi", modelOverride: "kimi-other", slotRef: { provider: "kimi", model: null }, baseModel: "kimi-k3" })
  assert.equal(legacy.trialOverride, true)
  assert.equal(legacy.sessionStampModel, null)
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

test("⑫ F-2 cancelSubagent 路由（queued 目标）：引擎出队 + was:\"queued\" 通知 + 墓碑——陈旧 ⏹ no-op（用例表 F-2 错误行）", async () => {
  const notified = []
  const history = poolHistory()
  const e9 = { id: 9, role: "eng-coder", status: "queued", done: false, cancelled: false, _files: [], _dependsOn: [] }
  e9._onCancelled = (wasQueued) => notified.push({ id: 9, role: "eng-coder", status: "cancelled", ...(wasQueued ? { was: "queued" } : {}) })
  history._asyncSubagents.set(9, e9)
  const p = stubPanel({ _liveLines: { history, fullHistory: history, cwd: "C:/ws" } })

  await handlePanelMessage(p, { type: "cancelSubagent", id: "9", role: "eng-coder" })

  assert.equal(history._asyncSubagents.has(9), false, "queued 目标出队（map 移除——引擎 cancelSubagent）")
  assert.deepEqual(history._asyncTombstones.get(9), { status: "cancelled", role: "eng-coder" }, "出队即终态 → cancelled 墓碑（依赖者查得）")
  assert.equal(notified.length, 1, "was:\"queued\" 通知发出（生产 = entry._onCancelled → onSubagent → webview 移除等待头）")
  assert.equal(notified[0].was, "queued", "webview 消费形状（activity.js cancelled+was 分支——块移除）")

  // 陈旧 ⏹（块已出队残留点击——用例表 F-2 错误行）→ 路由 no-op（未知 id——无虚构状态）
  await handlePanelMessage(p, { type: "cancelSubagent", id: "9", role: "eng-coder" })
  assert.equal(notified.length, 1, "陈旧点击零通知（引擎 error 路径——块已移除无副作用）")
  assert.equal(history._asyncTombstones.size, 1, "无新墓碑（幂等）")
})
