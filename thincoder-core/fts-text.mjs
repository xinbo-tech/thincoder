/**
 * fts-text.mjs — FTS5 语言面单一来源（会话索引批 · SESSION.md §6.19 D-SE44）。
 *
 * `segmentCJK` / `buildFtsQuery` 自 `memory/schema.mjs` / `memory/core.mjs` **外提**为本叶子档
 * （两档 re-export 保名面——零行为变更）：理由 = 会话索引不得把 memory 模块链拉进
 * `read_history` 的装配装载面（W8 契约②）+ 机制单源（D2——写入侧与查询侧同一处理）。
 * 消费者 = memory 面（写入 / 检索）+ 会话索引面（`session-index.mjs` / `session-index-build.mjs`）。
 *
 * 零项目内依赖（仅 `node:`）——叶子档，可被任意装配面静态 import。
 */

/** 查询词元上限（超限截断——`buildFtsQuery` 单源）。 */
export const FTS_TOKEN_MAX = 16

/**
 * CJK 逐字间隔：让 unicode61 把汉字 / 假名 / 谚文逐字当作独立 token。
 * 写入与查询两侧必须用同一处理才可召回（两字词如「分号」→「分 号」短语仍命中；ASCII 保持整词）。
 */
export function segmentCJK(text) {
  return text.replace(
    /[぀-ヿ㐀-䶿一-鿿豈-﫿가-힯]+/g,
    (run) => [...run].join(" "),
  )
}

/**
 * 构造 FTS5 查询：先按空白 / 标点切 token，再对每个 token 做 CJK 逐字分段。
 * 多字 CJK 词保持为 FTS5 短语（「分号」→「分 号」→ 短语查询，邻接精确匹配），
 * 不同 token 以 OR 连接（「命名 规范」→「命 名」OR「规 范」，各自短语要求自身邻接）。
 * 无 token ⇒ 返回空串（消费侧据此退化——SESSION.md §6.19 边界情形表）。
 */
export function buildFtsQuery(query) {
  const terms = query
    .split(/[\s,，。、;；!！?？()（）"`]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, FTS_TOKEN_MAX)
    .map((t) => segmentCJK(t))
  if (terms.length === 0) return ""
  return terms.map((t) => `"${t.replaceAll('"', '""')}"`).join(" OR ")
}
