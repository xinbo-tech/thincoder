/**
 * questions.mjs — 提问 / 计划切片面（批档 §2.3 拆档产物：自 `renderer/events.mjs` **纯搬移**——500 行硬限
 * 顶格，在册拆分预案执行）：`ev:question` 待答项写 `questions[ev.key]`（首写自种 · 同键就地替换）·
 * `ev:task` 计划面整卡写 `tasks[ev.key]` · `clearQuestion` 提问出场（两调用面 = 出站回执 `ok` 真 ∥
 * `stopped` 终局）。`events.mjs` 原址 re-export `clearQuestion`（保导出名面）。
 * 位标面单源 = `renderer/badges.mjs`（本档经 `badgeStamps` 调用 —— 单一实现零副本）。
 * 纪律：纯归约（零 DOM / 零 IPC / 零 `node:` / 零裸包）；键白名单闭集（零新键）· 零键门
 * （非活动会话的项与位标同样在场 —— 切回即见卡）。
 */
import { badgeStamps } from "./badges.mjs"

/** 提问项键白名单（零新键 —— 卡面读取集 = `data-prompt-id` / 题干 / 给答项；载荷缺键 ⇒ 不落槽）。 */
const QUESTION_KEYS = ["promptId", "question", "options"]

/** `ev:question`——待答项写 `questions[ev.key]`（**首写自种** · 同键就地替换零叠条 · 不入 `pool` —— `docs/desktop/design/RENDERER.md` §1.1 事件归约面条）；
 *  位标 `tabBadges[key] ⊇ {approval}`（与 `onApproval` 同形 —— 置位面 = 归约面，`docs/desktop/design/UI.md` §1 提问呈现行）；
 *  零键门：非活动会话的项与位标同样在场（切回即见卡）。出场只走 `clearQuestion`（零乐观写）。 */
export function onQuestion(state, ev) {
  const item = {}
  for (const field of QUESTION_KEYS) if (ev[field] !== undefined) item[field] = ev[field]
  const questions = { ...(state.questions ?? {}), [ev.key]: item }
  const stamps = badgeStamps(state.tabBadges ?? {}, ev.key, "approval", true)
  return stamps.changed ? { ...state, questions, tabBadges: stamps.badges } : { ...state, questions }
}

/** `ev:task`——计划面整卡内容写 `tasks[ev.key]`（**同键就地替换不叠卡** · 空列表 ⇒ 消费面零节点 —— `docs/desktop/design/UI.md` §1 计划面行）；载荷 `items` 逐字原样（非数组 ⇒ `[]` —— 沿 `applyPage` 防御读形）；不入 `pool`。 */
export function onTask(state, ev) {
  const items = Array.isArray(ev.items) ? ev.items : []
  return { ...state, tasks: { ...(state.tasks ?? {}), [ev.key]: items } }
}

/** 提问出场 ⇒ 摘本键项 + 清本键 `approval` 位（§2.11⑦ 零乐观写 —— 两调用面 = 出站回执 `ok === true`（`renderer/mount-cards.mjs`）∥
 *  `stopped` 终局（归约面：中断径各门按取消结算 ⇒ 卡随事件面出场）；位标键源 = 切片键（与置位源 `ev.key` 同值同源）。
 *  无本键项 ⇒ 原引用（幂等 —— 重复回执 ∥ 无项终局零写）。 */
export function clearQuestion(state, key) {
  const questions = state.questions
  if (questions === undefined || !Object.hasOwn(questions, key)) return state
  const remaining = { ...questions }
  delete remaining[key]
  const cleared = badgeStamps(state.tabBadges ?? {}, key, "approval", false)
  return cleared.changed
    ? { ...state, questions: remaining, tabBadges: cleared.badges }
    : { ...state, questions: remaining }
}
