/**
 * chat-panel.test.mjs — 真实模块直驱面测试（回合执行 / 索引补全 / 模型决策）。
 *
 * 拆分来源：本档原 621 行 > 500 硬限无豁免——切点判据 = docs/design/LEDGER-SELF-CONTAINED.md
 * D18 四条（§5 D18 行；实施轮 E）：面板入口（消息 / 控制 / 状态）面用例
 * 逐字迁出至 test/chat-panel-messages.test.mjs（桩面板驱动——夹具自持）。
 *
 * 本档留存用例（真实生产模块直驱——无桩面板）：
 *   ④ 错误不悬挂（F-C1a/H-B 回归红线——真 ChatPanel 原型 + 真 runPanelChat——隔离
 *      config / 会话目录）；
 *   ⑥ atComplete seq（F-C1c/H-A——真 atComplete + findFiles 桩）；
 *   ⑨⑩ A2 标题回合内（F-A2 方案 Y——真 runPanelChat 桩测：标题窗口 = busy 测试锁 +
 *      错误路径归位恒执行）；
 *   ⑪ MODEL-MERGE-SESSION 模型 / stamp 决策（评审修复回归——resolveTurnModelAndStamp 直驱）。
 *
 * 夹具自持（D18②）：本档自带临时目录隔离 + `settle` + `a2Panel`——零跨档 import。
 * 用例名 / 编号自原档逐字保留；`test(` 计数守恒 17 = 8（面板入口档）+ 9（本档）。
 * 全部用例 <800ms——直跑即可（slow ≡ test，无归册阈值）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import * as vscode from "vscode"
import { handlePanelMessage } from "../src/extension/panel-messages.mjs"
import { runPanelChat } from "../src/extension/panel-chat.mjs"
import { resolveTurnModelAndStamp } from "../src/extension/turn-model.mjs"
import { atComplete } from "../src/extension/panel-index.mjs"
import { ChatPanel } from "../src/extension/chat-panel.mjs"
import { _setConfigPathForTest } from "@thincoder/core/config.mjs"
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

/** 微任务/短定时冲刷（真实 runPanelChat 的 async 段全为同步体 await——单 setTimeout 足够）。 */
const settle = () => new Promise((r) => setTimeout(r, 10))

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

test("⑨ A2 标题窗口 = busy（F-A2 测试锁 + C-B2-6）：首回合标题 await 期间 _turnState 仍 running——userMessage 入 `_busyQueued` 单槽（不并发——F16 排队注入）；标题完成后才归位", async () => {
  const { p, titleGate } = a2Panel()
  const turn = runPanelChat(p, { text: "first" })
  turn.catch(() => {}) // 防 settle 窗口 unhandled rejection（assert.rejects 稍后接管）
  await settle()
  assert.equal(titleGate.length, 1, "回合尾标题已触发（isFirstMessage——finally 内归位前）")
  assert.equal(p._turnState, "running", "标题 await 期间忙态未归位——仍 running（标题窗口 = busy——修前此点已 idle → 消息直开并发回合）")

  // 标题窗口内 userMessage → 普通回合 busy 面入 `_busyQueued` 单槽（C-B2-6——不并发直发；
  // 归位后由 enterSuspensionTurn 装载：池空 → idle 归位分支续发）
  const realWarn = vscode.window.showWarningMessage
  const warned = []
  vscode.window.showWarningMessage = async (m) => { warned.push(m) }
  try {
    await handlePanelMessage(p, { type: "userMessage", text: "during-title" })
  } finally {
    vscode.window.showWarningMessage = realWarn
  }
  assert.equal(p._chatCalls.length, 0, "标题期间消息不直发 _chat（不并发新回合）")
  assert.deepEqual((p._busyQueued ?? []).map((q) => q.text), ["during-title"], "普通回合 busy ⇒ 入单槽（F16 排队注入——不再拒收）")
  assert.equal(warned.length, 0, "入槽零警告（受理即反馈）")

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
