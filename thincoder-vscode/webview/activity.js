/**
 * activity.js — 子代理活动块生命周期编排（2026-09-12 活动区收口——WEBVIEW.md §14 现行机制）。
 * 位置三度更替（活动区 → 流尾 → 活动区 → **消化后归档入流**）——**两态机与块身份语义始终
 * 不变**（live → frozen；frozen 上 `awaitingDigest` 单标志 = settled 驻留——**非第二状态机**）。
 *
 * R2 换接（§3 行 4「拆」）：**迁移判据 / 键文法 / 终态补桩表**单源 = 核包 `subblocks/state.mjs`
 * + `subblocks/channel.mjs`（`subBlocksReduce` 三迁全族 · `ensureSubBlock` 内容出生闸 ·
 * `subBlocksFreezeAll` 会话退出兜底）；本档留端 = **DOM 效果执行**（按序逐条——核件头「执行序
 * 约定」：`key → DOM` 于该条执行时解析）+ 出生位 / 说明行 / 区 pin 与计数钮 / 块级跟滚调用点
 * （原语入核——KD-RC-8）/ 痕迹绑定 / 区复位 / 头词定时刷新。
 * 模型列表 = `S._subBlocks` 实时物化（值序 = 插入序；模型对象与块 `_subMeta` 同一引用——
 * 核原地改动即时可见）；`deps.connectedOf` / `regionOf` 必注入（DOM 事实在端）。
 *
 * 呈现委 `activity-view.js`（核叶 shim——`export *` 面 = `refreshBlock` / `noteChunk`；⏹ 控件
 * `updateStopButton` = 核件内部实现，不经 shim 导出）；消费面：
 * panels.js（applySubagentStatus/freezeLiveBlocks/refreshLiveHeaders）、chat.js（resetActivity）、
 * streaming.js（ensureBlock/noteChunk/resetActivity/maybeScrollBlock）。
 *
 * **#726（2026-10-01 · 跨端消化面恢复批）**：归档派生点增**留档记录出站**（`archiveBlock` 幂等守卫内
 * 恰一次）——快照 `{kind:"subagent", meta, rows}`（形 ∥ 判据单源 = `docs/core/design/SESSION.md`
 * §6.26）经 `recordAppend` 上行（协议登记 = `WEBVIEW-PROTOCOL.md` §3.2 行 22），宿主处理体
 * （`panel-messages.mjs`）取活行载体经核 `pushRecord` 追加；重建径 = `record-restore.js`（本档零参与）。
 */
import { ctx, S } from "./state.js"
import { maybeScrollActivity } from "./ui.js"
import { t } from "./i18n.js"
import { traceSub, traceSubOnce, clearSubTraceChannel } from "./activity-diag.js"
import { noteActivityBirth, clearActivityNew } from "./activity-new.js"
import { refreshBlock } from "./activity-view.js"
import { subBlocksReduce, subBlocksFreezeAll, ensureSubBlock } from "../node_modules/@thincoder/render-core/subblocks/state.mjs"
import { renderSubBlock, initBlockFollow, maybeScrollBlock } from "../node_modules/@thincoder/render-core/subblocks/block.mjs"

// streaming.js import 面不变（noteChunk 定义在核叶——hub re-export）
export { noteChunk } from "./activity-view.js"

// ─── 端注入面（核 deps）─────────────────────────

/** 模型列表实时物化：`S._subBlocks` 值序（块 → `_subMeta` 本体——同一引用，原地改动可见）。 */
const modelList = () => [...S._subBlocks.values()].map((el) => el._subMeta)

const deps = {
  // DOM 事实在端（核件头「端接线注意」）：在连 ⇒ 非 tombstone（缺省视为在连——源档 `isConnected` 同判）
  connectedOf: (m) => S._subBlocks.get(m.key)?.isConnected !== false,
  regionOf: (m) => (S._subBlocks.get(m.key)?.parentNode === ctx.activityEl ? "activity" : "flow"),
  // 痕迹钩分面（核 `state.mjs` 件头）：`reassert-hit` / `drop-tombstone` = 去重版，余 = 逐条版
  trace: (name, key) => (name === "reassert-hit" || name === "drop-tombstone" ? traceSubOnce : traceSub)(name, key),
  onChannelReset: (key) => clearSubTraceChannel(key), // 新代接管：该频道丢弃 / 命中面重新计首条
}

// ─── 桥消息路由：簿记与状态词全在核态机——本档只管 DOM 效果 ────

/** 出生 / 接管 / 补桩：建块（核构件）+ 出生位 append + 说明行 + 区 pin/计数钮 + 块级跟滚。 */
function buildBlockEl(model) {
  const block = renderSubBlock(model) // 核：details.advisor-block.sub-block.sub-live + data 面 + toggle + 首刷
  // A13（群 A 批）：会话首个活动块的说明行（新用户可理解——一次性）。位置 = summary 之后、
  // .advisor-content 之前（details 直接子——refreshBlock 只重建 summary，本行不被擦；
  // tailLines 射程 = .advisor-content 子元素——本行不在内，tail-3 不受扰）。
  if (!S._subDescShown) {
    S._subDescShown = true
    const desc = document.createElement("div")
    desc.className = "sub-desc"
    desc.textContent = t("sub.desc")
    block.insertBefore(desc, block.querySelector(".advisor-content"))
  }
  ctx.activityEl.appendChild(block) // 出生位 = 活动区区尾（live 阶段驻区——归档由核效果驱动）
  // §5.5 出生可见性（D-W27）：钉底 ⇒ 跟随；未钉底 ⇒ 不改 scrollTop + 区首计数钮（不夺阅读位）
  if (ctx._pinActivity === false) noteActivityBirth()
  else maybeScrollActivity(ctx) // 出生即区钉底（_pinActivity=false 上读中不强拉）
  initBlockFollow(block) // 块级跟滚监听（§13——出生/接管/补桩三路径共用本点）
  refreshBlock(block) // 挂 DOM 后重刷（⏹ 门控读 `isConnected`——核首刷发生在挂载前）
  return block
}

/** 效果表按序逐条执行（无 DOM 动作者核内不入表——丢弃 / 正收据只走 `deps.trace`）。 */
function applyEffects(list, effects) {
  for (const e of effects) {
    // 建块两迁（出生 / 新代接管）：新模型已入 list——取之建块并改绑键（旧块形态不动）
    if (e.type === "born" || e.type === "takeover") {
      const model = list.find((b) => b.key === e.key)
      if (model) S._subBlocks.set(e.key, buildBlockEl(model))
      continue
    }
    const block = S._subBlocks.get(e.key) // 该条执行时解析（接管路径的 archive 指旧块——先归档后改绑）
    if (!block) continue
    if (e.type === "fold") {
      // 终态原地折叠：class sub-live→sub-frozen + open=false + ⏹ 移除 + 头词刷新
      block.classList.remove("sub-live")
      block.classList.add("sub-frozen")
      block.open = false
      block.querySelector(".sub-stop-btn")?.remove()
      refreshBlock(block)
    } else if (e.type === "refresh" || e.type === "awaiting") {
      refreshBlock(block)
    } else if (e.type === "archive") {
      archiveBlock(block, e.atBoundary === true)
      if (e.clearAwaiting) refreshBlock(block) // 端清尾（头词回终态——不留悬空「等待消化」）
    } else if (e.type === "remove") {
      block.remove() // queued 取消：从未启动——不冻结
      S._subBlocks.delete(e.key)
    }
  }
}

/** 归档（§14 C-3——单次 DOM 插入）：块元素原地进 `#messages`。`atBoundary=true`（起跑窗回收）且
 *  本轮边界 `S._digestBoundary` 有效（isConnected）→ **落位 = 当刻流末（起跑刻语义——本批 #768 落位句
 *  收正；裁 A = 台账 #754）**：起跑刻行族在流末 ⇒ 即「放族后」——越过同族行（cap ∥ 终态等）∥ 已
 *  归档块（到达序——逐枚落于前枚之后），落于首个族外节点之前（旧「族首之前」`insertBefore(块, 边界)`
 *  随裁 A 退场——其对象已废）；迟到面 = 族锚位（边界之后）；其余（边界失效 ∥ 无边界 ∥ 普通终态 ∥
 *  补桩 ∥ 会话退出 flush）→ `appendChild` 尾追退化（C-4）。
 *  幂等：已归档（parentNode === messagesEl）→ no-op——**#726 留档记录出站同守此闸**（每块恰一次）。 */
function archiveBlock(block, atBoundary = false) {
  const messagesEl = ctx.messagesEl
  if (!block || !messagesEl || block.parentNode === messagesEl) return
  const boundary = atBoundary ? S._digestBoundary : null
  if (boundary?.isConnected) {
    let ref = boundary.nextSibling
    while (ref != null && (isDigestRow(ref) || ref._digestArchivedAt === boundary)) ref = ref.nextSibling
    messagesEl.insertBefore(block, ref ?? null) // ref = null ⇒ 落于流末（族后无族外节点时同义）
    block._digestArchivedAt = boundary // 到达序锚（同一边界面下逐枚落于前枚之后）
  } else {
    messagesEl.appendChild(block)
  }
  // #726（2026-10-01 · 跨端消化面恢复批）：归档派生点出站（每块恰一次——同守上方幂等闸）。
  emitRecordAppend(block)
}

// ─── #726 留档记录出站（协议 §3.2 行 22 `recordAppend`）───────────────
// 归档派生点同点构建快照 ⇒ webview → host（宿主处理体取活行载体经核 `pushRecord` 追加）。形 ∥ 判据单源 =
// `docs/core/design/SESSION.md` §6.26（记录两族形 / rows 有界保尾）；VSC 承接细则 = `WEBVIEW.md` §5.7。

/** rows 保尾上界（核契约§6.26「有界保尾」——显示行 ≤ 500；省略标记行不占额度）。 */
const RECORD_ROWS_MAX_LINES = 500

/** 行显示行数（核 `countBlockLines` 同式：按 `\n` 切分、文末换行不计）。 */
function rowLines(row) {
  const lines = String(row?.text ?? "").split("\n")
  return lines[lines.length - 1] === "" ? lines.length - 1 : lines.length
}

/** 内容行集（`.advisor-content` 行文本派生——`{kind,text}` 形核契约）：工具行 kind="tool"（重放回工具行）；
 *  其余取 `dataset.kind`（text ∥ think——缺省回落 "text"）。 */
function rowsOf(block) {
  const content = block.querySelector(".advisor-content")
  const out = []
  for (const el of content ? [...content.children] : []) {
    const text = String(el.textContent ?? "")
    if (text === "") continue // 活流零空行（`appendAdvisorChunk` 空串早返）——防御面
    const kind = el.classList.contains("advisor-tool-line") ? "tool"
      : (typeof el.dataset?.kind === "string" && el.dataset.kind) ? el.dataset.kind : "text"
    out.push({ kind, text })
  }
  return out
}

/** rows 保尾（弃最旧 ⇒ 前置省略标记行；标记自身不占额度；单行超界 ⇒ 行 = 最小单元，保末行）。 */
function boundRows(rows) {
  let total = 0
  let start = rows.length
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const n = rowLines(rows[i])
    if (total + n > RECORD_ROWS_MAX_LINES) break
    total += n
    start = i
  }
  if (start === rows.length && rows.length > 0) start = rows.length - 1 // 单行超界：保末行
  if (start === 0) return rows // 未超界（零写）
  let dropped = 0
  for (let i = 0; i < start; i += 1) dropped += rowLines(rows[i])
  return [{ kind: "meta", text: `… [rows truncated: ${dropped} lines omitted]` }, ...rows.slice(start)]
}

/** 归档时点快照（`meta` = 块头事实——核契约已知字段子集：key ∥ role ∥ model? ∥ startedAt? ∥ doneAt? ∥
 *  turn? ∥ maxTurns? ∥ status? ∥ pool? ∥ queued? ∥ note? ∥ error?；`rows` = 块内容行集，保尾同上界）。 */
function subagentSnapshotOf(block) {
  const meta = block?._subMeta ?? {}
  const out = { key: meta.key ?? "", role: meta.role ?? null }
  if (meta.model != null) out.model = meta.model
  if (meta.startedAt != null) out.startedAt = meta.startedAt
  if (meta.doneAt != null) out.doneAt = meta.doneAt
  if (meta.turn != null) out.turn = meta.turn
  if (meta.maxTurns != null) out.maxTurns = meta.maxTurns
  if (meta.status != null) out.status = meta.status
  if (typeof meta.pool === "boolean") out.pool = meta.pool // #790：模式事实（true=async ∥ false=sync——null/缺省不写）
  if (meta.queued === true) out.queued = true // #790：冻结时未启动（排队）
  if (meta.note != null) out.note = meta.note
  if (meta.error != null) out.error = meta.error
  return { kind: "subagent", meta: out, rows: boundRows(rowsOf(block)) }
}

/** 留档记录出站（#726）：归档派生点（幂等守卫内）——每块恰一次；出站失败不阻断（尽力面）。 */
function emitRecordAppend(block) {
  try { ctx.vscode.postMessage({ type: "recordAppend", record: subagentSnapshotOf(block) }) } catch { /* 尽力面：出站失败不阻断归档 */ }
}

/** 消化行族成员判据（标签 ∥ 计数 ∥ cap 三族 class——终态元素复用 `digest-status`；与 `chat-status.js` 建行 class 同源）。 */
function isDigestRow(node) {
  if (node == null || node.nodeType !== 1) return false
  const cls = node.classList
  return cls?.contains("digest-turn") === true || cls?.contains("digest-status") === true || cls?.contains("digest-cap") === true
}

/** Status-message effects on blocks（核态机入口——两态机 + awaitingDigest 单标志）：出生闸
 *  （queued / started——不限角色族、pool）· queued 等待头 · turn 帧 · started 翻 running ·
 *  cancelled(was:queued) 头移除 · 终态折叠（settled 驻留 / 其余即时归档）· 消化回收 ·
 *  旧代回收吞守卫 · 终态补桩（细节 = 核 `subblocks/state.mjs`）。 */
export function applySubagentStatus(m) {
  const list = modelList()
  applyEffects(list, subBlocksReduce(list, m, deps).effects)
}

/** 内容 chunk 出生闸（核 `ensureSubBlock`——内容面迟到 chunk 不半复活）：无键建块；已终态 /
 *  墓碑 ⇒ null（丢弃）；live ⇒ 复用（不重挂）。返回块元素（`null` = 丢弃）。 */
export function ensureBlock(name) {
  const list = modelList()
  const { block, effects } = ensureSubBlock(list, name, deps)
  if (!block) return null
  applyEffects(list, effects)
  return S._subBlocks.get(name) ?? null
}

/** 审批态通知（§18 C-8——child permission gate）：tool 非空 = 等待审批 / null = 清态；
 *  查块**绝不建块**（幂等守卫同族——核 `status:"approval"` 支）。 */
export function applySubagentApproval(m) {
  const list = modelList()
  applyEffects(list, subBlocksReduce(list, { ...m, status: "approval" }, deps).effects)
}

/** 会话退出 freeze 兜底（suspension active:false + freeze:true——§14 C-8）：区**全体**归档
 *  ——live → 折叠；awaitingDigest / 已在流者按 `regionOf` 判（驻活动区 ⇒ 归档；已在流者不动）。
 *  X11（§2.2）：`interrupted`（会话中止真值源）⇒ 未冻结块折叠时补 `— interrupted` 注记。 */
export function freezeLiveBlocks(interrupted = false) {
  const list = modelList()
  applyEffects(list, subBlocksFreezeAll(list, { ...deps, interrupted }).effects)
}

/** live 块头定时刷新（§14 C-11④——panels `_panelTimer`（既有 2s）同点调用）：elapsed
 *  段随 Date.now() 重算（事件驱动之外的时间推进）。**不设运行态门**——仅刷现存 live 块
 *  （`_turnState` 为 `susp` 的纯池跑主场景照刷）；无 live 块 = 零操作。 */
export function refreshLiveHeaders() {
  for (const block of S._subBlocks.values()) {
    if (block?._subMeta && !block._subMeta.frozen && block.isConnected) refreshBlock(block)
  }
}

// ─── Block follow-scroll（块内容区下列——原语入核 2026-09-29 · KD-RC-8）───────
// `initBlockFollow` / `maybeScrollBlock` 本体住核 `subblocks/block.mjs`（取件见档头 import）；本端留调用点
// （`buildBlockEl` 出生点）与转口 `maybeScrollBlock`（`streaming.js` rAF 尾消费——零改）。

export { maybeScrollBlock }

/** Full reset — 回合中止（abort 无挂起会话）/会话清（§14 C-7）：**只清区子树**（live +
 *  awaitingDigest）+ 清 map + 区子树内防御孤儿清——**流内归档块（会话历史）不动**；计数钮同清。 */
export function resetActivity() {
  for (const block of S._subBlocks.values()) {
    if (block?.parentNode === ctx.activityEl) block.remove()
  }
  S._subBlocks.clear()
  clearActivityNew() // §5.5：resetActivity 同清（钮按需建 / 删——N=0 ⇒ :empty 零高不回归）
  // 防御清：map 外孤儿块（限区子树——流内归档块＝会话历史不得误删）
  for (const el of [...(ctx.activityEl?.children ?? [])]) {
    if (el.classList.contains("sub-block")) el.remove()
  }
}
