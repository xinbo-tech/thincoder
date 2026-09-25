/**
 * relay-prefix.mjs — relay 前缀（`role#id/`）文法**单一权威**（第 27 批——R-A2.3）。
 *
 * 零依赖（不 import 任何模块）——TUI（`src/tui/`）与 ACP（`src/acp/`）双向可导入，无环；
 * 生成侧 `src/agent/spawn-child.mjs` 再导出（枢纽）。文法 = 自
 * `src/tui/subagent-blocks.mjs` 逐字迁入（第 27 批——零语义改动）。
 */

/** `role#id/` prefix router — hyphen included since the eng-coder fix (2026-08-21). */
export const RELAY_PREFIX_RE = /^([\w-]+)#(\d+)\//

/** 嵌套 relay 前缀通用解析（循环解析任意深度——显示契约 docs/design/TUI.md §6）：
 *  `eng-coder#2/explore#1/read` → { head（块路由）, inner[], label（inner 链——R23：
 *  子块折叠键/外层 currentTool 全路径用）, rest }。
 *  单层 = inner[]/label ""——与既有单段匹配语义零改；无前缀 → null。 */
export function parseRelayPath(text) {
  const segments = []
  let rest = String(text)
  for (;;) {
    const m = rest.match(RELAY_PREFIX_RE)
    if (!m) break
    segments.push(`${m[1]}#${m[2]}`)
    rest = rest.slice(m[0].length)
  }
  if (segments.length === 0) return null
  return {
    head: segments[0],
    inner: segments.slice(1),
    label: segments.slice(1).join("/"),
    rest,
  }
}

/** 构造向单一实现（本批统一的两处构造点——`makeRelay` 与 async 取号分支共用；
 * 另两处字面构造（escalate/advisor async）不在本批声明面——批次档 §2 修正轮登记，如需收敛另批）：
 *  `relayPrefixOf("coder", 3)` → `"coder#3/"`。 */
export function relayPrefixOf(label, id) {
  return `${label}#${id}/`
}
