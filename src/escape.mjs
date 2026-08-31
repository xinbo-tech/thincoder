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

/** 中和单段文本里的非法字面转义序列。
 *  Known limitation (documented, accepted, VS Code port parity): an ODD backslash
 *  run of 3+ (e.g. "\\\x") leaves the trailing "\x" un-doubled — vanishingly rare
 *  in real conversation text (no such hit in the 2026-08-31 repro session). */
export function escapeLiteralEscapes(text) {
  text = String(text ?? "")
  return text
    // (?<!\\) — 只有单个反斜杠才处理（"\\x" 已经是 double 的，必须原样放过）
    // 前瞻：\x 后至少 2 个 hex 视为合法（服务端只展开前两个），只有不足 2 个的才 double
    .replace(/(?<!\\)\\(x)(?![0-9a-fA-F]{2})/g, "\\\\$1")
    .replace(/(?<!\\)\\(u)(?![0-9a-fA-F]{4})/g, "\\\\$1")
}

/** 对单条消息的 content 应用 escapeLiteralEscapes（支持字符串或 OpenAI 多模态 part 数组）。
 *  2026-08-31 会诊 F5：deepseek-v4-flash 网关对 tool_calls[].function.arguments 与
 *  reasoning_content 做同样的非标二次转义解析（字面 \x/\u 经工具参数/思考回传 → 400，
 *  列号确定性复现 = 毒序列在 content 之外）——这两个字符串字段同样需要中和。 */
export function escapeMessageContent(message) {
  const content = message?.content
  let changed = false
  let next = message
  if (typeof content === "string") {
    const escaped = escapeLiteralEscapes(content)
    if (escaped !== content) {
      next = { ...next, content: escaped }
      changed = true
    }
  } else if (Array.isArray(content)) {
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
    if (changed) next = { ...next, content: parts }
  }
  if (Array.isArray(next.tool_calls)) {
    let tcChanged = false
    const tool_calls = next.tool_calls.map((tc) => {
      const args = tc?.function?.arguments
      if (typeof args === "string") {
        const escaped = escapeLiteralEscapes(args)
        if (escaped !== args) {
          tcChanged = true
          return { ...tc, function: { ...tc.function, arguments: escaped } }
        }
      }
      return tc
    })
    if (tcChanged) {
      next = { ...next, tool_calls }
      changed = true
    }
  }
  if (typeof next.reasoning_content === "string") {
    const escaped = escapeLiteralEscapes(next.reasoning_content)
    if (escaped !== next.reasoning_content) {
      next = { ...next, reasoning_content: escaped }
      changed = true
    }
  }
  return changed ? next : message
}

/** IKBGX4 (2026-08-28)：剥离仅本地使用的整消息标记字段（transient 等）——发送给 provider 前移除。
 * 严格 OpenAI 兼容服务端（opencode/LiteLLM 等）会拒绝消息级未知 key
 * （"Extra inputs are not permitted, field: 'messages[i].transient'"）。 */
export function stripLocalMessageFields(messages) {
  return messages.map((m) => {
    if (m && typeof m === "object" && "transient" in m) {
      const { transient, ...rest } = m
      return rest
    }
    return m
  })
}

/** 对整个 messages 数组逐条应用 escapeMessageContent（先剥离本地字段，再转义）。 */
export function escapeMessages(messages) {
  return stripLocalMessageFields(messages).map(escapeMessageContent)
}