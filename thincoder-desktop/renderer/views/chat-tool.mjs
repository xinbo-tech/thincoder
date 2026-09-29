/**
 * chat-tool.mjs — 工具卡面（`docs/desktop/design/UI.md` §1 工具卡行 · `docs/desktop/design/RENDERER.md` §1.1「纯构树」切面）。
 * 本档 = 批档 §2.3 在册**拆分预案**落形：`chat.mjs` 交付实读越 300 层 ⇒ 工具块构树三件（头行 / 改动摘要 / 卡）+
 * 折叠纯函数 `toggleExpanded` 拆出；控件接线两态原语（`wire` / `withKey`）随迁 —— 工具头 / 回填 / 药丸三控件同源，
 * 住本档守依赖单向（`chat.mjs` → 本档；反向无引用 ⇒ 无环）。
 *   ① 头行：数据串（名称 / 参数摘要）+ 状态词（闭枚举单源 = 核词表）+ 耗时（仅 `done` / `error` ∧ 数）——
 *      **四段逐段包元素**（`span[data-seg]` —— 裸串直作 flex 行子 ⇒ `gap` 静默失效；通则 = `docs/desktop/design/RENDERER.md` §1.1）；
 *   ② 改动摘要：`files` 计数 + 增删合计 ⇒ 越阈（文件数 ∨ 增删合计）降级 = 只留摘要行（零 `[data-file]`）；
 *   ③ 结果区：核件面（R3c —— 截断口径单源 = 核 `lib.mjs` `capText`：超 64K 截断并自携说明）；`result` 非空 ∧ 展开态；
 *      `result` 空 ⇒ 头行退纯展示 `div`（零 toggle 控件 —— 诚实非死控）；
 *   ④ 折叠判据：显式 `expanded` 优先；缺省 = `status="error"` **或 `"running"`** 展开（错误取证优先 + 运行期增量在场 —— 「对齐第三批」项 3）；
 *   ⑤ 共享导出面（**消费零副本** —— `views/approval.mjs`（审批卡）/ `views/activity.mjs`（活动池）复用）：
 *      `STATUS_WORD`（状态词**闭枚举 8 词**中本表七键——单源 = `docs/desktop/design/UI.md` §1 状态词行；就绪词形单列 = CLI 静息值、桌面无码位；含「对齐第三批」项 5 增词 `interrupted`）+ 降级阈值两常数 + `changeTotals` / `toolChanges`（改动摘要降级形）；
 *   ⑥ **「对齐第三批」面**（本档）：头行**摘要段**（项 1 —— `→ ` + 核 `formatToolSummary` 直取）+ **轮次段**
 *      （项 14 —— advisor `(round N · model)` 同 VSC `ui.js:104-107` 式）+ 运行期展开（项 3）+ 中止词（项 5）
 *      + 结果区**链接着装 / 委托**（相抵② 渲染半 —— 核 `linkifyPaths` + `data-path` 锚 + 点按 / Enter 出口）。
 *   ⑦ **就地更新面（更新纪律收核批 —— #605 消）**：`patchToolCard`（帧界 `patch` 档 —— 头行分段刷 ∕ 改动摘要行增替 ∕ 结果区 `appendToolOutput` O(1) 追加；**节点身份不变** —— 跨 chunk 结果区自滚位 ∕ 选区保真）。
 * 文案一律经 `t()`（零硬编码；`+` / `−` 字形住 `renderer/chat.css`）；零 `node:` / 零裸包。
 */
import { build, clear, text } from "../dom.mjs"
import { t } from "../i18n.mjs"
import { capText } from "/rc/lib.mjs"
import { formatToolSummary } from "/rc/tool-summary.mjs"
import { linkifyPaths } from "/rc/flow/tool-card.mjs"
import { appendToolOutput } from "/rc/flow/stream.mjs"
import { labelNode } from "./chat-text.mjs"
import { blockKey } from "./chat-stream.mjs"

/** 状态词码 → 词键（核五键 + 宿主两键 `tab.badge.approval` / `tool.interrupted` —— 单源不复制）；表外码 ⇒ 零状态词节点。
 *  导出 = 闭枚举单源：工具卡头行与池面活动块 / 队列条目同表（消费零副本）。 */
export const STATUS_WORD = Object.freeze({
  queued: "sub.queued",
  running: "sub.running",
  approval: "tab.badge.approval",
  done: "sub.done",
  stopped: "sub.stopped",
  // 「对齐第三批」项 5：中止清扫词（值逐字同 VSC locales —— 字面走端供给面，键面入词表）
  interrupted: "tool.interrupted",
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

/** 文本段节点（**通则单源** —— `docs/desktop/design/RENDERER.md` §1.1「文本段行形态通则」）：非空串 ⇒
 *  `span[data-seg="<段码>"]`；段缺席（非串 / 空串）⇒ `null`（**零节点** —— 空段仍占 flex 项 = 假间隔）；
 *  导出 = 四处行内多段面（工具卡头行 / 池条目标签行 / 审批卡首行 / 计划行）同表消费（零副本）。 */
export function segNode(code, value) {
  if (typeof value !== "string" || value === "") return null
  return { tag: "span", props: { "data-seg": code }, children: [value] }
}

/** 折叠判据（显式优先；缺省 = `error` ∨ `running` 展开 —— 「对齐第三批」项 3：运行期增量在场 ⇒ 体在场；
 *  chunk 到达清显式旗归归约面 `onToolOutput`）。 */
function isExpanded(block) {
  return typeof block?.expanded === "boolean" ? block.expanded : block?.status === "error" || block?.status === "running"
}

/** advisor 轮次标签（「对齐第三批」项 14 —— 字面 = VSC `webview/ui.js:104-107` 同式）：`(round N · model)`；
 *  无 `model` ⇒ 降级形 `(round N)`（不显空）；`round` 缺 / 非数 ⇒ `""`（零段 —— 非 advisor / 无载荷逐字同修前）。
 *  逐字面向用户文案（格式串 —— 同 VSC 内联串；核 / VSC 两源皆无此键）。 */
function roundTag(block) {
  const round = block?.round
  if (typeof round !== "number" || !Number.isFinite(round)) return ""
  const model = typeof block?.model === "string" && block.model !== "" ? block.model : ""
  return model === "" ? `(round ${round})` : `(round ${round} · ${model})`
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

/** 头行段表（非空段 · 值 = 段文本 —— **一源两用**：建树 `toolHead` ∥ 就地分段刷 `paintHeadRow`；段序 = 建树序）。 */
function headSegments(block) {
  const word = STATUS_WORD[block?.status]
  const timed = TIMED_STATUS.includes(block?.status) && Number.isFinite(block?.durationMs)
  const summary = hasText(block?.result) ? formatToolSummary(block?.name, block.result) : null
  return [
    { code: "name", value: block?.name },
    { code: "round", value: roundTag(block) },
    { code: "args", value: block?.argsSummary },
    { code: "status", value: word === undefined ? null : t(word) },
    { code: "time", value: timed ? t("chat.tool.duration", { seconds: (block.durationMs / 1000).toFixed(1) }) : null },
    // 「对齐第三批」项 1：结果摘要段 —— 字面 = `→ ` + 核 `formatToolSummary` 直取；摘要空 ⇒ 零段（禁假造）
    { code: "summary", value: hasText(summary) ? `→ ${summary}` : null },
  ].filter((seg) => hasText(seg.value))
}

/** 工具卡头行：数据串（名称 / 轮次 / 参数摘要）+ 状态词（闭枚举）+ 耗时（两态）+ 摘要段（项 1）——非空才落。
 *  两态：有 `result` ⇒ `button`（可开关控件 + 接线两态）；空 ⇒ 纯展示 `div`（零 toggle 控件）。 */
function toolHead(block, key, handlers) {
  const props = {
    class: "tool-head",
    "data-tool-head": "",
    "data-status": typeof block?.status === "string" ? block.status : undefined,
  }
  const children = headSegments(block).map((seg) => segNode(seg.code, seg.value))
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

/** 工具卡（三行 · `data-block-id` = 本块键）：[说话人标签?] + 头行 + 改动摘要行 + [展开结果区?]（`result` 非空 ∧ 展开态）。
 *  结果文本 = 核 `capText`（截断口径单源 —— 超 64K ⇒ 截断 + 核自携说明；DOM 有界）。
 *  `withLabel` 真 ⇒ 首子挂说话人标签容器（回合首块判据归 `renderer/views/chat.mjs` —— 本档只落形；
 *  容器单源 = `renderer/views/chat-text.mjs` `labelNode`）。 */
export function toolCard(block, key, handlers, withLabel = false) {
  const rows = hasText(block?.result) && isExpanded(block)
    ? [{ tag: "div", props: { class: "tool-result", "data-tool-result": "" }, children: [capText(block.result)] }]
    : []
  return {
    tag: "div",
    props: { class: "block block-tool", "data-block-id": key, "data-block-kind": "tool" },
    children: [...(withLabel ? [labelNode("assistant")] : []), toolHead(block, key, handlers), toolChanges(block), ...rows],
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

/** 头行分段刷（就地更新径 —— 不重建头行元素）：`data-status` 直刷；**段码序变**（形变帧：首结果落位 ∕ 收束耗时 / 摘要段出现）⇒ 子节点重建；**同形 ⇒ 逐段值写**（等价 ⇒ 零写）。
 *  摘要段 = 全量结果派生（`formatToolSummary`）——每帧至多一次（帧界节流；沿 VSC「摘要 = 收束时算」口径）。 */
function paintHeadRow(head, block) {
  const status = typeof block?.status === "string" ? block.status : null
  if (status === null) head.removeAttribute?.("data-status")
  else head.setAttribute("data-status", status)
  const want = headSegments(block)
  const rows = typeof head.querySelectorAll === "function" ? [...head.querySelectorAll("[data-seg]")] : []
  const sameShape = rows.length === want.length && rows.every((row, idx) => row.getAttribute?.("data-seg") === want[idx].code)
  if (sameShape) {
    rows.forEach((row, idx) => { if (row.textContent !== want[idx].value) text(row, want[idx].value) })
    return
  }
  clear(head)
  for (const seg of want) head.append(build(segNode(seg.code, seg.value)))
}

/** 工具卡就地更新（帧界 `patch` 档 —— **节点身份不变**：头行分段刷 + 改动摘要行增替 + 结果区 O(1) 追加；
 *  #605 消 —— 跨 chunk 结果区自滚位 ∕ 选区保真）。结果区三态：
 *  ① 在场判据（`result` 非空 ∧ 展开态）假 ⇒ 摘；② 首见 ⇒ 建（`_written` 起点）+ 全量落笔；
 *  ③ 存量 ∧ 运行期 ⇒ 增量追加（`appendToolOutput` —— O(chunk)）；存量 ∧ 已收束 ⇒ **换代全量改写一次**
 *  （收束文本非流式前缀 —— bash 包装行等；沿 VSC `finishToolCard` 同径，同引用 ⇒ 零写）。
 *  `key` = 块键（toggle 接线同域 —— `renderer/views/chat-stream.mjs` `blockKey`）。 */
export function patchToolCard(node, block, key, handlers = {}) {
  if (!node || typeof node.querySelector !== "function") return node
  const head = node.querySelector("[data-tool-head]")
  if (head === null || head === undefined) return node
  const toggled = typeof head.getAttribute === "function" && head.getAttribute("data-action") === "chat:tool-toggle"
  if (hasText(block?.result) !== toggled) head.replaceWith(build(toolHead(block, key, handlers)))
  else paintHeadRow(head, block)
  // 改动摘要行（收束时出现；内容换代 ⇒ 原位换 —— 无滚动 ∕ 选区面；同 `changes` 引用 ⇒ 零写，沿 `_ledgerLines` 判例）
  const changes = toolChanges(block)
  const changesRow = node.querySelector("[data-tool-changes]")
  if (changes === null) {
    if (changesRow) changesRow.remove()
  } else if (changesRow === null || changesRow === undefined || changesRow._changes !== (block?.changes ?? null)) {
    const fresh = build(changes)
    fresh._changes = block?.changes ?? null
    if (changesRow === null || changesRow === undefined) {
      const body0 = node.querySelector("[data-tool-result]")
      if (body0 === null || body0 === undefined) node.append(fresh)
      else node.insertBefore(fresh, body0)
    } else changesRow.replaceWith(fresh)
  }
  // 结果区（#605 判据面 —— 跨 chunk 同一元素：scrollTop ∕ 选区保真）
  const result = typeof block?.result === "string" ? block.result : ""
  let body = node.querySelector("[data-tool-result]")
  if (result === "" || !isExpanded(block)) {
    if (body) body.remove()
  } else {
    if (body === null || body === undefined) {
      body = build({ tag: "div", props: { class: "tool-result", "data-tool-result": "" }, children: [] })
      body._written = 0
      node.append(body)
    }
    const written = typeof body._written === "number" ? body._written : body.textContent.length // 建树径：DOM 已持 `capText(result)` ⇒ 起点 = 现读数长
    if (block?.status !== "running") {
      if (body._settled !== result) {
        text(body, capText(result))
        body._settled = result
        body._written = result.length
        body._linked = null // 体换代（重写）⇒ 链接记账复位（尾段 `linkifyResult` 重着）
      }
    } else if (result.length > written) {
      appendToolOutput(body, result.slice(written))
      body._written = result.length
    }
  }
  linkifyResult(node, block)
  return node
}

/** 结果区链接着装（「对齐第三批」相抵② 渲染半 · 帧尾着装幂等）：结果区挂核 `linkifyPaths`（逐文本节点包
 *  `span.file-link`）⇒ 着装面补 `data-path` / `data-line` 锚；`links` 缺 / 空 ∨ 结果区缺 ⇒ 零动作（禁假造）。
 *  **幂等闸**：同一 `links` 引用只着装一次（`body._linked` 记账 —— 核件非幂等：重包会嵌层 `.file-link` ∕ 丢选区）；
 *  体换代 ⇒ 记账复位。`linkify` 注入面 = 平 node 直测缝（缺省 = 核件 `linkifyPaths`）。 */
export function linkifyResult(node, block, linkify = linkifyPaths) {
  const links = Array.isArray(block?.links) ? block.links : []
  if (links.length === 0) return node
  const body = typeof node?.querySelector === "function" ? node.querySelector("[data-tool-result]") : null
  if (body === null || body === undefined) return node
  if (body._linked === links) return node // 同引用 ⇒ 零动作（防嵌层）
  try {
    linkify(body, links)
  } catch (error) {
    // 核件 `linkifyPaths` 依赖浏览器面（`window.NodeFilter` / `document.createTreeWalker`）——平 node 用例面缺两件
    // ⇒ **一行诊断 + 零链接**（响亮 · 不拆帧；禁静默）；生产面（真 DOM）不触本支。
    console.error("[chat] file-link dressing unavailable:", error)
    return node
  }
  const byRaw = new Map(links.map((link) => [link?.raw, link]))
  const spans = typeof body.querySelectorAll === "function" ? [...body.querySelectorAll(".file-link")] : []
  for (const span of spans) {
    if (span.getAttribute("data-path") !== null) continue
    const link = byRaw.get(span.textContent)
    if (link === undefined || typeof link.path !== "string" || link.path === "") continue
    span.setAttribute("data-path", link.path)
    if (typeof link.line === "number" && Number.isFinite(link.line)) span.setAttribute("data-line", String(link.line))
  }
  body._linked = links // 幂等闸记账（同引用 ⇒ 下次零动作；体换代处清）
  return node
}

/** 文件链接命中（相抵② 出口判据 · 纯函数）：自目标上溯最近 `.file-link` 且携非空 `data-path` ⇒ `{ path, line? }`；
 *  余（非链接 / 锚缺 —— 未着装）⇒ `null`（零误发）。 */
export function fileLinkOf(target) {
  for (let node = target; node !== null && node !== undefined; node = node.parentNode) {
    if (node.classList?.contains?.("file-link") !== true) continue
    const path = typeof node.getAttribute === "function" ? node.getAttribute("data-path") : null
    if (typeof path !== "string" || path === "") return null
    const rawLine = typeof node.getAttribute === "function" ? node.getAttribute("data-line") : null
    const line = Number(rawLine)
    return Number.isInteger(line) && line > 0 ? { path, line } : { path }
  }
  return null
}

/** 点按 / Enter 委托（相抵② **出口单点** —— 装配期一次注册，幂等 `_fileLinksBound` 记账）：命中 ⇒ `open(path, line?)`；
 *  余 ⇒ 零动作（零误发）。回值 = 本次是否完成注册。 */
export function bindFileLinks(root, open) {
  if (!root || typeof root.addEventListener !== "function" || typeof open !== "function" || root._fileLinksBound === true) return false
  root._fileLinksBound = true
  const fire = (hit) => { if (hit !== null) open(hit.path, hit.line) }
  root.addEventListener("click", (event) => fire(fileLinkOf(event?.target)))
  root.addEventListener("keydown", (event) => { if (event?.key === "Enter") fire(fileLinkOf(event?.target)) })
  return true
}
