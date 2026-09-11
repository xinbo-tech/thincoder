/**
 * digest-budget.mjs — digest 注入批量预算单源（群 B 批 B5——AGENT-LOOP.md（VSC 仓）§16 /
 * CLI §22 语义源：BATCH-3-STRUCTURE F-2 扩面）。原预算块居 subagent-async.mjs——只有
 * subagent 族经该入口，advisor / escalate / consult 三族注入器绕过 ⇒ 多族条目同轮合并注入
 * 时可累计超限（F-2 原始事故面 1.3MB 请求体）。本档把常量 / 判超 / 记账 / 落盘四处合一
 * （D2 单源），四族注入器统一接线（D-DG2）。
 *
 * 契约（D-DG1 三导出——VSC 面）：
 * - `DIGEST_INJECT_BUDGET`（64×1024——与 offload 单条预览同量级）；
 * - `digestBudgetOver(history, size)`——判超 + 记账：`used > 0 && used + size > BUDGET`
 *   首条豁免保留（单条大报告 >64K 走 offload 预览照旧——预算只约束轮累计）；轮界定
 *   `history.length !== r.len + 1` 语义逐字迁入（相邻注入间 history 无其他落史 = 同轮；每次
 *   注入 pushReal 恰 +1——他人落史 = 新请求窗口 → 预算复位）；键 = history 对象（会话级载体）。
 * - `persistOverflowReport(raw, { cwd, tag })`——超限条目全量落盘（`<cwd>/.thincoder/tmp`——
 *   offloadToolResult 同目录约定；落盘名 `tool-<ts><rand>-<tag>.txt`（tag = 溯源标签：写入族
 *   + 条目 id））。返回清单行文本（inline = 仅此——不 inline 全文；文案与 CLI 逐字一致）；
 *   落盘失败 → null（调用方回退常规 inline 路径——offload 同款「失败不吞报告」语义）。
 *
 * 计数口径（D-DG3）：计入预算的 raw = 报告 / 错误正文（不含 `[System reminder: …]` 标签行
 * ——与既有 subagent 口径一致）；错误条目同计同落盘。
 *
 * 模块图：只 import node:fs / node:path——叶子级；subagent-async / advisor-async /
 * subagent-escalate-async / consult 四族单向 import 本档（模块图无环）。
 */
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"

export const DIGEST_INJECT_BUDGET = 64 * 1024 // 64K——与 offload 单条预览同量级

// 轮记账：history 载体 → { len, used }（逐字自 subagent-async.mjs 迁入——语义零变）。
const digestRounds = new Map()
function digestRoundFor(history) {
  const r = digestRounds.get(history)
  if (!r || history.length !== r.len + 1) {
    const fresh = { len: history.length, used: 0 }
    digestRounds.set(history, fresh)
    return fresh
  }
  r.len = history.length
  return r
}

/** 判超 + 记账（size = 原始正文字符数——标签行不计；先判后记：首条恒豁免）。 */
export function digestBudgetOver(history, size) {
  const round = digestRoundFor(history)
  const over = round.used > 0 && round.used + size > DIGEST_INJECT_BUDGET
  round.used += size
  return over
}

/** 超限条目全量落盘（返回清单行文本；失败 null——调用方回退 inline——结果零丢失）。
 *  tag 入文件名后缀（溯源：写入族 + 条目 id；非法文件名字符归一 `_`）。 */
export function persistOverflowReport(raw, { cwd, tag }) {
  try {
    const dir = join(cwd ?? process.cwd(), ".thincoder", "tmp")
    mkdirSync(dir, { recursive: true })
    const suffix = String(tag ?? "report").replace(/[^a-zA-Z0-9#_-]/g, "_")
    const file = join(dir, `tool-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}-${suffix}.txt`)
    writeFileSync(file, raw, "utf8")
    return `Report saved to disk (digest inject budget exceeded — full text not inlined): ${file}\nRead it with the read tool (offset/limit).`
  } catch (e) {
    console.warn(`[digest] report persist failed — falling back to inline (report not lost): ${e.message}`)
    return null
  }
}
