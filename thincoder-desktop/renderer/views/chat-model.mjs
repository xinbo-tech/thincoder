/**
 * chat-model.mjs — 对话流**模型族**（拆分产出 —— 更新纪律收核批：`renderer/views/chat.mjs` 越 300 在册、
 * 本批结构性触碰 ⇒ 按窗口执行拆分；登记面 = `docs/desktop/design/PROJECT.md` §4.2 本批行）：
 * `chatModel`（纯模型 · 窗出口）+ 六件派生判据（`retrySourceOf` ∕ `awaitingOf` ∕ `digestOf` ∕ `compressOf` ∕
 * `timerNoticeOf` ∕ `ledgerOf`）。原族**逐字搬运**（零语义改）；三档沿 `docs/desktop/design/RENDERER.md` §1.1
 * 「纯描述符 + 薄挂载」两层分家——本档零 DOM / 零 `node:` / 零裸包。
 * 依赖单向：`renderer/views/chat.mjs`（`mountChat` 内取模型）→ 本档；`renderer/app.mjs` 引调 `chatModel` ∕
 * `retrySourceOf`（引调面单处）；反向无引用 ⇒ 无环。
 */

import { visibleWindow } from "../store.mjs"
import { MAX_RENDER_BLOCKS } from "./chat-scroll.mjs"
import { guideOf } from "./chat-guide.mjs"

/** 帧模型：三态 + 窗出口（`visible` / `hidden` 单源 = `renderer/store.mjs:53`）+ 四标量读数 + 待决项（卡面）
 *  + 引导码（`guide` —— 判据转调 `chat-guide.mjs` 的 `guideOf`）。
 *  `none` ⇒ `blocks` 空 ∧ `hidden` 0 ∧ `approval` 空（守 `data-blocks` = DOM 块节点数不变式 —— 不落 stale 块 / 卡）。 */
export function chatModel(state, limit = MAX_RENDER_BLOCKS) {
  const live = state?.activeSession !== null && state?.activeSession !== undefined
  const { visible, hidden } = visibleWindow(Array.isArray(state?.blocks) ? state.blocks : [], limit)
  const mode = !live ? "none" : visible.length === 0 ? "empty" : "flow"
  return {
    state: mode,
    guide: guideOf({ live, cwd: state?.project?.cwd, visible: visible.length }),
    blocks: mode === "none" ? [] : visible,
    hidden: mode === "none" ? 0 : hidden,
    following: state?.following === true,
    pendingNew: typeof state?.pendingNew === "number" ? state.pendingNew : 0,
    hasOlder: state?.history?.hasOlder === true,
    inFlight: state?.history?.inFlight === true,
    locale: state?.locale,
    approval: mode === "none" ? [] : awaitingOf(state),
    // 本键消化行切片（桌面空闲唤醒批 —— `[data-digest]` 组；非块节点）
    digest: mode === "none" ? null : digestOf(state),
    // 本键压缩状态行切片（R4 —— `[data-compress]` 单元素四态；非块节点 —— 族首）
    compress: mode === "none" ? null : compressOf(state),
    // 本键到期触发切片（timer-wake 阶段 2 —— `[data-timer]` 行组；非块节点 · 与消化行同族）
    timer: mode === "none" ? null : timerNoticeOf(state),
    // 「对齐第三批」：停止痕（项 6 —— 本键切片在场；页读整置即失）· 台账行（项 12 —— 本键行集）
    stopped: mode !== "none" && state?.stopMark?.[state.activeSession] === true,
    ledger: mode === "none" ? null : ledgerOf(state),
    // 重试钮在场判据（项 9）：可重发源在场（= 末个「`user` ∧ 文本为串」块）—— 与出口同谓词（`retrySourceOf` 单源）
    canRetry: mode !== "none" && retrySourceOf(state?.blocks) !== null,
    // 欢迎条文案二值（项 15）：provider 已配 ⇒ `welcome.textConfigured` ∥ 余（未配 / 未知）⇒ `welcome.text`
    configured: state?.settings?.configured === true,
  }
}

/** 重试源判据（项 9 单源 —— 模型在场判据与出口取文同谓词，防「可点但静默」的死控）：
 *  末个「`kind === "user"` ∧ `text` 为串」块的文本；无 ⇒ `null`（禁假造 —— 非串文本块不算可重发源）。 */
export function retrySourceOf(blocks) {
  const list = Array.isArray(blocks) ? blocks : []
  for (let index = list.length - 1; index >= 0; index -= 1) {
    const block = list[index]
    if (block?.kind === "user" && typeof block.text === "string") return block.text
  }
  return null
}

/** 待决项（源 = `state.pool.approvals` —— 本会话切片语义）：缺 / 非数组 ⇒ 空表（**零卡** —— 禁假数据）。 */
function awaitingOf(state) {
  const list = state?.pool?.approvals
  return Array.isArray(list) ? list : []
}

/** 本键消化行切片（源 = `state.digest[活动会话键]` —— `ev:digest` 归约面写，起跑 / 终态两态；缺 / 非载体 ⇒ `null`：
 *  零组 —— 禁假造）。 */
function digestOf(state) {
  const key = state?.activeSession ?? null
  const table = state?.digest
  if (key === null || table === null || typeof table !== "object") return null
  const slice = table[key]
  return slice !== null && typeof slice === "object" ? slice : null
}

/** 本键压缩状态行切片（源 = `state.compress[活动会话键]` —— `ev:compress` 归约面写，四态就地推进；缺 / 非载体 ⇒ `null`：
 *  零行 —— 禁假造；生命期 = 首屏页读整置即失（`renderer/page-read.mjs` —— 沿 `stopMark` 先例）。 */
function compressOf(state) {
  const key = state?.activeSession ?? null
  const table = state?.compress
  if (key === null || table === null || typeof table !== "object") return null
  const slice = table[key]
  return slice !== null && typeof slice === "object" ? slice : null
}

/** 本键到期触发切片（源 = `state.timerNotice[活动会话键]` —— `ev:timer` 归约面写；缺 / 非载体 / 文本非串 ⇒ `null`：
 *  零组 —— 禁假造；生命期 = 运行期痕（首屏页读整置即失 —— 同 `[data-stopped]` 族））。 */
function timerNoticeOf(state) {
  const key = state?.activeSession ?? null
  const table = state?.timerNotice
  if (key === null || table === null || typeof table !== "object") return null
  const slice = table[key]
  return slice !== null && typeof slice === "object" && typeof slice.text === "string" ? slice : null
}

/** 本键台账行集（源 = `state.ledgerLines[活动会话键]` —— `ev:ledger` 归约面写；缺 / 非数组 / 空 ⇒ `null`：
 *  零组 —— 禁假造；单源 = 「对齐第三批」项 12 · KD-38）。 */
function ledgerOf(state) {
  const key = state?.activeSession ?? null
  const table = state?.ledgerLines
  if (key === null || table === null || typeof table !== "object") return null
  const lines = table[key]
  return Array.isArray(lines) && lines.length > 0 ? lines : null
}
