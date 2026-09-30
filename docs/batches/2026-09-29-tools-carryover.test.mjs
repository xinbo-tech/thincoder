/**
 * 2026-09-29-tools-carryover.test.mjs — 批次本地件 · 舱 A（#9 `bash` 异步 ∥ 后台执行）
 * （不进仓套件；复跑 = 仓根 `node --test <本档>`——暂存位 `.thincoder/tmp/` 与终位
 *  `docs/batches/` 同两层深、cwd 恒为仓根，命令形态一致）。
 * **落位 = #545 立即形**：终位（`docs/batches/2026-09-29-tools-carryover.test.mjs`）子写者
 * 被写门 fail-closed 拒（跨批批档写门——运行进程未载放宽版判据）⇒ 暂存 `.thincoder/tmp/`，
 * 由父侧收位。
 *
 * 腿面（AC9-1..8 机检 + 同步径快照对照 + 口径锚 AC9-7）：
 * - T1 起跑即返（ack 形 ∥ 池态）+ 同步径逐字快照 + schema 面 + depth 双门；
 * - T2 结算注入恰一次（状态行 ‖ 尾部 ‖ 截尾注记）+ 全量在 log（零丢失）；
 * - T3 poolLive 三域并入（在途 ⇒ true ∥ 杀后清空 ⇒ false）；
 * - T4 终止两靶（pid ∥ id）+ 出池 + 墓碑 ∥ 重复幂等 ∥ 被杀不注入 digest；
 * - T5 帽：第 5 起显式拒（零静默丢）；
 * - T6 超时：默认不杀 ∥ 显式 timeout 到点杀 + `killed: timeout`；
 * - T7 口径同源锚（帽常量 ∥ 共用取号命名空间 ∥ 共享墓碑/唤醒单点）；
 * - T8 收尾两档：回合中断不杀（F2 豁免）∥ 会话中止逐条杀树（零孤儿）；
 * - T9 错误/边界：kill 靶二选一校验 ∥ wait_for 条件族 ∥ 深度起跑拒 ∥ filter 注记。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname, resolve as pathResolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const REPO = pathResolve(dirname(fileURLToPath(import.meta.url)), "..", "..")
const mod = (p) => import(pathToFileURL(join(REPO, p)).href)

const ba = await mod("thincoder-core/agent-tools/bash-async.mjs")
const { bashTool } = await mod("thincoder-core/tools/bash.mjs")
const { processTool, parseWaitForCondition } = await mod("thincoder-core/tools/ops.mjs")
const { injectAsyncResult } = await mod("thincoder-core/agent-tools/subagent-async.mjs")
const { discardAbortedBgTasks } = await mod("thincoder-core/agent-tools/async-discard.mjs")
const { poolLive } = await mod("thincoder-core/agent/suspension.mjs")
const { excludeSubagentTools } = await mod("thincoder-core/agent/helpers.mjs")
const { isProcessAlive } = await mod("thincoder-core/process-probe.mjs")

const LONG = 'node -e "setTimeout(()=>{}, 60000)"'
const withTimeout = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(r, ms))])

function makeParent() {
  return { cwd: REPO, config: {}, history: [], _fullHistory: [] }
}
const ctxOf = (parent, extra = {}) => ({ cwd: REPO, agent: parent, depth: 0, ...extra })
const launch = (parent, args, extra = {}) => bashTool.execute(args, ctxOf(parent, extra))
function ackId(ack) {
  const m = String(ack).match(/bash#(\d+) started \(running\) — log: (.+)$/m)
  assert.ok(m, `ack 形不符: ${JSON.stringify(ack)}`)
  return { id: Number(m[1]), logPath: m[2].trim() }
}
async function settle(entry, ms = 15000) {
  await withTimeout(entry.promise, ms)
  assert.equal(entry.done, true, `等待结算超时（${ms}ms）：status=${entry.status}`)
}
async function dead(pid, ms = 8000) {
  const t0 = Date.now()
  for (;;) {
    if (isProcessAlive(pid) === false) return true
    if (Date.now() - t0 > ms) return false
    await new Promise((r) => setTimeout(r, 100))
  }
}
/** 测试收尾：清空父池（杀 + 等死），不给后续腿留残余进程。 */
async function drain(parent) {
  for (const e of [...(parent._bgTasks?.values() ?? [])]) {
    await processTool.execute({ action: "kill", id: e.id }, ctxOf(parent))
    await withTimeout(e.promise, 5000)
  }
}
const tmpDirs = []
function useTmpLogDir(name) {
  const dir = mkdtempSync(join(tmpdir(), `tc-bg-${name}-`))
  tmpDirs.push(dir)
  ba._setBgTaskLogDirForTest(dir)
  return dir
}
process.on("exit", () => { for (const d of tmpDirs) { try { rmSync(d, { recursive: true, force: true }) } catch { /* 尽力面 */ } } })

// ── T1 · AC9-1 起跑即返 ∥ 同步径逐字快照 ∥ schema/depth 双门 ─────────────────────
test("T1a · 起跑即返（ack 含 id ∥ log 路径；长任务在跑）", async () => {
  const dir = useTmpLogDir("t1a")
  const parent = makeParent()
  const t0 = Date.now()
  const ack = await launch(parent, { command: LONG, async: true })
  const elapsed = Date.now() - t0
  const { id, logPath } = ackId(ack)
  assert.ok(elapsed < 5000, `起跑耗时应远短于任务时长（实测 ${elapsed}ms）`)
  const entry = ba.bgTaskEntry(parent, id)
  assert.equal(entry.status, "running")
  assert.equal(parent._bgTasks.size, 1)
  assert.ok(logPath.startsWith(dir), `log 落点应为后台目录: ${logPath}`)
  assert.equal(entry.controller.signal.aborted, false)
  await drain(parent)
})

test("T1b · 同步径逐字快照（缺省径 = 现行形零变）", async () => {
  const parent = makeParent()
  const out = await bashTool.execute({ command: "echo hello" }, ctxOf(parent))
  assert.equal(out, "[stdout]:\nhello\n\n(exit code 0)")
  assert.equal(out.includes("bash#"), false)
  assert.equal(bashTool.parameters.properties.async.type, "boolean")
  assert.deepEqual(bashTool.parameters.required, ["command"])
  assert.equal(bashTool.parameters.properties.command.type, "string")
  assert.equal(bashTool.parameters.properties.timeout.type, "number")
  assert.equal(bashTool.parameters.properties.filter.type, "string")
})

test("T1c · depth 双门：schema 删参（excludeSubagentTools）+ 运行期显式拒", async () => {
  const other = { name: "other", parameters: { properties: {} } }
  const copy = excludeSubagentTools([bashTool, other])
  assert.equal("async" in copy[0].parameters.properties, false, "子代副本应删 async 参")
  assert.equal("async" in bashTool.parameters.properties, true, "父表不得被改动")
  assert.equal(copy[1], other, "未命中条目原对象直传")
  assert.equal(copy.length, 2)
  const parent = makeParent()
  const out = await bashTool.execute({ command: "echo hi", async: true }, ctxOf(parent, { depth: 1 }))
  assert.match(out, /^Error: bash async is depth-0 only/)
  assert.equal(parent._bgTasks, undefined, "depth>0 拒发不得动池")
})

// ── T2 · AC9-2 结算注入恰一次 + 零丢失 ────────────────────────────────────────
test("T2 · 退出 ⇒ settle 停靠 pending；注入恰一次（状态行 + 尾部 + 截尾注记）；全量在 log", async () => {
  useTmpLogDir("t2")
  const parent = makeParent()
  const ack = await launch(parent, { command: 'node -e "for(let i=1;i<=200;i++) console.log(i)"', async: true })
  const { id, logPath } = ackId(ack)
  const entry = ba.bgTaskEntry(parent, id)
  await settle(entry)
  assert.equal(parent._bgTasks.size, 0, "结算即出池")
  assert.equal(parent._pendingAsyncResults.length, 1, "结算即停靠 pending（恒停靠）")
  assert.ok(entry.report.split("\n").length <= 120, "注入尾部 ≤120 行")
  const log = readFileSync(logPath, "utf8")
  assert.equal(log.split("\n").filter(Boolean).length, 200, "全量零丢失（log 面 200 行）")
  const consumed = parent._pendingAsyncResults.splice(0)
  assert.equal(consumed.length, 1)
  await injectAsyncResult(parent, consumed[0])
  const reminders = parent.history.filter((h) => String(h.content).startsWith("[System reminder: background bash#"))
  assert.equal(reminders.length, 1, "注入恰一次")
  const text = reminders[0].content
  assert.ok(text.includes(`bash#${id} finished`), "状态行含 id")
  assert.ok(text.includes("exit code 0"), "状态行含退出码")
  assert.ok(text.includes(logPath), "状态行含 log 路径")
  assert.ok(text.includes("[... tail truncated"), "截尾注记在场（>120 行）")
  assert.ok(text.includes("\n200\n"), "尾部含最后一行（尾截取尾）")
  assert.equal(parent.history.length, 1)
  assert.deepEqual(parent._asyncTombstones.get(String(id)), { status: "consumed", role: "bg" }, "消费即墓碑")
  await drain(parent)
})

// ── T3 · AC9-3 poolLive 三域并入 ─────────────────────────────────────────────
test("T3 · bg 在途 ⇒ poolLive=true；杀后清空 ⇒ false", async () => {
  useTmpLogDir("t3")
  const parent = makeParent()
  assert.equal(poolLive(parent), false)
  await launch(parent, { command: LONG, async: true })
  assert.equal(poolLive(parent), true, "在途 ⇒ live")
  await drain(parent)
  assert.equal(parent._bgTasks.size, 0)
  assert.equal(poolLive(parent), false, "清空（pending 亦空）⇒ false")
})

// ── T4 · AC9-4 终止两靶 + 幂等 ────────────────────────────────────────────────
test("T4a · id 靶：杀树 + 出池 + 墓碑；重复 = 幂等；被杀不注入 digest", async () => {
  useTmpLogDir("t4a")
  const parent = makeParent()
  const { id } = ackId(await launch(parent, { command: LONG, async: true }))
  const entry = ba.bgTaskEntry(parent, id)
  const pid = entry.child.pid
  const res = await processTool.execute({ action: "kill", id }, ctxOf(parent))
  assert.match(res, /killed background bash#\d+/)
  assert.equal(parent._bgTasks.size, 0, "出池")
  assert.deepEqual(parent._asyncTombstones.get(String(id)), { status: "cancelled", role: "bg" }, "墓碑")
  await settle(entry)
  assert.equal(await dead(pid), true, "树灭（进程读数）")
  assert.equal(parent._pendingAsyncResults?.length ?? 0, 0, "被杀任务不注入 digest")
  const again = await processTool.execute({ action: "kill", id }, ctxOf(parent))
  assert.match(again, /killed background bash#\d+/, "重复 = 幂等确认")
})

test("T4b · pid 靶：killProcessTree 同款（树灭——通用 pid 面，零池记账）", async () => {
  useTmpLogDir("t4b")
  const parent = makeParent()
  const { id } = ackId(await launch(parent, { command: LONG, async: true }))
  const entry = ba.bgTaskEntry(parent, id)
  const pid = entry.child.pid
  const res = await processTool.execute({ action: "kill", pid }, ctxOf(parent))
  assert.match(res, /killed process tree \d+/)
  assert.equal(await dead(pid), true, "树灭（进程读数）")
  await settle(entry) // pid 靶不记账——条目沿退出径自然结算
  assert.equal(parent._bgTasks.size, 0)
  await drain(parent)
})

// ── T5 · AC9-5 帽（显式拒——零静默丢） ────────────────────────────────────────
test("T5 · 第 5 起显式拒；池计数不变（零静默丢）", async () => {
  useTmpLogDir("t5")
  const parent = makeParent()
  assert.equal(ba.BG_TASK_MAX, 4)
  for (let i = 0; i < 4; i++) ackId(await launch(parent, { command: LONG, async: true }))
  assert.equal(parent._bgTasks.size, 4)
  const refused = await launch(parent, { command: LONG, async: true })
  assert.ok(String(refused).startsWith("Error:"), "超限显式拒")
  assert.match(String(refused), /cap reached \(4\/4 running: bash#\d+, bash#\d+, bash#\d+, bash#\d+\)/)
  assert.ok(String(refused).includes('wait_for "bash id:N done"'))
  assert.ok(String(refused).includes("process action='kill'"))
  assert.equal(parent._bgTasks.size, 4, "拒发不动池（零静默丢）")
  await drain(parent)
})

// ── T6 · AC9-6 超时语义 ──────────────────────────────────────────────────────
test("T6a · 默认不杀（无缺省 120s；显式 timeout 才挂定时器）", async () => {
  useTmpLogDir("t6a")
  const parent = makeParent()
  const { id } = ackId(await launch(parent, { command: 'node -e "setTimeout(()=>{}, 2000)"', async: true }))
  const entry = ba.bgTaskEntry(parent, id)
  assert.equal(entry.timeoutMs, null)
  assert.equal(entry.timer, null)
  await new Promise((r) => setTimeout(r, 600))
  assert.equal(entry.status, "running", "无缺省超时（起跑 600ms 后仍跑）")
  await settle(entry)
  assert.equal(entry.exit.code, 0, "默认超时不杀（正常退出）")
  await drain(parent)
})

test("T6b · 显式 timeout 到点杀树 + `killed: timeout`", async () => {
  useTmpLogDir("t6b")
  const parent = makeParent()
  const { id, logPath } = ackId(await launch(parent, { command: LONG, async: true, timeout: 700 }))
  const entry = ba.bgTaskEntry(parent, id)
  await settle(entry, 10000)
  assert.equal(entry.killed, "timeout")
  const consumed = parent._pendingAsyncResults.splice(0)
  await injectAsyncResult(parent, consumed[0])
  const text = parent.history[0].content
  assert.ok(text.includes("killed: timeout"), `注入状态行应含 killed: timeout: ${text.slice(0, 160)}`)
  assert.ok(text.includes(logPath))
  await drain(parent)
})

// ── T7 · AC9-7 口径同源锚（帽 ∥ 取号 ∥ 唤醒/墓碑单点） ────────────────────────
test("T7 · 帽对齐 ASYNC_POOL_LIMITS ∥ 共用取号命名空间 ∥ 共享墓碑/唤醒单点", async () => {
  useTmpLogDir("t7")
  const parent = makeParent()
  const { ASYNC_POOL_LIMITS } = await mod("thincoder-core/agent-tools/subagent-async.mjs")
  assert.equal(ba.BG_TASK_MAX, ASYNC_POOL_LIMITS.other)
  assert.equal(ba.BG_TASK_MAX, ASYNC_POOL_LIMITS.engCoder)
  const { id } = ackId(await launch(parent, { command: 'node -e "console.log(1)"', async: true }))
  assert.equal(Number(id), parent._subAgentCounter, "id 沿 nextSubagentId 共用命名空间")
  const woke = []
  parent._asyncWaiters = [() => woke.push("settle")]
  const entry = ba.bgTaskEntry(parent, id)
  await settle(entry)
  assert.deepEqual(woke, ["settle"], "结算唤醒挂起驱动（wakeAsyncWaiters 单点）")
  const consumed = parent._pendingAsyncResults.splice(0)
  await injectAsyncResult(parent, consumed[0])
  assert.deepEqual(parent._asyncTombstones.get(String(id)), { status: "consumed", role: "bg" })
  await drain(parent)
})

test("T7b · 计数器丢失形（VSC run 重建）⇒ 在途 bg 条目 id 不复用（扫描域含 _bgTasks）", async () => {
  useTmpLogDir("t7b")
  const parent = makeParent()
  const first = Number(ackId(await launch(parent, { command: LONG, async: true })).id)
  delete parent._subAgentCounter // 模拟 VSC 形 per-run 重建（计数器不随 run 存活）
  const second = Number(ackId(await launch(parent, { command: LONG, async: true })).id)
  assert.notEqual(second, first, "在途条目的 id 不得复用（池活续号兜底须含 _bgTasks 域）")
  assert.equal(parent._bgTasks.size, 2)
  await drain(parent)
})

// ── T8 · AC9-8 收尾两档（回合中断不杀 ∥ 会话中止逐条杀树） ────────────────────
test("T8a · 会话中止 ⇒ 逐条杀树 + 出池 + 墓碑 + 整批一次提醒（零孤儿）", async () => {
  useTmpLogDir("t8a")
  const parent = makeParent()
  const sessionCtrl = new AbortController()
  const { id } = ackId(await launch(parent, { command: LONG, async: true }, { signal: sessionCtrl.signal }))
  const entry = ba.bgTaskEntry(parent, id)
  const pid = entry.child.pid
  sessionCtrl.abort({ abortTrigger: "session-stop" }) // 会话中止（非 interrupt）
  assert.equal(entry.controller.signal.aborted, true, "链结单点传播（bindChildController）")
  const out = discardAbortedBgTasks(parent)
  assert.equal(out.discarded.length, 1)
  assert.equal(parent._bgTasks.size, 0, "出池")
  assert.deepEqual(parent._asyncTombstones.get(String(id)), { status: "discarded", role: "bg" }, "墓碑")
  assert.equal(parent.history.filter((h) => String(h.content).includes("background bash task(s) were killed")).length, 1, "整批一次提醒")
  await settle(entry)
  assert.equal(await dead(pid), true, "逐条杀树（零孤儿——进程读数）")
  assert.equal(parent._pendingAsyncResults?.length ?? 0, 0, "中止收尾不注入 digest")
  await drain(parent)
})

test("T8b · 回合中断（Ctrl+I）⇒ 不杀（F2 同款豁免——池保留）", async () => {
  useTmpLogDir("t8b")
  const parent = makeParent()
  const turnCtrl = new AbortController()
  const { id } = ackId(await launch(parent, { command: LONG, async: true }, { signal: turnCtrl.signal }))
  const entry = ba.bgTaskEntry(parent, id)
  turnCtrl.abort({ interrupt: true }) // Ctrl+I：中断消息注入 + 续跑
  assert.equal(entry.controller.signal.aborted, false, "interrupt 不逐链中止")
  const out = discardAbortedBgTasks(parent)
  assert.equal(out.discarded.length, 0)
  assert.equal(parent._bgTasks.size, 1, "池保留——后续经 wait_for ∥ settle 消费")
  assert.equal(entry.status, "running")
  assert.equal(isProcessAlive(entry.child.pid), true, "进程存活")
  assert.equal(ba.bgTaskDone(parent, id), false, "在途未 done（wait_for 判据）")
  await processTool.execute({ action: "kill", id }, ctxOf(parent))
  await settle(entry)
  assert.equal(ba.bgTaskDone(parent, id), true, "出池即 done（wait_for 判据）")
  await drain(parent)
})

// ── T9 · 错误 ∥ 边界面 ───────────────────────────────────────────────────────
test("T9a · kill 靶二选一校验 ∥ 未知 id ∥ 深度起跑拒", async () => {
  const parent = makeParent()
  assert.match(await processTool.execute({ action: "kill", pid: 1, id: 2 }, ctxOf(parent)), /^Error: kill requires exactly one target/)
  assert.match(await processTool.execute({ action: "kill" }, ctxOf(parent)), /^Error: kill requires exactly one target/)
  assert.match(await processTool.execute({ action: "kill", id: 9999 }, ctxOf(parent)), /^Error: unknown background bash task id: 9999/)
  assert.match(await processTool.execute({ action: "bogus" }, ctxOf(parent)), /^Error: action must be list \| kill/)
  assert.match(await processTool.execute({ action: "kill", pid: "abc" }, ctxOf(parent)), /^Error: kill pid/)
  const refused = await ba.launchBgTask(parent, { depth: 1 }, { command: "echo x" })
  assert.match(refused.error, /depth-0 only/)
})

test("T9b · wait_for 条件族 +bash id:N done ∥ 未知条件显式枚举 ∥ filter 注记", async () => {
  assert.deepEqual(parseWaitForCondition("bash id:3 done"), { kind: "bash", arg: "3" })
  assert.deepEqual(parseWaitForCondition("subagent id:3 done"), { kind: "subagent", arg: "3" })
  assert.throws(() => parseWaitForCondition("bash 3 done"), /bash id:N done/)
  useTmpLogDir("t9b")
  const parent = makeParent()
  const ack = await launch(parent, { command: 'node -e "console.log(1)"', async: true, filter: "nomatch" })
  assert.ok(String(ack).includes("[note: filter applies to synchronous runs only"), "filter 注记在场（零静默丢参）")
  const { id } = ackId(ack)
  await settle(ba.bgTaskEntry(parent, id))
  const filtered = await bashTool.execute({ command: "echo keepme", filter: "keep" }, ctxOf(parent))
  assert.equal(filtered, "keepme")
  const noHit = await bashTool.execute({ command: "echo keepme", filter: "zzz-no-hit" }, ctxOf(parent))
  assert.match(noHit, /^\(no output lines matched filter/)
  await drain(parent)
})
