/**
 * quota.mjs — 配额准入（metering/METERING.md §2 ∥ KD-SV-6）：成员月度 token 累计检查（与记账同口径）。
 *
 * 时点 = 准入（读已记账累计，不预估在途）；额度 = `members.quota_tokens`（null = 不限）；
 * 已用 ≥ 额度 ⇒ 429 `quota_exceeded`（message 含已用/额度——AC-4）。
 * 已知边界：单笔可越顶（准入不知本笔产出——KD-SV-6 在册）。
 */
import { HttpError } from "../gateway/errors.mjs"
import { monthlyTokensForMember } from "./usage.mjs"

/** 准入检查：`{ allowed, used, quota }`（quota null = 不限）。 */
export function checkQuota(db, member, { now = Date.now() } = {}) {
  if (!member || !Number.isInteger(member.id)) throw new Error("checkQuota：缺少成员（调用方须先完成 key 校验）")
  const quota = member.quota_tokens ?? null
  const used = monthlyTokensForMember(db, member.id, { now })
  if (quota === null) return { allowed: true, used, quota: null }
  return { allowed: used < quota, used, quota }
}

/** 准入断言（D3 消费接口——按形就位）：超额 ⇒ 429 + 可读提示（含已用/额度值）。 */
export function assertQuota(db, member, { now = Date.now() } = {}) {
  const state = checkQuota(db, member, { now })
  if (!state.allowed) {
    throw new HttpError("quota_exceeded", `本月 token 额度已用尽（已用 ${state.used} / 额度 ${state.quota}）`)
  }
  return state
}
