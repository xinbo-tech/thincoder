/**
 * test/metrics.test.mjs — 计时 / 中位 / 成本式（逐档单价 × token）+ 聚合口径（§2.3 规则 1~4）。
 * 手动跑：`node --test bench/test/*.test.mjs`（不进 CI —— AC-8）。
 */

import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import { aggregateVerdict, median, runMetrics, speedMedians, sumPresent, tokPerSecOf } from "../lib/metrics.mjs"
import { applyPricesToResult, costOf, loadPrices, matchPrice } from "../lib/prices.mjs"

const TABLE = { asOf: "2026-09-23", currency: "CNY", unit: "元 / 百万 token", source: "fixture", entries: [] }
const call = (over = {}) => ({ round: 1, ttftMs: 100, totalMs: 1100, tokens: { prompt: 1000, cached: 0, completion: 100 }, toolNames: [], finishReason: "stop", throttled: false, ...over })

test("median：剔除 null（不按 0 计）；全 null → null；偶数取均值", () => {
  assert.equal(median([3, 1, 2]), 2)
  assert.equal(median([1, null, 3]), 2)
  assert.equal(median([null, undefined, NaN]), null)
  assert.equal(median([1, 2, 3, 4]), 2.5)
  assert.equal(median([]), null)
})

test("sumPresent：全 null → null（不按 0 计）", () => {
  assert.equal(sumPresent([1, null, 2]), 3)
  assert.equal(sumPresent([null, undefined]), null)
})

test("tokPerSec：只计 ttft/total/completion 皆非 null 的 call；空参与 → null", () => {
  assert.equal(tokPerSecOf([call()]), 100, "100 tok / (1.1s − 0.1s) = 100")
  // 分母只算有 ttft 的 call；缺 usage 的 call 不入参与
  assert.equal(tokPerSecOf([call(), call({ tokens: null })]), 100)
  assert.equal(tokPerSecOf([call({ ttftMs: null })]), null)
  assert.equal(tokPerSecOf([call({ ttftMs: 1100 })]), null, "total − ttft ≤ 0 不参与")
  assert.equal(tokPerSecOf([]), null)
})

test("runMetrics：ttft 取首轮；total = Σ per-call；tokens 求和", () => {
  const m = runMetrics([call(), call({ round: 2, ttftMs: 200, totalMs: 400, tokens: { prompt: 100, cached: 40, completion: 50 } })])
  assert.equal(m.ttftMs, 100)
  assert.equal(m.totalMs, 1500)
  assert.deepEqual(m.tokens, { prompt: 1100, cached: 40, completion: 150 })
  assert.equal(runMetrics([]).ttftMs, null)
})

test("aggregateVerdict / speedMedians：N 次全过 = pass；速度只取 pass/fail run", () => {
  assert.equal(aggregateVerdict([{ verdict: "pass" }, { verdict: "pass" }]), "pass")
  assert.equal(aggregateVerdict([{ verdict: "pass" }, { verdict: "fail" }]), "fail")
  assert.equal(aggregateVerdict([{ verdict: "skipped" }, { verdict: "skipped" }]), "skipped")
  assert.equal(aggregateVerdict([]), "skipped")
  const s = speedMedians([
    { verdict: "pass", metrics: { ttftMs: 100, tokPerSec: 10, totalMs: 1000 } },
    { verdict: "fail", metrics: { ttftMs: 300, tokPerSec: 30, totalMs: 3000 } },
    { verdict: "error", metrics: { ttftMs: 1, tokPerSec: 999, totalMs: 9 } },
  ])
  assert.equal(s.ttftMs, 200)
  assert.equal(s.tokPerSec, 20)
  assert.equal(s.totalMs, 2000)
  assert.equal(s.samples, 2, "error run 不入速度聚合")
})

test("costOf：逐档单价 × token（缓存价缺省 = 输入价）", () => {
  const entry = { match: "p:m", input: 2, output: 8, cachedInput: 0.04, asOf: "2026-09-23" }
  // (1000 − 200) × 2 + 200 × 0.04 + 100 × 8 = 1600 + 8 + 800 = 2408 元/百万 token ⇒ 0.002408 元
  const c = costOf(entry, { prompt: 1000, cached: 200, completion: 100 }, TABLE)
  assert.equal(c.value, 0.002408)
  assert.equal(c.currency, "CNY")
  assert.equal(c.pricesAsOf, "2026-09-23")
  const noCache = costOf({ match: "p:m", input: 1, output: 2 }, { prompt: 1000, cached: 0, completion: 100 }, TABLE)
  assert.equal(noCache.value, 0.0012, "cachedInput 缺省 ⇒ 缓存 token 按 input 计（无缓存折扣即此式）")
  const unknownCache = costOf(entry, { prompt: 1000, cached: null, completion: 0 }, TABLE)
  assert.equal(unknownCache.value, 0.002, "cached 缺失 ⇒ 按 0 计（全部输入按 input 价）")
  assert.equal(unknownCache.cachedUnknown, true)
  assert.equal(costOf(entry, null, TABLE), null, "usage 缺失 ⇒ null（不估算）")
  assert.equal(costOf(entry, { prompt: null, completion: 1 }, TABLE), null)
  assert.equal(costOf(null, { prompt: 1, cached: 0, completion: 1 }, TABLE), null)
})

test("matchPrice：精确优先；通配按字面段长度降序；无命中 → null", () => {
  const table = { ...TABLE, entries: [
    { match: "qwen:*", input: 1, output: 1 },
    { match: "qwen:qwen3.8-*", input: 2, output: 2 },
    { match: "qwen:qwen3.8-flash", input: 3, output: 3 },
  ] }
  assert.equal(matchPrice(table, "qwen", "qwen3.8-flash").input, 3, "精确优先")
  assert.equal(matchPrice(table, "qwen", "qwen3.8-max").input, 2, "更长的字面段优先")
  assert.equal(matchPrice(table, "qwen", "qwen3.7-flash").input, 1)
  assert.equal(matchPrice(table, "other", "x"), null)
})

test("loadPrices：schema fail-closed（缺 asOf / input 非数字 ⇒ 装载即拒）", () => {
  const dir = mkdtempSync(join(tmpdir(), "bench-prices-"))
  const write = (name, obj) => {
    const p = join(dir, name)
    writeFileSync(p, JSON.stringify(obj), "utf8")
    return p
  }
  assert.throws(() => loadPrices(write("a.json", { currency: "CNY", unit: "u", source: "s", entries: [] })), /asOf/)
  assert.throws(() => loadPrices(write("b.json", { asOf: "2026-09-23", currency: "CNY", unit: "u", source: "s", entries: [{ match: "p:m", input: "2", output: 3 }] })), /input 非数字/)
  assert.throws(() => loadPrices(write("c.json", { asOf: "2026-09-23", currency: "CNY", unit: "u", source: "s", entries: [{ match: "p:m", input: 2 }] })), /output 非数字/)
  assert.throws(() => loadPrices(join(dir, "missing.json")), /不可读/)
  const ok = loadPrices(write("d.json", { asOf: "2026-09-23", currency: "CNY", unit: "u", source: "s", entries: [{ match: "p:m", input: 1, output: 2 }] }))
  assert.equal(ok.entries.length, 1)
})

test("applyPricesToResult：填 costCny / metrics.cost / aggregate + 三类警告", () => {
  const prices = { ...TABLE, entries: [{ match: "p:m", input: 1, output: 2 }] }
  const data = {
    models: [{
      label: "m", provider: "p", model: "m",
      cases: [{
        caseId: "c.1",
        runs: [
          { verdict: "pass", metrics: { tokens: { prompt: 1000, cached: 0, completion: 100 } }, calls: [call({ tokens: { prompt: 1000, cached: 0, completion: 100 } })] },
          { verdict: "error", metrics: { tokens: null }, calls: [call({ tokens: null, ttftMs: null, totalMs: null })] },
        ],
      }],
    }],
    manual: [{ label: "m", promptId: "manual.1", metrics: { tokens: { prompt: 10, cached: 0, completion: 10 } } }],
  }
  const warnings = []
  applyPricesToResult(data, prices, warnings)
  const [run, bad] = data.models[0].cases[0].runs
  assert.equal(run.calls[0].costCny, 0.0012)
  assert.equal(run.metrics.cost.value, 0.0012)
  assert.equal(bad.metrics.cost, null, "全是失败 call ⇒ 成本 null（不按 0 计）")
  assert.equal(data.models[0].aggregate.passed, 0, "含 error 的用例判定 = fail")
  assert.equal(data.models[0].aggregate.total, 1)
  assert.equal(data.models[0].aggregate.costCny, 0.0012)
  assert.equal(data.manual[0].metrics.cost.value, 0.00003, "人工 lane 成本按条单项列出")
  assert.ok(warnings.some((w) => w.includes("usage 缺失")), "usage 缺失须登录警告")
  // 人工 lane 的 usage 缺失亦须登录（§2.2-6 → §2.2-1）
  const w4 = []
  applyPricesToResult({ models: [{ label: "m", provider: "p", model: "m", cases: [] }], manual: [{ label: "m", promptId: "manual.1", metrics: { ttftMs: null, totalMs: null, tokPerSec: null, tokens: null, cost: null } }] }, prices, w4)
  assert.ok(w4.some((w) => w.includes("usage 缺失") && w.includes("manual.1")), "人工 lane 缺 usage 须登录")

  // 改价 ⇒ 同一账目重算出不同成本（重算语义 = 换 prices 表重跑本函数）
  const warnings2 = []
  const prices2 = { ...TABLE, entries: [{ match: "p:m", input: 2, output: 4 }] }
  applyPricesToResult(data, prices2, warnings2)
  assert.equal(data.models[0].cases[0].runs[0].metrics.cost.value, 0.0024, "改价后成本列随新价变化")
  assert.equal(data.models[0].aggregate.costCny, 0.0024)

  const warnings3 = []
  applyPricesToResult(data, { ...TABLE, entries: [] }, warnings3)
  assert.equal(data.models[0].cases[0].runs[0].metrics.cost, null)
  assert.ok(warnings3.some((w) => w.includes("价格未录")))
})
