/**
 * subagent-reduce.mjs — **子 agent 归约径**（「对齐第二批」**拆分产出**：`renderer/events.mjs` 行预算 ⇒
 * 在册续拆预案本批执行 —— 子 agent 面（`ev:subagent` 状态 / `ev:subchunk` 内容）与池读数两助手自归约
 * 核心档**纯搬移**，结构拆分零语义）。
 * 依赖单向：本档 → `renderer/store.mjs`（`appendBlock` —— 流内尾追）/ → 核 `/rc/subblocks/state.mjs`
 * （态机单源）；**不引** `renderer/events.mjs`（无环 —— 归约核心档反向引本档两支）。
 * 消费面：`renderer/events.mjs` `reduce` 分派（两通道两支）+ 池读数两助手（`poolOf` / `liveCount` ——
 * 归约面折叠头 / 开页 / 待决两族同引，单一实现零副本）。
 * 纪律：纯函数（零 DOM / 零 IPC / 零 `node:` / 零裸包 —— 渲染面静态闭包判据）。
 * 形态 / 判据单源 = `docs/desktop/design/UI.md` §1「本批注（对齐第二批 · 六件）」项 3 / 5 ·
 * `docs/desktop/design/RENDERER.md` §1.1。
 * **归档入流（项 5 · KD-33）**：终态 ⇒ ① 表项墓碑（`region: "flow"` —— 池内退场）② 流内尾追块
 * （`kind: "subagent"` —— 运行期块，页读整置即失）③ 表项 `rows` 随归档交快照（内容单留存处）；原
 * 「下回合起清出」（`archiveFrozen`）口径**退场**；核 effects 表**不逐条执行**（端面动作由模型态幂等派生 ——
 * 改造据 = 端差登记 `docs/desktop/design/PROJECT.md` §10 AZ）。
 */
import { subBlocksReduce } from "/rc/subblocks/state.mjs"
import { appendBlock } from "./store.mjs"

/** 子 agent 状态闭集（**单源** = `docs/render-core/design/RENDER-CORE.md` §5 token → patch 全表：核 relay 谱
 *  `started` / `queued` / `turn` / `done` / `settled` / `cancelled` —— `⟦ev⟧stopped` ⇒ `cancelled` 先例兼容 ·
 *  `error` 有意不载）；表外码 ⇒ **零写**（禁假造 —— 沿池面「表外码零节点」纪律）。 */
const SUB_STATUS = ["started", "queued", "turn", "done", "settled", "cancelled"]
/** `ev:subagent` 载荷键白名单（零新键 —— 核 patch 全表字段集：身份三 + 随行九）。 */
const SUB_KEYS = [
  "status", "role", "id", "model", "pool", "syncLive", "startedAt", "turn", "maxTurns",
  "kind", "position", "waiting", "reason", "was",
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

/** 归档入流派生（「对齐第二批」项 5 · KD-33 —— 端面动作由模型态幂等派生，核 effects 表不逐条执行）：
 *  归档态判据 = **已折叠（`frozen`）∧ 非驻留（`!awaitingDigest`）∧ 未入流（`region !== "flow"`）**；
 *  `settled`（驻留待消化）不归档，后到 `done` 折叠时归档（前态判据同径）；**旧代接管归档**（旧块被替出列表，
 *  核 `takeoverBlock` ⇒ `archive` 效果）由**前后对照**捕获（前态块缺席后表 ∧ 已折叠 ∧ 未入流 ⇒ 归档）。
 *  返回 `{ list, blocks }`：`list` = 表项（归档者换**墓碑** = 复本 + `region: "flow"` − `rows`）；
 *  `blocks` = 流内尾追快照（`{ kind: "subagent", meta, rows }` —— `meta` 供核件 `renderSubBlock` /
 *  `refreshBlock`，`rows` = 内容行单留存处）。 */
function archiveIntoFlow(before, after) {
  const alive = new Set(after)
  const snapshots = []
  for (const block of before) {
    if (alive.has(block) || block?.frozen !== true || block.region === "flow") continue
    snapshots.push(block) // 旧代接管：驻留块替出 ⇒ 归档（核 archive 效果同序 —— 先归档后改绑）
  }
  const list = after.map((block) => {
    if (block?.frozen !== true || block.awaitingDigest === true || block.region === "flow") return block
    snapshots.push(block)
    const { rows, ...meta } = block
    return { ...meta, region: "flow" } // 墓碑：池内退场（读面按 `region` 过滤）——迟来事件按 `drop-frozen` 消化
  })
  const blocks = snapshots.map((block) => {
    const { rows, ...meta } = block
    return { kind: "subagent", meta, rows: Array.isArray(rows) ? rows : [] }
  })
  return { list, blocks }
}

/** `ev:subagent` —— 子 agent 块面（D20 单源 = `docs/desktop/design/UI.md` §1 本批注项 2 / 3 / 5）：按会话键写 `subBlocks`
 *  切片；态机**单源** = 核 `/rc/subblocks/state.mjs` `subBlocksReduce`（出生 / 接管 / 终态折叠三迁 —— 桌面端
 *  零 DOM：不注入 `connectedOf` / `regionOf`，本端全量重建）；**归档入流**（终态 ⇒ 墓碑 + 流内尾追块 ——
 *  仅活动会话有流面可入；非活动键只落墓碑，内容随运行期面即失 = 端差登记）；块模型**原地变更**（核态机形）⇒
 *  每笔皆换切片数组引用（帧触发唯一判据 —— 同值短路在此不成立，随本件登记）。 */
export function onSubagent(state, ev, now) {
  const key = typeof ev.key === "string" && ev.key !== "" ? ev.key : null
  const patch = key === null ? null : subPatchOf(ev)
  if (patch === null) return state
  const table = state.subBlocks ?? {}
  const before = Array.isArray(table[key]) ? table[key] : []
  const list = [...before]
  // 核态机 deps：`now` 为**读钟函数**（`state.mjs` 每迁现刻取值 —— 出生起刻 / 冻结 `doneAt`）。
  subBlocksReduce(list, patch, { now: () => now })
  const archived = archiveIntoFlow(before, list)
  const next = withSubBlocks(state, { ...table, [key]: archived.list }, key)
  if (archived.blocks.length === 0 || key !== state.activeSession) return next
  return archived.blocks.reduce((acc, block) => appendBlock(acc, block), next)
}

/** `ev:subchunk` —— 子 agent 内容增量入块模型 `rows`（**重挂重放单源** —— 视图面按 `rows` 逐条重放核件
 *  `renderSubagentChunk`；「对齐第二批」项 3）：按会话键定位块（键 = `sub:role#id` —— 与核态机出生面同形）；
 *  块不在场 / 已冻结（终态）⇒ **零写**（出生面 = `ev:subagent` 出生事件；迟来 chunk 不复活 —— 核
 *  `ensureSubBlock` 出生闸同律；桌面出生面单源 = 状态机）。 */
export function onSubchunk(state, ev) {
  const key = typeof ev.key === "string" && ev.key !== "" ? ev.key : null
  const row = key === null ? null : subchunkOf(ev)
  if (row === null) return state
  const table = state.subBlocks ?? {}
  const list = Array.isArray(table[key]) ? table[key] : null
  if (list === null) return state
  const target = `sub:${ev.role}#${ev.id}`
  const index = list.findIndex((block) => block?.key === target)
  if (index < 0 || list[index]?.frozen === true) return state
  const block = list[index]
  const rows = [...(Array.isArray(block.rows) ? block.rows : []), row]
  const next = [...list.slice(0, index), { ...block, rows }, ...list.slice(index + 1)]
  return withSubBlocks(state, { ...table, [key]: next }, key)
}
