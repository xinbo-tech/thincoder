/**
 * advisor-pool-queue.test.mjs — ED-4（AGENT-LOOP.md §6.10 · 批 8 ENGINE-DEBT 条目 4）：
 * advisor 评审池满改排队——异 scope 恒可排队 / 同 scope 保拒 / 槽释放自动起跑 /
 * 排队条目取消（cancel + 中止清池两面）/ 零回归。
 *
 * 手法：直驱核内导出纯函数面（launchAsyncAdvisor / settleAsyncEntry / cancelAsyncAdvisor /
 * refillAdvisorQueue / discardAbortedAdvisors）——零网络：
 *  - 排队面不启动评审（launch 排队分支不调 entry.start）；
 *  - 槽释放测试以 stub `entry.start` 隔离 runner（只保真真 start 的前置三行：
 *    queued → running + position 清位 + startedAt——runner 与 settle 接线非本批面，
 *    由判据 5 的真 runner 用例自证）；
 *  - 判据 5 零回归以真 runner 裸父快速 settle 自证（design + 无 token ⇒ 启动拒绝前置，
 *    不进工具循环——秒级 settle，无网络）。
 * 判据 6（等待口径：queued 算在飞）已有 T-B5 覆盖（thincoder-cli/test/wait-for-advisor-pool.test.mjs）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import {
  launchAsyncAdvisor, cancelAsyncAdvisor, runningAdvisorCount, refillAdvisorQueue,
} from "../agent-tools/advisor-async.mjs"
import { settleAsyncEntry, tombstoneOf } from "../agent-tools/async-settle.mjs"
import { discardAbortedAdvisors } from "../agent-tools/async-discard.mjs"

// ─── 夹具 ──────────────────────────────────────────────────────────────

/** 裸父夹具（核内直驱——无网络无 LLM；config 走池限读取面）。 */
const mkParent = (over = {}) => ({
  cwd: process.cwd(),
  history: [],
  config: { agent: { poolLimits: { advisor: 4 } } },
  _asyncAdvisors: new Map(),
  ...over,
})

/** running 池条目真形状（launch 池条目同构——scope 守卫 / 计数 / 补位判定所需键）。 */
const runningEntry = (id, docSetKey, over = {}) => ({
  id, role: "advisor", reviewType: "design",
  run: { reviewType: "design", docSetKey, round: 0 },
  reviewId: `r${id}`, designId: null, designToken: null,
  documents: null, paths: null, object: null,
  relayPrefix: `advisor#${id}/`, status: "running", position: undefined,
  report: null, error: null, done: false, cancelled: false,
  promise: null, _settle: null, startedAt: Date.now(),
  controller: { signal: { aborted: false } },
  ...over,
})

/** design launch 参数（docSetKey 即 scope——同 scope 判据数据源）。 */
const designLaunch = (docSetKey) => ({
  reviewType: "design", documents: null, paths: null, object: null,
  designToken: null, designId: null,
  run: { reviewType: "design", docSetKey },
})

/** stub start：保真真 start 的前置三行（runner / settle 接线隔离——非队列机制面）。 */
const stubStart = (log) => (entry) => {
  entry.start = () => {
    entry.status = "running"
    entry.position = undefined
    entry.startedAt = Date.now()
    log.push(entry.id)
  }
}

// ─── 判据 1：异 scope 恒可排队 ────────────────────────────────────────

test("判据 1：池满 + 异 scope ⇒ ack 含 queued + position（非错误文案）；条目入独立队列不启动", () => {
  const p = mkParent({ config: { agent: { poolLimits: { advisor: 2 } } } })
  p._asyncAdvisors.set("r1", runningEntry("r1", "K1"))
  p._asyncAdvisors.set("r2", runningEntry("r2", "K2"))
  const tokens = []
  const ctx = { callbacks: { onToken: (t) => tokens.push(t) } }
  const r = launchAsyncAdvisor(p, ctx, designLaunch("K3"))
  assert.equal(r.error, undefined, "非错误文案")
  assert.equal(r.ok, true)
  assert.equal(r.queued, true, "ack 含 queued")
  assert.equal(r.position, 1, "ack 报 position")
  const e = p._asyncAdvisors.get(r.id)
  assert.equal(e.status, "queued", "条目状态 queued")
  assert.equal(e.position, 1)
  assert.equal(e.startedAt, null, "入队不启动（不占槽）")
  assert.equal(p._asyncAdvisorQueue.length, 1, "独立评审队列入队")
  assert.equal(p._asyncAdvisorQueue[0], e)
  assert.equal(runningAdvisorCount(p), 2, "排队不占槽——running 计数不变")
  assert.ok(tokens.some((t) => t.includes("⟦ev⟧queued\x1eslot\x1e1\x1equeued\x1e")), "排队块 token（slot 面）")
  assert.ok(!tokens.some((t) => t.includes("⟦ev⟧async")), "入队不 paint async 块（锚点 = 实际启动）")
  // 第二发异 scope 仍排队（position 递增——池满恒可排队）
  const r2 = launchAsyncAdvisor(p, ctx, designLaunch("K4"))
  assert.equal(r2.queued, true)
  assert.equal(r2.position, 2)
  assert.equal(p._asyncAdvisorQueue.length, 2)
  assert.equal(p._asyncAdvisors.size, 4, "两排队条目在池内（queued 态）")
})

// ─── 判据 3：同 scope 保拒（依赖理由）─────────────────────────────────

test("判据 3：同 scope 连发仍拒——文案含依赖语义（scope 守卫在容量关之前，不排队）", () => {
  const p = mkParent({ config: { agent: { poolLimits: { advisor: 1 } } } })
  p._asyncAdvisors.set("r1", runningEntry("r1", "K1"))
  const r = launchAsyncAdvisor(p, {}, designLaunch("K1"))
  assert.ok(r.error, "同 scope → 拒")
  assert.match(r.error, /settle 后逐个发起/, "拒文案含指引")
  assert.match(r.error, /this document set is still running/, "依赖语义（design = 文档集）")
  assert.equal(p._asyncAdvisorQueue?.length ?? 0, 0, "同 scope 不入队（拒——非排队）")
  assert.equal(p._asyncAdvisors.size, 1, "无新条目入池")
})

// ─── 判据 2：槽释放自动起跑（实测计数）────────────────────────────────

test("判据 2：槽释放 ⇒ 队首 queued → running（实测计数）+ 余项 position 重编号", () => {
  const p = mkParent({ config: { agent: { poolLimits: { advisor: 2 } } } })
  const r1 = runningEntry("r1", "K1")
  p._asyncAdvisors.set("r1", r1)
  p._asyncAdvisors.set("r2", runningEntry("r2", "K2"))
  const tokens = []
  const ctx = { callbacks: { onToken: (t) => tokens.push(t) } }
  const q1 = launchAsyncAdvisor(p, ctx, designLaunch("K3"))
  const q2 = launchAsyncAdvisor(p, ctx, designLaunch("K4"))
  const e1 = p._asyncAdvisors.get(q1.id)
  const e2 = p._asyncAdvisors.get(q2.id)
  const starts = []
  stubStart(starts)(e1)
  stubStart(starts)(e2)
  // r1 正常 settle（settled 分支——公共尾部 refillAdvisorQueue 补位）
  r1.report = "review report"
  settleAsyncEntry(p, r1, { pool: p._asyncAdvisors, ctx, onAccounting: () => {} })
  assert.equal(e1.status, "running", "队首 queued → running")
  assert.equal(e1.position, undefined, "position 清位")
  assert.deepEqual(starts, [e1.id], "补位启动 = 队首")
  assert.equal(runningAdvisorCount(p), 2, "实测计数回到上限（非仅文案）")
  assert.equal(p._asyncAdvisorQueue.length, 1)
  assert.equal(p._asyncAdvisorQueue[0], e2, "队首出队")
  assert.equal(e2.position, 1, "余项重编号")
  assert.ok(tokens.some((t) => t.includes("⟦ev⟧queued\x1eslot\x1e1\x1equeued\x1e")), "重编号后排队块刷新")
})

test("判据 2 补充：出队复检同 scope——被挡队首跳过、异 scope 后入者越过启动", () => {
  const p = mkParent({ config: { agent: { poolLimits: { advisor: 2 } } } })
  p._asyncAdvisors.set("r1", runningEntry("r1", "K1"))
  // 队列直构：队首 e1 的 scope 与 running r1 相同（启动时刻复检被挡）、e2 异 scope
  const e1 = { id: "e1", role: "advisor", reviewType: "design", run: { reviewType: "design", docSetKey: "K1" }, position: 1, relayPrefix: "advisor#e1/" }
  const e2 = { id: "e2", role: "advisor", reviewType: "design", run: { reviewType: "design", docSetKey: "K3" }, position: 2, relayPrefix: "advisor#e2/" }
  p._asyncAdvisorQueue = [e1, e2]
  p._asyncAdvisors.set("e1", e1) // queued 条目同池成员（launch 行为镜像——计数按池读）
  p._asyncAdvisors.set("e2", e2)
  const starts = []
  stubStart(starts)(e1)
  stubStart(starts)(e2)
  refillAdvisorQueue(p, () => {})
  assert.deepEqual(starts, [e2.id], "被挡队首跳过——后入异 scope 越过启动")
  assert.deepEqual(p._asyncAdvisorQueue, [e1], "被挡者留队")
  assert.equal(e1.position, 1, "留队者重编号（无空洞）")
  assert.equal(runningAdvisorCount(p), 2, "启动一个后计数到上限")
})

// ─── 判据 4：排队条目取消 ─────────────────────────────────────────────

test("判据 4：排队条目取消 ⇒ was:'queued' + 出队 + 池内无条目 + 余位重编号严格递增无空洞", () => {
  const p = mkParent({ config: { agent: { poolLimits: { advisor: 2 } } } })
  p._asyncAdvisors.set("r1", runningEntry("r1", "K1"))
  p._asyncAdvisors.set("r2", runningEntry("r2", "K2"))
  const q1 = launchAsyncAdvisor(p, {}, designLaunch("K3"))
  const q2 = launchAsyncAdvisor(p, {}, designLaunch("K4"))
  const r = cancelAsyncAdvisor(p, q1.id)
  assert.equal(r.status, "cancelled")
  assert.equal(r.was, "queued", "was 如实 queued（TUI 排队块移除判据）")
  assert.equal(p._asyncAdvisors.has(q1.id), false, "池内无该条目")
  assert.equal(p._asyncAdvisorQueue.length, 1)
  assert.deepEqual(p._asyncAdvisorQueue.map((e) => e.position), [1], "余位重编号严格递增无空洞")
  assert.equal(String(p._asyncAdvisorQueue[0].id), q2.id, "队首 = 第二发（entry id 数值面 / ack String 面——域惯例）")
  assert.equal(tombstoneOf(p, q1.id)?.status, "cancelled", "终态墓碑")
  // 队列清空后取消 → 报 done（终态面零回归）
  const r2 = cancelAsyncAdvisor(p, q2.id)
  assert.equal(r2.was, "queued")
  assert.equal(p._asyncAdvisorQueue.length, 0, "队列清空")
  assert.equal(p._asyncAdvisors.size, 2, "仅剩两条 running")
  const r3 = cancelAsyncAdvisor(p, q2.id)
  assert.equal(r3.status, "cancelled", "已取消 id 再取消 → 同一确认（af 批 fix 轮终态确认面——原 error 断言退役）")
})

test("判据 4 补充：中止清池 ⇒ queued advisor 出队 + 余位重编号 + wasStatus queued 面", () => {
  const p = mkParent({ config: { agent: { poolLimits: { advisor: 2 } } } })
  p._asyncAdvisors.set("r1", runningEntry("r1", "K1"))
  p._asyncAdvisors.set("r2", runningEntry("r2", "K2"))
  const q1 = launchAsyncAdvisor(p, {}, designLaunch("K3"))
  const q2 = launchAsyncAdvisor(p, {}, designLaunch("K4"))
  // Stop 逐链中止：queued 条目 controller 中止（queued 不启动但持 controller）
  p._asyncAdvisors.get(q1.id).controller.abort()
  p._asyncAdvisors.get(q2.id).controller.abort()
  const out = discardAbortedAdvisors(p)
  assert.equal(out.discarded.length, 2)
  assert.deepEqual(out.discarded.map((d) => d.wasStatus), ["queued", "queued"], "wasStatus 如实 queued")
  assert.equal(p._asyncAdvisors.has(q1.id), false, "出池")
  assert.equal(p._asyncAdvisorQueue.length, 0, "队列剔除")
  assert.equal(out.kept, 2, "running 未中止条目留池")
})

// ─── 判据 5：零回归（池未满 ⇒ 既有启动路径逐字同）────────────────────

test("判据 5：池未满 ⇒ 立即启动（ack 无 queued 键 / status running / async 块即 paint / 真 runner 快速 settle）", async () => {
  const p = mkParent() // 默认池限 4，池空
  const tokens = []
  const r = launchAsyncAdvisor(p, { callbacks: { onToken: (t) => tokens.push(t) } }, designLaunch("K0"))
  assert.equal(r.ok, true)
  assert.equal("queued" in r, false, "ack 不带 queued 键")
  assert.equal("position" in r, false, "ack 不带 position 键")
  const e = p._asyncAdvisors.get(r.id)
  assert.equal(e.status, "running", "立即启动（不排队）")
  assert.ok(e.startedAt != null)
  assert.equal(p._asyncAdvisorQueue?.length ?? 0, 0, "无队列创建")
  assert.ok(tokens.some((t) => t.includes("⟦ev⟧async\x1e")), "async 块立即 paint")
  // 真 runner 裸父 settle 自证（design + 无 token ⇒ 启动拒绝前置——不进工具循环，秒级）
  await Promise.race([
    e.promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error("TIMEOUT: runner did not settle")), 10_000)),
  ])
  assert.equal(e.done, true, "settle 记账完成（既有路径零回归）")
  assert.equal(e.status, "done")
})
