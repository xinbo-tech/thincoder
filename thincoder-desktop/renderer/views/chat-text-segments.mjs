/**
 * chat-text-segments.mjs — 巨块分段挂载窗（E4-JS 支 · 机制 ∕ 参数单源 = 批档 `docs/batches/2026-09-30-desktop-heap-freeze.md`
 * §2.15 ∥ `docs/desktop/design/RENDERER.md` §2「巨块分段窗」/§3「巨块段窗滚动作」）：
 * ① 段 = 渲染文本 12K 字符（上限）；进分段阈值 > 24K（预筛 = `block.text` 长，廉价先于 DOM 走）；分区 = 文本节点级 `splitText`
 *    + 行内续跑 `<span data-seg="<段号>">` 包壳（块级件下潜不跨语境 ⇒ 全挂态折行同未分段；字符零增 ∕ 减 ∕ 变）；
 * ② 窗 = 视口段 ±1（跟滚 ⇒ 底窗零读）；切换 = `display:none`（**文本恒在 DOM**）；每帧段状态变更 ≤2（初窗 ∥ 重挂转移不计）；
 * ③ 补偿 = 帧尾第 ⑦ 步（六步之后 —— 与 [t0,t1] ∥ 回填互不叠算）：只计视口顶锚之上净变；**先读后卸**；读 ∥ 写分拍
 *    （**写后复读仅补偿路径**）；跟滚帧零读（贴底写覆盖）；
 * ④ 分区 = 纯后处理（`patchTextBlock` ∥ 核画件调用点零改）；流式 = 帧尾「推进分区前沿」——滞后一帧稳态化（只切保持
 *    既有节点身份的件）；核画件换代件（`_liveMd.hot` 桶，**只读**）自然隔断；断链 ⇒ 全量重切（幂等）；
 * ⑤ 回滚三形：常量 `SEGMENT_MOUNT` ∥ 自动回退（分区抛错 ⇒ 该面退段 + `console.error`，不抛 ∥ 不全量放行）∥
 *    测试缝 `setSegmentMount`。面账 = WeakMap。射程：`reasoning` 面本期零启用（§2.15-E⑤ 点名，非静默缩面）；
 *    巨块实证面 = `assistant` 文本。零 `node:` / 零裸包 ∕ 不引核件；纯函数面平 node 直测（段界 ∥ 窗 ∥ 预算 ∥ 补偿）。
 */
import { stickToBottom } from "./chat-scroll.mjs"

export const SEGMENT_CHARS = 12_000 // 段 = 渲染文本 12K 字符（上限）
export const SEGMENT_ENTER_CHARS = 24_000 // 进分段阈值（> 24K —— 以下整块直挂）
export const SEGMENT_PAD = 1 // 窗 = 视口段 ±1（可见 ≤4 段）
export const SEGMENT_MOUNT = true // 回滚形①：常量开关（false ⇒ 零分区 ∥ 零窗 = 整块直挂 = 现状）
let enabled = SEGMENT_MOUNT === true

/** 测试缝 ∥ 自动回退写点（回滚形③ —— 用户面不暴露）；读面 = `segmentMountActive`。 */
export function setSegmentMount(value) { enabled = value === true; return enabled }
export function segmentMountActive() { return enabled === true }

/** 段界计划：渲染字符长 ⇒ 段数（空文 ⇒ 1 段）；`segmentBounds` = 段界表（逐段拼接 ≡ 全体 —— G2）；
 *  `segmentIndexOf` = 单点定位（字符位 ⇒ 段号，夹取）。 */
export function segmentCount(length) {
  const total = Number.isFinite(length) && length > 0 ? Math.floor(length) : 0
  return Math.max(1, Math.ceil(total / SEGMENT_CHARS))
}
export function segmentBounds(length) {
  const total = Number.isFinite(length) && length > 0 ? Math.floor(length) : 0
  const out = []
  for (let index = 0; index < segmentCount(total); index += 1) {
    out.push({ start: index * SEGMENT_CHARS, end: Math.min(total, (index + 1) * SEGMENT_CHARS) })
  }
  return out
}
export function segmentIndexOf(offset, length) {
  const at = Number.isFinite(offset) && offset > 0 ? Math.floor(offset) : 0
  return clamp(Math.floor(at / SEGMENT_CHARS), 0, segmentCount(length) - 1)
}

/** 窗归一（`last < first` ⇒ 空窗 —— 初态）∥ 首窗（非跟滚新块默认）∥ 底窗（跟滚 —— 零读直取）∥ 视口窗（段 ±1）。 */
const clamp = (value, low, high) => Math.max(low, Math.min(high, value))
const totalOf = (count) => Math.max(1, Math.floor(Number.isFinite(count) ? count : 1))
function windowOf(window, total) {
  return {
    first: clamp(Number.isFinite(window?.first) ? Math.floor(window.first) : 0, 0, total - 1),
    last: clamp(Number.isFinite(window?.last) ? Math.floor(window.last) : -1, -1, total - 1),
  }
}
export function headWindow(count) {
  const total = totalOf(count)
  return { first: 0, last: Math.min(total - 1, SEGMENT_PAD) }
}
export function tailWindow(count) {
  const total = totalOf(count)
  return { first: Math.max(0, total - 1 - SEGMENT_PAD), last: total - 1 }
}
export function padWindow({ viewFirst = 0, viewLast = 0 } = {}, count) {
  const total = totalOf(count)
  return {
    first: clamp(Math.floor(Number.isFinite(viewFirst) ? viewFirst : 0) - SEGMENT_PAD, 0, total - 1),
    last: clamp(Math.floor(Number.isFinite(viewLast) ? viewLast : 0) + SEGMENT_PAD, 0, total - 1),
  }
}

/** 窗步（**每帧段状态变更 ≤2** 保证）：`first` ∥ `last` 各向目标移至多一步（快跳 ∥ 拖条 = 渐进收敛）。
 *  `windowDelta` = 窗差（卸 ∥ 挂段集）；`budgetChanges` = 预算削减（至多一卸 + 一挂 —— 防御面）。 */
export function stepWindow(current, target, count) {
  const total = totalOf(count)
  const here = windowOf(current, total)
  const want = windowOf(target, total)
  const first = clamp(here.first + clamp(want.first - here.first, -1, 1), 0, total - 1)
  const last = clamp(here.last + clamp(want.last - here.last, -1, 1), 0, total - 1)
  return first <= last ? { first, last } : { first: Math.min(first, last), last: Math.max(first, last) }
}
export function windowDelta(current, next, count) {
  const total = totalOf(count)
  const here = windowOf(current, total)
  const want = windowOf(next, total)
  const hides = []
  const shows = []
  for (let seg = 0; seg < total; seg += 1) {
    const was = seg >= here.first && seg <= here.last
    const now = seg >= want.first && seg <= want.last
    if (was && !now) hides.push(seg)
    else if (!was && now) shows.push(seg)
  }
  return { hides, shows }
}
export function budgetChanges(hides = [], shows = []) {
  const hide = Array.isArray(hides) ? hides : []
  const show = Array.isArray(shows) ? shows : []
  return { hides: hide.slice(0, 1), shows: show.slice(0, 1), dropped: Math.max(0, hide.length - 1) + Math.max(0, show.length - 1) }
}

/** 锚上高（纯 · 屏面口径）：`rect` 落在视口顶锚之上的部分（锚下 ∥ 缺件 ⇒ 0）；`compensateSegments` = 同口径求和。
 *  `aboveOf` ∥ `segmentShift` = **段序口径**（内容序锚前 ⇒ 全高 —— 屏面部分量在写后跨锚位会欠补偿，实测修正）；
 *  同段 ⇒ 屏面部分量（跨锚段 —— 罕见）。 */
export function aboveHeight(rect, anchorTop) {
  if (rect === null || typeof rect !== "object") return 0
  const top = Number.isFinite(rect.top) ? rect.top : 0
  const height = Number.isFinite(rect.height) ? rect.height : 0
  return Math.max(0, Math.min(height, (Number.isFinite(anchorTop) ? anchorTop : 0) - top))
}
export function compensateSegments({ anchorTop = 0, hides = [], shows = [] } = {}) {
  let delta = 0
  for (const rect of Array.isArray(shows) ? shows : []) delta += aboveHeight(rect, anchorTop)
  for (const rect of Array.isArray(hides) ? hides : []) delta -= aboveHeight(rect, anchorTop)
  return delta
}
export function aboveOf(entry, anchorSeg, anchorTop) {
  const seg = Number.isFinite(entry?.seg) ? entry.seg : 0
  const rect = entry?.rect ?? null
  if (seg < anchorSeg) return rect === null || !Number.isFinite(rect.height) ? 0 : rect.height
  if (seg > anchorSeg) return 0
  return aboveHeight(rect, anchorTop)
}
export function segmentShift({ anchorSeg = 0, anchorTop = 0, hides = [], shows = [] } = {}) {
  let delta = 0
  for (const entry of Array.isArray(shows) ? shows : []) delta += aboveOf(entry, anchorSeg, anchorTop)
  for (const entry of Array.isArray(hides) ? hides : []) delta -= aboveOf(entry, anchorSeg, anchorTop)
  return delta
}

const ACCOUNTS = new WeakMap() // 面账（face → 记录）

/** 行内件表（可整件入壳；表外（含 md 块级产出）一律下潜 —— 块级不跨语境包壳）。 */
const INLINE_TAGS = new Set([
  "A", "B", "BR", "BUTTON", "CITE", "CODE", "EM", "FONT", "I", "IMG", "INPUT", "KBD", "LABEL", "MARK",
  "Q", "S", "SMALL", "SPAN", "STRONG", "SUB", "SUP", "TIME", "U", "VAR", "WBR",
])

/** 巨块预筛（廉价 —— 先于 DOM 走）：原文长 > 24K ∧ 非 `reasoning` 面（本期零启用）。 */
export function giantPrefilter(block) {
  return typeof block?.text === "string" && block.text.length > SEGMENT_ENTER_CHARS && block?.kind !== "reasoning"
}

/** 面取件（`[data-raw]` = 文本面唯一产出点 = `views/chat-text.mjs` `textFace`）∥ 归属件取（`data-block-*` 键面）。 */
const faceOf = (node) => (typeof node?.querySelector === "function" ? node.querySelector("[data-raw]") : null)
const holderOf = (face, attr) => (typeof face?.closest === "function" ? face.closest(`[${attr}]`) : null)

/** 换代件集（核画件热区桶 `el._liveMd.hot` —— 下一帧必被弃 ∥ 重造 ⇒ **不切**（换代节点自然隔断）；只读面）。 */
function hotSetOf(face) {
  const state = face?._liveMd
  const set = new Set()
  if (state === null || state === undefined || !Array.isArray(state?.hot)) return set
  for (const bucket of state.hot) for (const node of bucket?.nodes ?? []) set.add(node)
  return set
}

/** 件字符长（文本件 ⇒ 自身；元素件 ⇒ 子树渲染文本和 —— 零字符串物化）∥ 文档序续点（尽 ⇒ null）。 */
function lengthOf(node) {
  if (node?.nodeType === 3) return String(node.data ?? "").length
  let total = 0
  for (const child of node?.childNodes ?? []) total += lengthOf(child)
  return total
}
function afterSubtree(node, root) {
  let cursor = node
  while (cursor !== null && cursor !== undefined && cursor !== root) {
    if (cursor.nextSibling !== null && cursor.nextSibling !== undefined) return cursor.nextSibling
    cursor = cursor.parentNode
  }
  return null
}

/** 下一段界（自 `chars` 起的 12K 倍位）∥ 段界内单段判定（行内整件入壳前提）∥ 壳节点（`<span data-seg="<段号>">`，
 *  初态按现窗显隐）∥ 入壳（同段相邻件并壳 —— 行内续跑）。 */
const nextBoundary = (chars) => (Math.floor(chars / SEGMENT_CHARS) + 1) * SEGMENT_CHARS
const fitsSegment = (chars, length) => Math.floor(chars / SEGMENT_CHARS) === Math.floor((chars + length - 1) / SEGMENT_CHARS)
function shellNode(record, seg) {
  const span = record.face.ownerDocument.createElement("span")
  span.setAttribute("data-seg", String(seg))
  span.style.display = seg >= record.window.first && seg <= record.window.last ? "" : "none"
  if (record.segs[seg] === undefined) record.segs[seg] = []
  record.segs[seg].push(span)
  return span
}
function wrapNode(record, node) {
  const seg = Math.floor(record.chars / SEGMENT_CHARS)
  const tail = record.tail
  if (tail !== null && tail.seg === seg && tail.span.parentNode === node.parentNode && afterSubtree(tail.span, record.face) === node) {
    tail.span.appendChild(node)
    return tail.span
  }
  const span = shellNode(record, seg)
  node.parentNode.insertBefore(span, node)
  span.appendChild(node)
  record.tail = { span, seg }
  return span
}

/** 分区推进（游标机）：自 `from` 按段界切至 `target` 字符位（`MAX_SAFE_INTEGER` ⇒ 全量）。
 *  文本件 ⇒ `splitText` 界分 + 入壳；行内整件（单段内）⇒ 整件入壳；余件 ⇒ 下潜（**文本节点级**）；遇 `hot` ⇒ 止。 */
function cutTo(record, from, target, hot) {
  let node = from
  while (node !== null && node !== undefined && record.chars < target) {
    if (hot !== undefined && hot.has(node)) break
    const next = afterSubtree(node, record.face)
    if (node.nodeType === 3) {
      const boundary = nextBoundary(record.chars)
      const end = record.chars + String(node.data ?? "").length
      if (end > boundary && boundary <= target) {
        node = node.splitText(boundary - record.chars)
        wrapNode(record, node.previousSibling)
        record.chars = boundary
        continue
      }
      if (end > target) break
      wrapNode(record, node)
      record.chars = end
    } else if (node.nodeType === 1) {
      const length = lengthOf(node)
      if (length > 0 && INLINE_TAGS.has(node.tagName) && record.chars + length <= target && fitsSegment(record.chars, length)) {
        wrapNode(record, node)
        record.chars += length
      } else if (node.firstChild !== null && node.firstChild !== undefined) {
        node = node.firstChild
        continue
      }
    }
    node = next
  }
  return record.chars
}

/** 待切件快照（尾件之后 —— 稳态判据输入）∥ 退段（重切前置 ∥ 回滚形②：逐壳展开 + 面账清除）。 */
function pendingOf(record) {
  const out = []
  let node = record.tail === null ? record.face.firstChild : afterSubtree(record.tail.span, record.face)
  while (node !== null && node !== undefined) {
    if (node.nodeType === 3 || node.nodeType === 1) out.push({ node, len: lengthOf(node) })
    node = afterSubtree(node, record.face)
  }
  return out
}
function unwrap(face) {
  ACCOUNTS.delete(face)
  if (typeof face?.querySelectorAll !== "function") return
  for (const span of face.querySelectorAll("span[data-seg]")) {
    const parent = span.parentNode
    if (parent === null || parent === undefined) continue
    while (span.firstChild !== null && span.firstChild !== undefined) parent.insertBefore(span.firstChild, span)
    parent.removeChild(span)
  }
}

/** 分区（**全量重切** —— 幂等：同渲染文本 ⇒ 同段界）：退旧壳 ⇒ 全量推进 ⇒ 面账落位；抛错 ⇒ 该面退段（回滚形②）。
 *  窗承旧（断链重切后窗位不倒退）；换代件不切（`hot`）。 */
function recut(face) {
  const previous = ACCOUNTS.get(face)
  try {
    unwrap(face)
    const record = {
      face, raw: String(face.getAttribute("data-raw") ?? ""), chars: 0, count: 1,
      segs: [], tail: null, window: previous === undefined ? { first: 0, last: -1 } : previous.window, waits: [],
    }
    cutTo(record, face.firstChild, Number.MAX_SAFE_INTEGER, hotSetOf(face))
    record.count = segmentCount(record.chars)
    record.window = windowOf(record.window, record.count)
    record.waits = pendingOf(record)
    ACCOUNTS.set(face, record)
    return record
  } catch (error) {
    console.error("[renderer] segment partition failed (face reverted):", error)
    return null
  }
}

/** 分区保持（帧面）：链存续 ∧ 原文前缀延展 ∧ 位账自洽 ⇒ 稳态推进；否则 ⇒ 断链重切 + **一次性初窗**（活面首分区径 ——
 *  跟滚 ⇒ 底窗，否则首窗；拉回初窗与挂载径同口径，免空窗起爬 ∥ 假预算报错）。
 *  稳态推进（**滞后一帧** —— 只切「保持既有节点身份」的件；核画件换代件（`hot`）恒不切）：返回新增字符数。 */
function ensure(face, following) {
  const raw = String(face.getAttribute?.("data-raw") ?? "")
  const record = ACCOUNTS.get(face)
  const alive = record !== undefined && record.tail !== null && face.contains?.(record.tail.span) === true && raw.startsWith(record.raw)
  if (!alive) {
    const fresh = recut(face)
    if (fresh !== null) applyWindow(fresh, following === true ? tailWindow(fresh.count) : headWindow(fresh.count))
    return fresh
  }
  const pending = pendingOf(record) // 现刻待切区（文档序 —— 尾件之后）
  let rest = 0
  for (const entry of pending) rest += entry.len
  if (lengthOf(face) - rest !== record.chars) return recut(face) // 位账漂移（前缀被重渲）⇒ 全量重切
  advance(record, raw, pending, hotSetOf(face))
  return record
}
function advance(record, raw, pending, hot) {
  const before = record.chars
  const waits = record.waits
  if (record.tail !== null && waits.length > 0) {
    let limit = record.chars
    let index = 0
    let node = afterSubtree(record.tail.span, record.face)
    while (index < waits.length && index < pending.length && node === waits[index].node && node === pending[index].node
      && !hot.has(node) && lengthOf(node) === waits[index].len) {
      limit += waits[index].len
      index += 1
      node = afterSubtree(node, record.face)
    }
    if (limit >= nextBoundary(record.chars)) cutTo(record, afterSubtree(record.tail.span, record.face), nextBoundary(record.chars), hot)
  }
  record.count = segmentCount(record.chars)
  record.raw = raw
  record.waits = pendingOf(record)
  return record.chars - before
}

/** 窗落盘：`applyWindow` = **一次性**（初窗 ∥ 重挂转移；不计帧预算）；`applyStep` = 帧步（预算裁剪 —— ≤ 一卸 + 一挂；
 *  窗记录 = 应用后实况）∥ 段矩形（首 ∥ 末壳联集 —— 只对已显示段有真值；缺壳 ⇒ `null`）。 */
const setSegDisplay = (record, seg, visible) => {
  for (const span of record.segs[seg] ?? []) span.style.display = visible ? "" : "none"
}
function applyWindow(record, next) {
  const delta = windowDelta(record.window, next, record.count)
  for (const seg of delta.hides) setSegDisplay(record, seg, false)
  for (const seg of delta.shows) setSegDisplay(record, seg, true)
  record.window = windowOf(next, record.count)
  return delta
}
function applyStep(record, next) {
  const delta = windowDelta(record.window, next, record.count)
  const budget = budgetChanges(delta.hides, delta.shows)
  if (budget.dropped > 0) console.error(`[renderer] segment window budget exceeded (dropped ${budget.dropped})`)
  for (const seg of budget.hides) setSegDisplay(record, seg, false)
  for (const seg of budget.shows) setSegDisplay(record, seg, true)
  const held = record.window
  let first = -1
  let last = -1
  for (let seg = 0; seg < record.count; seg += 1) {
    const visible = (seg >= held.first && seg <= held.last && !budget.hides.includes(seg)) || budget.shows.includes(seg)
    if (!visible) continue
    if (first < 0) first = seg
    last = seg
  }
  record.window = first < 0 ? held : { first, last }
  return budget
}
function segmentRect(record, seg) {
  const shells = record.segs[seg]
  if (!Array.isArray(shells) || shells.length === 0) return null
  const head = shells[0]
  const tail = shells[shells.length - 1]
  if (typeof head.getBoundingClientRect !== "function" || typeof tail.getBoundingClientRect !== "function") return null
  const top = head.getBoundingClientRect().top
  const bottom = tail.getBoundingClientRect().bottom
  return { top, bottom, height: bottom - top }
}

/** 锚分类（读 —— 视口顶锚面）：`{ seg }` = 含视口顶的段；`{ side: "above" }` = 面全在视口顶**之上**（变更全归锚上 ——
 *  全高）；`{ side: "below" }` = 全在之下（**零补偿** —— 面外变更不位移视口内容）。
 *  视口窗（读 —— 只量现窗内已显示段）：段内 ⇒ ±1 垫；窗带外 ⇒ 面上底窗 ∥ 面下首窗（渐进收敛）。 */
function anchorClassOf(root, record) {
  const bandTop = root.getBoundingClientRect().top
  let firstTop = null
  let lastBottom = null
  for (let seg = record.window.first; seg <= record.window.last; seg += 1) {
    const rect = segmentRect(record, seg)
    if (rect === null) continue
    if (firstTop === null) firstTop = rect.top
    lastBottom = rect.bottom
    if (rect.bottom > bandTop + 0.5 && rect.top <= bandTop + 0.5) return { seg }
  }
  if (lastBottom !== null && lastBottom <= bandTop + 0.5) return { side: "above" }
  if (firstTop !== null) return { side: "below" }
  return { seg: record.window.first }
}
function viewWindow(root, record) {
  const band = root.getBoundingClientRect()
  let viewFirst = -1
  let viewLast = -1
  for (let seg = record.window.first; seg <= record.window.last; seg += 1) {
    const rect = segmentRect(record, seg)
    if (rect === null) continue
    if (rect.bottom <= band.top + 0.5) continue
    if (rect.top >= band.bottom - 0.5) break
    if (viewFirst < 0) viewFirst = seg
    viewLast = seg
  }
  if (viewFirst >= 0) return padWindow({ viewFirst, viewLast }, record.count)
  const lastRect = record.window.last >= record.window.first ? segmentRect(record, record.window.last) : null
  if (lastRect !== null && lastRect.bottom <= band.top + 0.5) return tailWindow(record.count)
  const firstRect = record.window.first <= record.window.last ? segmentRect(record, record.window.first) : null
  if (firstRect !== null && firstRect.top >= band.bottom - 0.5) return headWindow(record.count)
  return { first: record.window.first, last: record.window.last }
}

/** 单块初窗（`dressNode` **首步** —— 先于一切读数；新块 = 跟滚 ⇒ 底窗 ∥ 否则首窗；一次性）。 */
export function mountSegments(node, block, following = false) {
  if (enabled !== true || !giantPrefilter(block)) return null
  const face = faceOf(node)
  if (face === null || typeof face?.getAttribute !== "function") return null
  if (lengthOf(face) <= SEGMENT_ENTER_CHARS) return null
  const record = recut(face)
  if (record === null) return null
  applyWindow(record, following === true ? tailWindow(record.count) : headWindow(record.count))
  return record
}

/** 重挂转移捕账（`mountChat` 清树**之前** —— 先捕旧账后建新树）：面键 = 最近 `[data-block-id]` 值 ⇒ 窗。
 *  批量初窗 + 重挂转移复填（`mountChat` 建树后 —— 先于一切读数步）：跟滚 ⇒ 底窗（跨重挂不倒退）；
 *  非跟滚 ⇒ 转移账 ?? 首窗（恢复径窗集保真）。 */
export function captureSegmentWindows(root) {
  const out = new Map()
  if (typeof root?.querySelectorAll !== "function") return out
  for (const face of root.querySelectorAll("[data-raw]")) {
    const record = ACCOUNTS.get(face)
    if (record === undefined) continue
    const key = holderOf(face, "data-block-id")?.getAttribute("data-block-id")
    if (typeof key === "string" && key !== "") out.set(key, { first: record.window.first, last: record.window.last })
  }
  return out
}
export function mountSegmentWindows(root, model, transfer) {
  if (enabled !== true || typeof root?.querySelectorAll !== "function") return 0
  const following = model?.following === true
  let opened = 0
  for (const face of root.querySelectorAll("[data-raw]")) {
    if (String(face.getAttribute?.("data-raw") ?? "").length <= SEGMENT_ENTER_CHARS) continue
    if (holderOf(face, "data-block-kind")?.getAttribute("data-block-kind") === "reasoning") continue // 本期零启用（§2.15-E⑤）
    if (lengthOf(face) <= SEGMENT_ENTER_CHARS) continue
    const record = recut(face)
    if (record === null) continue
    const key = holderOf(face, "data-block-id")?.getAttribute("data-block-id")
    const saved = transfer instanceof Map && typeof key === "string" ? transfer.get(key) : undefined
    applyWindow(record, following ? tailWindow(record.count) : saved === undefined ? headWindow(record.count) : saved)
    opened += 1
  }
  return opened
}

/**
 * 帧尾第 ⑦ 步（`settleFrame` 六步**之后** —— 独立显式补偿；与 [t0, t1] ∥ 回填互不叠算）：
 * ① 分区保持 ∥ 稳态推进 ② 读（目标窗；跟滚帧零读）②′ 读（先读后卸：锚分类 + 待卸段矩形）③ 写（切换 `display`）
 * ④ 补偿（跟滚 ⇒ 贴底写覆盖；非跟滚 ⇒ **写后复读**锚段首壳顶 ⇒ 真位移；锚段不可测 ⇒ 段序算式回退）。
 * 返回读数面（探针 ∥ 单测假源消费：`{ faces, hides, shows, delta, following }`）。
 */
export function segmentViewStep(root, model, mounted) {
  const readout = { faces: 0, hides: [], shows: [], delta: 0, following: model?.following === true }
  if (enabled !== true || root === null || typeof root?.getBoundingClientRect !== "function") return readout
  const records = []
  for (const item of Array.isArray(mounted) ? mounted : []) {
    if (!giantPrefilter(item?.block)) continue
    const face = faceOf(item.node)
    if (face === null) continue
    const record = ensure(face, readout.following)
    if (record !== null) records.push(record)
  }
  readout.faces = records.length
  if (records.length === 0) return readout
  const plans = []
  for (const record of records) {
    const target = readout.following ? tailWindow(record.count) : viewWindow(root, record)
    const step = stepWindow(record.window, target, record.count)
    const delta = windowDelta(record.window, step, record.count)
    if (delta.hides.length === 0 && delta.shows.length === 0) continue
    plans.push({ record, step, delta })
  }
  if (plans.length === 0) return readout
  // ②′ 读（先读后卸）：锚分类 + 锚段首壳顶（真位移基准）∥ 待卸段矩形（读数面）
  const bandTop = readout.following ? 0 : root.getBoundingClientRect().top
  for (const plan of plans) {
    readout.hides.push(...plan.delta.hides)
    readout.shows.push(...plan.delta.shows)
    plan.hides = readout.following ? [] : plan.delta.hides.map((seg) => ({ seg, rect: segmentRect(plan.record, seg) }))
    if (readout.following) continue // 跟滚帧零读（贴底写覆盖 —— 待卸矩形只服务非跟滚回退算式）
    plan.anchorClass = anchorClassOf(root, plan.record)
    plan.anchorBefore = plan.anchorClass.seg === undefined ? null : segmentRect(plan.record, plan.anchorClass.seg)?.top ?? null
    plan.anchorSeg = plan.anchorClass.seg ?? (plan.anchorClass.side === "above" ? plan.record.count : 0)
  }
  for (const plan of plans) applyStep(plan.record, plan.step) // ③ 写：切换（display）
  if (readout.following) {
    stickToBottom(root) // ④ 跟滚 ⇒ 变更后重写贴底超值（零读）
  } else {
    let delta = 0
    for (const plan of plans) {
      if (plan.anchorClass?.side === "below") continue
      const seg = plan.anchorClass?.seg
      const after = seg === undefined ? null : segmentRect(plan.record, seg)?.top ?? null
      if (plan.anchorBefore !== null && after !== null) {
        delta += after - plan.anchorBefore
        continue
      }
      const shows = plan.delta.shows.map((entry) => ({ seg: entry, rect: segmentRect(plan.record, entry) }))
      delta += segmentShift({ anchorSeg: plan.anchorSeg ?? 0, anchorTop: bandTop, hides: plan.hides ?? [], shows })
    }
    if (Math.abs(delta) > 0.5) root.scrollTop = (Number.isFinite(root.scrollTop) ? root.scrollTop : 0) + delta
    readout.delta = Math.round(delta * 100) / 100
  }
  return readout
}
