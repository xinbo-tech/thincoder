/**
 * advisor-cancel-faces.test.mjs — af 批（2026-09-17 异步面收尾）核侧用例宿主：T-AF1–T-AF4 /
 * T-AF8–T-AF10（批档 `docs/batches/2026-09-17-async-face-fixes.md` §2.7 / §2.12 / §2.14 用例表）。
 *
 * 覆盖面（一条一判据——AC 回指见各例名）：
 *  - T-AF1/AF2/AF4（#20 · AC-AF1/2）：queued 取消收尾三面（机读线提醒 / `⟦ev⟧cancelled` 单点发射 /
 *    出队 + 余位重编号 + 出池 + 墓碑）+ 幂等（同一确认 + 零重复注入 / 发射 / 日志）；
 *  - T-AF3（#21 · AC-AF3）：部分 parent（只携池 + `history`）下队列载体吸收 ⇒ 零残留 + 终态守卫
 *    使该条目 `start()` 零调用（**先红**：原直读 no-op ⇒ 残留 1 + 重启 1）；
 *  - T-AF8（#31 c1 · AC-AF6）：终态守卫谓词（`queueRunnable` 三形 false / 活条目 true）+ 补位零启动；
 *  - T-AF9（#20 · F-3② · AC-AF8）：工具路径收口（`executeCancelAction` advisor 落池分支经核单点）；
 *  - T-AF10（F-6 · AC-AF9）：日志面（queued 出队点直记 / running 经 settle——写点互斥恰一条）。
 *
 * 手法：直驱核导出（零网络 / 零 LLM——排队条目从不 start；T-AF10 以 `THINCODER_LOG_DIR`
 * 隔离目录读档）。夹具与 `advisor-pool-queue.test.mjs`（ED-4 池/队列面）同形但**独立自持**
 * （两档均 <300 行——`core-hygiene.test.mjs` 软线机检）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { launchAsyncAdvisor, cancelAsyncAdvisor, runningAdvisorCount, refillAdvisorQueue } from "../agent-tools/advisor-async.mjs"
import { settleAsyncEntry, tombstoneOf } from "../agent-tools/async-settle.mjs"
import { queueRunnable, maybeRefillAsync } from "../agent-tools/subagent-scheduler.mjs"
import { cancelAsyncSubagent, executeCancelAction } from "../agent-tools/subagent-async.mjs"
import { todayLogPath } from "../log.mjs"

// ─── 夹具（同 `advisor-pool-queue.test.mjs` 形——本档自持）───────────────────

const mkParent = (over = {}) => ({
  cwd: process.cwd(),
  history: [],
  config: { agent: { poolLimits: { advisor: 4 } } },
  _asyncAdvisors: new Map(),
  ...over,
})

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

const designLaunch = (docSetKey) => ({
  reviewType: "design", documents: null, paths: null, object: null,
  designToken: null, designId: null,
  run: { reviewType: "design", docSetKey },
})

/** 池满 + 异 scope 两发（队首 q1 / 队尾 q2——queued 取消夹具公共形）。 */
function mkFullPoolQueue(limit = 2) {
  const p = mkParent({ config: { agent: { poolLimits: { advisor: limit } } } })
  p._asyncAdvisors.set("r1", runningEntry("r1", "K1"))
  p._asyncAdvisors.set("r2", runningEntry("r2", "K2"))
  const q1 = launchAsyncAdvisor(p, {}, designLaunch("K3"))
  const q2 = launchAsyncAdvisor(p, {}, designLaunch("K4"))
  return { p, q1, q2 }
}

// ─── T-AF1 / T-AF2 / T-AF4（#20 · AC-AF1 / AC-AF2）──────────────────────────

test("T-AF1 queued 取消收尾三面：机读线恰 +1 + ⟦ev⟧cancelled 恰 1（零 ⟦ev⟧stopped）+ 出队/出池/墓碑/余位重编号", () => {
  const { p, q1, q2 } = mkFullPoolQueue()
  const before = p.history.length
  const tokens = []
  const r = cancelAsyncAdvisor(p, q1.id, (t) => tokens.push(t))
  assert.equal(r.status, "cancelled")
  assert.equal(r.was, "queued", "was 如实 queued")
  // ① 机读线提醒（逐字同 running 面模板——`async-settle.mjs` cancelled 分支同一条）
  const added = p.history.slice(before)
  assert.equal(added.length, 1, "机读线恰 +1 条")
  assert.equal(added[0].role, "user")
  assert.match(added[0].content, /^\[System reminder: async advisor review #\d+ cancelled — the review did not settle; token not issued \(评审已取消——token 未签发\)\]$/)
  // ② 块面事件（唯一发射点——经调用方通道；relay 前缀 advisor#<id>/）
  assert.deepEqual(tokens.filter((t) => t.includes("⟦ev⟧cancelled")), [`advisor#${q1.id}/⟦ev⟧cancelled\x1e`], "⟦ev⟧cancelled 恰 1")
  assert.equal(tokens.filter((t) => t.includes("⟦ev⟧stopped")).length, 0, "零 ⟦ev⟧stopped（不经 settle）")
  // ③ 池面 / 队列面
  assert.equal(p._asyncAdvisors.has(q1.id), false, "出池")
  assert.equal(tombstoneOf(p, q1.id)?.status, "cancelled", "cancelled 墓碑")
  assert.deepEqual(p._asyncAdvisorQueue.map((e) => [String(e.id), e.position]), [[q2.id, 1]], "出队 + 余位重编号")
  assert.equal(runningAdvisorCount(p), 2, "排队取消不释放槽（running 计数不变）")
})

test("T-AF2 同一 queued id 重复取消：同一确认（cancelled）+ 零重复注入 / 零重复发射 / 零重复日志 / 队列与池零变", () => {
  const dir = mkdtempSync(join(tmpdir(), "tc-af-taf2-log-"))
  const prev = process.env.THINCODER_LOG_DIR
  process.env.THINCODER_LOG_DIR = dir
  try {
    const { p, q1 } = mkFullPoolQueue()
    const tokens = []
    const first = cancelAsyncAdvisor(p, q1.id, (t) => tokens.push(t))
    assert.equal(first.status, "cancelled")
    const lines = p.history.length
    const n = tokens.length
    const again = cancelAsyncAdvisor(p, q1.id, (t) => tokens.push(t))
    // 终态确认面（tombstone 在册）：与 running 面同形确认 `{id, status}`——`was` 不回传
    //（墓碑形状单源 `{status, role}` 不改——af 批 fix 轮最小方案）
    assert.equal(again.status, "cancelled", "同一确认（cancelled——非既有 unknown-id error）")
    assert.equal(again.id, first.id, "同一 id")
    assert.equal(p.history.length, lines, "零重复机读线注入")
    assert.equal(tokens.length, n, "零重复 token（零重复发射）")
    assert.equal(p._asyncAdvisorQueue.length, 1, "队列零变（不重复出队）")
    assert.equal(p._asyncAdvisors.has(q1.id), false, "池零变（不重建条目）")
    // 零重复日志：该 id 的 ev:cancelled 恰 1 条（重复取消在写点前早退——不落第二条）
    const log = readFileSync(todayLogPath(), "utf8").trim().split("\n").map((l) => JSON.parse(l))
    assert.equal(log.filter((l) => l.ev === "ev:cancelled" && l.id === `advisor#${q1.id}`).length, 1, "零重复日志（ev:cancelled 恰 1 条）")
  } finally {
    if (prev === undefined) delete process.env.THINCODER_LOG_DIR
    else process.env.THINCODER_LOG_DIR = prev
    rmSync(dir, { recursive: true, force: true })
  }
})

test("T-AF4 取消队尾项：余项 position 严格 1..n（无空洞）+ 队序保持", () => {
  const p = mkParent({ config: { agent: { poolLimits: { advisor: 1 } } } })
  p._asyncAdvisors.set("r1", runningEntry("r1", "K1"))
  const a = launchAsyncAdvisor(p, {}, designLaunch("K2"))
  const b = launchAsyncAdvisor(p, {}, designLaunch("K3"))
  const c = launchAsyncAdvisor(p, {}, designLaunch("K4"))
  assert.deepEqual(p._asyncAdvisorQueue.map((e) => e.position), [1, 2, 3], "入队序 1..3")
  assert.equal(cancelAsyncAdvisor(p, c.id).was, "queued")
  assert.deepEqual(p._asyncAdvisorQueue.map((e) => [String(e.id), e.position]), [[a.id, 1], [b.id, 2]], "队尾剔除 + 余项严格递增")
})

// ─── T-AF3（#21 · AC-AF3——先红）────────────────────────────────────────────

test("T-AF3 部分 parent（仅池 + history）下 queued 取消：队列零残留 + 槽释放后该条目 start() 零调用", () => {
  // VSC 形夹具：队列写侧经访问器别名落 `history`（跨 run 载体）；取消路径用**部分 parent**
  //（只携池 + `history`——合成父形）——`_asyncAdvisorQueue` 无自有字段。
  const history = []
  history._asyncTombstones = new Map() // 载体已有墓碑容器（任何先前 settle/消费后即此形）——借用面
  const p = mkParent({ history, config: { agent: { poolLimits: { advisor: 1 } } } })
  Object.defineProperty(p, "_asyncAdvisorQueue", {
    configurable: true,
    get() { return history._asyncAdvisorQueue },
    set(v) { history._asyncAdvisorQueue = v },
  })
  const r1 = runningEntry("r1", "K1")
  p._asyncAdvisors.set("r1", r1)
  const ack = launchAsyncAdvisor(p, {}, designLaunch("K2")) // 池满 ⇒ queued
  const q = p._asyncAdvisors.get(ack.id)
  assert.equal(history._asyncAdvisorQueue.length, 1, "队列容器落跨 run 载体（VSC 形）")
  const partial = { _asyncAdvisors: p._asyncAdvisors, history }
  const r = cancelAsyncAdvisor(partial, ack.id)
  assert.equal(r.was, "queued")
  assert.equal(history._asyncAdvisorQueue.length, 0, "队列零残留（载体吸收——原直读 no-op 时残留 1）")
  const starts = []
  q.start = () => { starts.push(q.id) } // stub（runner 隔离——真 start 由 `advisor-pool-queue` 判据 5 覆盖）
  r1.report = "review report"
  settleAsyncEntry(p, r1, { pool: p._asyncAdvisors, ctx: {}, onAccounting: () => {} }) // 槽释放 → 补位
  assert.deepEqual(starts, [], "终态条目 start() 零调用（c1——原补位重启实发 1）")
  assert.equal(q.cancelled, true)
  assert.equal(q.done, true)
  assert.equal(tombstoneOf(p, ack.id)?.status, "cancelled", "墓碑经载体吸收落 history 容器")
})

test("T-AF3′ 载体吸收第三读面（§6.10 ④ 补位）：部分 parent（仅池 + history）下 refillAdvisorQueue 命中 history 队列 ⇒ 可启动项启动", () => {
  const history = []
  const p = mkParent({ history, config: { agent: { poolLimits: { advisor: 1 } } } })
  Object.defineProperty(p, "_asyncAdvisorQueue", {
    configurable: true,
    get() { return history._asyncAdvisorQueue },
    set(v) { history._asyncAdvisorQueue = v },
  })
  p._asyncAdvisors.set("r1", runningEntry("r1", "K1"))
  const ack = launchAsyncAdvisor(p, {}, designLaunch("K2")) // 池满 ⇒ queued（队列落 history）
  assert.equal(history._asyncAdvisorQueue.length, 1, "队列容器落跨 run 载体（VSC 形）")
  const starts = []
  p._asyncAdvisors.get(ack.id).start = () => { starts.push(ack.id) } // stub（runner 隔离）
  p._asyncAdvisors.delete("r1") // 槽释放
  const partial = { _asyncAdvisors: p._asyncAdvisors, history } // 无自有队列字段（合成父形）
  refillAdvisorQueue(partial, () => {})
  assert.deepEqual(starts, [ack.id], "部分 parent 下补位启动（原直读 no-op ⇒ 零启动）")
  assert.equal(history._asyncAdvisorQueue.length, 0, "启动即出队")
})

// ─── T-AF8（#31 c1 · AC-AF6）──────────────────────────────────────────────

test("T-AF8 终态守卫（c1）：queueRunnable 三形全 false / 活条目仍 true；终态条目补位零启动", () => {
  const p = mkParent()
  const live = { id: 1, role: "coder", _files: [], _dependsOn: [], done: false, cancelled: false }
  assert.equal(queueRunnable(p, live), true, "活条目仍 true（零回归）")
  assert.equal(queueRunnable(p, { ...live, id: 2, cancelled: true }), false, "cancelled:true → false")
  assert.equal(queueRunnable(p, { ...live, id: 3, done: true }), false, "done:true → false")
  assert.equal(queueRunnable(p, { ...live, id: 4, done: true, cancelled: true }), false, "双真 → false")
  // 实跑：终态条目滞留队列 ⇒ 补位零启动（子代理族消费点 = queueRunnable 经 maybeRefillAsync）
  const starts = []
  const dead = { ...live, id: 9, status: "queued", done: true, cancelled: true, _pool: "other", position: 1, relayPrefix: "coder#9/", start: () => { starts.push(9) } }
  const p2 = mkParent({ _asyncQueue: [dead], _asyncSubagents: new Map([["9", dead]]) })
  maybeRefillAsync(p2)
  assert.deepEqual(starts, [], "补位不启动终态条目（幻影唯一燃料封死）")
})

// ─── T-AF9（#20 · F-3② · AC-AF8）───────────────────────────────────────────

test("T-AF9 工具路径收口（F-3②）：executeCancelAction advisor queued 取消 ⇒ ⟦ev⟧cancelled 恰 1 + 余位刷新；重复取消零新增", () => {
  const { p, q1, q2 } = mkFullPoolQueue()
  const tokens = []
  const ctx = { agent: p, depth: 0, callbacks: { onToken: (t) => tokens.push(t) } }
  const r = JSON.parse(executeCancelAction({ id: q1.id }, ctx))
  assert.equal(r.status, "cancelled")
  assert.equal(r.was, "queued")
  assert.deepEqual(tokens.filter((t) => t.includes("⟦ev⟧cancelled")), [`advisor#${q1.id}/⟦ev⟧cancelled\x1e`], "恰 1 条（核单点发射——本路径不另发）")
  assert.equal(tokens.filter((t) => t.includes("⟦ev⟧stopped")).length, 0, "零 ⟦ev⟧stopped")
  assert.ok(tokens.some((t) => t === `advisor#${q2.id}/⟦ev⟧queued\x1eslot\x1e1\x1equeued\x1e`), "余位重编号刷新 token（q2 → position 1）")
  const n = tokens.length
  // 终态确认面（af 批 fix 轮）：工具路径重复取消同幂等——墓碑在册 ⇒ 同一确认（非 error）
  assert.equal(JSON.parse(executeCancelAction({ id: q1.id }, ctx)).status, "cancelled", "重复取消 → 同一确认（tombstone 在册）")
  assert.equal(tokens.length, n, "重复取消零新增 token")
})

// ─── T-AF10（F-6 · AC-AF9）────────────────────────────────────────────────

test("T-AF10 日志面（F-6）：queued 取消直记 ev:cancelled 恰 1 条（两族）；running 面经 settle 仍恰 1（写点互斥）", () => {
  const dir = mkdtempSync(join(tmpdir(), "tc-af-log-"))
  const prev = process.env.THINCODER_LOG_DIR
  process.env.THINCODER_LOG_DIR = dir
  try {
    // ① 评审族 queued（出队点直记）
    const { p, q1 } = mkFullPoolQueue()
    cancelAsyncAdvisor(p, q1.id)
    // ② 子代理族 queued（出队点直记）
    const sp = mkParent({ _asyncSubagents: new Map() })
    const sq = {
      id: 9, role: "coder", relayPrefix: "coder#9/", status: "queued", position: 1,
      done: false, cancelled: false, _files: [], _dependsOn: [], _settle: null,
    }
    sp._asyncSubagents.set("9", sq)
    cancelAsyncSubagent(sp, 9)
    // ③ running 取消（经 settle 三分支——不经 ①②）
    const rp = mkParent()
    const re = runningEntry("7", "K7")
    rp._asyncAdvisors.set("7", re)
    cancelAsyncAdvisor(rp, 7)
    settleAsyncEntry(rp, re, { pool: rp._asyncAdvisors, ctx: {}, onAccounting: () => {} })
    const lines = readFileSync(todayLogPath(), "utf8").trim().split("\n").map((l) => JSON.parse(l))
    const ids = lines.filter((l) => l.ev === "ev:cancelled").map((l) => l.id)
    assert.equal(ids.filter((id) => id === `advisor#${q1.id}`).length, 1, "评审族 queued 恰 1 条")
    assert.equal(ids.filter((id) => id === "coder#9").length, 1, "子代理族 queued 恰 1 条（同事件名 / 同字段形）")
    assert.equal(ids.filter((id) => id === "advisor#7").length, 1, "running 面经 settle 恰 1 条（写点互斥不重复记）")
  } finally {
    if (prev === undefined) delete process.env.THINCODER_LOG_DIR
    else process.env.THINCODER_LOG_DIR = prev
    rmSync(dir, { recursive: true, force: true })
  }
})
