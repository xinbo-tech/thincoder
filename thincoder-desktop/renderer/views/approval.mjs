/**
 * approval.mjs — 审批卡面（`docs/desktop/design/UI.md` §1 审批呈现行 + 键盘可达行 · 批档 §2.2（a）· KD-8）：
 * 卡树两形（逐项 / 批）+ 键位闭集 + 置焦「最安全键」+ 出口动作。**本档零 `store.mjs` import**（KD-14 ——
 * 「出口失败 ⇒ 零切片写」是**结构性保证**：本档无切片可写，非运行期判）。
 *   ① 卡根 = `data-card="approval"` + `data-prompt-id`（待决项身份 / 路由键）+ `data-shape`；驻点 = 对话流根
 *      （**非块节点** —— 与块序列 / 药丸同层的根子项，块节点序不变式不受影响）；
 *   ② 逐项形首行 = 工具名 + 参数摘要 + 状态词（复用 `tab.badge.approval` 词键 —— 闭枚举单源，零副本）；
 *      批形首行 = 计数词（`approval.batch.count` 带 `{count}`）+ 逐工具名（**两形首行皆逐段包元素**——
 *      `span[data-seg]` 零分隔符字面 · 间距归 `chat.css`；批形段集不定长 ⇒ 拼串必自造分隔符，违「零构造」）；
 *      两形改动摘要行 = `changes` 在场 ⇒ 复用工具卡降级形（`toolChanges`，越阈判同源）；缺 ⇒ 零节点；
 *      两形标识片 / 单行标称 = `approvalSummary` / `approvalTitle`（**池面条目同源消费** —— 零副本）；
 *   ③ 三出口描述符 = **本档单一 owner**（键位 / 值映射 / 词键 / 置焦）：`approvalActions(shape)` ——
 *      卡面与池面同表消费（零副本），操作区构造同源 `approvalExits`（两面同锚：`data-action` / `data-key`）；
 *   ④ `verdictOfKey(shape, key)` = 键位闭集：表外键 / 非串 / 未知形 ⇒ `null`（零动作 · **不吞键** —— 不 `preventDefault`）；
 *   ⑤ 置焦 = 最安全键（逐项 ⇒ `reject` · 批 ⇒ `deny`）锚 `data-autofocus="1"`（描述符内定 ⇒ 恰一枚；键处理两态：
 *      `onApprove` 给 ⇒ `keydown` 在场，缺 ⇒ 不挂 —— 不夺焦，与三出口同一两态）；
 *   ⑥ 出口动作 `respondApproval(host, promptId, verdict)`：窄桥 `approval:respond`；invoke 抛 / 拒绝 ⇒
 *      `console.error`（**不静默**）+ 回执 `null`（调用面零分支；待决项清除归事件面 ⇒ 本档零切片写）。
 * 文案一律经 `t()`（零硬编码）；零字形字面；零 `node:` / 零裸包。
 */
import { t } from "../i18n.mjs"
import { STATUS_WORD, segNode, toolChanges, wire, withKey } from "./chat-tool.mjs"

/** 键位闭集（唯一 owner）：形 → 三出口描述符（键位 / 值 / 词键 / 置焦）；表外形 ⇒ `null`（零动作）。
 *  逐位序 = 呈现序；`safe: true` = 置焦「最安全键」（逐项 ⇒ `reject` · 批 ⇒ `deny`）。 */
const SHAPE_ACTIONS = Object.freeze({
  single: Object.freeze([
    Object.freeze({ key: "1", verdict: "once", word: "approval.once" }),
    Object.freeze({ key: "2", verdict: "always", word: "approval.always" }),
    Object.freeze({ key: "3", verdict: "reject", word: "approval.reject", safe: true }),
  ]),
  batch: Object.freeze([
    Object.freeze({ key: "1", verdict: "approveAll", word: "approval.batch.approveAll" }),
    Object.freeze({ key: "2", verdict: "deny", word: "approval.batch.deny", safe: true }),
    Object.freeze({ key: "3", verdict: "oneByOne", word: "approval.batch.oneByOne" }),
  ]),
})

const hasText = (value) => typeof value === "string" && value.length > 0

/** 三出口描述符（形 → 表）：表外形 / 非串 ⇒ `null`（`hasOwn` 判 —— 不落原型链取值）。 */
export function approvalActions(shape) {
  return Object.hasOwn(SHAPE_ACTIONS, shape) ? SHAPE_ACTIONS[shape] : null
}

/** 键位闭集：`("single","1"|"2"|"3")` ⇒ `once|always|reject`；`("batch", …)` ⇒ `approveAll|deny|oneByOne`；
 *  表外键 / 非串键 / 未知形 ⇒ `null`（调用方零动作 —— 闭集外不吞键）。 */
export function verdictOfKey(shape, key) {
  if (typeof key !== "string") return null
  const actions = approvalActions(shape)
  if (actions === null) return null
  const hit = actions.find((entry) => entry.key === key)
  return hit === undefined ? null : hit.verdict
}

/** 三出口操作区（卡面与池面**同一构造** ⇒ 两态同锚）：`data-action="approval:<值>"` + `data-key` + 词键文本。
 *  `autofocus` 真 ⇒ 最安全键落 `data-autofocus="1"`（恰一枚；池面条目不争焦 ⇒ 缺省假）；
 *  `handlers.onApprove` 缺 ⇒ 三出口 `disabled: true` ∧ 锚仍在场（诚实非死控）；未知形 ⇒ `null`。 */
export function approvalExits(item, handlers = {}, { autofocus = false } = {}) {
  const actions = approvalActions(item?.shape)
  if (actions === null) return null
  const promptId = item?.promptId
  const onVerdict = typeof handlers?.onApprove === "function" ? (verdict) => handlers.onApprove(promptId, verdict) : undefined
  return {
    tag: "div",
    props: { class: "approval-actions", "data-approval-actions": "" },
    children: actions.map((entry) => ({
      tag: "button",
      props: wire({
        class: "approval-action",
        "data-action": `approval:${entry.verdict}`,
        "data-key": entry.key,
        "data-autofocus": autofocus && entry.safe === true ? "1" : undefined,
      }, withKey(onVerdict, entry.verdict)),
      children: [t(entry.word)],
    })),
  }
}

/** 批形工具清单：非数组 / 含非串项 ⇒ 逐项滤除（只留非空串 —— 零假造）。 */
function batchTools(item) {
  const tools = item?.batch?.tools
  return Array.isArray(tools) ? tools.filter((name) => hasText(name)) : []
}

/** 批形计数：`batch.count` 非整数 ⇒ 以清单长度为准（数据自洽，不假造）。 */
function batchCount(item) {
  return Number.isInteger(item?.batch?.count) ? item.batch.count : batchTools(item).length
}

/** 待决项标识片（卡面与池面**同源** —— 零副本）：逐项形 ⇒ `[工具名, 参数摘要]`；批形 ⇒ `[计数词, …工具名]`
 *  （键形沿 `docs/desktop/design/IPC.md` §1 `ev:approval` 行）。 */
export function approvalSummary(item) {
  if (item?.shape === "batch") return [t("approval.batch.count", { count: batchCount(item) }), ...batchTools(item)]
  return [item?.tool, item?.argsSummary]
}

/** 待决项单行标称（池面条目「工具名」位 —— 批形无单名 ⇒ 以计数词代标）。 */
export function approvalTitle(item) {
  return item?.shape === "batch" ? t("approval.batch.count", { count: batchCount(item) }) : item?.tool
}

/** 卡首行：逐项形 = 标识片 + 状态词；批形 = 计数词 + 逐工具名（逐段包元素 —— 间距归 `chat.css`）。 */
function headNode(item, shape) {
  const props = { class: "approval-head", "data-approval-head": "" }
  const summary = approvalSummary(item)
  const children = shape === "batch"
    ? [segNode("count", summary[0]), ...summary.slice(1).map((name) => segNode("name", name))]
    : [segNode("name", summary[0]), segNode("args", summary[1]), segNode("status", t(STATUS_WORD.approval))]
  return { tag: "div", props, children }
}

/** 卡根 `keydown` 两态：`onApprove` 给 ⇒ 键处理在场（闭集命中 ⇒ `preventDefault` + 派发；表外 ⇒ 零动作）。
 *  非函数 ⇒ `undefined`（`el` 跳过 ⇒ 不挂 —— 不夺焦）。 */
function onKeyDown(item, handlers) {
  if (typeof handlers?.onApprove !== "function") return undefined
  return (event) => {
    const verdict = verdictOfKey(item?.shape, event?.key)
    if (verdict === null) return
    event.preventDefault()
    handlers.onApprove(item?.promptId, verdict)
  }
}

/** 审批卡（纯构树 · 零 DOM）：子序 = 首行 → [改动摘要行?] → 三出口操作区；两形同构，唯首行与出口表不同。 */
export function approvalTree(item, handlers = {}) {
  const shape = item?.shape
  const promptId = item?.promptId
  return {
    tag: "div",
    props: {
      class: "approval-card",
      "data-card": "approval",
      "data-prompt-id": promptId == null ? undefined : String(promptId),
      "data-shape": hasText(shape) ? shape : undefined,
      onKeyDown: onKeyDown(item, handlers),
    },
    children: [headNode(item, shape), toolChanges(item), approvalExits(item, handlers, { autofocus: true })],
  }
}

/** 出口动作（三出口同一路）：窄桥 `approval:respond`；抛 / 拒绝 ⇒ `console.error`（不静默）+ 回执 `null`
 *  （零切片写 = 结构性 —— 本档无 `store.mjs` import）。 */
export function respondApproval(host, promptId, verdict) {
  try {
    return Promise.resolve(host.invoke("approval:respond", { promptId, verdict })).catch((error) => {
      console.error("[renderer] approval:respond failed:", error)
      return null
    })
  } catch (error) {
    console.error("[renderer] approval:respond failed:", error)
    return null
  }
}
