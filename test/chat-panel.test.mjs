/**
 * chat-panel.test.mjs — SESSION-FLOW-C C1 测试（VSC 消息秩序——竞态修复 + turn 句柄化）。
 * docs/design/SESSION-FLOW-C.md C1 节（F-C1a~e——修 H-B/H-C/H-A/H-D/H-F——AC-C1 组）。
 * 评审 #6：新文件——旧同名文件在 3b974ae「测试清空」中删除（git 核验——从未恢复）——
 * 以 files.mjs 实况重建（2026-09-09）。
 * A 批（SESSION-FLOW-A——2026-09-09）：⑧ A1 sendMessage 走 routeUserTurn（F-A1——running
 * 守卫/susp 两态回归/A1e 空面板 warning）+ ⑨⑩ A2 标题回合内（F-A2 方案 Y——真实
 * runPanelChat 桩测：标题窗口 = busy 测试锁 + 错误路径归位恒执行）。
 *
 * 手法：桩面板驱动（桩方法记录 + 可注入 resolve/reject）——不跑真实 agent 循环；组④经真实
 * ChatPanel 原型 + 真实 runPanelChat 驱动 setup 期异常（隔离 config/会话目录——_activeLines
 * 桩注入抛点——H-B 回归红线：修前此用例 unhandled rejection / await 红掉）；⑨⑩ 同骨架——
 * loading:true 首投即抛终止 try 体（isFirstMessage 已置位）→ 命中 finally 的 A2 标题段。
 * 组①-⑩ 全部 <800ms——快层直跑不标 slow（test/slow.mjs 归册阈值纪律）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import * as vscode from "vscode"
import { handlePanelMessage } from "../src/extension/panel-messages.mjs"
import { newTurnController, runPanelChat } from "../src/extension/panel-chat.mjs"
import { makeAskInPanel } from "../src/extension/panel-callbacks.mjs"
import { atComplete } from "../src/extension/panel-index.mjs"
import { ChatPanel } from "../src/extension/chat-panel.mjs"
import { popQueuedTurn } from "../src/extension/suspension.mjs"
import { _setConfigPathForTest } from "../src/config-io.mjs"
import { _setSessionsDirForTest, _resetSessionsDirForTest } from "../src/extension/session-io.mjs"

// ─── 环境隔离（组④ 走真实 runPanelChat——provider 解析 + 会话目录读全部指向临时目录）───

let _tmp

before(() => {
  _tmp = mkdtempSync(join(tmpdir(), "tc-c1-"))
  writeFileSync(join(_tmp, "config.json"), JSON.stringify({
    providers: [{ name: "p1", apiKey: "k1", baseURL: "http://127.0.0.1/v1", model: "m1" }],
    activeProvider: "p1",
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
 *  C2（SESSION-FLOW-C F-C2a）：忙态以 _turnState 枚举表达（旧 _turnActive 布尔已退役）。 */
function stubPanel(overrides = {}) {
  const posted = []
  const p = {
    _turnState: "idle",
    _turnControllers: [],
    _abortController: null,
    _abortRequested: false,
    _susp: null,
    _suspQueue: undefined,
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

// ─── ① 保序 + retry 同入口（F-C1e/H-F）──────────────

test("① 保序：turnActive 中 userMessage（发起回合之后的后续消息）一律入队 + 逐条 messageQueued——回合尾 FIFO 消费零丢失；retry 与 userMessage 同入口", async () => {
  const p = stubPanel({ _turnState: "running", _suspQueue: [] })
  await handlePanelMessage(p, { type: "userMessage", text: "second" })
  await handlePanelMessage(p, { type: "userMessage", text: "third" })
  assert.deepEqual(p._chatCalls, [], "回合运行中不得开并发回合（直呼 _chat）")
  assert.equal(p.posted.filter((m) => m.type === "messageQueued").length, 2, "每条入队一次 messageQueued")
  assert.deepEqual(p._suspQueue.map((q) => q.text), ["second", "third"], "入队保序")

  // retry（H-F——守卫双份修复前直呼 _chat 绕过 turnActive 队列）
  const rp = stubPanel({
    _turnState: "running",
    _suspQueue: [],
    _activeHistory: () => [{ role: "user", content: "retry-me", provider: "p1" }],
  })
  await handlePanelMessage(rp, { type: "retry" })
  assert.equal(rp._chatCalls.length, 0, "retry 回合中不直呼 _chat")
  assert.deepEqual(rp._suspQueue.map((q) => q.text), ["retry-me"], "retry 与 userMessage 同队列（_suspQueue 统一）")
  assert.equal(rp.posted.filter((m) => m.type === "messageQueued").length, 1)

  // 空闲 retry 直发（同入口的直呼分支——模型/provider 透传）
  const rp2 = stubPanel({ _activeHistory: () => [{ role: "user", content: "again", provider: "p2" }] })
  await handlePanelMessage(rp2, { type: "retry" })
  assert.deepEqual(rp2._chatCalls, [["again", undefined, undefined, "p2", undefined]], "空闲 retry 经 _chat 直发（与 userMessage 同参形——原语义）")

  // 回合尾 FIFO（消费循环 popQueuedTurn——超长单条不可合批 → 逐条直发保序零丢失）
  const longA = "x".repeat(2500)
  const longB = "y".repeat(2500)
  const longC = "z".repeat(2500)
  const fp = stubPanel({ _turnState: "running", _suspQueue: [] })
  for (const t of [longA, longB, longC]) {
    await handlePanelMessage(fp, { type: "userMessage", text: t })
  }
  const drained = []
  let next
  while ((next = popQueuedTurn(fp._suspQueue)) !== null) {
    assert.ok(next.item, "不可合批单条直发（{item} 形态）")
    drained.push(next.item.text)
  }
  assert.deepEqual(drained, [longA, longB, longC], "回合尾 FIFO——保序零丢失")
})

// ─── ② 控制直通（红线不变量）──────────────────────

test("② 控制直通（AC 红线——不引入全量 FIFO 串行）：turnActive 中 abort 直达 controller——不被消息队列阻塞——交付有效不置闩", async () => {
  const ctrl = new AbortController()
  const p = stubPanel({ _turnState: "running", _abortController: ctrl })
  await handlePanelMessage(p, { type: "abort" })
  assert.equal(ctrl.signal.aborted, true, "运行中 abort 必须直达（控制消息永不排队——杀 Stop 即失败）")
  assert.equal(p._abortRequested, false, "交付有效的 abort 不置闩（防中断续跑/下次正常回合误杀）")
  assert.equal(p.posted.filter((m) => m.type === "messageQueued").length, 0, "控制消息不产生排队反馈")
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
    _suspQueue: undefined,
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
    _suspQueue: undefined,
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

  // routeUserTurn 按枚举路由：running → _suspQueue 排队；susp 释放窗口/会话等待 → _chat
  // （_chat 内部上游分流 pendingInput/_suspQueue——D-S5 唤醒语义不被队列短路）；idle 直发
  const qp = stubPanel({ _turnState: "running", _suspQueue: [] })
  await handlePanelMessage(qp, { type: "userMessage", text: "during" })
  assert.deepEqual(qp._chatCalls, [], "running → 入队（不直呼 _chat）")
  assert.deepEqual(qp._suspQueue.map((q) => q.text), ["during"])

  const sp = stubPanel({ _turnState: "susp", _susp: null }) // 释放窗口（会话未建）
  await handlePanelMessage(sp, { type: "userMessage", text: "window" })
  assert.equal(sp._chatCalls.length, 1, "susp（非 running）→ 走 _chat（上游分流/唤醒）")
  assert.equal(sp._suspQueue, undefined, "不经 routeUserTurn 队列")

  const ip = stubPanel({ _turnState: "idle" })
  await handlePanelMessage(ip, { type: "userMessage", text: "direct" })
  assert.equal(ip._chatCalls.length, 1, "idle → 直发 _chat")
})

// ─── ⑧ A1 sendMessage 守卫（F-A1——修 R6 残留）────────────────

test("⑧ A1 sendMessage 走 routeUserTurn（F-A1）：running 回显先于入队 + messageQueued + 不直呼 _chat；susp 两态走 _chat 上游分流；idle 直发；空面板 warning 分支（A1e）", async () => {
  // running：回显 userMessage（先于入队）→ _suspQueue 排队 + messageQueued 一次——零直发
  const p = stubPanel({ _turnState: "running", _suspQueue: [] })
  ChatPanel.prototype.sendMessage.call(p, "cmd-during")
  assert.equal(p._chatCalls.length, 0, "running 下命令发送不直呼 _chat（修 R6——不再杀当前回合）")
  assert.equal(p._suspQueue.length, 1, "入队 _suspQueue（与 webview 输入同队列）")
  assert.equal(p._suspQueue[0].text, "cmd-during")
  assert.equal(p._suspQueue[0].modelOverride, undefined, "命令发送无模型/推理覆写（undefined 透传）")
  const types = p.posted.map((m) => m.type)
  assert.equal(types.filter((t) => t === "userMessage").length, 1, "回显 userMessage 一次")
  assert.equal(types.filter((t) => t === "messageQueued").length, 1, "messageQueued 回执一次")
  assert.ok(types.indexOf("userMessage") < types.indexOf("messageQueued"), "回显先于入队回执（用户气泡 + message queued——与 webview 输入观感一致）")
  // 回合尾 FIFO 排空 = 共享路径（评审 #5 确认：① 组已断言 routeUserTurn 队列经
  // popQueuedTurn 的 FIFO 排空——sendMessage 与 userMessage 同队列同 drain——此处只验
  // sendMessage 条目为 drain 兼容形 {text,…}——不重复 FIFO 用例）
  const drained = []
  let next
  while ((next = popQueuedTurn(p._suspQueue)) !== null) drained.push(next.item.text)
  assert.deepEqual(drained, ["cmd-during"], "回合尾 FIFO 消费形兼容（零丢失）")

  // susp 会话活跃 → _chat（_chat 内上游分流 pendingInput——D-S5 唤醒语义不被队列短路）
  const sa = stubPanel({ _turnState: "susp", _susp: { active: true } })
  ChatPanel.prototype.sendMessage.call(sa, "to-session")
  assert.deepEqual(sa._chatCalls, [["to-session", undefined, undefined, undefined, undefined]], "susp 会话活跃 → _chat（上游 pendingInput 分流）")
  assert.equal(sa._suspQueue, undefined, "不经 routeUserTurn 队列")
  assert.equal(sa.posted.filter((m) => m.type === "messageQueued").length, 0, "直接分流不产生排队回执")

  // susp 释放窗口（会话未建）→ 同样 _chat（内部 _suspQueue 接管——零丢失不变）
  const sw = stubPanel({ _turnState: "susp", _susp: null })
  ChatPanel.prototype.sendMessage.call(sw, "in-window")
  assert.deepEqual(sw._chatCalls, [["in-window", undefined, undefined, undefined, undefined]], "susp 释放窗口 → _chat（会话接管队列）")
  assert.equal(sw._suspQueue, undefined)

  // idle 直发（旧 sendMessage 语义等价——_chat(text) 同参形）
  const ip = stubPanel({ _turnState: "idle" })
  ChatPanel.prototype.sendMessage.call(ip, "direct")
  assert.deepEqual(ip._chatCalls, [["direct", undefined, undefined, undefined, undefined]], "idle → 直发 _chat（原语义等价）")

  // A1e（评审 #6 错误用例）：_panel 空 → warning 分支保留——不直呼 _chat
  const realWarn = vscode.window.showWarningMessage
  let warned = 0
  vscode.window.showWarningMessage = async () => { warned++ }
  try {
    const ep = stubPanel({ _panel: null })
    ChatPanel.prototype.sendMessage.call(ep, "no-panel")
    assert.equal(warned, 1, "空面板 → showWarningMessage 一次（分支保留）")
    assert.equal(ep._chatCalls.length, 0, "空面板不直呼 _chat")
    assert.equal(ep._suspQueue, undefined, "空面板不入队")
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
    _suspQueue: undefined,
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

test("⑨ A2 标题窗口 = busy（F-A2 测试锁）：首回合标题 await 期间 _turnState 仍 running——userMessage 入队不并发直发——标题完成后才归位", async () => {
  const { p, titleGate } = a2Panel()
  const turn = runPanelChat(p, { text: "first" })
  turn.catch(() => {}) // 防 settle 窗口 unhandled rejection（assert.rejects 稍后接管）
  await settle()
  assert.equal(titleGate.length, 1, "回合尾标题已触发（isFirstMessage——finally 内归位前）")
  assert.equal(p._turnState, "running", "标题 await 期间忙态未归位——仍 running（标题窗口 = busy——修前此点已 idle → 消息直开并发回合）")

  // 标题窗口内 userMessage → running 路由守卫排队——不并发直发（R3 无池首回合并发锁）
  await handlePanelMessage(p, { type: "userMessage", text: "during-title" })
  assert.equal(p._chatCalls.length, 0, "标题期间消息不直发 _chat（不并发新回合）")
  assert.deepEqual(p._suspQueue.map((q) => q.text), ["during-title"], "标题期消息入队 _suspQueue（回合尾 FIFO 消费零丢失）")
  assert.equal(p.posted.filter((m) => m.type === "messageQueued").length, 1, "入队回执一次")

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
