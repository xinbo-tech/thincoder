/**
 * escape.mjs — 中和 OpenAI 兼容服务端在 message content 内做的非标二次转义解析 + 孤立代理净化。
 *
 * 两个独立毒源（均真机实证）：
 *
 * ① 字面 hex 转义二次解析（2026-08-06 Kimi 首观察）：Kimi/deepseek 等网关会把 content 里的字面
 *    "\x5Cx" / "\x5Cu" 当作 hex escape 再解释一遍，不足位时 400（"unexpected end of hex escape"）。
 *    对策：不足位序列前 double 反斜杠（\\x5CxNN 形态还原为字面量）；合法完整序列放行。
 *    Known limitation（2026-09-01 v3 修复）：反斜杠 run ≥3 时（如 "\\\x5Cu" 三反斜杠+u）v1 的
 *    lookbehind 只看前 1 字符会整体放行，但二次解析按配对消费后尾部的 \x5Cu 仍裸露 → 炸。
 *    修复：按 run 奇偶判断——run 为奇数时尾部的 \x5Cu/\x5Cx 裸露（需 double），偶数已配对（放行）。
 *
 * ② 孤立 UTF-16 代理对（2026-09-02 deepseek 真机实锤）：content 里的**真实孤立代理字符**
 *    （高代理 U+D800-DBFF 无低代理跟随，或低代理 U+DC00-DFFF 无高代理前置）——JSON.stringify
 *    输出 \ud83d（合法 JSON），但 deepseek 解析器严格 UTF-16 解码，孤立代理 → 400
 *    （"unexpected end of hex escape" / "lone leading surrogate in hex escape"）。
 *    来源实证：doc_search 结果预览 `slice(0, N)` 按 UTF-16 码元截断，emoji 🔴（代理对）恰在
 *    截断边界被切成孤立高代理 → 注入 system reminder → 每轮发送 → deepseek 400。
 *    对策：发送前把孤立代理替换为  U+FFFD（任何来源安全兜底）；源头截断点另修 UTF-16 安全切。
 */

/** 中和非法字面 hex 转义序列（毒源①）。 */
export function escapeLiteralEscapes(text) {
  text = String(text ?? "")
  let out = ""
  let i = 0
  const n = text.length
  while (i < n) {
    const ch = text[i]
    if (ch !== "\\") { out += ch; i++; continue }
    // 数反斜杠 run 长度
    let run = 0
    while (i + run < n && text[i + run] === "\\") run++
    const next = text[i + run]
    if ((next === "x" || next === "u") && run % 2 === 1) {
      // run 奇数 → 二次解析配对消费后尾部 \x5Cx/\x5Cu 裸露——hex 不足则网关炸 → 前插反斜杠 double
      const need = next === "u" ? 4 : 2
      const after = text.slice(i + run + 1, i + run + 1 + need)
      if (!new RegExp(`^[0-9a-fA-F]{${need}}$`).test(after)) {
        out += "\\".repeat(run + 1) + next
        i += run + 1
        continue
      }
      // 合法完整：输出全序列并跳过（hex 尾不重新扫描）
      out += text.slice(i, i + run + 1 + need)
      i += run + 1 + need
      continue
    }
    out += "\\".repeat(run)
    i += run
  }
  return out
}

/** 净化孤立 UTF-16 代理对（毒源②）：高代理无低代理跟随 / 低代理无高代理前置 → 替换为 。 */
export function sanitizeLoneSurrogates(text) {
  text = String(text ?? "")
  let out = ""
  let i = 0
  const n = text.length
  while (i < n) {
    const cp = text.charCodeAt(i)
    if (cp >= 0xd800 && cp <= 0xdbff) {
      const next = text.charCodeAt(i + 1)
      if (next >= 0xdc00 && next <= 0xdfff) { out += text[i] + text[i + 1]; i += 2; continue }
      out += ""; i++; continue // 孤立高代理
    }
    if (cp >= 0xdc00 && cp <= 0xdfff) { out += ""; i++; continue } // 孤立低代理
    out += text[i]; i++
  }
  return out
}

/** 发送前文本净化总入口：hex 转义中和 + 孤立代理净化。 */
export function sanitizeText(text) {
  return sanitizeLoneSurrogates(escapeLiteralEscapes(text))
}

/** 对单条消息的 content 应用 sanitizeText（支持字符串或 OpenAI 多模态 part 数组）。
 *  2026-08-31 会诊 F5：deepseek-v4-flash 网关对 tool_calls[].function.arguments 与
 *  reasoning_content 做同样的非标二次转义解析（字面 \\x5Cx/\\x5Cu 经工具参数/思考回传 → 400，
 *  列号确定性复现 = 毒序列在 content 之外）——这两个字符串字段同样需要中和。 */
export function escapeMessageContent(message) {
  const content = message?.content
  let changed = false
  let next = message
  if (typeof content === "string") {
    const escaped = sanitizeText(content)
    if (escaped !== content) {
      next = { ...next, content: escaped }
      changed = true
    }
  } else if (Array.isArray(content)) {
    const parts = content.map((p) => {
      if (p && typeof p === "object" && p.type === "text" && typeof p.text === "string") {
        const escaped = sanitizeText(p.text)
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
        const escaped = sanitizeText(args)
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
    const escaped = sanitizeText(next.reasoning_content)
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
