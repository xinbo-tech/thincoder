/**
 * subagent-reduce.mjs — **子 agent 归约径**（「对齐第二批」**拆分产出**：`renderer/events.mjs` 行预算 ⇒
 * 在册续拆预案本批执行 —— 子 agent 面（`ev:subagent` 状态 / `ev:subchunk` 内容）与池读数两助手自归约
 * 核心档**纯搬移**，结构拆分零语义）。
 * 依赖单向：本档 → `renderer/store.mjs`（`appendBlock` —— 流内尾追）/ → 核 `/rc/subblocks/state.mjs`
 * （态机单源）；**不引** `renderer/events.mjs`（无环 —— 归约核心档反向引本档两支）。
 * 消费面：`renderer/events.mjs` `reduce` 分派（两通道两支）+ 池读数两助手（`poolOf` / `liveCount` ——
 * 归约面折叠头 / 开页 / 待决两族同引，单一实现零副本）。
 * 纪律：纯函数（零 DOM / 零 `node:` / 零裸包 —— 渲染面静态闭包判据）；**归约体例外一件（留档批 · #719）**：
 * 归档派生点 `record:append` 出站 —— 窄桥**惰性读面**（`globalThis.thincoder`，缺位 / 非函数 ⇒ 零动作零抛），
 * 平 node 直测不受影响。
 * 形态 / 判据单源 = `docs/desktop/design/UI.md` §1「本批注（对齐第二批 · 六件）」项 3 / 5 ·
 * `docs/desktop/design/RENDERER.md` §1.1。
 * **归档入流（项 5 · KD-33）**：终态 ⇒ ① 表项墓碑（`region: "flow"` —— 池内退场）② 流内尾追块
 * （`kind: "subagent"` —— **留档块**，页读域第六型）③ 表项 `rows` 随归档交快照（内容单留存处）；原
 * 「下回合起清出」（`archiveFrozen`）口径**退场**；核 effects 表**不逐条执行**（端面动作由模型态幂等派生 ——
 * 改造据 = 端差登记 `docs/desktop/design/PROJECT.md` §10 AZ）。
 * **留档批 · #719（本批增）**：① 归档派生点增 `record:append` 出站（快照 ⇒ 人读线记录经请求通道落宿主 ——
 * **含非活动键**，一并取宽）；② 快照 `rows` 保尾上界（`RECORD_ROWS_MAX_LINES` —— 沿核件尾环既有一致口径）。
 * **R5（子代理面 · #521 ∕ #522 —— 三面）**：① `resetSubBlocks`（`resetActivity` 语义接 —— 会话中止 ∕ 清屏 ⇒
 *  本键表复位 + 池面随动；两触发住 `renderer/events.mjs`）② `freezeAllSubBlocks`（退出兜底 —— 核
 *  `subBlocksFreezeAll` 直取；触发 = `ev:susp {active:false}` 出窗帧）③ `onSubchunk` 出生闸 = 核
 *  `ensureSubBlock` 直取（原「无块 ⇒ 零写」形差收正 —— 「内容先到」可达，与核同律）；注记载荷（X6）经
 *  `note` 键随 `ev:subagent` 入块模型（`SUB_KEYS` 增键 —— 渲染 = 核件直出）。
 */
import { ensureSubBlock, subBlocksFreezeAll, subBlocksReduce } from "/rc/subblocks/state.mjs"
import { appendBlock } from "./store.mjs"

/** 子 agent 状态闭集（**单源** = `docs/render-core/design/RENDER-CORE.md` §5 token → patch 全表：核 relay 谱
 *  `started` / `queued` / `turn` / `done` / `settled` / `cancelled` —— `⟦ev⟧stopped` ⇒ `cancelled` 先例兼容 ·
 *  `error` 有意不载）；**`approval` = R10 补入**（child permission gate —— 非 relay 谱来路：宿主
 *  `src/main/agent-bridge.mjs:261-265` `onSubagentApproval` ⇒ `ev:subagent { status: "approval", tool }`；
 *  核态机支 = `subblocks/state.mjs:190-201`；VSC 对位 = `activity.js:133-136` `applySubagentApproval` ——
 *  白名单漏收则该态桌面永不可见（⏸ ∕ `sub.awaitingApproval` 死面）；表外码 ⇒ **零写**（禁假造 —— 沿池面「表外码零节点」纪律）。 */
const SUB_STATUS = ["started", "queued", "turn", "done", "settled", "cancelled", "approval"]
/** `ev:subagent` 载荷键白名单（核 patch 全表字段集：身份三 + 随行九 + 审批面 `tool`〔R10 补〕+ **注记
 *  `note`〔R5 增 —— X6 注记载荷；核态机活态载体 `meta.note` 单源，块头 `— <note>` 渲染 = 核件
 *  `subblocks/activity-view.mjs` 直出〕）。 */
const SUB_KEYS = [
  "status", "role", "id", "model", "pool", "syncLive", "startedAt", "turn", "maxTurns",
  "kind", "position", "waiting", "reason", "was", "tool", "note",
]
/** `ev:subchunk` 载荷键白名单（零新键 —— 内容面六；身份二 `role` / `id` = 块定位，不入行模型 ——
 *  形单源 = `docs/desktop/design/IPC.md` §1 该行）。 */
const SUBCHUNK_KEYS = ["kind", "text", "sub", "tool", "face", "cmd"]

/** 池切片（缺省槽位 —— 防御读；不造键）。**共用件**：归约核心档（`withPool` / `openSession` / 待决两族）同引。 */
export function poolOf(state) {
  return state.pool ?? { running: 0, approval: 0, queue: [], approvals: [] }
}

/** 在飞块数（折叠头 `running` 读数源 —— 已终态折叠块 / 墓碑不计；非数组 ⇒ 0）。**共用件**：归约核心档
 *  `openSession` 同引。 */
export function liveCount(list) {
  return (Array.isArray(list) ? list : []).filter((block) => block?.frozen !== true).length
}

/** `ev:subagent` 载荷 → 核态机 patch（键白名单投影）；状态表外 / 身份缺 ⇒ `null` = **零写**（禁假造）。 */
function subPatchOf(ev) {
  if (typeof ev?.status !== "string" || !SUB_STATUS.includes(ev.status)) return null
  if (ev.role == null || ev.id == null) return null
  const patch = {}
  for (const field of SUB_KEYS) if (ev[field] !== undefined) patch[field] = ev[field]
  return patch
}

/** `ev:subchunk` 载荷 → 内容行（键白名单投影）；`kind` / `text` 形不合 / 身份缺 ⇒ `null` = **零写**（禁假造）。 */
function subchunkOf(ev) {
  if (ev.role == null || ev.id == null) return null
  const row = {}
  for (const field of SUBCHUNK_KEYS) if (ev[field] !== undefined) row[field] = ev[field]
  if (typeof row.kind !== "string" || row.kind === "" || typeof row.text !== "string") return null
  return row
}

/** 子 agent 面随动尾（subBlocks 写者共用）：块表 + 折叠头 `running` 读数（**活动会话**在飞块数 ——
 *  键非活动 ⇒ 读数不动；读数同值 ⇒ 池引用不动；墓碑块 `frozen` 不计入）。 */
function withSubBlocks(state, table, key) {
  const next = { ...state, subBlocks: table }
  if (key !== state.activeSession) return next
  const running = liveCount(table[key])
  const pool = poolOf(state)
  return pool.running === running ? next : { ...next, pool: { ...pool, running } }
}

/** 记录行集上界（留档批 · #719 —— 沿核件尾环既有一致口径：CLI N2 500 显示行 ∕ 子，
 *  `thincoder-cli/src/tui/subagent-children.mjs:26` `SUB_BLOCK_LINE_LIMIT`；超界 ⇒ 保尾截断 + 省略标记行，
 *  **明示** —— 行数真值不静默（N6 同义））。 */
export const RECORD_ROWS_MAX_LINES = 500

/** 省略标记行（行数真值 —— CLI 省略计数同义；数据面非用户文案 —— 字面沿 CLI 先例 `thincoder-cli/src/distill.mjs:114`
 *  `...[... omitted ...]...`：核 ∕ 宿主词表无此键，故不走 `t()`）。 */
const rowsTruncMarker = (lines) => `… [rows truncated: ${lines} lines omitted]`

/** 行显示行数（核 `countBlockLines` 同式：按 `\n` 切分、文末换行不计）。 */
function rowLines(row) {
  const lines = String(row?.text ?? "").split("\n")
  return lines[lines.length - 1] === "" ? lines.length - 1 : lines.length
}

/** 快照 `rows` 保尾上界（归档派生点单点 —— 活流块 ∥ 记录两消费者同源）：自尾向前累计显示行 ≤ 上界；
 *  弃最旧行 ⇒ 前置省略标记行（标记自身不占额度 —— 沿 N6）；单行超界 ⇒ 行 = 最小单元（不可切行中）——保尾即保末行；
 *  未超 ⇒ **原引用**（零写）。 */
export function boundedRows(rows) {
  const list = Array.isArray(rows) ? rows : []
  let total = 0
  let start = list.length
  for (let index = list.length - 1; index >= 0; index -= 1) {
    total += rowLines(list[index])
    if (total > RECORD_ROWS_MAX_LINES) break
    start = index
  }
  if (start === list.length && list.length > 0) start = list.length - 1 // 单行超界：保末行（保尾）
  if (start === 0) return list
  let dropped = 0
  for (let index = 0; index < start; index += 1) dropped += rowLines(list[index])
  return [{ kind: "text", text: rowsTruncMarker(dropped) }, ...list.slice(start)]
}

/** 归档记录出站（留档批 · #719 —— 归档派生点：每枚快照 ⇒ 人读线记录（`{ kind, meta, rows }`，与流内归档块
 *  **同一对象同形**）经 `record:append` 请求通道落宿主（`pushReal` 同面 —— `ts` 打点住宿主）；
 *  **含非活动键**（一并取宽 —— 消「非活动键内容即失」端差；键门只限流内块追加面）；窄桥**惰性读面**
 *  （缺位 / 非函数 ⇒ 零动作零抛）；失败 ⇒ `console.error`（不静默）。 */
function emitRecords(key, blocks) {
  if (typeof key !== "string" || key === "" || blocks.length === 0) return
  const bridge = globalThis.thincoder
  if (bridge === null || typeof bridge !== "object" || typeof bridge.invoke !== "function") return
  for (const block of blocks) {
    try {
      void Promise.resolve(bridge.invoke("record:append", { key, record: block })).catch((error) => {
        console.error("[subagent] record:append failed:", error)
      })
    } catch (error) {
      console.error("[subagent] record:append failed:", error)
    }
  }
}

/** 归档入流派生（「对齐第二批」项 5 · KD-33 —— 端面动作由模型态幂等派生，核 effects 表不逐条执行）：
 *  归档态判据 = **已折叠（`frozen`）∧ 非驻留（`!awaitingDigest`）∧ 未入流（`region !== "flow"`）**；
 *  `settled`（驻留待消化）不归档，后到 `done` 折叠时归档（前态判据同径）；**旧代接管归档**（旧块被替出列表，
 *  核 `takeoverBlock` ⇒ `archive` 效果）由**前后对照**捕获（前态块缺席后表 ∧ 已折叠 ∧ 未入流 ⇒ 归档）。
 *  **每笔皆换块对象引用（R10 E4 补——视图面帧触发判据的块级同源）**：核态机**原地变更**模型块（`freezeMeta` ∕
 *  `block.approval = …` 等）⇒ 块对象引用不变 ⇒ 视图面 `updateSubBlock` 的同一性短路（`known === entry`）恒真
 *  ⇒ 终态折叠 ∕ `awaitingDigest` 态词 ∕ 审批态永不落 DOM（仅靠 2 s 拍残刷）。本处按核 `effects` 的**键集**
 *  对**被触碰块**换新对象（未触碰块保持原引用——零多余重刷；VSC 同义 = 每条状态消息覆盖式刷新被触及块）。
 *  返回 `{ list, blocks }`：`list` = 表项（归档者换**墓碑** = 复本 + `region: "flow"` − `rows`）；
 *  `blocks` = 流内尾追快照（`{ kind: "subagent", meta, rows }` —— `meta` 供核件 `renderSubBlock` /
 *  `refreshBlock`，`rows` = 内容行单留存处）。 */
function archiveIntoFlow(before, after, touched) {
  const alive = new Set(after)
  const snapshots = []
  for (const block of before) {
    if (alive.has(block) || block?.frozen !== true || block.region === "flow") continue
    snapshots.push(block) // 旧代接管：驻留块替出 ⇒ 归档（核 archive 效果同序 —— 先归档后改绑）
  }
  const list = after.map((raw) => {
    const block = touched.has(raw?.key) === true ? { ...raw } : raw // 触碰块换新引用（见上注）
    if (block?.frozen !== true || block.awaitingDigest === true || block.region === "flow") return block
    snapshots.push(block)
    const { rows, ...meta } = block
    return { ...meta, region: "flow" } // 墓碑：池内退场（读面按 `region` 过滤）——迟来事件按 `drop-frozen` 消化
  })
  const blocks = snapshots.map((block) => {
    const { rows, ...meta } = block
    return { kind: "subagent", meta, rows: boundedRows(rows) }
  })
  return { list, blocks }
}

/** `ev:subagent` —— 子 agent 块面（D20 单源 = `docs/desktop/design/UI.md` §1 本批注项 2 / 3 / 5）：按会话键写 `subBlocks`
 *  切片；态机**单源** = 核 `/rc/subblocks/state.mjs` `subBlocksReduce`（出生 / 接管 / 终态折叠 / **审批态**四迁 ——
 *  桌面端零 DOM：不注入 `connectedOf` / `regionOf`，本端全量重建）；**归档入流**（终态 ⇒ 墓碑 + 流内尾追块 ——
 *  仅活动会话有流面可入；非活动键只落墓碑，内容随运行期面即失 = 端差登记）；块模型**原地变更**（核态机形）⇒
 *  每笔皆换切片数组引用**＋（R10）被触碰块换块对象引用**（帧触发唯一判据 —— 同值短路在此不成立，随本件登记）；
 *  触碰集 = 核 `effects` 键集（`refresh` / `fold` / `awaiting` / `archive` 逐迁在册）。 */
export function onSubagent(state, ev, now) {
  const key = typeof ev.key === "string" && ev.key !== "" ? ev.key : null
  const patch = key === null ? null : subPatchOf(ev)
  if (patch === null) return state
  const table = state.subBlocks ?? {}
  const before = Array.isArray(table[key]) ? table[key] : []
  const list = [...before]
  // 核态机 deps：`now` 为**读钟函数**（`state.mjs` 每迁现刻取值 —— 出生起刻 / 冻结 `doneAt`）。
  const { effects } = subBlocksReduce(list, patch, { now: () => now })
  const archived = archiveIntoFlow(before, list, new Set(effects.map((effect) => effect?.key)))
  emitRecords(key, archived.blocks) // 归档记录出站（含非活动键 —— 先于流内键门；留档批 · #719）
  const next = withSubBlocks(state, { ...table, [key]: archived.list }, key)
  if (archived.blocks.length === 0 || key !== state.activeSession) return next
  return archived.blocks.reduce((acc, block) => appendBlock(acc, block), next)
}

/** `ev:subchunk` —— 子 agent 内容增量入块模型 `rows`（**重挂重放单源** —— 视图面按 `rows` 逐条重放核件
 *  `renderSubagentChunk`；「对齐第二批」项 3）：按会话键定位块（键 = `sub:role#id` —— 与核态机出生面同形）。
 *  **出生闸 = 核 `ensureSubBlock` 直取**（R5 · #522③ 形差收正 —— 本端零第二份判据）：无块 ⇒ **建块**
 *  （「内容先到」可达 —— 与核同律：核闸的独有出生路径）；已终态（`frozen`）/ 墓碑（`region:"flow"`
 *  —— 冻结即墓碑的在册派生）⇒ **零写**（迟来 chunk 不复活 —— 幂等守卫）；live ⇒ 复用（不重挂 / 不刷新）。
 *  **调用序**：核闸先于行写（建块 ⇒ 行入 `rows`）；建块经 `withSubBlocks` 落表（活动键 ⇒ 折叠头 `running`
 *  读数随动）。 */
export function onSubchunk(state, ev, now = Date.now()) {
  const key = typeof ev.key === "string" && ev.key !== "" ? ev.key : null
  const row = key === null ? null : subchunkOf(ev)
  if (row === null) return state
  const table = state.subBlocks ?? {}
  const list = [...(Array.isArray(table[key]) ? table[key] : [])]
  const target = `sub:${ev.role}#${ev.id}`
  const { block } = ensureSubBlock(list, target, { now: () => now })
  if (block === null) return state // 已终态 ∕ 墓碑 ⇒ 丢弃（迟来 chunk 不半复活）
  const rows = [...(Array.isArray(block.rows) ? block.rows : []), row]
  const index = list.indexOf(block)
  const next = [...list.slice(0, index), { ...block, rows }, ...list.slice(index + 1)]
  return withSubBlocks(state, { ...table, [key]: next }, key)
}

/** `resetActivity` 语义接（R5 · #522① —— VSC `webview/activity.js:180-189` 同义）：**键级复位** ——
 *  会话中止（回合尾 `stopped` ∧ 本键非挂起 —— 池子随回合死）/ 清屏（`openSession` 键变）⇒ 该键切片整删
 *  （live + 驻留 + 墓碑全清；流内归档块 = 会话历史不动）＋活动键 ⇒ 折叠头 `running` 读数归 0（**池面 +
 *  表复位**）。他键零扰（切片级动作）；该键本就不在场 ⇒ **原引用**（幂等）。复位只清**存量** —— 迟来事件按核
 *  出生闸**重新出生**（与 VSC 清 map 同义；幂等守卫只挡冻结 ∕ 墓碑键）；活块由 2s 存活投影自愈重投。 */
export function resetSubBlocks(state, key) {
  const table = state.subBlocks ?? {}
  if (typeof key !== "string" || key === "" || !Object.hasOwn(table, key)) return state
  const next = { ...table }
  delete next[key]
  return withSubBlocks(state, next, key)
}

/** `subBlocksFreezeAll`（R5 · #522② —— **退出兜底**；VSC `webview/activity.js:141-144` 同义）：挂起窗
 *  退出帧（`ev:susp {active:false}`）⇒ 本键**全体归档** —— live ⇒ 折叠（核 `freezeMeta`；`interrupted`
 *  注记只随载荷真值落 —— 出窗帧今携该键（`suspension-drive.mjs` `postSuspEnd` 端帧 · #554①），
 *  键缺 ∕ 假 ⇒ 恒零注记，不假造）· 驻留（`awaitingDigest`）⇒ 清驻留 +
 *  归档 · 已墓碑（`region:"flow"`）⇒ 不动（`regionOf` 注入 = 桌面区判据：**墓碑外皆「在区」**）。归档入流
 *  单源 = 核效果表 + 本档 `archiveIntoFlow` 派生（与 `onSubagent` 同径 —— 单一实现零副本）。 */
export function freezeAllSubBlocks(state, ev, now = Date.now()) {
  const key = typeof ev?.key === "string" && ev.key !== "" ? ev.key : null
  const table = state.subBlocks ?? {}
  const before = key === null ? null : table[key]
  if (!Array.isArray(before) || before.length === 0) return state
  const list = [...before]
  const { effects } = subBlocksFreezeAll(list, {
    now: () => now,
    regionOf: (block) => (block?.region === "flow" ? "flow" : "activity"),
    interrupted: ev.interrupted === true,
  })
  const archived = archiveIntoFlow(before, list, new Set(effects.map((effect) => effect?.key)))
  emitRecords(key, archived.blocks) // 归档记录出站（含非活动键 —— 先于流内键门；留档批 · #719）
  const next = withSubBlocks(state, { ...table, [key]: archived.list }, key)
  if (archived.blocks.length === 0 || key !== state.activeSession) return next
  return archived.blocks.reduce((acc, block) => appendBlock(acc, block), next)
}
