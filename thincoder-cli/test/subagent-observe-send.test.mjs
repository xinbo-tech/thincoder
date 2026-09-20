/**
 * subagent-observe-send.test.mjs — SUBAGENT-OBSERVE-SEND.md（CLI 端）测试用例表 1:1：
 * observe（D1——readonly 摘要查询：running 最近 N 回合 + 当前工具 + turn/touched；queued
 * 占位；done 可查）/ send（D2——控制豁免注入：仅 running 异步可入队；settled/cancel/queued/
 * unknown/缺参明确错误）+ dispatch §4.1 分类（observe readonly / send 控制豁免——planMode
 * 放行）。执行器对最小 agent/entry/child 对象直接断言——确定性单元（无真实 LLM/io）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { executeObserveAction, executeSendAction, executeStatusAction } from "@thincoder/core/agent-tools/subagent-actions.mjs"
import { executeCancelAction } from "@thincoder/core/agent-tools/subagent-async.mjs"
import { settleAsyncEntry } from "@thincoder/core/agent-tools/async-settle.mjs"
import { drainInjectedQueue } from "@thincoder/core/agent-tools/subagent-run.mjs"
import { executeToolCalls } from "@thincoder/core/agent/dispatch.mjs"

/** 最小 ctx（depth 0——observe/send 仅 depth-0 池所有者可用）。 */
const depth0Ctx = (agent) => ({ depth: 0, agent, callbacks: {}, signal: null, onPermissionRequest: null })

/** running 异步子代理池条目 + childAgent（observe 数据源）。 */
function runningEntry(id, over = {}) {
  return {
    id, role: "eng-coder", status: "running", model: "p:m", startedAt: Date.now() - 5000,
    turn: 4, maxTurns: 20, done: false, cancelled: false,
    childAgent: {
      _fullHistory: [],
      _inflightTools: new Set(),
      _touchedFiles: [],
    },
    _injected: [],
    ...over,
  }
}

/** 造真实形态历史（user 任务 + assistant 动作序列 + tool 结果），assistant = 回合。 */
function childWithHistory(assistantMsgs, over = {}) {
  const hist = [{ role: "user", content: "task" }]
  for (const a of assistantMsgs) {
    hist.push(a)
    if (Array.isArray(a.tool_calls)) {
      for (const tc of a.tool_calls) hist.push({ role: "tool", tool_call_id: tc.id, content: "ok" })
    }
  }
  return { _fullHistory: hist, _inflightTools: new Set(), _touchedFiles: ["C:/proj/x/src/a.mjs"], ...over }
}

const contentTurn = (txt) => ({ role: "assistant", content: txt })
const toolTurn = (names) => ({
  role: "assistant", content: null,
  tool_calls: names.map((n) => ({ id: `c_${n}`, type: "function", function: { name: n, arguments: "{}" } })),
})

test("正常 observe：running 返最近回合摘要 + 当前工具 + turn/touched（AC1）", () => {
  const child = childWithHistory([
    toolTurn(["read", "grep"]),        // 回合1（最旧）
    contentTurn("First line: investigating\nsecond line"), // 回合2
    toolTurn(["bash"]),                // 回合3（最新）
  ])
  child._inflightTools.add("bash")     // dispatch 记账：子正卡在长工具调用
  const entry = runningEntry(7, { childAgent: child })
  const agent = { cwd: "C:/proj/x", _asyncSubagents: new Map([["7", entry]]), _asyncQueue: [], _asyncAdvisors: new Map() }
  const out = JSON.parse(executeObserveAction({ id: 7 }, depth0Ctx(agent)))
  assert.equal(out.status, "running")
  assert.equal(out.role, "eng-coder")
  assert.equal(out.id, "7")
  assert.equal(out.turn, 4)
  assert.equal(out.maxTurns, 20)
  // 当前工具从 dispatch 状态读（非仅 history）——卡死检测核心
  assert.deepEqual(out.currentTool, ["bash"])
  // recentTurns newest-first，assistant 回合数 = 3（全返回——未超默认 5）
  assert.deepEqual(out.recentTurns, ["tools: bash", "First line: investigating", "tools: read, grep"])
  // touched 摘要（running 带文件——相对 cwd，路径分隔符随平台）
  assert.equal(out.touchedFiles.length, 1)
  assert.ok(out.touchedFiles[0].replace(/\\/g, "/").endsWith("src/a.mjs"))
})

test("隔离：observe 截断到 recent 上限，不灌全量（N2）", () => {
  const many = Array.from({ length: 7 }, (_, i) => contentTurn(`turn ${i}`))
  const child = childWithHistory(many)
  const entry = runningEntry(8, { childAgent: child })
  const agent = { cwd: "C:/proj/x", _asyncSubagents: new Map([["8", entry]]), _asyncQueue: [], _asyncAdvisors: new Map() }
  const def = JSON.parse(executeObserveAction({ id: 8 }, depth0Ctx(agent)))
  assert.equal(def.recentTurns.length, 5) // 默认上限 5——7 回合截到 5
  assert.equal(def.recentTurns[0], "turn 6") // newest-first
  const two = JSON.parse(executeObserveAction({ id: 8, recent: 2 }, depth0Ctx(agent)))
  assert.equal(two.recentTurns.length, 2)
  const capped = JSON.parse(executeObserveAction({ id: 8, recent: 99 }, depth0Ctx(agent)))
  assert.equal(capped.recentTurns.length, 7) // 全量 7 < clamp 上限 20 → 全返
})

test("边界 observe：queued 占位 / done 可查（AC1/AC3）", () => {
  const agent = {
    cwd: "C:/proj/x",
    _asyncSubagents: new Map(),
    _asyncQueue: [],
    _asyncAdvisors: new Map(),
  }
  // queued（未启动——无 childAgent）→ 占位
  agent._asyncSubagents.set("1", { id: 1, role: "explore", status: "queued", done: false, position: 2 })
  const q = JSON.parse(executeObserveAction({ id: 1 }, depth0Ctx(agent)))
  assert.equal(q.status, "queued")
  assert.equal(q.position, 2) // 未启动——无活动——占位带排队位置
  assert.match(q.note, /queued/)
  // done（回合内 settle 未消费——childAgent 仍在）→ 可查，activity 摘要
  const doneChild = childWithHistory([toolTurn(["grep"]), contentTurn("done: found it")])
  agent._asyncSubagents.set("2", { id: 2, role: "explore", status: "done", done: true, turn: 6, maxTurns: 10, childAgent: doneChild })
  const d = JSON.parse(executeObserveAction({ id: 2 }, depth0Ctx(agent)))
  assert.equal(d.status, "done")
  assert.equal(d.done, true)
  assert.equal(d.recentTurns.length, 2)
  assert.match(d.note, /settled/)
})

test("错误 observe：未知 id / advisor id / 缺 id / depth>0（AC3/N2）", () => {
  const agent = { cwd: "C:/proj/x", _asyncSubagents: new Map(), _asyncQueue: [], _asyncAdvisors: new Map([["5", { role: "advisor" }]]) }
  const ctx = depth0Ctx(agent)
  const unknown = JSON.parse(executeObserveAction({ id: 99 }, ctx))
  assert.equal(unknown.status, "error")
  assert.match(unknown.error, /unknown async subagent id: 99/)
  const advisor = JSON.parse(executeObserveAction({ id: 5 }, ctx))
  assert.equal(advisor.status, "error")
  assert.match(advisor.error, /ADVISOR/)
  const noId = JSON.parse(executeObserveAction({}, ctx))
  assert.equal(noId.status, "error")
  assert.match(noId.error, /observe requires the id/)
  const child = JSON.parse(executeObserveAction({ id: 1 }, { depth: 1, agent, callbacks: {} }))
  assert.equal(child.status, "error")
  assert.match(child.error, /only available at depth 0/)
})

test("AC2 接缝：回合边界消费——send 入队消息按普通 user 回合入子历史（drainInjectedQueue）", () => {
  const entry = runningEntry(4)
  const child = { history: [], _fullHistory: [], _touchedFiles: [] }
  // 模拟父经 action:'send' 入队两条引导
  entry._injected.push("check X")
  entry._injected.push("don't fixate on Y")
  const n = drainInjectedQueue(entry, child)
  assert.equal(n, 2)
  assert.equal(entry._injected.length, 0) // 消费即清空（投递完成）
  assert.equal(child.history.length, 2)
  assert.equal(child._fullHistory.length, 2)
  assert.deepEqual(child.history.map((m) => [m.role, m.content]), [["user", "check X"], ["user", "don't fixate on Y"]])
  // 空队列 no-op
  assert.equal(drainInjectedQueue(entry, child), 0)
  assert.equal(child.history.length, 2)
})

test("正常 send：running 入队 + 确认 + _injected 内容（AC2）", () => {
  const entry = runningEntry(3)
  const agent = { cwd: "C:/proj/x", _asyncSubagents: new Map([["3", entry]]), _asyncQueue: [], _asyncAdvisors: new Map() }
  const out = JSON.parse(executeSendAction({ id: 3, message: "check X, don't fixate on Y" }, depth0Ctx(agent)))
  assert.equal(out.status, "delivered")
  assert.equal(out.queued, 1)
  assert.deepEqual(entry._injected, ["check X, don't fixate on Y"])
})

test("边界 send：settled / cancelled / queued / sync(unknown) / 缺参 / depth>0 明确错误（AC3）", () => {
  const map = new Map()
  const mk = (over) => { const e = runningEntry(0, over); map.set(String(e.id), e); return e }
  // settled（done）→ 错误
  mk({ id: 1, status: "done", done: true })
  // cancelled（cancel 在途/已 cancel）→ 错误
  mk({ id: 2, status: "running", cancelled: true })
  // queued（未启动——非 running 不可注入）→ 错误
  mk({ id: 3, status: "queued", done: false })
  const agent = { cwd: "C:/proj/x", _asyncSubagents: map, _asyncQueue: [], _asyncAdvisors: new Map() }
  const ctx = depth0Ctx(agent)
  assert.match(JSON.parse(executeSendAction({ id: 1, message: "m" }, ctx)).error, /settled/)
  assert.match(JSON.parse(executeSendAction({ id: 2, message: "m" }, ctx)).error, /cancelled/)
  assert.match(JSON.parse(executeSendAction({ id: 3, message: "m" }, ctx)).error, /not running/)
  // sync 子代理 = 池内无对应条目（父在等——不经池）→ unknown 明确错误
  assert.match(JSON.parse(executeSendAction({ id: 42, message: "m" }, ctx)).error, /unknown async subagent id/)
  // 未知/advisor id
  assert.match(JSON.parse(executeSendAction({ id: 5, message: "m" }, ctx)).error, /unknown async subagent id/)
  agent._asyncAdvisors.set("9", { role: "advisor" })
  assert.match(JSON.parse(executeSendAction({ id: 9, message: "m" }, ctx)).error, /ADVISOR/)
  // 缺 message / 缺 id
  assert.match(JSON.parse(executeSendAction({ id: 1 }, ctx)).error, /send requires the message/)
  assert.match(JSON.parse(executeSendAction({ message: "m" }, ctx)).error, /send requires the id/)
  // depth>0
  assert.match(JSON.parse(executeSendAction({ id: 1, message: "m" }, { depth: 1, agent, callbacks: {} })).error, /only available at depth 0/)
})

test("dispatch §4.1 分类：observe readonly / send 控制豁免——planMode 放行（非 spawn 拒）", async () => {
  // 最小 subagent 代理工具（name='subagent' 触发动作级分类谓词；execute 只回显 action——
  // 不需真实池）。只验证"未被 planMode 拦"这一分类结果。
  const proxyTool = { name: "subagent", readonly: false, execute: async (a) => JSON.stringify({ echo: a?.action }) }
  const toolByName = new Map([["subagent", proxyTool]])
  const call = (action, extra = {}) => ({ name: "subagent", id: `t${action}`, arguments: JSON.stringify({ action, ...extra }) })
  const base = () => ({ cwd: "C:/proj/x", planMode: true, autoApprove: false, config: { agent: {} }, _mutLog: [], _mutationSeq: 0 })
  // observe：readonly → planMode 放行（不 deny——执行成功）
  const rObs = await executeToolCalls(base(), toolByName, [call("observe", { id: 1 })], {}, 0, undefined)
  assert.equal(rObs[0].ok, true)
  assert.match(String(rObs[0].result), /"echo":"observe"/)
  // send：控制豁免 → planMode 放行
  const rSend = await executeToolCalls(base(), toolByName, [call("send", { id: 1, message: "m" })], {}, 0, undefined)
  assert.equal(rSend[0].ok, true)
  assert.match(String(rSend[0].result), /"echo":"send"/)
  // spawn（无 action = 缺省）：非只读非控制 → planMode 拒
  const rSpawn = await executeToolCalls(base(), toolByName, [call(undefined)], {}, 0, undefined)
  assert.equal(rSpawn[0].ok, false)
  assert.match(String(rSpawn[0].result), /plan mode/)
})

// ═══ 第 10 批（AGENT-LOOP.md §18——advisor 池接入面：status 双池 / cancel 落点 / 指引）═══

/** 评审池条目真形状（advisor-async launchAsyncAdvisor：role/reviewType/run.round/status/done）。 */
const advisorEntry = (id, over = {}) => ({
  id, role: "advisor", reviewType: "design", run: { round: 2 }, status: "running",
  model: "p:m", startedAt: Date.now() - 9000, done: false, cancelled: false,
  controller: null, ...over,
})

const advisorAgent = (advisors, over = {}) => ({
  cwd: "C:/proj/x", _asyncSubagents: new Map(), _asyncQueue: [], _asyncAdvisors: advisors,
  history: [], _fullHistory: [], ...over,
})

test("T-B1/T-B2/T-B3（AC-B1）：status 双池并表——概览含评审条目 + 单查命中评审池 + done 未取注记", () => {
  const sub = runningEntry(3)
  const adv = advisorEntry(9)
  const agent = advisorAgent(new Map([["9", adv]]), { _asyncSubagents: new Map([["3", sub]]) })
  const ctx = { depth: 0, agent, callbacks: {} }
  // 概览并表（T-B1）
  const ov = JSON.parse(executeStatusAction({}, ctx))
  assert.equal(ov.overview.running.length, 2, "双池 running 并表（子代理 + 评审）")
  const review = ov.overview.running.find((r) => r.role === "advisor")
  assert.ok(review, "评审条目在概览 running 行")
  assert.equal(review.reviewType, "design")
  assert.equal(review.round, 2)
  assert.equal(typeof review.elapsedSec, "number", "评审行带 elapsedSec")
  assert.equal(review.turn, undefined, "评审行不带子代理 turn/maxTurns（字段面区分）")
  // 单查（advisor id）——不报 unknown（T-B2）
  const one = JSON.parse(executeStatusAction({ id: "9" }, ctx))
  assert.equal(one.status, "running")
  assert.equal(one.role, "advisor")
  assert.equal(one.reviewType, "design")
  assert.equal(one.round, 2)
  assert.equal(typeof one.elapsedSec, "number")
  assert.notEqual(one.status, "error")
  // done 未取注记（T-B3/D-B5——不把已 settle 未消化当 running）
  adv.status = "done"; adv.done = true
  const done = JSON.parse(executeStatusAction({ id: "9" }, ctx))
  assert.equal(done.status, "done")
  assert.ok(done.note, "done 行带自动送达注记")
  assert.equal(JSON.parse(executeStatusAction({}, ctx)).overview.running.length, 1, "done 评审不计入 running")
  // 未知 id 文案不变（既有测试锁定——不改）
  assert.match(JSON.parse(executeStatusAction({ id: "77" }, ctx)).error, /unknown async subagent id: 77/)
})

test("T-B2b（跨端同判定锁）：cancel→settle 窗口（cancelled=true、status 未变）评审 → 单查报 running（不另报 cancelled）", () => {
  const agent = advisorAgent(new Map([["9", advisorEntry(9, { cancelled: true })]]))
  const one = JSON.parse(executeStatusAction({ id: "9" }, { depth: 0, agent, callbacks: {} }))
  assert.equal(one.status, "running", "取消在途不另报 cancelled（NFR-B1 跨端同判定——VSC 同判定）")
  assert.equal(one.reviewType, "design")
  assert.equal(one.round, 2)
})

test("T-B6/T-B7（AC-B3）：cancel 落评审池——abort + 幂等 + 已完成/未知/缺 id 既有错误行", () => {
  const adv = advisorEntry(9, { controller: new AbortController() })
  const agent = advisorAgent(new Map([["9", adv]]))
  const ctx = { depth: 0, agent, callbacks: {} }
  const r1 = JSON.parse(executeCancelAction({ id: 9 }, ctx))
  assert.equal(r1.status, "cancelled")
  assert.equal(adv.controller.signal.aborted, true, "条目 controller 已 abort（与面板 ⏹ 同源）")
  assert.equal(adv.cancelled, true)
  const r2 = JSON.parse(executeCancelAction({ id: 9 }, ctx))
  assert.deepEqual(r2, r1, "重复取消幂等（同一确认）")
  // 已完成评审 → already finished
  agent._asyncAdvisors.set("11", advisorEntry(11, { status: "done", done: true }))
  assert.match(JSON.parse(executeCancelAction({ id: 11 }, ctx)).error, /already finished/)
  // 两池皆无 / 缺 id → 既有文案
  assert.match(JSON.parse(executeCancelAction({ id: 88 }, ctx)).error, /unknown async subagent id/)
  assert.match(JSON.parse(executeCancelAction({}, ctx)).error, /cancel requires the id/)
})

test("T-B6b（AC-B3 机读线提醒）：cancelled 评审 settle → 「评审已取消——token 未签发」提醒 + 不入 pending + 出池", () => {
  const parent = advisorAgent(new Map())
  parent._pendingAsyncResults = []
  parent._asyncSettleSeq = 0
  parent._suspended = false
  const entry = {
    id: 6, role: "advisor", relayPrefix: "advisor#6/", status: "running", done: false,
    report: null, error: null, cancelled: true, startedAt: Date.now() - 1000,
    controller: { signal: { aborted: false } }, _settle: () => {}, _settleSeq: 0,
  }
  parent._asyncAdvisors.set("6", entry)
  settleAsyncEntry(parent, entry, { pool: parent._asyncAdvisors, ctx: { signal: { aborted: false }, callbacks: { onToken: () => {} } } })
  assert.match(parent.history.at(-1).content, /cancelled — the review did not settle; token not issued/, "机读线提醒（token 未签发）")
  assert.ok(!parent._pendingAsyncResults.includes(entry), "取消不入 pending（§18.3 #3 边界）")
  assert.equal(parent._asyncAdvisors.has("6"), false, "取消出池")
})

test("T-B8（AC-B4）：observe/send 遇 advisor id → 明确指引（含 action:'status'），不报 unknown", () => {
  const agent = advisorAgent(new Map([["9", advisorEntry(9)]]))
  const ctx = { depth: 0, agent, callbacks: {} }
  const obs = JSON.parse(executeObserveAction({ id: 9 }, ctx))
  const snd = JSON.parse(executeSendAction({ id: 9, message: "m" }, ctx))
  for (const o of [obs, snd]) {
    assert.equal(o.status, "error")
    assert.match(o.error, /ADVISOR/, "明示这是后台评审（不报含糊 id 错）")
    assert.ok(!/unknown/i.test(o.error), "不含 unknown（AC-B4 机判）")
    assert.match(o.error, /action:'status'/, "指向 action:'status' 或自动送达")
  }
  assert.equal(agent._asyncAdvisors.get("9")._injected?.length ?? 0, 0, "send 不为评审开新能力（零注入）")
})

// ═══ #46（TOOLFACE-FIXES ①）：status depth 门 ═══════════════════════════════

test("U1/U2（#46）：子代（depth>0）显式拒（同款门 + 同文案族 + 同返回形）；depth 0 / 缺省逐字零回归", () => {
  const agent = advisorAgent(new Map([["9", advisorEntry(9)]]), { _asyncSubagents: new Map([["3", runningEntry(3)]]) })
  // U2（回归）：depth 0 与缺省同判——overview 形态逐字零变（A2）
  const d0 = JSON.parse(executeStatusAction({}, { depth: 0, agent, callbacks: {} }))
  const dNone = JSON.parse(executeStatusAction({}, { agent, callbacks: {} }))
  assert.deepEqual(dNone, d0, "depth 缺省 ≡ 0（逐字同）")
  assert.equal(d0.overview.running.length, 2, "双池并表形态不变")
  // U1（#46）：子代拒——错误串逐字相等（A1）
  const child = JSON.parse(executeStatusAction({}, { depth: 1, agent, callbacks: {} }))
  assert.deepEqual(child, {
    status: "error",
    error: "status is only available at depth 0 — a child agent has no async pool of its own",
  }, "同文案族（子代拒——串为自足句，不带外部引证）")
  // A1b：返回形 ≡ 兄弟动作既存拒（observe / send 的 JSON {status,error} 对象形——非 escalate 字符串形）
  const obsReject = JSON.parse(executeObserveAction({ id: 3 }, { depth: 1, agent, callbacks: {} }))
  const sndReject = JSON.parse(executeSendAction({ id: 3, message: "m" }, { depth: 1, agent, callbacks: {} }))
  assert.equal(child.status, obsReject.status, "拒返回形同款（observe）")
  assert.equal(child.status, sndReject.status, "拒返回形同款（send）")
  assert.equal(typeof child.error, "string")
  // 门在函数首行（早于 id 分支）：单查路径同拒
  assert.deepEqual(JSON.parse(executeStatusAction({ id: "3" }, { depth: 1, agent, callbacks: {} })), child)
})
