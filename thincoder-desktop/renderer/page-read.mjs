/**
 * page-read.mjs — **页读径**（「对齐第二批 · 六件」**拆分产出**：`renderer/events.mjs` 硬限 500 顶格 ⇒
 * 在册拆分预案本批执行 —— 页读径 `applyPage` / `blockOfMessage` + 私有面（`seedPatch` / `metaOf` /
 * 文本面 `textOf` / `toolBlock`）自归约核心档**纯搬移**，结构拆分零语义）。
 * 依赖单向：本档 → `renderer/events.mjs`（`applyFlags` 模式位写点 —— 共用件单一实现零副本）· → `renderer/store.mjs`（`endBackfill` 清在途）；归约核心档**不引**本档（无环）。
 * 消费面两处：`renderer/mount-sessions.mjs`（首屏 / 回填两径）· 测试面（`test/events-page.test.mjs` /
 * `test/events-reduce.test.mjs`）。
 * 纪律：纯函数（零 DOM / 零 IPC / 零 `node:` / 零裸包 —— 渲染面静态闭包判据）。
 * 单源：`docs/desktop/design/IPC.md` §2 `history:page` 定形 / 「打开态播种注」项 4。
 */
import { applyFlags } from "./events.mjs"
import { endBackfill } from "./store.mjs"
// 排队镜面（「回合中插入」批 —— `history:page` 回执 `queue` 键 = 冷启 ∕ 重载重建面；写者两处同源）。
import { applyQueue } from "./queue.mjs"

/** 会话头字段白名单（`renderer/views/chrome.mjs:8-9` 判据：非串 / 空串 ⇒ 零节点）——
 *  **三值**（状态栏对齐批：两模式位撤出会话头投影 —— 呈现面单源 = 状态行 banner 段，供面 = 回执 `flags`）。 */
const META_FIELDS = ["provider", "model", "effort"]

/** `meta` 三值**只落非空串**（名单与 `views/chrome.mjs` 同名 —— 数据面原样，非词表）；全缺 ⇒ `{}`。 */
function metaOf(meta) {
  const out = {}
  for (const field of META_FIELDS) {
    const value = meta?.[field]
    if (typeof value === "string" && value !== "") out[field] = value
  }
  return out
}

/** 首屏播种补丁（D17 · `docs/desktop/design/IPC.md` §2「打开态播种注」项 4）：`seed` 同笔写 `tasks[key]` /
 *  `usage[key]` 两切片（与 `meta` 同一写点）；**时序判据** = 本键在飞（回合未尾 ⇒ 位标含 `running`）
 *  ⇒ 种不落（**零写**——活切片为准）；**播种只填空白**（#490）：该槽切片键在场 ⇒ 零写（闭合回合尾窗口 ——
 *  判据 = 键在场、不辨来源；设计句「非播种来源」限定的收正随批次档 §5 上抛）；`seed` 缺省 / 该槽形不合 ⇒ 零写。 */
function seedPatch(state, key, seed) {
  if (seed === null || typeof seed !== "object") return {}
  if (Array.isArray(state.tabBadges?.[key]) && state.tabBadges[key].includes("running")) return {}
  const blank = (table) => !Object.hasOwn(table ?? {}, key)
  const patch = {}
  if (Array.isArray(seed.tasks) && blank(state.tasks)) patch.tasks = { ...(state.tasks ?? {}), [key]: seed.tasks }
  if (typeof seed.usage === "number" && seed.usage > 0 && blank(state.usage)) patch.usage = { ...(state.usage ?? {}), [key]: seed.usage }
  return patch
}

/** 屏文本栏（核给 `string | null`；非串 ⇒ 空 —— 零节点判据归消费面）。 */
function textOf(value) {
  return typeof value === "string" ? value : null
}

/** 核 message / 内嵌 tool → 工具块（**不落** `status` / `durationMs` —— 决策 D8-8 两面差异）。 */
function toolBlock(tool) {
  const block = { kind: "tool", name: tool?.name ?? null }
  if (tool?.id !== undefined) block.id = tool.id
  block.argsSummary = textOf(tool?.args)
  block.result = tool?.result !== undefined ? textOf(tool.result) : textOf(tool?.text)
  return block
}

/** 核 message → 块数组（未知型 ⇒ `[]`；助手条目序 = `[reasoning?, assistant?, ...tools]` —— **「对齐第三批」项 8 收正**：
 *  推理先于正文（序单源 = 核 `thincoder-render-core/flow/block.mjs:97-105`；旧序 `[text, reasoning, ...tools]` 退场）。
 *  **说话人时间面载波**（「对齐第二批」项 4）：`user` 块携 `ts`（核 message `timestamp` —— 缺 / 非数 ⇒ 键缺席，
 *  「无 ts 不显示」纪律由核 `paintLabel` 同判据承接）。
 *  **边界**：页读面（历史卡）**零链接**（VSC 同径 —— `links` 只走活流 `ev:tool-result` 载波；单源 = UI.md 相抵② 边界）。 */
export function blockOfMessage(msg) {
  const kind = msg?.kind
  if (kind === "user") {
    const block = { kind: "user", text: textOf(msg.text) }
    if (typeof msg.timestamp === "number" && Number.isFinite(msg.timestamp)) block.ts = msg.timestamp
    return [block]
  }
  if (kind === "error") return [{ kind: "error", text: textOf(msg.text) }]
  if (kind === "tool") return [toolBlock(msg)]
  if (kind !== "assistant") return []
  const blocks = []
  const reasoning = textOf(msg.reasoning)
  if (reasoning !== null && reasoning !== "") blocks.push({ kind: "reasoning", text: reasoning })
  const text = textOf(msg.text)
  if (text !== null && text !== "") blocks.push({ kind: "assistant", text })
  const tools = Array.isArray(msg.tools) ? msg.tools : []
  for (const tool of tools) blocks.push(toolBlock(tool))
  return blocks
}

/** 停止痕清点（「对齐第三批」项 6 · 单源 = 本档）：首屏页读（`before == null`）⇒ 摘本键痕（运行期痕 ——
 *  **非落盘件**：重开 / 切回页读即失，对位 VSC「重开既有会话布局」）；无痕 ⇒ 原引用（零写）。 */
function clearStopMark(table, key) {
  if (table === null || typeof table !== "object" || table[key] !== true) return table
  const next = { ...table }
  delete next[key]
  return next
}

/** 到期触发痕清点（timer-wake 阶段 2 · 单源 = 本档）：首屏页读（`before == null`）⇒ 摘本键触发行（运行期痕 ——
 *  **非落盘件**：重开 / 切回页读即失）；无痕 ⇒ 原引用（零写）。 */
function clearTimerNotice(table, key) {
  if (table === null || typeof table !== "object" || table[key] === undefined) return table
  const next = { ...table }
  delete next[key]
  return next
}

/** 压缩状态行清点（R4 —— 单源 = 本档）：首屏页读（`before == null`）⇒ 摘本键压缩行（运行期痕 —— **非落盘件**：
 *  重开 / 切回页读即失，对位 VSC「session view clears recreate it」）；无行 ⇒ 原引用（零写）。 */
function clearCompress(table, key) {
  if (table === null || typeof table !== "object" || table[key] === undefined) return table
  const next = { ...table }
  delete next[key]
  return next
}

/** 页回执应用（`docs/desktop/design/IPC.md` §2 `history:page` 定形）：`{ ok, messages, hasOlder, next, meta, flags, queue, seed? }`。
 *  `ok !== true` ⇒ **清在途**（成败皆清 —— finally 语义）且不写其余切片；
 *  `flags` 与 `meta` **同一写点**（`applyFlags` —— 状态栏对齐批；每次页读皆携 ⇒ 回填径同写）；
 *  `key !== activeSession` ⇒ 跳块 / 历史写（`sessionMeta[key]` / `sessionFlags[key]` 仍写）；
 *  首屏（`before == null`）⇒ 块整置 + 回底（`following = true` / `pendingNew = 0`；空页同径）+ **运行期痕三清**
 *  （停止痕 `stopMark` ∕ 到期触发痕 `timerNotice` ∕ 压缩行 `compress`（R4）—— 同首屏门）+ **打开态播种**
 *  （`seed` ⇒ `tasks[key]` / `usage[key]` 同笔 —— 判据住 `seedPatch`）+ **排队镜面重建**
 *  （`queue` 键 ⇒ `applyQueue` —— 「回合中插入」批 · KD-40 ④；仅首屏读）；
 *  回填 ⇒ 前插 + `history` 落态（`hasOlder === false ⇒ next = null`；高度补偿归 `settleFrame` 六步既有）。 */
export function applyPage(state, receipt, { key, before } = {}) {
  if (receipt?.ok !== true) return endBackfill(state)
  const flagged = applyFlags(state, key, receipt.flags)
  const meta = metaOf(receipt.meta)
  const sessionMeta = { ...(flagged.sessionMeta ?? {}), [key]: meta }
  if (key !== flagged.activeSession) return { ...flagged, sessionMeta }
  const hasOlder = receipt.hasOlder === true
  const next = hasOlder ? (receipt.next ?? null) : null
  const history = { hasOlder, inFlight: false, page: next }
  const messages = Array.isArray(receipt.messages) ? receipt.messages : []
  const page = messages.flatMap((msg) => blockOfMessage(msg))
  if (before == null) {
    const stopMark = clearStopMark(flagged.stopMark, key)
    const timerNotice = clearTimerNotice(flagged.timerNotice, key)
    const compress = clearCompress(flagged.compress, key)
    const first = {
      ...flagged, ...(stopMark === flagged.stopMark ? {} : { stopMark }), ...(timerNotice === flagged.timerNotice ? {} : { timerNotice }),
      ...(compress === flagged.compress ? {} : { compress }),
      ...seedPatch(flagged, key, receipt.seed), blocks: page, sessionMeta, history, following: true, pendingNew: 0,
    }
    // 排队镜面重建（仅首屏读 —— 回填读不重建：防在途快照覆盖活镜面）；键缺 / 非数组 ⇒ `applyQueue` 拒收（零写）。
    return applyQueue(first, key, receipt.queue)
  }
  return { ...flagged, blocks: [...page, ...(flagged.blocks ?? [])], sessionMeta, history }
}
