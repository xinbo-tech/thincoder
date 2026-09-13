/**
 * digest-budget.mjs — digest 注入批量预算单源（群 B 批 B5——AGENT-LOOP.md §22 语义源）。
 * 原预算块居 subagent-async.mjs（只覆盖经 injectAsyncResult 的三族：subagent / advisor /
 * escalate），consult 族注入器（injectConsultResult）绕过 ⇒ 多族条目同轮合并注入时可累计
 * 超限（BATCH-3-STRUCTURE F-2 原始事故面 1.3MB 请求体）。本档把常量 / 判超 / 记账 / 落盘
 * 四处合一（D2 单源）+ 四族全接线（D-DG2）。
 *
 * 契约（D-DG1 三导出——CLI 面）：
 * - `DIGEST_INJECT_BUDGET`（64×1024——与 offload 单条预览同量级）；
 * - `digestBudgetOver(agent, size)`——判超 + 记账：`used > 0 && used + size > BUDGET`
 *   首条豁免保留（单条大报告 >64K 走 offload 预览照旧——预算只约束轮累计）；轮界定
 *   `agent.history.length !== r.len + 1` 语义逐字迁入（相邻注入间 history 无其他落史 = 同轮；
 *   每次注入 pushReal 恰 +1——他人落史 = 新请求窗口 → 预算复位）；键 = agent（会话级复用
 *   ——Map 常驻一两项）。
 * - `persistOverflowReport(raw, { tag })`——超限条目全量落盘（`configDir/tool-results` +
 *   `cleanupOldToolResults` 轮转；落盘名 `<ts>-<tag>.log`（tag = 溯源标签：写入族 + 条目 id
 *   ——非法字符归一 `_`））。返回清单行文本（inline = 仅此——不 inline 全文）；落盘失败 →
 *   null（调用方回退常规 inline 路径——offload 同款「失败不吞报告」语义）。
 *
 * 计数口径（D-DG3）：计入预算的 raw = 报告 / 错误正文（不含 `[System reminder: …]` 标签行
 * ——与既有口径一致）；错误条目同计同落盘。
 *
 * 兼容面（D-DG4）：subagent-async.mjs 保留 `DIGEST_INJECT_BUDGET` +
 * `_setDigestOffloadDirForTest` re-export（测试导入面零改）；单条 offload 预览路径零改。
 *
 * 模块图：import node:fs/promises + node:path + ../agent/helpers.mjs（cleanupOldToolResults）+
 * ../config.mjs（configDir）——叶子级；subagent-async / consult 单向 import 本档（无环）。
 */
import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { cleanupOldToolResults } from "../agent/helpers.mjs"
import { configDir } from "../config.mjs"

export const DIGEST_INJECT_BUDGET = 64 * 1024 // 64K——与 offload 单条预览同量级

// 轮记账：agent → { len, used }（逐字自 subagent-async.mjs 迁入——语义零变）。
const digestRounds = new Map()
function digestRoundFor(agent) {
  const h = agent.history
  const r = digestRounds.get(agent)
  if (!r || h.length !== r.len + 1) {
    const fresh = { len: h.length, used: 0 }
    digestRounds.set(agent, fresh)
    return fresh
  }
  r.len = h.length
  return r
}

/** 判超 + 记账（size = 原始正文字符数——标签行不计；先判后记：首条恒豁免）。 */
export function digestBudgetOver(agent, size) {
  const round = digestRoundFor(agent)
  const over = round.used > 0 && round.used + size > DIGEST_INJECT_BUDGET
  round.used += size
  return over
}

/** Test seam: 落盘目录重定向（单测沙箱——生产从不调用）。 */
let _digestOffloadDirOverride = null
export function _setDigestOffloadDirForTest(dir) { _digestOffloadDirOverride = dir }

/** 超限条目全量落盘（返回清单行文本；失败 null——调用方回退 inline——结果零丢失）。
 *  tag 入文件名（溯源：写入族 + 条目 id）。 */
export async function persistOverflowReport(raw, { tag }) {
  try {
    const dir = _digestOffloadDirOverride ?? join(configDir, "tool-results")
    await cleanupOldToolResults(dir)
    await mkdir(dir, { recursive: true })
    const file = join(dir, `${Date.now()}-${String(tag).replace(/[^a-zA-Z0-9_-]/g, "_")}.log`)
    await writeFile(file, raw, "utf8")
    return `Report saved to disk (digest inject budget exceeded — full text not inlined): ${file}\nRead it with the read tool (offset/limit).`
  } catch (e) {
    console.warn(`[digest] report persist failed — falling back to inline (report not lost): ${e.message}`)
    return null
  }
}
