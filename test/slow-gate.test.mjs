/**
 * slow-gate.test.mjs — D-T6 机制自验（slow-gate.mjs + run-fast.mjs 判据闭环：
 * 红/绿两端 + 文件级合成条目跳过分支）。以 THINCODER_SLOW_GATE_MS=50 经
 * run-fast.mjs 显式指定夹具目标：
 *   ① unmarked（未标 slow 慢例）→ 必超阈 → 拦截红（exit 1 + 点名该例）；
 *   ② marked（slow() 归册）→ 快层 skip → 绿（exit 0）；
 *   ③ no-tests（无 test() 文件——如 smoke-settings.mjs 冒烟档同形）→ 文件级
 *      合成条目 → 判据跳过（exit 0）。
 * slow() 门控：本档 spawn run-fast 子进程（重 IO）——快层 skip、test:full 照跑。
 * 子进程 env 显式清 THINCODER_TEST_FULL（快层语义），不受全量层继承影响。
 */
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { join } from "node:path"
import { slow } from "./slow.mjs"

const ROOT = fileURLToPath(new URL("..", import.meta.url))
const RUN_FAST = join(ROOT, "test", "run-fast.mjs")
const FIX = (name) => join(ROOT, "test", "fixtures", name)

/** run-fast 子进程（快层语义：FULL 清空 + 阈值 50ms；显式夹具目标）。
 *  NODE_TEST_CONTEXT 必须清——否则子进程被 runner 误认为「测试文件内递归 run()」而拒绝跑文件。 */
function runFast(targets) {
  const env = { ...process.env, THINCODER_TEST_FULL: "", THINCODER_SLOW_GATE_MS: "50" }
  delete env.NODE_TEST_CONTEXT
  return spawnSync(process.execPath, [RUN_FAST, ...targets], {
    cwd: ROOT,
    encoding: "utf8",
    env,
    timeout: 120_000,
  })
}

slow("D-T6 自验①：unmarked 慢例未归册 → 拦截红（exit 1 + 点名该例）", () => {
  const r = runFast([FIX("slow-gate-unmarked.mjs")])
  assert.equal(r.status, 1, `unmarked 必红：${r.stdout}\n${r.stderr}`)
  assert.ok(r.stderr.includes("slow 门防漏拦截"), "拦截报告在 stderr")
  assert.ok(r.stderr.includes("fixture: unmarked slow case"), "点名该例")
})

slow("D-T6 自验②：marked 慢例已归册（slow()）→ 快层 skip → 绿（exit 0）", () => {
  const r = runFast([FIX("slow-gate-marked.mjs")])
  assert.equal(r.status, 0, `marked 必绿：${r.stdout}\n${r.stderr}`)
  assert.ok(!r.stderr.includes("slow 门防漏拦截"), "零拦截报告")
})

slow("D-T6 自验③：无 test() 文件 → 文件级合成条目判据跳过 → 绿（exit 0）", () => {
  const r = runFast([FIX("slow-gate-no-tests.mjs")])
  assert.equal(r.status, 0, `no-tests 必绿（文件级条目不入拦截）：${r.stdout}\n${r.stderr}`)
  assert.ok(!r.stderr.includes("slow 门防漏拦截"), "零拦截报告")
})
