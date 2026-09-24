/**
 * lib/prices-judge.mjs — 判官 / 复核账目（设计 §2.10.5 / §2.10.6 / §2.2-16 · AC-4 / AC-10）。
 *
 * 自 `prices.mjs` 迁出（该档 300 行上限 + 级联计价增量）：单价**同源** `prices.json`（匹配与计算式复用
 * `prices.mjs` 的 `matchPrice` / `costOf`——两档互为环状 import，但两侧只导出函数声明（实例化期已初始化）⇒ 安全）。
 * 计价键 = **该次调用的实际身份**（§2.10.5）：`calls[].level`（1 = 原位 ⇒ 不写）映射到当时的替代级身份
 * （`judges[].substitutes[]` 的 `level` → `provider:model`）——**不按原位键**；缺价 ⇒ `costCny = null` +
 * 警告**逐实际身份**（不估不转写）。
 *
 * 调用数口径（§2.2 样例逐位与合计自洽）：原位槽 `calls` = **该槽的原位调用数**（level 1）；替代池项 `calls` =
 * 该池项被调用次数；`judgeCalls` = 两者之和（含 C 位与替代级——逐位置不重不漏）。
 * 聚合面：逐 run → `aggregate.judgeCostCny` / `aggregate.reviewCostCny` / `aggregate.overturns`；
 * 全局 → 顶层 `judge`（逐位 + 池内逐项 + 合计 + 分歧 / 级联各计数）/ 顶层 `review`（账目主位，§2.2-7 不双写）；
 * **不进** `runs[].metrics.cost` / `aggregate.costCny`（被测成本面零污染）。
 */

import { costOf, matchPrice } from "./prices.mjs"

const round8 = (n) => Math.round(n * 1e8) / 1e8

/** 逐位记账累加器（calls = 逐尝试条数；cost = 成功计价尝试之和，无成功 ⇒ null）。 */
function newAcc() {
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

/** 判官 / 复核成本应用与聚合（§2.10.5：射程 = 判官对 + 仲裁 C + 替代池；复核沿 A 位单判）。
 *  - 逐调用填充 `runs[].judge.judges[].calls[].costCny` / `runs[].review.calls[].costCny`（原子账目 ⇒ 重算友好）；
 *  - 原位调用计原位槽（`judges[]` / `arbiter`）· 替代级调用计池内该项（`fallbacks[]`）——按 `calls[].level` 分流。 */
export function applyJudgeCosts(data, prices, warnings) {
  const judge = data.judge
  if (!judge) return data
  const slotMetas = [
    { id: "A", meta: (judge.judges ?? [])[0] },
    { id: "B", meta: (judge.judges ?? [])[1] },
    { id: "C", meta: judge.arbiter },
  ].filter((s) => s.meta)
  if (slotMetas.length === 0) return data
  const metaOf = (id) => slotMetas.find((s) => s.id === id)?.meta ?? null
  const poolItems = (judge.fallbacks ?? []).map((f, i) => ({ id: `替代级 ${i + 1}`, key: `${f.provider}:${f.model}`, meta: f }))
  const slotAcc = new Map(slotMetas.map((s) => [s.id, newAcc()]))
  const poolAcc = new Map() // key = `provider:model`（池外身份亦可落账——合计不丢调用）
  const reviewAcc = newAcc()
  const counts = { agreements: 0, disagreements: 0, arbitrations: 0, unavailable: 0, uphold: 0, overturn: 0, substitutions: 0, singleJudged: 0 }
  const poolAccAt = (key) => {
    if (!poolAcc.has(key)) poolAcc.set(key, newAcc())
    return poolAcc.get(key)
  }
  const byVerdict = (m, id) => (m?.judges ?? []).find((j) => j.id === id)

  for (const m of data.models ?? []) {
    let jCost = null
    let rCost = null
    let overturns = 0
    for (const c of m.cases ?? []) {
      for (const run of c.runs ?? []) {
        for (const j of run.judge?.judges ?? []) {
          const own = slotAcc.get(j.id)
          if (!own) continue
          for (const call of j.calls ?? []) {
            // 实际身份（§2.10.5）：level 1 / 缺省 ⇒ 原位槽；替代级 ⇒ 该位 substitutes 中同 level 的池项身份
            const sub = call?.level > 1 ? (j.substitutes ?? []).find((s) => s.level === call.level) : null
            const unknown = call?.level > 1 && !sub // 级号有而身份无（异构 / 手改档）⇒ **不按原位键计价**（不静默伪价）
            const ident = unknown ? null : sub ?? metaOf(j.id)
            const entry = ident ? matchPrice(prices, ident.provider, ident.model) : null
            const cost = costOf(entry, call?.tokens ?? null, prices)
            call.costCny = cost ? cost.value : null
            const acc = sub ? poolAccAt(`${sub.provider}:${sub.model}`) : own
            if (unknown) warnings.push(`替代级身份缺失：判官 ${j.id}（level ${call.level} 无 substitutes 条目——按身份不明处置）`)
            else if (!entry) acc.noPrice = true
            accAdd(acc, cost, call)
            if (cost) jCost = (jCost ?? 0) + cost.value
          }
        }
        if (run.review) {
          for (const call of run.review.calls ?? []) {
            const { cost, noPrice } = priceCall(call, metaOf("A"), prices)
            if (noPrice) reviewAcc.noPrice = true
            accAdd(reviewAcc, cost, call)
            if (cost) rCost = (rCost ?? 0) + cost.value
          }
          if (run.review.verdict === "overturn") {
            counts.overturn++
            overturns++
          } else if (run.review.verdict === "uphold") counts.uphold++
        }
        // 分歧计数（§2.3 概览分歧率 = 分歧 ÷ A/B 双有效样本）+ 级联面计数（§2.2-16）
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
          counts.substitutions += (jr.judges ?? []).reduce((n, j) => n + (j.substitutes ?? []).length, 0)
          if (jr.resolution === "single") counts.singleJudged++
        }
      }
    }
    m.aggregate = m.aggregate ?? {}
    m.aggregate.judgeCostCny = jCost == null ? null : round8(jCost)
    m.aggregate.reviewCostCny = rCost == null ? null : round8(rCost)
    m.aggregate.overturns = overturns
  }
  const snap = (a) => ({ calls: a.calls, costCny: a.cost == null ? null : round8(a.cost), noPrice: a.noPrice, usageMissing: a.usageMissing, priced: a.priced })
  let judgeCalls = 0
  for (const s of slotMetas) {
    const a = snap(slotAcc.get(s.id))
    s.meta.calls = a.calls
    s.meta.costCny = a.costCny
    judgeCalls += a.calls
    if (a.noPrice && a.priced === 0) warnings.push(`价格未录：判官 ${s.id}（${s.meta.provider}:${s.meta.model}）（cost=null）`)
    if (a.usageMissing) warnings.push(`usage 缺失：判官 ${s.id}（${s.meta.provider}:${s.meta.model}）（tokens/cost=null）`)
  }
  for (const p of poolItems) {
    const a = snap(poolAcc.get(p.key) ?? newAcc())
    p.meta.calls = a.calls
    p.meta.costCny = a.costCny
    judgeCalls += a.calls
    if (a.noPrice && a.priced === 0) warnings.push(`价格未录：${p.id}（${p.key}）（cost=null）`)
    if (a.usageMissing) warnings.push(`usage 缺失：${p.id}（${p.key}）（tokens/cost=null）`)
  }
  for (const [key, a] of poolAcc) {
    if (poolItems.some((p) => p.key === key)) continue
    judgeCalls += a.calls // 池外身份（如旧池项的档内记录）：调用照记合计 + 明示，不静默丢账
    warnings.push(`替代级身份不在现行池快照：${key}（${a.calls} 次调用照记合计——池面以 judge.json 现行池为准）`)
  }
  const all = [...slotAcc.values(), ...poolAcc.values()]
  judge.judgeCalls = judgeCalls
  judge.costCny = all.some((a) => a.cost != null) ? round8(all.reduce((n, a) => n + (a.cost ?? 0), 0)) : null
  judge.agreements = counts.agreements
  judge.disagreements = counts.disagreements
  judge.arbitrations = counts.arbitrations
  judge.unavailable = counts.unavailable
  judge.substitutions = counts.substitutions
  judge.singleJudged = counts.singleJudged
  if (data.review) {
    data.review.calls = reviewAcc.calls
    data.review.costCny = reviewAcc.cost == null ? null : round8(reviewAcc.cost)
    data.review.uphold = counts.uphold
    data.review.overturn = counts.overturn
    if (reviewAcc.noPrice && reviewAcc.priced === 0 && reviewAcc.calls > 0) {
      warnings.push(`价格未录：复核（沿 A 位 ${metaOf("A")?.provider}:${metaOf("A")?.model}）（cost=null）`)
    }
    if (reviewAcc.usageMissing) warnings.push("usage 缺失：复核（沿 A 位）（tokens/cost=null）")
  }
  return data
}

/** 单次调用计价（复核面用；判官面在逐调用分流处内联——分流须按 `calls[].level` 选实际身份键）。 */
function priceCall(call, meta, prices) {
  const entry = meta ? matchPrice(prices, meta.provider, meta.model) : null
  const cost = costOf(entry, call?.tokens ?? null, prices)
  call.costCny = cost ? cost.value : null
  return { cost, noPrice: !entry }
}
