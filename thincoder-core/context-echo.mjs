/**
 * context-echo.mjs — 回声安全面（D-CC18 ∥ D-CC19 恢复面归并 · 自 `context.mjs` 迁出 · 2026-10-01 core 拆分批 #755 ∥ #786）。
 * 内容 = `COMPACTION_PLACEHOLDER` ∥ 前缀器族（`prefixContent` / `withPlaceholderPrefix`）∥ 回声对归并
 * （`isAssistantEchoPair` / `contentTextOf` / `absorbEchoContent` / `mergeAdjacentAssistantEchoes`）——迁出块逐字。
 * 原档 `context.mjs` 经 `export { … } from` 转口保名（消费面 / 批内件 import 面零改）；
 * 跨档被引的原私有面（`COMPACTION_PLACEHOLDER` ∥ `withPlaceholderPrefix`）补 `export` 关键字。
 */

/** Placeholder assistant reply committed right after compaction (D9); D-CC18 merges it into an adjacent tail assistant instead of emitting it as a separate message */
export const COMPACTION_PLACEHOLDER = "Understood. I'll continue from these notes, re-verifying anything transient."

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
export function withPlaceholderPrefix(content) {
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
