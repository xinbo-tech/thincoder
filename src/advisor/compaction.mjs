/**
 * advisor/compaction.mjs — advisor 上下文限额 / 压缩定锚 / 未完成判定族 / 结构化尾
 * （2026-09-11 第 12 批拆分：run.mjs 468 行，本批新增守卫必越 500 硬帽——拆线 =
 * ./loop.mjs（工具循环 + 墙/提示接线）+ 本档（限额 / 压缩+定锚 / 谓词族 / 文案 /
 * 结构化尾）——镜像 CLI 同名拆线，本端原文自持：语义锚由本端测试守，不做 byte-identical）。
 *
 * 尾族单源：尾的**生成**（结构化超时尾 / 预算提示）与尾的**判定**（谓词族）与压缩
 * 装配同档——字面漂移面收在一处（生成 ⟷ 判定 ⟷ 装配）。
 */

// ─── 限额 ─────────────────────────────────────────────────────────────────────

export const MAX_ADVISOR_TURNS = 100
// NOTE: prompts/advisor-round{1,2,3}.md encourage the model to finish within
// ~30 tool turns — a prompt-level efficiency target, DISTINCT from the
// 100-turn mechanical hard cap (MAX_ADVISOR_TURNS above; pure runaway-loop
// guard). They serve different purposes; do NOT synchronize them.
export const MAX_CONTEXT_TOKENS = 120_000 // Reserve headroom to avoid OOM
export const TOOL_TIMEOUT_MS = 30_000 // single tool timeout
export const REVIEW_TIMEOUT_MS = 600_000 // whole review timeout (10 minutes; agent.advisor.timeoutMs overrides)
export const MAX_RESULT_CHARS = 64 * 1024 // tool result truncation (line-aware; 64K, aligned with main offload limit)
const MAX_KEY_FILES_IN_COMPACTION = 5 // files named in the compaction summary

// ─── 压缩（+ 定锚重挂）────────────────────────────────────────────────────────

/** Estimate token count from messages (rough: 1 token ≈ 4 chars) */
export function estimateTokens(messages) {
  return messages.reduce((sum, msg) => {
    const content = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content || "")
    const toolCalls = msg.tool_calls ? JSON.stringify(msg.tool_calls) : ""
    return sum + Math.ceil((content.length + toolCalls.length) / 4)
  }, 0)
}

/** Compact early messages when context grows too large — LOCAL trimming only
 *  (no LLM summarization). MUTATES in place (splice) so the caller's array
 *  reference stays valid — a reassignment would leave the caller's logging
 *  (tool-call count, token estimate) reading a stale array.
 *
 *  F20（第 12 批 §13.4 契约三）：压缩丢掉的正是**首条 user 消息**（评审简报，含
 *  Approval Signal）——pinned 由**评审参数**构建（非模型输出），在本次压缩动作内作为
 *  一条 user 消息重挂（幂等可读：重复压缩允许重复挂回，不做存在性判定）。 */
export function compactMessages(messages, pinned = null) {
  // Keep: system prompt, last 20 messages (≈ 10 assistant+tool exchanges),
  // user message — the rest is summarized.
  if (messages.length <= 20) return

  const system = messages[0]
  const recent = messages.slice(-20)
  const old = messages.slice(1, -20)

  // Count actual tool messages (old.length counts user/assistant rows too)
  const toolCount = old.filter((m) => m.role === "tool").length
  const keyFiles = old
    .filter((m) => m.role === "tool")
    .map((m) => m.content?.split("\n")[0]?.slice(0, 50)) // first line of tool results typically names the file that was read/grepped
    .filter(Boolean)
    .slice(0, MAX_KEY_FILES_IN_COMPACTION)
  const filesPart = keyFiles.length > 0 ? ` Key files examined: ${keyFiles.join(", ")}` : ""
  const summary = `Earlier exploration: ${toolCount} tool calls completed.${filesPart}`

  const pin = pinned ? [{ role: "user", content: pinned }] : []
  messages.splice(0, messages.length,
    system,
    { role: "user", content: `[Context compacted] ${summary}` },
    ...pin,
    ...recent)
}

// The live "[thinking…]" wait indicator shares its exact text with the TUI
// cleanup regex (agent-turn.mjs strips it before flushing to history) — keep
// them in lockstep.
export const ADVISOR_THINKING_PLACEHOLDER = "\n[thinking…]\n"

/**
 * Render the ordered review timeline — thinking / tool progress / final text
 * interleaved EXACTLY as emitted, so the persisted record shows the review
 * process at its real positions. A summary appended at the end would lose the
 * order (the user-visible "no tool calls in the advisor record" gap). The
 * live "[thinking…]" placeholder is stripped (wait indicator, not content).
 */
export function renderTimeline(timeline, tail = "") {
  const body = timeline
    .map((b) => b.text.replaceAll(ADVISOR_THINKING_PLACEHOLDER, "").trim())
    .filter(Boolean)
    .join("\n\n")
  return [body, tail].filter(Boolean).join("\n\n")
}

// ─────────────────────────────────────────────────────────────────────────────
// 不完整判定族（F18 / F23 共用单谓词——§13.4 契约四；六 kind = 宿主尾族）
// ─────────────────────────────────────────────────────────────────────────────

/** 宿主尾族六 kind 的块首行逐字前缀（§13.4 契约四表）。变量段（token 数 / 秒数 /
 *  工具轮数）不入前缀——取各尾的固定字面部分；`empty` 保留**本端**括号字面；
 *  `review_failed` = run.mjs catch 的字符串 resolve 形态（不 throw），其余五条 =
 *  loop.mjs 的尾。 */
const ADVISOR_INCOMPLETE_PREFIXES = [
  ["context_limit", "Advisor: context window limit"],
  ["turn_cap", "Advisor: stopped after"],
  ["timeout", "Advisor: review timeout"],
  ["empty", "Advisor: (empty response"],
  ["interrupted", "Advisor: interrupted."],
  ["review_failed", "Advisor: review failed"],
]

/** 单谓词（三消费点同源：design sync / design async 结算 / code 完成守卫）——
 *  **块首行扫描**（按空行分块，逐块取首个非空行 trim 后测前缀；时间线与尾以空行相接，
 *  六条尾均以块首行形态落地）。负向精度：引文中同串的**非块首形态**（围栏内行 / 表格行
 *  / 引用行）不判 incomplete（残余方向 fail-closed——多付一轮重跑，如实登记）。
 *  @returns {string|null} kind 或 null */
export function advisorIncompleteMarker(text) {
  for (const block of String(text ?? "").split(/\n\s*\n/)) {
    const first = block.split("\n").find((l) => l.trim() !== "")
    if (!first) continue
    const line = first.trim()
    for (const [kind, prefix] of ADVISOR_INCOMPLETE_PREFIXES) {
      if (line.startsWith(prefix)) return kind
    }
  }
  return null
}

/** 未签发提示（逐字——F18；sync 结算与 async 结算共用单源）：发生了什么（未完成 +
 *  原因 kind）+ 下一步（缩范围重跑 / 调预算）+ 补充检查口径。 */
export function incompleteNotice(kind) {
  return [
    `评审未完成——token 未签发 (review incomplete — no design token issued; reason: ${kind})`,
    "以更小范围重跑设计评审（逐档 / 逐节拆分，或拆到两次评审），或调大 agent.advisor.timeoutMs 后重试；补充检查未完成的部分不得按已核处理。",
  ].join("\n")
}

// ─────────────────────────────────────────────────────────────────────────────
// 预算提示 + 结构化超时尾（F22——§13.4 契约五）
// ─────────────────────────────────────────────────────────────────────────────

/** 0.75 一次性预算提示判定（纯函数——阈值两侧可机测；每场评审至多一次）。 */
export function shouldBudgetNudge(elapsedMs, budgetMs, nudged) {
  return !nudged && Number.isFinite(budgetMs) && budgetMs > 0 && elapsedMs >= budgetMs * 0.75
}

/** 预算提示文案（逐字同文——由循环注入一条 user 消息）。 */
export function budgetNudgeText(elapsedMs, budgetMs) {
  const secs = (ms) => Math.round(ms / 100) / 10
  const pct = Math.round((elapsedMs / budgetMs) * 100)
  return `⏳ review budget: ~${pct}% consumed (${secs(elapsedMs)}s of ${secs(budgetMs)}s). Converge now: emit your findings table for the evidence you have verified, mark anything you could not verify explicitly as \`unverified\` (unverified evidence must not support a pass), and emit your verdict line.`
}

/** 结构化超时尾（§13.4 契约五）：族前缀 `Advisor: review timeout after {S}s.` 逐字保持
 *  （判定族字面依赖）；其后 = 机读统计行三要素（rounds / tool calls / review text
 *  produced）+ budget 预算指引行（D3 口径：「三要素」= 统计行，budget 独立行）。 */
export function timeoutTail(timeoutMs, rounds, toolCalls, producedText) {
  const s = Math.round(timeoutMs / 1000)
  return [
    `Advisor: review timeout after ${s}s. Review incomplete — the wall-clock budget was exhausted; partial findings (if any) are above.`,
    `- rounds: ${rounds} · tool calls: ${toolCalls} · review text produced: ${producedText ? "yes" : "no"}`,
    `- budget: ${s}s (agent.advisor.timeoutMs) — re-run with a narrower scope (split the review across fewer documents) or raise the budget.`,
  ].join("\n")
}
