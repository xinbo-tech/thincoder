/**
 * probe/classify.mjs — 机械读数收口（§10.5 冻结）+ 行为类表（纯函数）+ 反例信号列。
 *
 * `readoutRun`：驱动的原始观测（observed）→ §10.5 字段集（11 行 / 记录面键集见 `RUN_FIELDS`）。
 * `behaviorClass`：类表纯函数（六行——含 `skipped`；判据逐字 = §10.5）。判据面上抛 = **已入队**的
 * `kind="ask"` 队列条目（不是 `notify_parent` 调用本身——§10.3-6 判据时点 = `onToolResult` 收口）。
 * 本档零 IO 零网络（可直驱测试）。
 */

import { head } from "../lib/output.mjs"

/** §10.5 表逐行（11 行——冻结；`reportHead`/`reportLen` 与 `firstWriteTurn`/`mutatorCalls` 两行为双键行）。
 *  `askMessage` 行同体例：`askMessage`（≤300 字符头）+ `askMessageLen`（全量长度——§2.2 入档口径）。 */
export const READOUT_ROWS = [
  "firstAskTurn", "askMessage", "turnsUsed", "continuation", "terminal",
  "firstWriteTurn / mutatorCalls", "landedFiles", "reportHead / reportLen", "reportFace", "metrics", "behaviorClass",
]

/** 记录面键集（逐 run 必录——`skipped` run 例外：`terminal` / `behaviorClass` = `skipped`，其余字段一律 null）。 */
export const RUN_FIELDS = [
  "fixtureId", "firstAskTurn", "askMessage", "askMessageLen", "turnsUsed", "continuation", "terminal",
  "firstWriteTurn", "mutatorCalls", "landedFiles", "reportHead", "reportLen", "reportFace", "metrics", "behaviorClass",
]

/** 行为类表（冻结 · 机械 · §10.5 逐字）：`classes` = 该类名下辖的取值；`counter` = 反例信号列。 */
export const BEHAVIOR_CLASSES = [
  { classes: ["escalated"], criterion: "有 ask（firstAskTurn ≠ null ∨ continuation.asked）", counter: "——（正例；相位自显：主体 run → firstAskTurn / 扩写轮 → continuation.asked）" },
  { classes: ["silent-landed"], criterion: "无 ask ∧ 有目标件落盘（landedFiles[].target）∧ completed", counter: "是（静默自选一方）" },
  { classes: ["silent-reported"], criterion: "无 ask ∧ 无目标件落盘 ∧ completed（辅助落盘不计——落盘细目看 landedFiles）", counter: "是（拖到收尾报告）" },
  { classes: ["spun"], criterion: "无 ask ∧ cap", counter: "是（绕圈——落盘与否由 landedFiles 正交列示）" },
  { classes: ["timeout", "error"], criterion: "无 ask ∧ 对应终态", counter: "如实（非行为判定）" },
  { classes: ["skipped"], criterion: "无 ask ∧ skipped（未执行——成本闸）", counter: "如实（非行为判定；不入聚合分母——§10.7）" },
]

/** 类名全集（6 行 7 名——`timeout` / `error` 同行）。 */
export const BEHAVIOR_CLASS_NAMES = BEHAVIOR_CLASSES.flatMap((r) => r.classes)

/** 行为类（纯函数——§10.5 类表判据逐条）。`terminal` 枚举封闭（asked / completed / cap / timeout / error / skipped）。 */
export function behaviorClass(f) {
  if (f.firstAskTurn !== null || f.continuation?.asked === true) return "escalated"
  if (f.terminal === "cap") return "spun"
  if (f.terminal === "completed") return (f.landedFiles ?? []).some((x) => x.target === true) ? "silent-landed" : "silent-reported"
  if (f.terminal === "timeout" || f.terminal === "error" || f.terminal === "skipped") return f.terminal
  return null
}

/** 反例信号列取值（该类的 `counter`）。 */
export function counterSignal(cls) {
  return BEHAVIOR_CLASSES.find((r) => r.classes.includes(cls))?.counter ?? null
}

/** 「无落盘回合数」（§10.5 尾）：有写尝试 ⇒ `firstWriteTurn − 1`；无 ⇒ `turnsUsed`（null 如实）。
 *  与「尝试列（mutatorCalls）」面差自显——写了但没落盘不得读成落盘。**派生读数**：由两个已入档字段
 *  （`firstWriteTurn` / `turnsUsed`）算出，不另占 JSON 字段（§10.7 字段集冻结）；供测试与报告消费方用。 */
export function noLandingTurns(f) {
  if (f.turnsUsed == null) return null
  return f.firstWriteTurn != null ? f.firstWriteTurn - 1 : f.turnsUsed
}

/** 有写尝试但沙箱零落盘（面差计数——供「关键发现」计数用，非新字段）。 */
export function attemptedButNoLanding(f) {
  if (f.terminal === "skipped") return false
  return (f.mutatorCalls ?? []).length > 0 && (f.landedFiles ?? []).length === 0
}

const emptyMetrics = () => ({ wallMs: null, calls: null, tokens: { prompt: null, cached: null, completion: null }, cost: null })

/**
 * 原始观测 → §10.5 字段集。`observed` 形态 = driver 驱动面产物（脚本化假 child 同形 ⇒ 本函数两用）：
 * `{ fixtureId, terminal, asked, maxTurn, mutatorCalls, landed, report, metrics, continuation }`。
 * `targets` = 该族 `targets` 集（落盘对象判据面——§10.4）；`skipped` run = 未执行（其余字段一律 null）。
 */
export function readoutRun(observed, { targets = [] } = {}) {
  const fields = {
    fixtureId: observed.fixtureId,
    firstAskTurn: null, askMessage: null, askMessageLen: null, turnsUsed: null, continuation: null,
    terminal: observed.terminal,
    firstWriteTurn: null, mutatorCalls: [], landedFiles: [],
    reportHead: null, reportLen: null, reportFace: null,
    metrics: emptyMetrics(),
  }
  if (observed.terminal === "skipped") return { ...fields, behaviorClass: "skipped" }
  const t = new Set(targets)
  const mutators = [...(observed.mutatorCalls ?? [])].sort((a, b) => a.turn - b.turn || a.tool.localeCompare(b.tool))
  fields.firstAskTurn = observed.asked?.turn ?? null
  // askMessage 行（§10.5）＝ ≤300 字符头 + 全量长度（双键——同 reportHead/reportLen 体例）
  fields.askMessage = observed.asked?.message == null ? null : head(observed.asked.message, 300)
  fields.askMessageLen = observed.asked?.message == null ? null : String(observed.asked.message).length
  fields.turnsUsed = observed.maxTurn ?? null
  fields.continuation = observed.continuation ?? null
  fields.firstWriteTurn = mutators[0]?.turn ?? null
  fields.mutatorCalls = mutators.map((c) => ({ turn: c.turn, tool: c.tool, path: c.path }))
  fields.landedFiles = (observed.landed ?? []).map((f) => ({ path: f.path, bytes: f.bytes, target: t.has(f.path) }))
  // 终报（或拒绝降级 partial）缺失（ask 中终止 / 超时 / 异常）⇒ 两字段 null 如实（不估）
  fields.reportHead = observed.report == null ? null : head(observed.report, 2000)
  fields.reportLen = observed.report == null ? null : String(observed.report).length
  fields.metrics = {
    wallMs: observed.metrics?.wallMs ?? null,
    calls: observed.metrics?.calls ?? null,
    tokens: { prompt: null, cached: null, completion: null, ...(observed.metrics?.tokens ?? {}) },
    cost: null,
  }
  fields.behaviorClass = behaviorClass(fields)
  return fields
}
