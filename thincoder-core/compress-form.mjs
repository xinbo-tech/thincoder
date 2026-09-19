/**
 * compress-form.mjs — compression request form（CONTEXT-COMPACTION.md §6.14 / D-CC20 ·
 * 批次档 2026-09-18-compression-continuation §2.2）：会话续写形态。
 *
 * 压缩请求复用同会话回合请求的消息前缀（同一个 system + 中段「真身」消息），尾部附加指令一条。
 * 消费点（两处同形 · 同一构造）：① 压缩 = `context.mjs`（中段切点 = `splitHistory.tailStart`）；
 * ② 蒸馏 = `explore-distill.mjs`（切点 = 本 run 末块 `end` → §6.15）——两处均按引用原样携带中段，
 * 均不持声明面（`tools` / `systemPrompt` 由调用点经 extras 随带）。
 *
 * ⚠️ 缓存命中口径（v2 探针复测 2026-09-18 · 批次档 §5）：压缩形态**首现复用回合所建前缀**的条件 = 带 tools 声明
 * （**不带** `tool_choice`）且 `reasoning_effort` 同值——8 格 84–98%；不带 tools / 带 `tool_choice:"none"`（该参数使
 * 服务端丢弃 tools 区）/ effort 异值 ⇒ 首现 0%（自建项复跑命中为例外）。v2（设计档 §6.14 备选②）由**调用点**
 * （context.mjs）随带与回合请求同一数组的 `tools`；本模块只构消息序，不持声明面。
 *
 * 纯函数、零 import：指令文本由实参传入（SUMMARIZE_PROMPT 住 context.mjs——不反向 import，免成环）。
 * 中段消息按引用原样携带（不拷贝 / 不截断）；切点与摘要段同源（split.tailStart），不新增第二处切割判据。
 */
export function buildCompressMessages(history, tailStart, systemPrompt, instruction) {
  const messages = []
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt }) // 缺省（undefined）/ 空串 ⇒ 不带头（退化面 1）
  messages.push(...history.slice(0, tailStart))
  messages.push({ role: "user", content: instruction })
  return messages
}
