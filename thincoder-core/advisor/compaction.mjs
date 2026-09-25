/**
 * advisor/compaction.mjs — advisor review support (split out of advisor/run.mjs,
 * 第 11 批 — run.mjs was 498/500 硬帽): context trimming + the review's resource
 * limits + the terminal-state guards + the review-text assembler.
 *
 * estimateTokens / compactMessages moved VERBATIM (the only edit is the `pinned`
 * re-attach — F13/§14.4 #3); renderTimeline moved verbatim too, so the tail
 * GENERATOR and the tail CLASSIFIER stay in one file with the assembler they
 * feed (§14.3 谓词 ↔ §14.6 结构化尾——同族单源)。拆分线 = 行数硬帽实测（见批次档 §5）。
 */

import { providerSpec } from "../config.mjs" // 第 25 批：预算派生（与 loop.mjs:11 同源导入）
// B4（群 B 批，ADVISOR-GUARDS.md §9——F32）：CJK 加权单源（provider/rate.mjs 叶子向无环）
import { estimateText } from "../provider/rate.mjs"

export const MAX_ADVISOR_TURNS = 100
// NOTE: prompts/advisor-round{1,2,3}.md encourage the model to finish within
// ~30 tool turns — a prompt-level efficiency target, DISTINCT from the
// 100-turn mechanical hard cap (MAX_ADVISOR_TURNS above; pure runaway-loop
// guard). They serve different purposes; do NOT synchronize them.

// Context window limits
// 上下文预算（第 25 批——120K 硬编码退场）：预算跟随评审模型窗口（providerSpec：
// 模型规格表 × provider 级 context 覆盖）。头寸用途 = chars/4 估算误差 + 响应/协议开销
// （内存不构成约束——设计 §16.4）；判死线仍是宿主机自限线，服务端窗口约束不变。
export const CONTEXT_LIMIT_RATIO = 0.8  // 判死线 = 窗口 × 0.8
const COMPACT_TRIGGER_RATIO = 0.8       // 压缩触发 = 判死线 × 0.8（既有关系零改）

/** 评审上下文预算（纯函数——两档阈值可机测；provider 为 null 时退化默认规格）。 */
export function advisorContextBudget(provider) {
  const limit = Math.floor(providerSpec(provider).context * CONTEXT_LIMIT_RATIO)
  return { limit, compactAt: Math.floor(limit * COMPACT_TRIGGER_RATIO) }
}

export const TOOL_TIMEOUT_MS = 30_000 // single tool timeout
export const REVIEW_TIMEOUT_MS = 600_000 // whole review timeout (10 minutes)
export const MAX_RESULT_CHARS = 64 * 1024 // tool result truncation (line-aware; 64K, aligned with main offload limit)
const MAX_KEY_FILES_IN_COMPACTION = 5 // files named in the compaction summary

/** Estimate token count from messages（B4——群 B 批 ADVISOR-GUARDS.md §9：扁平 chars/4 改 `estimateText`
 *  加权式——ASCII/4 + 非 ASCII/1；纯 ASCII 与旧式逐值相等；CJK 低估 ~3-4× 修正；
 *  walker（content / tool_calls 两源）与计数口径零改）。 */
export function estimateTokens(messages) {
  return messages.reduce((sum, msg) => {
    const content = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content || "")
    const toolCalls = msg.tool_calls ? JSON.stringify(msg.tool_calls) : ""
    return sum + estimateText(content + toolCalls)
  }, 0)
}

/** Compact early messages when context grows too large — LOCAL trimming only
 *  (no LLM summarization). MUTATES in place (splice) so the caller's array
 *  reference stays valid — a reassignment would leave the caller's logging
 *  (tool-call count, token estimate) reading a stale array. */
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

  // F13（第 11 批 §14.4 #3）：压缩丢掉的正是**首条 user 消息**（评审简报，含 token）——
  // pinned 由评审参数构建（非模型输出），在本次压缩动作内作为一条 user 消息重挂（幂等可读：
  // 重复压缩允许重复挂回，不做存在性判定）。
  const pin = pinned ? [{ role: "user", content: pinned }] : []
  messages.splice(0, messages.length,
    system,
    { role: "user", content: `[Context compacted] ${summary}` },
    ...pin,
    ...recent)
}

// ─────────────────────────────────────────────────────────────────────────────
// 不完整判定族（A / F16 共用单谓词——§14.3；六 kind = 宿主尾族）
// ─────────────────────────────────────────────────────────────────────────────

/** 宿主尾族六 kind 的块首行逐字前缀（§14.3 表）。变量段（token 数 / 秒数 / 工具轮数）
 *  不入前缀——取各尾的固定字面部分；`review_failed` = run.mjs catch 的字符串 resolve
 *  形态（不 throw），其余五条 = renderTimeline 尾（loop.mjs）。 */
const ADVISOR_INCOMPLETE_PREFIXES = [
  ["context_limit", "Advisor: context window limit"],
  ["turn_cap", "Advisor: stopped after"],
  ["timeout", "Advisor: review timeout"],
  ["empty", "Advisor: empty response"],
  ["interrupted", "Advisor: interrupted."],
  ["review_failed", "Advisor: review failed"],
]

/** 单谓词（三消费点同源：design 结算 / code 完成守卫 / 报告提示）——**块首行扫描**（按空行
 *  分块，逐块取首行 trim 后测前缀；时间线与尾以空行相接，六条尾均以块首行形态落地）。
 *  负向精度（§14.3 修正轮）：引文中同串的**非块首形态**（围栏内行 / 表格行 / 引用行）不判
 *  incomplete；块首裸行引用同串的残余误报方向安全（fail-closed——多付一轮重跑，如实登记）。
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

// ─────────────────────────────────────────────────────────────────────────────
// 预算提示 + 结构化超时尾（D / F15——§14.6 #2/#3）
// ─────────────────────────────────────────────────────────────────────────────

/** 0.75 一次性预算提示判定（纯函数——阈值两侧可机测；每场评审至多一次）。 */
export function shouldBudgetNudge(elapsedMs, budgetMs, nudged) {
  return !nudged && Number.isFinite(budgetMs) && budgetMs > 0 && elapsedMs >= budgetMs * 0.75
}

/** 预算提示文案（逐字——§14.6 #2；由循环注入一条 user 消息）。 */
export function budgetNudgeText(elapsedMs, budgetMs) {
  const secs = (ms) => Math.round(ms / 100) / 10
  const pct = Math.round((elapsedMs / budgetMs) * 100)
  return `⏳ review budget: ~${pct}% consumed (${secs(elapsedMs)}s of ${secs(budgetMs)}s). Converge now: emit your findings table for the evidence you have verified, mark anything you could not verify explicitly as \`unverified\` (unverified evidence must not support a pass), and emit your verdict line.`
}

/** 结构化超时尾（§14.6 #3）：族前缀 `Advisor: review timeout after {S}s.` 逐字保持
 *  （判定族字面依赖）；其后 = 机读统计（rounds / tool calls / review text produced）
 *  + 可执行恢复指引（narrower scope / 调预算）。 */
export function timeoutTail(timeoutMs, rounds, toolCalls, producedText) {
  const s = Math.round(timeoutMs / 1000)
  return [
    `Advisor: review timeout after ${s}s. Review incomplete — the wall-clock budget was exhausted; partial findings (if any) are above.`,
    `- rounds: ${rounds} · tool calls: ${toolCalls} · review text produced: ${producedText ? "yes" : "no"}`,
    `- budget: ${s}s (agent.advisor.timeoutMs) — re-run with a narrower scope (split the review across fewer documents) or raise the budget.`,
  ].join("\n")
}

// ─────────────────────────────────────────────────────────────────────────────
// 评审文本装配（loop 的尾经此与时间线合流——与尾族同文件：生成 / 判定 / 装配单源）
// ─────────────────────────────────────────────────────────────────────────────

// The live "[thinking…]" wait indicator shares its exact text with the TUI
// cleanup regex (agent-turn.mjs strips it before flushing to history) — keep
// them in lockstep.
export const ADVISOR_THINKING_PLACEHOLDER = "\n[thinking…]\n"

/**
 * Tool-call progress line summary delegates to the single source describeToolArgs
 * (../tui/tool-args.mjs) — the same function main-agent tool blocks and subagent
 * blocks use. 2026-08-31: replaced the local picker (action/path/pattern/command-only)
 * so advisor progress lines show the quoted-path forms everywhere else.
 */
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
