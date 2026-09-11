/**
 * display-budget.mjs — TUI 显示层额度（TUI-OOM-ROOTCAUSE 批——TUI.md §15.3）。
 *
 * 职责（§15.3.2）：常量单源（D-TB4）+ 行/载体计长（`lineChars`）+ `state.lines` 总量
 * 对账（`syncLineBudget`）。纯函数本体（`capText` / `appendCappedText`）住
 * `src/text-budget.mjs`（零依赖）——与 agent 侧捕获共用（AGENT-LOOP.md §23.3.1，D2 单源）；
 * 本模块只承载 TUI 面常量与对账。
 *
 * 依赖方向：本模块只引 `./ansi.mjs` + `../text-budget.mjs`（叶子——不引 subagent 族，
 * 冻结锚点平移由调用方经 `onTrim` 注入，避环）。
 *
 * 计量口径 = UTF-16 码元（`String.length`——TUI.md §15.2 表 1）；行数维（5000 行环 /
 * 500 行块环 / 200 条目环）**原样保留**，字符维为第二维（D-TB5——既有 N5/N6 语义不动）。
 */
import { C } from "./ansi.mjs"
import { capText, appendCappedText, fillMarker } from "../text-budget.mjs"

export { capText }

// ─── 常量（§15.3.1——单源；数值改动一处生效）────────────────────────────────

/** 单行（pushLine/pushLabel/恢复行/流式 flush 行）字符额度。 */
export const LINE_MAX_CHARS = 64_000
/** 工具块 `argsJson` 总量。 */
export const ARGS_JSON_MAX_CHARS = 24_000
/** 工具块 `result` 行数组总量（与既有 400 行双维）。 */
export const TOOL_RESULT_MAX_CHARS = 64_000
/** 输出环单条目（超出：尾截断 + 标记）。 */
export const TOOL_OUTPUT_ENTRY_MAX_CHARS = 8_000
/** 输出环总量（超出：与既有 200 条目环同款丢最旧）。 */
export const TOOL_OUTPUT_TOTAL_MAX_CHARS = 128_000
/** 子代理块单环（与 500 显示行双维；裁最旧——省略标记 N6 语义不变）。 */
export const SUB_BLOCK_CHAR_LIMIT = 128_000
/** 评审载体（`_advisorBlocks` 累积 + `_frozenAdvisor`）：头 32K + 尾 96K + 中段标记。 */
export const ADVISOR_TEXT_MAX_CHARS = 128_000
/** 流式缓冲（`state.streaming` / `state.reasoning`）累积额度。 */
export const STREAM_MAX_CHARS = 256_000
/** `state.lines` 全部行与载体文本总量（超出：与 5000 行环同款裁头 1000 行 + 收据行）。 */
export const LINES_CHAR_BUDGET = 2_000_000
/** 搜索匹配计数上限（超出截断 + 提示行）。 */
export const SEARCH_MATCH_CAP = 10_000

// ─── 标记形态（逐字——§15.3.2 进测试断言）──────────────────────────────────

export const LINE_TRUNC_MARKER = "… [line truncated: N chars omitted]"
export const MIDDLE_TRUNC_MARKER = "… [middle truncated: N chars omitted]"

/** 评审/流式额度头尾分配（头 32K + 尾 96K——保裁决尾部；与常量同基数）。 */
export const ADVISOR_CAP_OPTS = {
  hard: ADVISOR_TEXT_MAX_CHARS,
  head: 32_000,
  tail: 96_000,
  marker: MIDDLE_TRUNC_MARKER,
}
/** 流式累积额度（头/尾各半——flush 行再受 LINE_MAX_CHARS）。 */
export const STREAM_CAP_OPTS = {
  hard: STREAM_MAX_CHARS,
  head: Math.floor(STREAM_MAX_CHARS / 4),
  tail: Math.floor(STREAM_MAX_CHARS / 2),
  marker: MIDDLE_TRUNC_MARKER,
}
/** 行截断（单行巨内容场景）：保留头部至 `LINE_MAX_CHARS` + 尾标记（行尾截断语义）。 */
export function capLine(text) {
  return capText(text, {
    max: LINE_MAX_CHARS,
    keepHead: LINE_MAX_CHARS,
    keepTail: 0,
    marker: LINE_TRUNC_MARKER,
  })
}

/** TUI 侧流式累积（alias——本体 text-budget.appendCappedText，D2 单源）。 */
export function appendCapped(prev, add, opts) {
  return appendCappedText(prev, add, opts)
}

/** 评审文本单次截断（§15.3.1：头 32K + 尾 96K 保裁决尾部 + 中段标记——与累积侧同源）。 */
export function capAdvisorText(text) {
  return capText(text, { max: ADVISOR_TEXT_MAX_CHARS, keepHead: 32_000, keepTail: 96_000, marker: MIDDLE_TRUNC_MARKER })
}

/**
 * 行数组总量额度（尾截断 + 标记；首行保真——ARGS_JSON/TOOL_RESULT 双维用）。
 * 行放不下时：可放部分 → 本行头截断；无空间 → 直接以标记行收尾。
 * @returns {string[]} 原数组或（截断 + 标记行）新数组
 */
export function capLines(lines, max, marker = MIDDLE_TRUNC_MARKER) {
  const arr = Array.isArray(lines) ? lines : []
  if (arr.length === 0) return arr
  let total = 0
  for (const s of arr) total += typeof s === "string" ? s.length : 0
  if (total <= max) return arr
  const out = []
  let used = 0
  for (const s of arr) {
    const str = typeof s === "string" ? s : String(s ?? "")
    const remain = max - used
    if (str.length <= remain) { out.push(str); used += str.length; continue }
    if (remain > 0) {
      const kept = str.slice(0, remain)
      out.push(kept)
      used += kept.length
    }
    break
  }
  out.push(fillMarker(marker, total - used))
  return out
}

// ─── 计长与总量对账（§15.3.2 / §15.3.4）───────────────────────────────────

const arrChars = (a) => {
  if (!Array.isArray(a)) return 0
  let n = 0
  for (const s of a) n += typeof s === "string" ? s.length : 0
  return n
}

/** 一行 + 其 `_toolBlock`/`_frozenSubTask`/`_frozenAdvisor` 字段计长（单一口径）。 */
export function lineChars(l) {
  if (!l) return 0
  let n = typeof l.text === "string" ? l.text.length : 0
  const b = l._toolBlock
  if (b) {
    n += typeof b.argsSummary === "string" ? b.argsSummary.length : 0
    n += typeof b.summary === "string" ? b.summary.length : 0
    n += arrChars(b.argsJson) + arrChars(b.output) + arrChars(b.result)
  }
  if (l._frozenSubTask) n += l._frozenSubTask._charCount ?? 0
  if (typeof l._frozenAdvisor === "string") n += l._frozenAdvisor.length
  return n
}

/** 行增量记账（幂等——行对象上存上次计入值 `_budgetChars`；载体原地变更后重调即自愈）。 */
export function accountLine(state, l) {
  if (!l) return
  const prev = Number.isFinite(l._budgetChars) ? l._budgetChars : 0
  const next = lineChars(l)
  state._linesChars = Math.max(0, (state._linesChars ?? 0) + (next - prev))
  l._budgetChars = next
}

/** 直算对账（双算法对照 / 初始化 / 漂移自愈——测试直算同源）。 */
export function accountAll(state) {
  let total = 0
  for (const l of state.lines ?? []) {
    const n = lineChars(l)
    l._budgetChars = n
    total += n
  }
  state._linesChars = total
  return total
}

/**
 * `state.lines` 总量对账（§15.3.3 落点表末行）：超 `LINES_CHAR_BUDGET` → 与 5000 行环
 * 同款裁头 1000 行 + 收据行；`onTrim(state, removedCount)` 由调用方注入冻结锚点平移
 * （display-budget 不引 subagent 族——避环）。幂等（未超限零动作）。
 * @returns {number} 本轮裁掉的行数
 */
export function syncLineBudget(state, { pushLineLike = null, onTrim = null } = {}) {
  const lines = state.lines
  if (!Array.isArray(lines)) return 0
  if (!Number.isFinite(state._linesChars)) accountAll(state)
  let removed = 0
  while (state._linesChars > LINES_CHAR_BUDGET && lines.length > 1) {
    const take = Math.min(1000, lines.length - 1)
    const dropped = lines.splice(0, take)
    let freed = 0
    for (const l of dropped) freed += lineChars(l)
    state._linesChars = Math.max(0, state._linesChars - freed)
    removed += take
    const receipt = `... [earlier messages trimmed — ${lines.length} lines remaining]`
    if (typeof pushLineLike === "function") pushLineLike(receipt)
    else {
      const line = { text: receipt, color: C.dim }
      line._budgetChars = receipt.length
      lines.unshift(line)
      state._linesChars += receipt.length
    }
    if (typeof onTrim === "function") onTrim(state, take)
  }
  return removed
}
