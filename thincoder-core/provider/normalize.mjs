/**
 * provider/normalize.mjs — pre-send payload normalization (2026-08-31 extract).
 *
 * Split from core.mjs (TODO #2: 420 lines, past the 300 advisory). These two
 * pure functions sanitize the message array right before it hits the wire;
 * no dependency on chat()/retry logic. core.mjs re-exports them so
 * provider/index.mjs and tool-pairing.test.mjs keep their import paths.
 * The caller passes the spec (providerSpec from core.mjs — provider-aware).
 */

const RASTER_IMAGE_URL = /^data:image\/(png|jpe?g|gif|webp);base64,/

/** 历史图片累计字节预算（D-PR32——40MB 级请求体的保守下界，留两张大图余量；可调）。 */
export const IMAGE_HISTORY_BYTES_BUDGET = 32 * 1024 * 1024

/** 图片驱逐占位文本（D-PR32 逐字）。 */
const IMAGE_BUDGET_PLACEHOLDER = "[image omitted — dropped to keep the request under the history image budget]"

/** 单 part 的 base64 载荷长度（仅 data URL；非 data 引用不过请求体、零计账）。 */
function imagePartBytes(p) {
  if (p?.type !== "image_url") return 0
  const url = p.image_url?.url
  if (typeof url !== "string" || !url.startsWith("data:")) return 0
  const comma = url.indexOf(",")
  return comma >= 0 ? url.length - comma - 1 : 0
}

/**
 * 历史图片累计字节预算（D-PR32）：全部 image part 的 base64 载荷和超 budgetBytes 时，
 * 从**最老**图起替换为占位文本，直到剩余 ≤ 预算。纯函数 + 拷贝语义（未改动时返回原引用；
 * 改动时仅重建涉及的消息对象）——发送前对消息副本用；注入面对 `history` 本体回写（同函数同预算）。
 * @param {Array} messages
 * @param {number} [budgetBytes]
 */
export function capHistoryImages(messages, budgetBytes = IMAGE_HISTORY_BYTES_BUDGET) {
  if (!Array.isArray(messages)) return messages
  const hits = []
  let total = 0
  for (let mi = 0; mi < messages.length; mi++) {
    const parts = messages[mi]?.content
    if (!Array.isArray(parts)) continue
    for (let pi = 0; pi < parts.length; pi++) {
      const bytes = imagePartBytes(parts[pi])
      if (bytes <= 0) continue
      total += bytes
      hits.push({ mi, pi, bytes })
    }
  }
  if (total <= budgetBytes || hits.length === 0) return messages
  const drop = new Set()
  let remaining = total
  for (const hit of hits) {
    if (remaining <= budgetBytes) break
    drop.add(`${hit.mi}:${hit.pi}`)
    remaining -= hit.bytes
  }
  return messages.map((m, mi) => {
    const parts = m?.content
    if (!Array.isArray(parts)) return m
    let changed = false
    const next = parts.map((p, pi) => {
      if (!drop.has(`${mi}:${pi}`)) return p
      changed = true
      return { type: "text", text: IMAGE_BUDGET_PLACEHOLDER }
    })
    return changed ? { ...m, content: next } : m
  })
}

export function stripImagesForTextModel(messages, spec) {
  let changed = false
  const out = messages.map((m) => {
    if (!Array.isArray(m.content) || !m.content.some((p) => p?.type === "image_url")) return m
    let msgChanged = false
    const parts = m.content.map((p) => {
      if (p?.type !== "image_url") return p
      const url = p.image_url?.url || ""
      if (!url.startsWith("data:")) return p
      if (spec.multimodal && RASTER_IMAGE_URL.test(url)) return p
      msgChanged = true
      const reason = spec.multimodal
        ? `unsupported format ${url.match(/^data:([^;,]+)/)?.[1] || "unknown"}`
        : "this model does not support image input"
      return { type: "text", text: `[image omitted — ${reason}]` }
    })
    if (!msgChanged) return m
    changed = true
    return { ...m, content: parts }
  })
  return changed ? out : messages
}

/**
 * Enforce the OpenAI tool-message protocol on the outgoing payload: every tool message must
 * immediately follow the assistant message declaring its tool_call_id, and every declared
 * tool_call must have a result. Strict providers (DeepSeek) reject the whole request with 400
 * ("Messages with role 'tool' must be a response to a preceding message with 'tool_calls'").
 * History can legitimately violate this — parallel read_image injects a user message between
 * tool results, compaction splits, interrupted sessions leave dangling tool_calls — so sanitize
 * at send time. History itself is left untouched.
 */
export function normalizeToolPairing(messages) {
  // Detach all tool messages; reinsert each right after its owner assistant.
  const toolById = new Map()
  const rest = []
  for (const m of messages) {
    if (m.role === "tool") {
      if (!toolById.has(m.tool_call_id)) toolById.set(m.tool_call_id, m)
    } else {
      rest.push(m)
    }
  }
  if (toolById.size === 0 && !messages.some((m) => m.role === "assistant" && m.tool_calls?.length)) {
    return messages // no tool messages AND no tool_calls declared — nothing to enforce
  }
  const out = []
  for (const m of rest) {
    out.push(m)
    if (m.role !== "assistant" || !m.tool_calls?.length) continue
    for (const tc of m.tool_calls) {
      const t = toolById.get(tc.id)
      if (t) {
        toolById.delete(tc.id)
        out.push(t)
      } else {
        // Declared tool_call with no recorded result (interrupted session / compaction split)
        out.push({
          role: "tool",
          tool_call_id: tc.id,
          content: "[Tool result missing: the call was interrupted or its result was dropped by context compaction]",
        })
      }
    }
  }
  // Leftovers in toolById are orphans (owner assistant compacted away or never recorded) — dropped
  return out
}

