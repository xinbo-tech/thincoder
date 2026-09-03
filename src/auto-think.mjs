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

  const prompt = buildClassifierInput(agent.history)
  if (prompt == null) return null

  // Classification call: use same provider, minimal tokens, no tools, no streaming
  let level
  try {
    const classifierProvider = { ...agent.provider, maxTokens: 10 }
    const response = await chat(classifierProvider, {
      messages: [
        { role: "system", content: CLASSIFY_PROMPT },
        { role: "user", content: prompt },
      ],
      tools: [],
      signal: AbortSignal.timeout(5_000),
      logCtx: { stage: "autothink", turn, child: agent._logId },
    })
    const word = (response.content ?? "").trim().toLowerCase()
    if (word.startsWith("low")) level = "low"
    else if (word.startsWith("medium") || word.startsWith("med")) level = "medium"
    else if (word.startsWith("high")) level = "high"
    else return null // Unparseable
  } catch {
    return null // Classification failure → fall back to current setting
  }

  // Map difficulty to the closest valid reasoning effort
  const candidates = EFFORT_MAP[level] || EFFORT_MAP.medium
  const matched = candidates.find(e => validEfforts.includes(e))
  if (!matched) return null

  agent.provider.reasoningEffort = matched
  return matched
}
