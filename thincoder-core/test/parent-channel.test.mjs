/**
 * parent-channel.test.mjs — 子代理上行通道用例表 1:1（设计权威 = `docs/core/design/AGENT-LOOP-UPSTREAM.md`
 * §6.27.9 T1–T17；批 SUBAGENT-UPSTREAM-CHANNEL）。正常 = T1–T4；边界 = T5–T8 / T15–T17；
 * 错误 = T9–T13；T14 = 零回归（本批触碰点的行为面 + 全族由包级 `npm test` 承载）。
 *
 * 执行器对最小 agent / ctx 对象直接断言——**离线**（零网络 / 零真实 LLM / 零池真跑）：
 * 工具 `execute` 为同步函数（A4「无父侧 await」的机判面），drain / send 面直调纯函数。
 * A 面机检 = A2 消费单点（`agent.mjs` 循环体内单点调用 + 动态 import 形态）+ A4 导出面
 * （tool + push / drain + 谓词 `upstreamWaiting` + 三常量——通道无拉取 / 等待导出）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

import {
  parentChannelTool, pushChildUpstream, drainChildUpstream,
  UPSTREAM_MSG_MAX, UPSTREAM_QUEUE_MAX, UPSTREAM_ASK_MAX_INFLIGHT,
} from "../agent-tools/parent-channel.mjs"
import { writeTombstone } from "../agent-tools/async-settle.mjs"
import { executeSendAction } from "../agent-tools/subagent-actions.mjs"
import { drainInjectedQueue } from "../agent-tools/subagent-run.mjs"
import { assembleFamilyTools } from "../agent/family-tools.mjs"

/** 父（消费方）agent 最小形态：载体字段全在场（CLI 形）。 */
const parentAgent = (over = {}) => ({
  cwd: "C:/proj/x",
  history: [], _fullHistory: [],
  _asyncSubagents: new Map(), _asyncQueue: [], _asyncAdvisors: new Map(),
  ...over,
})

/** 子代理 ctx（depth>0 + `_upstream` 装配形——W1–W3 同款字段）。 */
const childCtx = (parent, { label = "eng-coder#57", sync = false } = {}) => ({
  depth: 1,
  agent: { _upstream: { parent, label, sync } },
  callbacks: {},
})

const call = (args, ctx) => JSON.parse(parentChannelTool.execute(args, ctx))
const msg = (parent, i = 0) => parent.history[i].content

test("T1 正常：ask 入队 + 即刻返回（同步 execute——零 await）；条目 from/kind/seq 正确", () => {
  const parent = parentAgent()
  const out = call({ kind: "ask", message: "is premise X still live?" }, childCtx(parent))
  assert.equal(out.status, "queued")
  assert.equal(out.kind, "ask")
  assert.equal(out.position, 1)
  assert.equal(parent._childUpstream.length, 1)
  const e = parent._childUpstream[0]
  assert.equal(e.from, "eng-coder#57")
  assert.equal(e.kind, "ask")
  assert.equal(e.seq, 1)
  assert.equal(e.message, "is premise X still live?")
  assert.equal(typeof e.ts, "number")
  assert.equal(parent._childUpstreamSeq, 1, "单调计数（seq 载体）")
  // 非阻塞结构保证：execute 非 async 函数（⇒ 无父侧 await——A4）
  assert.equal(parentChannelTool.execute.constructor.name, "Function", "execute 同步形（零 await）")
})

test("T2 正常：父消费——恰 1 条 user 消息（来源 + kind + 指引句）+ 队列清空 + 落盘", () => {
  const parent = parentAgent()
  call({ kind: "ask", message: "is premise X still live?" }, childCtx(parent))
  assert.equal(drainChildUpstream(parent), 1)
  assert.equal(parent._childUpstream.length, 0, "消费即清队列")
  assert.equal(parent.history.length, 1, "恰 1 条合并注入")
  assert.equal(parent.history[0].role, "user")
  const m = msg(parent)
  assert.equal(
    m.split("\n")[0],
    "[System reminder: in-flight message from your subagent eng-coder#57 — it keeps working on the unaffected parts. "
      + "Answer with subagent action:'send' (id + message) if the decision is yours; an unanswered ask means the child skips that part and reports it as not done.]",
    "单条注入头逐字（§6.27.4）",
  )
  assert.match(m, /^ask · eng-coder#57: is premise X still live\?$/m)
  assert.equal(parent._fullHistory.length, 1, "pushReal 落盘（非 transient——D-UC5）")
  assert.equal(parent.history[0].transient, undefined)
})

test("T3 正常：往返闭环——父 send 入队 → 子下回合边界按普通 user 回合消费（既有路径零改）", () => {
  const parent = parentAgent()
  call({ kind: "ask", message: "q" }, childCtx(parent))
  drainChildUpstream(parent)
  const entry = { id: 57, role: "eng-coder", status: "running", done: false, cancelled: false, _injected: [] }
  parent._asyncSubagents.set("57", entry)
  const ack = JSON.parse(executeSendAction({ id: 57, message: "yes — premise X was repealed" }, { depth: 0, agent: parent, callbacks: {} }))
  assert.equal(ack.status, "delivered", "回复复用既有 send（零新下行管子）")
  const child = { history: [], _fullHistory: [], _touchedFiles: [] }
  assert.equal(drainInjectedQueue(entry, child), 1)
  assert.deepEqual(child.history.map((x) => [x.role, x.content]), [["user", "yes — premise X was repealed"]])
})

test("T4 正常：note 类——注入文案含 note；无待答复语义", () => {
  const parent = parentAgent()
  const out = call({ kind: "note", message: "premise X broke — resolved it myself" }, childCtx(parent))
  assert.equal(out.status, "queued")
  assert.equal(out.kind, "note")
  drainChildUpstream(parent)
  assert.match(msg(parent), /^note · eng-coder#57: premise X broke — resolved it myself$/m)
  assert.ok(!msg(parent).includes("has since"), "note 无待答复语义 / 零注脚")
})

test("T5 边界：多来源合并——恰 1 条 user 消息含两行（按入队序）+ 队列清空", () => {
  const parent = parentAgent()
  call({ kind: "ask", message: "A" }, childCtx(parent, { label: "eng-coder#57" }))
  call({ kind: "note", message: "B" }, childCtx(parent, { label: "explore#61" }))
  assert.equal(drainChildUpstream(parent), 2)
  assert.equal(parent.history.length, 1, "合并 = 恰 1 条（不刷屏）")
  const m = msg(parent)
  assert.equal(
    m.split("\n")[0],
    "[System reminder: 2 in-flight message(s) from your subagents — they keep working on the unaffected parts. "
      + "Answer with subagent action:'send' (id + message) if the decision is yours; an unanswered ask means that child skips the part and reports it as not done.]",
    "多条注入头逐字（§6.27.4）",
  )
  const rows = m.split("\n").slice(1)
  assert.deepEqual(rows.map((r) => r.replace(/^... /, (s) => s)), [
    "- ask · eng-coder#57: A",
    "- note · explore#61: B",
  ], "列表行按入队序（含来源）")
})

test("T6 边界：父未运行（回合已返回）——消息留队列；下个 runAgent 首轮边界注入（消费点在位）", () => {
  const parent = parentAgent()
  call({ kind: "ask", message: "q" }, childCtx(parent))
  assert.equal(parent._childUpstream.length, 1, "零消费 ⇒ 队列留存（F1）")
  assert.equal(parent.history.length, 0)
  // A2 消费单点（结构机检）：agent.mjs 回合循环体内单点调用 + 动态 import 形态
  const src = readFileSync(new URL("../agent.mjs", import.meta.url), "utf8")
  const lines = src.split("\n")
  const loopAt = lines.findIndex((l) => l.includes("for (let turn = 0; turn < maxTurns; turn++)"))
  const drainAt = lines.map((l, i) => [l, i]).filter(([l]) => l.trim() === "drainChildUpstream(agent)")
  assert.equal(drainAt.length, 1, "消费单点唯一（恰一处调用）")
  assert.ok(loopAt > 0 && drainAt[0][1] > loopAt, "调用在回合循环体内（回合边界消费）")
  assert.match(src, /await import\("\.\/agent-tools\/parent-channel\.mjs"\)/, "动态 import（零新增静态边）")
})

test("T7 边界：子已 settle（池内 done: true）——注入含 has since settled 注脚；消息不丢", () => {
  const parent = parentAgent()
  call({ kind: "ask", message: "q" }, childCtx(parent))
  parent._asyncSubagents.set("57", { id: 57, role: "eng-coder", status: "done", done: true })
  assert.equal(drainChildUpstream(parent), 1)
  assert.match(msg(parent), /\(eng-coder#57 has since settled — see its report\)/)
  assert.match(msg(parent), /^ask · eng-coder#57: q /m, "消息本体照常注入")
})

test("T8 边界：空队列 drain = no-op（零历史变更 / 零开销）", () => {
  const parent = parentAgent()
  assert.equal(drainChildUpstream(parent), 0, "字段未建 ⇒ 0")
  assert.equal(parent.history.length, 0)
  assert.equal(parent._fullHistory.length, 0)
  const empty = parentAgent({ _childUpstream: [] })
  assert.equal(drainChildUpstream(empty), 0, "空数组 ⇒ 0")
  assert.equal(empty.history.length, 0)
})

test("T9 错误：depth-0 调用——明确错误（depth > 0 文案）；零入队", () => {
  const parent = parentAgent()
  const out = call({ kind: "ask", message: "q" }, { depth: 0, agent: { _upstream: { parent, label: "x#1" } }, callbacks: {} })
  assert.equal(out.status, "error")
  assert.match(out.error, /only available inside a subagent \(depth > 0\)/)
  assert.match(out.error, /question tool$/, "depth-0 出口指引（普通回复 / question）")
  assert.equal(parent._childUpstream?.length ?? 0, 0, "零入队")
  const noDepth = JSON.parse(parentChannelTool.execute({ kind: "ask", message: "q" }, { agent: {} }))
  assert.equal(noDepth.status, "error", "depth 缺省 ≡ 0（同拒）")
})

test("T10 错误 + 放行（同用例两半）：未 drain 时二次 ask 拒；drain 后放行", () => {
  const parent = parentAgent()
  call({ kind: "ask", message: "first" }, childCtx(parent))
  const second = call({ kind: "ask", message: "second" }, childCtx(parent))
  assert.equal(second.status, "error")
  assert.match(second.error, /one ask at a time until the parent picks it up/)
  assert.match(second.error, /#1/, "错误文案带在飞 ask 序号")
  assert.equal(parent._childUpstream.length, 1, "零投递（闸二）")
  drainChildUpstream(parent)
  assert.equal(call({ kind: "ask", message: "third" }, childCtx(parent)).status, "queued", "drain 后窗口关闭 ⇒ 放行")
  assert.equal(parent._childUpstream.length, 1)
  assert.equal(call({ kind: "note", message: "n" }, childCtx(parent)).status, "queued", "闸二只覆盖 ask（note 恒放行）")
  assert.equal(UPSTREAM_ASK_MAX_INFLIGHT, 1)
})

test("T11 错误：父队列满（20）——报错；零入队", () => {
  const parent = parentAgent()
  for (let i = 0; i < UPSTREAM_QUEUE_MAX; i++) {
    const out = call({ kind: "note", message: `m${i}` }, childCtx(parent, { label: `explore#${100 + i}` }))
    assert.equal(out.status, "queued", `第 ${i + 1} 条入队`)
  }
  assert.equal(parent._childUpstream.length, UPSTREAM_QUEUE_MAX)
  const over = call({ kind: "note", message: "overflow" }, childCtx(parent, { label: "coder#9" }))
  assert.equal(over.status, "error")
  assert.match(over.error, /queue is full \(20\)/)
  assert.equal(parent._childUpstream.length, UPSTREAM_QUEUE_MAX, "零入队（不静默丢）")
})

test("T12 错误：message 空 / 超 1500 / kind 非法——各自明确错误；零入队", () => {
  const parent = parentAgent()
  const ctx = childCtx(parent)
  const blank = call({ kind: "ask", message: "   " }, ctx)
  assert.equal(blank.status, "error")
  assert.match(blank.error, /requires a non-empty message/)
  const long = call({ kind: "note", message: "x".repeat(UPSTREAM_MSG_MAX + 1) }, ctx)
  assert.equal(long.status, "error")
  assert.match(long.error, /exceeds 1500 chars/)
  const badKind = call({ kind: "please", message: "m" }, ctx)
  assert.equal(badKind.status, "error")
  assert.match(badKind.error, /requires kind: "ask"/)
  assert.equal(call({ message: "m" }, ctx).status, "error", "kind 缺省同拒（枚举闸）")
  assert.equal(parent._childUpstream?.length ?? 0, 0, "三种输入皆零入队")
  assert.equal(call({ kind: "note", message: "x".repeat(UPSTREAM_MSG_MAX) }, ctx).status, "queued", "恰在上限内 ⇒ 放行")
  assert.equal(parent._childUpstream.length, 1)
})

test("T13 错误：无上游（未接线站点 / `_upstream` 缺失）——no parent channel；零入队", () => {
  const bare = JSON.parse(parentChannelTool.execute({ kind: "note", message: "m" }, { depth: 1, agent: {}, callbacks: {} }))
  assert.equal(bare.status, "error")
  assert.match(bare.error, /no parent channel/)
  const noParent = JSON.parse(parentChannelTool.execute({ kind: "note", message: "m" }, { depth: 1, agent: { _upstream: { label: "x#1" } }, callbacks: {} }))
  assert.equal(noParent.status, "error", "`_upstream` 在场但 parent 缺失 ⇒ 同拒（不静默成功）")
})

test("T14 零回归：本批触碰点行为面不变（depth-0 家族段 / send 注入空路径 / 无队列 drain）", async () => {
  const d0 = (await assembleFamilyTools({ depth: 0 })).map((t) => t.name)
  assert.ok(!d0.includes("notify_parent"), "depth-0 家族段零新增面")
  const entry = { _injected: [] }
  const child = { history: [], _fullHistory: [] }
  assert.equal(drainInjectedQueue(entry, child), 0, "send 注入空队列 no-op（零改）")
  assert.equal(child.history.length, 0)
  const parent = parentAgent()
  delete parent._childUpstream
  assert.equal(drainChildUpstream(parent), 0, "无队列父对象 drain = 零历史变更")
  assert.equal(parent.history.length, 0)
})

test("T15 边界：子已 cancel（出池 + 墓碑 cancelled）——注入含 has since been cancelled；消息不丢", () => {
  const parent = parentAgent()
  call({ kind: "ask", message: "q" }, childCtx(parent))
  writeTombstone(parent, "57", "cancelled", "eng-coder") // 出池 + 墓碑（池未命中）
  assert.equal(drainChildUpstream(parent), 1)
  assert.match(msg(parent), /\(eng-coder#57 has since been cancelled\)/)
  assert.match(msg(parent), /^ask · eng-coder#57: q /m, "消息本体不丢")
})

test("T16 边界：第三态（discarded 墓碑 / 池与墓碑皆未命中）——不附注脚；消息照常注入", () => {
  const parent = parentAgent()
  call({ kind: "ask", message: "q1" }, childCtx(parent))
  writeTombstone(parent, "57", "discarded", "eng-coder") // 第三态：不臆断
  drainChildUpstream(parent)
  assert.ok(!msg(parent).includes("has since"), "discarded ⇒ 零注脚")
  assert.match(msg(parent), /q1/, "消息本体照常注入")
  const bare = parentAgent()
  call({ kind: "note", message: "q2" }, childCtx(bare, { label: "explore#88" })) // 池未命中 + 无墓碑
  drainChildUpstream(bare)
  assert.ok(!msg(bare).includes("has since"), "皆未命中 ⇒ 零注脚")
  assert.match(msg(bare), /q2/)
})

test("T17 边界（同用例两半）：sync 形返回注不给「答复到达」承诺；异步形字面不变", () => {
  const syncOut = call({ kind: "ask", message: "q" }, childCtx(parentAgent(), { sync: true }))
  assert.equal(syncOut.status, "queued")
  assert.ok(!syncOut.note.includes("a reply arrives"), "sync 形不含「答复到达」句（F6 单向）")
  assert.match(syncOut.note, /spawned you synchronously and is blocked on this run/)
  assert.match(syncOut.note, /report the unanswered part as not done/)
  const asyncOut = call({ kind: "ask", message: "q" }, childCtx(parentAgent(), { sync: false }))
  assert.match(asyncOut.note, /consumed at the parent's next turn boundary \(non-blocking\)/)
  assert.match(asyncOut.note, /a reply arrives as an ordinary instruction at your next turn boundary/)
})

test("A4 导出面：tool + push / drain + 谓词 + 显示面携参 + 三常量（通道无拉取 / 等待导出）", async () => {
  const mod = await import("../agent-tools/parent-channel.mjs")
  assert.deepEqual(
    Object.keys(mod).sort(),
    [
      "UPSTREAM_ASK_MAX_INFLIGHT", "UPSTREAM_MSG_MAX", "UPSTREAM_QUEUE_MAX", "drainChildUpstream",
      "parentChannelTool", "pushChildUpstream", "upstreamAskLabelVars", "upstreamWaiting",
    ].sort(),
    "导出面钉死（零 fetch / poll / wait 动作）",
  )
  assert.equal(UPSTREAM_MSG_MAX, 1500)
  assert.equal(UPSTREAM_QUEUE_MAX, 20)
  assert.equal(parentChannelTool.name, "notify_parent")
  assert.equal(parentChannelTool.readonly, true, "只读分类（explore / plan 只读过滤 + 免权限 ask）")
})

test("载体吸收：父字段缺 + 载体（history）在场 ⇒ 借用同一容器；message 经 escapeXml", () => {
  const carried = []
  const parent = parentAgent()
  parent.history._childUpstream = carried // 载体形（合成 parent——VSC 跨 run 容器同形）
  call({ kind: "note", message: "<a>&b" }, childCtx(parent))
  assert.equal(parent._childUpstream, carried, "借用同一容器（不另建分叉）")
  drainChildUpstream(parent)
  assert.match(msg(parent), /&lt;a&gt;&amp;b/, "message 经 escapeXml（父侧所见不破 XML 形）")
  const out = pushChildUpstream({ parent: parentAgent(), from: "coder#3", kind: "note", message: "m" })
  assert.deepEqual(out, { seq: 1, position: 1 })
})
