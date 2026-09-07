/**
 * async-settle.test.mjs — ASYNC-RESULT-CONTAINER.md（CLI 端）测试用例表 1:1：
 * settle 公共收尾单点 settleAsyncEntry（AC1——四族同机制）/ pending 单容器 +role（AC2）/
 * done-in-pool 统一表示（AC3）/ 守卫统一 !parentAborted（AC4）/ buildChildSignal 兜底
 * （AC5——consult 补 _sessionSignal）/ 池 accessor（D1）/ park 幂等（D2）。执行器对最小
 * parent/entry/ctx 对象直接断言——确定性单元（无真实 LLM/io；logEvent 在 test runner
 * 下写门关闭——log.mjs writeEnabled）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import {
  settleAsyncEntry, getAsyncPool, parkAsyncPending, parentAborted, buildChildSignal,
} from "../src/agent-tools/async-settle.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))

/** 最小 parent agent（池/pending/墓碑/waiter/历史——settle 读写的面）。 */
function mkParent(over = {}) {
  return {
    _asyncSubagents: new Map(),
    _asyncAdvisors: new Map(),
    _asyncTombstones: new Map(),
    _asyncWaiters: [],
    _asyncQueue: [],
    _pendingAsyncResults: [],
    _asyncSettleSeq: 0,
    _suspended: false,
    autoApprove: false,
    history: [],
    _fullHistory: [],
    ...over,
  }
}

/** 最小 settle ctx（signal + 事件记录器）。 */
function mkCtx(over = {}) {
  const tokens = []
  return { signal: { aborted: false }, callbacks: { onToken: (t) => tokens.push(t) }, tokens, ...over }
}

/** 最小池 entry（subagent 族形态——settle 读写的面）。settleBox = _settle 调用计数哨兵。 */
function mkEntry(id, role, over = {}, settleBox = { n: 0 }) {
  return {
    id, role, relayPrefix: `${role}#${id}/`, status: "running", done: false,
    report: "done report", error: null, cancelled: false,
    startedAt: Date.now() - 1000,
    controller: { signal: { aborted: false } },
    _settle: () => { settleBox.n++ },
    _settleSeq: 0,
    ...over,
  }
}

test("正常 settle（AC1）：subagent/advisor/escalate 改调 settleAsyncEntry——公共收尾一致（settleSeq/_settle/waiter/⟦ev⟧done）", () => {
  for (const role of ["explore", "advisor", "escalate"]) {
    const parent = mkParent()
    const ctx = mkCtx()
    const settleBox = { n: 0 }
    let woken = 0
    parent._asyncWaiters.push(() => { woken++ })
    const pool = role === "advisor" ? parent._asyncAdvisors : parent._asyncSubagents
    const entry = mkEntry(1, role, {}, settleBox)
    pool.set("1", entry)
    settleAsyncEntry(parent, entry, { pool, ctx })
    assert.equal(entry.done, true)
    assert.equal(entry.status, "done")
    assert.equal(entry._settleSeq, 1)                 // 公共尾部：settleSeq 递增
    assert.equal(parent._asyncSettleSeq, 1)
    assert.equal(settleBox.n, 1)                      // _settle 唤醒
    assert.equal(woken, 1)                            // 唤醒 waiter
    assert.equal(ctx.tokens.length, 1)                // 回合内：⟦ev⟧done 留池
    assert.match(ctx.tokens[0], /⟦ev⟧done\x1e0\x1e0\x1edone\x1e$/)
    assert.equal(pool.get("1"), entry)                // done-in-pool（AC3）：留池未删
    assert.equal(parent._pendingAsyncResults.length, 0)
  }
})

test("正常 pending 消费（AC2）：挂起期 settle → pending 单容器 +role + _inPending + 出池 + ⟦ev⟧settled", () => {
  const parent = mkParent({ _suspended: true })
  const ctx = mkCtx()
  const entry = mkEntry(7, "explore")
  parent._asyncSubagents.set("7", entry)
  settleAsyncEntry(parent, entry, { pool: parent._asyncSubagents, ctx })
  assert.deepEqual(parent._pendingAsyncResults, [entry]) // 单容器 _pendingAsyncResults
  assert.equal(entry.role, "explore")                    // 条目带 role
  assert.equal(entry._inPending, true)                   // _inPending 防重复移交
  assert.equal(parent._asyncSubagents.has("7"), false)   // 出池
  assert.equal(ctx.tokens.length, 1)
  assert.match(ctx.tokens[0], /⟦ev⟧settled\x1e0\x1e0\x1esettled\x1e/)
})

test("done-in-pool 统一表示（AC3）：回合内 settle 留池 done:true——parkAsyncPending 幂等（_inPending + 去重）", () => {
  const parent = mkParent()
  const ctx = mkCtx()
  const entry = mkEntry(3, "coder")
  parent._asyncSubagents.set("3", entry)
  settleAsyncEntry(parent, entry, { pool: parent._asyncSubagents, ctx })
  assert.equal(entry.done, true)                        // 留池 done:true（统一表示）
  assert.equal(parent._asyncSubagents.get("3"), entry)
  assert.equal(parent._pendingAsyncResults.length, 0)   // 回合内不入 pending
  // sweep 模拟：done && !_inPending → park（幂等——重复 park 不重复入列）
  parkAsyncPending(parent, entry)
  parkAsyncPending(parent, entry)
  assert.equal(parent._pendingAsyncResults.length, 1)
  assert.equal(parent._pendingAsyncResults[0], entry)
  assert.equal(entry._inPending, true)
})

test("腾槽补位（旧行为零回归）：cancelled settle 释放槽 → queued 头自动启动（AGENT-LOOP.md §10 settle/cancel 释放槽后启动到槽满）", () => {
  let started = 0
  const queued = {
    id: 9, role: "coder", status: "queued", done: false, cancelled: false,
    _pool: "other", _files: [], _dependsOn: [], relayPrefix: "coder#9/",
    _settleSeq: 0, _settle: () => {}, start: () => { started++ },
  }
  const parent = mkParent()
  parent._asyncQueue.push(queued)
  const entry = mkEntry(5, "coder", { cancelled: true })
  parent._asyncSubagents.set("5", entry)
  settleAsyncEntry(parent, entry, { pool: parent._asyncSubagents, ctx: mkCtx() })
  assert.equal(started, 1)   // running 取消的 cancelled settle 同样补位（helper 公共尾部恒补）
  assert.equal(parent._asyncQueue.length, 0)
})

test("边界 cancelled（AC1）：settle 时 entry cancelled——出池 + 墓碑 + ⟦ev⟧stopped + 族提醒（三族文案）", () => {
  // subagent 族：提醒含依赖者标注（AUTO 档 autoNote）
  const parent = mkParent()
  const ctx = mkCtx()
  const entry = mkEntry(5, "eng-coder", { cancelled: true })
  parent._asyncSubagents.set("5", entry)
  settleAsyncEntry(parent, entry, { pool: parent._asyncSubagents, ctx })
  assert.equal(parent._asyncSubagents.has("5"), false)
  assert.deepEqual(parent._asyncTombstones.get("5"), { status: "cancelled", role: "eng-coder" })
  assert.equal(ctx.tokens.length, 1)
  assert.match(ctx.tokens[0], /⟦ev⟧stopped\x1e0\x1e0\x1estopped\x1e$/)
  assert.equal(parent._pendingAsyncResults.length, 0)   // 不入 pending
  assert.match(parent.history.at(-1).content, /subagent eng-coder#5 cancelled by user/)
  // advisor 族：token 未签发文案
  const pa = mkParent()
  const ca = mkCtx()
  const ea = mkEntry(6, "advisor", { cancelled: true })
  pa._asyncAdvisors.set("6", ea)
  settleAsyncEntry(pa, ea, { pool: pa._asyncAdvisors, ctx: ca })
  assert.match(pa.history.at(-1).content, /评审已取消——token 未签发/)
  assert.deepEqual(pa._asyncTombstones.get("6"), { status: "cancelled", role: "advisor" })
  // escalate 族：tag 文案
  const pe = mkParent()
  const ce = mkCtx()
  const ee = mkEntry(8, "escalate", { cancelled: true, tag: "p:m" })
  pe._asyncSubagents.set("8", ee)
  settleAsyncEntry(pe, ee, { pool: pe._asyncSubagents, ctx: ce })
  assert.match(pe.history.at(-1).content, /async escalate #8 \(p:m\) cancelled by user/)
})

test("边界 挂起分流 + 守卫统一（AC4）：ctx.signal aborted 或条目 controller aborted → 不落事件不入流（严格版守卫）", () => {
  // ① ctx.signal aborted（回合中止）：无 token、不入流、留池（中止清池在回合尾统一做）
  const p1 = mkParent({ _suspended: true })
  const c1 = mkCtx({ signal: { aborted: true } })
  const e1 = mkEntry(1, "explore")
  p1._asyncSubagents.set("1", e1)
  settleAsyncEntry(p1, e1, { pool: p1._asyncSubagents, ctx: c1 })
  assert.equal(c1.tokens.length, 0)
  assert.equal(p1._pendingAsyncResults.length, 0)
  assert.equal(p1._asyncSubagents.get("1"), e1)
  // ② 仅 controller aborted（会话中止传播——subagent 族旧守卫 !ctx.signal 会漏）：同样抑制
  const p2 = mkParent({ _suspended: true })
  const c2 = mkCtx()
  const e2 = mkEntry(2, "explore", { controller: { signal: { aborted: true } } })
  p2._asyncSubagents.set("2", e2)
  settleAsyncEntry(p2, e2, { pool: p2._asyncSubagents, ctx: c2 })
  assert.equal(c2.tokens.length, 0)
  assert.equal(p2._pendingAsyncResults.length, 0)
  // parentAborted 导出形态：cancelled 条目由 cancelled 分支先行分流（守卫语义独立）
  assert.equal(parentAborted(mkCtx(), mkEntry(9, "x")), false)
  assert.equal(parentAborted(mkCtx({ signal: { aborted: true } }), mkEntry(9, "x")), true)
  assert.equal(parentAborted(mkCtx(), mkEntry(9, "x", { controller: { signal: { aborted: true } } })), true)
})

test("边界 consult 信号（AC5）：ctx.signal 缺失——_sessionSignal 兜底生效（同其他三族）+ 升格完整 entry 停靠单容器", () => {
  // buildChildSignal 单点：_sessionSignal 优先；ctx.signal 兜底；皆缺 null
  const sessionSignal = { aborted: false }
  const parent = mkParent({ _sessionSignal: sessionSignal })
  const ctx = mkCtx()
  assert.equal(buildChildSignal(parent, ctx), sessionSignal)
  assert.equal(buildChildSignal(parent, null), sessionSignal)
  assert.equal(buildChildSignal(mkParent(), ctx), ctx.signal)
  assert.equal(buildChildSignal(mkParent(), null), null)
  // consult settle（sessionSettled 形态）：ctx null、pool null——恒停靠 pending 单容器、无 token
  let woken = 0
  parent._asyncWaiters.push(() => { woken++ })
  const entry = {
    id: "3", role: "consult", report: "[System reminder: consultation #3 finished — 2 of 2 models replied (0 failed)]",
    error: null, done: true, status: "done", cancelled: false,
    relayPrefix: null, startedAt: null, _settle: null, _settleSeq: 0,
  }
  settleAsyncEntry(parent, entry, { pool: null, ctx: null })
  assert.deepEqual(parent._pendingAsyncResults, [entry]) // 单容器 +role consult
  assert.equal(entry._inPending, true)
  assert.equal(woken, 1)                                // 唤醒挂起驱动（T-R17j——空闲 settle 触发消化）
  assert.equal(entry._settleSeq, 1)                     // settleSeq 同口径
})

test("错误 settle 落盘失败（AC1/N3）：advisor onAccounting hook 保留——settleAdvisorRun 记账仅非中止非取消执行（预算不消费）", () => {
  // hook 在 settled 分支执行（advisor 落盘记账的挂点——落盘失败语义由 design-token-
  // settlement.test.mjs 锁住；此处锁 hook 接线）。
  let accounting = 0
  const parent = mkParent()
  const ctx = mkCtx()
  const entry = mkEntry(1, "advisor")
  parent._asyncAdvisors.set("1", entry)
  settleAsyncEntry(parent, entry, { pool: parent._asyncAdvisors, ctx, onAccounting: () => { accounting++ } })
  assert.equal(accounting, 1)
  // cancelled → 不消费预算（hook 不执行）
  const pc = mkParent()
  const ec = mkEntry(2, "advisor", { cancelled: true })
  pc._asyncAdvisors.set("2", ec)
  settleAsyncEntry(pc, ec, { pool: pc._asyncAdvisors, ctx: mkCtx(), onAccounting: () => { accounting++ } })
  assert.equal(accounting, 1)
  // aborted → 不消费预算
  const pa = mkParent()
  const ea = mkEntry(3, "advisor")
  pa._asyncAdvisors.set("3", ea)
  settleAsyncEntry(pa, ea, { pool: pa._asyncAdvisors, ctx: mkCtx({ signal: { aborted: true } }), onAccounting: () => { accounting++ } })
  assert.equal(accounting, 1)
})

test("一致性（N1/AC1）：四族 settle 同守卫/同分流/同信号兜底——记账单点（公共尾部字面仅存于 async-settle.mjs）", () => {
  // 四族在相同守卫下走同一条分流（挂起 → 同容器；中止 → 同抑制）——已由上文各族用例
  // 覆盖；此处锁记账单点结构：settleSeq/_settle/唤醒 waiter 的逐字尾部不得再散落四族。
  const tail = "entry._settleSeq = (parent._asyncSettleSeq"
  for (const f of ["subagent-run.mjs", "advisor-async.mjs", "escalate-async.mjs", "consult.mjs"]) {
    const src = readFileSync(join(__dirname, "..", "src", "agent-tools", f), "utf8")
    assert.equal(src.includes(tail), false, `${f} 不得再含 settle 公共尾部逐字段（记账单点 = async-settle.mjs）`)
  }
  const helper = readFileSync(join(__dirname, "..", "src", "agent-tools", "async-settle.mjs"), "utf8")
  assert.equal(helper.includes(tail), true)
})

test("池 accessor（D1）：getAsyncPool 吸收双池——advisor → _asyncAdvisors，其余 → _asyncSubagents；未初始化 null", () => {
  const parent = mkParent()
  assert.equal(getAsyncPool(parent, "advisor"), parent._asyncAdvisors)
  assert.equal(getAsyncPool(parent, "subagent"), parent._asyncSubagents)
  assert.equal(getAsyncPool(parent, "explore"), parent._asyncSubagents)
  assert.equal(getAsyncPool(mkParent({ _asyncSubagents: undefined }), "subagent"), null)
  assert.equal(getAsyncPool({}, "advisor"), null)
})
