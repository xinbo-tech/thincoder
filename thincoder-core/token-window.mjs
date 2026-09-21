/**
 * token-window.mjs — token 计量 / 窗口 / 切割族（自 `context.mjs` **逐字迁出**）+ 上下文用量单源
 * （CONTEXT-COMPACTION.md §6.16.3 / §6.16.4 / §6.16.8 · context-tool 批 2026-09-21）。
 * 迁出三族（语义零改——原档越限在即，本批按 §6.16.8 拆出）：① 计量面（IMAGE_TOKEN_ESTIMATE + `estimateTokens`）；
 * ② 尾族（KEEP_HEAD 头注 + TAIL_BUDGET_FRACTION / SUMMARY_TOKEN_ESTIMATE / TAIL_FLOOR_MESSAGES + `keepTailSize` + `tailBudgetTokens`）；
 * ③ 切分与配对修复族（`splitHistory` + `repairedTailStart` + `tightenTailByBudget`）。
 * 新增族：`contextUsage`（与 `compressIfNeeded` 的 token 判定**同一函数**）· `historyPercent`（与两端状态行**同式**）·
 * `collectStaleToolOutputs`（陈旧工具输出合格集）+ 门槛常量 `PRUNE_MIN_TOKENS`（**与合格集同住本档** ⇒ 消费方单向取用、零回指）。
 * 依赖面 = `provider/rate.mjs`（`estimateText`）+ `config.mjs`（`providerSpec` / `resolveCompactThreshold`）——**零 import 环**。
 */
import { estimateText } from "./provider/rate.mjs"
import { providerSpec, resolveCompactThreshold } from "./config.mjs"

const IMAGE_TOKEN_ESTIMATE = 2000 // rough estimate for image content tokens (CLI legacy 256 underestimated real image costs, delaying compaction)

/** Rough token count for a list of messages (body + reasoning + tool_calls params) */
export function estimateTokens(messages) {
  let tokens = 0
  for (const m of messages) {
    if (typeof m.content === "string") tokens += estimateText(m.content)
    else if (Array.isArray(m.content)) {
      for (const part of m.content) {
        if (part.type === "text") tokens += estimateText(part.text)
        else if (part.type === "image_url") tokens += IMAGE_TOKEN_ESTIMATE
      }
    }
    if (typeof m.reasoning_content === "string") tokens += estimateText(m.reasoning_content)
    for (const tc of m.tool_calls ?? []) {
      tokens += estimateText(tc.function?.name ?? "") + estimateText(tc.function?.arguments ?? "")
    }
  }
  return tokens
}

const KEEP_HEAD = 0 // No dedicated head: earliest messages may be a COMPLETED earlier task in multi-task
// sessions — keeping them verbatim anchored attention on stale work. Everything before the tail is
// summarized (the summary itself distinguishes completed vs in-progress work; see SUMMARIZE_PROMPT).
// Tail count formula (D4): window-adaptive (~30 msgs per 100K — old fixed 10 too thin on 1M), capped
// at 40% of history; §6.4④ D-T1/D-T2 make the count only a CANDIDATE — a token budget (TAIL_BUDGET_FRACTION
// × window − SUMMARY_TOKEN_ESTIMATE ≈1K, §6.9) tightens it over pair-safe boundaries when compaction runs,
// never below TAIL_FLOOR_MESSAGES; ordinary sessions never reach it (D-T4: trigger 0.6 untouched).
const TAIL_BUDGET_FRACTION = 0.15
const SUMMARY_TOKEN_ESTIMATE = 1000 // §6.9: summary output target ~1K tokens — reserved from the 15%
const TAIL_FLOOR_MESSAGES = 10 // §6.4④ D-T2: the tail keeps ≥10 verbatim messages — floor beats budget
export function keepTailSize(provider, historyLen) {
  // provider is guaranteed at every call site (runAgent always builds one); providerSpec
  // degrades to DEFAULT_SPEC (128K) only if provider is somehow absent — acceptable
  // because the 40% history cap still bounds the tail. providers[].context override
  // (K units) is honored here (PROVIDER.md §6.15 T-C2: tail formula follows the window).
  const ctxWindow = providerSpec(provider).context
  return Math.min(Math.max(10, Math.floor((ctxWindow / 100_000) * 30)), Math.floor(historyLen * 0.4))
}
// §6.4④ D-T1 tail token budget: window×15% − summary ~1K — the compressed history segment (summary + placeholder + tail) lands ≈ 15% (B 口径 §6.4④).
export function tailBudgetTokens(provider) {
  return Math.max(0, Math.floor(providerSpec(provider).context * TAIL_BUDGET_FRACTION) - SUMMARY_TOKEN_ESTIMATE)
}

/**
 * Split history into head / middle (to be summarized) / tail; return null if no middle to compress.
 * head is normally empty (KEEP_HEAD = 0 — earliest messages go into the summary); the tool_calls-extension logic below is defensive for future KEEP_HEAD > 0.
 * The tail boundary must include any assistant whose tool results are in the tail — if the assistant is in the middle, the summary swallows it, leaving orphan tool results → protocol 400.
 * `budgetTokens` (optional, §6.4④ D-T1): when the candidate's estimate exceeds it, the boundary moves
 * forward until the tail fits — never below the D-T2 floor (10 msgs, or the candidate itself when
 * the 40% cap made it < 10 — short history).
 */
export function splitHistory(history, keepTail, budgetTokens = null) {
  if (history.length <= KEEP_HEAD + keepTail + 1) return null
  let headEnd = KEEP_HEAD
  // head must not end with dangling tool_calls: when assistant declares tool_calls, all its tool results must stay in head.
  // Parallel calls: one assistant followed by multiple tool messages — accepting only one still causes 400, must collect all
  if (history[headEnd - 1]?.role === "assistant" && history[headEnd - 1].tool_calls?.length) {
    while (headEnd < history.length && history[headEnd].role === "tool") headEnd++
  }
  const candidate = repairedTailStart(history, headEnd, history.length - keepTail)
  if (candidate <= headEnd) return null
  let tailStart = candidate
  // §6.4④ D-T1: tighten only above the floor — a candidate ≤ 10 IS the floor (short history under the 40% cap must not tighten further, review #5); the floor is D5-repaired too.
  if (budgetTokens > 0 && keepTail > TAIL_FLOOR_MESSAGES) {
    const floor = repairedTailStart(history, headEnd, history.length - TAIL_FLOOR_MESSAGES)
    if (floor > candidate) tailStart = tightenTailByBudget(history, candidate, floor, budgetTokens)
  }
  return { headEnd, tailStart }
}

/**
 * D5 tail-side pairing repair for a raw cut at history.length − tailCount: pull into the tail any
 * assistant whose tool results are in the tail (the summary swallowing the owner leaves orphan tool
 * results → protocol 400), then skip orphan tool messages at the new boundary. Single-assistant
 * assumption (nearest owner only — a tail spans at most one assistant→tools cycle); bounds-guarded.
 */
function repairedTailStart(history, headEnd, tailStart) {
  const tailToolIds = new Set()
  for (let i = tailStart; i < history.length; i++) {
    if (history[i].role === "tool") tailToolIds.add(history[i].tool_call_id)
  }
  for (let i = tailStart - 1; i > headEnd; i--) {
    const m = history[i]
    if (m.role === "assistant" && m.tool_calls?.some((tc) => tailToolIds.has(tc.id))) {
      tailStart = i
      break
    }
  }
  while (tailStart < history.length && tailStart > headEnd && history[tailStart].role === "tool") {
    tailStart++
  }
  return tailStart
}

/**
 * §6.4④ D-T1 budget tightening (pair-safe, review #2): walk the boundary FORWARD (fewer tail messages —
 * the rest joins the summary) while the tail's estimated tokens exceed the budget. Only pair-safe
 * positions may stop the walk: a boundary ON a tool message would orphan its owner assistant into the
 * middle (D5); pairing is contiguous in the machine line (§6.4③) — every non-tool boundary is safe.
 * No fit before the floor → keep the floor, accept the overrun.
 */
function tightenTailByBudget(history, start, floorStart, budgetTokens) {
  const suffixTokens = new Array(history.length + 1)
  suffixTokens[history.length] = 0
  for (let i = history.length - 1; i >= 0; i--) suffixTokens[i] = suffixTokens[i + 1] + estimateTokens([history[i]])
  if (suffixTokens[start] <= budgetTokens) return start // already fits — ordinary sessions stay untouched (D-T2)
  for (let p = start + 1; p <= floorStart; p++) { // first fit keeps the most recent verbatim context
    if (history[p].role !== "tool" && suffixTokens[p] <= budgetTokens) return p
  }
  return floorStart
}

/**
 * 上下文用量单源（§6.16.4「取自哪里」）——与 `compressIfNeeded` 的 token 判定**同一函数**：实测优先 =
 * `_lastPromptTokens + 增量(history.slice(_usageAtLen))`；无实测 = `estimateTokens(history) + system + tools`（固定开销面经 extras 随带）。
 * `threshold` = 该回合检查所用值（`agent._ctxBasis.threshold`——核 `agent.mjs` / VSC `checkAndCompact` 各一处暂存）；缺省回退 `resolveCompactThreshold`（退化面①）。
 * `window` = `providerSpec(agent.provider).context`。
 * @returns {{basis:"measured"|"estimated", total, history, system, tools, overhead, threshold, window}}
 */
export function contextUsage(agent, extras = {}) {
  const history = Array.isArray(agent?.history) ? agent.history : []
  const system = extras.systemPrompt ? estimateText(extras.systemPrompt) : 0
  const tools = extras.tools ? estimateText(JSON.stringify(extras.tools)) : 0
  const overhead = system + tools
  const historyTokens = estimateTokens(history)
  const measured = agent?._lastPromptTokens != null
  return {
    basis: measured ? "measured" : "estimated",
    total: measured
      ? agent._lastPromptTokens + estimateTokens(history.slice(agent._usageAtLen ?? history.length))
      : historyTokens + overhead,
    history: historyTokens,
    system,
    tools,
    overhead,
    threshold: agent?._ctxBasis?.threshold
      ?? resolveCompactThreshold(agent?.config?.agent?.compactThreshold, agent?.provider).value,
    window: providerSpec(agent?.provider).context,
  }
}

/**
 * 状态行百分比（§6.16.4「与状态行 ctx% 的单源关系」）——与 CLI 状态行（`render-frame.mjs` 式）与 VSC `ctxPercentForHistory` **同式**；
 * stats 报出的就是用户看到的那个百分比（不新增第三口径）；空历史 ⇒ 0（状态行的 `ctxPct > 0` 显示门在端侧）。
 */
export function historyPercent(history, provider) {
  return Math.round((estimateTokens(history ?? []) / providerSpec(provider).context) * 100)
}

/** 陈旧工具输出门槛（§6.16.3 判据③）：低于门槛的替换是净增 token（stub 本身有长度）——常量与合格集同住本档。 */
export const PRUNE_MIN_TOKENS = 200

/**
 * 陈旧工具输出合格集（§6.16.3——三条件合取，单源实现）：① `role === "tool"`；② **保护尾之外**（复用 `splitHistory` 的同一 `tailStart`——不新增第二处切割判据）；③ 估算 ≥ `PRUNE_MIN_TOKENS`。
 * 返回逐条计数面（prune 回执 + stats 两处消费）：`indexes` 合格索引（升序）· `tokens` 合格集估算和 · `candidates` 全史 tool 结果数 · `tailKept` 保护尾内保留数 · `belowMin` 门槛下跳过数 · `tailCount` 保护尾消息数。
 * **短历史（无中段）⇒ 合格集为空**（no-op——§6.16.3 边界）。
 */
export function collectStaleToolOutputs(history, provider) {
  const h = Array.isArray(history) ? history : []
  const split = splitHistory(h, keepTailSize(provider, h.length), tailBudgetTokens(provider))
  // 无中段（短历史）⇒ 可摘要面为空 ⇒ **全史即保护尾**（tailStart = 0——合格集必为空，同压缩面 no-op）
  const tailStart = split ? split.tailStart : 0
  const r = { indexes: [], tokens: 0, candidates: 0, tailKept: 0, belowMin: 0, tailCount: h.length - tailStart }
  for (let i = 0; i < h.length; i++) {
    if (h[i]?.role !== "tool") continue
    r.candidates++
    if (i >= tailStart) { r.tailKept++; continue }
    const est = estimateTokens([h[i]])
    if (est < PRUNE_MIN_TOKENS) { r.belowMin++; continue }
    r.indexes.push(i)
    r.tokens += est
  }
  return r
}
