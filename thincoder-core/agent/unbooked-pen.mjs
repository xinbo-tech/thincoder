/**
 * unbooked-pen.mjs — 无账之笔提醒叶（批 unbooked-pen · 台账 #1753）。
 * 设计权威 = `docs/core/design/LIGHT-CHANNEL.md` §2.9（F-LC6）；需求 = `docs/core/requirements/LIGHT-CHANNEL.md` §2.6。
 *
 * 机制：每会话**首次**由主 agent 落下**产品源文件**笔时，在工具回执末尾追加一行通道确认提醒。
 * 只提示——不拦、不放行、不改任何判据；文案为条件句（轻通道笔须先挂轮，全链笔交 eng-coder）。
 * 承载形对齐先例 `agent-tools/zero-write-watch.mjs`（谓词叶 + 文案函数 + 闩 + 非阻塞）。
 * 零环：只 import 既有单源（`FILE_MUTATORS` ∥ `toolTouchPaths` ∥ `isCodePath` ∥ `declarationForTarget`），
 * 只被 `agent/record-results.mjs` import（不反向引）。
 */
import { resolve } from "node:path"
import { FILE_MUTATORS, toolTouchPaths } from "./helpers.mjs"
import { declarationForTarget } from "../declaration.mjs"
import { isCodePath } from "../conventions.mjs"

/** 笔集（§2.9 ②）：`FILE_MUTATORS` **减** `delete`——减式派生，不另抄第二份工具名清单
 *  （`FILE_MUTATORS` 增删成员时本集自动跟上）。`delete` 不入集：删产品源文件须 `force`、
 *  是显式动作，本批无场景（K20）。 */
export const PEN_TOOLS = new Set([...FILE_MUTATORS].filter((name) => name !== "delete"))

/** 文案单源（§2.9 文案块逐字——条件句 + 后果句；改文案只改这一处）。 */
export function unbookedPenText() {
  return "[pen check] first product-source write this session — confirm the channel before it lands: a light-channel pen needs its round booked first (batch record + an in-flight ledger row pointing at the record); a full-chain pen goes to eng-coder. A pen with no account is invisible at closeout, so the ledger settlement misses it."
}

/**
 * 四合取 + 一闩判定（§2.9 触发面）——命中：置闩并返回回执后缀（`\n` + 文案行）；未中：空串。
 * ① 身份 = 主 agent（`_role == null`——主会话装配不传 role，子代理 spawn 面统一传角色）
 * ② 工具 ∈ `PEN_TOOLS` ③ `ok === true` ④ 任一目标分类为产品源文件
 *    （逐目标 `resolve(cwd, p)` → `declarationForTarget(abs)` → `isCodePath(abs, conv)`——与父侧门
 *     `agent/dispatch.mjs:111-118` 同式；出辖目标不判，任一命中即触发）
 * 闩 = `agent._unbookedPenNotified`（每会话一次——不按轮、不按文件）。
 * @param {object} agent 主 agent（读 `cwd` ∥ `_role` ∥ 闩位）
 * @param {{name: string, arguments?: string}} toolCall
 * @param {boolean} ok 工具结果成功位（被拒的笔没有落盘，提醒无对象）
 * @param {object} [tool] 工具对象——只用于 `toolTouchPaths` 的可选钩子 `touchedPaths`
 *   （`apply_patch` ∥ 多目标 `edit` 的目标解析靠它；缺省按单参 `path`）
 * @returns {string} 命中 = 回执后缀；未中 = ""
 */
export function unbookedPenNotice(agent, toolCall, ok, tool) {
  if (!agent || agent._role != null) return ""
  if (!tool) return ""
  if (ok !== true) return ""
  if (agent._unbookedPenNotified) return ""
  if (!PEN_TOOLS.has(toolCall?.name)) return ""
  try {
    const args = JSON.parse(toolCall.arguments || "{}")
    const hit = toolTouchPaths(tool, args).some((p) => {
      if (typeof p !== "string" || !p.trim()) return false
      const abs = resolve(agent.cwd, p)
      const conv = declarationForTarget(abs)
      return !!conv && isCodePath(abs, conv)
    })
    if (!hit) return ""
  } catch {
    // 恒零抛（先例 zero-write-watch.mjs 同款）：提醒是兜底面——判定失败不得中断回执提交
    // （畸形 args ∥ 非标准装配的 cwd）。退回空串 = 本笔不提示，判据面零变。
    return ""
  }
  agent._unbookedPenNotified = true
  return `\n${unbookedPenText()}`
}
