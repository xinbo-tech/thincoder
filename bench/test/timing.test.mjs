/**
 * test/timing.test.mjs — 计时采集面用例（§5.13 `timing.1` · 2026-09-24 error-duration 批新增）：
 * 失败调用耗时采集 = `calls[].totalMs` 发起 → 失败墙钟（超时 / 接口错照记；`ttftMs` / `tokens` 照实缺 `null`）
 * + 成功路径读数零改 + `runMetrics` 聚合（含 §2.3-7 部分未记录腿——按已记录之和）。
 * 桩传输（不触网——测试策略①）；手动跑：`node --test "bench/test/*.test.mjs"`（不进 CI —— AC-8）。
 */

import assert from "node:assert/strict"
import { test } from "node:test"
import { fixtureTransport, runCase } from "../lib/client.mjs"
import { runMetrics } from "../lib/metrics.mjs"

const CASE = { prompt: "夹具题面（计时采集面）。" }
const PROVIDER = { provider: "deepseek", model: "deepseek-flash" }

/** 挂起传输：永不返回，响应 `signal` 中止（`AbortSignal.timeout` 的触发路径）。 */
const hanging = {
  call({ signal }) {
    return new Promise((_, reject) => {
      const abort = () => reject(signal.reason ?? new Error("aborted"))
      if (signal.aborted) return abort()
      signal.addEventListener("abort", abort, { once: true })
    })
  },
}

/** 延迟后抛错传输（接口错形态）。 */
const slowError = {
  async call() {
    await new Promise((r) => setTimeout(r, 40))
    throw Object.assign(new Error("接口错误（夹具）"), { name: "HttpError" })
  },
}

test("timing.1：失败调用耗时照记（超时 / 接口错）+ 成功零改 + 聚合 + 部分未记录", async () => {
  // ① 超时腿（单次调用预算 80 ms ⇒ 设计轮实测墙钟 ≈ 96 ms ⇒ 下界取 50）
  const t = await runCase({ caseObj: CASE, providerEntry: PROVIDER, transport: hanging, timeoutMs: 80 })
  assert.match(String(t.error), /^TimeoutError/, `① error 以 TimeoutError 起头（实得：${t.error}）`)
  assert.equal(typeof t.calls[0].totalMs, "number", "① 超时调用落 totalMs（旧行为 = null）")
  assert.ok(t.calls[0].totalMs >= 50, `① totalMs ≥ 50 ms（实得：${t.calls[0].totalMs}）`)
  assert.deepEqual([t.calls[0].ttftMs, t.calls[0].tokens], [null, null], "① ttft / tokens 照实缺 ⇒ null")
  // ② 接口错腿（延迟 40 ms 后抛错 ⇒ 下界取 25）
  const f = await runCase({ caseObj: CASE, providerEntry: PROVIDER, transport: slowError })
  assert.match(String(f.error), /^HttpError/, `② error 以抛错名起头（实得：${f.error}）`)
  assert.equal(typeof f.calls[0].totalMs, "number", "② 接口错调用落 totalMs")
  assert.ok(f.calls[0].totalMs >= 25, `② totalMs ≥ 25 ms（实得：${f.calls[0].totalMs}）`)
  assert.equal(f.calls[0].tokens, null, "② tokens 照实缺 ⇒ null")
  // ③ 成功对照腿：夹具声明值原样透传（成功路径读数零改）
  const ok = await runCase({ caseObj: CASE, providerEntry: PROVIDER, transport: fixtureTransport([{ text: "夹具。", ttftMs: 12, totalMs: 34 }]) })
  assert.equal(ok.error, null, "③ 成功路径无 error")
  assert.deepEqual([ok.calls[0].ttftMs, ok.calls[0].totalMs], [12, 34], "③ 声明值原样透传")
  // 聚合腿：`runMetrics` 含 ① / ② 的耗时（= 两者之和）
  assert.equal(runMetrics([...t.calls, ...f.calls]).totalMs, t.calls[0].totalMs + f.calls[0].totalMs, "聚合腿：total = Σ per-call 耗时")
  // ④ 部分未记录腿（合成 calls——不经传输）：run 级 total = 已记录之和（= 该值 · 非 null——§2.3-7）
  const mixed = runMetrics([{ round: 1, ttftMs: 100, totalMs: 320, tokens: null }, { round: 2, ttftMs: null, totalMs: null, tokens: null }])
  assert.equal(mixed.totalMs, 320, "④ 部分未记录 ⇒ 按已记录之和（不按 0 也不落 null）")
  assert.equal(runMetrics([{ round: 1, ttftMs: null, totalMs: null, tokens: null }]).totalMs, null, "④ 反例控制：全未记录 ⇒ null（不按 0 计）")
})
