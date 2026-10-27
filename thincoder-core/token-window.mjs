/**
 * token-window.mjs — token 计量 / 窗口 / 切割族（自 `context.mjs` **逐字迁出**）+ 上下文用量单源
 * （CONTEXT-COMPACTION.md §6.16.3 / §6.16.4 / §6.16.8 · context-tool 批 2026-09-21）。
 * 迁出三族（语义零改——原档越限在即，本批按 §6.16.8 拆出）：① 计量面（IMAGE_TOKEN_ESTIMATE + `estimateTokens`）；
 * ② 尾族（KEEP_HEAD 头注 + TAIL_BUDGET_FRACTION / SUMMARY_TOKEN_ESTIMATE / TAIL_FLOOR_MESSAGES + `keepTailSize` + `tailBudgetTokens`）；
 * ③ 切分与配对修复族（`splitHistory` + `repairedTailStart` + `tightenTailByBudget`）。
 * 新增族：`contextUsage`（与 `compressIfNeeded` 的 token 判定**同一函数**）· `historyReading` / `historyPercent`（状态行
 * 百分比——与 CLI ∥ VSC **同源**：一个实现点，端侧零自算式，消费面全是本档的投影）·
 * `collectStaleToolOutputs`（陈旧工具输出合格集）+ 门槛常量 `PRUNE_MIN_TOKENS`（**与合格集同住本档** ⇒ 消费方单向取用、零回指）。
 * 依赖面 = `provider/rate.mjs`（`estimateText` / `ESTIMATOR_VERSION`）+ `config.mjs`（`providerSpec` / `resolveCompactThreshold`）——**零 import 环**。
 */
import { estimateText, ESTIMATOR_VERSION } from "./provider/rate.mjs"
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
// never below TAIL_FLOOR_MESSAGES; ordinary sessions never reach it (D-T4: the trigger ratio lives in `config.mjs` — untouched here).
const TAIL_BUDGET_FRACTION = 0.15
export const SUMMARY_TOKEN_ESTIMATE = 1000 // §6.9: summary output target ~1K tokens — reserved from the 15%；§6.17 可达性门的 `note` 项同取本常量
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
  // §6.3 / §6.17 估算自校准：估算值乘 `_tokRatio`；`_lastPromptTokens` 是服务端真值，不乘。
  const ratio = tokenRatioOf(agent) // 取比单源（同下 `historyReading` 的第三参来源）
  return {
    basis: measured ? "measured" : "estimated",
    total: measured
      ? agent._lastPromptTokens + Math.round(estimateTokens(history.slice(agent._usageAtLen ?? history.length)) * ratio)
      : Math.round((historyTokens + overhead) * ratio),
    history: historyTokens,
    system,
    tools,
    overhead,
    threshold: agent?._ctxBasis?.threshold
      ?? resolveCompactThreshold(agent?.config?.agent?.compactThreshold, agent?.provider).value,
    window: providerSpec(agent?.provider).context,
  }
}

/** 估算样本键（§6.17.1 链二校验③单源）：`format:model`——采样面与恢复面同一判据（切模型自清）。 */
export function tokenKey(provider) {
  return `${provider?.format ?? "openai"}:${provider?.model ?? ""}`
}

/**
 * 估算自校准采样（§6.17「估算自校准」）——池化比：`num += usage.prompt_tokens`、`den += estPrompt`
 * （分子分母同取输入侧口径；`estPrompt` 由发送面随 result 带回，与净判同一个值）。
 * `tokenKey()` 变 ⇒ 归零重采（切模型自清，不接四个刷新点）；`_tok` / `_tokRatio` 的**采样侧**只由本函数写
 * （恢复侧 = `restoreTokenSample`，清空 = `/new`——`session-lifecycle.mjs`）；run 装配**不复位**
 * （池化比要跨消息累计，见 `agent/setup.mjs`）。
 * 无样本 ⇒ 比 = 1（估算维持原口径）。作用面 = `contextUsage` 两支承（§6.3）；实测基线 `_lastPromptTokens` 不乘。
 * 落槽形见 §6.17.1 链二：`est` = 估算口径版本位，跨进程恢复时与本值不符的样本不复用。
 */
export function recordTokenSample(agent, provider, estPrompt, usage) {
  const prompt = Number(usage?.prompt_tokens)
  if (!agent || !(prompt > 0) || !(estPrompt > 0)) return
  const key = tokenKey(provider)
  if (agent._tok?.key !== key) agent._tok = { key, num: 0, den: 0, est: ESTIMATOR_VERSION }
  agent._tok.num += prompt
  agent._tok.den += estPrompt
  // 下界 = 1：已知偏差方向是估算偏低；比 < 1 会把全部估算支缩小、重开「该压没压」原始故障，
  // 保守方向不取（仅一侧校准，零新魔数）。
  agent._tokRatio = Math.max(1, agent._tok.num / agent._tok.den)
}

/**
 * 样本写出面（§6.17.1 链二写面）：会话槽 `estimateSample` 的值——`agent._tok` 为空 ⇒ `null`
 * （落 null，不造空对象）；`est` 缺省补当前口径版本（老进程内的样本对象无该位）。
 */
export function tokenSampleOf(agent) {
  const tok = agent?._tok
  if (!tok || typeof tok.key !== "string") return null
  return { key: tok.key, num: tok.num, den: tok.den, est: tok.est ?? ESTIMATOR_VERSION }
}

/**
 * 样本读回面（§6.17.1 链二）：槽里是盘上用户数据 ⇒ 判定走 `validSample`（同一份校验，不在此复述），
 * 不过则回到未校准档（`_tok = null` / `_tokRatio = 1`，不抛——坏样本不得拦住会话恢复）。
 * 返回是否复用了样本。
 */
export function restoreTokenSample(agent, sample, provider) {
  const ok = validSample(sample, provider)
  agent._tok = ok
  agent._tokRatio = ok ? Math.max(1, ok.num / ok.den) : 1
  return ok !== null
}

/**
 * 样本判定（§6.17.1 链二四条校验——**唯一实现面**）：形状与数值域（`num` / `den` / `est` 有限、`den > 0`）·
 * 口径版本（`est === ESTIMATOR_VERSION`——口径变了，旧样本的 `den` 与新估算不同量纲）· 键匹配
 * （`key === tokenKey(provider)`——恢复后模型已换 ⇒ 不复用）。全过 ⇒ `{ key, num, den, est }`；任一不过 ⇒ `null`
 * （回到未校准档，不抛——坏样本不得拦住会话恢复 / 读数）。恢复面 `restoreTokenSample` 与读数面 `sampleRatio`
 * 同取本函数：同一判定，不写第二份。④ 比 < 1 不必单独判——由 `max(1, …)` 兜底。
 */
function validSample(sample, provider) {
  if (!sample || typeof sample !== "object" || Array.isArray(sample)) return null
  const { key, num, den, est } = sample
  if (typeof key !== "string" || !Number.isFinite(num) || !Number.isFinite(den) || !Number.isFinite(est) || !(den > 0)) return null
  if (est !== ESTIMATOR_VERSION) return null
  if (key !== tokenKey(provider)) return null
  return { key, num, den, est }
}

/**
 * 核读数（§6.16.4「与状态行 ctx% 的单源关系」）——这个量**只有本函数一个实现点**，五处消费面全是它的投影：
 * stats 第 6 行 · 打开态读数 · 桌面 `ev:usage` · VSC `specs.mjs` · CLI 状态行（经 `ctxCacheOf` 缓存）。
 * 一点出两值：`tokens` = 校准后的历史估算 `round(estimateTokens(history) × ratio)`、`pct` = 它 ÷ 窗口、
 * `window` = `providerSpec(provider).context`——同屏「context X% Yk」必须同尺，两值各自算一次就是两把尺；
 * `window` 随读带出，消费面不再二次派生同一个量。
 * `ratio` **无缺省**：忘传 ⇒ `estimateTokens × undefined` = `NaN` ⇒ `tokens` / `pct` 皆 `NaN`。三面显示门
 * 都把非正值读作「不显示」（CLI `ctxPct > 0` · VSC 分子为假回 `null` · 桌面 `usageFrameWanted` 不发帧）
 * ⇒ 读数**缺席**（不会是错数）；给缺省 1 则相反——忘传处静默显示未校准读数，看着完全正常而差一整个校准比。
 * 两种形状里只有后者会被当作事实读走，所以宁可缺席。
 * 空历史 ⇒ 0（状态行的 `ctxPct > 0` 显示门在端侧，不入本函数面）。
 */
export function historyReading(history, provider, ratio) {
  const window = providerSpec(provider).context
  const tokens = Math.round(estimateTokens(history ?? []) * ratio)
  return { tokens, pct: Math.round((tokens / window) * 100), window }
}

/** 状态行百分比薄转口（名面与 export 不变）：`historyReading` 的 `pct`——与 stats ∥ CLI ∥ VSC **同源**
 * （各处全是这一实现点的投影，端侧零自算式）。第三参 `ratio` 同 `historyReading`：无缺省。 */
export function historyPercent(history, provider, ratio) {
  return historyReading(history, provider, ratio).pct
}

/** 估算校准比（§6.17）——`agent._tokRatio` 的**唯一**读出点（中性值 1 的唯一出处）：
 * 无样本 ⇒ 1。合法的 1 只有两种：新会话无样本（`_tok` 为 `null`）· 打开态槽无 `estimateSample`；
 * agent 不在场（`undefined` / `null`）也回 1，该档 = 未校准读数，由消费面显式断言，不靠默认值蒙过。 */
export function tokenRatioOf(agent) {
  return agent?._tokRatio ?? 1
}

/** 槽样本 ⇒ 校准比（§6.17.1 链二读数面）：判定与 `restoreTokenSample`（恢复面）同一份 `validSample`，
 * 好样本 ⇒ `max(1, num / den)`，坏样本 ⇒ `1`（下界 1 与 `recordTokenSample` 同——偏差方向已知是估算偏低）。 */
export function sampleRatio(sample, provider) {
  const s = validSample(sample, provider)
  return s ? Math.max(1, s.num / s.den) : 1
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
