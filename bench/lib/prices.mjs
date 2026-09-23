/**
 * lib/prices.mjs — prices.json 装载 + schema 校验（fail-closed）+ 匹配 + 成本计算式（设计 §2.5）。
 *
 * 成本式（冻结）：
 *   cost = (prompt − cached) × input + cached × (cachedInput ?? input) + completion × output
 *   单价单位 = `unit`（元 / 百万 token）⇒ 先用 1e6 除；cached 取 usage.prompt_cache_hit_tokens，
 *   缺失 ⇒ 0 并记 cachedUnknown 警告。schema 校验 fail-closed（input/output 缺失或非数字 ⇒ 装载即拒）。
 */

import { readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { aggregateVerdict } from "./metrics.mjs"

const PER_UNIT = 1e6
const BENCH_DIR = dirname(dirname(fileURLToPath(import.meta.url)))

/** 价格表路径（默认 `bench/prices.json`；BENCH_PRICES = 改价重算的测试夹具缝——每次读、可运行中切换）。 */
export const pricesPath = () => (process.env.BENCH_PRICES ? resolve(process.env.BENCH_PRICES) : join(BENCH_DIR, "prices.json"))

export function loadPrices(path) {
  let raw
  try {
    raw = JSON.parse(readFileSync(path, "utf8"))
  } catch (e) {
    throw new Error(`prices.json 不可读或非 JSON：${path}（${e.message}）`)
  }
  if (!raw || typeof raw !== "object") throw new Error("prices.json：顶层必须是对象")
  if (!raw.asOf || typeof raw.asOf !== "string") throw new Error("prices.json：缺表级 asOf")
  if (!raw.currency || typeof raw.currency !== "string") throw new Error("prices.json：缺 currency")
  if (!raw.unit || typeof raw.unit !== "string") throw new Error("prices.json：缺 unit")
  if (!raw.source || typeof raw.source !== "string") throw new Error("prices.json：缺表级 source")
  if (!Array.isArray(raw.entries)) throw new Error("prices.json：entries 必须是数组")
  for (const [i, e] of raw.entries.entries()) {
    const at = `entries[${i}]`
    if (!e || typeof e !== "object") throw new Error(`prices.json：${at} 不是对象`)
    if (typeof e.match !== "string" || !e.match) throw new Error(`prices.json：${at} 缺 match`)
    if (typeof e.input !== "number" || !Number.isFinite(e.input)) throw new Error(`prices.json：${at}（${e.match}）input 非数字`)
    if (typeof e.output !== "number" || !Number.isFinite(e.output)) throw new Error(`prices.json：${at}（${e.match}）output 非数字`)
    if (e.cachedInput != null && (typeof e.cachedInput !== "number" || !Number.isFinite(e.cachedInput))) {
      throw new Error(`prices.json：${at}（${e.match}）cachedInput 非数字`)
    }
  }
  return raw
}

const wildcardRe = (pattern) => new RegExp(`^${pattern.split("*").map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*")}$`)

/** 匹配规则（冻结）：① 精确优先；② 通配按字面段长度降序取首个命中；③ 无命中 → null。 */
export function matchPrice(table, provider, model) {
  const key = `${provider}:${model}`
  const entries = table.entries ?? []
  const exact = entries.find((e) => e.match === key)
  if (exact) return exact
  const wild = entries
    .filter((e) => e.match.includes("*"))
    .map((e) => ({ e, lit: e.match.replace(/\*/g, "").length }))
    .filter(({ e }) => wildcardRe(e.match).test(key))
    .sort((a, b) => b.lit - a.lit)
  return wild.length > 0 ? wild[0].e : null
}

/** 单次调用成本；tokens 缺（null）或 prompt/completion 缺 → null（不估算——KD-6）。
 *  第三参 = 表级事实（currency / asOf），条目级 asOf 优先（§2.5「条目级覆盖表级」）。 */
export function costOf(entry, tokens, table = {}) {
  if (!entry || !tokens) return null
  const prompt = tokens.prompt
  const completion = tokens.completion
  if (typeof prompt !== "number" || typeof completion !== "number") return null
  const cached = tokens.cached
  const cachedKnown = typeof cached === "number"
  const cachedN = cachedKnown ? cached : 0
  const inRate = entry.input
  const cachedRate = entry.cachedInput ?? entry.input
  const value = ((prompt - cachedN) * inRate + cachedN * cachedRate + completion * entry.output) / PER_UNIT
  return {
    value: Math.round(value * 1e8) / 1e8,
    currency: table.currency ?? null,
    pricesAsOf: entry.asOf ?? table.asOf ?? null,
    cachedUnknown: !cachedKnown,
  }
}

const round8 = (n) => Math.round(n * 1e8) / 1e8

/**
 * 把价格应用到结果对象（真实运行与 `--recompute` **共用同一实现** —— 重算即「用新 prices.json
 * 重跑本函数」）：填 `calls[].costCny` / `runs[].metrics.cost` / `models[].aggregate`，
 * 并把价格未录 / usage 缺失 / 缓存字段缺失登录进 warnings（§2.2-1、§2.3-3）。
 * 成本聚合 = Σ **成功返回的 call**（被中止/失败的 call 记 null 不入账）。
 */
export function applyPricesToResult(data, prices, warnings) {
  const noPrice = new Set()
  const usageMissing = new Set()
  const cachedUnknown = new Set()
  for (const m of data.models ?? []) {
    const entry = matchPrice(prices, m.provider, m.model)
    if (!entry) noPrice.add(m.label)
    for (const c of m.cases ?? []) {
      for (const run of c.runs ?? []) {
        let sum = null
        for (const call of run.calls ?? []) {
          const rec = costOf(entry, call.tokens, prices)
          call.costCny = rec ? rec.value : null
          if (rec) {
            sum = (sum ?? 0) + rec.value
            if (rec.cachedUnknown) cachedUnknown.add(m.label)
          }
          if (!call.tokens) usageMissing.add(m.label)
        }
        run.metrics.cost = sum == null
          ? null
          : { value: round8(sum), currency: prices.currency, pricesAsOf: entry?.asOf ?? prices.asOf ?? null }
      }
    }
    const cases = m.cases ?? []
    const costs = cases.flatMap((c) => c.runs ?? []).map((r) => r.metrics?.cost?.value).filter((v) => typeof v === "number")
    const costCny = costs.length > 0 ? round8(costs.reduce((a, b) => a + b, 0)) : null
    const verd = cases.map((c) => aggregateVerdict(c.runs ?? []))
    const passed = verd.filter((v) => v === "pass").length
    const total = verd.filter((v) => v !== "skipped").length
    m.aggregate = {
      passed,
      total,
      costCny,
      costPerPassCny: costCny != null && passed > 0 ? round8(costCny / passed) : null,
    }
  }
  // 人工 lane：调用成本按条单项列出（§2.3-④；不入成本归一化）；缺失纪律与用例级同（§2.2-6 → §2.2-1）
  for (const rec of data.manual ?? []) {
    const m = (data.models ?? []).find((x) => x.label === rec.label)
    const entry = m ? matchPrice(prices, m.provider, m.model) : null
    const cost = costOf(entry, rec.metrics?.tokens ?? null, prices)
    if (rec.metrics) {
      rec.metrics.cost = cost
        ? { value: cost.value, currency: prices.currency, pricesAsOf: entry?.asOf ?? prices.asOf ?? null }
        : null
    }
    if (!rec.metrics?.tokens) usageMissing.add(`${rec.label}（${rec.promptId}）`)
    if (cost?.cachedUnknown) cachedUnknown.add(rec.label)
  }
  for (const l of noPrice) warnings.push(`价格未录：${l}（cost=null）`)
  for (const l of usageMissing) warnings.push(`usage 缺失：${l}（tokens/cost=null）`)
  for (const l of cachedUnknown) warnings.push(`缓存命中字段缺失：${l}（cached 按 0 计）`)
  applyJudgeCosts(data, prices, warnings)
  return data
}

/** 位次 → 顶层 `judge` 块条目（§2.10.6：位序定身份 A / B / C）。 */
function slotMetas(judge) {
  const list = [
    { id: "A", meta: (judge?.judges ?? [])[0] },
    { id: "B", meta: (judge?.judges ?? [])[1] },
    { id: "C", meta: judge?.arbiter },
  ]
  return list.filter((s) => s.meta)
}

/** 逐位记账累加器（calls = 逐尝试条数；cost = 成功计价尝试之和，无成功 ⇒ null）。 */
function newSlotAcc() {
  return { calls: 0, cost: null, priced: 0, noPrice: false, usageMissing: false }
}

function accAdd(acc, cost, call) {
  acc.calls++
  if (call?.tokens == null) acc.usageMissing = true
  if (cost) {
    acc.cost = (acc.cost ?? 0) + cost.value
    acc.priced++
  }
}

/**
 * 判官 / 复核成本应用与聚合（§2.10.5 / AC-4 / AC-10 · 射程 = 判官对 + 仲裁）：
 * - 单价同源 `prices.json`（按**各判官位**的 `provider:model` 走同一匹配与计算式）；缺价 / 缺 usage ⇒ `null` + 警告；
 * - 逐位逐尝试填充 `runs[].judge.judges[].calls[].costCny` / `runs[].review.calls[].costCny`（原子账目 ⇒ 重算友好）；
 * - 聚合：逐 run → `aggregate.judgeCostCny` / `aggregate.reviewCostCny` / `aggregate.overturns`；
 *   全局 → 顶层 `judge`（逐位 + 合计 + 分歧计数）/ 顶层 `review`（账目主位，§2.2-7 不双写）；
 * - **不进** `runs[].metrics.cost` / `aggregate.costCny`（被测成本面零污染）。
 */
export function applyJudgeCosts(data, prices, warnings) {
  const metas = slotMetas(data.judge)
  if (metas.length === 0) return data
  const mBySlot = new Map(metas.map((s) => [s.id, s.meta]))
  const acc = new Map(metas.map((s) => [s.id, newSlotAcc()]))
  const reviewAcc = newSlotAcc()
  let judgeCalls = 0
  let reviewCalls = 0
  const counts = { agreements: 0, disagreements: 0, arbitrations: 0, unavailable: 0, uphold: 0, overturn: 0 }

  const priceCall = (call, meta) => {
    const entry = meta ? matchPrice(prices, meta.provider, meta.model) : null
    const cost = costOf(entry, call?.tokens ?? null, prices)
    call.costCny = cost ? cost.value : null
    return { cost, noPrice: !entry }
  }
  const byVerdict = (m, id) => (m?.judges ?? []).find((j) => j.id === id)

  for (const m of data.models ?? []) {
    let jCost = null
    let rCost = null
    let overturns = 0
    for (const c of m.cases ?? []) {
      for (const run of c.runs ?? []) {
        for (const j of run.judge?.judges ?? []) {
          const a = acc.get(j.id)
          if (!a) continue
          for (const call of j.calls ?? []) {
            const { cost, noPrice } = priceCall(call, mBySlot.get(j.id))
            if (noPrice) a.noPrice = true
            accAdd(a, cost, call)
            if (cost) jCost = (jCost ?? 0) + cost.value
          }
        }
        if (run.review) {
          for (const call of run.review.calls ?? []) {
            const { cost, noPrice } = priceCall(call, mBySlot.get("A"))
            if (noPrice) reviewAcc.noPrice = true
            accAdd(reviewAcc, cost, call)
            if (cost) rCost = (rCost ?? 0) + cost.value
          }
          if (run.review.verdict === "overturn") {
            counts.overturn++
            overturns++
          } else if (run.review.verdict === "uphold") counts.uphold++
        }
        // 分歧计数（§2.3 概览分歧率 = 分歧 ÷ A/B 双有效样本）
        const jr = run.judge
        if (jr) {
          const A = byVerdict(jr, "A")
          const B = byVerdict(jr, "B")
          const validA = A && (A.verdict === "pass" || A.verdict === "fail")
          const validB = B && (B.verdict === "pass" || B.verdict === "fail")
          if (validA && validB) {
            if (A.verdict === B.verdict) counts.agreements++
            else counts.disagreements++
          }
          if (jr.resolution === "arbitrated") counts.arbitrations++
          if (jr.verdict === "error") counts.unavailable++
        }
      }
    }
    m.aggregate = m.aggregate ?? {}
    m.aggregate.judgeCostCny = jCost == null ? null : round8(jCost)
    m.aggregate.reviewCostCny = rCost == null ? null : round8(rCost)
    m.aggregate.overturns = overturns
  }
  const slotSnap = (id) => {
    const a = acc.get(id)
    return { calls: a.calls, costCny: a.cost == null ? null : round8(a.cost), noPrice: a.noPrice, usageMissing: a.usageMissing, priced: a.priced }
  }
  for (const s of metas) {
    const snap = slotSnap(s.id)
    s.meta.calls = snap.calls
    s.meta.costCny = snap.costCny
    judgeCalls += snap.calls
    if (snap.noPrice && snap.priced === 0) warnings.push(`价格未录：判官 ${s.id}（${s.meta.provider}:${s.meta.model}）（cost=null）`)
    if (snap.usageMissing) warnings.push(`usage 缺失：判官 ${s.id}（${s.meta.provider}:${s.meta.model}）（tokens/cost=null）`)
  }
  if (data.judge) {
    data.judge.judgeCalls = judgeCalls
    data.judge.costCny = [...acc.values()].some((a) => a.cost != null) ? round8([...acc.values()].reduce((n, a) => n + (a.cost ?? 0), 0)) : null
    data.judge.agreements = counts.agreements
    data.judge.disagreements = counts.disagreements
    data.judge.arbitrations = counts.arbitrations
    data.judge.unavailable = counts.unavailable
  }
  if (data.review) {
    reviewCalls = reviewAcc.calls
    data.review.calls = reviewCalls
    data.review.costCny = reviewAcc.cost == null ? null : round8(reviewAcc.cost)
    data.review.uphold = counts.uphold
    data.review.overturn = counts.overturn
    if (reviewAcc.noPrice && reviewAcc.priced === 0 && reviewCalls > 0) {
      warnings.push(`价格未录：复核（沿 A 位 ${mBySlot.get("A")?.provider}:${mBySlot.get("A")?.model}）（cost=null）`)
    }
    if (reviewAcc.usageMissing) warnings.push(`usage 缺失：复核（沿 A 位）（tokens/cost=null）`)
  }
  return data
}

