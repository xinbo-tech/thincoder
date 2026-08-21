/**
 * escape.mjs — 中和 OpenAI 兼容服务端在 message content 内做的非标二次转义解析。
 *
 * 某些服务端（Kimi 等）会把 content 里的字面 "\x" / "\u" 当作 hex escape 再解释一遍，
 * 遇到 "\x" 后不足 2 个 hex（或 "\u" 后不足 4 个 hex）时服务端报
 * "unexpected end of hex escape" → 400（首次观察于 2026-08-06，见 advisor.mjs 历史）。
 *
 * 对策：把这类"一旦被服务端二次展开就会非法"的字面序列提前 double 成 "\\x" / "\\u"，
 * 服务端二次解析后还原为字面量；合法完整的 "\xNN" / "\uNNNN" 原样放过（它们能展开成
 * 一个字节/码点）。JSON.stringify 层面的反斜杠转义由发送方负责，本模块不碰。
 */

/** 中和单段文本里的非法字面转义序列。 */
export function escapeLiteralEscapes(text) {
  text = String(text ?? "")
  return text
    // (?<!\\) — 只有单个反斜杠才处理（"\\x" 已经是 double 的，必须原样放过）
    // 前瞻：\x 后至少 2 个 hex 视为合法（服务端只展开前两个），只有不足 2 个的才 double
    .replace(/(?<!\\)\\(x)(?![0-9a-fA-F]{2})/g, "\\\\$1")
    .replace(/(?<!\\)\\(u)(?![0-9a-fA-F]{4})/g, "\\\\$1")
}

/** 对单条消息的 content 应用 escapeLiteralEscapes（支持字符串或 OpenAI 多模态 part 数组）。 */
export function escapeMessageContent(message) {
  const content = message?.content
  if (typeof content === "string") {
    return { ...message, content: escapeLiteralEscapes(content) }
  }
  if (Array.isArray(content)) {
    let changed = false
    const parts = content.map((p) => {
      if (p && typeof p === "object" && p.type === "text" && typeof p.text === "string") {
        const escaped = escapeLiteralEscapes(p.text)
        if (escaped !== p.text) {
          changed = true
          return { ...p, text: escaped }
        }
      }
      return p
    })
    return changed ? { ...message, content: parts } : message
  }
  return message
}

/** 对整个 messages 数组逐条应用 escapeMessageContent。 */
export function escapeMessages(messages) {
  return messages.map(escapeMessageContent)
}