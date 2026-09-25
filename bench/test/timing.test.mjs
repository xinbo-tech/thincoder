/**
 * test/timing.test.mjs — 计时采集面用例（§5.13；`timing.1` = 2026-09-24 error-duration 批新增 ·
 * `timing.2` / `timing.3` = 2026-09-25 bench-micro 批新增〔失败路径补全族〕）：
 * `timing.1` = 失败调用耗时采集 = `calls[].totalMs` 发起 → 失败墙钟（超时 / 接口错照记；`ttftMs` / `tokens` 照实缺 `null`）
 * + 成功路径读数零改 + `runMetrics` 聚合（含 §2.3-7 部分未记录腿——按已记录之和）；
 * `timing.2` = 判官 / 复核逐尝试失败耗时（KD-47①）；`timing.3` = 失败路径 `throttled` 观测（生产者四态 / 消费两态 / 成功对照 / 形状单源——KD-47② / KD-48）。
 * 桩传输（不触网——测试策略①）；手动跑：`node --test "bench/test/*.test.mjs"`（不进 CI —— AC-8）。
 */

import assert from "node:assert/strict"
import { test } from "node:test"
import { fixtureTransport, markFailureObservation, runCase } from "../lib/client.mjs"
import { callSlot } from "../lib/judge.mjs"
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

/** 判官槽位 + 延迟抛 `TimeoutError` 的传输（`callSlot` 直测：传输面可注——不触网；位级失败形态）。 */
const JSLOT = { id: "A", provider: "p", model: "m-a", maxTokens: 2048, timeoutSec: 30 }
const slowJudgeTimeout = {
  async call() {
    await new Promise((r) => setTimeout(r, 40))
    throw Object.assign(new Error("判官超时（夹具）"), { name: "TimeoutError" })
  },
}

test("timing.2：判官 / 复核逐尝试失败耗时（`callSlot` 直测——失败尝试照记，对「失败即 null」反例控制）", async () => {
  // ① 延迟 40 ms 后抛 TimeoutError ⇒ 逐尝试账目仍落数值 totalMs（旧行为 = `rec(null)` ⇒ null）
  const r = await callSlot({ slot: JSLOT, messages: [{ role: "user", content: "夹具题面。" }], transport: slowJudgeTimeout })
  const c = r.calls[0]
  assert.equal(r.verdict, "error", "① 位级失败 ⇒ verdict = error")
  assert.equal(r.attempts, 1, "① 级内单发 ⇒ attempts = 1")
  assert.equal(typeof c.totalMs, "number", "① 失败尝试落 totalMs（旧行为 = null）")
  assert.ok(c.totalMs >= 25, `① totalMs ≥ 25 ms（延迟 40 ms 后抛错；实得：${c.totalMs}）`)
  assert.deepEqual([c.attempt, c.tokens, c.finishReason, c.costCny], [1, null, null, null], "① attempt = 1 · tokens / finishReason / costCny 照实缺记 null")
})

test("timing.3：失败路径 throttled 观测（生产者四态 / 消费两态 / 成功对照 / 记录形状单源）", async () => {
  // ① 生产者原语四态（`markFailureObservation`：true ∧ 对象 ∧ 可扩展才挂——错误本体零改）
  const marked = Object.assign(new Error("夹具：等待后失败"), { name: "HttpError" })
  assert.equal(markFailureObservation(marked, true), marked, "① 原样返回同一对象")
  assert.equal(marked.throttled, true, "① true ∧ 对象 ⇒ 挂字段")
  const plain = new Error("夹具：普通失败")
  markFailureObservation(plain, false)
  assert.equal("throttled" in plain, false, "① false ⇒ 不挂（缺字段 ≡ 未观测到暂停）")
  const frozen = Object.freeze(new Error("夹具：冻结错误"))
  assert.doesNotThrow(() => markFailureObservation(frozen, true), "① 冻结对象不抛")
  assert.equal("throttled" in frozen, false, "① 冻结对象不挂")
  assert.equal(markFailureObservation("原始值", true), "原始值", "① 原始值原样返回（不抛）")
  // ② 消费方（失败记录单点 = `runCase`）：抛错携 `throttled: true` ⇒ 出洞为 true
  const thrown = { async call() { throw Object.assign(new Error("等待后失败（夹具）"), { throttled: true }) } }
  const t = await runCase({ caseObj: CASE, providerEntry: PROVIDER, transport: thrown })
  assert.equal(t.calls[0].throttled, true, "② 错误对象携 `throttled: true` ⇒ 失败记录出洞")
  // ③ 反例控制：抛错不携该字段 ⇒ false（缺字段 ≡ false——记录形零改）
  const bare = { async call() { throw new Error("普通失败（夹具）") } }
  const b = await runCase({ caseObj: CASE, providerEntry: PROVIDER, transport: bare })
  assert.equal(b.calls[0].throttled, false, "③ 缺字段 ≡ false")
  // ④ 成功对照：夹具声明 `throttled: true` ⇒ 透传（成功路径零改）
  const ok = await runCase({ caseObj: CASE, providerEntry: PROVIDER, transport: fixtureTransport([{ text: "夹具。", totalMs: 34, throttled: true }]) })
  assert.equal(ok.calls[0].throttled, true, "④ 成功路径声明值原样透传")
  // ⑤ 形状单源（KD-47②）：失败记录钥匙集 = 成功记录钥匙集（同过 `toCallRecord` 单形状函数）
  assert.deepEqual(Object.keys(t.calls[0]), Object.keys(ok.calls[0]), "⑤ 失败 / 成功记录钥匙集同集同序")
})
