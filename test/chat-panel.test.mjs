/**
 * chat-panel.test.mjs — SESSION-FLOW-C C1 测试（VSC 消息秩序——竞态修复 + turn 句柄化）。
 * docs/design/SESSION-FLOW-C.md C1 节（F-C1a~e——修 H-B/H-C/H-A/H-D/H-F——AC-C1 组）。
 * 评审 #6：新文件——旧同名文件在 3b974ae「测试清空」中删除（git 核验——从未恢复）——
 * 以 files.mjs 实况重建（2026-09-09）。
 *
 * 手法：桩面板驱动（桩方法记录 + 可注入 resolve/reject）——不跑真实 agent 循环；组④经真实
 * ChatPanel 原型 + 真实 runPanelChat 驱动 setup 期异常（隔离 config/会话目录——_activeLines
 * 桩注入抛点——H-B 回归红线：修前此用例 unhandled rejection / await 红掉）。
 * 组①-⑥ 全部 <800ms——快层直跑不标 slow（test/slow.mjs 归册阈值纪律）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import * as vscode from "vscode"
import { handlePanelMessage } from "../src/extension/panel-messages.mjs"
import { newTurnController } from "../src/extension/panel-chat.mjs"
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

/** C1 桩面板——方法记录 + 字段直控（桩 _chat 记参返回 resolve——组④ 除外）。 */
function stubPanel(overrides = {}) {
  const posted = []
  const p = {
    _turnActive: false,
    _turnControllers: [],
    _abortController: null,
    _abortRequested: false,
    _susp: null,
    _suspPending: false,
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
  const p = stubPanel({ _turnActive: true, _suspQueue: [] })
  await handlePanelMessage(p, { type: "userMessage", text: "second" })
  await handlePanelMessage(p, { type: "userMessage", text: "third" })
  assert.deepEqual(p._chatCalls, [], "回合运行中不得开并发回合（直呼 _chat）")
  assert.equal(p.posted.filter((m) => m.type === "messageQueued").length, 2, "每条入队一次 messageQueued")
  assert.deepEqual(p._suspQueue.map((q) => q.text), ["second", "third"], "入队保序")

  // retry（H-F——守卫双份修复前直呼 _chat 绕过 turnActive 队列）
  const rp = stubPanel({
    _turnActive: true,
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
  const fp = stubPanel({ _turnActive: true, _suspQueue: [] })
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
  const p = stubPanel({ _turnActive: true, _abortController: ctrl })
  await handlePanelMessage(p, { type: "abort" })
  assert.equal(ctrl.signal.aborted, true, "运行中 abort 必须直达（控制消息永不排队——杀 Stop 即失败）")
  assert.equal(p._abortRequested, false, "交付有效的 abort 不置闩（防中断续跑/下次正常回合误杀）")
  assert.equal(p.posted.filter((m) => m.type === "messageQueued").length, 0, "控制消息不产生排队反馈")
})

// ─── ③ C1a 启动闩（F-C1b/H-C）───────────────────

test("③ C1a 启动闩（H-C）：Startup 窗口 abort/interrupt → 记闩 → 新建 controller 立即 aborted + 复位——下次正常回合干净启动", async () => {
  // Startup 窗口形态：回合起点已清僵尸 controller（_abortController null）——本回合
  // controller 尚未建立——abort 无活 controller 可交付。
  const p = stubPanel({ _abortController: null })
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
    _turnActive: false,
    _abortController: null,
    _abortRequested: false,
    _turnControllers: [],
    _susp: null,
    _suspPending: false,
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
  assert.equal(p._turnActive, false, "忙态复位——不永卡 running")
  const error = posted.find((m) => m.type === "error")
  assert.ok(error, "保底 catch 发 error")
  assert.match(String(error.text), /boom: setup failure/, "error 携带原始 setup 异常")
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

  // Stop 释放未答卡——questionCancelled 随行 promptId（webview 据此移除正确卡片）
  const p2 = stubPanel({ _abortController: new AbortController() })
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
