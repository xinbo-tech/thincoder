/**
 * input-lock.test.mjs — INPUT-LOCK-ASYNC（C'——INPUT-LOCK-ASYNC.md——2026-09-09）
 * + INPUT-LOCK-BEHAVIOR-REVISED（INPUT-LOCK-BEHAVIOR-REVISED.md——2026-09-09 修订——
 * 白名单删——忙时斜杠同禁发）：用例表测试锁：busy（processing 含 digest）提交禁发（吞提交
 * 不吞字符——打字回显）/ 忙时斜杠同吞（/exit 也发不出）/ 空 Enter 静默 / 挂起空闲输入开放
 * （单槽）/ 释放窗口单槽交接 / abort 零丢失 / 状态栏 busy 文案。
 * 手法：createKeyHandler 桩 ctx 直驱按键（无真实 TTY）；suspensionSession 桩 agent/state
 * 直驱驱动循环（ctx.runAgent 注入——runAgentTurn 测试缝——真实单消息交接路径）。快层直跑
 * （<800ms——无定时器悬挂：驱动会话必然终止）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createKeyHandler } from "../src/tui/key-handler.mjs"
import { suspensionSession } from "../src/tui/suspension-drive.mjs"
import { renderStatus } from "../src/tui/render-frame.mjs"
// F-UC8（2026-09-21 信号提示行批 §6.27.12.13 ①–②）：提示行断言以**核容器值**为据（零自持字面）
import { t } from "@thincoder/core/i18n.mjs"

/** 最小按键态。 */
function baseState(over = {}) {
  return {
    input: [], cursor: 0, history: [], historyIndex: -1, _draft: null,
    processing: false, suspended: false, _suspPending: false, pendingInput: [],
    queue: [], subTasks: {}, tasks: [], scroll: 0, _followTail: true,
    ...over,
  }
}

/** createKeyHandler 桩 ctx（submit/提示行记录；唤醒槽 = state._suspWake——真实挂载点）。 */
function keyCtx(state, over = {}) {
  const calls = { submit: 0, wakes: 0, lines: [] }
  state._suspWake ??= () => { calls.wakes++ }
  const base = {
    agent: {},
    state,
    render() {},
    popPicker() {}, renderPickerLines() {},
    handleSlash: async () => {}, handleTab() {},
    submit: async () => { calls.submit++ },
    pasteClipboardImage: async () => {},
    wizardChooseProvider() {}, wizardSubmitText() {}, cancelWizard() {},
    wizardProviderItems: () => [], renderWizard() {},
    pushLine: (text) => calls.lines.push(text),
    cleanup() {}, showPicker() {}, loadOlder() {},
    ...over,
  }
  base.calls = calls
  return base
}

const pressEnter = (kh) => kh("\r", { name: "return" })

// ─── AC-1/AC-4：busy 提交吞 + 忙时斜杠同禁（普通回合 + digest 两态）──────

test("busy（processing）提交禁发：Enter 提交吞 + busy 提示 + 字符保留（AC-1/AC-4——F-3 修订）；digest（processing+suspended）同判据不落 pendingInput；忙时斜杠（/exit）同吞禁发（白名单已删）；空 Enter 静默无提示", () => {
  // 普通回合 busy：打字照进输入框（回显），Enter 吞——文本保留 + busy 提示 + 不 submit
  const s1 = baseState({ processing: true, input: [..."hello"], cursor: 5 })
  const c1 = keyCtx(s1)
  const kh1 = createKeyHandler(c1)
  kh1("h", { name: "h" }) // 字符回显（busy 期可打字）
  assert.deepEqual(s1.input, [..."helloh"], "字符照进输入框回显（吞提交不吞字符）")
  pressEnter(kh1)
  assert.equal(c1.calls.submit, 0, "Enter 提交被吞（不 submit）")
  assert.equal(c1.calls.lines.length, 1, "busy 提示一次")
  assert.match(c1.calls.lines[0], /主会话处理中/, "busy 提示文案含主会话处理中")
  assert.deepEqual(s1.input, [..."helloh"], "吞提交不清框（文本保留——回合结束重按 Enter）")

  // digest 两态（suspended && processing）：同一 processing 判据——吞——不落 pendingInput
  const s2 = baseState({ processing: true, suspended: true, input: [..."during-digest"] })
  const c2 = keyCtx(s2)
  pressEnter(createKeyHandler(c2))
  assert.equal(c2.calls.submit, 0, "digest 期 Enter 提交吞（F-1 单一判据）")
  assert.equal(s2.pendingInput.length, 0, "digest 期不排队（旧 D-S5 入队已废——禁排队）")
  assert.match(c2.calls.lines[0], /主会话处理中/, "digest 期 busy 提示同文案")

  // 忙时斜杠同禁发（INPUT-LOCK-BEHAVIOR-REVISED——白名单直执行已删——/exit 也吞——退出靠 Ctrl+C）
  const s3 = baseState({ processing: true, input: [..."/exit"] })
  const c3 = keyCtx(s3)
  pressEnter(createKeyHandler(c3))
  assert.equal(c3.calls.submit, 0, "忙时 /exit 提交被吞（斜杠同禁发——白名单删）")
  assert.equal(c3.calls.lines.length, 1, "忙时斜杠同 busy 提示一次")
  assert.match(c3.calls.lines[0], /主会话处理中/, "斜杠吞提示同文案")
  assert.deepEqual(s3.input, [..."/exit"], "吞后文本保留输入框（回合结束重按）")

  // 空 Enter busy：无提示无动作（静默——不刷屏）
  const s4 = baseState({ processing: true })
  const c4 = keyCtx(s4)
  pressEnter(createKeyHandler(c4))
  assert.equal(c4.calls.lines.length, 0, "空提交无 busy 提示")

  // 多行换行 Enter（meta+return——Shift+Enter 翻译形）busy 期照常编辑（插入 \n——不吞不提示）
  const s5 = baseState({ processing: true, input: [..."draft"], cursor: 5 })
  const c5 = keyCtx(s5)
  createKeyHandler(c5)("\r", { name: "return", meta: true })
  assert.deepEqual(s5.input, [..."draft", "\n"], "meta+Enter 插新行（编辑放行——F-3 吞提交不吞编辑）")
  assert.equal(c5.calls.lines.length, 0, "多行编辑无 busy 提示")
  assert.equal(c5.calls.submit, 0, "多行编辑不提交")
})

// ─── AC-2：挂起空闲输入开放（单槽）+ 释放窗口同路径 + 槽满吞 ────────────

test("挂起空闲输入开放：Enter 填 pendingInput 单槽 + 唤醒（AC-2——F-6）；释放窗口（_suspPending）同路径；槽满吞 + 提示（文本保留——不覆盖不丢失）；斜杠命令挂起空闲直走 submit", () => {
  // 挂起空闲（纯后台池跑——主空闲）：立即接收入单槽——唤醒 driver
  const s1 = baseState({ suspended: true, input: [..."pool-wait-msg"] })
  const c1 = keyCtx(s1)
  pressEnter(createKeyHandler(c1))
  assert.deepEqual(s1.pendingInput, ["pool-wait-msg"], "单槽填入（至多一条待交接）")
  assert.equal(c1.calls.wakes, 1, "唤醒 driver（waitForSettleOrWake）")
  assert.deepEqual(s1.input, [], "输入框已清空（用户视为已发送——气泡由回合起点补画）")
  assert.equal(c1.calls.submit, 0, "挂起 Enter 不经 submit")

  // 释放窗口（_suspPending——回合尾池仍 live）：同路径（单槽交接守卫保留——F-8）
  const s2 = baseState({ _suspPending: true, input: [..."window-msg"] })
  const c2 = keyCtx(s2)
  pressEnter(createKeyHandler(c2))
  assert.deepEqual(s2.pendingInput, ["window-msg"], "释放窗口 Enter 入单槽（偏差 #1 守卫语义保留）")

  // 槽满：第二条吞 + 提示——文本保留（不覆盖不静默丢）
  const s3 = baseState({ suspended: true, pendingInput: ["first"], input: [..."second"] })
  const c3 = keyCtx(s3)
  pressEnter(createKeyHandler(c3))
  assert.deepEqual(s3.pendingInput, ["first"], "槽满不覆盖（单槽不变量）")
  assert.deepEqual(s3.input, [..."second"], "被吞文本保留在输入框")
  assert.match(c3.calls.lines[0], /待发送/, "槽满提示明示")

  // 挂起空闲斜杠命令：submit 直行（submit 侧 handleSlash——控制通道）
  const s4 = baseState({ suspended: true, input: [..."/help"] })
  const c4 = keyCtx(s4)
  pressEnter(createKeyHandler(c4))
  assert.equal(c4.calls.submit, 1, "挂起态斜杠命令经 submit（紧急控制不排队）")
})

// ─── AC-5：单槽交接（释放窗口）+ abort 零丢失（suspensionSession 直驱）───

/** 最小驱动 ctx/agent/state（runAgentTurn 测试缝——ctx.runAgent 注入——不触网）。 */
function driveRig(pendingInput = []) {
  const agent = {
    _asyncSubagents: new Map([[1, { id: 1, role: "subagent", status: "running" }]]),
    _asyncAdvisors: new Map(),
    _sessionAbort: new AbortController(),
    _sessionAbortAll: [],
    _suspended: false,
    title: "locked", // ensureSessionTitle 短路（不触网）
    history: [],
  }
  const state = baseState({ pendingInput, suspended: false, queue: [] })
  const turns = []
  const lines = []
  const ctx = {
    agent,
    state,
    render() {},
    pushLine: (t) => lines.push(t),
    pushLabel() {},
    ensureAssistantLabel() {},
    scheduleRender() {},
    askPermission: null, askBatchPermission: null, askQuestion: null,
    handleSlash: null,
    runAgent: async (_a, text) => { turns.push(String(text)) },
    saveSession: async () => {},
  }
  return { agent, state, ctx, turns, lines }
}

test("单槽交接：driver 消费 pendingInput 单条即开回合（原文直发——无合并包裹）；abort 零丢失：中止时单槽残余转 state.queue + 提示（AC-5——F-8/AC-S2）", async () => {
  // 单槽交接：driver 挂起等待 → 消息入槽 + 唤醒 → 消费清槽 → 以原文开回合
  const { agent, state, ctx, turns } = driveRig()
  const session = suspensionSession(ctx)
  await new Promise((r) => setTimeout(r, 5)) // driver 进入 waitForSettleOrWake
  state.pendingInput.push("handover-msg")
  state._suspWake?.()
  await new Promise((r) => setTimeout(r, 15)) // 消费 + runAgentTurn（stub）微任务链
  assert.deepEqual(turns, ["handover-msg"], "driver 以原文单消息开回合（无合并/编号包裹——R15 废弃）")
  assert.equal(state.pendingInput.length, 0, "消费清槽")
  // 会话终止（_suspAborted + 唤醒）——防悬挂
  state._suspAborted = true
  state._suspWake?.()
  await session
  assert.equal(state.suspended, false, "会话退出复位 suspended")

  // abort 零丢失：中止前单槽已有消息（Enter 已清框入槽——用户视为已发送）→ 转 state.queue
  const r2 = driveRig(["keep-me"])
  r2.agent._sessionAbort.abort() // 驱动首行 while 条件即假——直接走 finally 中止路径
  await suspensionSession(r2.ctx)
  assert.deepEqual(r2.state.queue, [{ text: "keep-me" }], "中止残余单消息转正队列（下个普通回合续发——零丢失）")
  assert.equal(r2.lines.length, 1, "提示行明示去向")
  assert.match(r2.lines[0], /will run as a normal turn/, "abort 提示文案（不静默丢）")
})

// ─── F-UC7 上行通道默认流可用性（§6.27.12——2026-09-19 批）：CLI 驱动开轮 ──────
// 未 drain 的 ask（子代理在飞提问）= 第二开轮源：谓词先于池空退出判 ⇒ ask 入队即开
// auto 轮 drain 注入（唤醒 + 谓词两件一组）；旗标 `upstreamTurn` 经 agent-turn 跳贯通到
// 核 `runAgent`（域文本选择面——本轮由 CLI 面机检）。

/** 上行唤醒轮夹具：`driveRig` + 记录 `(text, opts)` 第 4 参的桩。
 *  桩内模拟核消费（`thincoder-core/agent.mjs:226-228`——回合头 drain「消费即清」；
 *  桩不模拟则谓词恒真、驱动连开轮——真实现里队列由核 drain 关闭）。 */
function upstreamRig(agentOver = {}) {
  const rig = driveRig()
  Object.assign(rig.agent, agentOver)
  const calls = []
  rig.ctx.runAgent = async (_a, text, _cb, opts) => {
    calls.push({ text: String(text), opts: { ...(opts ?? {}) } })
    rig.agent._childUpstream = [] // 核回合头 drain（:228——消费即清）
    rig.agent._pendingAsyncResults = [] // 核 run 首行注入（:111-122——消费即清）
  }
  return { ...rig, calls }
}

/** 会话退出（防悬挂）：置中止标志 + 唤醒等待栓 → await 会话。 */
async function exitSession(rig) {
  rig.state._suspAborted = true
  rig.state._suspWake?.()
  await rig.session
}

/** 跑一拍后交给断言块——无论断言成败都收口会话（不泄漏驱动 1s tick interval）。 */
async function withSession(rig, fn) {
  rig.session = suspensionSession(rig.ctx)
  try {
    await new Promise((r) => setTimeout(r, 10))
    await fn()
  } finally {
    await exitSession(rig)
  }
}

/** 自然退出用例：等会话**自行退出**再断言（不依赖墙钟——会话 finally 内含冷动态 import，
 *  固定睡眠窗口不可靠；2s 上界仅防悬挂（收口即清——不滞留定时器），不开轮则断言自然红）。 */
async function withClosedSession(rig, fn) {
  rig.session = suspensionSession(rig.ctx)
  let cap = null
  try {
    await Promise.race([rig.session, new Promise((r) => { cap = setTimeout(r, 2000) })])
    await fn()
  } finally {
    clearTimeout(cap)
    await exitSession(rig)
  }
}

test("T-CL-U1 正常·CLI 驱动开轮 + 旗标贯通：未 drain 的 ask ⇒ auto 轮恰 1 次 + 桩第 4 参 `upstreamTurn === true`（CLI 跳未丢弃）+ ask 档携参提示行；池空 + ask 留队仍开轮（§6.27.12.5 D / §6.27.12.13 ②）", async () => {
  const ask = { seq: 1, from: "explore#1", kind: "ask", message: "先定 X 还是 Y？", ts: Date.now() }
  // ① 池内 1 running + ask 留队
  const rig = upstreamRig({ _childUpstream: [{ ...ask }] })
  await withSession(rig, () => {
    assert.equal(rig.calls.length, 1, "未 drain 的 ask ⇒ 恰开一轮（谓词先于池空退出判）")
    assert.equal(rig.calls[0].text, "", "auto 轮文本为空（系统驱动——无用户输入）")
    assert.equal(rig.calls[0].opts.autoTurn, true, "auto 轮分类不变")
    assert.equal(rig.calls[0].opts.upstreamTurn, true, "旗标贯通到核 runAgent（CLI 跳未丢弃——可机检）")
    assert.equal(
      rig.lines[0], t("digest.turnLabelAsk", { from: "explore#1", msg: "先定 X 还是 Y？" }, "en"),
      "ask 档提示行携「谁 + 啥」（核容器字面——零自持）",
    )
  })

  // ② 池空 + ask 留队（子代理已 settle 且报告已消化）：仍开一轮把它 drain 出来 ⇒ 自然退出
  const bare = upstreamRig({ _childUpstream: [{ ...ask }] })
  bare.agent._asyncSubagents.clear()
  await withClosedSession(bare, () => {
    assert.equal(bare.calls.length, 1, "池空 + ask 留队仍开一轮（谓词先于池空退出判——硬约束）")
    assert.equal(bare.calls[0].opts.upstreamTurn, true, "同判：旗标贯通")
    assert.equal(bare.state.suspended, false, "会话自然退出复位 suspended")
  })
})

test("T-CL-U2 边界·按因分流 + 不误开轮：仅 note ⇒ 0 轮 0 提示行；ask 档携参字面；digest 档字面零改（manual / AUTO **同判**——泛句退场）（§6.27.12.9 / §6.27.12.13 ①）", async () => {
  // ① 仅 note：无时效义务 ⇒ 不开轮（note 不唤醒——边界 7）
  const note = upstreamRig({ _childUpstream: [{ seq: 1, from: "explore#1", kind: "note", message: "FYI：前提失效" }] })
  await withSession(note, () => {
    assert.equal(note.calls.length, 0, "note ⇒ 零轮（谓词只认 ask）")
    assert.equal(note.lines.length, 0, "零轮 ⇒ 零提示行")
  })

  // ② manual 档 ask ⇒ 携参标签行（核单点 `upstreamAskLabelVars`）
  const askRig = upstreamRig({ _childUpstream: [{ seq: 1, from: "explore#1", kind: "ask", message: "q" }] })
  await withSession(askRig, () => {
    assert.equal(
      askRig.lines[0], t("digest.turnLabelAsk", { from: "explore#1", msg: "q" }, "en"),
      "ask 档携参字面（manual）",
    )
  })

  // ③ digest 档字面零改（manual 档 · pending 非空 · 无 ask）
  const digestRig = upstreamRig({ _pendingAsyncResults: [{ role: "subagent", id: 2 }] })
  await withSession(digestRig, () => {
    assert.equal(digestRig.lines[0], t("digest.turnLabel", {}, "en"), "digest 档字面零改（manual）")
  })

  // ④ AUTO × digest：**同判**（§6.27.12.13 ①——泛句退场，AUTO 得 digest 档字面）
  const autoRig = upstreamRig({ autoApprove: true, _pendingAsyncResults: [{ role: "subagent", id: 3 }] })
  await withSession(autoRig, () => {
    assert.equal(autoRig.lines[0], t("digest.turnLabel", {}, "en"), "AUTO × digest 与 manual 逐字同")
  })

  // ⑤ AUTO × ask：同判（与 ② 逐字同——泛句无生产者）
  const autoAskRig = upstreamRig({ autoApprove: true, _childUpstream: [{ seq: 1, from: "explore#1", kind: "ask", message: "q" }] })
  await withSession(autoAskRig, () => {
    assert.equal(
      autoAskRig.lines[0], t("digest.turnLabelAsk", { from: "explore#1", msg: "q" }, "en"),
      "AUTO × ask 与 manual 逐字同（泛句退场）",
    )
  })
})

// ─── 中止丢弃（批 4 CLI-ASYNC-DISCARD——§6.20 接线点②）────────────────

/** 已中止 controller（死条目夹具——`parentAborted` controller 支实判面）。 */
function aborted() {
  const c = new AbortController()
  c.abort()
  return c
}

/** 隔离日志目录内 `ev:discarded` 事件行（写门 override——NODE_TEST_CONTEXT 默认不写盘）。 */
function discardedEvents(dir) {
  const out = []
  for (const n of readdirSync(dir)) {
    for (const line of readFileSync(join(dir, n), "utf8").split("\n")) {
      if (!line.trim()) continue
      try { const e = JSON.parse(line); if (e.ev === "ev:discarded") out.push(e) } catch { /* 半行（并发写）忽略 */ }
    }
  }
  return out
}

test("中止丢弃（接线点②）：只清已死条目——出池 + discarded 墓碑 + 两族各一条提醒/事件；存活条目留池", async (t) => {
  const { agent, state, ctx } = driveRig()
  const dead = { id: 7, role: "explore", status: "running", controller: aborted() }
  const queued = { id: 9, role: "explore", status: "queued", position: 1, controller: aborted() }
  const live = { id: 8, role: "eng-coder", status: "running", controller: new AbortController() }
  agent._asyncSubagents.clear()
  for (const e of [dead, queued, live]) agent._asyncSubagents.set(String(e.id), e)
  agent._asyncQueue = [queued]
  agent._asyncAdvisors.set("5", { id: 5, role: "advisor", status: "running", reviewType: "design", controller: aborted() })
  const logDir = mkdtempSync(join(tmpdir(), "tc-susp-discard-"))
  t.after(() => { try { rmSync(logDir, { recursive: true, force: true }) } catch { /* ignore */ } })
  process.env.THINCODER_LOG_DIR = logDir
  agent._sessionAbort.abort() // 会话 Stop（首行 while 条件即假——直接走 finally 中止路径）
  try {
    await suspensionSession(ctx)
  } finally {
    delete process.env.THINCODER_LOG_DIR
  }

  // 只清已死：死条目（running + queued）出池、存活留池
  assert.deepEqual([...agent._asyncSubagents.values()], [live], "已死条目出池、存活条目留池")
  assert.equal(agent._asyncQueue.length, 0, "队列剔除（唯一排队条目已死）")
  assert.equal(agent._asyncAdvisors.size, 0, "评审池死条目出池")
  // 丢弃终态墓碑（读面 = agent 对象自身 Map——写入面同容器）
  assert.equal(agent._asyncTombstones.get("7").status, "discarded")
  assert.equal(agent._asyncTombstones.get("9").status, "discarded", "排队死条目同判")
  assert.equal(agent._asyncTombstones.get("5").status, "discarded", "评审族同判")
  assert.equal(agent._asyncTombstones.has("8"), false, "存活条目不写墓碑")
  // 提醒：两族各一条 user 注入（整批一次）
  const notices = agent.history.filter((m) => m.role === "user" && String(m.content).includes("discarded by the user's Stop"))
  assert.equal(notices.length, 2, `两族各一条提醒：\n${agent.history.map((m) => String(m.content).slice(0, 70)).join("\n")}`)
  assert.match(notices[0].content, /explore#9 \(was queued — never started\)/, "名单带 id + 未启动词（队列剔除同时入名单）")
  assert.match(notices[0].content, /explore#7 \(was running\)/, "running 词在位")
  assert.match(notices[1].content, /advisor#5 \(design\) \(was running\)/, "评审族带 reviewType")
  // 事件：两族各一条（n = 该族丢弃数）+ 中止清池事件
  assert.deepEqual(discardedEvents(logDir).map((e) => e.n), [2, 1], "两族各一条 ev:discarded")
  assert.equal(state.suspended, false, "会话退出复位 suspended")
})

// ─── busy 提示文案：状态栏（F-3——取代 (queue) 提示）──────────────

test("busy 状态栏文案：processing → 主会话处理中（Enter 提交禁用——无 (queue) 提示——F-7）；空闲 → Enter: send", () => {
  const agent = { provider: null, cwd: "x", autoApprove: false, planMode: false, config: null, _currentTurn: 0, _maxTurns: 0 }
  const st = () => ({
    processing: true, status: "Processing...", processingStarted: Date.now(), currentTool: null,
    input: [], scroll: 0, tasks: [], queue: [],
    tokens: { prompt: 0, completion: 0, cacheHit: 0, cacheMiss: 0, reasoningTokens: 0 },
    ctxCache: { tokens: 0 },
  })
  const busy = renderStatus(st(), agent, 120, [])
  assert.match(busy, /主会话处理中/, "busy 文案（主会话处理中）")
  assert.ok(!busy.includes("(queue)"), "排队提示零残留")
  assert.ok(!busy.includes("queue:"), "排队计数提示零残留")
  const idle = renderStatus({ ...st(), processing: false, status: "Ready" }, agent, 120, [])
  assert.match(idle, /Enter: send/, "空闲 Enter: send")
})
