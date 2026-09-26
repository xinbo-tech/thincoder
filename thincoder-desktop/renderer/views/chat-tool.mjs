/**
 * chat-tool.mjs — 工具卡面（`docs/desktop/design/UI.md` §1 工具卡行 · `docs/desktop/design/RENDERER.md` §1.1「纯构树」切面）。
 * 本档 = 批档 §2.3 在册**拆分预案**落形：`chat.mjs` 交付实读越 300 层 ⇒ 工具块构树三件（头行 / 改动摘要 / 卡）+
 * 折叠纯函数 `toggleExpanded` 拆出；控件接线两态原语（`wire` / `withKey`）随迁 —— 工具头 / 回填 / 药丸三控件同源，
 * 住本档守依赖单向（`chat.mjs` → 本档；反向无引用 ⇒ 无环）。
 *   ① 头行：数据串（名称 / 参数摘要）+ 状态词（闭枚举单源 = 核词表）+ 耗时（仅 `done` / `error` ∧ 数）；
 *   ② 改动摘要：`files` 计数 + 增删合计 ⇒ 越阈（文件数 ∨ 增删合计）降级 = 只留摘要行（零 `[data-file]`）；
 *   ③ 结果区：`result` 非空 ∧ 展开态；`result` 空 ⇒ 头行退纯展示 `div`（零 toggle 控件 —— 诚实非死控）；
 *   ④ 折叠判据：显式 `expanded` 优先，缺省 = `status="error"` 展开（错误取证优先）；
 *   ⑤ 共享导出面（**消费零副本** —— `views/approval.mjs`（审批卡）/ `views/activity.mjs`（活动池）复用）：
 *      `STATUS_WORD`（六词闭枚举状态词）+ 降级阈值两常数 + `changeTotals` / `toolChanges`（改动摘要降级形）。
 * 文案一律经 `t()`（零硬编码；`+` / `−` 字形住 `renderer/chat.css`）；零 `node:` / 零裸包。
 */
import { t } from "../i18n.mjs"
import { blockKey } from "./chat-stream.mjs"

/** 状态词码 → 词键（核五键 + 宿主一键 `tab.badge.approval` —— 单源不复制）；表外码 ⇒ 零状态词节点。
 *  导出 = 闭枚举单源：工具卡头行与池面活动块 / 队列条目同表（消费零副本）。 */
export const STATUS_WORD = Object.freeze({
  queued: "sub.queued",
  running: "sub.running",
  approval: "tab.badge.approval",
  done: "sub.done",
  stopped: "sub.stopped",
  error: "sub.error",
})
/** 耗时节点两态：仅 `done` / `error` ∧ `durationMs` 为数时落（单源 = `docs/desktop/design/UI.md` §1 工具卡行）。 */
const TIMED_STATUS = Object.freeze(["done", "error"])
/** 改动摘要降级阈值：越阈 ⇒ 只留摘要行（零 `[data-file]`）。导出 = 阈值单源（审批卡降级形同判）。 */
export const DIFF_FILE_FLOOR = 10
export const DIFF_LINE_FLOOR = 200

const hasText = (value) => typeof value === "string" && value.length > 0

/** 接线两态（通则沿 `renderer/views/sessions.mjs:161`）：handlers 给 ⇒ `onClick`（不落 `disabled`）；缺 ⇒ `disabled: true`。 */
export function wire(props, onClick) {
  if (typeof onClick === "function") props.onClick = onClick
  else props.disabled = true
  return props
}

/** 键携带包装：handler 给 ⇒ 携本键闭包；缺 ⇒ `undefined`（交 `wire` 判两态）。 */
export function withKey(handler, key) {
  return typeof handler === "function" ? () => handler(key) : undefined
}

/** 折叠判据（显式优先；缺省 = `error` 展开）。 */
function isExpanded(block) {
  return typeof block?.expanded === "boolean" ? block.expanded : block?.status === "error"
}

/** 改动合计（`changes.items[]`）：文件数 + 增删行合计（缺项按 0）。 */
export function changeTotals(changes) {
  const items = Array.isArray(changes?.items) ? changes.items : []
  return {
    items,
    files: items.length,
    add: items.reduce((sum, item) => sum + (Number(item?.insertions) || 0), 0),
    del: items.reduce((sum, item) => sum + (Number(item?.deletions) || 0), 0),
  }
}

/** 工具卡头行：数据串（名称 / 参数摘要）+ 状态词（闭枚举）+ 耗时（两态）——四者非空才落。
 *  两态：有 `result` ⇒ `button`（可开关控件 + 接线两态）；空 ⇒ 纯展示 `div`（零 toggle 控件）。 */
function toolHead(block, key, handlers) {
  const word = STATUS_WORD[block?.status]
  const timed = TIMED_STATUS.includes(block?.status) && Number.isFinite(block?.durationMs)
  const props = {
    class: "tool-head",
    "data-tool-head": "",
    "data-status": typeof block?.status === "string" ? block.status : undefined,
  }
  const children = [
    block?.name,
    block?.argsSummary,
    word === undefined ? null : t(word),
    timed ? t("chat.tool.duration", { seconds: (block.durationMs / 1000).toFixed(1) }) : null,
  ]
  if (!hasText(block?.result)) return { tag: "div", props, children }
  return { tag: "button", props: wire({ ...props, "data-action": "chat:tool-toggle" }, withKey(handlers.onToggleTool, key)), children }
}

/** 工具卡改动摘要行（`changes.items[]` 非空时落）：摘要文本 + 每文件行（`[data-add]` / `[data-del]` 承载增删数）；
 *  越阈（文件数 ∨ 增删合计）⇒ 降级 = 零 `[data-file]`（大改动静默——摘要在）。 */
export function toolChanges(block) {
  const { items, files, add, del } = changeTotals(block?.changes)
  if (files === 0) return null
  const degraded = files > DIFF_FILE_FLOOR || add + del > DIFF_LINE_FLOOR
  const rows = degraded ? [] : items.map((item) => ({
    tag: "div",
    props: { class: "tool-file", "data-file": "" },
    children: [
      item?.path,
      { tag: "span", props: { class: "tool-add", "data-add": "" }, children: [String(Number(item?.insertions) || 0)] },
      { tag: "span", props: { class: "tool-del", "data-del": "" }, children: [String(Number(item?.deletions) || 0)] },
    ],
  }))
  return {
    tag: "div",
    props: { class: "tool-changes", "data-tool-changes": "" },
    children: [t("chat.tool.changes", { files, add, del }), ...rows],
  }
}

/** 工具卡（三行 · `data-block-id` = 本块键）：头行 + 改动摘要行 + [展开结果区?]（`result` 非空 ∧ 展开态）。 */
export function toolCard(block, key, handlers) {
  const rows = hasText(block?.result) && isExpanded(block)
    ? [{ tag: "div", props: { class: "tool-result", "data-tool-result": "" }, children: [block.result] }]
    : []
  return {
    tag: "div",
    props: { class: "block block-tool", "data-block-id": key, "data-block-kind": "tool" },
    children: [toolHead(block, key, handlers), toolChanges(block), ...rows],
  }
}

/** 折叠翻转（纯函数 · 沿 store 三纯动作纪律）：键命中 ∧ `tool` ⇒ 新数组（该块新对象 · 展开态取反）；
 *  未命中 / 非 `tool`（= 无变化）⇒ **原引用**（零通知）。键域 = 全列表位序（同落锚域）。 */
export function toggleExpanded(blocks, id) {
  const list = Array.isArray(blocks) ? blocks : []
  const index = list.findIndex((block, position) => blockKey(block, position) === id)
  if (index < 0 || list[index]?.kind !== "tool") return blocks
  const next = list.slice()
  next[index] = { ...next[index], expanded: !isExpanded(next[index]) }
  return next
}
