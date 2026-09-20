/**
 * session-segments.mjs — 记录存储的段文件原语 + 人读线条目形态（TUI-OOM-ROOTCAUSE 批）。
 *
 * 机制契约全文 = docs/core/design/SESSION.md §6.14（D2 单一权威源）；本文件 = 「段 IO + 条目
 * 形态」叶子层（`session-store.mjs` 拆分产物——503+ 行越 500 硬限，§14.5 表列模块按职责
 * 拆分；store 继续 re-export 全部公开名，调用面零改）。零项目内依赖（仅 `node:`）。
 */

import { readdirSync, readFileSync } from "node:fs"

/** 常量单源（§14.3.2）：每段消息数 / sidecar 目录后缀。 */
export const RECORD_SEG_MESSAGES = 100
export const RECORD_DIR_SUFFIX = ".d"

/** 观测计数（测试缝——AC-RS9「恢复只读末段」以段读次数断言）。 */
export const _storeStats = { segmentReads: 0, segmentWrites: 0, appendedEntries: 0, catchUpRetries: 0 }

const LEGACY_TRANSIENT_PREFIXES = [
  "[System reminder: working directory snapshot:",
  "[Relevant memories from previous sessions",
]

/** legacy transient 判定（旧进程写进人读线的机器注入——落盘/展示均跳过）。 */
export function isLegacyTransient(m) {
  return (
    m?.role === "user" &&
    typeof m.content === "string" &&
    LEGACY_TRANSIENT_PREFIXES.some((p) => m.content.startsWith(p))
  )
}

/** Slim the HUMAN line for storage（自 session.mjs 迁出——§14.5）：机器线（contextHistory）
 *  逐字节保持。Copy-on-write ONLY（两线经 pushReal 共享对象引用）：tool args → 300 字符头
 *  截断 / tool content → 500 / 多模态 user → 保留 text、丢 image_url。 */
export function slimForDisplay(m) {
  if (m && Array.isArray(m.content)) {
    const textParts = m.content.filter((p) => p?.type !== "image_url")
    if (textParts.length === m.content.length) return m
    return { ...m, content: textParts }
  }
  if (m && m.role === "assistant" && Array.isArray(m.tool_calls)) {
    let changed = false
    const tool_calls = m.tool_calls.map((tc) => {
      const args = tc.function?.arguments
      if (typeof args === "string" && args.length > 300) {
        changed = true
        return { ...tc, function: { ...tc.function, arguments: args.slice(0, 300) + "…" } }
      }
      return tc
    })
    return changed ? { ...m, tool_calls } : m
  }
  if (m && m.role === "tool" && typeof m.content === "string" && m.content.length > 500) {
    return { ...m, content: m.content.slice(0, 500) + "\n… (truncated for storage)" }
  }
  return m
}

/** 记录条目过滤（与 saveSession 同源）：transient 机器注入与 legacy-transient 前缀不进记录。 */
export function shouldAppend(m) {
  return !!m && typeof m === "object" && !m.transient && !isLegacyTransient(m)
}

/** 真实 user 消息（turnCount/firstMessage 口径——同 session-slots.extractSlotMeta）。
 *  单源 = `history-window.mjs`（本档只 re-export 保既有消费面：session-store 等）。 */
export { isRealUserMsg } from "./history-window.mjs"

/** sidecar 目录路径（`{slot 文件路径}.d`——同目录同前缀）。 */
export function recordDirOf(slotFile) { return slotFile + RECORD_DIR_SUFFIX }

/** 段文件名（六位零填充）。 */
export function segName(n) { return `seg-${String(n).padStart(6, "0")}.jsonl` }

/** 段号升序表（readdir——不读内容）。 */
export function listSegments(dir) {
  let names
  try { names = readdirSync(dir) } catch { return [] }
  const out = []
  for (const n of names) {
    const m = /^seg-(\d+)\.jsonl$/.exec(n)
    if (m) out.push(Number(m[1]))
  }
  return out.sort((a, b) => a - b)
}

/** 读段（原始行——去尾空行）；读失败按空段容忍（读路径尽力面）。 */
export function readSegmentLines(path) {
  _storeStats.segmentReads++
  let text
  try { text = readFileSync(path, "utf8") } catch { return [] }
  const lines = text.split("\n")
  if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop()
  return lines
}

/** 逐行容错解析：半行/损坏行 → undefined（调用方跳过——不抛、不自动修复）。 */
export function tryParse(line) {
  try { return JSON.parse(line) } catch { return undefined }
}
