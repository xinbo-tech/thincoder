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
import { contextUsage, estimateTokens, collectStaleToolOutputs, keepTailSize, splitHistory, tailBudgetTokens } from "./token-window.mjs"

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

/** Placeholder assistant reply committed right after compaction (D9); D-CC18 merges it into an adjacent tail assistant instead of emitting it as a separate message */
const COMPACTION_PLACEHOLDER = "Understood. I'll continue from these notes, re-verifying anything transient."

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

/**
 * pushReal — the single entry point for REAL conversation messages.
 * A real message (user input, assistant reply, tool result, multimodal image) is appended to BOTH:
 *   agent.history      — the machine context (compaction shrinks this)
 *   agent._fullHistory — the human-readable record (persistence source)
 * Machine-only messages ([System reminder:...], compaction notes, task/plan/checkpoint re-injections)
 * are pushed directly to agent.history WITHOUT going through here, so they never enter _fullHistory.
 * The two lines are written independently at the source — no after-the-fact delta sync.
 * Message timestamps (SESSION.md §6.9): stamped HERE once at push time (epoch ms) — a single
 * point covers every real message. Pre-existing ts (e.g. from another end writing the shared slot)
 * is preserved; restored old messages keep no ts rather than getting a misleading backdate (D-S3).
 * ts is a LOCAL-ONLY field — the send layer strips it before any provider request (T-S3).
 *
 * TUI-OOM-ROOTCAUSE 批（SESSION.md §6.14）——人读线内存有界 + 磁盘为准：
 *   ① `agent._recordStore?.append(msg)`：记录同步追加（磁盘为准——append-only sidecar）；
 *   ② 窗口驱逐：绑定态（agent._historyWindow = 200）下 _fullHistory 只保最近窗口条——
 *      更早内容仅存磁盘（翻页/检索/保存从盘按需读）。未绑定（模式 F）不驱逐（零回归）。
 * 追加失败不阻断回合（独立 try/catch——尽力面 N-S6；store 内部另置 degraded 并停写）。
 */
export function pushReal(agent, msg) {
  if (!Array.isArray(agent._fullHistory)) agent._fullHistory = []
  if (msg && msg.ts === undefined) msg.ts = Date.now()
  agent._fullHistory.push(msg)
  try { agent._recordStore?.append(msg) } catch { /* 尽力面：落盘失败不阻断回合（N-S6） */ }
  const win = agent._historyWindow
  if (win > 0 && agent._fullHistory.length > win) {
    agent._fullHistory.splice(0, agent._fullHistory.length - win)
  }
  agent.history.push(msg)
}

/**
 * Content-shape-safe prefixing (D-CC18, generalized for D-CC19 merge reuse):
 * string → text + blank line + original; multimodal array → text part prepended;
 * empty string / null / undefined / other → text alone.
 */
function prefixContent(content, text) {
  if (typeof content === "string" && content.length > 0) return `${text}\n\n${content}`
  if (Array.isArray(content)) return [{ type: "text", text }, ...content]
  return text
}

/**
 * D-CC18 echo safety: prefix the placeholder onto an existing assistant message's content.
 * Thin wrapper over prefixContent (behavioral semantics unchanged).
 */
function withPlaceholderPrefix(content) {
  return prefixContent(content, COMPACTION_PLACEHOLDER)
}

/**
 * D-CC19 restore-path echo merge (2026-09-16 ENGINE-DEBT 批 ED-1): persisted `contextHistory`
 * is loaded back VERBATIM on session restore, so the D-CC18 pathological shape (an assistant
 * WITHOUT reasoning_content directly followed by another assistant — DeepSeek-family thinking
 * mode rejects the first request with 400) can revive from disk. Pure in-core function: scans
 * only at restore time, never prompts the user, never rewrites the session file. Merge direction
 * matches D-CC18 (the reasoning-less message is absorbed INTO its follower — the follower's
 * tool_calls / reasoning_content / other fields are kept verbatim; texts joined with a blank
 * line). Iterates to a fixed point (chains collapse in full). Copy-on-write: messages may be
 * shared with other lines, so the merged message is always a NEW object; clean input returns
 * the SAME array reference (zero copy).
 */

/** Pair predicate: prev = assistant with no/empty reasoning_content and no tool_calls,
 * directly followed by another assistant. (Prev WITH tool_calls is never merged — pairing
 * safety, F-3.) */
export function isAssistantEchoPair(prev, next) {
  return prev?.role === "assistant"
    && next?.role === "assistant"
    && !prev.reasoning_content
    && !(Array.isArray(prev.tool_calls) && prev.tool_calls.length > 0)
}

/** Text of a message content in any supported shape (string / parts array / null-ish). */
function contentTextOf(content) {
  if (typeof content === "string") return content
  if (Array.isArray(content)) {
    return content.filter((p) => p?.type === "text").map((p) => p.text ?? "").join("\n\n")
  }
  return ""
}

/** Absorb prev's text into next's content (blank-line join; empty prev text → next unchanged). */
function absorbEchoContent(prevContent, nextContent) {
  const text = contentTextOf(prevContent)
  if (text.length === 0) return nextContent
  return prefixContent(nextContent, text)
}

export function mergeAdjacentAssistantEchoes(history) {
  if (!Array.isArray(history)) return history
  let src = history
  for (;;) {
    let changed = false
    const next = []
    for (let i = 0; i < src.length; i++) {
      if (i + 1 < src.length && isAssistantEchoPair(src[i], src[i + 1])) {
        next.push({ ...src[i + 1], content: absorbEchoContent(src[i].content, src[i + 1].content) })
        i += 1
        changed = true
      } else {
        next.push(src[i])
      }
    }
    if (!changed) return src === history ? history : src
    src = next
  }
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

/** prune stub 逐字（§6.16.3）：只给「已清理 + 原长度 + 重跑路径」——prune 是**删**不是摘要，不声称可复原。 */
const pruneStub = (chars) => `[pruned: stale tool output dropped (${chars} chars) — re-run the tool if you need it again.]`

/**
 * 陈旧工具输出清理（F-CC3 · §6.16.3）：合格集 = `token-window.mjs` 单源（保护尾外 ∧ `role:"tool"` ∧ ≥ 门槛）；
 * 命中项**原位换「内容」**（`history[i] = { ...m, content: stub }`——数组引用 / 长度 / 索引 / `tool_call_id` 全不变
 * ⇒ 配对**结构上不可能被拆**）。记录面零改（copy-on-write：消息对象与人读线共享）；基线失效同 `shrinkOversized` 先例。
 * @returns {{pruned:number, freed:number, candidates:number, tailKept:number, belowMin:number}}
 */
export function pruneStaleToolOutputs(agent) {
  const history = agent.history
  const stale = collectStaleToolOutputs(history, agent.provider)
  const counts = {
    pruned: stale.indexes.length,
    freed: stale.tokens,
    candidates: stale.candidates,
    tailKept: stale.tailKept,
    belowMin: stale.belowMin,
  }
  if (counts.pruned === 0) return counts
  for (const i of stale.indexes) {
    const m = history[i]
    // 多模态 tool 结果（content 数组）整体替换为 stub ⇒ 图像 part 丢弃（不可再取——prune 是删；回执只给重跑路径）
    const chars = typeof m.content === "string" ? m.content.length : JSON.stringify(m.content ?? "").length
    history[i] = { ...m, content: pruneStub(chars) }
  }
  agent._lastPromptTokens = null
  agent._usageAtLen = null
  return counts
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

/** Hard truncation limit for a single message body: when exceeded and the splitter can't find a middle section, truncate to a stub (prevents one giant message from blocking compaction) */
const OVERSIZE_CONTENT_LIMIT = 8_000

/**
 * Deterministic shrinking: last resort when splitHistory can't find a middle section (history too short) but threshold is exceeded. No LLM call.
 * Truncates user/tool message bodies exceeding OVERSIZE_CONTENT_LIMIT to a stub (keeps head + tail);
 * does not touch reasoning_content (DeepSeek/Kimi echo protocol) or tool_calls pairing structure — no protocol 400
 * risk from this path (this module's echo-safety face is `applyCompression`: the compaction placeholder is never
 * committed as a separate reasoning-less assistant next to another assistant — D-CC18, 2026-09-16 batch).
 * Only called after compressIfNeeded determines threshold is exceeded. Returns whether any message was truncated.
 */
function shrinkOversized(agent, limit = OVERSIZE_CONTENT_LIMIT) {
  let shrunk = false
  // Copy-on-write: build a NEW array and replace only truncated entries. pushReal stores the SAME
  // message object in both `agent.history` (machine line) and `agent._fullHistory` (human/persistence
  // line), so in-place `m.content = ...` would ALSO truncate the never-compacted human line and lose
  // the original pasted content on session persist (session.mjs persists _fullHistory). VS Code port
  // already copies (`history.map(m => ({ ...m }))`); this brings CLI to parity.
  const next = agent.history.map((m) => {
    if ((m.role !== "user" && m.role !== "tool") || typeof m.content !== "string") return m
    if (m.content.length <= limit) return m
    // Truncate keeping head + tail, insert stub in between; keepHead/keepTail proportional but not exceeding 50%/25% of limit
    const keepHead = Math.min(Math.floor(limit * 0.5), 4000)
    const keepTail = Math.min(Math.floor(limit * 0.25), 2000)
    shrunk = true
    return {
      ...m,
      content:
        m.content.slice(0, keepHead) +
        `\n[... ${m.content.length - keepHead - keepTail} chars truncated — single message too large for context window ...]\n` +
        m.content.slice(-keepTail),
    }
  })
  if (shrunk) {
    agent.history = next
    // Same as compaction: measured token baseline is invalidated by the changed history, fall back to estimation until next response
    agent._lastPromptTokens = null
    agent._usageAtLen = null
  }
  return shrunk
}

// ─── 迁出面（import 面保持：TUI / verify-compress / VSC 对拍经本档取——先例 = 下方 explore-distill 再导出）──
export { estimateTokens }
// ─── End-of-run exploration distillation（2026-09-05 module-split：524 > 500 硬限——verbatim
// 迁至 explore-distill.mjs，语义零变——VS Code compact.mjs 同款联动；cross-repo parity 锚改指
// explore-distill.mjs——消费方 import 面不变（re-export））───────────────────────

export { summarizeRunExplorations, EXPLORE_TOOLS, EXPLORE_SUMMARY_PROMPT } from "./explore-distill.mjs"
