/**
 * badges.mjs — 位标面（批档 §2.3 拆档产物：自 `renderer/events.mjs` **纯搬移**——`events.mjs` 500 行
 * 硬限顶格，在册拆分预案执行）：位标码闭集 `BADGES` + 位标写 `badgeStamps`。
 * 两消费档（`renderer/events.mjs` / `renderer/questions.mjs`）同引本档 ⇒ **单一实现零副本**。
 * 纪律：纯函数（零 DOM / 零 IPC / 零 `node:` / 零裸包）；值等 ⇒ 原对象（`tabBadges` 引用不变 ⇒ 零通知）；
 * 依赖单向（本档 → `subagent-reduce.mjs` 池读数 —— 无环）。
 */
import { poolOf } from "./subagent-reduce.mjs"

/** 位标码闭集（`running` / `approval` / `done` —— §2.2(e) 值面写者表）；闭集外码 = 内部误用 ⇒ fail-loud。 */
const BADGES = ["running", "approval", "done"]

/** 位标写（码闭集按会话键维护；值等 ⇒ 原对象 —— `tabBadges` 引用不变 ⇒ 零通知）。 */
export function badgeStamps(badges, key, code, present) {
  if (!BADGES.includes(code)) throw new Error(`[events] badge code outside closed set: ${code}`)
  const current = Array.isArray(badges[key]) ? badges[key] : []
  const next = present
    ? (current.includes(code) ? current : [...current, code])
    : current.filter((item) => item !== code)
  if (next === current) return { badges, changed: false }
  if (next.length === current.length && next.every((item, index) => item === current[index])) {
    return { badges, changed: false }
  }
  return { badges: { ...badges, [key]: next }, changed: true }
}

/** 忙位回收（#597 · 清位单点）：`running` 摘除 —— **宿主事实驱动**（回执 `started:false` ∕ 发送回执超时；消费点
 *  `renderer/composer-wire.mjs`）；置位写者仍唯一 = 归约面（`renderer/events.mjs` 受理支）。值等 ⇒ 原引用（零通知）。 */
export function clearRunning(state, key) {
  const stamps = badgeStamps(state?.tabBadges ?? {}, key, "running", false)
  return stamps.changed ? { ...state, tabBadges: stamps.badges } : state
}

/** 待决判据（#780 共享谓词 —— 单一实现零副本）：本键任一族尚有项 ⇒ `approval` 位标应留。
 *  两族 = 提问切片（`questions[key]` 在场）∥ 审批池（`pool.approvals` 含起源键 = key 项）；两清径
 *  （`clearApproval` ∥ `clearQuestion`）清码前同过本判据 —— 跨族误清两向同闭（清码 = 两族皆清）。 */
export function hasPendingFor(state, key) {
  const questions = state?.questions
  if (questions !== undefined && Object.hasOwn(questions, key)) return true
  return poolOf(state).approvals.some((entry) => (entry?.key ?? null) === key)
}
