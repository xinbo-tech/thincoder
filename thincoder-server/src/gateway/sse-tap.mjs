/**
 * sse-tap.mjs — SSE 旁路只读扫描（KD-SV-10）：`data:` 行增量扫描 ∥ usage 提取 ∥ 有界缓冲。
 *
 * 中继字节面零改（forward.mjs 逐块原样转发）——本档只吃一份只读字节流（`feed` 逐块喂），
 * 不产出任何回写、不缓冲全流。单行上限 1 MiB：超限 ⇒ 弃该行扫描（中继不受影响）∥ 其后行照常续扫。
 * 容错：流首 BOM 剥除 ∥ CRLF 行尾（trim）∥ 非 `data:` 行 ∥ 非 JSON 行一律忽略（不抛）。
 * 提取 = `data:` 行 JSON 的 `usage` 三列原值（AC-3「逐值不加工」）——多次命中 ⇒ 末次胜出。
 */
export const TAP_MAX_LINE_BYTES = 1024 * 1024

const EMPTY = Buffer.alloc(0)
const LF = 0x0a
const CR = 0x0d
const BOM = [0xef, 0xbb, 0xbf]

/** usage 三列拾取（SSE 末帧 ∥ 非流式响应体共用）：`usage` 非对象 ⇒ null；缺位列 ⇒ null（原值直取）。 */
export function pickUsage(value) {
  const usage = value !== null && typeof value === "object" ? value.usage : null
  if (usage === null || typeof usage !== "object" || Array.isArray(usage)) return null
  return {
    promptTokens: usage.prompt_tokens ?? null,
    completionTokens: usage.completion_tokens ?? null,
    totalTokens: usage.total_tokens ?? null,
  }
}

/** 建 tap：`feed(chunk)` 增量喂入；`usage()` 取末次提取（无 ⇒ null）。 */
export function createUsageTap({ maxLineBytes = TAP_MAX_LINE_BYTES } = {}) {
  let line = EMPTY
  let abandoned = false
  let firstLine = true
  let usage = null

  const append = (part) => {
    if (abandoned || part.length === 0) return
    if (line.length + part.length > maxLineBytes) {
      abandoned = true // B6：弃该行扫描——行尾（LF）后恢复
      line = EMPTY
      return
    }
    line = line.length === 0 ? Buffer.from(part) : Buffer.concat([line, part])
  }

  const finishLine = () => {
    const raw = line
    line = EMPTY
    const wasFirst = firstLine
    firstLine = false
    if (abandoned) {
      abandoned = false
      return
    }
    let body = raw
    if (wasFirst && body.length >= 3 && body[0] === BOM[0] && body[1] === BOM[1] && body[2] === BOM[2]) {
      body = body.subarray(3) // 流首 BOM 剥除（B5）
    }
    if (body.length > 0 && body[body.length - 1] === CR) body = body.subarray(0, body.length - 1) // CRLF 容错
    if (body.length === 0) return
    const text = body.toString("utf8")
    if (!text.startsWith("data:")) return
    const payload = text.slice(5).trim() // 规范单空格 + 行尾空白容错
    if (payload === "" || payload === "[DONE]") return
    let parsed
    try {
      parsed = JSON.parse(payload)
    } catch {
      return // 非 JSON 行忽略（不抛）
    }
    const picked = pickUsage(parsed)
    if (picked) usage = picked
  }

  return {
    feed(chunk) {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      let start = 0
      while (start < buf.length) {
        const nl = buf.indexOf(LF, start)
        if (nl === -1) {
          append(buf.subarray(start))
          return
        }
        append(buf.subarray(start, nl))
        finishLine()
        start = nl + 1
      }
    },
    usage: () => usage,
  }
}
