/**
 * escape.mjs — 中和 OpenAI 兼容服务端在 message content 内做的非标二次转义解析。
 *
 * 某些服务端（Kimi、DeepSeek 等）会把 content 里的字面 "\\x" / "\\u" 当作 hex escape 再解释一遍，
 * 遇到 "\\x" 后不足 2 个 hex（或 "\\u" 后不足 4 个 hex）时服务端报
 * "unexpected end of hex escape" → 400（首次观察于 2026-08-06；2026-09-01 messages[483].content
 * 在 deepseek 系列 400 复现——大上下文会话讨论转义话题后必然踩中）。
 *
 * 对策：把这类"一旦被服务端二次展开就会非法"的字面序列提前 double 成 "\\x" / "\\u"，
 * 服务端二次解析后还原为字面量；合法完整的 "\\xNN" / "\\uNNNN" 原样放过（它们能展开成
 * 一个字节/码点）。JSON.stringify 层面的反斜杠转义由发送方负责，本模块不碰。
 */

/** 中和单段文本里的非法字面转义序列。
 *  2026-09-01 v2（修复 Known limitation）：v1 的 lookbehind 只看前 1 个字符——反斜杠
 *  run ≥2 时（如文本 "\\\u" 三反斜杠+u）整体放行，但服务端二次解析剥掉 JSON 层转义后
 *  剩余的字面 "\u 后不足 hex" 仍会 400（messages[483].content 实证——大上下文会话
 *  讨论转义话题后必然踩中，"vanishingly rare" 的假设被长会话推翻）。
 *  v2 改为**数反斜杠 run 的奇偶**：偶数个反斜杠（含 0）后的 \x/\u 若 hex 不足则补倍；
 *  奇数个则该 \x/\u 已被前导反斜杠转义、原样放行——数学上严格等价于服务端二次解析的层剥。
 *  附带：孤立代理对（\uD800-\uDFFF 无配对）虽是"合法 4 hex"，但 strict JSON 解析器
 *  拒绝 → 同样预 double。 */
export function escapeLiteralEscapes(text) {
  text = String(text ?? "")
  // 单遍扫描：在每个 \x / \u 处向前数连续反斜杠个数，奇偶决定是否需要 double
  let out = ""
  let i = 0
  const n = text.length
  while (i < n) {
    const ch = text[i]
    if (ch !== "\\") { out += ch; i++; continue }
    const start = i
    // 数这个反斜杠 run 的长度
    let run = 0
    while (i + run < n && text[i + run] === "\\") run++
    const next = text[i + run]
    // 层剥语义：服务端第一层 JSON.parse 吃掉 1 个反斜杠 → 剩 run-1 个；二次解析按剩余 run 的奇偶：
    // 剩偶数（原 run 奇数）→ \x/\u 裸露被当 escape 解析 → hex 不足即炸 → 需预 double；
    // 剩奇数（原 run 偶数）→ \x/\u 已被前导 \ 转义为字面 → 安全放行。
    if ((next === "x" || next === "u") && run % 2 === 1) {
      // 偶数个反斜杠后的字面 \x/\u：服务端二次解析后会剩下奇数个反斜杠 + 该转义 → 需要预 double
      const need = next === "u" ? 4 : 2
      const after = text.slice(i + run + 1, i + run + 1 + need)
      const isComplete = new RegExp(`^[0-9a-fA-F]{${need}}$`).test(after)
      let needsDouble = !isComplete
      if (!needsDouble && next === "u") {
        // 合法完整 \uXXXX：孤立代理对（D800-DFFF 无配对）在 strict JSON.parse 仍会炸 → 预 double。
        // 高代理（D800-DBFF）向后找低代理配对；低代理（DC00-DFFF）向前找高代理配对。
        const cp = parseInt(after, 16)
        if (cp >= 0xd800 && cp <= 0xdfff) {
          const seqStart = i + run + 1 // 'u' 之后 hex 起点即 i+run+1，转义全文 = \uXXXX
          const isHigh = cp <= 0xdbff
          const partnerRe = /^\\u[0-9a-fA-F]{4}/
          const partnerAfter = text.slice(seqStart + 4, seqStart + 4 + 6) // hex 尾后 6 字符（\uXXXX）
          const partnerBefore = text.slice(Math.max(0, start - 6), start) // 序列前 6 字符
          const paired = isHigh
            ? partnerRe.test(partnerAfter)
            : /(?:^|[^\\])\\u([0-9a-fA-F]{4})$/.test(partnerBefore) &&
              (() => { const c = parseInt(RegExp.lastMatch.slice(-4), 16); return c >= 0xd800 && c <= 0xdbff })()
          if (!paired) needsDouble = true
        }
      }
      // 输出：needsDouble → 序列前插 1 个反斜杠（run+1），hex 残尾**原样保留并重新扫描**——
      // ⚠️ 残尾里可能紧邻下一个转义序列（实测 "\x/\u"：x 的 hex 窗口 "/\u" 越界，
      // 若按窗口消费会把 u 的反斜杠吞掉，u 毒性保留）。因此 needsDouble 只消费 run+2 字符。
      // 放行（合法完整）→ 输出全序列并消费 run+1+need。
      const consume = needsDouble ? run + 1 : run + 1 + need
      out += (needsDouble ? "\\" : "") + text.slice(start, i + run + 1 + (needsDouble ? 0 : need))
      i += consume
      continue
    }
    // 其余（奇数 run 的已转义序列 / 非 x-u 起始字符）：run 原样拷贝
    out += "\\".repeat(run)
    i += run
  }
  return out
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
