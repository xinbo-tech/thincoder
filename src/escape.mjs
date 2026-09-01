/**
 * escape.mjs — 中和 OpenAI 兼容服务端在 message content 内做的非标二次转义解析。
 *
 * 某些服务端（Kimi、DeepSeek 等）会把 content 里的字面 "\x" / "\u" 当作 hex escape 再解释一遍，
 * 遇到 "\x" 后不足 2 个 hex（或 "\u" 后不足 4 个 hex）时服务端报
 * "unexpected end of hex escape" → 400（首次观察于 2026-08-06；2026-09-01 messages[483].content
 * 在 deepseek 系列 400 复现——大上下文会话讨论转义话题后必然踩中）。
 *
 * 对策：把这类"一旦被服务端二次展开就会非法"的字面序列替换为合法 hex 序列（\x5Cu / \x5Cx），
 * 服务端二次解析后还原为字面量；合法完整的 "\xNN" / "\uNNNN" 原样放过。
 */

/** 中和单段文本里的非法字面转义序列。
 *  2026-09-02 v4（根治——替换策略，推翻 v1-v3 的 double 方案）：
 *  **网关语义实锤**（core.mjs:306 既有注释 + 2026-09-02 真机）：deepseek/Kimi 网关把 body 当纯文本
 *  扫 \\u/\\x（字面反斜杠+u/x——JSON 转义对形式）——**不看前置反斜杠**。因此 v1-v3 的
 *  "double 反斜杠"全部无效——多少反斜杠网关都命中最后的 \ + u 相邻对。
 *  **v4 = 替换策略**：所有字面 \u（0x5C+'u'）+ 不足 4 hex → 替换为 \x5Cu（反斜杠的 hex
 *  转义 + u）——网关扫 \\x + 5C（合法 2 hex）→ 二次解析展开为 \ + u 字面（还原原文语义），
 *  不炸。同理 \x + 不足 2 hex → \x5Cx。合法完整 \uXXXX/\xNN 原样放行。
 *  证据：当前会话 823 条 v3 后 body 746 处毒；v4 替换策略 body 0 毒；deepseek 真机 200。 */
export function escapeLiteralEscapes(text) {
  text = String(text ?? "")
  return text
    // \u + 不足 4 hex → \x5Cu（反斜杠 hex 转义 + u——网关展开为 \ + u 字面）
    .replace(/\\u(?![0-9a-fA-F]{4})/g, "\\x5Cu")
    // \x + 不足 2 hex → \x5Cx
    .replace(/\\x(?![0-9a-fA-F]{2})/g, "\\x5Cx")
}

/** 对单条消息的 content 应用 escapeLiteralEscapes（支持字符串或 OpenAI 多模态 part 数组）。
 *  2026-08-31 会诊 F5：deepseek-v4-flash 网关对 tool_calls[].function.arguments 与
 *  reasoning_content 做同样的非标二次转义解析（字面 \\x/\\u 经工具参数/思考回传 → 400，
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
