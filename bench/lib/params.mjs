/**
 * lib/params.mjs — 跑批参数单源（设计 §2.13-1 · KD-32 / KD-34 · 台账 #264 / #266）：
 * provider 条目构造（config clone + 覆写）+ 枚举面判定。
 *
 * 构造面（§2.9-1 冻结）：请求参数只住**条目**——核从条目读 `maxTokens` / `temperature` / `reasoningEffort`，
 * 且请求体模型名取条目（`provider/core.mjs:178` / `:184` / `:185` / `:196`）⇒ 覆写不落条目会**静默失效**。
 * 本档 = 四处（`pipeline.mjs` 条目构造 · `run.mjs` 启动门 · `bench/preflight.mjs` · 测试）共用单源
 * ——防「预检一套、跑批另一套」漂移（KD-34 被否候选 ②）。
 *
 * 思考强度（KD-32 中档口径）：档位字段 `reasoningEffort` 优先；缺省沿用户 config 条目原值；两者皆无 ⇒
 * **不发该字段**（键不落条目）。豁免面（核守卫同判 · `provider/core.mjs:196-197`）：`model` 含 `/`
 * （路由形态名）或 `format ∈ {anthropic, google}` ⇒ effort 不启送 ⇒ 记录面按「未发送」语义处置
 * （§2.2-13 两键不写）。
 *
 * 枚举面判定（§2.13-1 · 六项逐项裁定）：① provider 在 config = **阻断** · ② spec 命中 = **阻断**
 * （名单档无专行 = 尺寸静默低估面）· ③ `reasoningEffort` ∈ 该档 `reasoningEffortEnum` = **阻断**
 * （#264 类结构性防复发）· ④ 温度档位值与 `tempRange` 裁剪对账 = **报警**（入档值 ≠ 实发值提示）·
 * ⑤ 路由 / format 豁免面 = **豁免**（③ 判定跳过）· ⑥ thinking 面组合 = **豁免——不设判定**
 * （运行面组合语义归核守卫单源，预检不复制）。**阻断集 = ①②③**。
 */

import { specMatch } from "../../thincoder-core/config.mjs"

/** 思考强度词表（七值 · `models.json` 档位字段取值域——§2.4⑥；越表 ⇒ 装载即拒）。 */
export const EFFORT_VALUES = ["none", "minimal", "low", "medium", "high", "xhigh", "max"]

/** provider 条目构造（§2.9-1 冻结）：克隆 base（用户 config 条目 / dry-run 夹具条目）+ 覆写四字段
 *  （`model` / `maxTokens` / `temperature` / `reasoningEffort`）。
 *  `reasoningEffort == null` ⇒ **键不落条目**（沿 base 原值——透传纪律：档位与 config 两处皆无 ⇒ 核不发该字段）。 */
export function buildProviderEntry(base, { model, maxTokens, temperature, reasoningEffort = null }) {
  const entry = { ...base, model, maxTokens, temperature }
  if (reasoningEffort != null) entry.reasoningEffort = reasoningEffort
  return entry
}

/** 路由 / format 豁免面（核守卫同判——`provider/core.mjs:196-197`）：命中 ⇒ effort 不启送（§2.13-⑤）。
 *  `format` 随用户 config 条目派生（本机实际发送面；spec 行自带的 format 是同一事实的另一登记面）。 */
export function isEffortExempt(model, user) {
  if (String(model ?? "").includes("/")) return true
  return user?.format === "anthropic" || user?.format === "google"
}

/** 实发 effort 面（§2.2-13 入档语义）：`{ value, from }`——`models.json` = 档位覆写 / `config` = 用户配置原值；
 *  豁免面或两处皆无 ⇒ `null`（**未发送** ⇒ 两键不写——KD-35）。 */
export function effortFace(entry, user) {
  const value = entry?.reasoningEffort ?? user?.reasoningEffort ?? null
  if (value == null || isEffortExempt(entry?.model, user)) return null
  return { value, from: entry.reasoningEffort != null ? "models.json" : "config" }
}

/** 温度裁剪对账（报警腿 · §2.13-④）：核按 `spec.tempRange` 归一裁剪（`provider/core.mjs:187-190`）——
 *  裁剪后 ≠ 档位值 ⇒ 该档入档温度 ≠ 实发温度。返回实发值（无 tempRange ⇒ 原值）。 */
export function clampedTemperature(spec, value) {
  if (typeof value !== "number" || !spec?.tempRange) return value
  return Math.round(Math.min(spec.tempRange[1], Math.max(spec.tempRange[0], value)) * 100) / 100
}

/** 单个受检面的六项判定（档面与判官槽面共用同一体）。
 *  `who` = 读数点名；`user` = 该 provider 的用户 config 条目（`null` = 不读 config 面——provider ① 跳过）。 */
function checkFace({ who, provider, model, effort, temperature, user, providers }, note) {
  if (providers != null && !providers.some((p) => p.name === provider)) {
    note("阻断", `${who}：provider「${provider}」不在用户 config（项①）`)
  }
  const spec = specMatch(model)
  if (!spec.matched) note("阻断", `${who}：spec 未命中「${model}」——兜底 128K / 32K（尺寸静默低估，项②）`)
  if (isEffortExempt(model, user)) {
    if (effort != null) {
      const why = String(model ?? "").includes("/") ? "model 含 /（路由形态名）" : `format = ${user?.format}`
      note("豁免", `${who}：${why} ⇒ effort「${effort}」不启送（③ 判定跳过，记录面按未发送处置，项⑤）`)
    }
  } else if (effort != null && spec.spec.reasoningEffortEnum && !spec.spec.reasoningEffortEnum.includes(effort)) {
    note("阻断", `${who}：reasoningEffort「${effort}」∉ 该档枚举 [${spec.spec.reasoningEffortEnum.join(", ")}]（项③——核守卫同判，跑批必抛）`)
  }
  if (typeof temperature === "number") {
    const sent = clampedTemperature(spec.spec, temperature)
    if (sent !== temperature) note("报警", `${who}：temperature ${temperature} 经 tempRange [${spec.spec.tempRange}] 裁剪 ⇒ 实发 ${sent}（项④——入档值 ≠ 实发值）`)
  }
  note("信息", `${who}：thinkApi ${spec.spec.thinkApi ?? "—"}（项⑥ 不设判定——thinking 组合语义归核守卫单源，供目检）`)
}

/**
 * 枚举面判定（§2.13-1 · 六项对齐腿）：逐档 + 判官三槽做「config × spec」兼容判定——零网络 · 纯判定。
 * `providers == null` ⇒ provider 面（①）与槽位 config 面跳过（`--dry-run` 不读用户 config）。
 * 返回 `{ blockers, warnings, lines }`：blockers = 阻断集（①②③，拒跑依据——逐条点名）· warnings = 报警集（④）。
 */
export function enumerationPreflight({ entries = [], slots = [], providers = null } = {}) {
  const blockers = []
  const warnings = []
  const lines = []
  const note = (kind, msg) => {
    lines.push(`${kind} ${msg}`)
    if (kind === "阻断") blockers.push(msg)
    if (kind === "报警") warnings.push(msg)
  }
  for (const e of entries) {
    const user = (providers ?? []).find((p) => p.name === e.provider) ?? null
    checkFace({
      who: `模型 ${e.label}`,
      provider: e.provider,
      model: e.model,
      effort: e.reasoningEffort ?? user?.reasoningEffort ?? null,
      temperature: e.temperature ?? 0,
      user,
      providers,
    }, note)
  }
  for (const s of slots) {
    const user = (providers ?? []).find((p) => p.name === s.provider) ?? null
    checkFace({
      who: `判官 ${s.id} 位`,
      provider: s.provider,
      model: s.model,
      effort: user?.reasoningEffort ?? null, // 判官面 effort 沿 provider 条目原值（不覆写——§2.10.3）
      temperature: 0, // 判官温度冻结 0（§2.10.1）
      user,
      providers,
    }, note)
  }
  return { blockers, warnings, lines }
}
