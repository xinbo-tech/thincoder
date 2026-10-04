/**
 * page-read.mjs — **页读径**（「对齐第二批 · 六件」**拆分产出**：`renderer/events.mjs` 硬限 500 顶格 ⇒
 * 在册拆分预案本批执行 —— 页读径 `applyPage` / `blockOfMessage` + 私有面（`seedPatch` / `metaOf` /
 * 文本面 `textOf` / `toolBlock`）自归约核心档**纯搬移**，结构拆分零语义）。
 * **留档批 · #719（本批增；三端消化面统一批 · #747 收正；**本批 2026-10-01 · #765 对账面收正**；自然形收正批 · 2026-10-01 ·
 * 台账 #768 收正；**消化重放口径批 · 2026-10-01 · 台账 #771 ∥ #773 收正——复列全量（未结轮照现）+ 位次门 + 归属过滤**）**：
 * 记录折叠 —— 页回执（核 `historyWindow` opt-in 直通）逐条携留档记录
 * （`digest` ∥ `subagent` 两族；形 / 在场 / 判据单源 = `docs/desktop/design/RENDERER.md` §1.1「留档记录」条）：
 *  ① `digest` 记录 ⇒ **复列全量（未结轮照现）**（归约体**直复用** `renderer/events-wake.mjs` `onDigest` —— 记录形 = 事件形；
 *     可证面 = 轮间 ∥ 末页（扫描结束仍 `open`）；起跑未载的 `cap` ∥ `end` 零产 —— 容差①）；携**位次** `at` = 起跑记录
 *     全局 `idx`（痕面按记录位次复列 —— 恢复序 ≡ 记录序；**`at` 不可得 ⇒ 该轮零产**——位次门 · #773）；并入 = **折叠轮 + 现轮集**
 *     （并序 = 折叠轮居前 ∥ 现轮集随后；双份面消解 = **结构性**——未结轮归属（活流侧优先）∥ 零跨侧去重键）；
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
import { endBackfill, setProviderState, withFlowOp } from "./store.mjs"
// 排队镜面（「回合中插入」批 —— `history:page` 回执 `queue` 键 = 冷启 ∕ 重载重建面；写者两处同源）。
import { applyQueue } from "./queue.mjs"
// 消化轮集清点（运行期痕**五清**之四 —— 判据单源 = 消化行族档 `renderer/views/chat-digest-rows.mjs`）。
import { clearDigest } from "./views/chat-digest-rows.mjs"
// 消化记录折叠（留档批 · #719 —— 归约体**直复用**：记录形 = 事件形，单一实现零副本）。
import { onDigest } from "./events-wake.mjs"
// 频道键解析（#794 残项批 —— 归一 helper 派生 label/role/id，单源 = 核判据族）。
import { parseChannel } from "/rc/subblocks/channel.mjs"

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

/** 留档记录 meta 归一（本档私有 · #794 残项批）：他端（CLI ∥ VSC）记录 ⇒ 桌面模型面形 —— `key` 非空且无
 *  `sub:` 前缀 ⇒ 补前缀 ∥ `label`/`role`/`id` 由 `parseChannel` 派生（核件头文 ∥ `dataset.subid` 门）∥
 *  `frozen` 恒真（记录 = 归档快照）∥ `status` 词面归一（停止面 ⇒ `cancelled` ∥ 错误面 ⇒ `error` ∥
 *  done 面 ⇒ `done`——词面判据单源 = `docs/core/design/SESSION.md` §6.26）∥ 两时间戳互填；其余键
 *  （`pool`/`queued`/`note`/未知）原样透传（记录 ∥ 存储零写 —— 产物 = 读面新 meta 对象）。 */
function normSubagentMeta(meta) {
  const src = meta ?? {}
  const rawKey = String(src.key ?? "")
  const key = rawKey !== "" && !rawKey.startsWith("sub:") ? `sub:${rawKey}` : rawKey
  const ch = parseChannel(key)
  const doneAt = Number.isFinite(src.doneAt) ? src.doneAt : null
  const startedAt = Number.isFinite(src.startedAt) ? src.startedAt : (doneAt ?? 0)
  const status = src.status === "stopped" || src.status === "cancelled" || src.status === "terminated" ? "cancelled"
    : src.status === "error" || src.status === "failed" ? "error" : "done"
  return { ...src, key, label: ch.label, role: ch.role ?? src.role ?? null, id: ch.id, frozen: true, status, startedAt, doneAt: doneAt ?? startedAt }
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
    const src = msg.meta !== null && typeof msg.meta === "object" ? msg.meta : {}
    const meta = normSubagentMeta(src) // 读面归一（#794——他端记录 ⇒ 活流归档同形：label/id/frozen 缺位补形）
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

/** 消化记录折叠（留档批 · #719；自然形收正批 · 2026-10-01；**消化重放口径批 · 2026-10-01 · 台账 #771 ∥ #773——复列全量（未结轮照现）**）：
 *  记录逐条直复用 `onDigest`（累积语义 ⇒ 草稿逐轮在档 —— 单一实现零副本）；产出 = **全量轮**：已结轮出终态投影，
 *  **未结轮照现**（起跑 ∥ 计数 ∥ `cap` 记录照出 —— 不产终态）。未结判定面 = **可证**两条：
 *   ① **轮间**——后轮起跑已现 ⇒ 前轮未结（轮序单链：`end` 若在必在其间）；② **末页**（`tail`）——**扫描结束仍 `open`**
 *  （跨非 digest 记录存续；`end` 若在必在页内）。**非末页尾残起跑 ⇒ 零产**（可能为他页完整轮之半 —— 不可证；容差①）。
 *  **位次门**（#773）：`at` = 该轮起跑记录全局 `idx`（起跑行须居内容之上）；**`at` 不可得 ⇒ 该轮零产**（fail-closed——
 *  折叠面无 `at = null` 轮）；`cap` ∥ `end` 记录就轮更新，位置仍归起跑记录。
 *  **跨页截断**（起跑 ∥ 终态分居两页）⇒ 该轮本页**零产**（`open` 闸：起跑未载的 `cap` ∥ `end` 不入折 —— 防并轮错位）。
 *  **本批 2026-10-01 · #765**：折出轮 = 记录投影（位置面标随拆净——归档块 = 普通块，记录位次原位出）。 */
function foldDigest(messages, key, tail) {
  let scratch = { digest: {} }
  let at = null // 本轮起跑记录位次（`start` 记录点——非有限数 ⇒ 本轮零产）
  let open = false // 本页「本轮 start 已见 ∧ 未终态」——截断记录（起跑居前页）不入折
  const rounds = []
  /** 折出轮投影（去运行期标 —— 单一实现零副本的出口面；位次门 = `at` 不可得 ⇒ 零产）。 */
  const flush = () => {
    const slice = scratch.digest[key]
    const round = Array.isArray(slice) ? slice[slice.length - 1] : undefined
    if (round === undefined || at === null) return
    rounds.push({
      status: round.status, n: round.n, tier: round.tier, from: round.from, msg: round.msg,
      ok: round.ok, ms: round.ms, ...(round.cap == null ? {} : { cap: round.cap }), at,
    })
  }
  for (const msg of messages) {
    if (msg?.kind !== "digest") continue
    const idx = typeof msg.idx === "number" && Number.isFinite(msg.idx) ? msg.idx : null
    if (msg.status === "start") {
      if (open) flush() // 轮间可证：后轮起跑已现 ⇒ 前轮未结（照出——不产终态）
      at = idx
      open = true
    } else if (!open) {
      continue // 跨页截断：起跑未载 ⇒ 该轮本页零产（零并轮零借位）
    }
    scratch = onDigest(scratch, { ...msg, key })
    const slice = scratch.digest[key]
    const round = Array.isArray(slice) ? slice[slice.length - 1] : undefined
    if (round?.status === "end") {
      flush()
      open = false
    }
  }
  if (open && tail) flush() // 末页可证：扫描结束仍 `open` ⇒ 该轮照现（尾残轮——`end` 若在必在页内）
  return rounds
}

/** 轮集并入（**折叠轮 + 现轮集** —— 自然形收正批 · 2026-10-01；**消化重放口径批 · 2026-10-01——未结轮归属（活流侧优先）**）：
 *  并序 = 折叠轮居前 ∥ 现轮集随后（复列 ∕ 首屏按记录位次；折叠轮携 `at` ∥ 现轮集零位置面保持）；双份消解 = **结构性** ——
 *  首屏径 `clearDigest` 终态轮整清先行 + **未结轮归属过滤**：运行期未结轮在场（清点后本键非空）⇒ 折叠**未结轮不并入**
 *  （唯一副本 = 运行期轮 —— 其帧更新存续：`cap` ∥ `end` 恒得末轮）∥ 运行期未结轮缺（含重开径）⇒ 折叠未结轮照并入（照现）。
 *  **同轮 ∥ 异轮不可判**（零跨侧去重键）——所失面 = 异轮 + 活轮记录未及投影窗（旧未结轮暂不并入，随后续落盘投影 · 下次首屏复现）；
 *  回填径 = 旧段并入（与活段零叠）——**零跨侧去重键**；无新 ⇒ **原引用**（零写）。 */
function withFoldedDigest(table, key, folded) {
  if (folded.length === 0) return table
  const current = Array.isArray(table?.[key]) ? table[key] : []
  const live = current[current.length - 1]
  const kept = live !== undefined && live.status !== "end" ? folded.filter((round) => round.status === "end") : folded
  if (kept.length === 0) return table
  return { ...(table ?? {}), [key]: [...kept, ...current] }
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

/** `/help` 行族清点（`/help` 增量 · 2026-10-01② —— 单源 = 本档）：首屏页读（`before == null`）⇒ 摘本键行族
 *  （运行期痕 —— **非落盘件**：重开 / 切回页读即失，同 `[data-timer]` 族；**本族清点 = 两门**——首屏门 + 回合起跑门
 *  （`msg:send` 出站即清——`clearTurnTraces`，单源 = `docs/desktop/design/RENDERER.md` §1.6 KD-74）；无行 ⇒ 原引用（零写）。 */
function clearHelpLines(table, key) {
  if (table === null || typeof table !== "object" || table[key] === undefined) return table
  const next = { ...table }
  delete next[key]
  return next
}

/** 页回执应用（`docs/desktop/design/IPC.md` §2 `history:page` 定形）：`{ ok, messages, hasOlder, next, meta, flags, queue, seed? }`。
 *  `ok !== true` ⇒ **清在途**（成败皆清 —— finally 语义）且不写其余切片；
 *  `flags` 与 `meta` **同一写点**（`applyFlags` —— 状态栏对齐批；每次页读皆携 ⇒ 回填径同写）；
 *  **provider 态**（#841）⇒ 顶层 `providerState` 切片写（每次页读皆携；键缺席 ⇒ 零写 —— 「provider 态投影注」）；
 *  `key !== activeSession` ⇒ 跳块 / 历史写（`sessionMeta[key]` / `sessionFlags[key]` 仍写）；
 *  首屏（`before == null`）⇒ 块整置 + 回底（`following = true` / `pendingNew = 0`；空页同径）+ **运行期痕五清**
 *  （停止痕 `stopMark` ∕ 到期触发痕 `timerNotice` ∕ 压缩行 `compress`（R4）∕ 消化轮集 `digest`（终态轮整清——未结末轮保；
 *  归属过滤住并入点 `withFoldedDigest`）∕
 *  `/help` 行族 `helpLines`（`/help` 增量）—— 同首屏门）
 *  + **留档记录折叠**（`digest` 记录 ⇒ **复列全量**采入 —— 未结轮照现（末页 = `before == null`）∥ 并入 = **未结轮归属过滤**
 *  （活流侧优先）；留档批 · #719 ∥ 2026-10-01 收正 ∥ 消化重放口径批 · 2026-10-01） + **打开态播种**
 *  （`seed` ⇒ `tasks[key]` / `usage[key]` 同笔 —— 判据住 `seedPatch`）+ **排队镜面重建**
 *  （`queue` 键 ⇒ `applyQueue` —— 「回合中插入」批 · KD-40 ④；仅首屏读）；
 *  两径各带**结构作业**（流面作业单 —— 单源 = `docs/desktop/design/RENDERER.md` §1.1）：首屏 ∥ **回填**（回填落位批 ·
 *  2026-10-04）⇒ `build`（整置 —— 删档 + 新写：记录序重放；账作废，帧出口走构造径）；同笔：作业与 `blocks` 写不可拆（写口 = `withFlowOp`）。
 *  回填 ⇒ 并入 + `history` 落态（`hasOlder === false ⇒ next = null`；视口锚定 = 帧出口补偿——非跟滚 ∧ 高度净增 ΔH ≠ 0 才读 ∥ 才写）+
 *  **折叠并入**（回填页记录 ⇒ 折叠**复列全量**（未结轮照现 + 未结轮归属过滤）——并序 = 折叠轮居前 ∥ 现轮集随后；双份消解 = 结构性；留档批 · #719 ∥ 2026-10-01 收正 ∥ 消化重放口径批 · 2026-10-01）。 */
export function applyPage(state, receipt, { key, before } = {}) {
  if (receipt?.ok !== true) return endBackfill(state)
  // provider 态投影落切片（#841 —— 「provider 态投影注」：与 `meta` ∥ `flags` 同写点家族；键缺席 ∥ 形不合 ⇒ 零写）
  const flagged = setProviderState(applyFlags(state, key, receipt.flags), receipt.providerState)
  const meta = metaOf(receipt.meta)
  const sessionMeta = { ...(flagged.sessionMeta ?? {}), [key]: meta }
  if (key !== flagged.activeSession) return { ...flagged, sessionMeta }
  const hasOlder = receipt.hasOlder === true
  const next = hasOlder ? (receipt.next ?? null) : null
  const history = { hasOlder, inFlight: false, page: next }
  const messages = Array.isArray(receipt.messages) ? receipt.messages : []
  const folded = foldDigest(messages, key, before == null) // 留档记录折叠（复列全量——未结轮照现：末页判据 = 本页为首屏 · 携位次）
  const page = messages.flatMap((msg) => blockOfMessage(msg)) // 块序 = 记录序（普通块原位 —— 零配对；本批 #765）
  if (before == null) {
    const stopMark = clearStopMark(flagged.stopMark, key)
    const timerNotice = clearTimerNotice(flagged.timerNotice, key)
    const compress = clearCompress(flagged.compress, key)
    const helpLines = clearHelpLines(flagged.helpLines, key)
    const digest = withFoldedDigest(clearDigest(flagged.digest, key), key, folded)
    const first = {
      ...flagged, ...(stopMark === flagged.stopMark ? {} : { stopMark }), ...(timerNotice === flagged.timerNotice ? {} : { timerNotice }),
      ...(compress === flagged.compress ? {} : { compress }), ...(digest === flagged.digest ? {} : { digest }), ...(helpLines === flagged.helpLines ? {} : { helpLines }),
      ...seedPatch(flagged, key, receipt.seed), blocks: page, sessionMeta, history, following: true, pendingNew: 0,
    }
    // 排队镜面重建（仅首屏读 —— 回填读不重建：防在途快照覆盖活镜面）；键缺 / 非数组 ⇒ `applyQueue` 拒收（零写）。
    // 结构作业（流面作业单）：`build` —— 整置（首屏；随构造径承接）。
    return applyQueue(withFlowOp(first, { kind: "build" }), key, receipt.queue)
  }
  const digest = withFoldedDigest(flagged.digest, key, folded) // 并入零算术（未结轮归属过滤住本件；行族随整置按记录序复列——回填落位批）
  // 结构作业（流面作业单）：`build` —— 回填并入（整置：删档 + 新写——记录序重放；帧出口走构造径）。
  return withFlowOp(
    { ...flagged, blocks: [...page, ...(flagged.blocks ?? [])], sessionMeta, history, ...(digest === flagged.digest ? {} : { digest }) },
    { kind: "build" },
  )
}
