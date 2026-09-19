/**
 * review-facts.mjs — design-review 事实面（纯事实：路径归一 + 评审范围键）。
 *
 * 本档前身 = 第 33 批（2026-09-11）的失败计数护栏档；其计数载体 / 停止谓词 / 两级检查点随
 * 「撤除全部会话级轮次计数器」**整体退场**（2026-09-18 用户裁定；设计权威 =
 * `docs/core/design/ADVISOR-CONVERGENCE.md` §3.1/§3.4 + `ADVISOR-GUARDS.md` §7）。
 * 结算分类迁出为纯函数（输出判据名、零状态）= `thincoder-core/advisor/notice.mjs`。
 *
 * 本档 = 中立模块（**不 import 任何 src/ 模块**——打断潜在环）：
 *  - `normAbs` 自 advisor-settle.mjs 迁入（原处 re-export——既有 import 面零变；陈旧判定 /
 *    冻结拦截 / 评审范围键同源）；
 *  - `docSetKey` 自 advisor-async.mjs 迁入（原为私有——零 import 面）。
 */
import { join } from "node:path"

/** ABS 归一（cwd 相对 → cwd 拼接）——陈旧判定 / 冻结拦截 / 评审范围键同源（§14.14 E-4）。 */
export function normAbs(p, cwd) {
  const s = String(p)
  return /^[a-zA-Z]:[\\/]/.test(s) || s.startsWith("/") || s.startsWith("\\\\") ? s : join(cwd, s)
}

/** Canonical scope key for design reviews — the document multi-set
 *  (order-insensitive, ABS-path normalized — launch 与 continuation 的写法差异
 *  ("./docs/x.md" vs "docs/x.md"、反斜杠) 不误建新实例).
 *  第 33 批自 advisor-async.mjs 逐字迁入（实例续跑与事实面同锚单源）。 */
export function docSetKey(documents, cwd) {
  const list = [...new Set((documents ?? [])
    .filter((d) => typeof d === "string" && d.trim())
    .map((d) => normAbs(d, cwd)))]
  return JSON.stringify(list.sort())
}
