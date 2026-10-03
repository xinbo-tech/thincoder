/**
 * auto-think.mjs — automatic difficulty classification for reasoning effort.
 *
 * When enabled, before each user-facing turn a cheap classification call determines
 * the task difficulty, then maps it to the model's reasoning effort. This replaces
 * manual /think toggling with per-prompt automatic selection.
 *
 * Config:
 *   { agent: { autoThink: true } }
 *
 * Mechanism:
 *   1. Take the last user message from history
 *   2. Send a minimal classification prompt (expects one-word reply)
 *   3. Map difficulty → reasoningEffort using the model's valid effort enum
 *   4. Set agent.provider.reasoningEffort before the real chat() call
 */
import { chat } from "./provider/core.mjs"
import { specForModel } from "./config.mjs"
// #860（AGENT-LOOP.md §6.1 ∥ §7 D-AL26）：off 形族的单一实现源（写面取形 + 有效 off 路径判据）
import { thinkOffPath, thinkOffShape } from "./think-off.mjs"

const CLASSIFY_PROMPT = `Classify this coding task's difficulty: low, medium, or high.

- low — trivial: rename, typo, formatting, one-liner, direct question
- medium — localized: small feature, straightforward bug fix, moderate change
- high — complex: multi-file, debugging, design decisions, large refactor

Reply with exactly one word.`

const EFFORT_MAP = {
  low: ["low", "minimal", "none", "low"],
  medium: ["high", "medium", "high"],
  high: ["max", "max", "xhigh", "max"],
}

/** #860（D-AL26）：不可关思考的跳过警示 ∕ 分类失败——进程级一次性（按 model ∕ 错误签名去重，防逐轮刷屏）。 */
const warnedThinkGuard = new Set()
const warnedClassifyFailure = new Set()

/**
 * Build classifier input from history: the latest real user message (reminders and
 * interrupt injections excluded), plus the previous user message as context when the
 * latest is too short to classify on its own (e.g. "继续" / "还有几个问题").
 * Exported for tests.
 */
export function buildClassifierInput(history) {
  const isRealUser = (m) =>
    m.role === "user" && typeof m.content === "string"
    && !m.content.startsWith("[System reminder:") && !m.content.startsWith("[User interrupt:")
  const users = history.filter(isRealUser)
  const last = users.at(-1)
  if (!last) return null
  let prompt = last.content
  if (prompt.length < 200 && users.length > 1) {
    prompt = `Previous request (context):\n${users.at(-2).content.slice(0, 1200)}\n\nLatest message:\n${prompt}`
  }
  return prompt.slice(0, 2000)
}

/**
 * Classify the difficulty of the user's prompt and adjust reasoning effort.
 * Only runs on the first turn (turn === 0) of a user message.
 * Returns the resolved level or null if auto-thinking is disabled or classification fails.
 * @param {object} agent
 * @param {number} turn
 * @returns {Promise<string|null>}
 */
export async function classifyAndApply(agent, turn) {
  if (!agent.config?.agent?.autoThink) return null
  if (turn !== 0) return null // Only classify on the first turn of user input

  const spec = specForModel(agent.provider.model)
  const validEfforts = spec.reasoningEffortEnum
  if (!validEfforts) return null // Model doesn't support reasoning effort

  // #860 守卫（D-AL26）：无法关思考的模型（thinkAlwaysOn ∕ 枚举无 none）⇒ 分类调用必然失败
  //（思考吃光小预算 ∕ 400）——不调用；一次可见警示（按 model 去重），语义回退 null。
  if (!thinkOffPath(spec)) {
    if (!warnedThinkGuard.has(agent.provider.model)) {
      warnedThinkGuard.add(agent.provider.model)
      console.warn(`[auto-think] model "${agent.provider.model}" cannot disable thinking — difficulty classification skipped (reasoning effort unchanged)`)
    }
    return null
  }

  const prompt = buildClassifierInput(agent.history)
  if (prompt == null) return null

  // Classification call: use same provider, minimal tokens, no tools, no streaming
  let level
  try {
    // #860：关思考形（族别 off 形）+ 小预算 32（原 10 token 被思考吃光）+ reasoningEffort 清空
    //（防父档外溢；effort 族 off 形由载荷门补发 reasoning_effort:"none"）。
    const classifierProvider = { ...agent.provider, maxTokens: 32, thinking: thinkOffShape(spec), reasoningEffort: null }
    const response = await chat(classifierProvider, {
      messages: [
        { role: "system", content: CLASSIFY_PROMPT },
        { role: "user", content: prompt },
      ],
      tools: [],
      signal: AbortSignal.timeout(5_000),
      // D-TS12 (TRACES.md §6.1): full logCtx field set at the chat call
      // point — traces/session/cwd/role/depth/kind (this call point carried
      // only {stage,turn,child}). The traces field closes the D-TR6 "off = no
      // persist" switch: without it the tracer treated the auto-think call as
      // enabled and persisted even when agent.config.traces.enabled was false.
      logCtx: {
        stage: "autothink", turn, child: agent._logId,
        traces: agent.config?.traces?.enabled !== false,
        session: agent._sessionStart ?? null,
        cwd: agent.cwd,
        role: agent._role ?? null,
        depth: agent._depth ?? 0, // agent state carries no depth stamp (the call site passes none) — 0 for the top-level agent
        kind: "autothink",
      },
    })
    const word = (response.content ?? "").trim().toLowerCase()
    if (word.startsWith("low")) level = "low"
    else if (word.startsWith("medium") || word.startsWith("med")) level = "medium"
    else if (word.startsWith("high")) level = "high"
    else return null // Unparseable
  } catch (e) {
    // #860（D-AL26）：失败一次可见（按错误签名进程级去重——不再静默）；回退 null 语义不变。
    const sig = e?.message ?? String(e)
    if (!warnedClassifyFailure.has(sig)) {
      warnedClassifyFailure.add(sig)
      console.warn(`[auto-think] classification failed: ${sig}`)
    }
    return null // Classification failure → fall back to current setting
  }

  // Map difficulty to the closest valid reasoning effort
  const candidates = EFFORT_MAP[level] || EFFORT_MAP.medium
  const matched = candidates.find(e => validEfforts.includes(e))
  if (!matched) return null

  agent.provider.reasoningEffort = matched
  return matched
}
