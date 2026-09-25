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
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"
import {
  settleAsyncEntry, getAsyncPool, parkAsyncPending, parentAborted, buildChildSignal,
} from "@thincoder/core/agent-tools/async-settle.mjs"
import { injectAsyncResult, DIGEST_INJECT_BUDGET, _setDigestOffloadDirForTest } from "@thincoder/core/agent-tools/subagent-async.mjs"
import { injectConsultResult } from "@thincoder/core/agent-tools/consult.mjs"

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

test("腾槽补位（旧行为零回归）：cancelled settle 释放槽 → queued 头自动启动（AGENT-LOOP-SUBAGENT.md §6.9：settle/cancel 释放槽后启动到槽满）", () => {
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

test("池 accessor（D1）：getAsyncPool 吸收双池——advisor → _asyncAdvisors，其余 → _asyncSubagents；未初始化 null", () => {
  const parent = mkParent()
  assert.equal(getAsyncPool(parent, "advisor"), parent._asyncAdvisors)
  assert.equal(getAsyncPool(parent, "subagent"), parent._asyncSubagents)
  assert.equal(getAsyncPool(parent, "explore"), parent._asyncSubagents)
  assert.equal(getAsyncPool(mkParent({ _asyncSubagents: undefined }), "subagent"), null)
  assert.equal(getAsyncPool({}, "advisor"), null)
})

// ─── BATCH-3-STRUCTURE F-2：digest 注入批量预算（CLI 端——2026-09-09）───
// 用例表 1:1：3 条 pending 30K+30K+40K（100K > 64K——尺寸钉死）→ 后条清单行（报告已落盘
// <path>——不 inline 全文）；累计恰 64K → 全部 inline（预算含边界）；单条 ≤64K 不回归 + 轮
// 复位/隔离。digest 轮 = 同 agent 连续注入（历史无他人落史）；预算状态键 agent——每例新
// parent 即新轮。落盘目录经 _setDigestOffloadDirForTest 沙箱（生产路径 configDir/tool-results）。

function mkBig(id, ch, n) {
  return mkEntry(id, "explore", { report: ch.repeat(n) })
}

function assertInline(msg, ch) {
  assert.ok(msg.content.includes(ch.repeat(200)), `${ch}×200 头段 inline`)
}

test("F-2 超预算：单 digest 轮 30K+30K+40K（合计 100K > 64K）→ 后条清单行不 inline（全文落盘 path 钉死）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tc-digest-"))
  _setDigestOffloadDirForTest(dir)
  try {
    const parent = mkParent()
    await injectAsyncResult(parent, mkBig(1, "A", 30000))
    await injectAsyncResult(parent, mkBig(2, "B", 30000))
    await injectAsyncResult(parent, mkBig(3, "C", 40000))
    assert.equal(parent.history.length, 3)
    assertInline(parent.history[0], "A")
    assertInline(parent.history[1], "B") // 累计 60K ≤ 64K——第二条仍 inline
    const third = parent.history[2].content
    assert.ok(!third.includes("C".repeat(200)), "第三条不 inline 全文")
    const m = third.match(/saved to disk[^:]*: (.+)/)
    assert.ok(m, "清单行含落盘 path（报告已落盘 <path> 形态）")
    const file = m[1].trim().split(/\n/)[0]
    assert.ok(file.startsWith(dir), "path 来源 = digest 落盘目录")
    assert.ok(file.includes("-async-subagent-3.log"), "命名同 offload 约定（callId 入名）")
    assert.equal(readFileSync(file, "utf8"), "C".repeat(40000), "清单行指向的文件 = 第三条全文")
    // 轮复位：历史他人落史（下一请求窗口）→ 预算清零——后续单条照旧 inline
    parent.history.push({ role: "user", content: "next turn" })
    await injectAsyncResult(parent, mkBig(4, "D", 20000))
    assert.equal(parent.history.length, 5)
    assertInline(parent.history[4], "D") // 新轮（累计不跨轮残留）
  } finally {
    _setDigestOffloadDirForTest(null)
    rmSync(dir, { recursive: true, force: true })
  }
})

test("F-2 边界：累计恰 64K（32K+32K）全部 inline——预算含边界（≤ 判定）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tc-digest-"))
  _setDigestOffloadDirForTest(dir)
  try {
    assert.equal(DIGEST_INJECT_BUDGET, 65536, "预算常量 64K")
    const parent = mkParent()
    await injectAsyncResult(parent, mkBig(1, "A", 32768))
    await injectAsyncResult(parent, mkBig(2, "B", 32768))
    assert.equal(parent.history.length, 2)
    assertInline(parent.history[0], "A")
    assertInline(parent.history[1], "B") // 65536 ≤ 64K——含边界全 inline
  } finally {
    _setDigestOffloadDirForTest(null)
    rmSync(dir, { recursive: true, force: true })
  }
})

test("F-2 单条 ≤64K 不回归 + 空轮 no-op：预算不跨 agent 残留（轮隔离）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tc-digest-"))
  _setDigestOffloadDirForTest(dir)
  try {
    const heavy = mkParent()
    await injectAsyncResult(heavy, mkBig(1, "A", 60000)) // 耗满一轮
    assertInline(heavy.history[0], "A")
    // 空轮（无 pending → 无注入调用）不改变任何状态——新 agent 首条即新轮：恒 inline
    const fresh = mkParent()
    await injectAsyncResult(fresh, mkBig(1, "B", 30000))
    assert.equal(fresh.history.length, 1)
    assertInline(fresh.history[0], "B") // 单条 ≤64K 不回归（预算按 agent 隔离——heavy 轮不泄漏）
  } finally {
    _setDigestOffloadDirForTest(null)
    rmSync(dir, { recursive: true, force: true })
  }
})

test("F-2 落盘失败兜底：persist 失败 → 回退常规 inline（不吞报告不抛——结果零丢失）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tc-digest-"))
  const blocker = join(dir, "blocker") // 已存在文件——mkdir 必败 → persistDigestReport catch → null
  writeFileSync(blocker, "x", "utf8")
  _setDigestOffloadDirForTest(blocker)
  try {
    const parent = mkParent()
    await injectAsyncResult(parent, mkBig(1, "A", 30000))
    await injectAsyncResult(parent, mkBig(2, "C", 40000)) // 累计 70K > 64K → 超限 → 落盘失败兜底
    assert.equal(parent.history.length, 2, "两注均入史（中途不抛——余条不丢）")
    assertInline(parent.history[0], "A")
    assertInline(parent.history[1], "C") // 兜底：全文 inline——报告不丢
  } finally {
    _setDigestOffloadDirForTest(null)
    rmSync(dir, { recursive: true, force: true })
  }
})

// ─── 群 B 批 B5（§22 D-DG2）：四族全接线（T-DG1~T-DG3）───
// 预算单源 = digest-budget.mjs（常量/判超/记账/落盘四处合一）——四族注入器共用同一轮累计
// （跨族合计生效）；raw = 报告正文（不含 `[System reminder: …]` 标签行）；首条豁免保留；
// 落盘 tag = 写入族 + 条目 id（文件名后缀——subagent/advisor/escalate 经本入口沿用既有
// `async-subagent-<id>` callId）。

test("B5 T-DG1 正常：同轮两条 consult（各 40K——合计 80K > 64K）→ 首条 inline、次条清单行 + 全文落盘", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tc-digest-"))
  _setDigestOffloadDirForTest(dir)
  try {
    const parent = mkParent()
    // 真 shape：report = 组合 digest（首行标签 + 正文）——D-DG3 口径：标签行不计入预算
    const digest = (id, n) => `[System reminder: consultation #${id} finished — 1 of 1 models replied (0 failed)]\n${"A".repeat(n)}`
    await injectConsultResult(parent, { id: 1, report: digest(1, 40000) })
    await injectConsultResult(parent, { id: 2, report: digest(2, 40000) })
    assert.equal(parent.history.length, 2, "两注均入史")
    assertInline(parent.history[0], "A") // 首条豁免：40K inline 预览
    assert.ok(parent.history[0].content.includes("consultation #1 finished"), "首条标签行在（inline 路零改——单条 offload 路径零改）")
    const second = parent.history[1].content
    assert.ok(!second.includes("A".repeat(200)), "次条不 inline 全文（族接线生效）")
    assert.ok(second.includes("consultation #2 finished"), "次条保留族标签行（超限消息 = 标签行 + 清单行——与 VSC 镜像同形）")
    const m = second.match(/saved to disk[^:]*: (.+)/)
    assert.ok(m, "清单行含落盘 path")
    const file = m[1].trim().split(/\n/)[0]
    assert.ok(file.startsWith(dir), "path 来源 = digest 落盘目录")
    assert.ok(file.includes("-consult-2.log"), "consult tag 入名")
    assert.equal(readFileSync(file, "utf8"), "A".repeat(40000), "落盘 = 正文（标签行不入盘——D-DG3 口径）")
  } finally {
    _setDigestOffloadDirForTest(null)
    rmSync(dir, { recursive: true, force: true })
  }
})

test("B5 T-DG2 正常：三族既有路径超限形态——迁移后清单行行为恒等（零回归对照）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tc-digest-"))
  _setDigestOffloadDirForTest(dir)
  try {
    const parent = mkParent()
    await injectAsyncResult(parent, mkBig(1, "A", 30000)) // subagent 族
    await injectAsyncResult(parent, mkEntry(2, "advisor", { report: "B".repeat(30000) })) // advisor 族——累计 60K ≤ 64K
    await injectAsyncResult(parent, mkEntry(3, "escalate", { report: "C".repeat(40000) })) // escalate 族——累计 100K → 超限
    assert.equal(parent.history.length, 3)
    assertInline(parent.history[0], "A")
    assertInline(parent.history[1], "B")
    assert.ok(!parent.history[2].content.includes("C".repeat(200)), "第三条不 inline 全文")
    const file = parent.history[2].content.match(/saved to disk[^:]*: (.+)/)[1].trim().split(/\n/)[0]
    assert.ok(file.includes("-async-subagent-3.log"), "既有 callId 命名零变（迁移恒等）")
    assert.equal(readFileSync(file, "utf8"), "C".repeat(40000), "全文落盘")
    assert.ok(parent.history[2].content.includes("async escalate #3"), "族标签行保留（文案零变）")
  } finally {
    _setDigestOffloadDirForTest(null)
    rmSync(dir, { recursive: true, force: true })
  }
})

test("B5 T-DG3 边界：跨族同轮共享预算（subagent 40K + consult 40K）→ 次条判超（单源记账）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tc-digest-"))
  _setDigestOffloadDirForTest(dir)
  try {
    const parent = mkParent()
    await injectAsyncResult(parent, mkBig(1, "E", 40000))
    await injectConsultResult(parent, { id: 2, report: "F".repeat(40000) })
    assertInline(parent.history[0], "E")
    assert.ok(!parent.history[1].content.includes("F".repeat(200)), "次条（consult）判超——跨族合计（共享预算）")
    const file = parent.history[1].content.match(/saved to disk[^:]*: (.+)/)[1].trim().split(/\n/)[0]
    assert.ok(file.includes("-consult-2.log"))
    assert.equal(readFileSync(file, "utf8"), "F".repeat(40000), "次条全文落盘")
  } finally {
    _setDigestOffloadDirForTest(null)
    rmSync(dir, { recursive: true, force: true })
  }
})

