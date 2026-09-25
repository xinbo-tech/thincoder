/**
 * explore-distill.mjs — End-of-run exploration distillation (CONTEXT-COMPACTION.md §6.9 H1, 2026-08-23). 2026-09-05 module-split: moved verbatim out of
 * context.mjs (524 > 500 hard limit). The main agent's machine line is flooded by inline
 * step-by-step exploration (read/grep/...). At run end we distill THIS run's exploration
 * tool-results into one semantic summary note that replaces them in the machine line,
 * while agent._fullHistory (the human line) stays untouched. Call form = session continuation
 * (prefix reuse · §6.15): system + `history[0, lastBlockEnd)` verbatim messages + one tail
 * instruction — built by the single-source constructor compress-form.mjs#buildCompressMessages
 * (no second builder · D2); the declaration face (systemPrompt / tools) rides `extras` from the
 * call point, same source as the turn request. VS Code adapter = thincoder-vscode/src/explore-distill.mjs.
 */

import { chat } from "./provider/index.mjs"
import { buildCompressMessages } from "./compress-form.mjs"

/** Read-only knowledge tools counted as "exploration" (execute writes files → never exploration). */
export const EXPLORE_TOOLS = new Set([
  "read", "grep", "glob", "ls", "code_search", "doc_search", "repo_outline",
])

/** Summary prompt for turning a burst of exploration results into a semantic summary. */
export const EXPLORE_SUMMARY_PROMPT = `You are distilling exploration tool results. Summarize the following read-only codebase exploration into a compact semantic summary for the main agent's own context.

Requirements:
- Capture WHAT was discovered, WHERE (which files / directories / symbols), and the KEY CONCLUSIONS — do not list tool calls mechanically
- Keep actionable facts the main agent needs to continue: code locations, function names, file paths, structure, and open questions the exploration raised
- Drop raw tool-output noise, repeated lines, and verbatim file dumps — keep only what must be remembered
- Be honest: mark anything not actually verified as "unverified"; do not present guesses as facts
- Use bullet points; aim for information completeness, not a hard word limit

Exploration log:
`

/** tool_calls name across both stored shapes ({function:{name}} and flat {name}). */
function toolCallName(tc) {
  return tc?.function?.name ?? tc?.name ?? ""
}

/** Tool that produced a tool-result message (falls back to its owner assistant's tool_call). */
function toolResultName(msg, ownerToolCalls) {
  if (typeof msg?.name === "string" && msg.name) return msg.name
  const owner = (ownerToolCalls ?? []).find((tc) => tc.id === msg?.tool_call_id)
  return owner ? toolCallName(owner) : ""
}

/**
 * Find the pure-exploration "assistant(tool_calls)→tool…" pair blocks added since `start`.
 * A block is explorable only when EVERY tool call AND every tool result in it is an exploration
 * tool — mixed blocks (read + edit in one turn) stay untouched, or we'd orphan the edit pairing.
 */
function findExplorationBlocks(history, start) {
  const blocks = []
  let i = start
  while (i < history.length) {
    const m = history[i]
    if (m?.role === "assistant" && Array.isArray(m.tool_calls) && m.tool_calls.length > 0) {
      let j = i + 1
      while (j < history.length && history[j]?.role === "tool") j++
      const toolMsgs = history.slice(i + 1, j)
      const allCallsExplore = m.tool_calls.every((tc) => EXPLORE_TOOLS.has(toolCallName(tc)))
      const allResultsExplore = toolMsgs.length > 0 && toolMsgs.every((t) => EXPLORE_TOOLS.has(toolResultName(t, m.tool_calls)))
      if (allCallsExplore && allResultsExplore) {
        blocks.push({ start: i, end: j, messages: history.slice(i, j), toolCount: toolMsgs.length })
      }
      i = j
    } else {
      i++
    }
  }
  return blocks
}

/**
 * Core (shared) distillation: replace this run's pure-exploration pair blocks with a single
 * "[Exploration summary]" note placed where the first block was. Returns a NEW history array,
 * or null when there is nothing to shrink (<3 exploration results / LLM failure). Pairing-safe:
 * whole assistant→tool blocks are removed, so no orphan tool_calls/tool can survive.
 */
async function distillExplorations(history, start, provider, signal, agent, depth, extras) {
  if (!Array.isArray(history) || history.length - start < 2) return null
  const blocks = findExplorationBlocks(history, start)
  const resultCount = blocks.reduce((n, b) => n + b.toolCount, 0)
  if (resultCount < 3) return null

  // 切点 = 本 run 末块的 `end`（与替换面同一 blocks 数组——不新增第二处切割判据）。请求前缀 =
  // tools 声明 + system + `[0, lastBlockEnd)`——皆回合请求已建缓存面（§6.15）；未命中面 =
  // 尾部指令一条（+ ≤255 块对齐残余）。
  const cut = blocks.at(-1).end

  let summary
  try {
    // Silent by design (D11): thinking:null and no onToken/onReasoning — this internal
    // distillation must not stream to the frontend. signal propagates user cancellation.
    // 会话续写形态（§6.15 / D-CC21）：messages 由单源构造器 buildCompressMessages 产出（不设第二构造
    // 点）；tools 取与回合请求同一声明面（**不带** tool_choice——实测该参数使服务端丢弃 tools 区）；
    // 不覆盖 reasoningEffort ⇒ 与回合侧同源（v3 形态）。extras 缺省 ⇒ 退化面 1（无 system / 无 tools）。
    const resp = await chat({ ...provider, thinking: null }, {
      messages: buildCompressMessages(history, cut, extras?.systemPrompt, EXPLORE_SUMMARY_PROMPT),
      tools: extras?.tools,
      signal,
      // TRACES.md §6.1 D-TR4：轨迹元数据增补——kind=distill（探索蒸馏面——agent 元数据透出；
      // depth 经 summarizeRunExplorations 参数透传——agent.mjs 主作用域传入）
      logCtx: {
        stage: "distill", child: agent?._logId ?? null, kind: "distill",
        role: agent?._role ?? null, depth: depth ?? null,
        session: agent?._sessionStart ?? null, cwd: agent?.cwd ?? process.cwd(),
        traces: agent?.config?.traces?.enabled !== false,
      },
    })
    summary = resp?.content
  } catch {
    return null // N3: never block the run's return or lose history — original results stay
  }
  if (!summary) return null

  const drop = new Set()
  for (const b of blocks) for (let k = b.start; k < b.end; k++) drop.add(k)
  const note = { role: "user", content: "[Exploration summary]\n" + summary }
  const next = []
  let inserted = false
  for (let k = 0; k < history.length; k++) {
    if (drop.has(k)) {
      if (!inserted) { next.push(note); inserted = true }
      continue
    }
    next.push(history[k])
  }
  return next
}

/**
 * End-of-run exploration distillation (runAgent's final return). Shrinks the MACHINE line
 * (agent.history) only; agent._fullHistory is never touched. Triggers when this run added ≥3
 * exploration tool results; on LLM failure it silently keeps the original history (N3).
 * The distillation itself is silent and never streams (D11); `callbacks.onDistilled` fires
 * ONLY after the replacement actually lands (never on no-op/failure) — callers persist the
 * compressed session (SEND-STALL-DISTILL §2.3).
 * `extras` = 前缀面（{ systemPrompt, tools }——调用点透传、与回合请求同源 · §6.15）；缺省 ⇒ 退化面 1。
 */
export async function summarizeRunExplorations(agent, callbacks, signal, depth = 0, extras) {
  const next = await distillExplorations(agent.history, agent._runStartHistoryLen ?? 0, agent.provider, signal, agent, depth, extras)
  if (!next) return
  agent.history = next
  // The machine line changed shape — the measured token baseline was for the pre-shrink context.
  // Invalidate so the next compaction check re-estimates instead of over-counting stale history.
  agent._lastPromptTokens = null
  agent._usageAtLen = null
  // The compressed machine line must reach the disk: the run's own save already happened,
  // so without this hook the async distill would leave the session un-compressed on exit.
  callbacks.onDistilled?.()
}
