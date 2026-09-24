/**
 * lib/report-params.mjs — 报告的**逐档参数表**分段（设计 §2.3 骨架 + §2.3-9 · KD-35 / 台账 #269；
 * `report-tables.mjs` 超 300 行 ⇒ 拆分——体例同 `report-review.mjs` / `report-time.mjs`）。
 *
 * 冻结口径（§2.3-9）：行 = 每一在册被测档（序同概览模型表）；列 = {模型 · 路由（`provider:model@host`）·
 * temperature · 思考强度（`reasoningEffort` + 来源）· maxTokens（取自 `run.maxTokens`）}——**单源 = 结果 JSON**；
 * 温度例外档在该格注「档位例外」（与披露句同源派生，非第二真相源）；缺键（旧档未采集）⇒ 该格 `—`（**不追改**）。
 * **生效性事实**（如「服务端忽略 effort」）**不设独立列**——随 `models[].note` 披露（概览模型表「备注」列——§2.3-9）。
 * 呈现面变化 ⇒ **不 bump**（KD-27）；参数表零金额（KD-29 正交）。
 */

/** 思考强度来源标注（§2.2-13 两值：`models.json` = 档位覆写 / `config` = 用户配置原值）。 */
const EFFORT_SRC = { "models.json": "档位覆写：models.json", config: "配置原值：config" }

export function paramsSection(data) {
  const models = data.models ?? []
  if (models.length === 0) return []
  const runTemp = data.run?.temperature ?? 0
  const maxTokens = data.run?.maxTokens ?? "—"
  const routeOf = (m) => (m.host ? `${m.provider}:${m.model}@${m.host}` : `${m.provider}:${m.model}`)
  const tempOf = (m) => {
    const t = m.temperature ?? runTemp
    return `${t}${t !== runTemp ? "（档位例外）" : ""}`
  }
  const effortOf = (m) =>
    m.reasoningEffort == null ? "—" : `${m.reasoningEffort}（${EFFORT_SRC[m.reasoningEffortFrom] ?? "来源未采集"}）`
  return [
    "**逐档参数表**（实际发送的请求参数——跨档 / 跨代可比性的前提；单源 = 结果 JSON）：",
    "",
    "| 模型 | 路由 | temperature | 思考强度（值 + 来源） | maxTokens |",
    "| --- | --- | --- | --- | --- |",
    ...models.map((m) => `| ${m.label} | ${routeOf(m)} | ${tempOf(m)} | ${effortOf(m)} | ${maxTokens} |`),
    "",
  ]
}
