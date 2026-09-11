/** crash-reports.test.mjs — CRASH-REPORTS F3（近堆上限堆快照——docs/design/CRASH-REPORTS.md §6
 * 用例 T1-T5 / T7 / T7b）：武装注入缝 + env 开关矩阵 + 武装失败不阻断 + API 存在性守护 +
 * purge/判定集两态。**真快照不跑**（实测代价 236MB / ≈10s @64MB 堆——T8 = 手动 QA 面，不进套件）；
 * 全部用例快层（无真 spawn / 无真快照——AC8）。 */
import { test, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readdirSync, rmSync, statSync, utimesSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { prepareCrashReporting, recentCrashHint } from "../src/crash-reports.mjs"

const dirs = []
// 进程级 report 设置复原（T2/T3/T4 经 prepareCrashReporting 反复改写 directory / reportOnFatalError——
// 跑完复原当时值，不把临时目录留在进程全局态里）
const prevReport = { directory: process.report.directory, reportOnFatalError: process.report.reportOnFatalError }
after(() => {
  for (const d of dirs) rmSync(d, { recursive: true, force: true })
  process.report.directory = prevReport.directory
  process.report.reportOnFatalError = prevReport.reportOnFatalError
})
const tmpRoot = () => { const d = mkdtempSync(join(tmpdir(), "crash-reports-")); dirs.push(d); return d }
const spy = () => { const fn = (n) => { fn.calls.push(n) }; fn.calls = []; return fn }
const OLD = new Date(Date.now() - 31 * 24 * 3_600_000) // > 30 天淘汰窗（purge 侧）/ 远出 24h 提示窗

test("T1 默认武装：armHeapSnapshot 恰 1 次、参数 1；返回 dir；目录已建（AC1）", () => {
  const dir = join(tmpRoot(), "x", "y") // 深层不存在——顺带核 mkdir 预建
  const arm = spy()
  const ret = prepareCrashReporting({ dir, env: {}, armHeapSnapshot: arm })
  assert.equal(ret, dir, "返回目录路径")
  assert.deepEqual(arm.calls, [1], "武装恰一次、参数 1")
  assert.ok(statSync(dir).isDirectory(), "目录已建（Node 对 fatal 静默不写——预建是必要动作）")
})

test("T2 关值矩阵（大小写 / 空格变体）→ 零武装（AC2）", () => {
  for (const v of ["0", "false", "off", "no", " 0 ", " FALSE ", "Off", "\tNO\n"]) {
    const arm = spy()
    prepareCrashReporting({ dir: tmpRoot(), env: { THINCODER_HEAP_SNAPSHOT: v }, armHeapSnapshot: arm })
    assert.deepEqual(arm.calls, [], `关值 ${JSON.stringify(v)} 不武装`)
  }
})

test("T3 默认开：未设 / 空串 / 其余值 → 以 1 武装（AC2）", () => {
  const envs = [{}, { THINCODER_HEAP_SNAPSHOT: "" }, { THINCODER_HEAP_SNAPSHOT: "1" }, { THINCODER_HEAP_SNAPSHOT: "true" },
    { THINCODER_HEAP_SNAPSHOT: "yes" }, { THINCODER_HEAP_SNAPSHOT: "未知串" }, { THINCODER_HEAP_SNAPSHOT: " ON " }]
  for (const env of envs) {
    const arm = spy()
    prepareCrashReporting({ dir: tmpRoot(), env, armHeapSnapshot: arm })
    assert.deepEqual(arm.calls, [1], `开值 ${JSON.stringify(env)} 武装（fail-open 向取证）`)
  }
})

test("T4 武装失败不阻断：替身抛错 → 不抛；返回 dir；process.report 设置照常（AC5）", () => {
  const dir = tmpRoot()
  const ret = prepareCrashReporting({ dir, env: {}, armHeapSnapshot: () => { throw new Error("arm failed (test)") } })
  assert.equal(ret, dir, "武装异常不阻断——返回值照常")
  assert.equal(process.report.directory, dir, "F1 既有步骤（report.directory）不受影响")
  assert.equal(process.report.reportOnFatalError, true, "F1 既有步骤（reportOnFatalError）不受影响")
})

test("T5 API 存在性守护：node:v8.setHeapSnapshotNearHeapLimit 为 function（AC1 / AC8）", async () => {
  const v8 = await import("node:v8")
  assert.equal(typeof v8.setHeapSnapshotNearHeapLimit, "function", "Node ≥ 24 基线——武装面可用")
})

test("T7 清理与判定集（正例）：旧 Heap 快照被 purge；新记录在场 → 返回提示（AC7）", () => {
  const dir = tmpRoot()
  const snap = "Heap.20260901.010203.4242.0.001.heapsnapshot" // Node 命名形态（§3.3）
  writeFileSync(join(dir, snap), "snapshot-bytes")
  utimesSync(join(dir, snap), OLD, OLD)
  writeFileSync(join(dir, `crash-${Date.now()}-4242.json`), "{}") // 新 crash 记录（24h 窗内）
  const hint = recentCrashHint({ dir })
  assert.ok(!readdirSync(dir).includes(snap), "旧快照纳入 30 天写时清理（purge 模式扩展）")
  assert.match(hint ?? "", /上次运行异常终止/, "新 crash 记录在场 → 照常提示")
})

test("T7b 清理与判定集（负例）：仅新 Heap 快照 → null 且文件留存（不误报——AC7）", () => {
  const dir = tmpRoot()
  const snap = "Heap.20260911.234728.23300.0.001.heapsnapshot"
  writeFileSync(join(dir, snap), "snapshot-bytes")
  assert.equal(recentCrashHint({ dir }), null, "快照不入提示判定集——无 crash/report 记录不误报「异常终止」")
  assert.ok(readdirSync(dir).includes(snap), "窗内快照不被误删（仅 >30 天淘汰）")
})
