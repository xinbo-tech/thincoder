/**
 * subagent-scheduler.test.mjs — 文件域归一化边界（CODE-HARDENING-BATCH §2.7，2026-09-08）：
 * normalizeFileList 尾随空格目录声明（"test/ "、"test\ "）→ throw 目录声明错误（fail-closed）。
 * 纯单元（无 io——目录检测分支用字符串形态，不触真实 fs）。
 * 后续批次节：SCHEDULER-DYNAMIC-DOMAIN（动态域）/ SUBAGENT-ID-COUNTER-AGENT（本体计数器）。
 * 并档注（2026-09-11 TEST-LIFECYCLE 扫①——设计档 TESTING.md §7.2 #3）：原 subagent-id-counter.test.mjs
 * 全量并入（真实 spawn 链路形态两用例——文末「链路形态」节；源档随并删除）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { resolve } from "node:path"
import { normalizeFileList, effectiveFiles, describeBlockers, queueRunnable, detectStall, maybeRefillAsync, nextSubagentId } from "@thincoder/core/agent-tools/subagent-scheduler.mjs"
import { buildSpawnChild } from "@thincoder/core/agent-tools/subagent-spawn.mjs"
import { executeAsyncSpawn } from "@thincoder/core/agent-tools/subagent-run.mjs"

test("2.7 尾随空格目录声明（\"test/ \"）被识别为目录声明 throw", () => {
  assert.throws(() => normalizeFileList(["test/ "], "C:/w"), /directory declarations are not supported/)
  assert.throws(() => normalizeFileList(["a/b/ "], "C:/w"), /directory declarations are not supported/)
})

test("2.7 尾随空格反斜杠目录声明（\"test\\ \"）同拒（win32 形态）", () => {
  assert.throws(() => normalizeFileList(["test\\ "], "C:/w"), /directory declarations are not supported/)
})

test("2.7 无尾随空格不受影响：文件级路径归一化通过，纯目录形态照旧拒", () => {
  assert.throws(() => normalizeFileList(["test/"], "C:/w"), /directory declarations are not supported/)
  assert.deepEqual(normalizeFileList(["src/a.mjs"], "C:/w"), [resolve("C:/w", "src/a.mjs")])
})

// ─── SCHEDULER-DYNAMIC-DOMAIN（2026-09-09）——动态域 = 声明 ∪ running touched ───
const W = "C:/w"
const abs = (f) => resolve(W, f)
const pool = (...entries) => ({ cwd: W, _asyncSubagents: new Map(entries.map((e) => [String(e.id), e])) }) // CLI 池键为字符串（depInfo get(String(id))）

test("动态域 effectiveFiles：queued/running 无 childAgent 只声明域（`?.` null 安全——零行为变化）", () => {
  const declared = [abs("src/a.mjs")]
  assert.deepEqual(effectiveFiles({ status: "queued", _files: declared }), declared)
  assert.deepEqual(effectiveFiles({ status: "running", _files: declared }), declared)
  assert.deepEqual(effectiveFiles({ status: "running" }), [])
})

test("动态域 effectiveFiles：running + childAgent touched → 声明 ∪ touched（fileKey 去重）", () => {
  const e = { status: "running", _files: [abs("src/a.mjs")], childAgent: { _touchedFiles: [abs("src/b.mjs"), abs("src/a.mjs")] } }
  assert.deepEqual(effectiveFiles(e), [abs("src/a.mjs"), abs("src/b.mjs")])
})

test("动态域：running touched（未声明）撞新声明域 → queueRunnable 拒 + waiting 注（运行中实际写入）", () => {
  const running = { id: 1, role: "eng-coder", status: "running", _files: [abs("src/x.mjs")], childAgent: { _touchedFiles: [abs("src/y.mjs")] } }
  const queued = { id: 2, role: "explore", status: "queued", _files: [abs("src/y.mjs")] }
  const p = pool(running, queued)
  assert.equal(queueRunnable(p, queued), false)
  const blk = describeBlockers(p, queued)
  assert.equal(blk.kind, "wait")
  assert.match(blk.detail, /域冲突 src[\\/]y\.mjs（运行中实际写入）/)
})

test("动态域：纯声明冲突文案不回归（含声明∩touched 重叠优先级——∈ 声明域不加注）", () => {
  const running = { id: 1, role: "eng-coder", status: "running", _files: [abs("src/x.mjs")], childAgent: { _touchedFiles: [abs("src/x.mjs"), abs("src/z.mjs")] } }
  const queued = { id: 2, role: "explore", status: "queued", _files: [abs("src/x.mjs")] }
  const blk = describeBlockers(pool(running, queued), queued)
  assert.match(blk.detail, /域冲突 src[\\/]x\.mjs）/)
  assert.doesNotMatch(blk.detail, /运行中实际写入/)
})

test("动态域：queued 条目只按声明域判（无 childAgent——既有序判定零变化）", () => {
  const first = { id: 1, role: "eng-coder", status: "queued", _files: [abs("src/x.mjs")] }
  const second = { id: 2, role: "explore", status: "queued", _files: [abs("src/x.mjs")] }
  const p = pool(first, second)
  assert.equal(queueRunnable(p, second), false) // 先入者阻断
  assert.equal(queueRunnable(p, first), true) // 先入者自身可启动
})

test("detectStall 回归：混合边闭环判定零变化（动态域读法对停滞检测零增量——running 锚点守卫）", () => {
  const a = { id: 1, role: "eng-coder", status: "queued", _files: [abs("src/x.mjs")], _dependsOn: [3] }
  const b = { id: 2, role: "explore", status: "queued", _files: [abs("src/x.mjs")] }
  const c = { id: 3, role: "explore", status: "queued", _dependsOn: [2] }
  const stall = detectStall(pool(a, b, c))
  assert.ok(stall?.chains?.length > 0)
})

test("动态域 F-3：refill 重扫实时见 running touched——冲突 queued 不启动（touched 清空后即补位）", () => {
  const running = { id: 1, role: "eng-coder", status: "running", _pool: "other", _files: [], childAgent: { _touchedFiles: [abs("src/y.mjs")] } }
  let started = 0
  const queued = { id: 2, role: "explore", status: "queued", _pool: "other", _files: [abs("src/y.mjs")], start() { started++ } }
  const p = pool(running, queued)
  p._asyncQueue = [queued]
  maybeRefillAsync(p)
  assert.equal(started, 0) // refill 重扫见新 touched——不启动冲突
  running.childAgent._touchedFiles = []
  maybeRefillAsync(p)
  assert.equal(started, 1) // touched 清空后补位启动
})

// ─── SUBAGENT-ID-COUNTER-AGENT（2026-09-09）——id 计数器载体 = agent 本体 ───
// 设计用例表逐条（SUBAGENT-ID-COUNTER-AGENT.md §用例表）：压缩后取号 / 池活续号 /
// 进程重启边界（纯函数面）；真实 spawn 链路（spawn 前缀 → executeAsyncSpawn id 消费）
// 见文末「链路形态」节（2026-09-11 扫① 并档——原 subagent-id-counter.test.mjs）。

/** 池键=字符串 id 的池（CLI 形态——set(String(id))）。 */
const idPool = (p) => ({ _asyncSubagents: new Map([...(p.sub ?? [])].map((id) => [String(id), { id, status: "running" }])), _asyncAdvisors: new Map() })
const idPoolAdv = (p) => ({ _asyncSubagents: new Map(), _asyncAdvisors: new Map([...(p.adv ?? [])].map((id) => [String(id), { id, status: "running" }])) })

test("ID-COUNTER：压缩替换 history 后取号仍递增——counter 存活于 agent 本体（跨压缩）", () => {
  const p = { _subAgentCounter: 3, history: [{ role: "user", content: "x" }] }
  assert.equal(nextSubagentId(p), 4, "常规递增")
  p.history = [{ role: "user", content: "compacted" }] // 模拟压缩：history 数组被整体替换
  p.history[0]._asyncSubagents = new Map() // 压缩前旧 expando 形态——本体计数器不随它走
  assert.equal(nextSubagentId(p), 5, "history 数组替换后 id 仍递增（agent 本体计数器存活）")
  assert.equal(p._subAgentCounter, 5, "counter 同步回写本体")
  assert.equal(p.history[0]._subAgentCounter, undefined, "计数器不落 history（载体=本体——非 expando）")
})

test("ID-COUNTER：池活续号——计数器丢失面（undef）从池内最大 id 续号——不复用活条目 id", () => {
  const p = idPool({ sub: [2, 5] })
  assert.equal(p._subAgentCounter, undefined, "计数器丢失面：undef（重建形态）")
  assert.equal(nextSubagentId(p), 6, "poolMax 兜底——活池 5 → 取 6")
  assert.equal(p._subAgentCounter, 6, "首取号初始化（取号后 counter 同步）")
  assert.equal(nextSubagentId(p), 7, "回写后继续单调")
})

test("ID-COUNTER：池空 + counter 缺省 → 首取号 = 1（进程重启边界——设计范围边界用例）", () => {
  const p = idPool({ sub: [] })
  assert.equal(nextSubagentId(p), 1, "reload 后首取号从 1——池清块消失无冲突")
})

test("ID-COUNTER：跨池续号——advisor 池最大 id 兜底（跨池共号——id 命名空间唯一）", () => {
  const p = idPoolAdv({ adv: [4] })
  assert.equal(nextSubagentId(p), 5, "advisor 池 id 4 → 续 5")
})

test("ID-COUNTER：counter 与 poolMax 并存 → 取大者（counter 回退面不越过活池）", () => {
  const p = idPool({ sub: [3] })
  p._subAgentCounter = 2 // counter 回退（低于活池 max 3）——若不取大者会复用 3
  assert.equal(nextSubagentId(p), 4, "max(counter=2, poolMax=3) + 1 = 4")
})

test("ID-COUNTER：池键非数字/畸形防御（Number.parseInt 解析 NaN 丢弃——不误判 poolMax）", () => {
  const p = { _asyncSubagents: new Map([["e1", { id: "e1" }], ["not-a-num", {}], ["7", { id: 7 }]]), _asyncAdvisors: new Map() }
  assert.equal(nextSubagentId(p), 8, "畸形键丢弃、可解析键 7 参与续号")
})

// ─── 链路形态（并档：原 subagent-id-counter.test.mjs——SUBAGENT-ID-COUNTER-AGENT，2026-09-09）───
// 设计用例表逐条锁定真实 spawn 链路——分配点（buildSpawnChild async 分支 nextSubagentId）
// 与消费点（executeAsyncSpawn id 直读 counter）同链同号；压缩替换 history 数组后链路续号
// 递增（载体 = agent 本体 _subAgentCounter——跨 run/跨压缩存活）。纯单元：池 other 域 4 槽
// 占满 → 新 spawn 一律 queued（不触发 entry.start/子代理 runAgent——零网络零异步残留）。

/** 最小 parent：other 域 4 个 running 占满槽——链路 spawn 入队（queued——不启动）。 */
const spawnAgent = () => ({
  cwd: "C:/w",
  provider: { name: "p", model: "m" },
  config: { agent: {} },
  tools: [{ name: "read", readonly: true }],
  _asyncSubagents: new Map(
    [1, 2, 3, 4].map((i) => [String(i), { id: i, role: "explore", status: "running", _pool: "other" }]),
  ),
})

const chainSpawn = (p, task = "t") => {
  const built = buildSpawnChild(p, { agent: p }, { task }, "explore", true, [], [], null) // engAuditAttempt=null（非 eng-coder——gateEngCoderSpawn 返回形态）
  const ack = JSON.parse(executeAsyncSpawn(p, {}, "explore", {}, built.child, task, built.childOpts, built.childRunOpts, built.relayPrefix, built.childProvider, [], []))
  return { built, ack }
}

test("ID-COUNTER 链路：relay 前缀与 ack id 同号——counter 缺省时池活续号兑底（4 → 5）", () => {
  const p = spawnAgent() // counter 缺省（丢失面）——nextSubagentId 从池 max 4 续 5
  const { built, ack } = chainSpawn(p)
  assert.equal(built.relayPrefix, "explore#5/", "分配点（前缀）取号 5")
  assert.equal(ack.id, "5", "消费点（executeAsyncSpawn）同号——分配/消费无错位")
  assert.equal(ack.status, "queued", "池满入队——entry.start 未触发（纯单元安全）")
  assert.equal(p._subAgentCounter, 5, "首取号初始化：counter 同步回写本体")
})

test("ID-COUNTER 链路：压缩替换 history 数组后 spawn id 仍递增（agent 本体计数器存活）", () => {
  const p = spawnAgent()
  chainSpawn(p) // #5
  p.history = [{ role: "user", content: "compacted" }] // 模拟压缩：history 数组被整体替换
  const { built, ack } = chainSpawn(p)
  assert.equal(built.relayPrefix, "explore#6/", "压缩后 relay 前缀续 6（本体计数器不随 history 丢）")
  assert.equal(ack.id, "6", "压缩后链路取号 6")
  assert.equal(p._subAgentCounter, 6)
})
