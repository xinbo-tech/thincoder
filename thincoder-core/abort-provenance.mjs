/**
 * abort-provenance.mjs — abort 来源标注词汇表（单一权威源——AGENT-LOOP-SUBAGENT.md §6.12）
 *
 * 子代理 / 评审 / 会诊死亡的可诊断性：产生点标注结构化来源（`err.abortInfo`）→
 * controller 链 hop 逐跳保 reason（AGENT-LOOP-SUBAGENT.md §6.12 形态④ #10）→ 结算 / 报告面用 `deathLine`
 * 合成死亡行（原 message 前缀逐字保留 + 来源后缀）。
 *
 * 纯函数、零 import——任意层可引、无环（provider / proxy / agent / settle 族共用）。
 * 词汇表：
 * - trigger（5 值）：`user`（reason.interrupt）· `timeout`（TimeoutError / 定时器面）·
 *   `cancel`（定向中止）· `stop`（整批 / 会话 / 回合级停）· `unknown`（残留 / 未标注——告警态）。
 * - layer（3 值）：`provider` / `agent` / `settle`；未标注错误回落 `unrecorded`（合成器 token）。
 */

/** trigger 枚举权威（测试锁计数 5——AGENT-LOOP-SUBAGENT.md §6.12 trigger 表）。 */
export const TRIGGERS = ["user", "timeout", "cancel", "stop", "unknown"]

/**
 * trigger 判定（判据序 = §20.3 第 1 条表；signal.reason 四形态：
 * ① `{interrupt:true(,message)}`（既有 user 面）② `TimeoutError`（原生——timeout 面）
 * ③ `{abortTrigger:"cancel"|"stop"|"timeout"(,abortDetail)}`（新增——程序性中止）
 * ④ 缺失 / 无已知键（→ unknown——诊断告警态，不得静默）。
 */
export function triggerOf(signal) {
  const reason = signal?.reason
  if (reason == null) return "unknown"
  if (reason.interrupt === true) return "user"
  if (reason.name === "TimeoutError" || reason.abortTrigger === "timeout") return "timeout"
  if (reason.abortTrigger === "cancel") return "cancel"
  if (reason.abortTrigger === "stop") return "stop"
  return "unknown"
}

/**
 * 产生点错误（abort 面）：AbortError + `reason` 透传 + `abortInfo` 标注。
 * message 取既有通用文案（既有前缀断言零回归——死亡行前缀逐字保留）。
 */
export function abortError(signal, layer, detail) {
  const e = new DOMException("The operation was aborted", "AbortError")
  e.reason = signal?.reason
  e.abortInfo = { trigger: triggerOf(signal), layer, detail }
  return e
}

/**
 * 产生点错误（定时器面）：自有 message + `abortInfo{trigger:"timeout"}`。
 * name 保持 "Error"（既有分类谓词——`AbortError` 分支——零变化）。
 */
export function timeoutError(message, layer, detail) {
  const e = new Error(message)
  e.abortInfo = { trigger: "timeout", layer, detail }
  return e
}

/**
 * 外部错误补标（undici / fetch 拒否等）：缺 `abortInfo` 才补（不覆盖产生点标注）；
 * 不改 `name` / `message`（消费面零回归）。
 * 第 4 参 detail 为站点名（站点表逐站点传——自由短串）。
 */
export function annotateAbort(err, signal, layer, detail) {
  if (err?.abortInfo) return err
  try {
    err.abortInfo = { trigger: triggerOf(signal), layer, detail: detail ?? "unrecorded" }
  } catch { /* frozen error——保持未标注（合成器 unknown 告警兜底） */ }
  return err
}

/** 死亡行长度上限（AGENT-LOOP-SUBAGENT.md §6.12 死亡行形态——超长优先截 detail）。 */
const MAX_LEN = 300
/** unknown 形态 detail token（AGENT-LOOP-SUBAGENT.md §6.12 逐字）。 */
const NO_REASON = "no reason on signal"
/** 未标注回落 token（layer / detail 两面兜底）。 */
const UNRECORDED = "unrecorded"

/** 信号域 detail 回落（AGENT-LOOP-SUBAGENT.md §6.12 形态③——`abortDetail` 载站点名；错误未标注时仍可辨发起动作）。 */
const detailOf = (signal) => (typeof signal?.reason?.abortDetail === "string" ? signal.reason.abortDetail : null)

/** 求值链（§20.3 第 1 条：err.abortInfo → triggerOf(signal) → err.name 兜底）。 */
function resolveAbort(err, signal) {
  const info = err?.abortInfo
  if (info?.trigger) return { trigger: info.trigger, layer: info.layer ?? UNRECORDED, detail: info.detail || null }
  const fromSignal = triggerOf(signal)
  if (fromSignal !== "unknown") return { trigger: fromSignal, layer: UNRECORDED, detail: detailOf(signal) }
  if (err?.name === "TimeoutError") return { trigger: "timeout", layer: UNRECORDED, detail: detailOf(signal) }
  // AbortError / 无名——告警态（unknown 显式，空后缀即违规）
  return { trigger: "unknown", layer: UNRECORDED, detail: NO_REASON }
}

/** detail 裁剪：优先截 detail（budget = 上限内剩余字符）。 */
function clipDetail(detail, budget) {
  if (budget <= 0) return ""
  return detail.length <= budget ? detail : detail.slice(0, Math.max(1, budget - 1)) + "…"
}

/**
 * 死亡行合成器（§20.3 第 3 条——报告面单点）：
 * `<原 message>[ ← cause: <cause.message>][ · abort(<trigger>@<layer>:<detail>)]`
 * - 原 message 前缀逐字保留（既有前缀 / 包含断言零回归）；
 * - 后缀出现条件 = `err.abortInfo` 存在 ∨ `signal?.aborted` ∨ `err.name ∈ {AbortError, TimeoutError}`；
 * - cause 段（P1）独立于后缀（"fetch failed" 类网络死亡真因同判）；
 * - 总长 ≤300 字符（超长先截 detail，仍超再截尾）。
 */
export function deathLine(err, signal) {
  let line = err?.message ?? String(err ?? "")
  if (err?.cause?.message) line += ` ← cause: ${err.cause.message}`
  const abortish = Boolean(err?.abortInfo) || Boolean(signal?.aborted) ||
    err?.name === "AbortError" || err?.name === "TimeoutError"
  if (abortish) {
    const { trigger, layer, detail } = resolveAbort(err, signal)
    const head = `${line} · abort(${trigger}@${layer}:`
    // unknown 形态逐字用告警 token（§20.3 第 3 条——站点 detail 不进告警行）；非串 detail 归一化
    const text = trigger === "unknown" ? NO_REASON : (detail == null ? UNRECORDED : String(detail))
    line = `${head}${clipDetail(text, MAX_LEN - head.length - 1)})`
  }
  return line.length > MAX_LEN ? line.slice(0, MAX_LEN - 1) + "…" : line
}
