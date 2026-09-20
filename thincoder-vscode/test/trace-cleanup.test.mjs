/** trace-cleanup.test.mjs — STARTUP-LATENCY 批 F-SL3 用例（TRACES.md §6.4）：
 *  T-SL3.1 目录级三段梯（整删 / 跳过 / 逐文件 + `removed` 计数 + **零逐文件 stat** 计数注入）·
 *  T-SL3.2 每写节流（同窗 3 连写 ⇒ 扫描 ≤1 + 在飞合并）· T-SL3.4 缩比存量整删 + 复跑幂等·
 *  T-SL3.7 延迟拍（D-TR13——缝注入短值 ⇒ 延迟点火 / 常量 3000 + 延迟化形态结构机检）。
 *  T-SL3.3（语义保真）= 既有 `test/trace-store.test.mjs` D-TR10 用例（逐断言同结果——零改动保绿）。
 *  夹具纪律：全部 temp dir（显式传 `dir`）——禁触真实 `~/.thincoder`。 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, utimesSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { cleanupTraces, maybePruneTraces, PRUNE_THROTTLE_MS, _resetTraceStateForTest } from "@thincoder/core/traces/trace-store.mjs"
import { _cleanupHooks, dayBounds, scheduleTraceCleanup, TRACE_CLEANUP_DELAY_MS, _setTraceCleanupDelayForTest } from "@thincoder/core/traces/trace-cleanup.mjs"

const OLD = 3 * 3_600_000 // 超 1h 保留期
const dirs = []
const tmpRoot = () => { const d = mkdtempSync(join(tmpdir(), "tc-trace-clean-")); dirs.push(d); return d }
process.on("exit", () => { for (const d of dirs) { try { rmSync(d, { recursive: true, force: true }) } catch { /* ignore */ } } })

/** 日目录夹具：names 逐文件写入（ageMs 回拨 mtime）。 */
function mkDay(root, day, names, ageMs = OLD) {
  const dir = join(root, day)
  mkdirSync(dir, { recursive: true })
  for (const n of names) {
    const p = join(dir, n)
    writeFileSync(p, "{}", "utf8")
    const t = new Date(Date.now() - ageMs)
    utimesSync(p, t, t)
  }
}
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

test("T-SL3.1 目录级三段梯：纯 .jsonl 过期目录整删（零逐文件 stat）/ 当天跳过 / 含 .txt 走逐文件", async () => {
  const root = tmpRoot()
  mkDay(root, "2026-01-01", ["a-1.jsonl", "a-2.jsonl"])
  mkDay(root, "2026-01-02", ["b-1.jsonl"])
  mkDay(root, "2026-01-03", ["c-1.jsonl"])
  mkDay(root, "2026-01-04", ["d-1.jsonl", "notes.txt"], 30 * 3_600_000) // 含非 .jsonl ⇒ 落 ③ 逐文件
  const t = today()
  mkDay(root, t, ["now-1.jsonl"], 0) // ② 整目录跳过（dayStart + retention > now）
  const prev = { ..._cleanupHooks }
  let statCalls = []
  _cleanupHooks.stat = async (p) => { statCalls.push(p); return prev.stat(p) }
  let removed
  try { removed = await cleanupTraces({ dir: root, retentionHours: 24 }) } finally { Object.assign(_cleanupHooks, prev) }
  assert.equal(removed, 5, "整删支 = 批内 .jsonl 条目数（2+1+1） + ③ 支逐文件 1（同口径）")
  assert.equal(existsSync(join(root, "2026-01-01")), false, "纯 .jsonl 过期目录整删")
  assert.equal(existsSync(join(root, "2026-01-02")), false)
  assert.equal(existsSync(join(root, "2026-01-03")), false)
  assert.equal(existsSync(join(root, "2026-01-04", "d-1.jsonl")), false, "③ 支：超期 .jsonl 删")
  assert.equal(existsSync(join(root, "2026-01-04", "notes.txt")), true, "③ 支：非 .jsonl 不碰")
  assert.equal(existsSync(join(root, t, "now-1.jsonl")), true, "② 支：当天零动")
  assert.deepEqual(statCalls, [join(root, "2026-01-04", "d-1.jsonl")], "整删支零逐文件 stat（仅 ③ 支 stat 恰一次）")
})

test("T-SL3.2 每写节流：同窗 3 连写 ⇒ 扫描 ≤1（首调发起 / 后调 false）+ 在飞合并", async () => {
  _resetTraceStateForTest() // 缝：节流为模块级状态（跨用例残留——用例显式复位）
  const root = tmpRoot()
  mkDay(root, "2026-01-01", ["x-1.jsonl"])
  const t0 = Date.now()
  const first = maybePruneTraces({ dir: root, retentionHours: 1, now: t0 })
  assert.ok(first, "首调发起扫描（返回 promise）")
  assert.equal(maybePruneTraces({ dir: root, retentionHours: 1, now: t0 + 1000 }), false, "同窗第 2 调不扫")
  await first
  assert.equal(existsSync(join(root, "2026-01-01")), false, "首次扫描确实执行（整删生效）")
  mkDay(root, "2026-01-02", ["x-2.jsonl"]) // 新写入一条超期现场——若再扫即被清
  assert.equal(maybePruneTraces({ dir: root, retentionHours: 1, now: t0 + 2000 }), false, "同窗第 3 调不扫")
  await new Promise((r) => setTimeout(r, 50))
  assert.equal(existsSync(join(root, "2026-01-02", "x-2.jsonl")), true, "同窗 3 连写 ⇒ 扫描 ≤1（新现场未被扫）")
  const later = maybePruneTraces({ dir: root, retentionHours: 1, now: t0 + PRUNE_THROTTLE_MS + 1 })
  assert.ok(later, "出窗 ⇒ 恢复扫描")
  await later
  assert.equal(existsSync(join(root, "2026-01-02")), false, "出窗扫描生效")
  // 在飞合并：并发两调不重复发起扫描（首调持 promise，次调 false）
  _resetTraceStateForTest()
  const root2 = tmpRoot()
  mkDay(root2, "2026-01-01", ["y-1.jsonl"])
  const prev = { ..._cleanupHooks }
  let rootScans = 0
  _cleanupHooks.readdir = async (d) => { if (d === root2) rootScans++; return prev.readdir(d) } // 只计根面（日目录 readdir 不属「扫描」）
  let p1
  try {
    p1 = maybePruneTraces({ dir: root2, retentionHours: 1 })
    assert.equal(maybePruneTraces({ dir: root2, retentionHours: 1 }), false, "在飞 ⇒ 不发起第二次扫描")
    await p1
  } finally { Object.assign(_cleanupHooks, prev) }
  assert.equal(rootScans, 1, "根面扫描恰一次（在飞合并——第二次调用零扫描）")
})

test("T-SL3.4 缩比存量：全部过期日目录整删后 .jsonl 总量回落 + 复跑幂等", async () => {
  const root = tmpRoot()
  const total = 5 * 3
  for (let i = 1; i <= 5; i++) mkDay(root, `2026-02-0${i}`, [`f-${i}-1.jsonl`, `f-${i}-2.jsonl`, `f-${i}-3.jsonl`])
  assert.equal(await cleanupTraces({ dir: root, retentionHours: 24 }), total, "整删总量 = .jsonl 条目数")
  assert.deepEqual(readdirSync(root), [], "全部过期日目录整删（根回落）")
  assert.equal(await cleanupTraces({ dir: root, retentionHours: 24 }), 0, "复跑幂等（无事可做）")
  assert.equal(dayBounds("not-a-day"), null, "非日期名 ⇒ ①② 恒假（落 ③ 逐文件支）")
  assert.equal(dayBounds("2026-02-31"), null, "非法日 ⇒ 同回落")
})

test("T-SL3.7 延迟拍：短值缝 ⇒ 先于拍零动作 / 到拍清理执行（常量 3000 在档）", async () => {
  assert.equal(TRACE_CLEANUP_DELAY_MS, 3000, "默认延迟 = 3s（启动窗 ≤2s 之外——D-TR13）")
  const root = tmpRoot()
  const dayDir = join(root, "2026-01-01")
  mkDay(root, "2026-01-01", ["a-1.jsonl", "a-2.jsonl"])
  _setTraceCleanupDelayForTest(150) // 缝（`_setSessionGcDelayForTest` 同款）：短值——勿真等 3s
  try {
    scheduleTraceCleanup({ dir: root, retentionHours: 24 })
    await new Promise((r) => setTimeout(r, 40))
    assert.equal(existsSync(dayDir), true, "调度点后 40ms 零动作（延迟拍——启动窗内不点火）")
    for (let i = 0; i < 200 && existsSync(dayDir); i++) await new Promise((r) => setTimeout(r, 10))
    assert.equal(existsSync(dayDir), false, "到拍（150ms）⇒ 清理执行（整删支生效）")
    // 失败静默（调度器内 `.catch`——TRACES.md §6.4）：缺失目录 ⇒ 清理静默返 0；到拍点火零抛错（未捕获拒绝会炸测试进程）
    assert.equal(await cleanupTraces({ dir: join(root, "absent"), retentionHours: 24 }), 0, "目录缺失 ⇒ 静默 0（不抛）")
    scheduleTraceCleanup({ dir: join(root, "absent"), retentionHours: 24 })
    await new Promise((r) => setTimeout(r, 200)) // 越过注入拍（150ms）——真点火后静默返回
  } finally { _setTraceCleanupDelayForTest(TRACE_CLEANUP_DELAY_MS) } // 还原默认 3s（模块级状态）
})

test("T-SL3.7 结构机检：延迟化形态在档（`setTimeout` + 常量 + 测试缝；不 unref）", () => {
  const src = readFileSync(fileURLToPath(import.meta.resolve("@thincoder/core/traces/trace-cleanup.mjs")), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1") // 注释剥除（结构扫描用——同核 T-SL1.4 口径）
  assert.ok(src.includes("setTimeout("), "调度 = 核侧 `setTimeout`（启动窗外延迟拍）")
  assert.match(src, /export const TRACE_CLEANUP_DELAY_MS = 3000/, "常量 3000 在档")
  assert.ok(src.includes("export function _setTraceCleanupDelayForTest(ms)"), "测试缝在档（注入 0–短值即可观测）")
  assert.equal(src.includes(".unref("), false, "不 unref（保后台排空——D-TR13 与 D-SE39 同向）")
})
