/**
 * slow-gate.mjs — 防漏拦截 reporter（TESTING.md §1 D-T6，2026-09-06）。
 *
 * 快层（npm test → test/run-fast.mjs）以第二 reporter 身份挂入 node --test：
 * 收集每个叶子用例的耗时，把「未标 slow 而超过拦截阈值」的用例写入 JSON 报告，
 * 由 run-fast.mjs 判定非零退出（硬红——腐化根因就是无人拦截）。
 *
 * 拦截阈值语义：默认 800ms（env THINCODER_SLOW_GATE_MS 覆盖，供机制自验测试用）。
 * 阈值缓冲（评审 #4）：拦截阈值 800ms > 归册阈值 500ms——机器负载抖动不触红，
 * 只有真·漏网慢测才红。机制自验测试（slow-gate.test.mjs）用 50ms 阈值跑夹具。
 *
 * 为什么不需要 slow 注册表比对：快层里 slow() 标记的用例全部 skip（test:skip 事件），
 * 因此「test:pass 且超阈」⇔「未归册」——注册表比对是恒等式，省略。
 * test:full（THINCODER_TEST_FULL=1）不挂本 reporter——全量层慢测合法，不拦截。
 *
 * 只查叶子用例（跳过 details.type === "suite" 的 describe 聚合）：归册口径是单条
 * 用例 >500ms（slow.mjs 头注释实测铁律），套件时长是子用例聚合，不归拦截口径。
 * 注：t.test 嵌套子测试形态不在拦截口径（父用例时长 = 子用例聚合——当前库存零该形态，全为顶层 test(/slow(）。
 */
export default async function* slowGate(source) {
  const threshold = Number(process.env.THINCODER_SLOW_GATE_MS) > 0
    ? Number(process.env.THINCODER_SLOW_GATE_MS)
    : 800
  const offenders = []
  for await (const event of source) {
    if (event.type !== "test:pass") continue
    const { name, file, line, details } = event.data
    if (details?.type === "suite") continue
    const ms = details?.duration_ms
    if (typeof ms === "number" && ms > threshold) {
      offenders.push({ name, file, line, duration_ms: Math.round(ms * 10) / 10 })
    }
  }
  yield JSON.stringify({ threshold, offenders }, null, 2) + "\n"
}
