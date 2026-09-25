/**
 * async-parity.test.mjs — 第 35 批（GitHub #6）VSC async 子代理保真机器验收。
 * 设计权威：机制现行面 = `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.7.3 / `AGENT-LOOP-ASYNC-POOL.md` §6.20；
 * 本批契约 C-1~C-9 / 用例 T-D1~T-D10 / AC-G1~G7 + AC-N1~N4 / 群 B 批 B1（advisor 池同构面
 * C-10 / T-D11~T-D13 / AC-B1-1~AC-B1-4）= 批次材料；批次档 `thincoder-cli/docs/batches/2026-09-11-VSC-ASYNC-PARITY.md` §2
 * + `thincoder-cli/docs/batches/2026-09-11-VSC-REVIEW-ASYNC-SWEEP.md` §2。
 *
 * 手法（三条缝，全部零网络）：
 * ① 直驱纯函数——`discardAbortedPool`（T-D3/T-D4）、`discardAbortedAdvisors`（T-D12）、
 *    `depInfo`（T-D9）、`finalizeAgentTurn`（T-D5/T-D6/T-D11：真收尾函数 + 桩池夹具）；
 * ② 工具/批执行缝——`subagentTool.execute` 的桩 `ctx.runAgent`（T-D1：running/queued 两
 *    形态真 spawn）+ `executeToolBatches` 假工具（T-D2：类型守卫）+ status 直驱
 *    （T-D8/T-D13）；
 * ③ 挂起驱动缝——桩面板 + mock `runTurn`（T-D7：digest 轮 AbortError 容忍）；
 *    桩面板 + `handlePanelMessage`（T-D10：现状锁）。
 * 事件断言（T-D5/T-D7/T-D11/T-D12）= THINCODER_LOG_DIR 隔离目录读档（log.test 同款；
 * delta 计数）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, readFileSync, readdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import * as vscode from "vscode"
import files from "./files.mjs"
// W13（2026-09-15）：本档驱面全部改指核单源（原端侧 subagent/subagent-actions/subagent-scheduler
// 镜像删旧）——工具面 = 核 subagentTool + 装配面装饰 `vscSubagentFace`（#99 去 panel + C-5 终态回显）。
import { subagentTool as coreSubagentTool } from "@thincoder/core/agent-tools/subagent.mjs"
import { executeStatusAction } from "@thincoder/core/agent-tools/subagent-actions.mjs"
import { depInfo } from "@thincoder/core/agent-tools/subagent-scheduler.mjs"
import { tombstoneOf, writeTombstone } from "@thincoder/core/agent-tools/async-settle.mjs"
import { discardAbortedPool, discardAbortedAdvisors } from "../src/agent-tools/async-discard.mjs"
import { vscSubagentFace } from "../src/agent/setup.mjs"
import { finalizeAgentTurn } from "../src/agent/run-stages.mjs"
import { executeToolBatches } from "../src/agent/execute-tools.mjs"
import { suspensionSession } from "../src/extension/suspension.mjs"
import { handlePanelMessage } from "../src/extension/panel-messages.mjs"

/** 端面工具（生产同面：核工具 + 装配装饰——C-5 终态回显 / 谓词 / 去 panel）。 */
const subagentTool = vscSubagentFace(coreSubagentTool)

let _tmp
let _logDir

before(() => {
  _tmp = mkdtempSync(join(tmpdir(), "tc-async-parity-"))
  _logDir = join(_tmp, "logs")
  // logEvent 写门（NODE_TEST_CONTEXT 下默认跳过）——ev:stopped / ev:discarded /
  // digest:stopped 断言用；隔离目录防污染真实诊断日志。
  process.env.THINCODER_LOG_DIR = _logDir
})

after(() => {
  delete process.env.THINCODER_LOG_DIR
  try { rmSync(_tmp, { recursive: true, force: true }) } catch { /* ignore */ }
})

/** 事件行检索（隔离目录跨所有日文件；调用方按 delta 断言——防同进程跨用例串扰）。 */
function logEvents(ev) {
  let names = []
  try { names = readdirSync(_logDir) } catch { return [] }
  const out = []
  for (const n of names) {
    for (const line of readFileSync(join(_logDir, n), "utf8").split("\n")) {
      if (!line.trim()) continue
      try {
        const e = JSON.parse(line)
        if (e.ev === ev) out.push(e)
      } catch { /* 半行（并发写）忽略 */ }
    }
  }
  return out
}

// ─── 夹具 ─────────────────────────────────────────────────────────────────────

/** 已中止 signal（死条目之一源：条目 signal = 轮/会话 signal）。 */
function abortedSignal() { const c = new AbortController(); c.abort(); return c.signal }
/** 已中止 controller（死条目之二源：条目级 controller——队列条目无 signal）。 */
function abortedController() { const c = new AbortController(); c.abort(); return c }

/** 池条目夹具（spawnAsyncSubagent 真形状子集——C-1 读的四个字段全在）。 */
function mkEntry(over = {}) {
  return {
    id: 1, role: "explore", status: "running", done: false, cancelled: false,
    report: null, error: null, signal: null, controller: new AbortController(),
    ...over,
  }
}

/** advisor 池条目夹具（advisor-async launch 真形状子集——C-10 读的字段全在；无 signal
 *  字段——谓词走 controller 支）。 */
function mkAdvisor(over = {}) {
  return {
    id: 101, role: "advisor", status: "running", done: false, cancelled: false,
    reviewType: "design", reviewId: "did-fixture", round: 1, report: null, error: null,
    controller: new AbortController(),
    ...over,
  }
}

/** 双载体父（真形状：history 数组兼挂池，agent 字段 alias 同一 Map——agent.mjs 绑定不变式）。
 *  W13：池键 = 核形 String(id)（原端侧为数字键——夹具随改指同步）。 */
function mkParent({ entries = [], tombstones = null, advisors = [] } = {}) {
  const history = []
  history._asyncSubagents = new Map(entries.map((e) => [String(e.id), e]))
  history._asyncAdvisors = new Map(advisors.map((e) => [String(e.id), e]))
  if (tombstones) history._asyncTombstones = new Map(tombstones)
  return {
    history,
    agent: {
      history, cwd: process.cwd(), config: { agent: { engineering: false } },
      _asyncSubagents: history._asyncSubagents, _asyncAdvisors: history._asyncAdvisors,
      _subAgentCounter: 0,
    },
  }
}

// ═══ T-D1（AC-G1/F-G1）：async spawn ack 契约锁 ═══════════════════════════
// W13（2026-09-15）退役：原两例经端侧工具 `ctx.runAgent` 测试缝驱真 spawn——镜像删旧后工具面 = 核
// `subagentTool`，核 spawn 硬接核 `runAgent`（无 ctx 缝——`subagent-async.mjs:289`），单测无法零网络
// 驱动。同门恒等覆盖仍存：核测试树（子代理族）+ 本仓 `test/integration/scenario-03-subagent-lifecycle.test.mjs`
// （真装配面 spawn/ack/池键——夹具 provider）。

// ═══ T-D2（AC-G2/F-G2）：工具结果类型守卫 ═══════════════════════════════════

test("T-D2 错误：工具返回对象/undefined → Error: … must return a string value（无 [object Object]）；字符串正控原样", async () => {
  const run = async (tool) => {
    const history = []
    await executeToolBatches({ cwd: process.cwd(), history: {}, config: {}, _touchedFiles: [] }, {
      response: { toolCalls: [{ id: "t1", name: tool.name, arguments: "{}" }] },
      history, fullHistory: [], toolByName: new Map([[tool.name, tool]]),
      getAuto: () => true, callbacks: {}, cwd: process.cwd(), recentSigs: [], depth: 0,
    })
    return String(history.find((m) => m.role === "tool")?.content ?? "")
  }
  const objOut = await run({ name: "objtool", readonly: true, execute: async () => ({ some: "object" }) })
  assert.ok(objOut.startsWith("Error:"), `对象返回 → Error 前缀（模型可见——实到 ${objOut.slice(0, 80)}）`)
  assert.ok(objOut.includes("must return a string value"), "C-7 文案锚（逐字）")
  assert.ok(!objOut.includes("[object Object]"), "不再静默 String(raw) 成 [object Object]")
  const undefOut = await run({ name: "undeftool", readonly: true, execute: async () => undefined })
  assert.ok(undefOut.startsWith("Error:") && undefOut.includes("must return a string value"), "undefined 同判")
  assert.ok(undefOut.includes("undefined"), "类型信息可读（定位返回方）")
  assert.equal(await run({ name: "oktool", readonly: true, execute: async () => "fine" }), "fine", "正控：字符串工具原样通过")
})

// ═══ T-D3（AC-G4/F-G4）：只清已死 ═════════════════════════════════════════

test("T-D3 边界：四条目池——只清死 running/死 queued（discarded 2 / kept 2）；活条目与 done 留池；墓碑恰 2 条", () => {
  const deadRunning = mkEntry({ id: 1, role: "explore", status: "running", signal: abortedSignal() })
  const deadQueued = mkEntry({ id: 2, role: "plan", status: "queued", controller: abortedController() })
  const liveRunning = mkEntry({ id: 3, role: "coder", status: "running", signal: new AbortController().signal })
  const doneInPool = mkEntry({ id: 4, role: "eng-coder", status: "done", done: true })
  const { agent, history } = mkParent({ entries: [deadRunning, deadQueued, liveRunning, doneInPool] })

  const out = discardAbortedPool(agent)
  assert.deepEqual(out.discarded.map((d) => [d.id, d.role, d.wasStatus]),
    [[1, "explore", "running"], [2, "plan", "queued"]], "C-2 返回摘要（wasStatus ∈ running|queued）")
  assert.equal(out.kept, 2, "判定后仍在池 = 2（T-D3 断言）")
  assert.equal(history._asyncSubagents.has("1"), false, "死 running 出池")
  assert.equal(history._asyncSubagents.has("2"), false, "死 queued 出池")
  assert.equal(history._asyncSubagents.has("3"), true, "存活条目留池（会话 signal 未中止——F-6 一致）")
  assert.equal(history._asyncSubagents.has("4"), true, "done-in-pool 留池（报告沿自动通道到达）")
  const tombs = history._asyncTombstones
  assert.equal(tombs.size, 2, "墓碑恰 2 条")
  assert.deepEqual(tombs.get("1"), { status: "discarded", role: "explore" })
  assert.deepEqual(tombs.get("2"), { status: "discarded", role: "plan" })
  assert.deepEqual(tombstoneOf(agent, 1), { status: "discarded", role: "explore" }, "读取器同源（C-3）")
})

// ═══ T-D4（AC-G3/F-G3）：丢弃提醒 ═════════════════════════════════════════

test("T-D4 正常：整批恰一条 user-role 提醒（两 role#id + will NOT arrive + discarded）+ XML 转义；零丢弃零注入", () => {
  const { agent, history } = mkParent({
    entries: [
      mkEntry({ id: 1, role: "explore", status: "running", signal: abortedSignal() }),
      mkEntry({ id: 2, role: "plan", status: "queued", controller: abortedController() }),
      mkEntry({ id: 3, role: "coder", status: "running", signal: new AbortController().signal }),
    ],
  })
  discardAbortedPool(agent)
  const reminders = history.filter((m) => m?.role === "user")
  assert.equal(reminders.length, 1, "整批一次注入（不是逐条）")
  const body = reminders[0].content
  assert.match(body, /^\[System reminder: 2 background subagent\(s\) were discarded by the user's Stop — their reports will NOT arrive: /, "C-4 模板头逐字")
  assert.match(body, /explore#1 \(was running\)/, "running 括号词")
  assert.match(body, /plan#2 \(was queued — never started\)/, "queued 括号词")
  assert.match(body, /will NOT arrive/)
  assert.match(body, /re-spawn if the work is still needed\.\]$/, "模板尾逐字")
  assert.equal(body.includes("\n"), false, "单条文本（无换行——词间单空格）")

  // XML 转义（注入面与 cancel 提醒同形态：escapeXml）
  const evil = mkParent({ entries: [mkEntry({ id: 9, role: 'x<&">', status: "running", signal: abortedSignal() })] })
  discardAbortedPool(evil.agent)
  const esc = evil.history.find((m) => m.role === "user").content
  assert.ok(esc.includes("x&lt;&amp;&quot;&gt;#9"), "XML 转义生效（C-4：escapeXml 后注入）")
  assert.ok(!esc.includes('x<&"'), "原始特殊字符不入注入面")

  // 零丢弃 → 零注入（C-4 末句）
  const none = mkParent({ entries: [mkEntry({ id: 5, status: "running", signal: new AbortController().signal })] })
  const r = discardAbortedPool(none.agent)
  assert.deepEqual(r, { discarded: [], kept: 1 }, "零丢弃（全留）")
  assert.equal(none.history.filter((m) => m?.role === "user").length, 0, "零丢弃零噪音")
})

// ═══ T-D5/T-D6（AC-G4/F-G3+F-G4）：中止分支接线 + 载体不变式 ═══════════════

test("T-D5 正常：finalizeAgentTurn（abort 非 interrupt）→ 死条目出池+墓碑；活条目留池；ev:stopped 与 ev:discarded 各一条", async () => {
  const { agent, history } = mkParent({
    entries: [
      mkEntry({ id: 1, role: "explore", status: "running", signal: abortedSignal() }),
      mkEntry({ id: 3, role: "coder", status: "running", signal: new AbortController().signal }),
      mkEntry({ id: 4, role: "eng-coder", status: "done", done: true }),
    ],
  })
  const ctrl = new AbortController()
  ctrl.abort() // 全停（无 interrupt reason）——收尾中止分支
  const beforeStopped = logEvents("ev:stopped").length
  const beforeDiscarded = logEvents("ev:discarded").length

  await finalizeAgentTurn(agent, { signal: ctrl.signal, history, fullHistory: [], cwd: process.cwd(), depth: 0 })

  assert.equal(history._asyncSubagents.has("1"), false, "死条目出池")
  assert.equal(history._asyncSubagents.has("3"), true, "活条目留池（原 clear() 会孤儿化它）")
  assert.equal(history._asyncSubagents.has("4"), true, "done-in-pool 留池")
  assert.deepEqual(history._asyncTombstones.get("1"), { status: "discarded", role: "explore" }, "丢弃留痕")
  assert.equal(history.filter((m) => m?.role === "user").length, 1, "提醒同点注入（模型可见）")
  assert.equal(logEvents("ev:stopped").length - beforeStopped, 1, "ev:stopped 恰一条（既有事件不变）")
  assert.equal(logEvents("ev:discarded").length - beforeDiscarded, 1, "ev:discarded 恰一条")
})

test("T-D6 边界：depth===0 收尾后 history._asyncSubagents === agent._asyncSubagents 且 size>0（载体不变式）", async () => {
  const { agent, history } = mkParent({
    entries: [mkEntry({ id: 1, role: "explore", signal: abortedSignal() }), mkEntry({ id: 3, role: "coder" })],
  })
  const ctrl = new AbortController()
  ctrl.abort()
  await finalizeAgentTurn(agent, { signal: ctrl.signal, history, fullHistory: [], cwd: process.cwd(), depth: 0 })
  assert.equal(history._asyncSubagents, agent._asyncSubagents, "池未被摘除/未换 Map（回写保留）")
  assert.ok(history._asyncSubagents.size > 0, "存活条目仍在池")
})

// ═══ T-D7（AC-G5/F-G5）：digest 轮 AbortError 容忍 ═════════════════════════

/** 挂起会话桩（digest-visibility 同形：桩面板 + 桩 lines/runTurn）。 */
function suspFixture(pool = {}) {
  const posted = []
  const panel = {
    posted,
    _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } },
    _abortController: null,
    _turnControllers: [],
  }
  const history = []
  history._suspended = false
  history._pendingAsyncResults = pool.pending ?? []
  history._asyncSubagents = pool.subagents ?? new Map()
  const entry = { lines: { history, fullHistory: [] }, cwd: process.cwd(), runTurn: async () => {} }
  return { panel, history, entry }
}
const digestMsgs = (panel) => panel.posted.filter((m) => m.type === "digest")

test("T-D7 正常/错误：① digest 轮 AbortError → 会话不退出（重入循环至池空自然退出）② 非 AbortError 照旧上抛", async () => {
  // ① AbortError：pending 非空 + 池 live——第一轮被 Stop（AbortError）→ continue；
  //    第二轮消费完毕 → 池空 + 无 pending → 步骤 3 自然退出（不搁置会话）。
  const f1 = suspFixture({
    pending: [{ id: 1, role: "explore" }],
    subagents: new Map([["1", mkEntry({ id: 1, role: "explore" })]]),
  })
  let calls = 0
  f1.entry.runTurn = async () => {
    calls++
    if (calls === 1) { const e = new Error("stopped"); e.name = "AbortError"; throw e }
    f1.history._pendingAsyncResults = []
    f1.history._asyncSubagents.clear()
  }
  const beforeStoppedLog = logEvents("digest:stopped").length
  await suspensionSession(f1.panel, f1.entry) // ① 不抛 = 会话未退出
  assert.equal(calls, 2, "AbortError 后重入循环（会话未搁置——池空才退出）")
  assert.equal(logEvents("digest:stopped").length - beforeStoppedLog, 1, "digest:stopped 恰一条")
  assert.deepEqual(digestMsgs(f1.panel).map((m) => [m.status, m.ok]),
    [["start", undefined], ["end", false], ["start", undefined], ["end", true]],
    "被停轮 end ok:false（无「仍在消化」假象）+ 续轮正常收尾")

  // ② 非 AbortError → 照旧上抛（digest-visibility T-D3 契约零变）
  const f2 = suspFixture({ pending: [{ id: 9, role: "plan" }], subagents: new Map() })
  f2.entry.runTurn = async () => { f2.history._pendingAsyncResults = []; throw new Error("digest boom") }
  await assert.rejects(() => suspensionSession(f2.panel, f2.entry), /digest boom/, "异常照旧上抛（不吞）")
})

// ═══ T-D8（AC-G6/F-G6）：status 终态回显 ═══════════════════════════════════

test("T-D8 正常/边界：status 单查四终态回显（discarded/cancelled/consumed/failed）+ 无记录仍 unknown + 无 id 概览形态零变", async () => {
  const { agent, history } = mkParent({
    tombstones: [
      ["41", { status: "discarded", role: "explore" }],
      ["42", { status: "cancelled", role: "eng-coder" }],
      ["43", { status: "consumed", role: "plan" }],
      ["44", { status: "failed", role: "coder" }],
    ],
  })
  const ctx = { agent, cwd: process.cwd(), depth: 0 }
  const one = async (id) => JSON.parse(await subagentTool.execute({ action: "status", id }, ctx))

  const d = await one(41)
  assert.equal(d.status, "discarded", "丢弃不再读成 unknown")
  assert.equal(d.role, "explore")
  assert.match(d.note, /Stop/, "note 要点：被用户 Stop 丢弃")
  assert.match(d.note, /NOT arrive/, "note 要点：报告不会到达")
  const c = await one("42")
  assert.equal(c.status, "cancelled", "字符串 id 归一（数值等价）")
  assert.match(c.note, /NOT arrive/)
  const k = await one(43)
  assert.equal(k.status, "done", "consumed → done（已送达）")
  assert.match(k.note, /injected/)
  const f = await one(44)
  assert.equal(f.status, "failed")
  assert.match(f.note, /error/)
  const u = await one(999)
  assert.equal(u.status, "error", "无记录 → 现状不变")
  assert.match(u.error, /unknown async subagent id: 999/)
  // 池命中优先于墓碑（同 id 双在——池事实权威，C-5「两池未命中后」才查墓碑）
  history._asyncSubagents.set("45", mkEntry({ id: 45, role: "plan" }))
  history._asyncTombstones.set("45", { status: "discarded", role: "plan" })
  const pooled = await one(45)
  assert.equal(pooled.status, "running", "池内条目照旧回显（墓碑不越权）")
  // 无 id 概览形态零变（终态记录是 id 级查询面——概览不引入无界增长字段）
  const ov = JSON.parse(await subagentTool.execute({ action: "status" }, ctx))
  assert.deepEqual(Object.keys(ov), ["overview"], "概览顶层形态不变（无 discarded 字段）")
  assert.deepEqual(Object.keys(ov.overview), ["running", "queued", "done"], "概览三键形态不变")
  assert.equal(JSON.stringify(ov).includes("discarded"), false, "概览不含终态词表")
})

// ═══ T-D9（AC-G7/F-G7）：dependsOn 停靠 ════════════════════════════════════

test("T-D9 边界：墓碑 → depInfo；cancelled 依赖 → depc 停靠；discarded 归 cancelled（核端同判——W13 收口）", async () => {
  // W13 收口（F4 批 4）：核 `depInfo` 把 'discarded' 墓碑归 cancelled 口径（`subagent-scheduler.mjs:127-128`
  // `discarded → cancelled`），与端侧设计 §12 C-6「discarded → cancelled（depc 停靠）」同判——
  // 原「核判 ok vs 端侧 cancelled」差异随核内一笔收口（§5 未决项撤）。
  const { agent } = mkParent({ tombstones: [["7", { status: "cancelled", role: "plan" }]] })
  assert.deepEqual(depInfo(agent, 7), { state: "cancelled", role: "plan" }, "cancelled 墓碑 → cancelled（C-6 主路径）")
  agent._asyncSubagents.set("8", { id: 8, role: "explore", status: "queued", done: false, cancelled: false, _dependsOn: ["7"] })
  const out = JSON.parse(executeStatusAction({ id: 8 }, { agent, cwd: process.cwd(), depth: 0 }))
  assert.equal(out.error, undefined, "不报 unknown 硬错（取消是终态事实，非「从未存在」）")
  assert.equal(out.status, "queued", "依赖者留在 queued（等父决定——不静默放行）")
  assert.equal(out.waiting, "dependency-cancelled")
  assert.match(out.reason, /dependency cancelled: plan#7/, "原因指向已取消的依赖")
  // 核端同判（收口面——见上注）：discarded 墓碑在核 depInfo 归 cancelled（F4 批 4）
  const { agent: agent2 } = mkParent({ tombstones: [["7", { status: "discarded", role: "plan" }]] })
  assert.deepEqual(depInfo(agent2, 7), { state: "cancelled", role: "plan" }, "核现状：discarded → cancelled（与端侧 C-6 同判——F4 批 4）")
  assert.deepEqual(depInfo(agent2, "7"), { state: "cancelled", role: "plan" }, "字符串 id 同判")
})

// ═══ T-D10（现状锁——AC-N1/N2 覆盖）：症状 1 不重开 ═════════════════════════

test("T-D10 现状锁：susp 等待态 userMessage 不动池（Map 引用与条目数不变）；普通回合 busy 入单槽 / 挂起会内 busy 同面受理（不新开并发回合）", async () => {
  const pool = new Map([["11", mkEntry({ id: 11, role: "explore" })]])
  const history = []
  history._asyncSubagents = pool
  const susp = { active: true, lines: { history, fullHistory: [] }, pendingInput: [] }
  const panel = {
    _turnState: "susp",
    _susp: susp,
    _chatCalls: [],
    // 生产 _chat 的 susp 支路语义（chat-panel.mjs）：挂起空闲 → pendingInput 单槽
    _chat(text) { panel._chatCalls.push(text); susp.pendingInput.push({ text }) },
  }
  await handlePanelMessage(panel, { type: "userMessage", text: "second thought" })
  assert.equal(history._asyncSubagents, pool, "池 Map 引用不变（新消息不动池）")
  assert.equal(pool.size, 1, "条目数不变")
  assert.deepEqual(panel._chatCalls, ["second thought"], "挂起空闲消息走 _chat（上游分流）")
  assert.equal(susp.pendingInput.length, 1, "消息落 pendingInput 单槽（不新开并发回合）")

  const warned = []
  const realWarn = vscode.window.showWarningMessage
  vscode.window.showWarningMessage = async (m) => { warned.push(m) }
  try {
    // 普通回合 busy（无会话）→ 单槽入队（C-B2-6）：不开并发回合、零警告
    const busy = { _turnState: "running", _susp: null, _busyQueued: [], _chatCalls: [], _chat(t) { busy._chatCalls.push(t) } }
    await handlePanelMessage(busy, { type: "userMessage", text: "during" })
    assert.deepEqual(busy._busyQueued.map((q) => q.text), ["during"], "普通回合 busy ⇒ 入单槽（F16——不开并发回合）")
    assert.deepEqual(busy._chatCalls, [], "入队不直呼 _chat（无并发回合）")
    assert.equal(warned.length, 0, "入队零警告")
    assert.equal(pool.size, 1, "入队路径不动池")
    // 挂起会话内 busy（_susp 在场）→ 同面受理（busy-extend 2026-09-22）：经既有 `_chat` susp 分支入会话单槽
    const inSusp = { _turnState: "running", _susp: { active: true, pendingInput: [] }, _busyQueued: [], _chatCalls: [], _chat(t) { inSusp._chatCalls.push(t); inSusp._susp.pendingInput.push({ text: t }) } }
    await handlePanelMessage(inSusp, { type: "userMessage", text: "during-session" })
    assert.deepEqual([inSusp._chatCalls, inSusp._busyQueued.length, pool.size], [["during-session"], 0, 1], "经 `_chat` 受理 + 无需会话槽 + 不动池（零并发回合）")
    assert.deepEqual(inSusp._susp.pendingInput.map((q) => q.text), ["during-session"], "入会话单槽（同判据同槽——原「拒收 + 警告」随本批撤销）")
  } finally {
    vscode.window.showWarningMessage = realWarn
  }
})
// ═══ T-D11~T-D13（AC-B1-1~AC-B1-3 / F-I1）：advisor 池同构丢弃（§15 C-10）═══════

test("T-D11 正常：finalizeAgentTurn（abort 非 interrupt）→ 死 advisor 出池+墓碑；活与 done 留池；C-10c 提醒恰一条（advisor#id / (design) / will NOT arrive）", async () => {
  const dead = mkAdvisor({ id: 11, controller: abortedController() })
  const live = mkAdvisor({ id: 12, reviewType: "code" })
  const doneInPool = mkAdvisor({ id: 13, status: "done", done: true })
  const { agent, history } = mkParent({ advisors: [dead, live, doneInPool] })
  const ctrl = new AbortController()
  ctrl.abort() // 全停（无 interrupt reason）——收尾中止分支
  const beforeStopped = logEvents("ev:stopped").length
  const beforeDiscarded = logEvents("ev:discarded").length

  await finalizeAgentTurn(agent, { signal: ctrl.signal, history, fullHistory: [], cwd: process.cwd(), depth: 0 })

  assert.equal(history._asyncAdvisors.has("11"), false, "死评审出池（原 clear() 会连存活一起孤儿化）")
  assert.equal(history._asyncAdvisors.has("12"), true, "存活评审留池（会话 signal 未中止——报告仍到达）")
  assert.equal(history._asyncAdvisors.has("13"), true, "done-in-pool 留池（已完成待收集的报告不丢——§15.1 ②）")
  assert.deepEqual(history._asyncTombstones.get("11"), { status: "discarded", role: "advisor" }, "discarded 终态记录（C-10b）")
  const reminders = history.filter((m) => m?.role === "user")
  assert.equal(reminders.length, 1, "整批一次提醒（不是逐条）")
  const body = reminders[0].content
  assert.match(body, /^\[System reminder: 1 background advisor review\(s\) were discarded by the user's Stop — their reports will NOT arrive: /, "C-10c 模板头逐字")
  assert.match(body, /advisor#11 \(design\) \(was running\)/, "列表词 = advisor#id（评审类型括号位）")
  assert.match(body, /will NOT arrive/)
  assert.match(body, /No design token was issued for a discarded design review; launch the review again if it is still needed\.\]$/, "C-10c 模板尾逐字（未签发 + 重发指引）")
  assert.ok(!body.includes("advisor#12"), "存活条目不入提醒列表")
  assert.equal(logEvents("ev:stopped").length - beforeStopped, 1, "ev:stopped 恰一条（既有事件零变）")
  assert.equal(logEvents("ev:discarded").length - beforeDiscarded, 1, "ev:discarded 恰一条")
})

test("T-D12 边界：零可丢弃条目（全活 advisor 池）→ 池零动、零提醒、零 ev:discarded（零噪音）", async () => {
  const { agent, history } = mkParent({ advisors: [mkAdvisor({ id: 21 }), mkAdvisor({ id: 22, reviewType: "code" })] })
  const ctrl = new AbortController()
  ctrl.abort()
  const beforeDiscarded = logEvents("ev:discarded").length

  const out = discardAbortedAdvisors(agent)
  assert.deepEqual(out, { discarded: [], kept: 2 }, "零丢弃（全留）")
  assert.equal(history._asyncAdvisors.size, 2, "池零动")
  assert.equal(history.filter((m) => m?.role === "user").length, 0, "零丢弃零注入（C-10「零丢弃 → 零注入」）")
  assert.equal(logEvents("ev:discarded").length - beforeDiscarded, 0, "零丢弃零日志")

  // 同一中止分支经真收尾函数：全活池同样零动（分支接线语义与直驱一致）
  await finalizeAgentTurn(agent, { signal: ctrl.signal, history, fullHistory: [], cwd: process.cwd(), depth: 0 })
  assert.equal(history._asyncAdvisors.size, 2, "收尾分支不动全活池")
  assert.equal(history.filter((m) => m?.role === "user").length, 0, "零噪音（Stop 无丢弃 = 无提醒）")
})

test("T-D13 正常：丢弃后的 advisor id 经 subagent status 回显 discarded（不再 unknown——C-10e）", async () => {
  const { agent, history } = mkParent({ advisors: [mkAdvisor({ id: 31, controller: abortedController() })] })
  discardAbortedAdvisors(agent)
  const ctx = { agent, cwd: process.cwd(), depth: 0 }
  const res = JSON.parse(await subagentTool.execute({ action: "status", id: 31 }, ctx))
  assert.equal(res.status, "discarded", "终态回显（status 不再读成 unknown）")
  assert.equal(res.role, "advisor", "角色保留（advisor 池域）")
  assert.match(res.note, /Stop/, "note 要点：被用户 Stop 丢弃")
  assert.equal(history._asyncAdvisors.has("31"), false, "已出池（回显来自终态墓碑）")
  // 丢弃后 guard 面可推回重评：池空 + 未签发 token（C-10e——与子代理面同构）
  assert.equal(res.round, undefined, "单查形态零新增字段（既有回显形态零变）")
})



// ═══ AC-N2：新档登记（接线硬项）════════════════════════════════════════════

test("AC-N2：本档已登记 test/files.mjs（不登记不跑）", () => {
  assert.ok(files.includes("test/async-parity.test.mjs"), "本档已登记 test/files.mjs")
})

// ═══ #43-② V2（绑定腿）+ #46 U2（对侧回归）═════════════════════════════════

test("V2/U2（#43-② 绑定腿 + #46 对侧）：合成 parent 写 ⇒ 绑定形 agent 读命中；status depth 0 零回归 / depth>0 显式拒", () => {
  // V2（绑定腿）：合成 parent = { history: H }（无自有 Map）写墓碑 ⇒ 经绑定形 agent 读。
  // 绑定形 = 生产同形（`src/agent.mjs:147-153` Object.defineProperty get/set——闭包绑 `:140`
  // 分支的 history 形参）；合成 parent 与绑定 agent 携**同一数组**（`extension/panel-messages.mjs:234-242`
  // 携 `lines.history`）。真实装配不可直驱 ⇒ 该坐标即判据（A5b）。
  const H = []
  const synthetic = { history: H } // ⏹ 取消路径的合成 parent（无自有 _asyncTombstones）
  writeTombstone(synthetic, 5, "cancelled", "eng-coder")
  const bound = { history: H }
  Object.defineProperty(bound, "_asyncTombstones", {
    configurable: true,
    get() { return H._asyncTombstones },
    set(v) { H._asyncTombstones = v },
  })
  assert.deepEqual(tombstoneOf(bound, 5), { status: "cancelled", role: "eng-coder" }, "访问器腿命中（今日 miss——容器落 per-call 对象）")
  assert.equal(bound._asyncTombstones, synthetic._asyncTombstones, "两腿同一容器（跨调用存活）")

  // U2（对侧回归）：depth 0 / 缺省 ⇒ 现行为逐字零变；depth>0 ⇒ 同款门（门在核单点——端侧零改）
  const { agent } = mkParent({ entries: [mkEntry({ id: 7, role: "explore" })] })
  const d0 = JSON.parse(executeStatusAction({}, { agent, cwd: process.cwd(), depth: 0 }))
  const dNone = JSON.parse(executeStatusAction({}, { agent, cwd: process.cwd() }))
  assert.deepEqual(dNone, d0, "depth 缺省 ≡ 0（逐字同）")
  assert.equal(d0.overview.running.length, 1)
  assert.deepEqual(JSON.parse(executeStatusAction({}, { agent, cwd: process.cwd(), depth: 1 })), {
    status: "error",
    error: "status is only available at depth 0 — a child agent has no async pool of its own",
  }, "子代拒（同款门 + 同文案族 + 同返回形）")
})
