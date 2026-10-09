/**
 * run-helpers.mjs — VSC 端 agent 辅助（2026-09-29 parity-b1 · 批档 §2.2 表注① 拆分落形）：
 * 转口核单源（`FILE_MUTATORS` ∕ `turnFrame` ∕ `escapeXml` ← 核 `agent/helpers.mjs`；
 * `pushReal` ← 核 `context.mjs`——端载体形适配见下）
 * + 端独有保留（`safeSliceUTF16` ∕ `safeSliceUTF16Tail` ∕ `buildHeadTailPreview` ∕ `agentState`）。
 * 核有同物（端删——同表注）：`configuredMaxTurns`（核 `prepareRun` 读 `agent.config.agent.maxTurns`）·
 * `MAX_VERIFY_PUSHBACKS/RETRIES` ∕ `MAX_EMPTY_RETRIES` ∕ `STALL_*`（核 `completion.mjs` ∕
 * `post-turn.mjs`）· `offloadToolResult`（核 `dispatch-run.mjs`）· `runWithLimit` ·
 * `reinjectAfterCompaction`（核 `runCompactionCheck` 的 `ensureAutoReminder` 对位）——消费面随主循环退役。
 */
import { pushReal as corePushReal } from "@thincoder/core/context.mjs"

// ── 转口核（单源）──────────────────────────────────────────────
export { FILE_MUTATORS, turnFrame, escapeXml } from "@thincoder/core/agent/helpers.mjs"

/** pushReal —— 核单源（`@thincoder/core/context.mjs`）的端载体形适配：核签名 `pushReal(agent, msg)`
 *  （写 `agent.history` + `agent._fullHistory` + ts 打点），本端消费面（`queued-pickup`——B7 3a 后
 *  规则面端壳退役）持双数组形 `pushReal(history, fullHistory, msg)` ⇒ 两行适配、语义零变（逐条写点全在核内）。 */
export function pushReal(history, fullHistory, msg) {
  corePushReal({ history, _fullHistory: fullHistory }, msg)
}

// ── 端独有保留（无核同名件）────────────────────────────────────
const MAX_TOOL_RESULT = 64 * 1024 // chars — large results offloaded above this (TOOL-OUTPUT-LIMITS.md §2)
const TOOL_RESULT_PREVIEW_HEAD = 16 * 1024 // head slice preserved（预览保头保尾）
const TOOL_RESULT_PREVIEW_TAIL = 48 * 1024 // nominal tail slice — actual tail = budget − head − noteLen（tail 优先）
const PREVIEW_NOTE_PREFIX = "\n\n… [middle omitted: "
const PREVIEW_NOTE_SUFFIX = " chars] …\n\n"
const PREVIEW_NOTE_MAX_DIGITS = 6 // 省略位数预留（迭代按真实位数收敛）

/** UTF-16-safe truncation: a lone high surrogate at the cut point (emoji split) 400s strict
 *  providers (deepseek "unexpected end of hex escape") — step back one code unit instead. */
export function safeSliceUTF16(text, max) {
  if (text.length <= max) return text
  const cp = text.charCodeAt(max - 1)
  if (cp >= 0xd800 && cp <= 0xdbff) return text.slice(0, max - 1)
  return text.slice(0, max)
}

/** UTF-16-safe TAIL slice (safeSliceUTF16 的对称面)：起点落低代理 → 丢弃代理对整体；
 *  终点孤立高代理 → 去掉（截断边界安全——尾切片不新增孤立代理）。 */
export function safeSliceUTF16Tail(text, max) {
  if (text.length <= max) return text
  let start = text.length - max
  const first = text.charCodeAt(start)
  if (first >= 0xdc00 && first <= 0xdfff) start += 1
  let tail = text.slice(start)
  const last = tail.charCodeAt(tail.length - 1)
  if (last >= 0xd800 && last <= 0xdbff) tail = tail.slice(0, -1)
  return tail
}

/** 双端预览（TOOL-OUTPUT-LIMITS.md §2 保头保尾）：head(16K) + 省略注 + tail——总长 ≤ MAX_TOOL_RESULT；
 *  tail 优先（预算 = MAX − head − noteLen，位数迭代收敛——位数只减不增）。 */
export function buildHeadTailPreview(text) {
  if (text.length <= MAX_TOOL_RESULT) return text
  const head = safeSliceUTF16(text, TOOL_RESULT_PREVIEW_HEAD)
  let digits = PREVIEW_NOTE_MAX_DIGITS
  let tail = ""
  let omitted = 0
  for (let pass = 0; pass < 3; pass++) {
    const noteLen = PREVIEW_NOTE_PREFIX.length + digits + PREVIEW_NOTE_SUFFIX.length
    const tailBudget = Math.max(0, MAX_TOOL_RESULT - head.length - noteLen)
    tail = safeSliceUTF16Tail(text, tailBudget)
    omitted = Math.max(0, text.length - head.length - tail.length)
    if (String(omitted).length === digits) break
    digits = String(omitted).length
  }
  return head + `${PREVIEW_NOTE_PREFIX}${omitted}${PREVIEW_NOTE_SUFFIX}` + tail
}

/** 会话槽持久化载荷（CLI session.mjs fields——`saveSession` parity；消费 = 端 onComplete ∕
 *  onDistilled 的 `_saveLines` spread）：engineering ∕ advisor.guard ∕ 多槽表 engDesignTokens
 *  （Map → JSON-safe 对象，空态 null——槽清否由 saveLines 的 D2 合并语义定）+ 会话级三字段
 *  tasks ∕ goal ∕ pendingReminders（快照拷贝——异步保存间后续回合的内存变更不得泄漏）。 */
export function agentState(agent) {
  return {
    engineering: agent.config?.agent?.engineering ?? false,
    advisorGuard: agent.config?.advisor?.guard === true,
    engDesignTokens: agent._engDesignTokens instanceof Map && agent._engDesignTokens.size > 0
      ? Object.fromEntries(agent._engDesignTokens)
      : null,
    tasks: Array.isArray(agent._tasks) ? [...agent._tasks] : [],
    goal: agent._goal ? { ...agent._goal } : null,
    pendingReminders: Array.isArray(agent._pendingReminders) ? [...agent._pendingReminders] : [],
  }
}
