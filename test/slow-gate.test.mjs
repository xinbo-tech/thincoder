/**
 * slow-gate.test.mjs — D-T6 防漏拦截机制自验（TESTING.md §1 T-T3 红/绿证明）。
 * 机制自验本身是慢测（两次 node --test 子进程，秒级）——自身也走 slow() 门，
 * 快层跳过、test:full 全量层验证（自验拦截器的测试不能被拦截器自己漏掉）。
 * 夹具阈值用 THINCODER_SLOW_GATE_MS=50 —— 150ms 夹具用例即可超阈，不等真 800ms。
 */
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { slow } from "./slow.mjs"

/** 经 run-fast.mjs 真路径跑指定夹具：阈值压到 50ms，且显式清掉 FULL（全量层环境下本测试运行时 FULL=1，不能传给夹具——slow 门必须保持快层语义）。
 *  NODE_TEST_CONTEXT 必须删除：node --test 给测试子进程打此标记，孙进程带它会
 *  拒跑（"run() is being called recursively … skipping running files"，静默 0 退出）。 */
function runFixture(file) {
  const env = { ...process.env, THINCODER_SLOW_GATE_MS: "50", THINCODER_TEST_FULL: "" }
  delete env.NODE_TEST_CONTEXT
  return spawnSync(process.execPath, ["test/run-fast.mjs", file], { encoding: "utf8", env })
}

slow("D-T6 T-T3 红：未标 slow 的超阈用例 → 快层拦截红（非零退出 + 逐条点名 + 修复提示）", () => {
  const r = runFixture("test/fixtures/slow-gate-unmarked.mjs")
  assert.notEqual(r.status, 0, "未归册超阈用例必须非零退出（硬红）")
  assert.match(r.stderr, /slow 门防漏拦截（D-T6）/, "stderr 有拦截标题")
  assert.match(r.stderr, /fixture: unmarked slow case/, "点名到用例")
  assert.match(r.stderr, /slow-gate-unmarked\.mjs/, "点名到文件")
  assert.match(r.stderr, /修复：import \{ slow \}/, "输出修复提示")
})

slow("D-T6 T-T3 绿：同用例 slow() 归册后 → 快层跳过，拦截不触发（转绿）", () => {
  const r = runFixture("test/fixtures/slow-gate-marked.mjs")
  assert.equal(r.status, 0, "已归册用例快层 skip——拦截不红")
  assert.ok(!r.stderr.includes("slow 门防漏拦截"), "无拦截输出")
  assert.match(r.stdout, /slow test — run `npm run test:full`/, "slow 门跳过提示可见（不隐身）")
})
