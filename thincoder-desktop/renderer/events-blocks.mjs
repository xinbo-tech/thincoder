/**
 * events-blocks.mjs — 块面归约径 + 块面原语（自 `renderer/events.mjs` 拆出——#510 留守拆档 · 2026-09-29；
 * 该档越 300 层按面续拆）。对话流块面归约体（推理 / 正文流式续写 / 工具块三径）与本档同族原语
 * （块面键门 `forActive` / 游标清点 `clearCursor` / 工具块定位 `indexOfTool` / 中断扇扫
 * `sweepRunningTools`）迁入；本档零反向 import（无环——`reduce` 分派面与余下通道归约体住
 * `events.mjs`）。
 * 纯结构搬移零语义（判据 / 注文逐字同源档）——形态单源 = `docs/desktop/design/RENDERER.md` §1.1；
 * 块面纪律（`blocks` 写须 `ev.key === state.activeSession`，否则原引用）见各归约体。
 */
import { appendBlock } from "./store.mjs"

/** 活流块 id 派生前缀（页块 id 域 = 核给（工具 id）/ 缺省无 —— 两域不混）。 */
const LIVE_ID = "live-"

/** 键过滤（块 / 池写者面）：非活动会话的事件 ⇒ 调用面原引用。 */
export function forActive(state, ev) {
  return ev.key === state.activeSession
}

/** 尾块定位（同 `id` 活块；`id === undefined` ⇒ 只认尾块 —— 无 id 事件不外扩）。 */
function indexOfTool(blocks, id) {
  for (let index = blocks.length - 1; index >= 0; index -= 1) {
    const block = blocks[index]
    if (block?.kind === "tool" && (id === undefined || block.id === id)) return index
  }
  return -1
}

/** 流式游标清点（#459 · KD-24 · `renderer/views/chat.mjs` 游标语义 = **末块追加态**）：命中带 `streaming` 真项者换
 *  **新块对象**（去游标 —— 位序与其余块引用不动）；无命中 ⇒ **原引用**（零通知）。清点须落块面引用 = 唯一刷新径（`blocks` 键变 ⇒ 帧触发 ⇒ 摘 `data-streaming` 锚）。 */
export function clearCursor(state) {
  const list = Array.isArray(state.blocks) ? state.blocks : []
  let hit = false
  const next = list.map((block) => {
    if (block?.streaming !== true) return block
    hit = true
    return { ...block, streaming: false }
  })
  return hit ? { ...state, blocks: next } : state
}

/** `ev:reasoning`——推理块增量（R3c · D19 · `docs/desktop/design/IPC.md` §1 该行）：续写判据 = **尾块 `kind === "reasoning"`**（与正文同形）；
 *  否则起新推理块；键门同 `onToken`（非活动会话零落）。 */
export function onReasoning(state, ev) {
  if (!forActive(state, ev)) return state
  const text = typeof ev.text === "string" ? ev.text : ""
  if (text === "") return state
  const blocks = state.blocks ?? []
  const tail = blocks[blocks.length - 1]
  if (!tail || tail.kind !== "reasoning") return appendBlock(state, { kind: "reasoning", id: `${LIVE_ID}${blocks.length}`, text })
  const head = typeof tail.text === "string" ? tail.text : ""
  return { ...state, blocks: [...blocks.slice(0, -1), { ...tail, text: head + text }] }
}

/** `ev:token`——助手尾块续写（判据 = 尾块 `kind === "assistant"` ∧ `streaming === true`）；否则起活块。
 *  新块经 `appendBlock`（停跟期间只累 `pendingNew` —— `store.mjs` 纯动作，跨切片语义同源）。 */
export function onToken(state, ev) {
  if (!forActive(state, ev)) return state
  const text = typeof ev.text === "string" ? ev.text : ""
  if (text === "") return state
  const blocks = state.blocks ?? []
  const tail = blocks[blocks.length - 1]
  if (tail && tail.kind === "assistant" && tail.streaming === true) {
    return { ...state, blocks: [...blocks.slice(0, -1), { ...tail, text: tail.text + text }] }
  }
  return appendBlock(state, { kind: "assistant", id: `${LIVE_ID}${blocks.length}`, text, streaming: true })
}

/** `ev:tool-call`——工具块入（活块形：`{kind,id,name,argsSummary,status,startedAt}`）；**段界游标清点**（#459 ② 族：入场 ⇒ 前序
 *  助手文本段收束 —— 清点先于追加，两事不同块）。**R3b 摘工具行**：不再写池条目（工具调用面 = 对话流工具卡）。
 *  **「对齐第三批」项 14 载波**：载荷 `round` / `model`（仅 `advisor` 名）在场才落块键（缺 ⇒ 键缺席 —— 禁假造）；
 *  段文成形归视图面（`renderer/views/chat-tool.mjs`）。 */
export function onToolCall(state, ev, now) {
  if (!forActive(state, ev)) return state
  const block = { kind: "tool", id: ev.id, name: ev.name, argsSummary: ev.argsSummary, status: "running", startedAt: now }
  if (typeof ev.round === "number" && Number.isFinite(ev.round) && ev.round > 0) block.round = ev.round
  if (typeof ev.model === "string" && ev.model !== "") block.model = ev.model
  return appendBlock(clearCursor(state), block)
}

/** `ev:tool-output`——结果文本累积入该工具块 `result`（无匹配块 ⇒ 零写）。
 *  **「对齐第三批」项 3**：chunk 到达 ⇒ **清显式折叠旗**（`expanded` 键摘除 —— 运行期展开由增量驱动，与 VSC 同径；
 *  体落判据归视图面 `isExpanded`：显式旗 ∨ `running` / `error` 缺省展开）。 */
export function onToolOutput(state, ev) {
  if (!forActive(state, ev)) return state
  const blocks = state.blocks ?? []
  const index = indexOfTool(blocks, ev.id)
  if (index < 0) return state
  const chunk = typeof ev.chunk === "string" ? ev.chunk : ""
  if (chunk === "") return state
  const block = blocks[index]
  const result = typeof block.result === "string" ? block.result + chunk : chunk
  const next = { ...block, result }
  delete next.expanded
  return { ...state, blocks: [...blocks.slice(0, index), next, ...blocks.slice(index + 1)] }
}

/** `ev:tool-result`——按 `id` 定位后**重建**（`status` 收束 · `durationMs` = 现刻 − 起刻 · 丢 `startedAt`）；
 *  `status` 由载荷 `ok` 定（`ok === true` ⇒ `done`，否则 `error`）——判据串归宿主侧单源
 *  （`docs/desktop/design/IPC.md:34` 载荷定形 · 批档 §2.16⑪：本端不另立判据、不解析正文）；载荷缺该键 ⇒ 不判成功。 */
export function onToolResult(state, ev, now) {
  if (!forActive(state, ev)) return state
  const blocks = state.blocks ?? []
  const index = indexOfTool(blocks, ev.id)
  if (index < 0) return state
  const block = blocks[index]
  const result = ev.result ?? null
  const ok = ev.ok === true
  const settled = {
    kind: "tool", id: block.id, name: block.name, argsSummary: block.argsSummary,
    status: ok ? "done" : "error", durationMs: now - (block.startedAt ?? now), result,
  }
  // 「对齐第三批」项 14：轮次载波**过收束**（`round` / `model` 原样承接 —— 收束 = 同块换态非重建；
  //   丢两键 ⇒ 具名 advisor 卡头轮次段在结果到达后消失）；只承接在块键（缺 ⇒ 仍缺席 —— 禁假造）
  if (block.round !== undefined) settled.round = block.round
  if (block.model !== undefined) settled.model = block.model
  // 「对齐第三批」相抵② 载波：验存文件链接非空行集才落（缺 / 空 ⇒ 键缺席 —— 禁假造）；着装 / 出口归视图面
  if (Array.isArray(ev.links) && ev.links.length > 0) settled.links = ev.links
  const next = { ...state, blocks: [...blocks.slice(0, index), settled, ...blocks.slice(index + 1)] }
  return next // R3b 摘工具行：池条目随动面已摘（工具调用面 = 对话流工具卡）
}

/** 中止清扫（「对齐第三批」项 5）：`stopped` 终局 ⇒ 未结算工具块（`status === "running"`）就地改
 *  `status: "interrupted"`（体 / 折叠态不动 —— VSC 同；**已中断** = 状态词闭枚举增词（7 ⇒ 8 词——单源 = `docs/desktop/design/UI.md` §1），词键 `tool.interrupted`）；
 *  命中才换新数组（无命中 ⇒ 原引用）。 */
export function sweepRunningTools(state) {
  const list = Array.isArray(state.blocks) ? state.blocks : []
  let hit = false
  const next = list.map((block) => {
    if (block?.kind !== "tool" || block.status !== "running") return block
    hit = true
    return { ...block, status: "interrupted" }
  })
  return hit ? { ...state, blocks: next } : state
}
