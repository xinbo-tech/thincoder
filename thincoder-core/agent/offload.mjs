/**
 * agent/offload.mjs — 一次「把超长正文落到盘上、把注入体压成预览 + 路径」：门限常量 → 两端安全切片 → 预览拼装 → 落盘 → 写时自清理。
 */
import { configDir } from "../config.mjs"
import { writeFile, mkdir, readdir, stat, unlink } from "node:fs/promises"
import { join } from "node:path"
import { safeSliceUTF16 } from "../text-budget.mjs"

const TOOL_RESULT_OFFLOAD_LIMIT = 64 * 1024 // 65536 chars — offload only above 64K (2026-08-24)
const TOOL_RESULT_PREVIEW = 64 * 1024 // total preview budget: head + middle note + tail ≤ 65536 (aligns with CLI/VS Code webview)
const TOOL_RESULT_PREVIEW_HEAD = 16 * 1024 // head slice preserved (2026-09-04 §5 — dual-end preview)
const TOOL_RESULT_PREVIEW_TAIL = 48 * 1024 // nominal tail slice (results/errors/stats live here — actual tail = budget remainder, see buildDualEndPreview)

/** UTF-16 safe END slice (2026-09-04 §5 dual-end preview — review #5: both boundaries must not split
 *  a surrogate pair). Same rule as safeSliceUTF16, mirrored: if the slice START lands on a LOW
 *  surrogate (DC00-DFFF — the second half of a pair whose high half sits just before the boundary),
 *  advance one code unit so the slice never begins with an orphan low surrogate. */
function safeSliceUTF16End(text, max) {
  if (text.length <= max) return text
  const start = text.length - max
  const cp = text.charCodeAt(start)
  if (cp >= 0xdc00 && cp <= 0xdfff) return text.slice(start + 1)
  return text.slice(start)
}

/** Dual-end preview (design §5 D-4.1): head + middle-omitted note + tail — the tail carries
 *  results/errors/stats that a pure-head truncation would cut off.
 *  Budget (round1 review #2, fixed): head + note + tail ≤ TOOL_RESULT_PREVIEW (65536) — tail is
 *  computed from constants (tail = TOOL_RESULT_PREVIEW − head − noteLen), never hardcoded.
 *  The note length depends on the omitted digit count; text.length's digit count is an upper bound
 *  for omitted (< text.length), so budgeting with it keeps the total ≤ 65536 while the printed
 *  note reports the actual omitted count. Both boundaries run surrogate-safe slices (review #5). */
function buildDualEndPreview(text) {
  const head = safeSliceUTF16(text, TOOL_RESULT_PREVIEW_HEAD)
  const noteFn = (omitted) => `\n\n… [middle omitted: ${omitted} chars] …\n\n`
  const tailLen = Math.min(TOOL_RESULT_PREVIEW_TAIL, TOOL_RESULT_PREVIEW - TOOL_RESULT_PREVIEW_HEAD - noteFn(text.length).length)
  const tail = safeSliceUTF16End(text, tailLen)
  return head + noteFn(Math.max(0, text.length - head.length - tail.length)) + tail
}

/** Offload-dir write-time self-cleanup retention window (2026-08-21): files older than 3 days are deleted on the next offload. */
export const TMP_RETENTION_MS = 3 * 24 * 3600 * 1000

/**
 * Best-effort write-time self-cleanup: delete files in dir whose mtime exceeds TMP_RETENTION_MS.
 * Subdirectories are never touched; every failure is silent — cleanup must not affect offload.
 */
export async function cleanupOldToolResults(dir) {
  const now = Date.now()
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return // dir missing or unreadable → nothing to clean
  }
  for (const entry of entries) {
    if (!entry.isFile()) continue // subdirectories untouched
    try {
      const st = await stat(join(dir, entry.name))
      if (now - st.mtimeMs > TMP_RETENTION_MS) await unlink(join(dir, entry.name))
    } catch {
      /* entry vanished concurrently or I/O error — best effort, keep going */
    }
  }
}

/** Offload a tool result / report to disk (§2.2): `force` = write regardless of size (async
 *  subagent reports must survive the parent turn). Rendering splits on the SAME constant as the old
 *  gate: ≤ TOOL_RESULT_OFFLOAD_LIMIT ⇒ body once + path (never dual-end — a short body would come
 *  out twice with `middle omitted: 0 chars`); > ⇒ dual-end preview + path. Writes self-clean first. */
export async function offloadToolResult(text, callId, dir = join(configDir, "tool-results"), { force = false } = {}) {
  const overLimit = text.length > TOOL_RESULT_OFFLOAD_LIMIT
  if (!force && !overLimit) return text
  try {
    await cleanupOldToolResults(dir)
    await mkdir(dir, { recursive: true })
    const file = join(dir, `${Date.now()}-${String(callId).replace(/[^a-zA-Z0-9_-]/g, "_")}.log`)
    await writeFile(file, text, "utf8")
    if (!overLimit) return `${text}\n\n[... full content saved to: ${file}\nPage through it with the read tool (offset/limit) if you need the full text later.]`
    return buildDualEndPreview(text) + `\n\n[... output too large (${text.length} chars total), full content saved to: ${file}\n` +
      `Page through it with the read tool (offset/limit) or sed -n 'START,ENDp' — do NOT re-run the tool blindly.]`
  } catch {
    // 写盘失败不吞报告：>LIMIT 走双端预览 + 原文案；≤LIMIT 正文整段在前（不谎称 truncated）
    const body = overLimit ? buildDualEndPreview(text) : text
    return body + (overLimit ? `\n\n[... truncated: ${text.length} chars total, offload to disk failed]`
      : `\n\n[... full text kept inline above (${text.length} chars), offload to disk failed]`)
  }
}
