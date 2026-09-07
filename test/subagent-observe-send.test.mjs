/**
 * subagent-observe-send.test.mjs — SUBAGENT-OBSERVE-SEND.md（CLI 端）测试用例表 1:1：
 * observe（D1——readonly 摘要查询：running 最近 N 回合 + 当前工具 + turn/touched；queued
 * 占位；done 可查）/ send（D2——控制豁免注入：仅 running 异步可入队；settled/cancel/queued/
 * unknown/缺参明确错误）+ dispatch §4.1 分类（observe readonly / send 控制豁免——planMode
 * 放行）。执行器对最小 agent/entry/child 对象直接断言——确定性单元（无真实 LLM/io）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { executeObserveAction, executeSendAction } from "../src/agent-tools/subagent-actions.mjs"
import { drainInjectedQueue } from "../src/agent-tools/subagent-run.mjs"
import { executeToolCalls } from "../src/agent/dispatch.mjs"

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
