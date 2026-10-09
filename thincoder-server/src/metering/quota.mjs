/**
 * quota.mjs — 配额准入（metering/METERING.md §2 ∥ KD-SV-38）：分模型三级 × 计数固定字段点查。
 *
 * 三级 = ① 成员×模型覆盖（`members.model_quotas_json`——随鉴权行零查询） ⇒ ② 平台默认
 * （`providers.settings_json[上游模型名].quotaTokens`——随运行时快照零查询） ⇒ ③ 不限；
 * 三级全无 ⇒ **零 SQL 短路**（不触库）；命中 ⇒ `quota_counters` 点查 O(1)（非每次 SUM——用户 09:34 直令）。
 * 检查点 = 派发命中后、转发前（`gateway/routes.mjs`——与限流准入并列）；**仅 chat**（嵌入面零涉——用户 09:31 裁）。
 * 超限 ⇒ 429 `quota_exceeded`（message 含模型外标 + 已用/额度；他模型不受累——按请求模型判）。
 * 已知边界：单笔可越顶（准入不知本笔产出——KD-SV-6 在册）。
 * 键口径：覆盖键 = 对外标识（配别名 ⇒ 别名 ∥ 未配 ⇒ `provider/model`——KD-SV-59）∥ 计数键 = 拆列两段（provider + 上游模型名）。
 */
import { HttpError } from "../gateway/errors.mjs"
import { quotaCounterTokens } from "./aggregates.mjs"

/** 三级解析：① 覆盖（未设 = 用平台） ⇒ ② 平台（未设 = 不限） ⇒ ③ 不限；出 = `{ quota, source }`。 */
export function resolveQuota(member, { model, settings = {} } = {}) {
  const override = member?.modelQuotas?.[model]
  if (override !== undefined && override !== null) return { quota: override, source: "member" }
  const platform = settings?.quotaTokens ?? null
  if (platform !== null) return { quota: platform, source: "platform" }
  return { quota: null, source: null }
}

/** 准入检查：`{ allowed, used, quota, source }`——三级全无 ⇒ `used = null`（**零 SQL**，不触库）。 */
export function checkQuota(db, member, { model, provider, upstreamModel, settings = {}, now = Date.now() } = {}) {
  if (!member || !Number.isInteger(member.id)) throw new Error("checkQuota：缺少成员（调用方须先完成 key 校验）")
  const { quota, source } = resolveQuota(member, { model, settings })
  if (quota === null) return { allowed: true, used: null, quota: null, source: null } // 短路：零 SQL（不限）
  const used = quotaCounterTokens(db, { memberId: member.id, provider, model: upstreamModel, now })
  return { allowed: used < quota, used, quota, source }
}

/** 准入断言（D3 消费接口——按形就位）：超额 ⇒ 429 + 可读提示（含模型外标 + 已用/额度——AC-4 ∥ AC-21④）。 */
export function assertQuota(db, member, { model, provider, upstreamModel, settings = {}, now = Date.now() } = {}) {
  const state = checkQuota(db, member, { model, provider, upstreamModel, settings, now })
  if (!state.allowed) {
    throw new HttpError("quota_exceeded", `模型 ${model} 本月 token 额度已用尽（已用 ${state.used} / 额度 ${state.quota}）`)
  }
  return state
}
