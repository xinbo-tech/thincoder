/**
 * page-read.mjs — **页读径**（「对齐第二批 · 六件」**拆分产出**：`renderer/events.mjs` 硬限 500 顶格 ⇒
 * 在册拆分预案本批执行 —— 页读径 `applyPage` / `blockOfMessage` + 私有面（`seedPatch` / `metaOf` /
 * 文本面 `textOf` / `toolBlock`）自归约核心档**纯搬移**，结构拆分零语义）。
 * **留档批 · #719（本批增）**：记录折叠重建 —— 页回执（核 `historyWindow` opt-in 直通）逐条携留档记录
 * （`digest` ∥ `subagent` 两族；形 / 在场 / 判据单源 = `docs/desktop/design/RENDERER.md` §1.1「留档记录」条）：
 *  ① `digest` 记录 ⇒ **最新一条终态轮**（归约体**直复用** `renderer/events-wake.mjs` `onDigest` —— 记录形 = 事件形；
 *     每轮到终态即取快照 ⇒ 末轮未结不产该轮、仍产上一终态轮 —— 防双份：未结末轮由运行期切片承接）；携**位次** `at` = 起跑记录
 *     全局 `idx`（痕面重建按记录位次复列读面））；首屏 ∥ 回填两径同源（场内存续优先，切片无轮 ⇒ 采折叠最新一条）；
 *     机器线零触（记录不入 `agent.history` —— 落库面 = 宿主）。
 *  ② `subagent` 记录 ⇒ **留档块**（`blockOfMessage` 同形 —— 与活流归档同一形状；页读域第六型）。
 *  ③ 页读块携位次 `at`（= 消息全局 `idx` —— 痕面位次对位 ∥ 重建径复列锚读面）。
 * 依赖单向：本档 → `renderer/events.mjs`（`applyFlags` 模式位写点 —— 共用件单一实现零副本）· → `renderer/store.mjs`
 *（`endBackfill` 清在途）· → `renderer/events-wake.mjs`（`onDigest` —— 折叠重建直复用）；归约核心档**不引**本档（无环）。
 * 消费面两处：`renderer/session-wire.mjs`（首屏 / 回填两径）· 测试面（`test/events-page.test.mjs` /
 * `test/events-reduce.test.mjs`）。
 * 纪律：纯函数（零 DOM / 零 IPC / 零 `node:` / 零裸包 —— 渲染面静态闭包判据）。
 * 单源：`docs/desktop/design/IPC.md` §2 `history:page` 定形 / 「打开态播种注」项 4。
 */
import { applyFlags } from "./events.mjs"
import { endBackfill } from "./store.mjs"
// 排队镜面（「回合中插入」批 —— `history:page` 回执 `queue` 键 = 冷启 ∕ 重载重建面；写者两处同源）。
import { applyQueue } from "./queue.mjs"
// 消化轮集清点（运行期痕**四清**之四 —— 判据单源 = 消化行组档 `renderer/views/chat-digest.mjs`）。
import { clearDigest } from "./views/chat-digest.mjs"
// 消化记录折叠（留档批 · #719 —— 归约体**直复用**：记录形 = 事件形，单一实现零副本）。
import { onDigest } from "./events-wake.mjs"

/** 会话级三值字段白名单（判据：非串 / 空串 ⇒ 不落键 —— 数据面原样，非词表）——
 *  **三值**（状态栏对齐批：两模式位撤出本投影 —— 呈现面单源 = 状态行 banner 段，供面 = 回执 `flags`）。 */
const META_FIELDS = ["provider", "model", "effort"]

/** `meta` 三值**只落非空串**（名单同上 —— 数据面原样，非词表）；全缺 ⇒ `{}`。 */
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

/** 块位次（留档批 · #719 —— 页读条目全局 `idx`；缺 / 非数 ⇒ 键缺席 —— 运行期件无位次）。 */
function atOf(msg) {
  return typeof msg?.idx === "number" && Number.isFinite(msg.idx) ? { at: msg.idx } : {}
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
 *  **留档批 · #719**：`subagent` 记录 ⇒ 留档块（**与活流归档同一形状** —— `{ kind, meta, rows }` 单源）；
 *  两族记录位次 `at`（全局 `idx`）随块 —— 痕面位次对位 ∥ 重建复列锚读面。
 *  **边界**：页读面（历史卡）**零链接**（VSC 同径 —— `links` 只走活流 `ev:tool-result` 载波；单源 = UI.md 相抵② 边界）。 */
export function blockOfMessage(msg) {
  const kind = msg?.kind
  const at = atOf(msg)
  if (kind === "user") {
    const block = { kind: "user", text: textOf(msg.text), ...at }
    if (typeof msg.timestamp === "number" && Number.isFinite(msg.timestamp)) block.ts = msg.timestamp
    return [block]
  }
  if (kind === "error") return [{ kind: "error", text: textOf(msg.text), ...at }]
  if (kind === "tool") return [{ ...toolBlock(msg), ...at }]
  // 留档记录 · subagent 快照（活流归档同形 —— `renderer/subagent-reduce.mjs` `archiveIntoFlow` 单源）
  if (kind === "subagent") {
    const meta = msg.meta !== null && typeof msg.meta === "object" ? msg.meta : {}
    return [{ kind: "subagent", meta, rows: Array.isArray(msg.rows) ? msg.rows : [], ...at }]
  }
  if (kind !== "assistant") return []
  const blocks = []
  const reasoning = textOf(msg.reasoning)
  if (reasoning !== null && reasoning !== "") blocks.push({ kind: "reasoning", text: reasoning, ...at })
  const text = textOf(msg.text)
  if (text !== null && text !== "") blocks.push({ kind: "assistant", text, ...at })
  const tools = Array.isArray(msg.tools) ? msg.tools : []
  for (const tool of tools) blocks.push({ ...toolBlock(tool), ...at })
  return blocks
}

/** 消化记录折叠（留档批 · #719；归位批 · #738 收正 —— **只产最新一条终态轮**：逐条直复用 `onDigest`（全替语义 ⇒
 *  草稿恒为本轮 —— 单一实现零副本），每轮到达终态即取快照；产出 = **最近的一条终态轮**（末轮未结 ⇒ 不产该轮、
 *  仍产上一终态轮 —— 防双份：未结末轮由运行期切片承接）；零终态 ⇒ 零产。位次 `at` = 该终态轮起跑记录全局 `idx`
 *  （起跑位次 —— 起跑行须居内容之上；`cap` ∥ `end` 记录就轮更新，位置仍归起跑记录）。跨页截断（起跑 ∥ 终态记录
 *  分居两页）⇒ 该轮本页**零产**（`open` 闸：起跑未载的 `cap` ∥ `end` 不入折 —— 防并轮错位；记录面残留列报，批档 §5）。 */
function foldDigest(messages, key) {
  let scratch = { digest: {} }
  let at = null
  let open = false // 本页「本轮 start 已见 ∧ 未终态」——截断记录（起跑居前页）不入折
  let latest = null // 最近一条终态轮快照（后续 start 全替草稿而不覆写本快照）
  for (const msg of messages) {
    if (msg?.kind !== "digest") continue
    if (msg.status === "start") {
      at = typeof msg.idx === "number" && Number.isFinite(msg.idx) ? msg.idx : null
      open = true
    } else if (!open) {
      continue // 跨页截断：起跑未载 ⇒ 该轮本页零产（零并轮零借位）
    }
    scratch = onDigest(scratch, { ...msg, key })
    const round = scratch.digest[key]?.[0] // 全替语义 ⇒ 本轮（≤ 1）
    if (round?.status === "end") {
      latest = { round, at }
      open = false
    }
  }
  if (latest === null) return []
  return [latest.at === null ? latest.round : { ...latest.round, at: latest.at }]
}

/** 轮集并入（**只留当轮** —— 合并后 ≤ 1；留档批 · #719 · 归位批 · #738 收正）：场内存续优先 —— 切片有轮（运行期真值）
 *  ⇒ **原引用**（未结末轮活态保真；终态轮 = 最新显示轮 —— 更旧折叠轮不入显示，回填径零回退）；切片无轮 ⇒ 采折叠
 *  最新一条（重建复列最新一条）；空折叠 ⇒ 原引用（零写）。 */
function withFoldedDigest(table, key, folded) {
  if (folded.length === 0) return table
  const current = Array.isArray(table?.[key]) ? table[key] : []
  if (current.length > 0) return table
  return { ...(table ?? {}), [key]: [folded[folded.length - 1]] }
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
 *  首屏（`before == null`）⇒ 块整置 + 回底（`following = true` / `pendingNew = 0`；空页同径）+ **运行期痕四清**
 *  （停止痕 `stopMark` ∕ 到期触发痕 `timerNotice` ∕ 压缩行 `compress`（R4）∕ 消化轮集 `digest`（终态轮整清——未结末轮保）—— 同首屏门）
 *  + **留档记录折叠**（`digest` 记录 ⇒ 终态轮前插 —— 留档批 · #719） + **打开态播种**
 *  （`seed` ⇒ `tasks[key]` / `usage[key]` 同笔 —— 判据住 `seedPatch`）+ **排队镜面重建**
 *  （`queue` 键 ⇒ `applyQueue` —— 「回合中插入」批 · KD-40 ④；仅首屏读）；
 *  回填 ⇒ 前插 + `history` 落态（`hasOlder === false ⇒ next = null`；高度补偿归 `settleFrame` 六步既有）+
 *  **折叠并入**（回填页记录 ⇒ 折叠最新一条 —— 场内存续优先（更旧轮不入显示）；留档批 · #719 ∥ 归位批 · #738）。 */
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
  const folded = foldDigest(messages, key) // 留档记录折叠（最新一条终态轮 · 携位次）
  if (before == null) {
    const stopMark = clearStopMark(flagged.stopMark, key)
    const timerNotice = clearTimerNotice(flagged.timerNotice, key)
    const compress = clearCompress(flagged.compress, key)
    const digest = withFoldedDigest(clearDigest(flagged.digest, key), key, folded)
    const first = {
      ...flagged, ...(stopMark === flagged.stopMark ? {} : { stopMark }), ...(timerNotice === flagged.timerNotice ? {} : { timerNotice }),
      ...(compress === flagged.compress ? {} : { compress }), ...(digest === flagged.digest ? {} : { digest }),
      ...seedPatch(flagged, key, receipt.seed), blocks: page, sessionMeta, history, following: true, pendingNew: 0,
    }
    // 排队镜面重建（仅首屏读 —— 回填读不重建：防在途快照覆盖活镜面）；键缺 / 非数组 ⇒ `applyQueue` 拒收（零写）。
    return applyQueue(first, key, receipt.queue)
  }
  const digest = withFoldedDigest(flagged.digest, key, folded)
  return { ...flagged, blocks: [...page, ...(flagged.blocks ?? [])], sessionMeta, history, ...(digest === flagged.digest ? {} : { digest }) }
}
