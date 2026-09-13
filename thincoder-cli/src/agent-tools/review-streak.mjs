/**
 * review-streak.mjs — design-review failure streak guard（第 33 批——2026-09-11）。
 *
 * 同一 doc-set 的 design 评审**连续**未产出可用结算（宿主截断尾五 kind + 陈旧结算 +
 * 凭证落盘失败 + 无报告结算）达 `MAX_DESIGN_REVIEW_STREAK` 次 ⇒ 后续发起被拒
 * （工具层预检 + `runAdvisorReview` 内防线两级——零 LLM / 不耗轮次 / 不置「评审已覆盖」）。
 * 设计权威 = `docs/design/ADVISOR-CONVERGENCE.md` §17（需求 = requirements 档 §12 F28/F29 + N20/N21）。
 *
 * 中立模块（**不 import 任何 src/ 模块**——打断潜在环，§17.5 模块图）：
 *  - `normAbs` 自 advisor-settle.mjs 迁入（原处 re-export——既有 import 面零变）；
 *  - `docSetKey` 自 advisor-async.mjs 迁入（原为私有——零 import 面）。
 * 分类单源：`designReviewOutcome` 为异步结算 / 同步面两计数点共用（D-SK8——防两处分类漂移）。
 * 载体 = 会话级内存 `agent._designReviewStreaks`（Map——不落盘、不进 session 文件；
 * eng 模式切换不清护栏——与 `_advisorRuns` 刻意不同步，§17.9 #5 定案）。
 */
import { join } from "node:path"

/** 连续未产出可用结算的阈值（三振——§17.2 表 1 选定 N=3；`MAX_ADVISOR_ROUNDS` 零改动）。 */
export const MAX_DESIGN_REVIEW_STREAK = 3

/** ABS 归一（cwd 相对 → cwd 拼接）——陈旧判定 / 冻结拦截 / doc-set 键同源（§14.14 E-4）。 */
export function normAbs(p, cwd) {
  const s = String(p)
  return /^[a-zA-Z]:[\\/]/.test(s) || s.startsWith("/") || s.startsWith("\\\\") ? s : join(cwd, s)
}

/** Canonical scope key for design reviews — the document multi-set
 *  (order-insensitive, ABS-path normalized — launch 与 continuation 的写法差异
 *  ("./docs/x.md" vs "docs/x.md"、反斜杠) 不误建新实例).
 *  第 33 批自 advisor-async.mjs 逐字迁入（护栏与实例续跑同锚单源）。 */
export function docSetKey(documents, cwd) {
  const list = [...new Set((documents ?? [])
    .filter((d) => typeof d === "string" && d.trim())
    .map((d) => normAbs(d, cwd)))]
  return JSON.stringify(list.sort())
}

/** 护栏适用的键判据：空清单（`[]` / `null` 的 `docSetKey` 产出 = "[]"）不适用——不计数、
 *  不停止（§17.9 #3 登记；fail-open 于此面）。 */
export function designReviewStreakApplies(key) {
  return typeof key === "string" && key.length > 0 && key !== "[]"
}

/**
 * 结算分类（纯函数单源——§17.3 优先级表，自上而下首个命中；输入 = 宿主可见事实，
 * **零 LLM 输出解析**，N20）。neutral = 无信息事件（取消 / 中断 / 拒发）——不打断连续计数。
 * @param {{launchRefused?: boolean, stale?: boolean, hasResult?: boolean,
 *          incomplete?: string|null, persistFailed?: boolean}} input
 * @returns {{reset: boolean, count: string|null}} reset=true 计数复位；count=需加一的类名；
 *   两者皆空 = neutral（不动计数）。
 */
export function designReviewOutcome(input) {
  const { launchRefused = false, stale = false, hasResult = true, incomplete = null, persistFailed = false } = input ?? {}
  if (launchRefused) return { reset: false, count: null } // 1. 未发起请求（无尝试发生——§14.4 既有语义）
  if (stale) return { reset: false, count: "stale" } // 2. 陈旧结算（未产出可用凭证）
  if (!hasResult) return { reset: false, count: "no_report" } // 3. 无报告（fail-closed）
  if (incomplete && incomplete !== "interrupted") return { reset: false, count: String(incomplete) } // 4. 宿主截断尾五 kind
  if (incomplete === "interrupted") return { reset: false, count: null } // 5. 用户 / 系统中断类（与 cancelled 同族）
  if (persistFailed) return { reset: false, count: "no_credential" } // 6. pass 但槽落盘失败（无可用凭证）
  return { reset: true, count: null } // 7. 可用判决（pass 且落盘成功 / changes-required）——连续链断点
}

/** 记录只读视图（停止判定与结论表的数据源）；空清单键 / 无载体 ⇒ null。 */
export function designReviewStreakRecord(agent, key) {
  if (!designReviewStreakApplies(key)) return null
  const streaks = agent?._designReviewStreaks
  return streaks instanceof Map ? (streaks.get(key) ?? null) : null
}

/** 计数落账（§17.4）：reset ⇒ 删除该键记录；count ⇒ `{count: prev+1, log: […].slice(-N)}`；
 *  neutral ⇒ 不动。载体懒初始化。 */
export function noteDesignReviewOutcome(agent, key, outcome) {
  if (!agent || !designReviewStreakApplies(key) || !outcome) return
  if (outcome.reset) {
    if (agent._designReviewStreaks instanceof Map) agent._designReviewStreaks.delete(key)
    return
  }
  if (typeof outcome.count !== "string" || !outcome.count) return
  const streaks = agent._designReviewStreaks instanceof Map
    ? agent._designReviewStreaks
    : (agent._designReviewStreaks = new Map())
  const prev = streaks.get(key)
  streaks.set(key, {
    count: (prev?.count ?? 0) + 1,
    log: [...(prev?.log ?? []), outcome.count].slice(-MAX_DESIGN_REVIEW_STREAK),
  })
}

/** 停止判定：记录达阈值即停；空清单键恒 false。停止不可自解除（复位仅经可用判决——被拒后
 *  无法发生；会话结束随载体清零）。 */
export function designReviewStreakStopped(agent, key) {
  return (designReviewStreakRecord(agent, key)?.count ?? 0) >= MAX_DESIGN_REVIEW_STREAK
}
