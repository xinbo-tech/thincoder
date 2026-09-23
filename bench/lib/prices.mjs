/**
 * lib/prices.mjs — prices.json 装载 + schema 校验（fail-closed）+ 匹配 + 成本计算式（设计 §2.5）。
 *
 * 成本式（冻结）：
 *   cost = (prompt − cached) × input + cached × (cachedInput ?? input) + completion × output
 *   单价单位 = `unit`（元 / 百万 token）⇒ 先用 1e6 除；cached 取 usage.prompt_cache_hit_tokens，
 *   缺失 ⇒ 0 并记 cachedUnknown 警告。schema 校验 fail-closed（input/output 缺失或非数字 ⇒ 装载即拒）。
 */

import { readFileSync } from "node:fs"
import { aggregateVerdict } from "./metrics.mjs"

const PER_UNIT = 1e6

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
  return data
}

