/**
 * slow-gate-unmarked.mjs — D-T6 机制自验夹具：未标 slow 的慢用例。
 * slow-gate.test.mjs 以 THINCODER_SLOW_GATE_MS=50 跑本文件 → 必超阈 → 快层拦截红。
 * 命名不带 .test.mjs —— 任何 runner glob（test/*.test.mjs）都不会收集本文件，
 * 仅由 slow-gate.test.mjs 经 run-fast.mjs 显式指定运行。
 */
import test from "node:test"

test("fixture: unmarked slow case", async () => {
  await new Promise((r) => setTimeout(r, 150))
})
