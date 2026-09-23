/**
 * lib/metrics.mjs — 计时 / tok/s / 中位 / 聚合（设计 §1.3 口径 3 + §2.3 聚合规则 1~4）。
 *
 * 冻结口径：
 * - TTFT = 首个**非空** delta 到达 − 调用发起（观测点由 client.mjs 的 onToken/onReasoning 首次回调采集）。
 * - tok/s = Σcompletion ÷ Σ(per-call total − per-call ttft)，只计入 ttft/total/completion 皆非 null
 *   且 total > ttft 的 call；参与 call 为空 → null（§2.3-2 之 ③）。
 * - 中位数剔除 null（不按 0 计）；样本全 null → 该指标 null（§2.3-2 之 ①）。
 * - token 只认 usage 精确值（缺即 null，不近似——KD-6）。
 */

/** 中位数：剔除 null / undefined / NaN；空集 → null（偶数个取中间两值均值）。 */
export function median(values) {
  const nums = values.filter((v) => typeof v === "number" && Number.isFinite(v)).sort((a, b) => a - b)
  if (nums.length === 0) return null
  const mid = nums.length >> 1
  return nums.length % 2 === 1 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2
}

const round1 = (n) => (n == null ? null : Math.round(n * 10) / 10)
const roundMs = (n) => (n == null ? null : Math.round(n))

/** Σ 非 null 样本；全为 null → null（不按 0 计，§2.3-2 之 ④ 同源纪律）。 */
export function sumPresent(values) {
  const nums = values.filter((v) => typeof v === "number" && Number.isFinite(v))
  if (nums.length === 0) return null
  return nums.reduce((a, b) => a + b, 0)
}

/** 单 call 记录 → 参与 token 计数的形状（记录面 = client.mjs：{ttftMs,totalMs,tokens,...}）。 */
export function tokPerSecOf(calls) {
  let denomMs = 0
  let completion = 0
  let used = 0
  for (const c of calls ?? []) {
    if (!c) continue
    if (typeof c.ttftMs !== "number" || typeof c.totalMs !== "number") continue
    const gen = c.totalMs - c.ttftMs
    if (!(gen > 0)) continue
    if (typeof c.tokens?.completion !== "number") continue
    denomMs += gen
    completion += c.tokens.completion
    used++
  }
  if (used === 0 || denomMs <= 0) return null
  return round1(completion / (denomMs / 1000))
}

/** 用例级 run 指标（§2.2 runs[].metrics）：ttft = 首轮首个非空 delta；total = Σ per-call 耗时。 */
export function runMetrics(calls) {
  const list = calls ?? []
  const ttftMs = list.length > 0 && typeof list[0].ttftMs === "number" ? roundMs(list[0].ttftMs) : null
  return {
    ttftMs,
    totalMs: roundMs(sumPresent(list.map((c) => c?.totalMs))),
    tokPerSec: tokPerSecOf(list),
    tokens: {
      prompt: sumPresent(list.map((c) => c?.tokens?.prompt)),
      cached: sumPresent(list.map((c) => c?.tokens?.cached)),
      completion: sumPresent(list.map((c) => c?.tokens?.completion)),
    },
  }
}

/** 用例判定（§2.3-1）：N 次全过 = pass，否则 fail；全 skipped → skipped。 */
export function aggregateVerdict(runs) {
  const list = runs ?? []
  if (list.length === 0) return "skipped"
  if (list.every((r) => r?.verdict === "skipped")) return "skipped"
  return list.every((r) => r?.verdict === "pass") ? "pass" : "fail"
}

/** 速度聚合（§2.3-2）：只取正常返回的 run（pass/fail），逐 run 取值后取中位。 */
export function speedMedians(runs) {
  const valid = (runs ?? []).filter((r) => r && (r.verdict === "pass" || r.verdict === "fail"))
  return {
    ttftMs: roundMs(median(valid.map((r) => r.metrics?.ttftMs))),
    tokPerSec: round1(median(valid.map((r) => r.metrics?.tokPerSec))),
    totalMs: roundMs(median(valid.map((r) => r.metrics?.totalMs))),
    samples: valid.length,
  }
}
