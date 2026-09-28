/**
 * approval.mjs — 审批卡面（`docs/desktop/design/UI.md` §1 审批呈现行 + 键盘可达行）：**核件直消费 + 端壳**
 * （「桌面处理流 · VSC 对齐」批 R1 #1 · KD-F1）——卡面构树单源 = 核包 `cards/permission.mjs`
 * （`renderApprovalCard` / `renderBatchApprovalCard` —— VSC ∕ 桌面同一文件），本档只留四件端胶水：
 *   ① **出站桥**（端壳适配 g）：核 `deps.emit(type, payload)` ⇒ 端窄桥 `approval:respond`
 *      ——逐项形 `permissionResponse{approved}`：`true` ⇒ `once` ∕ `"approveAll"` ⇒ `always` ∕ `false` ⇒ `reject`；
 *      批形 `batchPermissionResponse{choice}` ⇒ 同名 verdict（`approveAll` ∕ `oneByOne` ∕ `deny`）；表外 ⇒ 零派发 + 记错。
 *      出口实作 = **池面同一路**（`handlers.onApprove` ⇒ `mount-pool.mjs` `submitVerdict`：回执 `ok` 真 ⇒ 摘项 + 模式位写
 *      —— 卡面 ∕ 池面单一出口，零第二实现）；
 *   ② **锚装饰**（端壳适配 b）：核卡自带 `data-prompt-id`（身份 / 路由键）；端侧补 `data-card="approval"` + `data-shape`
 *      （端挂载 ∕ 同步面不变式锚 —— 核卡无此两锚）；
 *   ③ **键位胶水**（端壳适配 a）：核卡无键位（VSC 实测零命中）⇒ 卡根挂 `keydown`，`verdictOfKey` 命中 ⇒ `preventDefault`
 *      + 触发**核卡内**对应出口控件（点击 ⇒ 核卡自摘 + 出站）；表外键 ⇒ 零动作不吞键；`onApprove` 缺 ⇒ 不挂（不夺焦）；
 *   ④ **置焦锚**（端壳适配 c）：核卡无置焦（VSC 壳 = deny +50ms 聚焦）⇒ 对「最安全键」补 `data-autofocus="1"`（卡内恰一），
 *      DOM `focus()` 执行点 = 帧尾（`views/chat-chrome.mjs` `focusAutofocus` —— 两壳同目标：deny）。
 *   ⑤ **大 diff 钮处置**（端壳适配 f ∕ §2.7 行 3「宿主能力面例外」）：核 `.view-diff` 钮在核 `diffBig` 时在场；桌面零外部
 *      diff 查看器 ⇒ 唯 `diff.path`（单径）在场才留钮并经 `handlers.onOpenFile` 走 `file:open`；`apply_patch` 形（无单径）
 *      ⇒ 钮退场（不引入死控）。
 *   ⑥ **回执非乐观**（端壳适配 d）：核卡点按即摘（核实现 `el.remove()`）；端侧切片**零乐观写**（清除归回执 `ok` 真）
 *      —— 回执失败径端壳触发一次卡面重挂（`handlers.onCardRefresh`）⇒ 卡复现在场可重试。
 * 池面描述符（`approvalActions` ∕ `verdictOfKey` ∕ `approvalExits` ∕ `approvalSummary` ∕ `approvalTitle`）**原位保留**
 * —— `views/activity.mjs` 池面条目同源消费（零副本）。**本档零 `store.mjs` import**（KD-14 —— 「出口失败 ⇒ 零切片写」是
 * 结构性保证：本档无切片可写，非运行期判）。
 * 文案一律经核 i18n（核卡内取词 —— `renderer/i18n.mjs` `initDict` 经注册端投影；值 = VSC locales 逐字）；零字形字面；
 * 零 `node:` / 零裸包。
 */
import { renderApprovalCard, renderBatchApprovalCard } from "/rc/cards/permission.mjs"
import { t } from "../i18n.mjs"
import { wire, withKey } from "./chat-tool.mjs"

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

/** verdict ⇒ **核卡内**出口控件选择器（键位胶水的落点面 —— 核类名单源，逐位对核三出口：
 *  逐项 `.approve` ∕ `.approve-all` ∕ `.deny`；批 `.approve-all` ∕ `.one-by-one` ∕ `.deny`）。 */
const EXIT_SELECTOR = Object.freeze({
  once: ".approve",
  always: ".approve-all",
  reject: ".deny",
  approveAll: ".approve-all",
  oneByOne: ".one-by-one",
  deny: ".deny",
})

/** 核出站 ⇒ 端 verdict（端壳适配 g 的映射表）：表外 `type` ∕ 表外值 ⇒ `null`（零派发）。批形 choice 值域
 *  以 `approvalActions("batch")` 为准（键位表单源 —— 表外值不派发）。 */
export function verdictOfEmit(type, payload) {
  if (type === "permissionResponse") {
    if (payload?.approved === true) return "once"
    if (payload?.approved === "approveAll") return "always"
    if (payload?.approved === false) return "reject"
    return null
  }
  if (type === "batchPermissionResponse") {
    const choice = payload?.choice
    const actions = approvalActions("batch")
    return actions.some((entry) => entry.verdict === choice) ? choice : null
  }
  return null
}

/** 三出口操作区（**池面条目**构造 —— `views/activity.mjs` 消费；卡面出口 = 核卡自带）：`data-action="approval:<值>"`
 *  + `data-key` + 词键文本。`autofocus` 真 ⇒ 最安全键落 `data-autofocus="1"`；`handlers.onApprove` 缺 ⇒ 三出口
 *  `disabled: true` ∧ 锚仍在场（诚实非死控）；未知形 ⇒ `null`。 */
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

/** 待决项标识片（池面条目 —— 零副本）：逐项形 ⇒ `[工具名, 参数摘要]`；批形 ⇒ `[计数词, …工具名]`
 *  （键形沿 `docs/desktop/design/IPC.md` §1 `ev:approval` 行）。 */
export function approvalSummary(item) {
  if (item?.shape === "batch") return [t("approval.batch.count", { count: batchCount(item) }), ...batchTools(item)]
  return [item?.tool, item?.argsSummary]
}

/** 待决项单行标称（池面条目「工具名」位 —— 批形无单名 ⇒ 以计数词代标）。 */
export function approvalTitle(item) {
  return item?.shape === "batch" ? t("approval.batch.count", { count: batchCount(item) }) : item?.tool
}

/** 出口动作（池面同路）：窄桥 `approval:respond`；抛 / 拒绝 ⇒ `console.error`（不静默）+ 回执 `null`
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

// ─── 卡面（核卡工厂 + 端壳四件）──────────────────────────────────────────

/** 形归一（工厂选择）：`"batch"` ⇒ 批卡；余 ⇒ 逐项卡（**核卡两形**；`data-shape` 仍落原样值 —— 锚面零假造）。 */
const shapeOf = (item) => (item?.shape === "batch" ? "batch" : "single")

/** 卡模型投影（端 `ev:approval` 载荷 ⇒ 核卡 `m` 形 · 键名沿核面）：逐项形 = `{ tool, args, owner?, diff?, promptId? }`；
 *  批形 = `{ count, tools:[{name}], promptId? }`。缺项按核卡缺省面（零假造 —— 核内 `??` 兜底）。 */
function cardModelOf(item, shape) {
  const model = { promptId: item?.promptId }
  if (shape === "batch") {
    model.count = batchCount(item)
    model.tools = batchTools(item).map((name) => ({ name }))
    return model
  }
  model.tool = hasText(item?.tool) ? item.tool : ""
  if (hasText(item?.argsSummary)) model.args = item.argsSummary
  if (hasText(item?.owner)) model.owner = item.owner
  if (item?.diff !== null && typeof item?.diff === "object") model.diff = item.diff
  return model
}

/** 单径判据（⑤ 大 diff 钮退场）：`diff.path` 非空串 ⇒ 该径；余（`apply_patch` 形 / 缺）⇒ `null`。 */
function diffPathOf(item) {
  const path = item?.diff?.path
  return hasText(path) ? path : null
}

/** 回执判定 + 失败径重挂（⑥）：`onApprove` 返 thenable 才判 —— 回执 `ok` 真 ⇒ 零动作；否则触发**一次**卡面重挂
 *  （`handlers.onCardRefresh`）；无回执面（同步返值 ∕ `undefined`）⇒ 零动作（不误判失败 —— 判定面单源 = 回执）。 */
function settleExit(result, handlers) {
  if (result === null || result === undefined || typeof result.then !== "function") return
  void Promise.resolve(result).then(
    (receipt) => { if (receipt?.ok !== true) handlers?.onCardRefresh?.() },
    () => handlers?.onCardRefresh?.(),
  )
}

/** 出站桥（①）：核 `deps.emit` ⇒ 端出口；`openDiff` ⇒ 单径在场 ⇒ `file:open`（`handlers.onOpenFile`），缺 ⇒ 零动作。
 *  `onApprove` 非函数（接线缺位）⇒ 零派发 + 记错（两态通则：核卡钮无 `disabled` 面 ⇒ 本桥为唯一门）。 */
function emitBridge(item, handlers) {
  return (type, payload) => {
    if (type === "openDiff") {
      const path = diffPathOf(item)
      if (path !== null && typeof handlers?.onOpenFile === "function") handlers.onOpenFile(path)
      return
    }
    const verdict = verdictOfEmit(type, payload)
    if (verdict === null) {
      console.error(`[renderer] approval card emitted unbound exit: ${String(type)}`)
      return
    }
    if (typeof handlers?.onApprove !== "function") {
      console.error("[renderer] approval card exit unbound: onApprove missing")
      return
    }
    const promptId = payload?.promptId ?? item?.promptId ?? null
    settleExit(handlers.onApprove(promptId, verdict), handlers)
  }
}

/** 键位胶水（③）：闭集命中 ⇒ `preventDefault` + 触发核卡内对应出口控件；表外 ⇒ 零动作（不吞键）。
 *  `onApprove` 缺 ⇒ 不挂（两态通则 —— 不夺焦）。 */
function keyHandlerOf(shape, card, handlers) {
  if (typeof handlers?.onApprove !== "function") return null
  return (event) => {
    const verdict = verdictOfKey(shape, event?.key)
    if (verdict === null) return
    const target = typeof card.querySelector === "function" ? card.querySelector(EXIT_SELECTOR[verdict]) : null
    if (target === null || target === undefined || typeof target.click !== "function") return
    event.preventDefault()
    target.click()
  }
}

/** 审批卡（核卡工厂直取 + 端壳四件）：返回卡元素（核卡自带 `data-prompt-id`；端补 `data-card` / `data-shape` /
 *  `data-autofocus` 锚）。`handlers` = 流面接线（`onApprove` ∕ `onOpenFile` ∕ `onCardRefresh` —— `renderer/app.mjs`）。 */
export function approvalCardNode(item, handlers = {}) {
  const shape = shapeOf(item)
  const model = cardModelOf(item, shape)
  const deps = { emit: emitBridge(item, handlers) }
  const card = shape === "batch" ? renderBatchApprovalCard(model, deps) : renderApprovalCard(model, deps)
  card.setAttribute("data-card", "approval")
  if (hasText(item?.shape)) card.setAttribute("data-shape", item.shape)
  // ④ 置焦锚：最安全键（逐项 ⇒ deny ∕ 批 ⇒ deny —— 两形同目标，沿核三出口类名）
  const safe = card.querySelector(".deny")
  if (safe !== null && safe !== undefined) safe.setAttribute("data-autofocus", "1")
  // ⑤ 大 diff 钮：无单径（`apply_patch` 形）⇒ 退场（不引入死控 —— 桌面零外部 diff 查看器）
  if (diffPathOf(item) === null) card.querySelector(".view-diff")?.remove()
  const onKeyDown = keyHandlerOf(shape, card, handlers)
  if (onKeyDown !== null && typeof card.addEventListener === "function") card.addEventListener("keydown", onKeyDown)
  return card
}
