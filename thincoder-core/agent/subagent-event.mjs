/**
 * subagent-event.mjs — 子代理事件 token 文法机读单源（`⟦ev⟧<小写名>` + RS 分隔字段）。
 *
 * 收编自 `spawn-child.mjs`（2026-10-04 ACP 协议面补全批——设计档 `docs/cli/design/
 * ACP-CLIENT.md` §12.4）：哨兵定义位迁入本叶 + 形态判据与逐事件投影单源——消费方
 * （本批 = ACP 桥 `thincoder-cli/src/acp/bridge.mjs`）经本叶判据剥离/投影，不再自持
 * 平行表达式（同族先例 = `relay-prefix.mjs` / `child-marks.mjs`；`spawn-child.mjs`
 * import + 再导出哨兵 ⇒ 既有 import 面零改）。
 *
 * 零 import——任意层可引、无环。
 *
 * 文法：`⟦ev⟧<小写名>\x1e<字段…>`（字段以 RS 分隔）。终止符约束 load-bearing：正文含
 * `⟦ev⟧` 而无 RS 终止符 ⇒ 非事件形态 ⇒ null ⇒ 消费方照常转发（不吞真实正文）。
 * 逐事件字段序 = 发射侧单源（各发射点既有构造——本批零改发射侧）；投影映射以样本逐字
 * 钉住（批内件 T-862-1…6）——发射侧改字段序 = 契约面变更（设计档 §12.3）。
 */

/** 事件 token 哨兵串（D1）——LLM 正常内容混淆概率极低；字段分隔用 RS (\x1e)。 */
export const EVENT_SENTINEL = "⟦ev⟧"

/** 形态判据（**单源——唯一表达式**）：`⟦ev⟧<小写名>` + RS 终止符同现。
 *  D13 负向边界（load-bearing）：放宽为无终止符形态会吞真实正文（先例教训见
 *  `thincoder-cli/src/tui/render.mjs:250-252`）。形态域 = 开集——未知名同判（客户端
 *  SHOULD 容忍未知 state；新增事件名不破坏契约）。 */
const EVENT_FORM_RE = /^⟦ev⟧([a-z]+)\x1e/
const RS = "\x1e"

/** 数值字段解析（§12.2）：无值（缺省 ∥ 空串）⇒ 键省略；`Number` 转换非有限值 ⇒ 键省略
 *  （防御面——发射侧恒为整数）。 */
const num = (v) => {
  if (v == null || v === "") return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

/**
 * 解析子代理事件 token（**形态命中必非 null**——剥离判据与投影载荷由此同一调用决定）。
 * @param {string} text 事件 token 原文（relay 前缀已由消费方剥离——前缀解析非本叶职责）
 * @returns {{ name: string, progress?: { turn?: number, maxTurns?: number, position?: number }, detail?: string } | null}
 *   null = 非事件形态（消费方照常转发）
 */
export function parseSubagentEvent(text) {
  const m = EVENT_FORM_RE.exec(String(text))
  if (!m) return null
  const name = m[1]
  const fields = String(text).slice(m[0].length).split(RS)
  // 逐态投影（字段序 = 发射侧单源——样本映射见设计档 §12.3）：
  //   turn / approval  ⟦ev⟧turn\x1e{turn}\x1e{maxTurns}\x1e{phase}\x1e[detail]
  //   queued           ⟦ev⟧queued\x1e{kind}\x1e{position}\x1equeued\x1e[detail]（kind 不承载）
  //   async / cancelled / stopped / settled / done = 零字段态（stopped 等第 2/3 位 0 系
  //   发射侧填充，不承载——state 逐字即全部载荷）。
  if (name === "turn" || name === "approval") {
    const ev = { name }
    const progress = {}
    const turn = num(fields[0])
    const maxTurns = num(fields[1])
    if (turn !== undefined) progress.turn = turn
    if (maxTurns !== undefined) progress.maxTurns = maxTurns
    if (Object.keys(progress).length > 0) ev.progress = progress
    if (name === "approval" && fields[3]) ev.detail = fields[3]
    return ev
  }
  if (name === "queued") {
    const ev = { name }
    const position = num(fields[1])
    if (position !== undefined) ev.progress = { position }
    if (fields[3]) ev.detail = fields[3]
    return ev
  }
  return { name } // 零字段态 ∥ 未知名（形态域开集）
}