/**
 * context.mjs — Context management and compaction
 * When no measured token count is available, use estimation as fallback (ASCII/4 + non-ASCII/1, no tokenizer dependency).
 * When a measured value exists (response usage.prompt_tokens), trust it — estimation underestimates CJK by 3-4x and relying solely on it may never trigger compaction.
 * Compaction strategy: summarize everything before the tail into one LLM note, keep the latest N messages verbatim.
 * NOTE: no dedicated head is kept (KEEP_HEAD = 0) — in multi-task sessions the earliest messages are
 * typically a COMPLETED earlier task; preserving them verbatim anchored the model's attention on stale
 * work after compaction. The earliest messages now go into the summary (which distinguishes completed
 * vs in-progress work), so the post-compaction context anchors on the current task (recent tail) only.
 *
 * 2026-09-21（context-tool 批 · CONTEXT-COMPACTION.md §6.16.8）：计量 / 尾族 / 切分三族**逐字迁出** `token-window.mjs`（495 → ≈428——硬限 500 内）；`estimateTokens` 经本档**再导出**保既有 import 面；新增面 = 模型主动压缩接线（`force` / `focus` + 焦点块 + anchor）与 prune 应用面。
 */

import { chat } from "./provider/index.mjs"
import { buildCompressMessages } from "./compress-form.mjs"
import { contextUsage, estimateTokens, keepTailSize, splitHistory, tailBudgetTokens } from "./token-window.mjs"
import { COMPACTION_PLACEHOLDER, withPlaceholderPrefix } from "./context-echo.mjs"
import { shrinkOversized } from "./context-degrade.mjs"

export const SUMMARIZE_PROMPT = `The conversation above is our work log so far — summarize it into a compact summary for use as context in the ongoing conversation.
Requirements:
- Write in first person, present tense — these are "my" handover notes, continuing my own train of thought
- Most important: preserve design decisions and their reasons — architecture choices, API contracts, naming conventions, trade-off rationale. These are the anchors the subsequent code must not deviate from
- Distinguish COMPLETED vs IN-PROGRESS work: completed tasks get a ONE-LINE recap each (what was done, key outcome); spend the detail budget on unresolved issues, next steps, and the CURRENT task
- The user's most recent request defines the current task — anchor on it. Earlier requests are likely already completed and only need the one-line recap; do NOT preserve them at full fidelity
- Explicitly list FILES CHANGED: every modified file path plus a one-line "why" — so post-compaction work can re-locate what was edited and where
- Explicitly list UNRESOLVED ISSUES / TODOs: anything still open plus the next steps — so post-compaction recovery knows where to resume
- Drop: pleasantries, repetition, fine-grained tool output details
- Honestly mark uncertain items: anything not actually verified must say "unverified"; do not present guesses as facts
- Use bullet-point output. Stay under ~1K tokens (≈1000 Chinese chars / 4000 ASCII chars) — a hard target. An oversized summary wastes window and dilutes the tail; the old unbounded-length guidance is deprecated. When over budget, trim in this order: completed recaps to one line; FILES CHANGED why-notes to bare paths; in-progress prose tightened. NEVER cut design anchors or UNRESOLVED ISSUES/TODOs — recovery depends on them.
`

/** Context prefix after compaction, informing the agent what happened */
const COMPACTION_PREFIX =
  "[Context was automatically compacted. Below is a summary of earlier work. " +
  "Treat it as notes, not proof — trust its conclusions (don't redo what it reports as done) " +
  "but re-verify transient state with tools. Check memory search for any missing decisions.]\n\n"

/** After this many consecutive compaction summary failures, degrade to deterministic truncation (losing info is better than task-killing 400 errors) */
export const COMPRESS_FAILURE_LIMIT = 3

/** Task re-injection reminder prefix (after compaction, clear old versions from history first for a single source of truth) */
const TASK_REINJECT_PREFIX = "[System reminder: your current task list after compaction:"

/** Truncation fallback note (used when the summary LLM fails repeatedly; no LLM call) */
const FALLBACK_NOTE =
  "[Context was truncated after repeated summarization failures. " +
  "The middle portion of earlier work was dropped WITHOUT a summary. " +
  "Re-verify any state you need with tools before relying on it.]\n\n"

/**
 * focus 指令块（F-CC2 · §6.16.2）：模型主动压缩时追加在摘要指令**尾段**——摘要按它加权取舍。`anchor` = task/goal 状态行；
 * `anchor == null`（无 task 且无 goal）⇒ **anchor 段省略**，focus 正文恒保留（不产空标题）。
 */
const focusBlock = (focus, anchor) =>
  `\n\nThis compaction happens at my own request and is weighted toward the work coming next:\n${focus}\n\n` +
  `Keep what that work needs at full fidelity — files, decisions, constraints, open threads; compress ` +
  `everything else harder.` +
  (anchor ? ` Current task/goal state (attached automatically):\n${anchor}` : "")

/**
 * anchor 取值（§6.16.2「自动附任务 / 目标（F-CC2 明文）」）：取值源 = **工具面单源**——`task` / `goal` 工具写入的
 * `agent.tasks` / `agent.goal`，不新增第二份状态；行格式沿用既有任务重注入形态（`- [status] title` + goal 一行）。两者皆空 ⇒ null（anchor 段整体省略）。
 */
function anchorText(agent) {
  const lines = []
  const g = agent?.goal
  if (g?.objective) lines.push(`- goal [${g.status}] ${g.objective}${g.criteria ? ` — done when: ${g.criteria}` : ""}`)
  for (const t of agent?.tasks ?? []) lines.push(`- [${t.status}] ${t.title}`)
  return lines.length > 0 ? lines.join("\n") : null
}

/** Replace middle with a note, then re-inject task/plan state (shared by LLM summary and truncation fallback) */
function applyCompression(agent, headEnd, tailStart, note) {
  // _fullHistory already holds every real message (written at the source via pushReal),
  // so compaction only shrinks the machine line — nothing to preserve here.
  // head is normally empty (KEEP_HEAD = 0) — the summary note becomes the first message,
  // which is exactly the intent: post-compaction context anchors on the current task, not on
  // possibly-completed earlier requests.
  const head = agent.history.slice(0, headEnd)
  const tail = agent.history.slice(tailStart)
  // SESSION.md §6.9: compaction-injected messages carry a ts — Date.now() at the compaction
  // moment (the note below; and the separate "Understood" placeholder in the non-merge branch).
  // They are machine-only (never in _fullHistory), but the machine-line timeline stays consistent
  // for any audit use. D-CC18 exception: in the merge branch the placeholder rides inside a REAL
  // tail message, which keeps its OWN ts — merging must not rewrite that message's time semantics
  // (and must not backfill ts-less restored messages either, D-S3).
  const now = Date.now()
  // D-CC18 echo safety: an assistant WITHOUT reasoning_content directly followed by another
  // assistant is rejected 400 by DeepSeek-family thinking mode ("The `reasoning_content` in the
  // thinking mode must be passed back to the API." — traced from a subagent's first post-compaction
  // request, 2026-09-16). The synthetic placeholder has no reasoning to echo, so when the tail
  // starts with an assistant the placeholder is merged INTO that message — copy-on-write, because
  // pushReal shares message objects with _fullHistory (never mutate in place) — instead of being
  // emitted as a separate message.
  //
  // Compaction REBUILDS the machine line (head + note + placeholder + tail), so the pre-compaction
  // _runStartHistoryLen index is stale — a longer array shrank beneath it, and end-of-run exploration
  // distillation would then silently skip or slice from the wrong offset. Reset the boundary to the
  // first verbatim tail message: head.length + 1 in the merge branch (the placeholder rides inside
  // the rewritten tail[0], which keeps its index), head.length + 2 otherwise (the note and the
  // separate "Understood" placeholder sit between head and tail). Exploration before the tail was
  // already covered by the compaction summary, so only the still-raw tail needs distilling. `head`
  // is empty today (KEEP_HEAD = 0) — the formula stays correct if KEEP_HEAD ever grows.
  // (shrinkOversized only truncates message bodies in place and leaves the array length unchanged,
  // so this boundary stays valid there — no reset needed.)
  if (tail[0]?.role === "assistant") {
    const merged = { ...tail[0], content: withPlaceholderPrefix(tail[0].content) }
    agent.history = [
      ...head,
      { role: "user", content: note, ts: now },
      merged,
      ...tail.slice(1),
    ]
    agent._runStartHistoryLen = head.length + 1
  } else {
    agent.history = [
      ...head,
      { role: "user", content: note, ts: now },
      { role: "assistant", content: COMPACTION_PLACEHOLDER, ts: now },
      ...tail,
    ]
    agent._runStartHistoryLen = head.length + 2
  }
  // Measured token baseline is invalidated along with old history (prompt_tokens were for pre-compaction context), fall back to estimation until next response
  agent._lastPromptTokens = null
  agent._usageAtLen = null

  // After compaction, re-inject the task list (the agent needs to know what it was doing).
  // Single source of truth: first remove any stale re-injections from the tail, then inject the latest version —
  // no longer embedded in the summary body (would duplicate and grow stale)
  agent.history = agent.history.filter(
    (m) => !(m.role === "user" && typeof m.content === "string" && m.content.startsWith(TASK_REINJECT_PREFIX))
  )
  if (agent.tasks.length > 0) {
    const taskSummary = agent.tasks.map((t) => `- [${t.status}] ${t.title}`).join("\n")
    agent.history.push({
      role: "user",
      content: `${TASK_REINJECT_PREFIX}\n${taskSummary}\nContinue from where you left off.]`,
    })
  }

  // Plan mode compaction: re-inject plan mode guidance
  if (agent.planMode) {
    agent.history.push({
      role: "user",
      content: "[System reminder: plan mode is active. Explore the codebase read-only, design your solution, then call plan with action='exit' to present it for user approval.]",
    })
  }
}

/**
 * If history exceeds threshold, compact it. Returns whether compaction happened.
 * Only called at safe points in the loop (history ends with user or tool message — a complete exchange boundary).
 * Automatically re-injects task list state after compaction.
 * @param {object} agent
 * @param {number} threshold - compaction threshold in tokens
 * @param {object} callbacks - { onToken, onReasoning, onCompress, onCompressStart } — summary
 *   generation is SILENT (never forwards onToken/onReasoning: the compaction process is an
 *   internal mechanism, not a model reply); onCompressStart fires right before the summary call
 *   (§6.8 D-C1, compression lifecycle visibility — panel start state)
 * @param {object} extras - { systemPrompt?, tools?, force?, focus? } — 固定开销面（system + tools 估计）+
 *   模型主动压缩面（§6.16.2）：`force` **只跳过** `tokens <= threshold` 早退，其余全同；`focus` 追加在摘要指令尾段。
 */
export async function compressIfNeeded(agent, threshold, callbacks, extras = {}, signal) {
  const history = agent.history
  // 单源（§6.16.4）：total / overhead 与 stats 面同一函数（既有内联式改调 contextUsage，判定语义零改）
  const usage = contextUsage(agent, extras)
  const tokens = usage.total
  const overhead = usage.overhead
  if (!extras.force && tokens <= threshold) return false

  const keepTail = keepTailSize(agent.provider, history.length)
  const split = splitHistory(history, keepTail, tailBudgetTokens(agent.provider))
  if (!split) {
    // History is too short (≤KEEP_HEAD+keepTail+1 messages) to find a middle section, but tokens exceed threshold — typically a single giant message
    // (large paste / huge injection). When summarization has no room, degrade to deterministic shrinking to ensure context always reduces
    return shrinkOversized(agent)
  }

  const middle = history.slice(split.headEnd, split.tailStart)

  // Compression request form v2/v3 (§6.14 / D-CC20): continuation — same system + same tools declaration (the turn's own
  // array) + the middle's verbatim messages + one tail instruction. 首现即复用回合所建前缀 ⟺ 带 tools 声明（无 tool_choice）
  // 且 `reasoning_effort` 与回合侧同值——v2 探针复测：8 格 84–98%（读数详表见批次档 §5）；不带 tools / 带 tool_choice:"none" / effort 异值 ⇒ 首现 0%（自建项复跑例外）；无 extras.tools ⇒ 不发 tools。
  // ⚠️ **不带 `tool_choice`**（设计 §6.14 备选② · 预注册判定规则「S3 <0.9 且 S4 ≥0.9 ⇒ 采纳 v2 减 tool_choice」启用——实测该参数使服务端丢弃 tools 区 ⇒ 首现命中 0%）。
  // ⚠️ v3（父侧 2026-09-18 裁定）：**随带与回合请求同源的 `reasoning_effort`**——下行不再覆盖 `agent.provider.reasoningEffort`（回合调用 `chat(agent.provider, …)` 同字段；
  // 不硬编码、未配置 ⇒ 缺省同修前。实证：deepseek 同值 95.69% / 异值首现 0%；族差/窗差：百炼 qwen 另有 `enable_thinking` 派生差、autoThink 的 turn 0 有改写窗口——登记见批次档 §5 上抛）。
  // Silent by design (D11): no onToken/onReasoning — the compaction process must not stream to the frontend.
  // signal propagates user cancellation (Ctrl+C) to the in-flight summary call.
  // Compression visibility (CONTEXT-COMPACTION.md §6.8 D-C1/D-C2): the frontend learns the compression
  // STARTED right before the summary LLM call ("Compressing context… / summarizing N messages" panel) — only
  // the lifecycle is surfaced, never the summary body. N = the number of history messages being summarized.
  callbacks?.onCompressStart?.({ messages: middle.length })
  const startedAt = performance.now()
  // F-CC2 焦点块（§6.16.2）：仅模型主动面携带——追加在**指令末条尾段**（`SUMMARIZE_PROMPT` 文本零改，
  // 只追加焦点块；无 focus ⇒ 请求体逐字节同修前——compress-form.test.mjs 零回归）。
  const messages = buildCompressMessages(history, split.tailStart, extras?.systemPrompt, SUMMARIZE_PROMPT)
  if (extras.focus) {
    const last = messages.at(-1)
    messages[messages.length - 1] = { ...last, content: last.content + focusBlock(String(extras.focus), anchorText(agent)) }
  }
  const summary = await chat({ ...agent.provider, thinking: null }, {
    messages,
    tools: extras?.tools,
    signal,
    // TRACES.md §6.1 D-TR4：轨迹元数据增补——kind=compress（上下文构建面——agent 元数据透出；
    // depth 经 extras.traceDepth——agent.mjs 主作用域传入——compress 调用点补齐）
    logCtx: {
      stage: "compress", child: agent._logId, kind: "compress",
      role: agent._role ?? null, depth: extras?.traceDepth ?? null,
      session: agent._sessionStart ?? null, cwd: agent.cwd,
      traces: agent.config?.traces?.enabled !== false,
    },
  })

  // Blank-summary guard (§6.14 退化面 3): a blank summary would land in applyCompression as
  // "middle dropped + empty note" and still count as success — throw into the failure chain instead.
  if (!summary.content?.trim()) throw new Error("compaction summary is empty")

  applyCompression(agent, split.headEnd, split.tailStart, COMPACTION_PREFIX + summary.content)

  // Completion info for the compression panel (D-C2): tokens freed = the pre-compression prompt
  // estimate (`tokens` — the value that tripped the threshold, incl. system/tools overhead on the
  // pure-estimation path) minus the post-compression estimate on the same basis. Elapsed = the
  // summary call + splice duration. agent.mjs forwards this to onCompress unchanged.
  agent._lastCompressInfo = {
    mode: "summary",
    tokensFreed: Math.max(0, Math.round(tokens - (estimateTokens(agent.history) + overhead))),
    elapsedMs: performance.now() - startedAt,
  }
  return true
}

/**
 * Deterministic truncation fallback: called when the summary LLM fails repeatedly, no network call.
 * Drops the middle so the task can continue. Returns whether truncation happened.
 */
export function compressFallback(agent) {
  const keepTail = keepTailSize(agent.provider, agent.history.length)
  const split = splitHistory(agent.history, keepTail, tailBudgetTokens(agent.provider))
  if (!split) return false
  const tailMessages = agent.history.length - split.tailStart
  applyCompression(agent, split.headEnd, split.tailStart, FALLBACK_NOTE)
  // Fallback completion info (D-C2): mode marks the deterministic-truncation path — the panel
  // shows the degradation note ("truncated to N messages") ONLY after 3 consecutive failures.
  agent._lastCompressInfo = { mode: "fallback", tailMessages }
  return true
}

// ─── 迁出面（import 面保持：TUI / verify-compress / VSC 对拍经本档取——先例 = 下方 explore-distill 再导出）──
export { estimateTokens }
// ─── 拆分转口（2026-10-01 拆分批 · #755 ∥ #786）：写缝 ∥ 回声 ∥ 降级三面外提——消费面 / 批内件 import 面零改 ───
export { pushReal, pushRecord } from "./context-push.mjs"
export { isAssistantEchoPair, mergeAdjacentAssistantEchoes } from "./context-echo.mjs"
export { pruneStaleToolOutputs } from "./context-degrade.mjs"
// ─── End-of-run exploration distillation（2026-09-05 module-split：524 > 500 硬限——verbatim
// 迁至 explore-distill.mjs，语义零变——VS Code compact.mjs 同款联动；cross-repo parity 锚改指
// explore-distill.mjs——消费方 import 面不变（re-export））───────────────────────

export { summarizeRunExplorations, EXPLORE_TOOLS, EXPLORE_SUMMARY_PROMPT } from "./explore-distill.mjs"
